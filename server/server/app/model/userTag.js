/**
 * @copyright Tomda (https://www.tomda.top)
 * @copyright UIED技术团队 (https://fsuied.com)
 * @author UIED技术团队
 * @createDate 2026.2.19
 */
'use strict';

module.exports = app => {
  const { INTEGER, SMALLINT, STRING } = app.Sequelize;

  const modelDefinition = {
    id: {
      type: INTEGER.UNSIGNED,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    name: {
      type: STRING(64),
      allowNull: false,
      defaultValue: '',
    },
    color: {
      type: STRING(32),
      allowNull: false,
      defaultValue: '#409EFF',
    },
    isDelete: {
      type: SMALLINT.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      field: 'is_delete',
    },
    createTime: {
      type: INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      field: 'create_time',
    },
    updateTime: {
      type: INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      field: 'update_time',
    },
    deleteTime: {
      type: INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      field: 'delete_time',
    },
  };

  const UserTag = app.model.define('UserTag', modelDefinition, {
    tableName: 'la_user_tag',
    createdAt: false,
    updatedAt: false,
  });

  return UserTag;
};
