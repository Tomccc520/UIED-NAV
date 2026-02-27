/**
 * @file model/uied/operationLog.js
 * @description UIED 操作日志表 Sequelize 模型
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

'use strict';

module.exports = app => {
  const { STRING, INTEGER, TEXT } = app.Sequelize;

  const modelDefinition = {
    id: {
      type: INTEGER.UNSIGNED,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    old_id: {
      type: STRING(50),
      allowNull: true,
      comment: '原 SQLite cuid',
    },
    admin_id: {
      type: STRING(50),
      allowNull: true,
      comment: '操作管理员ID',
    },
    admin_name: {
      type: STRING(100),
      allowNull: false,
      defaultValue: '',
      comment: '操作管理员用户名',
    },
    action: {
      type: STRING(50),
      allowNull: false,
      defaultValue: '',
      comment: '操作类型: create, update, delete, login, logout',
    },
    module: {
      type: STRING(50),
      allowNull: false,
      defaultValue: '',
      comment: '操作模块: website, category, page, settings, auth',
    },
    target_id: {
      type: STRING(50),
      allowNull: true,
      comment: '操作目标ID',
    },
    target_name: {
      type: STRING(200),
      allowNull: true,
      comment: '操作目标名称',
    },
    detail: {
      type: TEXT,
      allowNull: true,
      comment: '操作详情JSON',
    },
    ip: {
      type: STRING(50),
      allowNull: true,
      comment: '操作IP地址',
    },
    user_agent: {
      type: STRING(500),
      allowNull: true,
      comment: '浏览器信息',
    },
    status: {
      type: STRING(20),
      allowNull: false,
      defaultValue: 'success',
      comment: '操作状态: success, failed',
    },
    error_msg: {
      type: TEXT,
      allowNull: true,
      comment: '错误信息',
    },
    create_time: {
      type: INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      comment: '创建时间',
    },
  };

  const UiedOperationLog = app.model.define('UiedOperationLog', modelDefinition, {
    tableName: 'uied_operation_log',
  });

  return UiedOperationLog;
};
