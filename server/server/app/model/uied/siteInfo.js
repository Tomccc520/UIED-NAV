/**
 * @file model/uied/siteInfo.js
 * @description UIED 站点基本信息表 Sequelize 模型
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

'use strict';

module.exports = app => {
  const { STRING, INTEGER, SMALLINT, TEXT } = app.Sequelize;

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
    site_name: {
      type: STRING(200),
      allowNull: false,
      defaultValue: '',
      comment: '网站名称',
    },
    site_title: {
      type: STRING(200),
      allowNull: false,
      defaultValue: '',
      comment: '网站标题(SEO)',
    },
    description: {
      type: TEXT,
      allowNull: false,
      comment: '网站描述',
    },
    keywords: {
      type: STRING(500),
      allowNull: false,
      defaultValue: '',
      comment: '关键词',
    },
    logo: {
      type: STRING(500),
      allowNull: true,
      comment: 'Logo URL',
    },
    favicon: {
      type: STRING(500),
      allowNull: true,
      comment: 'Favicon URL',
    },
    icp: {
      type: STRING(100),
      allowNull: true,
      comment: '备案号',
    },
    icp_link: {
      type: STRING(500),
      allowNull: true,
      comment: '备案链接',
    },
    copyright: {
      type: STRING(500),
      allowNull: true,
      comment: '版权信息',
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

  const UiedSiteInfo = app.model.define('UiedSiteInfo', modelDefinition, {
    tableName: 'uied_site_info',
  });

  return UiedSiteInfo;
};
