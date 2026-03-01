/**
 * @copyright Tomda (https://www.tomda.top)
 * @copyright UIED技术团队 (https://fsuied.com)
 * @author UIED技术团队
 * @createDate 2026.1.27
 * 
 * @file api.ts
 * @description 统一的 API 服务 - 提供 axios 实例和请求拦截器
 */

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { getApiBaseUrl } from '../utils/urlUtils';

// 使用统一的 URL 工具获取 API 地址
const API_BASE_URL = getApiBaseUrl();

// 重试配置
const RETRY_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000, // 基础延迟时间（毫秒）
  retryableStatuses: [408, 429, 500, 502, 503, 504], // 可重试的HTTP状态码
  retryableMethods: ['get', 'head', 'options'], // 幂等方法才重试
};

// 扩展AxiosRequestConfig以支持重试计数
interface ExtendedAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retryCount?: number;
  _startTime?: number;
}

/**
 * 统一规范请求路径，避免出现 /api/api 重复前缀与历史别名路径
 */
const normalizeRequestUrl = (rawUrl: unknown, rawBaseUrl: unknown): string | undefined => {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return undefined;
  }
  // 绝对地址不做处理
  if (/^https?:\/\//i.test(rawUrl)) {
    return rawUrl;
  }

  const [pathPart, queryPart] = String(rawUrl).split('?');
  let path = pathPart.startsWith('/') ? pathPart : `/${pathPart}`;

  // 兼容历史公开设置路径（旧路径会触发后台鉴权）
  if (path === '/uied/setting/public' || path === '/api/uied/setting/public') {
    path = '/settings/public';
  }

  const baseUrl = typeof rawBaseUrl === 'string' ? rawBaseUrl : '';
  const baseHasApiSuffix = /\/api\/?$/i.test(baseUrl);
  if (baseHasApiSuffix && path.startsWith('/api/')) {
    path = path.replace(/^\/api/, '');
  }

  return queryPart ? `${path}?${queryPart}` : path;
};

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
api.interceptors.request.use(
  (config: ExtendedAxiosRequestConfig) => {
    // 规范化请求 URL，统一接口路径规则
    config.url = normalizeRequestUrl(config.url, config.baseURL || API_BASE_URL);

    /**
     * FormData 请求必须移除默认 JSON 头，让浏览器自动补全 multipart boundary。
     * 否则文件上传场景（如头像上传）会被错误编码，后端无法正常读取文件流。
     */
    if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
      if (config.headers) {
        delete config.headers['Content-Type'];
        delete config.headers['content-type'];
      }
    }

    // 记录请求开始时间（用于性能监控）
    config._startTime = Date.now();
    
    // 初始化重试计数
    if (config._retryCount === undefined) {
      config._retryCount = 0;
    }
    
    // 添加请求ID用于追踪
    const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    config.headers['X-Request-ID'] = requestId;

    // 添加 token (如果存在)
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['token'] = token;
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    console.error('Request Error:', error);
    return Promise.reject(error);
  }
);

// 计算重试延迟（指数退避）
const getRetryDelay = (retryCount: number): number => {
  // 指数退避: 1s, 2s, 4s...
  return RETRY_CONFIG.retryDelay * Math.pow(2, retryCount);
};

// 判断是否应该重试
const shouldRetry = (error: AxiosError, config: ExtendedAxiosRequestConfig): boolean => {
  const retryCount = config._retryCount || 0;
  
  // 超过最大重试次数
  if (retryCount >= RETRY_CONFIG.maxRetries) {
    return false;
  }
  
  // 只重试幂等方法
  const method = config.method?.toLowerCase() || '';
  if (!RETRY_CONFIG.retryableMethods.includes(method)) {
    return false;
  }
  
  // 网络错误或超时
  if (!error.response) {
    return true;
  }
  
  // 检查HTTP状态码
  const status = error.response.status;
  return RETRY_CONFIG.retryableStatuses.includes(status);
};

/**
 * 判断是否为可忽略的非关键错误（例如商业位未授权返回 403）
 */
const shouldIgnoreErrorLog = (error: AxiosError, config: ExtendedAxiosRequestConfig): boolean => {
  const status = Number(error.response?.status || 0);
  const requestUrl = String(config.url || '').toLowerCase();
  if (status === 403 && requestUrl.includes('/commercial/placements')) {
    return true;
  }
  return false;
};

// 延迟函数
const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    // 记录请求耗时
    const config = response.config as ExtendedAxiosRequestConfig;
    if (config._startTime) {
      const duration = Date.now() - config._startTime;
      // 只在开发环境记录慢请求
      if (process.env.NODE_ENV === 'development' && duration > 1000) {
        console.warn(`Slow API request: ${config.url} took ${duration}ms`);
      }
    }
    return response;
  },
  async (error: AxiosError) => {
    const config = error.config as ExtendedAxiosRequestConfig;
    
    if (!config) {
      return Promise.reject(error);
    }
    
    // 检查是否应该重试
    if (shouldRetry(error, config)) {
      config._retryCount = (config._retryCount || 0) + 1;
      const retryDelay = getRetryDelay(config._retryCount - 1);
      
      console.warn(
        `API request failed, retrying (${config._retryCount}/${RETRY_CONFIG.maxRetries}): ${config.url}`
      );
      
      // 等待后重试
      await delay(retryDelay);
      return api.request(config);
    }
    
    // 对可预期的非关键错误做静默降级，避免控制台刷屏
    if (shouldIgnoreErrorLog(error, config)) {
      return Promise.reject(error);
    }

    // 记录错误详情
    const errorInfo = {
      url: config.url,
      method: config.method,
      status: error.response?.status,
      message: error.message,
      retryCount: config._retryCount || 0,
    };
    console.error('API Error:', errorInfo);
    
    return Promise.reject(error);
  }
);

// 记录网站点击
export const recordWebsiteClick = async (websiteId: string): Promise<void> => {
  try {
    await api.post(`/websites/${websiteId}/click`);
  } catch (error) {
    // 静默失败，不影响用户体验
    console.error('记录点击失败:', error);
  }
};

// 导出重试配置（用于测试）
export { RETRY_CONFIG };

export default api;
