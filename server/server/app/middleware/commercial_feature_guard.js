/**
 * @file middleware/commercial_feature_guard.js
 * @description 商业版功能开关守卫（按 featureKey 强拦截）
 * @author UIED技术团队
 * @copyright Tomda (https://www.tomda.top)
 * @copyright UIED技术团队 (https://fsuied.com)
 * @createDate 2026-02-21
 */

'use strict';

/**
 * 商业版功能守卫中间件
 * 说明：
 * 1. 通过 route 传入 featureKey
 * 2. 若许可证能力未开启，统一返回 403 结构
 */
module.exports = options => {
  const featureKey = String(options?.featureKey || '').trim();

  return async function commercialFeatureGuard(ctx, next) {
    if (!featureKey) {
      await next();
      return;
    }

    try {
      const enabled = await ctx.service.uied.licenseCenter.hasFeature(featureKey);
      if (enabled) {
        await next();
        return;
      }

      const licenseInfo = await ctx.service.uied.licenseCenter.getLicenseInfo();
      ctx.status = 403;
      ctx.body = {
        code: 403,
        message: '当前版本未授权该功能',
        data: {
          featureKey,
          edition: String(licenseInfo?.effectiveEdition || 'free'),
        },
      };
    } catch (error) {
      ctx.logger.error(`[commercialFeatureGuard] 功能校验失败(${featureKey}):`, error);
      ctx.status = 403;
      ctx.body = {
        code: 403,
        message: '当前版本未授权该功能',
        data: {
          featureKey,
          edition: 'unknown',
        },
      };
    }
  };
};
