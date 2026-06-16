// server/services/ai/disabledProvider.js
// Disabled AI provider — returns error for any AI call
// V26.06.06 only builds memory foundation; no real AI integration

module.exports = {
  generate: async () => {
    throw new Error('AI provider is disabled in V26.06.06. This version only builds memory foundation.');
  },
  summarize: async () => {
    throw new Error('AI provider is disabled in V26.06.06. This version only builds memory foundation.');
  },
  analyze: async () => {
    throw new Error('AI provider is disabled in V26.06.06. This version only builds memory foundation.');
  },
};
