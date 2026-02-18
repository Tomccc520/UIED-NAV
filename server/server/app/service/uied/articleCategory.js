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
   * 判断是否为可降级的库结构兼容错误
   */
  isSchemaCompatibilityError(error) {
    const code = String(error?.original?.code || error?.code || '').toUpperCase();
    const message = String(error?.message || '');
    return code === 'ER_NO_SUCH_TABLE'
      || code === 'ER_BAD_FIELD_ERROR'
      || code === 'ER_CANT_AGGREGATE_2COLLATIONS'
      || message.includes('doesn\'t exist')
      || message.includes('Unknown column')
      || message.includes('Illegal mix of collations');
  }

  /**
   * 从文章表回退生成分类列表（用于分类表缺失/字段不一致场景）
   */
  async fallbackAllFromArticleTable() {
    const { app } = this;
    try {
      const rows = await app.model.query(
        `SELECT category AS name, COUNT(*) AS article_count
         FROM uied_article
         WHERE is_delete = 0
           AND category IS NOT NULL
           AND category != ''
         GROUP BY category
         ORDER BY category ASC`,
        { type: app.Sequelize.QueryTypes.SELECT }
      );
      return (Array.isArray(rows) ? rows : []).map((item, index) => {
        const name = String(item?.name || '').trim();
        return {
          id: index + 1,
          name,
          slug: this.normalizeSlug(name),
          description: '',
          sortOrder: index,
          sort_order: index,
          articleCount: this.parsePositiveInt(item?.article_count, 0),
        };
      }).filter(item => item.name);
    } catch (error) {
      this.ctx.logger.warn('[articleCategory] fallbackAllFromArticleTable 失败，返回空数组:', error.message);
      return [];
    }
  }
  /**
   * 获取文章表的“分类ID”字段名（兼容 category_id / categoryId / cate_id / 无该字段）
   */
  async getArticleCategoryColumn() {
    if (this._articleCategoryColumn !== undefined) {
      return this._articleCategoryColumn;
    }

    const { app } = this;
    try {
      const rows = await app.model.query(
        `SELECT COLUMN_NAME
         FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = 'uied_article'
           AND COLUMN_NAME IN ('category_id', 'categoryId', 'cate_id')`,
        { type: app.Sequelize.QueryTypes.SELECT }
      );
      const available = new Set((Array.isArray(rows) ? rows : []).map(item => String(item?.COLUMN_NAME || '')));
      if (available.has('category_id')) {
        this._articleCategoryColumn = 'category_id';
      } else if (available.has('categoryId')) {
        this._articleCategoryColumn = 'categoryId';
      } else if (available.has('cate_id')) {
        this._articleCategoryColumn = 'cate_id';
      } else {
        this._articleCategoryColumn = '';
      }
    } catch (error) {
      this._articleCategoryColumn = '';
      this.ctx.logger.warn('[articleCategory] 检测分类字段失败，回退为 category 文本模式:', error.message);
    }
    return this._articleCategoryColumn;
  }

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
    const articleCategoryColumn = await this.getArticleCategoryColumn();
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

    let total = 0;
    let categories = [];
    try {
      // 获取总数
      const [ countResult ] = await app.model.query(
        `SELECT COUNT(*) as total FROM uied_article_category c WHERE ${whereClause}`,
        { replacements, type: app.Sequelize.QueryTypes.SELECT }
      );
      total = this.parsePositiveInt(countResult?.total, 0);

      // 获取列表（包含文章数量）
      const articleCountWhere = articleCategoryColumn
        ? `a.\`${articleCategoryColumn}\` = c.id`
        : 'BINARY a.category = BINARY c.name';
      categories = await app.model.query(
        `SELECT c.*,
          (SELECT COUNT(*) FROM uied_article a WHERE ${articleCountWhere} AND a.is_delete = 0) as article_count
         FROM uied_article_category c
         WHERE ${whereClause}
         ORDER BY c.sort_order ASC, c.id ASC
         LIMIT ? OFFSET ?`,
        { replacements: [ ...replacements, currentPageSize, offset ], type: app.Sequelize.QueryTypes.SELECT }
      );
    } catch (error) {
      if (!this.isSchemaCompatibilityError(error)) {
        throw error;
      }
      this.ctx.logger.warn('[articleCategory] list 降级为文章表分类回退:', error.message);
      const allFallback = await this.fallbackAllFromArticleTable();
      const keywordText = String(keyword || '').trim();
      const filtered = keywordText
        ? allFallback.filter(item => String(item.name || '').includes(keywordText))
        : allFallback;
      total = filtered.length;
      categories = filtered.slice(offset, offset + currentPageSize).map(item => ({
        id: item.id,
        name: item.name,
        slug: item.slug,
        description: item.description,
        sort_order: item.sort_order,
        article_count: item.articleCount,
        create_time: 0,
        update_time: 0,
      }));
    }

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
    const articleCategoryColumn = await this.getArticleCategoryColumn();

    let categories = [];
    try {
      const articleCountWhere = articleCategoryColumn
        ? `a.\`${articleCategoryColumn}\` = c.id`
        : 'BINARY a.category = BINARY c.name';
      categories = await app.model.query(
        `SELECT c.*,
          (SELECT COUNT(*) FROM uied_article a WHERE ${articleCountWhere} AND a.is_delete = 0) as article_count
         FROM uied_article_category c
         WHERE c.is_delete = 0
         ORDER BY c.sort_order ASC, c.name ASC`,
        { type: app.Sequelize.QueryTypes.SELECT }
      );
    } catch (error) {
      if (!this.isSchemaCompatibilityError(error)) {
        throw error;
      }
      this.ctx.logger.warn('[articleCategory] all 降级为文章表分类回退:', error.message);
      return this.fallbackAllFromArticleTable();
    }

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
