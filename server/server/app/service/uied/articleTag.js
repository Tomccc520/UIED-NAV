/**
 * @file service/uied/articleTag.js
 * @description 文章标签服务
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

'use strict';

const Service = require('egg').Service;

class ArticleTagService extends Service {
  /**
   * 获取标签列表（分页）
   * @param {Object} params - 查询参数
   */
  async list({ page = 1, pageSize = 20, keyword }) {
    const { app } = this;
    const offset = (page - 1) * pageSize;

    // 构建查询条件
    let whereClause = 't.is_delete = 0';
    const replacements = [];

    if (keyword) {
      whereClause += ' AND t.name LIKE ?';
      replacements.push(`%${keyword}%`);
    }

    // 获取总数
    const [ countResult ] = await app.model.query(
      `SELECT COUNT(*) as total FROM uied_article_tag t WHERE ${whereClause}`,
      { replacements, type: app.Sequelize.QueryTypes.SELECT }
    );
    const total = countResult.total;

    // 获取列表
    const tags = await app.model.query(
      `SELECT t.*,
        (SELECT COUNT(*) FROM uied_article_tag_relation r WHERE r.tag_id = t.id) as article_count
       FROM uied_article_tag t
       WHERE ${whereClause}
       ORDER BY t.sort_order ASC, t.id ASC
       LIMIT ? OFFSET ?`,
      { replacements: [ ...replacements, pageSize, offset ], type: app.Sequelize.QueryTypes.SELECT }
    );

    return {
      lists: tags.map(t => ({
        id: t.id,
        name: t.name,
        slug: t.slug,
        color: t.color,
        sortOrder: t.sort_order,
        articleCount: t.article_count,
        createTime: t.create_time,
        updateTime: t.update_time,
      })),
      count: total,
      page,
      pageSize,
    };
  }

  /**
   * 获取所有标签
   */
  async all() {
    const { app } = this;

    const tags = await app.model.query(
      `SELECT t.*,
        (SELECT COUNT(*) FROM uied_article_tag_relation r WHERE r.tag_id = t.id) as article_count
       FROM uied_article_tag t
       WHERE t.is_delete = 0
       ORDER BY t.sort_order ASC, t.name ASC`,
      { type: app.Sequelize.QueryTypes.SELECT }
    );

    return tags.map(t => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      color: t.color,
      sortOrder: t.sort_order,
      articleCount: t.article_count,
    }));
  }

  /**
   * 添加标签
   * @param {Object} data - 标签数据
   */
  async add(data) {
    const { app } = this;
    const now = Math.floor(Date.now() / 1000);

    // 检查 slug 是否已存在
    const [ existingSlug ] = await app.model.query(
      'SELECT id FROM uied_article_tag WHERE slug = ? AND is_delete = 0',
      { replacements: [ data.slug ], type: app.Sequelize.QueryTypes.SELECT }
    );
    if (existingSlug) {
      throw new Error('标签标识已存在');
    }

    const [ result ] = await app.model.query(
      `INSERT INTO uied_article_tag (name, slug, color, sort_order, is_delete, create_time, update_time)
       VALUES (?, ?, ?, ?, 0, ?, ?)`,
      {
        replacements: [
          data.name,
          data.slug,
          data.color || '',
          data.sortOrder || 0,
          now,
          now,
        ],
        type: app.Sequelize.QueryTypes.INSERT,
      }
    );

    return { id: result, ...data };
  }

  /**
   * 编辑标签
   * @param {Object} data - 标签数据（含 id）
   */
  async edit(data) {
    const { app } = this;
    const now = Math.floor(Date.now() / 1000);

    // 检查标签是否存在
    const [ existing ] = await app.model.query(
      'SELECT id FROM uied_article_tag WHERE id = ? AND is_delete = 0',
      { replacements: [ data.id ], type: app.Sequelize.QueryTypes.SELECT }
    );
    if (!existing) {
      throw new Error('标签不存在');
    }

    // 检查 slug 是否与其他标签冲突
    if (data.slug) {
      const [ existingSlug ] = await app.model.query(
        'SELECT id FROM uied_article_tag WHERE slug = ? AND id != ? AND is_delete = 0',
        { replacements: [ data.slug, data.id ], type: app.Sequelize.QueryTypes.SELECT }
      );
      if (existingSlug) {
        throw new Error('标签标识已存在');
      }
    }

    const updates = [];
    const values = [];

    if (data.name !== undefined) { updates.push('name = ?'); values.push(data.name); }
    if (data.slug !== undefined) { updates.push('slug = ?'); values.push(data.slug); }
    if (data.color !== undefined) { updates.push('color = ?'); values.push(data.color); }
    if (data.sortOrder !== undefined) { updates.push('sort_order = ?'); values.push(data.sortOrder); }

    updates.push('update_time = ?');
    values.push(now);
    values.push(data.id);

    await app.model.query(
      `UPDATE uied_article_tag SET ${updates.join(', ')} WHERE id = ?`,
      { replacements: values, type: app.Sequelize.QueryTypes.UPDATE }
    );

    return data;
  }

  /**
   * 删除标签（软删除）
   * @param {number} id - 标签ID
   */
  async del(id) {
    const { app } = this;
    const now = Math.floor(Date.now() / 1000);

    // 删除标签关联
    await app.model.query(
      'DELETE FROM uied_article_tag_relation WHERE tag_id = ?',
      { replacements: [ id ], type: app.Sequelize.QueryTypes.DELETE }
    );

    // 软删除标签
    await app.model.query(
      'UPDATE uied_article_tag SET is_delete = 1, update_time = ? WHERE id = ?',
      { replacements: [ now, id ], type: app.Sequelize.QueryTypes.UPDATE }
    );
  }

  /**
   * 获取文章的标签
   * @param {number} articleId - 文章ID
   */
  async getArticleTags(articleId) {
    const { app } = this;

    const tags = await app.model.query(
      `SELECT t.id, t.name, t.slug, t.color
       FROM uied_article_tag t
       INNER JOIN uied_article_tag_relation r ON t.id = r.tag_id
       WHERE r.article_id = ? AND t.is_delete = 0
       ORDER BY t.sort_order ASC`,
      { replacements: [ articleId ], type: app.Sequelize.QueryTypes.SELECT }
    );

    return tags.map(t => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      color: t.color,
    }));
  }

  /**
   * 设置文章的标签
   * @param {number} articleId - 文章ID
   * @param {number[]} tagIds - 标签ID数组
   */
  async setArticleTags(articleId, tagIds) {
    const { app } = this;
    const now = Math.floor(Date.now() / 1000);

    // 删除现有关联
    await app.model.query(
      'DELETE FROM uied_article_tag_relation WHERE article_id = ?',
      { replacements: [ articleId ], type: app.Sequelize.QueryTypes.DELETE }
    );

    // 批量创建新关联
    if (tagIds && tagIds.length > 0) {
      const values = tagIds.map(tagId => `(${parseInt(articleId)}, ${parseInt(tagId)}, ${now})`).join(', ');
      await app.model.query(
        `INSERT INTO uied_article_tag_relation (article_id, tag_id, create_time) VALUES ${values}`,
        { type: app.Sequelize.QueryTypes.INSERT }
      );
    }

    return this.getArticleTags(articleId);
  }
}

module.exports = ArticleTagService;
