/**
 * @copyright Tomda (https://www.tomda.top)
 * @copyright UIED技术团队 (https://fsuied.com)
 * @author UIED技术团队
 * @createDate 2026.2.19
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
    userId: {
      type: INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      field: 'user_id',
    },
    tagId: {
      type: INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      field: 'tag_id',
    },
    createTime: {
      type: INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      field: 'create_time',
    },
  };

  const UserTagRel = app.model.define('UserTagRel', modelDefinition, {
    tableName: 'la_user_tag_rel',
    createdAt: false,
    updatedAt: false,
  });

  return UserTagRel;
};
