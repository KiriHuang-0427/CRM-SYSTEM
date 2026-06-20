// server/services/ai/memoryAudit.js
// 四域健康检查 — 定期审计数据增长、覆盖率、反馈质量

const db = require('../../database');
const { MEMORY_DOMAINS } = require('../../config/memoryTypes');

/**
 * 审计四域健康状况
 */
function audit() {
  const totalMemories = db.prepare('SELECT COUNT(*) as c FROM ai_memories WHERE is_archived = 0').get().c;

  const domains = {};
  for (const [key, domain] of Object.entries(MEMORY_DOMAINS)) {
    const types = domain.types.map(t => t.value);
    const placeholders = types.map(() => '?').join(',');
    const row = db.prepare(
      `SELECT COUNT(*) as c FROM ai_memories WHERE is_archived = 0 AND memory_type IN (${placeholders})`
    ).get(...types);
    domains[key] = { label: domain.label, count: row.c, layer: domain.layer };
  }

  // 近期增长（7天）
  const weekGrowth = db.prepare(`
    SELECT memory_type, COUNT(*) as c FROM ai_memories
    WHERE is_archived = 0 AND created_at >= datetime('now', '-7 days')
    GROUP BY memory_type ORDER BY c DESC
  `).all();

  // 反馈采纳率
  const feedback = db.prepare(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN importance >= 4 THEN 1 ELSE 0 END) as positive,
      SUM(CASE WHEN importance < 4 THEN 1 ELSE 0 END) as negative
    FROM ai_memories
    WHERE memory_type = 'insight' AND source_kind = 'system_feedback'
      AND created_at >= datetime('now', '-7 days')
  `).get();

  const adoptionRate = feedback.total > 0
    ? Math.round(feedback.positive / feedback.total * 100)
    : null;

  // 自动 vs 手动
  const autoCount = db.prepare("SELECT COUNT(*) as c FROM ai_memories WHERE source_kind = 'auto' AND is_archived = 0").get().c;
  const manualCount = db.prepare("SELECT COUNT(*) as c FROM ai_memories WHERE source_kind IN ('manual','system_feedback') AND is_archived = 0").get().c;

  return {
    totalMemories,
    domains,
    weekGrowth,
    feedback: { total: feedback.total, positive: feedback.positive, negative: feedback.negative, adoptionRate },
    autoVsManual: { auto: autoCount, manual: manualCount },
    generatedAt: new Date().toISOString(),
  };
}

module.exports = { audit };
