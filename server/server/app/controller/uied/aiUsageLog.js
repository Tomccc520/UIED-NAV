/**
 * @file controller/uied/aiUsageLog.js
 * @description AI 使用日志控制器
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

'use strict';

const baseController = require('../baseController');

class AiUsageLogController extends baseController {
  /**
   * 获取 AI 使用日志列表（分页+筛选）
   * GET /api/uied/aiUsageLog/list
   * 查询参数: pageNo, pageSize, featureType, startDate, endDate
   */
  async list() {
    const { ctx } = this;
    try {
      const { pageNo = 1, pageSize = 20, featureType, startDate, endDate } = ctx.query;
      const result = await ctx.service.uied.aiUsageLog.list({
        page: parseInt(pageNo),
        pageSize: parseInt(pageSize),
        featureType,
        startDate,
        endDate,
      });
      this.result({ data: result });
    } catch (error) {
      ctx.logger.error('获取AI使用日志列表失败:', error);
      this.result({ code: 500, message: '获取日志列表失败' });
    }
  }

  /**
   * 获取 AI 使用统计汇总
   * GET /api/uied/aiUsageLog/stats
   */
  async stats() {
    const { ctx } = this;
    try {
      const result = await ctx.service.uied.aiUsageLog.stats();
      this.result({ data: result });
    } catch (error) {
      ctx.logger.error('获取AI使用统计失败:', error);
      this.result({ code: 500, message: '获取统计数据失败' });
    }
  }
}

module.exports = AiUsageLogController;
