/**
 * @file service/uied/contributionIncentive.js
 * @description UIED 投稿激励服务（积分/等级/勋章/优质推荐位）
 * @author UIED技术团队
 * @copyright Tomda (https://www.tomda.top)
 * @copyright UIED技术团队 (https://fsuied.com)
 * @createDate 2026-02-21
 */

'use strict';

const Service = require('egg').Service;

const SETTING_TABLE = 'uied_contribution_setting';
const USER_CONTRIBUTION_TABLE = 'uied_user_contribution';
const CONTRIBUTION_LOG_TABLE = 'uied_user_contribution_log';
const BADGE_TABLE = 'uied_contribution_badge';
const USER_BADGE_TABLE = 'uied_user_contribution_badge';
const FEATURED_TABLE = 'uied_contribution_featured_submission';

class ContributionIncentiveService extends Service {
  /**
   * 确保投稿激励相关表存在
   */
  async ensureTables() {
    const { app } = this;
    const cacheKey = '__uiedContributionTablesReady__';
    if (app[cacheKey] === true) return;

    await app.model.query(
      `CREATE TABLE IF NOT EXISTS \`${SETTING_TABLE}\` (
        \`id\` int unsigned NOT NULL AUTO_INCREMENT,
        \`config_key\` varchar(64) NOT NULL DEFAULT '',
        \`config_value\` text,
        \`description\` varchar(255) NOT NULL DEFAULT '',
        \`is_delete\` tinyint unsigned NOT NULL DEFAULT 0,
        \`create_time\` int unsigned NOT NULL DEFAULT 0,
        \`update_time\` int unsigned NOT NULL DEFAULT 0,
        \`delete_time\` int unsigned NOT NULL DEFAULT 0,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`uk_config_key\` (\`config_key\`),
        KEY \`idx_delete\` (\`is_delete\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='投稿激励配置表'`,
      { type: app.Sequelize.QueryTypes.RAW }
    );

    await app.model.query(
      `CREATE TABLE IF NOT EXISTS \`${USER_CONTRIBUTION_TABLE}\` (
        \`id\` int unsigned NOT NULL AUTO_INCREMENT,
        \`user_id\` int unsigned NOT NULL DEFAULT 0,
        \`total_points\` int NOT NULL DEFAULT 0,
        \`submit_count\` int unsigned NOT NULL DEFAULT 0,
        \`publish_count\` int unsigned NOT NULL DEFAULT 0,
        \`featured_count\` int unsigned NOT NULL DEFAULT 0,
        \`badge_count\` int unsigned NOT NULL DEFAULT 0,
        \`level_id\` int unsigned NOT NULL DEFAULT 0,
        \`level_name\` varchar(64) NOT NULL DEFAULT '',
        \`level_value\` int unsigned NOT NULL DEFAULT 0,
        \`last_reward_time\` int unsigned NOT NULL DEFAULT 0,
        \`is_delete\` tinyint unsigned NOT NULL DEFAULT 0,
        \`create_time\` int unsigned NOT NULL DEFAULT 0,
        \`update_time\` int unsigned NOT NULL DEFAULT 0,
        \`delete_time\` int unsigned NOT NULL DEFAULT 0,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`uk_user_id\` (\`user_id\`),
        KEY \`idx_points\` (\`total_points\`),
        KEY \`idx_level\` (\`level_id\`),
        KEY \`idx_delete\` (\`is_delete\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户投稿激励汇总表'`,
      { type: app.Sequelize.QueryTypes.RAW }
    );

    await app.model.query(
      `CREATE TABLE IF NOT EXISTS \`${CONTRIBUTION_LOG_TABLE}\` (
        \`id\` int unsigned NOT NULL AUTO_INCREMENT,
        \`user_id\` int unsigned NOT NULL DEFAULT 0,
        \`article_id\` int unsigned NOT NULL DEFAULT 0,
        \`event_type\` varchar(64) NOT NULL DEFAULT '',
        \`event_key\` varchar(128) NOT NULL DEFAULT '',
        \`points_change\` int NOT NULL DEFAULT 0,
        \`balance_after\` int NOT NULL DEFAULT 0,
        \`remark\` varchar(255) NOT NULL DEFAULT '',
        \`operator_id\` int unsigned NOT NULL DEFAULT 0,
        \`is_delete\` tinyint unsigned NOT NULL DEFAULT 0,
        \`create_time\` int unsigned NOT NULL DEFAULT 0,
        \`update_time\` int unsigned NOT NULL DEFAULT 0,
        \`delete_time\` int unsigned NOT NULL DEFAULT 0,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`uk_event_key\` (\`event_key\`),
        KEY \`idx_user_time\` (\`user_id\`,\`create_time\`),
        KEY \`idx_article\` (\`article_id\`),
        KEY \`idx_type\` (\`event_type\`),
        KEY \`idx_delete\` (\`is_delete\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户投稿激励积分日志'`,
      { type: app.Sequelize.QueryTypes.RAW }
    );

    await app.model.query(
      `CREATE TABLE IF NOT EXISTS \`${BADGE_TABLE}\` (
        \`id\` int unsigned NOT NULL AUTO_INCREMENT,
        \`badge_key\` varchar(64) NOT NULL DEFAULT '',
        \`badge_name\` varchar(64) NOT NULL DEFAULT '',
        \`icon\` varchar(100) NOT NULL DEFAULT '',
        \`color\` varchar(20) NOT NULL DEFAULT '#409EFF',
        \`description\` varchar(255) NOT NULL DEFAULT '',
        \`require_points\` int unsigned NOT NULL DEFAULT 0,
        \`require_publish_count\` int unsigned NOT NULL DEFAULT 0,
        \`is_enabled\` tinyint unsigned NOT NULL DEFAULT 1,
        \`sort\` int unsigned NOT NULL DEFAULT 0,
        \`is_delete\` tinyint unsigned NOT NULL DEFAULT 0,
        \`create_time\` int unsigned NOT NULL DEFAULT 0,
        \`update_time\` int unsigned NOT NULL DEFAULT 0,
        \`delete_time\` int unsigned NOT NULL DEFAULT 0,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`uk_badge_key\` (\`badge_key\`),
        KEY \`idx_enable_sort\` (\`is_enabled\`,\`sort\`),
        KEY \`idx_delete\` (\`is_delete\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='投稿激励勋章配置表'`,
      { type: app.Sequelize.QueryTypes.RAW }
    );

    await app.model.query(
      `CREATE TABLE IF NOT EXISTS \`${USER_BADGE_TABLE}\` (
        \`id\` int unsigned NOT NULL AUTO_INCREMENT,
        \`user_id\` int unsigned NOT NULL DEFAULT 0,
        \`badge_id\` int unsigned NOT NULL DEFAULT 0,
        \`badge_key\` varchar(64) NOT NULL DEFAULT '',
        \`badge_name\` varchar(64) NOT NULL DEFAULT '',
        \`icon\` varchar(100) NOT NULL DEFAULT '',
        \`color\` varchar(20) NOT NULL DEFAULT '#409EFF',
        \`grant_source\` varchar(64) NOT NULL DEFAULT 'auto',
        \`grant_remark\` varchar(255) NOT NULL DEFAULT '',
        \`is_delete\` tinyint unsigned NOT NULL DEFAULT 0,
        \`create_time\` int unsigned NOT NULL DEFAULT 0,
        \`update_time\` int unsigned NOT NULL DEFAULT 0,
        \`delete_time\` int unsigned NOT NULL DEFAULT 0,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`uk_user_badge\` (\`user_id\`,\`badge_id\`),
        KEY \`idx_user\` (\`user_id\`),
        KEY \`idx_badge\` (\`badge_id\`),
        KEY \`idx_delete\` (\`is_delete\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户投稿勋章关系表'`,
      { type: app.Sequelize.QueryTypes.RAW }
    );

    await app.model.query(
      `CREATE TABLE IF NOT EXISTS \`${FEATURED_TABLE}\` (
        \`id\` int unsigned NOT NULL AUTO_INCREMENT,
        \`title\` varchar(200) NOT NULL DEFAULT '',
        \`article_id\` int unsigned NOT NULL DEFAULT 0,
        \`cover_image\` varchar(500) NOT NULL DEFAULT '',
        \`summary\` varchar(500) NOT NULL DEFAULT '',
        \`target_url\` varchar(500) NOT NULL DEFAULT '',
        \`sort\` int unsigned NOT NULL DEFAULT 0,
        \`is_show\` tinyint unsigned NOT NULL DEFAULT 1,
        \`start_time\` int unsigned NOT NULL DEFAULT 0,
        \`end_time\` int unsigned NOT NULL DEFAULT 0,
        \`is_delete\` tinyint unsigned NOT NULL DEFAULT 0,
        \`create_time\` int unsigned NOT NULL DEFAULT 0,
        \`update_time\` int unsigned NOT NULL DEFAULT 0,
        \`delete_time\` int unsigned NOT NULL DEFAULT 0,
        PRIMARY KEY (\`id\`),
        KEY \`idx_article\` (\`article_id\`),
        KEY \`idx_show_sort\` (\`is_show\`,\`sort\`),
        KEY \`idx_delete\` (\`is_delete\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='优质投稿推荐位表'`,
      { type: app.Sequelize.QueryTypes.RAW }
    );

    app[cacheKey] = true;
  }

