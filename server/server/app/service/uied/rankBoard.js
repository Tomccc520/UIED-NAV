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

class RankBoardService extends Service {
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
        boardKey: 'today_hot',
        boardName: '今日热门',
        description: '按站点总点击热度排序',
        algorithm: 'click_count_desc',
        limitCount: 20,
        sort: 10,
        isEnabled: true,
      },
      {
        boardKey: 'seven_day_rising',
        boardName: '7日飙升',
        description: '按近7日上升指数排序',
        algorithm: 'rise_index_7d',
        limitCount: 20,
        sort: 20,
        isEnabled: true,
      },
      {
        boardKey: 'new_sites',
        boardName: '新站榜',
        description: '按最新收录时间排序',
        algorithm: 'create_time_desc',
        limitCount: 20,
        sort: 30,
        isEnabled: true,
      },
      {
        boardKey: 'editor_pick',
        boardName: '编辑精选',
        description: '由运营后台维护的精选列表',
        algorithm: 'editor_pick',
        limitCount: 20,
        sort: 40,
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
   * 规范化正整数
   */
  parsePositiveInt(value, fallback = 0, min = 1, max = 100000) {
    const parsed = Number.parseInt(String(value || ''), 10);
    if (!Number.isInteger(parsed) || parsed <= 0) return fallback;
    return Math.max(min, Math.min(max, parsed));
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

    return {
      id: this.parsePositiveInt(source.id, 0, 1, 99999999),
      boardKey,
      boardName,
      description,
      algorithm,
      limitCount: this.parsePositiveInt(source.limitCount, defaults.limitCount || 20, 1, 100),
      sort: this.parsePositiveInt(source.sort, defaults.sort || ((index + 1) * 10), 1, 100000),
      isEnabled: this.parseBoolean(source.isEnabled, defaults.isEnabled !== false),
      extra: source.extra && typeof source.extra === 'object' ? source.extra : {},
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
   * 按榜单键查询榜单数据
   */
  async queryBoardItems(boardKey, limit = 20) {
    const key = String(boardKey || '').trim();
    if (key === 'today_hot') return this.queryTodayHot(limit);
    if (key === 'seven_day_rising') return this.querySevenDayRising(limit);
    if (key === 'new_sites') return this.queryNewSites(limit);
    if (key === 'editor_pick') return this.queryEditorPick(limit);
    return [];
  }

  /**
   * 获取榜单聚合结果
   */
  async getBoardList(options = {}) {
    const boardKey = String(options.boardKey || '').trim();
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
        boardKey: config.boardKey,
        boardName: config.boardName,
        description: config.description,
        algorithm: config.algorithm,
        isEnabled: config.isEnabled,
        sort: config.sort,
        limitCount: queryLimit,
        total: items.length,
        items,
      });
    }

    return {
      total: boards.length,
      requestedAt: Math.floor(Date.now() / 1000),
      boards,
    };
  }

  /**
   * 获取后台字段草案
   */
  getFieldDraft() {
    return {
      boardFields: [
        { key: 'boardKey', type: 'select', label: '榜单类型', required: true, options: [ 'today_hot', 'seven_day_rising', 'new_sites', 'editor_pick' ] },
        { key: 'boardName', type: 'input', label: '榜单名称', required: true },
        { key: 'description', type: 'textarea', label: '榜单描述', required: false },
        { key: 'algorithm', type: 'input', label: '排序算法标识', required: true },
        { key: 'isEnabled', type: 'switch', label: '是否启用', required: true, defaultValue: true },
        { key: 'sort', type: 'number', label: '榜单排序', required: true, min: 1, max: 100000, defaultValue: 10 },
        { key: 'limitCount', type: 'number', label: '默认条数', required: true, min: 1, max: 100, defaultValue: 20 },
      ],
      builtinBoards: this.getDefaultBoards(),
    };
  }
}

module.exports = RankBoardService;
