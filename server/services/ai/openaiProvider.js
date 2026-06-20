// server/services/ai/openaiProvider.js
// OpenAI 兼容 API Provider — 支持 DeepSeek / OpenAI / 自定义端点

/**
 * OpenAI Compatible Provider
 * 
 * 支持:
 *   - DeepSeek:    baseUrl=https://api.deepseek.com/v1, model=deepseek-chat
 *   - OpenAI:      baseUrl=https://api.openai.com/v1,  model=gpt-4o
 *   - 其他兼容API:  baseUrl=自定义, model=自定义
 */
class OpenAIProvider {
  constructor(config) {
    this.apiKey = config.apiKey;
    this.baseUrl = (config.baseUrl || 'https://api.deepseek.com/v1').replace(/\/$/, '');
    this.model = config.model || 'deepseek-chat';
    this.maxTokens = config.maxTokens || 4096;
    this.temperature = config.temperature ?? 0.7;
    this._usage = { promptTokens: 0, completionTokens: 0, totalTokens: 0, calls: 0 };
  }

  get usage() { return this._usage; }

  _recordUsage(usage) {
    if (!usage) return;
    this._usage.promptTokens += usage.prompt_tokens || 0;
    this._usage.completionTokens += usage.completion_tokens || 0;
    this._usage.totalTokens += usage.total_tokens || 0;
    this._usage.calls++;
  }

  /**
   * 通用 chat completion 调用
   */
  async chat(messages) {
    const url = `${this.baseUrl}/chat/completions`;
    const body = {
      model: this.model,
      messages,
      max_tokens: this.maxTokens,
      temperature: this.temperature,
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`AI API error ${res.status}: ${errBody}`);
    }

    const data = await res.json();
    this._recordUsage(data.usage);
    return {
      content: data.choices?.[0]?.message?.content || '',
      model: data.model,
      usage: data.usage || {},
      finishReason: data.choices?.[0]?.finish_reason || '',
    };
  }

  /**
   * 简单对话
   */
  async generate(prompt, context = '') {
    const systemMsg = context 
      ? { role: 'system', content: context }
      : { role: 'system', content: '你是一个专业的销售教练助手，帮助销售人员分析客户、制定策略。' };
    
    return this.chat([
      systemMsg,
      { role: 'user', content: prompt },
    ]);
  }

  /**
   * 测试连通性
   */
  async test() {
    const start = Date.now();
    const result = await this.chat([
      { role: 'user', content: '你好，请用一句话回复：连接成功' },
    ]);
    return {
      success: true,
      latency: Date.now() - start,
      model: result.model,
      response: result.content,
    };
  }
}

module.exports = OpenAIProvider;
