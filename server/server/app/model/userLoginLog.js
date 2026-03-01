'use strict';

/**
 * 前台用户登录日志模型（la_user_login_log）
 */
module.exports = app => {
  const { STRING, INTEGER, SMALLINT } = app.Sequelize;

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
    ip: {
      type: STRING(64),
      allowNull: false,
      defaultValue: '',
    },
    os: {
      type: STRING(255),
      allowNull: false,
      defaultValue: '',
    },
    browser: {
      type: STRING(255),
      allowNull: false,
      defaultValue: '',
    },
    status: {
      type: SMALLINT.UNSIGNED,
      allowNull: false,
      defaultValue: 1,
    },
    createTime: {
      type: INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      field: 'create_time',
    },
  };

  const UserLoginLog = app.model.define('UserLoginLog', modelDefinition, {
    createdAt: false,
    updatedAt: false,
    tableName: 'la_user_login_log',
    hooks: {
      beforeValidate: data => {
        if (!Number(data.createTime || 0)) {
          data.createTime = Math.floor(Date.now() / 1000);
        }
      },
    },
  });

  return UserLoginLog;
};
