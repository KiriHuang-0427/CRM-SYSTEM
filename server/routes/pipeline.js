const express = require('express');
const router = express.Router();
const db = require('../database');
const validate = require('../middleware/validate');

// ─── GET /api/pipeline ───────────────────────────────────────
// Pipeline summary — count and total per stage (only active items)
router.get('/', (req, res) => {
  try {
    const { includeLost } = req.query;
    const lostFilter = includeLost === 'true' ? '' : 'AND ps.lost = 0 AND ps.won = 0';

    const stages = db.prepare(`
      SELECT
        ps.pipe_stage,
        COUNT(*) as count,
        GROUP_CONCAT(c.name, ', ') as customer_names
      FROM pipeline_stages ps
      JOIN customers c ON c.id = ps.customer_id
      WHERE 1=1 ${lostFilter}
      GROUP BY ps.pipe_stage
      ORDER BY ps.pipe_stage ASC
    `).all();

    const allItems = db.prepare(`
      SELECT ps.*, c.name as customer_name, c.color as customer_color
      FROM pipeline_stages ps
      JOIN customers c ON c.id = ps.customer_id
      WHERE 1=1 ${lostFilter}
      ORDER BY ps.pipe_stage ASC, ps.created_at DESC
    `).all();

    // Pipeline stage definitions
    const stageDefs = [
      { num: 1, name: '初步接触', color: '#2980B9' },
      { num: 2, name: '需求确认', color: '#8E44AD' },
      { num: 3, name: '方案报价', color: '#F39C12' },
      { num: 4, name: '商务谈判', color: '#E74C3C' },
      { num: 5, name: '签约在即', color: '#009999' },
      { num: 6, name: '执行交付', color: '#27AE60' },
    ];

    const summary = stageDefs.map(def => {
      const stageData = stages.find(s => s.pipe_stage === def.num);
      const items = allItems.filter(i => i.pipe_stage === def.num);
      return {
        ...def,
        count: stageData ? stageData.count : 0,
        items: items.map(i => ({
          id: i.id,
          name: i.name,
          stage: i.stage,
          amount: i.amount,
          pipeStage: i.pipe_stage,
          note: i.note,
          lost: !!i.lost,
          lostReason: i.lost_reason || undefined,
          expectedCloseDate: i.expected_close_date || undefined,
          statusDescription: i.status_description || undefined,
          customerName: i.customer_name,
          customerColor: i.customer_color,
          customerId: i.customer_id,
        })),
      };
    });

    res.json({ data: summary });
  } catch (err) {
    console.error('[pipeline] GET error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/pipeline/lost ──────────────────────────────────
// List all lost pipeline items
router.get('/lost', (req, res) => {
  try {
    const items = db.prepare(`
      SELECT ps.*, c.name as customer_name, c.color as customer_color
      FROM pipeline_stages ps
      JOIN customers c ON c.id = ps.customer_id
      WHERE ps.lost = 1
      ORDER BY ps.lost_at DESC
    `).all();

    const result = items.map(i => ({
      id: i.id,
      name: i.name,
      stage: i.stage,
      amount: i.amount,
      pipeStage: i.pipe_stage,
      note: i.note,
      lost: true,
      lostReason: i.lost_reason || '',
      lostAt: i.lost_at || '',
      expectedCloseDate: i.expected_close_date || undefined,
      statusDescription: i.status_description || undefined,
      customerName: i.customer_name,
      customerColor: i.customer_color,
      customerId: i.customer_id,
    }));

    res.json({ data: result });
  } catch (err) {
    console.error('[pipeline] GET /lost error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/pipeline/won ──────────────────────────────────
// List all won pipeline items
router.get('/won', (req, res) => {
  try {
    const items = db.prepare(`
      SELECT ps.*, c.name as customer_name, c.color as customer_color
      FROM pipeline_stages ps
      JOIN customers c ON c.id = ps.customer_id
      WHERE ps.won = 1
      ORDER BY ps.won_at DESC
    `).all();

    const result = items.map(i => ({
      id: i.id,
      name: i.name,
      stage: i.stage,
      amount: i.amount,
      pipeStage: i.pipe_stage,
      note: i.note,
      won: true,
      wonAt: i.won_at || '',
      expectedCloseDate: i.expected_close_date || undefined,
      statusDescription: i.status_description || undefined,
      customerName: i.customer_name,
      customerColor: i.customer_color,
      customerId: i.customer_id,
    }));

    res.json({ data: result });
  } catch (err) {
    console.error('[pipeline] GET /won error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/pipeline/:customerId ───────────────────────────
// Get pipeline items for a specific customer
router.get('/:customerId', (req, res) => {
  try {
    const items = db.prepare(`
      SELECT * FROM pipeline_stages
      WHERE customer_id = ?
      ORDER BY lost ASC, pipe_stage ASC
    `).all(req.params.customerId);

    const result = items.map(i => ({
      id: i.id,
      name: i.name,
      stage: i.stage,
      amount: i.amount,
      pipeStage: i.pipe_stage,
      note: i.note,
      lost: !!i.lost,
      lostReason: i.lost_reason || undefined,
      expectedCloseDate: i.expected_close_date || undefined,
      statusDescription: i.status_description || undefined,
    }));

    res.json({ data: result });
  } catch (err) {
    console.error('[pipeline] GET :customerId error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/pipeline ──────────────────────────────────────
// Create new pipeline item
router.post('/', validate({ customerId: { required: true }, name: { required: true, maxLength: 200 } }), (req, res) => {
  try {
    const { customerId, name, stage, amount, pipeStage, note, expectedCloseDate, statusDescription } = req.body;
    if (!customerId || !name) {
      return res.status(400).json({ error: 'customerId and name are required' });
    }

    const result = db.prepare(`
      INSERT INTO pipeline_stages (customer_id, name, stage, amount, pipe_stage, note, expected_close_date, status_description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(customerId, name, stage || '', amount || '', pipeStage || 1, note || '', expectedCloseDate || '', statusDescription || '');

    const item = db.prepare('SELECT * FROM pipeline_stages WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({
      data: {
        id: item.id,
        name: item.name,
        stage: item.stage,
        amount: item.amount,
        pipeStage: item.pipe_stage,
        note: item.note,
        expectedCloseDate: item.expected_close_date || undefined,
        statusDescription: item.status_description || undefined,
        lost: false,
        customerId: item.customer_id,
      },
    });
  } catch (err) {
    console.error('[pipeline] POST error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── PUT /api/pipeline/:id ───────────────────────────────────
// Update pipeline item (name, stage, amount, note, pipeStage, expectedCloseDate, statusDescription)
router.put('/:id', (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM pipeline_stages WHERE id = ?').get(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Pipeline item not found' });
    }

    const { name, stage, amount, pipeStage, note, expectedCloseDate, statusDescription, lostReason } = req.body;

    db.prepare(`
      UPDATE pipeline_stages SET
        name = COALESCE(?, name),
        stage = COALESCE(?, stage),
        amount = COALESCE(?, amount),
        pipe_stage = COALESCE(?, pipe_stage),
        note = COALESCE(?, note),
        expected_close_date = COALESCE(?, expected_close_date),
        status_description = COALESCE(?, status_description),
        lost_reason = COALESCE(?, lost_reason),
        updated_at = datetime('now')
      WHERE id = ?
    `).run(name ?? null, stage ?? null, amount ?? null, pipeStage ?? null, note ?? null, expectedCloseDate ?? null, statusDescription ?? null, lostReason ?? null, req.params.id);

    const updated = db.prepare('SELECT * FROM pipeline_stages WHERE id = ?').get(req.params.id);
    res.json({
      data: {
        id: updated.id,
        name: updated.name,
        stage: updated.stage,
        amount: updated.amount,
        pipeStage: updated.pipe_stage,
        note: updated.note,
        lost: !!updated.lost,
        lostReason: updated.lost_reason || undefined,
        expectedCloseDate: updated.expected_close_date || undefined,
        statusDescription: updated.status_description || undefined,
        customerId: updated.customer_id,
      },
    });
  } catch (err) {
    console.error('[pipeline] PUT error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── PUT /api/pipeline/:id/stage ─────────────────────────────
// Update pipeline stage (dropdown select in UI)
router.put('/:id/stage', (req, res) => {
  try {
    const { stage } = req.body;
    if (typeof stage !== 'number' || stage < 1 || stage > 6) {
      return res.status(400).json({ error: 'stage must be 1-6' });
    }

    const existing = db.prepare('SELECT * FROM pipeline_stages WHERE id = ?').get(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Pipeline item not found' });
    }

    db.prepare('UPDATE pipeline_stages SET pipe_stage = ?, updated_at = datetime(\'now\') WHERE id = ?').run(stage, req.params.id);

    const updated = db.prepare('SELECT * FROM pipeline_stages WHERE id = ?').get(req.params.id);
    res.json({
      data: {
        id: updated.id,
        name: updated.name,
        stage: updated.stage,
        amount: updated.amount,
        pipeStage: updated.pipe_stage,
        note: updated.note,
        lost: !!updated.lost,
        customerId: updated.customer_id,
      },
    });
  } catch (err) {
    console.error('[pipeline] PUT stage error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── PUT /api/pipeline/:id/lost ──────────────────────────────
// Mark pipeline item as lost
router.put('/:id/lost', (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM pipeline_stages WHERE id = ?').get(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Pipeline item not found' });
    }

    const { reason } = req.body;
    db.prepare(`
      UPDATE pipeline_stages SET lost = 1, lost_reason = ?, lost_at = datetime('now'), updated_at = datetime('now')
      WHERE id = ?
    `).run(reason || '', req.params.id);

    const updated = db.prepare('SELECT * FROM pipeline_stages WHERE id = ?').get(req.params.id);
    res.json({
      data: {
        id: updated.id,
        name: updated.name,
        lost: true,
        lostReason: updated.lost_reason,
        lostAt: updated.lost_at,
      },
    });
  } catch (err) {
    console.error('[pipeline] PUT lost error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── PUT /api/pipeline/:id/win ──────────────────────────────
// Mark pipeline item as won
router.put('/:id/win', (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM pipeline_stages WHERE id = ?').get(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Pipeline item not found' });
    }

    db.prepare(`
      UPDATE pipeline_stages SET won = 1, won_at = datetime('now'), updated_at = datetime('now')
      WHERE id = ?
    `).run(req.params.id);

    const updated = db.prepare('SELECT * FROM pipeline_stages WHERE id = ?').get(req.params.id);
    res.json({
      data: {
        id: updated.id,
        name: updated.name,
        won: true,
        wonAt: updated.won_at,
      },
    });
  } catch (err) {
    console.error('[pipeline] PUT win error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── PUT /api/pipeline/:id/restore ───────────────────────────
// Restore a lost or won pipeline item
router.put('/:id/restore', (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM pipeline_stages WHERE id = ?').get(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Pipeline item not found' });
    }

    db.prepare(`
      UPDATE pipeline_stages SET lost = 0, lost_reason = '', lost_at = '', won = 0, won_at = '', updated_at = datetime('now')
      WHERE id = ?
    `).run(req.params.id);

    const updated = db.prepare('SELECT * FROM pipeline_stages WHERE id = ?').get(req.params.id);
    res.json({
      data: {
        id: updated.id,
        name: updated.name,
        lost: false,
        pipeStage: updated.pipe_stage,
      },
    });
  } catch (err) {
    console.error('[pipeline] PUT restore error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── DELETE /api/pipeline/:id ────────────────────────────────
// Delete a pipeline item permanently
router.delete('/:id', (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM pipeline_stages WHERE id = ?').get(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Pipeline item not found' });
    }

    db.prepare('DELETE FROM pipeline_stages WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error('[pipeline] DELETE error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
