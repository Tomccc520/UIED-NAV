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
   * 格式化作者展示资料
   */
  formatAuthorProfile(user, profile, forcePublic = false) {
    const userId = Number(user?.id || 0);
    const nickname = String(profile?.display_name || user?.nickname || user?.username || '');
    const avatar = user?.avatar ? urlUtil.toAbsoluteUrl(user.avatar) : '';
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
   * 同步用户缓存信息
   */
  async syncUserCache(userId) {
    const { ctx } = this;
    const user = await ctx.model.User.findOne({ where: { id: userId, isDelete: 0 } });
    if (!user) return;
    const appConfig = this.getAppConfig();
    const userInfoKey = appConfig.userInfoKey || extendConfig.userInfoKey;
    await ctx.service.redis.set(userInfoKey + user.id, JSON.stringify(user));
  }

  /**
   * 生成用户令牌
   */
  async createUserToken(user) {
    const { ctx } = this;
    const appConfig = this.getAppConfig();
    const token = ctx.setToken({
      username: user.sn,
      password: user.password,
    });
    const userTokenKey = appConfig.userTokenKey || extendConfig.userTokenKey;
    const userTokenSet = appConfig.userTokenSet || extendConfig.userTokenSet;
    const userInfoKey = appConfig.userInfoKey || extendConfig.userInfoKey;
    const key = userTokenKey + token;
    const setKey = userTokenSet + user.id;
    await ctx.service.redis.set(key, user.id);
    await ctx.service.redis.sadd(setKey, token);
    await ctx.service.redis.set(userInfoKey + user.id, JSON.stringify(user));
    return token;
  }

  /**
   * 获取用户ID
   */
  async getUserId() {
    const { ctx } = this;
    const appConfig = this.getAppConfig();
    const token = ctx.request.header.token || '';
    if (!token) {
      throw new Error('未登录');
    }
    const userTokenKey = appConfig.userTokenKey || extendConfig.userTokenKey;
    const uid = await ctx.service.redis.get(userTokenKey + token);
    if (!uid) {
      throw new Error('登录已失效');
    }
    return parseInt(uid, 10);
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
    const { username, password, email } = params;
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
      nickname: username,
      username,
      email,
      groupId: 1,
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
     * 自动发放优惠券
     */
    await ctx.service.coupon.grantAutoToUser(user.id);
    const token = await this.createUserToken(user);
    return { user, token };
  }

  /**
   * 用户登录
   */
  async login(params) {
    const { ctx } = this;
    const { username, password } = params;
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
    const now = Math.floor(Date.now() / 1000);
    await ctx.model.User.update({
      lastLoginIp: ctx.request.ip,
      lastLoginTime: now,
      updateTime: now,
    }, {
      where: { id: user.id },
    });
    await this.recordLoginLog(user.id, 1);
    const token = await this.createUserToken(user);
    return { user, token };
  }

  async recordLoginLog(userId, status = 1) {
    const { ctx } = this;
    try {
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
    const { nickname, avatar, email } = params;
    const updateData = {};
    if (nickname !== undefined) {
      updateData.nickname = nickname;
    }
    if (avatar !== undefined) {
      updateData.avatar = avatar ? urlUtil.toRelativeUrl(avatar) : '';
    }
    if (email !== undefined) {
      updateData.email = email;
    }
    const updateTime = Math.floor(Date.now() / 1000);
    await ctx.model.User.update({
      ...updateData,
      updateTime,
    }, {
      where: { id: userId },
    });
    await this.syncUserCache(userId);
    return await ctx.model.User.findOne({ where: { id: userId } });
  }

  /**
   * 用户中心统计信息
   */
  async stats(userId) {
    const { ctx } = this;
    await ctx.service.license.ensureSchemaCompatibility();
    const user = await ctx.model.User.findOne({
      where: { id: userId, isDelete: 0 },
    });
    if (!user) {
      throw new Error('用户不存在');
    }

    const [ orderCount, licenseCount ] = await Promise.all([
      ctx.model.Order.count({ where: { userId, isDelete: 0 } }),
      ctx.model.License.count({ where: { userId, isDelete: 0, status: 1 } }),
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
    const products = productIds.length
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
    return data;
  }

  /**
   * 用户中心授权列表
   */
  async licenseList(userId, params) {
    const { ctx } = this;
    await ctx.service.license.ensureSchemaCompatibility();
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
    const products = productIds.length
      ? await ctx.model.Product.findAll({
        where: { id: { [Op.in]: productIds } },
        attributes: [ 'id', 'name' ],
      })
      : [];
    const productMap = new Map(products.map(product => [ product.id, product ]));
    const orderIds = Array.from(new Set(rows.map(item => item.orderId).filter(Boolean)));
    const orders = orderIds.length
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
    const pageNo = Number(params.pageNo || 1);
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
   * 用户中心点赞文章列表
   */
  async articleLikeList(userId, params = {}) {
    const { ctx } = this;
    const pageNo = Number(params.pageNo || 1);
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
   * 地址列表
   */
  async addressList(userId, params = {}) {
    const { ctx } = this;
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
   * 登录日志
   */
  async loginLog(userId, params) {
    const { ctx } = this;
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
      lists: rows,
    };
  }

  /**
   * 钱包信息
   */
  async walletInfo(userId) {
    const { ctx } = this;
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
    const user = await ctx.model.User.findOne({ where: { id: userId, isDelete: 0 } });
    if (!user) {
      throw new Error('用户不存在');
    }
    const level = Number(user.vipLevel || 0);
    const levelMap = await this.getLevelMap();
    const levelName = levelMap.get(level) || (level === 1 ? 'VIP会员' : level === 2 ? 'SVIP会员' : '普通用户');
    
    // 格式化过期时间
    const expireTime = user.vipExpireTime 
      ? moment(user.vipExpireTime * 1000).format('YYYY-MM-DD HH:mm:ss')
      : '';

    /**
     * 会员过期提醒（按配置控制提醒次数与间隔）
     */
    await this.sendVipExpireNoticeIfNeeded(userId, user.vipExpireTime);

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
   * 创建用户站内信消息
   */
  async createUserMessage(userId, title, content, type = 'system', extra = {}) {
    const { ctx } = this;
    await this.ensureUserMessageExtraColumn();
    const now = Math.floor(Date.now() / 1000);
    const hasExtra = extra && typeof extra === 'object' && Object.keys(extra).length > 0;
    const extraText = hasExtra ? JSON.stringify(extra) : '';
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

    const [ total, active, disabled, vip, svip, today ] = await Promise.all([
      ctx.model.User.count({ where: { isDelete: 0 } }),
      ctx.model.User.count({ where: { isDelete: 0, isDisable: 0 } }),
      ctx.model.User.count({ where: { isDelete: 0, isDisable: 1 } }),
      ctx.model.User.count({ where: { isDelete: 0, vipLevel: 1 } }),
      ctx.model.User.count({ where: { isDelete: 0, vipLevel: 2 } }),
      ctx.model.User.count({ where: { isDelete: 0, createTime: { [Op.gte]: dayStart } } }),
    ]);

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
    const rows = await ctx.model.UserGroup.findAll({
      where: { isDelete: 0 },
      order: [[ 'sort', 'DESC' ], [ 'id', 'DESC' ]],
    });
    return rows;
  }

  async groupAdd(params) {
    const { ctx } = this;
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
    const rows = await ctx.model.UserTag.findAll({
      where: { isDelete: 0 },
      order: [[ 'id', 'DESC' ]],
    });
    return rows;
  }

  async tagAdd(params) {
    const { ctx } = this;
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
    const rows = await ctx.model.UserLevel.findAll({
      where: { isDelete: 0 },
      order: [[ 'levelValue', 'ASC' ], [ 'id', 'ASC' ]],
    });
    return rows;
  }

  async levelAdd(params) {
    const { ctx } = this;
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
   * 管理端用户列表
   */
  async list(params) {
    const { ctx } = this;
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
    } = params;

    const where = {
      isDelete: 0,
    };

    if (keyword) {
      where[Op.or] = [
        { sn: { [Op.like]: `%${keyword}%` } },
        { nickname: { [Op.like]: `%${keyword}%` } },
        { mobile: { [Op.like]: `%${keyword}%` } },
        { email: { [Op.like]: `%${keyword}%` } },
      ];
    }

    if (email) {
      where.email = { [Op.like]: `%${email}%` };
    }

    if (channel !== undefined && channel !== '') {
      where.channel = channel;
    }

    if (status !== undefined && status !== '') {
      where.isDisable = status;
    }

    if (vipLevel !== undefined && vipLevel !== '') {
      where.vipLevel = vipLevel;
    }

    if (groupId !== undefined && groupId !== '') {
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

    const userIds = rows.map(item => item.id);
    const groupIds = Array.from(new Set(rows.map(item => item.groupId).filter(Boolean)));
    const [ levelMap, groupMap, tagMaps, userTypeMap ] = await Promise.all([
      this.getLevelMap(),
      this.getGroupMap(groupIds),
      this.getTagMaps(userIds),
      this.getUserTypeMap(userIds),
    ]);

    const lists = rows.map(item => {
      const data = item.toJSON();
      data.avatar = urlUtil.toAbsoluteUrl(data.avatar || '');
      data.ip = data.lastLoginIp || '';
      data.groupName = groupMap.get(data.groupId) || '';
      data.levelName = levelMap.get(data.vipLevel) || (data.vipLevel === 1 ? 'VIP' : data.vipLevel === 2 ? 'SVIP' : '普通');
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
    const user = await ctx.model.User.findOne({
      where: { id, isDelete: 0 },
      attributes: { exclude: [ 'password', 'salt' ] },
    });
    if (!user) {
      throw new Error('用户不存在');
    }
    const data = user.toJSON();
    data.avatar = urlUtil.toAbsoluteUrl(data.avatar || '');
    data.ip = data.lastLoginIp || '';
    const [ levelMap, groupMap, tagMaps, userTypeMap ] = await Promise.all([
      this.getLevelMap(),
      this.getGroupMap([ data.groupId ].filter(Boolean)),
      this.getTagMaps([ data.id ]),
      this.getUserTypeMap([ data.id ]),
    ]);
    data.groupName = groupMap.get(data.groupId) || '';
    data.levelName = levelMap.get(data.vipLevel) || (data.vipLevel === 1 ? 'VIP' : data.vipLevel === 2 ? 'SVIP' : '普通');
    data.userType = userTypeMap.has(data.id) ? userTypeMap.get(data.id) : 0;
    data.userTypeName = this.getUserTypeLabel(data.userType);
    const tagList = tagMaps.userTagMap.get(data.id) || [];
    data.tags = tagList.map(tag => tag.name);
    data.tagIds = tagList.map(tag => tag.id);
    const [ walletInfo, rechargeRows, addresses, loginLogsData, walletLogsData ] = await Promise.all([
      this.walletInfo(data.id),
      ctx.model.UserWalletFlow.findAll({
        where: { userId: data.id, flowType: 'recharge' },
        order: [[ 'id', 'DESC' ]],
        limit: 5,
      }),
      this.addressList(data.id),
      this.loginLog(data.id, { pageNo: 1, pageSize: 5 }),
      this.walletLog(data.id, { pageNo: 1, pageSize: 5, type: 'all' }),
    ]);

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
    const allowFields = [ 'username', 'realName', 'sex', 'mobile', 'nickname', 'email', 'vipLevel', 'remark', 'isDisable', 'groupId', 'userType' ];
    if (!allowFields.includes(field)) {
      throw new Error('字段不允许编辑');
    }
    if (field === 'userType') {
      await this.setUserType(id, value);
      await this.syncUserCache(id);
      return;
    }
    const updateTime = Math.floor(Date.now() / 1000);
    const updateData = {
      [field]: value,
      updateTime,
    };
    if (field === 'vipLevel' && Number(value) === 0) {
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
