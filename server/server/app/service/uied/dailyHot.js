/**
 * @file service/uied/dailyHot.js
 * @description UIED 每日热榜聚合服务
 * @author UIED技术团队
 * @copyright Tomda (https://www.tomda.top)
 * @copyright UIED技术团队 (https://fsuied.com)
 * @createDate 2026-02-21
 */

'use strict';

const Service = require('egg').Service;

const DAILY_HOT_CONFIG_KEY = 'daily_hot_config';
const DAILY_HOT_CONFIG_TABLE = 'uied_daily_hot_config';
const DAILY_HOT_PLATFORM_TABLE = 'uied_daily_hot_platform';

class DailyHotService extends Service {
  /**
   * 确保每日热榜持久化表存在（新环境兜底）
   */
  async ensureTables() {
    const { app } = this;
    const cacheKey = '__uiedDailyHotTablesReady__';
    if (app[cacheKey] === true) return;

    await app.model.query(
      `CREATE TABLE IF NOT EXISTS \`${DAILY_HOT_CONFIG_TABLE}\` (
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
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='每日热榜全局配置表'`,
      { type: app.Sequelize.QueryTypes.RAW }
    );

    await app.model.query(
      `CREATE TABLE IF NOT EXISTS \`${DAILY_HOT_PLATFORM_TABLE}\` (
        \`id\` int unsigned NOT NULL AUTO_INCREMENT,
        \`platform_title\` varchar(128) NOT NULL DEFAULT '',
        \`display_name\` varchar(128) NOT NULL DEFAULT '',
        \`is_enabled\` tinyint unsigned NOT NULL DEFAULT 1,
        \`sort\` int unsigned NOT NULL DEFAULT 0,
        \`cache_ttl_seconds\` int unsigned NOT NULL DEFAULT 600,
        \`limit_count\` tinyint unsigned NOT NULL DEFAULT 10,
        \`request_timeout_ms\` int unsigned NOT NULL DEFAULT 12000,
        \`extra_json\` text,
        \`is_delete\` tinyint unsigned NOT NULL DEFAULT 0,
        \`create_time\` int unsigned NOT NULL DEFAULT 0,
        \`update_time\` int unsigned NOT NULL DEFAULT 0,
        \`delete_time\` int unsigned NOT NULL DEFAULT 0,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`uk_platform_title\` (\`platform_title\`),
        KEY \`idx_enable_sort\` (\`is_enabled\`,\`sort\`),
        KEY \`idx_delete\` (\`is_delete\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='每日热榜平台配置表'`,
      { type: app.Sequelize.QueryTypes.RAW }
    );

    app[cacheKey] = true;
  }

  /**
   * 获取默认配置
   */
  getDefaultConfig() {
    return {
      enabled: true,
      apiBaseUrl: 'https://api.pearktrue.cn/api/dailyhot/',
      timeoutMs: 12000,
      cacheTtlSeconds: 600,
      defaultPlatforms: [ '哔哩哔哩', '知乎', '微博', '今日头条', 'IT之家', '稀土掘金' ],
      defaultLimit: 10,
      maxPlatforms: 20,
      displayPlacements: [ 'home_menu', 'footer_link' ],
      displayLabel: '每日热榜',
      displayPath: '/p/daily-hot',
      displaySort: 90,
      displayDesktop: true,
      displayMobile: true,
      displayOpenInNewTab: false,
    };
  }

