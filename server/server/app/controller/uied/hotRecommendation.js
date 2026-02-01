/**
 * @file controller/uied/hotRecommendation.js
 * @description UIED 热门推荐控制器
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

'use strict';

const baseController = require('../baseController');

class HotRecommendationController extends baseController {
  /**
   * 获取热门推荐列表
   */
  async list() {
    const { ctx } = this;
    try {
      const { pageNo = 1, pageSize = 20, position } = ctx.query;
      const result = await ctx.service.uied.hotRecommendation.list({
        page: parseInt(pageNo),
        pageSize: parseInt(pageSize),
        position,
      });
      this.result({ data: result });
    } catch (error) {
      ctx.logger.error('获取热门推荐列表失败:', error);
      this.result({ code: 500, message: '获取热门推荐列表失败' });
    }
  }

  /**
   * 获取热门推荐详情
   */
  async detail() {
    const { ctx } = this;
    try {
      const { id } = ctx.query;
      if (!id) {
        return this.result({ code: 400, message: '缺少ID' });
      }
      const result = await ctx.service.uied.hotRecommendation.detail(id);
      if (!result) {
        return this.result({ code: 404, message: '推荐不存在' });
      }
      this.result({ data: result });
    } catch (error) {
      ctx.logger.error('获取热门推荐详情失败:', error);
      this.result({ code: 500, message: '获取热门推荐详情失败' });
    }
  }

  /**
   * 创建热门推荐
   */
  async add() {
    const { ctx } = this;
    try {
      const data = ctx.request.body;
      if (!data.websiteId) {
        return this.result({ code: 400, message: '请选择网站' });
      }
      const result = await ctx.service.uied.hotRecommendation.add(data);
      this.result({ data: result, message: '创建成功' });
    } catch (error) {
      ctx.logger.error('创建热门推荐失败:', error);
      this.result({ code: 500, message: '创建热门推荐失败' });
    }
  }

  /**
   * 更新热门推荐
   */
  async edit() {
    const { ctx } = this;
    try {
      const data = ctx.request.body;
      if (!data.id) {
        return this.result({ code: 400, message: '缺少ID' });
      }
      const result = await ctx.service.uied.hotRecommendation.edit(data);
      this.result({ data: result, message: '更新成功' });
    } catch (error) {
      ctx.logger.error('更新热门推荐失败:', error);
      this.result({ code: 500, message: '更新热门推荐失败' });
    }
  }

  /**
   * 删除热门推荐
   */
  async del() {
    const { ctx } = this;
    try {
      const { id } = ctx.request.body;
      if (!id) {
        return this.result({ code: 400, message: '缺少ID' });
      }
      await ctx.service.uied.hotRecommendation.del(id);
      this.result({ message: '删除成功' });
    } catch (error) {
      ctx.logger.error('删除热门推荐失败:', error);
      this.result({ code: 500, message: '删除热门推荐失败' });
    }
  }
}

module.exports = HotRecommendationController;
