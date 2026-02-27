/**
 * @file service/uied/websitePreviewSnapshot.js
 * @description 网站预览截图服务（优先本地上传，其次 Playwright 本地截图，最后 mShots 兜底）
 * @author UIED技术团队
 * @copyright Tomda (https://www.tomda.top)
 * @copyright UIED技术团队 (https://fsuied.com)
 * @createDate 2026-02-26
 */

'use strict';

const Service = require('egg').Service;
const fs = require('fs');
const path = require('path');

class WebsitePreviewSnapshotService extends Service {
  /**
   * 读取详情页截图配置（Playwright 开关/超时/TTL 等）
   * @returns {Promise<object>} 规范化配置
   */
  async getPreviewConfig() {
    const rawConfig = await this.ctx.service.uied.setting.getSettingByKey('detailPageConfig');
    const timeoutMs = this.normalizeTimeout(rawConfig?.previewSnapshotTimeoutMs);
    const cacheTtlSeconds = this.normalizeCacheTtl(rawConfig?.previewSnapshotCacheTtlSeconds);
    return {
      enabled: rawConfig?.previewSnapshotEnabled !== false,
      timeoutMs,
      cacheTtlSeconds,
      allowMshotsFallback: rawConfig?.previewSnapshotAllowFallbackMshots !== false,
    };
  }

  /**
   * 本地截图缓存目录（映射到前端可访问的 /uploads 路径）
   * @returns {string} 截图缓存目录绝对路径
   */
  getSnapshotDirAbsolutePath() {
    return path.join(this.app.baseDir, 'app/public/uploads/website-preview-cache');
  }

  /**
   * 构建本地截图缓存文件名
   * @param {number|string} websiteId 网站ID
   * @returns {string} 文件名
   */
  buildSnapshotFileName(websiteId) {
    return `website_${websiteId}.png`;
  }

  /**
   * 构建前端可访问的截图路径
   * @param {number|string} websiteId 网站ID
   * @returns {string} 公共访问路径
   */
  buildSnapshotPublicPath(websiteId) {
    return `/uploads/website-preview-cache/${this.buildSnapshotFileName(websiteId)}`;
  }

