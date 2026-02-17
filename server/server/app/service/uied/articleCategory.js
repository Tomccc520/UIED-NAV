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
   * 解析正整数参数
   */
  parsePositiveInt(value, defaultValue = 0) {
    const parsed = Number.parseInt(String(value ?? ''), 10);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      return defaultValue;
    }
    return parsed;
  }

  /**
   * 统一解析排序字段（兼容 sortOrder / sort_order / sort）
   */
  resolveSortOrder(data = {}, defaultValue = 0) {
    const raw = data.sortOrder ?? data.sort_order ?? data.sort;
    if (raw === undefined || raw === null || raw === '') {
      return defaultValue;
    }
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : defaultValue;
  }

  /**
   * 规范化 slug 文本
   */
  normalizeSlug(value = '') {
    return String(value || '')
      .trim()
      .toLowerCase()
      .replace(/[\s_]+/g, '-')
      .replace(/[^a-z0-9-\u4e00-\u9fa5]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * 生成分类 slug（传入空值时自动基于名称生成）
   */
  async resolveUniqueSlug(rawSlug = '', name = '', currentId = 0) {
    const { app } = this;
    let base = this.normalizeSlug(rawSlug) || this.normalizeSlug(name);
    if (!base) {
      base = `category-${Date.now().toString(36)}`;
    }
    let candidate = base;
    let seq = 2;
    while (true) {
      const [ row ] = await app.model.query(
        `SELECT id
         FROM uied_article_category
         WHERE slug = ?
           AND is_delete = 0
           AND id != ?
         LIMIT 1`,
        {
          replacements: [ candidate, Number(currentId || 0) ],
          type: app.Sequelize.QueryTypes.SELECT,
        }
      );
      if (!row) {
        return candidate;
      }
      candidate = `${base}-${seq}`;
      seq += 1;
    }
  }

  /**
   * 获取分类列表（分页）
   * @param {Object} params - 查询参数
   */
  async list({ page = 1, pageSize = 20, keyword }) {
    const { app } = this;
    const currentPage = this.parsePositiveInt(page, 1);
    const currentPageSize = this.parsePositiveInt(pageSize, 20);
    const offset = (currentPage - 1) * currentPageSize;

    // 构建查询条件
    let whereClause = 'c.is_delete = 0';
    const replacements = [];

    if (keyword) {
      whereClause += ' AND c.name LIKE ?';
      replacements.push(`%${keyword}%`);
    }

    // 获取总数
    const [ countResult ] = await app.model.query(
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
      { replacements: [ ...replacements, currentPageSize, offset ], type: app.Sequelize.QueryTypes.SELECT }
    );

    return {
      lists: categories.map(c => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description,
        sortOrder: c.sort_order,
        sort_order: c.sort_order,
        articleCount: c.article_count,
        createTime: c.create_time,
        updateTime: c.update_time,
      })),
      count: Number(total || 0),
      page: currentPage,
      pageSize: currentPageSize,
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
      sort_order: c.sort_order,
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
    const name = String(data.name || '').trim();
    const slug = await this.resolveUniqueSlug(data.slug, name, 0);
    const sortOrder = this.resolveSortOrder(data, 0);

    // 检查 slug 是否已存在
    const [ existingSlug ] = await app.model.query(
      'SELECT id FROM uied_article_category WHERE slug = ? AND is_delete = 0',
      { replacements: [ slug ], type: app.Sequelize.QueryTypes.SELECT }
    );
    if (existingSlug) {
      throw new Error('分类标识已存在');
    }

    const [ result ] = await app.model.query(
      `INSERT INTO uied_article_category (name, slug, description, sort_order, is_delete, create_time, update_time)
       VALUES (?, ?, ?, ?, 0, ?, ?)`,
      {
        replacements: [
          name,
          slug,
          data.description || '',
          sortOrder,
          now,
          now,
        ],
        type: app.Sequelize.QueryTypes.INSERT,
      }
    );

    return {
      id: result,
      name,
      slug,
      description: data.description || '',
      sortOrder,
      sort_order: sortOrder,
    };
  }

  /**
   * 编辑分类
   * @param {Object} data - 分类数据（含 id）
   */
  async edit(data) {
    const { app } = this;
    const now = Math.floor(Date.now() / 1000);

    // 检查分类是否存在
    const [ existing ] = await app.model.query(
      'SELECT id, slug FROM uied_article_category WHERE id = ? AND is_delete = 0',
      { replacements: [ data.id ], type: app.Sequelize.QueryTypes.SELECT }
    );
    if (!existing) {
      throw new Error('分类不存在');
    }

    // 检查 slug 是否与其他分类冲突
    let nextSlug = null;
    if (data.slug !== undefined && data.slug !== null && String(data.slug).trim()) {
      nextSlug = await this.resolveUniqueSlug(data.slug, data.name, data.id);
    } else if (!String(existing.slug || '').trim() && data.name !== undefined) {
      // 历史空 slug 数据兜底：编辑名称时自动回填
      nextSlug = await this.resolveUniqueSlug('', data.name, data.id);
    }

    const updates = [];
    const values = [];

    if (data.name !== undefined) { updates.push('name = ?'); values.push(String(data.name || '').trim()); }
    if (nextSlug !== null) { updates.push('slug = ?'); values.push(nextSlug); }
    if (data.description !== undefined) { updates.push('description = ?'); values.push(data.description); }
    if (data.sortOrder !== undefined || data.sort_order !== undefined || data.sort !== undefined) {
      updates.push('sort_order = ?');
      values.push(this.resolveSortOrder(data, 0));
    }

    if (!updates.length) {
      return data;
    }

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
      { replacements: [ now, id ], type: app.Sequelize.QueryTypes.UPDATE }
    );
  }
}

module.exports = ArticleCategoryService;
