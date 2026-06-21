const express = require('express');
const router = express.Router();
const db = require('../database');
const validate = require('../middleware/validate');
const { weekly: logWeekly } = require('../services/memoryLogger');

// Helper: get ISO week ID (YYYY-WNN) from a date
function getISOWeekId(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  // Thursday determines the ISO week year
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const weekYear = d.getFullYear();
  const jan1 = new Date(weekYear, 0, 1);
  const weekNum = 1 + Math.round(((d - jan1) / 86400000 - 3 + ((jan1.getDay() + 6) % 7)) / 7);
  return `${weekYear}-W${String(weekNum).padStart(2, '0')}`;
}

// Helper: get human label for a week
function getWeekLabel(weekId) {
  // Parse YYYY-WNN
  const [yearStr, wStr] = weekId.split('-W');
  const year = parseInt(yearStr);
  const week = parseInt(wStr);
  // Calculate Monday of this ISO week
  const jan4 = new Date(year, 0, 4);
  const mondayOffset = -((jan4.getDay() + 6) % 7);
  const monday = new Date(year, 0, 4 + mondayOffset + (week - 1) * 7);
  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);
  const fmt = d => `${d.getMonth() + 1}/${d.getDate()}`;
  return `W${week}（${fmt(monday)} - ${fmt(friday)}）`;
}

// Helper: get next week's ID from current weekId
function getNextWeekId(weekId) {
  const [yearStr, wStr] = weekId.split('-W');
  const year = parseInt(yearStr);
  const week = parseInt(wStr);
  // Calculate Monday of current ISO week, then add 7 days
  const jan4 = new Date(year, 0, 4);
  const mondayOffset = -((jan4.getDay() + 6) % 7);
  const monday = new Date(year, 0, 4 + mondayOffset + (week - 1) * 7);
  const nextMonday = new Date(monday);
  nextMonday.setDate(monday.getDate() + 7);
  return getISOWeekId(nextMonday);
}

// Helper: ensure next week's report exists, return its weekId
function ensureNextWeek(weekId) {
  const nextId = getNextWeekId(weekId);
  const exists = db.prepare('SELECT id FROM weekly_reports WHERE week_id = ?').get(nextId);
  if (!exists) {
    const label = getWeekLabel(nextId);
    try {
      db.prepare('INSERT INTO weekly_reports (week_id, label, is_current) VALUES (?, ?, 0)').run(nextId, label);
    } catch (e) {
      // Ignore UNIQUE constraint error (already exists)
    }
  }
  return nextId;
}

// Helper: sync current week's actions → next week's focuses
function syncActionsToNextWeekFocuses(weekId) {
  const nextId = ensureNextWeek(weekId);
  const actions = db.prepare('SELECT text FROM weekly_actions WHERE week_id = ? ORDER BY sort_order ASC').all(weekId);
  const txn = db.transaction(() => {
    db.prepare('DELETE FROM weekly_focuses WHERE week_id = ?').run(nextId);
    const insert = db.prepare('INSERT INTO weekly_focuses (week_id, text, sort_order) VALUES (?, ?, ?)');
    actions.forEach((a, i) => insert.run(nextId, a.text, i));
  });
  txn();
}

// ─── GET /api/weekly — list all weekly reports (newest first) ─────

