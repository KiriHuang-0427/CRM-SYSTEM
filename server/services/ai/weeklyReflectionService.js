// server/services/ai/weeklyReflectionService.js
// 周报 AI 反思对话 — 多轮引导式反思，以提问代替总结

const db = require('../../database');
const { getProvider } = require('./aiProvider');

/**
 * 获取指定周的完整数据 + CRM 上下文
 */
function getWeekContext(weekId) {
  const report = db.prepare('SELECT * FROM weekly_reports WHERE week_id = ?').get(weekId);
  if (!report) return null;

  const focuses = db.prepare('SELECT text FROM weekly_focuses WHERE week_id = ? ORDER BY sort_order').all(weekId);
  const actions = db.prepare('SELECT text, completed FROM weekly_actions WHERE week_id = ? ORDER BY sort_order').all(weekId);
  const dailyNotes = db.prepare('SELECT day_key, content FROM weekly_daily_notes WHERE week_id = ?').all(weekId);

  // 上周重点（用于对比本周执行情况）
  const lastWeekReport = db.prepare(`
    SELECT week_id FROM weekly_reports WHERE week_id < ? ORDER BY week_id DESC LIMIT 1
  `).get(weekId);
  let lastWeekFocuses = [];
  if (lastWeekReport) {
    lastWeekFocuses = db.prepare('SELECT text FROM weekly_focuses WHERE week_id = ? ORDER BY sort_order').all(lastWeekReport.week_id).map(f => f.text);
  }

  // 近7天完成的待办
  const recentTodos = db.prepare(`
    SELECT text, completed_at FROM todos
    WHERE completed_at IS NOT NULL AND completed_at >= date('now', '-7 days')
    ORDER BY completed_at DESC LIMIT 8
  `).all();

  // CRM 上下文
  const pipelineChanges = db.prepare(`
    SELECT p.name, p.stage, p.pipe_stage, p.amount, c.name as customerName
    FROM pipeline_stages p JOIN customers c ON c.id = p.customer_id
    WHERE p.lost = 0 AND p.won = 0 ORDER BY p.pipe_stage DESC LIMIT 8
  `).all();

  const recentNotes = db.prepare(`
    SELECT n.content, c.name as customerName, n.created_at
    FROM notes n LEFT JOIN customers c ON c.id = n.customer_id
    WHERE n.created_at >= date('now', '-7 days')
    ORDER BY n.created_at DESC LIMIT 8
  `).all();

  // 近7天写入的记忆洞察（来自反思对话、业务操作等）
  const recentMemories = db.prepare(`
    SELECT memory_type, title, content FROM ai_memories
    WHERE is_archived = 0 AND created_at >= datetime('now', '-7 days')
      AND memory_type IN ('insight', 'meeting', 'weekly', 'coach')
    ORDER BY created_at DESC LIMIT 6
  `).all();

  const dayNames = { mon: '周一', tue: '周二', wed: '周三', thu: '周四', fri: '周五' };

  return {
    label: report.label,
    focuses: focuses.map(f => f.text),
    actions: actions.map(a => ({ text: a.text, done: !!a.completed })),
    completedCount: actions.filter(a => a.completed).length,
    totalActions: actions.length,
    dailyNotes: dailyNotes.map(d => `${dayNames[d.day_key] || d.day_key}: ${d.content || '无记录'}`),
    lastWeekFocuses,
    recentTodos: recentTodos.map(t => t.text),
    pipeline: pipelineChanges.map(p => `${p.customerName}: ${p.name} (阶段${p.pipe_stage}${p.amount ? '，' + p.amount + 'K' : ''})`),
    recentNotes: recentNotes.map(n => `${n.customerName || ''}: ${n.content?.slice(0, 80)}`),
    recentMemories: recentMemories.map(m => `[${m.memory_type}] ${m.title}: ${m.content?.slice(0, 60)}`),
  };
}

/**
 * 生成反思对话的下一轮回复
 * @param {string} weekId
 * @param {Array<{role: string, content: string}>} conversation - 对话历史
 */
