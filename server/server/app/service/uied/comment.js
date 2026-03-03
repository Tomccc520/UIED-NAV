/**
 * @file service/uied/comment.js
 * @description UIED 评论管理服务
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

'use strict';

const Service = require('egg').Service;

class CommentService extends Service {
  /**
   * 格式化评论时间文本（YYYY-MM-DD HH:mm:ss）
   */
  formatCommentTimeString(timestamp) {
    const seconds = Number(timestamp || 0);
    if (!Number.isFinite(seconds) || seconds <= 0) return '';
    const date = new Date(seconds * 1000);
    const pad = value => String(value).padStart(2, '0');
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hour = pad(date.getHours());
    const minute = pad(date.getMinutes());
    const second = pad(date.getSeconds());
    return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
  }

  /**
   * 检查评论表字段是否存在（用于兼容不同客户库结构）
   */
  async hasCommentColumn(tableName, columnName) {
    const { app } = this;
    const cacheKey = `${String(tableName || '')}.${String(columnName || '')}`.toLowerCase();
    if (!app.__uiedCommentColumnCache) {
      app.__uiedCommentColumnCache = new Map();
    }
    if (app.__uiedCommentColumnCache.has(cacheKey)) {
      return app.__uiedCommentColumnCache.get(cacheKey) === true;
    }
    const [ row ] = await app.model.query(
      `
      SELECT COUNT(1) AS cnt
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ?
        AND COLUMN_NAME = ?
      `,
      {
        replacements: [ String(tableName || ''), String(columnName || '') ],
        type: app.Sequelize.QueryTypes.SELECT,
      }
    );
    const exists = Number(row?.cnt || 0) > 0;
    app.__uiedCommentColumnCache.set(cacheKey, exists);
    return exists;
  }

  /**
   * 构建评论排序 SQL，热度优先时自动回退到时间排序
   */
  async buildCommentOrderClause(tableName, sort = 'latest') {
    const normalizedSort = String(sort || '').trim().toLowerCase();
    if (normalizedSort !== 'hot') {
      return 'c.create_time DESC, c.id DESC';
    }
    const hasLikeCountColumn = await this.hasCommentColumn(tableName, 'like_count');
    if (hasLikeCountColumn) {
      return 'c.like_count DESC, c.create_time DESC, c.id DESC';
    }
    return 'c.create_time DESC, c.id DESC';
  }

  /**
   * 获取评论列表（管理后台 & 前端）
   */
  async list(params = {}) {
    const { app } = this;
    const { page = 1, pageSize = 15, type = 'website', status, keyword, articleId, websiteId, sort = 'latest' } = params;
    const offset = (page - 1) * pageSize;

    const tableName = type === 'article' ? 'uied_article_comment' : 'uied_website_comment';
    const targetTable = type === 'article' ? 'uied_article' : 'uied_website';
    const targetIdField = type === 'article' ? 'article_id' : 'website_id';
    // 网站表用 name，文章表用 title
    const titleField = type === 'article' ? 'title' : 'name';

    const replacements = [];
    let conditions = 'c.is_delete = 0';

    if (status) {
      conditions += ' AND c.status = ?';
      replacements.push(status);
    }

    if (keyword) {
      conditions += ' AND (c.content LIKE ? OR c.nickname LIKE ? OR c.email LIKE ?)';
      replacements.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
    }

    // 特定文章/网站的评论
    if (type === 'article' && articleId) {
      conditions += ' AND c.article_id = ?';
      replacements.push(articleId);
    }
    if (type === 'website' && websiteId) {
      conditions += ' AND c.website_id = ?';
      replacements.push(websiteId);
    }

    // 查询总数
    const [ countResult ] = await app.model.query(
      `SELECT COUNT(*) as total FROM ${tableName} c WHERE ${conditions}`,
      { replacements, type: app.Sequelize.QueryTypes.SELECT }
    );

    const orderClause = await this.buildCommentOrderClause(tableName, sort);

    // 查询列表（关联目标表获取标题）
    const lists = await app.model.query(
      `SELECT c.*, t.${titleField} as target_title
       FROM ${tableName} c
       LEFT JOIN ${targetTable} t ON c.${targetIdField} = t.id
       WHERE ${conditions}
       ORDER BY ${orderClause}
       LIMIT ? OFFSET ?`,
      {
        replacements: [ ...replacements, parseInt(pageSize), offset ],
        type: app.Sequelize.QueryTypes.SELECT,
      }
    );

    return {
      lists: lists.map(item => this.formatComment(item, type)),
      count: countResult.total,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
    };
  }

  /**
   * 添加评论
   */
  async add(data) {
    const { app } = this;
    const now = Math.floor(Date.now() / 1000);
    const { articleId, websiteId, parentId = 0, content, userId, userName, email } = data;

    // 判断类型
    const type = articleId ? 'article' : (websiteId ? 'website' : null);
    if (!type) {
      throw new Error('未指定评论对象');
    }

    const tableName = type === 'article' ? 'uied_article_comment' : 'uied_website_comment';
    const targetIdField = type === 'article' ? 'article_id' : 'website_id';
    const targetId = articleId || websiteId;

    // 插入评论
    const insertResult = await app.model.query(
      `INSERT INTO ${tableName} 
       (${targetIdField}, parent_id, content, user_id, nickname, email, status, create_time, update_time)
       VALUES (?, ?, ?, ?, ?, ?, 'approved', ?, ?)`,
      {
        replacements: [
          targetId,
          parentId,
          content,
          userId || 0,
          userName || '匿名用户',
          email || '',
          now,
          now,
        ],
        type: app.Sequelize.QueryTypes.INSERT,
      }
    );

    const insertPayload = Array.isArray(insertResult) ? insertResult[0] : insertResult;
    const insertId = Number(
      typeof insertPayload === 'object' && insertPayload !== null
        ? (insertPayload.insertId || insertPayload.id || 0)
        : insertPayload
    ) || 0;
    const [ detail ] = await app.model.query(
      `SELECT * FROM ${tableName} WHERE id = ? LIMIT 1`,
      {
        replacements: [ insertId ],
        type: app.Sequelize.QueryTypes.SELECT,
      }
    );
    if (!detail) {
      return {
        id: insertId,
        content,
        parentId: Number(parentId || 0),
        createTime: this.formatCommentTimeString(now),
        status: 'approved',
      };
    }
    return this.formatComment(detail, type);
  }

  /**
   * 获取评论详情
   */
  async detail(id, type = 'website') {
    const { app } = this;
    const tableName = type === 'article' ? 'uied_article_comment' : 'uied_website_comment';

    const [ comment ] = await app.model.query(
      `SELECT * FROM ${tableName} WHERE id = ? AND is_delete = 0`,
      { replacements: [ id ], type: app.Sequelize.QueryTypes.SELECT }
    );

    if (!comment) return null;
    return this.formatComment(comment, type);
  }

  /**
   * 批准评论
   */
  async approve(id, type = 'website') {
    const { app } = this;
    const tableName = type === 'article' ? 'uied_article_comment' : 'uied_website_comment';
    const now = Math.floor(Date.now() / 1000);

    await app.model.query(
      `UPDATE ${tableName} SET status = 'approved', update_time = ? WHERE id = ?`,
      { replacements: [ now, id ], type: app.Sequelize.QueryTypes.UPDATE }
    );

    return true;
  }

  /**
   * 拒绝评论
   */
  async reject(id, type = 'website') {
    const { app } = this;
    const tableName = type === 'article' ? 'uied_article_comment' : 'uied_website_comment';
    const now = Math.floor(Date.now() / 1000);

    await app.model.query(
      `UPDATE ${tableName} SET status = 'rejected', update_time = ? WHERE id = ?`,
      { replacements: [ now, id ], type: app.Sequelize.QueryTypes.UPDATE }
    );

    return true;
  }

  /**
   * 删除评论（软删除）
   */
  async del(ids, type = 'website') {
    const { app } = this;
    const tableName = type === 'article' ? 'uied_article_comment' : 'uied_website_comment';
    const now = Math.floor(Date.now() / 1000);
    const idList = Array.isArray(ids) ? ids : [ ids ];
    const placeholders = idList.map(() => '?').join(',');

    await app.model.query(
      `UPDATE ${tableName} SET is_delete = 1, delete_time = ? WHERE id IN (${placeholders})`,
      { replacements: [ now, ...idList ], type: app.Sequelize.QueryTypes.UPDATE }
    );

    return true;
  }

  /**
   * 获取待审核评论数量
   */
  async pendingCount() {
    const { app } = this;

    const [ websiteCount ] = await app.model.query(
      'SELECT COUNT(*) as count FROM uied_website_comment WHERE status = \'pending\' AND is_delete = 0',
      { type: app.Sequelize.QueryTypes.SELECT }
    );

    const [ articleCount ] = await app.model.query(
      'SELECT COUNT(*) as count FROM uied_article_comment WHERE status = \'pending\' AND is_delete = 0',
      { type: app.Sequelize.QueryTypes.SELECT }
    );

    return {
      website: websiteCount.count,
      article: articleCount.count,
      total: websiteCount.count + articleCount.count,
    };
  }

  /**
   * 获取评论统计
   */
  async stats() {
    const { app } = this;

    // 网站评论统计
    const websiteStats = await app.model.query(
      'SELECT status, COUNT(*) as count FROM uied_website_comment WHERE is_delete = 0 GROUP BY status',
      { type: app.Sequelize.QueryTypes.SELECT }
    );

    // 文章评论统计
    const articleStats = await app.model.query(
      'SELECT status, COUNT(*) as count FROM uied_article_comment WHERE is_delete = 0 GROUP BY status',
      { type: app.Sequelize.QueryTypes.SELECT }
    );

    const formatStats = stats => {
      const result = { pending: 0, approved: 0, rejected: 0, total: 0 };
      stats.forEach(s => {
        result[s.status] = s.count;
        result.total += s.count;
      });
      return result;
    };

    return {
      website: formatStats(websiteStats),
      article: formatStats(articleStats),
    };
  }

  /**
   * 提交评论（前端）
   */
  async submit(data, type = 'website') {
    const { app, ctx } = this;
    const tableName = type === 'article' ? 'uied_article_comment' : 'uied_website_comment';
    const targetIdField = type === 'article' ? 'article_id' : 'website_id';
    const now = Math.floor(Date.now() / 1000);

    // 获取 IP 和 User-Agent
    const ip = ctx.ip || ctx.request.ip || '';
    const userAgent = ctx.get('user-agent') || '';

    const [ result ] = await app.model.query(
      `INSERT INTO ${tableName} 
       (${targetIdField}, user_id, nickname, email, content, status, ip, user_agent, create_time, update_time)
       VALUES (?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?)`,
      {
        replacements: [
          data.targetId,
          data.userId || null,
          data.nickname || '匿名用户',
          data.email || '',
          data.content,
          ip,
          userAgent,
          now,
          now,
        ],
        type: app.Sequelize.QueryTypes.INSERT,
      }
    );

    return result;
  }

  /**
   * 获取目标的已审核评论（前端）
   */
  async getApproved(targetId, type = 'website', params = {}) {
    const { app } = this;
    const { page = 1, pageSize = 20 } = params;
    const offset = (page - 1) * pageSize;
    const tableName = type === 'article' ? 'uied_article_comment' : 'uied_website_comment';
    const targetIdField = type === 'article' ? 'article_id' : 'website_id';

    // 查询总数
    const [ countResult ] = await app.model.query(
      `SELECT COUNT(*) as total FROM ${tableName} 
       WHERE ${targetIdField} = ? AND status = 'approved' AND is_delete = 0`,
      { replacements: [ targetId ], type: app.Sequelize.QueryTypes.SELECT }
    );

    // 查询列表
    const lists = await app.model.query(
      `SELECT id, nickname, content, create_time FROM ${tableName}
       WHERE ${targetIdField} = ? AND status = 'approved' AND is_delete = 0
       ORDER BY create_time DESC
       LIMIT ? OFFSET ?`,
      {
        replacements: [ targetId, parseInt(pageSize), offset ],
        type: app.Sequelize.QueryTypes.SELECT,
      }
    );

    return {
      lists: lists.map(item => ({
        id: item.id,
        nickname: item.nickname,
        content: item.content,
        createdAt: item.create_time ? item.create_time * 1000 : null,
      })),
      total: countResult.total,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
    };
  }

  /**
   * 格式化评论数据
   */
  formatComment(comment, type) {
    const targetIdField = type === 'article' ? 'article_id' : 'website_id';
    const createTimestamp = Number(comment.create_time || 0);
    const updateTimestamp = Number(comment.update_time || 0);
    const createTime = this.formatCommentTimeString(createTimestamp);
    const updateTime = this.formatCommentTimeString(updateTimestamp);
    return {
      id: comment.id,
      targetId: comment[targetIdField],
      targetTitle: comment.target_title || '',
      userId: comment.user_id,
      articleId: type === 'article' ? Number(comment[targetIdField] || 0) : 0,
      websiteId: type === 'website' ? Number(comment[targetIdField] || 0) : 0,
      parentId: Number(comment.parent_id || 0),
      isTop: Number(comment.is_top || 0),
      nickname: comment.nickname,
      email: comment.email,
      content: comment.content,
      status: comment.status,
      ip: comment.ip,
      userAgent: comment.user_agent,
      avatar: comment.avatar || '',
      likeCount: Number(comment.like_count || 0),
      isLike: Number(comment.is_like || 0),
      createTime,
      updateTime,
      createdAt: createTimestamp ? createTimestamp * 1000 : null,
      updatedAt: updateTimestamp ? updateTimestamp * 1000 : null,
    };
  }

  /**
   * 获取文章评论（前端）
   * @param {number|string} articleId - 文章ID
   * @param {object} params - 分页参数
   */
  async articleComments(articleId, params = {}) {
    return this.getApproved(articleId, 'article', params);
  }

  /**
   * 添加文章评论（前端）
   * @param {object} data - 评论数据
   */
  async addArticleComment(data) {
    const { app, ctx } = this;
    const now = Math.floor(Date.now() / 1000);

    // 获取 IP 和 User-Agent
    const ip = ctx.ip || ctx.request.ip || '';
    const userAgent = ctx.get('user-agent') || '';

    const [ result ] = await app.model.query(
      `INSERT INTO uied_article_comment 
       (article_id, user_id, nickname, email, content, status, ip, user_agent, create_time, update_time)
       VALUES (?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?)`,
      {
        replacements: [
          data.articleId,
          data.userId || null,
          data.userName || '匿名用户',
          data.email || '',
          data.content,
          ip,
          userAgent,
          now,
          now,
        ],
        type: app.Sequelize.QueryTypes.INSERT,
      }
    );

    return {
      id: result,
      articleId: data.articleId,
      content: data.content,
      nickname: data.userName || '匿名用户',
      status: 'pending',
      createdAt: now * 1000,
    };
  }
}

module.exports = CommentService;
