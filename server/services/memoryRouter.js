// server/services/memoryRouter.js
// Memory Router — 关键词智能路由到记忆池，避免全量查询

const db = require('../database');
const { MEMORY_DOMAINS, ROUTER_KEYWORDS, getDomainByType } = require('../config/memoryTypes');

/**
 * 路由结果
 * @typedef {Object} RouterResult
 * @property {string[]} pools - 命中的记忆池（customer/sales/growth/ai）
 * @property {string[]} memoryTypes - 命中的具体记忆类型
 * @property {string} customerId - 检测到的客户ID（如有）
 * @property {string} industry - 检测到的行业（如有）
 * @property {boolean} isAmbiguous - 是否为模糊查询（多池命中）
 */

/**
 * 根据查询文本路由到对应的记忆池
 * @param {string} query - 用户/系统查询文本
 * @param {Object} options
 * @param {string} [options.customerId] - 已知客户ID（直接命中客户池）
 * @param {string[]} [options.tags] - 标签过滤
 * @returns {RouterResult}
 */
function route(query, options = {}) {
  const { customerId, tags = [] } = options;
  const result = {
    pools: [],
    memoryTypes: [],
    customerId: null,
    industry: null,
    isAmbiguous: false,
  };

  // ─── 1. 直接路由：如果提供了 customerId ────────────────
  if (customerId) {
    result.customerId = customerId;
    result.pools.push('customer', 'sales');
    result.memoryTypes = getTypesForPools(['customer', 'sales']);
    // 排除 archive_raw（原始归档不适合customer-specific查询）
    result.memoryTypes = result.memoryTypes.filter(t => t !== 'archive_raw');
    return result;
  }

  const q = (query || '').toLowerCase();

  // ─── 2. 客户名匹配 — 精确匹配客户名称 ─────────────────
  const customerMatch = matchCustomerName(q, customerId);
  if (customerMatch) {
    result.customerId = customerMatch.id;
    result.industry = customerMatch.industry;
    result.pools.push('customer', 'sales');
  }

  // ─── 3. 行业关键词匹配 ───────────────────────────────
  const industryKeywords = ROUTER_KEYWORDS.industry.filter(kw => q.includes(kw));
  if (industryKeywords.length > 0 || q.includes('行业')) {
    if (!result.pools.includes('customer')) result.pools.push('customer');
    if (!result.pools.includes('sales')) result.pools.push('sales');
    result.pools.push('growth'); // 市场情报也在成长域
  }

  // ─── 4. 客户域关键词 ─────────────────────────────────
  const customerKeywords = ROUTER_KEYWORDS.customer.filter(kw => q.includes(kw));
  if (customerKeywords.length > 0) {
    if (!result.pools.includes('customer')) result.pools.push('customer');
  }

  // ─── 5. 策略关键词 ───────────────────────────────────
  const strategyKeywords = ROUTER_KEYWORDS.strategy.filter(kw => q.includes(kw));
  if (strategyKeywords.length > 0) {
    if (!result.pools.includes('sales')) result.pools.push('sales');
    if (!result.pools.includes('growth')) result.pools.push('growth');
  }

  // ─── 6. 学习成长关键词 ──────────────────────────────
  const learningKeywords = ROUTER_KEYWORDS.learning.filter(kw => q.includes(kw));
  if (learningKeywords.length > 0) {
    if (!result.pools.includes('growth')) result.pools.push('growth');
  }

  // ─── 7. 市场关键词 ──────────────────────────────────
  const marketKeywords = ROUTER_KEYWORDS.market.filter(kw => q.includes(kw));
  if (marketKeywords.length > 0) {
    if (!result.pools.includes('growth')) result.pools.push('growth');
  }

  // ─── 8. 标签路由 ────────────────────────────────────
  if (tags.length > 0) {
    // 根据标签推断域（如 tag=汇川 → competitor → customer域）
    for (const tag of tags) {
      const taggedTypes = matchTypesByTag(tag);
      for (const t of taggedTypes) {
        if (!result.memoryTypes.includes(t)) result.memoryTypes.push(t);
      }
    }
  }

  // ─── 9. 兜底：至少命中客户域+销售域 ────────────────
  if (result.pools.length === 0) {
    result.pools = ['customer', 'sales'];
    result.isAmbiguous = true;
  }

  // ─── 10. 根据命中的池确定具体类型 ──────────────────
  const poolTypes = getTypesForPools(result.pools);

  // 合并手动路由和池路由的类型（去重）
  for (const t of poolTypes) {
    if (!result.memoryTypes.includes(t)) result.memoryTypes.push(t);
  }

  // 排除 archive_raw（除非明确查询原始数据）
  if (!q.includes('原始') && !q.includes('归档') && !q.includes('全部')) {
    result.memoryTypes = result.memoryTypes.filter(t => t !== 'archive_raw');
  }

  result.isAmbiguous = result.pools.length >= 3;

  return result;
}

/**
 * 客户名匹配：在客户表中搜索
 */
function matchCustomerName(query) {
  // 尝试精确匹配
  const customers = db.prepare(
    'SELECT id, name, industry FROM customers'
  ).all();

  for (const c of customers) {
    if (query.includes(c.name.toLowerCase())) {
      return c;
    }
    // 部分匹配（如 "音飞" 匹配 "南京音飞储存"）
    const shortName = c.name.replace(/南京|有限|公司|科技|集团|股份/g, '').toLowerCase();
    if (shortName.length >= 2 && query.includes(shortName)) {
      return c;
    }
  }
  return null;
}

/**
 * 根据记忆池获取对应的类型列表
 */
function getTypesForPools(pools) {
  const types = [];
  for (const pool of pools) {
    const domain = MEMORY_DOMAINS[pool];
    if (domain) {
      for (const t of domain.types) {
        types.push(t.value);
      }
    }
  }
  return types;
}

/**
 * 根据标签匹配可能的记忆类型
 */
function matchTypesByTag(tag) {
  const tagLower = tag.toLowerCase();
  const mappings = {
    '汇川': ['competitor', 'risk'],
    '倍福': ['competitor'],
    'SEW': ['competitor'],
    '西门子': ['strategy'],
    '穿梭车': ['project'],
    '堆垛机': ['project'],
    'AGV': ['project'],
  };
  return mappings[tag] || [];
}

/**
 * 获取记忆池摘要（用于前端展示）
 */
function getPoolSummary() {
  const summary = {};
  for (const [key, domain] of Object.entries(MEMORY_DOMAINS)) {
    const types = domain.types.map(t => t.value);
    const placeholders = [];
    for (const t of types) {
      if (t === 'archive_raw') continue; // 跳过原始归档
      placeholders.push('?');
    }
    if (placeholders.length === 0) {
      summary[key] = { label: domain.label, count: 0 };
      continue;
    }
    const row = db.prepare(
      `SELECT COUNT(*) as cnt FROM ai_memories WHERE is_archived = 0 AND memory_type IN (${placeholders.join(',')})`
    ).get(...types.filter(t => t !== 'archive_raw'));
    summary[key] = { label: domain.label, count: row.cnt, layer: domain.layer };
  }
  return summary;
}

module.exports = { route, getPoolSummary, getTypesForPools };
