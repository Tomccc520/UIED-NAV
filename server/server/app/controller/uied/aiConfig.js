/**
 * @file controller/uied/aiConfig.js
 * @description AI 配置控制器
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

'use strict';

const baseController = require('../baseController');

/**
 * 格式化 AI 异常文案，避免将底层网络细节直接暴露给前端
 * @param {Error|any} error - 原始异常
 * @return {string} 可读提示
 */
const formatAiErrorMessage = error => {
  const message = String(error?.message || error || '').trim();
  if (!message) return 'AI 服务暂时不可用，请稍后重试';
  if (/unable to get local issuer certificate|unable to verify the first certificate|self signed certificate|certificate has expired/i.test(message)) {
    return 'AI 服务 SSL 证书校验失败，请检查服务器证书链配置';
  }
  if (/connect timeout|timed out|socket hang up|econnrefused|enotfound/i.test(message)) {
    return 'AI 服务连接超时，请检查后台 AI 配置中的 API 地址与网络连通性';
  }
  if (/401|unauthorized|invalid api key/i.test(message)) {
    return 'AI 鉴权失败，请检查 API Key 是否正确';
  }
  if (/429|rate limit|too many requests/i.test(message)) {
    return 'AI 请求过于频繁，请稍后重试';
  }
  return message;
};

/**
 * 规范化上下文消息，确保只保留合法 role/content 结构
 * @param {any} context - 原始上下文
 * @return {Array<{role: string, content: string}>} 规范化后的上下文列表
 */
const normalizeChatContext = context => {
  if (!Array.isArray(context)) return [];
  const allowRoles = new Set([ 'system', 'user', 'assistant' ]);
  return context
    .map(item => {
      const role = String(item?.role || '').trim();
      const content = String(item?.content || '').trim();
      if (!allowRoles.has(role) || !content) return null;
      return { role, content };
    })
    .filter(Boolean)
    .slice(-6);
};

/**
 * 将编辑器请求参数组装为 AI 提示词
 * @param {Object} payload - 编辑器请求体
 * @return {string} 组装后的提示词
 */
const buildEditorPrompt = payload => {
  const body = payload || {};
  const rawMessage = String(body.message || '').trim();
  if (rawMessage) {
    return rawMessage;
  }

  const scene = String(body.scene || 'article').trim();
  const mode = String(body.mode || 'replace').trim();
  const title = String(body.title || '').trim();
  const version = String(body.version || '').trim();
  const date = String(body.date || '').trim();
  const tone = String(body.tone || '').trim();
  const audience = String(body.audience || '').trim();
  const extraRequirements = String(body.extraRequirements || '').trim();
  const content = String(body.content || '').trim();
  const context = body.context && typeof body.context === 'object' ? body.context : {};
  const changePoints = Array.isArray(body.changePoints)
    ? body.changePoints.map(item => String(item || '').trim()).filter(Boolean)
    : [];

  const sections = [];
  sections.push(`场景：${scene}`);
  sections.push(`模式：${mode}`);
  if (title) sections.push(`标题：${title}`);
  if (version) sections.push(`版本：${version}`);
  if (date) sections.push(`日期：${date}`);
  if (tone) sections.push(`语气：${tone}`);
  if (audience) sections.push(`受众：${audience}`);
  if (extraRequirements) sections.push(`额外要求：${extraRequirements}`);
  if (changePoints.length) sections.push(`变化要点：${changePoints.join('；')}`);
  if (context?.category) sections.push(`栏目：${String(context.category || '').trim()}`);
  if (context?.author) sections.push(`作者：${String(context.author || '').trim()}`);
  if (context?.intro) sections.push(`简介：${String(context.intro || '').trim()}`);
  if (context?.summary) sections.push(`摘要：${String(context.summary || '').trim()}`);
  if (Array.isArray(context?.tags) && context.tags.length) {
    sections.push(`标签：${context.tags.map(item => String(item || '').trim()).filter(Boolean).join('、')}`);
  }
  if (context?.topic) sections.push(`专题：${String(context.topic || '').trim()}`);
  if (content) sections.push(`正文内容：\n${content}`);
  sections.push('请输出纯文本，不要包含 Markdown 代码块。');

  return sections.join('\n');
};

