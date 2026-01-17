/**
 * @file cacheInvalidation.js
 * @description 后端API服务
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

import {
  clearCacheByPattern,
  clearAllCache,
  deleteCache,
  CACHE_KEYS,
} from '../services/cacheService.js';

/**
 * 缓存失效中间件工厂函数
 * 在数据修改操作后自动清除相关缓存
 * 
 * @param {string|string[]} patterns - 要清除的缓存模式（前缀）
 * @returns {function} Express中间件
 */
export const invalidateCache = (patterns) => {
  const patternList = Array.isArray(patterns) ? patterns : [patterns];
  
  return (req, res, next) => {
    // 保存原始的json方法
    const originalJson = res.json.bind(res);
    
    // 重写json方法以在成功响应后清除缓存
    res.json = (data) => {
      // 只在成功的修改操作后清除缓存
      if (res.statusCode >= 200 && res.statusCode < 300) {
        // 清除指定模式的缓存
        patternList.forEach(pattern => {
          const deletedCount = clearCacheByPattern(pattern);
          if (deletedCount > 0) {
            console.log(`[Cache] 清除缓存: ${pattern}, 删除 ${deletedCount} 条`);
          }
        });
      }
      return originalJson(data);
    };
    
    next();
  };
};

/**
 * 清除所有缓存的中间件
 */
export const invalidateAllCache = (req, res, next) => {
  const originalJson = res.json.bind(res);
  
  res.json = (data) => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      clearAllCache();
      console.log('[Cache] 清除所有缓存');
    }
    return originalJson(data);
  };
  
  next();
};

/**
 * 分类数据修改时的缓存失效
 * 清除分类缓存、页面缓存（因为页面包含分类数据）
 */
export const invalidateCategoryCache = invalidateCache([
  CACHE_KEYS.CATEGORIES,
  CACHE_KEYS.PAGE_DATA,
  CACHE_KEYS.WEBSITES,
]);

/**
 * 网站数据修改时的缓存失效
 * 清除网站缓存、页面缓存、热门推荐缓存
 */
export const invalidateWebsiteCache = invalidateCache([
  CACHE_KEYS.WEBSITES,
  CACHE_KEYS.PAGE_DATA,
  CACHE_KEYS.HOT_RECOMMENDATIONS,
]);

/**
 * 页面数据修改时的缓存失效
 */
export const invalidatePageCache = invalidateCache([
  CACHE_KEYS.PAGE_DATA,
]);

/**
 * 站点信息修改时的缓存失效
 */
export const invalidateSiteInfoCache = invalidateCache([
  CACHE_KEYS.SITE_INFO,
]);

/**
 * 热门推荐修改时的缓存失效
 */
export const invalidateHotRecommendationsCache = invalidateCache([
  CACHE_KEYS.HOT_RECOMMENDATIONS,
]);

/**
 * Banner修改时的缓存失效
 */
export const invalidateBannerCache = invalidateCache([
  CACHE_KEYS.BANNERS,
]);

/**
 * 设置修改时的缓存失效
 */
export const invalidateSettingsCache = invalidateCache([
  CACHE_KEYS.SETTINGS,
]);

/**
 * 根据请求路径自动判断需要清除的缓存
 * 用于通用的数据修改路由
 */
export const autoInvalidateCache = (req, res, next) => {
  const path = req.baseUrl || req.path;
  
  // 根据路径确定要清除的缓存模式
  const cachePatterns = [];
  
  if (path.includes('/categories')) {
    cachePatterns.push(CACHE_KEYS.CATEGORIES, CACHE_KEYS.PAGE_DATA);
  }
  if (path.includes('/websites')) {
    cachePatterns.push(CACHE_KEYS.WEBSITES, CACHE_KEYS.PAGE_DATA, CACHE_KEYS.HOT_RECOMMENDATIONS);
  }
  if (path.includes('/pages')) {
    cachePatterns.push(CACHE_KEYS.PAGE_DATA);
  }
  if (path.includes('/site-info')) {
    cachePatterns.push(CACHE_KEYS.SITE_INFO);
  }
  if (path.includes('/hot-recommendations')) {
    cachePatterns.push(CACHE_KEYS.HOT_RECOMMENDATIONS);
  }
  if (path.includes('/banners')) {
    cachePatterns.push(CACHE_KEYS.BANNERS);
  }
  if (path.includes('/settings')) {
    cachePatterns.push(CACHE_KEYS.SETTINGS);
  }
  
  if (cachePatterns.length > 0) {
    return invalidateCache(cachePatterns)(req, res, next);
  }
  
  next();
};

export default invalidateCache;
