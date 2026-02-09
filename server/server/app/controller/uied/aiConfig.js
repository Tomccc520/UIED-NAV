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
      const data = ctx.request.body;
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
      const { provider, apiKey, apiUrl } = ctx.request.body;
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
      const data = ctx.request.body;
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
      const data = ctx.request.body;
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
      this.result({ code: 500, message: error.message || 'AI对话失败' });
    }
  }
}

module.exports = AiConfigController;
