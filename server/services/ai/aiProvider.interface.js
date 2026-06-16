// server/services/ai/aiProvider.interface.js
// AI Provider interface definition — for future implementation only
// V26.06.06 does NOT connect to any real AI model

/**
 * AI Provider Interface
 *
 * Future implementations should follow this contract:
 *
 * @param {object} options
 * @param {string} options.model - Model name (e.g., 'gpt-4', 'claude-3', 'deepseek-chat')
 * @param {string} options.apiKey - API key for the provider
 * @param {string} options.baseUrl - Optional custom endpoint
 *
 * Methods:
 *   generate(prompt, context) → string
 *   summarize(text) → string
 *   analyze(customerContext) → object
 */

module.exports = {
  // Interface definition only — no implementation in V26.06.06
  INTERFACE_VERSION: '1.0.0',

  REQUIRED_METHODS: ['generate', 'summarize', 'analyze'],

  // Future usage pattern:
  // const provider = new AIProvider({ model: 'xxx', apiKey: 'xxx' });
  // const context = await buildCustomerContext(customerId);
  // const response = await provider.generate(prompt, context);
};
