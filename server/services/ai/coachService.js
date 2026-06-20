// server/services/ai/coachService.js
// 销售教练服务 — 读取全量CRM上下文，AI生成教练建议

const db = require('../../database');
const { getProvider } = require('./aiProvider');
const { buildContextQuery } = require('../contextBuilder');

/**
 * 聚合全量CRM概览数据
 */
function buildOverview() {
  // 客户概览
  const customers = db.prepare(`
    SELECT c.id, c.name, c.color, c.industry, c.comp as competitor,
      c.sales_cy_ytd as cyYtd, c.sales_py as py, c.risk, c.last_visit as lastVisit
    FROM customers c ORDER BY c.sales_cy_ytd DESC
  `).all();

  // 活跃 Pipeline
  const activePipeline = db.prepare(`
    SELECT p.name, p.stage, p.amount, p.pipe_stage, c.name as customerName, c.color
    FROM pipeline_stages p JOIN customers c ON c.id = p.customer_id
    WHERE p.lost = 0 AND p.won = 0 ORDER BY p.pipe_stage DESC
  `).all();

  // 风险预警
  const risks = db.prepare(`
    SELECT m.title, m.content, m.importance, c.name as customerName
    FROM ai_memories m LEFT JOIN customers c ON c.id = m.customer_id
    WHERE m.memory_type = 'risk' AND m.is_archived = 0
    ORDER BY m.importance DESC LIMIT 10
  `).all();

  // 竞品分布
  const competitors = db.prepare(`
    SELECT m.title, m.content, m.importance, c.name as customerName
    FROM ai_memories m LEFT JOIN customers c ON c.id = m.customer_id
    WHERE m.memory_type = 'competitor' AND m.is_archived = 0
    ORDER BY m.importance DESC LIMIT 10
  `).all();

  // 最近记忆
  const recentMemories = db.prepare(`
    SELECT m.memory_type, m.title, m.content, m.importance, c.name as customerName
    FROM ai_memories m LEFT JOIN customers c ON c.id = m.customer_id
    WHERE m.is_archived = 0 AND m.customer_id IS NOT NULL
    ORDER BY m.created_at DESC LIMIT 15
  `).all();

  // 待办
  const pendingTodos = db.prepare(`
    SELECT t.text, t.deadline, t.created_at, c.name as customerName
    FROM todos t LEFT JOIN customers c ON c.id = t.customer_id
    WHERE t.completed = 0 ORDER BY t.created_at DESC LIMIT 10
  `).all();

  // ─── V26.07 新增数据源 ──────────────────────────

  // 周报（最近4周）
  const weeklyReports = db.prepare(`
    SELECT wr.week_id, wr.label,
      (SELECT GROUP_CONCAT(wf.text, '；') FROM weekly_focuses wf WHERE wf.week_id = wr.week_id) as focuses,
      (SELECT GROUP_CONCAT(wa.text, '；') FROM weekly_actions wa WHERE wa.week_id = wr.week_id) as actions
    FROM weekly_reports wr ORDER BY wr.week_id DESC LIMIT 4
  `).all();

  // 速记笔记（最近 90 天，最近 20 条）
  const recentNotes = db.prepare(`
    SELECT n.content, n.created_at, c.name as customerName
    FROM notes n LEFT JOIN customers c ON c.id = n.customer_id
    WHERE n.created_at >= date('now', '-90 days')
    ORDER BY n.created_at DESC LIMIT 20
  `).all();

  // L3 洞察层（insight + coach + learning + market）
  const l3Insights = db.prepare(`
    SELECT m.memory_type, m.title, m.content, m.importance, c.name as customerName
    FROM ai_memories m LEFT JOIN customers c ON c.id = m.customer_id
    WHERE m.memory_type IN ('insight', 'coach', 'learning', 'market') AND m.is_archived = 0
    ORDER BY m.importance DESC, m.created_at DESC LIMIT 10
  `).all();

  // L4 战略层（strategy_plan）
  const l4Strategy = db.prepare(`
    SELECT m.title, m.content, m.importance, c.name as customerName
    FROM ai_memories m LEFT JOIN customers c ON c.id = m.customer_id
    WHERE m.memory_type = 'strategy_plan' AND m.is_archived = 0
    ORDER BY m.importance DESC, m.created_at DESC LIMIT 5
  `).all();

  return {
    customerCount: customers.length,
    customers: customers.map(c => `${c.name}(${c.industry || '未知行业'}，今年${c.cyYtd || 0}K${c.risk ? '，风险:' + c.risk : ''}${c.lastVisit ? '，上次拜访:' + c.lastVisit : ''})`).join('；'),
    activePipeline: activePipeline.map(p => `${p.customerName}:${p.name}(阶段${p.pipe_stage}，${p.amount || '金额未定'})`).join('；'),
    risks: risks.map(r => `${r.customerName || '未知客户'}:${r.content}（重要性${r.importance}）`).join('；'),
    competitors: competitors.map(c => `${c.customerName || '未知客户'}:${c.content}`).join('；'),
    recentMemories: recentMemories.map(m => `[${m.memory_type}]${m.customerName}:${m.title || m.content?.slice(0, 50)}`).join('；'),
    pendingTodos: pendingTodos.map(t => `${t.customerName || ''}:${t.text}${t.deadline ? '(截止' + t.deadline + ')' : ''}`).join('；'),
    // 新增数据源
    weeklyReports: weeklyReports.map(w => `${w.label}: 重点=${w.focuses || '无'}；行动=${w.actions || '无'}`).join('\n'),
    recentNotes: recentNotes.map(n => `${n.customerName || ''}: ${n.content?.slice(0, 80)}`).join('；'),
    l3Insights: l3Insights.map(i => `[${i.memory_type}]${i.customerName || '全局'}:${i.content || i.title}`).join('；'),
    l4Strategy: l4Strategy.map(s => `${s.customerName || '全局'}:${s.content || s.title}`).join('；'),
  };
}

