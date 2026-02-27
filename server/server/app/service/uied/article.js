/**
 * @file service/uied/article.js
 * @description UIED 文章管理服务
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

'use strict';

const Service = require('egg').Service;

class ArticleService extends Service {
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
      this.ctx.logger.warn('[article] 检测分类字段失败，回退为 category 文本模式:', error.message);
    }
    return this._articleCategoryColumn;
  }

  /**
   * 根据分类ID查询分类名称（用于无 category_id 字段时的兼容过滤）
   */
  async getCategoryNameById(categoryId) {
    const { app } = this;
    const id = this.parsePositiveInt(categoryId, 0);
    if (!id) return '';
    try {
      const [ row ] = await app.model.query(
        'SELECT name FROM uied_article_category WHERE id = ? AND is_delete = 0 LIMIT 1',
        { replacements: [ id ], type: app.Sequelize.QueryTypes.SELECT }
      );
      return String(row?.name || '').trim();
    } catch (error) {
      if (!this.isSchemaCompatibilityError(error)) {
        throw error;
      }
      this.ctx.logger.warn('[article] getCategoryNameById 降级为空字符串:', error.message);
      return '';
    }
  }

  /**
   * 获取文章列表（管理后台 & 前端）
   */
  async list(params = {}) {
    const { app } = this;
    const currentPage = this.parsePositiveInt(params.page ?? params.pageNo, 1);
    const currentPageSize = this.parsePositiveInt(params.pageSize ?? params.limit, 15);
    const rawStatus = String(params.status || '').trim();
    const rawIsShow = params.isShow;
    const keyword = String(params.keyword || '').trim();
    const category = String(params.category || '').trim();
    const categoryId = this.parsePositiveInt(params.categoryId ?? params.cid, 0);
    const tagId = this.parsePositiveInt(params.tagId ?? params.tag_id, 0);
    const tagSlug = String(params.tagSlug || params.tag || '').trim();
    const offset = (currentPage - 1) * currentPageSize;
    const articleCategoryColumn = await this.getArticleCategoryColumn();
    const selectCategoryIdSql = articleCategoryColumn
      ? `\`${articleCategoryColumn}\` AS category_id`
      : 'NULL AS category_id';

    // 关键词搜索
    let keywordCondition = '';
    const replacements = [];
    if (keyword) {
      keywordCondition = ' AND (title LIKE ? OR content LIKE ?)';
      replacements.push(`%${keyword}%`, `%${keyword}%`);
    }

    // 构建状态条件
    let statusCondition = '';
    let status = rawStatus;
    /**
     * 兼容旧参数 isShow（1=published,0=draft），避免前端切换成本
     */
    if (!status && rawIsShow !== undefined && rawIsShow !== null && rawIsShow !== '') {
      status = Number(rawIsShow) === 1 ? 'published' : 'draft';
    }
    if (status === 'published' || status === 'draft') {
      statusCondition = ' AND status = ?';
      replacements.push(status);
    }

    // 构建分类条件
    let categoryCondition = '';
    if (categoryId) {
      if (articleCategoryColumn) {
        categoryCondition = ` AND \`${articleCategoryColumn}\` = ?`;
        replacements.push(categoryId);
      } else {
        const categoryName = await this.getCategoryNameById(categoryId);
        if (!categoryName) {
          return {
            lists: [],
            count: 0,
            page: currentPage,
            pageSize: currentPageSize,
          };
        }
        categoryCondition = ' AND category = ?';
        replacements.push(categoryName);
      }
    } else if (category) {
      categoryCondition = ' AND category = ?';
      replacements.push(category);
    }

    // 构建标签条件 (需要联表)
    let tagCondition = '';
    if (tagId) {
      // 使用 EXISTS 子查询比 JOIN 更高效且避免重复行
      tagCondition = ` AND EXISTS (
        SELECT 1 FROM uied_article_tag_relation tr 
        WHERE tr.article_id = uied_article.id 
        AND tr.tag_id = ?
      )`;
      replacements.push(tagId);
    } else if (tagSlug) {
      // 兼容按 tag slug 查询
      tagCondition = ` AND EXISTS (
        SELECT 1
        FROM uied_article_tag_relation tr
        INNER JOIN uied_article_tag t ON t.id = tr.tag_id AND t.is_delete = 0
        WHERE tr.article_id = uied_article.id
        AND t.slug = ?
      )`;
      replacements.push(tagSlug);
    }

    try {
      // 查询总数
      const [ countResult ] = await app.model.query(
        `SELECT COUNT(*) as total FROM uied_article 
         WHERE is_delete = 0${statusCondition}${categoryCondition}${tagCondition}${keywordCondition}`,
        { replacements, type: app.Sequelize.QueryTypes.SELECT }
      );

      // 查询列表
      const lists = await app.model.query(
        `SELECT id, title, excerpt, cover_image, author, category, ${selectCategoryIdSql}, slug, status, 
                view_count, published_at, create_time, update_time
         FROM uied_article 
         WHERE is_delete = 0${statusCondition}${categoryCondition}${tagCondition}${keywordCondition}
         ORDER BY create_time DESC
         LIMIT ? OFFSET ?`,
        {
          replacements: [ ...replacements, currentPageSize, offset ],
          type: app.Sequelize.QueryTypes.SELECT,
        }
      );

      // 批量获取文章标签
      const formattedLists = lists.map(item => this.formatArticle(item));
      const articleIds = formattedLists.map(a => a.id);
      const tagsMap = await this.batchGetArticleTags(articleIds);

      // 将标签附加到每篇文章
      for (const article of formattedLists) {
        article.tags = tagsMap[article.id] || [];
      }

      return {
        lists: formattedLists,
        count: Number(countResult.total || 0),
        page: currentPage,
        pageSize: currentPageSize,
      };
    } catch (error) {
      if (!this.isSchemaCompatibilityError(error)) {
        throw error;
      }
      this.ctx.logger.warn('[article] list 降级为空列表:', error.message);
      return {
        lists: [],
        count: 0,
        page: currentPage,
        pageSize: currentPageSize,
      };
    }
  }

  /**
   * 增加文章浏览量
   */
  async visitIncr(id) {
    const { app } = this;
    const now = Math.floor(Date.now() / 1000);
    
    // 检查文章是否存在
    const [ article ] = await app.model.query(
      'SELECT id, view_count FROM uied_article WHERE id = ? AND is_delete = 0',
      { replacements: [ id ], type: app.Sequelize.QueryTypes.SELECT }
    );
    
    if (!article) {
      throw new Error('文章不存在');
    }
    
    // 更新浏览量
    await app.model.query(
      'UPDATE uied_article SET view_count = view_count + 1 WHERE id = ?',
      { replacements: [ id ], type: app.Sequelize.QueryTypes.UPDATE }
    );
    
    return {
      id: article.id,
      visit: (article.view_count || 0) + 1
    };
  }

  /**
   * 获取文章详情
   */
  async detail(id) {
    const { app } = this;

    const [ article ] = await app.model.query(
      'SELECT * FROM uied_article WHERE id = ? AND is_delete = 0',
      { replacements: [ id ], type: app.Sequelize.QueryTypes.SELECT }
    );

    if (!article) return null;
    const formatted = this.formatArticle(article, true);

    // 获取文章标签
    const tagsMap = await this.batchGetArticleTags([ article.id ]);
    formatted.tags = tagsMap[article.id] || [];

    return formatted;
  }

  /**
   * 通过 slug 获取文章详情（前端）
   */
  async detailBySlug(slug) {
    const { app } = this;

    const [ article ] = await app.model.query(
      'SELECT * FROM uied_article WHERE slug = ? AND is_delete = 0 AND status = \'published\'',
      { replacements: [ slug ], type: app.Sequelize.QueryTypes.SELECT }
    );

    if (!article) return null;
    const formatted = this.formatArticle(article, true);

    // 获取文章标签
    const tagsMap = await this.batchGetArticleTags([ article.id ]);
    formatted.tags = tagsMap[article.id] || [];

    return formatted;
  }

  /**
   * 规范化文章入参（兼容新旧字段命名）
   */
  normalizeArticlePayload(data = {}) {
    const statusRaw = String(data.status || '').trim();
    const isShowRaw = data.isShow;
    let status = statusRaw;
    if (!status && isShowRaw !== undefined && isShowRaw !== null && isShowRaw !== '') {
      status = Number(isShowRaw) === 1 ? 'published' : 'draft';
    }
    if (status !== 'published' && status !== 'draft') {
      status = 'draft';
    }
    const title = String(data.title || '').trim();
    const content = String(data.content || '').trim();
    const excerpt = String(data.excerpt || data.summary || '').trim();
    const coverImage = String(data.coverImage || data.cover_image || data.image || '').trim();
    const author = String(data.author || '').trim() || '管理员';
    const category = String(data.category || data.categoryName || '').trim();
    const categoryId = this.parsePositiveInt(data.categoryId ?? data.category_id ?? data.cid, 0) || null;
    const slug = String(data.slug || '').trim();
    const seoTitle = String(data.seoTitle || data.seo_title || '').trim();
    const seoDescription = String(data.seoDescription || data.seo_description || '').trim();
    const hasTagIdsInput = data.tagIds !== undefined || data.tag_ids !== undefined;
    const tagIdsRaw = data.tagIds !== undefined ? data.tagIds : data.tag_ids;
    const tagIds = Array.isArray(tagIdsRaw)
      ? Array.from(new Set(tagIdsRaw.map(item => this.parsePositiveInt(item, 0)).filter(Boolean)))
      : [];

    return {
      title,
      content,
      excerpt,
      coverImage,
      author,
      category,
      categoryId,
      slug,
      status,
      seoTitle,
      seoDescription,
      tagIds,
      hasTagIdsInput,
    };
  }

  /**
   * 创建文章
   */
  async add(data) {
    const { app } = this;
    const now = Math.floor(Date.now() / 1000);
    const payload = this.normalizeArticlePayload(data);
    const articleCategoryColumn = await this.getArticleCategoryColumn();
    let categoryName = payload.category || '未分类';
    if (!payload.category && payload.categoryId) {
      const [ categoryRow ] = await app.model.query(
        'SELECT name FROM uied_article_category WHERE id = ? AND is_delete = 0',
        { replacements: [ payload.categoryId ], type: app.Sequelize.QueryTypes.SELECT }
      );
      if (categoryRow && categoryRow.name) {
        categoryName = String(categoryRow.name);
      }
    }

    // 生成 slug
    const slug = payload.slug || this.generateSlug(payload.title);

    // 检查 slug 唯一性
    const [ existing ] = await app.model.query(
      'SELECT id FROM uied_article WHERE slug = ? AND is_delete = 0',
      { replacements: [ slug ], type: app.Sequelize.QueryTypes.SELECT }
    );

    if (existing) {
      throw new Error('URL标识已存在');
    }

    const insertColumns = [
      'title',
      'content',
      'excerpt',
      'cover_image',
      'author',
      'category',
      'slug',
      'status',
      'seo_title',
      'seo_description',
      'published_at',
      'create_time',
      'update_time',
    ];
    const insertValues = [
      payload.title || '',
      payload.content || '',
      payload.excerpt || (payload.content || '').slice(0, 200),
      payload.coverImage || null,
      payload.author || '管理员',
      categoryName,
      slug,
      payload.status || 'draft',
      payload.seoTitle || payload.title,
      payload.seoDescription || (payload.excerpt || '').slice(0, 160),
      payload.status === 'published' ? now : null,
      now,
      now,
    ];
    if (articleCategoryColumn) {
      insertColumns.splice(6, 0, `\`${articleCategoryColumn}\``);
      insertValues.splice(6, 0, payload.categoryId || null);
    }
    const placeholders = insertColumns.map(() => '?').join(', ');
    const [ result ] = await app.model.query(
      `INSERT INTO uied_article (${insertColumns.join(', ')})
       VALUES (${placeholders})`,
      { replacements: insertValues, type: app.Sequelize.QueryTypes.INSERT }
    );

    // 保存文章标签关联
    if (payload.tagIds.length > 0) {
      await this.ctx.service.uied.articleTag.setArticleTags(result, payload.tagIds);
    }

    return result;
  }

  /**
   * 更新文章
   */
  async edit(id, data) {
    const { app } = this;
    const now = Math.floor(Date.now() / 1000);
    const payload = this.normalizeArticlePayload(data);
    const articleCategoryColumn = await this.getArticleCategoryColumn();
    let categoryName = payload.category || '未分类';
    if (!payload.category && payload.categoryId) {
      const [ categoryRow ] = await app.model.query(
        'SELECT name FROM uied_article_category WHERE id = ? AND is_delete = 0',
        { replacements: [ payload.categoryId ], type: app.Sequelize.QueryTypes.SELECT }
      );
      if (categoryRow && categoryRow.name) {
        categoryName = String(categoryRow.name);
      }
    }

    // 检查文章是否存在
    const [ existing ] = await app.model.query(
      `SELECT id, status, published_at, ${articleCategoryColumn ? `\`${articleCategoryColumn}\`` : 'NULL'} AS category_id, slug
       FROM uied_article
       WHERE id = ? AND is_delete = 0`,
      { replacements: [ id ], type: app.Sequelize.QueryTypes.SELECT }
    );

    if (!existing) {
      throw new Error('文章不存在');
    }

    // 如果修改了 slug，检查唯一性
    if (payload.slug) {
      const [ slugExists ] = await app.model.query(
        'SELECT id FROM uied_article WHERE slug = ? AND id != ? AND is_delete = 0',
        { replacements: [ payload.slug, id ], type: app.Sequelize.QueryTypes.SELECT }
      );
      if (slugExists) {
        throw new Error('URL标识已存在');
      }
    }

    // 处理发布时间
    let publishedAt = existing.published_at;
    if (payload.status === 'published' && !existing.published_at) {
      publishedAt = now;
    }

    const updateSetSql = [
      'title = ?',
      'content = ?',
      'excerpt = ?',
      'cover_image = ?',
      'author = ?',
      'category = ?',
      'slug = ?',
      'status = ?',
      'seo_title = ?',
      'seo_description = ?',
      'published_at = ?',
      'update_time = ?',
    ];
    const updateValues = [
      payload.title || '',
      payload.content || '',
      payload.excerpt || '',
      payload.coverImage || null,
      payload.author || '管理员',
      categoryName,
      payload.slug || existing.slug,
      payload.status || existing.status,
      payload.seoTitle || payload.title,
      payload.seoDescription || '',
      publishedAt,
      now,
    ];
    if (articleCategoryColumn) {
      updateSetSql.splice(6, 0, `\`${articleCategoryColumn}\` = ?`);
      updateValues.splice(6, 0, payload.categoryId !== null ? payload.categoryId : existing.category_id || null);
    }
    updateValues.push(id);

    await app.model.query(
      `UPDATE uied_article SET
       ${updateSetSql.join(', ')}
       WHERE id = ?`,
      { replacements: updateValues, type: app.Sequelize.QueryTypes.UPDATE }
    );

    // 保存文章标签关联
    if (payload.hasTagIdsInput) {
      await this.ctx.service.uied.articleTag.setArticleTags(id, payload.tagIds);
    }

    return true;
  }

  /**
   * 删除文章（软删除）
   */
  async del(ids) {
    const { app } = this;
    const now = Math.floor(Date.now() / 1000);
    const idList = Array.isArray(ids) ? ids : [ ids ];
    const placeholders = idList.map(() => '?').join(',');

    await app.model.query(
      `UPDATE uied_article SET is_delete = 1, delete_time = ? WHERE id IN (${placeholders})`,
      { replacements: [ now, ...idList ], type: app.Sequelize.QueryTypes.UPDATE }
    );

    return true;
  }

  /**
   * 批量更新文章状态（发布/取消发布）
   * @param {number[]} ids - 文章ID数组
   * @param {string} status - 目标状态 ('published' 或 'draft')
   * @return {number} 更新的文章数量
   */
  async batchUpdateStatus(ids, status) {
    const { app } = this;
    const now = Math.floor(Date.now() / 1000);
    const idList = Array.isArray(ids) ? ids : [ ids ];

    if (idList.length === 0) {
      return 0;
    }

    const placeholders = idList.map(() => '?').join(',');

    if (status === 'published') {
      // 发布：更新状态，并为没有 published_at 的文章设置发布时间
      await app.model.query(
        `UPDATE uied_article 
         SET status = 'published', 
             published_at = CASE WHEN published_at IS NULL THEN ? ELSE published_at END,
             update_time = ?
         WHERE id IN (${placeholders}) AND is_delete = 0`,
        { replacements: [ now, now, ...idList ], type: app.Sequelize.QueryTypes.UPDATE }
      );
    } else {
      // 取消发布：仅更新状态
      await app.model.query(
        `UPDATE uied_article 
         SET status = ?, update_time = ?
         WHERE id IN (${placeholders}) AND is_delete = 0`,
        { replacements: [ status, now, ...idList ], type: app.Sequelize.QueryTypes.UPDATE }
      );
    }

    // 查询实际更新的数量
    const [ countResult ] = await app.model.query(
      `SELECT COUNT(*) as count FROM uied_article 
       WHERE id IN (${placeholders}) AND is_delete = 0 AND status = ?`,
      { replacements: [ ...idList, status ], type: app.Sequelize.QueryTypes.SELECT }
    );

    return countResult.count;
  }

  /**
   * 获取公开文章列表（前端）
   */
  async publicList(params = {}) {
    const { app } = this;
    const { page = 1, pageSize = 10, category, tag } = params;
    const offset = (page - 1) * pageSize;

    let categoryCondition = '';
    let tagJoin = '';
    const replacements = [];
    const countReplacements = [];

    if (category) {
      categoryCondition = ' AND a.category = ?';
      replacements.push(category);
      countReplacements.push(category);
    }

    // 标签过滤：通过关联表筛选
    if (tag) {
      tagJoin = ' INNER JOIN uied_article_tag_relation atr ON atr.article_id = a.id INNER JOIN uied_article_tag at ON at.id = atr.tag_id AND at.slug = ?';
      replacements.unshift(tag);
      countReplacements.unshift(tag);
    }

    // 查询总数
    const [ countResult ] = await app.model.query(
      `SELECT COUNT(DISTINCT a.id) as total FROM uied_article a${tagJoin}
       WHERE a.is_delete = 0 AND a.status = 'published'${categoryCondition}`,
      { replacements: countReplacements, type: app.Sequelize.QueryTypes.SELECT }
    );

    // 查询列表
    const lists = await app.model.query(
      `SELECT DISTINCT a.id, a.title, a.excerpt, a.cover_image, a.author, a.category, a.slug, 
              a.view_count, a.published_at, a.create_time
       FROM uied_article a${tagJoin}
       WHERE a.is_delete = 0 AND a.status = 'published'${categoryCondition}
       ORDER BY a.published_at DESC, a.create_time DESC
       LIMIT ? OFFSET ?`,
      {
        replacements: [ ...replacements, parseInt(pageSize), offset ],
        type: app.Sequelize.QueryTypes.SELECT,
      }
    );

    // 格式化并批量获取文章标签
    const formattedLists = lists.map(item => this.formatArticle(item));
    const articleIds = formattedLists.map(a => a.id);
    const tagsMap = await this.batchGetArticleTags(articleIds);

    // 将标签附加到每篇文章
    for (const article of formattedLists) {
      article.tags = tagsMap[article.id] || [];
    }

    return {
      lists: formattedLists,
      total: countResult.total,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
    };
  }

  /**
   * 获取所有分类
   */
  async categories(params = {}) {
    const { app } = this;
    const articleCategoryColumn = await this.getArticleCategoryColumn();
    const mode = String(params.mode || params.format || '').trim().toLowerCase();
    const needDetail = mode === 'full' || mode === 'detail'
      || params.detail === 1 || params.detail === '1' || params.detail === true;
    const publishedOnly = params.onlyPublished === 1
      || params.onlyPublished === '1'
      || params.onlyPublished === true
      || params.publishedOnly === 1
      || params.publishedOnly === '1'
      || params.publishedOnly === true;

    /**
     * 默认使用分类管理表，保证“先建分类再发文”的后台场景也能看到分类。
     */
    let categoryRows = [];
    try {
      categoryRows = await app.model.query(
        `SELECT id, name, slug
         FROM uied_article_category
         WHERE is_delete = 0
         ORDER BY sort_order ASC, id ASC`,
        { type: app.Sequelize.QueryTypes.SELECT }
      );
    } catch (error) {
      if (!this.isSchemaCompatibilityError(error)) {
        throw error;
      }
      this.ctx.logger.warn('[article] categories 降级到文章表分类去重:', error.message);
      categoryRows = [];
    }

    /**
     * publishedOnly 场景下仅返回有已发布文章的分类。
     */
    if (publishedOnly && categoryRows.length) {
      if (articleCategoryColumn) {
        const categoryIds = categoryRows.map(item => Number(item.id || 0)).filter(Boolean);
        if (categoryIds.length) {
          const placeholders = categoryIds.map(() => '?').join(',');
          const usedRows = await app.model.query(
            `SELECT DISTINCT \`${articleCategoryColumn}\` AS category_id
             FROM uied_article
             WHERE is_delete = 0
               AND status = 'published'
               AND \`${articleCategoryColumn}\` IN (${placeholders})`,
            {
              replacements: categoryIds,
              type: app.Sequelize.QueryTypes.SELECT,
            }
          );
          const usedSet = new Set(
            usedRows.map(item => Number(item.category_id || 0)).filter(Boolean)
          );
          categoryRows = categoryRows.filter(item => usedSet.has(Number(item.id || 0)));
        }
      } else {
        const usedRows = await app.model.query(
          `SELECT DISTINCT category
           FROM uied_article
           WHERE is_delete = 0
             AND status = 'published'
             AND category != ''`,
          { type: app.Sequelize.QueryTypes.SELECT }
        );
        const usedNames = new Set(
          usedRows.map(item => String(item.category || '').trim()).filter(Boolean)
        );
        categoryRows = categoryRows.filter(item => usedNames.has(String(item.name || '').trim()));
      }
    }

    /**
     * 兜底：当分类表为空时，回退到文章表去重分类名，保证线上不空白。
     */
    if (!categoryRows.length) {
      const articleCategories = await app.model.query(
        `SELECT DISTINCT category
         FROM uied_article
         WHERE is_delete = 0 AND category != ''
         ORDER BY category`,
        { type: app.Sequelize.QueryTypes.SELECT }
      );
      if (needDetail) {
        return articleCategories.map(item => ({
          id: 0,
          name: String(item.category || ''),
          slug: '',
        }));
      }
      return articleCategories.map(item => String(item.category || '')).filter(Boolean);
    }

    if (needDetail) {
      return categoryRows.map(item => ({
        id: Number(item.id || 0),
        name: String(item.name || ''),
        slug: String(item.slug || ''),
      }));
    }

    return categoryRows.map(item => String(item.name || '')).filter(Boolean);
  }

  /**
   * 获取所有标签（含文章数量）
   * 仅返回未删除且至少关联一篇已发布文章的标签
   */
  async tags() {
    const { app } = this;
    try {
      const tags = await app.model.query(
        `SELECT t.id, t.name, t.slug, t.color,
                COUNT(DISTINCT r.article_id) AS articleCount
         FROM uied_article_tag t
         INNER JOIN uied_article_tag_relation r ON r.tag_id = t.id
         INNER JOIN uied_article a ON a.id = r.article_id AND a.is_delete = 0 AND a.status = 'published'
         WHERE t.is_delete = 0
         GROUP BY t.id, t.name, t.slug, t.color
         ORDER BY t.sort_order ASC, t.name ASC`,
        { type: app.Sequelize.QueryTypes.SELECT }
      );

      return tags.map(tag => ({
        id: tag.id,
        name: tag.name,
        slug: tag.slug,
        color: tag.color,
        articleCount: parseInt(tag.articleCount, 10) || 0,
      }));
    } catch (error) {
      if (!this.isSchemaCompatibilityError(error)) {
        throw error;
      }
      this.ctx.logger.warn('[article] tags 降级为空列表:', error.message);
      return [];
    }
  }

  /**
   * 记录浏览
   */
  async recordView(id) {
    const { app } = this;

    await app.model.query(
      'UPDATE uied_article SET view_count = view_count + 1 WHERE id = ?',
      { replacements: [ id ], type: app.Sequelize.QueryTypes.UPDATE }
    );

    return true;
  }

  /**
   * 批量获取多篇文章的标签
   * @param {number[]} articleIds - 文章ID数组
   * @return {Object} 以 article_id 为 key，标签数组为 value 的映射
   */
  async batchGetArticleTags(articleIds) {
    const { app } = this;

    if (!articleIds || articleIds.length === 0) {
      return {};
    }

    const placeholders = articleIds.map(() => '?').join(',');
    let tags = [];
    try {
      tags = await app.model.query(
        `SELECT r.article_id, t.id, t.name, t.slug, t.color
         FROM uied_article_tag_relation r
         INNER JOIN uied_article_tag t ON t.id = r.tag_id
         WHERE r.article_id IN (${placeholders}) AND t.is_delete = 0
         ORDER BY t.sort_order ASC`,
        { replacements: articleIds, type: app.Sequelize.QueryTypes.SELECT }
      );
    } catch (error) {
      if (!this.isSchemaCompatibilityError(error)) {
        throw error;
      }
      this.ctx.logger.warn('[article] batchGetArticleTags 降级为空映射:', error.message);
      return {};
    }

    // 按 article_id 分组
    const tagsMap = {};
    for (const tag of tags) {
      const articleId = tag.article_id;
      if (!tagsMap[articleId]) {
        tagsMap[articleId] = [];
      }
      tagsMap[articleId].push({
        id: tag.id,
        name: tag.name,
        slug: tag.slug,
        color: tag.color,
      });
    }

    return tagsMap;
  }

  /**
   * 格式化文章数据
   */
  formatArticle(article, includeContent = false) {
    const result = {
      id: article.id,
      title: article.title,
      excerpt: article.excerpt,
      coverImage: article.cover_image,
      author: article.author,
      category: article.category,
      categoryId: this.parsePositiveInt(article.category_id, 0) || null,
      slug: article.slug,
      status: article.status,
      viewCount: article.view_count,
      seoTitle: article.seo_title,
      seoDescription: article.seo_description,
      publishedAt: article.published_at ? article.published_at * 1000 : null,
      createdAt: article.create_time ? article.create_time * 1000 : null,
      updatedAt: article.update_time ? article.update_time * 1000 : null,
      tags: article.tags || [],
    };

    if (includeContent) {
      result.content = article.content;
    }

    return result;
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
   * 生成 URL slug
   */
  generateSlug(text) {
    if (!text) return `article-${Date.now().toString(36)}`;

    return text
      .toLowerCase()
      .replace(/[^\w\u4e00-\u9fa5]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 100)
      + '-' + Date.now().toString(36);
  }
}

module.exports = ArticleService;
