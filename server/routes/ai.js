// server/routes/ai.js
// AI 接入路由 — 配置管理 + 测试

const express = require('express');
const router = express.Router();
const { getConfigSafe, saveAIConfig, getProvider } = require('../services/ai/aiProvider');
const validate = require('../middleware/validate');

// ─── GET /api/ai/config ──────────────────────────────────────
router.get('/config', (req, res) => {
  try {
    const config = getConfigSafe();
    res.json({ data: config });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/ai/config ─────────────────────────────────────
router.post('/config', validate({
  baseUrl: { required: true, maxLength: 200 },
}), (req, res) => {
  try {
    const { provider, apiKey, baseUrl, model, maxTokens, temperature } = req.body;
    saveAIConfig({ provider, apiKey: apiKey || undefined, baseUrl, model, maxTokens, temperature });
    res.json({ success: true, message: '配置已保存' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/ai/test ───────────────────────────────────────
router.post('/test', (req, res) => {
  const start = Date.now();
  try {
    const provider = getProvider();

    // 如果还是 disabledProvider
    if (typeof provider.generate !== 'function' || !provider.apiKey) {
      return res.status(400).json({
        success: false,
        error: '未配置 API Key，请先在设置中填入 Key',
        latency: Date.now() - start,
      });
    }

    // 异步测试 — 使用 express 的 async 支持
    (async () => {
      try {
        const result = await provider.test();
        res.json({
          success: true,
          latency: result.latency,
          model: result.model,
          response: result.response,
        });
      } catch (err) {
        res.json({
          success: false,
          error: err.message,
          latency: Date.now() - start,
        });
      }
    })();
  } catch (err) {
    res.json({
      success: false,
      error: err.message,
      latency: Date.now() - start,
    });
  }
});

// ─── POST /api/ai/chat ───────────────────────────────────────
// 简单对话（测试用）
router.post('/chat', validate({
  message: { required: true },
}), (req, res) => {
  try {
    const provider = getProvider();

    if (typeof provider.generate !== 'function' || !provider.apiKey) {
      return res.status(400).json({ error: '未配置 API Key' });
    }

    (async () => {
      try {
        const result = await provider.generate(req.body.message, req.body.context || '');
        res.json({ success: true, data: result });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    })();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/ai/coach ──────────────────────────────────────
// 销售教练 — 基于全量CRM数据AI生成7类教练建议
router.post('/coach', (req, res) => {
  try {
    const { generateCoachAdvice } = require('../services/ai/coachService');
    const categories = req.body.categories || null;

    (async () => {
      try {
        const results = await generateCoachAdvice(categories);
        res.json({ success: true, data: results });
      } catch (err) {
        res.status(500).json({ success: false, error: err.message });
      }
    })();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/ai/weekly-summary ──────────────────────────────
router.post('/weekly-summary', (req, res) => {
  try {
    const { generateSummary } = require('../services/ai/weeklySummaryService');
    const { weekId } = req.body;
    if (!weekId) return res.status(400).json({ error: 'weekId is required' });

    (async () => {
      try {
        const result = await generateSummary(weekId);
        res.json({ success: true, data: result });
      } catch (err) {
        res.status(500).json({ success: false, error: err.message });
      }
    })();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/ai/coach/feedback ──────────────────────────────
// 教练建议反馈 — 写入 L3 洞察层
router.post('/coach/feedback', (req, res) => {
  try {
    const { category, itemIndex, rating, note, coachContext } = req.body;
    if (!category || rating === undefined) {
      return res.status(400).json({ error: 'category and rating are required' });
    }

    const db = require('../database');
    const now = new Date().toISOString();

    // 写入 ai_memories 作为 insight
    const result = db.prepare(`
      INSERT INTO ai_memories (
        customer_id, memory_type, title, content, summary,
        importance, confidence, source_kind, occurred_at, tags, updated_at
      ) VALUES (?, 'insight', ?, ?, ?, ?, ?, 'system_feedback', ?, ?, ?)
    `).run(
      null,
      `反馈: ${category} #${itemIndex}`,
      `评分: ${rating}/5 | 备注: ${note || '无'} | 上下文: ${coachContext || ''}`,
      note || `用户对"${category}"建议评分${rating}/5`,
      rating >= 4 ? 5 : 3,
      1.0,
      now,
      JSON.stringify(['coach_feedback', category]),
      now
    );

    // 同时记录到 ai_query_log
    db.prepare(`
      INSERT INTO ai_query_log (query, matched_pools, result_count, latency_ms, source, created_at)
      VALUES (?, ?, ?, 0, 'coach_feedback', ?)
    `).run(
      `Feedback: ${category} rating=${rating}`,
      'coach_feedback',
      1,
      now
    );

    res.json({ success: true, id: result.lastInsertRowid });
  } catch (err) {
    console.error('[ai] feedback error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/ai/coach/feedback ────────────────────────────────
// 获取历史反馈
router.get('/coach/feedback', (req, res) => {
  try {
    const db = require('../database');
    const rows = db.prepare(`
      SELECT id, title, content, summary, importance, occurred_at as occurredAt
      FROM ai_memories
      WHERE memory_type = 'insight' AND source_kind = 'system_feedback'
      ORDER BY occurred_at DESC LIMIT 30
    `).all();
    res.json({ data: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/ai/memory ────────────────────────────────────
// 手动写入 AI域记忆（感悟/决策/改进点）
router.post('/memory', (req, res) => {
  try {
    const { memoryType, title, content, importance } = req.body;
    if (!content || !memoryType) {
      return res.status(400).json({ error: 'memoryType 和 content 是必填项' });
    }
    const db = require('../database');
    const now = new Date().toISOString();
    const result = db.prepare(`
      INSERT INTO ai_memories (
        customer_id, memory_type, title, content, summary,
        importance, confidence, source_kind, occurred_at, tags, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, 1.0, 'manual', ?, ?, ?)
    `).run(
      null,
      memoryType,
      title || content.slice(0, 50),
      content,
      content.slice(0, 100),
      importance || 3,
      now,
      JSON.stringify(['manual', memoryType]),
      now
    );
    res.status(201).json({ success: true, id: result.lastInsertRowid });
  } catch (err) {
    console.error('[ai] memory write error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
