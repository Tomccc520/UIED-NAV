/**
 * @file service/uied/website.js
 * @description UIED 网站管理服务
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

'use strict';

const Service = require('egg').Service;

class WebsiteService extends Service {
  /**
   * 获取网站列表（分页）
   */
  async list({ page = 1, pageSize = 20, categoryId, keyword, status }) {
    const { app } = this;
    const offset = (page - 1) * pageSize;
    
    // 构建查询条件
    let whereClause = 'w.is_delete = 0';
    const replacements = [];
    
    if (categoryId) {
      whereClause += ' AND w.category_id = ?';
      replacements.push(categoryId);
    }
    
    if (keyword) {
      whereClause += ' AND (w.name LIKE ? OR w.description LIKE ? OR w.url LIKE ?)';
      const likeKeyword = `%${keyword}%`;
      replacements.push(likeKeyword, likeKeyword, likeKeyword);
    }
    
    if (status) {
      whereClause += ' AND w.status = ?';
      replacements.push(status);
    }
    
    // 获取总数
    const [countResult] = await app.model.query(
      `SELECT COUNT(*) as total FROM uied_website w WHERE ${whereClause}`,
      { replacements, type: app.Sequelize.QueryTypes.SELECT }
    );
    const total = countResult.total;
    
    // 获取列表
    const websites = await app.model.query(
      `SELECT w.id, w.name, w.slug, w.description, w.url, w.icon_url as iconUrl,
              w.category_id as categoryId, c.name as categoryName,
              w.is_new as isNew, w.is_featured as isFeatured, w.is_hot as isHot, w.is_pinned as isPinned,
              w.tags, w.sort as \`order\`, w.click_count as clickCount,
              w.status, w.create_time as createdAt
       FROM uied_website w
       LEFT JOIN uied_category c ON w.category_id = c.id
       WHERE ${whereClause}
       ORDER BY w.is_pinned DESC, w.sort ASC, w.id DESC
       LIMIT ? OFFSET ?`,
      { replacements: [...replacements, pageSize, offset], type: app.Sequelize.QueryTypes.SELECT }
    );
    
    // 转换布尔值和解析 tags
    const list = websites.map(w => ({
      ...w,
      isNew: w.isNew === 1,
      isFeatured: w.isFeatured === 1,
      isHot: w.isHot === 1,
      isPinned: w.isPinned === 1,
      tags: w.tags ? JSON.parse(w.tags) : [],
    }));
    
    return {
      lists: list,
      count: total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }


  /**
   * 获取网站详情
   */
  async detail(id, slug) {
    const { app } = this;
    
    let whereClause = 'w.is_delete = 0';
    const replacements = [];
    
    if (id) {
      whereClause += ' AND w.id = ?';
      replacements.push(id);
    } else if (slug) {
      whereClause += ' AND w.slug = ?';
      replacements.push(slug);
    }
    
    const [website] = await app.model.query(
      `SELECT w.*, c.name as categoryName, c.slug as categorySlug
       FROM uied_website w
       LEFT JOIN uied_category c ON w.category_id = c.id
       WHERE ${whereClause}`,
      { replacements, type: app.Sequelize.QueryTypes.SELECT }
    );
    
    if (!website) return null;
    
    // 转换字段名和类型
    return {
      id: website.id,
      name: website.name,
      slug: website.slug,
      description: website.description,
      url: website.url,
      iconUrl: website.icon_url,
      categoryId: website.category_id,
      categoryName: website.categoryName,
      categorySlug: website.categorySlug,
      isNew: website.is_new === 1,
      isFeatured: website.is_featured === 1,
      isHot: website.is_hot === 1,
      isPinned: website.is_pinned === 1,
      tags: website.tags ? JSON.parse(website.tags) : [],
      order: website.sort,
      clickCount: website.click_count,
      seoTitle: website.seo_title,
      seoDescription: website.seo_description,
      seoKeywords: website.seo_keywords,
      detailContent: website.detail_content,
      screenshots: website.screenshots ? JSON.parse(website.screenshots) : [],
      visitBtnText: website.visit_btn_text,
      status: website.status,
      createdAt: website.create_time,
      updatedAt: website.update_time,
    };
  }

  /**
   * 创建网站
   */
  async add(data) {
    const { app } = this;
    const now = Math.floor(Date.now() / 1000);
    
    // 检查 slug 是否已存在
    if (data.slug) {
      const [existing] = await app.model.query(
        'SELECT id FROM uied_website WHERE slug = ? AND is_delete = 0',
        { replacements: [data.slug], type: app.Sequelize.QueryTypes.SELECT }
      );
      if (existing) {
        throw new Error('网站别名已存在');
      }
    }
    
    const [result] = await app.model.query(
      `INSERT INTO uied_website (name, slug, description, url, icon_url, category_id,
        is_new, is_featured, is_hot, is_pinned, tags, sort, click_count,
        seo_title, seo_description, seo_keywords, detail_content, screenshots, visit_btn_text,
        status, create_time, update_time)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      {
        replacements: [
          data.name,
          data.slug || null,
          data.description || '',
          data.url,
          data.iconUrl || null,
          data.categoryId,
          data.isNew ? 1 : 0,
          data.isFeatured ? 1 : 0,
          data.isHot ? 1 : 0,
          data.isPinned ? 1 : 0,
          data.tags ? JSON.stringify(data.tags) : '[]',
          data.order || 0,
          0,
          data.seoTitle || null,
          data.seoDescription || null,
          data.seoKeywords || null,
          data.detailContent || null,
          data.screenshots ? JSON.stringify(data.screenshots) : null,
          data.visitBtnText || null,
          'unchecked',
          now,
          now,
        ],
        type: app.Sequelize.QueryTypes.INSERT,
      }
    );
    
    return { id: result, ...data };
  }


  /**
   * 更新网站
   */
  async edit(data) {
    const { app } = this;
    const now = Math.floor(Date.now() / 1000);
    
    // 检查网站是否存在
    const [existing] = await app.model.query(
      'SELECT id FROM uied_website WHERE id = ? AND is_delete = 0',
      { replacements: [data.id], type: app.Sequelize.QueryTypes.SELECT }
    );
    if (!existing) {
      throw new Error('网站不存在');
    }
    
    // 检查 slug 是否被其他网站使用
    if (data.slug) {
      const [slugExists] = await app.model.query(
        'SELECT id FROM uied_website WHERE slug = ? AND id != ? AND is_delete = 0',
        { replacements: [data.slug, data.id], type: app.Sequelize.QueryTypes.SELECT }
      );
      if (slugExists) {
        throw new Error('网站别名已存在');
      }
    }
    
    // 构建更新字段
    const updates = [];
    const values = [];
    
    if (data.name !== undefined) { updates.push('name = ?'); values.push(data.name); }
    if (data.slug !== undefined) { updates.push('slug = ?'); values.push(data.slug); }
    if (data.description !== undefined) { updates.push('description = ?'); values.push(data.description); }
    if (data.url !== undefined) { updates.push('url = ?'); values.push(data.url); }
    if (data.iconUrl !== undefined) { updates.push('icon_url = ?'); values.push(data.iconUrl); }
    if (data.categoryId !== undefined) { updates.push('category_id = ?'); values.push(data.categoryId); }
    if (data.isNew !== undefined) { updates.push('is_new = ?'); values.push(data.isNew ? 1 : 0); }
    if (data.isFeatured !== undefined) { updates.push('is_featured = ?'); values.push(data.isFeatured ? 1 : 0); }
    if (data.isHot !== undefined) { updates.push('is_hot = ?'); values.push(data.isHot ? 1 : 0); }
    if (data.isPinned !== undefined) { updates.push('is_pinned = ?'); values.push(data.isPinned ? 1 : 0); }
    if (data.tags !== undefined) { updates.push('tags = ?'); values.push(JSON.stringify(data.tags)); }
    if (data.order !== undefined) { updates.push('sort = ?'); values.push(data.order); }
    if (data.seoTitle !== undefined) { updates.push('seo_title = ?'); values.push(data.seoTitle); }
    if (data.seoDescription !== undefined) { updates.push('seo_description = ?'); values.push(data.seoDescription); }
    if (data.seoKeywords !== undefined) { updates.push('seo_keywords = ?'); values.push(data.seoKeywords); }
    if (data.detailContent !== undefined) { updates.push('detail_content = ?'); values.push(data.detailContent); }
    if (data.screenshots !== undefined) { updates.push('screenshots = ?'); values.push(JSON.stringify(data.screenshots)); }
    if (data.visitBtnText !== undefined) { updates.push('visit_btn_text = ?'); values.push(data.visitBtnText); }
    
    updates.push('update_time = ?');
    values.push(now);
    values.push(data.id);
    
    await app.model.query(
      `UPDATE uied_website SET ${updates.join(', ')} WHERE id = ?`,
      { replacements: values, type: app.Sequelize.QueryTypes.UPDATE }
    );
    
    return data;
  }

  /**
   * 删除网站
   */
  async del(id) {
    const { app } = this;
    const now = Math.floor(Date.now() / 1000);
    
    await app.model.query(
      'UPDATE uied_website SET is_delete = 1, delete_time = ? WHERE id = ?',
      { replacements: [now, id], type: app.Sequelize.QueryTypes.UPDATE }
    );
  }

  /**
   * 批量删除网站
   */
  async batchDel(ids) {
    const { app } = this;
    const now = Math.floor(Date.now() / 1000);
    
    await app.model.query(
      `UPDATE uied_website SET is_delete = 1, delete_time = ? WHERE id IN (${ids.join(',')})`,
      { replacements: [now], type: app.Sequelize.QueryTypes.UPDATE }
    );
  }

  /**
   * 增加点击次数
   */
  async incrementClick(id) {
    const { app } = this;
    await app.model.query(
      'UPDATE uied_website SET click_count = click_count + 1 WHERE id = ?',
      { replacements: [id], type: app.Sequelize.QueryTypes.UPDATE }
    );
  }

  /**
   * 搜索网站
   */
  async search({ keyword, pageSlug, page = 1, pageSize = 20 }) {
    const { app } = this;
    const offset = (page - 1) * pageSize;
    const likeKeyword = `%${keyword}%`;
    
    let whereClause = 'w.is_delete = 0 AND (w.name LIKE ? OR w.description LIKE ? OR w.tags LIKE ?)';
    const replacements = [likeKeyword, likeKeyword, likeKeyword];
    
    // 如果指定了页面，只搜索该页面的分类下的网站
    if (pageSlug) {
      whereClause += ` AND w.category_id IN (
        SELECT pc.category_id FROM uied_page_category pc
        INNER JOIN uied_page p ON pc.page_id = p.id
        WHERE p.slug = ? AND pc.is_delete = 0
      )`;
      replacements.push(pageSlug);
    }
    
    // 获取总数
    const [countResult] = await app.model.query(
      `SELECT COUNT(*) as total FROM uied_website w WHERE ${whereClause}`,
      { replacements, type: app.Sequelize.QueryTypes.SELECT }
    );
    
    // 获取列表
    const websites = await app.model.query(
      `SELECT w.id, w.name, w.slug, w.description, w.url, w.icon_url as iconUrl,
              w.category_id as categoryId, c.name as categoryName,
              w.is_new as isNew, w.is_featured as isFeatured, w.is_hot as isHot,
              w.tags, w.click_count as clickCount
       FROM uied_website w
       LEFT JOIN uied_category c ON w.category_id = c.id
       WHERE ${whereClause}
       ORDER BY w.click_count DESC, w.id DESC
       LIMIT ? OFFSET ?`,
      { replacements: [...replacements, pageSize, offset], type: app.Sequelize.QueryTypes.SELECT }
    );
    
    const list = websites.map(w => ({
      ...w,
      isNew: w.isNew === 1,
      isFeatured: w.isFeatured === 1,
      isHot: w.isHot === 1,
      tags: w.tags ? JSON.parse(w.tags) : [],
    }));
    
    return {
      lists: list,
      count: countResult.total,
      page,
      pageSize,
    };
  }
}

module.exports = WebsiteService;
