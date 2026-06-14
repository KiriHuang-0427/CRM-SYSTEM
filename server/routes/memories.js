// server/routes/memories.js
// AI Memory management API routes

const express = require('express');
const router = express.Router();
const memoryService = require('../services/memoryService');

// ─── GET /api/memories/stats/summary ────────────────────────────
// Memory statistics (must be before /:id to avoid route conflict)
router.get('/stats/summary', (req, res) => {
  try {
    const stats = memoryService.getStatsSummary();
    res.json({ data: stats });
  } catch (err) {
    console.error('[memories] stats error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/memories ─────────────────────────────────────────
// Query memories with filters
router.get('/', (req, res) => {
  try {
    const {
      customerId,
      memoryType,
      sourceKind,
      keyword,
      limit = '50',
      offset = '0',
      includeArchived,
    } = req.query;

    const result = memoryService.queryMemories({
      customerId,
      memoryType,
      sourceKind,
      keyword,
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
      includeArchived: includeArchived === 'true',
    });

    res.json(result);
  } catch (err) {
    console.error('[memories] GET error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/memories/:id ─────────────────────────────────────
// Get single memory detail
router.get('/:id', (req, res) => {
  try {
    const memory = memoryService.getMemoryById(parseInt(req.params.id, 10));
    if (!memory) {
      return res.status(404).json({ error: 'Memory not found' });
    }
    res.json({ data: memory });
  } catch (err) {
    console.error('[memories] GET :id error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/memories ────────────────────────────────────────
// Create a new memory (manual)
router.post('/', (req, res) => {
  try {
    const memory = memoryService.createMemory(req.body);
    res.status(201).json({ data: memory });
  } catch (err) {
    console.error('[memories] POST error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── PUT /api/memories/:id ─────────────────────────────────────
// Update memory (title, type, importance, tags, summary)
router.put('/:id', (req, res) => {
  try {
    const memory = memoryService.updateMemory(parseInt(req.params.id, 10), req.body);
    if (!memory) {
      return res.status(404).json({ error: 'Memory not found' });
    }
    res.json({ data: memory });
  } catch (err) {
    console.error('[memories] PUT error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── DELETE /api/memories/:id ──────────────────────────────────
// Soft delete (is_archived = 1) — no physical delete allowed
router.delete('/:id', (req, res) => {
  try {
    const ok = memoryService.archiveMemory(parseInt(req.params.id, 10));
    if (!ok) {
      return res.status(404).json({ error: 'Memory not found' });
    }
    res.json({ success: true, message: 'Memory archived' });
  } catch (err) {
    console.error('[memories] DELETE error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
