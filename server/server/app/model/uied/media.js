/**
 * @file model/uied/media.js
 * @description UIED 媒体库表 Sequelize 模型
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
    filename: {
      type: STRING(200),
      allowNull: false,
      defaultValue: '',
      comment: '文件名',
    },
    original_name: {
      type: STRING(200),
      allowNull: false,
      defaultValue: '',
      comment: '原始文件名',
    },
    mime_type: {
      type: STRING(100),
      allowNull: false,
      defaultValue: '',
      comment: 'MIME类型',
    },
    size: {
      type: INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      comment: '文件大小(字节)',
    },
    url: {
      type: STRING(500),
      allowNull: false,
      defaultValue: '',
      comment: '访问URL',
    },
    width: {
      type: INTEGER.UNSIGNED,
      allowNull: true,
      comment: '图片宽度',
    },
    height: {
      type: INTEGER.UNSIGNED,
      allowNull: true,
      comment: '图片高度',
    },
    alt: {
      type: STRING(200),
      allowNull: true,
      comment: '替代文本',
    },
    folder: {
      type: STRING(100),
      allowNull: false,
      defaultValue: 'default',
      comment: '文件夹分类',
    },
    uploaded_by: {
      type: STRING(50),
      allowNull: true,
      comment: '上传者',
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

  const UiedMedia = app.model.define('UiedMedia', modelDefinition, {
    tableName: 'uied_media',
  });

  return UiedMedia;
};
