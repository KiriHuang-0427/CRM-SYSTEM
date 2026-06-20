// server/services/ai/customerCoach.js
// Phase 3: Customer Coach — 销售教练（未来AI接入后启用）
// 当前版本仅预留接口，不调用任何AI模型

const { buildContextQuery } = require('../contextBuilder');

/**
 * 为客户生成销售教练建议（占位）
 * 未来接入AI后将基于L1-L4四层上下文生成具体建议
 */
function generateCoachAdvice(customerId, topic) {
  // 获取四层上下文
  const context = buildContextQuery({ customerId });

  return {
    phase: 'Phase3_CustomerCoach',
    status: 'framework_reserved',
    message: '销售教练功能已预留框架，等待AI Provider接入后启用',
    customerId,
    topic: topic || 'general',
    contextAvailable: {
      facts: Object.keys(context.facts).length > 0,
      memories: context.memories?.length || 0,
      insights: context.insights?.length || 0,
      strategy: context.strategy?.length || 0,
    },
  };
}

module.exports = { generateCoachAdvice };
