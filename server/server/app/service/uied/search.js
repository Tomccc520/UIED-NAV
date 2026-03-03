/**
 * @copyright Tomda (https://www.tomda.top)
 * @copyright UIED技术团队 (https://fsuied.com)
 * @author UIED技术团队
 * @createDate 2026.3.1
 */

'use strict';

const Service = require('egg').Service;

class SearchService extends Service {
  /**
   * 读取网站表字段并做短时缓存，兼容不同环境下的历史库结构。
   * @return {Promise<Set<string>>} 字段名集合
   */
  async getWebsiteColumnSet() {
    const cacheKey = '__uiedWebsiteColumnCache';
    const now = Date.now();
    const cacheTtl = 60 * 1000;
    const cache = this.app[cacheKey];
    if (cache && now - Number(cache.timestamp || 0) < cacheTtl && cache.columns instanceof Set) {
      return cache.columns;
    }

    try {
      const rows = await this.app.model.query('SHOW COLUMNS FROM uied_website', {
        type: this.app.Sequelize.QueryTypes.SELECT,
      });
      const columns = new Set(
        (Array.isArray(rows) ? rows : [])
          .map(item => String(item?.Field || item?.field || '').trim())
          .filter(Boolean)
      );
      // 兜底保留核心字段，避免极端场景下全部判空。
      [ 'id', 'name', 'description', 'url', 'icon_url', 'category_id', 'is_delete' ].forEach(field => columns.add(field));
      this.app[cacheKey] = { timestamp: now, columns };
      return columns;
    } catch (error) {
      this.ctx.logger.warn('[uied.search] 读取 uied_website 字段失败，回退默认字段集: %s', error?.message || error);
      return new Set([ 'id', 'name', 'description', 'url', 'icon_url', 'category_id', 'is_delete' ]);
    }
  }

  /**
   * 按当前库字段构建网站关键词检索条件，避免引用不存在字段导致 SQL 失败。
   * @param {{searchType:string, pattern:string, columns:Set<string>}} options 条件参数
   * @return {{sql:string, params:any[]}} where 片段与绑定参数
   */
  buildWebsiteKeywordWhere(options) {
    const { searchType, pattern, columns } = options;
    const hasTag = columns.has('tags');
    const keywordColumns = [ 'name', 'description', 'tags', 'url' ].filter(column => columns.has(column));

    if (searchType === 'tag') {
      if (hasTag) {
        return { sql: 'AND w.tags LIKE ?', params: [ pattern ] };
      }
      if (keywordColumns.length === 0) {
        return { sql: '', params: [] };
      }
    }

    if (searchType === 'all' || searchType === 'website' || searchType === 'tag') {
      if (keywordColumns.length === 0) {
        return { sql: '', params: [] };
      }
      const sql = `AND (${keywordColumns.map(column => `w.${column} LIKE ?`).join(' OR ')})`;
      return { sql, params: keywordColumns.map(() => pattern) };
    }

    return { sql: '', params: [] };
  }

  /**
   * 构建网站搜索排序 SQL，按存在字段动态拼接，避免旧库缺字段报错。
   * @param {Set<string>} columns 字段集合
   * @param {'default'|'hot'|'new'|'name'} mode 排序模式
   * @return {string} ORDER BY 片段
   */
  buildWebsiteOrderBySql(columns, mode = 'default') {
    if (mode === 'name' && columns.has('name')) {
      return 'w.name ASC, w.id DESC';
    }
    if (mode === 'new') {
      if (columns.has('create_time')) return 'w.create_time DESC, w.id DESC';
      return 'w.id DESC';
    }

    const orderParts = [];
    [ 'is_pinned', 'is_hot', 'is_featured', 'click_count', 'sort' ].forEach(column => {
      if (columns.has(column)) {
        orderParts.push(`w.${column} DESC`);
      }
    });
    orderParts.push('w.id DESC');
    return orderParts.join(', ');
  }

