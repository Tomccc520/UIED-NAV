/**
 * @file errorHandler.ts
 * @description 前端用户界面组件
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

import { AxiosError } from 'axios';

/**
 * API错误代码枚举
 */
export enum ApiErrorCode {
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT',
  NOT_FOUND = 'NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  RATE_LIMITED = 'RATE_LIMITED',
  UNKNOWN = 'UNKNOWN',
}

/**
 * 用户友好的错误消息映射
 */
const ERROR_MESSAGES: Record<ApiErrorCode, string> = {
  [ApiErrorCode.NETWORK_ERROR]: '网络连接失败，请检查网络设置',
  [ApiErrorCode.TIMEOUT]: '请求超时，请稍后重试',
  [ApiErrorCode.NOT_FOUND]: '请求的资源不存在',
  [ApiErrorCode.UNAUTHORIZED]: '请先登录后再操作',
  [ApiErrorCode.FORBIDDEN]: '您没有权限执行此操作',
  [ApiErrorCode.VALIDATION_ERROR]: '输入数据有误，请检查后重试',
  [ApiErrorCode.SERVER_ERROR]: '服务器繁忙，请稍后重试',
  [ApiErrorCode.RATE_LIMITED]: '请求过于频繁，请稍后重试',
  [ApiErrorCode.UNKNOWN]: '发生未知错误，请稍后重试',
};

/**
 * 解析后的API错误
 */
export interface ParsedApiError {
  code: ApiErrorCode;
  message: string;
  originalMessage?: string;
  statusCode?: number;
  details?: Record<string, unknown>;
}

/**
 * 从HTTP状态码获取错误代码
 */
const getErrorCodeFromStatus = (status: number): ApiErrorCode => {
  switch (status) {
    case 400:
      return ApiErrorCode.VALIDATION_ERROR;
    case 401:
      return ApiErrorCode.UNAUTHORIZED;
    case 403:
      return ApiErrorCode.FORBIDDEN;
    case 404:
      return ApiErrorCode.NOT_FOUND;
    case 408:
      return ApiErrorCode.TIMEOUT;
    case 429:
      return ApiErrorCode.RATE_LIMITED;
    case 500:
    case 502:
    case 503:
    case 504:
      return ApiErrorCode.SERVER_ERROR;
    default:
      return ApiErrorCode.UNKNOWN;
  }
};

/**
 * 解析Axios错误为用户友好的格式
 */
export const parseApiError = (error: unknown): ParsedApiError => {
  // 处理Axios错误
  if (error instanceof AxiosError) {
    // 网络错误（无响应）
    if (!error.response) {
      if (error.code === 'ECONNABORTED') {
        return {
          code: ApiErrorCode.TIMEOUT,
          message: ERROR_MESSAGES[ApiErrorCode.TIMEOUT],
          originalMessage: error.message,
        };
      }
      return {
        code: ApiErrorCode.NETWORK_ERROR,
        message: ERROR_MESSAGES[ApiErrorCode.NETWORK_ERROR],
        originalMessage: error.message,
      };
    }

    const status = error.response.status;
    const code = getErrorCodeFromStatus(status);
    
    // 尝试从响应中获取详细错误信息
    const responseData = error.response.data as Record<string, unknown> | undefined;
    const serverMessage = responseData?.message as string | undefined;
    const details = responseData?.details as Record<string, unknown> | undefined;

    return {
      code,
      message: serverMessage || ERROR_MESSAGES[code],
      originalMessage: error.message,
      statusCode: status,
      details,
    };
  }

  // 处理普通Error
  if (error instanceof Error) {
    return {
      code: ApiErrorCode.UNKNOWN,
      message: ERROR_MESSAGES[ApiErrorCode.UNKNOWN],
      originalMessage: error.message,
    };
  }

  // 处理其他类型
  return {
    code: ApiErrorCode.UNKNOWN,
    message: ERROR_MESSAGES[ApiErrorCode.UNKNOWN],
    originalMessage: String(error),
  };
};

/**
 * 获取用户友好的错误消息
 */
export const getErrorMessage = (error: unknown): string => {
  const parsed = parseApiError(error);
  return parsed.message;
};

/**
 * 判断是否为网络错误
 */
export const isNetworkError = (error: unknown): boolean => {
  const parsed = parseApiError(error);
  return parsed.code === ApiErrorCode.NETWORK_ERROR;
};

/**
 * 判断是否为认证错误
 */
export const isAuthError = (error: unknown): boolean => {
  const parsed = parseApiError(error);
  return parsed.code === ApiErrorCode.UNAUTHORIZED || parsed.code === ApiErrorCode.FORBIDDEN;
};

/**
 * 判断是否为可重试的错误
 */
export const isRetryableError = (error: unknown): boolean => {
  const parsed = parseApiError(error);
  return [
    ApiErrorCode.NETWORK_ERROR,
    ApiErrorCode.TIMEOUT,
    ApiErrorCode.SERVER_ERROR,
    ApiErrorCode.RATE_LIMITED,
  ].includes(parsed.code);
};

const errorHandler = {
  parseApiError,
  getErrorMessage,
  isNetworkError,
  isAuthError,
  isRetryableError,
  ApiErrorCode,
};

export default errorHandler;
