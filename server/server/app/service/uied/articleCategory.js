/**
 * @file service/uied/articleCategory.js
 * @description 文章分类服务
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

'use strict';

const Service = require('egg').Service;

class ArticleCategoryService extends Service {
  /**
   * 获取分类列表（分页）
   * @param {Object} params - 查询参数
   */
  async list({ page = 1, pageSize = 20, keyword }) {
    const { app } = this;
    const offset = (page - 1) * pageSize;

    // 构建查询条件
    let whereClause = 'c.is_delete = 0';
    const replacements = [];

    if (keyword) {
      whereClause += ' AND c.name LIKE ?';
      replacements.push(`%${keyword}%`);
    }

    // 获取总数
    const [countResult] = await app.model.query(
      `SELECT COUNT(*) as total FROM uied_article_category c WHERE ${whereClause}`,
      { replacements, type: app.Sequelize.QueryTypes.SELECT }
    );
    const total = countResult.total;

    // 获取列表（包含文章数量）
    const categories = await app.model.query(
      `SELECT c.*,
        (SELECT COUNT(*) FROM uied_article a WHERE a.category_id = c.id AND a.is_delete = 0) as article_count
       FROM uied_article_category c
       WHERE ${whereClause}
       ORDER BY c.sort_order ASC, c.id ASC
       LIMIT ? OFFSET ?`,
      { replacements: [...replacements, pageSize, offset], type: app.Sequelize.QueryTypes.SELECT }
    );

    return {
      lists: categories.map(c => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description,
        sortOrder: c.sort_order,
        articleCount: c.article_count,
        createTime: c.create_time,
        updateTime: c.update_time,
      })),
      count: total,
      page,
      pageSize,
    };
  }

  /**
   * 获取所有分类
   */
  async all() {
    const { app } = this;

    const categories = await app.model.query(
      `SELECT c.*,
        (SELECT COUNT(*) FROM uied_article a WHERE a.category_id = c.id AND a.is_delete = 0) as article_count
       FROM uied_article_category c
       WHERE c.is_delete = 0
       ORDER BY c.sort_order ASC, c.name ASC`,
      { type: app.Sequelize.QueryTypes.SELECT }
    );

    return categories.map(c => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description,
      sortOrder: c.sort_order,
      articleCount: c.article_count,
    }));
  }

  /**
   * 添加分类
   * @param {Object} data - 分类数据
   */
  async add(data) {
    const { app } = this;
    const now = Math.floor(Date.now() / 1000);

    // 检查 slug 是否已存在
    const [existingSlug] = await app.model.query(
      'SELECT id FROM uied_article_category WHERE slug = ? AND is_delete = 0',
      { replacements: [data.slug], type: app.Sequelize.QueryTypes.SELECT }
    );
    if (existingSlug) {
      throw new Error('分类标识已存在');
    }

    const [result] = await app.model.query(
      `INSERT INTO uied_article_category (name, slug, description, sort_order, is_delete, create_time, update_time)
       VALUES (?, ?, ?, ?, 0, ?, ?)`,
      {
        replacements: [
          data.name,
          data.slug,
          data.description || '',
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
   * 编辑分类
   * @param {Object} data - 分类数据（含 id）
   */
  async edit(data) {
    const { app } = this;
    const now = Math.floor(Date.now() / 1000);

    // 检查分类是否存在
    const [existing] = await app.model.query(
      'SELECT id FROM uied_article_category WHERE id = ? AND is_delete = 0',
      { replacements: [data.id], type: app.Sequelize.QueryTypes.SELECT }
    );
    if (!existing) {
      throw new Error('分类不存在');
    }

    // 检查 slug 是否与其他分类冲突
    if (data.slug) {
      const [existingSlug] = await app.model.query(
        'SELECT id FROM uied_article_category WHERE slug = ? AND id != ? AND is_delete = 0',
        { replacements: [data.slug, data.id], type: app.Sequelize.QueryTypes.SELECT }
      );
      if (existingSlug) {
        throw new Error('分类标识已存在');
      }
    }

    const updates = [];
    const values = [];

    if (data.name !== undefined) { updates.push('name = ?'); values.push(data.name); }
    if (data.slug !== undefined) { updates.push('slug = ?'); values.push(data.slug); }
    if (data.description !== undefined) { updates.push('description = ?'); values.push(data.description); }
    if (data.sortOrder !== undefined) { updates.push('sort_order = ?'); values.push(data.sortOrder); }

    updates.push('update_time = ?');
    values.push(now);
    values.push(data.id);

    await app.model.query(
      `UPDATE uied_article_category SET ${updates.join(', ')} WHERE id = ?`,
      { replacements: values, type: app.Sequelize.QueryTypes.UPDATE }
    );

    return data;
  }

  /**
   * 删除分类（软删除）
   * @param {number} id - 分类ID
   */
  async del(id) {
    const { app } = this;
    const now = Math.floor(Date.now() / 1000);

    // 软删除分类
    await app.model.query(
      'UPDATE uied_article_category SET is_delete = 1, update_time = ? WHERE id = ?',
      { replacements: [now, id], type: app.Sequelize.QueryTypes.UPDATE }
    );
  }
}

module.exports = ArticleCategoryService;
