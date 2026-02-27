/**
 * @file controller/uied/articleTag.js
 * @description 文章标签控制器
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

'use strict';

const Controller = require('egg').Controller;

class ArticleTagController extends Controller {
  /**
   * 获取标签列表（分页）
   * GET /api/uied/articleTag/list
   */
  async list() {
    const { ctx } = this;
    try {
      const { pageNo, page, pageSize = 20, keyword } = ctx.query;
      const result = await ctx.service.uied.articleTag.list({
        page: parseInt(pageNo || page || 1),
        pageSize: parseInt(pageSize),
        keyword,
      });
      ctx.body = {
        code: 200,
        msg: '获取成功',
        data: result,
      };
    } catch (error) {
      ctx.logger.error('获取文章标签列表失败:', error);
      ctx.body = {
        code: 500,
        msg: '获取标签列表失败',
      };
    }
  }

  /**
   * 获取所有标签
   * GET /api/uied/articleTag/all
   */
  async all() {
    const { ctx } = this;
    try {
      const result = await ctx.service.uied.articleTag.all();
      ctx.body = {
        code: 200,
        msg: '获取成功',
        data: result,
      };
    } catch (error) {
      ctx.logger.error('获取所有文章标签失败:', error);
      ctx.body = {
        code: 500,
        msg: '获取标签失败',
      };
    }
  }

  /**
   * 添加标签
   * POST /api/uied/articleTag/add
   */
  async add() {
    const { ctx } = this;
    const data = ctx.request.body;

    if (!data.name) {
      ctx.body = { code: 400, msg: '名称不能为空' };
      return;
    }

    try {
      const result = await ctx.service.uied.articleTag.add(data);
      ctx.body = {
        code: 200,
        msg: '创建成功',
        data: result,
      };
    } catch (error) {
      ctx.logger.error('创建文章标签失败:', error);
      if (error.message && error.message.includes('已存在')) {
        ctx.body = { code: 400, msg: error.message };
        return;
      }
      ctx.body = {
        code: 500,
        msg: '创建标签失败',
      };
    }
  }

  /**
   * 编辑标签
   * POST /api/uied/articleTag/edit
   */
  async edit() {
    const { ctx } = this;
    const data = ctx.request.body;

    if (!data.id) {
      ctx.body = { code: 400, msg: '缺少标签ID' };
      return;
    }

    try {
      const result = await ctx.service.uied.articleTag.edit(data);
      ctx.body = {
        code: 200,
        msg: '更新成功',
        data: result,
      };
    } catch (error) {
      ctx.logger.error('编辑文章标签失败:', error);
      if (error.message && (error.message.includes('已存在') || error.message.includes('不存在'))) {
        ctx.body = { code: 400, msg: error.message };
        return;
      }
      ctx.body = {
        code: 500,
        msg: '更新标签失败',
      };
    }
  }

  /**
   * 删除标签
   * POST /api/uied/articleTag/del
   */
  async del() {
    const { ctx } = this;
    const { id } = ctx.request.body;

    if (!id) {
      ctx.body = { code: 400, msg: '缺少标签ID' };
      return;
    }

    try {
      await ctx.service.uied.articleTag.del(parseInt(id));
      ctx.body = {
        code: 200,
        msg: '删除成功',
      };
    } catch (error) {
      ctx.logger.error('删除文章标签失败:', error);
      ctx.body = {
        code: 500,
        msg: '删除标签失败',
      };
    }
  }

  /**
   * 获取文章的标签
   * GET /api/uied/articleTag/articleTags?articleId=X
   */
  async articleTags() {
    const { ctx } = this;
    const { articleId } = ctx.query;

    if (!articleId) {
      ctx.body = { code: 400, msg: '缺少文章ID' };
      return;
    }

    try {
      const result = await ctx.service.uied.articleTag.getArticleTags(parseInt(articleId));
      ctx.body = {
        code: 200,
        msg: '获取成功',
        data: result,
      };
    } catch (error) {
      ctx.logger.error('获取文章标签失败:', error);
      ctx.body = {
        code: 500,
        msg: '获取文章标签失败',
      };
    }
  }

  /**
   * 设置文章标签
   * POST /api/uied/articleTag/setArticleTags
   */
  async setArticleTags() {
    const { ctx } = this;
    const { articleId, tagIds } = ctx.request.body;

    if (!articleId) {
      ctx.body = { code: 400, msg: '缺少文章ID' };
      return;
    }

    try {
      const result = await ctx.service.uied.articleTag.setArticleTags(
        parseInt(articleId),
        tagIds || []
      );
      ctx.body = {
        code: 200,
        msg: '设置成功',
        data: result,
      };
    } catch (error) {
      ctx.logger.error('设置文章标签失败:', error);
      ctx.body = {
        code: 500,
        msg: '设置文章标签失败',
      };
    }
  }
}

module.exports = ArticleTagController;
