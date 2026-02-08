'use strict';
const {
  notAuthUri,
  notLoginUri,
  backstageTokenKey,
  backstageManageKey,
  backstageRolesKey,
  reqAdminIdKey,
  reqRoleIdKey,
  reqUsernameKey,
  reqNicknameKey,
} = require('../extend/config');

module.exports = options => {
  // TokenAuth Token认证中间件
  async function tokenAuth(ctx, next) {
    console.log(options);
    console.log(notLoginUri, '这里是中间件。');
    const url = ctx.request.url;
    // 去掉查询参数后再转换
    const urlPath = url.split('?')[0];
    const auths = replaceAll(urlPath.replace('/api/', ''), '/', ':');
    // 免登录接口
    if (notLoginUri.includes(auths) || isNotLoginUri(auths, notLoginUri)) {
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
      ctx.service.authAdmin.CacheAdminUserByUid(uid);
    }

    // 校验用户被删除
    const userInfo = JSON.parse(await ctx.service.redis.hGet(backstageManageKey, uidStr));
    if (userInfo.is_delete === 1) {
      await ctx.service.redis.del(tokenKey);
      await ctx.service.redis.hDel(backstageManageKey + uidStr);
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
    if (notAuthUri.includes(auths) || uid === 1) {
      await next();
      return;
    }

    // 校验角色权限是否存在
    const roleId = userInfo.role;
    const hExists = ctx.service.redis.hExists(backstageRolesKey, roleId);
    if (hExists) {
      // 缓存角色菜单
      const roleMenu = await ctx.service.authAdmin.cacheRoleMenusByRoleId(roleId);
      if (!roleMenu) {
        ctx.response.status = 403;
        ctx.body = { code: 500, data: '', message: '系统错误' };
        return;
      }
    }

    // 验证是否有权限操作
    const menus = ctx.service.redis.hGet(backstageRolesKey, roleId);
    const menusArray = menus.split(',');
    if (!(menus !== '' && menusArray.includes(auths))) {
      ctx.response.status = 403;
      ctx.body = { code: 403, data: '', message: '无相关权限' };
      return;
    }

    await next();
  }

  function replaceAll(str, find, replace) {
    return str.replace(new RegExp(find, 'g'), replace);
  }

  /**
   * 检查是否匹配免登录路由（支持通配符和前缀匹配）
   * @param {string} auths - 当前请求的路由标识
   * @param {string[]} notLoginUriList - 免登录路由列表
   * @returns {boolean}
   */
  function isNotLoginUri(auths, notLoginUriList) {
    for (const uri of notLoginUriList) {
      // 支持通配符 * 匹配
      if (uri.includes('*')) {
        const pattern = uri.replace(/\*/g, '.*');
        const regex = new RegExp(`^${pattern}$`);
        if (regex.test(auths)) {
          return true;
        }
      }
      // 支持前缀匹配（以 : 结尾表示前缀）
      if (uri.endsWith(':') && auths.startsWith(uri.slice(0, -1))) {
        return true;
      }
      // 支持 pages:* 这种格式匹配 pages:xxx:xxx
      if (uri.endsWith(':*') && auths.startsWith(uri.slice(0, -1))) {
        return true;
      }
    }
    return false;
  }

  return tokenAuth;
};
