/**
 * @copyright Tomda (https://www.tomda.top)
 * @copyright UIED技术团队 (https://fsuied.com)
 * @author UIED技术团队
 * @createDate 2026.1.27
 */
'use strict';

const Service = require('egg').Service;
const md5 = require('md5');
const Sequelize = require('sequelize');
const moment = require('moment');
const Op = Sequelize.Op;
const urlUtil = require('../util/urlUtil');
const parser = require('ua-parser-js');
const extendConfig = require('../extend/config');
const safeJsonParse = (value, fallback) => {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch (err) {
    return fallback;
  }
};

const DEFAULT_VIP_CONFIG = {
  vipMonth: {
    skuId: 'vip_month',
    level: 1,
    name: 'VIP月卡',
    price: '29.90',
    originalPrice: '39.90',
    duration: 30,
    desc: '畅享30天会员权益',
  },
  vipYear: {
    skuId: 'vip_year',
    level: 1,
    name: 'VIP年卡',
    price: '299.00',
    originalPrice: '399.00',
    duration: 365,
    desc: '畅享365天会员权益，送权益券包',
  },
  svipMonth: {
    skuId: 'svip_month',
    level: 2,
    name: 'SVIP月卡',
    price: '99.00',
    originalPrice: '129.00',
    duration: 30,
    desc: '尊享SVIP专属权益',
  },
  svipYear: {
    skuId: 'svip_year',
    level: 2,
    name: 'SVIP年卡',
    price: '999.00',
    originalPrice: '1299.00',
    duration: 365,
    desc: '尊享SVIP专属权益，送权益券包',
  },
};

const normalizeVipGoodsItem = (item, defaults) => {
  const source = { ...defaults, ...(item || {}) };
  const price = Number(source.price ?? 0);
  const original = Number((source.originalPrice ?? price) ?? 0);
  const duration = Number((source.duration ?? defaults.duration) ?? 0);
  return {
    skuId: source.skuId,
    level: Number(source.level || defaults.level || 1),
    name: source.name || defaults.name,
    price: price.toFixed(2),
    originalPrice: original.toFixed(2),
    duration,
    desc: source.desc || defaults.desc || '',
  };
};

class UserService extends Service {
  /**
   * 检查模型是否已注册（用于兼容裁剪版后端）
   */
  hasModel(modelName = '') {
    const { ctx } = this;
    return Boolean(ctx?.model && ctx.model[String(modelName || '')]);
  }

  /**
   * 检查服务是否已注册（用于兼容裁剪版后端）
   */
  hasService(serviceName = '') {
    const { ctx } = this;
    return Boolean(ctx?.service && ctx.service[String(serviceName || '')]);
  }

  /**
   * 确保表字段存在（兼容不支持 IF NOT EXISTS 的 MySQL 版本）
   */
  async ensureTableColumn(tableName, columnName, addColumnSql) {
    const { ctx } = this;
    const [ rows ] = await ctx.model.query(
      `
      SELECT COUNT(1) AS cnt
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ?
        AND COLUMN_NAME = ?
      `,
      {
        replacements: [ String(tableName || ''), String(columnName || '') ],
      }
    );
    const exists = Number(rows?.[0]?.cnt || 0) > 0;
    if (exists) return true;
    await ctx.model.query(addColumnSql);
    return true;
  }

  /**
   * 读取 la_user 表字段集合（用于兼容不同版本数据库结构）
   */
  async getUserTableColumns() {
    if (this._userTableColumns instanceof Set) {
      return this._userTableColumns;
    }
    const { ctx } = this;
    try {
      const rows = await ctx.model.query(
        `
        SELECT COLUMN_NAME
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'la_user'
        `,
        { type: ctx.app.Sequelize.QueryTypes.SELECT }
      );
      this._userTableColumns = new Set(
        (Array.isArray(rows) ? rows : []).map(item => String(item?.COLUMN_NAME || ''))
      );
    } catch (error) {
      ctx.logger.warn(`[user] 获取 la_user 字段集合失败: ${error.message || error}`);
      this._userTableColumns = new Set();
    }
    return this._userTableColumns;
  }

  /**
   * 判断 la_user 是否包含指定字段（支持蛇形/驼峰兼容）
   */
  async hasUserColumn(candidates = []) {
    const columns = await this.getUserTableColumns();
    const list = Array.isArray(candidates) ? candidates : [ candidates ];
    return list.some(item => columns.has(String(item || '').trim()));
  }

  /**
   * 读取指定数据表字段集合（兼容不同客户库结构）
   * @param {string} tableName 数据表名
   * @returns {Promise<Set<string>>} 字段集合
   */
  async getTableColumns(tableName = '') {
    const normalizedTableName = String(tableName || '').trim();
    if (!normalizedTableName) {
      return new Set();
    }
    if (!(this._tableColumnCache instanceof Map)) {
      this._tableColumnCache = new Map();
    }
    if (this._tableColumnCache.has(normalizedTableName)) {
      return this._tableColumnCache.get(normalizedTableName);
    }
    const { ctx } = this;
    try {
      const rows = await ctx.model.query(
        `
        SELECT COLUMN_NAME
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = ?
        `,
        {
          replacements: [ normalizedTableName ],
          type: ctx.app.Sequelize.QueryTypes.SELECT,
        }
      );
      const columns = new Set(
        (Array.isArray(rows) ? rows : []).map(item => String(item?.COLUMN_NAME || ''))
      );
      this._tableColumnCache.set(normalizedTableName, columns);
      return columns;
    } catch (error) {
      ctx.logger.warn(`[user] 获取表 ${normalizedTableName} 字段集合失败: ${error.message || error}`);
      const fallback = new Set();
      this._tableColumnCache.set(normalizedTableName, fallback);
      return fallback;
    }
  }

  /**
   * 判断指定数据表是否包含目标字段（支持候选字段名）
   * @param {string} tableName 数据表名
   * @param {string|string[]} candidates 候选字段名
   * @returns {Promise<boolean>} 是否存在
   */
  async hasTableColumn(tableName = '', candidates = []) {
    const columns = await this.getTableColumns(tableName);
    const list = Array.isArray(candidates) ? candidates : [ candidates ];
    return list.some(item => columns.has(String(item || '').trim()));
  }

  /**
   * 返回数据表中第一个存在的字段名
   * @param {string} tableName 数据表名
   * @param {string|string[]} candidates 候选字段名
   * @returns {Promise<string>} 已存在字段名
   */
  async resolveExistingColumn(tableName = '', candidates = []) {
    const columns = await this.getTableColumns(tableName);
    const list = Array.isArray(candidates) ? candidates : [ candidates ];
    const match = list.find(item => columns.has(String(item || '').trim()));
    return String(match || '').trim();
  }

  /**
   * 判断是否为个人中心演示数据自动补齐账号
   * @param {string} username 用户名
   * @returns {boolean} 是否命中演示账号
   */
  isPersonalCenterSeedUser(username = '') {
    const normalized = String(username || '').trim().toLowerCase();
    if (!normalized) return false;
    return normalized === 'tomda' || normalized.startsWith('uied_test_');
  }

  /**
   * 获取用户扩展业务字段可用状态
   */
  async getUserBusinessColumns() {
    if (this._userBusinessColumns) {
      return this._userBusinessColumns;
    }
    this._userBusinessColumns = {
      email: await this.hasUserColumn([ 'email' ]),
      groupId: await this.hasUserColumn([ 'group_id', 'groupId' ]),
      vipLevel: await this.hasUserColumn([ 'vip_level', 'vipLevel' ]),
      vipExpireTime: await this.hasUserColumn([ 'vip_expire_time', 'vipExpireTime' ]),
      remark: await this.hasUserColumn([ 'remark' ]),
    };
    return this._userBusinessColumns;
  }

  /**
   * 规范化用户身份值
   */
  normalizeUserType(input) {
    const value = Number(input);
    if (![ 0, 1, 2 ].includes(value)) return 0;
    return value;
  }

  /**
   * 获取用户身份文案
   */
  getUserTypeLabel(userType) {
    const value = this.normalizeUserType(userType);
    if (value === 1) return '作者';
    if (value === 2) return '编辑';
    return '普通用户';
  }

  /**
   * 获取性别文案
   */
  getSexLabel(sex) {
    const value = Number(sex || 0);
    if (value === 1) return '男';
    if (value === 2) return '女';
    return '未知';
  }

  /**
   * 获取注册来源文案
   */
  getChannelLabel(channel) {
    const channelMap = {
      1: '微信小程序',
      2: '微信公众号',
      3: '手机H5',
      4: '电脑PC',
      5: '苹果APP',
      6: '安卓APP',
    };
    return channelMap[Number(channel || 0)] || '未知';
  }

  /**
   * Unix 时间戳转标准时间字符串
   */
  formatUnixTime(timestamp) {
    const value = Number(timestamp || 0);
    if (!value) return '-';
    return moment(value * 1000).format('YYYY-MM-DD HH:mm:ss');
  }

  /**
   * 手机号脱敏
   */
  getMaskedMobile(mobile) {
    const value = String(mobile || '').trim();
    if (!value) return '';
    if (value.length < 7) return value;
    return `${value.slice(0, 3)}****${value.slice(-4)}`;
  }

  /**
   * 统一用户头像路径（兼容历史默认头像路径）
   */
  normalizeUserAvatar(avatar) {
    const value = String(avatar || '').trim();
    if (!value || value.includes('default_avatar.png')) {
      return '/api/static/backend_avatar.png';
    }
    return value;
  }

  /**
   * 确保用户身份表存在（兼容历史库）
   */
  async ensureUserIdentityTable() {
    const { ctx, app } = this;
    if (app.__userIdentityTableReady) return true;
    try {
      await ctx.model.query(`
        CREATE TABLE IF NOT EXISTS \`la_user_identity\` (
          \`id\` int unsigned NOT NULL AUTO_INCREMENT,
          \`user_id\` int unsigned NOT NULL DEFAULT 0,
          \`user_type\` tinyint unsigned NOT NULL DEFAULT 0 COMMENT '0普通用户 1作者 2编辑',
          \`is_delete\` tinyint unsigned NOT NULL DEFAULT 0,
          \`create_time\` int unsigned NOT NULL DEFAULT 0,
          \`update_time\` int unsigned NOT NULL DEFAULT 0,
          \`delete_time\` int unsigned NOT NULL DEFAULT 0,
          PRIMARY KEY (\`id\`),
          UNIQUE KEY \`uk_user_id\` (\`user_id\`),
          KEY \`idx_user_type\` (\`user_type\`,\`is_delete\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);
      app.__userIdentityTableReady = true;
      return true;
    } catch (error) {
      ctx.logger.warn(`ensureUserIdentityTable skipped: ${error.message || error}`);
      return false;
    }
  }

  /**
   * 批量获取用户身份映射
   */
  async getUserTypeMap(userIds = []) {
    const { ctx } = this;
    const ids = Array.from(new Set((Array.isArray(userIds) ? userIds : [])
      .map(id => Number(id || 0))
      .filter(Boolean)));
    const map = new Map();
    if (!ids.length) return map;
    const ready = await this.ensureUserIdentityTable();
    if (!ready) return map;
    const rows = await ctx.model.UserIdentity.findAll({
      where: {
        user_id: { [Op.in]: ids },
        is_delete: 0,
      },
      attributes: [ 'user_id', 'user_type' ],
    }).catch(() => []);
    rows.forEach(item => {
      map.set(Number(item.user_id || 0), this.normalizeUserType(item.user_type));
    });
    return map;
  }

  /**
   * 设置用户身份（普通/作者/编辑）
   */
  async setUserType(userId, userType) {
    const { ctx } = this;
    const uid = Number(userId || 0);
    if (!uid) throw new Error('用户ID不能为空');
    const nextType = this.normalizeUserType(userType);
    const ready = await this.ensureUserIdentityTable();
    if (!ready) throw new Error('用户身份服务初始化失败');
    const now = Math.floor(Date.now() / 1000);
    const exists = await ctx.model.UserIdentity.findOne({
      where: { user_id: uid },
      attributes: [ 'id' ],
    });
    if (exists) {
      await ctx.model.UserIdentity.update({
        user_type: nextType,
        is_delete: 0,
        delete_time: 0,
        update_time: now,
      }, {
        where: { id: Number(exists.id || 0) },
      });
      return;
    }
    await ctx.model.UserIdentity.create({
      user_id: uid,
      user_type: nextType,
      is_delete: 0,
      create_time: now,
      update_time: now,
      delete_time: 0,
    });
  }

  /**
   * 作者选择器下拉（支持关键词搜索和身份筛选）
   */
  async authorOptions(params = {}) {
    const { ctx } = this;
    const keyword = String(params.keyword || '').trim();
    const typeFilterRaw = params.userType;
    const hasTypeFilter = typeFilterRaw !== undefined && typeFilterRaw !== null && typeFilterRaw !== '';
    const typeFilter = this.normalizeUserType(typeFilterRaw);
    const pageSize = Number(params.pageSize || 20);
    const limit = Math.max(1, Math.min(50, pageSize));
    const where = { isDelete: 0 };
    if (keyword) {
      const isNumeric = /^\d+$/.test(keyword);
      const conditions = [
        { nickname: { [Op.like]: `%${keyword}%` } },
        { username: { [Op.like]: `%${keyword}%` } },
        { realName: { [Op.like]: `%${keyword}%` } },
      ];
      if (isNumeric) {
        conditions.unshift({ id: Number(keyword) });
      }
      where[Op.or] = conditions;
    }

    const rows = await ctx.model.User.findAll({
      where,
      attributes: [ 'id', 'nickname', 'username', 'realName' ],
      order: [[ 'id', 'DESC' ]],
      limit,
    });
    const ids = rows.map(item => Number(item.id || 0)).filter(Boolean);
    const userTypeMap = await this.getUserTypeMap(ids);
    const lists = rows
      .map(item => {
        const id = Number(item.id || 0);
        const userType = userTypeMap.has(id) ? userTypeMap.get(id) : 0;
        return {
          id,
          nickname: String(item.nickname || ''),
          username: String(item.username || ''),
          realName: String(item.realName || ''),
          userType,
          userTypeName: this.getUserTypeLabel(userType),
          label: `${item.nickname || item.username || item.realName || `用户${id}`}（ID:${id}）`,
          value: String(id),
        };
      })
      .filter(item => {
        if (!hasTypeFilter) return true;
        return Number(item.userType || 0) === typeFilter;
      });
    return lists;
  }

  /**
   * 确保作者资料表存在（兼容历史库）
   */
  async ensureUserAuthorProfileTable() {
    const { ctx, app } = this;
    if (app.__userAuthorProfileTableReady) return true;
    try {
      await ctx.model.query(`
        CREATE TABLE IF NOT EXISTS \`la_user_author_profile\` (
          \`id\` int unsigned NOT NULL AUTO_INCREMENT,
          \`user_id\` int unsigned NOT NULL DEFAULT 0,
          \`display_name\` varchar(64) NOT NULL DEFAULT '',
          \`bio\` varchar(255) NOT NULL DEFAULT '',
          \`homepage\` varchar(200) NOT NULL DEFAULT '',
          \`xiaohongshu\` varchar(200) NOT NULL DEFAULT '',
          \`weibo\` varchar(200) NOT NULL DEFAULT '',
          \`is_public\` tinyint unsigned NOT NULL DEFAULT 1,
          \`is_delete\` tinyint unsigned NOT NULL DEFAULT 0,
          \`create_time\` int unsigned NOT NULL DEFAULT 0,
          \`update_time\` int unsigned NOT NULL DEFAULT 0,
          \`delete_time\` int unsigned NOT NULL DEFAULT 0,
          PRIMARY KEY (\`id\`),
          UNIQUE KEY \`uk_user_id\` (\`user_id\`),
          KEY \`idx_public_delete\` (\`is_public\`,\`is_delete\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);
      // 兼容历史库，补齐社交平台字段
      await this.ensureTableColumn(
        'la_user_author_profile',
        'xiaohongshu',
        "ALTER TABLE `la_user_author_profile` ADD COLUMN `xiaohongshu` varchar(200) NOT NULL DEFAULT '' AFTER `homepage`;"
      );
      await this.ensureTableColumn(
        'la_user_author_profile',
        'weibo',
        "ALTER TABLE `la_user_author_profile` ADD COLUMN `weibo` varchar(200) NOT NULL DEFAULT '' AFTER `xiaohongshu`;"
      );
      app.__userAuthorProfileTableReady = true;
      return true;
    } catch (error) {
      ctx.logger.warn(`ensureUserAuthorProfileTable skipped: ${error.message || error}`);
      return false;
    }
  }

  /**
   * 确保用户中心扩展表存在（分组/标签/等级）
   */
  async ensureUserCenterMetaTables() {
    const { ctx, app } = this;
    if (app.__userCenterMetaTablesReady) return true;
    try {
      await ctx.model.query(`
        CREATE TABLE IF NOT EXISTS \`la_user_group\` (
          \`id\` int unsigned NOT NULL AUTO_INCREMENT,
          \`name\` varchar(64) NOT NULL DEFAULT '',
          \`remark\` varchar(255) NOT NULL DEFAULT '',
          \`sort\` int unsigned NOT NULL DEFAULT 0,
          \`is_delete\` tinyint unsigned NOT NULL DEFAULT 0,
          \`create_time\` int unsigned NOT NULL DEFAULT 0,
          \`update_time\` int unsigned NOT NULL DEFAULT 0,
          \`delete_time\` int unsigned NOT NULL DEFAULT 0,
          PRIMARY KEY (\`id\`),
          KEY \`idx_sort_delete\` (\`sort\`, \`is_delete\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);
      await ctx.model.query(`
        CREATE TABLE IF NOT EXISTS \`la_user_tag\` (
          \`id\` int unsigned NOT NULL AUTO_INCREMENT,
          \`name\` varchar(64) NOT NULL DEFAULT '',
          \`color\` varchar(32) NOT NULL DEFAULT '#409EFF',
          \`is_delete\` tinyint unsigned NOT NULL DEFAULT 0,
          \`create_time\` int unsigned NOT NULL DEFAULT 0,
          \`update_time\` int unsigned NOT NULL DEFAULT 0,
          \`delete_time\` int unsigned NOT NULL DEFAULT 0,
          PRIMARY KEY (\`id\`),
          KEY \`idx_delete\` (\`is_delete\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);
      await ctx.model.query(`
        CREATE TABLE IF NOT EXISTS \`la_user_tag_rel\` (
          \`id\` int unsigned NOT NULL AUTO_INCREMENT,
          \`user_id\` int unsigned NOT NULL DEFAULT 0,
          \`tag_id\` int unsigned NOT NULL DEFAULT 0,
          \`create_time\` int unsigned NOT NULL DEFAULT 0,
          PRIMARY KEY (\`id\`),
          UNIQUE KEY \`uk_user_tag\` (\`user_id\`, \`tag_id\`),
          KEY \`idx_user_id\` (\`user_id\`),
          KEY \`idx_tag_id\` (\`tag_id\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);
      await ctx.model.query(`
        CREATE TABLE IF NOT EXISTS \`la_user_level\` (
          \`id\` int unsigned NOT NULL AUTO_INCREMENT,
          \`name\` varchar(64) NOT NULL DEFAULT '',
          \`level_value\` int unsigned NOT NULL DEFAULT 0,
          \`remark\` varchar(255) NOT NULL DEFAULT '',
          \`is_default\` tinyint unsigned NOT NULL DEFAULT 0,
          \`is_delete\` tinyint unsigned NOT NULL DEFAULT 0,
          \`create_time\` int unsigned NOT NULL DEFAULT 0,
          \`update_time\` int unsigned NOT NULL DEFAULT 0,
          \`delete_time\` int unsigned NOT NULL DEFAULT 0,
          PRIMARY KEY (\`id\`),
          KEY \`idx_level_delete\` (\`level_value\`, \`is_delete\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);

      // 初始化售卖版默认等级（Free / Pro / Enterprise）
      await ctx.model.query(`
        INSERT INTO \`la_user_level\` (\`name\`, \`level_value\`, \`remark\`, \`is_default\`, \`is_delete\`, \`create_time\`, \`update_time\`, \`delete_time\`)
        SELECT 'Free', 0, '基础版（默认）', 1, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP(), 0
        FROM DUAL
        WHERE NOT EXISTS (
          SELECT 1 FROM \`la_user_level\` WHERE \`level_value\` = 0 AND \`is_delete\` = 0
        );
      `);
      await ctx.model.query(`
        INSERT INTO \`la_user_level\` (\`name\`, \`level_value\`, \`remark\`, \`is_default\`, \`is_delete\`, \`create_time\`, \`update_time\`, \`delete_time\`)
        SELECT 'Pro', 1, '专业版', 0, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP(), 0
        FROM DUAL
        WHERE NOT EXISTS (
          SELECT 1 FROM \`la_user_level\` WHERE \`level_value\` = 1 AND \`is_delete\` = 0
        );
      `);
      await ctx.model.query(`
        INSERT INTO \`la_user_level\` (\`name\`, \`level_value\`, \`remark\`, \`is_default\`, \`is_delete\`, \`create_time\`, \`update_time\`, \`delete_time\`)
        SELECT 'Enterprise', 2, '企业版', 0, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP(), 0
        FROM DUAL
        WHERE NOT EXISTS (
          SELECT 1 FROM \`la_user_level\` WHERE \`level_value\` = 2 AND \`is_delete\` = 0
        );
      `);

      app.__userCenterMetaTablesReady = true;
      return true;
    } catch (error) {
      ctx.logger.warn(`ensureUserCenterMetaTables skipped: ${error.message || error}`);
      return false;
    }
  }

  /**
   * 格式化作者展示资料
   */
  formatAuthorProfile(user, profile, forcePublic = false) {
    const userId = Number(user?.id || 0);
    const nickname = String(profile?.display_name || user?.nickname || user?.username || '');
    const avatar = urlUtil.toAbsoluteUrl(this.normalizeUserAvatar(user?.avatar));
    const isPublic = Number(profile?.is_public ?? 1) === 1 ? 1 : 0;
    const bio = isPublic || !forcePublic ? String(profile?.bio || '') : '';
    const homepage = isPublic || !forcePublic ? String(profile?.homepage || '') : '';
    const xiaohongshu = isPublic || !forcePublic ? String(profile?.xiaohongshu || '') : '';
    const weibo = isPublic || !forcePublic ? String(profile?.weibo || '') : '';
    return {
      userId,
      nickname,
      avatar,
      bio,
      homepage,
      xiaohongshu,
      weibo,
      isPublic,
    };
  }

  /**
   * 批量获取作者资料映射（给文章列表/详情复用）
   */
  async getAuthorProfileMap(userIds = [], forcePublic = false) {
    const { ctx } = this;
    const ids = Array.from(new Set((Array.isArray(userIds) ? userIds : [])
      .map(id => Number(id || 0))
      .filter(Boolean)));
    const map = new Map();
    if (!ids.length) return map;

    await this.ensureUserAuthorProfileTable();
    const [ users, profiles ] = await Promise.all([
      ctx.model.User.findAll({
        where: { id: { [Op.in]: ids }, isDelete: 0 },
        attributes: [ 'id', 'nickname', 'username', 'avatar' ],
      }),
      ctx.model.UserAuthorProfile.findAll({
        where: { user_id: { [Op.in]: ids }, is_delete: 0 },
        attributes: [ 'user_id', 'display_name', 'bio', 'homepage', 'xiaohongshu', 'weibo', 'is_public' ],
      }).catch(() => []),
    ]);
    const profileMap = new Map(profiles.map(item => [ Number(item.user_id || 0), item ]));
    users.forEach(user => {
      const userId = Number(user.id || 0);
      const profile = profileMap.get(userId);
      map.set(userId, this.formatAuthorProfile(user, profile, forcePublic));
    });
    return map;
  }

