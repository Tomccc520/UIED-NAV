/**
 * @file controller/uied/statistics.js
 * @description UIED 数据统计控制器
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

'use strict';

const Controller = require('egg').Controller;

class StatisticsController extends Controller {
  /**
   * 获取点击统计
   * GET /api/uied/statistics/clicks
   */
  async clicks() {
    const { ctx } = this;

    try {
      const result = await ctx.service.uied.statistics.clickStats();
      ctx.body = {
        code: 200,
        msg: '获取成功',
        data: result,
      };
    } catch (error) {
      ctx.logger.error('获取点击统计失败:', error);
      ctx.body = {
        code: 500,
        msg: error.message || '获取失败',
      };
    }
  }

  /**
   * 获取搜索统计
   * GET /api/uied/statistics/search
   */
  async search() {
    const { ctx } = this;
    const { days = 30 } = ctx.query;

    try {
      const result = await ctx.service.uied.statistics.searchStats(parseInt(days));
      ctx.body = {
        code: 200,
        msg: '获取成功',
        data: result,
      };
    } catch (error) {
      ctx.logger.error('获取搜索统计失败:', error);
      ctx.body = {
        code: 500,
        msg: error.message || '获取失败',
      };
    }
  }

  /**
   * 获取概览统计
   * GET /api/uied/statistics/overview
   */
  async overview() {
    const { ctx } = this;

    try {
      const result = await ctx.service.uied.statistics.overview();
      ctx.body = {
        code: 200,
        msg: '获取成功',
        data: result,
      };
    } catch (error) {
      ctx.logger.error('获取概览统计失败:', error);
      ctx.body = {
        code: 500,
        msg: error.message || '获取失败',
      };
    }
  }

  /**
   * 获取最近添加的网站
   * GET /api/uied/statistics/recent
   */
  async recent() {
    const { ctx } = this;
    const { limit = 10 } = ctx.query;

    try {
      const result = await ctx.service.uied.statistics.recentWebsites(parseInt(limit));
      ctx.body = {
        code: 200,
        msg: '获取成功',
        data: result,
      };
    } catch (error) {
      ctx.logger.error('获取最近网站失败:', error);
      ctx.body = {
        code: 500,
        msg: error.message || '获取失败',
      };
    }
  }
}

module.exports = StatisticsController;
