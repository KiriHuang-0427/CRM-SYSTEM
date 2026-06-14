// server/routes/imports.js
// Import job management API routes (read-only for V26.07.00)

const express = require('express');
const router = express.Router();
const db = require('../database');

// ─── GET /api/imports/jobs ─────────────────────────────────────
// List import jobs (most recent first)
router.get('/jobs', (req, res) => {
  try {
    const jobs = db.prepare(`
      SELECT * FROM ai_import_jobs
      ORDER BY started_at DESC
      LIMIT 50
    `).all();
    res.json({ data: jobs.map(formatJob) });
  } catch (err) {
    console.error('[imports] GET jobs error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/imports/jobs/:id ─────────────────────────────────
// Get single import job detail
router.get('/jobs/:id', (req, res) => {
  try {
    const job = db.prepare('SELECT * FROM ai_import_jobs WHERE id = ?').get(req.params.id);
    if (!job) return res.status(404).json({ error: 'Import job not found' });
    res.json({ data: formatJob(job) });
  } catch (err) {
    console.error('[imports] GET jobs/:id error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/imports/source-files ─────────────────────────────
// List scanned source files
router.get('/source-files', (req, res) => {
  try {
    const { status } = req.query;
    let query = 'SELECT * FROM ai_source_files';
    const params = [];

    if (status) {
      query += ' WHERE import_status = ?';
      params.push(status);
    }

    query += ' ORDER BY updated_at DESC LIMIT 200';

    const files = db.prepare(query).all(...params);
    res.json({ data: files });
  } catch (err) {
    console.error('[imports] GET source-files error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── Helpers ────────────────────────────────────────────────────

function formatJob(row) {
  return {
    id: row.id,
    sourceRoot: row.source_root,
    status: row.status,
    totalFiles: row.total_files,
    importedFiles: row.imported_files,
    skippedFiles: row.skipped_files,
    failedFiles: row.failed_files,
    createdMemories: row.created_memories,
    linkedCustomers: row.linked_customers,
    unlinkedMemories: row.unlinked_memories,
    startedAt: row.started_at,
    finishedAt: row.finished_at || null,
    errorMessage: row.error_message || null,
    metadataJson: safeParseJSON(row.metadata_json),
  };
}

function safeParseJSON(val) {
  if (!val) return null;
  if (typeof val !== 'string') return val;
  try { return JSON.parse(val); } catch { return val; }
}

module.exports = router;
