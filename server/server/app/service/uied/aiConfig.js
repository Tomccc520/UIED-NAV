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
    
    let [config] = await app.model.query(
      'SELECT * FROM uied_ai_config WHERE is_enabled = 1 AND is_default = 1 LIMIT 1',
      { type: app.Sequelize.QueryTypes.SELECT }
    );
    
    if (!config) {
      [config] = await app.model.query(
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
    
    const [result] = await app.model.query(
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
        { replacements: [data.id], type: app.Sequelize.QueryTypes.UPDATE }
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
      { replacements: [id], type: app.Sequelize.QueryTypes.DELETE }
    );
  }

  /**
   * 获取当前 AI 配置（用于前端页面）
   */
  async getConfig() {
    const { app } = this;
    
    // 获取默认配置或第一个配置
    let [config] = await app.model.query(
      'SELECT * FROM uied_ai_config WHERE is_default = 1 LIMIT 1',
      { type: app.Sequelize.QueryTypes.SELECT }
    );
    
    if (!config) {
      [config] = await app.model.query(
        'SELECT * FROM uied_ai_config LIMIT 1',
        { type: app.Sequelize.QueryTypes.SELECT }
      );
    }
    
    if (!config) {
      return {
        enabled: false,
        provider: 'openai',
        apiKey: '',
        apiUrl: '',
        model: 'gpt-3.5-turbo',
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
    const [existing] = await app.model.query(
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
            data.provider || 'openai',
            data.apiUrl || '',
            data.apiKey || '',
            data.model || 'gpt-3.5-turbo',
            data.enabled ? 1 : 0,
            now,
            existing.id,
          ],
          type: app.Sequelize.QueryTypes.UPDATE,
        }
      );
      return { id: existing.id, ...data };
    } else {
      // 创建新配置
      const [result] = await app.model.query(
        `INSERT INTO uied_ai_config (name, provider, api_url, api_key, model, is_enabled, is_default, create_time, update_time)
         VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)`,
        {
          replacements: [
            'default',
            data.provider || 'openai',
            data.apiUrl || '',
            data.apiKey || '',
            data.model || 'gpt-3.5-turbo',
            data.enabled ? 1 : 0,
            now,
            now,
          ],
          type: app.Sequelize.QueryTypes.INSERT,
        }
      );
      return { id: result, ...data };
    }
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
      const testUrl = apiUrl || 'https://api.openai.com/v1/chat/completions';
      
      const response = await ctx.curl(testUrl, {
        method: 'POST',
        contentType: 'json',
        data: {
          model: 'gpt-3.5-turbo',
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
      } else {
        return { success: false, message: `API 返回错误: ${response.status}` };
      }
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
      } catch {
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
    let responseStatus = 'success';
    let errorMessage = '';
    let tokensUsed = 0;

    try {
      // 调用 AI API
      const response = await ctx.curl(config.apiUrl, {
        method: 'POST',
        contentType: 'json',
        data: {
          model: config.model,
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

    const [setting] = await app.model.query(
      'SELECT `value` FROM uied_site_setting WHERE `key` = ?',
      { replacements: ['ai_feature_toggle'], type: app.Sequelize.QueryTypes.SELECT }
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
    } catch {
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
        replacements: ['ai_feature_toggle', valueStr, now, now, valueStr, now],
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
   * @returns {Object} 包含 taskId、total 和 results 的结果对象
   */
  async batchGenerate(websiteIds, fields = ['description', 'tags']) {
    const { ctx, app } = this;
    const taskId = `batch_${Date.now()}`;
    const results = [];

    // 获取默认 AI 配置（用于日志记录 configId）
    const config = await this.getDefault();
    const configId = config?.id || 0;

    // 查询所有目标网站的基本信息
    const websites = await app.model.query(
      `SELECT id, name, url, description, tags FROM uied_website WHERE id IN (?) AND is_delete = 0`,
      { replacements: [websiteIds.length > 0 ? websiteIds : [0]], type: app.Sequelize.QueryTypes.SELECT }
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
   * @returns {Object} 包含 updated（成功数）和 failed（失败数）的结果
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
   * AI 对话
   */
  async chat(message, context = []) {
    const { ctx } = this;
    
    const config = await this.getDefault();
    if (!config) {
      throw new Error('没有可用的 AI 配置');
    }
    
    const systemPrompt = `你是 UIED 设计导航的 AI 助手，专注于帮助设计师解决问题。`;
    
    const messages = [
      { role: 'system', content: systemPrompt },
      ...context.slice(-6),
      { role: 'user', content: message },
    ];

    const startTime = Date.now();
    
    try {
      const response = await ctx.curl(config.apiUrl, {
        method: 'POST',
        contentType: 'json',
        data: {
          model: config.model,
          messages,
          temperature: 0.7,
          max_tokens: 1000,
        },
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
        },
        timeout: 30000,
        dataType: 'json',
      });
      
      if (response.status !== 200) {
        throw new Error('AI 服务暂时不可用');
      }
      
      const content = response.data.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error('AI 返回内容为空');
      }

      const tokensUsed = response.data.usage?.total_tokens || 0;
      const durationMs = Date.now() - startTime;

      // 记录成功日志
      try {
        await ctx.service.uied.aiUsageLog.add({
          configId: config.id || 0,
          featureType: 'chat',
          requestContent: message.substring(0, 200),
          responseStatus: 'success',
          tokensUsed,
          durationMs,
        });
      } catch (logErr) {
        ctx.logger.error('AI日志记录失败:', logErr);
      }
      
      return {
        reply: content,
        usage: response.data.usage || null,
      };
    } catch (error) {
      const durationMs = Date.now() - startTime;

      // 记录失败日志
      try {
        await ctx.service.uied.aiUsageLog.add({
          configId: config.id || 0,
          featureType: 'chat',
          requestContent: message.substring(0, 200),
          responseStatus: 'failed',
          errorMessage: error.message || 'AI 对话失败',
          tokensUsed: 0,
          durationMs,
        });
      } catch (logErr) {
        ctx.logger.error('AI日志记录失败:', logErr);
      }

      throw error;
    }
  }
}

module.exports = AiConfigService;
