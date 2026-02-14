/**
 * @file controller/uied/comment.js
 * @description UIED 评论管理控制器
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

'use strict';

const Controller = require('egg').Controller;

class CommentController extends Controller {
  /**
   * 获取评论列表
   * GET /api/uied/comment/list
   */
  async list() {
    const { ctx } = this;
    const params = ctx.query;

    try {
      const result = await ctx.service.uied.comment.list(params);
      ctx.body = {
        code: 200,
        msg: '获取成功',
        data: result,
      };
    } catch (error) {
      ctx.logger.error('获取评论列表失败:', error);
      ctx.body = {
        code: 500,
        msg: error.message || '获取失败',
      };
    }
  }

  /**
   * 获取评论详情
   * GET /api/uied/comment/detail
   */
  async detail() {
    const { ctx } = this;
    const { id, type = 'website' } = ctx.query;

    if (!id) {
      ctx.body = { code: 400, msg: '缺少评论ID' };
      return;
    }

    try {
      const comment = await ctx.service.uied.comment.detail(id, type);
      if (!comment) {
        ctx.body = { code: 404, msg: '评论不存在' };
        return;
      }
      ctx.body = {
        code: 200,
        msg: '获取成功',
        data: comment,
      };
    } catch (error) {
      ctx.logger.error('获取评论详情失败:', error);
      ctx.body = {
        code: 500,
        msg: error.message || '获取失败',
      };
    }
  }

  /**
   * 批准评论
   * POST /api/uied/comment/approve
   */
  async approve() {
    const { ctx } = this;
    const { id, type = 'website' } = ctx.request.body;

    if (!id) {
      ctx.body = { code: 400, msg: '缺少评论ID' };
      return;
    }

    try {
      await ctx.service.uied.comment.approve(id, type);
      ctx.body = {
        code: 200,
        msg: '评论已批准',
      };
    } catch (error) {
      ctx.logger.error('批准评论失败:', error);
      ctx.body = {
        code: 500,
        msg: error.message || '操作失败',
      };
    }
  }

  /**
   * 拒绝评论
   * POST /api/uied/comment/reject
   */
  async reject() {
    const { ctx } = this;
    const { id, type = 'website' } = ctx.request.body;

    if (!id) {
      ctx.body = { code: 400, msg: '缺少评论ID' };
      return;
    }

    try {
      await ctx.service.uied.comment.reject(id, type);
      ctx.body = {
        code: 200,
        msg: '评论已拒绝',
      };
    } catch (error) {
      ctx.logger.error('拒绝评论失败:', error);
      ctx.body = {
        code: 500,
        msg: error.message || '操作失败',
      };
    }
  }

  /**
   * 删除评论
   * POST /api/uied/comment/del
   */
  async del() {
    const { ctx } = this;
    const { ids, type = 'website' } = ctx.request.body;

    if (!ids || (Array.isArray(ids) && ids.length === 0)) {
      ctx.body = { code: 400, msg: '缺少评论ID' };
      return;
    }

    try {
      await ctx.service.uied.comment.del(ids, type);
      ctx.body = {
        code: 200,
        msg: '删除成功',
      };
    } catch (error) {
      ctx.logger.error('删除评论失败:', error);
      ctx.body = {
        code: 500,
        msg: error.message || '删除失败',
      };
    }
  }

  /**
   * 获取待审核评论数量
   * GET /api/uied/comment/pendingCount
   */
  async pendingCount() {
    const { ctx } = this;

    try {
      const result = await ctx.service.uied.comment.pendingCount();
      ctx.body = {
        code: 200,
        msg: '获取成功',
        data: result,
      };
    } catch (error) {
      ctx.logger.error('获取待审核数量失败:', error);
      ctx.body = {
        code: 500,
        msg: error.message || '获取失败',
      };
    }
  }

  /**
   * 获取评论统计
   * GET /api/uied/comment/stats
   */
  async stats() {
    const { ctx } = this;

    try {
      const result = await ctx.service.uied.comment.stats();
      ctx.body = {
        code: 200,
        msg: '获取成功',
        data: result,
      };
    } catch (error) {
      ctx.logger.error('获取评论统计失败:', error);
      ctx.body = {
        code: 500,
        msg: error.message || '获取失败',
      };
    }
  }
}

module.exports = CommentController;
