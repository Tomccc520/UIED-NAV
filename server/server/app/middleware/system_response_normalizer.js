/**
 * @copyright Tomda (https://www.tomda.top)
 * @copyright UIED技术团队 (https://fsuied.com)
 * @author UIED技术团队
 * @createDate 2026-02-17
 */

'use strict';

/**
 * 系统路由响应归一化中间件
 * 说明：
 * 1. 仅对前台投稿/互动接口进行返回码归一；
 * 2. 不影响后台管理接口（保持兼容）。
 */
module.exports = () => {
  /**
   * 需要归一化的系统接口路径集合
   */
  const normalizePathSet = new Set([
    '/api/article/front/add',
    '/api/article/front/list',
    '/api/article/front/detail',
    '/api/article/front/edit',
    '/api/article/front/audit/message/list',
    '/api/article/visit/incr',
    '/api/article/collect/list',
    '/api/article/collect/toggle',
    '/api/article/like/toggle',
    '/api/article/stats',
    '/api/article/comment/list',
    '/api/article/comment/add',
    '/api/article/comment/like/toggle',
    '/api/article/comment/report/add',
    '/api/article/comment/top/toggle',
    '/api/user/article/collect/list',
    '/api/user/article/like/list',
  ]);

  /**
   * 判断当前请求是否需要归一化
   */
  const shouldNormalize = (path = '') => normalizePathSet.has(String(path || ''));

  /**
   * 对标准响应结构进行归一化
   */
  const normalizeStandardBody = (body = {}) => {
    const code = Number(body.code);
    const isSuccess = code === 200;
    return {
      code: isSuccess ? 0 : (Number.isFinite(code) ? code : 500),
      data: Object.prototype.hasOwnProperty.call(body, 'data') ? body.data : '',
      message: isSuccess
        ? (String(body.message || '') === '请求成功' ? 'success' : String(body.message || 'success'))
        : String(body.message || '请求失败'),
    };
  };

  /**
   * 中间件主流程
   */
  return async function systemResponseNormalizer(ctx, next) {
    await next();

    if (!shouldNormalize(ctx.path)) return;

    const body = ctx.body;
    if (body === undefined) return;

    // 已是标准结构：仅做 code 语义归一
    if (body && typeof body === 'object' && 'code' in body && 'data' in body && 'message' in body) {
      ctx.body = normalizeStandardBody(body);
      return;
    }

    // 兼容非标准结构，统一包裹
    const status = Number(ctx.status || 200);
    if (status >= 400) {
      ctx.body = {
        code: status,
        data: '',
        message: (body && typeof body === 'object' && (body.message || body.error))
          ? String(body.message || body.error)
          : '请求失败',
      };
      return;
    }

    ctx.body = {
      code: 0,
      data: body,
      message: 'success',
    };
  };
};
