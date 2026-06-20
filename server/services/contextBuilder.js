// server/services/contextBuilder.js
// Customer context aggregation layer — AI 统一入口
// Uses Memory Router to intelligently select memory pools

const db = require('../database');
const { route: memoryRoute } = require('./memoryRouter');
const { getDomainByType, getLabelByType } = require('../config/memoryTypes');

const TOP_K_DEFAULT = 20; // 每个域最多返回条数

/**
 * 统一上下文查询 — AI 唯一入口
 * @param {Object} params
 * @param {string} [params.query] - 自然语言查询
 * @param {string} [params.customerId] - 指定客户ID
 * @param {string[]} [params.tags] - 标签过滤
 * @param {number} [params.topK] - 每个池最多返回条数
 * @returns {object} { facts, memories, insights, strategy }
 */
function buildContextQuery(params = {}) {
  const { query, customerId, tags = [], topK = TOP_K_DEFAULT } = params;

  // ─── 1. Memory Router 路由 ─────────────────────────────
  const routerResult = memoryRoute(query || '', { customerId, tags });

  // ─── 2. L1 事实层 — 从业务表提取 ──────────────────────
  const facts = buildFactsLayer(customerId, query);

  // ─── 3. L2 记忆层 — Router 按池查询 Top K ─────────────
  const memories = buildMemoriesLayer(routerResult, topK);

  // ─── 4. L3 洞察层 — insight + coach + learning ────────
  const insights = buildInsightLayer(customerId, topK);

  // ─── 5. L4 战略层 — strategy_plan ─────────────────────
  const strategy = buildStrategyLayer(topK);

  // ─── 6. 元数据 ────────────────────────────────────────
  const meta = {
    query,
    customerId: routerResult.customerId,
    industry: routerResult.industry,
    matchedPools: routerResult.pools,
    matchedTypes: routerResult.memoryTypes,
    isAmbiguous: routerResult.isAmbiguous,
    generatedAt: new Date().toISOString(),
  };

  return { facts, memories, insights, strategy, meta };
}

/**
 * 兼容旧 API：buildCustomerContext(customerId)
 * 内部调用新统一入口
 */
function buildCustomerContext(customerId) {
  if (!customerId) return null;

  const result = buildContextQuery({ customerId, topK: 20 });

  // 转换为旧格式（向下兼容）
  const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(customerId);
  if (!customer) return null;

  const contacts = db.prepare(
    'SELECT id, name, role, tag, stars, phone, email FROM contacts WHERE customer_id = ?'
  ).all(customerId);

  const allPipeline = db.prepare(`
    SELECT id, name, stage, amount, pipe_stage, note, lost, lost_reason, lost_at,
           won, won_at, expected_close_date, status_description, created_at, updated_at
    FROM pipeline_stages WHERE customer_id = ?
  `).all(customerId);

  const pipeline = {
    active: allPipeline.filter(p => !p.lost && !p.won).map(formatPipeline),
    lost: allPipeline.filter(p => p.lost).map(formatPipeline),
    won: allPipeline.filter(p => p.won).map(formatPipeline),
  };

  const pendingTodos = db.prepare(
    'SELECT id, text, deadline, completed, completed_at, created_at FROM todos WHERE customer_id = ? AND completed = 0 ORDER BY created_at DESC'
  ).all(customerId);

  const completedTodos = db.prepare(
    'SELECT id, text, deadline, completed, completed_at, created_at FROM todos WHERE customer_id = ? AND completed = 1 ORDER BY completed_at DESC LIMIT 10'
  ).all(customerId);

  const notes = db.prepare(
    'SELECT id, content, created_at FROM notes WHERE customer_id = ? AND created_at >= date(\'now\', \'-90 days\') ORDER BY created_at DESC'
  ).all(customerId);

  const weekly = db.prepare(`
    SELECT wr.week_id, wr.label, wr.is_current,
      (SELECT json_group_array(text) FROM weekly_focuses WHERE week_id = wr.week_id) as focuses,
      (SELECT json_group_array(json_object('text', text, 'completed', completed)) FROM weekly_actions WHERE week_id = wr.week_id) as actions
    FROM weekly_reports wr ORDER BY wr.week_id DESC LIMIT 10
  `).all();

  // 记忆按类型分组
  const groupedMemories = {};
  if (result.memories) {
    for (const m of result.memories) {
      if (!groupedMemories[m.memoryType]) groupedMemories[m.memoryType] = [];
      groupedMemories[m.memoryType].push(m);
    }
  }

  return {
    data: {
      customer: formatCustomer(customer),
      contacts: contacts.map(formatContact),
      pipeline,
      todos: { pending: pendingTodos.map(formatTodo), completedRecent: completedTodos.map(formatTodo) },
      notes: notes.map(formatNote),
      weekly: weekly.map(w => ({
        weekId: w.week_id,
        label: w.label,
        isCurrent: !!w.is_current,
        focuses: w.focuses ? JSON.parse(w.focuses).filter(Boolean) : [],
        actions: w.actions ? JSON.parse(w.actions).filter(Boolean) : [],
      })),
      memories: groupedMemories,
      contextMeta: result.meta,
    },
  };
}

