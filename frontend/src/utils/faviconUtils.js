/**
 * @file faviconUtils.js
 * @description 网址图标获取工具函数 - 集成Cravatar Favicon API
 * @copyright 版权所有 (c) 2025 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

// Cravatar API配置
const CRAVATAR_CONFIG = {
  // 主要API端点
  primaryEndpoint: 'https://cn.cravatar.com/favicon/api/index.php',
  
  // 备用API端点（按优先级排序）
  fallbackEndpoints: [
    'https://cravatar.cn/favicon/api/index.php',     // 仅国内加速
    'https://en.cravatar.com/favicon/api/index.php'  // 仅海外加速
  ]
};

// 特殊域名映射 - 处理某些网站的特殊情况
const SPECIAL_DOMAINS = {
  'ant.design': 'antgroup.com',
  'www.figma.com': 'figma.com',
  'www.ant.design': 'antgroup.com',
  'react.dev': 'reactjs.org',
  'nextjs.org': 'vercel.app'
};

/**
 * 规范化域名 - 处理特殊情况和清理
 * @param {string} domain - 原始域名
 * @returns {string} 处理后的域名
 */
const normalizeDomain = (domain) => {
  // 替换特殊域名
  if (SPECIAL_DOMAINS[domain]) {
    console.log(`使用特殊域名映射: ${domain} → ${SPECIAL_DOMAINS[domain]}`);
    return SPECIAL_DOMAINS[domain];
  }
  
  // 移除www前缀
  if (domain.startsWith('www.')) {
    return domain.substring(4);
  }
  
  return domain;
};

/**
 * 使用Cravatar API获取网址的Favicon
 * @param {string} url - 网址
 * @param {boolean} forceRefresh - 是否强制刷新
 * @param {string} endpoint - API端点URL
 * @returns {string} 图标URL
 */
export const getCravatarFavicon = (url, forceRefresh = false, endpoint = CRAVATAR_CONFIG.primaryEndpoint) => {
  try {
    const domain = new URL(url).hostname;
    const normalizedDomain = normalizeDomain(domain);
    const params = new URLSearchParams({
      url: normalizedDomain,
      refresh: forceRefresh ? '1' : '0',
      size: '32'
    });
    
    return `${endpoint}?${params.toString()}`;
  } catch (error) {
    console.error('生成Cravatar favicon URL失败:', error);
    return '';
  }
};

/**
 * 获取网址的Favicon图标 (优先使用Cravatar API)
 * @param {string} url - 网址
 * @param {number} size - 图标尺寸
 * @returns {string} 图标URL
 */
export const getFaviconUrl = (url, size = 32) => {
  try {
    const domain = new URL(url).hostname;
    const normalizedDomain = normalizeDomain(domain);
    
    // 首选方案：Cravatar
    const cravatarUrl = getCravatarFavicon(url);
    
    if (cravatarUrl) return cravatarUrl;
    
    // 备选方案：Google Favicon API
    return `https://www.google.com/s2/favicons?domain=${normalizedDomain}&sz=${size}`;
  } catch (error) {
    console.error('获取favicon失败:', error);
    
    // 最终备选：尝试提取域名并使用Google API
    try {
      const domain = url.replace(/^https?:\/\//, '').split('/')[0];
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=${size}`;
    } catch (fallbackError) {
      return ''; // 如果所有方法都失败，返回空字符串
    }
  }
};

/**
 * 获取高质量网址图标 (多种备选方案)
 * @param {string} url - 网址URL
 * @param {number} size - 图标尺寸
 * @returns {string} 图标URL
 */
export const getHighQualityFavicon = (url, size = 64) => {
  try {
    const domain = new URL(url).hostname;
    
    // 方法1: Cravatar API (推荐，支持高质量图标)
    const cravatarUrl = getCravatarFavicon(url);
    
    // 方法2: Favicon Kit API (高质量备选)
    const faviconkitUrl = `https://api.faviconkit.com/${domain}/${size}`;
    
    return cravatarUrl || faviconkitUrl;
    
  } catch (error) {
    console.error('获取高质量favicon失败:', error);
    return getFaviconUrl(url, size); // 降级到基础方案
  }
};

/**
 * 批量获取网址图标
 * @param {Array} websites - 网址列表
 * @param {number} size - 图标尺寸
 * @returns {Array} 包含图标的网址列表
 */
export const batchGetFavicons = (websites, size = 32) => {
  return websites.map(site => ({
    ...site,
    icon: site.icon || getFaviconUrl(site.url, size)
  }));
};

/**
 * 预加载图标 (可选功能)
 * @param {string} iconUrl - 图标URL
 * @returns {Promise} 加载Promise
 */
export const preloadFavicon = (iconUrl) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(iconUrl);
    img.onerror = () => reject(new Error(`Failed to load favicon: ${iconUrl}`));
    img.src = iconUrl;
    
    // 设置超时
    setTimeout(() => {
      reject(new Error(`Favicon load timeout: ${iconUrl}`));
    }, 5000);
  });
};

