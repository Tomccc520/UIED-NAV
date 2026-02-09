/**
 * @file service/uied/hotRecommendation.js
 * @description UIED 热门推荐服务
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

'use strict';

const Service = require('egg').Service;

class HotRecommendationService extends Service {
  /**
   * 获取热门推荐列表
   */
  async list({ page = 1, pageSize = 20, position, pageSlug }) {
    const { app } = this;
    const offset = (page - 1) * pageSize;
    
    let whereClause = 'is_delete = 0';
    const replacements = [];
    
    if (position) {
      whereClause += ' AND position = ?';
      replacements.push(position);
    }
    
    if (pageSlug) {
      whereClause += ' AND page_slug = ?';
      replacements.push(pageSlug);
    }
    
    // 获取总数
    const [countResult] = await app.model.query(
      `SELECT COUNT(*) as total FROM uied_hot_recommendation WHERE ${whereClause}`,
      { replacements, type: app.Sequelize.QueryTypes.SELECT }
    );
    
    // 获取列表 - 映射字段名以兼容 Vue 管理后台
    const items = await app.model.query(
      `SELECT id, name as websiteName, name as title, description, url as websiteUrl, 
              icon_url as websiteIcon, icon_url as iconUrl, page_slug as pageSlug,
              position, sort as sortOrder, is_show as isActive, click_count as clickCount,
              create_time as createdAt
       FROM uied_hot_recommendation
       WHERE ${whereClause}
       ORDER BY sort ASC, id DESC
       LIMIT ? OFFSET ?`,
      { replacements: [...replacements, pageSize, offset], type: app.Sequelize.QueryTypes.SELECT }
    );
    
    const lists = items.map(item => ({
      ...item,
      isActive: item.isActive === 1,
    }));
    
    return { lists, count: countResult.total, page, pageSize };
  }

  /**
   * 获取热门推荐详情
   */
  async detail(id) {
    const { app } = this;
    
    const [item] = await app.model.query(
      `SELECT id, name, description, url, icon_url as iconUrl, page_slug as pageSlug,
              position, sort as sortOrder, is_show as isShow, click_count as clickCount,
              create_time as createdAt
       FROM uied_hot_recommendation
       WHERE id = ? AND is_delete = 0`,
      { replacements: [id], type: app.Sequelize.QueryTypes.SELECT }
    );
    
    if (!item) return null;
    
    return {
      ...item,
      isShow: item.isShow === 1,
    };
  }

  /**
   * 创建热门推荐
   */
  async add(data) {
    const { app } = this;
    const now = Math.floor(Date.now() / 1000);
    
    const [result] = await app.model.query(
      `INSERT INTO uied_hot_recommendation (name, description, url, icon_url, page_slug, position, sort, is_show, create_time, update_time)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      {
        replacements: [
          data.name,
          data.description || '',
          data.url,
          data.iconUrl || null,
          data.pageSlug || null,
          data.position || 'hot',
          data.sortOrder || 0,
          data.isShow !== false ? 1 : 0,
          now,
          now,
        ],
        type: app.Sequelize.QueryTypes.INSERT,
      }
    );
    
    return { id: result, ...data };
  }

  /**
   * 更新热门推荐
   */
  async edit(data) {
    const { app } = this;
    const now = Math.floor(Date.now() / 1000);
    
    const updates = [];
    const values = [];
    
    if (data.name !== undefined) { updates.push('name = ?'); values.push(data.name); }
    if (data.description !== undefined) { updates.push('description = ?'); values.push(data.description); }
    if (data.url !== undefined) { updates.push('url = ?'); values.push(data.url); }
    if (data.iconUrl !== undefined) { updates.push('icon_url = ?'); values.push(data.iconUrl); }
    if (data.pageSlug !== undefined) { updates.push('page_slug = ?'); values.push(data.pageSlug); }
    if (data.position !== undefined) { updates.push('position = ?'); values.push(data.position); }
    if (data.sortOrder !== undefined) { updates.push('sort = ?'); values.push(data.sortOrder); }
    if (data.isShow !== undefined) { updates.push('is_show = ?'); values.push(data.isShow ? 1 : 0); }
    
    updates.push('update_time = ?');
    values.push(now);
    values.push(data.id);
    
    await app.model.query(
      `UPDATE uied_hot_recommendation SET ${updates.join(', ')} WHERE id = ?`,
      { replacements: values, type: app.Sequelize.QueryTypes.UPDATE }
    );
    
    return data;
  }

  /**
   * 删除热门推荐
   */
  async del(id) {
    const { app } = this;
    const now = Math.floor(Date.now() / 1000);
    
    await app.model.query(
      'UPDATE uied_hot_recommendation SET is_delete = 1, delete_time = ? WHERE id = ?',
      { replacements: [now, id], type: app.Sequelize.QueryTypes.UPDATE }
    );
  }

  /**
   * 获取激活的热门推荐（前端调用）
   * 返回字段与前端 useHotRecommendations hook 期望的格式一致
   */
  async getActive(position, limit = 20) {
    const { app } = this;
    
    let whereClause = 'hr.is_delete = 0 AND hr.is_show = 1';
    const replacements = [];
    
    if (position && position !== 'all') {
      whereClause += ' AND hr.position = ?';
      replacements.push(position);
    }
    
    // LEFT JOIN uied_website 通过 URL 匹配，获取真实的 website_id 和 slug
    const items = await app.model.query(
      `SELECT hr.id, hr.name, hr.description, hr.url, hr.icon_url as iconUrl, 
              hr.page_slug as pageSlug, hr.position, hr.sort as 'order', 
              hr.is_show as visible, hr.click_count as clickCount,
              w.id as websiteId, w.slug as websiteSlug
       FROM uied_hot_recommendation hr
       LEFT JOIN uied_website w ON hr.url = w.url AND w.is_delete = 0
       WHERE ${whereClause}
       ORDER BY hr.sort ASC, hr.id DESC
       LIMIT ?`,
      { replacements: [...replacements, limit], type: app.Sequelize.QueryTypes.SELECT }
    );
    
    // 转换 visible 为布尔值
    return items.map(item => ({
      ...item,
      visible: item.visible === 1,
      websiteId: item.websiteId || null,
      websiteSlug: item.websiteSlug || null,
    }));
  }

  /**
   * 记录热门推荐点击
   */
  async recordClick(id) {
    const { app } = this;
    
    await app.model.query(
      'UPDATE uied_hot_recommendation SET click_count = click_count + 1 WHERE id = ?',
      { replacements: [id], type: app.Sequelize.QueryTypes.UPDATE }
    );
  }
}

module.exports = HotRecommendationService;
