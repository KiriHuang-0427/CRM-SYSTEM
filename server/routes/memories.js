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

// ─── GET /api/memories/unlinked ─────────────────────────────────
// Get unlinked memories for review (V26.07.01)
router.get('/unlinked', (req, res) => {
  try {
    const { keyword, memoryType, sourceFile, sourceKind, reviewStatus, limit = '50', offset = '0' } = req.query;
    const result = memoryService.getUnlinkedMemories({
      keyword, memoryType, sourceFile, sourceKind, reviewStatus,
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
    });
    res.json(result);
  } catch (err) {
    console.error('[memories] GET /unlinked error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── PUT /api/memories/batch ────────────────────────────────────
// Batch operation on memories (V26.07.01)
router.put('/batch', (req, res) => {
  try {
    const { ids, action, customerId, reason } = req.body;
    if (!ids || !action) {
      return res.status(400).json({ error: 'ids and action are required' });
    }
    const results = memoryService.batchOperation(ids, action, customerId, reason);
    res.json({ data: results });
  } catch (err) {
    console.error('[memories] PUT /batch error:', err.message);
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

// ─── PUT /api/memories/:id/link-customer ────────────────────────
// Link memory to a customer (V26.07.01)
router.put('/:id/link-customer', (req, res) => {
  try {
    const { customerId, reason } = req.body;
    if (!customerId) {
      return res.status(400).json({ error: 'customerId is required' });
    }
    const memory = memoryService.linkCustomer(parseInt(req.params.id, 10), customerId, reason);
    if (!memory) {
      return res.status(404).json({ error: 'Memory not found' });
    }
    res.json({ data: memory });
  } catch (err) {
    console.error('[memories] link-customer error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── PUT /api/memories/:id/mark-unlinked-reviewed ───────────────
// Mark as reviewed but no customer link (V26.07.01)
router.put('/:id/mark-unlinked-reviewed', (req, res) => {
  try {
    const { reason } = req.body;
    const memory = memoryService.markUnlinkedReviewed(parseInt(req.params.id, 10), reason);
    if (!memory) {
      return res.status(404).json({ error: 'Memory not found' });
    }
    res.json({ data: memory });
  } catch (err) {
    console.error('[memories] mark-unlinked-reviewed error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── PUT /api/memories/:id/archive ──────────────────────────────
// Soft archive with review reason (V26.07.01)
router.put('/:id/archive', (req, res) => {
  try {
    const { reason } = req.body;
    const result = memoryService.archiveMemoryWithReason(parseInt(req.params.id, 10), reason);
    if (!result) {
      return res.status(404).json({ error: 'Memory not found' });
    }
    res.json(result);
  } catch (err) {
    console.error('[memories] archive error:', err.message);
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