  /**
   * 获取默认积分规则配置
   */
  getDefaultSettings() {
    return {
      enabled: true,
      submitPoints: 2,
      publishPoints: 10,
      featuredPoints: 20,
      dailySubmitLimit: 30,
      dailyPublishLimit: 50,
      autoGrantBadge: true,
    };
  }

  /**
   * 获取默认勋章列表
   */
  getDefaultBadges() {
    return [
      {
        badgeKey: 'new-contributor',
        badgeName: '投稿新秀',
        icon: 'Medal',
        color: '#67C23A',
        description: '首次完成投稿成长',
        requirePoints: 10,
        requirePublishCount: 1,
        sort: 10,
        isEnabled: true,
      },
      {
        badgeKey: 'pro-contributor',
        badgeName: '投稿达人',
        icon: 'Trophy',
        color: '#E6A23C',
        description: '稳定产出优质内容',
        requirePoints: 100,
        requirePublishCount: 5,
        sort: 20,
        isEnabled: true,
      },
      {
        badgeKey: 'master-contributor',
        badgeName: '投稿大师',
        icon: 'Star',
        color: '#F56C6C',
        description: '高积分高通过作者',
        requirePoints: 500,
        requirePublishCount: 20,
        sort: 30,
        isEnabled: true,
      },
    ];
  }

  /**
   * 规范化布尔值
   */
  parseBoolean(value, fallback = false) {
    if (value === undefined || value === null || value === '') return fallback;
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value === 1;
    const text = String(value).trim().toLowerCase();
    if ([ '1', 'true', 'yes', 'y', 'on' ].includes(text)) return true;
    if ([ '0', 'false', 'no', 'n', 'off' ].includes(text)) return false;
    return fallback;
  }

  /**
   * 规范化整数值
   */
  parseIntSafe(value, fallback = 0, min = -999999, max = 999999) {
    const parsed = Number.parseInt(String(value ?? ''), 10);
    if (!Number.isInteger(parsed)) return fallback;
    return Math.max(min, Math.min(max, parsed));
  }

  /**
   * 生成勋章键
   */
  buildBadgeKey(text = '') {
    const raw = String(text || '').trim().toLowerCase();
    const key = raw
      .replace(/[^\w\u4e00-\u9fa5-]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 50);
    return key || `badge-${Date.now().toString(36)}`;
  }

  /**
   * 规范化积分设置
   */
  normalizeSettings(payload = {}) {
    const source = payload && typeof payload === 'object' ? payload : {};
    const defaults = this.getDefaultSettings();
    return {
      enabled: this.parseBoolean(source.enabled, defaults.enabled),
      submitPoints: this.parseIntSafe(source.submitPoints, defaults.submitPoints, 0, 1000),
      publishPoints: this.parseIntSafe(source.publishPoints, defaults.publishPoints, 0, 2000),
      featuredPoints: this.parseIntSafe(source.featuredPoints, defaults.featuredPoints, 0, 5000),
      dailySubmitLimit: this.parseIntSafe(source.dailySubmitLimit, defaults.dailySubmitLimit, 1, 1000),
      dailyPublishLimit: this.parseIntSafe(source.dailyPublishLimit, defaults.dailyPublishLimit, 1, 1000),
      autoGrantBadge: this.parseBoolean(source.autoGrantBadge, defaults.autoGrantBadge),
      updatedAt: Math.floor(Date.now() / 1000),
    };
  }

