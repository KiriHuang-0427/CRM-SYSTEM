# AI Provider Directory (V26.06.06)

This directory is reserved for future AI provider implementations.

## Current Status (V26.06.06)

AI is **disabled** in this version. Only the memory foundation and data context layer are built.

## Future AI Integration Guide

When connecting a real AI model in a future version:

1. **Read customer context via the unified API:**
   ```
   GET /api/customers/:id/context
   ```
   Do NOT query database tables directly. The context endpoint aggregates all relevant data.

2. **Implement a provider following the interface:**
   See `aiProvider.interface.js` for the required contract.

3. **Replace `disabledProvider.js`:**
   Create a real provider (e.g., `openaiProvider.js`, `deepseekProvider.js`) and register it.

4. **Do NOT bypass the memory layer:**
   AI should read from `ai_memories` and the context endpoint, not from raw business tables.
   This ensures model swaps don't require data layer changes.

## Files

- `aiProvider.interface.js` — Interface contract definition
- `disabledProvider.js` — Current placeholder (throws error on any AI call)
