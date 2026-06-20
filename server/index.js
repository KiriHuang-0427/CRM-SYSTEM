const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./database');
const config = require('./config');

const app = express();
const PORT = config.PORT;

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
const notesRouter = require('./routes/notes');
const investItemsRouter = require('./routes/investItems');
const contextRouter = require('./routes/context');

app.use('/api/customers', customersRouter);
app.use('/api/pipeline', pipelineRouter);
app.use('/api/todos', todosRouter);
app.use('/api/weekly', weeklyRouter);
app.use('/api/memories', memoriesRouter);
app.use('/api/imports', importsRouter);
app.use('/api/notes', notesRouter);
app.use('/api/invest-items', investItemsRouter);
app.use('/api/context', contextRouter);

// ─── Error Handler ───────────────────────────────────────────

const errorHandler = require('./middleware/errorHandler');
app.use(errorHandler);

// ─── Health Check ────────────────────────────────────────────

const serverStartTime = config.UPTIME_START;

app.get('/api/health', (req, res) => {
  const custCount = db.prepare('SELECT COUNT(*) as cnt FROM customers').get();
  const todoCount = db.prepare('SELECT COUNT(*) as cnt FROM todos').get();
  const pipeCount = db.prepare('SELECT COUNT(*) as cnt FROM pipeline_stages').get();
  const memCount = db.prepare('SELECT COUNT(*) as cnt FROM ai_memories WHERE is_archived = 0').get();
  const uptimeSeconds = Math.floor((Date.now() - serverStartTime) / 1000);
  const uptime = `${Math.floor(uptimeSeconds / 86400)}d ${Math.floor((uptimeSeconds % 86400) / 3600)}h ${Math.floor((uptimeSeconds % 3600) / 60)}m ${uptimeSeconds % 60}s`;
  res.json({
    status: 'ok',
    version: 'V26.06.10',
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
  console.log(`[CRM API] Version: V26.06.10`);
  console.log(`[CRM API] Database: ${config.DB_PATH}`);
  // Auto-create current week report if missing
  const { ensureCurrentWeek } = require('./routes/weekly');
  ensureCurrentWeek();
});
