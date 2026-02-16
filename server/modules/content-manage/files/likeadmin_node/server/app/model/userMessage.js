/**
 * @copyright Tomda (https://www.tomda.top)
 * @copyright UIED技术团队 (https://fsuied.com)
 * @author UIED技术团队
 * @createDate 2026.1.27
 */
'use strict';
const moment = require('moment');

module.exports = app => {
  const { STRING, INTEGER, SMALLINT, TEXT } = app.Sequelize;

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
      comment: '用户ID',
    },
    title: {
      type: STRING(100),
      allowNull: false,
      defaultValue: '',
      comment: '标题',
    },
    content: {
      type: TEXT,
      allowNull: true,
      comment: '内容',
    },
    extra: {
      type: TEXT,
      allowNull: true,
      defaultValue: '',
      comment: '扩展信息(JSON)',
    },
    type: {
      type: STRING(30),
      allowNull: false,
      defaultValue: '',
      comment: '消息类型',
    },
    isRead: {
      type: SMALLINT.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      field: 'is_read',
      comment: '是否已读',
    },
    readTime: {
      type: INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      field: 'read_time',
      comment: '阅读时间',
      get() {
        const timestamp = this.getDataValue('readTime') * 1000;
        return timestamp ? moment(timestamp).format('YYYY-MM-DD HH:mm:ss') : '';
      },
    },
    createTime: {
      type: INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: () => moment().unix(),
      field: 'create_time',
      get() {
        const timestamp = this.getDataValue('createTime') * 1000;
        return moment(timestamp).format('YYYY-MM-DD HH:mm:ss');
      },
    },
  };

  const UserMessage = app.model.define('UserMessage', modelDefinition, {
    createdAt: false,
    updatedAt: false,
    tableName: 'la_user_message',
  });

  return UserMessage;
};
