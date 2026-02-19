'use strict';

/**
 * 用户模型定义（映射 la_user 下划线字段到业务驼峰字段）
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
    sn: {
      type: INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
    },
    avatar: {
      type: STRING(200),
      characterSet: 'utf8mb4',
      collation: 'utf8mb4_general_ci',
      allowNull: false,
      defaultValue: '',
    },
    realName: {
      type: STRING(32),
      characterSet: 'utf8mb4',
      collation: 'utf8mb4_general_ci',
      allowNull: false,
      defaultValue: '',
      field: 'real_name',
    },
    nickname: {
      type: STRING(32),
      characterSet: 'utf8mb4',
      collation: 'utf8mb4_general_ci',
      allowNull: false,
      defaultValue: '',
    },
    username: {
      type: STRING(32),
      characterSet: 'utf8mb4',
      collation: 'utf8mb4_general_ci',
      allowNull: false,
      defaultValue: '',
    },
    password: {
      type: STRING(32),
      characterSet: 'utf8mb4',
      collation: 'utf8mb4_general_ci',
      allowNull: false,
      defaultValue: '',
    },
    mobile: {
      type: STRING(32),
      characterSet: 'utf8mb4',
      collation: 'utf8mb4_general_ci',
      allowNull: false,
      defaultValue: '',
    },
    salt: {
      type: STRING(32),
      characterSet: 'utf8mb4',
      collation: 'utf8mb4_general_ci',
      allowNull: false,
      defaultValue: '',
    },
    sex: {
      type: SMALLINT,
      unsigned: true,
      allowNull: false,
      defaultValue: 0,
    },
    channel: {
      type: SMALLINT,
      unsigned: true,
      allowNull: false,
      defaultValue: 0,
    },
    isDisable: {
      type: SMALLINT,
      unsigned: true,
      allowNull: false,
      defaultValue: 0,
      field: 'is_disable',
    },
    isDelete: {
      type: SMALLINT,
      unsigned: true,
      allowNull: false,
      defaultValue: 0,
      field: 'is_delete',
    },
    lastLoginIp: {
      type: STRING(30),
      characterSet: 'utf8mb4',
      collation: 'utf8mb4_general_ci',
      allowNull: false,
      defaultValue: '',
      field: 'last_login_ip',
    },
    lastLoginTime: {
      type: INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      field: 'last_login_time',
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
  const User = app.model.define('User', modelDefinition, {
    createdAt: false,
    updatedAt: false,
    tableName: 'la_user', // 定义实际表名
  });

  return User;
};
