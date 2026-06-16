// server/services/memoryService.js
// Core service for AI memory CRUD operations

const db = require('../database');

/**
 * Query memories with filters
 */
function queryMemories(params = {}) {
  const {
    customerId,
    memoryType,
    sourceKind,
    keyword,
    limit = 50,
    offset = 0,
    includeArchived = false,
  } = params;

  let where = [];
  let bindParams = [];

  if (!includeArchived) {
    where.push('m.is_archived = 0');
  }
  if (customerId) {
    where.push('m.customer_id = ?');
    bindParams.push(customerId);
  }
  if (memoryType) {
    where.push('m.memory_type = ?');
    bindParams.push(memoryType);
  }
  if (sourceKind) {
    where.push('m.source_kind = ?');
    bindParams.push(sourceKind);
  }
  if (keyword) {
    where.push('(m.title LIKE ? OR m.content LIKE ? OR m.tags LIKE ?)');
    const kw = `%${keyword}%`;
    bindParams.push(kw, kw, kw);
  }

  const whereClause = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';

  const countRow = db.prepare(`SELECT COUNT(*) as total FROM ai_memories m ${whereClause}`).get(...bindParams);
  const total = countRow.total;

  const rows = db.prepare(`
    SELECT m.*,
           c.name as customer_name
    FROM ai_memories m
    LEFT JOIN customers c ON c.id = m.customer_id
    ${whereClause}
    ORDER BY m.importance DESC, m.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...bindParams, limit, offset);

  return {
    data: rows.map(formatMemory),
    total,
    limit,
    offset,
  };
}

/**
 * Get single memory by ID
 */
function getMemoryById(id) {
  const row = db.prepare(`
    SELECT m.*, c.name as customer_name
    FROM ai_memories m
    LEFT JOIN customers c ON c.id = m.customer_id
    WHERE m.id = ?
  `).get(id);

  if (!row) return null;

  // Also get links
  const links = db.prepare(`
    SELECT entity_type, entity_id, relation_type
    FROM ai_memory_links
    WHERE memory_id = ?
  `).all(id);

  return { ...formatMemory(row), links };
}

/**
 * Create a memory record
 */
function createMemory(data) {
  const {
    customer_id = null,
    memory_type,
    title = '',
    content,
    summary = null,
    importance = 3,
    confidence = 0.8,
    source_kind = 'manual',
    source_file = null,
    source_path = null,
    source_anchor = null,
    source_table = null,
    source_id = null,
    occurred_at = null,
    tags = null,
    metadata_json = null,
    checksum = null,
  } = data;

  if (!content) throw new Error('content is required');
  if (!memory_type) throw new Error('memory_type is required');

  const result = db.prepare(`
    INSERT INTO ai_memories (
      customer_id, memory_type, title, content, summary,
      importance, confidence, source_kind, source_file, source_path,
      source_anchor, source_table, source_id, occurred_at,
      tags, metadata_json, checksum
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    customer_id, memory_type, title, content, summary,
    importance, confidence, source_kind, source_file, source_path,
    source_anchor, source_table, source_id, occurred_at,
    tags, metadata_json, checksum
  );

  return getMemoryById(result.lastInsertRowid);
}

/**
 * Update memory (title, type, importance, tags, summary only)
 */
function updateMemory(id, data) {
  const existing = db.prepare('SELECT id FROM ai_memories WHERE id = ?').get(id);
  if (!existing) return null;

  const {
    title,
    memory_type,
    importance,
    tags,
    summary,
    is_archived,
  } = data;

  db.prepare(`
    UPDATE ai_memories SET
      title = COALESCE(?, title),
      memory_type = COALESCE(?, memory_type),
      importance = COALESCE(?, importance),
      tags = COALESCE(?, tags),
      summary = COALESCE(?, summary),
      is_archived = COALESCE(?, is_archived),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    title ?? null,
    memory_type ?? null,
    importance ?? null,
    tags ?? null,
    summary ?? null,
    is_archived ?? null,
    id
  );

  return getMemoryById(id);
}

/**
 * Soft delete — set is_archived = 1
 */
function archiveMemory(id) {
  const result = db.prepare('UPDATE ai_memories SET is_archived = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(id);
  return result.changes > 0;
}

/**
 * Get memory statistics summary
 */
function getStatsSummary() {
  const totalActive = db.prepare('SELECT COUNT(*) as cnt FROM ai_memories WHERE is_archived = 0').get().cnt;
  const totalArchived = db.prepare('SELECT COUNT(*) as cnt FROM ai_memories WHERE is_archived = 1').get().cnt;

  const byType = db.prepare(`
    SELECT memory_type, COUNT(*) as count
    FROM ai_memories WHERE is_archived = 0
    GROUP BY memory_type ORDER BY count DESC
  `).all();

  const bySource = db.prepare(`
    SELECT source_kind, COUNT(*) as count
    FROM ai_memories WHERE is_archived = 0
    GROUP BY source_kind ORDER BY count DESC
  `).all();

  const linkedCount = db.prepare('SELECT COUNT(*) as cnt FROM ai_memories WHERE is_archived = 0 AND customer_id IS NOT NULL').get().cnt;
  const unlinkedCount = db.prepare('SELECT COUNT(*) as cnt FROM ai_memories WHERE is_archived = 0 AND customer_id IS NULL').get().cnt;

  const sourceFileCount = db.prepare('SELECT COUNT(*) as cnt FROM ai_source_files').get().cnt;
  const importJobCount = db.prepare('SELECT COUNT(*) as cnt FROM ai_import_jobs').get().cnt;

  const highRisk = db.prepare("SELECT COUNT(*) as cnt FROM ai_memories WHERE is_archived = 0 AND memory_type = 'risk'").get().cnt;
  const highImportance = db.prepare('SELECT COUNT(*) as cnt FROM ai_memories WHERE is_archived = 0 AND importance >= 4').get().cnt;

  // Review status breakdown (V26.06.07)
  const byReviewStatus = db.prepare(`
    SELECT review_status, COUNT(*) as count
    FROM ai_memories WHERE is_archived = 0
    GROUP BY review_status ORDER BY count DESC
  `).all();

  return {
    totalActive,
    totalArchived,
    byType,
    bySource,
    linkedCount,
    unlinkedCount,
    sourceFileCount,
    importJobCount,
    highRisk,
    highImportance,
    byReviewStatus,
  };
}

/**
 * Get memories for a specific customer grouped by type
 */
function getCustomerMemories(customerId, limit = 20) {
  const rows = db.prepare(`
    SELECT * FROM ai_memories
    WHERE customer_id = ? AND is_archived = 0
    ORDER BY importance DESC, created_at DESC
    LIMIT ?
  `).all(customerId, limit);

  const grouped = {};
  for (const row of rows) {
    if (!grouped[row.memory_type]) grouped[row.memory_type] = [];
    grouped[row.memory_type].push(formatMemory(row));
  }

  return {
    data: rows.map(formatMemory),
    grouped,
    total: rows.length,
  };
}

// ─── Helpers ──────────────────────────────────────────────────

function formatMemory(row) {
  return {
    id: row.id,
    customerId: row.customer_id || null,
    customerName: row.customer_name || null,
    memoryType: row.memory_type,
    title: row.title,
    content: row.content,
    summary: row.summary || null,
    importance: row.importance,
    confidence: row.confidence,
    sourceKind: row.source_kind || null,
    sourceFile: row.source_file || null,
    sourcePath: row.source_path || null,
    sourceAnchor: row.source_anchor || null,
    sourceTable: row.source_table || null,
    sourceId: row.source_id || null,
    occurredAt: row.occurred_at || null,
    tags: safeParseJSON(row.tags),
    metadataJson: safeParseJSON(row.metadata_json),
    checksum: row.checksum || null,
    isArchived: !!row.is_archived,
    reviewStatus: row.review_status || 'pending',
    reviewNote: row.review_note || null,
    reviewedAt: row.reviewed_at || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function safeParseJSON(val) {
  if (!val) return null;
  if (typeof val !== 'string') return val;
  try { return JSON.parse(val); } catch { return val; }
}

module.exports = {
  queryMemories,
  getMemoryById,
  createMemory,
  updateMemory,
  archiveMemory,
  getStatsSummary,
  getCustomerMemories,
  // V26.06.07 — Review functions
  getUnlinkedMemories,
  linkCustomer,
  markUnlinkedReviewed,
  archiveMemoryWithReason,
  batchOperation,
};

// ─── V26.06.07 Review Functions ─────────────────────────────

/**
 * Get unlinked memories (customer_id IS NULL, not archived)
 */
function getUnlinkedMemories(params = {}) {
  const {
    keyword,
    memoryType,
    sourceFile,
    sourceKind,
    reviewStatus,
    limit = 50,
    offset = 0,
  } = params;

  let where = ['m.customer_id IS NULL', 'm.is_archived = 0'];
  let bindParams = [];

  if (keyword) {
    where.push('(m.title LIKE ? OR m.content LIKE ? OR m.tags LIKE ?)');
    const kw = `%${keyword}%`;
    bindParams.push(kw, kw, kw);
  }
  if (memoryType) {
    where.push('m.memory_type = ?');
    bindParams.push(memoryType);
  }
  if (sourceFile) {
    where.push('m.source_file LIKE ?');
    bindParams.push(`%${sourceFile}%`);
  }
  if (sourceKind) {
    where.push('m.source_kind = ?');
    bindParams.push(sourceKind);
  }
  if (reviewStatus) {
    where.push('m.review_status = ?');
    bindParams.push(reviewStatus);
  }

  const whereClause = 'WHERE ' + where.join(' AND ');
  const total = db.prepare(`SELECT COUNT(*) as total FROM ai_memories m ${whereClause}`).get(...bindParams).total;

  const rows = db.prepare(`
    SELECT m.*, c.name as customer_name
    FROM ai_memories m
    LEFT JOIN customers c ON c.id = m.customer_id
    ${whereClause}
    ORDER BY m.importance DESC, m.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...bindParams, limit, offset);

  return {
    data: rows.map(formatMemory),
    pagination: { limit, offset, total },
  };
}

/**
 * Link a memory to a customer
 */
function linkCustomer(id, customerId, reason) {
  const existing = db.prepare('SELECT id FROM ai_memories WHERE id = ?').get(id);
  if (!existing) return null;

  const now = new Date().toISOString();
  db.prepare(`
    UPDATE ai_memories SET
      customer_id = ?,
      review_status = 'linked',
      review_note = COALESCE(?, review_note),
      reviewed_at = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(customerId, reason || null, now, id);

  // Also record in ai_memory_links
  db.prepare(`
    INSERT OR IGNORE INTO ai_memory_links (memory_id, entity_type, entity_id, relation_type)
    VALUES (?, 'customer', ?, 'manual_link')
  `).run(id, customerId);

  return getMemoryById(id);
}

/**
 * Mark memory as reviewed but no customer link needed
 */
function markUnlinkedReviewed(id, reason) {
  const existing = db.prepare('SELECT id FROM ai_memories WHERE id = ?').get(id);
  if (!existing) return null;

  const now = new Date().toISOString();
  db.prepare(`
    UPDATE ai_memories SET
      review_status = 'no_customer',
      review_note = COALESCE(?, review_note),
      reviewed_at = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(reason || null, now, id);

  return getMemoryById(id);
}

/**
 * Archive memory with review reason
 */
function archiveMemoryWithReason(id, reason) {
  const existing = db.prepare('SELECT id FROM ai_memories WHERE id = ?').get(id);
  if (!existing) return null;

  const now = new Date().toISOString();
  db.prepare(`
    UPDATE ai_memories SET
      is_archived = 1,
      review_status = 'archived',
      review_note = COALESCE(?, review_note),
      reviewed_at = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(reason || null, now, id);

  return { success: true, message: 'Memory archived' };
}

/**
 * Batch operation: link_customer / mark_unlinked_reviewed / archive
 */
function batchOperation(ids, action, customerId, reason) {
  if (!Array.isArray(ids) || ids.length === 0) {
    throw new Error('ids must be a non-empty array');
  }

  const results = { success: 0, failed: 0 };
  const now = new Date().toISOString();

  const transaction = db.transaction(() => {
    for (const id of ids) {
      try {
        if (action === 'link_customer') {
          if (!customerId) throw new Error('customerId required for link_customer');
          db.prepare(`
            UPDATE ai_memories SET
              customer_id = ?, review_status = 'linked',
              review_note = COALESCE(?, review_note), reviewed_at = ?,
              updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `).run(customerId, reason || null, now, id);
          db.prepare(`
            INSERT OR IGNORE INTO ai_memory_links (memory_id, entity_type, entity_id, relation_type)
            VALUES (?, 'customer', ?, 'batch_link')
          `).run(id, customerId);
        } else if (action === 'mark_unlinked_reviewed') {
          db.prepare(`
            UPDATE ai_memories SET
              review_status = 'no_customer',
              review_note = COALESCE(?, review_note), reviewed_at = ?,
              updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `).run(reason || null, now, id);
        } else if (action === 'archive') {
          db.prepare(`
            UPDATE ai_memories SET
              is_archived = 1, review_status = 'archived',
              review_note = COALESCE(?, review_note), reviewed_at = ?,
              updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `).run(reason || null, now, id);
        } else {
          throw new Error(`Unknown action: ${action}`);
        }
        results.success++;
      } catch (err) {
        console.error(`[batch] id=${id} failed:`, err.message);
        results.failed++;
      }
    }
  });

  transaction();
  return results;
}
