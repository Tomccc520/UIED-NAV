/**
 * @file service/uied/faviconApi.js
 * @description UIED Favicon API 配置服务
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

'use strict';

const Service = require('egg').Service;

class FaviconApiService extends Service {
  async list(params = {}) {
    const { app } = this;
    const page = parseInt(params.pageNo) || 1;
    const pageSize = parseInt(params.pageSize) || 20;
    const offset = (page - 1) * pageSize;

    const [countResult] = await app.model.query(
      'SELECT COUNT(*) as total FROM uied_favicon_api',
      { type: app.Sequelize.QueryTypes.SELECT }
    );

    const lists = await app.model.query(
      `SELECT * FROM uied_favicon_api ORDER BY is_default DESC, sort_order ASC, id ASC LIMIT ? OFFSET ?`,
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
      'SELECT * FROM uied_favicon_api WHERE id = ?',
      { replacements: [id], type: app.Sequelize.QueryTypes.SELECT }
    );
    return item ? this.formatItem(item) : null;
  }

  async add(data) {
    const { app } = this;
    const now = Math.floor(Date.now() / 1000);

    const [result] = await app.model.query(
      `INSERT INTO uied_favicon_api (name, url_template, description, sort_order, is_active, is_default, create_time, update_time)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      {
        replacements: [
          data.name || '', data.urlTemplate || '', data.description || '',
          data.sortOrder || 0, data.isActive !== false ? 1 : 0, data.isDefault ? 1 : 0, now, now,
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
      `UPDATE uied_favicon_api SET name = ?, url_template = ?, description = ?,
       sort_order = ?, is_active = ?, is_default = ?, update_time = ? WHERE id = ?`,
      {
        replacements: [
          data.name || '', data.urlTemplate || '', data.description || '',
          data.sortOrder || 0, data.isActive !== false ? 1 : 0, data.isDefault ? 1 : 0, now, data.id,
        ],
        type: app.Sequelize.QueryTypes.UPDATE,
      }
    );
  }

  async del(id) {
    const { app } = this;
    await app.model.query('DELETE FROM uied_favicon_api WHERE id = ?', {
      replacements: [id],
      type: app.Sequelize.QueryTypes.DELETE,
    });
  }

  async setDefault(id) {
    const { app } = this;
    const now = Math.floor(Date.now() / 1000);

    // 先取消所有默认
    await app.model.query('UPDATE uied_favicon_api SET is_default = 0, update_time = ?', {
      replacements: [now],
      type: app.Sequelize.QueryTypes.UPDATE,
    });

    // 设置新默认
    await app.model.query('UPDATE uied_favicon_api SET is_default = 1, update_time = ? WHERE id = ?', {
      replacements: [now, id],
      type: app.Sequelize.QueryTypes.UPDATE,
    });
  }

  formatItem(item) {
    return {
      id: item.id,
      name: item.name,
      urlTemplate: item.url_template,
      description: item.description,
      sortOrder: item.sort_order,
      isActive: item.is_active === 1,
      isDefault: item.is_default === 1,
      createTime: item.create_time,
      updateTime: item.update_time,
    };
  }
}

module.exports = FaviconApiService;
