/**
 * @file controller/uied/page.js
 * @description UIED 页面管理控制器
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

'use strict';

const baseController = require('../baseController');

class PageController extends baseController {
  /**
   * 获取页面列表
   */
  async list() {
    const { ctx } = this;
    try {
      const { pageNo = 1, pageSize = 20 } = ctx.query;
      const result = await ctx.service.uied.page.list({
        page: parseInt(pageNo),
        pageSize: parseInt(pageSize),
      });
      this.result({ data: result });
    } catch (error) {
      ctx.logger.error('获取页面列表失败:', error);
      this.result({ code: 500, message: '获取页面列表失败' });
    }
  }

  /**
   * 获取所有页面（下拉选择）
   */
  async all() {
    const { ctx } = this;
    try {
      const result = await ctx.service.uied.page.all();
      this.result({ data: result });
    } catch (error) {
      ctx.logger.error('获取所有页面失败:', error);
      this.result({ code: 500, message: '获取所有页面失败' });
    }
  }

  /**
   * 获取页面详情
   */
  async detail() {
    const { ctx } = this;
    try {
      const { id, slug } = ctx.query;
      if (!id && !slug) {
        return this.result({ code: 400, message: '缺少页面ID或slug' });
      }
      const result = await ctx.service.uied.page.detail(id, slug);
      if (!result) {
        return this.result({ code: 404, message: '页面不存在' });
      }
      this.result({ data: result });
    } catch (error) {
      ctx.logger.error('获取页面详情失败:', error);
      this.result({ code: 500, message: '获取页面详情失败' });
    }
  }

  /**
   * 创建页面
   */
  async add() {
    const { ctx } = this;
    try {
      const data = ctx.request.body;
      if (!data.name || !data.slug) {
        return this.result({ code: 400, message: '名称和别名不能为空' });
      }
      const result = await ctx.service.uied.page.add(data);
      this.result({ data: result, message: '创建成功' });
    } catch (error) {
      ctx.logger.error('创建页面失败:', error);
      if (error.message.includes('已存在')) {
        return this.result({ code: 400, message: error.message });
      }
      this.result({ code: 500, message: '创建页面失败' });
    }
  }

  /**
   * 更新页面
   */
  async edit() {
    const { ctx } = this;
    try {
      const data = ctx.request.body;
      if (!data.id) {
        return this.result({ code: 400, message: '缺少页面ID' });
      }
      const result = await ctx.service.uied.page.edit(data);
      this.result({ data: result, message: '更新成功' });
    } catch (error) {
      ctx.logger.error('更新页面失败:', error);
      this.result({ code: 500, message: '更新页面失败' });
    }
  }

  /**
   * 删除页面
   */
  async del() {
    const { ctx } = this;
    try {
      const { id } = ctx.request.body;
      if (!id) {
        return this.result({ code: 400, message: '缺少页面ID' });
      }
      await ctx.service.uied.page.del(id);
      this.result({ message: '删除成功' });
    } catch (error) {
      ctx.logger.error('删除页面失败:', error);
      this.result({ code: 500, message: '删除页面失败' });
    }
  }

  /**
   * 获取页面分类
   */
  async categories() {
    const { ctx } = this;
    try {
      const { id, slug } = ctx.query;
      if (!id && !slug) {
        return this.result({ code: 400, message: '缺少页面ID或slug' });
      }
      const result = await ctx.service.uied.page.getCategories(id, slug);
      this.result({ data: result });
    } catch (error) {
      ctx.logger.error('获取页面分类失败:', error);
      this.result({ code: 500, message: '获取页面分类失败' });
    }
  }

  /**
   * 更新页面分类
   */
  async updateCategories() {
    const { ctx } = this;
    try {
      const { pageId, categoryIds } = ctx.request.body;
      if (!pageId) {
        return this.result({ code: 400, message: '缺少页面ID' });
      }
      await ctx.service.uied.page.updateCategories(pageId, categoryIds || []);
      this.result({ message: '更新成功' });
    } catch (error) {
      ctx.logger.error('更新页面分类失败:', error);
      this.result({ code: 500, message: '更新页面分类失败' });
    }
  }
}

module.exports = PageController;
