/**
 * @file errorHandler.js
 * @description 后端API服务
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

import { ApiError, ErrorCode, ErrorStatusCode } from '../utils/ApiError.js';

/**
 * 统一错误处理中间件
 * Unified error handling middleware for Express
 * 
 * 功能:
 * - 处理 ApiError 实例
 * - 处理 Prisma 数据库错误
 * - 处理未知错误
 * - 返回统一格式的错误响应
 */
export const errorHandler = (err, req, res, next) => {
  // 如果响应已发送，交给默认处理
  if (res.headersSent) {
    return next(err);
  }

  // 构建错误响应
  let errorResponse = {
    code: ErrorCode.INTERNAL_ERROR,
    message: '服务器内部错误',
    timestamp: new Date().toISOString(),
    path: req.path,
  };

  let statusCode = 500;

  // 处理 ApiError 实例
  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    errorResponse = {
      code: err.code,
      message: err.message,
      timestamp: err.timestamp,
      path: req.path,
    };
    
    // 开发环境返回详细错误信息
    if (process.env.NODE_ENV === 'development' && err.details) {
      errorResponse.details = err.details;
    }
  }
  // 处理 Prisma 错误
  else if (err.code && err.code.startsWith('P')) {
    const prismaError = handlePrismaError(err);
    statusCode = prismaError.statusCode;
    errorResponse = {
      ...prismaError.response,
      timestamp: new Date().toISOString(),
      path: req.path,
    };
  }
  // 处理 JSON 解析错误
  else if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    statusCode = 400;
    errorResponse = {
      code: ErrorCode.BAD_REQUEST,
      message: '请求体JSON格式错误',
      timestamp: new Date().toISOString(),
      path: req.path,
    };
  }
  // 处理其他错误
  else {
    // 开发环境返回详细错误信息
    if (process.env.NODE_ENV === 'development') {
      errorResponse.details = {
        name: err.name,
        message: err.message,
        stack: err.stack,
      };
    }
  }

  // 记录错误日志
  console.error(`[${errorResponse.timestamp}] ${req.method} ${req.path} - Error:`, {
    code: errorResponse.code,
    message: err.message,
    stack: err.stack,
  });

  res.status(statusCode).json(errorResponse);
};

/**
 * 处理 Prisma 数据库错误
 * @param {Error} err - Prisma 错误
 * @returns {{ statusCode: number, response: object }}
 */
function handlePrismaError(err) {
  const errorMap = {
    // 唯一约束冲突
    P2002: {
      statusCode: 409,
      response: {
        code: ErrorCode.CONFLICT,
        message: '数据已存在，请检查唯一字段',
      },
    },
    // 记录不存在
    P2025: {
      statusCode: 404,
      response: {
        code: ErrorCode.NOT_FOUND,
        message: '请求的记录不存在',
      },
    },
    // 外键约束失败
    P2003: {
      statusCode: 400,
      response: {
        code: ErrorCode.BAD_REQUEST,
        message: '关联的记录不存在',
      },
    },
    // 数据验证失败
    P2007: {
      statusCode: 400,
      response: {
        code: ErrorCode.VALIDATION_ERROR,
        message: '数据验证失败',
      },
    },
    // 连接错误
    P1001: {
      statusCode: 503,
      response: {
        code: ErrorCode.SERVICE_UNAVAILABLE,
        message: '数据库连接失败，请稍后再试',
      },
    },
    // 超时
    P1008: {
      statusCode: 503,
      response: {
        code: ErrorCode.SERVICE_UNAVAILABLE,
        message: '数据库操作超时，请稍后再试',
      },
    },
  };

  const mapped = errorMap[err.code];
  if (mapped) {
    return mapped;
  }

  // 默认数据库错误
  return {
    statusCode: 500,
    response: {
      code: ErrorCode.INTERNAL_ERROR,
      message: '数据库操作失败',
    },
  };
}

/**
 * 404 路由未找到处理中间件
 */
export const notFoundHandler = (req, res, next) => {
  const error = ApiError.notFound(`路由 ${req.method} ${req.path} 不存在`);
  next(error);
};

/**
 * 异步路由包装器 - 自动捕获异步错误
 * @param {Function} fn - 异步路由处理函数
 * @returns {Function} 包装后的路由处理函数
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export default errorHandler;