async function generateReflection(weekId, conversation) {
  const provider = getProvider();
  if (!provider.apiKey) throw new Error('未配置 AI API Key');

  const ctx = getWeekContext(weekId);
  if (!ctx) throw new Error(`周报 ${weekId} 不存在`);

  // 读取用户交互哲学
  const philosophyRow = db.prepare(
    `SELECT content FROM ai_memories WHERE title LIKE '%AI教练交互哲学%' AND is_archived = 0 ORDER BY id DESC LIMIT 1`
  ).get();
  const philosophy = philosophyRow ? philosophyRow.content.slice(0, 400) : '';

  const isFirstRound = !conversation || conversation.length === 0;
  const userTurns = conversation ? conversation.filter(m => m.role === 'user').length : 0;
  const shouldConverge = userTurns >= 2; // 第 2 轮用户回答后开始收敛

  // 构建数据摘要
  const dataSummary = `
周报：${ctx.label}
本周重点：${ctx.focuses.join('；') || '未填写'}
下周计划：${ctx.actions.map(a => `${a.text}${a.done ? '（已完成）' : ''}`).join('；') || '无'}（共${ctx.totalActions}条，完成${ctx.completedCount}条）
每日记录：
${ctx.dailyNotes.join('\n') || '未填写'}
上周重点：${ctx.lastWeekFocuses.join('；') || '无'}
近7天完成的待办：${ctx.recentTodos.join('；') || '无'}
活跃Pipeline：${ctx.pipeline.join('；') || '无'}
最近笔记：${ctx.recentNotes.join('；') || '无'}
近期记忆洞察：${ctx.recentMemories.join('；') || '无'}`;

  let prompt;

  if (isFirstRound) {
    prompt = `基于以下本周工作数据，作为引导反思的导师，提出2-3个不同维度的反思问题来帮助用户回顾本周。

${dataSummary}

要求：
- 每个问题必须对应数据中的真实客户/项目/事件，不要泛泛而问
- 问题要覆盖不同维度，例如：
  • 客户工作维度：本周跟某个客户的推进中，有什么意外或惊喜？
  • 执行力维度：本周重点和实际完成之间的差距，背后是什么在起作用？
  • 判断力维度：Pipeline中某个商机的推进，你的判断依据是什么？
- 不要总结或评价，只提问
- 关注用户的感受、判断和决策过程，而非单纯的结果
- 每个问题简短有力，60字以内
- 用“1. 2. 3.”编号，语气自然亲切

只返回问题，不要任何前缀或解释。`;
  } else {
    // 构建对话历史文本
    const historyText = conversation.map(m =>
      m.role === 'user' ? `用户：${m.content}` : `AI：${m.content}`
    ).join('\n');

    prompt = `你是用户的周报复思导师。基于以下数据和对话历史，继续引导用户反思。

${dataSummary}

对话历史：
${historyText}

要求：
- 先简短回应用户刚才的分享（1-2句，不要重复用户的话）
- 然后换一个全新的角度提问，不要在上一个话题上继续深挖
- 还没讨论过的维度可以问：其他客户的工作、Pipeline进展、执行力、判断逻辑、下周准备等
- 问题要关联数据中的具体客户/项目/事件
- 控制在80字以内，保持自然对话感
${shouldConverge ? '- 对话已经进行了' + userTurns + '轮，请开始自然收敛。先对用户的分享做一个简短回应（2句话），然后提出最后一个反思性问题作为收尾' : ''}

只返回你的回复，不要任何前缀或解释。`;
  }

  const systemPrompt = '你是销售周报反思导师。你的角色是通过多角度提问帮助用户自我觉察，而非给出评价或建议。你的提问风格是广度发散、快速切换角度，而不是在一个话题上深挖。每轮对话应该覆盖不同的维度（客户工作、项目推进、执行力、判断力、下周准备等）。'
    + (philosophy ? '\n\n【核心原则】\n' + philosophy : '');

  const res = await provider.generate(prompt, systemPrompt);
  return { question: res.content.trim(), userTurns, shouldConverge };
}

/**
 * 结束反思 — 全面交付：客户识别 + 销售域写入 + 成长域写入 + 总结报告
 */
async function concludeReflection(weekId, conversation) {
  const provider = getProvider();
  if (!provider.apiKey) throw new Error('未配置 AI API Key');

  const ctx = getWeekContext(weekId);
  if (!ctx) throw new Error(`周报 ${weekId} 不存在`);

  // 获取客户列表用于匹配
  const customers = db.prepare('SELECT id, name FROM customers ORDER BY name').all();
  const customerList = customers.map(c => c.name).join('、');

  const historyText = conversation.map(m =>
    m.role === 'user' ? `用户：${m.content}` : `AI：${m.content}`
  ).join('\n');

  const prompt = `你是一个周报反思助手，需要完成以下四项任务并返回结构化 JSON。

## 周报数据
${ctx.label}

本周重点：${ctx.focuses.join('；') || '未填写'}
下周计划：${ctx.actions.map(a => `${a.text}`).join('；') || '无'}（共${ctx.totalActions}条）
每日记录：
${ctx.dailyNotes.join('\n') || '未填写'}
活跃Pipeline：${ctx.pipeline.join('；') || '无'}
最近笔记：${ctx.recentNotes.join('；') || '无'}

## 客户名单（用于匹配）
${customerList}

## 反思对话
${historyText || '无对话记录'}

## 四项任务

### 任务1：客户关联（salesEntries）
从每日记录中识别哪些内容涉及哪些客户，为每个客户提取本周相关摘要。
- 每条记录对应一个客户，可以多个客户
- 只提取有实质内容的（拜访、沟通、项目推进等），忽略日常琐碎
- 用简洁的语句概括该客户本周发生了什么

### 任务2：成长洞察（insights）
从反思对话中提取用户自己意识到的东西（不是AI的评价）
- 用用户的原话风格，不替用户美化
- 如果用户发现了行为模式或新认知，提取出来
- 2-3 条

### 任务3：本周总结（summary）
用 2-3 句话概括本周核心工作，客观描述，不加评价

### 任务4：下周建议（nextWeekSuggestions）
基于本周未完成行动和本周重点，建议 2-3 个下周重点关注事项

## 返回格式
用 JSON 返回：
{
  "salesEntries": [{ "customerName": string, "content": string }],
  "insights": [string],
  "feeling": string,
  "summary": string,
  "nextWeekSuggestions": [string]
}`;

  const res = await provider.generate(prompt, '你是周报复思助手。严格基于数据提取，不添加臆测内容。客户关联只写有实质工作内容的条目。');

  try {
    const jsonMatch = res.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      // 验证结构
      return {
        salesEntries: Array.isArray(parsed.salesEntries) ? parsed.salesEntries : [],
        insights: Array.isArray(parsed.insights) ? parsed.insights : [],
        feeling: parsed.feeling || '',
        summary: parsed.summary || '',
        nextWeekSuggestions: Array.isArray(parsed.nextWeekSuggestions) ? parsed.nextWeekSuggestions : [],
      };
    }
  } catch (e) {
    console.error('[concludeReflection] JSON parse failed:', e.message);
  }

  return { salesEntries: [], insights: [], feeling: '', summary: '', nextWeekSuggestions: [] };
}

module.exports = { generateReflection, concludeReflection };
