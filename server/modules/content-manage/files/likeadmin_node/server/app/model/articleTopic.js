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
    name: {
      type: STRING(100),
      allowNull: false,
      defaultValue: '',
    },
    slug: {
      type: STRING(120),
      allowNull: false,
      defaultValue: '',
    },
    intro: {
      type: STRING(255),
      allowNull: false,
      defaultValue: '',
    },
    image: {
      type: STRING(200),
      allowNull: false,
      defaultValue: '',
    },
    sort: {
      type: SMALLINT.UNSIGNED,
      allowNull: false,
      defaultValue: 50,
    },
    is_show: {
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
      allowNull: true,
      defaultValue: 0,
    },
    update_time: {
      type: INTEGER.UNSIGNED,
      allowNull: true,
      defaultValue: 0,
    },
    delete_time: {
      type: INTEGER.UNSIGNED,
      allowNull: true,
      defaultValue: 0,
    },
  };
  const ArticleTopic = app.model.define('ArticleTopic', modelDefinition, {
    tableName: 'la_article_topic',
    timestamps: false,
  });

  return ArticleTopic;
};
