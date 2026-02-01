/**
 * @file model/uied/website.js
 * @description UIED 网站表 Sequelize 模型
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
    slug: {
      type: STRING(200),
      allowNull: true,
      unique: true,
      comment: '固定链接',
    },
    description: {
      type: TEXT,
      allowNull: false,
      comment: '网站描述',
    },
    url: {
      type: STRING(500),
      allowNull: false,
      defaultValue: '',
      comment: '网站URL',
    },
    icon_url: {
      type: STRING(500),
      allowNull: true,
      comment: '网站图标URL',
    },
    category_id: {
      type: INTEGER.UNSIGNED,
      allowNull: false,
      comment: '分类ID',
    },
    is_new: {
      type: SMALLINT.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      comment: '是否新站: 0=否, 1=是',
    },
    is_featured: {
      type: SMALLINT.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      comment: '是否推荐: 0=否, 1=是',
    },
    is_hot: {
      type: SMALLINT.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      comment: '是否热门: 0=否, 1=是',
    },
    is_pinned: {
      type: SMALLINT.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      comment: '是否置顶: 0=否, 1=是',
    },
    tags: {
      type: TEXT,
      allowNull: true,
      comment: '标签JSON数组',
    },
    sort: {
      type: INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      comment: '排序',
    },
    click_count: {
      type: INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      comment: '点击次数',
    },
    // SEO 相关字段
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
    seo_keywords: {
      type: STRING(200),
      allowNull: true,
      comment: 'SEO关键词',
    },
    // 详情页内容
    detail_content: {
      type: TEXT,
      allowNull: true,
      comment: '详情页富文本内容',
    },
    screenshots: {
      type: TEXT,
      allowNull: true,
      comment: '截图URL列表JSON',
    },
    visit_btn_text: {
      type: STRING(50),
      allowNull: true,
      comment: '访问按钮文字',
    },
    // 监控相关
    status: {
      type: STRING(20),
      allowNull: false,
      defaultValue: 'unchecked',
      comment: '状态: unchecked, active, failed',
    },
    last_checked_at: {
      type: INTEGER.UNSIGNED,
      allowNull: true,
      comment: '最后检测时间戳',
    },
    failed_count: {
      type: INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      comment: '连续失败次数',
    },
    status_message: {
      type: STRING(500),
      allowNull: true,
      comment: '状态消息',
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

  const UiedWebsite = app.model.define('UiedWebsite', modelDefinition, {
    tableName: 'uied_website',
  });

  // 定义关联关系
  UiedWebsite.associate = function() {
    // 多对一 - 网站属于分类
    UiedWebsite.belongsTo(app.model.Uied.Category, {
      as: 'category',
      foreignKey: 'category_id',
    });
  };

  return UiedWebsite;
};
