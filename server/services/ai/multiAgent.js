// server/services/ai/multiAgent.js
// Phase 7: 多 Agent 协同 — 未来多AI角色协作

const AGENT_ROLES = {
  coach: { label: '销售教练', description: '话术建议、拜访准备、谈判策略' },
  analyst: { label: '数据分析师', description: '销售数据解读、趋势分析' },
  strategist: { label: '战略顾问', description: '中长期规划、市场定位' },
  memory: { label: '记忆管家', description: '记忆检索、分类、归档建议' },
};

function getAvailableAgents() {
  return {
    phase: 'Phase7_MultiAgent',
    status: 'framework_reserved',
    message: '多Agent协同功能已预留框架，等待AI Provider接入后启用',
    roles: AGENT_ROLES,
  };
}

module.exports = { AGENT_ROLES, getAvailableAgents };
