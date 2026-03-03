/**
 * @file service/uied/websiteHealthProbe.js
 * @description 网站健康探测服务（本地探测：响应时间/状态码/SSL）
 * @author UIED技术团队
 * @copyright Tomda (https://www.tomda.top)
 * @copyright UIED技术团队 (https://fsuied.com)
 * @createDate 2026-02-25
 */

'use strict';

const Service = require('egg').Service;
const http = require('http');
const https = require('https');
const tls = require('tls');
const dns = require('dns').promises;

class WebsiteHealthProbeService extends Service {
  /**
   * 健康探测缓存 TTL（秒）
   * 说明：避免详情页频繁刷新时反复实时探测外站。
   * @return {number} 缓存时长
   */
  getCacheTtlSeconds() {
    return 300;
  }

  /**
   * 构建健康探测缓存键
   * @param {number|string} websiteId 网站ID
   * @param {number} timeoutMs 探测超时
   * @return {string} Redis 缓存键
   */
  buildCacheKey(websiteId, timeoutMs) {
    return `uied:website-health:${websiteId}:${timeoutMs}`;
  }

  /**
   * 读取健康探测缓存（失败时静默降级）
   * @param {string} cacheKey Redis 缓存键
   * @return {Promise<object|null>} 缓存内容
   */
  async getCachedProbe(cacheKey) {
    try {
      const cached = await this.ctx.service.redis.get(cacheKey);
      if (!cached || typeof cached !== 'object') return null;
      return cached;
    } catch (error) {
      this.ctx.logger.warn('[websiteHealthProbe] 读取缓存失败，降级实时探测:', error.message);
      return null;
    }
  }

  /**
   * 写入健康探测缓存（失败时静默降级）
   * @param {string} cacheKey Redis 缓存键
   * @param {object} payload 探测结果
   */
  async setCachedProbe(cacheKey, payload) {
    try {
      await this.ctx.service.redis.set(cacheKey, payload, this.getCacheTtlSeconds());
    } catch (error) {
      this.ctx.logger.warn('[websiteHealthProbe] 写入缓存失败，忽略:', error.message);
    }
  }

  /**
   * 根据网站 ID 探测健康状态（仅探测库内网址，避免开放任意 URL 探测）
   * @param {number|string} websiteId 网站ID
   * @param {{ timeoutMs?: number, forceRefresh?: boolean }} options 探测选项
   * @return {Promise<object>} 健康探测结果
   */
  async probeByWebsiteId(websiteId, options = {}) {
    const detail = await this.ctx.service.uied.website.detail(websiteId, null);
    if (!detail || !detail.url) {
      const error = new Error('网站不存在或未配置网址');
      error.status = 404;
      throw error;
    }
    const timeoutMs = this.normalizeTimeout(options.timeoutMs);
    const cacheKey = this.buildCacheKey(detail.id, timeoutMs);
    if (options.forceRefresh !== true) {
      const cached = await this.getCachedProbe(cacheKey);
      if (cached) {
        return {
          ...cached,
          cache: {
            hit: true,
            ttlSeconds: this.getCacheTtlSeconds(),
          },
        };
      }
    }
    const result = await this.probeByUrl(detail.url, {
      ...options,
      timeoutMs,
      websiteId: String(detail.id),
      websiteName: detail.name,
    });
    const payload = {
      ...result,
      cache: {
        hit: false,
        ttlSeconds: this.getCacheTtlSeconds(),
      },
    };
    await this.setCachedProbe(cacheKey, payload);
    return payload;
  }