  /**
   * 获取“显示位置”可选项定义
   */
  getDisplayPlacementOptions() {
    return [
      { value: 'home_menu', label: '首页菜单入口' },
      { value: 'footer_link', label: '页脚链接' },
      { value: 'fixed_link', label: '固定悬浮入口' },
      { value: 'nav_quick_entry', label: '导航快捷入口' },
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
  parsePositiveInt(value, fallback = 0, min = 1, max = 1000) {
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
   * 规范化显示位置配置项（只保留白名单值）
   */
  normalizeDisplayPlacements(value) {
    const options = this.getDisplayPlacementOptions();
    const allowSet = new Set(options.map(item => item.value));
    const list = this.toStringList(value)
      .map(item => String(item || '').trim())
      .filter(item => allowSet.has(item));
    return Array.from(new Set(list));
  }

  /**
   * 规范化每日热榜配置
   */
  normalizeConfig(payload = {}) {
    const source = payload && typeof payload === 'object' ? payload : {};
    const defaults = this.getDefaultConfig();
    const apiBaseUrl = String(source.apiBaseUrl || defaults.apiBaseUrl).trim() || defaults.apiBaseUrl;
    const timeoutMs = this.parsePositiveInt(source.timeoutMs, defaults.timeoutMs, 1000, 30000);
    const cacheTtlSeconds = this.parsePositiveInt(source.cacheTtlSeconds, defaults.cacheTtlSeconds, 30, 86400);
    const defaultPlatforms = this.toStringList(source.defaultPlatforms);
    const maxPlatforms = this.parsePositiveInt(source.maxPlatforms, defaults.maxPlatforms, 1, 50);
    const defaultLimit = this.parsePositiveInt(source.defaultLimit, defaults.defaultLimit, 1, 30);
    const displayPlacements = this.normalizeDisplayPlacements(source.displayPlacements);
    const displayPath = String(source.displayPath || defaults.displayPath).trim() || defaults.displayPath;
    const displayLabel = String(source.displayLabel || defaults.displayLabel).trim() || defaults.displayLabel;

    return {
      enabled: this.parseBoolean(source.enabled, defaults.enabled),
      apiBaseUrl: apiBaseUrl.endsWith('/') ? apiBaseUrl : `${apiBaseUrl}/`,
      timeoutMs,
      cacheTtlSeconds,
      defaultPlatforms: defaultPlatforms.length > 0 ? defaultPlatforms : defaults.defaultPlatforms,
      defaultLimit,
      maxPlatforms,
      displayPlacements: displayPlacements.length > 0 ? displayPlacements : defaults.displayPlacements,
      displayLabel,
      displayPath: displayPath.startsWith('/') ? displayPath : `/${displayPath}`,
      displaySort: this.parsePositiveInt(source.displaySort, defaults.displaySort, 1, 9999),
      displayDesktop: this.parseBoolean(source.displayDesktop, defaults.displayDesktop),
      displayMobile: this.parseBoolean(source.displayMobile, defaults.displayMobile),
      displayOpenInNewTab: this.parseBoolean(source.displayOpenInNewTab, defaults.displayOpenInNewTab),
      updatedAt: Math.floor(Date.now() / 1000),
    };
  }

  /**
   * 规范化单个平台配置
   */
  normalizePlatformConfig(payload = {}, index = 0) {
    const source = payload && typeof payload === 'object' ? payload : {};
    const platformTitle = String(source.platformTitle || source.title || '').trim();
    const displayName = String(source.displayName || source.name || platformTitle).trim() || platformTitle;
    const sort = this.parsePositiveInt(source.sort, (index + 1) * 10, 1, 100000);

    return {
      id: this.parsePositiveInt(source.id, 0, 1, 99999999),
      platformTitle,
      displayName,
      isEnabled: this.parseBoolean(source.isEnabled, true),
      sort,
      cacheTtlSeconds: this.parsePositiveInt(source.cacheTtlSeconds, 600, 30, 86400),
      limitCount: this.parsePositiveInt(source.limitCount, 10, 1, 30),
      requestTimeoutMs: this.parsePositiveInt(source.requestTimeoutMs, 12000, 1000, 30000),
      extra: source.extra && typeof source.extra === 'object' ? source.extra : {},
    };
  }

  /**
   * 从设置键读取旧配置（兼容历史版本）
   */
  async getConfigFromSettingFallback() {
    const raw = await this.ctx.service.uied.setting.get(DAILY_HOT_CONFIG_KEY);
    return this.normalizeConfig(raw || {});
  }

  /**
   * 从持久化表读取配置
   */
  async getConfigFromTable() {
    const { app } = this;
    const [ row ] = await app.model.query(
      `SELECT config_value
       FROM ${DAILY_HOT_CONFIG_TABLE}
       WHERE config_key = 'global' AND is_delete = 0
       LIMIT 1`,
      { type: app.Sequelize.QueryTypes.SELECT }
    );

    if (!row?.config_value) return null;
    try {
      return this.normalizeConfig(JSON.parse(row.config_value));
    } catch (error) {
      this.ctx.logger.warn('[dailyHot] 读取持久化配置 JSON 失败，降级默认:', error.message);
      return this.normalizeConfig({});
    }
  }

  /**
   * 读取当前配置
   */
  async getConfig() {
    await this.ensureTables();

    const tableConfig = await this.getConfigFromTable();
    if (tableConfig) return tableConfig;

    const fallback = await this.getConfigFromSettingFallback();
    await this.saveConfig(fallback);
    return fallback;
  }

  /**
   * 保存配置
   */
  async saveConfig(payload = {}) {
    await this.ensureTables();
    const { app, ctx } = this;
    const now = Math.floor(Date.now() / 1000);
    const normalized = this.normalizeConfig(payload);

    await app.model.query(
      `INSERT INTO ${DAILY_HOT_CONFIG_TABLE}
       (config_key, config_value, description, is_delete, create_time, update_time, delete_time)
       VALUES ('global', ?, '每日热榜全局配置', 0, ?, ?, 0)
       ON DUPLICATE KEY UPDATE
         config_value = VALUES(config_value),
         description = VALUES(description),
         is_delete = 0,
         delete_time = 0,
         update_time = VALUES(update_time)`,
      {
        replacements: [ JSON.stringify(normalized), now, now ],
        type: app.Sequelize.QueryTypes.INSERT,
      }
    );

    // 同步写回旧 setting，保持历史读取链路兼容
    await ctx.service.uied.setting.save({ [DAILY_HOT_CONFIG_KEY]: normalized });

    return this.getConfig();
  }

  /**
   * 获取平台配置列表
   */
  async getPlatformConfigList() {
    await this.ensureTables();
    const { app } = this;
    const rows = await app.model.query(
      `SELECT id, platform_title, display_name, is_enabled, sort,
              cache_ttl_seconds, limit_count, request_timeout_ms, extra_json
       FROM ${DAILY_HOT_PLATFORM_TABLE}
       WHERE is_delete = 0
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
      return this.normalizePlatformConfig({
        id: row.id,
        platformTitle: row.platform_title,
        displayName: row.display_name,
        isEnabled: row.is_enabled === 1,
        sort: row.sort || (index + 1) * 10,
        cacheTtlSeconds: row.cache_ttl_seconds,
        limitCount: row.limit_count,
        requestTimeoutMs: row.request_timeout_ms,
        extra,
      }, index);
    });
  }

  /**
   * 批量保存平台配置
   */
  async savePlatformConfigList(list = [], options = {}) {
    await this.ensureTables();
    const { app } = this;
    const now = Math.floor(Date.now() / 1000);
    const rows = Array.isArray(list) ? list : [];
    const clearMissing = this.parseBoolean(options.clearMissing, false);
    const normalizedRows = [];

    for (let index = 0; index < rows.length; index++) {
      const normalized = this.normalizePlatformConfig(rows[index], index);
      if (!normalized.platformTitle) continue;
      normalizedRows.push(normalized);

      await app.model.query(
        `INSERT INTO ${DAILY_HOT_PLATFORM_TABLE}
         (platform_title, display_name, is_enabled, sort, cache_ttl_seconds, limit_count, request_timeout_ms, extra_json,
          is_delete, create_time, update_time, delete_time)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, 0)
         ON DUPLICATE KEY UPDATE
           display_name = VALUES(display_name),
           is_enabled = VALUES(is_enabled),
           sort = VALUES(sort),
           cache_ttl_seconds = VALUES(cache_ttl_seconds),
           limit_count = VALUES(limit_count),
           request_timeout_ms = VALUES(request_timeout_ms),
           extra_json = VALUES(extra_json),
           is_delete = 0,
           delete_time = 0,
           update_time = VALUES(update_time)`,
        {
          replacements: [
            normalized.platformTitle,
            normalized.displayName,
            normalized.isEnabled ? 1 : 0,
            normalized.sort,
            normalized.cacheTtlSeconds,
            normalized.limitCount,
            normalized.requestTimeoutMs,
            JSON.stringify(normalized.extra || {}),
            now,
            now,
          ],
          type: app.Sequelize.QueryTypes.INSERT,
        }
      );
    }

    if (clearMissing) {
      const titles = normalizedRows.map(item => item.platformTitle);
      if (titles.length > 0) {
        const placeholders = titles.map(() => '?').join(',');
        await app.model.query(
          `UPDATE ${DAILY_HOT_PLATFORM_TABLE}
           SET is_delete = 1, delete_time = ?, update_time = ?
           WHERE platform_title NOT IN (${placeholders}) AND is_delete = 0`,
          {
            replacements: [ now, now, ...titles ],
            type: app.Sequelize.QueryTypes.UPDATE,
          }
        );
      }
    }

    return this.getPlatformConfigList();
  }

  /**
   * 删除单个平台配置
   */
  async delPlatformConfig(id) {
    await this.ensureTables();
    const { app } = this;
    const now = Math.floor(Date.now() / 1000);
    const targetId = this.parsePositiveInt(id, 0, 1, 99999999);
    if (!targetId) {
      throw new Error('平台配置ID无效');
    }

    await app.model.query(
      `UPDATE ${DAILY_HOT_PLATFORM_TABLE}
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
   * 获取后台页面字段草案
   */
  getFieldDraft() {
    const placementOptions = this.getDisplayPlacementOptions();
    return {
      globalFields: [
        { key: 'enabled', type: 'switch', label: '启用每日热榜', required: true, defaultValue: true },
        { key: 'apiBaseUrl', type: 'input', label: '接口地址', required: true, defaultValue: 'https://api.pearktrue.cn/api/dailyhot/' },
        { key: 'timeoutMs', type: 'number', label: '请求超时(ms)', required: true, min: 1000, max: 30000, defaultValue: 12000 },
        { key: 'cacheTtlSeconds', type: 'number', label: '全局缓存秒数', required: true, min: 30, max: 86400, defaultValue: 600 },
        { key: 'defaultLimit', type: 'number', label: '默认每平台返回条数', required: true, min: 1, max: 30, defaultValue: 10 },
        { key: 'maxPlatforms', type: 'number', label: '最多聚合平台数', required: true, min: 1, max: 50, defaultValue: 20 },
        { key: 'defaultPlatforms', type: 'array-string', label: '默认平台（按序）', required: true, defaultValue: [ '哔哩哔哩', '知乎', '微博' ] },
        { key: 'displayPlacements', type: 'checkbox-group', label: '前台显示位置', required: true, options: placementOptions, defaultValue: [ 'home_menu', 'footer_link' ] },
        { key: 'displayLabel', type: 'input', label: '入口名称', required: true, defaultValue: '每日热榜' },
        { key: 'displayPath', type: 'input', label: '入口路径', required: true, defaultValue: '/p/daily-hot' },
        { key: 'displaySort', type: 'number', label: '入口排序', required: true, min: 1, max: 9999, defaultValue: 90 },
        { key: 'displayDesktop', type: 'switch', label: '桌面端显示', required: true, defaultValue: true },
        { key: 'displayMobile', type: 'switch', label: '移动端显示', required: true, defaultValue: true },
        { key: 'displayOpenInNewTab', type: 'switch', label: '新窗口打开', required: true, defaultValue: false },
      ],
      platformFields: [
        { key: 'platformTitle', type: 'input', label: '平台标题', required: true, remark: '需与第三方接口 title 参数一致' },
        { key: 'displayName', type: 'input', label: '展示名称', required: true },
        { key: 'isEnabled', type: 'switch', label: '是否启用', required: true, defaultValue: true },
        { key: 'sort', type: 'number', label: '默认排序', required: true, min: 1, max: 100000, defaultValue: 10 },
        { key: 'cacheTtlSeconds', type: 'number', label: '平台缓存秒数', required: true, min: 30, max: 86400, defaultValue: 600 },
        { key: 'limitCount', type: 'number', label: '平台默认条数', required: true, min: 1, max: 30, defaultValue: 10 },
        { key: 'requestTimeoutMs', type: 'number', label: '平台超时(ms)', required: true, min: 1000, max: 30000, defaultValue: 12000 },
      ],
      cachePolicy: {
        strategy: 'global + platform 双层缓存策略',
        keyPattern: [ 'uied:dailyhot:platforms:all', 'uied:dailyhot:platform:{title}' ],
      },
      displayPlacementOptions: placementOptions,
    };
  }

  /**
   * 构建缓存键
   */
  buildCacheKey(type, suffix = '') {
    const part = String(suffix || '').trim();
    return `uied:dailyhot:${type}:${part}`;
  }

  /**
   * 读取缓存 JSON
   */
  async readCacheJson(key) {
    try {
      const raw = await this.ctx.service.redis.get(key);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (error) {
      this.ctx.logger.warn(`[dailyHot] readCacheJson 失败(${key}):`, error.message);
      return null;
    }
  }

  /**
   * 写入缓存 JSON
   */
  async writeCacheJson(key, value, ttlSeconds) {
    try {
      await this.ctx.service.redis.set(key, JSON.stringify(value));
      await this.ctx.service.redis.expire(key, ttlSeconds);
    } catch (error) {
      this.ctx.logger.warn(`[dailyHot] writeCacheJson 失败(${key}):`, error.message);
    }
  }

  /**
   * 判断是否为 TLS 证书链错误（第三方免费接口在部分环境下会触发）
   */
  isTlsCertificateError(error) {
    const message = String(error?.message || '').toLowerCase();
    return [
      'unable to get local issuer certificate',
      'self signed certificate',
      'certificate has expired',
      'unable to verify the first certificate',
    ].some(keyword => message.includes(keyword));
  }

  /**
   * 发起第三方接口请求（支持在证书链异常时的安全降级重试）
   */
  async doProviderRequest(url, timeoutMs, allowInsecureRetry = true) {
    const { ctx } = this;
    const requestOptions = {
      timeout: timeoutMs,
      dataType: 'json',
      method: 'GET',
      headers: {
        'User-Agent': 'UIED-NAV/Commercial',
        Accept: 'application/json',
      },
    };

    try {
      return await ctx.curl(url, requestOptions);
    } catch (error) {
      if (!allowInsecureRetry || !this.isTlsCertificateError(error)) {
        throw error;
      }

      // 仅在证书链异常时降级一次，兼容部分本地/客户服务器缺失 CA 链的情况
      ctx.logger.warn(`[dailyHot] TLS 证书校验失败，降级重试第三方热榜接口: ${url}`);
      return await ctx.curl(url, {
        ...requestOptions,
        rejectUnauthorized: false,
      });
    }
  }

  /**
   * 请求第三方每日热榜接口
   */
  async requestProvider(params = {}, options = {}) {
    const config = options.config || await this.getConfig();
    const timeoutMs = this.parsePositiveInt(options.timeoutMs, config.timeoutMs, 1000, 30000);
    const query = new URLSearchParams();
    Object.keys(params).forEach(key => {
      const value = params[key];
      if (value === undefined || value === null || value === '') return;
      query.set(key, String(value));
    });
    const queryText = query.toString();
    const url = `${config.apiBaseUrl}${queryText ? `?${queryText}` : ''}`;
    const res = await this.doProviderRequest(url, timeoutMs, true);

    if (res.status !== 200) {
      throw new Error(`每日热榜接口异常: HTTP ${res.status}`);
    }
    return res.data || {};
  }

  /**
   * 标准化平台列表响应
   */
  normalizePlatformsResponse(payload = {}) {
    const listSource = Array.isArray(payload?.data)
      ? payload.data
      : (Array.isArray(payload?.platforms) ? payload.platforms : []);
    const list = listSource
      .map(item => String(item?.title || item?.name || item || '').trim())
      .filter(Boolean);
    return Array.from(new Set(list));
  }

  /**
   * 获取可用热榜平台列表
   */
  async getPlatforms({ forceRefresh = false } = {}) {
    const config = await this.getConfig();
    const platformConfigList = await this.getPlatformConfigList();
    const cacheKey = this.buildCacheKey('platforms', 'all');

    if (!forceRefresh) {
      const cached = await this.readCacheJson(cacheKey);
      if (cached && Array.isArray(cached.platforms)) {
        return {
          ...cached,
          fromCache: true,
        };
      }
    }

    let remotePlatforms = [];
    try {
      const payload = await this.requestProvider({}, { config });
      remotePlatforms = this.normalizePlatformsResponse(payload);
    } catch (error) {
      this.ctx.logger.warn('[dailyHot] 获取远程平台列表失败，降级默认配置:', error.message);
      remotePlatforms = this.toStringList(config.defaultPlatforms);
    }

    const configuredMap = new Map(platformConfigList.map(item => [ item.platformTitle, item ]));
    const merged = [];

    remotePlatforms.forEach((title, index) => {
      const conf = configuredMap.get(title);
      merged.push({
        title,
        displayName: conf?.displayName || title,
        isEnabled: conf ? conf.isEnabled : true,
        sort: conf?.sort || (index + 1) * 10,
        cacheTtlSeconds: conf?.cacheTtlSeconds || config.cacheTtlSeconds,
        limitCount: conf?.limitCount || config.defaultLimit,
        requestTimeoutMs: conf?.requestTimeoutMs || config.timeoutMs,
        isConfigured: Boolean(conf),
      });
      configuredMap.delete(title);
    });

    Array.from(configuredMap.values()).forEach(conf => {
      merged.push({
        title: conf.platformTitle,
        displayName: conf.displayName,
        isEnabled: conf.isEnabled,
        sort: conf.sort,
        cacheTtlSeconds: conf.cacheTtlSeconds,
        limitCount: conf.limitCount,
        requestTimeoutMs: conf.requestTimeoutMs,
        isConfigured: true,
      });
    });

    merged.sort((a, b) => a.sort - b.sort || a.title.localeCompare(b.title, 'zh-Hans-CN'));

    const result = {
      platforms: merged,
      total: merged.length,
      updatedAt: Math.floor(Date.now() / 1000),
      fromCache: false,
    };

    await this.writeCacheJson(cacheKey, result, config.cacheTtlSeconds);
    return result;
  }

  /**
   * 标准化单平台热榜响应
   */
  normalizeDailyHotResponse(payload = {}, title = '') {
    let rows = [];
    if (Array.isArray(payload?.data)) {
      rows = payload.data;
    } else if (typeof payload?.data === 'string') {
      try {
        const parsed = JSON.parse(payload.data);
        rows = Array.isArray(parsed) ? parsed : [];
      } catch (error) {
        rows = [];
      }
    }

    return {
      code: Number(payload?.code || 0),
      platform: String(payload?.name || title || ''),
      title: String(payload?.title || title || ''),
      type: String(payload?.type || ''),
      description: String(payload?.description || ''),
      link: String(payload?.link || ''),
      total: Number(payload?.total || rows.length || 0),
      updateTime: String(payload?.updateTime || ''),
      formCache: String(payload?.formCache || ''),
      items: rows.map(item => ({
        id: Number(item?.id || 0),
        title: String(item?.title || ''),
        desc: String(item?.desc || ''),
        cover: String(item?.cover || ''),
        hot: String(item?.hot || ''),
        timestamp: String(item?.timestamp || ''),
        url: String(item?.url || ''),
        mobileUrl: String(item?.mobileUrl || ''),
      })),
    };
  }

  /**
   * 读取单个平台热榜（带缓存）
   */
  async getPlatformDailyHot(title, options = {}) {
    const config = await this.getConfig();
    const platformTitle = String(title || '').trim();
    if (!platformTitle) {
      throw new Error('平台标题不能为空');
    }

    const limit = this.parsePositiveInt(options.limit, config.defaultLimit, 1, 30);
    const forceRefresh = this.parseBoolean(options.forceRefresh, false);
    const timeoutMs = this.parsePositiveInt(options.timeoutMs, config.timeoutMs, 1000, 30000);
    const cacheTtlSeconds = this.parsePositiveInt(options.cacheTtlSeconds, config.cacheTtlSeconds, 30, 86400);

    const cacheKey = this.buildCacheKey('platform', platformTitle);
    if (!forceRefresh) {
      const cached = await this.readCacheJson(cacheKey);
      if (cached && cached.title === platformTitle) {
        return {
          ...cached,
          fromCache: true,
          items: Array.isArray(cached.items) ? cached.items.slice(0, limit) : [],
        };
      }
    }

    const payload = await this.requestProvider({ title: platformTitle }, { config, timeoutMs });
    const normalized = this.normalizeDailyHotResponse(payload, platformTitle);
    const result = {
      ...normalized,
      fromCache: false,
      fetchedAt: Math.floor(Date.now() / 1000),
      items: Array.isArray(normalized.items) ? normalized.items.slice(0, limit) : [],
    };

    await this.writeCacheJson(cacheKey, {
      ...normalized,
      fetchedAt: result.fetchedAt,
      title: platformTitle,
    }, cacheTtlSeconds);

    return result;
  }

  /**
   * 聚合获取今日热榜
   */
  async aggregateTodayHot(options = {}) {
    const config = await this.getConfig();
    if (!config.enabled) {
      return {
        enabled: false,
        message: '每日热榜功能已关闭',
        totalPlatforms: 0,
        platforms: [],
      };
    }

    const title = String(options.title || '').trim();
    const titles = this.toStringList(options.titles);
    const platformLimit = this.parsePositiveInt(options.platformLimit, 6, 1, config.maxPlatforms);
    const limit = this.parsePositiveInt(options.limit, config.defaultLimit, 1, 30);
    const forceRefresh = this.parseBoolean(options.forceRefresh, false);

    const platformConfigList = await this.getPlatformConfigList();
    const platformConfigMap = new Map(platformConfigList.map(item => [ item.platformTitle, item ]));

    let selectedPlatforms = [];
    if (title) {
      selectedPlatforms = [ title ];
    } else if (titles.length > 0) {
      selectedPlatforms = titles;
    } else {
      const enabledConfiguredPlatforms = platformConfigList
        .filter(item => item.isEnabled)
        .sort((a, b) => a.sort - b.sort)
        .map(item => item.platformTitle);
      selectedPlatforms = enabledConfiguredPlatforms.length > 0
        ? enabledConfiguredPlatforms
        : this.toStringList(config.defaultPlatforms);
    }

    selectedPlatforms = Array.from(new Set(selectedPlatforms)).slice(0, platformLimit);

    const rows = await Promise.all(selectedPlatforms.map(async platformTitle => {
      try {
        const platformConfig = platformConfigMap.get(platformTitle);
        const result = await this.getPlatformDailyHot(platformTitle, {
          limit: platformConfig?.limitCount || limit,
          cacheTtlSeconds: platformConfig?.cacheTtlSeconds || config.cacheTtlSeconds,
          timeoutMs: platformConfig?.requestTimeoutMs || config.timeoutMs,
          forceRefresh,
        });
        return {
          platform: platformTitle,
          displayName: platformConfig?.displayName || platformTitle,
          ok: true,
          ...result,
        };
      } catch (error) {
        return {
          platform: platformTitle,
          displayName: platformConfigMap.get(platformTitle)?.displayName || platformTitle,
          ok: false,
          error: error.message || '获取失败',
          items: [],
          total: 0,
          fromCache: false,
        };
      }
    }));

    return {
      enabled: true,
      requestedAt: Math.floor(Date.now() / 1000),
      totalPlatforms: rows.length,
      successPlatforms: rows.filter(item => item.ok).length,
      failedPlatforms: rows.filter(item => !item.ok).length,
      platforms: rows,
    };
  }
}

module.exports = DailyHotService;
