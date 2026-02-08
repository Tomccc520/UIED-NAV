/**
 * @file service/uied/operationLog.js
 * @description 操作日志服务
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

'use strict';

const Service = require('egg').Service;

class OperationLogService extends Service {
  /**
   * 获取日志列表
   */
  async list({ page = 1, pageSize = 20, adminName, action, module, startDate, endDate }) {
    const { app } = this;
    const offset = (page - 1) * pageSize;
    
    let whereClause = '1=1';
    const replacements = [];
    
    if (adminName) {
      whereClause += ' AND admin_name LIKE ?';
      replacements.push(`%${adminName}%`);
    }
    
    if (action) {
      whereClause += ' AND action = ?';
      replacements.push(action);
    }
    
    if (module) {
      whereClause += ' AND module = ?';
      replacements.push(module);
    }
    
    if (startDate) {
      whereClause += ' AND create_time >= ?';
      replacements.push(Math.floor(new Date(startDate).getTime() / 1000));
    }
    
    if (endDate) {
      whereClause += ' AND create_time <= ?';
      replacements.push(Math.floor(new Date(endDate).getTime() / 1000));
    }
    
    const [countResult] = await app.model.query(
      `SELECT COUNT(*) as total FROM uied_operation_log WHERE ${whereClause}`,
      { replacements, type: app.Sequelize.QueryTypes.SELECT }
    );
    
    const logs = await app.model.query(
      `SELECT * FROM uied_operation_log
       WHERE ${whereClause}
       ORDER BY create_time DESC
       LIMIT ? OFFSET ?`,
      { replacements: [...replacements, pageSize, offset], type: app.Sequelize.QueryTypes.SELECT }
    );
    
    return {
      lists: logs.map(log => ({
        id: log.id,
        adminId: log.admin_id,
        adminName: log.admin_name,
        action: log.action,
        module: log.module,
        targetId: log.target_id,
        targetName: log.target_name,
        detail: log.detail ? JSON.parse(log.detail) : null,
        ip: log.ip,
        userAgent: log.user_agent,
        createdAt: log.create_time,
      })),
      count: countResult.total,
      page,
      pageSize,
    };
  }

  /**
   * 获取操作统计
   */
  async getStats() {
    const { app } = this;
    
    // 今日操作数
    const todayStart = Math.floor(new Date().setHours(0, 0, 0, 0) / 1000);
    const [todayResult] = await app.model.query(
      'SELECT COUNT(*) as count FROM uied_operation_log WHERE create_time >= ?',
      { replacements: [todayStart], type: app.Sequelize.QueryTypes.SELECT }
    );
    
    // 本周操作数
    const weekStart = Math.floor((Date.now() - 7 * 24 * 60 * 60 * 1000) / 1000);
    const [weekResult] = await app.model.query(
      'SELECT COUNT(*) as count FROM uied_operation_log WHERE create_time >= ?',
      { replacements: [weekStart], type: app.Sequelize.QueryTypes.SELECT }
    );
    
    // 按模块统计
    const moduleStats = await app.model.query(
      `SELECT module, COUNT(*) as count FROM uied_operation_log
       GROUP BY module ORDER BY count DESC LIMIT 10`,
      { type: app.Sequelize.QueryTypes.SELECT }
    );
    
    // 按操作类型统计
    const actionStats = await app.model.query(
      `SELECT action, COUNT(*) as count FROM uied_operation_log
       GROUP BY action ORDER BY count DESC`,
      { type: app.Sequelize.QueryTypes.SELECT }
    );
    
    return {
      today: todayResult.count,
      week: weekResult.count,
      byModule: moduleStats,
      byAction: actionStats,
    };
  }

  /**
   * 记录操作日志
   */
  async log({ adminId, adminName, action, module, targetId, targetName, detail, ip, userAgent }) {
    const { app } = this;
    const now = Math.floor(Date.now() / 1000);
    
    await app.model.query(
      `INSERT INTO uied_operation_log 
       (admin_id, admin_name, action, module, target_id, target_name, detail, ip, user_agent, create_time)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      {
        replacements: [
          adminId || null,
          adminName || 'system',
          action,
          module,
          targetId || null,
          targetName || null,
          detail ? JSON.stringify(detail) : null,
          ip || null,
          userAgent || null,
          now,
        ],
        type: app.Sequelize.QueryTypes.INSERT,
      }
    );
  }

  /**
   * 清理旧日志
   */
  async cleanup(days = 90) {
    const { app } = this;
    const cutoffTime = Math.floor((Date.now() - days * 24 * 60 * 60 * 1000) / 1000);
    
    const [result] = await app.model.query(
      'DELETE FROM uied_operation_log WHERE create_time < ?',
      { replacements: [cutoffTime], type: app.Sequelize.QueryTypes.DELETE }
    );
    
    return result.affectedRows || 0;
  }

  /**
   * 删除单条日志
   */
  async del(id) {
    const { app } = this;
    
    await app.model.query(
      'DELETE FROM uied_operation_log WHERE id = ?',
      { replacements: [id], type: app.Sequelize.QueryTypes.DELETE }
    );
  }
}

module.exports = OperationLogService;
