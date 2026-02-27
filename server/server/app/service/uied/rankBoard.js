/**
 * @file service/uied/rankBoard.js
 * @description UIED 榜单系统服务
 * @author UIED技术团队
 * @copyright Tomda (https://www.tomda.top)
 * @copyright UIED技术团队 (https://fsuied.com)
 * @createDate 2026-02-21
 */

'use strict';

const Service = require('egg').Service;

const RANK_BOARD_CONFIG_TABLE = 'uied_rank_board_config';
const RANK_BOARD_PUBLIC_CONFIG_KEY = 'rank_board_public_config';

class RankBoardService extends Service {
  /**
   * 获取榜单系统前台显示位置选项
   */
  getDisplayPlacementOptions() {
    return [
      { value: 'home_menu', label: '首页菜单入口' },
      { value: 'footer_link', label: '页脚链接' },
      { value: 'nav_quick_entry', label: '导航快捷入口' },
      { value: 'fixed_link', label: '固定悬浮入口' },
      { value: 'home_block', label: '首页榜单区块' },
      { value: 'rankings_page', label: '榜单页' },
    ];
  }

  /**
   * 获取榜单系统前台入口默认配置
   */
  getDefaultPublicConfig() {
    return {
      enabled: true,
      displayPlacements: [ 'nav_quick_entry', 'home_block' ],
      displayLabel: '榜单系统',
      displayPath: '/p/rankings',
      displaySort: 88,
      displayDesktop: true,
      displayMobile: true,
      displayOpenInNewTab: false,
      defaultMetric: 'visit',
      defaultPeriod: 'day',
      maxVisibleBoards: 12,
    };
  }

  /**
   * 确保榜单配置表存在
   */
  async ensureTables() {
    const { app } = this;
    const cacheKey = '__uiedRankBoardTablesReady__';
    if (app[cacheKey] === true) return;

    await app.model.query(
      `CREATE TABLE IF NOT EXISTS \`${RANK_BOARD_CONFIG_TABLE}\` (
        \`id\` int unsigned NOT NULL AUTO_INCREMENT,
        \`board_key\` varchar(64) NOT NULL DEFAULT '',
        \`board_name\` varchar(128) NOT NULL DEFAULT '',
        \`description\` varchar(255) NOT NULL DEFAULT '',
        \`algorithm\` varchar(64) NOT NULL DEFAULT '',
        \`limit_count\` tinyint unsigned NOT NULL DEFAULT 20,
        \`sort\` int unsigned NOT NULL DEFAULT 0,
        \`is_enabled\` tinyint unsigned NOT NULL DEFAULT 1,
        \`extra_json\` text,
        \`is_delete\` tinyint unsigned NOT NULL DEFAULT 0,
        \`create_time\` int unsigned NOT NULL DEFAULT 0,
        \`update_time\` int unsigned NOT NULL DEFAULT 0,
        \`delete_time\` int unsigned NOT NULL DEFAULT 0,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`uk_board_key\` (\`board_key\`),
        KEY \`idx_enabled_sort\` (\`is_enabled\`,\`sort\`),
        KEY \`idx_delete\` (\`is_delete\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='榜单系统配置表'`,
      { type: app.Sequelize.QueryTypes.RAW }
    );

    app[cacheKey] = true;
  }

