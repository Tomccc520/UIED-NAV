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
  async list({ page = 1, pageSize = 20, position }) {
    const { app } = this;
    const offset = (page - 1) * pageSize;
    
    let whereClause = 'hr.is_delete = 0';
    const replacements = [];
    
    if (position) {
      whereClause += ' AND hr.position = ?';
      replacements.push(position);
    }
    
    // 获取总数
    const [countResult] = await app.model.query(
      `SELECT COUNT(*) as total FROM uied_hot_recommendation hr WHERE ${whereClause}`,
      { replacements, type: app.Sequelize.QueryTypes.SELECT }
    );
    
    // 获取列表
    const items = await app.model.query(
      `SELECT hr.id, hr.website_id as websiteId, w.name as websiteName, w.url as websiteUrl,
              w.icon_url as websiteIcon, hr.title, hr.description, hr.icon, hr.position,
              hr.sort as sortOrder, hr.is_active as isActive, hr.create_time as createdAt
       FROM uied_hot_recommendation hr
       LEFT JOIN uied_website w ON hr.website_id = w.id
       WHERE ${whereClause}
       ORDER BY hr.sort ASC, hr.id DESC
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
      `SELECT hr.*, w.name as websiteName, w.url as websiteUrl
       FROM uied_hot_recommendation hr
       LEFT JOIN uied_website w ON hr.website_id = w.id
       WHERE hr.id = ? AND hr.is_delete = 0`,
      { replacements: [id], type: app.Sequelize.QueryTypes.SELECT }
    );
    
    if (!item) return null;
    
    return {
      id: item.id,
      websiteId: item.website_id,
      websiteName: item.websiteName,
      websiteUrl: item.websiteUrl,
      title: item.title,
      description: item.description,
      icon: item.icon,
      position: item.position,
      sortOrder: item.sort,
      isActive: item.is_active === 1,
      createdAt: item.create_time,
    };
  }

  /**
   * 创建热门推荐
   */
  async add(data) {
    const { app } = this;
    const now = Math.floor(Date.now() / 1000);
    
    const [result] = await app.model.query(
      `INSERT INTO uied_hot_recommendation (website_id, title, description, icon, position, sort, is_active, create_time, update_time)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      {
        replacements: [
          data.websiteId, data.title || '', data.description || '', data.icon || '',
          data.position || 'sidebar', data.sortOrder || 0, data.isActive !== false ? 1 : 0,
          now, now,
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
    
    if (data.websiteId !== undefined) { updates.push('website_id = ?'); values.push(data.websiteId); }
    if (data.title !== undefined) { updates.push('title = ?'); values.push(data.title); }
    if (data.description !== undefined) { updates.push('description = ?'); values.push(data.description); }
    if (data.icon !== undefined) { updates.push('icon = ?'); values.push(data.icon); }
    if (data.position !== undefined) { updates.push('position = ?'); values.push(data.position); }
    if (data.sortOrder !== undefined) { updates.push('sort = ?'); values.push(data.sortOrder); }
    if (data.isActive !== undefined) { updates.push('is_active = ?'); values.push(data.isActive ? 1 : 0); }
    
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
}

module.exports = HotRecommendationService;
