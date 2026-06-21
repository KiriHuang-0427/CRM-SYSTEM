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

// ─── POST /api/ai/weekly-extract ──────────────────────────────
// 每日记录智能提取 — 从每日记录 + CRM 数据中提取重点和行动项
router.post('/weekly-extract', (req, res) => {
  const { weekId, dayKey, content } = req.body;
  if (!weekId || !dayKey) return res.status(400).json({ error: 'weekId and dayKey are required' });
  (async () => {
    try {
      const { extractSuggestions } = require('../services/ai/weeklyExtractService');
      const result = await extractSuggestions(weekId, dayKey, content);
      res.json({ success: true, data: result });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  })();
});

// ─── POST /api/ai/weekly-reflection ──────────────────────────────
// 周报多轮反思对话 — AI 引导用户反思本周工作
router.post('/weekly-reflection', (req, res) => {
  const { weekId, conversation } = req.body;
  if (!weekId) return res.status(400).json({ error: 'weekId is required' });
  (async () => {
    try {
      const { generateReflection } = require('../services/ai/weeklyReflectionService');
      const result = await generateReflection(weekId, conversation || []);
      res.json({ success: true, data: result });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  })();
});

// ─── POST /api/ai/weekly-reflection/conclude ──────────────────────
// 结束反思 — 全面交付：客户关联写销售域 + 洞察写成长域 + 总结报告
router.post('/weekly-reflection/conclude', (req, res) => {
  const { weekId, conversation } = req.body;
  if (!weekId) return res.status(400).json({ error: 'weekId is required' });
  (async () => {
    try {
      const { concludeReflection } = require('../services/ai/weeklyReflectionService');
      const result = await concludeReflection(weekId, conversation || []);
      const db = require('../database');
      const now = new Date().toISOString();

      // ── 写入销售域：按客户拆分 ──────────────────
      const salesWritten = [];
      const customerMap = db.prepare('SELECT id, name FROM customers').all();
      const nameToId = {};
      customerMap.forEach(c => { nameToId[c.name] = c.id; });

      for (const entry of (result.salesEntries || [])) {
        const customerId = nameToId[entry.customerName] || null;
        if (!entry.content || entry.content.trim().length < 3) continue;
        const title = `${entry.customerName}：本周动态`;
        db.prepare(`
          INSERT INTO ai_memories (customer_id, memory_type, title, content, summary, importance, confidence, source_kind, occurred_at, tags, updated_at)
          VALUES (?, 'meeting', ?, ?, ?, 5, 1.0, 'system_reflection', ?, ?, ?)
        `).run(customerId, title, entry.content, entry.content.slice(0, 100), now, `weekly,${weekId}`, now);
        salesWritten.push({ customerName: entry.customerName, customerId, title, content: entry.content });
      }

      // ── 写入成长域：反思洞察 ──────────────────
      const growthWritten = [];
      if ((result.insights || []).length > 0 || result.feeling) {
        const insightContent = `反思洞察[${weekId}]\n${(result.insights || []).map((s, i) => `${i + 1}. ${s}`).join('\n')}\n核心感受：${result.feeling || '未记录'}`;
        const insertResult = db.prepare(`
          INSERT INTO ai_memories (customer_id, memory_type, title, content, summary, importance, confidence, source_kind, occurred_at, tags, updated_at)
          VALUES (?, 'insight', ?, ?, ?, 7, 1.0, 'system_reflection', ?, ?, ?)
        `).run(null, `周报复思 - ${weekId}`, insightContent, (result.insights || []).join('；').slice(0, 100), now, 'weekly,reflection,growth', now);
        growthWritten.push({ type: 'insight', title: `周报复思 - ${weekId}`, memoryId: insertResult.lastInsertRowid });
      }

      res.json({
        success: true,
        data: {
          ...result,
          salesWritten,
          growthWritten,
        }
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  })();
});

// ─── POST /api/ai/coach/feedback ──────────────────────────────
// 教练建议反馈 — 写入 L3 成长域（coach类型）
router.post('/coach/feedback', (req, res) => {
  try {
    const { category, itemIndex, rating, note, coachContext } = req.body;
    if (!category || rating === undefined) {
      return res.status(400).json({ error: 'category and rating are required' });
    }

    const db = require('../database');
    const now = new Date().toISOString();
    const dir = rating >= 4 ? '采纳' : '拒绝';
    const reason = note ? `原因：${note}` : '未填写原因';

    // 解析coachContext提取原始建议
    let originalItem = '';
    try {
      const ctx = JSON.parse(coachContext || '{}');
      originalItem = ctx.originalItem || '';
    } catch {}

    // 提取原始建议的简短描述（用于标题和摘要）
    const briefDesc = originalItem ? originalItem.slice(0, 60) : '';
    const titleStr = briefDesc
      ? `教练反馈[${dir}]: ${briefDesc}`
      : `教练反馈[${dir}]: ${category} #${itemIndex}`;

    // 写入 ai_memories 作为 coach（成长域-销售教练，L3层）
    const result = db.prepare(`
      INSERT INTO ai_memories (
        customer_id, memory_type, title, content, summary,
        importance, confidence, source_kind, occurred_at, tags, updated_at
      ) VALUES (?, 'coach', ?, ?, ?, ?, ?, 'system_feedback', ?, ?, ?)
    `).run(
      null,
      titleStr,
      `类别: ${category} | 评分: ${rating}/5 | ${dir} | ${reason}${originalItem ? ' | 原始建议: ' + originalItem.slice(0, 200) : ''}`,
      briefDesc || note || `用户对"${category}"建议${dir}`,
      rating >= 4 ? 5 : 3,
      1.0,
      now,
      JSON.stringify(['coach_feedback', category, dir]),
      now
    );

    // 同时记录到 ai_query_log
    db.prepare(`
      INSERT INTO ai_query_log (query, matched_pools, result_count, latency_ms, source, created_at)
      VALUES (?, ?, ?, 0, 'coach_feedback', ?)
    `).run(
      `Feedback: ${category} rating=${rating} ${dir}${note ? ' reason=' + note : ''}`,
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
      WHERE (memory_type = 'coach' OR memory_type = 'insight') AND source_kind = 'system_feedback'
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

// ─── GET /api/ai/audit ──────────────────────────────────────
router.get('/audit', (req, res) => {
  try {
    const { audit } = require('../services/ai/memoryAudit');
    const result = audit();
    res.json({ data: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/ai/agent/report ──────────────────────────────
router.post('/agent/report', (req, res) => {
  try {
    const { audit } = require('../services/ai/memoryAudit');
    const { getProvider } = require('../services/ai/aiProvider');
    const provider = getProvider();
    if (!provider.apiKey) return res.status(400).json({ error: '未配置 AI Key' });

    const data = audit();
    const prompt = `基于以下四域审计数据，生成一份简短的战术报告（100字内）：
总记忆: ${data.totalMemories}
各域: ${JSON.stringify(data.domains)}
7天增长: ${JSON.stringify(data.weekGrowth)}
反馈采纳率: ${data.feedback.adoptionRate || 0}%`;

    (async () => {
      try {
        const result = await provider.generate(prompt, '你是CRM数据分析师，给出简洁洞察。');
        res.json({ success: true, data: { report: result.content, audit: data } });
      } catch (e) {
        res.status(500).json({ error: e.message });
      }
    })();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/ai/memory-pool ──────────────────────────────
// 记忆池管理：查询最新记忆条目
router.get('/memory-pool', (req, res) => {
  try {
    const db = require('../database');
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    const domain = req.query.domain;
    const { MEMORY_DOMAINS } = require('../config/memoryTypes');

    let typeFilter = '';
    let totalTypeFilter = '';
    if (domain && MEMORY_DOMAINS[domain]) {
      const types = MEMORY_DOMAINS[domain].types.map(t => typeof t === 'string' ? t : t.value);
      const typeList = types.map(t => `'${t}'`).join(',');
      typeFilter = `AND m.memory_type IN (${typeList})`;
      totalTypeFilter = `AND memory_type IN (${typeList})`;
    }

    const rows = db.prepare(`
      SELECT m.id, m.memory_type, m.title, m.content, m.summary,
        m.importance, m.source_kind, m.source_table, m.occurred_at,
        m.is_archived, c.name as customerName
      FROM ai_memories m
      LEFT JOIN customers c ON c.id = m.customer_id
      WHERE 1=1 ${typeFilter}
      ORDER BY m.created_at DESC
      LIMIT ?
    `).all(limit);

    const total = db.prepare(`SELECT COUNT(*) as cnt FROM ai_memories WHERE is_archived = 0 ${totalTypeFilter}`).get();
    res.json({ data: rows, total: total.cnt, limit });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── DELETE /api/ai/memory/:id ────────────────────────────
router.delete('/memory/:id', (req, res) => {
  try {
    const db = require('../database');
    const result = db.prepare('DELETE FROM ai_memories WHERE id = ?').run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: '未找到该记录' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── DELETE /api/ai/memory-pool/batch ────────────────────
router.delete('/memory-pool/batch', (req, res) => {
  try {
    const db = require('../database');
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ error: 'ids数组不能为空' });
    const placeholders = ids.map(() => '?').join(',');
    const result = db.prepare(`DELETE FROM ai_memories WHERE id IN (${placeholders})`).run(...ids);
    res.json({ success: true, deleted: result.changes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
