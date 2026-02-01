/**
 * @file service/uied/banner.js
 * @description UIED 广告管理服务
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

'use strict';

const Service = require('egg').Service;

class BannerService extends Service {
  async list(params = {}) {
    const { app } = this;
    const page = parseInt(params.pageNo) || 1;
    const pageSize = parseInt(params.pageSize) || 20;
    const offset = (page - 1) * pageSize;

    const [countResult] = await app.model.query(
      'SELECT COUNT(*) as total FROM uied_banner',
      { type: app.Sequelize.QueryTypes.SELECT }
    );

    const lists = await app.model.query(
      `SELECT * FROM uied_banner ORDER BY sort_order ASC, id ASC LIMIT ? OFFSET ?`,
      { replacements: [pageSize, offset], type: app.Sequelize.QueryTypes.SELECT }
    );

    return {
      lists: lists.map(this.formatItem),
      count: countResult.total,
      pageNo: page,
      pageSize,
    };
  }

  async detail(id) {
    const { app } = this;
    const [item] = await app.model.query(
      'SELECT * FROM uied_banner WHERE id = ?',
      { replacements: [id], type: app.Sequelize.QueryTypes.SELECT }
    );
    return item ? this.formatItem(item) : null;
  }

  async add(data) {
    const { app } = this;
    const now = Math.floor(Date.now() / 1000);

    const [result] = await app.model.query(
      `INSERT INTO uied_banner (title, image, url, position, sort_order, is_active, start_time, end_time, create_time, update_time)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      {
        replacements: [
          data.title || '', data.image || '', data.url || '', data.position || 'home',
          data.sortOrder || 0, data.isActive !== false ? 1 : 0,
          data.startTime || null, data.endTime || null, now, now,
        ],
        type: app.Sequelize.QueryTypes.INSERT,
      }
    );

    return { id: result };
  }

  async edit(data) {
    const { app } = this;
    const now = Math.floor(Date.now() / 1000);

    await app.model.query(
      `UPDATE uied_banner SET title = ?, image = ?, url = ?, position = ?,
       sort_order = ?, is_active = ?, start_time = ?, end_time = ?, update_time = ? WHERE id = ?`,
      {
        replacements: [
          data.title || '', data.image || '', data.url || '', data.position || 'home',
          data.sortOrder || 0, data.isActive !== false ? 1 : 0,
          data.startTime || null, data.endTime || null, now, data.id,
        ],
        type: app.Sequelize.QueryTypes.UPDATE,
      }
    );
  }

  async del(id) {
    const { app } = this;
    await app.model.query('DELETE FROM uied_banner WHERE id = ?', {
      replacements: [id],
      type: app.Sequelize.QueryTypes.DELETE,
    });
  }

  formatItem(item) {
    return {
      id: item.id,
      title: item.title,
      image: item.image,
      url: item.url,
      position: item.position,
      sortOrder: item.sort_order,
      isActive: item.is_active === 1,
      startTime: item.start_time,
      endTime: item.end_time,
      createTime: item.create_time,
      updateTime: item.update_time,
    };
  }
}

module.exports = BannerService;
