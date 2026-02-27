/**
 * @file model/uied/articleTagRelation.js
 * @description UIED 文章标签关联表 Sequelize 模型
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

'use strict';

module.exports = app => {
  const { INTEGER } = app.Sequelize;

  const modelDefinition = {
    id: {
      type: INTEGER.UNSIGNED,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    article_id: {
      type: INTEGER.UNSIGNED,
      allowNull: false,
      comment: '文章ID',
    },
    tag_id: {
      type: INTEGER.UNSIGNED,
      allowNull: false,
      comment: '标签ID',
    },
    create_time: {
      type: INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      comment: '创建时间',
    },
  };

  const UiedArticleTagRelation = app.model.define('UiedArticleTagRelation', modelDefinition, {
    tableName: 'uied_article_tag_relation',
  });

  return UiedArticleTagRelation;
};
