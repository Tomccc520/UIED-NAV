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
    const [countResult] = await app.model.query(
      'SELECT COUNT(*) as total FROM uied_page WHERE is_delete = 0',
      { type: app.Sequelize.QueryTypes.SELECT }
    );
    const total = countResult.total;
    
    // 获取列表
    const pages = await app.model.query(
      `SELECT id, name, slug, title, description, icon, hero_title as heroTitle,
              hero_subtitle as heroSubtitle, hero_bg_image as heroBgImage,
              seo_title as seoTitle, seo_description as seoDescription, seo_keywords as seoKeywords,
              sort as sortOrder, is_show as isActive, create_time as createdAt
       FROM uied_page
       WHERE is_delete = 0
       ORDER BY sort ASC, id ASC
       LIMIT ? OFFSET ?`,
      { replacements: [pageSize, offset], type: app.Sequelize.QueryTypes.SELECT }
    );
    
    const lists = pages.map(p => ({
      ...p,
      isActive: p.isActive === 1,
    }));
    
    return { lists, count: total, page, pageSize };
  }

  /**
   * 获取所有页面
   */
  async all() {
    const { app } = this;
    const pages = await app.model.query(
      `SELECT id, name, slug, title, icon, sort as sortOrder
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
    
    const [page] = await app.model.query(
      `SELECT * FROM uied_page WHERE ${whereClause}`,
      { replacements, type: app.Sequelize.QueryTypes.SELECT }
    );
    
    if (!page) return null;
    
    return {
      id: page.id,
      name: page.name,
      slug: page.slug,
      title: page.title,
      description: page.description,
      icon: page.icon,
      heroTitle: page.hero_title,
      heroSubtitle: page.hero_subtitle,
      heroBgImage: page.hero_bg_image,
      heroConfig: page.hero_config ? JSON.parse(page.hero_config) : null,
      seoTitle: page.seo_title,
      seoDescription: page.seo_description,
      seoKeywords: page.seo_keywords,
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
    const [existing] = await app.model.query(
      'SELECT id FROM uied_page WHERE slug = ? AND is_delete = 0',
      { replacements: [data.slug], type: app.Sequelize.QueryTypes.SELECT }
    );
    if (existing) {
      throw new Error('页面别名已存在');
    }
    
    const [result] = await app.model.query(
      `INSERT INTO uied_page (name, slug, title, description, icon, hero_title, hero_subtitle,
        hero_bg_image, hero_config, seo_title, seo_description, seo_keywords, sort, is_show,
        create_time, update_time)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      {
        replacements: [
          data.name, data.slug, data.title || data.name, data.description || '',
          data.icon || '', data.heroTitle || '', data.heroSubtitle || '',
          data.heroBgImage || '', data.heroConfig ? JSON.stringify(data.heroConfig) : null,
          data.seoTitle || '', data.seoDescription || '', data.seoKeywords || '',
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
    if (data.title !== undefined) { updates.push('title = ?'); values.push(data.title); }
    if (data.description !== undefined) { updates.push('description = ?'); values.push(data.description); }
    if (data.icon !== undefined) { updates.push('icon = ?'); values.push(data.icon); }
    if (data.heroTitle !== undefined) { updates.push('hero_title = ?'); values.push(data.heroTitle); }
    if (data.heroSubtitle !== undefined) { updates.push('hero_subtitle = ?'); values.push(data.heroSubtitle); }
    if (data.heroBgImage !== undefined) { updates.push('hero_bg_image = ?'); values.push(data.heroBgImage); }
    if (data.heroConfig !== undefined) { updates.push('hero_config = ?'); values.push(JSON.stringify(data.heroConfig)); }
    if (data.seoTitle !== undefined) { updates.push('seo_title = ?'); values.push(data.seoTitle); }
    if (data.seoDescription !== undefined) { updates.push('seo_description = ?'); values.push(data.seoDescription); }
    if (data.seoKeywords !== undefined) { updates.push('seo_keywords = ?'); values.push(data.seoKeywords); }
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
      { replacements: [now, id], type: app.Sequelize.QueryTypes.UPDATE }
    );
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
      { replacements: [now, pageId], type: app.Sequelize.QueryTypes.UPDATE }
    );
    
    // 添加新关联
    for (let i = 0; i < categoryIds.length; i++) {
      await app.model.query(
        `INSERT INTO uied_page_category (page_id, category_id, sort, create_time, update_time)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE is_delete = 0, sort = ?, update_time = ?`,
        { replacements: [pageId, categoryIds[i], i, now, now, i, now], type: app.Sequelize.QueryTypes.INSERT }
      );
    }
  }
}

module.exports = PageService;
