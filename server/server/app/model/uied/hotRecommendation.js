/**
 * @file model/uied/hotRecommendation.js
 * @description UIED 热门推荐表 Sequelize 模型
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
    name: {
      type: STRING(200),
      allowNull: false,
      defaultValue: '',
      comment: '网站名称',
    },
    description: {
      type: TEXT,
      allowNull: false,
      comment: '描述',
    },
    url: {
      type: STRING(500),
      allowNull: false,
      defaultValue: '',
      comment: '链接地址',
    },
    icon_url: {
      type: STRING(500),
      allowNull: true,
      comment: '图标URL',
    },
    page_slug: {
      type: STRING(100),
      allowNull: true,
      comment: '所属页面slug',
    },
    position: {
      type: STRING(20),
      allowNull: false,
      defaultValue: 'hot',
      comment: '位置: hot, featured, ad',
    },
    sort: {
      type: INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      comment: '排序',
    },
    is_show: {
      type: SMALLINT.UNSIGNED,
      allowNull: false,
      defaultValue: 1,
      comment: '是否显示: 0=隐藏, 1=显示',
    },
    start_time: {
      type: INTEGER.UNSIGNED,
      allowNull: true,
      comment: '开始展示时间戳',
    },
    end_time: {
      type: INTEGER.UNSIGNED,
      allowNull: true,
      comment: '结束展示时间戳',
    },
    click_count: {
      type: INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      comment: '点击次数',
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

  const UiedHotRecommendation = app.model.define('UiedHotRecommendation', modelDefinition, {
    tableName: 'uied_hot_recommendation',
  });

  return UiedHotRecommendation;
};
