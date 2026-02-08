/**
 * @file controller/uied/articleCategory.js
 * @description 文章分类控制器
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

'use strict';

const Controller = require('egg').Controller;

class ArticleCategoryController extends Controller {
  /**
   * 获取分类列表（分页）
   * GET /api/uied/articleCategory/list
   */
  async list() {
    const { ctx } = this;
    try {
      const { pageNo = 1, pageSize = 20, keyword } = ctx.query;
      const result = await ctx.service.uied.articleCategory.list({
        page: parseInt(pageNo),
        pageSize: parseInt(pageSize),
        keyword,
      });
      ctx.body = {
        code: 200,
        msg: '获取成功',
        data: result,
      };
    } catch (error) {
      ctx.logger.error('获取文章分类列表失败:', error);
      ctx.body = {
        code: 500,
        msg: '获取分类列表失败',
      };
    }
  }

  /**
   * 获取所有分类
   * GET /api/uied/articleCategory/all
   */
  async all() {
    const { ctx } = this;
    try {
      const result = await ctx.service.uied.articleCategory.all();
      ctx.body = {
        code: 200,
        msg: '获取成功',
        data: result,
      };
    } catch (error) {
      ctx.logger.error('获取所有文章分类失败:', error);
      ctx.body = {
        code: 500,
        msg: '获取分类失败',
      };
    }
  }

  /**
   * 添加分类
   * POST /api/uied/articleCategory/add
   */
  async add() {
    const { ctx } = this;
    const data = ctx.request.body;

    if (!data.name || !data.slug) {
      ctx.body = { code: 400, msg: '名称和标识不能为空' };
      return;
    }

    try {
      const result = await ctx.service.uied.articleCategory.add(data);
      ctx.body = {
        code: 200,
        msg: '创建成功',
        data: result,
      };
    } catch (error) {
      ctx.logger.error('创建文章分类失败:', error);
      if (error.message && error.message.includes('已存在')) {
        ctx.body = { code: 400, msg: error.message };
        return;
      }
      ctx.body = {
        code: 500,
        msg: '创建分类失败',
      };
    }
  }

  /**
   * 编辑分类
   * POST /api/uied/articleCategory/edit
   */
  async edit() {
    const { ctx } = this;
    const data = ctx.request.body;

    if (!data.id) {
      ctx.body = { code: 400, msg: '缺少分类ID' };
      return;
    }

    try {
      const result = await ctx.service.uied.articleCategory.edit(data);
      ctx.body = {
        code: 200,
        msg: '更新成功',
        data: result,
      };
    } catch (error) {
      ctx.logger.error('编辑文章分类失败:', error);
      if (error.message && (error.message.includes('已存在') || error.message.includes('不存在'))) {
        ctx.body = { code: 400, msg: error.message };
        return;
      }
      ctx.body = {
        code: 500,
        msg: '更新分类失败',
      };
    }
  }

  /**
   * 删除分类（软删除）
   * POST /api/uied/articleCategory/del
   */
  async del() {
    const { ctx } = this;
    const { id } = ctx.request.body;

    if (!id) {
      ctx.body = { code: 400, msg: '缺少分类ID' };
      return;
    }

    try {
      await ctx.service.uied.articleCategory.del(parseInt(id));
      ctx.body = {
        code: 200,
        msg: '删除成功',
      };
    } catch (error) {
      ctx.logger.error('删除文章分类失败:', error);
      ctx.body = {
        code: 500,
        msg: '删除分类失败',
      };
    }
  }
}

module.exports = ArticleCategoryController;
