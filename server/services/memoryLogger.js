// server/services/memoryLogger.js
// 业务操作自动摘要 — 写入 ai_memories，建立四域索引
// 每次客户/Pipeline/待办/笔记/周报操作时自动调用

const db = require('../database');

/**
 * 写入一条业务摘要到 ai_memories
 * @param {Object} params
 * @param {string} params.memoryType - 记忆类型
 * @param {string} params.title - 短标题
 * @param {string} params.content - 摘要内容
 * @param {string} [params.customerId] - 关联客户
 * @param {string} [params.sourceTable] - 来源表名
 * @param {string} [params.sourceId] - 来源记录 ID
 * @param {number} [params.importance] - 重要性 1-5
 */
function log(params) {
  const {
    memoryType,
    title,
    content,
    customerId = null,
    sourceTable = null,
    sourceId = null,
    importance = 2,
  } = params;

  try {
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO ai_memories (
        customer_id, memory_type, title, content, summary,
        importance, confidence, source_kind, source_table, source_id,
        occurred_at, tags, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, 1.0, 'auto', ?, ?, ?, ?, ?)
    `).run(
      customerId,
      memoryType,
      title,
      content,
      content.slice(0, 100),
      importance,
      sourceTable,
      sourceId ? String(sourceId) : null,
      now,
      JSON.stringify(['auto', memoryType]),
      now
    );
  } catch (e) {
    // 静默失败 — 不影响主业务
    console.error('[MemoryLogger] Failed:', e.message);
  }
}

// ─── 便捷方法 ──────────────────────────────────────────────────

/**
 * 客户操作
 */
function customer(action, customerId, customerName, detail = '') {
  const actions = {
    create: { type: 'customer_profile', title: `新增客户: ${customerName}`, content: detail || `创建了客户档案: ${customerName}`, imp: 3 },
    update: { type: 'customer_profile', title: `更新客户: ${customerName}`, content: detail || `更新了客户信息: ${customerName}`, imp: 2 },
    delete: { type: 'customer_profile', title: `删除客户: ${customerName}`, content: `客户已删除: ${customerName}`, imp: 3 },
  };
  const a = actions[action] || actions.update;
  log({ memoryType: a.type, title: a.title, content: a.content, customerId, sourceTable: 'customers', sourceId: customerId, importance: a.imp });
}

/**
 * 联系人操作
 */
function contact(action, customerId, customerName, contactName) {
  const actions = {
    add: { title: `添加联系人`, content: `为 ${customerName} 添加联系人: ${contactName}`, imp: 2 },
    update: { title: `更新联系人`, content: `更新 ${customerName} 的联系人: ${contactName}`, imp: 1 },
    delete: { title: `删除联系人`, content: `删除 ${customerName} 的联系人: ${contactName}`, imp: 2 },
  };
  const a = actions[action] || actions.add;
  log({ memoryType: 'relationship', title: a.title, content: a.content, customerId, sourceTable: 'contacts', importance: a.imp });
}

/**
 * Pipeline 操作
 */
function pipeline(action, customerId, customerName, pipelineName, extra = '') {
  const actions = {
    create: { title: `新建商机`, content: `${customerName}: 新建商机「${pipelineName}」${extra}`, imp: 4 },
    stage: { title: `商机推进`, content: `${customerName}: 「${pipelineName}」${extra}`, imp: 3 },
    lost: { title: `商机丢失`, content: `${customerName}: 「${pipelineName}」标记丢失${extra ? ' — ' + extra : ''}`, imp: 5 },
    win: { title: `商机赢得`, content: `${customerName}: 「${pipelineName}」标记赢得!`, imp: 5 },
    restore: { title: `商机恢复`, content: `${customerName}: 「${pipelineName}」恢复活跃`, imp: 4 },
    delete: { title: `删除商机`, content: `${customerName}: 删除商机「${pipelineName}」`, imp: 4 },
  };
  const a = actions[action] || actions.create;
  log({ memoryType: 'project', title: a.title, content: a.content, customerId, sourceTable: 'pipeline_stages', importance: a.imp });
}

/**
 * 待办操作
 */
function todo(action, customerId, customerName, todoText) {
  const actions = {
    create: { title: `新增待办`, content: `${customerName || ''}: ${todoText}`, imp: 2 },
    complete: { title: `完成待办`, content: `${customerName || ''}: ✓ ${todoText}`, imp: 2 },
    delete: { title: `删除待办`, content: `${customerName || ''}: 删除待办「${todoText}」`, imp: 1 },
  };
  const a = actions[action] || actions.create;
  log({ memoryType: 'todo_context', title: a.title, content: a.content, customerId, sourceTable: 'todos', importance: a.imp });
}

/**
 * 速记操作
 */
function note(action, customerId, customerName, content) {
  log({
    memoryType: 'meeting',
    title: `${customerName}: 新增速记`,
    content: content.slice(0, 200),
    customerId,
    sourceTable: 'notes',
    importance: 2,
  });
}

/**
 * 周报操作
 */
function weekly(action, weekId, detail = '') {
  const actions = {
    create: { title: `创建周报`, content: `${weekId}: ${detail}`, imp: 2 },
    focus: { title: `更新周报重点`, content: `${weekId}: ${detail}`, imp: 2 },
    action: { title: `周报行动项`, content: `${weekId}: ${detail}`, imp: 2 },
  };
  const a = actions[action] || actions.create;
  log({ memoryType: 'weekly', title: a.title, content: a.content, sourceTable: 'weekly_reports', sourceId: weekId, importance: a.imp });
}

module.exports = { log, customer, contact, pipeline, todo, note, weekly };

