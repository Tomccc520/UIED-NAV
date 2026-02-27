/**
 * @file model/uied/socialMediaItem.js
 * @description UIED 社交媒体项目表 Sequelize 模型
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
    group_id: {
      type: INTEGER.UNSIGNED,
      allowNull: false,
      comment: '所属分组ID',
    },
    name: {
      type: STRING(100),
      allowNull: false,
      defaultValue: '',
      comment: '名称',
    },
    type: {
      type: STRING(50),
      allowNull: false,
      defaultValue: 'other',
      comment: '类型: weibo, bilibili, xiaohongshu, douyin, wechat_official, wechat_group, wechat_mini, other',
    },
    icon: {
      type: STRING(100),
      allowNull: true,
      comment: '图标',
    },
    link: {
      type: STRING(500),
      allowNull: true,
      comment: '链接地址',
    },
    qr_code_url: {
      type: STRING(500),
      allowNull: true,
      comment: '二维码图片URL',
    },
    description: {
      type: TEXT,
      allowNull: true,
      comment: '描述文字',
    },
    extra_info: {
      type: TEXT,
      allowNull: true,
      comment: '额外信息JSON',
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

  const UiedSocialMediaItem = app.model.define('UiedSocialMediaItem', modelDefinition, {
    tableName: 'uied_social_media_item',
  });

  // 定义关联关系
  UiedSocialMediaItem.associate = function() {
    UiedSocialMediaItem.belongsTo(app.model.Uied.SocialMediaGroup, {
      as: 'group',
      foreignKey: 'group_id',
    });
  };

  return UiedSocialMediaItem;
};