  /**
   * 计算并校准用户钱包余额（按流水汇总）
   */
  async calcWalletBalance(userId) {
    const { ctx } = this;
    const totalRecharge = await ctx.model.UserWalletFlow.sum('amount', {
      where: { userId, flowType: 'recharge' },
    }) || 0;
    const totalSpend = await ctx.model.UserWalletFlow.sum('amount', {
      where: { userId, flowType: 'consume' },
    }) || 0;
    const balanceValue = Number(totalRecharge || 0) - Number(totalSpend || 0);
    let wallet = await ctx.model.UserWallet.findOne({ where: { userId } });
    if (!wallet) {
      wallet = await ctx.model.UserWallet.create({ userId, balance: 0 });
    }
    const now = Math.floor(Date.now() / 1000);
    if (Number(wallet.balance || 0) !== balanceValue) {
      await ctx.model.UserWallet.update({
        balance: balanceValue,
        updateTime: now,
      }, {
        where: { userId },
      });
    }
    return Number(balanceValue || 0);
  }
  /**
   * 获取应用配置
   */
  getAppConfig() {
    return this.config || (this.app && this.app.config) || extendConfig;
  }

  /**
   * 提取前台用户 token（兼容 token 头与 Authorization Bearer）
   */
  extractUserTokenFromRequest() {
    const { ctx } = this;
    const tokenHeader = String(ctx.request.header.token || '').trim();
    if (tokenHeader) {
      return tokenHeader;
    }
    const authHeader = String(
      ctx.request.header.authorization || ctx.request.header.Authorization || ''
    ).trim();
    if (!authHeader) {
      return '';
    }
    const bearerMatch = authHeader.match(/^Bearer\s+(.+)$/i);
    if (bearerMatch && bearerMatch[1]) {
      return String(bearerMatch[1]).trim();
    }
    return authHeader;
  }

  /**
   * 构建对外安全的用户信息（去除密码等敏感字段）
   */
  buildSafeUserInfo(user) {
    const row = user && typeof user.toJSON === 'function' ? user.toJSON() : (user || {});
    return {
      id: Number(row.id || 0),
      sn: Number(row.sn || 0),
      username: String(row.username || ''),
      nickname: String(row.nickname || ''),
      realName: String(row.realName || ''),
      avatar: urlUtil.toAbsoluteUrl(this.normalizeUserAvatar(row.avatar)),
      mobile: String(row.mobile || ''),
      sex: Number(row.sex || 0),
      isDisable: Number(row.isDisable || 0),
      createTime: Number(row.createTime || 0),
      updateTime: Number(row.updateTime || 0),
      lastLoginTime: Number(row.lastLoginTime || 0),
    };
  }

  /**
   * 计算用户资料完善度（用于个人中心展示）
   */
  buildProfileCompletion(data = {}) {
    const fields = [
      { key: 'avatar', label: '头像', value: data.avatar },
      { key: 'nickname', label: '昵称', value: data.nickname },
      { key: 'mobile', label: '手机号', value: data.mobile },
    ];
    const missingFields = fields.filter(item => !item.value).map(item => item.label);
    const completeCount = fields.length - missingFields.length;
    return {
      rate: fields.length === 0 ? 0 : Math.round((completeCount / fields.length) * 100),
      missingFields,
    };
  }

  /**
   * 获取安全用户信息（附带身份类型信息）
   */
  async getSafeUserInfoById(userId, withProfileCompletion = false) {
    const { ctx } = this;
    const uid = Number(userId || 0);
    if (!uid) {
      throw new Error('用户不存在');
    }
    const user = await ctx.model.User.findOne({
      where: { id: uid, isDelete: 0 },
    });
    if (!user) {
      throw new Error('用户不存在');
    }
    const data = this.buildSafeUserInfo(user);
    const userTypeMap = await this.getUserTypeMap([ data.id ]);
    const userType = this.normalizeUserType(userTypeMap.get(data.id) || 0);
    data.userType = userType;
    data.userTypeName = this.getUserTypeLabel(userType);
    if (withProfileCompletion) {
      data.profileCompletion = this.buildProfileCompletion(data);
    }
    return data;
  }

  /**
   * 同步用户缓存信息
   */
  async syncUserCache(userId) {
    const { ctx } = this;
    const user = await ctx.model.User.findOne({ where: { id: userId, isDelete: 0 } });
    if (!user) return;
    const safeUser = this.buildSafeUserInfo(user);
    const appConfig = this.getAppConfig();
    const userInfoKey = appConfig.userInfoKey || extendConfig.userInfoKey;
    await ctx.service.redis.set(userInfoKey + user.id, JSON.stringify(safeUser));
  }

  /**
   * 获取前台用户 token 有效期（秒）
   */
  getUserTokenTtlSeconds() {
    const appConfig = this.getAppConfig();
    const fromConfig = Number(appConfig.userTokenTtlSeconds || appConfig.userTokenTtl || 0);
    if (Number.isFinite(fromConfig) && fromConfig > 300) {
      return Math.floor(fromConfig);
    }
    // 默认 7 天
    return 7 * 24 * 60 * 60;
  }

  /**
   * 计算 token 续签阈值（秒）
   */
  getUserTokenRefreshThresholdSeconds(ttlSeconds) {
    const ttl = Number(ttlSeconds || 0);
    if (!Number.isFinite(ttl) || ttl <= 0) return 1800;
    return Math.max(1800, Math.floor(ttl / 3));
  }

  /**
   * 构建用户登录会话缓存键
   * @param {string} token 用户登录令牌
   * @return {string} Redis 会话键
   */
  getUserSessionRedisKey(token = '') {
    return `user:session:${String(token || '').trim()}`;
  }

  /**
   * 生成当前请求对应的设备名称
   * @param {object} uaInfo UA 解析结果
   * @return {string} 设备名称
   */
  resolveLoginDeviceName(uaInfo = {}) {
    const browserName = String(uaInfo?.browser?.name || '').trim();
    const browserVersion = String(uaInfo?.browser?.version || '').trim();
    const osName = String(uaInfo?.os?.name || '').trim();
    const osVersion = String(uaInfo?.os?.version || '').trim();
    const browserText = browserName ? `${browserName}${browserVersion ? ` ${browserVersion}` : ''}` : '未知浏览器';
    const osText = osName ? `${osName}${osVersion ? ` ${osVersion}` : ''}` : '未知系统';
    return `${browserText} · ${osText}`;
  }

  /**
   * 构建并缓存用户会话数据
   * @param {object} user 用户信息
   * @param {string} token 登录令牌
   * @param {object} options 额外配置
   * @return {object} 会话对象
   */
  buildUserSessionPayload(user, token, options = {}) {
    const { ctx } = this;
    const now = Math.floor(Date.now() / 1000);
    const uaInfo = parser(ctx.request.header['user-agent'] || '');
    return {
      sessionId: String(options.sessionId || ctx.randomString()),
      token: String(token || ''),
      userId: Number(user?.id || 0),
      ip: String(ctx.request.ip || ''),
      userAgent: String(ctx.request.header['user-agent'] || ''),
      os: uaInfo?.os || {},
      browser: uaInfo?.browser || {},
      device: this.resolveLoginDeviceName(uaInfo),
      loginType: String(options.loginType || 'password'),
      twoFactorVerified: Number(options.twoFactorVerified === false ? 0 : 1),
      createTime: now,
      lastActiveTime: now,
    };
  }

  /**
   * 读取当前 token 对应的会话对象
   * @param {string} token 登录令牌
   * @return {Promise<object|null>} 会话对象
   */
  async getUserSessionByToken(token = '') {
    const { ctx } = this;
    const key = this.getUserSessionRedisKey(token);
    const session = await ctx.service.redis.get(key);
    if (!session || typeof session !== 'object') {
      return null;
    }
    return session;
  }

  /**
   * 更新会话最近活跃时间
   * @param {string} token 登录令牌
   * @param {number} ttlSeconds 会话 TTL
   */
  async refreshUserSessionActiveTime(token, ttlSeconds) {
    const { ctx } = this;
    const session = await this.getUserSessionByToken(token);
    if (!session) {
      return;
    }
    const now = Math.floor(Date.now() / 1000);
    session.lastActiveTime = now;
    await ctx.service.redis.set(this.getUserSessionRedisKey(token), session, ttlSeconds);
  }

  /**
   * 删除 token 对应登录会话
   * @param {string} token 登录令牌
   */
  async removeUserSessionByToken(token = '') {
    const { ctx } = this;
    if (!token) return;
    await ctx.service.redis.del(this.getUserSessionRedisKey(token));
  }

  /**
   * 缓存前台用户 token 映射并写入 TTL
   */
  async cacheUserTokenSession(token, user, options = {}) {
    const { ctx } = this;
    if (!token || !user || !user.id) return;
    const appConfig = this.getAppConfig();
    const userTokenKey = appConfig.userTokenKey || extendConfig.userTokenKey;
    const userTokenSet = appConfig.userTokenSet || extendConfig.userTokenSet;
    const userInfoKey = appConfig.userInfoKey || extendConfig.userInfoKey;
    const tokenTtlSeconds = this.getUserTokenTtlSeconds();
    const key = userTokenKey + token;
    const setKey = userTokenSet + user.id;
    await ctx.service.redis.set(key, user.id, tokenTtlSeconds);
    if (ctx.app.redis) {
      await ctx.app.redis.sadd(setKey, token);
      await ctx.app.redis.expire(setKey, tokenTtlSeconds);
    }
    const sessionPayload = this.buildUserSessionPayload(user, token, options);
    await ctx.service.redis.set(this.getUserSessionRedisKey(token), sessionPayload, tokenTtlSeconds);
    const safeUser = this.buildSafeUserInfo(user);
    await ctx.service.redis.set(userInfoKey + user.id, JSON.stringify(safeUser));
  }

  /**
   * Redis 丢失时尝试通过 token 解密恢复用户会话
   */
  async tryRestoreUserSessionByToken(token) {
    const { ctx } = this;
    if (!token) return 0;
    let decoded = {};
    try {
      const decodedRaw = ctx.getDecodeToken(token);
      decoded = safeJsonParse(decodedRaw, {});
    } catch (error) {
      return 0;
    }
    const sn = Number(decoded?.username || 0);
    const password = String(decoded?.password || '').trim();
    if (!sn || !password) return 0;
    const user = await ctx.model.User.findOne({
      where: {
        sn,
        password,
        isDelete: 0,
      },
    });
    if (!user || Number(user.isDisable || 0) === 1) return 0;
    /**
     * 安全策略：当账号已启用 2FA 时，不允许仅凭解密 token 在 Redis 丢失后自动恢复会话。
     * 需要重新走登录 + 2FA 验证链路。
     */
    const securityRow = await this.getUserSecurityRow(Number(user.id || 0)).catch(() => null);
    if (Number(securityRow?.two_fa_enabled || 0) === 1) {
      return 0;
    }
    await this.cacheUserTokenSession(token, user);
    return Number(user.id || 0);
  }

  /**
   * 生成用户令牌
   */
  async createUserToken(user, options = {}) {
    const { ctx } = this;
    const token = ctx.setToken({
      username: user.sn,
      password: user.password,
    });
    await this.cacheUserTokenSession(token, user, options);
    return token;
  }

  /**
   * 获取用户ID
   */
  async getUserId() {
    const { ctx } = this;
    const appConfig = this.getAppConfig();
    const token = this.extractUserTokenFromRequest();
    if (!token) {
      throw new Error('未登录');
    }
    const userTokenKey = appConfig.userTokenKey || extendConfig.userTokenKey;
    const tokenKey = userTokenKey + token;
    let uid = await ctx.service.redis.get(tokenKey);
    if (!uid) {
      const restoredUid = await this.tryRestoreUserSessionByToken(token);
      if (restoredUid > 0) {
        uid = String(restoredUid);
      }
    }
    if (!uid) {
      throw new Error('登录已失效');
    }
    const session = await this.getUserSessionByToken(token);
    if (session && Number(session.userId || 0) === Number(uid || 0) && Number(session.twoFactorVerified || 0) !== 1) {
      throw new Error('当前登录需要完成二次验证');
    }
    const tokenTtlSeconds = this.getUserTokenTtlSeconds();
    const refreshThreshold = this.getUserTokenRefreshThresholdSeconds(tokenTtlSeconds);
    const remainTtl = Number(await ctx.service.redis.ttl(tokenKey) || -1);
    if (remainTtl > 0 && remainTtl < refreshThreshold) {
      await ctx.service.redis.expire(tokenKey, tokenTtlSeconds);
    }
    await this.refreshUserSessionActiveTime(token, tokenTtlSeconds);
    return parseInt(uid, 10);
  }

  /**
   * 退出登录（清理当前 token）
   */
  async logout() {
    const { ctx } = this;
    const token = this.extractUserTokenFromRequest();
    if (!token) {
      return true;
    }
    const appConfig = this.getAppConfig();
    const userTokenKey = appConfig.userTokenKey || extendConfig.userTokenKey;
    const userTokenSet = appConfig.userTokenSet || extendConfig.userTokenSet;
    const userInfoKey = appConfig.userInfoKey || extendConfig.userInfoKey;
    const tokenKey = userTokenKey + token;
    const uid = await ctx.service.redis.get(tokenKey);
    await ctx.service.redis.del(tokenKey);
    await this.removeUserSessionByToken(token);
    const userId = Number(uid || 0);
    if (!userId) {
      return true;
    }
    if (ctx.app.redis) {
      await ctx.app.redis.srem(userTokenSet + userId, token);
      const remain = await ctx.app.redis.scard(userTokenSet + userId);
      if (!remain) {
        await ctx.app.redis.del(userTokenSet + userId);
        await ctx.app.redis.del(userInfoKey + userId);
      }
    } else {
      await ctx.service.redis.del(userInfoKey + userId);
    }
    return true;
  }

  /**
   * 作者中心详情（个人中心可编辑）
   */
  async authorCenterDetail(userId) {
    const { ctx } = this;
    const uid = Number(userId || 0);
    if (!uid) throw new Error('用户不存在');
    await this.ensureUserAuthorProfileTable();
    const user = await ctx.model.User.findOne({
      where: { id: uid, isDelete: 0 },
      attributes: [ 'id', 'nickname', 'username', 'avatar' ],
    });
    if (!user) throw new Error('用户不存在');
    const profile = await ctx.model.UserAuthorProfile.findOne({
      where: { user_id: uid, is_delete: 0 },
    });
    return this.formatAuthorProfile(user, profile, false);
  }

  /**
   * 保存作者中心资料（个人中心编辑）
   */
  async authorCenterSave(userId, params = {}) {
    const { ctx } = this;
    const uid = Number(userId || 0);
    if (!uid) throw new Error('用户不存在');
    await this.ensureUserAuthorProfileTable();
    const now = Math.floor(Date.now() / 1000);
    const displayName = String(params.displayName || '').trim().slice(0, 64);
    const bio = String(params.bio || '').trim().slice(0, 255);
    const homepage = String(params.homepage || '').trim().slice(0, 200);
    const xiaohongshu = String(params.xiaohongshu || '').trim().slice(0, 200);
    const weibo = String(params.weibo || '').trim().slice(0, 200);
    const isPublic = Number(params.isPublic ?? 1) === 1 ? 1 : 0;

    const exists = await ctx.model.UserAuthorProfile.findOne({
      where: { user_id: uid },
    });
    if (exists) {
      await ctx.model.UserAuthorProfile.update({
        display_name: displayName,
        bio,
        homepage,
        xiaohongshu,
        weibo,
        is_public: isPublic,
        is_delete: 0,
        delete_time: 0,
        update_time: now,
      }, {
        where: { id: Number(exists.id || 0) },
      });
    } else {
      await ctx.model.UserAuthorProfile.create({
        user_id: uid,
        display_name: displayName,
        bio,
        homepage,
        xiaohongshu,
        weibo,
        is_public: isPublic,
        is_delete: 0,
        create_time: now,
        update_time: now,
        delete_time: 0,
      });
    }
    return await this.authorCenterDetail(uid);
  }

  /**
   * 作者公开主页详情（对外展示）
   */
  async authorPublicDetail(authorId, params = {}) {
    const { ctx } = this;
    const uid = Number(authorId || 0);
    if (!uid) throw new Error('作者ID不能为空');
    await this.ensureUserAuthorProfileTable();
    await ctx.service.article.ensureArticleAuthorRelTable();
    const user = await ctx.model.User.findOne({
      where: { id: uid, isDelete: 0 },
      attributes: [ 'id', 'nickname', 'username', 'avatar' ],
    });
    if (!user) throw new Error('作者不存在');

    const profile = await ctx.model.UserAuthorProfile.findOne({
      where: { user_id: uid, is_delete: 0 },
      attributes: [ 'user_id', 'display_name', 'bio', 'homepage', 'xiaohongshu', 'weibo', 'is_public' ],
    });
    const author = this.formatAuthorProfile(user, profile, true);
    if (Number(author.isPublic || 0) !== 1) {
      throw new Error('作者主页未公开');
    }

    const rels = await ctx.model.ArticleAuthorRel.findAll({
      where: {
        user_id: uid,
        is_delete: 0,
      },
      attributes: [ 'article_id' ],
      order: [[ 'id', 'DESC' ]],
    }).catch(() => []);
    const articleIds = Array.from(new Set(rels.map(item => Number(item.article_id || 0)).filter(Boolean)));
    const pageNo = Number(params.pageNo || 1);
    const pageSize = Number(params.pageSize || 10);
    const limit = Math.max(1, Math.min(30, pageSize));
    const offset = limit * (Math.max(1, pageNo) - 1);
    const visibleIds = articleIds.length
      ? (await ctx.model.Article.findAll({
        where: {
          id: { [Op.in]: articleIds },
          is_delete: 0,
          is_show: 1,
        },
        attributes: [ 'id' ],
        order: [[ 'id', 'DESC' ]],
      })).map(item => Number(item.id || 0))
      : [];
    const total = visibleIds.length;
    const pageIds = visibleIds.slice(offset, offset + limit);
    const rows = pageIds.length
      ? await ctx.model.Article.findAll({
        where: { id: { [Op.in]: pageIds }, is_delete: 0, is_show: 1 },
        attributes: [ 'id', 'title', 'intro', 'image', 'visit', 'create_time' ],
        order: [[ 'id', 'DESC' ]],
      })
      : [];
    const { collectMap, likeMap, commentMap } = await ctx.service.article.getArticleInteractionStats(pageIds, 0);
    const lists = rows.map(item => ({
      id: Number(item.id || 0),
      title: String(item.title || ''),
      intro: String(item.intro || ''),
      image: item.image ? urlUtil.toAbsoluteUrl(item.image) : '',
      visit: Number(item.visit || 0),
      collectCount: collectMap.get(Number(item.id)) || 0,
      likeCount: likeMap.get(Number(item.id)) || 0,
      commentCount: commentMap.get(Number(item.id)) || 0,
      createTime: moment(Number(item.create_time || 0) * 1000).format('YYYY-MM-DD HH:mm:ss'),
    }));
    return {
      author,
      article: {
        pageNo: Math.max(1, pageNo),
        pageSize: limit,
        total,
        lists,
      },
    };
  }

  /**
   * 用户注册
   */
  async register(params) {
    const { ctx } = this;
    const username = String(params.username || params.account || '').trim();
    const password = String(params.password || '').trim();
    const confirmPassword = String(params.confirmPassword || params.confirm_password || '').trim();
    const nickname = String(params.nickname || username).trim();
    const mobile = String(params.mobile || '').trim();
    if (!username) {
      throw new Error('账号不能为空');
    }
    if (username.length < 3 || username.length > 32) {
      throw new Error('账号长度需在3~32位');
    }
    if (password.length < 6 || password.length > 20) {
      throw new Error('密码长度需在6~20位');
    }
    if (confirmPassword && confirmPassword !== password) {
      throw new Error('两次密码输入不一致');
    }
    const exists = await ctx.model.User.findOne({
      where: { username },
    });
    if (exists) {
      throw new Error('账号已存在');
    }
    const isNumericUsername = /^\d+$/.test(String(username));
    const snValue = isNumericUsername ? parseInt(String(username), 10) : 0;
    const createTime = Math.floor(Date.now() / 1000);
    const user = await ctx.model.User.create({
      sn: snValue,
      password: md5(password),
      nickname: nickname || username,
      username,
      mobile,
      createTime,
      updateTime: createTime,
    });
    if (!isNumericUsername && user && user.id) {
      await ctx.model.User.update({
        sn: user.id,
        updateTime: createTime,
      }, {
        where: { id: user.id },
      });
      user.sn = user.id;
    }
    /**
     * 自动发放优惠券（可选模块，缺失时降级）
     */
    if (this.hasService('coupon') && typeof ctx.service.coupon.grantAutoToUser === 'function') {
      await ctx.service.coupon.grantAutoToUser(user.id);
    } else {
      ctx.logger.warn('[user.register] coupon 服务不存在，跳过自动发券');
    }
    const token = await this.createUserToken(user);
    const userInfo = await this.getSafeUserInfoById(user.id, true);
    return { user: userInfo, userInfo, token };
  }

  /**
   * 用户登录
   */
  async login(params) {
    const { ctx } = this;
    const username = String(params.username || params.account || '').trim();
    const password = String(params.password || '').trim();
    if (!username || !password) {
      throw new Error('账号或密码不能为空');
    }
    const isNumericUsername = /^\d+$/.test(String(username));
    const orConditions = [
      { username },
      { mobile: username },
    ];
    if (isNumericUsername) {
      orConditions.unshift({ sn: parseInt(String(username), 10) });
    }
    const user = await ctx.model.User.findOne({
      where: {
        isDelete: 0,
        [Op.or]: orConditions,
      },
    });
    if (!user) {
      throw new Error('账号不存在');
    }
    if (user.isDisable === 1) {
      throw new Error('账号已禁用');
    }
    if (user.password !== md5(password)) {
      throw new Error('密码错误');
    }
    const challenge = await this.createLoginTwoFactorChallenge(user);
    if (challenge) {
      return {
        need2fa: true,
        challengeToken: challenge.challengeToken,
        method: challenge.method,
        maskedAccount: challenge.maskedAccount,
        expireSeconds: challenge.expireSeconds,
      };
    }
    const now = Math.floor(Date.now() / 1000);
    await ctx.model.User.update({
      lastLoginIp: ctx.request.ip,
      lastLoginTime: now,
      updateTime: now,
    }, {
      where: { id: user.id },
    });
    await this.recordLoginLog(user.id, 1);
    const token = await this.createUserToken(user, {
      loginType: 'password',
      twoFactorVerified: true,
    });
    /**
     * 测试账号登录时自动补齐个人中心演示数据，避免联调空数据误判为接口异常。
     */
    await this.ensurePersonalCenterDemoData(user.id, user.nickname || user.username || '');
    const userInfo = await this.getSafeUserInfoById(user.id, true);
    return { user: userInfo, userInfo, token };
  }