/**
 * 获取多个备选图标URL (提高成功率)
 * @param {string} url - 网址URL
 * @param {number} size - 图标尺寸
 * @returns {Array} 备选图标URL数组
 */
export const getFallbackFavicons = (url, size = 32) => {
  try {
    const domain = new URL(url).hostname;
    const normalizedDomain = normalizeDomain(domain);
    
    // 构建多个备选URL
    const fallbacks = [
      // Cravatar API (多个端点)
      getCravatarFavicon(url, false, CRAVATAR_CONFIG.primaryEndpoint),
      ...CRAVATAR_CONFIG.fallbackEndpoints.map(endpoint => 
        getCravatarFavicon(url, false, endpoint)
      ),
      
      // 传统备选方案
      `https://www.google.com/s2/favicons?domain=${normalizedDomain}&sz=${size}`,
      `https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=http://${normalizedDomain}&size=${size}`,
      `https://api.faviconkit.com/${normalizedDomain}/${size}`,
      `https://icons.duckduckgo.com/ip3/${normalizedDomain}.ico`,
      `https://icon.horse/icon/${normalizedDomain}`,
      `https://www.bing.com/favicon/search?q=${encodeURIComponent(`site:${normalizedDomain}`)}`,
      `https://favicon.yandex.net/favicon/${normalizedDomain}`,
      `https://${normalizedDomain}/favicon.ico`,
      `https://${normalizedDomain}/apple-touch-icon.png`,
      `https://${normalizedDomain}/apple-touch-icon-precomposed.png`
    ].filter(Boolean); // 移除空值
    
    return fallbacks;
  } catch (error) {
    console.error('获取备选favicon失败:', error);
    return [
      // 失败时的备选方案
      `https://www.google.com/s2/favicons?domain=${url}&sz=${size}`,
      `https://favicon.yandex.net/favicon/${url}`
    ];
  }
};

/**
 * 智能图标获取 (带错误重试)
 * @param {string} url - 网址URL
 * @param {number} size - 图标尺寸
 * @returns {Promise<string>} 最终图标URL
 */
export const getSmartFavicon = async (url, size = 32) => {
  try {
    const fallbacks = getFallbackFavicons(url, size);
    
    // 尝试加载每个备选图标
    for (let i = 0; i < fallbacks.length; i++) {
      try {
        const faviconUrl = fallbacks[i];
        console.log(`[${url}] 尝试备用方案${i}: ${faviconUrl}`);
        await preloadFavicon(faviconUrl);
        console.log(`[${url}] 成功加载图标: ${faviconUrl}`);
        return faviconUrl; // 返回第一个成功加载的图标
      } catch (error) {
        console.warn(`[${url}] 备用方案${i}加载失败`);
        continue; // 继续尝试下一个
      }
    }
    
    // 如果所有都失败，返回默认图标或空字符串
    console.warn(`[${url}] 所有favicon获取方式都失败了`);
    return '';
  } catch (error) {
    console.error(`[${url}] getSmartFavicon整体失败:`, error);
    return '';
  }
};

/**
 * 缓存图标URL (localStorage)
 * @param {string} domain - 域名
 * @param {string} iconUrl - 图标URL
 */
export const cacheFavicon = (domain, iconUrl) => {
  try {
    const normalizedDomain = normalizeDomain(domain);
    const cache = JSON.parse(localStorage.getItem('faviconCache') || '{}');
    cache[normalizedDomain] = {
      url: iconUrl,
      timestamp: Date.now(),
      source: iconUrl.includes('cravatar') ? 'cravatar' : 'other' // 记录来源
    };
    localStorage.setItem('faviconCache', JSON.stringify(cache));
  } catch (error) {
    console.error('缓存favicon失败:', error);
  }
};

