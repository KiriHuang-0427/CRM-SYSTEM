// server/config/memoryTypes.js
// 记忆类型四域四层分类体系

/**
 * 四层记忆模型:
 *   L1 业务数据层 (Facts) — 来自业务表，不可修改，属于系统事实
 *   L2 记忆层 (Memory) — ai_memories，长期记忆
 *   L3 洞察层 (Insight) — AI推断，不是事实
 *   L4 战略层 (Strategy) — 销售哲学，最高层记忆
 */

const MEMORY_DOMAINS = {
  customer: {
    label: '客户域',
    layer: 'L2',
    types: [
      { value: 'customer_profile', label: '客户画像', description: '客户基本信息、规模、业务范围' },
      { value: 'relationship',     label: '客户关系', description: '关键人关系、拜访记录、关系评分' },
      { value: 'project',          label: '项目',     description: '商机项目、需求、技术方案' },
      { value: 'risk',             label: '风险',     description: '丢失风险、竞品威胁、交付风险' },
      { value: 'competitor',       label: '竞品',     description: '竞品动态、价格策略、技术对比' },
      { value: 'meeting',          label: '会议',     description: '客户会议纪要、电话沟通记录' },
    ],
  },
  sales: {
    label: '销售域',
    layer: 'L2',
    types: [
      { value: 'strategy',     label: '销售策略', description: '客户策略、谈判策略、推进计划' },
      { value: 'decision',     label: '决策记录', description: '关键决策、报价决策、方案选择' },
      { value: 'sales_data',   label: '销售数据', description: '出货数据、营收统计、同比分析' },
      { value: 'todo_context', label: '待办上下文', description: '待办事项的背景和关联信息' },
      { value: 'weekly',       label: '周报',     description: '周报重点、行动项、每日记录' },
    ],
  },
  growth: {
    label: '成长域',
    layer: 'L3+L4',
    types: [
      { value: 'insight',        label: '洞察',     description: 'AI总结的认知推断，非事实', layer: 'L3' },
      { value: 'strategy_plan',  label: '战略规划', description: '中长期销售战略和市场规划', layer: 'L4' },
      { value: 'coach',          label: '销售教练', description: '话术建议、拜访准备、成长建议', layer: 'L3' },
      { value: 'learning',       label: '经验学习', description: '失败教训、成功经验、成长记录', layer: 'L3' },
      { value: 'market',         label: '市场情报', description: '行业趋势、市场规模、政策变化', layer: 'L3' },
    ],
  },
  ai: {
    label: 'AI域',
    layer: 'L2+L3',
    types: [
      { value: 'archive_raw',    label: '原始归档', description: '多客户融合原始记忆，智能标记', layer: 'L2' },
      { value: 'system_memory',  label: '系统记忆', description: 'AI自身状态、路由记录、使用模式', layer: 'L3' },
    ],
  },
};

// 平铺所有类型值
function getAllTypeValues() {
  const values = [];
  for (const domain of Object.values(MEMORY_DOMAINS)) {
    for (const t of domain.types) {
      values.push(t.value);
    }
  }
  return values;
}

// 根据类型值查找域
function getDomainByType(typeValue) {
  for (const [key, domain] of Object.entries(MEMORY_DOMAINS)) {
    if (domain.types.some(t => t.value === typeValue)) return { key, ...domain };
  }
  return null;
}

// 根据类型值查找标签
function getLabelByType(typeValue) {
  for (const domain of Object.values(MEMORY_DOMAINS)) {
    const found = domain.types.find(t => t.value === typeValue);
    if (found) return found.label;
  }
  return typeValue;
}

// 获取所有类型（平铺，用于前端渲染）
function getAllTypesFlattened() {
  const result = [];
  for (const [domainKey, domain] of Object.entries(MEMORY_DOMAINS)) {
    for (const t of domain.types) {
      result.push({ ...t, domain: domainKey, domainLabel: domain.label });
    }
  }
  return result;
}

// Memory Router 路由关键词定义
const ROUTER_KEYWORDS = {
  customer: ['客户', '拜访', '关系', '联系人', '关键人', '项目', '风险', '竞品', '竞争对手', '会议'],
  industry: ['行业', '物流', '3C', '汽车', '新能源', '食品', '医药', '化工', '仓储', '自动化'],
  strategy: ['策略', '计划', '目标', '方向', '重点', '突破', '优先级', '下一步'],
  learning: ['成长', '学习', '经验', '教训', '建议', '方法', '教练', '话术'],
  market: ['市场', '趋势', '行情', '行业报告', '政策', '经济'],
};

module.exports = {
  MEMORY_DOMAINS,
  getAllTypeValues,
  getDomainByType,
  getLabelByType,
  getAllTypesFlattened,
  ROUTER_KEYWORDS,
};
