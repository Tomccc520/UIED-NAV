/**
 * @file controller/uied/setting.js
 * @description UIED 站点设置控制器
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

'use strict';

const baseController = require('../baseController');

class SettingController extends baseController {
  /**
   * 获取站点设置
   */
  async get() {
    const { ctx } = this;
    try {
      const { key } = ctx.query;
      if (key) {
        const result = await ctx.service.uied.setting.get(key);
        this.result({ data: result });
      } else {
        const result = await ctx.service.uied.setting.getAll();
        this.result({ data: result });
      }
    } catch (error) {
      ctx.logger.error('获取站点设置失败:', error);
      this.result({ code: 500, message: '获取站点设置失败' });
    }
  }

  /**
   * 保存站点设置
   */
  async save() {
    const { ctx } = this;
    try {
      const data = ctx.request.body;
      await ctx.service.uied.setting.save(data);
      this.result({ message: '保存成功' });
    } catch (error) {
      ctx.logger.error('保存站点设置失败:', error);
      this.result({ code: 500, message: '保存站点设置失败' });
    }
  }

  /**
   * 获取站点信息
   */
  async siteInfo() {
    const { ctx } = this;
    try {
      const result = await ctx.service.uied.setting.getSiteInfo();
      this.result({ data: result });
    } catch (error) {
      ctx.logger.error('获取站点信息失败:', error);
      this.result({ code: 500, message: '获取站点信息失败' });
    }
  }

  /**
   * 保存站点信息
   */
  async saveSiteInfo() {
    const { ctx } = this;
    try {
      const data = ctx.request.body;
      await ctx.service.uied.setting.saveSiteInfo(data);
      this.result({ message: '保存成功' });
    } catch (error) {
      ctx.logger.error('保存站点信息失败:', error);
      this.result({ code: 500, message: '保存站点信息失败' });
    }
  }

  /**
   * 获取公开设置（前端访问）
   */
  async publicSettings() {
    const { ctx } = this;
    try {
      const result = await ctx.service.uied.setting.getPublicSettings();
      this.result({ data: result });
    } catch (error) {
      ctx.logger.error('获取公开设置失败:', error);
      this.result({ code: 500, message: '获取公开设置失败' });
    }
  }
}

module.exports = SettingController;
