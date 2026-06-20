// server/services/ai/aiProvider.js
// 统一 AI Provider 工厂 — Phase 6
// 从 ai_system_state 表读取配置，动态创建 Provider 实例

const db = require('../../database');
const OpenAIProvider = require('./openaiProvider');

let cachedProvider = null;
let cachedConfig = null;

/**
 * 从 DB 读取 AI 配置
 */
function getAIConfig() {
  const keys = ['ai_provider', 'ai_apiKey', 'ai_baseUrl', 'ai_model', 'ai_maxTokens', 'ai_temperature'];
  const config = {};
  for (const key of keys) {
    const row = db.prepare('SELECT value FROM ai_system_state WHERE key = ?').get(key);
    config[key] = row?.value || null;
  }
  return config;
}

/**
 * 保存 AI 配置到 DB
 */
function saveAIConfig(config) {
  const upsert = db.prepare(
    'INSERT INTO ai_system_state (key, value, updated_at) VALUES (?, ?, datetime(\'now\')) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime(\'now\')'
  );
  const map = {
    ai_provider: config.provider,
    ai_apiKey: config.apiKey,
    ai_baseUrl: config.baseUrl,
    ai_model: config.model,
    ai_maxTokens: String(config.maxTokens || 4096),
    ai_temperature: String(config.temperature ?? 0.7),
  };
  for (const [key, value] of Object.entries(map)) {
    if (value !== undefined && value !== null) {
      upsert.run(key, value);
    }
  }
  cachedProvider = null;
  cachedConfig = null;
}

/**
 * 获取当前 Provider 实例
 * 如果配置了 apiKey 则返回真实 Provider，否则返回 disabledProvider
 */
function getProvider() {
  const config = getAIConfig();

  // 检查配置是否变更
  if (cachedProvider && cachedConfig && 
      cachedConfig.ai_apiKey === config.ai_apiKey &&
      cachedConfig.ai_baseUrl === config.ai_baseUrl &&
      cachedConfig.ai_model === config.ai_model) {
    return cachedProvider;
  }

  cachedConfig = config;

  if (!config.ai_apiKey) {
    cachedProvider = require('./disabledProvider');
    return cachedProvider;
  }

  cachedProvider = new OpenAIProvider({
    apiKey: config.ai_apiKey,
    baseUrl: config.ai_baseUrl || 'https://api.deepseek.com/v1',
    model: config.ai_model || 'deepseek-chat',
    maxTokens: parseInt(config.ai_maxTokens, 10) || 4096,
    temperature: parseFloat(config.ai_temperature) || 0.7,
  });

  return cachedProvider;
}

/**
 * 获取当前配置（脱敏）
 */
function getConfigSafe() {
  const config = getAIConfig();
  const usage = cachedProvider?.usage || { promptTokens: 0, completionTokens: 0, totalTokens: 0, calls: 0 };
  return {
    provider: config.ai_provider || '未配置',
    baseUrl: config.ai_baseUrl || 'https://api.deepseek.com/v1',
    model: config.ai_model || 'deepseek-chat',
    hasApiKey: !!config.ai_apiKey,
    apiKeyMasked: config.ai_apiKey 
      ? config.ai_apiKey.slice(0, 4) + '****' + config.ai_apiKey.slice(-4)
      : null,
    maxTokens: parseInt(config.ai_maxTokens, 10) || 4096,
    temperature: parseFloat(config.ai_temperature) || 0.7,
    usage: {
      totalTokens: usage.totalTokens || 0,
      calls: usage.calls || 0,
    },
  };
}

module.exports = { getProvider, getAIConfig, saveAIConfig, getConfigSafe };
