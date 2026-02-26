/**
 * @file service/uied/setting.js
 * @description UIED 站点设置服务
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

'use strict';

const Service = require('egg').Service;

class SettingService extends Service {
  /**
   * 获取站点信息表字段映射（兼容不同版本字段命名）
   */
  async getSiteInfoFieldMapping() {
    if (this._siteInfoFieldMapping) {
      return this._siteInfoFieldMapping;
    }
    const { app } = this;
    let columns = [];
    try {
      columns = await app.model.query(
        `SELECT COLUMN_NAME
         FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = 'uied_site_info'`,
        { type: app.Sequelize.QueryTypes.SELECT }
      );
    } catch (error) {
      this.ctx.logger.warn('[setting] 读取 uied_site_info 字段失败，使用默认兼容映射:', error.message);
      columns = [];
    }
    const has = new Set((Array.isArray(columns) ? columns : []).map(item => String(item?.COLUMN_NAME || '')));
    this._siteInfoFieldMapping = {
      descriptionField: has.has('site_description') ? 'site_description' : (has.has('description') ? 'description' : ''),
      keywordsField: has.has('site_keywords') ? 'site_keywords' : (has.has('keywords') ? 'keywords' : ''),
      contactEmailField: has.has('contact_email') ? 'contact_email' : '',
      analyticsCodeField: has.has('analytics_code') ? 'analytics_code' : '',
    };
    return this._siteInfoFieldMapping;
  }

  /**
   * 获取默认导航切换项配置
   */
  getDefaultNavSwitchItems() {
    return [
      { slug: 'uiux', name: 'UI导航', icon: 'Figma', visible: true, sort: 10 },
      { slug: 'ai', name: 'AI导航', icon: 'AI', visible: true, sort: 20 },
      { slug: 'design', name: '平面导航', icon: 'Design', visible: true, sort: 30 },
      { slug: '3d', name: '三维导航', icon: '3D', visible: true, sort: 40 },
      { slug: 'ecommerce', name: '电商导航', icon: 'Ecommerce', visible: true, sort: 50 },
      { slug: 'interior', name: '室内导航', icon: 'Design', visible: true, sort: 60 },
      { slug: 'font', name: '字体导航', icon: 'Font', visible: true, sort: 70 },
    ];
  }

  /**
   * 规范化导航切换项，确保前端有稳定的显示/排序结构
   */
  normalizeNavSwitchItems(items) {
    const defaults = this.getDefaultNavSwitchItems();
    const list = Array.isArray(items) && items.length > 0 ? items : defaults;
    return list
      .map((item, index) => {
        const fallback = defaults[index] || defaults[0];
        return {
          slug: String(item?.slug || fallback.slug),
          name: String(item?.name || fallback.name),
          icon: String(item?.icon || fallback.icon),
          visible: item?.visible !== false,
          sort: Number.isFinite(Number(item?.sort)) ? Number(item.sort) : (index + 1) * 10,
        };
      })
      .sort((a, b) => a.sort - b.sort);
  }

  /**
   * 规范化首页配置
   * 新增：轮播区/推荐区显示与排序、导航切换项后台化配置
   */
  normalizeHomepageConfig(config = {}) {
    const defaults = {
      heroBannerEnabled: true,
      heroBgType: 'default',
      heroBgValue: '',
      heroDisplayMode: 'search',
      heroShowStats: true,
      heroShowHotTags: true,
      bannerCardsEnabled: true,
      hotRecommendationsEnabled: true,
      hotRecommendationsTitle: '热门推荐',
      topAdEnabled: false,
      topAdCode: '',
      homeCarouselEnabled: true,
      homeCarouselSort: 10,
      homeRecommendationEnabled: true,
      homeRecommendationSort: 20,
      navSwitchItems: this.getDefaultNavSwitchItems(),
    };
    const merged = { ...defaults, ...(config || {}) };
    return {
      ...merged,
      homeCarouselEnabled: merged.homeCarouselEnabled !== false,
      homeRecommendationEnabled: merged.homeRecommendationEnabled !== false,
      homeCarouselSort: Number.isFinite(Number(merged.homeCarouselSort)) ? Number(merged.homeCarouselSort) : 10,
      homeRecommendationSort: Number.isFinite(Number(merged.homeRecommendationSort)) ? Number(merged.homeRecommendationSort) : 20,
      navSwitchItems: this.normalizeNavSwitchItems(merged.navSwitchItems),
    };
  }

  /**
   * 规范化分类区域点击模式
   * 兼容历史值：directExternal -> direct
   */
  normalizeWebsiteClickMode(mode) {
    if (mode === 'direct' || mode === 'directExternal') {
      return 'direct';
    }
    return 'detail';
  }

  /**
   * 规范化热门推荐点击模式
   * 兼容历史值：modal -> detail
   */
  normalizeHotRecommendationClickMode(mode) {
    if (mode === 'direct') {
      return 'direct';
    }
    return 'detail';
  }

  /**
   * 规范化页面全局配置，确保分类与热门推荐为独立且统一语义
   */
  normalizePageGlobalConfig(config = {}) {
    const normalized = { ...config };
    normalized.websiteClickMode = this.normalizeWebsiteClickMode(config.websiteClickMode);
    normalized.hotRecommendationClickMode = this.normalizeHotRecommendationClickMode(config.hotRecommendationClickMode);
    return normalized;
  }

  /**
   * 规范化跳转弹窗配置，确保商业版协议文案可后台配置
   */
  normalizeExitModalConfig(config = {}) {
    const defaults = {
      enabled: true,
      title: '即将离开本站',
      description: '您即将访问外部网站，请注意安全',
      autoRedirect: true,
      countdown: 5,
      logo: '',
      showAgreementLinks: false,
      userAgreementText: '用户协议',
      userAgreementUrl: '',
      copyrightAgreementText: '版权协议',
      copyrightAgreementUrl: '',
    };
    const merged = { ...defaults, ...(config || {}) };
    return {
      ...merged,
      enabled: merged.enabled !== false,
      autoRedirect: merged.autoRedirect !== false,
      countdown: Number.isFinite(Number(merged.countdown))
        ? Math.max(1, Math.min(30, Number(merged.countdown)))
        : defaults.countdown,
      logo: String(merged.logo || ''),
      showAgreementLinks: merged.showAgreementLinks === true,
      userAgreementText: String(merged.userAgreementText || defaults.userAgreementText),
      userAgreementUrl: String(merged.userAgreementUrl || ''),
      copyrightAgreementText: String(merged.copyrightAgreementText || defaults.copyrightAgreementText),
      copyrightAgreementUrl: String(merged.copyrightAgreementUrl || ''),
    };
  }

  /**
   * 规范化文章模块公开配置（前端官网读取）
   */
  normalizeArticleConfig(config = {}) {
    const defaults = {
      enabled: true,
      homeSectionEnabled: true,
      homeSectionTitle: '设计文章',
      homeSectionSubtitle: '汇聚优质设计文章，分享前沿设计趋势与实战经验',
      homeSectionLimit: 12,
      listPageTitle: '设计专栏',
      listPageDescription: '汇聚优质设计文章，分享前沿设计趋势、实战技巧与行业洞察',
      listPageCoverImage: '',
      commentsEnabled: true,
      topicsEnabled: true,
    };
    const merged = { ...defaults, ...(config || {}) };
    return {
      ...merged,
      enabled: merged.enabled !== false,
      homeSectionEnabled: merged.homeSectionEnabled !== false,
      homeSectionLimit: Number.isFinite(Number(merged.homeSectionLimit))
        ? Math.max(1, Math.min(50, Number(merged.homeSectionLimit)))
        : defaults.homeSectionLimit,
      commentsEnabled: merged.commentsEnabled !== false,
      topicsEnabled: merged.topicsEnabled !== false,
    };
  }

  /**
   * 规范化文章专题配置（按 category/tag 自定义视觉）
   */
  normalizeArticleTopicsConfig(config = {}) {
    if (!config || typeof config !== 'object') {
      return {};
    }
    const result = {};
    Object.keys(config).forEach(key => {
      const item = config[key] || {};
      const topicKey = String(key || '').trim();
      if (!topicKey) return;
      result[topicKey] = {
        id: String(item.id || topicKey),
        type: String(item.type || 'category') === 'tag' ? 'tag' : 'category',
        title: String(item.title || ''),
        description: String(item.description || ''),
        coverImage: String(item.coverImage || ''),
        icon: String(item.icon || ''),
        themeColor: String(item.themeColor || ''),
      };
    });
    return result;
  }

  /**
   * 获取单个设置
   */
  async get(key) {
    const { app } = this;

    const [ setting ] = await app.model.query(
      'SELECT `key`, `value`, description FROM uied_site_setting WHERE `key` = ?',
      { replacements: [ key ], type: app.Sequelize.QueryTypes.SELECT }
    );

    if (!setting) return null;

    try {
      return JSON.parse(setting.value);
    } catch (error) {
      return setting.value;
    }
  }

  /**
   * 获取所有设置
   */
  async getAll() {
    const { app } = this;

    const settings = await app.model.query(
      'SELECT `key`, `value`, description FROM uied_site_setting',
      { type: app.Sequelize.QueryTypes.SELECT }
    );

    const result = {};
    for (const setting of settings) {
      try {
        result[setting.key] = JSON.parse(setting.value);
      } catch (error) {
        result[setting.key] = setting.value;
      }
    }

    return result;
  }

  /**
   * 保存设置
   */
  async save(data) {
    const { app } = this;
    const now = Math.floor(Date.now() / 1000);

    for (const [ key, rawValue ] of Object.entries(data)) {
      const value = key === 'pageGlobalConfig' && rawValue && typeof rawValue === 'object'
        ? this.normalizePageGlobalConfig(rawValue)
        : key === 'homepageConfig' && rawValue && typeof rawValue === 'object'
          ? this.normalizeHomepageConfig(rawValue)
          : key === 'exitModalConfig' && rawValue && typeof rawValue === 'object'
            ? this.normalizeExitModalConfig(rawValue)
          : rawValue;
      const valueStr = typeof value === 'object' ? JSON.stringify(value) : String(value);

      await app.model.query(
        `INSERT INTO uied_site_setting (\`key\`, \`value\`, create_time, update_time)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE \`value\` = ?, update_time = ?`,
        { replacements: [ key, valueStr, now, now, valueStr, now ], type: app.Sequelize.QueryTypes.INSERT }
      );
    }
  }

  /**
   * 获取站点信息
   */
  async getSiteInfo() {
    const { app } = this;

    const [ info ] = await app.model.query(
      'SELECT * FROM uied_site_info LIMIT 1',
      { type: app.Sequelize.QueryTypes.SELECT }
    );

    if (!info) return null;

    return {
      id: info.id,
      siteName: info.site_name,
      siteTitle: info.site_title,
      siteDescription: info.site_description !== undefined ? info.site_description : (info.description || ''),
      siteKeywords: info.site_keywords !== undefined ? info.site_keywords : (info.keywords || ''),
      logo: info.logo,
      favicon: info.favicon,
      icp: info.icp,
      copyright: info.copyright,
      contactEmail: info.contact_email !== undefined ? info.contact_email : '',
      analyticsCode: info.analytics_code !== undefined ? info.analytics_code : '',
    };
  }

  /**
   * 保存站点信息
   */
  async saveSiteInfo(data) {
    const { app } = this;
    const now = Math.floor(Date.now() / 1000);
    const fieldMapping = await this.getSiteInfoFieldMapping();

    // 检查是否存在记录
    const [ existing ] = await app.model.query(
      'SELECT id FROM uied_site_info LIMIT 1',
      { type: app.Sequelize.QueryTypes.SELECT }
    );

    if (existing) {
      const updates = [
        'site_name = ?',
        'site_title = ?',
      ];
      const values = [
        data.siteName || '',
        data.siteTitle || '',
      ];
      if (fieldMapping.descriptionField) {
        updates.push(`\`${fieldMapping.descriptionField}\` = ?`);
        values.push(data.siteDescription || '');
      }
      if (fieldMapping.keywordsField) {
        updates.push(`\`${fieldMapping.keywordsField}\` = ?`);
        values.push(data.siteKeywords || '');
      }
      updates.push('logo = ?');
      values.push(data.logo || '');
      updates.push('favicon = ?');
      values.push(data.favicon || '');
      updates.push('icp = ?');
      values.push(data.icp || '');
      updates.push('copyright = ?');
      values.push(data.copyright || '');
      if (fieldMapping.contactEmailField) {
        updates.push(`\`${fieldMapping.contactEmailField}\` = ?`);
        values.push(data.contactEmail || '');
      }
      if (fieldMapping.analyticsCodeField) {
        updates.push(`\`${fieldMapping.analyticsCodeField}\` = ?`);
        values.push(data.analyticsCode || '');
      }
      updates.push('update_time = ?');
      values.push(now);
      values.push(existing.id);

      await app.model.query(
        `UPDATE uied_site_info SET ${updates.join(', ')} WHERE id = ?`,
        {
          replacements: values,
          type: app.Sequelize.QueryTypes.UPDATE,
        }
      );
    } else {
      const insertColumns = [
        'site_name',
        'site_title',
      ];
      const insertValues = [
        data.siteName || '',
        data.siteTitle || '',
      ];
      if (fieldMapping.descriptionField) {
        insertColumns.push(`\`${fieldMapping.descriptionField}\``);
        insertValues.push(data.siteDescription || '');
      }
      if (fieldMapping.keywordsField) {
        insertColumns.push(`\`${fieldMapping.keywordsField}\``);
        insertValues.push(data.siteKeywords || '');
      }
      insertColumns.push('logo');
      insertValues.push(data.logo || '');
      insertColumns.push('favicon');
      insertValues.push(data.favicon || '');
      insertColumns.push('icp');
      insertValues.push(data.icp || '');
      insertColumns.push('copyright');
      insertValues.push(data.copyright || '');
      if (fieldMapping.contactEmailField) {
        insertColumns.push(`\`${fieldMapping.contactEmailField}\``);
        insertValues.push(data.contactEmail || '');
      }
      if (fieldMapping.analyticsCodeField) {
        insertColumns.push(`\`${fieldMapping.analyticsCodeField}\``);
        insertValues.push(data.analyticsCode || '');
      }
      insertColumns.push('create_time');
      insertValues.push(now);
      insertColumns.push('update_time');
      insertValues.push(now);
      const placeholders = insertColumns.map(() => '?').join(', ');

      await app.model.query(
        `INSERT INTO uied_site_info (${insertColumns.join(', ')})
         VALUES (${placeholders})`,
        {
          replacements: insertValues,
          type: app.Sequelize.QueryTypes.INSERT,
        }
      );
    }
  }

  /**
   * 获取公开设置（前端访问）
   */
  async getPublicSettings() {
    const siteInfo = await this.getSiteInfo();

    // 从数据库读取各项配置
    const pageGlobalConfig = await this.get('pageGlobalConfig');
    const appearanceConfig = await this.get('appearanceConfig');
    const homepageConfig = await this.get('homepageConfig');
    const cardStyleConfig = await this.get('cardStyleConfig');
    const sidebarConfig = await this.get('sidebarConfig');
    const searchConfig = await this.get('searchConfig');
    const exitModalConfig = await this.get('exitModalConfig');
    const detailPageConfig = await this.get('detailPageConfig');
    const articleConfig = await this.get('articleConfig');
    const articleTopicsConfig = await this.get('articleTopicsConfig');

    // 默认配置
    const defaultPageGlobal = {
      websiteClickMode: 'detail',
      showDirectArrow: true,
      directArrowNewWindow: true,
      detailPageNewWindow: false,
      pageSize: 20,
      hotRecommendationClickMode: 'detail', // 热门推荐独立配置，默认进详情页
    };

    const defaultAppearance = {
      primaryColor: '#0066ff',
      backgroundColor: '#f6f8fb',
      cardBackgroundColor: '#ffffff',
      textPrimaryColor: '#333333',
      fontFamily: 'Lexend, -apple-system, sans-serif',
      baseFontSize: 16,
      borderRadius: 12,
      contentMaxWidth: 1200,
      customCss: '',
    };

    const defaultHomepage = {
      heroBannerEnabled: true,
      heroBgType: 'default',
      heroBgValue: '',
      heroDisplayMode: 'search',
      heroShowStats: true,
      heroShowHotTags: true,
      bannerCardsEnabled: true,
      hotRecommendationsEnabled: true,
      hotRecommendationsTitle: '热门推荐',
      topAdEnabled: false,
      topAdCode: '',
      homeCarouselEnabled: true,
      homeCarouselSort: 10,
      homeRecommendationEnabled: true,
      homeRecommendationSort: 20,
      navSwitchItems: this.getDefaultNavSwitchItems(),
    };

    const defaultCardStyle = {
      defaultLayout: 'grid',
      gridColumns: 4,
      showDescription: true,
      maxDescriptionLines: 2,
      showTags: true,
      showFavicon: true,
      showUrl: false,
      hoverEffect: 'translateUp',
    };

    const defaultSidebar = {
      enabled: true,
      position: 'left',
      width: 240,
      showCategories: true,
      showCategoryCount: true,
      expandSubCategories: false,
      sticky: true,
    };

    const defaultSearch = {
      placeholder: '搜索网站名称...',
      debounceDelay: 300,
      aiSearchEnabled: true,
      aiSearchBtnText: 'AI 搜索',
      highlightKeyword: true,
      resultsPerPage: 20,
    };

    const defaultExitModal = {
      enabled: true,
      title: '即将离开本站',
      description: '您即将访问外部网站，请注意安全',
      autoRedirect: true,
      countdown: 5,
      logo: '',
      showAgreementLinks: false,
      userAgreementText: '用户协议',
      userAgreementUrl: '',
      copyrightAgreementText: '版权协议',
      copyrightAgreementUrl: '',
    };

    const defaultDetailPage = {
      pageStylePreset: 'showcase',
      layoutWidthMode: 'contained',
      spacingDensity: 'compact',
      labelVisualStyle: 'soft',
      dataPanelEnabled: true,
      dataPanelTitle: '站点数据',
      heroAccentGlassEnabled: true,
      enabled: true,
      showRelated: true,
      relatedTitle: '你可能还喜欢',
      relatedCount: 6,
      relatedMode: 'same_category',
      manualWebsiteIds: '',
      showTags: true,
      tagsTitle: '深入探索',
      tagSource: 'website',
      manualTags: '',
      showCategory: true,
      categoryTitle: '相关分类',
      sidebarAdEnabled: false,
      sidebarAdSlotKey: 'website_detail_sidebar',
      detailTopAdEnabled: false,
      detailTopAdSlotKey: 'detail_top',
      detailInlineAdEnabled: false,
      detailInlineAdSlotKey: 'detail_inline',
      detailBottomAdEnabled: false,
      detailBottomAdSlotKey: 'detail_bottom',
      seoFaqEnabled: false,
      seoFaqTitle: '常见问题',
      seoFaqLines: '',
      seoLongTailEnabled: false,
      seoLongTailTitle: '相关搜索',
      seoLongTailKeywords: '',
      seoSchemaEnabled: true,
      screenshotsEnabled: true,
      thumbnailLayoutStyle: 'device',
      thumbnailSplitSideCount: 2,
      thumbnailCarouselThumbCount: 6,
      previewSnapshotEnabled: true,
      previewSnapshotTimeoutMs: 12000,
      previewSnapshotCacheTtlSeconds: 21600,
      previewSnapshotAllowFallbackMshots: true,
      ratingsEnabled: true,
      commentsEnabled: true,
      sharingEnabled: true,
      favoritesEnabled: true,
      relatedEnabled: true,
      tagsEnabled: true,
      visitArrowEnabled: true,
      visitArrowText: '直达网站',
      copyrightEnabled: true,
      copyrightText: '版权归原作者所有',
      copyrightLink: '',
      disclaimerEnabled: true,
      disclaimerText: '本站仅收录和推荐，不对第三方网站内容负责。',
      reportEnabled: true,
      reportText: '如发现违规内容，请发送邮件举报',
      reportEmail: '',
      visitBtnText: '访问网站',
      visitBtnNewWindow: true,
    };

    const defaultArticleConfig = {
      enabled: true,
      homeSectionEnabled: true,
      homeSectionTitle: '设计文章',
      homeSectionSubtitle: '汇聚优质设计文章，分享前沿设计趋势与实战经验',
      homeSectionLimit: 12,
      listPageTitle: '设计专栏',
      listPageDescription: '汇聚优质设计文章，分享前沿设计趋势、实战技巧与行业洞察',
      listPageCoverImage: '',
      commentsEnabled: true,
      topicsEnabled: true,
    };

    const normalizedPageGlobalConfig = this.normalizePageGlobalConfig(pageGlobalConfig || {});
    const normalizedExitModalConfig = this.normalizeExitModalConfig(exitModalConfig || defaultExitModal);

    // 返回完整的配置结构（注意字段名要和前端期望的一致）
    return {
      siteInfo,
      pageGlobal: { ...defaultPageGlobal, ...normalizedPageGlobalConfig },
      appearance: appearanceConfig || defaultAppearance,
      homepage: this.normalizeHomepageConfig(homepageConfig || defaultHomepage),
      cardStyle: cardStyleConfig || defaultCardStyle,
      sidebar: sidebarConfig || defaultSidebar,
      search: searchConfig || defaultSearch,
      exitModal: normalizedExitModalConfig,
      popup: normalizedExitModalConfig,
      detailPage: { ...defaultDetailPage, ...(detailPageConfig || {}) },
      article: this.normalizeArticleConfig(articleConfig || defaultArticleConfig),
      articleTopics: this.normalizeArticleTopicsConfig(articleTopicsConfig || {}),
    };
  }

  /**
   * 通过 key 获取设置（别名，兼容 controller 调用）
   */
  async getSettingByKey(key) {
    return await this.get(key);
  }
}

module.exports = SettingService;
