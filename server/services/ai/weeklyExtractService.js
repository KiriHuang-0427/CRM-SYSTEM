// server/services/ai/weeklyExtractService.js
// 每日记录智能提取 — 基于每日记录内容 + CRM 数据，提取本周重点和行动项

const db = require('../../database');
const { getProvider } = require('./aiProvider');

/**
 * 从每日记录 + CRM 上下文中提取重点和行动项建议
 */
async function extractSuggestions(weekId, dayKey, noteContent) {
  const provider = getProvider();
  if (!provider.apiKey) throw new Error('未配置 AI API Key');
  if (!noteContent || noteContent.trim().length < 5) return { focuses: [], actions: [] };

  // 读取本周已有数据（避免重复建议）
  const existingFocuses = db.prepare(
    'SELECT text FROM weekly_focuses WHERE week_id = ? ORDER BY sort_order'
  ).all(weekId).map(f => f.text);

  const existingActions = db.prepare(
    'SELECT text FROM weekly_actions WHERE week_id = ? ORDER BY sort_order'
  ).all(weekId).map(a => a.text);

  // CRM 上下文：本周相关的 pipeline、客户拜访、待办
  const pipelineCtx = db.prepare(`
    SELECT p.name, p.stage, p.pipe_stage, c.name as customerName
    FROM pipeline_stages p JOIN customers c ON c.id = p.customer_id
    WHERE p.lost = 0 AND p.won = 0
    ORDER BY p.pipe_stage DESC LIMIT 10
  `).all();

  const recentNotes = db.prepare(`
    SELECT n.content, c.name as customerName
    FROM notes n LEFT JOIN customers c ON c.id = n.customer_id
    WHERE n.created_at >= date('now', '-7 days')
    ORDER BY n.created_at DESC LIMIT 10
  `).all();

  const pendingTodos = db.prepare(`
    SELECT t.text, c.name as customerName
    FROM todos t LEFT JOIN customers c ON c.id = t.customer_id
    WHERE t.completed = 0
    ORDER BY t.created_at DESC LIMIT 10
  `).all();

  const dayNames = { mon: '周一', tue: '周二', wed: '周三', thu: '周四', fri: '周五' };
  const dayLabel = dayNames[dayKey] || dayKey;

  const prompt = `基于用户${dayLabel}的工作记录和当前CRM数据，提取可能的"本周重点"和"下周计划"。

${dayLabel}记录：
${noteContent}

当前活跃Pipeline：
${pipelineCtx.map(p => `${p.customerName}: ${p.name} (阶段${p.pipe_stage})`).join('；') || '无'}

最近7天笔记：
${recentNotes.map(n => `${n.customerName || ''}: ${n.content?.slice(0, 60)}`).join('；') || '无'}

未完成待办：
${pendingTodos.map(t => `${t.customerName || ''}: ${t.text}`).join('；') || '无'}

已有本周重点（不要重复）：${existingFocuses.join('；') || '无'}
已有下周计划（不要重复）：${existingActions.join('；') || '无'}

请从记录中提取：
1. focuses: 可以从记录中归纳的本周重点（1-2条，简洁明确，如"推进XX客户方案评审"）
2. actions: 下周具体计划事项（1-3条，含对象/动作，如"联系XX确认报价"）

如果记录内容太简略无法提取，返回空数组。用 JSON 返回：{ focuses: string[], actions: string[] }`;

  const res = await provider.generate(prompt, '你是销售周报助手，从工作记录中提取关键重点和行动项。只返回JSON，不要多余文字。');

  try {
    const jsonMatch = res.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        focuses: (parsed.focuses || []).filter(s => typeof s === 'string' && s.trim()),
        actions: (parsed.actions || []).filter(s => typeof s === 'string' && s.trim()),
      };
    }
  } catch {}

  return { focuses: [], actions: [] };
}

module.exports = { extractSuggestions };
