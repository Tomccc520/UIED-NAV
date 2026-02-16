/**
 * @file service/uied/aiConfig.js
 * @description AI 配置服务
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

'use strict';

const Service = require('egg').Service;

class AiConfigService extends Service {
  /**
   * 获取提供商默认聊天接口地址
   * @param {string} provider - 提供商标识
   * @return {string} 默认 chat completions 地址
   */
  resolveProviderDefaultApiUrl(provider = '') {
    const key = String(provider || '').trim().toLowerCase();
    const defaultMap = {
      openai: 'https://api.openai.com/v1/chat/completions',
      deepseek: 'https://api.deepseek.com/v1/chat/completions',
      siliconflow: 'https://api.siliconflow.cn/v1/chat/completions',
      moonshot: 'https://api.moonshot.cn/v1/chat/completions',
      kimi: 'https://api.moonshot.cn/v1/chat/completions',
      qwen: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
      glm: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
      ollama: 'http://127.0.0.1:11434/v1/chat/completions',
    };
    return defaultMap[key] || defaultMap.siliconflow;
  }

  /**
   * 获取提供商默认模型
   * @param {string} provider - 提供商标识
   * @return {string} 默认模型
   */
  resolveProviderDefaultModel(provider = '') {
    const key = String(provider || '').trim().toLowerCase();
    const modelMap = {
      openai: 'gpt-4o-mini',
      deepseek: 'deepseek-chat',
      siliconflow: 'deepseek-ai/DeepSeek-V3',
      moonshot: 'moonshot-v1-8k',
      kimi: 'moonshot-v1-8k',
      qwen: 'qwen-plus',
      glm: 'glm-4-flash',
      ollama: 'qwen2.5:7b',
    };
    return modelMap[key] || modelMap.siliconflow;
  }

  /**
   * 规范化聊天接口地址
   * 兼容只填域名、只填 /v1 的场景，自动补全到 /chat/completions
   * @param {string} provider - 提供商标识
   * @param {string} rawUrl - 原始地址
   * @return {string} 可直接调用的 chat completions 地址
   */
  resolveChatApiUrl(provider = '', rawUrl = '') {
    const input = String(rawUrl || '').trim();
    const fallback = this.resolveProviderDefaultApiUrl(provider);
    if (!input) return fallback;
    if (/\/chat\/completions\/?$/i.test(input)) {
      return input.replace(/\/+$/, '');
    }
    const normalized = input.replace(/\/+$/, '');
    if (/\/v\d+$/i.test(normalized)) {
      return `${normalized}/chat/completions`;
    }
    if (/^https?:\/\//i.test(normalized) && !/\/v\d+\//i.test(normalized)) {
      return `${normalized}/v1/chat/completions`;
    }
    return `${normalized}/chat/completions`;
  }

  /**
   * 规范化模型名称
   * @param {string} provider - 提供商标识
   * @param {string} model - 原始模型
   * @return {string} 可用模型名称
   */
  resolveChatModel(provider = '', model = '') {
    const value = String(model || '').trim();
    if (value) return value;
    return this.resolveProviderDefaultModel(provider);
  }

  /**
   * 获取所有已启用 AI 配置（默认配置优先）
   * @return {Promise<Array<{id:number,name:string,provider:string,apiUrl:string,apiKey:string,model:string,isDefault:boolean}>>}
   */
  async getEnabledConfigs() {
    const { app } = this;
    const rows = await app.model.query(
      'SELECT * FROM uied_ai_config WHERE is_enabled = 1 ORDER BY is_default DESC, id DESC',
      { type: app.Sequelize.QueryTypes.SELECT }
    );
    return (rows || []).map(item => ({
      id: Number(item.id || 0),
      name: String(item.name || ''),
      provider: String(item.provider || ''),
      apiUrl: String(item.api_url || ''),
      apiKey: String(item.api_key || ''),
      model: String(item.model || ''),
      isDefault: Number(item.is_default || 0) === 1,
    }));
  }

  /**
   * 判断错误是否为连接类问题
   * @param {Error|any} error - 异常对象
   * @return {boolean} 是否连接类错误
   */
  isNetworkError(error) {
    const text = String(error?.message || error || '').toLowerCase();
    return (
      text.includes('connect timeout') ||
      text.includes('socket hang up') ||
      text.includes('econnrefused') ||
      text.includes('enotfound') ||
      text.includes('timed out') ||
      text.includes('network error')
    );
  }

  /**
   * 将 AI 异常转换为更可读的中文提示
   * @param {Error|any} error - 原始异常
   * @param {Array<{name:string,provider:string}>} configs - 已尝试的配置列表
   * @return {string} 可读错误文案
   */
  formatChatError(error, configs = []) {
    const message = String(error?.message || error || '').trim();
    const configHint = configs.length
      ? `已尝试配置：${configs.map(item => `${item.name || '未命名'}(${item.provider || 'unknown'})`).join('、')}`
      : '请检查 AI 助手配置';
    if (!message) {
      return `AI 对话失败。${configHint}`;
    }
    if (this.isNetworkError(error)) {
      return `AI 处理失败：连接超时或网络不可达。${configHint}`;
    }
    if (/401|unauthorized|invalid api key/i.test(message)) {
      return `AI 处理失败：API Key 无效或已失效。${configHint}`;
    }
    if (/429|rate limit|too many requests/i.test(message)) {
      return `AI 处理失败：请求过于频繁，请稍后重试。${configHint}`;
    }
    return `AI 处理失败：${message}`;
  }

  /**
   * 获取所有 AI 配置
   */
  async list() {
    const { app } = this;

    const configs = await app.model.query(
      'SELECT * FROM uied_ai_config ORDER BY create_time DESC',
      { type: app.Sequelize.QueryTypes.SELECT }
    );

    // 隐藏 API Key 的部分内容
    return configs.map(c => ({
      id: c.id,
      name: c.name,
      provider: c.provider,
      apiUrl: c.api_url,
      apiKey: c.api_key ? `${c.api_key.slice(0, 8)}...${c.api_key.slice(-4)}` : '',
      model: c.model,
      enabled: c.is_enabled === 1,
      isDefault: c.is_default === 1,
      createdAt: c.create_time,
    }));
  }

  /**
   * 获取默认启用的 AI 配置
   */
  async getDefault() {
    const { app } = this;

    let [ config ] = await app.model.query(
      'SELECT * FROM uied_ai_config WHERE is_enabled = 1 AND is_default = 1 LIMIT 1',
      { type: app.Sequelize.QueryTypes.SELECT }
    );

    if (!config) {
      [ config ] = await app.model.query(
        'SELECT * FROM uied_ai_config WHERE is_enabled = 1 LIMIT 1',
        { type: app.Sequelize.QueryTypes.SELECT }
      );
    }

    if (!config) return null;

    return {
      id: config.id,
      name: config.name,
      provider: config.provider,
      apiUrl: config.api_url,
      apiKey: config.api_key,
      model: config.model,
    };
  }

  /**
   * 创建 AI 配置
   */
  async add(data) {
    const { app } = this;
    const now = Math.floor(Date.now() / 1000);

    // 如果设为默认，取消其他默认配置
    if (data.isDefault) {
      await app.model.query(
        'UPDATE uied_ai_config SET is_default = 0',
        { type: app.Sequelize.QueryTypes.UPDATE }
      );
    }

    const [ result ] = await app.model.query(
      `INSERT INTO uied_ai_config (name, provider, api_url, api_key, model, is_enabled, is_default, create_time, update_time)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      {
        replacements: [
          data.name,
          data.provider || 'siliconflow',
          data.apiUrl,
          data.apiKey,
          data.model,
          data.enabled !== false ? 1 : 0,
          data.isDefault ? 1 : 0,
          now,
          now,
        ],
        type: app.Sequelize.QueryTypes.INSERT,
      }
    );

    return { id: result, ...data };
  }

  /**
   * 更新 AI 配置
   */
  async edit(data) {
    const { app } = this;
    const now = Math.floor(Date.now() / 1000);

    // 如果设为默认，取消其他默认配置
    if (data.isDefault) {
      await app.model.query(
        'UPDATE uied_ai_config SET is_default = 0 WHERE id != ?',
        { replacements: [ data.id ], type: app.Sequelize.QueryTypes.UPDATE }
      );
    }

    const updates = [];
    const values = [];

    if (data.name !== undefined) { updates.push('name = ?'); values.push(data.name); }
    if (data.provider !== undefined) { updates.push('provider = ?'); values.push(data.provider); }
    if (data.apiUrl !== undefined) { updates.push('api_url = ?'); values.push(data.apiUrl); }
    if (data.apiKey !== undefined) { updates.push('api_key = ?'); values.push(data.apiKey); }
    if (data.model !== undefined) { updates.push('model = ?'); values.push(data.model); }
    if (data.enabled !== undefined) { updates.push('is_enabled = ?'); values.push(data.enabled ? 1 : 0); }
    if (data.isDefault !== undefined) { updates.push('is_default = ?'); values.push(data.isDefault ? 1 : 0); }

    updates.push('update_time = ?');
    values.push(now);
    values.push(data.id);

    await app.model.query(
      `UPDATE uied_ai_config SET ${updates.join(', ')} WHERE id = ?`,
      { replacements: values, type: app.Sequelize.QueryTypes.UPDATE }
    );

    return data;
  }

  /**
   * 删除 AI 配置
   */
  async del(id) {
    const { app } = this;

    await app.model.query(
      'DELETE FROM uied_ai_config WHERE id = ?',
      { replacements: [ id ], type: app.Sequelize.QueryTypes.DELETE }
    );
  }

  /**
   * 获取当前 AI 配置（用于前端页面）
   */
  async getConfig() {
    const { app } = this;

    // 获取默认配置或第一个配置
    let [ config ] = await app.model.query(
      'SELECT * FROM uied_ai_config WHERE is_default = 1 LIMIT 1',
      { type: app.Sequelize.QueryTypes.SELECT }
    );

    if (!config) {
      [ config ] = await app.model.query(
        'SELECT * FROM uied_ai_config LIMIT 1',
        { type: app.Sequelize.QueryTypes.SELECT }
      );
    }

    if (!config) {
      return {
        enabled: false,
        provider: 'siliconflow',
        apiKey: '',
        apiUrl: 'https://api.siliconflow.cn/v1/chat/completions',
        model: 'deepseek-ai/DeepSeek-V3',
        maxTokens: 2000,
        temperature: 0.7,
      };
    }

    return {
      id: config.id,
      enabled: config.is_enabled === 1,
      provider: config.provider,
      apiKey: config.api_key || '',
      apiUrl: config.api_url || '',
      model: config.model || 'gpt-3.5-turbo',
      maxTokens: 2000,
      temperature: 0.7,
    };
  }

  /**
   * 保存 AI 配置（用于前端页面）
   */
  async saveConfig(data) {
    const { app } = this;
    const now = Math.floor(Date.now() / 1000);

    // 检查是否有现有配置
    const [ existing ] = await app.model.query(
      'SELECT id FROM uied_ai_config WHERE is_default = 1 LIMIT 1',
      { type: app.Sequelize.QueryTypes.SELECT }
    );

    if (existing) {
      // 更新现有配置
      await app.model.query(
        `UPDATE uied_ai_config SET 
          provider = ?, api_url = ?, api_key = ?, model = ?, is_enabled = ?, update_time = ?
         WHERE id = ?`,
        {
          replacements: [
            data.provider || 'siliconflow',
            data.apiUrl || '',
            data.apiKey || '',
            data.model || this.resolveProviderDefaultModel(data.provider || 'siliconflow'),
            data.enabled ? 1 : 0,
            now,
            existing.id,
          ],
          type: app.Sequelize.QueryTypes.UPDATE,
        }
      );
      return { id: existing.id, ...data };
    }
    // 创建新配置
    const [ result ] = await app.model.query(
      `INSERT INTO uied_ai_config (name, provider, api_url, api_key, model, is_enabled, is_default, create_time, update_time)
         VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)`,
      {
        replacements: [
          'default',
          data.provider || 'siliconflow',
          data.apiUrl || '',
          data.apiKey || '',
          data.model || this.resolveProviderDefaultModel(data.provider || 'siliconflow'),
          data.enabled ? 1 : 0,
          now,
          now,
        ],
        type: app.Sequelize.QueryTypes.INSERT,
      }
    );
    return { id: result, ...data };

  }

  /**
   * 测试 AI 连接
   */
  async testConnection(provider, apiKey, apiUrl) {
    const { ctx } = this;

    if (!apiKey) {
      return { success: false, message: '请提供 API Key' };
    }

    try {
      const testUrl = this.resolveChatApiUrl(provider, apiUrl);
      const testModel = this.resolveChatModel(provider, '');

      const response = await ctx.curl(testUrl, {
        method: 'POST',
        contentType: 'json',
        data: {
          model: testModel,
          messages: [{ role: 'user', content: 'Hello' }],
          max_tokens: 5,
        },
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        timeout: 10000,
        dataType: 'json',
      });

      if (response.status === 200) {
        return { success: true };
      }
      return { success: false, message: `API 返回错误: ${response.status}` };

    } catch (error) {
      return { success: false, message: error.message || '连接失败' };
    }
  }

  /**
   * AI 生成网站信息
   */
  async generateWebsiteInfo(url, testMode = false) {
    const { ctx } = this;

    // 测试模式 - 返回模拟数据
    if (testMode) {
      let domain = '';
      try {
        const urlObj = new URL(url);
        domain = urlObj.hostname.replace('www.', '');
      } catch (error) {
        domain = url;
      }

      return {
        name: `${domain} 网站`,
        description: `这是 ${domain} 的网站描述。该网站提供优质的服务和内容，是用户的理想选择。`,
        tags: '工具,在线服务,推荐',
      };
    }

    // 获取 AI 配置
    const config = await this.getDefault();
    if (!config) {
      throw new Error('没有可用的 AI 配置，请先在系统设置中配置 AI');
    }
    const requestUrl = this.resolveChatApiUrl(config.provider, config.apiUrl);
    const requestModel = this.resolveChatModel(config.provider, config.model);

    // 构建提示词
    const prompt = `请根据以下网站URL，生成网站的相关信息。请直接返回JSON格式，不要有其他内容。

网站URL: ${url}

请返回以下JSON格式（确保是有效的JSON）:
{
  "name": "网站名称（简短，2-10个字）",
  "description": "网站描述（50-100字，描述网站的主要功能和特点）",
  "tags": ["标签1", "标签2", "标签3"]
}`;

    const startTime = Date.now();
    let tokensUsed = 0;

    try {
      // 调用 AI API
      const response = await ctx.curl(requestUrl, {
        method: 'POST',
        contentType: 'json',
        data: {
          model: requestModel,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          max_tokens: 500,
        },
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
        },
        timeout: 30000,
        dataType: 'json',
      });

      if (response.status !== 200) {
        throw new Error('AI API 调用失败');
      }

      const content = response.data.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error('AI 返回内容为空');
      }

      tokensUsed = response.data.usage?.total_tokens || 0;

      // 解析 JSON
      let jsonStr = content;
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1].trim();
      }

      const result = JSON.parse(jsonStr);
      const generated = {
        name: result.name || '',
        description: result.description || '',
        tags: Array.isArray(result.tags) ? result.tags.join(',') : '',
      };

      // 记录成功日志
      const durationMs = Date.now() - startTime;
      try {
        await ctx.service.uied.aiUsageLog.add({
          configId: config.id || 0,
          featureType: 'generate',
          requestContent: `生成网站信息: ${url}`,
          responseStatus: 'success',
          tokensUsed,
          durationMs,
        });
      } catch (logErr) {
        ctx.logger.error('AI日志记录失败:', logErr);
      }

      return generated;
    } catch (error) {
      // 记录失败日志
      const durationMs = Date.now() - startTime;
      try {
        await ctx.service.uied.aiUsageLog.add({
          configId: config.id || 0,
          featureType: 'generate',
          requestContent: `生成网站信息: ${url}`,
          responseStatus: 'failed',
          errorMessage: error.message || 'AI 生成失败',
          tokensUsed: 0,
          durationMs,
        });
      } catch (logErr) {
        ctx.logger.error('AI日志记录失败:', logErr);
      }
      throw error;
    }
  }

  /**
   * 获取 AI 功能开关配置
   * 从 uied_site_setting 表读取 ai_feature_toggle 配置
   * 未配置时返回默认值（全部启用）
   */
  async getFeatureToggle() {
    const { app } = this;

    const defaultToggle = {
      aiEnabled: true,
      aiSearch: true,
      aiGenerate: true,
      aiChat: true,
    };

    const [ setting ] = await app.model.query(
      'SELECT `value` FROM uied_site_setting WHERE `key` = ?',
      { replacements: [ 'ai_feature_toggle' ], type: app.Sequelize.QueryTypes.SELECT }
    );

    if (!setting) return defaultToggle;

    try {
      const parsed = JSON.parse(setting.value);
      return {
        aiEnabled: parsed.aiEnabled !== undefined ? parsed.aiEnabled : defaultToggle.aiEnabled,
        aiSearch: parsed.aiSearch !== undefined ? parsed.aiSearch : defaultToggle.aiSearch,
        aiGenerate: parsed.aiGenerate !== undefined ? parsed.aiGenerate : defaultToggle.aiGenerate,
        aiChat: parsed.aiChat !== undefined ? parsed.aiChat : defaultToggle.aiChat,
      };
    } catch (error) {
      return defaultToggle;
    }
  }

  /**
   * 保存 AI 功能开关配置
   * 使用 INSERT ... ON DUPLICATE KEY UPDATE 确保幂等
   */
  async saveFeatureToggle(data) {
    const { app } = this;
    const now = Math.floor(Date.now() / 1000);

    const toggleData = {
      aiEnabled: !!data.aiEnabled,
      aiSearch: !!data.aiSearch,
      aiGenerate: !!data.aiGenerate,
      aiChat: !!data.aiChat,
    };

    const valueStr = JSON.stringify(toggleData);

    await app.model.query(
      `INSERT INTO uied_site_setting (\`key\`, \`value\`, create_time, update_time)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE \`value\` = ?, update_time = ?`,
      {
        replacements: [ 'ai_feature_toggle', valueStr, now, now, valueStr, now ],
        type: app.Sequelize.QueryTypes.INSERT,
      }
    );

    return toggleData;
  }

  /**
   * 批量生成网站信息
   * 遍历网站列表，逐个调用 AI 生成描述和标签
   * 失败项记录错误继续处理，不持久化结果（等待确认）
   * @param {number[]} websiteIds - 要生成的网站 ID 列表
   * @param {string[]} fields - 要生成的字段列表，如 ['description', 'tags']
   * @return {Object} 包含 taskId、total 和 results 的结果对象
   */
  async batchGenerate(websiteIds, fields = [ 'description', 'tags' ]) {
    const { ctx, app } = this;
    const taskId = `batch_${Date.now()}`;
    const results = [];

    // 获取默认 AI 配置（用于日志记录 configId）
    const config = await this.getDefault();
    const configId = config?.id || 0;

    // 查询所有目标网站的基本信息
    const websites = await app.model.query(
      'SELECT id, name, url, description, tags FROM uied_website WHERE id IN (?) AND is_delete = 0',
      { replacements: [ websiteIds.length > 0 ? websiteIds : [ 0 ] ], type: app.Sequelize.QueryTypes.SELECT }
    );

    // 建立 id -> website 映射，方便查找
    const websiteMap = {};
    for (const w of websites) {
      websiteMap[w.id] = w;
    }

    // 逐个处理每个网站
    for (const websiteId of websiteIds) {
      const website = websiteMap[websiteId];

      // 网站不存在的情况
      if (!website) {
        results.push({
          websiteId,
          name: '',
          status: 'failed',
          error: '网站不存在或已删除',
        });
        continue;
      }

      const startTime = Date.now();
      try {
        // 调用现有的 generateWebsiteInfo 方法生成信息
        const generated = await this.generateWebsiteInfo(website.url);

        const result = {
          websiteId: website.id,
          name: website.name,
          status: 'success',
        };

        // 根据请求的字段返回对应的生成结果
        if (fields.includes('description')) {
          result.description = generated.description || '';
        }
        if (fields.includes('tags')) {
          result.tags = generated.tags || '';
        }

        results.push(result);

        // 记录成功的 AI 使用日志
        const durationMs = Date.now() - startTime;
        try {
          await ctx.service.uied.aiUsageLog.add({
            configId,
            featureType: 'batch_generate',
            requestContent: `批量生成: ${website.name} (${website.url})`,
            responseStatus: 'success',
            tokensUsed: 0,
            durationMs,
          });
        } catch (logErr) {
          // 日志记录失败不影响主流程
          ctx.logger.error('批量生成日志记录失败:', logErr);
        }
      } catch (error) {
        // 失败项记录错误，继续处理下一个
        results.push({
          websiteId: website.id,
          name: website.name,
          status: 'failed',
          error: error.message || 'AI 生成失败',
        });

        // 记录失败的 AI 使用日志
        const durationMs = Date.now() - startTime;
        try {
          await ctx.service.uied.aiUsageLog.add({
            configId,
            featureType: 'batch_generate',
            requestContent: `批量生成: ${website.name} (${website.url})`,
            responseStatus: 'failed',
            errorMessage: error.message || 'AI 生成失败',
            tokensUsed: 0,
            durationMs,
          });
        } catch (logErr) {
          ctx.logger.error('批量生成日志记录失败:', logErr);
        }
      }
    }

    return {
      taskId,
      total: websiteIds.length,
      results,
    };
  }

  /**
   * 批量确认生成结果
   * 将管理员确认的批量生成结果保存到数据库
   * @param {Array<{websiteId: number, description?: string, tags?: string}>} results - 确认的结果列表
   * @return {Object} 包含 updated（成功数）和 failed（失败数）的结果
   */
  async batchConfirm(results) {
    const { app } = this;
    const now = Math.floor(Date.now() / 1000);
    let updated = 0;
    let failed = 0;

    for (const item of results) {
      try {
        const updates = [];
        const values = [];

        if (item.description !== undefined) {
          updates.push('description = ?');
          values.push(item.description);
        }
        if (item.tags !== undefined) {
          updates.push('tags = ?');
          values.push(item.tags);
        }

        // 没有需要更新的字段则跳过
        if (updates.length === 0) {
          continue;
        }

        updates.push('update_time = ?');
        values.push(now);
        values.push(item.websiteId);

        await app.model.query(
          `UPDATE uied_website SET ${updates.join(', ')} WHERE id = ? AND is_delete = 0`,
          { replacements: values, type: app.Sequelize.QueryTypes.UPDATE }
        );

        updated++;
      } catch (error) {
        failed++;
      }
    }

    return { updated, failed };
  }

  /**
   * AI 生成网站详情内容
   * 根据网站信息生成富文本 HTML 详情内容
   * @param {number} websiteId - 网站ID
   * @return {Object} 包含 content 的结果
   */
  async generateDetailContent(websiteId) {
    const { ctx, app } = this;

    // 获取网站信息
    const [ website ] = await app.model.query(
      'SELECT id, name, url, description, tags FROM uied_website WHERE id = ? AND is_delete = 0',
      { replacements: [ websiteId ], type: app.Sequelize.QueryTypes.SELECT }
    );

    if (!website) {
      throw new Error('网站不存在');
    }

    // 获取 AI 配置
    const config = await this.getDefault();
    if (!config) {
      throw new Error('没有可用的 AI 配置，请先在系统设置中配置 AI');
    }
    const requestUrl = this.resolveChatApiUrl(config.provider, config.apiUrl);
    const requestModel = this.resolveChatModel(config.provider, config.model);

    const tags = website.tags ? (() => { try { return JSON.parse(website.tags); } catch (error) { return []; } })() : [];

    const prompt = `请为以下网站生成一篇详细的介绍内容，用于网站详情页展示。请直接返回 HTML 格式内容，不要包含 \`\`\` 代码块标记。

网站名称: ${website.name}
网站URL: ${website.url}
网站描述: ${website.description || '无'}
标签: ${tags.join(', ') || '无'}

要求：
1. 使用 HTML 标签格式化内容（h2, h3, p, ul, li, strong 等）
2. 内容包含：网站简介、主要功能/特点、适用人群、使用场景
3. 内容长度 300-600 字
4. 语言风格专业但易读
5. 不要包含虚假信息，基于网站名称和描述合理推断`;

    const startTime = Date.now();

    try {
      const response = await ctx.curl(requestUrl, {
        method: 'POST',
        contentType: 'json',
        data: {
          model: requestModel,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          max_tokens: 2000,
        },
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
        },
        timeout: 60000,
        dataType: 'json',
      });

      if (response.status !== 200) {
        throw new Error('AI API 调用失败');
      }

      let content = response.data.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error('AI 返回内容为空');
      }

      // 清理可能的代码块标记
      content = content.replace(/^```html?\s*/i, '').replace(/\s*```$/i, '').trim();

      const tokensUsed = response.data.usage?.total_tokens || 0;
      const durationMs = Date.now() - startTime;

      try {
        await ctx.service.uied.aiUsageLog.add({
          configId: config.id || 0,
          featureType: 'generate_detail',
          requestContent: `生成详情内容: ${website.name}`,
          responseStatus: 'success',
          tokensUsed,
          durationMs,
        });
      } catch (logErr) {
        ctx.logger.error('AI日志记录失败:', logErr);
      }

      return { content };
    } catch (error) {
      const durationMs = Date.now() - startTime;
      try {
        await ctx.service.uied.aiUsageLog.add({
          configId: config.id || 0,
          featureType: 'generate_detail',
          requestContent: `生成详情内容: ${website.name}`,
          responseStatus: 'failed',
          errorMessage: error.message || 'AI 生成失败',
          tokensUsed: 0,
          durationMs,
        });
      } catch (logErr) {
        ctx.logger.error('AI日志记录失败:', logErr);
      }
      throw error;
    }
  }

  /**
   * AI 对话
   */
  async chat(message, context = []) {
    const { ctx } = this;
    const enabledConfigs = await this.getEnabledConfigs();
    if (!enabledConfigs.length) {
      throw new Error('没有可用的 AI 配置');
    }
    const availableConfigs = enabledConfigs.filter(item => String(item.apiKey || '').trim());
    if (!availableConfigs.length) {
      throw new Error('AI 配置缺少 API Key，请先在后台 AI 助手管理中补全并启用配置');
    }
    const safeMessage = String(message || '').trim();
    if (!safeMessage) {
      throw new Error('请提供消息内容');
    }
    const safeContext = Array.isArray(context)
      ? context
        .map(item => ({
          role: String(item?.role || '').trim(),
          content: String(item?.content || '').trim(),
        }))
        .filter(item => [ 'system', 'user', 'assistant' ].includes(item.role) && item.content)
        .slice(-6)
      : [];

    const systemPrompt = '你是 UIED 设计导航的 AI 助手，专注于帮助设计师解决问题。';
    const messages = [
      { role: 'system', content: systemPrompt },
      ...safeContext,
      { role: 'user', content: safeMessage },
    ];

    const startTime = Date.now();
    let finalError = null;
    let successConfigId = 0;

    for (let i = 0; i < availableConfigs.length; i += 1) {
      const config = availableConfigs[i];
      const requestUrl = this.resolveChatApiUrl(config.provider, config.apiUrl);
      const requestModel = this.resolveChatModel(config.provider, config.model);
      try {
        const response = await ctx.curl(requestUrl, {
          method: 'POST',
          contentType: 'json',
          data: {
            model: requestModel,
            messages,
            temperature: 0.7,
            max_tokens: 1200,
          },
          headers: {
            Authorization: `Bearer ${config.apiKey}`,
          },
          timeout: 45000,
          dataType: 'json',
        });

        if (response.status !== 200) {
          throw new Error(`AI 服务返回异常状态：${response.status}`);
        }

        const content = String(response.data?.choices?.[0]?.message?.content || '').trim();
        if (!content) {
          throw new Error('AI 返回内容为空');
        }

        const tokensUsed = Number(response.data?.usage?.total_tokens || 0);
        const durationMs = Date.now() - startTime;
        successConfigId = Number(config.id || 0);
        if (i > 0) {
          ctx.logger.warn(
            `ai chat fallback success: using config=${successConfigId}, provider=${config.provider}`
          );
        }

        // 记录成功日志
        try {
          await ctx.service.uied.aiUsageLog.add({
            configId: successConfigId,
            featureType: 'chat',
            requestContent: safeMessage.substring(0, 200),
            responseStatus: 'success',
            tokensUsed,
            durationMs,
          });
        } catch (logErr) {
          ctx.logger.error('AI日志记录失败:', logErr);
        }

        return {
          reply: content,
          usage: response.data?.usage || null,
        };
      } catch (error) {
        finalError = error;
        ctx.logger.error(
          `AI对话请求失败: configId=${config.id}, provider=${config.provider}, error=${error.message || error}`
        );
        if (i < availableConfigs.length - 1) {
          continue;
        }
      }
    }

    const durationMs = Date.now() - startTime;
    const errorMessage = this.formatChatError(finalError, availableConfigs);

    // 记录失败日志
    try {
      await ctx.service.uied.aiUsageLog.add({
        configId: successConfigId || Number(availableConfigs[0]?.id || 0),
        featureType: 'chat',
        requestContent: safeMessage.substring(0, 200),
        responseStatus: 'failed',
        errorMessage,
        tokensUsed: 0,
        durationMs,
      });
    } catch (logErr) {
      ctx.logger.error('AI日志记录失败:', logErr);
    }
    throw new Error(errorMessage);
  }
}

module.exports = AiConfigService;