  /**
   * 规范化勋章配置
   */
  normalizeBadge(payload = {}, index = 0) {
    const source = payload && typeof payload === 'object' ? payload : {};
    const defaults = this.getDefaultBadges()[index] || {};
    const badgeName = String(source.badgeName || source.name || defaults.badgeName || '').trim();
    const badgeKey = String(source.badgeKey || source.key || defaults.badgeKey || this.buildBadgeKey(badgeName)).trim();

    return {
      id: this.parseIntSafe(source.id, 0, 1, 99999999),
      badgeKey,
      badgeName,
      icon: String(source.icon || defaults.icon || 'Medal').trim() || 'Medal',
      color: String(source.color || defaults.color || '#409EFF').trim() || '#409EFF',
      description: String(source.description || defaults.description || '').trim(),
      requirePoints: this.parseIntSafe(source.requirePoints, defaults.requirePoints || 0, 0, 1000000),
      requirePublishCount: this.parseIntSafe(source.requirePublishCount, defaults.requirePublishCount || 0, 0, 100000),
      isEnabled: this.parseBoolean(source.isEnabled, defaults.isEnabled !== false),
      sort: this.parseIntSafe(source.sort, defaults.sort || ((index + 1) * 10), 1, 100000),
    };
  }

  /**
   * 初始化默认配置和勋章
   */
  async initDefaults() {
    const { app } = this;
    const now = Math.floor(Date.now() / 1000);
    const settings = this.normalizeSettings(this.getDefaultSettings());

    await app.model.query(
      `INSERT INTO ${SETTING_TABLE}
       (config_key, config_value, description, is_delete, create_time, update_time, delete_time)
       VALUES ('global', ?, '投稿激励全局配置', 0, ?, ?, 0)
       ON DUPLICATE KEY UPDATE
         config_value = IF(is_delete = 1, VALUES(config_value), config_value),
         description = VALUES(description),
         is_delete = 0,
         delete_time = 0,
         update_time = IF(is_delete = 1, VALUES(update_time), update_time)`,
      {
        replacements: [ JSON.stringify(settings), now, now ],
        type: app.Sequelize.QueryTypes.INSERT,
      }
    );

    const badges = this.getDefaultBadges();
    for (let index = 0; index < badges.length; index++) {
      const badge = this.normalizeBadge(badges[index], index);
      await app.model.query(
        `INSERT INTO ${BADGE_TABLE}
         (badge_key, badge_name, icon, color, description, require_points, require_publish_count,
          is_enabled, sort, is_delete, create_time, update_time, delete_time)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, 0)
         ON DUPLICATE KEY UPDATE
           badge_name = VALUES(badge_name),
           icon = VALUES(icon),
           color = VALUES(color),
           description = VALUES(description),
           require_points = VALUES(require_points),
           require_publish_count = VALUES(require_publish_count),
           is_enabled = VALUES(is_enabled),
           sort = VALUES(sort),
           is_delete = 0,
           delete_time = 0,
           update_time = VALUES(update_time)`,
        {
          replacements: [
            badge.badgeKey,
            badge.badgeName,
            badge.icon,
            badge.color,
            badge.description,
            badge.requirePoints,
            badge.requirePublishCount,
            badge.isEnabled ? 1 : 0,
            badge.sort,
            now,
            now,
          ],
          type: app.Sequelize.QueryTypes.INSERT,
        }
      );
    }
  }

  /**
   * 获取积分设置
   */
  async getSettings() {
    await this.ensureTables();
    await this.initDefaults();

    const { app } = this;
    const [ row ] = await app.model.query(
      `SELECT config_value
       FROM ${SETTING_TABLE}
       WHERE config_key = 'global' AND is_delete = 0
       LIMIT 1`,
      { type: app.Sequelize.QueryTypes.SELECT }
    );

    if (!row?.config_value) {
      return this.normalizeSettings({});
    }

    try {
      return this.normalizeSettings(JSON.parse(row.config_value));
    } catch (error) {
      return this.normalizeSettings({});
    }
  }

  /**
   * 保存积分设置
   */
  async saveSettings(payload = {}) {
    await this.ensureTables();
    const { app } = this;
    const now = Math.floor(Date.now() / 1000);
    const settings = this.normalizeSettings(payload);

    await app.model.query(
      `INSERT INTO ${SETTING_TABLE}
       (config_key, config_value, description, is_delete, create_time, update_time, delete_time)
       VALUES ('global', ?, '投稿激励全局配置', 0, ?, ?, 0)
       ON DUPLICATE KEY UPDATE
         config_value = VALUES(config_value),
         description = VALUES(description),
         is_delete = 0,
         delete_time = 0,
         update_time = VALUES(update_time)`,
      {
        replacements: [ JSON.stringify(settings), now, now ],
        type: app.Sequelize.QueryTypes.INSERT,
      }
    );

    return this.getSettings();
  }

  /**
   * 获取勋章列表
   */
  async badgeList({ includeDisabled = true } = {}) {
    await this.ensureTables();
    await this.initDefaults();

    const { app } = this;
    const enabledSql = includeDisabled ? '' : ' AND is_enabled = 1';
    const rows = await app.model.query(
      `SELECT id, badge_key, badge_name, icon, color, description, require_points, require_publish_count, is_enabled, sort
       FROM ${BADGE_TABLE}
       WHERE is_delete = 0 ${enabledSql}
       ORDER BY sort ASC, id ASC`,
      { type: app.Sequelize.QueryTypes.SELECT }
    );

    return (Array.isArray(rows) ? rows : []).map((row, index) => this.normalizeBadge({
      id: row.id,
      badgeKey: row.badge_key,
      badgeName: row.badge_name,
      icon: row.icon,
      color: row.color,
      description: row.description,
      requirePoints: row.require_points,
      requirePublishCount: row.require_publish_count,
      isEnabled: row.is_enabled === 1,
      sort: row.sort || ((index + 1) * 10),
    }, index));
  }

  /**
   * 保存勋章
   */
  async badgeSave(payload = {}) {
    await this.ensureTables();
    await this.initDefaults();
    const { app } = this;
    const now = Math.floor(Date.now() / 1000);
    const badge = this.normalizeBadge(payload);

    if (!badge.badgeName) {
      throw new Error('勋章名称不能为空');
    }
    if (!badge.badgeKey) {
      throw new Error('勋章键不能为空');
    }

    await app.model.query(
      `INSERT INTO ${BADGE_TABLE}
       (badge_key, badge_name, icon, color, description, require_points, require_publish_count,
        is_enabled, sort, is_delete, create_time, update_time, delete_time)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, 0)
       ON DUPLICATE KEY UPDATE
         badge_name = VALUES(badge_name),
         icon = VALUES(icon),
         color = VALUES(color),
         description = VALUES(description),
         require_points = VALUES(require_points),
         require_publish_count = VALUES(require_publish_count),
         is_enabled = VALUES(is_enabled),
         sort = VALUES(sort),
         is_delete = 0,
         delete_time = 0,
         update_time = VALUES(update_time)`,
      {
        replacements: [
          badge.badgeKey,
          badge.badgeName,
          badge.icon,
          badge.color,
          badge.description,
          badge.requirePoints,
          badge.requirePublishCount,
          badge.isEnabled ? 1 : 0,
          badge.sort,
          now,
          now,
        ],
        type: app.Sequelize.QueryTypes.INSERT,
      }
    );

    const list = await this.badgeList({ includeDisabled: true });
    return list.find(item => item.badgeKey === badge.badgeKey) || null;
  }

