// server/services/ai/weeklySummaryService.js
// 周报 AI 智能总结 — 读取周报数据，AI 生成总结

const db = require('../../database');
const { getProvider } = require('./aiProvider');

/**
 * 获取指定周数据
 */
function getWeekData(weekId) {
  const report = db.prepare('SELECT * FROM weekly_reports WHERE week_id = ?').get(weekId);
  if (!report) return null;

  const focuses = db.prepare('SELECT text FROM weekly_focuses WHERE week_id = ? ORDER BY sort_order').all(weekId);
  const actions = db.prepare('SELECT text, completed FROM weekly_actions WHERE week_id = ? ORDER BY sort_order').all(weekId);
  const dailyNotes = db.prepare('SELECT day_key, content FROM weekly_daily_notes WHERE week_id = ?').all(weekId);

  return {
    weekId: report.week_id,
    label: report.label,
    focuses: focuses.map(f => f.text),
    actions: actions.map(a => ({ text: a.text, done: !!a.completed })),
    dailyNotes: dailyNotes.map(d => `${d.day_key}: ${d.content || '无'}`),
    completedCount: actions.filter(a => a.completed).length,
    totalActions: actions.length,
  };
}

/**
 * 生成单周 AI 总结
 */
async function generateSummary(weekId) {
  const provider = getProvider();
  if (!provider.apiKey) throw new Error('未配置 AI API Key');

  const data = getWeekData(weekId);
  if (!data) throw new Error(`周报 ${weekId} 不存在`);

  const dayNames = { mon: '周一', tue: '周二', wed: '周三', thu: '周四', fri: '周五' };
  const dailyLines = data.dailyNotes.map(d => {
    const [key, content] = d.split(': ');
    return `${dayNames[key] || key}: ${content}`;
  }).join('\n');

  const prompt = `基于本周工作记录，生成一个简洁的周报总结。包含：
1. 本周亮点（2-3条关键成果）
2. 行动完成情况（${data.completedCount}/${data.totalActions} 已完成）
3. 下周建议（2条重点关注）

周报：${data.label}
本周重点：${data.focuses.join('；') || '未填写'}
行动清单（含完成状态）：${data.actions.map(a => `${a.done ? '✅' : '⬜'} ${a.text}`).join('；') || '无'}
每日记录：${dailyLines || '未填写'}

请用 JSON 返回，格式：{ highlights: string[], completion: string, suggestions: string[] }`;

  const res = await provider.generate(prompt, '你是销售周报助手，用简洁专业的语言总结销售工作周报。每条建议控制在60字以内。');

  try {
    const jsonMatch = res.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
  } catch {}

  return { highlights: [], completion: '', suggestions: [], raw: res.content };
}

/**
 * 生成多周趋势总结
 */
async function generateTrendSummary(limit = 4) {
  const provider = getProvider();
  if (!provider.apiKey) throw new Error('未配置 AI API Key');

  const reports = db.prepare('SELECT week_id, label FROM weekly_reports ORDER BY week_id DESC LIMIT ?').all(limit);
  if (reports.length === 0) throw new Error('暂无周报数据');

  const weeksData = [];
  for (const r of reports) {
    const data = getWeekData(r.week_id);
    if (data) weeksData.push(data);
  }

  const lines = weeksData.map(w =>
    `${w.label}: 重点=${w.focuses.join('；') || '无'}；行动=${w.completedCount}/${w.totalActions} 完成`
  ).join('\n');

  const prompt = `基于最近 ${weeksData.length} 周的工作记录，分析趋势并生成总结：

${lines}

请用 JSON 返回，格式：{
  trend: string (1句话趋势总结),
  strengths: string[] (2条做得好的),
  improvements: string[] (2条需要改进的),
  recommendation: string (1条最重要建议)
}`;

  const res = await provider.generate(prompt, '你是销售数据分析师，基于周报数据给出趋势洞察。');

  try {
    const jsonMatch = res.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
  } catch {}

  return { trend: '', strengths: [], improvements: [], recommendation: '', raw: res.content };
}

module.exports = { generateSummary, generateTrendSummary, getWeekData };
