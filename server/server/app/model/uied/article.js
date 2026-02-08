/**
 * @file model/uied/article.js
 * @description UIED 文章表 Sequelize 模型
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
    title: {
      type: STRING(200),
      allowNull: false,
      defaultValue: '',
      comment: '文章标题',
    },
    content: {
      type: TEXT('long'),
      allowNull: false,
      comment: 'Markdown内容',
    },
    excerpt: {
      type: TEXT,
      allowNull: false,
      comment: '摘要',
    },
    cover_image: {
      type: STRING(500),
      allowNull: true,
      comment: '封面图片URL',
    },
    author: {
      type: STRING(100),
      allowNull: false,
      defaultValue: '',
      comment: '作者',
    },
    category: {
      type: STRING(100),
      allowNull: false,
      defaultValue: '',
      comment: '分类',
    },
    category_id: {
      type: INTEGER.UNSIGNED,
      allowNull: true,
      defaultValue: null,
      comment: '分类ID，关联 uied_article_category',
    },
    slug: {
      type: STRING(200),
      allowNull: false,
      unique: true,
      comment: 'URL slug',
    },
    status: {
      type: STRING(20),
      allowNull: false,
      defaultValue: 'draft',
      comment: '状态: draft, published',
    },
    view_count: {
      type: INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      comment: '浏览次数',
    },
    seo_title: {
      type: STRING(100),
      allowNull: true,
      comment: 'SEO标题',
    },
    seo_description: {
      type: STRING(300),
      allowNull: true,
      comment: 'SEO描述',
    },
    published_at: {
      type: INTEGER.UNSIGNED,
      allowNull: true,
      comment: '发布时间戳',
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

  const UiedArticle = app.model.define('UiedArticle', modelDefinition, {
    tableName: 'uied_article',
  });

  return UiedArticle;
};