  /**
   * 删除勋章
   */
  async badgeDel(id) {
    await this.ensureTables();
    const { app } = this;
    const now = Math.floor(Date.now() / 1000);
    const badgeId = this.parseIntSafe(id, 0, 1, 99999999);
    if (!badgeId) throw new Error('勋章ID无效');

    await app.model.query(
      `UPDATE ${BADGE_TABLE}
       SET is_delete = 1, delete_time = ?, update_time = ?
       WHERE id = ? AND is_delete = 0`,
      {
        replacements: [ now, now, badgeId ],
        type: app.Sequelize.QueryTypes.UPDATE,
      }
    );

    return { id: badgeId };
  }

  /**
   * 解析等级（优先用 la_user_level）
   */
  async resolveLevel(points = 0, options = {}) {
    const { app } = this;
    const value = this.parseIntSafe(points, 0, 0, 99999999);
    const queryOptions = {
      type: app.Sequelize.QueryTypes.SELECT,
    };
    if (options.transaction) {
      queryOptions.transaction = options.transaction;
    }

    const rows = await app.model.query(
      `SELECT id, name, level_value
       FROM la_user_level
       WHERE is_delete = 0
       ORDER BY level_value ASC, id ASC`,
      queryOptions
    );

    if (Array.isArray(rows) && rows.length > 0) {
      let target = rows[0];
      rows.forEach(item => {
        if (value >= Number(item.level_value || 0)) {
          target = item;
        }
      });
      return {
        levelId: Number(target.id || 0),
        levelName: String(target.name || ''),
        levelValue: Number(target.level_value || 0),
      };
    }

    // 兜底等级规则
    if (value >= 500) return { levelId: 0, levelName: '钻石', levelValue: 500 };
    if (value >= 200) return { levelId: 0, levelName: '黄金', levelValue: 200 };
    if (value >= 50) return { levelId: 0, levelName: '白银', levelValue: 50 };
    return { levelId: 0, levelName: '新手', levelValue: 0 };
  }

  /**
   * 确保用户汇总行存在
   */
  async ensureUserContributionRow(userId, options = {}) {
    const { app } = this;
    const uid = this.parseIntSafe(userId, 0, 1, 99999999);
    if (!uid) throw new Error('用户ID无效');
    const now = Math.floor(Date.now() / 1000);

    const queryOptions = {
      type: app.Sequelize.QueryTypes.INSERT,
    };
    if (options.transaction) {
      queryOptions.transaction = options.transaction;
    }

    await app.model.query(
      `INSERT INTO ${USER_CONTRIBUTION_TABLE}
       (user_id, total_points, submit_count, publish_count, featured_count, badge_count,
        level_id, level_name, level_value, last_reward_time,
        is_delete, create_time, update_time, delete_time)
       VALUES (?, 0, 0, 0, 0, 0, 0, '', 0, 0, 0, ?, ?, 0)
       ON DUPLICATE KEY UPDATE
         is_delete = 0,
         delete_time = 0,
         update_time = VALUES(update_time)`,
      {
        ...queryOptions,
        replacements: [ uid, now, now ],
      }
    );
  }

  /**
   * 获取用户激励汇总
   */
  async getUserContribution(userId) {
    await this.ensureTables();
    const { app } = this;
    const uid = this.parseIntSafe(userId, 0, 1, 99999999);
    if (!uid) throw new Error('用户ID无效');

    await this.ensureUserContributionRow(uid);
    const [ row ] = await app.model.query(
      `SELECT id, user_id, total_points, submit_count, publish_count, featured_count,
              badge_count, level_id, level_name, level_value, last_reward_time,
              create_time, update_time
       FROM ${USER_CONTRIBUTION_TABLE}
       WHERE user_id = ? AND is_delete = 0
       LIMIT 1`,
      {
        replacements: [ uid ],
        type: app.Sequelize.QueryTypes.SELECT,
      }
    );

    return {
      id: Number(row?.id || 0),
      userId: Number(row?.user_id || uid),
      totalPoints: Number(row?.total_points || 0),
      submitCount: Number(row?.submit_count || 0),
      publishCount: Number(row?.publish_count || 0),
      featuredCount: Number(row?.featured_count || 0),
      badgeCount: Number(row?.badge_count || 0),
      levelId: Number(row?.level_id || 0),
      levelName: String(row?.level_name || ''),
      levelValue: Number(row?.level_value || 0),
      lastRewardTime: Number(row?.last_reward_time || 0),
      createTime: Number(row?.create_time || 0),
      updateTime: Number(row?.update_time || 0),
    };
  }

