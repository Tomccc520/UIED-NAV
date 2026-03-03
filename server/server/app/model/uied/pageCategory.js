/**
 * @file model/uied/pageCategory.js
 * @description UIED 页面分类关联表 Sequelize 模型
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
    page_id: {
      type: INTEGER.UNSIGNED,
      allowNull: false,
      comment: '页面ID',
    },
    category_id: {
      type: INTEGER.UNSIGNED,
      allowNull: false,
      comment: '分类ID',
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

  const UiedPageCategory = app.model.define('UiedPageCategory', modelDefinition, {
    tableName: 'uied_page_category',
    indexes: [
      {
        unique: true,
        fields: [ 'page_id', 'category_id' ],
      },
    ],
  });

  // 定义关联关系
  UiedPageCategory.associate = function() {
    UiedPageCategory.belongsTo(app.model.Uied.Page, {
      as: 'page',
      foreignKey: 'page_id',
    });
    UiedPageCategory.belongsTo(app.model.Uied.Category, {
      as: 'category',
      foreignKey: 'category_id',
    });
  };

  return UiedPageCategory;
};