  /**
   * 构建搜索相关性评分 SQL 片段，优先保证标题与标签命中排在前面。
   * @param {{keywordText:string, columns:Set<string>}} options 条件参数
   * @return {{selectSql:string, params:any[]}} 评分查询片段与绑定参数
   */
  buildWebsiteRelevanceSql(options) {
    const { keywordText, columns } = options;
    const keyword = String(keywordText || '').trim();
    if (!keyword) {
      return { selectSql: '0 AS relevanceScore', params: [] };
    }

    const exactPattern = keyword;
    const prefixPattern = `${keyword}%`;
    const containsPattern = `%${keyword}%`;
    const scoreParts = [];
    const params = [];

    /**
     * 为指定字段追加 exact/prefix/contains 三段评分逻辑。
     */
    const appendColumnScore = (column, exactWeight, prefixWeight, containsWeight) => {
      if (!columns.has(column)) return;
      scoreParts.push(`(CASE WHEN w.${column} = ? THEN ${exactWeight} ELSE 0 END)`);
      params.push(exactPattern);
      scoreParts.push(`(CASE WHEN w.${column} LIKE ? THEN ${prefixWeight} ELSE 0 END)`);
      params.push(prefixPattern);
      scoreParts.push(`(CASE WHEN w.${column} LIKE ? THEN ${containsWeight} ELSE 0 END)`);
      params.push(containsPattern);
    };

    appendColumnScore('name', 900, 620, 380);
    appendColumnScore('tags', 320, 240, 160);
    appendColumnScore('description', 200, 140, 90);
    appendColumnScore('url', 120, 90, 70);

    if (columns.has('is_pinned')) scoreParts.push('(CASE WHEN w.is_pinned = 1 THEN 80 ELSE 0 END)');
    if (columns.has('is_featured')) scoreParts.push('(CASE WHEN w.is_featured = 1 THEN 40 ELSE 0 END)');
    if (columns.has('is_hot')) scoreParts.push('(CASE WHEN w.is_hot = 1 THEN 24 ELSE 0 END)');
    if (columns.has('is_new')) scoreParts.push('(CASE WHEN w.is_new = 1 THEN 12 ELSE 0 END)');

    if (scoreParts.length === 0) {
      return { selectSql: '0 AS relevanceScore', params: [] };
    }
    return {
      selectSql: `(${scoreParts.join(' + ')}) AS relevanceScore`,
      params,
    };
  }

  /**
   * 按字段存在性构建 SELECT 片段，兼容 slug/is_pinned 等可选字段缺失场景。
   * @param {Set<string>} columns 字段集合
   * @param {string} relevanceSelectSql 相关性评分 SELECT 片段
   * @return {{selectSql:string, joinSql:string}} 查询片段
   */
  buildWebsiteSelectSql(columns, relevanceSelectSql = '0 AS relevanceScore') {
    const pickText = (column, alias) => (columns.has(column) ? `w.${column} AS ${alias}` : `'' AS ${alias}`);
    const pickNumber = (column, alias) => (columns.has(column) ? `w.${column} AS ${alias}` : `0 AS ${alias}`);
    const canJoinCategory = columns.has('category_id');

    return {
      selectSql: `
        SELECT
          w.id,
          ${pickText('name', 'name')},
          ${pickText('slug', 'slug')},
          ${pickText('description', 'description')},
          ${pickText('url', 'url')},
          ${pickText('icon_url', 'iconUrl')},
          ${pickText('tags', 'tags')},
          ${pickNumber('is_new', 'isNew')},
          ${pickNumber('is_hot', 'isHot')},
          ${pickNumber('is_featured', 'isFeatured')},
          ${pickNumber('click_count', 'clickCount')},
          ${relevanceSelectSql},
          ${canJoinCategory ? 'c.name AS category' : "'' AS category"}
        FROM uied_website w
      `,
      joinSql: canJoinCategory ? 'LEFT JOIN uied_category c ON c.id = w.category_id' : '',
    };
  }

