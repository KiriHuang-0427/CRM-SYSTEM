// server/services/ai/aiProvider.js
// Phase 6: 统一 AI Provider — 未来所有AI调用的统一入口

const aiProviderInterface = require('./aiProvider.interface');

/**
 * AI Provider 工厂（占位实现）
 * 当前使用 disabledProvider，未来替换为真实 AI Provider
 */
function getProvider() {
  // TODO: 根据环境变量选择 provider
  // const providerType = process.env.AI_PROVIDER || 'disabled';
  return require('./disabledProvider');
}

/**
 * 统一AI调用入口（占位）
 * 未来接入：
 *   POST /api/ai/chat
 *   POST /api/ai/coach
 *   POST /api/ai/weekly
 *   POST /api/ai/strategy
 */
async function callAI(params) {
  const provider = getProvider();
  return provider.call(params);
}

module.exports = { getProvider, callAI };
