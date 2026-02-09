/**
 * @file service/uied/frontend.js
 * @description UIED 前端兼容服务 - 提供与原 Express API 兼容的接口
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

'use strict';

const Service = require('egg').Service;

class FrontendService extends Service {
  /**
   * 获取所有页面配置
   */
  async getAllPages() {
    const { app } = this;
    const pages = await app.model.query(
      `SELECT id, name, slug, type, description, icon,
              hero_title as heroTitle, hero_subtitle as heroSubtitle,
              hero_highlight_text as heroHighlightText,
              hot_search_tags as hotSearchTags,
              hero_display_mode as heroDisplayMode,
              hero_scroll_websites as heroScrollWebsites,
              hero_bg_type as heroBgType, hero_bg_value as heroBgValue,
              search_placeholder as searchPlaceholder,
              search_enabled as searchEnabled,
              show_hot_recommendations as showHotRecommendations,
              show_categories as showCategories,
              show_sidebar as showSidebar,
              theme_color as themeColor,
              sort as sortOrder
       FROM uied_page
       WHERE is_delete = 0 AND is_show = 1
       ORDER BY sort ASC`,
      { type: app.Sequelize.QueryTypes.SELECT }
    );
    
    return pages.map(p => ({
      ...p,
      searchEnabled: p.searchEnabled === 1,
      showHotRecommendations: p.showHotRecommendations === 1,
      showCategories: p.showCategories === 1,
      showSidebar: p.showSidebar === 1,
      hotSearchTags: p.hotSearchTags ? this.safeJsonParse(p.hotSearchTags, []) : [],
      heroScrollWebsites: p.heroScrollWebsites ? this.safeJsonParse(p.heroScrollWebsites, []) : [],
    }));
  }

  /**
   * 获取页面完整数据（包含分类和网站）
   */
  async getPageFullData(slug) {
    const { app } = this;
    
    // 获取页面配置
    const [page] = await app.model.query(
      `SELECT * FROM uied_page WHERE slug = ? AND is_delete = 0`,
      { replacements: [slug], type: app.Sequelize.QueryTypes.SELECT }
    );
    
    if (!page) return null;
    
    // 获取页面关联的主分类
    const mainCategories = await app.model.query(
      `SELECT c.id, c.name, c.slug, c.icon, c.color, c.description, pc.sort as sortOrder
       FROM uied_category c
       INNER JOIN uied_page_category pc ON c.id = pc.category_id
       WHERE pc.page_id = ? AND pc.is_delete = 0 AND c.is_delete = 0
       ORDER BY pc.sort ASC`,
      { replacements: [page.id], type: app.Sequelize.QueryTypes.SELECT }
    );
    
    // 收集所有分类ID（主分类 + 子分类）用于查询网站
    const allCategoryIds = [];
    const categoriesWithSubs = [];
    
    for (const cat of mainCategories) {
      // 获取子分类
      const subCategories = await app.model.query(
        `SELECT id, name, slug FROM uied_category
         WHERE parent_id = ? AND is_delete = 0 AND is_show = 1
         ORDER BY sort ASC`,
        { replacements: [cat.id], type: app.Sequelize.QueryTypes.SELECT }
      );
      
      // 收集子分类ID（网站关联的是子分类）
      const subCategoryIds = subCategories.map(s => s.id);
      allCategoryIds.push(...subCategoryIds);
      
      // 如果没有子分类，也把主分类ID加入（兼容直接关联主分类的网站）
      if (subCategoryIds.length === 0) {
        allCategoryIds.push(cat.id);
      }
      
      categoriesWithSubs.push({
        id: String(cat.id),
        name: cat.name,
        slug: cat.slug,
        icon: cat.icon || 'default',
        color: cat.color || '#3B82F6',
        description: cat.description,
        order: cat.sortOrder,
        subCategories: subCategories.map(s => ({
          id: String(s.id),
          name: s.name,
          slug: s.slug,
        })),
        websites: [], // 将在下面填充
      });
    }
    
    // 获取所有相关网站
    let websites = [];
    if (allCategoryIds.length > 0) {
      // 使用 Sequelize 的 Op.in 来正确处理数组
      const placeholders = allCategoryIds.map(() => '?').join(',');
      websites = await app.model.query(
        `SELECT id, name, description, url, icon_url as iconUrl, category_id as categoryId,
                is_hot as isHot, is_featured as isFeatured, is_new as isNew, is_pinned as isPinned,
                tags, sort as sortOrder
         FROM uied_website
         WHERE category_id IN (${placeholders}) AND is_delete = 0
         ORDER BY is_pinned DESC, is_hot DESC, is_featured DESC, sort ASC`,
        { replacements: allCategoryIds, type: app.Sequelize.QueryTypes.SELECT }
      );
    }
    
    // 按分类组织网站（用于 websitesByCategory）
    const websitesByCategory = {};
    for (const website of websites) {
      const catId = String(website.categoryId);
      if (!websitesByCategory[catId]) {
        websitesByCategory[catId] = [];
      }
      websitesByCategory[catId].push({
        id: String(website.id),
        name: website.name,
        description: website.description || '',
        url: website.url,
        iconUrl: website.iconUrl,
        isHot: website.isHot === 1,
        isFeatured: website.isFeatured === 1,
        isNew: website.isNew === 1,
        tags: this.safeJsonParse(website.tags, []),
      });
    }
    
    // 为每个主分类填充网站（合并其所有子分类的网站）
    for (const cat of categoriesWithSubs) {
      const catWebsites = [];
      // 添加直接关联到主分类的网站
      if (websitesByCategory[cat.id]) {
        catWebsites.push(...websitesByCategory[cat.id]);
      }
      // 添加子分类的网站
      for (const sub of cat.subCategories) {
        if (websitesByCategory[sub.id]) {
          catWebsites.push(...websitesByCategory[sub.id]);
        }
      }
      cat.websites = catWebsites;
    }
    
    return {
      page: {
        id: String(page.id),
        name: page.name,
        slug: page.slug,
        type: page.type,
        icon: page.icon,
        description: page.description,
        heroTitle: page.hero_title,
        heroHighlightText: page.hero_highlight_text,
        heroSubtitle: page.hero_subtitle,
        hotSearchTags: this.safeJsonParse(page.hot_search_tags, []),
        heroDisplayMode: page.hero_display_mode || 'search',
        heroScrollWebsites: page.hero_scroll_websites ? JSON.stringify(this.safeJsonParse(page.hero_scroll_websites, [])) : null,
        heroBgType: page.hero_bg_type || 'default',
        heroBgValue: page.hero_bg_value,
        searchPlaceholder: page.search_placeholder,
        searchEnabled: page.search_enabled === 1,
        showHotRecommendations: page.show_hot_recommendations === 1,
        showCategories: page.show_categories === 1,
        showSidebar: page.show_sidebar === 1,
        themeColor: page.theme_color,
      },
      categories: categoriesWithSubs,
      websitesByCategory,
      stats: {
        totalCategories: categoriesWithSubs.length,
        totalWebsites: websites.length,
      },
    };
  }

  /**
   * 获取页面热门推荐
   */
  async getPageHotWebsites(slug, limit = 12) {
    const { app } = this;
    
    // 获取页面
    const [page] = await app.model.query(
      'SELECT id FROM uied_page WHERE slug = ? AND is_delete = 0',
      { replacements: [slug], type: app.Sequelize.QueryTypes.SELECT }
    );
    
    if (!page) return [];
    
    // 获取页面关联的分类ID
    const categoryIds = await this.getPageCategoryIds(page.id);
    if (categoryIds.length === 0) return [];
    
    // 获取热门网站
    const websites = await app.model.query(
      `SELECT id, name, description, url, icon_url as iconUrl,
              is_hot as isHot, is_featured as isFeatured, is_new as isNew, tags
       FROM uied_website
       WHERE category_id IN (?) AND is_delete = 0 AND is_hot = 1
       ORDER BY is_featured DESC, sort ASC
       LIMIT ?`,
      { replacements: [categoryIds, parseInt(limit)], type: app.Sequelize.QueryTypes.SELECT }
    );
    
    return websites.map(w => ({
      ...w,
      id: String(w.id),
      isHot: w.isHot === 1,
      isFeatured: w.isFeatured === 1,
      isNew: w.isNew === 1,
      tags: this.safeJsonParse(w.tags, []),
    }));
  }

  /**
   * 获取页面热门标签
   */
  async getPageHotTags(slug, limit = 10) {
    const { app } = this;
    
    // 获取页面
    const [page] = await app.model.query(
      'SELECT id FROM uied_page WHERE slug = ? AND is_delete = 0',
      { replacements: [slug], type: app.Sequelize.QueryTypes.SELECT }
    );
    
    if (!page) return { tags: [], websites: [] };
    
    // 获取页面关联的分类ID
    const categoryIds = await this.getPageCategoryIds(page.id);
    if (categoryIds.length === 0) return { tags: [], websites: [] };
    
    // 获取点击量最高的网站
    let topWebsites = await app.model.query(
      `SELECT id, name, click_count as clickCount
       FROM uied_website
       WHERE category_id IN (?) AND is_delete = 0 AND click_count > 0
       ORDER BY click_count DESC, is_hot DESC, is_featured DESC
       LIMIT ?`,
      { replacements: [categoryIds, parseInt(limit)], type: app.Sequelize.QueryTypes.SELECT }
    );
    
    // 如果没有点击量数据，回退到热门网站
    if (topWebsites.length === 0) {
      topWebsites = await app.model.query(
        `SELECT id, name, click_count as clickCount
         FROM uied_website
         WHERE category_id IN (?) AND is_delete = 0
           AND (is_hot = 1 OR is_featured = 1)
         ORDER BY is_hot DESC, is_featured DESC, sort ASC
         LIMIT ?`,
        { replacements: [categoryIds, parseInt(limit)], type: app.Sequelize.QueryTypes.SELECT }
      );
    }
    
    return {
      tags: topWebsites.map(w => w.name),
      websites: topWebsites.map(w => ({
        id: String(w.id),
        name: w.name,
        clickCount: w.clickCount || 0,
      })),
    };
  }

  /**
   * 搜索页面内的网站
   */
  async searchPageWebsites(slug, query, limit = 50) {
    const { app } = this;
    
    if (!query) {
      return { results: [], total: 0, query: '', suggestions: [], recommendations: [] };
    }
    
    // 获取页面
    const [page] = await app.model.query(
      'SELECT id FROM uied_page WHERE slug = ? AND is_delete = 0',
      { replacements: [slug], type: app.Sequelize.QueryTypes.SELECT }
    );
    
    if (!page) {
      return { results: [], total: 0, query, suggestions: [], recommendations: [] };
    }
    
    // 获取页面关联的分类ID
    const categoryIds = await this.getPageCategoryIds(page.id);
    if (categoryIds.length === 0) {
      return { results: [], total: 0, query, suggestions: [], recommendations: [] };
    }
    
    // 搜索网站
    const searchPattern = `%${query}%`;
    const websites = await app.model.query(
      `SELECT id, name, description, url, icon_url as iconUrl,
              is_hot as isHot, is_featured as isFeatured, is_new as isNew, tags
       FROM uied_website
       WHERE category_id IN (?)
         AND is_delete = 0
         AND (name LIKE ? OR description LIKE ? OR tags LIKE ?)
       ORDER BY is_hot DESC, is_featured DESC
       LIMIT ?`,
      { replacements: [categoryIds, searchPattern, searchPattern, searchPattern, parseInt(limit)], type: app.Sequelize.QueryTypes.SELECT }
    );
    
    const results = websites.map(w => ({
      ...w,
      id: String(w.id),
      isHot: w.isHot === 1,
      isFeatured: w.isFeatured === 1,
      isNew: w.isNew === 1,
      tags: this.safeJsonParse(w.tags, []),
      score: this.calculateRelevanceScore(w, query),
    }));
    
    // 按相关性排序
    results.sort((a, b) => b.score - a.score);
    
    // 如果没有结果，获取热门推荐
    let recommendations = [];
    if (results.length === 0) {
      recommendations = await this.getPageHotWebsites(slug, 8);
    }
    
    return {
      results,
      total: results.length,
      query,
      suggestions: [],
      recommendations,
    };
  }

  /**
   * 获取页面关联的所有分类ID（包括子分类）
   */
  async getPageCategoryIds(pageId) {
    const { app } = this;
    
    // 获取主分类
    const mainCategories = await app.model.query(
      `SELECT c.id FROM uied_category c
       INNER JOIN uied_page_category pc ON c.id = pc.category_id
       WHERE pc.page_id = ? AND pc.is_delete = 0 AND c.is_delete = 0`,
      { replacements: [pageId], type: app.Sequelize.QueryTypes.SELECT }
    );
    
    const mainCategoryIds = mainCategories.map(c => c.id);
    const allCategoryIds = [];
    
    // 获取子分类（网站主要关联子分类）
    if (mainCategoryIds.length > 0) {
      const placeholders = mainCategoryIds.map(() => '?').join(',');
      const subCategories = await app.model.query(
        `SELECT id FROM uied_category
         WHERE parent_id IN (${placeholders}) AND is_delete = 0`,
        { replacements: mainCategoryIds, type: app.Sequelize.QueryTypes.SELECT }
      );
      
      for (const sub of subCategories) {
        allCategoryIds.push(sub.id);
      }
    }
    
    // 如果没有子分类，使用主分类ID
    if (allCategoryIds.length === 0) {
      allCategoryIds.push(...mainCategoryIds);
    }
    
    return allCategoryIds;
  }

  /**
   * 计算搜索相关性分数
   */
  calculateRelevanceScore(website, keyword) {
    const lowerKeyword = keyword.toLowerCase();
    let score = 0;
    
    if (website.name) {
      const lowerName = website.name.toLowerCase();
      if (lowerName === lowerKeyword) score += 100;
      else if (lowerName.startsWith(lowerKeyword)) score += 50;
      else if (lowerName.includes(lowerKeyword)) score += 30;
    }
    
    if (website.description && website.description.toLowerCase().includes(lowerKeyword)) {
      score += 10;
    }
    
    if (website.isHot) score += 3;
    if (website.isFeatured) score += 2;
    if (website.isNew) score += 1;
    
    return score;
  }

  /**
   * 通过 ID 列表获取网站（支持新数字ID和旧cuid格式）
   */
  async getWebsitesByIds(ids) {
    const { app } = this;
    
    if (!ids || ids.length === 0) return [];
    
    // 分离数字ID和字符串ID（旧cuid格式）
    const numericIds = [];
    const stringIds = [];
    
    for (const id of ids) {
      if (typeof id === 'number' || /^\d+$/.test(String(id))) {
        numericIds.push(parseInt(id));
      } else {
        stringIds.push(String(id));
      }
    }
    
    let websites = [];
    
    // 查询数字ID
    if (numericIds.length > 0) {
      const placeholders = numericIds.map(() => '?').join(',');
      const result = await app.model.query(
        `SELECT id, old_id as oldId, name, description, url, icon_url as iconUrl,
                is_hot as isHot, is_featured as isFeatured, is_new as isNew, tags
         FROM uied_website
         WHERE id IN (${placeholders}) AND is_delete = 0`,
        { replacements: numericIds, type: app.Sequelize.QueryTypes.SELECT }
      );
      websites.push(...result);
    }
    
    // 查询旧cuid格式ID
    if (stringIds.length > 0) {
      const placeholders = stringIds.map(() => '?').join(',');
      const result = await app.model.query(
        `SELECT id, old_id as oldId, name, description, url, icon_url as iconUrl,
                is_hot as isHot, is_featured as isFeatured, is_new as isNew, tags
         FROM uied_website
         WHERE old_id IN (${placeholders}) AND is_delete = 0`,
        { replacements: stringIds, type: app.Sequelize.QueryTypes.SELECT }
      );
      websites.push(...result);
    }
    
    return websites.map(w => ({
      id: String(w.id),
      oldId: w.oldId,
      name: w.name,
      description: w.description || '',
      url: w.url,
      iconUrl: w.iconUrl,
      isHot: w.isHot === 1,
      isFeatured: w.isFeatured === 1,
      isNew: w.isNew === 1,
      tags: this.safeJsonParse(w.tags, []),
    }));
  }

  /**
   * 获取热门网站列表
   */
  async getHotWebsites(limit = 100) {
    const { app } = this;
    
    const websites = await app.model.query(
      `SELECT id, name, description, url, icon_url as iconUrl,
              is_hot as isHot, is_featured as isFeatured, is_new as isNew, tags
       FROM uied_website
       WHERE is_delete = 0 AND (is_hot = 1 OR is_featured = 1)
       ORDER BY is_hot DESC, is_featured DESC, click_count DESC
       LIMIT ?`,
      { replacements: [limit], type: app.Sequelize.QueryTypes.SELECT }
    );
    
    return websites.map(w => ({
      id: String(w.id),
      name: w.name,
      description: w.description || '',
      url: w.url,
      iconUrl: w.iconUrl,
      isHot: w.isHot === 1,
      isFeatured: w.isFeatured === 1,
      isNew: w.isNew === 1,
      tags: this.safeJsonParse(w.tags, []),
    }));
  }

  /**
   * 获取网站详情（前端）
   * @param {string} idOrSlug - 网站ID或slug
   */
  async getWebsiteDetail(idOrSlug) {
    const { app } = this;
    
    // 先尝试按 ID 查询，再按 slug 查询
    let website;
    if (/^\d+$/.test(String(idOrSlug))) {
      [website] = await app.model.query(
        `SELECT w.*, c.name as category_name, c.slug as category_slug, c.id as cat_id,
                c.parent_id as category_parent_id
         FROM uied_website w
         LEFT JOIN uied_category c ON w.category_id = c.id
         WHERE w.id = ? AND w.is_delete = 0`,
        { replacements: [idOrSlug], type: app.Sequelize.QueryTypes.SELECT }
      );
    }
    
    if (!website) {
      [website] = await app.model.query(
        `SELECT w.*, c.name as category_name, c.slug as category_slug, c.id as cat_id,
                c.parent_id as category_parent_id
         FROM uied_website w
         LEFT JOIN uied_category c ON w.category_id = c.id
         WHERE w.slug = ? AND w.is_delete = 0`,
        { replacements: [idOrSlug], type: app.Sequelize.QueryTypes.SELECT }
      );
    }
    
    if (!website) return null;
    
    // 获取父分类信息
    let parentCategory = null;
    if (website.category_parent_id) {
      [parentCategory] = await app.model.query(
        `SELECT id, name, slug FROM uied_category WHERE id = ? AND is_delete = 0`,
        { replacements: [website.category_parent_id], type: app.Sequelize.QueryTypes.SELECT }
      );
    }
    
    return {
      id: String(website.id),
      name: website.name,
      slug: website.slug,
      description: website.description || '',
      url: website.url,
      iconUrl: website.icon_url,
      category: {
        id: String(website.cat_id || website.category_id),
        name: website.category_name || '未分类',
        slug: website.category_slug,
        parent: parentCategory ? {
          id: String(parentCategory.id),
          name: parentCategory.name,
          slug: parentCategory.slug,
        } : null,
      },
      tags: this.safeJsonParse(website.tags, []),
      seoTitle: website.seo_title,
      seoDescription: website.seo_description,
      seoKeywords: website.seo_keywords,
      detailContent: website.detail_content,
      screenshots: website.screenshots ? this.safeJsonParse(website.screenshots, []) : [],
      thumbnail: website.thumbnail,
      visitBtnText: website.visit_btn_text,
      createdAt: website.create_time ? new Date(website.create_time * 1000).toISOString() : null,
      updatedAt: website.update_time ? new Date(website.update_time * 1000).toISOString() : null,
    };
  }

  /**
   * 获取相关推荐网站
   * @param {string} websiteId - 网站ID
   * @param {number} limit - 返回数量
   */
  async getRelatedWebsites(websiteId, limit = 6) {
    const { app } = this;
    
    // 获取当前网站的分类
    const [website] = await app.model.query(
      `SELECT category_id FROM uied_website WHERE id = ? AND is_delete = 0`,
      { replacements: [websiteId], type: app.Sequelize.QueryTypes.SELECT }
    );
    
    if (!website) return [];
    
    // 获取同分类的其他网站
    const related = await app.model.query(
      `SELECT id, name, slug, description, url, icon_url as iconUrl, category_id
       FROM uied_website
       WHERE category_id = ? AND id != ? AND is_delete = 0
       ORDER BY is_hot DESC, is_featured DESC, click_count DESC
       LIMIT ?`,
      { replacements: [website.category_id, websiteId, limit], type: app.Sequelize.QueryTypes.SELECT }
    );
    
    return related.map(w => ({
      id: String(w.id),
      name: w.name,
      slug: w.slug,
      description: w.description || '',
      url: w.url,
      iconUrl: w.iconUrl,
    }));
  }

  /**
   * 获取启用的 Favicon API 列表（按优先级排序）
   * 前端用于动态获取网站图标
   */
  async getFaviconApis() {
    const { app } = this;
    
    const apis = await app.model.query(
      `SELECT id, name, url_template as urlTemplate, description
       FROM uied_favicon_api
       WHERE is_delete = 0 AND is_enabled = 1
       ORDER BY sort ASC, id ASC`,
      { type: app.Sequelize.QueryTypes.SELECT }
    );
    
    return apis;
  }

  /**
   * 安全解析 JSON
   */
  safeJsonParse(str, defaultValue = []) {
    if (!str) return defaultValue;
    try {
      return JSON.parse(str);
    } catch {
      // 如果不是 JSON，按逗号分隔处理
      if (typeof str === 'string') {
        return str.split(',').map(s => s.trim()).filter(Boolean);
      }
      return defaultValue;
    }
  }
}

module.exports = FrontendService;
