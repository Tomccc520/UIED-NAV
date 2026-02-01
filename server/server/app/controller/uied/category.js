/**
 * @file controller/uied/category.js
 * @description UIED 分类管理控制器
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

'use strict';

const baseController = require('../baseController');

class CategoryController extends baseController {
  /**
   * 获取分类列表（分页）
   */
  async list() {
    const { ctx } = this;
    try {
      const { pageNo = 1, pageSize = 50, keyword, parentId } = ctx.query;
      const result = await ctx.service.uied.category.list({
        page: parseInt(pageNo),
        pageSize: parseInt(pageSize),
        keyword,
        parentId: parentId !== undefined && parentId !== '' ? parseInt(parentId) : undefined,
      });
      this.result({ data: result });
    } catch (error) {
      ctx.logger.error('获取分类列表失败:', error);
      this.result({ code: 500, message: '获取分类列表失败' });
    }
  }

  /**
   * 获取所有分类（扁平列表，用于下拉选择）
   */
  async all() {
    const { ctx } = this;
    try {
      const result = await ctx.service.uied.category.all();
      this.result({ data: result });
    } catch (error) {
      ctx.logger.error('获取所有分类失败:', error);
      this.result({ code: 500, message: '获取所有分类失败' });
    }
  }

  /**
   * 获取分类详情
   */
  async detail() {
    const { ctx } = this;
    try {
      const { id } = ctx.query;
      if (!id) {
        return this.result({ code: 400, message: '缺少分类ID' });
      }
      const result = await ctx.service.uied.category.detail(id);
      if (!result) {
        return this.result({ code: 404, message: '分类不存在' });
      }
      this.result({ data: result });
    } catch (error) {
      ctx.logger.error('获取分类详情失败:', error);
      this.result({ code: 500, message: '获取分类详情失败' });
    }
  }


  /**
   * 创建分类
   */
  async add() {
    const { ctx } = this;
    try {
      const data = ctx.request.body;
      if (!data.name || !data.slug) {
        return this.result({ code: 400, message: '名称和别名不能为空' });
      }
      const result = await ctx.service.uied.category.add(data);
      this.result({ data: result, message: '创建成功' });
    } catch (error) {
      ctx.logger.error('创建分类失败:', error);
      if (error.message.includes('已存在')) {
        return this.result({ code: 400, message: error.message });
      }
      this.result({ code: 500, message: '创建分类失败' });
    }
  }

  /**
   * 更新分类
   */
  async edit() {
    const { ctx } = this;
    try {
      const data = ctx.request.body;
      if (!data.id) {
        return this.result({ code: 400, message: '缺少分类ID' });
      }
      const result = await ctx.service.uied.category.edit(data);
      this.result({ data: result, message: '更新成功' });
    } catch (error) {
      ctx.logger.error('更新分类失败:', error);
      if (error.message.includes('已存在') || error.message.includes('不存在')) {
        return this.result({ code: 400, message: error.message });
      }
      this.result({ code: 500, message: '更新分类失败' });
    }
  }

  /**
   * 删除分类
   */
  async del() {
    const { ctx } = this;
    try {
      const { id } = ctx.request.body;
      if (!id) {
        return this.result({ code: 400, message: '缺少分类ID' });
      }
      await ctx.service.uied.category.del(id);
      this.result({ message: '删除成功' });
    } catch (error) {
      ctx.logger.error('删除分类失败:', error);
      if (error.message.includes('存在')) {
        return this.result({ code: 400, message: error.message });
      }
      this.result({ code: 500, message: '删除分类失败' });
    }
  }

  /**
   * 更新分类排序
   */
  async sort() {
    const { ctx } = this;
    try {
      const { categories } = ctx.request.body;
      if (!categories || !Array.isArray(categories)) {
        return this.result({ code: 400, message: '参数错误' });
      }
      await ctx.service.uied.category.updateSort(categories);
      this.result({ message: '排序更新成功' });
    } catch (error) {
      ctx.logger.error('更新排序失败:', error);
      this.result({ code: 500, message: '更新排序失败' });
    }
  }
}

module.exports = CategoryController;
