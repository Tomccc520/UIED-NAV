/**
 * @file model/uied/socialMediaGroup.js
 * @description UIED 社交媒体分组表 Sequelize 模型
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
      comment: '分组名称',
    },
    icon: {
      type: STRING(100),
      allowNull: true,
      comment: '分组图标',
    },
    display_type: {
      type: STRING(20),
      allowNull: false,
      defaultValue: 'links',
      comment: '展示类型: links, qrcode, mixed',
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

  const UiedSocialMediaGroup = app.model.define('UiedSocialMediaGroup', modelDefinition, {
    tableName: 'uied_social_media_group',
  });

  // 定义关联关系
  UiedSocialMediaGroup.associate = function() {
    UiedSocialMediaGroup.hasMany(app.model.Uied.SocialMediaItem, {
      as: 'items',
      foreignKey: 'group_id',
    });
  };

  return UiedSocialMediaGroup;
};
