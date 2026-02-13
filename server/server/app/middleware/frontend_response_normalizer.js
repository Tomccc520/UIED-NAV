/**
 * @file middleware/frontend_response_normalizer.js
 * @description 前台接口响应归一化中间件，统一返回 { code, data, message }
 * @author UIED技术团队
 * @copyright Tomda (https://www.tomda.top)
 * @copyright UIED技术团队 (https://fsuied.com)
 * @createDate 2026-02-14
 */

'use strict';

/**
 * 前台响应归一化中间件
 * 说明：
 * 1. 将旧结构（直接对象、数组、{success,data,error}）统一转为 {code,data,message}
 * 2. 已是标准结构时直接透传
 */
module.exports = () => {
  return async function frontendResponseNormalizer(ctx, next) {
    await next();

    const { body, status } = ctx;
    if (body === undefined) return;

    // 已是标准结构，直接透传
    if (body && typeof body === 'object' && 'code' in body && 'data' in body && 'message' in body) {
      return;
    }

    const safeStatus = Number(status) || 200;
    const isErrorStatus = safeStatus >= 400;

    // 兼容旧 success 结构
    if (body && typeof body === 'object' && 'success' in body) {
      if (body.success) {
        ctx.body = {
          code: 0,
          data: 'data' in body ? body.data : body,
          message: body.message || 'success',
        };
        return;
      }

      ctx.body = {
        code: isErrorStatus ? safeStatus : 500,
        data: 'data' in body ? body.data : '',
        message: body.error || body.message || 'error',
      };
      return;
    }

    if (isErrorStatus) {
      let message = '请求失败';
      if (body && typeof body === 'object') {
        message = body.error || body.message || body.msg || message;
      } else if (typeof body === 'string' && body.trim()) {
        message = body.trim();
      }

      ctx.body = {
        code: safeStatus,
        data: '',
        message,
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

