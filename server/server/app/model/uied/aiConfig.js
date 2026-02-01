/**
 * @file model/uied/aiConfig.js
 * @description UIED AI 助手配置表 Sequelize 模型
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

'use strict';

module.exports = app => {
  const { STRING, INTEGER, SMALLINT } = app.Sequelize;

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
    name: {
      type: STRING(100),
      allowNull: false,
      defaultValue: '',
      comment: '配置名称',
    },
    provider: {
      type: STRING(50),
      allowNull: false,
      defaultValue: '',
      comment: '提供商: siliconflow, openai, etc.',
    },
    api_url: {
      type: STRING(500),
      allowNull: false,
      defaultValue: '',
      comment: 'API地址',
    },
    api_key: {
      type: STRING(500),
      allowNull: false,
      defaultValue: '',
      comment: 'API密钥',
    },
    model: {
      type: STRING(100),
      allowNull: false,
      defaultValue: '',
      comment: '模型名称',
    },
    is_enabled: {
      type: SMALLINT.UNSIGNED,
      allowNull: false,
      defaultValue: 1,
      comment: '是否启用: 0=否, 1=是',
    },
    is_default: {
      type: SMALLINT.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      comment: '是否默认: 0=否, 1=是',
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

  const UiedAiConfig = app.model.define('UiedAiConfig', modelDefinition, {
    tableName: 'uied_ai_config',
  });

  return UiedAiConfig;
};
