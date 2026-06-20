// server/services/ai/weeklyAI.js
// Phase 4: Weekly AI — 周报智能总结（未来AI接入后启用）

function generateWeeklySummary(weekId) {
  return {
    phase: 'Phase4_WeeklyAI',
    status: 'framework_reserved',
    message: '周报AI功能已预留框架，等待AI Provider接入后启用',
    weekId,
  };
}

module.exports = { generateWeeklySummary };
