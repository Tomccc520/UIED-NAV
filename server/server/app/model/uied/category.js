/**
 * @file model/uied/category.js
 * @description UIED 分类表 Sequelize 模型
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
      comment: '分类名称',
    },
    slug: {
      type: STRING(100),
      allowNull: false,
      unique: true,
      comment: '分类别名/URL',
    },
    icon: {
      type: STRING(100),
      allowNull: false,
      defaultValue: '',
      comment: '图标名称',
    },
    color: {
      type: STRING(20),
      allowNull: false,
      defaultValue: '#1890ff',
      comment: '主题色',
    },
    description: {
      type: TEXT,
      allowNull: true,
      comment: '分类描述',
    },
    parent_id: {
      type: INTEGER.UNSIGNED,
      allowNull: true,
      defaultValue: null,
      comment: '父分类ID',
    },
    seo_title: {
      type: STRING(200),
      allowNull: true,
      comment: 'SEO标题，如"2025年最好的96个AI智能体工具"',
    },
    seo_description: {
      type: TEXT,
      allowNull: true,
      comment: 'SEO描述/简介，用于搜索引擎和页面展示',
    },
    seo_keywords: {
      type: STRING(300),
      allowNull: true,
      comment: 'SEO关键词，逗号分隔',
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

  const UiedCategory = app.model.define('UiedCategory', modelDefinition, {
    tableName: 'uied_category',
  });

  // 定义关联关系
  UiedCategory.associate = function() {
    // 自关联 - 父子分类
    UiedCategory.belongsTo(UiedCategory, {
      as: 'parent',
      foreignKey: 'parent_id',
    });
    UiedCategory.hasMany(UiedCategory, {
      as: 'children',
      foreignKey: 'parent_id',
    });
    // 一对多 - 分类下的网站
    UiedCategory.hasMany(app.model.Uied.Website, {
      as: 'websites',
      foreignKey: 'category_id',
    });
  };

  return UiedCategory;
};
