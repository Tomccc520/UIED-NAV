/**
 * @file utils/errorHelper.ts
 * @description 错误处理工具 - 方便调试和复制错误信息
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

import { message, Modal } from 'antd';
import React from 'react';

/**
 * 格式化错误信息
 */
export const formatError = (error: any): string => {
  const parts: string[] = [];
  
  // 请求信息
  if (error.config) {
    parts.push(`请求: ${error.config.method?.toUpperCase()} ${error.config.url}`);
  }
  
  // 响应状态
  if (error.response) {
    parts.push(`状态码: ${error.response.status}`);
    
    // 响应数据
    const data = error.response.data;
    if (data) {
      if (typeof data === 'string') {
        parts.push(`响应: ${data}`);
      } else {
        parts.push(`响应: ${JSON.stringify(data, null, 2)}`);
      }
    }
  }
  
  // 错误消息
  if (error.message) {
    parts.push(`错误: ${error.message}`);
  }
  
  return parts.join('\n');
};

/**
 * 获取用户友好的错误消息
 */
export const getErrorMessage = (error: any): string => {
  if (error.response?.data?.error) {
    return error.response.data.error;
  }
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.message) {
    return error.message;
  }
  return '操作失败，请稍后重试';
};

/**
 * 显示错误弹窗（可复制详细信息）
 */
export const showErrorModal = (error: any, title = '操作失败') => {
  const errorDetail = formatError(error);
  const userMessage = getErrorMessage(error);
  
  Modal.error({
    title,
    content: React.createElement('div', null, [
      React.createElement('p', { key: 'msg', style: { marginBottom: 16 } }, userMessage),
      React.createElement('details', { 
        key: 'details',
        style: { 
          background: '#f5f5f5', 
          padding: 12, 
          borderRadius: 4,
          fontSize: 12,
          fontFamily: 'monospace'
        }
      }, [
        React.createElement('summary', { 
          key: 'summary',
          style: { cursor: 'pointer', marginBottom: 8 } 
        }, '点击查看详细错误信息（可复制）'),
        React.createElement('pre', { 
          key: 'pre',
          style: { 
            margin: 0, 
            whiteSpace: 'pre-wrap', 
            wordBreak: 'break-all',
            userSelect: 'all'
          }
        }, errorDetail)
      ])
    ]),
    width: 500,
  });
};

/**
 * 显示简单错误消息
 */
export const showError = (error: any, defaultMsg = '操作失败') => {
  const msg = getErrorMessage(error);
  message.error(msg || defaultMsg);
  
  // 同时在控制台输出详细信息
  console.error('[API Error]', formatError(error));
};

/**
 * 包装 API 调用，自动处理错误
 */
export const withErrorHandling = async <T>(
  apiCall: () => Promise<T>,
  options?: {
    successMsg?: string;
    errorMsg?: string;
    showModal?: boolean;
  }
): Promise<T | null> => {
  try {
    const result = await apiCall();
    if (options?.successMsg) {
      message.success(options.successMsg);
    }
    return result;
  } catch (error: any) {
    if (options?.showModal) {
      showErrorModal(error, options.errorMsg);
    } else {
      showError(error, options?.errorMsg);
    }
    return null;
  }
};
