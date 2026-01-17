/**
 * @file cacheService.js
 * @description 后端API服务
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

import NodeCache from 'node-cache';

/**
 * 缓存服务 - 提供内存缓存功能
 * 
 * 不同资源的缓存时间配置（秒）:
 * - SITE_INFO: 30分钟 (1800秒)
 * - PAGE_DATA: 5分钟 (300秒)
 * - CATEGORIES: 10分钟 (600秒)
 * - WEBSITES: 5分钟 (300秒)
 * - HOT_RECOMMENDATIONS: 5分钟 (300秒)
 */

// 缓存TTL配置（秒）
export const CACHE_TTL = {
  SITE_INFO: 1800,           // 30分钟
  PAGE_DATA: 300,            // 5分钟
  CATEGORIES: 600,           // 10分钟
  WEBSITES: 300,             // 5分钟
  HOT_RECOMMENDATIONS: 300,  // 5分钟
  BANNERS: 300,              // 5分钟
  SETTINGS: 600,             // 10分钟
  DEFAULT: 300,              // 默认5分钟
};

// 缓存键前缀
export const CACHE_KEYS = {
  SITE_INFO: 'site_info',
  PAGE_DATA: 'page_data',
  CATEGORIES: 'categories',
  WEBSITES: 'websites',
  HOT_RECOMMENDATIONS: 'hot_recommendations',
  BANNERS: 'banners',
  SETTINGS: 'settings',
};

// 创建缓存实例
const cache = new NodeCache({
  stdTTL: CACHE_TTL.DEFAULT,  // 默认缓存时间
  checkperiod: 60,            // 每60秒检查过期
  useClones: true,            // 返回克隆数据，防止意外修改
  deleteOnExpire: true,       // 过期自动删除
});

/**
 * 获取缓存数据
 * @param {string} key - 缓存键
 * @returns {any} 缓存数据或undefined
 */
export const getCache = (key) => {
  return cache.get(key);
};

/**
 * 设置缓存数据
 * @param {string} key - 缓存键
 * @param {any} value - 缓存值
 * @param {number} ttl - 缓存时间（秒），可选
 * @returns {boolean} 是否设置成功
 */
export const setCache = (key, value, ttl) => {
  if (ttl !== undefined) {
    return cache.set(key, value, ttl);
  }
  return cache.set(key, value);
};

/**
 * 删除指定缓存
 * @param {string} key - 缓存键
 * @returns {number} 删除的键数量
 */
export const deleteCache = (key) => {
  return cache.del(key);
};

/**
 * 按模式清除缓存
 * @param {string} pattern - 缓存键前缀模式
 * @returns {number} 删除的键数量
 */
export const clearCacheByPattern = (pattern) => {
  const keys = cache.keys();
  const matchingKeys = keys.filter(key => key.startsWith(pattern));
  return cache.del(matchingKeys);
};

/**
 * 清除所有缓存
 */
export const clearAllCache = () => {
  cache.flushAll();
};

/**
 * 获取缓存统计信息
 * @returns {object} 缓存统计
 */
export const getCacheStats = () => {
  return cache.getStats();
};

/**
 * 检查缓存是否存在
 * @param {string} key - 缓存键
 * @returns {boolean} 是否存在
 */
export const hasCache = (key) => {
  return cache.has(key);
};

/**
 * 获取所有缓存键
 * @returns {string[]} 缓存键数组
 */
export const getCacheKeys = () => {
  return cache.keys();
};

/**
 * 生成缓存键
 * @param {string} prefix - 前缀
 * @param {string|object} identifier - 标识符
 * @returns {string} 缓存键
 */
export const generateCacheKey = (prefix, identifier = '') => {
  if (typeof identifier === 'object') {
    // 对象参数转为排序后的查询字符串
    const sortedParams = Object.keys(identifier)
      .sort()
      .map(key => `${key}=${identifier[key]}`)
      .join('&');
    return `${prefix}:${sortedParams}`;
  }
  return identifier ? `${prefix}:${identifier}` : prefix;
};

// 导出缓存实例（用于高级操作）
export default cache;