// ─── Layer Builders ──────────────────────────────────────────

/**
 * L1 事实层：从业务表提取不可变事实
 */
function buildFactsLayer(customerId, query) {
  if (!customerId && !query) return {};

  const facts = {};

  if (customerId) {
    const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(customerId);
    if (customer) {
      facts.customer = formatCustomer(customer);
      facts.contacts = db.prepare(
        'SELECT id, name, role, tag, stars, phone, email FROM contacts WHERE customer_id = ?'
      ).all(customerId).map(formatContact);

      const pipelines = db.prepare(
        'SELECT * FROM pipeline_stages WHERE customer_id = ? AND lost = 0 AND won = 0 ORDER BY pipe_stage DESC'
      ).all(customerId);
      facts.pipeline = pipelines.map(formatPipeline);

      facts.todos = db.prepare(
        'SELECT * FROM todos WHERE customer_id = ? AND completed = 0 ORDER BY created_at DESC LIMIT 10'
      ).all(customerId).map(formatTodo);

      facts.notes = db.prepare(
        'SELECT * FROM notes WHERE customer_id = ? ORDER BY created_at DESC LIMIT 10'
      ).all(customerId).map(formatNote);
    }
  }

  // 行业事实
  if (query) {
    const industry = detectIndustry(query);
    if (industry) {
      facts.industryCustomers = db.prepare(
        'SELECT id, name, color, industry FROM customers WHERE industry LIKE ?'
      ).all(`%${industry}%`).map(c => ({ id: c.id, name: c.name, color: c.color }));
    }
  }

  return facts;
}

/**
 * L2 记忆层：Router 按池查询
 */
function buildMemoriesLayer(routerResult, topK) {
  const { memoryTypes, customerId } = routerResult;
  if (memoryTypes.length === 0) return [];

  const placeholders = memoryTypes.map(() => '?').join(',');
  let sql = `
    SELECT m.*, c.name as customer_name
    FROM ai_memories m
    LEFT JOIN customers c ON c.id = m.customer_id
    WHERE m.is_archived = 0
      AND m.memory_type IN (${placeholders})
  `;
  const params = [...memoryTypes];

  if (customerId) {
    sql += ' AND m.customer_id = ?';
    params.push(customerId);
  }

  sql += ' ORDER BY m.importance DESC, m.created_at DESC LIMIT ?';
  params.push(topK);

  const rows = db.prepare(sql).all(...params);
  return rows.map(formatMemory);
}

/**
 * L3 洞察层：insight + coach + learning + market
 */
