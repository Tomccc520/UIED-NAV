/**
 * @file model/uied/articleCategory.js
 * @description UIED 文章分类表 Sequelize 模型
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
    name: {
      type: STRING(100),
      allowNull: false,
      defaultValue: '',
      comment: '分类名称',
    },
    slug: {
      type: STRING(100),
      allowNull: false,
      defaultValue: '',
      comment: 'URL slug',
    },
    description: {
      type: STRING(500),
      allowNull: true,
      defaultValue: '',
      comment: '描述',
    },
    sort_order: {
      type: INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      comment: '排序',
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
  };

  const UiedArticleCategory = app.model.define('UiedArticleCategory', modelDefinition, {
    tableName: 'uied_article_category',
  });

  return UiedArticleCategory;
};
