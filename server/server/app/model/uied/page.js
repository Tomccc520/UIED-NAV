/**
 * @file model/uied/page.js
 * @description UIED 页面配置表 Sequelize 模型
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
      type: STRING(100),
      allowNull: false,
      defaultValue: '',
      comment: '页面名称',
    },
    slug: {
      type: STRING(100),
      allowNull: false,
      unique: true,
      comment: 'URL路径',
    },
    type: {
      type: STRING(50),
      allowNull: false,
      defaultValue: '',
      comment: '页面类型标识',
    },
    icon: {
      type: STRING(100),
      allowNull: true,
      comment: '图标名称',
    },
    description: {
      type: TEXT,
      allowNull: true,
      comment: '页面描述',
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
    // Hero Banner 配置
    hero_title: {
      type: STRING(200),
      allowNull: true,
      comment: '页面主标题',
    },
    hero_highlight_text: {
      type: STRING(100),
      allowNull: true,
      comment: '高亮文本',
    },
    hero_subtitle: {
      type: TEXT,
      allowNull: true,
      comment: '页面副标题',
    },
    hot_search_tags: {
      type: TEXT,
      allowNull: true,
      comment: '热门搜索标签JSON',
    },
    hero_bg_type: {
      type: STRING(20),
      allowNull: false,
      defaultValue: 'default',
      comment: '背景类型: default, color, gradient, image',
    },
    hero_bg_value: {
      type: STRING(500),
      allowNull: true,
      comment: '背景值',
    },
    // Hero 显示模式
    hero_display_mode: {
      type: STRING(20),
      allowNull: false,
      defaultValue: 'search',
      comment: '显示模式: search, iconScroll',
    },
    hero_scroll_websites: {
      type: TEXT,
      allowNull: true,
      comment: '滚动图标网站ID列表JSON',
    },
    // 搜索框配置
    search_placeholder: {
      type: STRING(200),
      allowNull: true,
      comment: '搜索框占位符',
    },
    search_enabled: {
      type: SMALLINT.UNSIGNED,
      allowNull: false,
      defaultValue: 1,
      comment: '是否启用搜索: 0=否, 1=是',
    },
    // 页面配置
    show_hot_recommendations: {
      type: SMALLINT.UNSIGNED,
      allowNull: false,
      defaultValue: 1,
      comment: '是否显示热门推荐: 0=否, 1=是',
    },
    show_categories: {
      type: SMALLINT.UNSIGNED,
      allowNull: false,
      defaultValue: 1,
      comment: '是否显示分类: 0=否, 1=是',
    },
    show_sidebar: {
      type: SMALLINT.UNSIGNED,
      allowNull: false,
      defaultValue: 1,
      comment: '是否显示侧边栏: 0=否, 1=是',
    },
    // 主题配置
    theme_color: {
      type: STRING(20),
      allowNull: true,
      comment: '主题色',
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

  const UiedPage = app.model.define('UiedPage', modelDefinition, {
    tableName: 'uied_page',
  });

  // 定义关联关系
  UiedPage.associate = function() {
    // 多对多 - 页面和分类
    UiedPage.hasMany(app.model.Uied.PageCategory, {
      as: 'pageCategories',
      foreignKey: 'page_id',
    });
  };

  return UiedPage;
};
