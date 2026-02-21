'use strict';
const {
  notAuthUri,
  notLoginUri,
  userTokenPassUri,
  backstageTokenKey,
  backstageManageKey,
  backstageRolesKey,
  userTokenKey,
  reqAdminIdKey,
  reqRoleIdKey,
  reqUsernameKey,
  reqNicknameKey,
} = require('../extend/config');

module.exports = options => {
  // TokenAuth Token认证中间件
  async function tokenAuth(ctx, next) {
    // 兼容中间件参数，避免未使用变量触发告警
    void options;
    const url = ctx.request.path;
    const auths = normalizeAuthKey(url);
    // 支持前台用户 token 直通指定接口（如前台素材库）
    if (await allowUserTokenPass(ctx, auths)) {
      await next();
      return;
    }
    // 免登录接口
    if (matchWhitelist(auths, notLoginUri)) {
      await next();
      return;
    }

    // Token是否为空
    const token = ctx.request.header.token;
    if (!token) {
      ctx.response.status = 403;
      ctx.body = { code: 332, data: '', message: 'token参数为空' };
      return;
    }

    // Token是否过期
    const tokenKey = backstageTokenKey + token;
    const exist = await ctx.service.redis.exists(tokenKey);
    if (exist < 0) {
      ctx.response.status = 403;
      ctx.body = { code: 500, data: '', message: '系统错误' };
      return;
    } else if (exist === 0) {
      ctx.response.status = 403;
      ctx.body = { code: 333, data: '', message: 'token参数无效' };
      return;
    }

    // 用户信息缓存
    const uidStr = await ctx.service.redis.get(tokenKey);
    const uid = uidStr === '' ? 0 : parseInt(uidStr, 10);
    if (isNaN(uid)) {
      ctx.response.status = 403;
      ctx.body = { code: 333, data: '', message: 'token参数无效' };
      return;
    }

    const hexist = await ctx.service.redis.hExists(backstageManageKey, uidStr);
    if (!hexist) {
      await ctx.service.authAdmin.CacheAdminUserByUid(uid);
    }

    // 校验用户被删除
    const userInfo = JSON.parse(await ctx.service.redis.hGet(backstageManageKey, uidStr));
    if (userInfo.is_delete === 1) {
      await ctx.service.redis.del(tokenKey);
      await ctx.service.redis.hDel(backstageManageKey, uidStr);
      ctx.response.status = 403;
      ctx.body = { code: 333, data: '', message: '用户被删除' };
      return;
    }

    // 校验用户被禁用
    if (userInfo.is_disable === 1) {
      ctx.response.status = 403;
      ctx.body = { code: 331, data: '', message: '登录账号已被禁用了' };
      return;
    }

    // 令牌剩余30分钟自动续签
    const ttl = await ctx.service.redis.ttl(tokenKey);
    if (ttl < 1800) {
      ctx.service.redis.expire(tokenKey, 7200);
    }

    // 单次请求信息保存
    ctx.session[reqAdminIdKey] = uid;
    ctx.session[reqRoleIdKey] = userInfo.role;
    ctx.session[reqUsernameKey] = userInfo.username;
    ctx.session[reqNicknameKey] = userInfo.nickname;

    // 免权限验证接口
    if (matchWhitelist(auths, notAuthUri) || uid === 1) {
      await next();
      return;
    }

    // 校验角色权限是否存在
    const roleId = userInfo.role;
    const hExists = await ctx.service.redis.hExists(backstageRolesKey, roleId);
    if (!hExists) {
      // 缓存角色菜单
      const roleMenu = await ctx.service.authAdmin.cacheRoleMenusByRoleId(roleId);
      if (!roleMenu) {
        ctx.response.status = 403;
        ctx.body = { code: 500, data: '', message: '系统错误' };
        return;
      }
    }

    // 验证是否有权限操作
    const menus = await ctx.service.redis.hGet(backstageRolesKey, roleId);
    const menusArray = String(menus || '').split(',').filter(Boolean);
    if (!(menus !== '' && matchPerms(auths, menusArray))) {
      ctx.response.status = 403;
      ctx.body = { code: 403, data: '', message: '无相关权限' };
      return;
    }

    await next();
  }

  /**
   * 校验当前接口是否允许使用前台用户 token 直通
   */
  async function allowUserTokenPass(ctx, auths) {
    if (!matchWhitelist(auths, userTokenPassUri || [])) return false;
    const token = String(ctx.request.header.token || '').trim();
    if (!token) return false;
    const appConfig = ctx.app.config || {};
    const userTokenRedisKey = String(appConfig.userTokenKey || userTokenKey || '').trim() || 'user:token:';
    const exists = await ctx.service.redis.exists(userTokenRedisKey + token);
    return Number(exists || 0) > 0;
  }

  function replaceAll(str, find, replace) {
    return str.replace(new RegExp(find, 'g'), replace);
  }

  /**
   * 规范化请求路径为权限标识（兼容多前缀/末尾斜杠/多斜杠）
   */
  function normalizeAuthKey(path) {
    if (!path) return '';
    // 去除查询参数并统一斜杠
    let clean = String(path).split('?')[0].replace(/\\/g, '/');
    // 合并多余斜杠并移除末尾斜杠
    clean = clean.replace(/\/+/g, '/').replace(/\/+$/, '');
    // 兼容多种 API 前缀：/api、/api/v1、/dev-api、/prod-api
    clean = clean.replace(/^\/(?:api|dev-api|prod-api)(?:\/v\d+)?/, '');
    // 移除开头斜杠，转为权限字符串
    clean = clean.replace(/^\/+/, '');
    return clean ? replaceAll(clean, '/', ':') : '';
  }

  /**
   * 白名单匹配（兼容路径前置段导致的前缀差异）
   */
  function matchWhitelist(auths, list) {
    if (!auths) return false;
    if (list.includes(auths)) return true;
    return list.some(item => {
      if (!item) return false;
      if (auths.startsWith(item + ':')) return true; // 兼容带参数路径
      if (auths.endsWith(':' + item)) return true; // 兼容前置段
      if (auths.includes(':' + item + ':')) return true; // 兼容前置段+参数
      return false;
    });
  }

  /**
   * 权限匹配（兼容带参数路径）
   */
  function matchPerms(auths, perms) {
    if (!auths) return false;
    const aliasPerms = {
      // 内容管理：投稿审核复用“文章状态”权限，避免历史角色漏配新权限点
      'article:front:audit': [ 'article:change' ],
      // 内容管理：测试数据生成复用文章新增权限
      'article:seed:testData': [ 'article:add', 'article:edit', 'article:list' ],
      // 内容管理：专题管理兼容旧角色（复用文章权限）
      'article:topic:list': [ 'article:list', 'article:edit', 'article:add' ],
      'article:topic:all': [ 'article:list', 'article:edit', 'article:add' ],
      'article:topic:detail': [ 'article:list', 'article:edit', 'article:add' ],
      'article:topic:add': [ 'article:add', 'article:edit' ],
      'article:topic:edit': [ 'article:edit' ],
      'article:topic:del': [ 'article:del' ],
      'article:topic:change': [ 'article:change' ],
      // 内容管理：评论管理兼容旧角色（复用文章权限）
      'article:comment:manage:list': [ 'article:list', 'article:edit', 'article:add' ],
      'article:comment:manage:change': [ 'article:change', 'article:edit' ],
      'article:comment:manage:del': [ 'article:del' ],
      // 内容管理：评论回复列表复用评论管理列表权限
      'article:comment:manage:replies': [ 'article:comment:manage:list', 'article:list', 'article:edit', 'article:add' ],
      // 内容管理：评论批量操作复用评论管理权限
      'article:comment:manage:batch:change': [ 'article:comment:manage:change', 'article:change' ],
      'article:comment:manage:batch:del': [ 'article:comment:manage:del', 'article:del' ],
      // 内容管理：评论敏感词配置复用评论管理权限
      'article:comment:manage:sensitive:detail': [ 'article:comment:manage:list', 'article:list', 'article:edit', 'article:add' ],
      'article:comment:manage:sensitive:save': [ 'article:comment:manage:change', 'article:change' ],
      // 评论置顶接口复用评论状态权限
      'article:comment:top:toggle': [ 'article:comment:manage:change', 'article:change' ],
      // 评论举报与禁言管理复用评论管理权限
      'article:comment:manage:report:list': [ 'article:comment:manage:list', 'article:list', 'article:edit', 'article:add' ],
      'article:comment:manage:report:handle': [ 'article:comment:manage:change', 'article:change' ],
      'article:comment:manage:mute:list': [ 'article:comment:manage:list', 'article:list', 'article:edit', 'article:add' ],
      'article:comment:manage:mute:add': [ 'article:comment:manage:change', 'article:change' ],
      'article:comment:manage:mute:del': [ 'article:comment:manage:del', 'article:del' ],
      // 内容管理：作者下拉接口复用文章编辑权限
      'user:author:options': [ 'article:edit', 'article:add', 'article:list' ],
      // 用户中心管理：复用用户管理权限，兼容历史角色未配置新权限点
      'user:stats': [ 'user:list' ],
      'user:wallet:adjust': [ 'user:edit', 'user:list' ],
      'user:group:list': [ 'user:list' ],
      'user:group:add': [ 'user:edit', 'user:list' ],
      'user:group:edit': [ 'user:edit', 'user:list' ],
      'user:group:del': [ 'user:edit', 'user:list' ],
      'user:tag:list': [ 'user:list' ],
      'user:tag:add': [ 'user:edit', 'user:list' ],
      'user:tag:edit': [ 'user:edit', 'user:list' ],
      'user:tag:del': [ 'user:edit', 'user:list' ],
      'user:tag:bind': [ 'user:edit', 'user:list' ],
      'user:level:list': [ 'user:list' ],
      'user:level:add': [ 'user:edit', 'user:list' ],
      'user:level:edit': [ 'user:edit', 'user:list' ],
      'user:level:del': [ 'user:edit', 'user:list' ],
      'user:seed:testUsers': [ 'user:edit', 'user:list' ],
      // 内容管理：外链图片转存复用文章编辑权限
      'common:upload:image:transfer': [ 'article:edit', 'article:add', 'common:upload:image' ],
      'common:upload:image:transfer-content': [ 'article:edit', 'article:add', 'common:upload:image' ],
      // 商业版：许可证中心接口复用站点设置权限
      'uied:license:info': [ 'uied:setting:get' ],
      'uied:license:verify': [ 'uied:setting:get' ],
      'uied:feature:list': [ 'uied:setting:get' ],
      'uied:feature:check': [ 'uied:setting:get' ],
      'uied:license:save': [ 'uied:setting:save' ],
      'uied:license:sign': [ 'uied:setting:save' ],
      'uied:feature:save': [ 'uied:setting:save' ],
      'uied:commercial:mode:get': [ 'uied:setting:get' ],
      'uied:commercial:mode:save': [ 'uied:setting:save' ],
      'uied:commercial:overview': [ 'uied:setting:get' ],
      'uied:setting:articleConfig': [ 'uied:setting:get' ],
      'uied:setting:articleTopicsConfig': [ 'uied:setting:get' ],
      'uied:setting:saveArticleConfig': [ 'uied:setting:save' ],
      'uied:setting:saveArticleTopicsConfig': [ 'uied:setting:save' ],
      // 商业版：AI 配置 detail 兼容别名复用 get 权限
      'uied:aiConfig:detail': [ 'uied:aiConfig:get', 'uied:aiConfig:list' ],
      // 商业版：WordPress 标签/组件复用原有分类管理权限，避免历史角色漏配
      'uied:wordpress:tags': [ 'uied:wordpress:categories' ],
      'uied:wordpress:tags:add': [ 'uied:wordpress:categories:add' ],
      'uied:wordpress:tags:edit': [ 'uied:wordpress:categories:edit' ],
      'uied:wordpress:tags:del': [ 'uied:wordpress:categories:del' ],
      'uied:wordpress:widgets': [ 'uied:wordpress:categories' ],
      'uied:wordpress:widgets:add': [ 'uied:wordpress:categories:add' ],
      'uied:wordpress:widgets:edit': [ 'uied:wordpress:categories:edit' ],
      'uied:wordpress:widgets:del': [ 'uied:wordpress:categories:del' ],
      // 商业版：每日热榜模块复用站点设置权限，兼容历史角色
      'uied:dailyHot:config:get': [ 'uied:setting:get' ],
      'uied:dailyHot:platforms': [ 'uied:setting:get' ],
      'uied:dailyHot:platformConfig:list': [ 'uied:setting:get' ],
      'uied:dailyHot:schema': [ 'uied:setting:get' ],
      'uied:dailyHot:list': [ 'uied:setting:get' ],
      'uied:dailyHot:refresh': [ 'uied:setting:get' ],
      'uied:dailyHot:config:save': [ 'uied:setting:save' ],
      'uied:dailyHot:platformConfig:save': [ 'uied:setting:save' ],
      'uied:dailyHot:platformConfig:del': [ 'uied:setting:save' ],
      // 商业版：榜单系统复用站点设置权限，兼容历史角色
      'uied:rankBoard:config:list': [ 'uied:setting:get' ],
      'uied:rankBoard:list': [ 'uied:setting:get' ],
      'uied:rankBoard:preview': [ 'uied:setting:get' ],
      'uied:rankBoard:schema': [ 'uied:setting:get' ],
      'uied:rankBoard:config:save': [ 'uied:setting:save' ],
      // 商业版：专题页工厂复用页面管理权限，兼容历史角色
      'uied:topicFactory:template:list': [ 'uied:page:list' ],
      'uied:topicFactory:template:detail': [ 'uied:page:list' ],
      'uied:topicFactory:preview': [ 'uied:page:list' ],
      'uied:topicFactory:schema': [ 'uied:page:list' ],
      'uied:topicFactory:template:save': [ 'uied:page:add', 'uied:page:edit' ],
      'uied:topicFactory:template:del': [ 'uied:page:del' ],
      'uied:topicFactory:create': [ 'uied:page:add' ],
      // 商业版：投稿激励闭环复用用户中心权限，兼容历史角色
      'uied:contribution:settings:get': [ 'user:list', 'uied:setting:get' ],
      'uied:contribution:leaderboard': [ 'user:list', 'uied:setting:get' ],
      'uied:contribution:schema': [ 'user:list', 'uied:setting:get' ],
      'uied:contribution:badge:list': [ 'user:list', 'uied:setting:get' ],
      'uied:contribution:featured:list': [ 'user:list', 'uied:setting:get' ],
      'uied:contribution:user:list': [ 'user:list' ],
      'uied:contribution:user:detail': [ 'user:list' ],
      'uied:contribution:log:list': [ 'user:list', 'uied:setting:get' ],
      'uied:contribution:settings:save': [ 'user:edit', 'uied:setting:save' ],
      'uied:contribution:badge:save': [ 'user:edit', 'uied:setting:save' ],
      'uied:contribution:badge:del': [ 'user:edit', 'uied:setting:save' ],
      'uied:contribution:featured:save': [ 'user:edit', 'uied:setting:save' ],
      'uied:contribution:featured:del': [ 'user:edit', 'uied:setting:save' ],
      // 商业版：交付初始化向导复用站点设置权限
      'uied:delivery:init:preview': [ 'uied:setting:get' ],
      'uied:delivery:init:execute': [ 'uied:setting:save' ],
      'uied:delivery:package:export': [ 'uied:setting:get' ],
    };
    if (perms.some(item => item && (auths === item || auths.startsWith(item + ':')))) {
      return true;
    }
    const alias = aliasPerms[auths] || [];
    if (!alias.length) return false;
    return alias.some(item => perms.includes(item));
  }

  return tokenAuth;
};
