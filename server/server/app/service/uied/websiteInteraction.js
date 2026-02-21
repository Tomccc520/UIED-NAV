/**
 * @file service/uied/websiteInteraction.js
 * @description 网站评分/收藏交互服务
 * @author UIED技术团队
 * @copyright Tomda (https://www.tomda.top)
 * @copyright UIED技术团队 (https://fsuied.com)
 * @createDate 2026-02-21
 */

'use strict';

const crypto = require('crypto');
const Service = require('egg').Service;

class WebsiteInteractionService extends Service {
  /**
   * 确保交互表存在（新环境兜底）
   */
  async ensureTables() {
    const { app } = this;
    const cacheKey = '__uiedWebsiteInteractionTablesReady__';
    if (app[cacheKey] === true) return;
    await app.model.query(
      `CREATE TABLE IF NOT EXISTS \`uied_website_rating\` (
        \`id\` int unsigned NOT NULL AUTO_INCREMENT,
        \`website_id\` int unsigned NOT NULL DEFAULT 0,
        \`actor_key\` varchar(140) NOT NULL DEFAULT '',
        \`user_id\` int unsigned NOT NULL DEFAULT 0,
        \`ip_hash\` varchar(64) NOT NULL DEFAULT '',
        \`rating\` tinyint unsigned NOT NULL DEFAULT 5,
        \`is_delete\` tinyint unsigned NOT NULL DEFAULT 0,
        \`create_time\` int unsigned NOT NULL DEFAULT 0,
        \`update_time\` int unsigned NOT NULL DEFAULT 0,
        \`delete_time\` int unsigned NOT NULL DEFAULT 0,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`uk_website_actor\` (\`website_id\`,\`actor_key\`),
        KEY \`idx_website_delete\` (\`website_id\`,\`is_delete\`),
        KEY \`idx_user_delete\` (\`user_id\`,\`is_delete\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='网站评分表'`,
      { type: app.Sequelize.QueryTypes.RAW }
    );

    await app.model.query(
      `CREATE TABLE IF NOT EXISTS \`uied_website_favorite\` (
        \`id\` int unsigned NOT NULL AUTO_INCREMENT,
        \`website_id\` int unsigned NOT NULL DEFAULT 0,
        \`actor_key\` varchar(140) NOT NULL DEFAULT '',
        \`user_id\` int unsigned NOT NULL DEFAULT 0,
        \`ip_hash\` varchar(64) NOT NULL DEFAULT '',
        \`is_delete\` tinyint unsigned NOT NULL DEFAULT 0,
        \`create_time\` int unsigned NOT NULL DEFAULT 0,
        \`update_time\` int unsigned NOT NULL DEFAULT 0,
        \`delete_time\` int unsigned NOT NULL DEFAULT 0,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`uk_website_actor\` (\`website_id\`,\`actor_key\`),
        KEY \`idx_website_delete\` (\`website_id\`,\`is_delete\`),
        KEY \`idx_user_delete\` (\`user_id\`,\`is_delete\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='网站收藏表'`,
      { type: app.Sequelize.QueryTypes.RAW }
    );
    app[cacheKey] = true;
  }

  /**
   * 对外暴露：提交评分并返回汇总数据
   */
  async rateWebsite(websiteId, rating) {
    await this.ensureTables();
    await this.ensureWebsiteExists(websiteId);
    const actor = await this.resolveActor();
    const now = Math.floor(Date.now() / 1000);
    const { app } = this;

    await app.model.query(
      `INSERT INTO uied_website_rating
       (website_id, actor_key, user_id, ip_hash, rating, is_delete, create_time, update_time, delete_time)
       VALUES (?, ?, ?, ?, ?, 0, ?, ?, 0)
       ON DUPLICATE KEY UPDATE
         user_id = VALUES(user_id),
         ip_hash = VALUES(ip_hash),
         rating = VALUES(rating),
         is_delete = 0,
         delete_time = 0,
         update_time = VALUES(update_time)`,
      {
        replacements: [
          websiteId,
          actor.actorKey,
          actor.userId,
          actor.ipHash,
          rating,
          now,
          now,
        ],
        type: app.Sequelize.QueryTypes.INSERT,
      }
    );

    const summary = await this.getRatingSummary(websiteId, actor.actorKey);
    return {
      ...summary,
      actorType: actor.userId > 0 ? 'user' : 'anonymous',
    };
  }

  /**
   * 对外暴露：添加收藏并返回汇总数据
   */
  async addFavorite(websiteId) {
    await this.ensureTables();
    await this.ensureWebsiteExists(websiteId);
    const actor = await this.resolveActor();
    const now = Math.floor(Date.now() / 1000);
    const { app } = this;

    await app.model.query(
      `INSERT INTO uied_website_favorite
       (website_id, actor_key, user_id, ip_hash, is_delete, create_time, update_time, delete_time)
       VALUES (?, ?, ?, ?, 0, ?, ?, 0)
       ON DUPLICATE KEY UPDATE
         user_id = VALUES(user_id),
         ip_hash = VALUES(ip_hash),
         is_delete = 0,
         delete_time = 0,
         update_time = VALUES(update_time)`,
      {
        replacements: [
          websiteId,
          actor.actorKey,
          actor.userId,
          actor.ipHash,
          now,
          now,
        ],
        type: app.Sequelize.QueryTypes.INSERT,
      }
    );

    const summary = await this.getFavoriteSummary(websiteId, actor.actorKey);
    return {
      ...summary,
      actorType: actor.userId > 0 ? 'user' : 'anonymous',
    };
  }

