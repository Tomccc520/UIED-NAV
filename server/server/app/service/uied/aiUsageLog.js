/**
 * @file service/uied/aiUsageLog.js
 * @description AI 使用日志服务
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

'use strict';

const Service = require('egg').Service;

class AiUsageLogService extends Service {
  /**
   * 获取日志列表（分页+筛选）
   * @param {Object} params - 查询参数
   * @param {number} params.page - 页码
   * @param {number} params.pageSize - 每页条数
   * @param {string} params.featureType - 功能类型筛选
   * @param {string} params.startDate - 开始时间
   * @param {string} params.endDate - 结束时间
   */
  async list({ page = 1, pageSize = 20, featureType, startDate, endDate } = {}) {
    const { app } = this;
    const offset = (page - 1) * pageSize;

    let whereClause = 'is_delete = 0';
    const replacements = [];

    if (featureType) {
      whereClause += ' AND feature_type = ?';
      replacements.push(featureType);
    }

    if (startDate) {
      whereClause += ' AND create_time >= ?';
      replacements.push(Math.floor(new Date(startDate).getTime() / 1000));
    }

    if (endDate) {
      whereClause += ' AND create_time <= ?';
      replacements.push(Math.floor(new Date(endDate).getTime() / 1000));
    }

    // 查询总数
    const [ countResult ] = await app.model.query(
      `SELECT COUNT(*) as total FROM uied_ai_usage_log WHERE ${whereClause}`,
      { replacements, type: app.Sequelize.QueryTypes.SELECT }
    );

    // 查询列表
    const logs = await app.model.query(
      `SELECT * FROM uied_ai_usage_log
       WHERE ${whereClause}
       ORDER BY create_time DESC
       LIMIT ? OFFSET ?`,
      {
        replacements: [ ...replacements, pageSize, offset ],
        type: app.Sequelize.QueryTypes.SELECT,
      }
    );

    return {
      lists: logs.map(log => ({
        id: log.id,
        configId: log.config_id,
        featureType: log.feature_type,
        requestContent: log.request_content,
        responseStatus: log.response_status,
        errorMessage: log.error_message,
        tokensUsed: log.tokens_used,
        durationMs: log.duration_ms,
        createTime: log.create_time,
      })),
      count: countResult.total,
      page,
      pageSize,
    };
  }

  /**
   * 获取聚合统计数据
   */
  async stats() {
    const { app } = this;

    // 总调用次数和总 Token 消耗
    const [ totalResult ] = await app.model.query(
      `SELECT 
        COUNT(*) as totalCalls,
        COALESCE(SUM(tokens_used), 0) as totalTokens
       FROM uied_ai_usage_log
       WHERE is_delete = 0`,
      { type: app.Sequelize.QueryTypes.SELECT }
    );

    // 成功率
    const [ successResult ] = await app.model.query(
      `SELECT COUNT(*) as successCount
       FROM uied_ai_usage_log
       WHERE is_delete = 0 AND response_status = 'success'`,
      { type: app.Sequelize.QueryTypes.SELECT }
    );

    const totalCalls = Number(totalResult.totalCalls) || 0;
    const totalTokens = Number(totalResult.totalTokens) || 0;
    const successCount = Number(successResult.successCount) || 0;
    const successRate = totalCalls > 0
      ? Math.round((successCount / totalCalls) * 1000) / 10
      : 0;

    // 今日统计
    const todayStart = Math.floor(new Date().setHours(0, 0, 0, 0) / 1000);
    const [ todayResult ] = await app.model.query(
      `SELECT 
        COUNT(*) as todayCalls,
        COALESCE(SUM(tokens_used), 0) as todayTokens
       FROM uied_ai_usage_log
       WHERE is_delete = 0 AND create_time >= ?`,
      { replacements: [ todayStart ], type: app.Sequelize.QueryTypes.SELECT }
    );

    // 按类型统计
    const typeStats = await app.model.query(
      `SELECT 
        feature_type,
        COUNT(*) as calls,
        COALESCE(SUM(tokens_used), 0) as tokens
       FROM uied_ai_usage_log
       WHERE is_delete = 0
       GROUP BY feature_type`,
      { type: app.Sequelize.QueryTypes.SELECT }
    );

    const byType = {};
    for (const stat of typeStats) {
      byType[stat.feature_type] = {
        calls: Number(stat.calls) || 0,
        tokens: Number(stat.tokens) || 0,
      };
    }

    return {
      totalCalls,
      totalTokens,
      successRate,
      todayCalls: Number(todayResult.todayCalls) || 0,
      todayTokens: Number(todayResult.todayTokens) || 0,
      byType,
    };
  }

  /**
   * 记录 AI 使用日志
   * @param {Object} data - 日志数据
   * @param {number} data.configId - AI 配置 ID
   * @param {string} data.featureType - 功能类型: chat, generate, search, batch_generate
   * @param {string} data.requestContent - 请求内容摘要
   * @param {string} data.responseStatus - 响应状态: success, failed
   * @param {string} data.errorMessage - 错误信息
   * @param {number} data.tokensUsed - Token 消耗量
   * @param {number} data.durationMs - 响应耗时(毫秒)
   */
  async add({ configId = 0, featureType = '', requestContent = '', responseStatus = 'success', errorMessage = '', tokensUsed = 0, durationMs = 0 } = {}) {
    const { app } = this;
    const now = Math.floor(Date.now() / 1000);

    const [ result ] = await app.model.query(
      `INSERT INTO uied_ai_usage_log 
       (config_id, feature_type, request_content, response_status, error_message, tokens_used, duration_ms, is_delete, create_time, update_time, delete_time)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, 0)`,
      {
        replacements: [
          configId,
          featureType,
          requestContent || null,
          responseStatus,
          errorMessage || null,
          tokensUsed,
          durationMs,
          now,
          now,
        ],
        type: app.Sequelize.QueryTypes.INSERT,
      }
    );

    return { id: result };
  }
}

module.exports = AiUsageLogService;
