/**
 * @file service/uied/licenseCenter.js
 * @description 商业版许可证与功能能力服务
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

'use strict';

const Service = require('egg').Service;
const crypto = require('crypto');

const LICENSE_INFO_KEY = 'license_center_info';
const FEATURE_OVERRIDE_KEY = 'license_feature_overrides';
const COMMERCIAL_MODE_KEY = 'commercial_mode_config';
const LICENSE_SIGN_VERSION = 'v1';

class LicenseCenterService extends Service {
  /**
   * 获取功能矩阵定义（Free / Pro / Enterprise）
   */
  getFeatureMatrix() {
    return {
      free: [
        'website_management',
        'category_management',
        'page_management',
        'basic_search',
        'import_export',
        'favicon_fetch',
        'basic_seo',
        'submission',
        'article_basic',
        'article_meta',
        'theme_basic',
      ],
      pro: [
        'advanced_search',
        'no_ads',
        'comments',
        'user_center',
        'article_advanced',
        'wordpress_channel',
        'ai_assistant',
        'operations_blocks',
        'white_label_basic',
      ],
      enterprise: [
        'data_statistics',
        'monitoring',
        'api_access',
        'multi_user',
        'advanced_seo',
        'white_label_full',
        'ai_data_analysis',
        'priority_support',
      ],
    };
  }

  /**
   * 获取功能清单定义（用于前端渲染）
   */
  getFeatureCatalog() {
    return [
      { key: 'website_management', name: '网站管理', group: 'core', minEdition: 'free' },
      { key: 'category_management', name: '分类管理', group: 'core', minEdition: 'free' },
      { key: 'page_management', name: '页面管理', group: 'core', minEdition: 'free' },
      { key: 'basic_search', name: '基础搜索', group: 'core', minEdition: 'free' },
      { key: 'import_export', name: '导入导出', group: 'core', minEdition: 'free' },
      { key: 'favicon_fetch', name: '图标抓取', group: 'core', minEdition: 'free' },
      { key: 'basic_seo', name: '基础 SEO', group: 'seo', minEdition: 'free' },
      { key: 'submission', name: '网站投稿', group: 'content', minEdition: 'free' },
      { key: 'article_basic', name: '文章基础', group: 'content', minEdition: 'free' },
      { key: 'article_meta', name: '文章分类标签', group: 'content', minEdition: 'free' },
      { key: 'theme_basic', name: '基础主题配置', group: 'theme', minEdition: 'free' },
      { key: 'advanced_search', name: '高级搜索', group: 'core', minEdition: 'pro' },
      { key: 'no_ads', name: '去广告', group: 'theme', minEdition: 'pro' },
      { key: 'comments', name: '评论系统', group: 'content', minEdition: 'pro' },
      { key: 'user_center', name: '用户中心', group: 'user', minEdition: 'pro' },
      { key: 'article_advanced', name: '文章高级能力', group: 'content', minEdition: 'pro' },
      { key: 'wordpress_channel', name: 'WordPress 频道', group: 'content', minEdition: 'pro' },
      { key: 'ai_assistant', name: 'AI 助手', group: 'ai', minEdition: 'pro' },
      { key: 'operations_blocks', name: '运营位配置', group: 'ops', minEdition: 'pro' },
      { key: 'white_label_basic', name: '基础白标', group: 'theme', minEdition: 'pro' },
      { key: 'data_statistics', name: '数据统计', group: 'stats', minEdition: 'enterprise' },
      { key: 'monitoring', name: '可用性监控', group: 'stats', minEdition: 'enterprise' },
      { key: 'api_access', name: '开放 API', group: 'integration', minEdition: 'enterprise' },
      { key: 'multi_user', name: '多用户协作', group: 'user', minEdition: 'enterprise' },
      { key: 'advanced_seo', name: '高级 SEO', group: 'seo', minEdition: 'enterprise' },
      { key: 'white_label_full', name: '完整白标', group: 'theme', minEdition: 'enterprise' },
      { key: 'ai_data_analysis', name: 'AI 数据分析', group: 'ai', minEdition: 'enterprise' },
      { key: 'priority_support', name: '优先支持', group: 'service', minEdition: 'enterprise' },
    ];
  }

  /**
   * 将版本标识标准化为 free / pro / enterprise
   */
  normalizeEdition(edition) {
    const text = String(edition || '').trim().toLowerCase();
    if ([ 'enterprise', 'ent', 'business' ].includes(text)) return 'enterprise';
    if ([ 'pro', 'professional', 'personal' ].includes(text)) return 'pro';
    return 'free';
  }

  /**
   * 解析布尔值
   */
  parseBoolean(value, fallback = false) {
    if (value === undefined || value === null || value === '') return fallback;
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value === 1;
    const text = String(value).trim().toLowerCase();
    if ([ '1', 'true', 'yes', 'y', 'on' ].includes(text)) return true;
    if ([ '0', 'false', 'no', 'n', 'off' ].includes(text)) return false;
    return fallback;
  }

  /**
   * 规范化商业版模式配置
   */
  normalizeCommercialMode(payload = {}) {
    const source = payload && typeof payload === 'object' ? payload : {};
    return {
      strictLegacyRoutes: this.parseBoolean(source.strictLegacyRoutes, false),
      enforceLicenseSignature: this.parseBoolean(source.enforceLicenseSignature, false),
      updatedAt: Number(source.updatedAt || 0) || Math.floor(Date.now() / 1000),
    };
  }

  /**
   * 获取商业版模式配置
   */
  async getCommercialMode() {
    const { ctx } = this;
    const raw = await ctx.service.uied.setting.get(COMMERCIAL_MODE_KEY);
    return this.normalizeCommercialMode(raw || {});
  }

  /**
   * 保存商业版模式配置
   */
  async saveCommercialMode(payload = {}) {
    const next = this.normalizeCommercialMode(payload);
    next.updatedAt = Math.floor(Date.now() / 1000);
    await this.ctx.service.uied.setting.save({ [COMMERCIAL_MODE_KEY]: next });
    return this.getCommercialMode();
  }

  /**
   * 获取许可证签名密钥（优先环境变量）
   */
  getLicenseSignSecret() {
    const appConfig = this.app.config || {};
    const envSecret = String(process.env.UIED_LICENSE_SIGN_SECRET || '').trim();
    if (envSecret) return envSecret;
    const cfgSecret = String(appConfig.uiedLicenseSignSecret || '').trim();
    if (cfgSecret) return cfgSecret;
    const firstKey = String(appConfig.keys || '').split(',')[0].trim();
    if (firstKey) return firstKey;
    return 'uied-license-secret-change-me';
  }

  /**
   * 构建许可证签名载荷（固定字段顺序，避免签名漂移）
   */
  buildLicenseSignPayload(payload = {}) {
    const source = payload && typeof payload === 'object' ? payload : {};
    return {
      edition: this.normalizeEdition(source.edition || 'free'),
      status: String(source.status || 'active').trim().toLowerCase() || 'active',
      licenseKey: String(source.licenseKey || '').trim(),
      customerName: String(source.customerName || '').trim(),
      companyName: String(source.companyName || '').trim(),
      contactEmail: String(source.contactEmail || '').trim(),
      domainLimit: Math.max(1, Number.parseInt(String(source.domainLimit || 1), 10) || 1),
      domainWhitelist: Array.isArray(source.domainWhitelist)
        ? source.domainWhitelist.map(item => String(item || '').trim()).filter(Boolean).sort()
        : [],
      issuedAt: Number(source.issuedAt || 0) || 0,
      expiresAt: Number(source.expiresAt || 0) || 0,
      note: String(source.note || '').trim(),
      signVersion: String(source.signVersion || LICENSE_SIGN_VERSION),
    };
  }

  /**
   * 计算许可证签名
   */
  signLicensePayload(payload = {}) {
    const secret = this.getLicenseSignSecret();
    const content = JSON.stringify(this.buildLicenseSignPayload(payload));
    return crypto.createHmac('sha256', secret).update(content).digest('hex');
  }

  /**
   * 校验许可证签名
   */
  verifyLicenseSignature(payload = {}) {
    const signature = String(payload.signature || '').trim().toLowerCase();
    if (!signature) return false;
    const expected = String(this.signLicensePayload(payload) || '').trim().toLowerCase();
    if (!expected || signature.length !== expected.length) return false;
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  }

  /**
   * 获取许可证信息（带有效性判定）
   */
  async getLicenseInfo() {
    const { ctx } = this;
    const raw = await ctx.service.uied.setting.get(LICENSE_INFO_KEY);
    const mode = await this.getCommercialMode();
    const now = Math.floor(Date.now() / 1000);
    const defaults = {
      edition: 'free',
      status: 'active',
      licenseKey: '',
      customerName: '',
      companyName: '',
      contactEmail: '',
      domainLimit: 1,
      domainWhitelist: [],
      issuedAt: 0,
      expiresAt: 0,
      note: '',
      signVersion: LICENSE_SIGN_VERSION,
      signature: '',
      updatedAt: now,
    };
    const source = raw && typeof raw === 'object' ? raw : {};
    const normalized = {
      ...defaults,
      ...source,
      edition: this.normalizeEdition(source.edition),
      status: String(source.status || defaults.status).trim().toLowerCase() || 'active',
      domainLimit: Math.max(1, Number.parseInt(String(source.domainLimit || defaults.domainLimit), 10) || 1),
      domainWhitelist: Array.isArray(source.domainWhitelist)
        ? source.domainWhitelist.map(item => String(item || '').trim()).filter(Boolean)
        : [],
      issuedAt: Number(source.issuedAt || 0) || 0,
      expiresAt: Number(source.expiresAt || 0) || 0,
      signVersion: String(source.signVersion || defaults.signVersion),
      signature: String(source.signature || defaults.signature).trim().toLowerCase(),
      updatedAt: Number(source.updatedAt || 0) || now,
    };
    const rawStatus = normalized.status;
    const signatureRequired = mode.enforceLicenseSignature === true;
    const isSignatureValid = this.verifyLicenseSignature(normalized);
    const signatureBlocked = signatureRequired && !isSignatureValid;
    const isExpired = normalized.expiresAt > 0 && normalized.expiresAt < now;
    const isActive = rawStatus === 'active' && !isExpired && !signatureBlocked;
    const effectiveEdition = isActive ? normalized.edition : 'free';
    const status = signatureBlocked ? 'invalid_signature' : rawStatus;
    return {
      ...normalized,
      rawStatus,
      status,
      isExpired,
      isActive,
      effectiveEdition,
      isSignatureValid,
      signatureRequired,
      now,
    };
  }

  /**
   * 保存许可证信息
   */
  async saveLicenseInfo(payload = {}) {
    const now = Math.floor(Date.now() / 1000);
    const source = payload && typeof payload === 'object' ? payload : {};
    const next = {
      edition: this.normalizeEdition(source.edition),
      status: String(source.status || 'active').trim().toLowerCase() || 'active',
      licenseKey: String(source.licenseKey || '').trim(),
      customerName: String(source.customerName || '').trim(),
      companyName: String(source.companyName || '').trim(),
      contactEmail: String(source.contactEmail || '').trim(),
      domainLimit: Math.max(1, Number.parseInt(String(source.domainLimit || 1), 10) || 1),
      domainWhitelist: Array.isArray(source.domainWhitelist)
        ? source.domainWhitelist.map(item => String(item || '').trim()).filter(Boolean)
        : [],
      issuedAt: Number(source.issuedAt || 0) || 0,
      expiresAt: Number(source.expiresAt || 0) || 0,
      note: String(source.note || '').trim(),
      signVersion: LICENSE_SIGN_VERSION,
      updatedAt: now,
    };
    next.signature = this.signLicensePayload(next);
    await this.ctx.service.uied.setting.save({ [LICENSE_INFO_KEY]: next });
    return this.getLicenseInfo();
  }

  /**
   * 获取功能开关覆盖配置
   */
  async getFeatureOverrides() {
    const { ctx } = this;
    const raw = await ctx.service.uied.setting.get(FEATURE_OVERRIDE_KEY);
    if (!raw || typeof raw !== 'object') return {};
    const result = {};
    Object.keys(raw).forEach(key => {
      result[String(key)] = this.parseBoolean(raw[key], false);
    });
    return result;
  }

  /**
   * 保存功能开关覆盖配置
   */
  async saveFeatureOverrides(payload = {}) {
    const source = payload && typeof payload === 'object' ? payload : {};
    const next = {};
    Object.keys(source).forEach(key => {
      const featureKey = String(key || '').trim();
      if (!featureKey) return;
      next[featureKey] = this.parseBoolean(source[key], false);
    });
    await this.ctx.service.uied.setting.save({ [FEATURE_OVERRIDE_KEY]: next });
    return next;
  }

  /**
   * 计算当前生效的功能键集合
   */
  async resolveEffectiveFeatureSet() {
    const matrix = this.getFeatureMatrix();
    const licenseInfo = await this.getLicenseInfo();
    const overrides = await this.getFeatureOverrides();
    const baseSet = new Set([
      ...matrix.free,
      ...(licenseInfo.effectiveEdition !== 'free' ? matrix.pro : []),
      ...(licenseInfo.effectiveEdition === 'enterprise' ? matrix.enterprise : []),
    ]);

    // 当前策略：许可证优先，后台开关用于“关闭”功能，不提升许可证等级能力
    Object.keys(overrides).forEach(key => {
      if (overrides[key] === false) {
        baseSet.delete(key);
      }
    });

    return { featureSet: baseSet, licenseInfo, overrides };
  }

  /**
   * 获取完整功能列表（附带启用状态）
   */
  async getFeatureList() {
    const catalog = this.getFeatureCatalog();
    const { featureSet, licenseInfo, overrides } = await this.resolveEffectiveFeatureSet();
    const rows = catalog.map(item => {
      const enabled = featureSet.has(item.key);
      let source = 'license';
      if (Object.prototype.hasOwnProperty.call(overrides, item.key) && overrides[item.key] === false) {
        source = 'override_off';
      }
      return {
        ...item,
        enabled,
        source,
      };
    });
    const enabledCount = rows.filter(item => item.enabled).length;
    return {
      edition: licenseInfo.effectiveEdition,
      licenseStatus: licenseInfo.status,
      isActive: licenseInfo.isActive,
      isExpired: licenseInfo.isExpired,
      totalCount: rows.length,
      enabledCount,
      rows,
    };
  }

  /**
   * 判断是否具备某个功能（供后端业务调用）
   */
  async hasFeature(featureKey = '') {
    const key = String(featureKey || '').trim();
    if (!key) return false;
    const { featureSet } = await this.resolveEffectiveFeatureSet();
    return featureSet.has(key);
  }
}

module.exports = LicenseCenterService;