  /**
   * 探测指定网址（HTTP/HTTPS 状态、响应时间、SSL、DNS）
   * @param {string} rawUrl 原始网址
   * @param {{ timeoutMs?: number, websiteId?: string, websiteName?: string }} options 探测选项
   * @return {Promise<object>} 健康探测结果
   */
  async probeByUrl(rawUrl, options = {}) {
    const timeoutMs = this.normalizeTimeout(options.timeoutMs);
    const normalizedUrl = this.normalizeUrl(rawUrl);
    const urlObj = new URL(normalizedUrl);
    const [ dnsInfo, httpInfo, sslInfo ] = await Promise.all([
      this.resolveDnsInfo(urlObj.hostname),
      this.probeHttp(urlObj, timeoutMs),
      urlObj.protocol === 'https:'
        ? this.probeSsl(urlObj, timeoutMs)
        : Promise.resolve(this.buildEmptySslInfo()),
    ]);

    const summary = this.buildSummary(httpInfo, sslInfo);

    return {
      websiteId: options.websiteId || null,
      websiteName: options.websiteName || null,
      url: normalizedUrl,
      host: urlObj.hostname,
      protocol: urlObj.protocol.replace(':', ''),
      port: Number(urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80)),
      checkedAt: new Date().toISOString(),
      timeoutMs,
      dns: dnsInfo,
      http: httpInfo,
      ssl: sslInfo,
      summary,
    };
  }

  /**
   * 标准化探测超时时间，限制最大值避免阻塞
   * @param {unknown} timeoutMs 超时时间（毫秒）
   * @return {number} 规范化超时时间
   */
  normalizeTimeout(timeoutMs) {
    const parsed = Number.parseInt(String(timeoutMs || ''), 10);
    if (!Number.isFinite(parsed)) return 6000;
    return Math.max(1000, Math.min(15000, parsed));
  }

  /**
   * 标准化网址（兼容未填写协议的情况）
   * @param {string} rawUrl 原始网址
   * @return {string} 可被 URL 构造器解析的网址
   */
  normalizeUrl(rawUrl) {
    const value = String(rawUrl || '').trim();
    if (!value) throw new Error('网址为空，无法探测');
    if (/^https?:\/\//i.test(value)) return value;
    return `https://${value}`;
  }

  /**
   * 解析域名 DNS 信息（仅作为展示辅助，不影响主探测结果）
   * @param {string} hostname 域名
   * @return {Promise<object>} DNS 解析信息
   */
  async resolveDnsInfo(hostname) {
    try {
      const records = await dns.lookup(hostname, { all: true });
      const uniqueAddresses = Array.from(new Set((records || []).map(item => String(item.address || ''))))
        .filter(Boolean)
        .slice(0, 4);
      return {
        ok: true,
        addresses: uniqueAddresses,
      };
    } catch (error) {
      return {
        ok: false,
        addresses: [],
        errorCode: error.code || '',
        errorMessage: error.message || 'DNS 解析失败',
      };
    }
  }

  /**
   * 执行 HTTP 探测（优先 HEAD，失败时降级 GET）
   * @param {URL} urlObj 目标 URL 对象
   * @param {number} timeoutMs 超时时间（毫秒）
   * @return {Promise<object>} HTTP 探测信息
   */
  async probeHttp(urlObj, timeoutMs) {
    const headResult = await this.probeHttpOnce(urlObj, 'HEAD', timeoutMs);
    if (!headResult.ok && headResult.errorCode) {
      return await this.probeHttpOnce(urlObj, 'GET', timeoutMs);
    }
    if ([ 405, 501 ].includes(Number(headResult.statusCode || 0))) {
      return await this.probeHttpOnce(urlObj, 'GET', timeoutMs);
    }
    return headResult;
  }

  /**
   * 执行一次 HTTP/HTTPS 探测
   * @param {URL} urlObj 目标 URL 对象
   * @param {'HEAD'|'GET'} method 请求方法
   * @param {number} timeoutMs 超时时间（毫秒）
   * @return {Promise<object>} 探测结果
   */
  probeHttpOnce(urlObj, method, timeoutMs) {
    return new Promise(resolve => {
      const isHttps = urlObj.protocol === 'https:';
      const client = isHttps ? https : http;
      const startedAt = Date.now();
      let settled = false;

      /**
       * 安全结束本次探测并返回结果（防止重复 resolve）
       * @param {object} payload 返回数据
       */
      const finish = payload => {
        if (settled) return;
        settled = true;
        resolve(payload);
      };

      const req = client.request({
        protocol: urlObj.protocol,
        hostname: urlObj.hostname,
        port: urlObj.port || (isHttps ? 443 : 80),
        path: `${urlObj.pathname || '/'}${urlObj.search || ''}`,
        method,
        timeout: timeoutMs,
        rejectUnauthorized: true,
        headers: {
          'User-Agent': 'UIED-HealthProbe/1.0',
          Accept: '*/*',
          'Cache-Control': 'no-cache',
        },
      }, res => {
        const responseTimeMs = Date.now() - startedAt;
        const statusCode = Number(res.statusCode || 0);
        const locationHeader = String(res.headers.location || '');
        res.resume();
        res.once('end', () => {
          finish({
            ok: statusCode > 0 && statusCode < 500,
            reachable: statusCode > 0,
            method,
            statusCode,
            responseTimeMs,
            redirectLocation: locationHeader || '',
          });
        });
      });

      req.on('timeout', () => {
        req.destroy(new Error('HTTP 探测超时'));
      });

      req.on('error', error => {
        finish({
          ok: false,
          reachable: false,
          method,
          statusCode: 0,
          responseTimeMs: Date.now() - startedAt,
          errorCode: error.code || '',
          errorMessage: error.message || '请求失败',
          redirectLocation: '',
        });
      });

      req.end();
    });
  }

  /**
   * 探测 HTTPS 证书信息（有效期、签发者、剩余天数）
   * @param {URL} urlObj 目标 URL 对象
   * @param {number} timeoutMs 超时时间（毫秒）
   * @return {Promise<object>} SSL 探测结果
   */
  probeSsl(urlObj, timeoutMs) {
    return new Promise(resolve => {
      const port = Number(urlObj.port || 443);
      let settled = false;

      /**
       * 安全结束 SSL 探测
       * @param {object} payload 返回数据
       */
      const finish = payload => {
        if (settled) return;
        settled = true;
        resolve(payload);
      };

      const socket = tls.connect({
        host: urlObj.hostname,
        port,
        servername: urlObj.hostname,
        rejectUnauthorized: false,
      }, () => {
        try {
          const cert = socket.getPeerCertificate(true) || {};
          const validFrom = cert.valid_from ? new Date(cert.valid_from).toISOString() : '';
          const validTo = cert.valid_to ? new Date(cert.valid_to).toISOString() : '';
          const validToMs = validTo ? Date.parse(validTo) : NaN;
          const daysRemaining = Number.isFinite(validToMs)
            ? Math.floor((validToMs - Date.now()) / (24 * 60 * 60 * 1000))
            : null;
          finish({
            enabled: true,
            ok: socket.authorized || !socket.authorizationError,
            validNow: daysRemaining === null ? null : daysRemaining >= 0,
            validFrom,
            validTo,
            daysRemaining,
            authorizationError: socket.authorizationError || '',
            issuer: cert.issuer ? (cert.issuer.O || cert.issuer.CN || '') : '',
            subjectCN: cert.subject ? (cert.subject.CN || '') : '',
          });
        } catch (error) {
          finish({
            enabled: true,
            ok: false,
            validNow: null,
            validFrom: '',
            validTo: '',
            daysRemaining: null,
            authorizationError: '',
            issuer: '',
            subjectCN: '',
            errorCode: error.code || '',
            errorMessage: error.message || 'SSL 探测失败',
          });
        } finally {
          socket.end();
        }
      });

      socket.setTimeout(timeoutMs, () => {
        socket.destroy(new Error('SSL 探测超时'));
      });

      socket.on('error', error => {
        finish({
          enabled: true,
          ok: false,
          validNow: null,
          validFrom: '',
          validTo: '',
          daysRemaining: null,
          authorizationError: '',
          issuer: '',
          subjectCN: '',
          errorCode: error.code || '',
          errorMessage: error.message || 'SSL 连接失败',
        });
      });
    });
  }

  /**
   * 构建空 SSL 信息（非 HTTPS 网址使用）
   * @return {object} 空 SSL 结构
   */
  buildEmptySslInfo() {
    return {
      enabled: false,
      ok: null,
      validNow: null,
      validFrom: '',
      validTo: '',
      daysRemaining: null,
      authorizationError: '',
      issuer: '',
      subjectCN: '',
    };
  }

  /**
   * 生成健康状态摘要（用于前端快速展示）
   * @param {object} httpInfo HTTP 探测结果
   * @param {object} sslInfo SSL 探测结果
   * @return {object} 摘要信息
   */
  buildSummary(httpInfo, sslInfo) {
    const statusCode = Number(httpInfo?.statusCode || 0);
    const responseTimeMs = Number(httpInfo?.responseTimeMs || 0);
    const sslDays = Number.isFinite(Number(sslInfo?.daysRemaining)) ? Number(sslInfo.daysRemaining) : null;

    if (!httpInfo?.reachable) {
      return {
        ok: false,
        level: 'error',
        text: httpInfo?.errorMessage || '无法访问',
      };
    }

    if (statusCode >= 500) {
      return {
        ok: false,
        level: 'error',
        text: `站点异常（HTTP ${statusCode}）`,
      };
    }

    if (sslInfo?.enabled && sslDays !== null && sslDays < 7) {
      return {
        ok: true,
        level: 'warning',
        text: `证书即将到期（剩余 ${sslDays} 天）`,
      };
    }

    if (responseTimeMs > 3000) {
      return {
        ok: true,
        level: 'warning',
        text: `响应较慢（${responseTimeMs}ms）`,
      };
    }

    return {
      ok: true,
      level: 'healthy',
      text: '站点状态正常',
    };
  }
}

module.exports = WebsiteHealthProbeService;
