/**
 * @file controller/uied/commercialSlot.js
 * @description UIED 商业位体系控制器（广告位配置/投放记录）
 * @author UIED技术团队
 * @copyright Tomda (https://www.tomda.top)
 * @copyright UIED技术团队 (https://fsuied.com)
 * @createDate 2026-02-23
 */

'use strict';

const baseController = require('../baseController');

class CommercialSlotController extends baseController {
  /**
   * 获取广告位配置列表
   */
  async slotList() {
    const { ctx } = this;
    const params = { ...ctx.query, ...ctx.request.body };
    try {
      const list = await ctx.service.uied.commercialSlot.slotList(params);
      this.result({
        data: {
          list,
          total: Array.isArray(list) ? list.length : 0,
        },
      });
    } catch (error) {
      ctx.logger.error('获取商业位配置列表失败:', error);
      this.result({ code: 500, message: error.message || '获取商业位配置列表失败' });
    }
  }

  /**
   * 保存广告位配置
   */
  async slotSave() {
    const { ctx } = this;
    const body = ctx.request.body || {};
    try {
      const data = await ctx.service.uied.commercialSlot.slotSave(body);
      this.result({ data, message: '保存成功' });
    } catch (error) {
      ctx.logger.error('保存商业位配置失败:', error);
      this.result({ code: 500, message: error.message || '保存商业位配置失败' });
    }
  }

  /**
   * 删除广告位配置
   */
  async slotDel() {
    const { ctx } = this;
    const id = Number(ctx.request.body?.id || 0);
    if (!id) {
      this.result({ code: 400, message: '缺少广告位ID' });
      return;
    }
    try {
      const data = await ctx.service.uied.commercialSlot.slotDel(id);
      this.result({ data, message: '删除成功' });
    } catch (error) {
      ctx.logger.error('删除商业位配置失败:', error);
      this.result({ code: 500, message: error.message || '删除商业位配置失败' });
    }
  }

  /**
   * 获取投放记录列表
   */
  async bookingList() {
    const { ctx } = this;
    const params = { ...ctx.query, ...ctx.request.body };
    try {
      const data = await ctx.service.uied.commercialSlot.bookingList(params);
      this.result({ data });
    } catch (error) {
      ctx.logger.error('获取商业位投放记录失败:', error);
      this.result({ code: 500, message: error.message || '获取商业位投放记录失败' });
    }
  }

  /**
   * 保存投放记录
   */
  async bookingSave() {
    const { ctx } = this;
    const body = ctx.request.body || {};
    try {
      const data = await ctx.service.uied.commercialSlot.bookingSave(body);
      this.result({ data, message: '保存成功' });
    } catch (error) {
      ctx.logger.error('保存商业位投放记录失败:', error);
      this.result({ code: 500, message: error.message || '保存商业位投放记录失败' });
    }
  }

  /**
   * 删除投放记录
   */
  async bookingDel() {
    const { ctx } = this;
    const id = Number(ctx.request.body?.id || 0);
    if (!id) {
      this.result({ code: 400, message: '缺少投放记录ID' });
      return;
    }
    try {
      const data = await ctx.service.uied.commercialSlot.bookingDel(id);
      this.result({ data, message: '删除成功' });
    } catch (error) {
      ctx.logger.error('删除商业位投放记录失败:', error);
      this.result({ code: 500, message: error.message || '删除商业位投放记录失败' });
    }
  }

  /**
   * 获取后台字段草案
   */
  async schema() {
    const { ctx } = this;
    try {
      const [ draft, slots ] = await Promise.all([
        ctx.service.uied.commercialSlot.getFieldDraft(),
        ctx.service.uied.commercialSlot.slotList({ includeDisabled: true }),
      ]);
      this.result({
        data: {
          draft,
          slots,
        },
      });
    } catch (error) {
      ctx.logger.error('获取商业位字段草案失败:', error);
      this.result({ code: 500, message: error.message || '获取商业位字段草案失败' });
    }
  }
}

module.exports = CommercialSlotController;