  /**
   * 对外暴露：取消收藏并返回汇总数据
   */
  async removeFavorite(websiteId) {
    await this.ensureTables();
    await this.ensureWebsiteExists(websiteId);
    const actor = await this.resolveActor();
    const now = Math.floor(Date.now() / 1000);
    const { app } = this;

    await app.model.query(
      `UPDATE uied_website_favorite
       SET is_delete = 1, delete_time = ?, update_time = ?
       WHERE website_id = ? AND actor_key = ? AND is_delete = 0`,
      {
        replacements: [ now, now, websiteId, actor.actorKey ],
        type: app.Sequelize.QueryTypes.UPDATE,
      }
    );

    const summary = await this.getFavoriteSummary(websiteId, actor.actorKey);
    return {
      ...summary,
      actorType: actor.userId > 0 ? 'user' : 'anonymous',
    };
  }

  /**
   * 校验网站是否存在
   */
  async ensureWebsiteExists(websiteId) {
    const { app } = this;
    const [ row ] = await app.model.query(
      'SELECT id FROM uied_website WHERE id = ? AND is_delete = 0 LIMIT 1',
      {
        replacements: [ websiteId ],
        type: app.Sequelize.QueryTypes.SELECT,
      }
    );
    if (!row) {
      throw new Error('网站不存在');
    }
  }

  /**
   * 读取评分统计与当前操作者评分
   */
  async getRatingSummary(websiteId, actorKey = '') {
    const { app } = this;
    const [ aggregate ] = await app.model.query(
      `SELECT
         ROUND(AVG(rating), 2) AS averageRating,
         COUNT(1) AS totalRatings
       FROM uied_website_rating
       WHERE website_id = ? AND is_delete = 0`,
      {
        replacements: [ websiteId ],
        type: app.Sequelize.QueryTypes.SELECT,
      }
    );

    let userRating = 0;
    if (actorKey) {
      const [ self ] = await app.model.query(
        `SELECT rating
         FROM uied_website_rating
         WHERE website_id = ? AND actor_key = ? AND is_delete = 0
         LIMIT 1`,
        {
          replacements: [ websiteId, actorKey ],
          type: app.Sequelize.QueryTypes.SELECT,
        }
      );
      userRating = Number(self?.rating || 0);
    }

    return {
      userRating,
      averageRating: Number(aggregate?.averageRating || 0),
      totalRatings: Number(aggregate?.totalRatings || 0),
    };
  }

  /**
   * 读取收藏统计与当前操作者收藏状态
   */
  async getFavoriteSummary(websiteId, actorKey = '') {
    const { app } = this;
    const [ aggregate ] = await app.model.query(
      `SELECT COUNT(1) AS totalFavorites
       FROM uied_website_favorite
       WHERE website_id = ? AND is_delete = 0`,
      {
        replacements: [ websiteId ],
        type: app.Sequelize.QueryTypes.SELECT,
      }
    );

    let favorited = false;
    if (actorKey) {
      const [ self ] = await app.model.query(
        `SELECT id
         FROM uied_website_favorite
         WHERE website_id = ? AND actor_key = ? AND is_delete = 0
         LIMIT 1`,
        {
          replacements: [ websiteId, actorKey ],
          type: app.Sequelize.QueryTypes.SELECT,
        }
      );
      favorited = Boolean(self?.id);
    }

    return {
      favorited,
      totalFavorites: Number(aggregate?.totalFavorites || 0),
    };
  }

  /**
   * 解析当前请求操作者（支持登录用户与匿名访客）
   */
  async resolveActor() {
    const userId = await this.resolveUserId();
    const ip = this.getClientIp();
    const ipHash = this.hashIp(ip);
    return {
      userId,
      ip,
      ipHash,
      actorKey: userId > 0 ? `u:${userId}` : `ip:${ipHash}`,
    };
  }

  /**
   * 解析当前用户 ID（优先请求显式 userId，其次 user token）
   */
  async resolveUserId() {
    const { ctx } = this;
    const bodyUserId = Number.parseInt(String(ctx.request.body?.userId || ''), 10);
    if (Number.isInteger(bodyUserId) && bodyUserId > 0) return bodyUserId;

    const queryUserId = Number.parseInt(String(ctx.query?.userId || ''), 10);
    if (Number.isInteger(queryUserId) && queryUserId > 0) return queryUserId;

    const token = String(ctx.request.header.token || '').trim();
    if (!token) return 0;

    const appConfig = ctx.app.config || {};
    const userTokenKey = String(appConfig.userTokenKey || 'user:token:').trim() || 'user:token:';
    let userIdRaw = '';
    try {
      userIdRaw = await ctx.service.redis.get(userTokenKey + token);
    } catch (error) {
      ctx.logger.warn('[websiteInteraction] 读取用户 token 失败，降级匿名:', error.message);
      return 0;
    }
    const tokenUserId = Number.parseInt(String(userIdRaw || ''), 10);
    if (!Number.isInteger(tokenUserId) || tokenUserId <= 0) return 0;
    return tokenUserId;
  }

  /**
   * 获取客户端 IP（优先代理头）
   */
  getClientIp() {
    const { ctx } = this;
    const xff = String(ctx.request.header['x-forwarded-for'] || '').trim();
    if (xff) {
      const firstIp = xff.split(',').map(item => item.trim()).find(Boolean);
      if (firstIp) return firstIp;
    }
    const realIp = String(ctx.request.header['x-real-ip'] || '').trim();
    if (realIp) return realIp;
    return String(ctx.ip || ctx.request.ip || '0.0.0.0').trim() || '0.0.0.0';
  }

  /**
   * 计算 IP 哈希（避免保存明文 IP）
   */
  hashIp(ip = '') {
    const { app } = this;
    const salt = String(app?.config?.keys || 'uied-ip-salt');
    return crypto.createHash('sha256').update(`${ip}|${salt}`).digest('hex');
  }
}

module.exports = WebsiteInteractionService;