  /**
   * 执行积分发放（幂等）
   */
  async addPoints(payload = {}) {
    await this.ensureTables();
    await this.initDefaults();

    const { app } = this;
    const settings = await this.getSettings();
    if (!settings.enabled) {
      return { awarded: false, reason: '投稿激励已关闭' };
    }

    const userId = this.parseIntSafe(payload.userId, 0, 1, 99999999);
    if (!userId) throw new Error('用户ID无效');
    const points = this.parseIntSafe(payload.points, 0, -100000, 100000);
    if (!points) {
      return { awarded: false, reason: '积分变更值为0' };
    }

    const now = Math.floor(Date.now() / 1000);
    const articleId = this.parseIntSafe(payload.articleId, 0, 0, 99999999);
    const eventType = String(payload.eventType || 'manual').trim() || 'manual';
    const eventKey = String(payload.eventKey || `${eventType}:${userId}:${articleId}:${now}`).trim();
    const remark = String(payload.remark || '').trim().slice(0, 255);
    const operatorId = this.parseIntSafe(payload.operatorId, 0, 0, 99999999);

    const [ existing ] = await app.model.query(
      `SELECT id, balance_after
       FROM ${CONTRIBUTION_LOG_TABLE}
       WHERE event_key = ? AND is_delete = 0
       LIMIT 1`,
      {
        replacements: [ eventKey ],
        type: app.Sequelize.QueryTypes.SELECT,
      }
    );
    if (existing) {
      return {
        awarded: false,
        duplicate: true,
        balanceAfter: Number(existing.balance_after || 0),
      };
    }

    const transaction = await app.model.transaction();
    try {
      await this.ensureUserContributionRow(userId, { transaction });

      const [ current ] = await app.model.query(
        `SELECT id, total_points, submit_count, publish_count, featured_count, badge_count
         FROM ${USER_CONTRIBUTION_TABLE}
         WHERE user_id = ? AND is_delete = 0
         LIMIT 1 FOR UPDATE`,
        {
          replacements: [ userId ],
          type: app.Sequelize.QueryTypes.SELECT,
          transaction,
        }
      );

      const currentPoints = Number(current?.total_points || 0);
      const nextPoints = currentPoints + points;
      const submitCount = Number(current?.submit_count || 0) + (eventType === 'submission_created' ? 1 : 0);
      const publishCount = Number(current?.publish_count || 0) + (eventType === 'submission_published' ? 1 : 0);
      const featuredCount = Number(current?.featured_count || 0) + (eventType === 'submission_featured' ? 1 : 0);
      const badgeCount = Number(current?.badge_count || 0);
      const level = await this.resolveLevel(nextPoints, { transaction });

      await app.model.query(
        `UPDATE ${USER_CONTRIBUTION_TABLE}
         SET total_points = ?,
             submit_count = ?,
             publish_count = ?,
             featured_count = ?,
             badge_count = ?,
             level_id = ?,
             level_name = ?,
             level_value = ?,
             last_reward_time = ?,
             update_time = ?
         WHERE user_id = ? AND is_delete = 0`,
        {
          replacements: [
            nextPoints,
            submitCount,
            publishCount,
            featuredCount,
            badgeCount,
            level.levelId,
            level.levelName,
            level.levelValue,
            now,
            now,
            userId,
          ],
          type: app.Sequelize.QueryTypes.UPDATE,
          transaction,
        }
      );

      await app.model.query(
        `INSERT INTO ${CONTRIBUTION_LOG_TABLE}
         (user_id, article_id, event_type, event_key, points_change, balance_after, remark, operator_id,
          is_delete, create_time, update_time, delete_time)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, 0)`,
        {
          replacements: [
            userId,
            articleId,
            eventType,
            eventKey,
            points,
            nextPoints,
            remark,
            operatorId,
            now,
            now,
          ],
          type: app.Sequelize.QueryTypes.INSERT,
          transaction,
        }
      );

      await transaction.commit();

      if (settings.autoGrantBadge) {
        await this.tryGrantBadges(userId, `auto:${eventType}`);
      }

      return {
        awarded: true,
        userId,
        articleId,
        pointsChange: points,
        balanceAfter: nextPoints,
        levelName: level.levelName,
      };
    } catch (error) {
      await transaction.rollback();
      // 并发重复发放时，按幂等处理
      if (String(error?.message || '').includes('Duplicate entry')) {
        return { awarded: false, duplicate: true };
      }
      throw error;
    }
  }

  /**
   * 自动授予勋章
   */
  async tryGrantBadges(userId, source = 'auto') {
    await this.ensureTables();
    const { app } = this;
    const uid = this.parseIntSafe(userId, 0, 1, 99999999);
    if (!uid) return [];

    const contribution = await this.getUserContribution(uid);
    const badges = await this.badgeList({ includeDisabled: false });
    const shouldGrant = badges.filter(item => {
      const pointsOk = contribution.totalPoints >= Number(item.requirePoints || 0);
      const publishOk = contribution.publishCount >= Number(item.requirePublishCount || 0);
      return pointsOk && publishOk;
    });

    if (!shouldGrant.length) return [];

    const now = Math.floor(Date.now() / 1000);
    const granted = [];
    for (let index = 0; index < shouldGrant.length; index++) {
      const badge = shouldGrant[index];
      const [ exists ] = await app.model.query(
        `SELECT id
         FROM ${USER_BADGE_TABLE}
         WHERE user_id = ? AND badge_id = ? AND is_delete = 0
         LIMIT 1`,
        {
          replacements: [ uid, badge.id ],
          type: app.Sequelize.QueryTypes.SELECT,
        }
      );
      if (exists) continue;

      await app.model.query(
        `INSERT INTO ${USER_BADGE_TABLE}
         (user_id, badge_id, badge_key, badge_name, icon, color, grant_source, grant_remark,
          is_delete, create_time, update_time, delete_time)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, 0)
         ON DUPLICATE KEY UPDATE
           badge_key = VALUES(badge_key),
           badge_name = VALUES(badge_name),
           icon = VALUES(icon),
           color = VALUES(color),
           grant_source = VALUES(grant_source),
           grant_remark = VALUES(grant_remark),
           is_delete = 0,
           delete_time = 0,
           update_time = VALUES(update_time)`,
        {
          replacements: [
            uid,
            badge.id,
            badge.badgeKey,
            badge.badgeName,
            badge.icon,
            badge.color,
            source,
            '系统自动授予',
            now,
            now,
          ],
          type: app.Sequelize.QueryTypes.INSERT,
        }
      );

      granted.push(badge.badgeKey);
    }

    if (granted.length > 0) {
      const [ row ] = await app.model.query(
        `SELECT COUNT(*) AS total
         FROM ${USER_BADGE_TABLE}
         WHERE user_id = ? AND is_delete = 0`,
        {
          replacements: [ uid ],
          type: app.Sequelize.QueryTypes.SELECT,
        }
      );
      const count = Number(row?.total || 0);
      await app.model.query(
        `UPDATE ${USER_CONTRIBUTION_TABLE}
         SET badge_count = ?, update_time = ?
         WHERE user_id = ? AND is_delete = 0`,
        {
          replacements: [ count, now, uid ],
          type: app.Sequelize.QueryTypes.UPDATE,
        }
      );
    }

    return granted;
  }

  /**
   * 投稿创建奖励
   */
  async rewardSubmissionCreated(userId, articleId) {
    const settings = await this.getSettings();
    return this.addPoints({
      userId,
      articleId,
      eventType: 'submission_created',
      eventKey: `submission_created:${userId}:${articleId}`,
      points: settings.submitPoints,
      remark: '投稿提交奖励',
      operatorId: 0,
    });
  }

  /**
   * 投稿审核通过奖励
   */
  async rewardSubmissionPublished(userId, articleId, adminId = 0) {
    const settings = await this.getSettings();
    return this.addPoints({
      userId,
      articleId,
      eventType: 'submission_published',
      eventKey: `submission_published:${userId}:${articleId}`,
      points: settings.publishPoints,
      remark: '投稿审核通过奖励',
      operatorId: adminId,
    });
  }