  /**
   * 规范化网址（兼容未填写协议）
   * @param {string} rawUrl 原始网址
   * @returns {string} 标准化后的网址
   */
  normalizeUrl(rawUrl) {
    const value = String(rawUrl || '').trim();
    if (!value) throw new Error('网址为空，无法截图');
    if (/^https?:\/\//i.test(value)) return value;
    return `https://${value}`;
  }

  /**
   * 构建 mShots 兜底截图地址（作为 Playwright 未安装/失败时的兜底方案）
   * @param {string} rawUrl 原始网址
   * @returns {string} mShots 截图 URL
   */
  buildMshotsUrl(rawUrl) {
    const normalized = this.normalizeUrl(rawUrl);
    return `https://s0.wp.com/mshots/v1/${encodeURIComponent(normalized)}?w=1280`;
  }

  /**
   * 构建 thum.io 兜底截图地址（用于 mShots 失败时的二级兜底）
   * @param {string} rawUrl 原始网址
   * @returns {string} thum.io 截图 URL
   */
  buildThumIoUrl(rawUrl) {
    const normalized = this.normalizeUrl(rawUrl);
    return `https://image.thum.io/get/width/1280/noanimate/${normalized}`;
  }

  /**
   * 确保截图缓存目录存在
   */
  async ensureSnapshotDir() {
    await fs.promises.mkdir(this.getSnapshotDirAbsolutePath(), { recursive: true });
  }

  /**
   * 判断本地截图缓存文件是否存在
   * @param {number|string} websiteId 网站ID
   * @returns {Promise<boolean>} 是否存在
   */
  async snapshotFileExists(websiteId) {
    const target = path.join(this.getSnapshotDirAbsolutePath(), this.buildSnapshotFileName(websiteId));
    try {
      await fs.promises.access(target, fs.constants.F_OK);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * 判断本地截图缓存是否可用（结合 TTL）
   * @param {number|string} websiteId 网站ID
   * @param {number} cacheTtlSeconds 缓存秒数
   * @returns {Promise<boolean>} 是否命中可用缓存
   */
  async isSnapshotCacheUsable(websiteId, cacheTtlSeconds) {
    const target = path.join(this.getSnapshotDirAbsolutePath(), this.buildSnapshotFileName(websiteId));
    try {
      const stats = await fs.promises.stat(target);
      if (!stats?.isFile()) return false;
      if (!Number.isFinite(cacheTtlSeconds) || cacheTtlSeconds <= 0) return true;
      const ageSeconds = Math.floor((Date.now() - stats.mtimeMs) / 1000);
      return ageSeconds < cacheTtlSeconds;
    } catch (error) {
      return false;
    }
  }

  /**
   * 获取网站预览图（优先本地上传/后台截图，其次本地 Playwright 缓存，最后 mShots）
   * @param {number|string} websiteId 网站ID
   * @param {{ forceRefresh?: boolean, timeoutMs?: number }} options 选项
   * @returns {Promise<object>} 预览图结果
   */
  async getPreviewSnapshotByWebsiteId(websiteId, options = {}) {
    const previewConfig = await this.getPreviewConfig();
    const website = await this.ctx.service.uied.website.detail(websiteId, null);
    if (!website || !website.url) {
      const error = new Error('网站不存在或未配置网址');
      error.status = 404;
      throw error;
    }

    if (website.thumbnail) {
      return {
        ok: true,
        source: 'uploaded_thumbnail',
        url: website.thumbnail,
        localGenerated: false,
        fallback: false,
      };
    }

    const screenshotList = Array.isArray(website.screenshots)
      ? website.screenshots.filter(Boolean)
      : (website.screenshots ? [ website.screenshots ] : []);
    if (screenshotList.length > 0) {
      return {
        ok: true,
        source: 'uploaded_screenshot',
        url: String(screenshotList[0]),
        localGenerated: false,
        fallback: false,
      };
    }

    const forceRefresh = options.forceRefresh === true;
    if (!forceRefresh && await this.isSnapshotCacheUsable(website.id, previewConfig.cacheTtlSeconds)) {
      return {
        ok: true,
        source: 'playwright_cache',
        url: this.buildSnapshotPublicPath(website.id),
        localGenerated: true,
        fallback: false,
        cacheHit: true,
      };
    }

    if (previewConfig.enabled !== false) {
      const captureResult = await this.captureWithPlaywright(website.id, website.url, {
        timeoutMs: this.normalizeTimeout(options.timeoutMs || previewConfig.timeoutMs),
      });
      if (captureResult.ok) {
        return {
          ok: true,
          source: 'playwright_cache',
          url: this.buildSnapshotPublicPath(website.id),
          localGenerated: true,
          fallback: false,
          cacheHit: false,
        };
      }

      if (previewConfig.allowMshotsFallback === false) {
        return {
          ok: false,
          source: 'playwright_disabled_fallback',
          localGenerated: false,
          fallback: false,
          reason: captureResult.reason || 'Playwright 截图失败且已关闭 mShots 兜底',
          reasonCode: captureResult.reasonCode || 'playwright_capture_failed',
        };
      }
      return {
        ok: false,
        source: 'mshots_fallback',
        url: this.buildMshotsUrl(website.url),
        fallbackUrls: [ this.buildThumIoUrl(website.url) ],
        localGenerated: false,
        fallback: true,
        reason: captureResult.reason || 'Playwright 截图不可用',
        reasonCode: captureResult.reasonCode || 'capture_failed',
      };
    }

    if (previewConfig.allowMshotsFallback === false) {
      return {
        ok: false,
        source: 'preview_snapshot_disabled',
        localGenerated: false,
        fallback: false,
        reason: '后台已关闭自动截图与 mShots 兜底',
        reasonCode: 'preview_snapshot_disabled',
      };
    }

    return {
      ok: false,
      source: 'mshots_fallback',
      url: this.buildMshotsUrl(website.url),
      fallbackUrls: [ this.buildThumIoUrl(website.url) ],
      localGenerated: false,
      fallback: true,
      reason: 'Playwright 自动截图已关闭，使用 mShots 兜底',
      reasonCode: 'preview_snapshot_disabled_with_mshots_fallback',
    };
  }

  /**
   * 规范化截图超时（限制范围，避免阻塞 worker）
   * @param {unknown} timeoutMs 超时时间
   * @returns {number} 规范化后的毫秒值
   */
  normalizeTimeout(timeoutMs) {
    const parsed = Number.parseInt(String(timeoutMs || ''), 10);
    if (!Number.isFinite(parsed)) return 12000;
    return Math.max(3000, Math.min(30000, parsed));
  }

  /**
   * 规范化截图缓存 TTL（秒）
   * @param {unknown} cacheTtlSeconds 缓存秒数
   * @returns {number} 规范化后的缓存秒数
   */
  normalizeCacheTtl(cacheTtlSeconds) {
    const parsed = Number.parseInt(String(cacheTtlSeconds || ''), 10);
    if (!Number.isFinite(parsed)) return 21600;
    return Math.max(60, Math.min(7 * 24 * 3600, parsed));
  }

  /**
   * 使用 Playwright 生成本地截图缓存（未安装时静默降级）
   * @param {number|string} websiteId 网站ID
   * @param {string} rawUrl 原始网址
   * @param {{ timeoutMs: number }} options 截图选项
   * @returns {Promise<{ok: boolean, reason?: string, reasonCode?: string}>} 截图结果
   */
  async captureWithPlaywright(websiteId, rawUrl, options) {
    let browser = null;
    try {
      const normalizedUrl = this.normalizeUrl(rawUrl);
      const playwright = this.loadPlaywright();
      if (!playwright) {
        return {
          ok: false,
          reason: '未安装 playwright 依赖',
          reasonCode: 'playwright_not_installed',
        };
      }

      await this.ensureSnapshotDir();
      const targetPath = path.join(this.getSnapshotDirAbsolutePath(), this.buildSnapshotFileName(websiteId));

      browser = await this.launchPlaywrightBrowser(playwright);
      const page = await browser.newPage({
        viewport: { width: 1440, height: 900 },
      });

      await page.goto(normalizedUrl, {
        waitUntil: 'domcontentloaded',
        timeout: options.timeoutMs,
      });
      await page.screenshot({
        path: targetPath,
        type: 'png',
        fullPage: false,
      });

      return { ok: true };
    } catch (error) {
      this.ctx.logger.warn('[websitePreviewSnapshot] Playwright 截图失败，降级 mShots:', error.message);
      return {
        ok: false,
        reason: error.message || 'Playwright 截图失败',
        reasonCode: 'playwright_capture_failed',
      };
    } finally {
      if (browser) {
        try {
          await browser.close();
        } catch (closeError) {
          // 忽略关闭异常
        }
      }
    }
  }

  /**
   * 启动 Playwright 浏览器
   * 优先使用 Playwright 默认浏览器；若未安装则回退到本机 Chrome/Chromium（Mac）
   * @param {any} playwright Playwright 模块
   * @returns {Promise<any>} 浏览器实例
   */
  async launchPlaywrightBrowser(playwright) {
    const baseOptions = {
      headless: true,
      args: [ '--no-sandbox', '--disable-dev-shm-usage' ],
    };

    try {
      return await playwright.chromium.launch(baseOptions);
    } catch (error) {
      const message = String(error?.message || '');
      const mayBeMissingBrowser = /Executable doesn't exist|Please run the following command|browserType\.launch/i.test(message);
      if (!mayBeMissingBrowser) throw error;

      const executablePath = this.findSystemChromiumExecutable();
      if (!executablePath) throw error;

      this.ctx.logger.warn(`[websitePreviewSnapshot] Playwright 默认浏览器未安装，改用系统浏览器: ${executablePath}`);
      return playwright.chromium.launch({
        ...baseOptions,
        executablePath,
      });
    }
  }

  /**
   * 查找本机系统浏览器可执行文件（Mac）
   * @returns {string} 可执行文件路径，找不到返回空字符串
   */
  findSystemChromiumExecutable() {
    const candidates = [
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Chromium.app/Contents/MacOS/Chromium',
      '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
      '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
    ];
    for (const candidate of candidates) {
      try {
        if (fs.existsSync(candidate)) return candidate;
      } catch (error) {
        // 忽略单个路径探测异常
      }
    }
    return '';
  }

  /**
   * 动态加载 Playwright（未安装时返回 null，避免服务启动报错）
   * @returns {any|null} Playwright 模块
   */
  loadPlaywright() {
    try {
      // eslint-disable-next-line global-require
      return require('playwright');
    } catch (error) {
      return null;
    }
  }
}

module.exports = WebsitePreviewSnapshotService;