/**
 * 按语义边界拆分文本，用于 SSE 渐进输出
 * @param {string} text - 原始文本
 * @return {string[]} 拆分后的文本片段
 */
const splitTextForSse = text => {
  const source = String(text || '');
  if (!source.trim()) return [];
  const chunks = [];
  let current = '';
  for (const char of source) {
    current += char;
    if (/[\n，。！？；：]/.test(char) || current.length >= 36) {
      chunks.push(current);
      current = '';
    }
  }
  if (current) {
    chunks.push(current);
  }
  return chunks;
};

/**
 * 将值标准化为布尔值（仅在传值时转换）
 * @param {any} value - 原始值
 * @return {boolean|undefined} 标准化布尔值
 */
const normalizeOptionalBoolean = value => {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  const text = String(value).trim().toLowerCase();
  return [ '1', 'true', 'yes', 'y', 'on' ].includes(text);
};

/**
 * 兼容驼峰与下划线风格的 AI 配置参数
 * @param {Object} payload - 原始请求参数
 * @return {Object} 统一后的参数对象
 */
const normalizeAiConfigPayload = payload => {
  const source = payload && typeof payload === 'object' ? payload : {};
  return {
    id: source.id,
    name: source.name,
    provider: source.provider,
    apiUrl: source.apiUrl !== undefined ? source.apiUrl : source.api_url,
    apiKey: source.apiKey !== undefined ? source.apiKey : source.api_key,
    model: source.model,
    enabled: normalizeOptionalBoolean(source.enabled !== undefined ? source.enabled : source.is_enabled),
    isDefault: normalizeOptionalBoolean(source.isDefault !== undefined ? source.isDefault : source.is_default),
  };
};

/**
 * 写入 SSE 消息片段（OpenAI delta 兼容格式）
 * @param {import('http').ServerResponse} res - Node 响应对象
 * @param {string} chunk - 文本片段
 */
const writeSseDeltaChunk = (res, chunk) => {
  const payload = JSON.stringify({
    choices: [
      {
        delta: { content: chunk },
      },
    ],
  });
  res.write(`data: ${payload}\n\n`);
};

/**
 * 结束 SSE 输出
 * @param {import('http').ServerResponse} res - Node 响应对象
 */
const endSseStream = res => {
  res.write('data: [DONE]\n\n');
  res.end();
};

class AiConfigController extends baseController {
  /**
   * 获取所有 AI 配置
   */
  async list() {
    const { ctx } = this;
    try {
      const result = await ctx.service.uied.aiConfig.list();
      this.result({ data: result });
    } catch (error) {
      ctx.logger.error('获取AI配置列表失败:', error);
      this.result({ code: 500, message: '获取配置失败' });
    }
  }

  /**
   * 获取当前 AI 配置（用于前端页面）
   */
  async get() {
    const { ctx } = this;
    try {
      const result = await ctx.service.uied.aiConfig.getConfig();
      this.result({ data: result });
    } catch (error) {
      ctx.logger.error('获取AI配置失败:', error);
      this.result({ code: 500, message: '获取配置失败' });
    }
  }

  /**
   * 保存 AI 配置（用于前端页面）
   */
  async save() {
    const { ctx } = this;
    try {
      const data = normalizeAiConfigPayload(ctx.request.body);
      const result = await ctx.service.uied.aiConfig.saveConfig(data);
      this.result({ data: result, message: '保存成功' });
    } catch (error) {
      ctx.logger.error('保存AI配置失败:', error);
      this.result({ code: 500, message: '保存失败' });
    }
  }

  /**
   * 测试 AI 连接
   */
  async test() {
    const { ctx } = this;
    try {
      const data = normalizeAiConfigPayload(ctx.request.body);
      const { provider, apiKey, apiUrl } = data;
      const result = await ctx.service.uied.aiConfig.testConnection(provider, apiKey, apiUrl);
      if (result.success) {
        this.result({ message: '连接成功' });
      } else {
        this.result({ code: 500, message: result.message || '连接失败' });
      }
    } catch (error) {
      ctx.logger.error('测试AI连接失败:', error);
      this.result({ code: 500, message: error.message || '连接失败' });
    }
  }

