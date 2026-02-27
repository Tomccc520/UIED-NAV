/**
 * @file service/uied/page.js
 * @description UIED 页面管理服务
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

'use strict';

const Service = require('egg').Service;

class PageService extends Service {
  /**
   * 获取页面列表（分页）
   */
  async list({ page = 1, pageSize = 20 }) {
    const { app } = this;
    const offset = (page - 1) * pageSize;

    // 获取总数
    const [ countResult ] = await app.model.query(
      'SELECT COUNT(*) as total FROM uied_page WHERE is_delete = 0',
      { type: app.Sequelize.QueryTypes.SELECT }
    );
    const total = countResult.total;

    // 获取列表（包含所有 Hero 配置字段）
    const pages = await app.model.query(
      `SELECT id, name, slug, type, description, icon,
              hero_title as heroTitle, hero_highlight_text as heroHighlightText,
              hero_subtitle as heroSubtitle, hot_search_tags as hotSearchTags,
              hero_bg_type as heroBgType, hero_bg_value as heroBgValue,
              hero_display_mode as heroDisplayMode, hero_scroll_websites as heroScrollWebsites,
              search_placeholder as searchPlaceholder, search_enabled as searchEnabled,
              show_hot_recommendations as showHotRecommendations, show_categories as showCategories,
              show_sidebar as showSidebar, theme_color as themeColor,
              sort as sortOrder, is_show as isActive, create_time as createdAt
       FROM uied_page
       WHERE is_delete = 0
       ORDER BY sort ASC, id ASC
       LIMIT ? OFFSET ?`,
      { replacements: [ pageSize, offset ], type: app.Sequelize.QueryTypes.SELECT }
    );

    const lists = pages.map(p => ({
      ...p,
      isActive: p.isActive === 1,
      searchEnabled: p.searchEnabled === 1,
      showHotRecommendations: p.showHotRecommendations === 1,
      showCategories: p.showCategories === 1,
      showSidebar: p.showSidebar === 1,
      hotSearchTags: p.hotSearchTags ? this.safeJsonParse(p.hotSearchTags, []) : [],
      heroScrollWebsites: p.heroScrollWebsites ? this.safeJsonParse(p.heroScrollWebsites, []) : [],
    }));

    return { lists, count: total, page, pageSize };
  }

  /**
   * 获取所有页面
   */
  async all() {
    const { app } = this;
    const pages = await app.model.query(
      `SELECT id, name, slug, type, icon, sort as sortOrder
       FROM uied_page
       WHERE is_delete = 0 AND is_show = 1
       ORDER BY sort ASC, id ASC`,
      { type: app.Sequelize.QueryTypes.SELECT }
    );
    return pages;
  }

  /**
   * 获取页面详情
   */
  async detail(id, slug) {
    const { app } = this;

    let whereClause = 'is_delete = 0';
    const replacements = [];

    if (id) {
      whereClause += ' AND id = ?';
      replacements.push(id);
    } else if (slug) {
      whereClause += ' AND slug = ?';
      replacements.push(slug);
    }

    const [ page ] = await app.model.query(
      `SELECT * FROM uied_page WHERE ${whereClause}`,
      { replacements, type: app.Sequelize.QueryTypes.SELECT }
    );

    if (!page) return null;

    return {
      id: page.id,
      name: page.name,
      slug: page.slug,
      type: page.type,
      description: page.description,
      icon: page.icon,
      heroTitle: page.hero_title,
      heroHighlightText: page.hero_highlight_text,
      heroSubtitle: page.hero_subtitle,
      hotSearchTags: page.hot_search_tags ? this.safeJsonParse(page.hot_search_tags, []) : [],
      heroBgType: page.hero_bg_type,
      heroBgValue: page.hero_bg_value,
      heroDisplayMode: page.hero_display_mode,
      heroScrollWebsites: page.hero_scroll_websites ? this.safeJsonParse(page.hero_scroll_websites, []) : [],
      searchPlaceholder: page.search_placeholder,
      searchEnabled: page.search_enabled === 1,
      showHotRecommendations: page.show_hot_recommendations === 1,
      showCategories: page.show_categories === 1,
      showSidebar: page.show_sidebar === 1,
      themeColor: page.theme_color,
      sortOrder: page.sort,
      isActive: page.is_show === 1,
      createdAt: page.create_time,
    };
  }

  /**
   * 创建页面
   */
  async add(data) {
    const { app } = this;
    const now = Math.floor(Date.now() / 1000);

    // 检查 slug 是否已存在
    const [ existing ] = await app.model.query(
      'SELECT id FROM uied_page WHERE slug = ? AND is_delete = 0',
      { replacements: [ data.slug ], type: app.Sequelize.QueryTypes.SELECT }
    );
    if (existing) {
      throw new Error('页面别名已存在');
    }

    const [ result ] = await app.model.query(
      `INSERT INTO uied_page (name, slug, type, description, icon, hero_title, hero_highlight_text,
        hero_subtitle, hot_search_tags, hero_bg_type, hero_bg_value, hero_display_mode,
        hero_scroll_websites, search_placeholder, search_enabled, show_hot_recommendations,
        show_categories, show_sidebar, theme_color, sort, is_show, create_time, update_time)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      {
        replacements: [
          data.name, data.slug, data.type || '', data.description || '',
          data.icon || '', data.heroTitle || '', data.heroHighlightText || '',
          data.heroSubtitle || '', data.hotSearchTags ? JSON.stringify(data.hotSearchTags) : null,
          data.heroBgType || 'default', data.heroBgValue || '',
          data.heroDisplayMode || 'search', data.heroScrollWebsites ? JSON.stringify(data.heroScrollWebsites) : null,
          data.searchPlaceholder || '', data.searchEnabled !== false ? 1 : 0,
          data.showHotRecommendations !== false ? 1 : 0, data.showCategories !== false ? 1 : 0,
          data.showSidebar !== false ? 1 : 0, data.themeColor || null,
          data.sortOrder || 0, data.isActive !== false ? 1 : 0, now, now,
        ],
        type: app.Sequelize.QueryTypes.INSERT,
      }
    );

    return { id: result, ...data };
  }

  /**
   * 更新页面
   */
  async edit(data) {
    const { app } = this;
    const now = Math.floor(Date.now() / 1000);

    const updates = [];
    const values = [];

    if (data.name !== undefined) { updates.push('name = ?'); values.push(data.name); }
    if (data.slug !== undefined) { updates.push('slug = ?'); values.push(data.slug); }
    if (data.type !== undefined) { updates.push('type = ?'); values.push(data.type); }
    if (data.description !== undefined) { updates.push('description = ?'); values.push(data.description); }
    if (data.icon !== undefined) { updates.push('icon = ?'); values.push(data.icon); }
    if (data.heroTitle !== undefined) { updates.push('hero_title = ?'); values.push(data.heroTitle); }
    if (data.heroHighlightText !== undefined) { updates.push('hero_highlight_text = ?'); values.push(data.heroHighlightText); }
    if (data.heroSubtitle !== undefined) { updates.push('hero_subtitle = ?'); values.push(data.heroSubtitle); }
    if (data.hotSearchTags !== undefined) { updates.push('hot_search_tags = ?'); values.push(JSON.stringify(data.hotSearchTags)); }
    if (data.heroBgType !== undefined) { updates.push('hero_bg_type = ?'); values.push(data.heroBgType); }
    if (data.heroBgValue !== undefined) { updates.push('hero_bg_value = ?'); values.push(data.heroBgValue); }
    if (data.heroDisplayMode !== undefined) { updates.push('hero_display_mode = ?'); values.push(data.heroDisplayMode); }
    if (data.heroScrollWebsites !== undefined) { updates.push('hero_scroll_websites = ?'); values.push(JSON.stringify(data.heroScrollWebsites)); }
    if (data.searchPlaceholder !== undefined) { updates.push('search_placeholder = ?'); values.push(data.searchPlaceholder); }
    if (data.searchEnabled !== undefined) { updates.push('search_enabled = ?'); values.push(data.searchEnabled ? 1 : 0); }
    if (data.showHotRecommendations !== undefined) { updates.push('show_hot_recommendations = ?'); values.push(data.showHotRecommendations ? 1 : 0); }
    if (data.showCategories !== undefined) { updates.push('show_categories = ?'); values.push(data.showCategories ? 1 : 0); }
    if (data.showSidebar !== undefined) { updates.push('show_sidebar = ?'); values.push(data.showSidebar ? 1 : 0); }
    if (data.themeColor !== undefined) { updates.push('theme_color = ?'); values.push(data.themeColor); }
    if (data.sortOrder !== undefined) { updates.push('sort = ?'); values.push(data.sortOrder); }
    if (data.isActive !== undefined) { updates.push('is_show = ?'); values.push(data.isActive ? 1 : 0); }

    updates.push('update_time = ?');
    values.push(now);
    values.push(data.id);

    await app.model.query(
      `UPDATE uied_page SET ${updates.join(', ')} WHERE id = ?`,
      { replacements: values, type: app.Sequelize.QueryTypes.UPDATE }
    );

    return data;
  }

  /**
   * 删除页面
   */
  async del(id) {
    const { app } = this;
    const now = Math.floor(Date.now() / 1000);

    await app.model.query(
      'UPDATE uied_page SET is_delete = 1, delete_time = ? WHERE id = ?',
      { replacements: [ now, id ], type: app.Sequelize.QueryTypes.UPDATE }
    );
  }

  /**
   * 安全解析 JSON（兼容逗号分隔字符串）
   */
  safeJsonParse(str, defaultValue = []) {
    if (!str) return defaultValue;
    try {
      return JSON.parse(str);
    } catch (error) {
      // 如果不是 JSON，按逗号分隔处理
      if (typeof str === 'string') {
        return str.split(',').map(s => s.trim()).filter(Boolean);
      }
      return defaultValue;
    }
  }

  /**
   * 获取页面分类
   */
  async getCategories(pageId, pageSlug) {
    const { app } = this;

    let query = `
      SELECT c.id, c.name, c.slug, pc.sort as sortOrder
      FROM uied_category c
      INNER JOIN uied_page_category pc ON c.id = pc.category_id
      INNER JOIN uied_page p ON pc.page_id = p.id
      WHERE pc.is_delete = 0 AND c.is_delete = 0
    `;
    const replacements = [];

    if (pageId) {
      query += ' AND p.id = ?';
      replacements.push(pageId);
    } else if (pageSlug) {
      query += ' AND p.slug = ?';
      replacements.push(pageSlug);
    }

    query += ' ORDER BY pc.sort ASC';

    return await app.model.query(query, { replacements, type: app.Sequelize.QueryTypes.SELECT });
  }

  /**
   * 更新页面分类
   */
  async updateCategories(pageId, categoryIds) {
    const { app } = this;
    const now = Math.floor(Date.now() / 1000);

    // 软删除现有关联
    await app.model.query(
      'UPDATE uied_page_category SET is_delete = 1, delete_time = ? WHERE page_id = ?',
      { replacements: [ now, pageId ], type: app.Sequelize.QueryTypes.UPDATE }
    );

    // 添加新关联
    for (let i = 0; i < categoryIds.length; i++) {
      await app.model.query(
        `INSERT INTO uied_page_category (page_id, category_id, sort, create_time, update_time)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE is_delete = 0, sort = ?, update_time = ?`,
        { replacements: [ pageId, categoryIds[i], i, now, now, i, now ], type: app.Sequelize.QueryTypes.INSERT }
      );
    }
  }
}

module.exports = PageService;