  /**
   * 投稿精选推荐位奖励
   */
  async rewardSubmissionFeatured(userId, articleId, adminId = 0) {
    const settings = await this.getSettings();
    return this.addPoints({
      userId,
      articleId,
      eventType: 'submission_featured',
      eventKey: `submission_featured:${userId}:${articleId}`,
      points: settings.featuredPoints,
      remark: '优质投稿推荐位奖励',
      operatorId: adminId,
    });
  }

  /**
   * 获取用户勋章列表
   */
  async userBadges(userId) {
    await this.ensureTables();
    const { app } = this;
    const uid = this.parseIntSafe(userId, 0, 1, 99999999);
    if (!uid) return [];

    const rows = await app.model.query(
      `SELECT badge_id, badge_key, badge_name, icon, color, grant_source, grant_remark, create_time
       FROM ${USER_BADGE_TABLE}
       WHERE user_id = ? AND is_delete = 0
       ORDER BY id ASC`,
      {
        replacements: [ uid ],
        type: app.Sequelize.QueryTypes.SELECT,
      }
    );

    return (Array.isArray(rows) ? rows : []).map(item => ({
      badgeId: Number(item.badge_id || 0),
      badgeKey: String(item.badge_key || ''),
      badgeName: String(item.badge_name || ''),
      icon: String(item.icon || ''),
      color: String(item.color || '#409EFF'),
      grantSource: String(item.grant_source || ''),
      grantRemark: String(item.grant_remark || ''),
      createTime: Number(item.create_time || 0),
    }));
  }

  /**
   * 获取推荐位列表（后台）
   */
  async featuredList(params = {}) {
    await this.ensureTables();
    const { app } = this;
    const pageNo = this.parseIntSafe(params.pageNo, 1, 1, 9999);
    const pageSize = this.parseIntSafe(params.pageSize, 20, 1, 100);
    const offset = (pageNo - 1) * pageSize;

    const [ countRow ] = await app.model.query(
      `SELECT COUNT(*) AS total
       FROM ${FEATURED_TABLE}
       WHERE is_delete = 0`,
      { type: app.Sequelize.QueryTypes.SELECT }
    );

    const rows = await app.model.query(
      `SELECT id, title, article_id, cover_image, summary, target_url, sort, is_show, start_time, end_time, create_time
       FROM ${FEATURED_TABLE}
       WHERE is_delete = 0
       ORDER BY sort ASC, id DESC
       LIMIT ? OFFSET ?`,
      {
        replacements: [ pageSize, offset ],
        type: app.Sequelize.QueryTypes.SELECT,
      }
    );

    return {
      pageNo,
      pageSize,
      total: Number(countRow?.total || 0),
      lists: (Array.isArray(rows) ? rows : []).map(item => ({
        id: Number(item.id || 0),
        title: String(item.title || ''),
        articleId: Number(item.article_id || 0),
        coverImage: String(item.cover_image || ''),
        summary: String(item.summary || ''),
        targetUrl: String(item.target_url || ''),
        sort: Number(item.sort || 0),
        isShow: Number(item.is_show || 0) === 1,
        startTime: Number(item.start_time || 0),
        endTime: Number(item.end_time || 0),
        createTime: Number(item.create_time || 0),
      })),
    };
  }

  /**
   * 保存推荐位
   */
  async featuredSave(payload = {}) {
    await this.ensureTables();
    const { app } = this;
    const now = Math.floor(Date.now() / 1000);
    const id = this.parseIntSafe(payload.id, 0, 1, 99999999);
    const articleId = this.parseIntSafe(payload.articleId, 0, 0, 99999999);
    const adminId = this.parseIntSafe(payload.adminId, 0, 0, 99999999);

    let article = null;
    let ownerUserId = 0;
    if (articleId > 0) {
      [ article ] = await app.model.query(
        `SELECT id, title, intro, image
         FROM la_article
         WHERE id = ? AND is_delete = 0
         LIMIT 1`,
        {
          replacements: [ articleId ],
          type: app.Sequelize.QueryTypes.SELECT,
        }
      );
      if (!article) {
        throw new Error('文章不存在');
      }

      const [ rel ] = await app.model.query(
        `SELECT user_id
         FROM la_article_author_rel
         WHERE article_id = ? AND is_delete = 0
         ORDER BY id DESC
         LIMIT 1`,
        {
          replacements: [ articleId ],
          type: app.Sequelize.QueryTypes.SELECT,
        }
      );
      ownerUserId = Number(rel?.user_id || 0);
    }

    const title = String(payload.title || article?.title || '').trim();
    if (!title) throw new Error('推荐标题不能为空');

    const coverImage = String(payload.coverImage || article?.image || '').trim();
    const summary = String(payload.summary || article?.intro || '').trim();
    const targetUrl = String(payload.targetUrl || (articleId > 0 ? `/article/${articleId}` : '')).trim();
    const sort = this.parseIntSafe(payload.sort, 10, 0, 100000);
    const isShow = this.parseBoolean(payload.isShow, true) ? 1 : 0;
    const startTime = this.parseIntSafe(payload.startTime, 0, 0, 9999999999);
    const endTime = this.parseIntSafe(payload.endTime, 0, 0, 9999999999);

    let targetId = id;
    if (targetId > 0) {
      await app.model.query(
        `UPDATE ${FEATURED_TABLE}
         SET title = ?, article_id = ?, cover_image = ?, summary = ?, target_url = ?,
             sort = ?, is_show = ?, start_time = ?, end_time = ?, update_time = ?
         WHERE id = ? AND is_delete = 0`,
        {
          replacements: [ title, articleId, coverImage, summary, targetUrl, sort, isShow, startTime, endTime, now, targetId ],
          type: app.Sequelize.QueryTypes.UPDATE,
        }
      );
    } else {
      const [ insertRes ] = await app.model.query(
        `INSERT INTO ${FEATURED_TABLE}
         (title, article_id, cover_image, summary, target_url, sort, is_show, start_time, end_time,
          is_delete, create_time, update_time, delete_time)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, 0)`,
        {
          replacements: [ title, articleId, coverImage, summary, targetUrl, sort, isShow, startTime, endTime, now, now ],
          type: app.Sequelize.QueryTypes.INSERT,
        }
      );
      targetId = Number(insertRes || 0);
    }

    if (isShow === 1 && articleId > 0 && ownerUserId > 0) {
      await this.rewardSubmissionFeatured(ownerUserId, articleId, adminId);
    }

    return {
      id: targetId,
      title,
      articleId,
      coverImage,
      summary,
      targetUrl,
      sort,
      isShow: isShow === 1,
      startTime,
      endTime,
    };
  }