  /**
   * 获取默认 AI 配置
   */
  async getDefault() {
    const { ctx } = this;
    try {
      const result = await ctx.service.uied.aiConfig.getDefault();
      if (!result) {
        return this.result({ code: 404, message: '没有可用的 AI 配置' });
      }
      // 不返回完整的 apiKey
      this.result({
        data: {
          id: result.id,
          name: result.name,
          provider: result.provider,
          model: result.model,
        },
      });
    } catch (error) {
      ctx.logger.error('获取默认AI配置失败:', error);
      this.result({ code: 500, message: '获取配置失败' });
    }
  }

  /**
   * 创建 AI 配置
   */
  async add() {
    const { ctx } = this;
    try {
      const data = normalizeAiConfigPayload(ctx.request.body);
      if (!data.name || !data.apiUrl || !data.apiKey || !data.model) {
        return this.result({ code: 400, message: '名称、API地址、API密钥和模型为必填项' });
      }
      const result = await ctx.service.uied.aiConfig.add(data);
      this.result({ data: result, message: '创建成功' });
    } catch (error) {
      ctx.logger.error('创建AI配置失败:', error);
      this.result({ code: 500, message: '创建失败' });
    }
  }

  /**
   * 更新 AI 配置
   */
  async edit() {
    const { ctx } = this;
    try {
      const data = normalizeAiConfigPayload(ctx.request.body);
      if (!data.id) {
        return this.result({ code: 400, message: '缺少配置ID' });
      }
      const result = await ctx.service.uied.aiConfig.edit(data);
      this.result({ data: result, message: '更新成功' });
    } catch (error) {
      ctx.logger.error('更新AI配置失败:', error);
      this.result({ code: 500, message: '更新失败' });
    }
  }

  /**
   * 删除 AI 配置
   */
  async del() {
    const { ctx } = this;
    try {
      const { id } = ctx.request.body;
      if (!id) {
        return this.result({ code: 400, message: '缺少配置ID' });
      }
      await ctx.service.uied.aiConfig.del(parseInt(id));
      this.result({ message: '删除成功' });
    } catch (error) {
      ctx.logger.error('删除AI配置失败:', error);
      this.result({ code: 500, message: '删除失败' });
    }
  }

  /**
   * 获取 AI 功能开关配置
   */
  async featureToggle() {
    const { ctx } = this;
    try {
      const result = await ctx.service.uied.aiConfig.getFeatureToggle();
      this.result({ data: result });
    } catch (error) {
      ctx.logger.error('获取AI功能开关失败:', error);
      this.result({ code: 500, message: '获取功能开关失败' });
    }
  }

  /**
   * 保存 AI 功能开关配置
   */
  async saveFeatureToggle() {
    const { ctx } = this;
    try {
      const data = ctx.request.body;
      const result = await ctx.service.uied.aiConfig.saveFeatureToggle(data);
      this.result({ data: result, message: '保存成功' });
    } catch (error) {
      ctx.logger.error('保存AI功能开关失败:', error);
      this.result({ code: 500, message: '保存功能开关失败' });
    }
  }

  /**
   * AI 生成网站信息
   */
  async generateWebsiteInfo() {
    const { ctx } = this;
    try {
      const { url, testMode } = ctx.request.body;
      if (!url) {
        return this.result({ code: 400, message: '请提供网站URL' });
      }
      const result = await ctx.service.uied.aiConfig.generateWebsiteInfo(url, testMode);
      this.result({ data: result });
    } catch (error) {
      ctx.logger.error('AI生成网站信息失败:', error);
      this.result({ code: 500, message: error.message || 'AI生成失败' });
    }
  }