/**
 * 从缓存获取图标URL
 * @param {string} domain - 域名
 * @param {number} maxAge - 最大缓存时间 (毫秒，默认7天)
 * @returns {string|null} 缓存的图标URL
 */
export const getCachedFavicon = (domain, maxAge = 7 * 24 * 60 * 60 * 1000) => {
  try {
    const normalizedDomain = normalizeDomain(domain);
    const cache = JSON.parse(localStorage.getItem('faviconCache') || '{}');
    const cached = cache[normalizedDomain];
    
    if (cached && (Date.now() - cached.timestamp) < maxAge) {
      return cached.url;
    }
    
    return null;
  } catch (error) {
    console.error('获取缓存favicon失败:', error);
    return null;
  }
};

/**
 * 强制刷新图标缓存
 * @param {string} url - 网址URL
 * @returns {Promise<string>} 新的图标URL
 */
export const refreshFavicon = async (url) => {
  try {
    const domain = new URL(url).hostname;
    const normalizedDomain = normalizeDomain(domain);
    
    // 清除本地缓存
    const cache = JSON.parse(localStorage.getItem('faviconCache') || '{}');
    delete cache[normalizedDomain];
    localStorage.setItem('faviconCache', JSON.stringify(cache));
    
    // 使用Cravatar强制刷新功能
    const refreshedUrl = getCravatarFavicon(url, true);
    
    // 尝试预加载新图标
    await preloadFavicon(refreshedUrl);
    
    // 缓存新结果
    cacheFavicon(normalizedDomain, refreshedUrl);
    
    return refreshedUrl;
  } catch (error) {
    console.error('刷新favicon失败:', error);
    return getFaviconUrl(url); // 降级到基础方案
  }
};

/**
 * 带缓存的智能图标获取
 * @param {string} url - 网址URL
 * @param {number} size - 图标尺寸
 * @returns {Promise<string>} 图标URL
 */
export const getCachedSmartFavicon = async (url, size = 32) => {
  try {
    const domain = new URL(url).hostname;
    const normalizedDomain = normalizeDomain(domain);
    
    // 先检查缓存
    const cached = getCachedFavicon(normalizedDomain);
    if (cached) {
      return cached;
    }
    
    // 获取新图标
    const iconUrl = await getSmartFavicon(url, size);
    
    // 缓存结果
    if (iconUrl) {
      cacheFavicon(normalizedDomain, iconUrl);
    }
    
    return iconUrl;
  } catch (error) {
    console.error(`[${url}] 获取缓存智能favicon失败:`, error);
    return getFaviconUrl(url, size); // 降级到基础方案
  }
};

/**
 * 获取缓存统计信息
 * @returns {Object} 缓存统计
 */
export const getFaviconCacheStats = () => {
  try {
    const cache = JSON.parse(localStorage.getItem('faviconCache') || '{}');
    const entries = Object.entries(cache);
    
    return {
      totalCached: entries.length,
      cravatarCount: entries.filter(([_, data]) => data.source === 'cravatar').length,
      otherCount: entries.filter(([_, data]) => data.source === 'other').length,
      oldestEntry: entries.length > 0 ? Math.min(...entries.map(([_, data]) => data.timestamp)) : null,
      newestEntry: entries.length > 0 ? Math.max(...entries.map(([_, data]) => data.timestamp)) : null
    };
  } catch (error) {
    console.error('获取缓存统计失败:', error);
    return { totalCached: 0, cravatarCount: 0, otherCount: 0, oldestEntry: null, newestEntry: null };
  }
};

/**
 * 清理过期缓存
 * @param {number} maxAge - 最大缓存时间 (毫秒，默认7天)
 * @returns {number} 清理的条目数量
 */
export const cleanExpiredFavicons = (maxAge = 7 * 24 * 60 * 60 * 1000) => {
  try {
    const cache = JSON.parse(localStorage.getItem('faviconCache') || '{}');
    const now = Date.now();
    let cleanedCount = 0;
    
    Object.keys(cache).forEach(domain => {
      if (now - cache[domain].timestamp > maxAge) {
        delete cache[domain];
        cleanedCount++;
      }
    });
    
    localStorage.setItem('faviconCache', JSON.stringify(cache));
    
    if (cleanedCount > 0) {
      console.log(`清理了 ${cleanedCount} 个过期favicon缓存`);
    }
    
    return cleanedCount;
  } catch (error) {
    console.error('清理过期缓存失败:', error);
    return 0;
  }
}; 
