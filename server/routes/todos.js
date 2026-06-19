const express = require('express');
const router = express.Router();
const db = require('../database');
const validate = require('../middleware/validate');

// ─── GET /api/todos ──────────────────────────────────────────
// List todos, optionally filtered by status
router.get('/', (req, res) => {
  try {
    const { status, customerId } = req.query;

    let query = 'SELECT * FROM todos';
    const conditions = [];
    const params = [];

    if (status === 'pending') {
      conditions.push('completed = 0');
    } else if (status === 'completed') {
      conditions.push('completed = 1');
    }

    if (customerId) {
      conditions.push('customer_id = ?');
      params.push(customerId);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    // Sorting: pending → created_at DESC, completed → completed_at DESC
    if (status === 'pending') {
      query += ' ORDER BY created_at DESC';
    } else if (status === 'completed') {
      query += ' ORDER BY completed_at DESC';
    } else {
      // all: pending first, then completed, each group sorted by its own date
      query += ' ORDER BY completed ASC, CASE WHEN completed = 0 THEN created_at ELSE completed_at END DESC';
    }

    const todos = db.prepare(query).all(...params);

    const result = todos.map(t => ({
      id: t.id,
      text: t.text,
      customerId: t.customer_id || undefined,
      deadline: t.deadline || undefined,
      completed: !!t.completed,
      completedAt: t.completed_at || undefined,
      createdAt: t.created_at,
    }));

    res.json({ data: result });
  } catch (err) {
    console.error('[todos] GET error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/todos ─────────────────────────────────────────
// Create a new todo
router.post('/', validate({ text: { required: true, maxLength: 500 } }), (req, res) => {
  try {
    const { text, customerId, deadline } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: '待办内容不能为空' });
    }

    const result = db.prepare(
      'INSERT INTO todos (text, customer_id, deadline, sort_order) VALUES (?, ?, ?, COALESCE((SELECT MAX(sort_order) + 1 FROM todos), 1))'
    ).run(text.trim(), customerId || '', deadline || '');

    const todo = db.prepare('SELECT * FROM todos WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({
      data: {
        id: todo.id,
        text: todo.text,
        customerId: todo.customer_id || undefined,
        deadline: todo.deadline || undefined,
        completed: !!todo.completed,
        createdAt: todo.created_at,
      },
    });
  } catch (err) {
    console.error('[todos] POST error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── PUT /api/todos/:id ──────────────────────────────────────
// Toggle todo completed status or update text/deadline
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT * FROM todos WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    const { completed, text, deadline, customerId } = req.body;

    if (typeof completed === 'boolean') {
      db.prepare(
        `UPDATE todos SET completed = ?, completed_at = ? WHERE id = ?`
      ).run(completed ? 1 : 0, completed ? new Date().toISOString() : '', id);
    }

    if (text !== undefined) {
      db.prepare('UPDATE todos SET text = ? WHERE id = ?').run(text, id);
    }

    if (deadline !== undefined) {
      db.prepare('UPDATE todos SET deadline = ? WHERE id = ?').run(deadline, id);
    }

    if (customerId !== undefined) {
      db.prepare('UPDATE todos SET customer_id = ? WHERE id = ?').run(customerId || '', id);
    }

    const todo = db.prepare('SELECT * FROM todos WHERE id = ?').get(id);

    res.json({
      data: {
        id: todo.id,
        text: todo.text,
        customerId: todo.customer_id || undefined,
        deadline: todo.deadline || undefined,
        completed: !!todo.completed,
        completedAt: todo.completed_at || undefined,
        createdAt: todo.created_at,
      },
    });
  } catch (err) {
    console.error('[todos] PUT error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── DELETE /api/todos/:id ───────────────────────────────────
// Delete a todo
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT * FROM todos WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    db.prepare('DELETE FROM todos WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (err) {
    console.error('[todos] DELETE error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
