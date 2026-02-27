/**
 * @file controller/uied/deliveryInit.js
 * @description 商业版交付初始化向导控制器
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

'use strict';

const baseController = require('../baseController');

class DeliveryInitController extends baseController {
  /**
   * 获取交付初始化预览（不落库）
   */
  async preview() {
    const { ctx } = this;
    try {
      const params = {
        ...(ctx.query || {}),
        ...(ctx.request.body || {}),
      };
      const data = await ctx.service.uied.deliveryInit.preview(params);
      this.result({ data });
    } catch (error) {
      ctx.logger.error('获取交付初始化预览失败:', error);
      this.result({ code: 500, message: error.message || '获取预览失败' });
    }
  }

  /**
   * 执行交付初始化导入
   */
  async execute() {
    const { ctx } = this;
    try {
      const body = ctx.request.body || {};
      const data = await ctx.service.uied.deliveryInit.execute(body);
      this.result({ data, message: '交付初始化执行成功' });
    } catch (error) {
      ctx.logger.error('执行交付初始化失败:', error);
      this.result({ code: 500, message: error.message || '交付初始化执行失败' });
    }
  }

  /**
   * 导出客户交付包（站点配置 + 分类标签 + license + feature）
   */
  async exportPackage() {
    const { ctx } = this;
    try {
      const params = {
        ...(ctx.query || {}),
        ...(ctx.request.body || {}),
      };
      const data = await ctx.service.uied.deliveryInit.exportCustomerPackage(params);
      const download = String(params.download || '').trim().toLowerCase();
      if ([ '1', 'true', 'yes', 'y' ].includes(download)) {
        const filename = `uied_customer_package_${Date.now()}.json`;
        ctx.set('Content-Type', 'application/json; charset=utf-8');
        ctx.set('Content-Disposition', `attachment; filename=${filename}`);
        ctx.body = JSON.stringify(data, null, 2);
        return;
      }
      this.result({ data });
    } catch (error) {
      ctx.logger.error('导出客户交付包失败:', error);
      this.result({ code: 500, message: error.message || '导出客户交付包失败' });
    }
  }
}

module.exports = DeliveryInitController;
