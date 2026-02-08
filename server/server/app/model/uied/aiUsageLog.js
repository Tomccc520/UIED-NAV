/**
 * @file model/uied/aiUsageLog.js
 * @description AI 使用日志数据模型
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

'use strict';

module.exports = app => {
  const { STRING, INTEGER, TEXT, SMALLINT } = app.Sequelize;

  const modelDefinition = {
    id: {
      type: INTEGER.UNSIGNED,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    config_id: {
      type: INTEGER.UNSIGNED,
      defaultValue: 0,
      comment: '关联的 AI 配置 ID',
    },
    feature_type: {
      type: STRING(50),
      allowNull: false,
      defaultValue: '',
      comment: '功能类型: chat, generate, search, batch_generate',
    },
    request_content: {
      type: TEXT,
      allowNull: true,
      comment: '请求内容摘要',
    },
    response_status: {
      type: STRING(20),
      allowNull: false,
      defaultValue: 'success',
      comment: '响应状态: success, failed',
    },
    error_message: {
      type: TEXT,
      allowNull: true,
      comment: '错误信息',
    },
    tokens_used: {
      type: INTEGER.UNSIGNED,
      defaultValue: 0,
      comment: 'Token 消耗量',
    },
    duration_ms: {
      type: INTEGER.UNSIGNED,
      defaultValue: 0,
      comment: '响应耗时(毫秒)',
    },
    is_delete: {
      type: SMALLINT.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      comment: '是否删除: 0=否, 1=是',
    },
    create_time: {
      type: INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      comment: '创建时间',
    },
    update_time: {
      type: INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      comment: '更新时间',
    },
    delete_time: {
      type: INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      comment: '删除时间',
    },
  };

  const UiedAiUsageLog = app.model.define('UiedAiUsageLog', modelDefinition, {
    tableName: 'uied_ai_usage_log',
  });

  return UiedAiUsageLog;
};