  /**
   * 批量生成网站信息
   * 依次为每个网站调用 AI 生成描述和标签，失败项记录错误继续处理
   */
  async batchGenerate() {
    const { ctx } = this;
    try {
      const { websiteIds, fields } = ctx.request.body;

      if (!Array.isArray(websiteIds) || websiteIds.length === 0) {
        return this.result({ code: 400, message: '请提供要生成的网站ID列表' });
      }

      const result = await ctx.service.uied.aiConfig.batchGenerate(websiteIds, fields);
      this.result({ data: result });
    } catch (error) {
      ctx.logger.error('批量生成网站信息失败:', error);
      this.result({ code: 500, message: error.message || '批量生成失败' });
    }
  }

  /**
   * 确认批量生成结果
   * 将管理员确认的结果保存到数据库
   */
  async batchConfirm() {
    const { ctx } = this;
    try {
      const { results } = ctx.request.body;

      if (!Array.isArray(results) || results.length === 0) {
        return this.result({ code: 400, message: '请提供要确认的结果列表' });
      }

      // 验证每个结果项必须包含 websiteId
      for (const item of results) {
        if (!item.websiteId) {
          return this.result({ code: 400, message: '每个结果项必须包含 websiteId' });
        }
      }

      const result = await ctx.service.uied.aiConfig.batchConfirm(results);
      this.result({ data: result, message: `成功更新 ${result.updated} 个网站` });
    } catch (error) {
      ctx.logger.error('确认批量生成结果失败:', error);
      this.result({ code: 500, message: error.message || '确认失败' });
    }
  }

  /**
   * AI 生成网站详情内容
   */
  async generateDetailContent() {
    const { ctx } = this;
    try {
      const { websiteId } = ctx.request.body;
      if (!websiteId) {
        return this.result({ code: 400, message: '请提供网站ID' });
      }
      const result = await ctx.service.uied.aiConfig.generateDetailContent(websiteId);
      this.result({ data: result });
    } catch (error) {
      ctx.logger.error('AI生成详情内容失败:', error);
      this.result({ code: 500, message: error.message || 'AI生成失败' });
    }
  }

  /**
   * AI 对话
   */
  async chat() {
    const { ctx } = this;
    try {
      const { message, context } = ctx.request.body;
      if (!message) {
        return this.result({ code: 400, message: '请提供消息内容' });
      }
      const result = await ctx.service.uied.aiConfig.chat(message, context);
      this.result({ data: result });
    } catch (error) {
      ctx.logger.error('AI对话失败:', error);
      this.result({ code: 500, message: formatAiErrorMessage(error) });
    }
  }

  /**
   * 编辑器 AI 流式对话（SSE）
   * 说明：底层仍复用 AI 配置服务，返回 OpenAI delta 兼容数据结构。
   */
  async chatCompletionsEditor() {
    const { ctx } = this;
    const prompt = buildEditorPrompt(ctx.request.body || {});
    if (!prompt) {
      return this.result({ code: 400, message: '请提供消息内容' });
    }

    const context = normalizeChatContext(ctx.request.body?.context);
    const res = ctx.res;
    ctx.status = 200;
    ctx.respond = false;
    ctx.set('Content-Type', 'text/event-stream; charset=utf-8');
    ctx.set('Cache-Control', 'no-cache, no-transform');
    ctx.set('Connection', 'keep-alive');
    ctx.set('X-Accel-Buffering', 'no');
    if (typeof res.flushHeaders === 'function') {
      res.flushHeaders();
    }

    try {
      const result = await ctx.service.uied.aiConfig.chat(prompt, context);
      const reply = String(result?.reply || '').trim();
      if (!reply) {
        writeSseDeltaChunk(res, 'AI 未返回可用内容，请稍后重试。');
        endSseStream(res);
        return;
      }
      const chunks = splitTextForSse(reply);
      for (const chunk of chunks) {
        writeSseDeltaChunk(res, chunk);
      }
      endSseStream(res);
    } catch (error) {
      ctx.logger.error('编辑器AI流式对话失败:', error);
      const readableMessage = formatAiErrorMessage(error);
      const outputMessage = /^AI\s*(处理失败|服务)/.test(readableMessage)
        ? readableMessage
        : `AI 处理失败：${readableMessage}`;
      writeSseDeltaChunk(res, outputMessage);
      endSseStream(res);
    }
  }
}

module.exports = AiConfigController;
