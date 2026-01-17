/**
 * @file ApiError.js
 * @description 后端API服务
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

/**
 * 错误代码枚举
 * Error code enumeration for unified API error responses
 */
export const ErrorCode = {
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  RATE_LIMITED: 'RATE_LIMITED',
  BAD_REQUEST: 'BAD_REQUEST',
  CONFLICT: 'CONFLICT',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
};

/**
 * HTTP状态码映射
 */
export const ErrorStatusCode = {
  [ErrorCode.NOT_FOUND]: 404,
  [ErrorCode.VALIDATION_ERROR]: 400,
  [ErrorCode.UNAUTHORIZED]: 401,
  [ErrorCode.FORBIDDEN]: 403,
  [ErrorCode.INTERNAL_ERROR]: 500,
  [ErrorCode.RATE_LIMITED]: 429,
  [ErrorCode.BAD_REQUEST]: 400,
  [ErrorCode.CONFLICT]: 409,
  [ErrorCode.SERVICE_UNAVAILABLE]: 503,
};

/**
 * 自定义API错误类
 * Custom API Error class for unified error handling
 */
export class ApiError extends Error {
  /**
   * @param {string} code - 错误代码 (from ErrorCode enum)
   * @param {string} message - 用户友好的错误消息
   * @param {number} [statusCode] - HTTP状态码 (optional, derived from code if not provided)
   * @param {*} [details] - 详细错误信息 (optional)
   */
  constructor(code, message, statusCode = null, details = null) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.statusCode = statusCode || ErrorStatusCode[code] || 500;
    this.details = details;
    this.timestamp = new Date().toISOString();
    
    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * 转换为JSON响应格式
   */
  toJSON() {
    return {
      code: this.code,
      message: this.message,
      timestamp: this.timestamp,
      ...(this.details && { details: this.details }),
    };
  }

  // 静态工厂方法 - 便于创建常见错误类型

  static notFound(message = '请求的资源不存在', details = null) {
    return new ApiError(ErrorCode.NOT_FOUND, message, 404, details);
  }

  static validationError(message = '输入数据格式错误', details = null) {
    return new ApiError(ErrorCode.VALIDATION_ERROR, message, 400, details);
  }

  static unauthorized(message = '请先登录', details = null) {
    return new ApiError(ErrorCode.UNAUTHORIZED, message, 401, details);
  }

  static forbidden(message = '没有权限执行此操作', details = null) {
    return new ApiError(ErrorCode.FORBIDDEN, message, 403, details);
  }

  static internalError(message = '服务器内部错误', details = null) {
    return new ApiError(ErrorCode.INTERNAL_ERROR, message, 500, details);
  }

  static rateLimited(message = '请求过于频繁，请稍后再试', details = null) {
    return new ApiError(ErrorCode.RATE_LIMITED, message, 429, details);
  }

  static badRequest(message = '请求参数错误', details = null) {
    return new ApiError(ErrorCode.BAD_REQUEST, message, 400, details);
  }

  static conflict(message = '资源冲突', details = null) {
    return new ApiError(ErrorCode.CONFLICT, message, 409, details);
  }

  static serviceUnavailable(message = '服务暂时不可用', details = null) {
    return new ApiError(ErrorCode.SERVICE_UNAVAILABLE, message, 503, details);
  }
}

export default ApiError;
