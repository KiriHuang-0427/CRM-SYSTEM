// server/routes/context.js
// AI统一上下文查询入口 — 未来AI唯一读写接口

const express = require('express');
const router = express.Router();
const { buildContextQuery, buildCustomerContext } = require('../services/contextBuilder');
const { getPoolSummary } = require('../services/memoryRouter');
const { MEMORY_DOMAINS, getAllTypesFlattened } = require('../config/memoryTypes');

// ─── GET /api/context/query ──────────────────────────────────
// 统一上下文查询 — AI唯一入口
router.get('/query', (req, res) => {
  try {
    const { q, customerId, tags, topK } = req.query;
    const parsedTags = tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [];
    const parsedTopK = topK ? parseInt(topK, 10) : undefined;

    const context = buildContextQuery({
      query: q,
      customerId,
      tags: parsedTags,
      topK: parsedTopK,
    });

    res.json(context);
  } catch (err) {
    console.error('[context] query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/context/pools ──────────────────────────────────
// 获取记忆池摘要（四域统计）
router.get('/pools', (req, res) => {
  try {
    const summary = getPoolSummary();
    res.json({ data: summary });
  } catch (err) {
    console.error('[context] pools error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/context/types ──────────────────────────────────
// 获取完整记忆类型体系（前端分类展示用）
router.get('/types', (req, res) => {
  try {
    const types = getAllTypesFlattened();
    res.json({ data: { domains: MEMORY_DOMAINS, types } });
  } catch (err) {
    console.error('[context] types error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/context/customer/:id ───────────────────────────
// 客户上下文（向下兼容旧 /api/customers/:id/context）
router.get('/customer/:id', (req, res) => {
  try {
    const context = buildCustomerContext(req.params.id);
    if (!context) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    res.json(context);
  } catch (err) {
    console.error('[context] customer error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
