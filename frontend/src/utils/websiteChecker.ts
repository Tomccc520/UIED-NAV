/**
 * @file websiteChecker.ts
 * @description 网站访问检测工具 - 检测AI网站是否可访问
 * @copyright 版权所有 (c) 2025 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

// 检测结果接口
interface CheckResult {
  url: string;
  accessible: boolean;
  responseTime?: number;
  status?: number;
  error?: string;
  timestamp: number;
}

// 批量检测结果接口
interface BatchCheckResult {
  total: number;
  accessible: number;
  failed: number;
  results: CheckResult[];
}

class WebsiteChecker {
  private cache: Map<string, CheckResult> = new Map();
  private readonly cacheExpiry = 5 * 60 * 1000; // 5分钟缓存

  /**
   * 将未知异常转换为标准 Error 对象。
   */
  private normalizeError(error: unknown): Error {
    if (error instanceof Error) return error;
    return new Error(String(error));
  }

  /**
   * 检测单个网站是否可访问
   * @param url 网站URL
   * @param timeout 超时时间（毫秒），默认5秒
   * @returns Promise<CheckResult> 检测结果
   */
  async checkWebsite(url: string, timeout = 5000): Promise<CheckResult> {
    // 检查缓存
    const cached = this.cache.get(url);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached;
    }

    const startTime = Date.now();
    const result: CheckResult = {
      url,
      accessible: false,
      timestamp: Date.now()
    };

    try {
      // 使用 AbortController 实现超时
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      // 发起请求 - 使用 HEAD 方法减少数据传输
      const response = await fetch(url, {
        method: 'HEAD',
        signal: controller.signal,
        mode: 'no-cors', // 避免CORS问题
        cache: 'no-cache',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; UIED-Checker/1.0)'
        }
      });

      clearTimeout(timeoutId);
      
      result.responseTime = Date.now() - startTime;
      result.status = response.status;
      result.accessible = response.status < 400 || response.type === 'opaque'; // no-cors模式下type为opaque

    } catch (error: unknown) {
      const normalizedError = this.normalizeError(error);
      result.responseTime = Date.now() - startTime;
      result.error = normalizedError.message;
      
      // 特殊处理：CORS错误通常表示网站存在但有CORS限制
      if (normalizedError.name === 'TypeError' && normalizedError.message.includes('CORS')) {
        result.accessible = true;
        result.error = 'CORS限制，但网站可访问';
      }
      // 网络错误或超时
      else if (normalizedError.name === 'AbortError') {
        result.error = '请求超时';
      }
      else if (normalizedError.name === 'TypeError') {
        result.error = '网络错误或网站不可访问';
      }
    }

    // 缓存结果
    this.cache.set(url, result);
    return result;
  }

  /**
   * 使用备用方法检测网站（图片加载法）
   * @param url 网站URL
   * @param timeout 超时时间
   * @returns Promise<CheckResult> 检测结果
   */
  async checkWebsiteByImage(url: string, timeout = 3000): Promise<CheckResult> {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const result: CheckResult = {
        url,
        accessible: false,
        timestamp: Date.now()
      };

      try {
        const domain = new URL(url).hostname;
        const img = new Image();
        
        const timeoutId = setTimeout(() => {
          img.onload = null;
          img.onerror = null;
          result.responseTime = Date.now() - startTime;
          result.error = '检测超时';
          resolve(result);
        }, timeout);

        img.onload = () => {
          clearTimeout(timeoutId);
          result.accessible = true;
          result.responseTime = Date.now() - startTime;
          resolve(result);
        };

        img.onerror = () => {
          clearTimeout(timeoutId);
          result.responseTime = Date.now() - startTime;
          result.error = 'favicon加载失败，可能网站存在但无favicon';
          result.accessible = false;
          resolve(result);
        };

        // 尝试加载网站favicon
        img.src = `https://www.google.com/s2/favicons?domain=${domain}&sz=16`;
        
      } catch (error: unknown) {
        const normalizedError = this.normalizeError(error);
        result.error = normalizedError.message;
        result.responseTime = Date.now() - startTime;
        resolve(result);
      }
    });
  }

  /**
   * 批量检测网站
   * @param urls 网站URL数组
   * @param concurrency 并发数，默认5
   * @returns Promise<BatchCheckResult> 批量检测结果
   */
  async checkWebsitesBatch(urls: string[], concurrency = 5): Promise<BatchCheckResult> {
    const results: CheckResult[] = [];
    
    // 分批处理，避免并发过多
    for (let i = 0; i < urls.length; i += concurrency) {
      const batch = urls.slice(i, i + concurrency);
      const batchPromises = batch.map(url => this.checkWebsite(url));
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // 显示进度
      console.log(`网站检测进度: ${Math.min(i + concurrency, urls.length)}/${urls.length}`);
    }

    const accessible = results.filter(r => r.accessible).length;
    const failed = results.length - accessible;

    return {
      total: results.length,
      accessible,
      failed,
      results
    };
  }

  /**
   * 智能检测（结合多种方法）
   * @param url 网站URL
   * @returns Promise<CheckResult> 检测结果
   */
  async smartCheck(url: string): Promise<CheckResult> {
    // 首先尝试fetch方法
    let result = await this.checkWebsite(url);
    
    // 如果fetch失败，尝试图片加载法
    if (!result.accessible) {
      const imageResult = await this.checkWebsiteByImage(url);
      if (imageResult.accessible) {
        result = {
          ...result,
          accessible: true,
          error: '通过favicon检测确认网站可访问'
        };
      }
    }

    return result;
  }

  /**
   * 获取检测统计
   */
  getStats(): { total: number; accessible: number; failed: number } {
    const total = this.cache.size;
    const accessible = Array.from(this.cache.values()).filter(r => r.accessible).length;
    const failed = total - accessible;
    
    return { total, accessible, failed };
  }

  /**
   * 清空缓存
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * 导出检测结果为JSON
   */
  exportResults(): CheckResult[] {
    return Array.from(this.cache.values());
  }

  /**
   * 生成可访问性报告
   */
  generateReport(results: CheckResult[]): string {
    const accessible = results.filter(r => r.accessible);
    const failed = results.filter(r => !r.accessible);
    
    let report = `=== 网站可访问性检测报告 ===\n`;
    report += `检测时间: ${new Date().toLocaleString()}\n`;
    report += `总计: ${results.length} 个网站\n`;
    report += `可访问: ${accessible.length} 个 (${((accessible.length / results.length) * 100).toFixed(1)}%)\n`;
    report += `不可访问: ${failed.length} 个 (${((failed.length / results.length) * 100).toFixed(1)}%)\n\n`;
    
    if (accessible.length > 0) {
      report += `=== 可访问的网站 ===\n`;
      accessible.forEach(r => {
        report += `✅ ${r.url} (${r.responseTime}ms)\n`;
      });
      report += `\n`;
    }
    
    if (failed.length > 0) {
      report += `=== 不可访问的网站 ===\n`;
      failed.forEach(r => {
        report += `❌ ${r.url} - ${r.error || '未知错误'}\n`;
      });
    }
    
    return report;
  }
}

// 导出单例
export const websiteChecker = new WebsiteChecker();

// 默认导出类
export default WebsiteChecker; 
