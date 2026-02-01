/**
 * @file model/uied/footerLink.js
 * @description UIED 页脚链接表 Sequelize 模型
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
    text: {
      type: STRING(100),
      allowNull: false,
      defaultValue: '',
      comment: '链接文字',
    },
    url: {
      type: STRING(500),
      allowNull: false,
      defaultValue: '',
      comment: '链接地址',
    },
    external: {
      type: SMALLINT.UNSIGNED,
      allowNull: false,
      defaultValue: 1,
      comment: '是否外部链接: 0=否, 1=是',
    },
    group_id: {
      type: INTEGER.UNSIGNED,
      allowNull: false,
      comment: '分组ID',
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

  const UiedFooterLink = app.model.define('UiedFooterLink', modelDefinition, {
    tableName: 'uied_footer_link',
  });

  // 定义关联关系
  UiedFooterLink.associate = function() {
    UiedFooterLink.belongsTo(app.model.Uied.FooterGroup, {
      as: 'group',
      foreignKey: 'group_id',
    });
  };

  return UiedFooterLink;
};