/**
 * AI生成教练建议
 */
async function generateCoachAdvice(categories) {
  const provider = getProvider();
  
  // 检查是否 disabled
  if (!provider.apiKey) {
    throw new Error('未配置AI API Key');
  }

  const overview = buildOverview();

  // ─── 读取最近30条反馈作为上下文 ──────────
  const recentFeedback = db.prepare(`
    SELECT title, content, summary FROM ai_memories
    WHERE memory_type = 'insight' AND source_kind = 'system_feedback'
    ORDER BY occurred_at DESC LIMIT 30
  `).all();
  const feedbackCtx = recentFeedback.length > 0
    ? '最近用户反馈：\n' + recentFeedback.map(f => `- ${f.title}: ${f.summary || f.content?.slice(0, 120)}`).join('\n')
    : '';

  const results = {};

  for (const cat of categories || ['suggestions', 'scripts', 'objections', 'upward', 'competitor', 'risks', 'checklist']) {
    const prompt = buildPrompt(cat, overview);
    try {
      const res = await provider.generate(prompt, '你是西门子OEM南京区域销售教练，用户是外勤销售。基于真实CRM数据给出精准、可执行的建议。每条建议控制在80字以内。' + (feedbackCtx ? '参考用户的反馈历史，避免重复之前的无效建议：' + feedbackCtx : ''));
      results[cat] = {
        title: CATEGORY_LABELS[cat],
        content: parseAIResponse(res.content),
        generatedAt: new Date().toISOString(),
      };
    } catch (e) {
      results[cat] = { title: CATEGORY_LABELS[cat], content: [], error: e.message };
    }
  }

  return results;
}

const CATEGORY_LABELS = {
  suggestions: '当前建议',
  scripts: '话术训练',
  objections: '拒绝应对',
  upward: '向上管理',
  competitor: '竞品对抗',
  risks: '风险预警',
  checklist: '拜访检查',
};

function buildPrompt(category, data) {
  const prompts = {
    suggestions: `基于以下CRM数据，给出当前最重要的3条销售行动建议。聚焦：哪些客户需要立即跟进、哪个Pipeline需要推动、什么风险需要化解。

客户总览：${data.customers}
活跃Pipeline：${data.activePipeline}
风险：${data.risks}
待办：${data.pendingTodos}
周报摘要：${data.weeklyReports || '暂无周报数据'}
速记笔记：${data.recentNotes || '暂无笔记数据'}

请用JSON数组返回，每项包含 action 和 reason 两个字段。`,

    scripts: `基于以下CRM数据，生成3个分级的催单话术模板（轻度提醒/中度紧迫/重度推进），结合当前活跃客户的真实项目名称和阶段。

客户：${data.customers}
活跃Pipeline：${data.activePipeline}
最近笔记：${data.recentNotes || '无'}

请用JSON数组返回，每项包含 level(轻度/中度/重度) 和 text 两个字段。`,

    objections: `基于以下CRM竞品和风险数据，生成3个客户常见拒绝场景的应对话术（如：价格太高/再考虑考虑/已经用竞品）。参考L3洞察和历史经验。

竞品：${data.competitors}
风险：${data.risks}
L3洞察：${data.l3Insights || '暂无洞察数据'}

请用JSON数组返回，每项包含 scenario(拒绝场景) 和 text(应对话术) 两个字段。`,

    upward: `基于以下CRM数据，生成3个向上管理话术（向老板争取：价格折扣/样机支持/高层出面），结合真实客户数据。参考L4战略方向。

客户：${data.customers}
Pipeline：${data.activePipeline}
L4战略：${data.l4Strategy || '暂无战略数据'}

请用JSON数组返回，每项包含 scenario(争取什么) 和 text(话术) 两个字段。`,

    competitor: `基于以下竞品数据，生成3条针对当前竞品的差异化对抗策略。参考L3市场洞察。

竞品：${data.competitors}
客户：${data.customers}
市场洞察：${data.l3Insights || '暂无'}

请用JSON数组返回，每项包含 competitor(竞品) strategy(应对策略) 两个字段。`,

    risks: `基于以下风险和客户数据，列出当前最需要关注的3个风险预警，附带建议应对措施。参考L4战略方向。

风险：${data.risks}
Pipeline：${data.activePipeline}
L4战略：${data.l4Strategy || '暂无'}

请用JSON数组返回，每项包含 risk(风险) action(应对) 两个字段。`,

    checklist: `基于以下待办、记忆、周报和笔记数据，生成一个5项的拜访前检查清单。每项是拜访前需要确认的具体事项。

待办：${data.pendingTodos}
最近记忆：${data.recentMemories}
周报：${data.weeklyReports || '无'}
速记笔记：${data.recentNotes || '无'}

请用JSON数组返回5项，每项是纯文本的检查事项。`,
  };

  return prompts[category] || prompts.suggestions;
}

function parseAIResponse(content) {
  try {
    // 尝试提取JSON
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
  } catch {}
  // fallback: 按行拆分
  return content.split('\n').filter(l => l.trim()).map(l => l.replace(/^\d+[\.\)]\s*/, '').trim());
}

module.exports = { generateCoachAdvice, buildOverview };
