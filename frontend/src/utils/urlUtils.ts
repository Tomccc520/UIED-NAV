/**
 * @copyright Tomda (https://www.tomda.top)
 * @copyright UIED技术团队 (https://fsuied.com)
 * @author UIED技术团队
 * @createDate 2026.2.13
 * 
 * @file urlUtils.ts
 * @description 统一的 URL 处理工具 - 处理 API 地址和图片路径
 */

// 默认端口配置
const DEFAULT_API_PORT = '8002';
const DEFAULT_API_BASE = `http://localhost:${DEFAULT_API_PORT}/api`;

/**
 * 获取 API 基础地址
 * 统一优先使用 CRA 环境变量（REACT_APP_API_URL）
 * 
 * @returns API 基础地址
 */
export const getApiBaseUrl = (): string => {
  const craEnv = String(process.env.REACT_APP_API_URL || '').trim();
  const legacyEnv = String(process.env.VITE_API_URL || '').trim();
  const candidate = craEnv || legacyEnv || DEFAULT_API_BASE;
  const normalized = candidate.replace(/\/+$/, '');

  // 兜底兼容：若误传后端根地址（不含 /api），自动补齐
  if (/^https?:\/\/[^/]+$/i.test(normalized)) {
    return `${normalized}/api`;
  }
  return normalized || DEFAULT_API_BASE;
};

/**
 * 获取后端基础地址（不含 /api）
 */
export const getBackendBaseUrl = (): string => {
  return getApiBaseUrl().replace('/api', '');
};

/**
 * 获取完整的图片 URL
 * 处理相对路径和错误的端口，统一指向后端服务器
 * 
 * @param url - 图片 URL（可能是相对路径或完整 URL）
 * @returns 完整的图片 URL
 */
export const getFullImageUrl = (url: string): string => {
  if (!url) return '';
  
  const backendBase = getBackendBaseUrl();
  
  // 如果是相对路径，添加后端服务器地址
  if (url.startsWith('/uploads/')) {
    return `${backendBase}${url}`;
  }
  
  // 如果是完整 URL，检查是否需要修正端口
  // 处理 localhost:5173 (admin) 或其他错误端口的情况
  if (url.includes('localhost:5173/uploads/') || 
      url.includes('localhost:3000/uploads/') ||
      url.includes('localhost:5174/uploads/')) {
    const uploadPath = url.match(/\/uploads\/.+$/)?.[0];
    if (uploadPath) {
      return `${backendBase}${uploadPath}`;
    }
  }
  
  // 如果已经是完整的外部 URL，直接返回
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // 其他情况，添加后端地址
  return `${backendBase}${url.startsWith('/') ? '' : '/'}${url}`;
};

/**
 * 处理内容中的图片路径
 * 将内容中的相对路径或错误端口的图片路径替换为正确的后端地址
 * 
 * @param content - HTML 或 Markdown 内容
 * @returns 处理后的内容
 */
export const processContentImageUrls = (content: string): string => {
  if (!content) return '';
  
  const backendBase = getBackendBaseUrl();
  
  return content
    // 替换错误端口的图片路径
    .replace(/src="http:\/\/localhost:5173\/uploads\//g, `src="${backendBase}/uploads/`)
    .replace(/src="http:\/\/localhost:5174\/uploads\//g, `src="${backendBase}/uploads/`)
    .replace(/src="http:\/\/localhost:3000\/uploads\//g, `src="${backendBase}/uploads/`)
    // 替换相对路径
    .replace(/src="\/uploads\//g, `src="${backendBase}/uploads/`);
};

/**
 * URL 工具对象导出，便于默认导入场景复用。
 */
const urlUtils = {
  getApiBaseUrl,
  getBackendBaseUrl,
  getFullImageUrl,
  processContentImageUrls,
};

export default urlUtils;