function buildInsightLayer(customerId, topK) {
  const types = ['insight', 'coach', 'learning', 'market'];
  let sql = `
    SELECT m.*, c.name as customer_name
    FROM ai_memories m
    LEFT JOIN customers c ON c.id = m.customer_id
    WHERE m.is_archived = 0
      AND m.memory_type IN (?, ?, ?, ?)
  `;
  const params = [...types];

  if (customerId) {
    sql += ' AND (m.customer_id = ? OR m.customer_id IS NULL)';
    params.push(customerId);
  }

  sql += ' ORDER BY m.importance DESC, m.created_at DESC LIMIT ?';
  params.push(topK);

  const rows = db.prepare(sql).all(...params);
  return rows.map(formatMemory);
}

/**
 * L4 战略层：strategy_plan
 */
function buildStrategyLayer(topK) {
  const rows = db.prepare(`
    SELECT m.*, c.name as customer_name
    FROM ai_memories m
    LEFT JOIN customers c ON c.id = m.customer_id
    WHERE m.is_archived = 0
      AND m.memory_type = 'strategy_plan'
    ORDER BY m.importance DESC, m.created_at DESC LIMIT ?
  `).all(topK);
  return rows.map(formatMemory);
}

// ─── Helpers ──────────────────────────────────────────────────

function detectIndustry(query) {
  const industries = ['物流', '3C', '汽车', '新能源', '食品', '医药', '化工', '仓储', '自动化', '数据中心'];
  for (const ind of industries) {
    if (query.includes(ind)) return ind;
  }
  return null;
}

function formatCustomer(c) {
  return {
    id: c.id, name: c.name, color: c.color, industry: c.industry,
    revenue: c.revenue, nextYear: c.next_year || null, comp: c.comp || null,
    lastVisit: c.last_visit || null,
    salesData: { PY: c.sales_py || 0, PY_YTD: c.sales_py_ytd || 0, CY_YTD: c.sales_cy_ytd || 0, CY_P8: c.sales_cy_p8 || 0 },
    risk: c.risk || null, talkStrategy: c.talk_strategy || null, aiCoach: c.ai_coach || null,
  };
}

function formatContact(ct) {
  return { id: ct.id, name: ct.name, role: ct.role, tag: ct.tag, stars: ct.stars, phone: ct.phone, email: ct.email };
}

function formatPipeline(p) {
  return {
    id: p.id, name: p.name, stage: p.stage, amount: p.amount,
    pipeStage: p.pipe_stage, note: p.note,
    lost: !!p.lost, lostReason: p.lost_reason || null, lostAt: p.lost_at || null,
    won: !!p.won, wonAt: p.won_at || null,
    expectedCloseDate: p.expected_close_date || null, statusDescription: p.status_description || null,
  };
}

function formatTodo(t) {
  return { id: t.id, text: t.text, deadline: t.deadline, completed: !!t.completed, completedAt: t.completed_at || null, createdAt: t.created_at };
}

function formatNote(n) {
  return { id: n.id, content: n.content, createdAt: n.created_at };
}

function formatMemory(m) {
  const domainInfo = getDomainByType(m.memory_type);
  return {
    id: m.id,
    customerId: m.customer_id || null,
    customerName: m.customer_name || null,
    memoryType: m.memory_type,
    memoryTypeLabel: getLabelByType(m.memory_type),
    domain: domainInfo?.key || null,
    domainLabel: domainInfo?.label || null,
    layer: domainInfo?.layer || 'L2',
    title: m.title,
    content: m.content,
    summary: m.summary || null,
    importance: m.importance,
    confidence: m.confidence,
    sourceKind: m.source_kind || null,
    sourceFile: m.source_file || null,
    sourceAnchor: m.source_anchor || null,
    occurredAt: m.occurred_at || null,
    tags: safeParseJSON(m.tags),
    createdAt: m.created_at,
  };
}

function safeParseJSON(val) {
  if (!val) return null;
  if (typeof val !== 'string') return val;
  try { return JSON.parse(val); } catch { return val; }
}

module.exports = { buildContextQuery, buildCustomerContext };