  /**
   * 删除推荐位
   */
  async featuredDel(id) {
    await this.ensureTables();
    const { app } = this;
    const now = Math.floor(Date.now() / 1000);
    const targetId = this.parseIntSafe(id, 0, 1, 99999999);
    if (!targetId) throw new Error('推荐位ID无效');

    await app.model.query(
      `UPDATE ${FEATURED_TABLE}
       SET is_delete = 1, delete_time = ?, update_time = ?
       WHERE id = ? AND is_delete = 0`,
      {
        replacements: [ now, now, targetId ],
        type: app.Sequelize.QueryTypes.UPDATE,
      }
    );

    return { id: targetId };
  }

  /**
   * 前台推荐位列表
   */
  async featuredPublicList(limit = 20) {
    await this.ensureTables();
    const { app } = this;
    const now = Math.floor(Date.now() / 1000);
    const safeLimit = this.parseIntSafe(limit, 20, 1, 100);

    const rows = await app.model.query(
      `SELECT id, title, article_id, cover_image, summary, target_url, sort
       FROM ${FEATURED_TABLE}
       WHERE is_delete = 0
         AND is_show = 1
         AND (start_time = 0 OR start_time <= ?)
         AND (end_time = 0 OR end_time >= ?)
       ORDER BY sort ASC, id DESC
       LIMIT ?`,
      {
        replacements: [ now, now, safeLimit ],
        type: app.Sequelize.QueryTypes.SELECT,
      }
    );

    return (Array.isArray(rows) ? rows : []).map(item => ({
      id: Number(item.id || 0),
      title: String(item.title || ''),
      articleId: Number(item.article_id || 0),
      coverImage: String(item.cover_image || ''),
      summary: String(item.summary || ''),
      targetUrl: String(item.target_url || ''),
      sort: Number(item.sort || 0),
    }));
  }

  /**
   * 激励用户排行榜（前台）
   */
  async leaderboard(limit = 20) {
    await this.ensureTables();
    const { app } = this;
    const safeLimit = this.parseIntSafe(limit, 20, 1, 100);

    const rows = await app.model.query(
      `SELECT c.user_id, c.total_points, c.publish_count, c.featured_count, c.badge_count, c.level_name,
              u.nickname, u.avatar
       FROM ${USER_CONTRIBUTION_TABLE} c
       INNER JOIN la_user u ON u.id = c.user_id AND u.is_delete = 0 AND u.is_disable = 0
       WHERE c.is_delete = 0
       ORDER BY c.total_points DESC, c.publish_count DESC, c.featured_count DESC, c.user_id ASC
       LIMIT ?`,
      {
        replacements: [ safeLimit ],
        type: app.Sequelize.QueryTypes.SELECT,
      }
    );

    return (Array.isArray(rows) ? rows : []).map((item, index) => ({
      rank: index + 1,
      userId: Number(item.user_id || 0),
      nickname: String(item.nickname || ''),
      avatar: String(item.avatar || ''),
      totalPoints: Number(item.total_points || 0),
      publishCount: Number(item.publish_count || 0),
      featuredCount: Number(item.featured_count || 0),
      badgeCount: Number(item.badge_count || 0),
      levelName: String(item.level_name || ''),
    }));
  }

  /**
   * 激励用户列表（后台）
   */
  async userList(params = {}) {
    await this.ensureTables();
    const { app } = this;
    const pageNo = this.parseIntSafe(params.pageNo, 1, 1, 9999);
    const pageSize = this.parseIntSafe(params.pageSize, 20, 1, 100);
    const offset = (pageNo - 1) * pageSize;
    const keyword = String(params.keyword || '').trim();
    const levelName = String(params.levelName || '').trim();
    const minPoints = Number.parseInt(String(params.minPoints ?? ''), 10);
    const maxPoints = Number.parseInt(String(params.maxPoints ?? ''), 10);

    let whereSql = 'u.is_delete = 0';
    const replacements = [];
    if (keyword) {
      whereSql += ' AND (u.nickname LIKE ? OR u.username LIKE ?)';
      replacements.push(`%${keyword}%`, `%${keyword}%`);
    }
    if (levelName) {
      whereSql += ' AND COALESCE(c.level_name, \'\') = ?';
      replacements.push(levelName);
    }
    if (Number.isInteger(minPoints)) {
      whereSql += ' AND COALESCE(c.total_points, 0) >= ?';
      replacements.push(minPoints);
    }
    if (Number.isInteger(maxPoints)) {
      whereSql += ' AND COALESCE(c.total_points, 0) <= ?';
      replacements.push(maxPoints);
    }

    const [ countRow ] = await app.model.query(
      `SELECT COUNT(*) AS total
       FROM la_user u
       WHERE ${whereSql}`,
      {
        replacements,
        type: app.Sequelize.QueryTypes.SELECT,
      }
    );

    const rows = await app.model.query(
      `SELECT u.id, u.nickname, u.username, u.avatar,
              COALESCE(c.total_points, 0) AS total_points,
              COALESCE(c.submit_count, 0) AS submit_count,
              COALESCE(c.publish_count, 0) AS publish_count,
              COALESCE(c.featured_count, 0) AS featured_count,
              COALESCE(c.badge_count, 0) AS badge_count,
              COALESCE(c.level_name, '') AS level_name,
              COALESCE(c.last_reward_time, 0) AS last_reward_time
       FROM la_user u
       LEFT JOIN ${USER_CONTRIBUTION_TABLE} c ON c.user_id = u.id AND c.is_delete = 0
       WHERE ${whereSql}
       ORDER BY COALESCE(c.total_points, 0) DESC, u.id DESC
       LIMIT ? OFFSET ?`,
      {
        replacements: [ ...replacements, pageSize, offset ],
        type: app.Sequelize.QueryTypes.SELECT,
      }
    );

    return {
      pageNo,
      pageSize,
      total: Number(countRow?.total || 0),
      lists: (Array.isArray(rows) ? rows : []).map(item => ({
        id: Number(item.id || 0),
        nickname: String(item.nickname || ''),
        username: String(item.username || ''),
        avatar: String(item.avatar || ''),
        totalPoints: Number(item.total_points || 0),
        submitCount: Number(item.submit_count || 0),
        publishCount: Number(item.publish_count || 0),
        featuredCount: Number(item.featured_count || 0),
        badgeCount: Number(item.badge_count || 0),
        levelName: String(item.level_name || ''),
        lastRewardTime: Number(item.last_reward_time || 0),
      })),
    };
  }

