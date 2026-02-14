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
   * 获取评论列表（管理后台）
   */
  async list(params = {}) {
    const { app } = this;
    const { page = 1, pageSize = 15, type = 'website', status, keyword } = params;
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

    // 查询总数
    const [ countResult ] = await app.model.query(
      `SELECT COUNT(*) as total FROM ${tableName} c WHERE ${conditions}`,
      { replacements, type: app.Sequelize.QueryTypes.SELECT }
    );

    // 查询列表（关联目标表获取标题）
    const lists = await app.model.query(
      `SELECT c.*, t.${titleField} as target_title
       FROM ${tableName} c
       LEFT JOIN ${targetTable} t ON c.${targetIdField} = t.id
       WHERE ${conditions}
       ORDER BY c.create_time DESC
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
    return {
      id: comment.id,
      targetId: comment[targetIdField],
      targetTitle: comment.target_title || '',
      userId: comment.user_id,
      nickname: comment.nickname,
      email: comment.email,
      content: comment.content,
      status: comment.status,
      ip: comment.ip,
      userAgent: comment.user_agent,
      createdAt: comment.create_time ? comment.create_time * 1000 : null,
      updatedAt: comment.update_time ? comment.update_time * 1000 : null,
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
