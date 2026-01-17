/**
 * @file cache.js
 * @description 后端API服务
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

import {
  getCache,
  setCache,
  generateCacheKey,
  CACHE_TTL,
} from '../services/cacheService.js';

/**
 * 缓存中间件工厂函数
 * 
 * @param {object} options - 配置选项
 * @param {string} options.prefix - 缓存键前缀
 * @param {number} options.ttl - 缓存时间（秒），默认300秒
 * @param {function} options.keyGenerator - 自定义缓存键生成函数
 * @returns {function} Express中间件
 */
export const cacheMiddleware = (options = {}) => {
  const {
    prefix = 'api',
    ttl = CACHE_TTL.DEFAULT,
    keyGenerator = null,
  } = options;

  return (req, res, next) => {
    // 只缓存GET请求
    if (req.method !== 'GET') {
      return next();
    }

    // 生成缓存键
    let cacheKey;
    if (keyGenerator && typeof keyGenerator === 'function') {
      cacheKey = keyGenerator(req);
    } else {
      // 默认使用路径和查询参数生成缓存键
      const queryParams = Object.keys(req.query).length > 0 ? req.query : '';
      cacheKey = generateCacheKey(prefix, queryParams || req.path);
    }

    // 检查缓存
    const cachedData = getCache(cacheKey);
    if (cachedData !== undefined) {
      // 缓存命中
      res.set('X-Cache', 'HIT');
      res.set('X-Cache-Key', cacheKey);
      return res.json(cachedData);
    }

    // 缓存未命中，拦截响应
    res.set('X-Cache', 'MISS');
    res.set('X-Cache-Key', cacheKey);

    // 保存原始的json方法
    const originalJson = res.json.bind(res);

    // 重写json方法以捕获响应数据
    res.json = (data) => {
      // 只缓存成功的响应
      if (res.statusCode >= 200 && res.statusCode < 300) {
        setCache(cacheKey, data, ttl);
      }
      return originalJson(data);
    };

    next();
  };
};

/**
 * 站点信息缓存中间件
 */
export const siteInfoCache = cacheMiddleware({
  prefix: 'site_info',
  ttl: CACHE_TTL.SITE_INFO,
});

/**
 * 页面数据缓存中间件
 */
export const pageDataCache = cacheMiddleware({
  prefix: 'page_data',
  ttl: CACHE_TTL.PAGE_DATA,
});

/**
 * 分类数据缓存中间件
 */
export const categoriesCache = cacheMiddleware({
  prefix: 'categories',
  ttl: CACHE_TTL.CATEGORIES,
});

/**
 * 网站数据缓存中间件
 */
export const websitesCache = cacheMiddleware({
  prefix: 'websites',
  ttl: CACHE_TTL.WEBSITES,
});

/**
 * 热门推荐缓存中间件
 */
export const hotRecommendationsCache = cacheMiddleware({
  prefix: 'hot_recommendations',
  ttl: CACHE_TTL.HOT_RECOMMENDATIONS,
});

/**
 * Banner缓存中间件
 */
export const bannersCache = cacheMiddleware({
  prefix: 'banners',
  ttl: CACHE_TTL.BANNERS,
});

/**
 * 设置缓存中间件
 */
export const settingsCache = cacheMiddleware({
  prefix: 'settings',
  ttl: CACHE_TTL.SETTINGS,
});

export default cacheMiddleware;
