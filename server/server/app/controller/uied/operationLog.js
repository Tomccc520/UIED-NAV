/**
 * @file controller/uied/operationLog.js
 * @description 操作日志控制器
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

'use strict';

const baseController = require('../baseController');

class OperationLogController extends baseController {
  /**
   * 获取日志列表
   */
  async list() {
    const { ctx } = this;
    try {
      const { pageNo = 1, pageSize = 20, adminName, action, module, startDate, endDate } = ctx.query;
      const result = await ctx.service.uied.operationLog.list({
        page: parseInt(pageNo),
        pageSize: parseInt(pageSize),
        adminName,
        action,
        module,
        startDate,
        endDate,
      });
      this.result({ data: result });
    } catch (error) {
      ctx.logger.error('获取日志列表失败:', error);
      this.result({ code: 500, message: '获取日志列表失败' });
    }
  }

  /**
   * 获取操作统计
   */
  async stats() {
    const { ctx } = this;
    try {
      const result = await ctx.service.uied.operationLog.getStats();
      this.result({ data: result });
    } catch (error) {
      ctx.logger.error('获取操作统计失败:', error);
      this.result({ code: 500, message: '获取统计失败' });
    }
  }

  /**
   * 清理旧日志
   */
  async cleanup() {
    const { ctx } = this;
    try {
      const { days = 90 } = ctx.request.body;
      const count = await ctx.service.uied.operationLog.cleanup(parseInt(days));
      this.result({ data: { count }, message: `已清理 ${count} 条日志` });
    } catch (error) {
      ctx.logger.error('清理日志失败:', error);
      this.result({ code: 500, message: '清理日志失败' });
    }
  }

  /**
   * 删除单条日志
   */
  async del() {
    const { ctx } = this;
    try {
      const { id } = ctx.request.body;
      if (!id) {
        return this.result({ code: 400, message: '缺少日志ID' });
      }
      await ctx.service.uied.operationLog.del(parseInt(id));
      this.result({ message: '删除成功' });
    } catch (error) {
      ctx.logger.error('删除日志失败:', error);
      this.result({ code: 500, message: '删除日志失败' });
    }
  }
}

module.exports = OperationLogController;
