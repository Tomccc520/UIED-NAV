/**
 * @file middleware/commercial_legacy_route_guard.js
 * @description 商业版旧兼容路由守卫（严格模式开关）
 * @author UIED技术团队
 * @copyright Tomda (https://www.tomda.top)
 * @copyright UIED技术团队 (https://fsuied.com)
 * @createDate 2026-02-20
 */

'use strict';

/**
 * 旧兼容路由拦截中间件
 * 说明：
 * 1. strictLegacyRoutes=false: 允许旧路由继续访问（默认）
 * 2. strictLegacyRoutes=true: 旧路由直接返回 404，提示改用 /api 路由
 */
module.exports = () => {
  const CACHE_KEY = '__uiedCommercialModeCache__';
  const CACHE_TTL_MS = 5000;

  /**
   * 读取并规范化商业模式配置（带短缓存）
   */
  const readCommercialMode = async ctx => {
    const nowMs = Date.now();
    const cached = ctx.app[CACHE_KEY];
    if (cached && cached.expiresAt > nowMs) {
      return cached.value;
    }
    const raw = await ctx.service.uied.setting.get('commercial_mode_config');
    const source = raw && typeof raw === 'object' ? raw : {};
    const value = {
      strictLegacyRoutes: source.strictLegacyRoutes === true,
      enforceLicenseSignature: source.enforceLicenseSignature === true,
    };
    ctx.app[CACHE_KEY] = {
      value,
      expiresAt: nowMs + CACHE_TTL_MS,
    };
    return value;
  };

  return async function commercialLegacyRouteGuard(ctx, next) {
    const mode = await readCommercialMode(ctx);
    if (mode.strictLegacyRoutes) {
      ctx.status = 404;
      ctx.body = {
        code: 404,
        data: '',
        message: '旧兼容路由已关闭，请使用 /api 前缀接口',
      };
      return;
    }
    await next();
  };
};
