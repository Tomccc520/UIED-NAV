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
   * 获取文章列表（管理后台）
   */
  async list(params = {}) {
    const { app } = this;
    const { page = 1, pageSize = 15, status, category, keyword } = params;
    const offset = (page - 1) * pageSize;

    // 关键词搜索
    let keywordCondition = '';
    const replacements = [];
    if (keyword) {
      keywordCondition = ' AND (title LIKE ? OR content LIKE ?)';
      replacements.push(`%${keyword}%`, `%${keyword}%`);
    }

    // 构建状态条件
    let statusCondition = '';
    if (status) {
      statusCondition = ' AND status = ?';
      replacements.push(status);
    }

    // 构建分类条件
    let categoryCondition = '';
    if (category) {
      categoryCondition = ' AND category = ?';
      replacements.push(category);
    }

    // 查询总数
    const [countResult] = await app.model.query(
      `SELECT COUNT(*) as total FROM uied_article 
       WHERE is_delete = 0${statusCondition}${categoryCondition}${keywordCondition}`,
      { replacements, type: app.Sequelize.QueryTypes.SELECT }
    );

    // 查询列表
    const lists = await app.model.query(
      `SELECT id, title, excerpt, cover_image, author, category, slug, status, 
              view_count, published_at, create_time, update_time
       FROM uied_article 
       WHERE is_delete = 0${statusCondition}${categoryCondition}${keywordCondition}
       ORDER BY create_time DESC
       LIMIT ? OFFSET ?`,
      { 
        replacements: [...replacements, parseInt(pageSize), offset], 
        type: app.Sequelize.QueryTypes.SELECT 
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
      count: countResult.total,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
    };
  }

  /**
   * 获取文章详情
   */
  async detail(id) {
    const { app } = this;
    
    const [article] = await app.model.query(
      `SELECT * FROM uied_article WHERE id = ? AND is_delete = 0`,
      { replacements: [id], type: app.Sequelize.QueryTypes.SELECT }
    );

    if (!article) return null;
    const formatted = this.formatArticle(article, true);

    // 获取文章标签
    const tagsMap = await this.batchGetArticleTags([article.id]);
    formatted.tags = tagsMap[article.id] || [];

    return formatted;
  }

  /**
   * 通过 slug 获取文章详情（前端）
   */
  async detailBySlug(slug) {
    const { app } = this;
    
    const [article] = await app.model.query(
      `SELECT * FROM uied_article WHERE slug = ? AND is_delete = 0 AND status = 'published'`,
      { replacements: [slug], type: app.Sequelize.QueryTypes.SELECT }
    );

    if (!article) return null;
    const formatted = this.formatArticle(article, true);

    // 获取文章标签
    const tagsMap = await this.batchGetArticleTags([article.id]);
    formatted.tags = tagsMap[article.id] || [];

    return formatted;
  }

  /**
   * 创建文章
   */
  async add(data) {
    const { app } = this;
    const now = Math.floor(Date.now() / 1000);

    // 生成 slug
    const slug = data.slug || this.generateSlug(data.title);

    // 检查 slug 唯一性
    const [existing] = await app.model.query(
      'SELECT id FROM uied_article WHERE slug = ? AND is_delete = 0',
      { replacements: [slug], type: app.Sequelize.QueryTypes.SELECT }
    );

    if (existing) {
      throw new Error('URL标识已存在');
    }

    const [result] = await app.model.query(
      `INSERT INTO uied_article 
       (title, content, excerpt, cover_image, author, category, category_id, slug, status, 
        seo_title, seo_description, published_at, create_time, update_time)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      {
        replacements: [
          data.title || '',
          data.content || '',
          data.excerpt || (data.content || '').slice(0, 200),
          data.coverImage || null,
          data.author || '管理员',
          data.category || '未分类',
          data.categoryId || null,
          slug,
          data.status || 'draft',
          data.seoTitle || data.title,
          data.seoDescription || (data.excerpt || '').slice(0, 160),
          data.status === 'published' ? now : null,
          now,
          now,
        ],
        type: app.Sequelize.QueryTypes.INSERT,
      }
    );

    // 保存文章标签关联
    if (data.tagIds && Array.isArray(data.tagIds) && data.tagIds.length > 0) {
      await this.ctx.service.uied.articleTag.setArticleTags(result, data.tagIds);
    }

    return result;
  }

  /**
   * 更新文章
   */
  async edit(id, data) {
    const { app } = this;
    const now = Math.floor(Date.now() / 1000);

    // 检查文章是否存在
    const [existing] = await app.model.query(
      'SELECT id, status, published_at, category_id, slug FROM uied_article WHERE id = ? AND is_delete = 0',
      { replacements: [id], type: app.Sequelize.QueryTypes.SELECT }
    );

    if (!existing) {
      throw new Error('文章不存在');
    }

    // 如果修改了 slug，检查唯一性
    if (data.slug) {
      const [slugExists] = await app.model.query(
        'SELECT id FROM uied_article WHERE slug = ? AND id != ? AND is_delete = 0',
        { replacements: [data.slug, id], type: app.Sequelize.QueryTypes.SELECT }
      );
      if (slugExists) {
        throw new Error('URL标识已存在');
      }
    }

    // 处理发布时间
    let publishedAt = existing.published_at;
    if (data.status === 'published' && !existing.published_at) {
      publishedAt = now;
    }

    await app.model.query(
      `UPDATE uied_article SET
       title = ?, content = ?, excerpt = ?, cover_image = ?, author = ?,
       category = ?, category_id = ?, slug = ?, status = ?, seo_title = ?, seo_description = ?,
       published_at = ?, update_time = ?
       WHERE id = ?`,
      {
        replacements: [
          data.title || '',
          data.content || '',
          data.excerpt || '',
          data.coverImage || null,
          data.author || '管理员',
          data.category || '未分类',
          data.categoryId !== undefined ? data.categoryId : existing.category_id || null,
          data.slug || existing.slug,
          data.status || existing.status,
          data.seoTitle || data.title,
          data.seoDescription || '',
          publishedAt,
          now,
          id,
        ],
        type: app.Sequelize.QueryTypes.UPDATE,
      }
    );

    // 保存文章标签关联
    if (data.tagIds && Array.isArray(data.tagIds)) {
      await this.ctx.service.uied.articleTag.setArticleTags(id, data.tagIds);
    }

    return true;
  }

  /**
   * 删除文章（软删除）
   */
  async del(ids) {
    const { app } = this;
    const now = Math.floor(Date.now() / 1000);
    const idList = Array.isArray(ids) ? ids : [ids];
    const placeholders = idList.map(() => '?').join(',');

    await app.model.query(
      `UPDATE uied_article SET is_delete = 1, delete_time = ? WHERE id IN (${placeholders})`,
      { replacements: [now, ...idList], type: app.Sequelize.QueryTypes.UPDATE }
    );

    return true;
  }

  /**
   * 批量更新文章状态（发布/取消发布）
   * @param {number[]} ids - 文章ID数组
   * @param {string} status - 目标状态 ('published' 或 'draft')
   * @returns {number} 更新的文章数量
   */
  async batchUpdateStatus(ids, status) {
    const { app } = this;
    const now = Math.floor(Date.now() / 1000);
    const idList = Array.isArray(ids) ? ids : [ids];

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
        { replacements: [now, now, ...idList], type: app.Sequelize.QueryTypes.UPDATE }
      );
    } else {
      // 取消发布：仅更新状态
      await app.model.query(
        `UPDATE uied_article 
         SET status = ?, update_time = ?
         WHERE id IN (${placeholders}) AND is_delete = 0`,
        { replacements: [status, now, ...idList], type: app.Sequelize.QueryTypes.UPDATE }
      );
    }

    // 查询实际更新的数量
    const [countResult] = await app.model.query(
      `SELECT COUNT(*) as count FROM uied_article 
       WHERE id IN (${placeholders}) AND is_delete = 0 AND status = ?`,
      { replacements: [...idList, status], type: app.Sequelize.QueryTypes.SELECT }
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
    const [countResult] = await app.model.query(
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
        replacements: [...replacements, parseInt(pageSize), offset], 
        type: app.Sequelize.QueryTypes.SELECT 
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
  async categories() {
    const { app } = this;
    
    const results = await app.model.query(
      `SELECT DISTINCT category FROM uied_article 
       WHERE is_delete = 0 AND status = 'published' AND category != ''
       ORDER BY category`,
      { type: app.Sequelize.QueryTypes.SELECT }
    );

    return results.map(r => r.category);
  }

  /**
   * 获取所有标签（含文章数量）
   * 仅返回未删除且至少关联一篇已发布文章的标签
   */
  async tags() {
    const { app } = this;

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
  }

  /**
   * 记录浏览
   */
  async recordView(id) {
    const { app } = this;
    
    await app.model.query(
      'UPDATE uied_article SET view_count = view_count + 1 WHERE id = ?',
      { replacements: [id], type: app.Sequelize.QueryTypes.UPDATE }
    );

    return true;
  }

  /**
   * 批量获取多篇文章的标签
   * @param {number[]} articleIds - 文章ID数组
   * @returns {Object} 以 article_id 为 key，标签数组为 value 的映射
   */
  async batchGetArticleTags(articleIds) {
    const { app } = this;

    if (!articleIds || articleIds.length === 0) {
      return {};
    }

    const placeholders = articleIds.map(() => '?').join(',');
    const tags = await app.model.query(
      `SELECT r.article_id, t.id, t.name, t.slug, t.color
       FROM uied_article_tag_relation r
       INNER JOIN uied_article_tag t ON t.id = r.tag_id
       WHERE r.article_id IN (${placeholders}) AND t.is_delete = 0
       ORDER BY t.sort_order ASC`,
      { replacements: articleIds, type: app.Sequelize.QueryTypes.SELECT }
    );

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