  /**
   * 激励用户详情（后台）
   */
  async userDetail(userId) {
    await this.ensureTables();
    const { app } = this;
    const uid = this.parseIntSafe(userId, 0, 1, 99999999);
    if (!uid) throw new Error('用户ID无效');

    const [ user ] = await app.model.query(
      `SELECT id, nickname, username, avatar
       FROM la_user
       WHERE id = ? AND is_delete = 0
       LIMIT 1`,
      {
        replacements: [ uid ],
        type: app.Sequelize.QueryTypes.SELECT,
      }
    );
    if (!user) throw new Error('用户不存在');

    const contribution = await this.getUserContribution(uid);
    const badges = await this.userBadges(uid);
    const logs = await app.model.query(
      `SELECT id, article_id, event_type, points_change, balance_after, remark, operator_id, create_time
       FROM ${CONTRIBUTION_LOG_TABLE}
       WHERE user_id = ? AND is_delete = 0
       ORDER BY id DESC
       LIMIT 50`,
      {
        replacements: [ uid ],
        type: app.Sequelize.QueryTypes.SELECT,
      }
    );

    return {
      user: {
        id: Number(user.id || 0),
        nickname: String(user.nickname || ''),
        username: String(user.username || ''),
        avatar: String(user.avatar || ''),
      },
      contribution,
      badges,
      logs: (Array.isArray(logs) ? logs : []).map(item => ({
        id: Number(item.id || 0),
        articleId: Number(item.article_id || 0),
        eventType: String(item.event_type || ''),
        pointsChange: Number(item.points_change || 0),
        balanceAfter: Number(item.balance_after || 0),
        remark: String(item.remark || ''),
        operatorId: Number(item.operator_id || 0),
        createTime: Number(item.create_time || 0),
      })),
    };
  }

  /**
   * 激励日志列表（后台）
   */
  async logList(params = {}) {
    await this.ensureTables();
    const { app } = this;
    const pageNo = this.parseIntSafe(params.pageNo, 1, 1, 9999);
    const pageSize = this.parseIntSafe(params.pageSize, 20, 1, 100);
    const offset = (pageNo - 1) * pageSize;
    const eventType = String(params.eventType || '').trim();
    const keyword = String(params.keyword || '').trim();
    const userId = Number.parseInt(String(params.userId ?? ''), 10);

    let whereSql = 'l.is_delete = 0';
    const replacements = [];
    if (eventType) {
      whereSql += ' AND l.event_type = ?';
      replacements.push(eventType);
    }
    if (Number.isInteger(userId) && userId > 0) {
      whereSql += ' AND l.user_id = ?';
      replacements.push(userId);
    }
    if (keyword) {
      whereSql += ' AND (u.nickname LIKE ? OR u.username LIKE ?)';
      replacements.push(`%${keyword}%`, `%${keyword}%`);
    }

    const [ countRow ] = await app.model.query(
      `SELECT COUNT(*) AS total
       FROM ${CONTRIBUTION_LOG_TABLE} l
       LEFT JOIN la_user u ON u.id = l.user_id
       WHERE ${whereSql}`,
      {
        replacements,
        type: app.Sequelize.QueryTypes.SELECT,
      }
    );

    const rows = await app.model.query(
      `SELECT l.id, l.user_id, l.article_id, l.event_type, l.points_change, l.balance_after,
              l.remark, l.operator_id, l.create_time,
              u.nickname, u.username
       FROM ${CONTRIBUTION_LOG_TABLE} l
       LEFT JOIN la_user u ON u.id = l.user_id
       WHERE ${whereSql}
       ORDER BY l.id DESC
       LIMIT ? OFFSET ?`,
      {
        replacements: [ ...replacements, pageSize, offset ],
        type: app.Sequelize.QueryTypes.SELECT,
      }
    );

    return {
      pageNo,
      pageSize,
      total: Number(countRow?.total || 0),
      lists: (Array.isArray(rows) ? rows : []).map(item => ({
        id: Number(item.id || 0),
        userId: Number(item.user_id || 0),
        articleId: Number(item.article_id || 0),
        eventType: String(item.event_type || ''),
        pointsChange: Number(item.points_change || 0),
        balanceAfter: Number(item.balance_after || 0),
        remark: String(item.remark || ''),
        operatorId: Number(item.operator_id || 0),
        createTime: Number(item.create_time || 0),
        nickname: String(item.nickname || ''),
        username: String(item.username || ''),
      })),
    };
  }

  /**
   * 获取字段草案
   */
  getFieldDraft() {
    return {
      settingFields: [
        { key: 'enabled', type: 'switch', label: '启用投稿激励', required: true, defaultValue: true },
        { key: 'submitPoints', type: 'number', label: '投稿提交积分', required: true, min: 0, max: 1000, defaultValue: 2 },
        { key: 'publishPoints', type: 'number', label: '审核通过积分', required: true, min: 0, max: 2000, defaultValue: 10 },
        { key: 'featuredPoints', type: 'number', label: '推荐位奖励积分', required: true, min: 0, max: 5000, defaultValue: 20 },
        { key: 'dailySubmitLimit', type: 'number', label: '每日投稿积分上限', required: true, min: 1, max: 1000, defaultValue: 30 },
        { key: 'dailyPublishLimit', type: 'number', label: '每日审核通过积分上限', required: true, min: 1, max: 1000, defaultValue: 50 },
        { key: 'autoGrantBadge', type: 'switch', label: '自动授予勋章', required: true, defaultValue: true },
      ],
      badgeFields: [
        { key: 'badgeKey', type: 'input', label: '勋章键', required: true },
        { key: 'badgeName', type: 'input', label: '勋章名称', required: true },
        { key: 'icon', type: 'input', label: '图标', required: false },
        { key: 'color', type: 'input', label: '颜色', required: false },
        { key: 'description', type: 'textarea', label: '描述', required: false },
        { key: 'requirePoints', type: 'number', label: '所需积分', required: true, min: 0, max: 1000000 },
        { key: 'requirePublishCount', type: 'number', label: '所需通过数', required: true, min: 0, max: 100000 },
        { key: 'sort', type: 'number', label: '排序', required: true, min: 1, max: 100000 },
      ],
      featuredFields: [
        { key: 'title', type: 'input', label: '推荐标题', required: true },
        { key: 'articleId', type: 'number', label: '文章ID', required: false },
        { key: 'coverImage', type: 'input', label: '封面图', required: false },
        { key: 'summary', type: 'textarea', label: '摘要', required: false },
        { key: 'targetUrl', type: 'input', label: '跳转链接', required: false },
        { key: 'isShow', type: 'switch', label: '是否显示', required: true, defaultValue: true },
        { key: 'sort', type: 'number', label: '排序', required: true, min: 0, max: 100000 },
        { key: 'startTime', type: 'number', label: '开始时间戳', required: false },
        { key: 'endTime', type: 'number', label: '结束时间戳', required: false },
      ],
    };
  }
}

module.exports = ContributionIncentiveService;
