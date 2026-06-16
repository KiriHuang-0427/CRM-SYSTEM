const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Middleware ───────────────────────────────────────────────

app.use(cors());
app.use(express.json());

// ─── API Routes ──────────────────────────────────────────────

const customersRouter = require('./routes/customers');
const pipelineRouter = require('./routes/pipeline');
const todosRouter = require('./routes/todos');
const weeklyRouter = require('./routes/weekly');
const memoriesRouter = require('./routes/memories');
const importsRouter = require('./routes/imports');

app.use('/api/customers', customersRouter);
app.use('/api/pipeline', pipelineRouter);
app.use('/api/todos', todosRouter);
app.use('/api/weekly', weeklyRouter);
app.use('/api/memories', memoriesRouter);
app.use('/api/imports', importsRouter);

// ─── Notes API (inline — small enough) ───────────────────────

app.get('/api/notes', (req, res) => {
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

app.post('/api/notes', (req, res) => {
  const { customerId, content } = req.body;
  if (!customerId || !content) {
    return res.status(400).json({ error: 'customerId and content are required' });
  }
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

app.delete('/api/notes/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM notes WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Invest Items API ────────────────────────────────────────
// Persistent investment scoring items (add/delete/list)

app.get('/api/invest-items', (req, res) => {
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

app.post('/api/invest-items', (req, res) => {
  const { name, key, customerId } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'name is required' });
  }
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

app.put('/api/invest-items/:key', (req, res) => {
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

app.delete('/api/invest-items/:key', (req, res) => {
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

// ─── Health Check ────────────────────────────────────────────

const serverStartTime = Date.now(); // V26.06.08: track server uptime

app.get('/api/health', (req, res) => {
  const custCount = db.prepare('SELECT COUNT(*) as cnt FROM customers').get();
  const todoCount = db.prepare('SELECT COUNT(*) as cnt FROM todos').get();
  const pipeCount = db.prepare('SELECT COUNT(*) as cnt FROM pipeline_stages').get();
  const memCount = db.prepare('SELECT COUNT(*) as cnt FROM ai_memories WHERE is_archived = 0').get();
  const uptimeSeconds = Math.floor((Date.now() - serverStartTime) / 1000);
  const uptime = `${Math.floor(uptimeSeconds / 86400)}d ${Math.floor((uptimeSeconds % 86400) / 3600)}h ${Math.floor((uptimeSeconds % 3600) / 60)}m ${uptimeSeconds % 60}s`;
  res.json({
    status: 'ok',
    version: 'V26.06.08',
    customers: custCount.cnt,
    todos: todoCount.cnt,
    pipeline: pipeCount.cnt,
    memories: memCount.cnt,
    uptime,
    uptimeSeconds,
    timestamp: new Date().toISOString(),
  });
});

// ─── SPA Fallback — serve static files ───────────────────────

const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));
app.get('*', (req, res) => {
  // Only serve index.html for non-API routes
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(distPath, 'index.html'));
  }
});

// ─── Start Server ────────────────────────────────────────────

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[CRM API] Server running on http://0.0.0.0:${PORT}`);
  console.log(`[CRM API] Version: V26.06.08`);
  console.log(`[CRM API] Database: ${path.join(__dirname, '..', 'data', 'crm.db')}`);
  // Auto-create current week report if missing
  const { ensureCurrentWeek } = require('./routes/weekly');
  ensureCurrentWeek();
});
