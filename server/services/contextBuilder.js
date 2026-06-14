// server/services/contextBuilder.js
// Customer context aggregation layer — the foundation for future AI access
// Does NOT call any AI model; only returns structured data

const db = require('../database');

/**
 * Build complete context for a customer
 * Aggregates: customer info, contacts, pipeline, todos, notes, weekly, memories
 * @param {string} customerId
 * @returns {object} structured context
 */
function buildCustomerContext(customerId) {
  // 1. Customer basic info
  const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(customerId);
  if (!customer) return null;

  // 2. Contacts
  const contacts = db.prepare(
    'SELECT id, name, role, tag, stars, phone, email FROM contacts WHERE customer_id = ?'
  ).all(customerId);

  // 3. Pipeline — split into active/lost/won
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

  // 4. Todos — pending + recent completed
  const pendingTodos = db.prepare(`
    SELECT id, text, deadline, completed, completed_at, created_at
    FROM todos WHERE customer_id = ? AND completed = 0
    ORDER BY created_at DESC
  `).all(customerId);

  const completedTodos = db.prepare(`
    SELECT id, text, deadline, completed, completed_at, created_at
    FROM todos WHERE customer_id = ? AND completed = 1
    ORDER BY completed_at DESC LIMIT 10
  `).all(customerId);

  const todos = {
    pending: pendingTodos.map(formatTodo),
    completedRecent: completedTodos.map(formatTodo),
  };

  // 5. Notes — recent 90 days
  const notes = db.prepare(`
    SELECT id, content, created_at
    FROM notes WHERE customer_id = ?
      AND created_at >= date('now', '-90 days')
    ORDER BY created_at DESC
  `).all(customerId);

  // 6. Weekly reports — all (they're not customer-specific but include relevant ones)
  const weekly = db.prepare(`
    SELECT wr.week_id, wr.label, wr.is_current,
      (SELECT json_group_array(text) FROM weekly_focuses WHERE week_id = wr.week_id) as focuses,
      (SELECT json_group_array(json_object('text', text, 'completed', completed)) FROM weekly_actions WHERE week_id = wr.week_id) as actions
    FROM weekly_reports wr
    ORDER BY wr.week_id DESC LIMIT 10
  `).all();

  const formattedWeekly = weekly.map(w => ({
    weekId: w.week_id,
    label: w.label,
    isCurrent: !!w.is_current,
    focuses: w.focuses ? JSON.parse(w.focuses).filter(Boolean) : [],
    actions: w.actions ? JSON.parse(w.actions).filter(Boolean) : [],
  }));

  // 7. Memories — grouped by type, high importance first
  const memories = db.prepare(`
    SELECT * FROM ai_memories
    WHERE customer_id = ? AND is_archived = 0
    ORDER BY importance DESC, created_at DESC
  `).all(customerId);

  const groupedMemories = {};
  const MEMORY_TYPES = [
    'customer_profile', 'relationship', 'project', 'risk', 'competitor',
    'strategy', 'decision', 'meeting', 'weekly', 'todo_context',
    'sales_data', 'archive_raw',
  ];
  for (const mt of MEMORY_TYPES) {
    const items = memories.filter(m => m.memory_type === mt);
    if (items.length > 0) {
      groupedMemories[mt] = items.map(formatMemory);
    }
  }

  // Limit archive_raw to 20 entries
  if (groupedMemories.archive_raw && groupedMemories.archive_raw.length > 20) {
    groupedMemories.archive_raw = groupedMemories.archive_raw.slice(0, 20);
  }

  // 8. Context metadata
  const memoryCount = memories.length;
  const lastMemory = db.prepare(`
    SELECT MAX(updated_at) as last FROM ai_memories WHERE customer_id = ? AND is_archived = 0
  `).get(customerId);

  const contextMeta = {
    memoryCount,
    lastUpdatedAt: lastMemory ? lastMemory.last : null,
    generatedAt: new Date().toISOString(),
  };

  return {
    data: {
      customer: formatCustomer(customer),
      contacts: contacts.map(formatContact),
      pipeline,
      todos,
      notes: notes.map(formatNote),
      weekly: formattedWeekly,
      memories: groupedMemories,
      contextMeta,
    },
  };
}

// ─── Formatters ─────────────────────────────────────────────────

function formatCustomer(c) {
  return {
    id: c.id,
    name: c.name,
    color: c.color,
    industry: c.industry,
    revenue: c.revenue,
    nextYear: c.next_year || null,
    comp: c.comp || null,
    lastVisit: c.last_visit || null,
    salesData: {
      PY: c.sales_py || 0,
      PY_YTD: c.sales_py_ytd || 0,
      CY_YTD: c.sales_cy_ytd || 0,
      CY_P8: c.sales_cy_p8 || 0,
    },
    risk: c.risk || null,
    talkStrategy: c.talk_strategy || null,
    aiCoach: c.ai_coach || null,
  };
}

function formatContact(ct) {
  return {
    id: ct.id, name: ct.name, role: ct.role, tag: ct.tag,
    stars: ct.stars, phone: ct.phone, email: ct.email,
  };
}

function formatPipeline(p) {
  return {
    id: p.id, name: p.name, stage: p.stage, amount: p.amount,
    pipeStage: p.pipe_stage, note: p.note,
    lost: !!p.lost, lostReason: p.lost_reason || null, lostAt: p.lost_at || null,
    won: !!p.won, wonAt: p.won_at || null,
    expectedCloseDate: p.expected_close_date || null,
    statusDescription: p.status_description || null,
  };
}

function formatTodo(t) {
  return {
    id: t.id, text: t.text, deadline: t.deadline,
    completed: !!t.completed, completedAt: t.completed_at || null,
    createdAt: t.created_at,
  };
}

function formatNote(n) {
  return {
    id: n.id, content: n.content, createdAt: n.created_at,
  };
}

function formatMemory(m) {
  return {
    id: m.id,
    memoryType: m.memory_type,
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

module.exports = { buildCustomerContext };
