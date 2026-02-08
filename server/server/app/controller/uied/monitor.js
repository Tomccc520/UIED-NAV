/**
 * @file controller/uied/monitor.js
 * @description 网站监控控制器
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

'use strict';

const baseController = require('../baseController');

class MonitorController extends baseController {
  /**
   * 获取监控统计
   */
  async statistics() {
    const { ctx } = this;
    try {
      const result = await ctx.service.uied.monitor.getStatistics();
      this.result({ data: result });
    } catch (error) {
      ctx.logger.error('获取监控统计失败:', error);
      this.result({ code: 500, message: '获取统计失败' });
    }
  }

  /**
   * 获取失效网站列表
   */
  async failedWebsites() {
    const { ctx } = this;
    try {
      const { pageNo = 1, pageSize = 20 } = ctx.query;
      const result = await ctx.service.uied.monitor.getFailedWebsites({
        page: parseInt(pageNo),
        pageSize: parseInt(pageSize),
      });
      this.result({ data: result });
    } catch (error) {
      ctx.logger.error('获取失效网站列表失败:', error);
      this.result({ code: 500, message: '获取列表失败' });
    }
  }

  /**
   * 获取监控配置
   */
  async getConfig() {
    const { ctx } = this;
    try {
      const result = await ctx.service.uied.monitor.getConfig();
      this.result({ data: result });
    } catch (error) {
      ctx.logger.error('获取监控配置失败:', error);
      this.result({ code: 500, message: '获取配置失败' });
    }
  }

  /**
   * 更新监控配置
   */
  async updateConfig() {
    const { ctx } = this;
    try {
      const { checkInterval, timeout, maxRetries, enabled } = ctx.request.body;
      const result = await ctx.service.uied.monitor.updateConfig({
        checkInterval: parseInt(checkInterval) || 86400,
        timeout: parseInt(timeout) || 10000,
        maxRetries: parseInt(maxRetries) || 3,
        enabled: enabled !== false,
      });
      this.result({ data: result, message: '配置已更新' });
    } catch (error) {
      ctx.logger.error('更新监控配置失败:', error);
      this.result({ code: 500, message: '更新配置失败' });
    }
  }

  /**
   * 检查单个网站
   */
  async checkWebsite() {
    const { ctx } = this;
    try {
      const { id } = ctx.request.body;
      if (!id) {
        return this.result({ code: 400, message: '缺少网站ID' });
      }
      const result = await ctx.service.uied.monitor.checkWebsite(parseInt(id));
      this.result({ data: result });
    } catch (error) {
      ctx.logger.error('检查网站失败:', error);
      this.result({ code: 500, message: error.message || '检查失败' });
    }
  }

  /**
   * 检查所有网站
   */
  async checkAll() {
    const { ctx } = this;
    try {
      const { batchSize = 10, delayMs = 1000 } = ctx.request.body;
      const result = await ctx.service.uied.monitor.checkAllWebsites({
        batchSize: parseInt(batchSize),
        delayMs: parseInt(delayMs),
      });
      this.result({ data: result, message: '检查完成' });
    } catch (error) {
      ctx.logger.error('检查所有网站失败:', error);
      this.result({ code: 500, message: '检查失败' });
    }
  }

  /**
   * 重置网站状态
   */
  async resetStatus() {
    const { ctx } = this;
    try {
      const { id } = ctx.request.body;
      if (!id) {
        return this.result({ code: 400, message: '缺少网站ID' });
      }
      await ctx.service.uied.monitor.resetWebsiteStatus(parseInt(id));
      this.result({ message: '状态已重置' });
    } catch (error) {
      ctx.logger.error('重置状态失败:', error);
      this.result({ code: 500, message: '重置失败' });
    }
  }
}

module.exports = MonitorController;
