const express = require('express');
const router = express.Router();
const db = require('../database');
const validate = require('../middleware/validate');

// ─── GET /api/notes ───────────────────────────────────────────

router.get('/', (req, res) => {
  const { customerId } = req.query;
  try {
    let notes;
    if (customerId) {
      notes = db.prepare(`
        SELECT n.id, n.customer_id as customerId, n.content, n.created_at as createdAt,
               c.name as customerName
        FROM notes n LEFT JOIN customers c ON c.id = n.customer_id
        WHERE n.customer_id = ? ORDER BY n.created_at DESC
      `).all(customerId);
    } else {
      notes = db.prepare(`
        SELECT n.id, n.customer_id as customerId, n.content, n.created_at as createdAt,
               c.name as customerName
        FROM notes n LEFT JOIN customers c ON c.id = n.customer_id
        ORDER BY n.created_at DESC LIMIT 50
      `).all();
    }
    res.json({ data: notes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/notes ──────────────────────────────────────────

router.post('/', validate({ customerId: { required: true, maxLength: 100 }, content: { required: true } }), (req, res) => {
  const { customerId, content } = req.body;
  try {
    const result = db.prepare(
      'INSERT INTO notes (customer_id, content) VALUES (?, ?)'
    ).run(customerId, content);
    const note = db.prepare('SELECT id, customer_id as customerId, content, created_at as createdAt FROM notes WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ data: note });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── DELETE /api/notes/:id ────────────────────────────────────

router.delete('/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM notes WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