router.get('/', (req, res) => {
  try {
    const reports = db.prepare(
      'SELECT id, week_id as weekId, label, is_current as isCurrent, created_at as createdAt FROM weekly_reports ORDER BY week_id DESC'
    ).all();

    // Attach nested data for each report
    const result = reports.map(r => {
      const focuses = db.prepare(
        'SELECT id, text, sort_order as sortOrder FROM weekly_focuses WHERE week_id = ? ORDER BY sort_order ASC'
      ).all(r.weekId);
      const actions = db.prepare(
        'SELECT id, text, completed, sort_order as sortOrder FROM weekly_actions WHERE week_id = ? ORDER BY sort_order ASC'
      ).all(r.weekId);
      const dailyNotes = db.prepare(
        'SELECT id, day_key as dayKey, content FROM weekly_daily_notes WHERE week_id = ?'
      ).all(r.weekId);
      return { ...r, focuses, actions, dailyNotes };
    });

    res.json({ data: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/weekly — create a new weekly report ──────────────

router.post('/', validate({ weekId: { required: true, maxLength: 20 } }), (req, res) => {
  const { weekId, label } = req.body;
  if (!weekId) {
    return res.status(400).json({ error: 'weekId is required' });
  }
  try {
    const finalLabel = label || getWeekLabel(weekId);
    const result = db.prepare(
      'INSERT INTO weekly_reports (week_id, label, is_current) VALUES (?, ?, 0)'
    ).run(weekId, finalLabel);
    const report = db.prepare(
      'SELECT id, week_id as weekId, label, is_current as isCurrent, created_at as createdAt FROM weekly_reports WHERE id = ?'
    ).get(result.lastInsertRowid);
    logWeekly('create', weekId, label);
    res.status(201).json({ data: report });
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'Week report already exists' });
    }
    res.status(500).json({ error: err.message });
  }
});

// ─── PUT /api/weekly/:weekId/focuses — replace focuses array ─────

router.put('/:weekId/focuses', (req, res) => {
  const { weekId } = req.params;
  const { focuses } = req.body; // array of strings
  if (!Array.isArray(focuses)) {
    return res.status(400).json({ error: 'focuses must be an array' });
  }
  try {
    const txn = db.transaction(() => {
      db.prepare('DELETE FROM weekly_focuses WHERE week_id = ?').run(weekId);
      const insert = db.prepare('INSERT INTO weekly_focuses (week_id, text, sort_order) VALUES (?, ?, ?)');
      focuses.forEach((text, i) => insert.run(weekId, text, i));
    });
    txn();
    const result = db.prepare(
      'SELECT id, text, sort_order as sortOrder FROM weekly_focuses WHERE week_id = ? ORDER BY sort_order ASC'
    ).all(weekId);
    res.json({ data: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── PUT /api/weekly/:weekId/daily-notes — upsert daily note ─────

router.put('/:weekId/daily-notes', (req, res) => {
  const { weekId } = req.params;
  const { dayKey, content } = req.body;
  if (!dayKey) {
    return res.status(400).json({ error: 'dayKey is required' });
  }
  try {
    const existing = db.prepare(
      'SELECT id FROM weekly_daily_notes WHERE week_id = ? AND day_key = ?'
    ).get(weekId, dayKey);

    if (existing) {
      db.prepare('UPDATE weekly_daily_notes SET content = ? WHERE id = ?').run(content || '', existing.id);
    } else {
      db.prepare('INSERT INTO weekly_daily_notes (week_id, day_key, content) VALUES (?, ?, ?)').run(weekId, dayKey, content || '');
    }

    const note = db.prepare(
      'SELECT id, day_key as dayKey, content FROM weekly_daily_notes WHERE week_id = ? AND day_key = ?'
    ).get(weekId, dayKey);
    res.json({ data: note });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/weekly/:weekId/actions — add action item ─────────

router.post('/:weekId/actions', validate({ text: { required: true, maxLength: 500 } }), (req, res) => {
  const { weekId } = req.params;
  const { text } = req.body;
  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'text is required' });
  }
  try {
    // Get max sort_order
    const max = db.prepare('SELECT COALESCE(MAX(sort_order), -1) as m FROM weekly_actions WHERE week_id = ?').get(weekId);
    const result = db.prepare(
      'INSERT INTO weekly_actions (week_id, text, sort_order) VALUES (?, ?, ?)'
    ).run(weekId, text.trim(), max.m + 1);
    const action = db.prepare(
      'SELECT id, text, completed, sort_order as sortOrder FROM weekly_actions WHERE id = ?'
    ).get(result.lastInsertRowid);
    // Sync to next week's focuses
    syncActionsToNextWeekFocuses(weekId);
    res.status(201).json({ data: action });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── PUT /api/weekly/:weekId/actions/:id — toggle/edit action ────

router.put('/:weekId/actions/:id', (req, res) => {
  const { id } = req.params;
  const { completed, text } = req.body;
  try {
    if (completed !== undefined) {
      db.prepare('UPDATE weekly_actions SET completed = ? WHERE id = ?').run(completed ? 1 : 0, id);
    }
    if (text !== undefined) {
      db.prepare('UPDATE weekly_actions SET text = ? WHERE id = ?').run(text, id);
    }
    const action = db.prepare(
      'SELECT id, text, completed, sort_order as sortOrder FROM weekly_actions WHERE id = ?'
    ).get(id);
    if (!action) {
      return res.status(404).json({ error: 'Action not found' });
    }
    // Sync to next week's focuses
    const { weekId } = req.params;
    syncActionsToNextWeekFocuses(weekId);
    res.json({ data: action });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── DELETE /api/weekly/:weekId/actions/:id — delete action ──────

router.delete('/:weekId/actions/:id', (req, res) => {
  const { id } = req.params;
  try {
    const result = db.prepare('DELETE FROM weekly_actions WHERE id = ?').run(id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Action not found' });
    }
    // Sync to next week's focuses
    const { weekId } = req.params;
    syncActionsToNextWeekFocuses(weekId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── PUT /api/weekly/:weekId/label — update report label ────────

router.put('/:weekId/label', (req, res) => {
  const { weekId } = req.params;
  const { label } = req.body;
  if (!label) {
    return res.status(400).json({ error: 'label is required' });
  }
  try {
    db.prepare('UPDATE weekly_reports SET label = ? WHERE week_id = ?').run(label, weekId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── ensureCurrentWeek — auto-create current week if missing ─────

function ensureCurrentWeek() {
  const weekId = getISOWeekId(new Date());
  const existing = db.prepare('SELECT id FROM weekly_reports WHERE week_id = ?').get(weekId);
  if (!existing) {
    const label = getWeekLabel(weekId);
    db.prepare('INSERT INTO weekly_reports (week_id, label, is_current) VALUES (?, ?, 1)').run(weekId, label);
    console.log(`[Weekly] Auto-created current week report: ${weekId} (${label})`);
  } else {
    // Ensure is_current flag is set for this week
    db.prepare('UPDATE weekly_reports SET is_current = 0').run();
    db.prepare('UPDATE weekly_reports SET is_current = 1 WHERE week_id = ?').run(weekId);
  }
  // Auto-create next week's report (for 下周计划 sync)
  ensureNextWeek(weekId);
}

module.exports = router;
module.exports.ensureCurrentWeek = ensureCurrentWeek;
