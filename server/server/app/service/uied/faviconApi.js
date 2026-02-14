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
    const pageSize = parseInt(params.pageSize) || 15;
    const offset = (page - 1) * pageSize;

    const [ countResult ] = await app.model.query(
      'SELECT COUNT(*) as total FROM uied_favicon_api WHERE is_delete = 0',
      { type: app.Sequelize.QueryTypes.SELECT }
    );

    const lists = await app.model.query(
      'SELECT * FROM uied_favicon_api WHERE is_delete = 0 ORDER BY sort ASC, id ASC LIMIT ? OFFSET ?',
      { replacements: [ pageSize, offset ], type: app.Sequelize.QueryTypes.SELECT }
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
    const [ item ] = await app.model.query(
      'SELECT * FROM uied_favicon_api WHERE id = ? AND is_delete = 0',
      { replacements: [ id ], type: app.Sequelize.QueryTypes.SELECT }
    );
    return item ? this.formatItem(item) : null;
  }

  async add(data) {
    const { app } = this;
    const now = Math.floor(Date.now() / 1000);

    const [ result ] = await app.model.query(
      `INSERT INTO uied_favicon_api (name, url_template, description, sort, is_enabled, create_time, update_time)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      {
        replacements: [
          data.name || '', data.urlTemplate || '', data.description || '',
          data.sort || data.sortOrder || 0, data.isEnabled !== false ? 1 : 0, now, now,
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
       sort = ?, is_enabled = ?, update_time = ? WHERE id = ?`,
      {
        replacements: [
          data.name || '', data.urlTemplate || '', data.description || '',
          data.sort || data.sortOrder || 0, data.isEnabled !== false ? 1 : 0, now, data.id,
        ],
        type: app.Sequelize.QueryTypes.UPDATE,
      }
    );
  }

  async del(id) {
    const { app } = this;
    const now = Math.floor(Date.now() / 1000);
    // 软删除
    await app.model.query('UPDATE uied_favicon_api SET is_delete = 1, delete_time = ? WHERE id = ?', {
      replacements: [ now, id ],
      type: app.Sequelize.QueryTypes.UPDATE,
    });
  }

  async setDefault(id) {
    const { app } = this;
    const now = Math.floor(Date.now() / 1000);

    // 先将所有设为非默认（sort设为较大值）
    await app.model.query('UPDATE uied_favicon_api SET sort = sort + 100, update_time = ? WHERE is_delete = 0', {
      replacements: [ now ],
      type: app.Sequelize.QueryTypes.UPDATE,
    });

    // 设置新默认（sort设为0，最高优先级）
    await app.model.query('UPDATE uied_favicon_api SET sort = 0, update_time = ? WHERE id = ?', {
      replacements: [ now, id ],
      type: app.Sequelize.QueryTypes.UPDATE,
    });
  }

  formatItem(item) {
    return {
      id: item.id,
      name: item.name,
      urlTemplate: item.url_template,
      description: item.description,
      sort: item.sort,
      sortOrder: item.sort, // 兼容前端
      isEnabled: item.is_enabled === 1,
      isActive: item.is_enabled === 1, // 兼容前端
      createTime: item.create_time,
      updateTime: item.update_time,
    };
  }
}

module.exports = FaviconApiService;