  /**
   * 获取默认榜单配置
   */
  getDefaultBoards() {
    return [
      {
        boardKey: 'daily_visits',
        boardName: '日访问热榜',
        description: '按站点累计点击热度排序（未启用访问日志时使用累计点击）',
        algorithm: 'daily_click_desc',
        limitCount: 20,
        sort: 10,
        isEnabled: true,
        extra: { metric: 'visit', period: 'day', boardGroup: 'metric', displayPlacements: [ 'rankings_page' ] },
      },
      {
        boardKey: 'weekly_visits',
        boardName: '周访问热榜',
        description: '按站点累计点击热度排序（未启用访问日志时使用累计点击）',
        algorithm: 'weekly_click_desc',
        limitCount: 20,
        sort: 20,
        isEnabled: true,
        extra: { metric: 'visit', period: 'week', boardGroup: 'metric', displayPlacements: [ 'rankings_page' ] },
      },
      {
        boardKey: 'monthly_visits',
        boardName: '月访问热榜',
        description: '按站点累计点击热度排序（未启用访问日志时使用累计点击）',
        algorithm: 'monthly_click_desc',
        limitCount: 20,
        sort: 30,
        isEnabled: true,
        extra: { metric: 'visit', period: 'month', boardGroup: 'metric', displayPlacements: [ 'rankings_page' ] },
      },
      {
        boardKey: 'daily_favorites',
        boardName: '日收藏热榜',
        description: '按近1天收藏数排序',
        algorithm: 'daily_favorite_desc',
        limitCount: 20,
        sort: 40,
        isEnabled: true,
        extra: { metric: 'favorite', period: 'day', boardGroup: 'metric', displayPlacements: [ 'rankings_page' ] },
      },
      {
        boardKey: 'weekly_favorites',
        boardName: '周收藏热榜',
        description: '按近7天收藏数排序',
        algorithm: 'weekly_favorite_desc',
        limitCount: 20,
        sort: 50,
        isEnabled: true,
        extra: { metric: 'favorite', period: 'week', boardGroup: 'metric', displayPlacements: [ 'rankings_page' ] },
      },
      {
        boardKey: 'monthly_favorites',
        boardName: '月收藏热榜',
        description: '按近30天收藏数排序',
        algorithm: 'monthly_favorite_desc',
        limitCount: 20,
        sort: 60,
        isEnabled: true,
        extra: { metric: 'favorite', period: 'month', boardGroup: 'metric', displayPlacements: [ 'rankings_page' ] },
      },
      {
        boardKey: 'daily_likes',
        boardName: '日点赞热榜',
        description: '按近1天点赞数排序',
        algorithm: 'daily_like_desc',
        limitCount: 20,
        sort: 70,
        isEnabled: true,
        extra: { metric: 'like', period: 'day', boardGroup: 'metric', displayPlacements: [ 'rankings_page' ] },
      },
      {
        boardKey: 'weekly_likes',
        boardName: '周点赞热榜',
        description: '按近7天点赞数排序',
        algorithm: 'weekly_like_desc',
        limitCount: 20,
        sort: 80,
        isEnabled: true,
        extra: { metric: 'like', period: 'week', boardGroup: 'metric', displayPlacements: [ 'rankings_page' ] },
      },
      {
        boardKey: 'monthly_likes',
        boardName: '月点赞热榜',
        description: '按近30天点赞数排序',
        algorithm: 'monthly_like_desc',
        limitCount: 20,
        sort: 90,
        isEnabled: true,
        extra: { metric: 'like', period: 'month', boardGroup: 'metric', displayPlacements: [ 'rankings_page' ] },
      },
      {
        boardKey: 'today_hot',
        boardName: '今日热门',
        description: '按站点总点击热度排序',
        algorithm: 'click_count_desc',
        limitCount: 20,
        sort: 110,
        isEnabled: true,
        extra: { metric: 'visit', period: 'all', boardGroup: 'operations', displayPlacements: [ 'rankings_page' ] },
      },
      {
        boardKey: 'seven_day_rising',
        boardName: '7日飙升',
        description: '按近7日上升指数排序',
        algorithm: 'rise_index_7d',
        limitCount: 20,
        sort: 120,
        isEnabled: true,
        extra: { metric: 'visit', period: 'week', boardGroup: 'operations', displayPlacements: [ 'rankings_page' ] },
      },
      {
        boardKey: 'new_sites',
        boardName: '新站榜',
        description: '按最新收录时间排序',
        algorithm: 'create_time_desc',
        limitCount: 20,
        sort: 130,
        isEnabled: true,
        extra: { metric: 'curated', period: 'all', boardGroup: 'operations', displayPlacements: [ 'rankings_page' ] },
      },
      {
        boardKey: 'editor_pick',
        boardName: '编辑精选',
        description: '由运营后台维护的精选列表',
        algorithm: 'editor_pick',
        limitCount: 20,
        sort: 140,
        isEnabled: true,
        extra: { metric: 'curated', period: 'all', boardGroup: 'operations', displayPlacements: [ 'rankings_page', 'home_block' ] },
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
   * 规范化正整数
   */
  parsePositiveInt(value, fallback = 0, min = 1, max = 100000) {
    const parsed = Number.parseInt(String(value || ''), 10);
    if (!Number.isInteger(parsed) || parsed <= 0) return fallback;
    return Math.max(min, Math.min(max, parsed));
  }

  /**
   * 规范化字符串数组
   */
  toStringList(value) {
    if (Array.isArray(value)) {
      return value.map(item => String(item || '').trim()).filter(Boolean);
    }
    const text = String(value || '').trim();
    if (!text) return [];
    return text
      .split(/[，,\n|]+/)
      .map(item => item.trim())
      .filter(Boolean);
  }

  /**
   * 规范化前台显示位置
   */
  normalizeDisplayPlacements(value) {
    const allowSet = new Set(this.getDisplayPlacementOptions().map(item => item.value));
    return Array.from(new Set(this.toStringList(value).filter(item => allowSet.has(item))));
  }

  /**
   * 读取榜单系统前台入口配置
   */
  async getPublicConfig() {
    const raw = await this.ctx.service.uied.setting.get(RANK_BOARD_PUBLIC_CONFIG_KEY);
    return this.normalizePublicConfig(raw || {});
  }

  /**
   * 保存榜单系统前台入口配置
   */
  async savePublicConfig(payload = {}) {
    const normalized = this.normalizePublicConfig(payload);
    await this.ctx.service.uied.setting.save({ [RANK_BOARD_PUBLIC_CONFIG_KEY]: normalized });
    return this.getPublicConfig();
  }

  /**
   * 规范化榜单系统前台入口配置
   */
  normalizePublicConfig(payload = {}) {
    const source = payload && typeof payload === 'object' ? payload : {};
    const defaults = this.getDefaultPublicConfig();
    const displayPlacements = this.normalizeDisplayPlacements(source.displayPlacements);
    const displayPath = String(source.displayPath || defaults.displayPath).trim() || defaults.displayPath;
    const defaultMetric = String(source.defaultMetric || defaults.defaultMetric).trim().toLowerCase();
    const defaultPeriod = String(source.defaultPeriod || defaults.defaultPeriod).trim().toLowerCase();

    return {
      enabled: this.parseBoolean(source.enabled, defaults.enabled),
      displayPlacements: displayPlacements.length > 0 ? displayPlacements : defaults.displayPlacements,
      displayLabel: String(source.displayLabel || defaults.displayLabel).trim() || defaults.displayLabel,
      displayPath: displayPath.startsWith('/') ? displayPath : `/${displayPath}`,
      displaySort: this.parsePositiveInt(source.displaySort, defaults.displaySort, 1, 9999),
      displayDesktop: this.parseBoolean(source.displayDesktop, defaults.displayDesktop),
      displayMobile: this.parseBoolean(source.displayMobile, defaults.displayMobile),
      displayOpenInNewTab: this.parseBoolean(source.displayOpenInNewTab, defaults.displayOpenInNewTab),
      defaultMetric: [ 'visit', 'favorite', 'like' ].includes(defaultMetric) ? defaultMetric : defaults.defaultMetric,
      defaultPeriod: [ 'day', 'week', 'month' ].includes(defaultPeriod) ? defaultPeriod : defaults.defaultPeriod,
      maxVisibleBoards: this.parsePositiveInt(source.maxVisibleBoards, defaults.maxVisibleBoards, 1, 30),
      updatedAt: Math.floor(Date.now() / 1000),
    };
  }

  /**
   * 规范化单条榜单配置
   */
  normalizeBoardConfig(payload = {}, index = 0) {
    const source = payload && typeof payload === 'object' ? payload : {};
    const defaults = this.getDefaultBoards()[index] || {};
    const boardKey = String(source.boardKey || source.key || defaults.boardKey || '').trim();
    const boardName = String(source.boardName || source.name || defaults.boardName || boardKey).trim() || boardKey;
    const description = String(source.description || defaults.description || '').trim();
    const algorithm = String(source.algorithm || defaults.algorithm || '').trim();
    const mergedExtra = {
      ...(defaults.extra && typeof defaults.extra === 'object' ? defaults.extra : {}),
      ...(source.extra && typeof source.extra === 'object' ? source.extra : {}),
    };
    mergedExtra.metric = String(mergedExtra.metric || '').trim().toLowerCase();
    mergedExtra.period = String(mergedExtra.period || '').trim().toLowerCase();
    mergedExtra.boardGroup = String(mergedExtra.boardGroup || '').trim() || 'operations';
    mergedExtra.displayPlacements = this.normalizeDisplayPlacements(mergedExtra.displayPlacements || [ 'rankings_page' ]);
    mergedExtra.showOnRankingsPage = this.parseBoolean(mergedExtra.showOnRankingsPage, true);

    return {
      id: this.parsePositiveInt(source.id, 0, 1, 99999999),
      boardKey,
      boardName,
      description,
      algorithm,
      limitCount: this.parsePositiveInt(source.limitCount, defaults.limitCount || 20, 1, 100),
      sort: this.parsePositiveInt(source.sort, defaults.sort || ((index + 1) * 10), 1, 100000),
      isEnabled: this.parseBoolean(source.isEnabled, defaults.isEnabled !== false),
      extra: mergedExtra,
    };
  }

  /**
   * 初始化默认榜单配置
   */
  async initDefaultBoards() {
    const { app } = this;
    const now = Math.floor(Date.now() / 1000);
    const defaults = this.getDefaultBoards();
    for (let index = 0; index < defaults.length; index++) {
      const row = this.normalizeBoardConfig(defaults[index], index);
      await app.model.query(
        `INSERT INTO ${RANK_BOARD_CONFIG_TABLE}
         (board_key, board_name, description, algorithm, limit_count, sort, is_enabled, extra_json,
          is_delete, create_time, update_time, delete_time)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, 0)
         ON DUPLICATE KEY UPDATE
           board_name = VALUES(board_name),
           description = VALUES(description),
           algorithm = VALUES(algorithm),
           limit_count = VALUES(limit_count),
           sort = VALUES(sort),
           is_enabled = VALUES(is_enabled),
           extra_json = VALUES(extra_json),
           is_delete = 0,
           delete_time = 0,
           update_time = VALUES(update_time)`,
        {
          replacements: [
            row.boardKey,
            row.boardName,
            row.description,
            row.algorithm,
            row.limitCount,
            row.sort,
            row.isEnabled ? 1 : 0,
            JSON.stringify(row.extra || {}),
            now,
            now,
          ],
          type: app.Sequelize.QueryTypes.INSERT,
        }
      );
    }
  }

  /**
   * 获取榜单配置列表
   */
  async getConfigList({ includeDisabled = true } = {}) {
    await this.ensureTables();
    await this.initDefaultBoards();
    const { app } = this;
    const whereEnabled = includeDisabled ? '' : ' AND is_enabled = 1';
    const rows = await app.model.query(
      `SELECT id, board_key, board_name, description, algorithm, limit_count, sort, is_enabled, extra_json
       FROM ${RANK_BOARD_CONFIG_TABLE}
       WHERE is_delete = 0 ${whereEnabled}
       ORDER BY sort ASC, id ASC`,
      { type: app.Sequelize.QueryTypes.SELECT }
    );

    return (Array.isArray(rows) ? rows : []).map((row, index) => {
      let extra = {};
      try {
        extra = row.extra_json ? JSON.parse(row.extra_json) : {};
      } catch (error) {
        extra = {};
      }
      return this.normalizeBoardConfig({
        id: row.id,
        boardKey: row.board_key,
        boardName: row.board_name,
        description: row.description,
        algorithm: row.algorithm,
        limitCount: row.limit_count,
        sort: row.sort || (index + 1) * 10,
        isEnabled: row.is_enabled === 1,
        extra,
      }, index);
    });
  }

  /**
   * 保存榜单配置列表
   */
  async saveConfigList(list = []) {
    await this.ensureTables();
    await this.initDefaultBoards();
    const { app } = this;
    const now = Math.floor(Date.now() / 1000);
    const rows = Array.isArray(list) ? list : [];

    for (let index = 0; index < rows.length; index++) {
      const row = this.normalizeBoardConfig(rows[index], index);
      if (!row.boardKey) continue;
      await app.model.query(
        `INSERT INTO ${RANK_BOARD_CONFIG_TABLE}
         (board_key, board_name, description, algorithm, limit_count, sort, is_enabled, extra_json,
          is_delete, create_time, update_time, delete_time)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, 0)
         ON DUPLICATE KEY UPDATE
           board_name = VALUES(board_name),
           description = VALUES(description),
           algorithm = VALUES(algorithm),
           limit_count = VALUES(limit_count),
           sort = VALUES(sort),
           is_enabled = VALUES(is_enabled),
           extra_json = VALUES(extra_json),
           is_delete = 0,
           delete_time = 0,
           update_time = VALUES(update_time)`,
        {
          replacements: [
            row.boardKey,
            row.boardName,
            row.description,
            row.algorithm,
            row.limitCount,
            row.sort,
            row.isEnabled ? 1 : 0,
            JSON.stringify(row.extra || {}),
            now,
            now,
          ],
          type: app.Sequelize.QueryTypes.INSERT,
        }
      );
    }

    return this.getConfigList({ includeDisabled: true });
  }

  /**
   * 统一网站卡片字段
   */
  buildWebsiteCard(row = {}) {
    return {
      id: Number(row.id || 0),
      websiteId: Number(row.websiteId || row.id || 0),
      name: String(row.name || row.title || ''),
      title: String(row.title || row.name || ''),
      slug: String(row.slug || ''),
      url: String(row.url || ''),
      iconUrl: String(row.iconUrl || ''),
      description: String(row.description || ''),
      category: String(row.category || ''),
      clickCount: Number(row.clickCount || 0),
      createTime: Number(row.createTime || 0),
      score: Number(row.score || 0),
    };
  }

  /**
   * 查询“今日热门”
   */
  async queryTodayHot(limit = 20) {
    const { app } = this;
    const rows = await app.model.query(
      `SELECT w.id, w.name, w.slug, w.url, w.icon_url AS iconUrl, w.description, w.click_count AS clickCount,
              w.create_time AS createTime, c.name AS category
       FROM uied_website w
       LEFT JOIN uied_category c ON c.id = w.category_id
       WHERE w.is_delete = 0
       ORDER BY w.is_pinned DESC, w.click_count DESC, w.is_hot DESC, w.is_featured DESC, w.update_time DESC, w.id DESC
       LIMIT ?`,
      {
        replacements: [ this.parsePositiveInt(limit, 20, 1, 100) ],
        type: app.Sequelize.QueryTypes.SELECT,
      }
    );
    return (Array.isArray(rows) ? rows : []).map(row => this.buildWebsiteCard({
      ...row,
      score: Number(row.clickCount || 0),
    }));
  }

  /**
   * 查询“7日飙升”
   */
  async querySevenDayRising(limit = 20) {
    const { app } = this;
    const rows = await app.model.query(
      `SELECT w.id, w.name, w.slug, w.url, w.icon_url AS iconUrl, w.description, w.click_count AS clickCount,
              w.create_time AS createTime, c.name AS category,
              ROUND(
                (w.click_count / GREATEST(1, LEAST(7, FLOOR((UNIX_TIMESTAMP() - w.create_time) / 86400) + 1)))
                + IF(w.is_new = 1, 50, 0)
              , 2) AS score
       FROM uied_website w
       LEFT JOIN uied_category c ON c.id = w.category_id
       WHERE w.is_delete = 0
       ORDER BY score DESC, w.click_count DESC, w.update_time DESC, w.id DESC
       LIMIT ?`,
      {
        replacements: [ this.parsePositiveInt(limit, 20, 1, 100) ],
        type: app.Sequelize.QueryTypes.SELECT,
      }
    );
    return (Array.isArray(rows) ? rows : []).map(row => this.buildWebsiteCard(row));
  }

  /**
   * 查询“新站榜”
   */
  async queryNewSites(limit = 20) {
    const { app } = this;
    const rows = await app.model.query(
      `SELECT w.id, w.name, w.slug, w.url, w.icon_url AS iconUrl, w.description, w.click_count AS clickCount,
              w.create_time AS createTime, c.name AS category
       FROM uied_website w
       LEFT JOIN uied_category c ON c.id = w.category_id
       WHERE w.is_delete = 0
       ORDER BY w.create_time DESC, w.id DESC
       LIMIT ?`,
      {
        replacements: [ this.parsePositiveInt(limit, 20, 1, 100) ],
        type: app.Sequelize.QueryTypes.SELECT,
      }
    );
    return (Array.isArray(rows) ? rows : []).map(row => this.buildWebsiteCard({
      ...row,
      score: Number(row.createTime || 0),
    }));
  }

  /**
   * 查询“编辑精选”
   */
  async queryEditorPick(limit = 20) {
    const { app } = this;
    const safeLimit = this.parsePositiveInt(limit, 20, 1, 100);
    let rows = await app.model.query(
      `SELECT hr.id, hr.name, hr.url, hr.icon_url AS iconUrl, hr.description, hr.click_count AS clickCount,
              hr.create_time AS createTime, hr.sort AS score,
              w.id AS websiteId, w.slug
       FROM uied_hot_recommendation hr
       LEFT JOIN uied_website w ON w.url = hr.url AND w.is_delete = 0
       WHERE hr.is_delete = 0 AND hr.is_show = 1 AND hr.position = 'editor_pick'
       ORDER BY hr.sort ASC, hr.id DESC
       LIMIT ?`,
      {
        replacements: [ safeLimit ],
        type: app.Sequelize.QueryTypes.SELECT,
      }
    );

    // 兼容历史数据：若没有 editor_pick，降级读取 hot
    if (!Array.isArray(rows) || rows.length === 0) {
      rows = await app.model.query(
        `SELECT hr.id, hr.name, hr.url, hr.icon_url AS iconUrl, hr.description, hr.click_count AS clickCount,
                hr.create_time AS createTime, hr.sort AS score,
                w.id AS websiteId, w.slug
         FROM uied_hot_recommendation hr
         LEFT JOIN uied_website w ON w.url = hr.url AND w.is_delete = 0
         WHERE hr.is_delete = 0 AND hr.is_show = 1 AND hr.position = 'hot'
         ORDER BY hr.sort ASC, hr.id DESC
         LIMIT ?`,
        {
          replacements: [ safeLimit ],
          type: app.Sequelize.QueryTypes.SELECT,
        }
      );
    }

    return (Array.isArray(rows) ? rows : []).map(row => this.buildWebsiteCard({
      ...row,
      id: Number(row.websiteId || row.id || 0),
      websiteId: Number(row.websiteId || 0),
    }));
  }

  /**
   * 查询“本周高赞”（近7天点赞数）
   */
  async queryWeeklyLikes(limit = 20) {
    return this.queryInteractionBoardByPeriod({ type: 'like', periodDays: 7, limit });
  }

  /**
   * 查询“日点赞热榜”
   */
  async queryDailyLikes(limit = 20) {
    return this.queryInteractionBoardByPeriod({ type: 'like', periodDays: 1, limit });
  }

  /**
   * 查询“月点赞热榜”
   */
  async queryMonthlyLikes(limit = 20) {
    return this.queryInteractionBoardByPeriod({ type: 'like', periodDays: 30, limit });
  }

  /**
   * 查询“日收藏热榜”
   */
  async queryDailyFavorites(limit = 20) {
    return this.queryInteractionBoardByPeriod({ type: 'favorite', periodDays: 1, limit });
  }

  /**
   * 查询“周收藏热榜”
   */
  async queryWeeklyFavorites(limit = 20) {
    return this.queryInteractionBoardByPeriod({ type: 'favorite', periodDays: 7, limit });
  }

  /**
   * 查询“月收藏热榜”
   */
  async queryMonthlyFavorites(limit = 20) {
    return this.queryInteractionBoardByPeriod({ type: 'favorite', periodDays: 30, limit });
  }

  /**
   * 查询互动周期榜（收藏/点赞通用）
   */
  async queryInteractionBoardByPeriod({ type = 'like', periodDays = 7, limit = 20 } = {}) {
    const { app } = this;
    const safeLimit = this.parsePositiveInt(limit, 20, 1, 100);
    const safePeriodDays = this.parsePositiveInt(periodDays, 7, 1, 365);
    const normalizedType = String(type || 'like').trim().toLowerCase();
    const tableName = normalizedType === 'favorite' ? 'uied_website_favorite' : 'uied_website_like';
    const scoreAlias = normalizedType === 'favorite' ? 'favoriteCount' : 'likeCount';
    const rows = await app.model.query(
      `SELECT w.id, w.name, w.slug, w.url, w.icon_url AS iconUrl, w.description,
              w.click_count AS clickCount, w.create_time AS createTime,
              c.name AS category,
              COUNT(l.id) AS ${scoreAlias},
              COUNT(l.id) AS score
       FROM uied_website w
       LEFT JOIN uied_category c ON c.id = w.category_id
       LEFT JOIN ${tableName} l
         ON l.website_id = w.id
        AND l.is_delete = 0
        AND l.create_time >= UNIX_TIMESTAMP() - (? * 24 * 3600)
       WHERE w.is_delete = 0
       GROUP BY w.id, w.name, w.slug, w.url, w.icon_url, w.description, w.click_count, w.create_time, c.name
       ORDER BY ${scoreAlias} DESC, w.is_pinned DESC, w.click_count DESC, w.update_time DESC, w.id DESC
       LIMIT ?`,
      {
        replacements: [ safePeriodDays, safeLimit ],
        type: app.Sequelize.QueryTypes.SELECT,
      }
    );

    return (Array.isArray(rows) ? rows : []).map(row => this.buildWebsiteCard({
      ...row,
      score: Number(row[scoreAlias] || 0),
    }));
  }

  /**
   * 查询“周期访问热榜”（当前无访问日志表时使用累计点击热度兜底）
   */
  async queryVisitBoardByPeriod({ period = 'day', limit = 20 } = {}) {
    const _period = String(period || 'day').trim().toLowerCase();
    const items = await this.queryTodayHot(limit);
    return items.map((row) => ({
      ...row,
      score: Number(row.clickCount || 0),
      visitPeriod: [ 'day', 'week', 'month' ].includes(_period) ? _period : 'day',
    }));
  }

  /**
   * 按榜单键查询榜单数据
   */
  async queryBoardItems(boardKey, limit = 20) {
    const key = String(boardKey || '').trim();
    if (key === 'daily_visits') return this.queryVisitBoardByPeriod({ period: 'day', limit });
    if (key === 'weekly_visits') return this.queryVisitBoardByPeriod({ period: 'week', limit });
    if (key === 'monthly_visits') return this.queryVisitBoardByPeriod({ period: 'month', limit });
    if (key === 'daily_favorites') return this.queryDailyFavorites(limit);
    if (key === 'weekly_favorites') return this.queryWeeklyFavorites(limit);
    if (key === 'monthly_favorites') return this.queryMonthlyFavorites(limit);
    if (key === 'daily_likes') return this.queryDailyLikes(limit);
    if (key === 'today_hot') return this.queryTodayHot(limit);
    if (key === 'seven_day_rising') return this.querySevenDayRising(limit);
    if (key === 'new_sites') return this.queryNewSites(limit);
    if (key === 'editor_pick') return this.queryEditorPick(limit);
    if (key === 'weekly_likes') return this.queryWeeklyLikes(limit);
    if (key === 'monthly_likes') return this.queryMonthlyLikes(limit);
    return [];
  }

  /**
   * 获取榜单聚合结果
   */
  async getBoardList(options = {}) {
    const boardKey = String(options.boardKey || '').trim();
    const publicConfig = await this.getPublicConfig();
    const configs = await this.getConfigList({ includeDisabled: true });
    const targetConfigs = boardKey
      ? configs.filter(item => item.boardKey === boardKey)
      : configs.filter(item => item.isEnabled);

    const boards = [];
    for (let index = 0; index < targetConfigs.length; index++) {
      const config = targetConfigs[index];
      const queryLimit = this.parsePositiveInt(
        options.limit,
        config.limitCount || 20,
        1,
        100
      );
      const items = config.isEnabled || boardKey
        ? await this.queryBoardItems(config.boardKey, queryLimit)
        : [];

      boards.push({
        key: config.boardKey,
        title: config.boardName,
        boardKey: config.boardKey,
        boardName: config.boardName,
        description: config.description,
        algorithm: config.algorithm,
        isEnabled: config.isEnabled,
        sort: config.sort,
        limitCount: queryLimit,
        extra: config.extra || {},
        metric: String(config.extra?.metric || ''),
        period: String(config.extra?.period || ''),
        total: items.length,
        items,
      });
    }

    return {
      total: boards.length,
      requestedAt: Math.floor(Date.now() / 1000),
      publicConfig,
      boards,
    };
  }

  /**
   * 获取榜单指标维度选项
   */
  getMetricOptions() {
    return [
      { value: 'visit', label: '访问量' },
      { value: 'favorite', label: '收藏量' },
      { value: 'like', label: '点赞量' },
      { value: 'curated', label: '运营榜单' },
    ];
  }

  /**
   * 获取榜单周期维度选项
   */
  getPeriodOptions() {
    return [
      { value: 'day', label: '每日' },
      { value: 'week', label: '每周' },
      { value: 'month', label: '每月' },
      { value: 'all', label: '全部' },
    ];
  }

  /**
   * 获取后台字段草案
   */
  getFieldDraft() {
    const displayPlacementOptions = this.getDisplayPlacementOptions();
    return {
      publicFields: [
        { key: 'enabled', type: 'switch', label: '启用榜单系统入口', required: true, defaultValue: true },
        { key: 'displayPlacements', type: 'checkbox-group', label: '前台显示位置', required: true, options: displayPlacementOptions, defaultValue: [ 'nav_quick_entry', 'home_block' ] },
        { key: 'displayLabel', type: 'input', label: '入口名称', required: true, defaultValue: '榜单系统' },
        { key: 'displayPath', type: 'input', label: '入口路径', required: true, defaultValue: '/p/rankings' },
        { key: 'displaySort', type: 'number', label: '入口排序', required: true, min: 1, max: 9999, defaultValue: 88 },
        { key: 'displayDesktop', type: 'switch', label: '桌面端显示', required: true, defaultValue: true },
        { key: 'displayMobile', type: 'switch', label: '移动端显示', required: true, defaultValue: true },
        { key: 'displayOpenInNewTab', type: 'switch', label: '新窗口打开', required: true, defaultValue: false },
        { key: 'defaultMetric', type: 'select', label: '默认指标', required: true, options: this.getMetricOptions(), defaultValue: 'visit' },
        { key: 'defaultPeriod', type: 'select', label: '默认周期', required: true, options: this.getPeriodOptions(), defaultValue: 'day' },
        { key: 'maxVisibleBoards', type: 'number', label: '前台最多展示榜单数', required: true, min: 1, max: 30, defaultValue: 12 },
      ],
      boardFields: [
        { key: 'boardKey', type: 'select', label: '榜单类型', required: true, options: this.getDefaultBoards().map(item => item.boardKey) },
        { key: 'boardName', type: 'input', label: '榜单名称', required: true },
        { key: 'description', type: 'textarea', label: '榜单描述', required: false },
        { key: 'algorithm', type: 'input', label: '排序算法标识', required: true },
        { key: 'isEnabled', type: 'switch', label: '是否启用', required: true, defaultValue: true },
        { key: 'sort', type: 'number', label: '榜单排序', required: true, min: 1, max: 100000, defaultValue: 10 },
        { key: 'limitCount', type: 'number', label: '默认条数', required: true, min: 1, max: 100, defaultValue: 20 },
        { key: 'extra.metric', type: 'select', label: '指标维度', required: false, options: this.getMetricOptions() },
        { key: 'extra.period', type: 'select', label: '周期维度', required: false, options: this.getPeriodOptions() },
        { key: 'extra.displayPlacements', type: 'checkbox-group', label: '显示位置', required: false, options: displayPlacementOptions },
      ],
      displayPlacementOptions,
      metricOptions: this.getMetricOptions(),
      periodOptions: this.getPeriodOptions(),
      builtinBoards: this.getDefaultBoards(),
    };
  }
}

module.exports = RankBoardService;
