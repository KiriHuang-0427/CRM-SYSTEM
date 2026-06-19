const express = require('express');
const router = express.Router();
const db = require('../database');
const validate = require('../middleware/validate');

// ─── GET /api/invest-items ────────────────────────────────────

router.get('/', (req, res) => {
  try {
    const items = db.prepare(`
      SELECT ii.id, ii.key, ii.name, ii.customer_id as customerId, ii.created_at as createdAt,
             c.name as customerName
      FROM invest_items ii
      LEFT JOIN customers c ON c.id = ii.customer_id
      ORDER BY ii.created_at ASC
    `).all();
    res.json({ data: items });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/invest-items ───────────────────────────────────

router.post('/', validate({ name: { required: true, maxLength: 200 } }), (req, res) => {
  const { name, key, customerId } = req.body;
  try {
    const itemKey = key || 'score_' + Date.now().toString(36);
    const result = db.prepare('INSERT INTO invest_items (key, name, customer_id) VALUES (?, ?, ?)').run(itemKey, name.trim(), customerId || '');
    const item = db.prepare(`
      SELECT ii.id, ii.key, ii.name, ii.customer_id as customerId, ii.created_at as createdAt,
             c.name as customerName
      FROM invest_items ii LEFT JOIN customers c ON c.id = ii.customer_id
      WHERE ii.id = ?
    `).get(result.lastInsertRowid);
    res.status(201).json({ data: item });
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'Item key already exists' });
    }
    res.status(500).json({ error: err.message });
  }
});

// ─── PUT /api/invest-items/:key ───────────────────────────────

router.put('/:key', (req, res) => {
  const { name, customerId } = req.body;
  try {
    if (name !== undefined) {
      db.prepare('UPDATE invest_items SET name = ? WHERE key = ?').run(name, req.params.key);
    }
    if (customerId !== undefined) {
      db.prepare('UPDATE invest_items SET customer_id = ? WHERE key = ?').run(customerId, req.params.key);
    }
    const item = db.prepare(`
      SELECT ii.id, ii.key, ii.name, ii.customer_id as customerId, ii.created_at as createdAt,
             c.name as customerName
      FROM invest_items ii LEFT JOIN customers c ON c.id = ii.customer_id
      WHERE ii.key = ?
    `).get(req.params.key);
    if (!item) return res.status(404).json({ error: 'Item not found' });
    res.json({ data: item });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── DELETE /api/invest-items/:key ────────────────────────────

router.delete('/:key', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM invest_items WHERE key = ?').run(req.params.key);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
