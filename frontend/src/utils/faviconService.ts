/**
 * @file faviconService.ts
 * @description Favicon获取服务 - 提供多重备用方案和缓存机制
 * @copyright 版权所有 (c) 2025 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

// Favicon缓存接口
interface FaviconCache {
  [domain: string]: {
    url: string | null;
    timestamp: number;
    attempts: number;
  };
}

// 缓存过期时间（7天）
const CACHE_EXPIRE_TIME = 7 * 24 * 60 * 60 * 1000;
// 最大尝试次数
const MAX_ATTEMPTS = 3;

class FaviconService {
  private cache: FaviconCache = {};
  private readonly cacheKey = 'favicon_cache_v1';

  constructor() {
    this.loadCache();
  }

  /**
   * 从localStorage加载缓存
   */
  private loadCache(): void {
    try {
      const stored = localStorage.getItem(this.cacheKey);
      if (stored) {
        this.cache = JSON.parse(stored);
        // 清理过期缓存
        this.cleanExpiredCache();
      }
    } catch (error) {
      console.warn('加载favicon缓存失败:', error);
      this.cache = {};
    }
  }

  /**
   * 保存缓存到localStorage
   */
  private saveCache(): void {
    try {
      localStorage.setItem(this.cacheKey, JSON.stringify(this.cache));
    } catch (error) {
      console.warn('保存favicon缓存失败:', error);
    }
  }

  /**
   * 清理过期缓存
   */
  private cleanExpiredCache(): void {
    const now = Date.now();
    for (const domain in this.cache) {
      if (now - this.cache[domain].timestamp > CACHE_EXPIRE_TIME) {
        delete this.cache[domain];
      }
    }
  }

  /**
   * 获取域名
   */
  private getDomain(url: string): string | null {
    try {
      return new URL(url).hostname;
    } catch {
      return null;
    }
  }

  /**
   * 生成favicon URL列表（按优先级排序）
   */
  private getFaviconUrls(domain: string): string[] {
    return [
      // 1. 中国服务 - Cravatar API（中国本土）
      `https://cn.cravatar.com/favicon/api/index.php?url=${domain}&size=32`,
      // 2. 百度图标服务（如果有的话，先尝试）
      `https://www.baidu.com/favicon?domain=${domain}&size=32`,
      // 3. 搜狗图标服务
      `https://statics.sogou.com/web/common/images/favicon/${domain}.ico`,
      // 4. 360搜索图标服务
      `https://i.360.cn/favicon/?domain=${domain}&size=32`,
      // 5. DuckDuckGo服务 - 国内访问较好
      `https://icons.duckduckgo.com/ip3/${domain}.ico`,
      // 6. Favicon.io GitHub代理
      `https://favicons.githubusercontent.com/${domain}`,
      // 7. Icon Horse服务
      `https://icon.horse/icon/${domain}`,
      // 8. 直接获取网站favicon
      `https://${domain}/favicon.ico`,
      `https://${domain}/favicon.png`,
      `https://${domain}/apple-touch-icon.png`,
      // 9. Yandex服务
      `https://favicon.yandex.net/favicon/${domain}`,
      // 10. Google服务作为最后备选
      `https://www.google.com/s2/favicons?domain=${domain}&sz=32`,
      // 11. 备用HTTP协议
      `http://${domain}/favicon.ico`
    ];
  }

  /**
   * 测试单个favicon URL是否可用
   */
  private async testFaviconUrl(url: string): Promise<boolean> {
    return new Promise((resolve) => {
      const img = new Image();
      const timeout = setTimeout(() => {
        img.onload = null;
        img.onerror = null;
        resolve(false);
      }, 3000); // 3秒超时

      img.onload = () => {
        clearTimeout(timeout);
        resolve(true);
      };

      img.onerror = () => {
        clearTimeout(timeout);
        resolve(false);
      };

      img.src = url;
    });
  }

  /**
   * 获取favicon URL
   * @param websiteUrl 网站URL
   * @returns Promise<string | null> 有效的favicon URL或null
   */
  async getFaviconUrl(websiteUrl: string): Promise<string | null> {
    const domain = this.getDomain(websiteUrl);
    if (!domain) return null;

    // 检查缓存
    const cached = this.cache[domain];
    if (cached) {
      const isExpired = Date.now() - cached.timestamp > CACHE_EXPIRE_TIME;
      const shouldRetry = cached.attempts < MAX_ATTEMPTS && cached.url === null;
      
      if (!isExpired && !shouldRetry) {
        return cached.url;
      }
    }

    // 获取favicon URL列表
    const faviconUrls = this.getFaviconUrls(domain);
    
    // 测试每个URL
    for (const url of faviconUrls) {
      try {
        const isValid = await this.testFaviconUrl(url);
        if (isValid) {
          // 缓存成功结果
          this.cache[domain] = {
            url,
            timestamp: Date.now(),
            attempts: (cached?.attempts || 0) + 1
          };
          this.saveCache();
          return url;
        }
      } catch (error) {
        console.warn(`测试favicon失败: ${url}`, error);
      }
    }

    // 所有URL都失败，缓存失败结果
    this.cache[domain] = {
      url: null,
      timestamp: Date.now(),
      attempts: (cached?.attempts || 0) + 1
    };
    this.saveCache();
    
    return null;
  }

  /**
   * 预加载favicon（批量处理）
   * @param urls 网站URL数组
   */
  async preloadFavicons(urls: string[]): Promise<void> {
    const promises = urls.map(url => this.getFaviconUrl(url));
    await Promise.allSettled(promises);
  }

  /**
   * 清空缓存
   */
  clearCache(): void {
    this.cache = {};
    localStorage.removeItem(this.cacheKey);
  }

  /**
   * 获取缓存统计
   */
  getCacheStats(): { total: number; success: number; failed: number } {
    const entries = Object.values(this.cache);
    return {
      total: entries.length,
      success: entries.filter(entry => entry.url !== null).length,
      failed: entries.filter(entry => entry.url === null).length
    };
  }
}

// 导出单例
export const faviconService = new FaviconService();

// 默认导出类
export default FaviconService; 