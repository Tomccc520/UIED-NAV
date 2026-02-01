/**
 * @file service/uied/friendLink.js
 * @description UIED 友情链接服务
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

'use strict';

const Service = require('egg').Service;

class FriendLinkService extends Service {
  async list(params = {}) {
    const { app } = this;
    const page = parseInt(params.pageNo) || 1;
    const pageSize = parseInt(params.pageSize) || 20;
    const offset = (page - 1) * pageSize;

    const [countResult] = await app.model.query(
      'SELECT COUNT(*) as total FROM uied_friend_link',
      { type: app.Sequelize.QueryTypes.SELECT }
    );

    const lists = await app.model.query(
      `SELECT * FROM uied_friend_link ORDER BY sort_order ASC, id ASC LIMIT ? OFFSET ?`,
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
      'SELECT * FROM uied_friend_link WHERE id = ?',
      { replacements: [id], type: app.Sequelize.QueryTypes.SELECT }
    );
    return item ? this.formatItem(item) : null;
  }

  async add(data) {
    const { app } = this;
    const now = Math.floor(Date.now() / 1000);

    const [result] = await app.model.query(
      `INSERT INTO uied_friend_link (name, url, logo, description, sort_order, is_active, create_time, update_time)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      {
        replacements: [
          data.name || '', data.url || '', data.logo || '', data.description || '',
          data.sortOrder || 0, data.isActive !== false ? 1 : 0, now, now,
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
      `UPDATE uied_friend_link SET name = ?, url = ?, logo = ?, description = ?,
       sort_order = ?, is_active = ?, update_time = ? WHERE id = ?`,
      {
        replacements: [
          data.name || '', data.url || '', data.logo || '', data.description || '',
          data.sortOrder || 0, data.isActive !== false ? 1 : 0, now, data.id,
        ],
        type: app.Sequelize.QueryTypes.UPDATE,
      }
    );
  }

  async del(id) {
    const { app } = this;
    await app.model.query('DELETE FROM uied_friend_link WHERE id = ?', {
      replacements: [id],
      type: app.Sequelize.QueryTypes.DELETE,
    });
  }

  formatItem(item) {
    return {
      id: item.id,
      name: item.name,
      url: item.url,
      logo: item.logo,
      description: item.description,
      sortOrder: item.sort_order,
      isActive: item.is_active === 1,
      createTime: item.create_time,
      updateTime: item.update_time,
    };
  }
}

module.exports = FriendLinkService;
