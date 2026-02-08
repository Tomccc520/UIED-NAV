/**
 * @file controller/uied/article.js
 * @description UIED 文章管理控制器
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

'use strict';

const Controller = require('egg').Controller;

class ArticleController extends Controller {
  /**
   * 获取文章列表
   * GET /api/uied/article/list
   */
  async list() {
    const { ctx } = this;
    const params = ctx.query;
    
    try {
      const result = await ctx.service.uied.article.list(params);
      ctx.body = {
        code: 200,
        msg: '获取成功',
        data: result,
      };
    } catch (error) {
      ctx.logger.error('获取文章列表失败:', error);
      ctx.body = {
        code: 500,
        msg: error.message || '获取失败',
      };
    }
  }

  /**
   * 获取文章详情
   * GET /api/uied/article/detail
   */
  async detail() {
    const { ctx } = this;
    const { id } = ctx.query;

    if (!id) {
      ctx.body = { code: 400, msg: '缺少文章ID' };
      return;
    }

    try {
      const article = await ctx.service.uied.article.detail(id);
      if (!article) {
        ctx.body = { code: 404, msg: '文章不存在' };
        return;
      }
      ctx.body = {
        code: 200,
        msg: '获取成功',
        data: article,
      };
    } catch (error) {
      ctx.logger.error('获取文章详情失败:', error);
      ctx.body = {
        code: 500,
        msg: error.message || '获取失败',
      };
    }
  }

  /**
   * 创建文章
   * POST /api/uied/article/add
   */
  async add() {
    const { ctx } = this;
    const data = ctx.request.body;

    if (!data.title) {
      ctx.body = { code: 400, msg: '标题不能为空' };
      return;
    }

    try {
      const id = await ctx.service.uied.article.add(data);
      ctx.body = {
        code: 200,
        msg: '创建成功',
        data: { id },
      };
    } catch (error) {
      ctx.logger.error('创建文章失败:', error);
      ctx.body = {
        code: 500,
        msg: error.message || '创建失败',
      };
    }
  }

  /**
   * 更新文章
   * POST /api/uied/article/edit
   */
  async edit() {
    const { ctx } = this;
    const data = ctx.request.body;

    if (!data.id) {
      ctx.body = { code: 400, msg: '缺少文章ID' };
      return;
    }

    try {
      await ctx.service.uied.article.edit(data.id, data);
      ctx.body = {
        code: 200,
        msg: '更新成功',
      };
    } catch (error) {
      ctx.logger.error('更新文章失败:', error);
      ctx.body = {
        code: 500,
        msg: error.message || '更新失败',
      };
    }
  }

  /**
   * 删除文章
   * POST /api/uied/article/del
   */
  async del() {
    const { ctx } = this;
    const { ids } = ctx.request.body;

    if (!ids || (Array.isArray(ids) && ids.length === 0)) {
      ctx.body = { code: 400, msg: '缺少文章ID' };
      return;
    }

    try {
      await ctx.service.uied.article.del(ids);
      ctx.body = {
        code: 200,
        msg: '删除成功',
      };
    } catch (error) {
      ctx.logger.error('删除文章失败:', error);
      ctx.body = {
        code: 500,
        msg: error.message || '删除失败',
      };
    }
  }

  /**
   * 批量更新文章状态（发布/取消发布）
   * POST /api/uied/article/batchStatus
   */
  async batchStatus() {
    const { ctx } = this;
    const { ids, status } = ctx.request.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      ctx.body = { code: 400, msg: '缺少文章ID列表' };
      return;
    }

    if (!status || !['published', 'draft'].includes(status)) {
      ctx.body = { code: 400, msg: '状态值无效，仅支持 published 或 draft' };
      return;
    }

    try {
      const count = await ctx.service.uied.article.batchUpdateStatus(ids, status);
      ctx.body = {
        code: 200,
        msg: '操作成功',
        data: { count },
      };
    } catch (error) {
      ctx.logger.error('批量更新文章状态失败:', error);
      ctx.body = {
        code: 500,
        msg: error.message || '操作失败',
      };
    }
  }

  /**
   * 获取文章分类列表
   * GET /api/uied/article/categories
   */
  async categories() {
    const { ctx } = this;

    try {
      const categories = await ctx.service.uied.article.categories();
      ctx.body = {
        code: 200,
        msg: '获取成功',
        data: categories,
      };
    } catch (error) {
      ctx.logger.error('获取文章分类失败:', error);
      ctx.body = {
        code: 500,
        msg: error.message || '获取失败',
      };
    }
  }
}

module.exports = ArticleController;