  /**
   * 构建高级搜索关键词条件（名称/描述/标签/网址）。
   * @param {{keyword:string, columns:Set<string>}} options 条件参数
   * @return {{sql:string, params:any[]}} where 片段与绑定参数
   */
  buildAdvancedKeywordWhere(options) {
    const { keyword, columns } = options;
    const keywordText = String(keyword || '').trim();
    if (!keywordText) return { sql: '', params: [] };
    const searchableColumns = [ 'name', 'description', 'tags', 'url' ].filter(column => columns.has(column));
    if (searchableColumns.length === 0) return { sql: '', params: [] };
    const pattern = `%${keywordText}%`;
    return {
      sql: `(${searchableColumns.map(column => `w.${column} LIKE ?`).join(' OR ')})`,
      params: searchableColumns.map(() => pattern),
    };
  }

  /**
   * 解析标签字段，兼容 JSON 字符串与逗号分隔字符串
   * @param {string|Array} rawTags 原始标签字段
   * @return {string[]} 规范化标签数组
   */
  parseTags(rawTags) {
    if (Array.isArray(rawTags)) {
      return rawTags.map(item => String(item || '').trim()).filter(Boolean);
    }
    const text = String(rawTags || '').trim();
    if (!text) return [];
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        return parsed.map(item => String(item || '').trim()).filter(Boolean);
      }
    } catch (error) {
      // 兼容旧数据：非 JSON 文本继续按逗号拆分
    }
    return text.split(/[，,]/).map(item => String(item || '').trim()).filter(Boolean);
  }

  /**
   * 统一映射网站搜索结果字段，确保前端结构稳定
   * @param {object} row 原始数据库行
   * @return {object} 前端可直接消费的结果对象
   */
  mapWebsiteSearchRow(row) {
    return {
      id: String(row?.id || ''),
      name: String(row?.name || ''),
      slug: String(row?.slug || ''),
      description: String(row?.description || ''),
      url: String(row?.url || ''),
      iconUrl: String(row?.iconUrl || ''),
      category: String(row?.category || ''),
      tags: this.parseTags(row?.tags),
      isNew: Number(row?.isNew || 0) === 1,
      isHot: Number(row?.isHot || 0) === 1,
      isFeatured: Number(row?.isFeatured || 0) === 1,
      clickCount: Number(row?.clickCount || 0),
      relevanceScore: Number(row?.relevanceScore || 0),
    };
  }

  /**
   * 全站搜索
   */
  async globalSearch({ keyword, page, pageSize, type }) {
    const { app } = this;
    const safePage = Number.isFinite(Number(page)) ? Math.max(1, Number(page)) : 1;
    const safePageSize = Number.isFinite(Number(pageSize)) ? Math.max(1, Math.min(100, Number(pageSize))) : 20;
    const offset = (safePage - 1) * safePageSize;
    const keywordText = String(keyword || '').trim();
    const pattern = `%${keywordText}%`;
    const searchType = String(type || 'all').trim().toLowerCase();
    const websiteColumns = await this.getWebsiteColumnSet();
    const relevanceMeta = this.buildWebsiteRelevanceSql({
      keywordText,
      columns: websiteColumns,
    });
    const keywordWhere = this.buildWebsiteKeywordWhere({
      searchType,
      pattern,
      columns: websiteColumns,
    });
    const websiteWhereSql = keywordWhere.sql;
    const websiteWhereParams = keywordWhere.params;

    let total = 0;
    let websiteRows = [];
    if (searchType === 'all' || searchType === 'website' || searchType === 'tag') {
      const [ totalRow ] = await app.model.query(
        `
        SELECT COUNT(1) AS total
        FROM uied_website w
        WHERE w.is_delete = 0
          ${websiteWhereSql}
        `,
        {
          replacements: [ ...websiteWhereParams ],
          type: app.Sequelize.QueryTypes.SELECT,
        }
      );
      total = Number(totalRow?.total || 0);

      const { selectSql, joinSql } = this.buildWebsiteSelectSql(websiteColumns, relevanceMeta.selectSql);
      const orderBySql = `relevanceScore DESC, ${this.buildWebsiteOrderBySql(websiteColumns, 'default')}`;
      websiteRows = await app.model.query(
        `
        ${selectSql}
        ${joinSql}
        WHERE w.is_delete = 0
          ${websiteWhereSql}
        ORDER BY ${orderBySql}
        LIMIT ?
        OFFSET ?
        `,
        {
          replacements: [ ...relevanceMeta.params, ...websiteWhereParams, safePageSize, offset ],
          type: app.Sequelize.QueryTypes.SELECT,
        }
      );
    }

    let categories = [];
    if (searchType === 'all' || searchType === 'category') {
      categories = await app.model.query(
        `
        SELECT
          id,
          name,
          slug,
          description,
          icon,
          color,
          parent_id AS parentId
        FROM uied_category
        WHERE is_delete = 0
          AND is_show = 1
          AND (name LIKE ? OR description LIKE ?)
        ORDER BY sort ASC, id ASC
        LIMIT 10
        `,
        {
          replacements: [ pattern, pattern ],
          type: app.Sequelize.QueryTypes.SELECT,
        }
      );
    }

    await this.recordSearchHistory(keywordText);

    return {
      lists: (Array.isArray(websiteRows) ? websiteRows : []).map(row => this.mapWebsiteSearchRow(row)),
      categories: Array.isArray(categories) ? categories : [],
      tags: [],
      total,
      pageNo: safePage,
      pageSize: safePageSize,
      keyword: keywordText,
    };
  }

  /**
   * 高级搜索
   */
  async advancedSearch(params) {
    const { app } = this;
    const {
      keyword,
      categoryId,
      tags,
      sortBy = 'hot',
      page = 1,
      pageSize = 20,
    } = params;
    const safePage = Number.isFinite(Number(page)) ? Math.max(1, Number(page)) : 1;
    const safePageSize = Number.isFinite(Number(pageSize)) ? Math.max(1, Math.min(100, Number(pageSize))) : 20;
    const offset = (safePage - 1) * safePageSize;
    const websiteColumns = await this.getWebsiteColumnSet();
    const relevanceMeta = this.buildWebsiteRelevanceSql({
      keywordText: keyword,
      columns: websiteColumns,
    });

    const whereSqlParts = [ 'w.is_delete = 0' ];
    const replacements = [];

    /**
     * 构建高级搜索关键词条件（名称/描述/标签/网址）
     */
    const keywordWhere = this.buildAdvancedKeywordWhere({
      keyword,
      columns: websiteColumns,
    });
    if (keywordWhere.sql) {
      whereSqlParts.push(keywordWhere.sql);
      replacements.push(...keywordWhere.params);
    }

    /**
     * 构建高级搜索分类过滤条件
     */
    if (websiteColumns.has('category_id') && Number(categoryId) > 0) {
      whereSqlParts.push('w.category_id = ?');
      replacements.push(Number(categoryId));
    }

    /**
     * 构建高级搜索标签过滤条件（至少命中一个标签）
     */
    if (websiteColumns.has('tags') && Array.isArray(tags) && tags.length > 0) {
      const safeTags = tags
        .map(item => String(item || '').trim())
        .filter(Boolean)
        .slice(0, 10);
      if (safeTags.length > 0) {
        const tagSql = safeTags.map(() => 'w.tags LIKE ?').join(' OR ');
        whereSqlParts.push(`(${tagSql})`);
        safeTags.forEach(tag => replacements.push(`%${tag}%`));
      }
    }

    /**
     * 构建排序策略（热度/最新/名称）
     */
    const normalizedSort = String(sortBy || 'hot').toLowerCase();
    const orderBySql = this.buildWebsiteOrderBySql(
      websiteColumns,
      [ 'hot', 'new', 'name' ].includes(normalizedSort) ? normalizedSort : 'hot'
    );
    const whereSql = whereSqlParts.join(' AND ');

    const [ totalRow ] = await app.model.query(
      `SELECT COUNT(1) AS total FROM uied_website w WHERE ${whereSql}`,
      {
        replacements: [ ...replacements ],
        type: app.Sequelize.QueryTypes.SELECT,
      }
    );
    const count = Number(totalRow?.total || 0);

    const { selectSql, joinSql } = this.buildWebsiteSelectSql(websiteColumns, relevanceMeta.selectSql);
    const finalOrderBySql = keywordWhere.sql
      ? `relevanceScore DESC, ${orderBySql}`
      : orderBySql;
    const rows = await app.model.query(
      `
      ${selectSql}
      ${joinSql}
      WHERE ${whereSql}
      ORDER BY ${finalOrderBySql}
      LIMIT ?
      OFFSET ?
      `,
      {
        replacements: [ ...relevanceMeta.params, ...replacements, safePageSize, offset ],
        type: app.Sequelize.QueryTypes.SELECT,
      }
    );

    return {
      lists: (Array.isArray(rows) ? rows : []).map(row => this.mapWebsiteSearchRow(row)),
      total: count,
      pageNo: safePage,
      pageSize: safePageSize,
    };
  }

  /**
   * 获取搜索建议
   */
  async getSuggestions(keyword) {
    const { app } = this;

    if (!keyword || keyword.length < 2) {
      return { websites: [], categories: [] };
    }

    const websiteColumns = await this.getWebsiteColumnSet();
    const pattern = `%${String(keyword || '').trim()}%`;
    const suggestionOrderBy = this.buildWebsiteOrderBySql(websiteColumns, 'default').replace(/w\./g, '');
    const websites = await app.model.query(
      `
      SELECT id, name
      FROM uied_website
      WHERE is_delete = 0
        AND name LIKE ?
      ORDER BY ${suggestionOrderBy}
      LIMIT 8
      `,
      {
        replacements: [ pattern ],
        type: app.Sequelize.QueryTypes.SELECT,
      }
    );

    const categories = await app.model.query(
      `
      SELECT id, name
      FROM uied_category
      WHERE is_delete = 0
        AND is_show = 1
        AND name LIKE ?
      ORDER BY sort ASC, id ASC
      LIMIT 5
      `,
      {
        replacements: [ pattern ],
        type: app.Sequelize.QueryTypes.SELECT,
      }
    );

    return {
      websites: (Array.isArray(websites) ? websites : []).map(w => ({ id: w.id, name: w.name, type: 'website' })),
      categories: (Array.isArray(categories) ? categories : []).map(c => ({ id: c.id, name: c.name, type: 'category' })),
    };
  }

  /**
   * 获取热门搜索
   */
  async getHotSearches() {
    const { ctx } = this;

    try {
      // 从Redis获取热门关键词
      const hotKeywords = await ctx.app.redis.zrevrange('search:hot', 0, 9);
      if (hotKeywords && hotKeywords.length > 0) {
        return hotKeywords;
      }
    } catch (error) {
      // Redis不可用时使用默认值
    }

    // 默认热门搜索
    return [
      'UI设计',
      'AI工具',
      '3D建模',
      '图标库',
      '配色方案',
      '字体下载',
      '设计灵感',
      '原型工具',
    ];
  }

  /**
   * 记录搜索历史
   */
  async recordSearchHistory(keyword) {
    const { ctx } = this;

    try {
      // 增加搜索次数到Redis
      await ctx.app.redis.zincrby('search:hot', 1, keyword);

      // 设置过期时间（30天）
      await ctx.app.redis.expire('search:hot', 30 * 24 * 60 * 60);
    } catch (error) {
      // 静默失败，不影响搜索功能
      console.error('记录搜索历史失败:', error);
    }
  }
}

module.exports = SearchService;
