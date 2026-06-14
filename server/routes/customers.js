const express = require('express');
const router = express.Router();
const db = require('../database');

// ─── GET /api/customers ──────────────────────────────────────
// List all customers with optional search and sort
router.get('/', (req, res) => {
  try {
    const { search, sort } = req.query;

    let query = `
      SELECT c.*,
        (SELECT json_group_array(json_object(
          'id', ct.id, 'name', ct.name, 'role', ct.role, 'tag', ct.tag, 'stars', ct.stars, 'phone', ct.phone, 'email', ct.email
        )) FROM contacts ct WHERE ct.customer_id = c.id) as contacts_json,
        (SELECT json_group_array(json_object(
          'id', p.id, 'name', p.name, 'stage', p.stage, 'amount', p.amount,
          'pipeStage', p.pipe_stage, 'note', p.note
        )) FROM pipeline_stages p WHERE p.customer_id = c.id) as pipeline_json,
        (SELECT json_group_array(json_object(
          'id', tp.id, 'title', tp.title, 'color', tp.color, 'bg', tp.bg, 'text', tp.text
        )) FROM talk_points tp WHERE tp.customer_id = c.id) as talk_points_json,
        (SELECT json_group_array(json_object(
          'id', sc.id, 'name', sc.name, 'tag', sc.tag
        )) FROM sub_customers sc WHERE sc.parent_id = c.id) as sub_customers_json
      FROM customers c
    `;

    const params = [];

    if (search) {
      query += ` WHERE (c.name LIKE ? OR c.industry LIKE ? OR c.comp LIKE ?)`;
      const s = `%${search}%`;
      params.push(s, s, s);
    }

    // Sort
    const colorOrder = { red: 0, orange: 1, green: 2, gray: 3 };
    if (sort === 'revenue') {
      query += ` ORDER BY c.sales_cy_ytd DESC`;
    } else if (sort === 'industry') {
      query += ` ORDER BY c.industry ASC`;
    } else if (sort === 'lastVisit') {
      query += ` ORDER BY c.last_visit DESC`;
    } else {
      // Default: priority sort
      query += ` ORDER BY
        CASE c.color WHEN 'red' THEN 0 WHEN 'orange' THEN 1 WHEN 'green' THEN 2 ELSE 3 END ASC,
        c.sales_cy_ytd DESC`;
    }

    const rows = db.prepare(query).all(...params);

    // Parse JSON fields
    const customers = rows.map(row => ({
      id: row.id,
      name: row.name,
      color: row.color,
      industry: row.industry,
      revenue: row.revenue,
      nextYear: row.next_year || undefined,
      comp: row.comp || undefined,
      lastVisit: row.last_visit || undefined,
      salesData: {
        PY: row.sales_py || undefined,
        PY_YTD: row.sales_py_ytd || undefined,
        CY_YTD: row.sales_cy_ytd || undefined,
        CY_P8: row.sales_cy_p8 || undefined,
      },
      keyPersons: row.contacts_json ? JSON.parse(row.contacts_json).filter(Boolean) : [],
      pipeline: row.pipeline_json ? JSON.parse(row.pipeline_json).filter(Boolean) : [],
      talkPoints: row.talk_points_json ? JSON.parse(row.talk_points_json).filter(Boolean) : [],
      subCustomers: row.sub_customers_json ? JSON.parse(row.sub_customers_json).filter(Boolean) : undefined,
      isGroup: !!row.is_group,
      risk: row.risk || undefined,
      talkStrategy: row.talk_strategy || undefined,
      aiCoach: row.ai_coach || undefined,
    }));

    res.json({ data: customers });
  } catch (err) {
    console.error('[customers] GET error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/customers/:id/context ─────────────────────────────
// Aggregated customer context for future AI access (V26.07.00)
router.get('/:id/context', (req, res) => {
  try {
    const { buildCustomerContext } = require('../services/contextBuilder');
    const context = buildCustomerContext(req.params.id);
    if (!context) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    res.json(context);
  } catch (err) {
    console.error('[customers] GET :id/context error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/customers/:id ──────────────────────────────────
// Get single customer detail
router.get('/:id', (req, res) => {
  try {
    const row = db.prepare(`
      SELECT c.*,
        (SELECT json_group_array(json_object(
          'id', ct.id, 'name', ct.name, 'role', ct.role, 'tag', ct.tag, 'stars', ct.stars, 'phone', ct.phone, 'email', ct.email
        )) FROM contacts ct WHERE ct.customer_id = c.id) as contacts_json,
        (SELECT json_group_array(json_object(
          'id', p.id, 'name', p.name, 'stage', p.stage, 'amount', p.amount,
          'pipeStage', p.pipe_stage, 'note', p.note
        )) FROM pipeline_stages p WHERE p.customer_id = c.id) as pipeline_json,
        (SELECT json_group_array(json_object(
          'id', tp.id, 'title', tp.title, 'color', tp.color, 'bg', tp.bg, 'text', tp.text
        )) FROM talk_points tp WHERE tp.customer_id = c.id) as talk_points_json,
        (SELECT json_group_array(json_object(
          'id', sc.id, 'name', sc.name, 'tag', sc.tag
        )) FROM sub_customers sc WHERE sc.parent_id = c.id) as sub_customers_json
      FROM customers c
      WHERE c.id = ?
    `).get(req.params.id);

    if (!row) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const customer = {
      id: row.id,
      name: row.name,
      color: row.color,
      industry: row.industry,
      revenue: row.revenue,
      nextYear: row.next_year || undefined,
      comp: row.comp || undefined,
      lastVisit: row.last_visit || undefined,
      salesData: {
        PY: row.sales_py || undefined,
        PY_YTD: row.sales_py_ytd || undefined,
        CY_YTD: row.sales_cy_ytd || undefined,
        CY_P8: row.sales_cy_p8 || undefined,
      },
      keyPersons: row.contacts_json ? JSON.parse(row.contacts_json).filter(Boolean) : [],
      pipeline: row.pipeline_json ? JSON.parse(row.pipeline_json).filter(Boolean) : [],
      talkPoints: row.talk_points_json ? JSON.parse(row.talk_points_json).filter(Boolean) : [],
      subCustomers: row.sub_customers_json ? JSON.parse(row.sub_customers_json).filter(Boolean) : undefined,
      isGroup: !!row.is_group,
      risk: row.risk || undefined,
      talkStrategy: row.talk_strategy || undefined,
      aiCoach: row.ai_coach || undefined,
    };

    res.json({ data: customer });
  } catch (err) {
    console.error('[customers] GET :id error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/customers ─────────────────────────────────────
// Create new customer
router.post('/', (req, res) => {
  try {
    const {
      name, color = 'gray', industry = '', revenue = '0', nextYear = '',
      comp = '', lastVisit = '', aiCoach = '', risk = '', talkStrategy = '',
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: '客户名称不能为空' });
    }

    // Check for duplicate name
    const existing = db.prepare('SELECT id FROM customers WHERE name = ?').get(name);
    if (existing) {
      return res.status(409).json({ error: '已存在同名客户: ' + name });
    }

    // Generate ID from name
    const id = name.toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5]/g, '')
      .slice(0, 20) + '_' + Date.now().toString(36);

    const result = db.prepare(`
      INSERT INTO customers (id, name, color, industry, revenue, next_year, comp, last_visit,
        ai_coach, risk, talk_strategy)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, name, color, industry, revenue, nextYear, comp, lastVisit, aiCoach, risk, talkStrategy);

    const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(id);
    res.status(201).json({ data: customer });
  } catch (err) {
    console.error('[customers] POST error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── PUT /api/customers/:id ──────────────────────────────────
// Update customer
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT * FROM customers WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const {
      name, color, industry, revenue, nextYear, comp, lastVisit,
      aiCoach, risk, talkStrategy,
    } = req.body;

    db.prepare(`
      UPDATE customers SET
        name = COALESCE(?, name),
        color = COALESCE(?, color),
        industry = COALESCE(?, industry),
        revenue = COALESCE(?, revenue),
        next_year = COALESCE(?, next_year),
        comp = COALESCE(?, comp),
        last_visit = COALESCE(?, last_visit),
        ai_coach = COALESCE(?, ai_coach),
        risk = COALESCE(?, risk),
        talk_strategy = COALESCE(?, talk_strategy),
        updated_at = datetime('now')
      WHERE id = ?
    `).run(
      name ?? null, color ?? null, industry ?? null, revenue ?? null,
      nextYear ?? null, comp ?? null, lastVisit ?? null,
      aiCoach ?? null, risk ?? null, talkStrategy ?? null,
      id
    );

    const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(id);
    res.json({ data: customer });
  } catch (err) {
    console.error('[customers] PUT error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── DELETE /api/customers/:id ───────────────────────────────
// Delete customer (cascade deletes contacts, pipeline, etc.)
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT * FROM customers WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    db.prepare('DELETE FROM customers WHERE id = ?').run(id);
    res.json({ success: true, message: `已删除客户: ${existing.name}` });
  } catch (err) {
    console.error('[customers] DELETE error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/customers/:id/contacts ─────────────────────────
// Add a contact to a customer
router.post('/:id/contacts', (req, res) => {
  try {
    const { id } = req.params;
    const customer = db.prepare('SELECT id FROM customers WHERE id = ?').get(id);
    if (!customer) return res.status(404).json({ error: 'Customer not found' });

    const { name, role = '', tag = '', stars = 3, phone = '', email = '' } = req.body;
    if (!name) return res.status(400).json({ error: '联系人姓名不能为空' });

    const result = db.prepare(`
      INSERT INTO contacts (customer_id, name, role, tag, stars, phone, email)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, name, role, tag, stars, phone, email);

    const contact = db.prepare('SELECT * FROM contacts WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ data: contact });
  } catch (err) {
    console.error('[contacts] POST error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── PUT /api/customers/:id/contacts/:contactId ──────────────
// Update a contact
router.put('/:id/contacts/:contactId', (req, res) => {
  try {
    const { contactId } = req.params;
    const existing = db.prepare('SELECT * FROM contacts WHERE id = ?').get(contactId);
    if (!existing) return res.status(404).json({ error: 'Contact not found' });

    const { name, role, tag, stars, phone, email } = req.body;

    db.prepare(`
      UPDATE contacts SET
        name = COALESCE(?, name),
        role = COALESCE(?, role),
        tag = COALESCE(?, tag),
        stars = COALESCE(?, stars),
        phone = COALESCE(?, phone),
        email = COALESCE(?, email)
      WHERE id = ?
    `).run(name ?? null, role ?? null, tag ?? null, stars ?? null, phone ?? null, email ?? null, contactId);

    const contact = db.prepare('SELECT * FROM contacts WHERE id = ?').get(contactId);
    res.json({ data: contact });
  } catch (err) {
    console.error('[contacts] PUT error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── DELETE /api/customers/:id/contacts/:contactId ───────────
// Delete a contact
router.delete('/:id/contacts/:contactId', (req, res) => {
  try {
    const { contactId } = req.params;
    const existing = db.prepare('SELECT * FROM contacts WHERE id = ?').get(contactId);
    if (!existing) return res.status(404).json({ error: 'Contact not found' });

    db.prepare('DELETE FROM contacts WHERE id = ?').run(contactId);
    res.json({ success: true });
  } catch (err) {
    console.error('[contacts] DELETE error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
