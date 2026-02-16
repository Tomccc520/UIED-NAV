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
    user_id: {
      type: INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
    },
    display_name: {
      type: STRING(64),
      allowNull: false,
      defaultValue: '',
    },
    bio: {
      type: STRING(255),
      allowNull: false,
      defaultValue: '',
    },
    homepage: {
      type: STRING(200),
      allowNull: false,
      defaultValue: '',
    },
    xiaohongshu: {
      type: STRING(200),
      allowNull: false,
      defaultValue: '',
    },
    weibo: {
      type: STRING(200),
      allowNull: false,
      defaultValue: '',
    },
    is_public: {
      type: SMALLINT.UNSIGNED,
      allowNull: false,
      defaultValue: 1,
    },
    is_delete: {
      type: SMALLINT.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
    },
    create_time: {
      type: INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
    },
    update_time: {
      type: INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
    },
    delete_time: {
      type: INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
    },
  };
  const UserAuthorProfile = app.model.define('UserAuthorProfile', modelDefinition, {
    tableName: 'la_user_author_profile',
    timestamps: false,
  });

  return UserAuthorProfile;
};
