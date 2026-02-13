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
   * 获取单个设置
   */
  async get(key) {
    const { app } = this;
    
    const [setting] = await app.model.query(
      'SELECT `key`, `value`, description FROM uied_site_setting WHERE `key` = ?',
      { replacements: [key], type: app.Sequelize.QueryTypes.SELECT }
    );
    
    if (!setting) return null;
    
    try {
      return JSON.parse(setting.value);
    } catch {
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
      } catch {
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
    
    for (const [key, rawValue] of Object.entries(data)) {
      const value = key === 'pageGlobalConfig' && rawValue && typeof rawValue === 'object'
        ? this.normalizePageGlobalConfig(rawValue)
        : rawValue;
      const valueStr = typeof value === 'object' ? JSON.stringify(value) : String(value);
      
      await app.model.query(
        `INSERT INTO uied_site_setting (\`key\`, \`value\`, create_time, update_time)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE \`value\` = ?, update_time = ?`,
        { replacements: [key, valueStr, now, now, valueStr, now], type: app.Sequelize.QueryTypes.INSERT }
      );
    }
  }

  /**
   * 获取站点信息
   */
  async getSiteInfo() {
    const { app } = this;
    
    const [info] = await app.model.query(
      'SELECT * FROM uied_site_info LIMIT 1',
      { type: app.Sequelize.QueryTypes.SELECT }
    );
    
    if (!info) return null;
    
    return {
      id: info.id,
      siteName: info.site_name,
      siteTitle: info.site_title,
      siteDescription: info.site_description,
      siteKeywords: info.site_keywords,
      logo: info.logo,
      favicon: info.favicon,
      icp: info.icp,
      copyright: info.copyright,
      contactEmail: info.contact_email,
      analyticsCode: info.analytics_code,
    };
  }

  /**
   * 保存站点信息
   */
  async saveSiteInfo(data) {
    const { app } = this;
    const now = Math.floor(Date.now() / 1000);
    
    // 检查是否存在记录
    const [existing] = await app.model.query(
      'SELECT id FROM uied_site_info LIMIT 1',
      { type: app.Sequelize.QueryTypes.SELECT }
    );
    
    if (existing) {
      await app.model.query(
        `UPDATE uied_site_info SET
          site_name = ?, site_title = ?, site_description = ?, site_keywords = ?,
          logo = ?, favicon = ?, icp = ?, copyright = ?, contact_email = ?,
          analytics_code = ?, update_time = ?
         WHERE id = ?`,
        {
          replacements: [
            data.siteName || '', data.siteTitle || '', data.siteDescription || '',
            data.siteKeywords || '', data.logo || '', data.favicon || '',
            data.icp || '', data.copyright || '', data.contactEmail || '',
            data.analyticsCode || '', now, existing.id,
          ],
          type: app.Sequelize.QueryTypes.UPDATE,
        }
      );
    } else {
      await app.model.query(
        `INSERT INTO uied_site_info (site_name, site_title, site_description, site_keywords,
          logo, favicon, icp, copyright, contact_email, analytics_code, create_time, update_time)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        {
          replacements: [
            data.siteName || '', data.siteTitle || '', data.siteDescription || '',
            data.siteKeywords || '', data.logo || '', data.favicon || '',
            data.icp || '', data.copyright || '', data.contactEmail || '',
            data.analyticsCode || '', now, now,
          ],
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
      customCss: ''
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
      topAdCode: ''
    };
    
    const defaultCardStyle = {
      defaultLayout: 'grid',
      gridColumns: 4,
      showDescription: true,
      maxDescriptionLines: 2,
      showTags: true,
      showFavicon: true,
      showUrl: false,
      hoverEffect: 'translateUp'
    };
    
    const defaultSidebar = {
      enabled: true,
      position: 'left',
      width: 240,
      showCategories: true,
      showCategoryCount: true,
      expandSubCategories: false,
      sticky: true
    };
    
    const defaultSearch = {
      placeholder: '搜索网站名称...',
      debounceDelay: 300,
      aiSearchEnabled: true,
      aiSearchBtnText: 'AI 搜索',
      highlightKeyword: true,
      resultsPerPage: 20
    };
    
    const defaultExitModal = {
      enabled: true,
      title: '即将离开本站',
      description: '您即将访问外部网站，请注意安全',
      autoRedirect: true,
      countdown: 5
    };
    
    const defaultDetailPage = {
      screenshotsEnabled: true,
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
      visitBtnNewWindow: true
    };
    
    const normalizedPageGlobalConfig = this.normalizePageGlobalConfig(pageGlobalConfig || {});

    // 返回完整的配置结构（注意字段名要和前端期望的一致）
    return {
      siteInfo,
      pageGlobal: { ...defaultPageGlobal, ...normalizedPageGlobalConfig },
      appearance: appearanceConfig || defaultAppearance,
      homepage: homepageConfig || defaultHomepage,
      cardStyle: cardStyleConfig || defaultCardStyle,
      sidebar: sidebarConfig || defaultSidebar,
      search: searchConfig || defaultSearch,
      exitModal: exitModalConfig || defaultExitModal,
      detailPage: detailPageConfig || defaultDetailPage,
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