  async recordLoginLog(userId, status = 1) {
    const { ctx } = this;
    try {
      await this.ensureUserLoginLogTable();
      if (!this.hasModel('UserLoginLog')) {
        return;
      }
      const ua = parser(ctx.request.header['user-agent'] || '');
      await ctx.model.UserLoginLog.create({
        userId,
        ip: ctx.request.ip,
        os: JSON.stringify(ua.os || {}),
        browser: JSON.stringify(ua.browser || {}),
        status,
      });
    } catch (err) {
      ctx.logger.error(`UserLoginLog error: ${err}`);
    }
  }

  /**
   * 更新个人资料
   */
  async updateProfile(userId, params) {
    const { ctx } = this;
    const userColumns = await this.getUserBusinessColumns();
    const { nickname, avatar, email } = params;
    const updateData = {};
    if (nickname !== undefined) {
      const nextNickname = String(nickname || '').trim();
      if (!nextNickname) {
        throw new Error('昵称不能为空');
      }
      updateData.nickname = nextNickname.slice(0, 32);
    }
    if (avatar !== undefined) {
      const nextAvatar = String(avatar || '').trim();
      updateData.avatar = nextAvatar ? urlUtil.toRelativeUrl(nextAvatar) : '';
    }
    if (email !== undefined && userColumns.email) {
      const nextEmail = String(email || '').trim();
      if (nextEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nextEmail)) {
        throw new Error('邮箱格式不正确');
      }
      updateData.email = nextEmail;
    }
    if (Object.keys(updateData).length === 0) {
      return await this.getSafeUserInfoById(userId, true);
    }
    const updateTime = Math.floor(Date.now() / 1000);
    await ctx.model.User.update({
      ...updateData,
      updateTime,
    }, {
      where: { id: userId },
    });
    await this.syncUserCache(userId);
    return await this.getSafeUserInfoById(userId, true);
  }

  /**
   * 上传并保存用户头像（前台用户中心）
   */
  async uploadAvatar(userId, stream) {
    const { ctx } = this;
    const uid = Number(userId || 0);
    if (!uid) {
      throw new Error('用户不存在');
    }
    if (!stream) {
      throw new Error('未检测到上传文件');
    }
    const mimeType = String(stream.mimeType || '').toLowerCase();
    if (!mimeType.startsWith('image/')) {
      throw new Error('仅支持上传图片文件');
    }

    /**
     * 前台用户头像上传不依赖后台素材库入库（la_album），避免 aid 场景导致上传失败。
     * 仅保存文件并更新用户头像字段。
     */
    const uploadRes = await ctx.service.album.handleUploadFile(stream, 10);
    const rawUri = String(uploadRes?.url || uploadRes?.path || '').trim();
    const absoluteUri = /^https?:\/\//i.test(rawUri) ? rawUri : urlUtil.toAbsoluteUrl(rawUri);
    const relativeAvatar = urlUtil.toRelativeUrl(absoluteUri);
    if (!relativeAvatar) {
      throw new Error('头像上传失败');
    }

    const now = Math.floor(Date.now() / 1000);
    await ctx.model.User.update({
      avatar: relativeAvatar,
      updateTime: now,
    }, {
      where: { id: uid, isDelete: 0 },
    });
    await this.syncUserCache(uid);
    const user = await this.getSafeUserInfoById(uid, true);
    return {
      avatar: user.avatar,
      user,
    };
  }

  /**
   * 用户中心统计信息
   */
  async stats(userId) {
    const { ctx } = this;
    if (this.hasService('license') && typeof ctx.service.license.ensureSchemaCompatibility === 'function') {
      await ctx.service.license.ensureSchemaCompatibility();
    }
    const user = await ctx.model.User.findOne({
      where: { id: userId, isDelete: 0 },
    });
    if (!user) {
      throw new Error('用户不存在');
    }

    const [ orderCount, licenseCount ] = await Promise.all([
      this.hasModel('Order')
        ? ctx.model.Order.count({ where: { userId, isDelete: 0 } })
        : Promise.resolve(0),
      this.hasModel('License')
        ? ctx.model.License.count({ where: { userId, isDelete: 0, status: 1 } })
        : Promise.resolve(0),
    ]);

    const now = Math.floor(Date.now() / 1000);
    const createTime = user.createTime || 0;
    const registerDays = createTime
      ? Math.max(1, Math.floor((now - createTime) / 86400) + 1)
      : 1;

    return {
      orderCount,
      licenseCount,
      registerDays,
    };
  }

  /**
   * 用户中心订单列表
   */
  async orderList(userId, params) {
    const { ctx } = this;
    if (!this.hasModel('Order')) {
      ctx.logger.warn('[user.orderList] Order 模型未注册，返回空列表');
      return {
        lists: [],
        total: 0,
        pageNo: Number(params.pageNo || 1),
        pageSize: Number(params.pageSize || 10),
        moduleEnabled: false,
        moduleMessage: '当前环境未启用订单系统',
      };
    }
    const pageNo = Number(params.pageNo || 1);
    const pageSize = Number(params.pageSize || 10);
    const status = params.status;

    const where = {
      userId,
      isDelete: 0,
    };

    if (status === 'pending') {
      where.payStatus = 0;
      where.orderStatus = { [Op.ne]: 2 };
    }
    if (status === 'completed') {
      where.payStatus = 1;
      where.orderStatus = { [Op.ne]: 2 };
    }
    if (status === 'cancelled') {
      where.orderStatus = 2;
    }

    const limit = pageSize;
    const offset = pageSize * (pageNo - 1);
    const { count, rows } = await ctx.model.Order.findAndCountAll({
      where,
      limit,
      offset,
      order: [[ 'id', 'DESC' ]],
    });

    const productIds = Array.from(new Set(rows.map(item => item.productId)));
    const products = (this.hasModel('Product') && productIds.length)
      ? await ctx.model.Product.findAll({
        where: { id: { [Op.in]: productIds } },
        attributes: [ 'id', 'cover', 'version' ],
      })
      : [];
    const productMap = new Map(products.map(product => [ product.id, product ]));

    const lists = rows.map(order => {
      const product = productMap.get(order.productId);
      const productImage = product?.cover
        ? urlUtil.toAbsoluteUrl(product.cover)
        : '';
      const spec = order.productVersion
        ? `${order.productVersion} / 永久授权`
        : '标准版 / 永久授权';
      const statusValue = order.orderStatus === 2 ? 2 : (order.payStatus === 1 ? 1 : 0);

      return {
        id: order.id,
        orderNo: order.orderNo,
        productName: order.productName,
        productImage,
        spec,
        amount: Number(order.price || 0).toFixed(2),
        originalAmount: Number(order.originPrice || 0).toFixed(2),
        status: statusValue,
        payStatus: Number(order.payStatus || 0),
        orderStatus: Number(order.orderStatus || 0),
        refundStatus: Number(order.refundStatus ?? order.refund_status ?? 0),
        createTime: order.createTime,
      };
    });

    return {
      lists,
      total: count,
      pageNo,
      pageSize,
    };
  }

  /**
   * 用户中心订单详情（包含发票状态）
   */
  async orderDetail(userId, orderId) {
    const { ctx } = this;
    const order = await ctx.service.order.detail(orderId, userId);
    const invoice = await ctx.model.UserInvoice.findOne({
      where: { orderId, userId, isDelete: 0 },
    });
    const data = order.toJSON ? order.toJSON() : order;
    const product = await ctx.model.Product.findOne({
      where: { id: order.productId, isDelete: 0 },
      attributes: [ 'id', 'cover', 'version', 'name' ],
    });
    const productImage = product?.cover
      ? urlUtil.toAbsoluteUrl(product.cover)
      : '';
    data.invoiceStatus = invoice ? Number(invoice.status || 0) : -1;
    data.invoiceId = invoice ? invoice.id : 0;
    data.invoiceUrl = invoice ? invoice.url || '' : '';
    data.productImage = productImage;
    data.productVersion = order.productVersion || product?.version || '';
    data.productName = order.productName || product?.name || '';
    data.amount = Number(order.price || 0).toFixed(2);
    data.originalAmount = Number(order.originPrice || 0).toFixed(2);
    data.couponAmount = Number(order.couponAmount || 0).toFixed(2);
    data.payStatus = Number(order.payStatus ?? data.payStatus ?? 0);
    data.orderStatus = Number(order.orderStatus ?? data.orderStatus ?? 0);
    data.status = data.orderStatus === 2 ? 2 : (data.payStatus === 1 ? 1 : 0);
    data.refundStatus = Number(data.refundStatus ?? data.refund_status ?? order.refundStatus ?? order.refund_status ?? 0);
    /**
     * 兼容订单详情页展示“授权码/下载记录”：缺失时返回空数组，避免前端兜底报错。
     */
    data.licenseList = [];
    data.downloadRecords = [];
    if (this.hasModel('License')) {
      const licenseRows = await ctx.model.License.findAll({
        where: { userId, orderId: Number(orderId || 0), isDelete: 0 },
        order: [[ 'id', 'DESC' ]],
      }).catch(() => []);
      data.licenseList = (Array.isArray(licenseRows) ? licenseRows : []).map(item => ({
        id: Number(item.id || 0),
        key: String(item.licenseKey || ''),
        domain: String(item.domain || ''),
        mobile: String(item.mobile || ''),
        qq: String(item.qq || ''),
        status: Number(item.status || 0),
        auditStatus: Number(item.auditStatus || 0),
        expireTime: Number(item.expireTime || 0),
        bindCount: Number(item.bindCount || 0),
        bindLimit: Number(item.bindLimit || 1),
      }));
    }
    const snapshot = safeJsonParse(order.snapshot, {});
    if (Array.isArray(snapshot?.downloadRecords)) {
      data.downloadRecords = snapshot.downloadRecords;
    }
    return data;
  }

  /**
   * 用户中心授权列表
   */
  async licenseList(userId, params) {
    const { ctx } = this;
    if (!this.hasModel('License')) {
      ctx.logger.warn('[user.licenseList] License 模型未注册，返回空列表');
      return {
        lists: [],
        total: 0,
        pageNo: Number(params.pageNo || 1),
        pageSize: Number(params.pageSize || 10),
      };
    }
    if (this.hasService('license') && typeof ctx.service.license.ensureSchemaCompatibility === 'function') {
      await ctx.service.license.ensureSchemaCompatibility();
    }
    const pageNo = Number(params.pageNo || 1);
    const pageSize = Number(params.pageSize || 10);
    const limit = pageSize;
    const offset = pageSize * (pageNo - 1);

    const { count, rows } = await ctx.model.License.findAndCountAll({
      where: { userId, isDelete: 0 },
      limit,
      offset,
      order: [[ 'id', 'DESC' ]],
    });

    const productIds = Array.from(new Set(rows.map(item => item.productId)));
    const products = (this.hasModel('Product') && productIds.length)
      ? await ctx.model.Product.findAll({
        where: { id: { [Op.in]: productIds } },
        attributes: [ 'id', 'name' ],
      })
      : [];
    const productMap = new Map(products.map(product => [ product.id, product ]));
    const orderIds = Array.from(new Set(rows.map(item => item.orderId).filter(Boolean)));
    const orders = (this.hasModel('Order') && orderIds.length)
      ? await ctx.model.Order.findAll({
        where: {
          id: { [Op.in]: orderIds },
          isDelete: 0,
        },
        attributes: [ 'id', 'productVersion', 'snapshot' ],
      })
      : [];
    const orderMap = new Map(orders.map(order => [ order.id, order.toJSON ? order.toJSON() : order ]));

    const now = Math.floor(Date.now() / 1000);
    const lists = rows.map(license => {
      const order = orderMap.get(license.orderId) || {};
      const snapshot = safeJsonParse(order.snapshot, {});
      let domain = '';
      const auditStatus = license.auditStatus ?? 1;
      if (auditStatus === 0 && license.domain) {
        domain = license.domain;
      } else if (license.bindList) {
        try {
          const list = JSON.parse(license.bindList);
          if (Array.isArray(list) && list.length > 0) {
            domain = list[0];
          }
        } catch (e) {
          domain = '';
        }
      }
      if (!domain && license.domain) {
        domain = license.domain;
      }

      const rawExpireTime = license.getDataValue('expireTime') || 0;
      const expired = rawExpireTime && rawExpireTime < now;
      const statusValue = !expired && license.status === 1 ? 1 : 0;
      const packageName = String(snapshot.packageName || '').trim();
      const packageCode = String(snapshot.packageCode || '').trim();
      const packageVersion = packageName || (packageCode ? packageCode : '单域名');
      const bindLimit = Math.max(Number(license.bindLimit || snapshot.bindLimit || 1), 1);

      return {
        id: license.id,
        productId: Number(license.productId || 0),
        orderId: Number(license.orderId || 0),
        productName: productMap.get(license.productId)?.name || '',
        domain,
        key: license.licenseKey,
        status: statusValue,
        expireTime: license.expireTime,
        mobile: license.mobile || '',
        qq: license.qq || '',
        auditStatus: license.auditStatus ?? 1,
        bindLimit,
        bindCount: Number(license.bindCount || 0),
        packageVersion,
        packageName,
        packageCode,
        productVersion: String(order.productVersion || snapshot.version || ''),
      };
    });

    return {
      lists,
      total: count,
      pageNo,
      pageSize,
    };
  }

  /**
   * 获取授权表名
   * @returns {string} 授权表名
   */
  getLicenseTableName() {
    const prefix = String(extendConfig.dbTablePrefix || 'la_').trim() || 'la_';
    return `${prefix}license`;
  }

  /**
   * 归一化授权绑定域名（兼容粘贴完整 URL）
   * @param {string} input 原始输入
   * @returns {string} 处理后的域名
   */
  normalizeLicenseDomain(input = '') {
    const raw = String(input || '').trim().toLowerCase();
    if (!raw) return '';
    let value = raw.replace(/^https?:\/\//, '');
    value = value.replace(/\/.*$/, '').replace(/:\d+$/, '');
    value = value.replace(/\.$/, '');
    return value;
  }

  /**
   * 校验授权绑定域名格式
   * @param {string} domain 域名
   * @returns {boolean} 是否合法
   */
  isValidLicenseDomain(domain = '') {
    const value = this.normalizeLicenseDomain(domain);
    if (!value) return false;
    if (value === 'localhost') return true;
    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(value)) return true;
    return /^([a-z0-9-]+\.)+[a-z]{2,}$/.test(value);
  }

  /**
   * 获取当前用户拥有的授权记录（原始 SQL，兼容未生成 model 的裁剪版）
   * @param {number} userId 用户ID
   * @param {number|string} licenseId 授权ID
   * @returns {Promise<object|null>} 授权记录
   */
  async getUserOwnedLicenseRow(userId, licenseId) {
    const { ctx } = this;
    const tableName = this.getLicenseTableName();
    const [ row ] = await ctx.model.query(
      `
      SELECT *
      FROM ${tableName}
      WHERE id = ?
        AND user_id = ?
        AND is_delete = 0
      LIMIT 1
      `,
      {
        replacements: [ Number(licenseId || 0), Number(userId || 0) ],
        type: ctx.app.Sequelize.QueryTypes.SELECT,
      }
    );
    return row || null;
  }

  /**
   * 提交授权域名绑定/变更（最小可用版）
   * @param {number} userId 用户ID
   * @param {object} params 请求参数
   * @param {'bind'|'change'} mode 操作模式
   * @returns {Promise<object>} 返回最新状态
   */
  async saveLicenseDomainRequest(userId, params = {}, mode = 'bind') {
    const { ctx } = this;
    const licenseId = Number(params.licenseId || params.id || 0);
    const domain = this.normalizeLicenseDomain(params.domain || '');
    const mobile = String(params.mobile || '').trim();
    const qq = String(params.qq || '').trim();
    const tableName = this.getLicenseTableName();

    if (!licenseId) {
      throw new Error('授权ID不能为空');
    }
    if (!this.isValidLicenseDomain(domain)) {
      throw new Error('域名格式不正确');
    }

    const columns = await this.getTableColumns(tableName);
    if (!columns.size) {
      throw new Error('当前系统未启用授权码绑定');
    }

    const row = await this.getUserOwnedLicenseRow(userId, licenseId);
    if (!row) {
      throw new Error('授权记录不存在');
    }

    const now = Math.floor(Date.now() / 1000);
    const sets = [];
    const replacements = [];

    const domainColumn = await this.resolveExistingColumn(tableName, [ 'domain' ]);
    if (domainColumn) {
      sets.push(`\`${domainColumn}\` = ?`);
      replacements.push(domain);
    }

    const mobileColumn = await this.resolveExistingColumn(tableName, [ 'mobile' ]);
    if (mobileColumn) {
      sets.push(`\`${mobileColumn}\` = ?`);
      replacements.push(mobile);
    }

    const qqColumn = await this.resolveExistingColumn(tableName, [ 'qq' ]);
    if (qqColumn) {
      sets.push(`\`${qqColumn}\` = ?`);
      replacements.push(qq);
    }

    const auditStatusColumn = await this.resolveExistingColumn(tableName, [ 'audit_status', 'auditStatus' ]);
    if (auditStatusColumn) {
      sets.push(`\`${auditStatusColumn}\` = ?`);
      replacements.push(0);
    }

    const updateTimeColumn = await this.resolveExistingColumn(tableName, [ 'update_time', 'updateTime' ]);
    if (updateTimeColumn) {
      sets.push(`\`${updateTimeColumn}\` = ?`);
      replacements.push(now);
    }

    if (sets.length === 0) {
      throw new Error('授权表缺少可更新字段');
    }

    replacements.push(licenseId, Number(userId || 0));
    await ctx.model.query(
      `
      UPDATE ${tableName}
      SET ${sets.join(', ')}
      WHERE id = ?
        AND user_id = ?
        AND is_delete = 0
      `,
      {
        replacements,
        type: ctx.app.Sequelize.QueryTypes.UPDATE,
      }
    );

    return {
      id: licenseId,
      domain,
      mobile,
      qq,
      auditStatus: 0,
      mode,
    };
  }

  /**
   * 绑定授权域名
   * @param {number} userId 用户ID
   * @param {object} params 请求参数
   * @returns {Promise<object>} 最新状态
   */
  async bindLicenseDomain(userId, params = {}) {
    return await this.saveLicenseDomainRequest(userId, params, 'bind');
  }

  /**
   * 修改授权域名
   * @param {number} userId 用户ID
   * @param {object} params 请求参数
   * @returns {Promise<object>} 最新状态
   */
  async changeLicenseDomain(userId, params = {}) {
    return await this.saveLicenseDomainRequest(userId, params, 'change');
  }

  /**
   * 用户中心修改密码
   */
  async changePassword(userId, params) {
    const { ctx } = this;
    const { oldPassword, newPassword } = params;
    if (!oldPassword || !newPassword) {
      throw new Error('参数错误');
    }
    const user = await ctx.model.User.findOne({
      where: { id: userId, isDelete: 0 },
    });
    if (!user) {
      throw new Error('用户不存在');
    }
    if (user.password !== md5(oldPassword)) {
      throw new Error('原密码错误');
    }
    const passwdLen = newPassword.trim().length;
    if (!(passwdLen >= 6 && passwdLen <= 20)) {
      throw new Error('密码必须在6~20位');
    }
    const hashed = md5(newPassword.trim());
    const updateTime = Math.floor(Date.now() / 1000);
    await ctx.model.User.update({
      password: hashed,
      updateTime,
    }, {
      where: { id: userId, isDelete: 0 },
    });

    const updatedUser = {
      ...user.toJSON(),
      password: hashed,
      updateTime,
    };
    const appConfig = this.getAppConfig();
    const userInfoKey = appConfig.userInfoKey || extendConfig.userInfoKey;
    await ctx.service.redis.set(
      userInfoKey + userId,
      JSON.stringify(updatedUser)
    );
  }

  async getLevelMap() {
    const { ctx } = this;
    await this.ensureUserCenterMetaTables();
    const levels = await ctx.model.UserLevel.findAll({
      where: { isDelete: 0 },
      order: [[ 'levelValue', 'ASC' ], [ 'id', 'ASC' ]],
    });
    const levelMap = new Map();
    levels.forEach(level => {
      levelMap.set(level.levelValue, level.name);
    });
    return levelMap;
  }

  async getGroupMap(groupIds) {
    const { ctx } = this;
    await this.ensureUserCenterMetaTables();
    if (!groupIds || groupIds.length === 0) {
      return new Map();
    }
    const groups = await ctx.model.UserGroup.findAll({
      where: { id: { [Op.in]: groupIds }, isDelete: 0 },
    });
    const groupMap = new Map();
    groups.forEach(group => {
      groupMap.set(group.id, group.name);
    });
    return groupMap;
  }

  async getTagMaps(userIds) {
    const { ctx } = this;
    await this.ensureUserCenterMetaTables();
    const userTagMap = new Map();
    if (!userIds || userIds.length === 0) {
      return { userTagMap, tagMap: new Map() };
    }
    const tagRelations = await ctx.model.UserTagRel.findAll({
      where: { userId: { [Op.in]: userIds } },
    });
    const tagIds = Array.from(new Set(tagRelations.map(item => item.tagId)));
    const tags = tagIds.length
      ? await ctx.model.UserTag.findAll({
        where: { id: { [Op.in]: tagIds }, isDelete: 0 },
      })
      : [];
    const tagMap = new Map();
    tags.forEach(tag => {
      tagMap.set(tag.id, tag);
    });
    tagRelations.forEach(rel => {
      if (!userTagMap.has(rel.userId)) {
        userTagMap.set(rel.userId, []);
      }
      const tag = tagMap.get(rel.tagId);
      if (tag) {
        userTagMap.get(rel.userId).push(tag);
      }
    });
    return { userTagMap, tagMap };
  }

  /**
   * 根据用户消息类型生成默认标题
   */
  resolveDefaultUserMessageTitle(type) {
    const noticeType = String(type || '').trim();
    if (noticeType === 'order') return '订单通知';
    if (noticeType === 'coupon') return '优惠券发放通知';
    if (noticeType === 'license_domain_audit') return '域名审核结果通知';
    if (noticeType === 'license_audit') return '授权审核结果通知';
    if (noticeType === 'article_comment') return '文章评论提醒';
    if (noticeType === 'article_comment_reply') return '评论回复提醒';
    if (noticeType === 'article_audit') return '投稿审核通知';
    return '系统通知';
  }

  /**
   * 确保用户消息扩展字段存在（兼容历史库）
   */
  async ensureUserMessageExtraColumn() {
    const { ctx, app } = this;
    if (app.__userMessageExtraReady) return true;
    try {
      await this.ensureTableColumn(
        'la_user_message',
        'extra',
        "ALTER TABLE `la_user_message` ADD COLUMN `extra` text NULL COMMENT '扩展信息(JSON)' AFTER `content`;"
      );
      app.__userMessageExtraReady = true;
      return true;
    } catch (error) {
      ctx.logger.warn(`ensureUserMessageExtraColumn skipped: ${error.message || error}`);
      return false;
    }
  }

  /**
   * 解析用户消息扩展信息
   */
  parseUserMessageExtra(extra) {
    const raw = String(extra || '').trim();
    if (!raw) return {};
    try {
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (error) {
      return {};
    }
  }

  /**
   * 规范化用户消息标题（兼容历史乱码/问号标题）
   */
  normalizeUserMessageTitle(title, type) {
    const text = String(title || '').trim();
    if (!text) {
      return this.resolveDefaultUserMessageTitle(type);
    }
    if (/^[?\uFF1F\uFFFD\s]+$/.test(text)) {
      return this.resolveDefaultUserMessageTitle(type);
    }
    return text;
  }

  /**
   * 从消息正文中提取审核备注
   */
  extractAuditRemark(content) {
    const lines = String(content || '')
      .split(/\n+/)
      .map(item => item.trim())
      .filter(Boolean);
    const line = lines.find(item => item.startsWith('审核备注：') || item.startsWith('审核备注:'));
    if (!line) {
      return '';
    }
    return line.replace('审核备注：', '').replace('审核备注:', '').trim();
  }

  /**
   * 规范化用户消息内容（仅返回关键处理提示）
   */
  normalizeUserMessageContent(content, type, title) {
    const noticeType = String(type || '').trim();
    const rawContent = String(content || '').trim();
    const safeTitle = String(title || '').trim();
    if (noticeType === 'license_domain_audit') {
      const pass = safeTitle.includes('通过');
      const remark = this.extractAuditRemark(rawContent);
      const base = pass
        ? '您的域名申请已审核通过，请前往【我的授权】查看并处理。'
        : '您的域名申请未通过审核，请前往【我的授权】处理。';
      return remark ? `${base}\n审核备注：${remark}` : base;
    }
    if (noticeType === 'license_audit') {
      const pass = safeTitle.includes('通过');
      const remark = this.extractAuditRemark(rawContent);
      const base = pass
        ? '您的授权信息申请已审核通过，请前往【我的授权】查看并处理。'
        : '您的授权信息申请未通过审核，请前往【我的授权】处理。';
      return remark ? `${base}\n审核备注：${remark}` : base;
    }
    if (noticeType === 'order') {
      return '订单状态有更新，请前往订单中心处理。';
    }
    if (noticeType === 'coupon') {
      return '您收到新的优惠券，请前往优惠券中心查看。';
    }
    if (!rawContent) {
      return '请前往消息中心处理。';
    }
    const firstLine = rawContent.split(/\n+/).find(Boolean) || rawContent;
    return firstLine.length > 44 ? `${firstLine.slice(0, 44)}...` : firstLine;
  }

  /**
   * 解析消息类型筛选条件
   * 说明：前端“评论回复”分类统一传 article_comment，后端兼容评论+回复两类消息
   */
  resolveMessageTypeWhere(type) {
    const input = String(type || 'all').trim();
    if (!input || input === 'all') return null;
    if (input === 'article_comment') {
      return { [Op.in]: [ 'article_comment', 'article_comment_reply' ] };
    }
    return input;
  }

  /**
   * 用户中心消息列表
   */
  async messageList(userId, params) {
    const { ctx } = this;
    await this.ensureUserMessageExtraColumn();
    const pageNo = Number(params.pageNo || 1);
    const pageSize = Number(params.pageSize || 10);
    const type = params.type || 'all';
    const isRead = params.isRead;

    const where = { userId };
    const typeWhere = this.resolveMessageTypeWhere(type);
    if (typeWhere !== null) {
      where.type = typeWhere;
    }
    if (isRead !== undefined && isRead !== '') {
      where.isRead = Number(isRead);
    }

    const { count, rows } = await ctx.model.UserMessage.findAndCountAll({
      where,
      limit: pageSize,
      offset: pageSize * (pageNo - 1),
      order: [[ 'id', 'DESC' ]],
    });

    const lists = rows.map(item => {
      const row = item.toJSON ? item.toJSON() : item;
      return {
        ...row,
        title: this.normalizeUserMessageTitle(row.title, row.type),
        content: this.normalizeUserMessageContent(row.content, row.type, row.title),
        extra: this.parseUserMessageExtra(row.extra),
      };
    });

    return {
      pageNo,
      pageSize,
      total: count,
      lists,
      moduleEnabled: true,
      moduleMessage: '',
    };
  }

  /**
   * 用户中心消息已读
   */
  async messageRead(userId, ids) {
    const { ctx } = this;
    const now = Math.floor(Date.now() / 1000);
    if (Array.isArray(ids) && ids.length > 0) {
      await ctx.model.UserMessage.update({
        isRead: 1,
        readTime: now,
      }, {
        where: {
          id: { [Op.in]: ids },
          userId,
        },
      });
      return;
    }
    await ctx.model.UserMessage.update({
      isRead: 1,
      readTime: now,
    }, {
      where: {
        userId,
        isRead: 0,
      },
    });
  }

  /**
   * 用户中心消息删除
   */
  async messageDelete(userId, ids) {
    const { ctx } = this;
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new Error('参数错误');
    }
    await ctx.model.UserMessage.destroy({
      where: {
        id: { [Op.in]: ids },
        userId,
      },
    });
  }

  /**
   * 用户中心收藏列表
   */
  async collectList(userId, params) {
    const { ctx } = this;
    const pageNo = Number(params.pageNo || 1);
    const pageSize = Number(params.pageSize || 12);

    const { count, rows } = await ctx.model.UserCollect.findAndCountAll({
      where: {
        userId,
        isDelete: 0,
      },
      limit: pageSize,
      offset: pageSize * (pageNo - 1),
      order: [[ 'id', 'DESC' ]],
    });

    const productIds = Array.from(new Set(rows.map(item => item.productId)));
    const products = productIds.length
      ? await ctx.model.Product.findAll({
        where: { id: { [Op.in]: productIds }, isDelete: 0 },
        attributes: [ 'id', 'name', 'cover', 'price', 'intro', 'brief' ],
      })
      : [];
    const productMap = new Map(products.map(product => [ product.id, product ]));

    const lists = rows.map(item => {
      const product = productMap.get(item.productId);
      return {
        id: item.productId,
        name: product?.name || '',
        image: product?.cover ? urlUtil.toAbsoluteUrl(product.cover) : '',
        price: product?.price ? Number(product.price).toFixed(2) : '0.00',
        desc: product?.brief || product?.intro || '',
        collectTime: item.createTime,
      };
    });

    return {
      pageNo,
      pageSize,
      total: count,
      lists,
    };
  }

  /**
   * 收藏切换
   */
  async collectToggle(userId, productId) {
    const { ctx } = this;
    if (!productId) {
      throw new Error('产品ID不能为空');
    }
    const product = await ctx.model.Product.findOne({
      where: { id: productId, isDelete: 0 },
    });
    if (!product) {
      throw new Error('产品不存在');
    }

    const now = Math.floor(Date.now() / 1000);
    const exists = await ctx.model.UserCollect.findOne({
      where: {
        userId,
        productId,
      },
    });

    if (exists) {
      const nextDelete = exists.isDelete === 1 ? 0 : 1;
      await ctx.model.UserCollect.update({
        isDelete: nextDelete,
        updateTime: now,
      }, {
        where: { id: exists.id },
      });
      return {
        isCollect: nextDelete === 0 ? 1 : 0,
        message: nextDelete === 0 ? '收藏成功' : '已取消收藏',
      };
    }

    await ctx.model.UserCollect.create({
      userId,
      productId,
      isDelete: 0,
      createTime: now,
      updateTime: now,
    });
    return { isCollect: 1, message: '收藏成功' };
  }

  /**
   * 用户中心收藏文章列表
   */
  async articleCollectList(userId, params = {}) {
    const { ctx } = this;
    const pageNo = Number(params.pageNo || params.page || 1);
    const pageSize = Number(params.pageSize || 10);
    const limit = Math.max(1, Math.min(50, pageSize));
    const offset = limit * (Math.max(1, pageNo) - 1);

    const { count, rows } = await ctx.model.ArticleCollect.findAndCountAll({
      where: {
        user_id: Number(userId),
        is_delete: 0,
      },
      order: [[ 'id', 'DESC' ]],
      limit,
      offset,
    });
    const articleIds = Array.from(new Set(rows.map(item => Number(item.article_id || 0)).filter(Boolean)));
    if (!articleIds.length) {
      return {
        pageNo: Math.max(1, pageNo),
        pageSize: limit,
        total: count,
        lists: [],
      };
    }

    const articles = await ctx.model.Article.findAll({
      where: {
        id: { [Op.in]: articleIds },
        is_delete: 0,
      },
      attributes: [ 'id', 'title', 'image', 'intro', 'summary', 'author', 'visit', 'is_show', 'create_time' ],
    });
    const articleMap = new Map(articles.map(item => [ Number(item.id), item ]));
    const { collectMap, likeMap, commentMap, userCollectMap, userLikeMap } =
      await ctx.service.article.getArticleInteractionStats(articleIds, userId);

    const lists = rows
      .map(item => {
        const articleId = Number(item.article_id || 0);
        const article = articleMap.get(articleId);
        if (!article) return null;
        return {
          id: articleId,
          title: String(article.title || ''),
          image: article.image ? urlUtil.toAbsoluteUrl(article.image) : '',
          intro: String(article.intro || article.summary || ''),
          author: String(article.author || ''),
          visit: Number(article.visit || 0),
          isShow: Number(article.is_show || 0),
          collectCount: collectMap.get(articleId) || 0,
          likeCount: likeMap.get(articleId) || 0,
          commentCount: commentMap.get(articleId) || 0,
          isCollect: userCollectMap.get(articleId) ? 1 : 0,
          isLike: userLikeMap.get(articleId) ? 1 : 0,
          collectTime: moment(Number(item.create_time || 0) * 1000).format('YYYY-MM-DD HH:mm:ss'),
          createTime: moment(Number(article.create_time || 0) * 1000).format('YYYY-MM-DD HH:mm:ss'),
        };
      })
      .filter(Boolean);

    return {
      pageNo: Math.max(1, pageNo),
      pageSize: limit,
      total: count,
      lists,
    };
  }

  /**
   * 用户中心网站收藏/点赞列表通用查询
   * @param {number} userId 用户ID
   * @param {Object} params 查询参数
   * @param {string} tableName 表名（uied_website_favorite / uied_website_like）
   * @param {string} timeField 返回时间字段名
   * @returns {Promise<object>} 分页列表
   */
  async getUserWebsiteInteractionList(userId, params = {}, tableName, timeField = 'createTime') {
    const { ctx, app } = this;
    const uid = Number(userId || 0);
    const pageNo = Number(params.pageNo || params.page || 1);
    const pageSize = Number(params.pageSize || 10);
    const limit = Math.max(1, Math.min(50, pageSize));
    const offset = limit * (Math.max(1, pageNo) - 1);

    await ctx.service.uied.websiteInteraction.ensureTables();

    const safeTable = [ 'uied_website_favorite', 'uied_website_like' ].includes(String(tableName))
      ? String(tableName)
      : 'uied_website_favorite';
    /**
     * 兼容历史匿名行为：同一用户当前 IP 下的匿名互动可在登录后合并展示。
     */
    const actorKeys = [`u:${uid}`];
    try {
      const ip = ctx.service.uied?.websiteInteraction?.getClientIp
        ? ctx.service.uied.websiteInteraction.getClientIp()
        : String(ctx.ip || ctx.request.ip || '').trim();
      if (ip && ctx.service.uied?.websiteInteraction?.hashIp) {
        const ipHash = ctx.service.uied.websiteInteraction.hashIp(ip);
        if (ipHash) {
          actorKeys.push(`ip:${ipHash}`);
        }
      }
    } catch (error) {
      // IP 合并失败不影响主流程
    }
    const uniqueActorKeys = Array.from(new Set(actorKeys.filter(Boolean)));
    const actorKeyPlaceholders = uniqueActorKeys.map(() => '?').join(', ');
    const actorWhereSql = uniqueActorKeys.length > 0
      ? `(ui.user_id = ? OR ui.actor_key IN (${actorKeyPlaceholders}))`
      : 'ui.user_id = ?';
    const actorWhereReplacements = uniqueActorKeys.length > 0
      ? [uid, ...uniqueActorKeys]
      : [uid];

    const [ countRow ] = await app.model.query(
      `SELECT COUNT(1) AS total
       FROM ${safeTable} ui
       INNER JOIN uied_website w ON w.id = ui.website_id AND w.is_delete = 0
       WHERE ${actorWhereSql} AND ui.is_delete = 0`,
      {
        replacements: actorWhereReplacements,
        type: app.Sequelize.QueryTypes.SELECT,
      }
    );

    const rows = await app.model.query(
      `SELECT ui.id as relation_id, ui.website_id, ui.create_time as relation_create_time,
              w.id, w.name, w.slug, w.description, w.url, w.icon_url, w.thumbnail, w.click_count,
              w.create_time, w.update_time, w.tags,
              c.name as category_name
       FROM ${safeTable} ui
       INNER JOIN uied_website w ON w.id = ui.website_id AND w.is_delete = 0
       LEFT JOIN uied_category c ON c.id = w.category_id
       WHERE ${actorWhereSql} AND ui.is_delete = 0
       ORDER BY ui.id DESC
       LIMIT ? OFFSET ?`,
      {
        replacements: [ ...actorWhereReplacements, limit, offset ],
        type: app.Sequelize.QueryTypes.SELECT,
      }
    );

    const websiteIds = Array.from(new Set((rows || []).map(item => Number(item.website_id || item.id || 0)).filter(Boolean)));
    let interactionMap = new Map();
    if (websiteIds.length > 0) {
      try {
        const summaries = await Promise.all(
          websiteIds.map(async websiteId => {
            const summary = await ctx.service.uied.websiteInteraction.getWebsiteInteractionSummary(websiteId);
            return [ websiteId, summary ];
          })
        );
        interactionMap = new Map(summaries);
      } catch (error) {
        ctx.logger.warn('[user.getUserWebsiteInteractionList] 读取网站互动汇总失败，降级基础字段:', error.message);
      }
    }

    const lists = (rows || []).map(item => {
      const websiteId = Number(item.website_id || item.id || 0);
      const summary = interactionMap.get(websiteId) || {};
      const tags = safeJsonParse(item.tags, []);
      const normalizedTags = Array.isArray(tags) ? tags.filter(Boolean) : [];
      return {
        id: websiteId,
        websiteId,
        relationId: Number(item.relation_id || 0),
        name: String(item.name || ''),
        slug: String(item.slug || ''),
        description: String(item.description || ''),
        url: String(item.url || ''),
        iconUrl: item.icon_url ? urlUtil.toAbsoluteUrl(item.icon_url) : '',
        thumbnail: item.thumbnail ? urlUtil.toAbsoluteUrl(item.thumbnail) : '',
        clickCount: Number(item.click_count || 0),
        categoryName: String(item.category_name || ''),
        tags: normalizedTags,
        favoriteCount: Number(summary.totalFavorites || 0),
        likeCount: Number(summary.likeCount || 0),
        commentCount: Number(summary.commentsCount || 0),
        [timeField]: moment(Number(item.relation_create_time || 0) * 1000).format('YYYY-MM-DD HH:mm:ss'),
        createTime: moment(Number(item.create_time || 0) * 1000).format('YYYY-MM-DD HH:mm:ss'),
        updateTime: moment(Number(item.update_time || 0) * 1000).format('YYYY-MM-DD HH:mm:ss'),
      };
    });

    return {
      pageNo: Math.max(1, pageNo),
      pageSize: limit,
      total: Number(countRow?.total || 0),
      lists,
    };
  }

  /**
   * 用户中心收藏网址列表
   * @param {number} userId 用户ID
   * @param {object} params 查询参数
   * @returns {Promise<object>} 收藏网址分页列表
   */
  async websiteFavoriteList(userId, params = {}) {
    return await this.getUserWebsiteInteractionList(userId, params, 'uied_website_favorite', 'favoriteTime');
  }

  /**
   * 用户中心点赞网址列表
   * @param {number} userId 用户ID
   * @param {object} params 查询参数
   * @returns {Promise<object>} 点赞网址分页列表
   */
  async websiteLikeList(userId, params = {}) {
    return await this.getUserWebsiteInteractionList(userId, params, 'uied_website_like', 'likeTime');
  }

  /**
   * 用户中心点赞文章列表
   */
  async articleLikeList(userId, params = {}) {
    const { ctx } = this;
    const pageNo = Number(params.pageNo || params.page || 1);
    const pageSize = Number(params.pageSize || 10);
    const limit = Math.max(1, Math.min(50, pageSize));
    const offset = limit * (Math.max(1, pageNo) - 1);
    const ready = await ctx.service.article.ensureArticleLikeTable();
    if (!ready) {
      return {
        pageNo: Math.max(1, pageNo),
        pageSize: limit,
        total: 0,
        lists: [],
      };
    }

    const { count, rows } = await ctx.model.ArticleLike.findAndCountAll({
      where: {
        user_id: Number(userId),
        is_delete: 0,
      },
      order: [[ 'id', 'DESC' ]],
      limit,
      offset,
    });
    const articleIds = Array.from(new Set(rows.map(item => Number(item.article_id || 0)).filter(Boolean)));
    if (!articleIds.length) {
      return {
        pageNo: Math.max(1, pageNo),
        pageSize: limit,
        total: count,
        lists: [],
      };
    }

    const articles = await ctx.model.Article.findAll({
      where: {
        id: { [Op.in]: articleIds },
        is_delete: 0,
      },
      attributes: [ 'id', 'title', 'image', 'intro', 'summary', 'author', 'visit', 'is_show', 'create_time' ],
    });
    const articleMap = new Map(articles.map(item => [ Number(item.id), item ]));
    const { collectMap, likeMap, commentMap, userCollectMap, userLikeMap } =
      await ctx.service.article.getArticleInteractionStats(articleIds, userId);

    const lists = rows
      .map(item => {
        const articleId = Number(item.article_id || 0);
        const article = articleMap.get(articleId);
        if (!article) return null;
        return {
          id: articleId,
          title: String(article.title || ''),
          image: article.image ? urlUtil.toAbsoluteUrl(article.image) : '',
          intro: String(article.intro || article.summary || ''),
          author: String(article.author || ''),
          visit: Number(article.visit || 0),
          isShow: Number(article.is_show || 0),
          collectCount: collectMap.get(articleId) || 0,
          likeCount: likeMap.get(articleId) || 0,
          commentCount: commentMap.get(articleId) || 0,
          isCollect: userCollectMap.get(articleId) ? 1 : 0,
          isLike: userLikeMap.get(articleId) ? 1 : 0,
          likeTime: moment(Number(item.create_time || 0) * 1000).format('YYYY-MM-DD HH:mm:ss'),
          createTime: moment(Number(article.create_time || 0) * 1000).format('YYYY-MM-DD HH:mm:ss'),
        };
      })
      .filter(Boolean);

    return {
      pageNo: Math.max(1, pageNo),
      pageSize: limit,
      total: count,
      lists,
    };
  }

  /**
   * 确保 UIED 评论表兼容字段存在（兼容历史库无 parent_id/like_count）
   * @returns {Promise<void>}
   */
  async ensureUiedCommentTableCompatibility() {
    const { app } = this;
    if (app.__uiedCommentTableCompatibilityReady) {
      return;
    }
    const tableCreateSqlMap = {
      uied_article_comment: `
        CREATE TABLE IF NOT EXISTS \`uied_article_comment\` (
          \`id\` int unsigned NOT NULL AUTO_INCREMENT,
          \`article_id\` int unsigned NOT NULL COMMENT '文章ID',
          \`parent_id\` int unsigned NOT NULL DEFAULT 0 COMMENT '父评论ID',
          \`user_id\` int unsigned DEFAULT NULL COMMENT '用户ID（可选）',
          \`nickname\` varchar(100) DEFAULT '' COMMENT '昵称',
          \`email\` varchar(255) DEFAULT '' COMMENT '邮箱',
          \`content\` text NOT NULL COMMENT '评论内容',
          \`status\` varchar(20) DEFAULT 'pending' COMMENT '状态',
          \`like_count\` int unsigned NOT NULL DEFAULT 0 COMMENT '点赞数',
          \`ip\` varchar(50) DEFAULT '' COMMENT 'IP地址',
          \`user_agent\` varchar(500) DEFAULT '' COMMENT '浏览器信息',
          \`is_delete\` tinyint unsigned DEFAULT '0' COMMENT '是否删除',
          \`create_time\` int unsigned DEFAULT '0' COMMENT '创建时间',
          \`update_time\` int unsigned DEFAULT '0' COMMENT '更新时间',
          \`delete_time\` int unsigned DEFAULT '0' COMMENT '删除时间',
          PRIMARY KEY (\`id\`),
          KEY \`idx_article_id\` (\`article_id\`),
          KEY \`idx_status\` (\`status\`),
          KEY \`idx_create_time\` (\`create_time\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='文章评论表'
      `,
      uied_website_comment: `
        CREATE TABLE IF NOT EXISTS \`uied_website_comment\` (
          \`id\` int unsigned NOT NULL AUTO_INCREMENT,
          \`website_id\` int unsigned NOT NULL COMMENT '网站ID',
          \`parent_id\` int unsigned NOT NULL DEFAULT 0 COMMENT '父评论ID',
          \`user_id\` int unsigned DEFAULT NULL COMMENT '用户ID（可选）',
          \`nickname\` varchar(100) DEFAULT '' COMMENT '昵称',
          \`email\` varchar(255) DEFAULT '' COMMENT '邮箱',
          \`content\` text NOT NULL COMMENT '评论内容',
          \`status\` varchar(20) DEFAULT 'pending' COMMENT '状态',
          \`like_count\` int unsigned NOT NULL DEFAULT 0 COMMENT '点赞数',
          \`ip\` varchar(50) DEFAULT '' COMMENT 'IP地址',
          \`user_agent\` varchar(500) DEFAULT '' COMMENT '浏览器信息',
          \`is_delete\` tinyint unsigned DEFAULT '0' COMMENT '是否删除',
          \`create_time\` int unsigned DEFAULT '0' COMMENT '创建时间',
          \`update_time\` int unsigned DEFAULT '0' COMMENT '更新时间',
          \`delete_time\` int unsigned DEFAULT '0' COMMENT '删除时间',
          PRIMARY KEY (\`id\`),
          KEY \`idx_website_id\` (\`website_id\`),
          KEY \`idx_status\` (\`status\`),
          KEY \`idx_create_time\` (\`create_time\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='网站评论表'
      `,
    };

    for (const [ tableName, createSql ] of Object.entries(tableCreateSqlMap)) {
      await this.ctx.model.query(createSql, { type: this.ctx.app.Sequelize.QueryTypes.RAW });
      await this.ensureTableColumn(
        tableName,
        'parent_id',
        `ALTER TABLE \`${tableName}\` ADD COLUMN \`parent_id\` int unsigned NOT NULL DEFAULT 0 COMMENT '父评论ID' AFTER \`${tableName === 'uied_article_comment' ? 'article_id' : 'website_id'}\`;`
      );
      await this.ensureTableColumn(
        tableName,
        'like_count',
        `ALTER TABLE \`${tableName}\` ADD COLUMN \`like_count\` int unsigned NOT NULL DEFAULT 0 COMMENT '点赞数' AFTER \`status\`;`
      );
    }
    app.__uiedCommentTableCompatibilityReady = true;
  }

  /**
   * 仅对演示账号自动补齐个人中心演示数据
   * @param {number} userId 用户ID
   * @param {string} nickname 兜底昵称
   * @returns {Promise<void>}
   */
  async ensurePersonalCenterDemoData(userId, nickname = '') {
    const { ctx } = this;
    const uid = Number(userId || 0);
    if (!uid) {
      return;
    }
    const user = await ctx.model.User.findOne({
      where: { id: uid, isDelete: 0 },
      attributes: [ 'id', 'username', 'nickname' ],
    });
    if (!user || !this.isPersonalCenterSeedUser(user.username)) {
      return;
    }

    const cacheKey = `uied:personal:center:seeded:${uid}`;
    const seeded = await ctx.service.redis.get(cacheKey);
    if (seeded) {
      return;
    }

    await this.seedPersonalCenterDemoDataForUser(uid, nickname || user.nickname || user.username || `用户${uid}`);
    await ctx.service.redis.set(cacheKey, true, 60 * 30);
  }

  /**
   * 用户中心评论列表通用查询
   * @param {number} userId 用户ID
   * @param {object} params 分页与筛选参数
   * @param {'article'|'website'} type 评论类型
   * @returns {Promise<{pageNo:number,pageSize:number,total:number,lists:Array}>} 评论分页列表
   */
  async getUserCommentList(userId, params = {}, type = 'website') {
    const { ctx, app } = this;
    const pageNo = Number(params.pageNo || params.page || 1);
    const pageSize = Number(params.pageSize || 10);
    const limit = Math.max(1, Math.min(50, pageSize));
    const offset = limit * (Math.max(1, pageNo) - 1);
    const keyword = String(params.keyword || '').trim();
    const status = String(params.status || '').trim();

    const isArticle = type === 'article';
    const tableName = isArticle ? 'uied_article_comment' : 'uied_website_comment';
    const targetTable = isArticle ? 'uied_article' : 'uied_website';
    const targetIdField = isArticle ? 'article_id' : 'website_id';
    const targetTitleField = isArticle ? 'title' : 'name';
    const targetContentField = isArticle ? 'summary' : 'description';
    await this.ensureUiedCommentTableCompatibility();
    const hasParentId = await this.hasTableColumn(tableName, 'parent_id');
    const hasLikeCount = await this.hasTableColumn(tableName, 'like_count');
    const parentIdSelect = hasParentId ? 'c.parent_id' : '0 AS parent_id';
    const likeCountSelect = hasLikeCount ? 'c.like_count' : '0 AS like_count';

    const replacements = [ Number(userId) ];
    let whereSql = 'c.is_delete = 0 AND c.user_id = ?';
    if (status) {
      whereSql += ' AND c.status = ?';
      replacements.push(status);
    }
    if (keyword) {
      whereSql += ` AND (
        c.content LIKE ?
        OR t.${targetTitleField} LIKE ?
      )`;
      replacements.push(`%${keyword}%`, `%${keyword}%`);
    }

    try {
      const [ countRow ] = await app.model.query(
        `
        SELECT COUNT(1) AS total
        FROM ${tableName} c
        LEFT JOIN ${targetTable} t ON t.id = c.${targetIdField}
        WHERE ${whereSql}
        `,
        {
          replacements,
          type: app.Sequelize.QueryTypes.SELECT,
        }
      );

      const rows = await app.model.query(
        `
        SELECT
          c.id,
          c.${targetIdField} AS target_id,
          ${parentIdSelect},
          c.content,
          c.status,
          ${likeCountSelect},
          c.create_time,
          c.update_time,
          t.id AS target_row_id,
          t.${targetTitleField} AS target_title,
          t.slug AS target_slug,
          ${isArticle ? 'NULL' : 't.url'} AS target_url,
          ${isArticle ? 'NULL' : 't.icon_url'} AS target_icon_url,
          t.${targetContentField} AS target_description
        FROM ${tableName} c
        LEFT JOIN ${targetTable} t ON t.id = c.${targetIdField}
        WHERE ${whereSql}
        ORDER BY c.id DESC
        LIMIT ? OFFSET ?
        `,
        {
          replacements: [ ...replacements, limit, offset ],
          type: app.Sequelize.QueryTypes.SELECT,
        }
      );

      const lists = (rows || []).map(item => {
        const targetId = Number(item.target_id || item.target_row_id || 0);
        return {
          id: Number(item.id || 0),
          targetId,
          parentId: Number(item.parent_id || 0),
          content: String(item.content || ''),
          status: String(item.status || ''),
          likeCount: Number(item.like_count || 0),
          createTime: moment(Number(item.create_time || 0) * 1000).format('YYYY-MM-DD HH:mm:ss'),
          updateTime: moment(Number(item.update_time || 0) * 1000).format('YYYY-MM-DD HH:mm:ss'),
          target: {
            id: targetId,
            title: String(item.target_title || ''),
            slug: String(item.target_slug || ''),
            description: String(item.target_description || ''),
            url: String(item.target_url || ''),
            iconUrl: item.target_icon_url ? urlUtil.toAbsoluteUrl(item.target_icon_url) : '',
          },
        };
      });

      return {
        pageNo: Math.max(1, pageNo),
        pageSize: limit,
        total: Number(countRow?.total || 0),
        lists,
      };
    } catch (error) {
      const message = String(error?.message || '');
      const isCompatibleError = message.includes('doesn\'t exist')
        || message.includes('Unknown column')
        || message.includes('Table')
        || message.includes('ER_NO_SUCH_TABLE')
        || message.includes('ER_BAD_FIELD_ERROR');
      if (!isCompatibleError) {
        throw error;
      }
      ctx.logger.warn(`[user.getUserCommentList] ${type} 评论表结构兼容降级: ${message}`);
      return {
        pageNo: Math.max(1, pageNo),
        pageSize: limit,
        total: 0,
        lists: [],
      };
    }
  }

  /**
   * 用户中心文章评论列表
   * @param {number} userId 用户ID
   * @param {object} params 查询参数
   * @returns {Promise<object>} 文章评论分页列表
   */
  async articleCommentList(userId, params = {}) {
    return await this.getUserCommentList(userId, params, 'article');
  }

  /**
   * 用户中心网址评论列表
   * @param {number} userId 用户ID
   * @param {object} params 查询参数
   * @returns {Promise<object>} 网址评论分页列表
   */
  async websiteCommentList(userId, params = {}) {
    return await this.getUserCommentList(userId, params, 'website');
  }

  /**
   * 获取用户评论类型对应的数据表与目标字段
   * @param {'article'|'website'} type 评论类型
   * @returns {{tableName:string,targetIdField:string,targetKey:string}} 元数据
   */
  getUserCommentMeta(type = 'website') {
    const normalizedType = String(type || '').trim().toLowerCase() === 'article' ? 'article' : 'website';
    if (normalizedType === 'article') {
      return {
        tableName: 'uied_article_comment',
        targetIdField: 'article_id',
        targetKey: 'articleId',
      };
    }
    return {
      tableName: 'uied_website_comment',
      targetIdField: 'website_id',
      targetKey: 'websiteId',
    };
  }

  /**
   * 查询当前用户评论详情（仅允许操作自己的评论）
   * @param {number} userId 用户ID
   * @param {number|string} commentId 评论ID
   * @param {'article'|'website'} type 评论类型
   * @returns {Promise<object|null>} 评论记录
   */
  async getUserOwnedComment(userId, commentId, type = 'website') {
    const { app } = this;
    const meta = this.getUserCommentMeta(type);
    const [ row ] = await app.model.query(
      `
      SELECT *
      FROM ${meta.tableName}
      WHERE id = ?
        AND user_id = ?
        AND is_delete = 0
      LIMIT 1
      `,
      {
        replacements: [ Number(commentId || 0), Number(userId || 0) ],
        type: app.Sequelize.QueryTypes.SELECT,
      }
    );
    return row || null;
  }

  /**
   * 用户中心删除评论（软删除）
   * @param {number} userId 用户ID
   * @param {object} params 请求参数
   * @param {'article'|'website'} type 评论类型
   * @returns {Promise<boolean>} 是否成功
   */
  async deleteUserComment(userId, params = {}, type = 'website') {
    const { app } = this;
    await this.ensureUiedCommentTableCompatibility();
    const commentId = Number(params.commentId || params.id || 0);
    if (!commentId) {
      throw new Error('评论ID不能为空');
    }
    const existed = await this.getUserOwnedComment(userId, commentId, type);
    if (!existed) {
      throw new Error('评论不存在或无权限操作');
    }
    const meta = this.getUserCommentMeta(type);
    const now = Math.floor(Date.now() / 1000);
    await app.model.query(
      `
      UPDATE ${meta.tableName}
      SET is_delete = 1, delete_time = ?, update_time = ?
      WHERE id = ? AND user_id = ? AND is_delete = 0
      `,
      {
        replacements: [ now, now, commentId, Number(userId || 0) ],
        type: app.Sequelize.QueryTypes.UPDATE,
      }
    );
    return true;
  }

  /**
   * 用户中心编辑评论内容
   * @param {number} userId 用户ID
   * @param {object} params 请求参数
   * @param {'article'|'website'} type 评论类型
   * @returns {Promise<object>} 更新后的评论摘要
   */
  async updateUserComment(userId, params = {}, type = 'website') {
    const { app } = this;
    await this.ensureUiedCommentTableCompatibility();
    const commentId = Number(params.commentId || params.id || 0);
    const content = String(params.content || '').trim();
    if (!commentId) {
      throw new Error('评论ID不能为空');
    }
    if (!content) {
      throw new Error('评论内容不能为空');
    }
    if (content.length > 1000) {
      throw new Error('评论内容不能超过1000字符');
    }
    const existed = await this.getUserOwnedComment(userId, commentId, type);
    if (!existed) {
      throw new Error('评论不存在或无权限操作');
    }
    const meta = this.getUserCommentMeta(type);
    const now = Math.floor(Date.now() / 1000);
    await app.model.query(
      `
      UPDATE ${meta.tableName}
      SET content = ?, update_time = ?, status = 'approved'
      WHERE id = ? AND user_id = ? AND is_delete = 0
      `,
      {
        replacements: [ content, now, commentId, Number(userId || 0) ],
        type: app.Sequelize.QueryTypes.UPDATE,
      }
    );
    return {
      id: commentId,
      content,
      updateTime: moment(now * 1000).format('YYYY-MM-DD HH:mm:ss'),
      status: 'approved',
    };
  }

  /**
   * 用户中心回复评论（楼中楼）
   * @param {number} userId 用户ID
   * @param {object} params 请求参数
   * @param {'article'|'website'} type 评论类型
   * @returns {Promise<object>} 新增回复内容
   */
  async replyUserComment(userId, params = {}, type = 'website') {
    const { ctx } = this;
    await this.ensureUiedCommentTableCompatibility();
    const commentId = Number(params.commentId || 0);
    const content = String(params.content || '').trim();
    if (!commentId) {
      throw new Error('父评论ID不能为空');
    }
    if (!content) {
      throw new Error('回复内容不能为空');
    }
    if (content.length > 1000) {
      throw new Error('回复内容不能超过1000字符');
    }
    const meta = this.getUserCommentMeta(type);
    const [ parentComment ] = await ctx.app.model.query(
      `
      SELECT id, ${meta.targetIdField} AS target_id
      FROM ${meta.tableName}
      WHERE id = ? AND is_delete = 0
      LIMIT 1
      `,
      {
        replacements: [ commentId ],
        type: ctx.app.Sequelize.QueryTypes.SELECT,
      }
    );
    if (!parentComment) {
      throw new Error('父评论不存在');
    }
    const targetId = Number(params.targetId || parentComment.target_id || 0);
    if (!targetId) {
      throw new Error('评论目标不存在');
    }
    const userInfo = await this.getSafeUserInfoById(userId, false);
    const payload = {
      parentId: commentId,
      content,
      userId,
      userName: String(userInfo.nickname || userInfo.username || `用户${userId}`),
    };
    if (type === 'article') {
      payload.articleId = targetId;
    } else {
      payload.websiteId = targetId;
    }
    return await ctx.service.uied.comment.add(payload);
  }

  /**
   * 用户中心删除文章评论
   */
  async articleCommentDelete(userId, params = {}) {
    return await this.deleteUserComment(userId, params, 'article');
  }

  /**
   * 用户中心删除网址评论
   */
  async websiteCommentDelete(userId, params = {}) {
    return await this.deleteUserComment(userId, params, 'website');
  }

  /**
   * 用户中心编辑文章评论
   */
  async articleCommentUpdate(userId, params = {}) {
    return await this.updateUserComment(userId, params, 'article');
  }

  /**
   * 用户中心编辑网址评论
   */
  async websiteCommentUpdate(userId, params = {}) {
    return await this.updateUserComment(userId, params, 'website');
  }

  /**
   * 用户中心回复文章评论
   */
  async articleCommentReply(userId, params = {}) {
    return await this.replyUserComment(userId, params, 'article');
  }

  /**
   * 用户中心回复网址评论
   */
  async websiteCommentReply(userId, params = {}) {
    return await this.replyUserComment(userId, params, 'website');
  }

  /**
   * 地址列表
   */
  async addressList(userId, params = {}) {
    const { ctx } = this;
    if (!this.hasModel('UserAddress')) {
      ctx.logger.warn('[user.addressList] UserAddress 模型未注册，返回空列表');
      return [];
    }
    const { type } = params;
    const where = { userId, isDelete: 0 };
    if (type !== undefined && type !== null && type !== '') {
      where.addressType = Number(type);
    }
    const rows = await ctx.model.UserAddress.findAll({
      where,
      order: [[ 'isDefault', 'DESC' ], [ 'id', 'DESC' ]],
    });
    return rows.map(item => ({
      id: item.id,
      contact: item.contact,
      mobile: item.mobile,
      province: item.provinceId,
      city: item.cityId,
      district: item.districtId,
      detail: item.detail,
      isDefault: item.isDefault,
      addressType: item.addressType,
      createTime: item.getDataValue ? item.getDataValue('createTime') : item.createTime,
    }));
  }

  /**
   * 地址编辑
   */
  async addressEdit(userId, params) {
    const { ctx } = this;
    const {
      id,
      contact,
      mobile,
      provinceId,
      cityId,
      districtId,
      detail,
      isDefault = 0,
      addressType = 1,
    } = params;

    if (!contact || !mobile || !provinceId || !cityId || !districtId || !detail) {
      throw new Error('参数错误');
    }

    const now = Math.floor(Date.now() / 1000);
    if (Number(isDefault) === 1) {
      await ctx.model.UserAddress.update({
        isDefault: 0,
        updateTime: now,
      }, {
        where: { userId, isDelete: 0 },
      });
    }

    if (id) {
      await ctx.model.UserAddress.update({
        contact,
        mobile,
        provinceId,
        cityId,
        districtId,
        detail,
        addressType: Number(addressType) || 1,
        isDefault: Number(isDefault) === 1 ? 1 : 0,
        updateTime: now,
      }, {
        where: { id, userId, isDelete: 0 },
      });
      return;
    }

    await ctx.model.UserAddress.create({
      userId,
      contact,
      mobile,
      provinceId,
      cityId,
      districtId,
      detail,
      addressType: Number(addressType) || 1,
      isDefault: Number(isDefault) === 1 ? 1 : 0,
      createTime: now,
      updateTime: now,
      isDelete: 0,
    });
  }

  /**
   * 地址删除
   */
  async addressDel(userId, id) {
    const { ctx } = this;
    if (!id) {
      throw new Error('参数错误');
    }
    const now = Math.floor(Date.now() / 1000);
    await ctx.model.UserAddress.update({
      isDelete: 1,
      updateTime: now,
    }, {
      where: { id, userId },
    });
  }

  /**
   * 确保前台用户登录日志表存在
   */
  async ensureUserLoginLogTable() {
    const { ctx, app } = this;
    if (app.__userLoginLogTableReady) return true;
    try {
      await ctx.model.query(`
        CREATE TABLE IF NOT EXISTS \`la_user_login_log\` (
          \`id\` int unsigned NOT NULL AUTO_INCREMENT,
          \`user_id\` int unsigned NOT NULL DEFAULT 0,
          \`ip\` varchar(64) NOT NULL DEFAULT '',
          \`os\` varchar(255) NOT NULL DEFAULT '',
          \`browser\` varchar(255) NOT NULL DEFAULT '',
          \`status\` tinyint unsigned NOT NULL DEFAULT 1 COMMENT '1成功 2失败',
          \`create_time\` int unsigned NOT NULL DEFAULT 0,
          PRIMARY KEY (\`id\`),
          KEY \`idx_user_time\` (\`user_id\`, \`create_time\`),
          KEY \`idx_status\` (\`status\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);
      app.__userLoginLogTableReady = true;
      return true;
    } catch (error) {
      ctx.logger.warn(`ensureUserLoginLogTable skipped: ${error.message || error}`);
      return false;
    }
  }

  /**
   * 解析登录日志中的终端信息字符串
   */
  parseLoginTerminalText(rawValue = '') {
    const text = String(rawValue || '').trim();
    if (!text) return '';
    const jsonValue = safeJsonParse(text, null);
    if (jsonValue && typeof jsonValue === 'object') {
      const name = String(jsonValue.name || '').trim();
      const version = String(jsonValue.version || '').trim();
      return name ? `${name}${version ? ` ${version}` : ''}` : '';
    }
    return text;
  }

  /**
   * 统一格式化用户登录日志项
   */
  formatUserLoginLogItem(row) {
    const osText = this.parseLoginTerminalText(row?.os || '');
    const browserText = this.parseLoginTerminalText(row?.browser || '');
    return {
      id: Number(row?.id || 0),
      userId: Number(row?.userId || row?.user_id || 0),
      ip: String(row?.ip || ''),
      os: osText,
      browser: browserText,
      device: `${browserText || '未知浏览器'} · ${osText || '未知系统'}`,
      status: Number(row?.status || 0),
      createTime: Number(row?.createTime || row?.create_time || 0),
    };
  }

  /**
   * 登录日志
   */
  async loginLog(userId, params) {
    const { ctx } = this;
    await this.ensureUserLoginLogTable();
    if (!this.hasModel('UserLoginLog')) {
      ctx.logger.warn('[user.loginLog] UserLoginLog 模型未注册，返回空列表');
      return {
        pageNo: Number(params.pageNo || 1),
        pageSize: Number(params.pageSize || 10),
        total: 0,
        lists: [],
      };
    }
    const pageNo = Number(params.pageNo || 1);
    const pageSize = Number(params.pageSize || 10);
    const { count, rows } = await ctx.model.UserLoginLog.findAndCountAll({
      where: { userId },
      limit: pageSize,
      offset: pageSize * (pageNo - 1),
      order: [[ 'id', 'DESC' ]],
    });

    return {
      pageNo,
      pageSize,
      total: count,
      lists: rows.map(item => this.formatUserLoginLogItem(item)),
    };
  }

  /**
   * 钱包信息
   */
  async walletInfo(userId) {
    const { ctx } = this;
    if (!this.hasModel('UserWallet') || !this.hasModel('UserWalletFlow')) {
      ctx.logger.warn('[user.walletInfo] 钱包模型未注册，返回默认值');
      return {
        balance: '0.00',
        totalRecharge: '0.00',
        totalSpend: '0.00',
      };
    }
    let wallet = await ctx.model.UserWallet.findOne({ where: { userId } });
    if (!wallet) {
      wallet = await ctx.model.UserWallet.create({ userId, balance: 0 });
    }

    const totalRecharge = await ctx.model.UserWalletFlow.sum('amount', {
      where: { userId, flowType: 'recharge' },
    }) || 0;
    const totalSpend = await ctx.model.UserWalletFlow.sum('amount', {
      where: { userId, flowType: 'consume' },
    }) || 0;
    const flowCount = await ctx.model.UserWalletFlow.count({
      where: { userId },
    });

    let balanceValue = Number(wallet.balance || 0);
    if (flowCount > 0) {
      balanceValue = Number(totalRecharge || 0) - Number(totalSpend || 0);
      const walletBalance = Number(wallet.balance || 0);
      if (walletBalance !== balanceValue) {
        await ctx.model.UserWallet.update({
          balance: balanceValue,
          updateTime: Math.floor(Date.now() / 1000),
        }, {
          where: { userId },
        });
      }
    }

    return {
      balance: Number(balanceValue || 0).toFixed(2),
      totalRecharge: Number(totalRecharge || 0).toFixed(2),
      totalSpend: Number(totalSpend || 0).toFixed(2),
    };
  }

  /**
   * 钱包明细
   */
  async walletLog(userId, params) {
    const { ctx } = this;
    if (!this.hasModel('UserWallet') || !this.hasModel('UserWalletFlow')) {
      ctx.logger.warn('[user.walletLog] 钱包模型未注册，返回空列表');
      return {
        pageNo: Number(params.pageNo || 1),
        pageSize: Number(params.pageSize || 10),
        total: 0,
        lists: [],
      };
    }
    const pageNo = Number(params.pageNo || 1);
    const pageSize = Number(params.pageSize || 10);
    const type = params.type || 'all';

    const where = { userId };
    if (type !== 'all') {
      where.flowType = type;
    }

    const { count, rows } = await ctx.model.UserWalletFlow.findAndCountAll({
      where,
      limit: pageSize,
      offset: pageSize * (pageNo - 1),
      order: [[ 'id', 'DESC' ]],
    });

    let wallet = await ctx.model.UserWallet.findOne({ where: { userId } });
    if (!wallet) {
      wallet = await ctx.model.UserWallet.create({ userId, balance: 0 });
    }
    const balance = Number(wallet.balance || 0).toFixed(2);

    const lists = rows.map(item => ({
      id: item.id,
      type: item.flowType,
      amount: `${item.flowType === 'consume' ? '-' : '+'}${Number(item.amount || 0).toFixed(2)}`,
      balance,
      remark: item.remark,
      createTime: item.createTime,
    }));

    return {
      pageNo,
      pageSize,
      total: count,
      lists,
    };
  }

  /**
   * 余额充值
   */
  async walletRecharge(userId, params) {
    const { ctx } = this;
    if (!this.hasModel('UserWallet') || !this.hasModel('UserWalletFlow')) {
      throw new Error('钱包模块未启用');
    }
    const amount = Number(params.amount || 0);
    if (!amount || amount < 0.01 || amount > 50000) {
      throw new Error('充值金额不合法');
    }

    let wallet = await ctx.model.UserWallet.findOne({ where: { userId } });
    if (!wallet) {
      wallet = await ctx.model.UserWallet.create({ userId, balance: 0 });
    }

    const now = Math.floor(Date.now() / 1000);
    const orderNo = `RE${Date.now()}`;
    const nextBalance = Number(wallet.balance || 0) + amount;

    await ctx.model.UserWallet.update({
      balance: nextBalance,
      updateTime: now,
    }, {
      where: { userId },
    });

    await ctx.model.UserWalletFlow.create({
      userId,
      orderId: 0,
      amount,
      flowType: 'recharge',
      remark: '余额充值',
      createTime: now,
    });

    return {
      orderNo,
      payUrl: `mock://pay/${orderNo}`,
    };
  }

  /**
   * 获取会员商品配置
   */
  async getVipGoodsConfig() {
    const { ctx } = this;
    const data = await ctx.service.common.get('vip', 'config');
    return safeJsonParse(data.config, null);
  }

  /**
   * 会员信息
   * 返回 expireTime 字符串，未开通返回空字符串
   */
  async vipInfo(userId) {
    const { ctx } = this;
    const userColumns = await this.getUserBusinessColumns();
    const user = await ctx.model.User.findOne({ where: { id: userId, isDelete: 0 } });
    if (!user) {
      throw new Error('用户不存在');
    }
    const level = userColumns.vipLevel ? Number(user.vipLevel || 0) : 0;
    const levelMap = await this.getLevelMap();
    const levelName = levelMap.get(level) || (level === 1 ? 'VIP会员' : level === 2 ? 'SVIP会员' : '普通用户');
    const vipExpireTime = userColumns.vipExpireTime ? Number(user.vipExpireTime || 0) : 0;

    // 格式化过期时间
    const expireTime = vipExpireTime
      ? moment(vipExpireTime * 1000).format('YYYY-MM-DD HH:mm:ss')
      : '';

    /**
     * 会员过期提醒（按配置控制提醒次数与间隔）
     */
    await this.sendVipExpireNoticeIfNeeded(userId, vipExpireTime);

    return {
      level,
      levelName,
      expireTime,
      growth: 0,
      nextLevelGrowth: level >= 2 ? 0 : 500,
    };
  }

  /**
   * 会员商品列表
   */
  async vipGoods() {
    const config = await this.getVipGoodsConfig();
    const goodsList = Array.isArray(config?.goods)
      ? config.goods
      : Array.isArray(config?.list)
        ? config.list
        : Array.isArray(config?.items)
          ? config.items
          : null;

    if (goodsList && goodsList.length > 0) {
      const normalized = goodsList
        .filter(item => item && (item.status === undefined || Number(item.status) === 1))
        .map((item, index) => {
          const price = Number(item.price ?? 0);
          const original = Number(item.originalPrice ?? price);
          const duration = Number(item.duration ?? 0);
          return {
            id: Number(item.id || index + 1),
            skuId: item.skuId || `vip_goods_${index + 1}`,
            level: Number(item.level || 1),
            name: item.name || `会员套餐${index + 1}`,
            price: price.toFixed(2),
            originalPrice: original.toFixed(2),
            duration,
            desc: item.desc || '',
            sort: Number(item.sort || 0),
          };
        })
        .sort((a, b) => (a.sort - b.sort) || (a.id - b.id));
      return normalized;
    }

    const vipMonth = normalizeVipGoodsItem(config?.vipMonth, DEFAULT_VIP_CONFIG.vipMonth);
    const vipYear = normalizeVipGoodsItem(config?.vipYear, DEFAULT_VIP_CONFIG.vipYear);
    const svipMonth = normalizeVipGoodsItem(config?.svipMonth, DEFAULT_VIP_CONFIG.svipMonth);
    const svipYear = normalizeVipGoodsItem(config?.svipYear, DEFAULT_VIP_CONFIG.svipYear);

    return [
      { id: 1, ...vipMonth },
      { id: 2, ...vipYear },
      { id: 3, ...svipMonth },
      { id: 4, ...svipYear },
    ];
  }

  /**
   * 购买会员
   * 微信/支付宝返回 payUrl，余额支付返回空 payUrl
   */
  async vipPurchase(userId, params) {
    /**
     * 会员购买逻辑（余额支付时校准钱包余额）
     */
    const { skuId, payWay, couponId } = params || {};
    const userColumns = await this.getUserBusinessColumns();
    if (!userColumns.vipLevel || !userColumns.vipExpireTime) {
      throw new Error('当前系统未启用会员能力');
    }
    const goods = await this.vipGoods();
    const target = goods.find(item => item.skuId === skuId);
    if (!target) {
      throw new Error('商品不存在');
    }
    const orderNo = `VIP${Date.now()}`;
    const now = Math.floor(Date.now() / 1000);
    const user = await this.ctx.model.User.findOne({ where: { id: userId } });
    let couponDiscount = 0;
    let couponUserId = 0;
    if (couponId) {
      const applyResult = await this.ctx.service.coupon.applyUserCoupon(userId, couponId, target.price, 'vip');
      couponDiscount = Number(applyResult.discount || 0);
      couponUserId = applyResult.couponUser.id;
    }

    // 计算过期时间
    const currentExpire = Number(user.vipExpireTime || 0);
    const durationSeconds = Number(target.duration || 0) * 86400;
    // 如果当前未过期，则在原过期时间基础上增加；否则从当前时间开始计算
    const nextExpire = (currentExpire > now ? currentExpire : now) + durationSeconds;

    if (Number(payWay) === 3) {
      const balanceValue = await this.calcWalletBalance(userId);
      const price = Math.max(Number(target.price || 0) - couponDiscount, 0);
      if (balanceValue < price) {
        throw new Error('余额不足');
      }

      const nextBalance = balanceValue - price;
      await this.ctx.model.UserWallet.update({
        balance: nextBalance,
        updateTime: now,
      }, {
        where: { userId },
      });
      await this.ctx.model.UserWalletFlow.create({
        userId,
        orderId: 0,
        amount: price,
        flowType: 'consume',
        remark: `会员购买-${target.name}-${orderNo}`,
        createTime: now,
      });

      await this.ctx.model.User.update({
        vipLevel: Number(target.level || 1),
        vipExpireTime: nextExpire,
        updateTime: now,
      }, {
        where: { id: userId, isDelete: 0 },
      });
      await this.syncUserCache(userId);
      await this.sendVipPurchaseNotice(userId, target, nextExpire);
      if (couponUserId) {
        await this.ctx.service.coupon.useUserCoupon(couponUserId, 0);
      }

      return {
        orderNo,
        payUrl: '',
      };
    }

    await this.ctx.model.User.update({
      vipLevel: Number(target.level || 1),
      vipExpireTime: nextExpire,
      updateTime: now,
    }, {
      where: { id: userId, isDelete: 0 },
    });
    await this.syncUserCache(userId);
    await this.sendVipPurchaseNotice(userId, target, nextExpire);
    if (couponUserId) {
      await this.ctx.service.coupon.useUserCoupon(couponUserId, 0);
    }
    return {
      orderNo,
      payUrl: `mock://pay/${orderNo}`,
    };
  }

  /**
   * 从扩展信息中提取授权ID（兼容多种历史字段）
   * @param {object} extra 扩展信息
   * @returns {number} 授权ID
   */
  resolveLicenseMessageExtraId(extra = {}) {
    if (!extra || typeof extra !== 'object') {
      return 0;
    }
    const directId = Number(extra.licenseId || extra.license_id || 0);
    if (directId > 0) {
      return directId;
    }
    const nestedLicense = extra.license && typeof extra.license === 'object' ? extra.license : null;
    const nestedId = Number(nestedLicense?.licenseId || nestedLicense?.license_id || nestedLicense?.id || 0);
    if (nestedId > 0) {
      return nestedId;
    }
    const payload = extra.payload && typeof extra.payload === 'object' ? extra.payload : null;
    return Number(payload?.licenseId || payload?.license_id || 0);
  }

  /**
   * 根据订单ID反查授权ID（用于授权审核消息兜底）
   * @param {number} userId 用户ID
   * @param {number} orderId 订单ID
   * @returns {Promise<number>} 授权ID
   */
  async resolveLicenseIdByOrderId(userId, orderId) {
    const { ctx } = this;
    const targetOrderId = Number(orderId || 0);
    if (!targetOrderId) {
      return 0;
    }
    const tableName = this.getLicenseTableName();
    const orderColumn = await this.resolveExistingColumn(tableName, [ 'order_id', 'orderId' ]);
    if (!orderColumn) {
      return 0;
    }
    const [ row ] = await ctx.model.query(
      `
      SELECT id
      FROM ${tableName}
      WHERE user_id = ?
        AND \`${orderColumn}\` = ?
        AND is_delete = 0
      ORDER BY id DESC
      LIMIT 1
      `,
      {
        replacements: [ Number(userId || 0), targetOrderId ],
        type: ctx.app.Sequelize.QueryTypes.SELECT,
      }
    );
    return Number(row?.id || 0);
  }

  /**
   * 规范化用户消息扩展信息，确保授权类消息带标准 licenseId
   * @param {number} userId 用户ID
   * @param {string} type 消息类型
   * @param {object} extra 原始扩展信息
   * @returns {Promise<object>} 规范化后的扩展信息
   */
  async normalizeUserMessageExtra(userId, type, extra = {}) {
    const noticeType = String(type || '').trim();
    const source = extra && typeof extra === 'object' ? { ...extra } : {};
    if (![ 'license_domain_audit', 'license_audit' ].includes(noticeType)) {
      return source;
    }
    const directLicenseId = this.resolveLicenseMessageExtraId(source);
    if (directLicenseId > 0) {
      return {
        ...source,
        licenseId: directLicenseId,
      };
    }
    const orderId = Number(source.orderId || source.order_id || 0);
    if (orderId > 0) {
      const resolvedLicenseId = await this.resolveLicenseIdByOrderId(userId, orderId);
      if (resolvedLicenseId > 0) {
        return {
          ...source,
          licenseId: resolvedLicenseId,
        };
      }
    }
    return source;
  }

  /**
   * 创建用户站内信消息
   */
  async createUserMessage(userId, title, content, type = 'system', extra = {}) {
    const { ctx } = this;
    await this.ensureUserMessageExtraColumn();
    const now = Math.floor(Date.now() / 1000);
    const normalizedExtra = await this.normalizeUserMessageExtra(userId, type, extra);
    const hasExtra = normalizedExtra && typeof normalizedExtra === 'object' && Object.keys(normalizedExtra).length > 0;
    const extraText = hasExtra ? JSON.stringify(normalizedExtra) : '';
    await ctx.model.UserMessage.create({
      userId,
      title: String(title || '').slice(0, 100),
      content: content || '',
      extra: extraText,
      type,
      isRead: 0,
      readTime: 0,
      createTime: now,
    });
  }

  /**
   * 发送会员购买提醒
   */
  async sendVipPurchaseNotice(userId, target, nextExpire) {
    const { ctx } = this;
    const setting = await ctx.service.setting.vipNotice.detail();
    if (Number(setting.enablePurchase) !== 1) return;
    const expireTime = moment(nextExpire * 1000).format('YYYY-MM-DD HH:mm:ss');
    const content = String(setting.purchaseTemplate || '')
      .replace('{vipName}', target.name || '')
      .replace('{expireTime}', expireTime);
    await this.createUserMessage(
      userId,
      '会员购买成功提醒',
      content,
      'system'
    );
  }

  /**
   * 发送会员过期提醒（按配置控制提醒次数与间隔）
   */
  async sendVipExpireNoticeIfNeeded(userId, vipExpireTime) {
    const { ctx } = this;
    const setting = await ctx.service.setting.vipNotice.detail();
    if (Number(setting.enableExpire) !== 1) return;
    if (!vipExpireTime || Number(vipExpireTime) <= 0) return;

    const now = Math.floor(Date.now() / 1000);
    const remindDays = Number(setting.expireRemindDays || 0);
    const remindStart = Number(vipExpireTime) - remindDays * 86400;
    if (now < remindStart) return;

    const intervalHours = Number(setting.expireRemindIntervalHours || 24);
    const intervalSeconds = Math.max(intervalHours, 1) * 3600;
    const maxTimes = Math.max(Number(setting.expireRemindTimes || 1), 1);

    const sentCount = await ctx.model.UserMessage.count({
      where: {
        userId,
        title: '会员过期提醒',
        type: 'system',
        createTime: { [Op.gte]: remindStart },
      },
    });
    if (sentCount >= maxTimes) return;

    const lastMessage = await ctx.model.UserMessage.findOne({
      where: {
        userId,
        title: '会员过期提醒',
        type: 'system',
      },
      order: [[ 'id', 'DESC' ]],
    });
    if (lastMessage && (now - Number(lastMessage.createTime || 0)) < intervalSeconds) {
      return;
    }

    const content = setting.expireTemplate || '您的会员已过期，请及时续费。';
    await this.createUserMessage(
      userId,
      '会员过期提醒',
      content,
      'system'
    );
  }

  /**
   * 确保用户安全配置表存在（2FA）
   */
  async ensureUserSecurityTable() {
    const { ctx, app } = this;
    if (app.__userSecurityTableReady) return true;
    try {
      await ctx.model.query(`
        CREATE TABLE IF NOT EXISTS \`la_user_security\` (
          \`id\` int unsigned NOT NULL AUTO_INCREMENT,
          \`user_id\` int unsigned NOT NULL DEFAULT 0,
          \`two_fa_enabled\` tinyint unsigned NOT NULL DEFAULT 0 COMMENT '是否启用2FA',
          \`two_fa_type\` varchar(20) NOT NULL DEFAULT '' COMMENT '2FA类型：mobile/email',
          \`two_fa_account\` varchar(120) NOT NULL DEFAULT '' COMMENT '2FA账号',
          \`last_verify_time\` int unsigned NOT NULL DEFAULT 0 COMMENT '最近通过2FA时间',
          \`is_delete\` tinyint unsigned NOT NULL DEFAULT 0,
          \`create_time\` int unsigned NOT NULL DEFAULT 0,
          \`update_time\` int unsigned NOT NULL DEFAULT 0,
          \`delete_time\` int unsigned NOT NULL DEFAULT 0,
          PRIMARY KEY (\`id\`),
          UNIQUE KEY \`uk_user_id\` (\`user_id\`),
          KEY \`idx_enabled\` (\`two_fa_enabled\`, \`is_delete\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);
      app.__userSecurityTableReady = true;
      return true;
    } catch (error) {
      ctx.logger.warn(`ensureUserSecurityTable skipped: ${error.message || error}`);
      return false;
    }
  }

  /**
   * 获取用户 2FA 配置
   */
  async getUserSecurityRow(userId) {
    const { ctx } = this;
    await this.ensureUserSecurityTable();
    const [ row ] = await ctx.model.query(
      `
      SELECT *
      FROM la_user_security
      WHERE user_id = ?
        AND is_delete = 0
      LIMIT 1
      `,
      {
        replacements: [ Number(userId || 0) ],
        type: ctx.app.Sequelize.QueryTypes.SELECT,
      }
    );
    return row || null;
  }

  /**
   * 写入用户 2FA 配置
   */
  async saveUserSecurityRow(userId, payload = {}) {
    const { ctx } = this;
    await this.ensureUserSecurityTable();
    const now = Math.floor(Date.now() / 1000);
    const exists = await this.getUserSecurityRow(userId);
    const nextData = {
      enabled: Number(payload.two_fa_enabled || 0) === 1 ? 1 : 0,
      type: String(payload.two_fa_type || '').trim(),
      account: String(payload.two_fa_account || '').trim(),
      verifyTime: Number(payload.last_verify_time || 0),
    };
    if (exists) {
      await ctx.model.query(
        `
        UPDATE la_user_security
        SET two_fa_enabled = ?,
            two_fa_type = ?,
            two_fa_account = ?,
            last_verify_time = ?,
            update_time = ?,
            is_delete = 0,
            delete_time = 0
        WHERE user_id = ?
        `,
        {
          replacements: [ nextData.enabled, nextData.type, nextData.account, nextData.verifyTime, now, Number(userId || 0) ],
          type: ctx.app.Sequelize.QueryTypes.UPDATE,
        }
      );
      return true;
    }
    await ctx.model.query(
      `
      INSERT INTO la_user_security (
        user_id, two_fa_enabled, two_fa_type, two_fa_account, last_verify_time,
        is_delete, create_time, update_time, delete_time
      ) VALUES (?, ?, ?, ?, ?, 0, ?, ?, 0)
      `,
      {
        replacements: [ Number(userId || 0), nextData.enabled, nextData.type, nextData.account, nextData.verifyTime, now, now ],
        type: ctx.app.Sequelize.QueryTypes.INSERT,
      }
    );
    return true;
  }

  /**
   * 规范化 2FA 通道类型
   */
  normalizeTwoFactorType(type = '') {
    const normalized = String(type || '').trim().toLowerCase();
    if (normalized === 'email') return 'email';
    if (normalized === 'mobile') return 'mobile';
    return '';
  }

  /**
   * 脱敏 2FA 账号
   */
  maskTwoFactorAccount(account = '', type = 'mobile') {
    const text = String(account || '').trim();
    if (!text) return '';
    if (String(type) === 'email') {
      const [ name = '', domain = '' ] = text.split('@');
      if (!name || !domain) return text;
      return `${name.slice(0, 2)}${'*'.repeat(Math.max(2, name.length - 2))}@${domain}`;
    }
    if (text.length <= 7) return text;
    return `${text.slice(0, 3)}****${text.slice(-4)}`;
  }

  /**
   * 构建 2FA 验证码缓存键
   */
  buildTwoFactorCodeCacheKey(purpose, type, account, sceneId) {
    return `user:2fa:code:${String(purpose || '')}:${String(type || '')}:${String(account || '')}:${String(sceneId || '')}`;
  }

  /**
   * 下发 2FA 验证码（当前版本通过日志输出用于联调）
   */
  async issueTwoFactorCode({ userId, purpose, type, account, sceneId }) {
    const { ctx } = this;
    const now = Math.floor(Date.now() / 1000);
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const key = this.buildTwoFactorCodeCacheKey(purpose, type, account, sceneId);
    await ctx.service.redis.set(key, {
      code,
      userId: Number(userId || 0),
      purpose: String(purpose || ''),
      type: String(type || ''),
      account: String(account || ''),
      sceneId: String(sceneId || ''),
      createTime: now,
    }, 300);
    if (String(ctx.app.config.env || '') !== 'prod') {
      ctx.logger.info(`[2fa] ${purpose} code(${type}:${account}) => ${code}`);
    }
    return {
      method: String(type || ''),
      maskedAccount: this.maskTwoFactorAccount(account, type),
      expireSeconds: 300,
    };
  }

  /**
   * 验证 2FA 验证码
   */
  async verifyTwoFactorCode({ userId, purpose, type, account, sceneId, code }) {
    const { ctx } = this;
    const key = this.buildTwoFactorCodeCacheKey(purpose, type, account, sceneId);
    const cached = await ctx.service.redis.get(key);
    if (!cached) {
      throw new Error('验证码已过期，请重新发送');
    }
    if (Number(cached.userId || 0) !== Number(userId || 0)) {
      throw new Error('验证码校验失败');
    }
    if (String(cached.code || '') !== String(code || '').trim()) {
      throw new Error('验证码错误');
    }
    await ctx.service.redis.del(key);
    return true;
  }

  /**
   * 获取当前账号 2FA 状态
   */
  async twoFactorStatus(userId) {
    const { ctx } = this;
    const user = await ctx.model.User.findOne({
      where: { id: Number(userId || 0), isDelete: 0 },
      attributes: [ 'id', 'mobile', 'email' ],
    });
    if (!user) {
      throw new Error('用户不存在');
    }
    const row = await this.getUserSecurityRow(userId);
    const method = this.normalizeTwoFactorType(row?.two_fa_type || '');
    const enabled = Number(row?.two_fa_enabled || 0) === 1;
    const account = String(row?.two_fa_account || '');
    return {
      enabled,
      method,
      maskedAccount: enabled ? this.maskTwoFactorAccount(account, method) : '',
      hasMobile: Boolean(String(user.mobile || '').trim()),
      hasEmail: Boolean(String(user.email || '').trim()),
      lastVerifyTime: Number(row?.last_verify_time || 0),
    };
  }

  /**
   * 发送 2FA 配置验证码（启用/关闭）
   */
  async sendTwoFactorSecurityCode(userId, params = {}) {
    const { ctx } = this;
    const purpose = String(params.purpose || '').trim().toLowerCase();
    if (![ 'enable', 'disable' ].includes(purpose)) {
      throw new Error('验证码用途不正确');
    }
    const user = await ctx.model.User.findOne({
      where: { id: Number(userId || 0), isDelete: 0 },
      attributes: [ 'id', 'mobile', 'email' ],
    });
    if (!user) {
      throw new Error('用户不存在');
    }
    const row = await this.getUserSecurityRow(userId);
    const inputType = this.normalizeTwoFactorType(params.type || '');
    const method = purpose === 'disable'
      ? (this.normalizeTwoFactorType(row?.two_fa_type || '') || inputType)
      : inputType;
    if (!method) {
      throw new Error('请选择验证方式');
    }
    const account = method === 'mobile' ? String(user.mobile || '').trim() : String(user.email || '').trim();
    if (!account) {
      throw new Error(method === 'mobile' ? '请先绑定手机号' : '请先绑定邮箱');
    }
    return await this.issueTwoFactorCode({
      userId,
      purpose: `security_${purpose}`,
      type: method,
      account,
      sceneId: String(userId || 0),
    });
  }

  /**
   * 启用 2FA
   */
  async enableTwoFactor(userId, params = {}) {
    const { ctx } = this;
    const password = String(params.password || '').trim();
    const code = String(params.code || '').trim();
    const method = this.normalizeTwoFactorType(params.type || '');
    if (!password || !code || !method) {
      throw new Error('参数错误');
    }
    const user = await ctx.model.User.findOne({
      where: { id: Number(userId || 0), isDelete: 0 },
      attributes: [ 'id', 'password', 'mobile', 'email' ],
    });
    if (!user) {
      throw new Error('用户不存在');
    }
    if (String(user.password || '') !== md5(password)) {
      throw new Error('当前密码不正确');
    }
    const account = method === 'mobile' ? String(user.mobile || '').trim() : String(user.email || '').trim();
    if (!account) {
      throw new Error(method === 'mobile' ? '请先绑定手机号' : '请先绑定邮箱');
    }
    await this.verifyTwoFactorCode({
      userId,
      purpose: 'security_enable',
      type: method,
      account,
      sceneId: String(userId || 0),
      code,
    });
    const now = Math.floor(Date.now() / 1000);
    await this.saveUserSecurityRow(userId, {
      two_fa_enabled: 1,
      two_fa_type: method,
      two_fa_account: account,
      last_verify_time: now,
    });
    return {
      enabled: true,
      method,
      maskedAccount: this.maskTwoFactorAccount(account, method),
    };
  }

  /**
   * 关闭 2FA
   */
  async disableTwoFactor(userId, params = {}) {
    const { ctx } = this;
    const password = String(params.password || '').trim();
    const code = String(params.code || '').trim();
    if (!password || !code) {
      throw new Error('参数错误');
    }
    const user = await ctx.model.User.findOne({
      where: { id: Number(userId || 0), isDelete: 0 },
      attributes: [ 'id', 'password', 'mobile', 'email' ],
    });
    if (!user) {
      throw new Error('用户不存在');
    }
    if (String(user.password || '') !== md5(password)) {
      throw new Error('当前密码不正确');
    }
    const row = await this.getUserSecurityRow(userId);
    const method = this.normalizeTwoFactorType(row?.two_fa_type || '');
    if (Number(row?.two_fa_enabled || 0) !== 1 || !method) {
      throw new Error('当前未开启 2FA');
    }
    const account = String(row?.two_fa_account || '').trim() || (method === 'mobile' ? String(user.mobile || '').trim() : String(user.email || '').trim());
    await this.verifyTwoFactorCode({
      userId,
      purpose: 'security_disable',
      type: method,
      account,
      sceneId: String(userId || 0),
      code,
    });
    await this.saveUserSecurityRow(userId, {
      two_fa_enabled: 0,
      two_fa_type: '',
      two_fa_account: '',
      last_verify_time: Math.floor(Date.now() / 1000),
    });
    return { enabled: false };
  }

  /**
   * 创建登录 2FA 挑战并下发验证码
   */
  async createLoginTwoFactorChallenge(user) {
    const { ctx } = this;
    const row = await this.getUserSecurityRow(user.id);
    const enabled = Number(row?.two_fa_enabled || 0) === 1;
    const method = this.normalizeTwoFactorType(row?.two_fa_type || '');
    if (!enabled || !method) return null;
    const account = String(row?.two_fa_account || '').trim() || (method === 'mobile' ? String(user.mobile || '').trim() : String(user.email || '').trim());
    if (!account) return null;
    const challengeToken = `${ctx.randomString()}_${Date.now()}`;
    const challengeKey = `user:2fa:login:challenge:${challengeToken}`;
    await ctx.service.redis.set(challengeKey, {
      userId: Number(user.id || 0),
      method,
      account,
      createTime: Math.floor(Date.now() / 1000),
    }, 300);
    await this.issueTwoFactorCode({
      userId: Number(user.id || 0),
      purpose: 'login',
      type: method,
      account,
      sceneId: challengeToken,
    });
    return {
      challengeToken,
      method,
      maskedAccount: this.maskTwoFactorAccount(account, method),
      expireSeconds: 300,
    };
  }

  /**
   * 重新发送登录 2FA 验证码
   */
  async sendLoginTwoFactorCode(params = {}) {
    const { ctx } = this;
    const challengeToken = String(params.challengeToken || '').trim();
    if (!challengeToken) {
      throw new Error('挑战令牌不能为空');
    }
    const challenge = await ctx.service.redis.get(`user:2fa:login:challenge:${challengeToken}`);
    if (!challenge || !challenge.userId) {
      throw new Error('登录验证已过期，请重新登录');
    }
    return await this.issueTwoFactorCode({
      userId: Number(challenge.userId || 0),
      purpose: 'login',
      type: String(challenge.method || ''),
      account: String(challenge.account || ''),
      sceneId: challengeToken,
    });
  }

  /**
   * 校验登录 2FA 并签发正式令牌
   */
  async verifyLoginTwoFactor(params = {}) {
    const { ctx } = this;
    const challengeToken = String(params.challengeToken || '').trim();
    const code = String(params.code || '').trim();
    if (!challengeToken || !code) {
      throw new Error('参数错误');
    }
    const challengeKey = `user:2fa:login:challenge:${challengeToken}`;
    const challenge = await ctx.service.redis.get(challengeKey);
    if (!challenge || !challenge.userId) {
      throw new Error('登录验证已过期，请重新登录');
    }
    await this.verifyTwoFactorCode({
      userId: Number(challenge.userId || 0),
      purpose: 'login',
      type: String(challenge.method || ''),
      account: String(challenge.account || ''),
      sceneId: challengeToken,
      code,
    });
    const user = await ctx.model.User.findOne({
      where: { id: Number(challenge.userId || 0), isDelete: 0 },
    });
    if (!user) {
      throw new Error('账号不存在');
    }
    if (Number(user.isDisable || 0) === 1) {
      throw new Error('账号已禁用');
    }
    const now = Math.floor(Date.now() / 1000);
    await ctx.model.User.update({
      lastLoginIp: ctx.request.ip,
      lastLoginTime: now,
      updateTime: now,
    }, {
      where: { id: user.id },
    });
    await this.saveUserSecurityRow(user.id, {
      two_fa_enabled: 1,
      two_fa_type: String(challenge.method || ''),
      two_fa_account: String(challenge.account || ''),
      last_verify_time: now,
    });
    await this.recordLoginLog(user.id, 1);
    const token = await this.createUserToken(user, {
      loginType: 'password+2fa',
      twoFactorVerified: true,
    });
    await ctx.service.redis.del(challengeKey);
    await this.ensurePersonalCenterDemoData(user.id, user.nickname || user.username || '');
    const userInfo = await this.getSafeUserInfoById(user.id, true);
    return { user: userInfo, userInfo, token };
  }

  /**
   * 活跃登录设备列表（会话）
   */
  async sessionList(userId) {
    const { ctx } = this;
    const appConfig = this.getAppConfig();
    const userTokenKey = appConfig.userTokenKey || extendConfig.userTokenKey;
    const userTokenSet = appConfig.userTokenSet || extendConfig.userTokenSet;
    const currentToken = this.extractUserTokenFromRequest();
    if (!ctx.app.redis) {
      return { lists: [], total: 0 };
    }
    const tokens = await ctx.app.redis.smembers(userTokenSet + userId);
    const lists = [];
    const tokenTtlSeconds = this.getUserTokenTtlSeconds();
    for (const token of (tokens || [])) {
      const uid = await ctx.service.redis.get(userTokenKey + token);
      if (Number(uid || 0) !== Number(userId || 0)) {
        continue;
      }
      const remainSeconds = Number(await ctx.service.redis.ttl(userTokenKey + token) || -1);
      const session = await this.getUserSessionByToken(token);
      lists.push({
        sessionId: String(session?.sessionId || token.slice(0, 24)),
        token: String(token || ''),
        ip: String(session?.ip || ''),
        device: String(session?.device || '未知设备'),
        browser: String(session?.browser?.name || ''),
        os: String(session?.os?.name || ''),
        loginType: String(session?.loginType || 'password'),
        twoFactorVerified: Number(session?.twoFactorVerified || 0) === 1,
        createTime: Number(session?.createTime || 0),
        lastActiveTime: Number(session?.lastActiveTime || session?.createTime || 0),
        expireInSeconds: remainSeconds > 0 ? remainSeconds : 0,
        willExpireAt: remainSeconds > 0 ? Math.floor(Date.now() / 1000) + remainSeconds : 0,
        ttlTotal: tokenTtlSeconds,
        isCurrent: token === currentToken,
      });
    }
    lists.sort((a, b) => Number(b.lastActiveTime || 0) - Number(a.lastActiveTime || 0));
    return {
      lists,
      total: lists.length,
    };
  }

  /**
   * 下线指定设备
   */
  async sessionKick(userId, params = {}) {
    const { ctx } = this;
    const token = String(params.token || '').trim();
    if (!token) {
      throw new Error('会话令牌不能为空');
    }
    const currentToken = this.extractUserTokenFromRequest();
    if (token === currentToken) {
      throw new Error('不能下线当前设备，请直接退出登录');
    }
    const appConfig = this.getAppConfig();
    const userTokenKey = appConfig.userTokenKey || extendConfig.userTokenKey;
    const userTokenSet = appConfig.userTokenSet || extendConfig.userTokenSet;
    const bindUserId = await ctx.service.redis.get(userTokenKey + token);
    if (Number(bindUserId || 0) !== Number(userId || 0)) {
      throw new Error('设备不存在或无权限下线');
    }
    await ctx.service.redis.del(userTokenKey + token);
    await this.removeUserSessionByToken(token);
    if (ctx.app.redis) {
      await ctx.app.redis.srem(userTokenSet + userId, token);
    }
    return true;
  }

  /**
   * 发送绑定验证码
   */
  async sendBindCode(userId, params) {
    const { ctx } = this;
    const { type, account } = params;
    if (!type || !account) {
      throw new Error('参数错误');
    }

    const allowTypes = [ 'bind_mobile', 'bind_email' ];
    if (!allowTypes.includes(type)) {
      throw new Error('类型错误');
    }
    const userColumns = await this.getUserBusinessColumns();
    if (type === 'bind_email' && !userColumns.email) {
      throw new Error('当前系统未启用邮箱绑定');
    }

    if (type === 'bind_mobile' && !/^\d{6,20}$/.test(String(account))) {
      throw new Error('手机号格式错误');
    }
    if (type === 'bind_email' && !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(String(account))) {
      throw new Error('邮箱格式错误');
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const key = `user:bind_code:${type}:${account}`;
    await ctx.service.redis.set(key, { code, userId }, 300);
    return { code };
  }

  /**
   * 绑定手机号/邮箱
   */
  async bindAccount(userId, params) {
    const { ctx } = this;
    const { type, account, code } = params;
    if (!type || !account || !code) {
      throw new Error('参数错误');
    }

    const allowTypes = [ 'mobile', 'email' ];
    if (!allowTypes.includes(type)) {
      throw new Error('类型错误');
    }
    const userColumns = await this.getUserBusinessColumns();
    if (type === 'email' && !userColumns.email) {
      throw new Error('当前系统未启用邮箱绑定');
    }

    const cacheKey = `user:bind_code:bind_${type}:${account}`;
    const cached = await ctx.service.redis.get(cacheKey);
    if (!cached || String(cached.code) !== String(code)) {
      throw new Error('验证码错误');
    }

    const exists = await ctx.model.User.findOne({
      where: {
        [type]: account,
        isDelete: 0,
        id: { [Op.ne]: userId },
      },
    });
    if (exists) {
      throw new Error(type === 'mobile' ? '手机号已被绑定' : '邮箱已被绑定');
    }

    const now = Math.floor(Date.now() / 1000);
    const updateData = {
      updateTime: now,
    };
    updateData[type] = account;
    await ctx.model.User.update(updateData, {
      where: { id: userId, isDelete: 0 },
    });
    await ctx.service.redis.del(cacheKey);
    await this.syncUserCache(userId);
  }

  /**
   * 解绑手机号/邮箱
   */
  async unbindAccount(userId, params) {
    const { ctx } = this;
    const { type } = params || {};
    if (!type) {
      throw new Error('参数错误');
    }
    const allowTypes = [ 'mobile', 'email' ];
    if (!allowTypes.includes(type)) {
      throw new Error('类型错误');
    }
    const userColumns = await this.getUserBusinessColumns();
    if (type === 'email' && !userColumns.email) {
      throw new Error('当前系统未启用邮箱绑定');
    }
    const now = Math.floor(Date.now() / 1000);
    await ctx.model.User.update({
      [type]: '',
      updateTime: now,
    }, {
      where: { id: userId, isDelete: 0 },
    });
    await this.syncUserCache(userId);
  }

  /**
   * 注销账号
   */
  async cancelAccount(userId) {
    const { ctx } = this;
    const now = Math.floor(Date.now() / 1000);
    await ctx.model.User.update({
      isDelete: 1,
      isDisable: 1,
      deleteTime: now,
      updateTime: now,
    }, {
      where: { id: userId, isDelete: 0 },
    });
    await this.revokeUserTokens(userId);
  }

  /**
   * 清理用户登录态
   */
  async revokeUserTokens(userId) {
    const { ctx } = this;
    const appConfig = this.getAppConfig();
    const userTokenKey = appConfig.userTokenKey || extendConfig.userTokenKey;
    const userTokenSet = appConfig.userTokenSet || extendConfig.userTokenSet;
    const userInfoKey = appConfig.userInfoKey || extendConfig.userInfoKey;
    const setKey = userTokenSet + userId;
    if (ctx.app.redis) {
      const tokens = await ctx.app.redis.smembers(setKey);
      if (tokens && tokens.length > 0) {
        for (const token of tokens) {
          await ctx.app.redis.del(userTokenKey + token);
          await this.removeUserSessionByToken(token);
        }
      }
      await ctx.app.redis.del(setKey);
      await ctx.app.redis.del(userInfoKey + userId);
    } else {
      await ctx.service.redis.del(userInfoKey + userId);
    }
  }

  /**
   * 发票列表
   */
  async invoiceList(userId, params) {
    const { ctx } = this;
    const pageNo = Number(params.pageNo || 1);
    const pageSize = Number(params.pageSize || 10);
    const { count, rows } = await ctx.model.UserInvoice.findAndCountAll({
      where: { userId, isDelete: 0 },
      limit: pageSize,
      offset: pageSize * (pageNo - 1),
      order: [[ 'id', 'DESC' ]],
    });

    const lists = rows.map(item => ({
      id: item.id,
      title: item.title,
      amount: Number(item.amount).toFixed(2),
      type: item.type,
      status: item.status,
      rejectReason: item.rejectReason || '',
      createTime: item.createTime,
      url: item.url,
    }));

    return {
      pageNo,
      pageSize,
      total: count,
      lists,
    };
  }

  /**
   * 申请开票
   */
  async invoiceApply(userId, params) {
    const { ctx } = this;
    const { orderId, title, taxNo = '', email = '' } = params;
    if (!orderId || !title) {
      throw new Error('参数错误');
    }

    const order = await ctx.model.Order.findOne({
      where: { id: orderId, userId, isDelete: 0 },
    });
    if (!order) {
      throw new Error('订单不存在');
    }

    const exists = await ctx.model.UserInvoice.findOne({
      where: { orderId, userId, isDelete: 0 },
    });
    if (exists) {
      if (Number(exists.status) === 3) {
        const now = Math.floor(Date.now() / 1000);
        await ctx.model.UserInvoice.update({
          title,
          taxNo,
          email,
          amount: order.price || 0,
          status: 0,
          rejectReason: '',
          updateTime: now,
        }, {
          where: { id: exists.id, isDelete: 0 },
        });
        return;
      }
      throw new Error('该订单已申请开票');
    }

    const now = Math.floor(Date.now() / 1000);
    await ctx.model.UserInvoice.create({
      userId,
      orderId,
      title,
      taxNo,
      email,
      amount: order.price || 0,
      type: '普通发票',
      status: 0,
      url: '',
      rejectReason: '',
      isDelete: 0,
      createTime: now,
      updateTime: now,
    });
  }

  /**
   * 意见反馈
   */
  async feedbackAdd(userId, params) {
    const { ctx } = this;
    const { type, content, contact = '' } = params;
    if (!type || !content) {
      throw new Error('参数错误');
    }
    const now = Math.floor(Date.now() / 1000);
    await ctx.model.UserFeedback.create({
      userId,
      type,
      content,
      contact,
      status: 0,
      isDelete: 0,
      createTime: now,
    });
  }

  /**
   * 后台用户统计
   */
  async adminStats() {
    const { ctx } = this;
    const now = Math.floor(Date.now() / 1000);
    const dayStart = now - (now % 86400);
    const userColumns = await this.getUserBusinessColumns();

    const [ total, active, disabled, today ] = await Promise.all([
      ctx.model.User.count({ where: { isDelete: 0 } }),
      ctx.model.User.count({ where: { isDelete: 0, isDisable: 0 } }),
      ctx.model.User.count({ where: { isDelete: 0, isDisable: 1 } }),
      ctx.model.User.count({ where: { isDelete: 0, createTime: { [Op.gte]: dayStart } } }),
    ]);
    let vip = 0;
    let svip = 0;
    if (userColumns.vipLevel) {
      [ vip, svip ] = await Promise.all([
        ctx.model.User.count({ where: { isDelete: 0, vipLevel: 1 } }),
        ctx.model.User.count({ where: { isDelete: 0, vipLevel: 2 } }),
      ]);
    }

    return {
      total,
      active,
      disabled,
      vip,
      svip,
      today,
    };
  }

  /**
   * 用户分组列表
   */
  async groupList() {
    const { ctx } = this;
    await this.ensureUserCenterMetaTables();
    const rows = await ctx.model.UserGroup.findAll({
      where: { isDelete: 0 },
      order: [[ 'sort', 'DESC' ], [ 'id', 'DESC' ]],
    });
    return rows;
  }

  async groupAdd(params) {
    const { ctx } = this;
    await this.ensureUserCenterMetaTables();
    const { name = '', remark = '', sort = 0 } = params;
    if (!name) {
      throw new Error('分组名称不能为空');
    }
    const now = Math.floor(Date.now() / 1000);
    await ctx.model.UserGroup.create({
      name,
      remark,
      sort,
      createTime: now,
      updateTime: now,
    });
  }

  async groupEdit(params) {
    const { ctx } = this;
    await this.ensureUserCenterMetaTables();
    const { id, name = '', remark = '', sort = 0 } = params;
    if (!id) {
      throw new Error('分组ID不能为空');
    }
    const now = Math.floor(Date.now() / 1000);
    await ctx.model.UserGroup.update({
      name,
      remark,
      sort,
      updateTime: now,
    }, {
      where: { id, isDelete: 0 },
    });
  }

  async groupDel(id) {
    const { ctx } = this;
    await this.ensureUserCenterMetaTables();
    if (!id) {
      throw new Error('分组ID不能为空');
    }
    const now = Math.floor(Date.now() / 1000);
    await ctx.model.UserGroup.update({
      isDelete: 1,
      updateTime: now,
    }, {
      where: { id },
    });
  }

  /**
   * 用户标签列表
   */
  async tagList() {
    const { ctx } = this;
    await this.ensureUserCenterMetaTables();
    const rows = await ctx.model.UserTag.findAll({
      where: { isDelete: 0 },
      order: [[ 'id', 'DESC' ]],
    });
    return rows;
  }

  async tagAdd(params) {
    const { ctx } = this;
    await this.ensureUserCenterMetaTables();
    const { name = '', color = '' } = params;
    if (!name) {
      throw new Error('标签名称不能为空');
    }
    const now = Math.floor(Date.now() / 1000);
    await ctx.model.UserTag.create({
      name,
      color,
      createTime: now,
      updateTime: now,
    });
  }

  async tagEdit(params) {
    const { ctx } = this;
    await this.ensureUserCenterMetaTables();
    const { id, name = '', color = '' } = params;
    if (!id) {
      throw new Error('标签ID不能为空');
    }
    const now = Math.floor(Date.now() / 1000);
    await ctx.model.UserTag.update({
      name,
      color,
      updateTime: now,
    }, {
      where: { id, isDelete: 0 },
    });
  }

  async tagDel(id) {
    const { ctx } = this;
    await this.ensureUserCenterMetaTables();
    if (!id) {
      throw new Error('标签ID不能为空');
    }
    const now = Math.floor(Date.now() / 1000);
    await ctx.model.UserTag.update({
      isDelete: 1,
      updateTime: now,
    }, {
      where: { id },
    });
  }

  async tagBind(userId, tagIds) {
    const { ctx } = this;
    await this.ensureUserCenterMetaTables();
    if (!userId) {
      throw new Error('用户ID不能为空');
    }
    const cleaned = Array.isArray(tagIds)
      ? Array.from(new Set(tagIds.filter(Boolean).map(id => Number(id))))
      : [];
    await ctx.model.UserTagRel.destroy({ where: { userId } });
    if (cleaned.length === 0) {
      return [];
    }
    const now = Math.floor(Date.now() / 1000);
    const rows = cleaned.map(tagId => ({
      userId,
      tagId,
      createTime: now,
    }));
    await ctx.model.UserTagRel.bulkCreate(rows);
    return cleaned;
  }

  /**
   * 用户等级列表
   */
  async levelList() {
    const { ctx } = this;
    await this.ensureUserCenterMetaTables();
    const rows = await ctx.model.UserLevel.findAll({
      where: { isDelete: 0 },
      order: [[ 'levelValue', 'ASC' ], [ 'id', 'ASC' ]],
    });
    return rows;
  }

  async levelAdd(params) {
    const { ctx } = this;
    await this.ensureUserCenterMetaTables();
    const { name = '', levelValue = 0, remark = '', isDefault = 0 } = params;
    if (!name) {
      throw new Error('等级名称不能为空');
    }
    const now = Math.floor(Date.now() / 1000);
    if (Number(isDefault) === 1) {
      await ctx.model.UserLevel.update({
        isDefault: 0,
        updateTime: now,
      }, {
        where: { isDelete: 0 },
      });
    }
    await ctx.model.UserLevel.create({
      name,
      levelValue: Number(levelValue) || 0,
      remark,
      isDefault: Number(isDefault) === 1 ? 1 : 0,
      createTime: now,
      updateTime: now,
    });
  }

  async levelEdit(params) {
    const { ctx } = this;
    await this.ensureUserCenterMetaTables();
    const { id, name = '', levelValue = 0, remark = '', isDefault = 0 } = params;
    if (!id) {
      throw new Error('等级ID不能为空');
    }
    const now = Math.floor(Date.now() / 1000);
    if (Number(isDefault) === 1) {
      await ctx.model.UserLevel.update({
        isDefault: 0,
        updateTime: now,
      }, {
        where: { isDelete: 0 },
      });
    }
    await ctx.model.UserLevel.update({
      name,
      levelValue: Number(levelValue) || 0,
      remark,
      isDefault: Number(isDefault) === 1 ? 1 : 0,
      updateTime: now,
    }, {
      where: { id, isDelete: 0 },
    });
  }

  async levelDel(id) {
    const { ctx } = this;
    await this.ensureUserCenterMetaTables();
    if (!id) {
      throw new Error('等级ID不能为空');
    }
    const now = Math.floor(Date.now() / 1000);
    await ctx.model.UserLevel.update({
      isDelete: 1,
      updateTime: now,
    }, {
      where: { id },
    });
  }

  /**
   * 获取演示网站 ID 列表
   */
  async getDemoWebsiteIds(limit = 2) {
    const { ctx, app } = this;
    try {
      const rows = await app.model.query(
        `
        SELECT id
        FROM uied_website
        WHERE is_delete = 0
        ORDER BY is_featured DESC, is_hot DESC, id DESC
        LIMIT ?
        `,
        {
          replacements: [ Math.max(1, Number(limit || 2)) ],
          type: app.Sequelize.QueryTypes.SELECT,
        }
      );
      return (rows || []).map(item => Number(item.id || 0)).filter(Boolean);
    } catch (error) {
      ctx.logger.warn(`[user.getDemoWebsiteIds] 获取演示网站失败: ${error.message || error}`);
      return [];
    }
  }

  /**
   * 获取演示文章 ID 列表（la_article）
   */
  async getDemoLegacyArticleIds(limit = 2) {
    const { ctx } = this;
    try {
      const rows = await ctx.model.Article.findAll({
        where: { is_delete: 0, is_show: 1 },
        attributes: [ 'id' ],
        order: [[ 'id', 'DESC' ]],
        limit: Math.max(1, Number(limit || 2)),
      });
      return (rows || []).map(item => Number(item.id || 0)).filter(Boolean);
    } catch (error) {
      ctx.logger.warn(`[user.getDemoLegacyArticleIds] 获取演示文章失败: ${error.message || error}`);
      return [];
    }
  }

  /**
   * 获取演示文章 ID 列表（uied_article）
   */
  async getDemoUiedArticleIds(limit = 2) {
    const { ctx, app } = this;
    try {
      const rows = await app.model.query(
        `
        SELECT id
        FROM uied_article
        WHERE is_delete = 0
          AND status = 'published'
        ORDER BY id DESC
        LIMIT ?
        `,
        {
          replacements: [ Math.max(1, Number(limit || 2)) ],
          type: app.Sequelize.QueryTypes.SELECT,
        }
      );
      return (rows || []).map(item => Number(item.id || 0)).filter(Boolean);
    } catch (error) {
      ctx.logger.warn(`[user.getDemoUiedArticleIds] 获取演示文章失败: ${error.message || error}`);
      return [];
    }
  }

  /**
   * 为指定用户补齐个人中心演示数据（幂等）
   */
  async seedPersonalCenterDemoDataForUser(userId, nickname = '') {
    const { ctx, app } = this;
    const uid = Number(userId || 0);
    if (!uid) return;
    const now = Math.floor(Date.now() / 1000);
    const actorKey = `u:${uid}`;
    const user = await ctx.model.User.findOne({
      where: { id: uid, isDelete: 0 },
      attributes: [ 'id', 'nickname', 'username' ],
    });
    if (!user) return;

    /**
     * 预先保证网站互动表与评论表存在，避免新库初始化时写入失败。
     */
    await ctx.service.uied.websiteInteraction.ensureTables();
    await this.ensureUiedCommentTableCompatibility();

    const displayName = String(nickname || user.nickname || user.username || `用户${uid}`).slice(0, 100);
    const websiteIds = await this.getDemoWebsiteIds(2);
    const legacyArticleIds = await this.getDemoLegacyArticleIds(2);
    const uiedArticleIds = await this.getDemoUiedArticleIds(2);

    for (const websiteId of websiteIds) {
      try {
        await app.model.query(
          `
          INSERT INTO uied_website_favorite
          (website_id, actor_key, user_id, ip_hash, is_delete, create_time, update_time, delete_time)
          SELECT ?, ?, ?, '', 0, ?, ?, 0
          FROM DUAL
          WHERE NOT EXISTS (
            SELECT 1 FROM uied_website_favorite
            WHERE website_id = ? AND user_id = ? AND is_delete = 0
          )
          `,
          {
            replacements: [ websiteId, actorKey, uid, now, now, websiteId, uid ],
            type: app.Sequelize.QueryTypes.INSERT,
          }
        );
      } catch (error) {
        ctx.logger.warn(`[user.seedPersonalCenterDemoDataForUser] 收藏演示数据写入失败 websiteId=${websiteId}: ${error.message || error}`);
      }
      try {
        await app.model.query(
          `
          INSERT INTO uied_website_like
          (website_id, actor_key, user_id, ip_hash, is_delete, create_time, update_time, delete_time)
          SELECT ?, ?, ?, '', 0, ?, ?, 0
          FROM DUAL
          WHERE NOT EXISTS (
            SELECT 1 FROM uied_website_like
            WHERE website_id = ? AND user_id = ? AND is_delete = 0
          )
          `,
          {
            replacements: [ websiteId, actorKey, uid, now, now, websiteId, uid ],
            type: app.Sequelize.QueryTypes.INSERT,
          }
        );
      } catch (error) {
        ctx.logger.warn(`[user.seedPersonalCenterDemoDataForUser] 点赞演示数据写入失败 websiteId=${websiteId}: ${error.message || error}`);
      }
      try {
        await app.model.query(
          `
          INSERT INTO uied_website_comment
          (website_id, user_id, nickname, email, content, status, ip, user_agent, is_delete, create_time, update_time, delete_time)
          SELECT ?, ?, ?, '', '这是演示评论：这个网站收录质量不错，推荐持续关注。', 'approved', '', 'seed-script', 0, ?, ?, 0
          FROM DUAL
          WHERE NOT EXISTS (
            SELECT 1 FROM uied_website_comment
            WHERE website_id = ? AND user_id = ? AND is_delete = 0
          )
          `,
          {
            replacements: [ websiteId, uid, displayName, now, now, websiteId, uid ],
            type: app.Sequelize.QueryTypes.INSERT,
          }
        );
      } catch (error) {
        ctx.logger.warn(`[user.seedPersonalCenterDemoDataForUser] 网站评论演示数据写入失败 websiteId=${websiteId}: ${error.message || error}`);
      }
    }

    for (const articleId of legacyArticleIds) {
      const collectExists = await ctx.model.ArticleCollect.findOne({
        where: { user_id: uid, article_id: articleId, is_delete: 0 },
        attributes: [ 'id' ],
      });
      if (!collectExists) {
        await ctx.model.ArticleCollect.create({
          user_id: uid,
          article_id: articleId,
          is_delete: 0,
          create_time: now,
          update_time: now,
          delete_time: 0,
        });
      }

      const likeExists = await ctx.model.ArticleLike.findOne({
        where: { user_id: uid, article_id: articleId, is_delete: 0 },
        attributes: [ 'id' ],
      });
      if (!likeExists) {
        await ctx.model.ArticleLike.create({
          user_id: uid,
          article_id: articleId,
          is_delete: 0,
          create_time: now,
          update_time: now,
          delete_time: 0,
        });
      }
    }

    for (const articleId of uiedArticleIds) {
      try {
        await app.model.query(
          `
          INSERT INTO uied_article_comment
          (article_id, user_id, nickname, email, content, status, ip, user_agent, is_delete, create_time, update_time, delete_time)
          SELECT ?, ?, ?, '', '这是演示评论：文章内容结构清晰，实用性很高。', 'approved', '', 'seed-script', 0, ?, ?, 0
          FROM DUAL
          WHERE NOT EXISTS (
            SELECT 1 FROM uied_article_comment
            WHERE article_id = ? AND user_id = ? AND is_delete = 0
          )
          `,
          {
            replacements: [ articleId, uid, displayName, now, now, articleId, uid ],
            type: app.Sequelize.QueryTypes.INSERT,
          }
        );
      } catch (error) {
        ctx.logger.warn(`[user.seedPersonalCenterDemoDataForUser] 文章评论演示数据写入失败 articleId=${articleId}: ${error.message || error}`);
      }
    }

    const messageExists = await ctx.model.UserMessage.findOne({
      where: {
        userId: uid,
        type: 'system_notice',
      },
      attributes: [ 'id' ],
    });
    if (!messageExists) {
      await ctx.model.UserMessage.create({
        userId: uid,
        type: 'system_notice',
        title: '欢迎使用个人中心',
        content: '演示数据已初始化，你现在可以查看收藏、点赞、评论等模块。',
        extra: '',
        isRead: 0,
        readTime: 0,
        createTime: now,
      });
    }
  }

  /**
   * 管理端初始化测试用户（幂等）
   */
  async seedTestUsers() {
    const { ctx } = this;
    await this.ensureUserIdentityTable();
    await this.ensureUserAuthorProfileTable();
    await this.ensureUserCenterMetaTables();

    const now = Math.floor(Date.now() / 1000);
    const passwordMd5 = md5('123456');
    const accountRows = [
      {
        username: 'uied_test_buyer',
        nickname: '测试用户-买家',
        realName: '测试用户-买家',
        mobile: '13900000001',
        userType: 0,
        authorBio: '',
      },
      {
        username: 'uied_test_author',
        nickname: '测试用户-作者',
        realName: '测试用户-作者',
        mobile: '13900000002',
        userType: 1,
        authorBio: '这是用于投稿与作者中心联调的测试作者账号。',
      },
      {
        username: 'uied_test_free',
        nickname: '测试用户-Free',
        realName: '测试用户-Free',
        mobile: '13900001001',
        userType: 0,
        authorBio: '',
      },
      {
        username: 'uied_test_pro',
        nickname: '测试用户-Pro',
        realName: '测试用户-Pro',
        mobile: '13900001002',
        userType: 1,
        authorBio: '这是用于售卖版联调的 Pro 测试作者账号。',
      },
    ];

    const resultRows = [];
    for (const item of accountRows) {
      const where = {
        [Op.or]: [
          { username: item.username },
          { mobile: item.mobile },
        ],
      };
      const exists = await ctx.model.User.findOne({
        where,
        attributes: [ 'id', 'sn' ],
      });

      let userId = Number(exists?.id || 0);
      let action = 'created';
      if (!userId) {
        const created = await ctx.model.User.create({
          sn: 0,
          avatar: '/api/static/backend_avatar.png',
          realName: item.realName,
          nickname: item.nickname,
          username: item.username,
          password: passwordMd5,
          mobile: item.mobile,
          salt: '',
          sex: 0,
          channel: 4,
          isDisable: 0,
          isDelete: 0,
          lastLoginIp: '',
          lastLoginTime: 0,
          createTime: now,
          updateTime: now,
          deleteTime: 0,
        });
        userId = Number(created.id || 0);
      } else {
        action = 'updated';
        await ctx.model.User.update({
          avatar: '/api/static/backend_avatar.png',
          realName: item.realName,
          nickname: item.nickname,
          username: item.username,
          password: passwordMd5,
          mobile: item.mobile,
          channel: 4,
          isDisable: 0,
          isDelete: 0,
          deleteTime: 0,
          updateTime: now,
        }, {
          where: { id: userId },
        });
      }

      if (Number(exists?.sn || 0) <= 0) {
        await ctx.model.User.update({
          sn: userId,
          updateTime: now,
        }, {
          where: { id: userId },
        });
      }

      await this.setUserType(userId, item.userType);
      if (Number(item.userType) === 1) {
        const profile = await ctx.model.UserAuthorProfile.findOne({
          where: { user_id: userId },
          attributes: [ 'id' ],
        });
        if (profile) {
          await ctx.model.UserAuthorProfile.update({
            display_name: item.nickname,
            bio: item.authorBio,
            is_public: 1,
            is_delete: 0,
            delete_time: 0,
            update_time: now,
          }, {
            where: { id: Number(profile.id || 0) },
          });
        } else {
          await ctx.model.UserAuthorProfile.create({
            user_id: userId,
            display_name: item.nickname,
            bio: item.authorBio,
            homepage: '',
            xiaohongshu: '',
            weibo: '',
            is_public: 1,
            is_delete: 0,
            create_time: now,
            update_time: now,
            delete_time: 0,
          });
        }
      }

      await this.seedPersonalCenterDemoDataForUser(userId, item.nickname);
      resultRows.push({
        id: userId,
        username: item.username,
        mobile: item.mobile,
        password: '123456',
        userType: this.normalizeUserType(item.userType),
        userTypeName: this.getUserTypeLabel(item.userType),
        action,
      });
    }

    const tomdaUser = await ctx.model.User.findOne({
      where: { username: 'tomda', isDelete: 0 },
      attributes: [ 'id', 'nickname' ],
    });
    if (tomdaUser && Number(tomdaUser.id || 0) > 0) {
      await this.seedPersonalCenterDemoDataForUser(Number(tomdaUser.id), String(tomdaUser.nickname || 'tomda'));
    }

    return {
      total: resultRows.length,
      lists: resultRows,
    };
  }

  /**
   * 管理端用户列表
   */
  async list(params) {
    const { ctx } = this;
    const userColumns = await this.getUserBusinessColumns();
    const {
      pageNo = 1,
      pageSize = 10,
      keyword,
      email,
      channel,
      status,
      vipLevel,
      groupId,
      tagId,
      userType,
      startTime,
      endTime,
      autoSeed,
    } = params;
    /**
     * 自动补齐测试用户开关（仅在无筛选且列表为空时触发一次）
     */
    const autoSeedEnabled = [ '1', 'true', 'yes', 'on' ].includes(String(autoSeed || '').trim().toLowerCase());

    const where = {
      isDelete: 0,
    };

    if (keyword) {
      const keywordWhere = [
        { sn: { [Op.like]: `%${keyword}%` } },
        { nickname: { [Op.like]: `%${keyword}%` } },
        { mobile: { [Op.like]: `%${keyword}%` } },
      ];
      if (userColumns.email) {
        keywordWhere.push({ email: { [Op.like]: `%${keyword}%` } });
      }
      where[Op.or] = keywordWhere;
    }

    if (email && userColumns.email) {
      where.email = { [Op.like]: `%${email}%` };
    }

    if (channel !== undefined && channel !== '') {
      where.channel = channel;
    }

    if (status !== undefined && status !== '') {
      where.isDisable = status;
    }

    if (vipLevel !== undefined && vipLevel !== '' && userColumns.vipLevel) {
      where.vipLevel = vipLevel;
    }

    if (groupId !== undefined && groupId !== '' && userColumns.groupId) {
      where.groupId = groupId;
    }

    if (userType !== undefined && userType !== null && userType !== '') {
      const ready = await this.ensureUserIdentityTable();
      if (!ready) {
        return {
          pageNo,
          pageSize,
          count: 0,
          lists: [],
        };
      }
      const targetType = this.normalizeUserType(userType);
      if (targetType === 0) {
        const typedRows = await ctx.model.UserIdentity.findAll({
          where: {
            is_delete: 0,
            user_type: { [Op.in]: [ 1, 2 ] },
          },
          attributes: [ 'user_id' ],
        });
        const typedIds = typedRows.map(item => Number(item.user_id || 0)).filter(Boolean);
        if (typedIds.length) {
          where.id = { [Op.notIn]: typedIds };
        }
      } else {
        const matchedRows = await ctx.model.UserIdentity.findAll({
          where: {
            is_delete: 0,
            user_type: targetType,
          },
          attributes: [ 'user_id' ],
        });
        const matchedIds = matchedRows.map(item => Number(item.user_id || 0)).filter(Boolean);
        if (!matchedIds.length) {
          return {
            pageNo,
            pageSize,
            count: 0,
            lists: [],
          };
        }
        where.id = { [Op.in]: matchedIds };
      }
    }

    if (tagId !== undefined && tagId !== '') {
      const rels = await ctx.model.UserTagRel.findAll({
        where: { tagId },
        attributes: [ 'userId' ],
      });
      const userIds = rels.map(item => item.userId);
      if (userIds.length === 0) {
        return {
          pageNo,
          pageSize,
          count: 0,
          lists: [],
        };
      }
      if (!where.id) {
        where.id = { [Op.in]: userIds };
      } else if (where.id[Op.in]) {
        const current = where.id[Op.in];
        const nextSet = new Set(userIds.map(item => Number(item)));
        const merged = current.filter(item => nextSet.has(Number(item)));
        if (!merged.length) {
          return {
            pageNo,
            pageSize,
            count: 0,
            lists: [],
          };
        }
        where.id = { [Op.in]: merged };
      } else if (where.id[Op.notIn]) {
        const excludeSet = new Set(where.id[Op.notIn].map(item => Number(item)));
        const merged = userIds.filter(item => !excludeSet.has(Number(item)));
        if (!merged.length) {
          return {
            pageNo,
            pageSize,
            count: 0,
            lists: [],
          };
        }
        where.id = { [Op.in]: merged };
      }
    }

    if (startTime && endTime) {
      const start = parseInt(startTime, 10);
      const end = parseInt(endTime, 10);
      if (!isNaN(start) && !isNaN(end)) {
        where.createTime = {
          [Op.between]: [ start, end ],
        };
      }
    }

    const limit = parseInt(pageSize, 10);
    const offset = pageSize * (pageNo - 1);

    const { count, rows } = await ctx.model.User.findAndCountAll({
      where,
      limit,
      offset,
      order: [[ 'id', 'DESC' ]],
      attributes: { exclude: [ 'password', 'salt' ] },
    });
    /**
     * 新环境兜底：用户列表为空时按需自动补齐测试账号，避免“列表空白”影响联调
     */
    const hasFilter = [
      keyword,
      email,
      channel,
      status,
      vipLevel,
      groupId,
      tagId,
      userType,
      startTime,
      endTime,
    ].some(item => item !== undefined && item !== null && item !== '');
    if (count === 0 && autoSeedEnabled && !hasFilter) {
      await this.seedTestUsers();
      return this.list({ ...params, autoSeed: 0 });
    }

    const userIds = rows.map(item => item.id);
    const groupIds = userColumns.groupId
      ? Array.from(new Set(rows.map(item => item.groupId).filter(Boolean)))
      : [];
    const [ levelMap, groupMap, tagMaps, userTypeMap ] = await Promise.all([
      this.getLevelMap(),
      this.getGroupMap(groupIds),
      this.getTagMaps(userIds),
      this.getUserTypeMap(userIds),
    ]);

    const lists = rows.map(item => {
      const data = item.toJSON();
      data.avatar = urlUtil.toAbsoluteUrl(this.normalizeUserAvatar(data.avatar));
      data.ip = data.lastLoginIp || '';
      data.mobileMask = this.getMaskedMobile(data.mobile);
      data.sexName = this.getSexLabel(data.sex);
      data.channelName = this.getChannelLabel(data.channel);
      data.createTimeRaw = Number(data.createTime || 0);
      data.lastLoginTimeRaw = Number(data.lastLoginTime || 0);
      data.createTime = this.formatUnixTime(data.createTimeRaw);
      data.lastLoginTime = this.formatUnixTime(data.lastLoginTimeRaw);
      const vipLevelValue = userColumns.vipLevel ? Number(data.vipLevel || 0) : 0;
      data.groupName = userColumns.groupId ? (groupMap.get(data.groupId) || '') : '';
      data.levelName = levelMap.get(vipLevelValue) || (vipLevelValue === 1 ? 'VIP' : vipLevelValue === 2 ? 'SVIP' : '普通');
      data.userType = userTypeMap.has(data.id) ? userTypeMap.get(data.id) : 0;
      data.userTypeName = this.getUserTypeLabel(data.userType);
      const tagList = tagMaps.userTagMap.get(data.id) || [];
      data.tags = tagList.map(tag => tag.name);
      data.tagIds = tagList.map(tag => tag.id);
      return data;
    });

    return {
      pageNo,
      pageSize,
      count,
      lists,
    };
  }

  /**
   * 管理端用户详情
   */
  async detail(id) {
    const { ctx } = this;
    const userColumns = await this.getUserBusinessColumns();
    const user = await ctx.model.User.findOne({
      where: { id, isDelete: 0 },
      attributes: { exclude: [ 'password', 'salt' ] },
    });
    if (!user) {
      throw new Error('用户不存在');
    }
    const data = user.toJSON();
    data.avatar = urlUtil.toAbsoluteUrl(this.normalizeUserAvatar(data.avatar));
    data.ip = data.lastLoginIp || '';
    data.mobileMask = this.getMaskedMobile(data.mobile);
    data.sexName = this.getSexLabel(data.sex);
    data.channelName = this.getChannelLabel(data.channel);
    data.createTimeRaw = Number(data.createTime || 0);
    data.lastLoginTimeRaw = Number(data.lastLoginTime || 0);
    data.createTime = this.formatUnixTime(data.createTimeRaw);
    data.lastLoginTime = this.formatUnixTime(data.lastLoginTimeRaw);
    const [ levelMap, groupMap, tagMaps, userTypeMap ] = await Promise.all([
      this.getLevelMap(),
      this.getGroupMap(userColumns.groupId ? [ data.groupId ].filter(Boolean) : []),
      this.getTagMaps([ data.id ]),
      this.getUserTypeMap([ data.id ]),
    ]);
    const vipLevelValue = userColumns.vipLevel ? Number(data.vipLevel || 0) : 0;
    data.groupName = userColumns.groupId ? (groupMap.get(data.groupId) || '') : '';
    data.levelName = levelMap.get(vipLevelValue) || (vipLevelValue === 1 ? 'VIP' : vipLevelValue === 2 ? 'SVIP' : '普通');
    data.userType = userTypeMap.has(data.id) ? userTypeMap.get(data.id) : 0;
    data.userTypeName = this.getUserTypeLabel(data.userType);
    const tagList = tagMaps.userTagMap.get(data.id) || [];
    data.tags = tagList.map(tag => tag.name);
    data.tagIds = tagList.map(tag => tag.id);
    const [ walletInfo, addresses, loginLogsData, walletLogsData ] = await Promise.all([
      this.walletInfo(data.id),
      this.addressList(data.id),
      this.loginLog(data.id, { pageNo: 1, pageSize: 5 }),
      this.walletLog(data.id, { pageNo: 1, pageSize: 5, type: 'all' }),
    ]);
    let rechargeRows = [];
    if (this.hasModel('UserWalletFlow')) {
      rechargeRows = await ctx.model.UserWalletFlow.findAll({
        where: { userId: data.id, flowType: 'recharge' },
        order: [[ 'id', 'DESC' ]],
        limit: 5,
      });
    }

    data.walletBalance = walletInfo.balance;
    data.walletTotalRecharge = walletInfo.totalRecharge;
    data.walletTotalSpend = walletInfo.totalSpend;

    data.rechargeLogs = rechargeRows.map(item => ({
      id: item.id,
      orderId: item.orderId,
      amount: Number(item.amount || 0).toFixed(2),
      remark: item.remark,
      createTime: item.getDataValue ? item.getDataValue('createTime') : item.createTime,
    }));

    data.addresses = (addresses || []).map(item => ({
      ...item,
      fullAddress: `${item.province || ''}${item.city || ''}${item.district || ''}${item.detail || ''}`,
    }));

    const loginLogs = (loginLogsData && loginLogsData.lists) ? loginLogsData.lists : [];
    data.loginLogs = loginLogs.map(item => {
      const osInfo = safeJsonParse(item.os, {});
      const browserInfo = safeJsonParse(item.browser, {});
      const osLabel = osInfo.name ? `${osInfo.name}${osInfo.version ? ` ${osInfo.version}` : ''}` : (item.os || '');
      const browserLabel = browserInfo.name ? `${browserInfo.name}${browserInfo.version ? ` ${browserInfo.version}` : ''}` : (item.browser || '');
      const device = [ osLabel, browserLabel ].filter(Boolean).join(' / ');
      return {
        id: item.id,
        ip: item.ip,
        status: item.status,
        device,
        createTime: item.getDataValue ? item.getDataValue('createTime') : item.createTime,
      };
    });
    if (!data.ip && data.loginLogs.length > 0) {
      data.ip = String(data.loginLogs[0].ip || '').trim();
    }

    const walletLogs = (walletLogsData && walletLogsData.lists) ? walletLogsData.lists : [];
    data.walletLogs = walletLogs.map(item => ({
      id: item.id,
      type: item.type,
      amount: item.amount,
      balance: item.balance,
      remark: item.remark,
      createTime: item.createTime,
    }));
    return data;
  }

  /**
   * 管理端用户编辑
   */
  async edit(id, field, value) {
    const { ctx } = this;
    const userColumns = await this.getUserBusinessColumns();
    const allowFields = [ 'username', 'realName', 'sex', 'mobile', 'nickname', 'isDisable', 'userType', 'avatar' ];
    if (userColumns.email) allowFields.push('email');
    if (userColumns.vipLevel) allowFields.push('vipLevel');
    if (userColumns.remark) allowFields.push('remark');
    if (userColumns.groupId) allowFields.push('groupId');
    if (!allowFields.includes(field)) {
      throw new Error(`字段不允许编辑: ${field}`);
    }
    if (field === 'userType') {
      await this.setUserType(id, value);
      await this.syncUserCache(id);
      return;
    }
    const updateTime = Math.floor(Date.now() / 1000);
    const updateData = { updateTime };
    if (field === 'avatar') {
      updateData.avatar = value ? urlUtil.toRelativeUrl(String(value).trim()) : '';
    } else {
      updateData[field] = value;
    }
    if (field === 'vipLevel' && Number(value) === 0 && userColumns.vipExpireTime) {
      updateData.vipExpireTime = 0;
    }
    await ctx.model.User.update(updateData, {
      where: { id, isDelete: 0 },
    });

    await this.syncUserCache(id);
  }

  /**
   * 管理端调整用户余额
   */
  async adminWalletAdjust(params) {
    const { ctx } = this;
    const { userId, balance } = params || {};
    if (!userId) {
      throw new Error('用户ID不能为空');
    }
    const nextBalance = Number(balance);
    if (Number.isNaN(nextBalance) || nextBalance < 0) {
      throw new Error('余额不合法');
    }

    let wallet = await ctx.model.UserWallet.findOne({ where: { userId } });
    if (!wallet) {
      wallet = await ctx.model.UserWallet.create({ userId, balance: 0 });
    }

    const prevBalance = Number(wallet.balance || 0);
    if (prevBalance === nextBalance) {
      return { balance: prevBalance.toFixed(2), changed: false };
    }

    const now = Math.floor(Date.now() / 1000);
    await ctx.model.UserWallet.update({
      balance: nextBalance,
      updateTime: now,
    }, {
      where: { userId },
    });

    const diff = nextBalance - prevBalance;
    const flowType = diff >= 0 ? 'recharge' : 'consume';
    await ctx.model.UserWalletFlow.create({
      userId,
      orderId: 0,
      amount: Math.abs(diff),
      flowType,
      remark: '管理员调整',
      createTime: now,
    });

    return { balance: nextBalance.toFixed(2), changed: true };
  }
}

module.exports = UserService;
