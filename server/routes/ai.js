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

module.exports = router;
