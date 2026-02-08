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
    const pageSize = parseInt(params.pageSize) || 15;
    const offset = (page - 1) * pageSize;

    const [countResult] = await app.model.query(
      'SELECT COUNT(*) as total FROM uied_friend_link WHERE is_delete = 0',
      { type: app.Sequelize.QueryTypes.SELECT }
    );

    const lists = await app.model.query(
      `SELECT * FROM uied_friend_link WHERE is_delete = 0 ORDER BY sort ASC, id ASC LIMIT ? OFFSET ?`,
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
      'SELECT * FROM uied_friend_link WHERE id = ? AND is_delete = 0',
      { replacements: [id], type: app.Sequelize.QueryTypes.SELECT }
    );
    return item ? this.formatItem(item) : null;
  }

  async add(data) {
    const { app } = this;
    const now = Math.floor(Date.now() / 1000);

    const [result] = await app.model.query(
      `INSERT INTO uied_friend_link (name, url, sort, is_show, create_time, update_time)
       VALUES (?, ?, ?, ?, ?, ?)`,
      {
        replacements: [
          data.name || '', data.url || '',
          data.sort || data.sortOrder || 0, data.isShow !== false ? 1 : 0, now, now,
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
      `UPDATE uied_friend_link SET name = ?, url = ?, sort = ?, is_show = ?, update_time = ? WHERE id = ?`,
      {
        replacements: [
          data.name || '', data.url || '',
          data.sort || data.sortOrder || 0, data.isShow !== false ? 1 : 0, now, data.id,
        ],
        type: app.Sequelize.QueryTypes.UPDATE,
      }
    );
  }

  async del(id) {
    const { app } = this;
    const now = Math.floor(Date.now() / 1000);
    // 软删除
    await app.model.query('UPDATE uied_friend_link SET is_delete = 1, delete_time = ? WHERE id = ?', {
      replacements: [now, id],
      type: app.Sequelize.QueryTypes.UPDATE,
    });
  }

  formatItem(item) {
    return {
      id: item.id,
      name: item.name,
      url: item.url,
      sort: item.sort,
      sortOrder: item.sort, // 兼容
      isShow: item.is_show === 1,
      isActive: item.is_show === 1, // 兼容
      createTime: item.create_time,
      updateTime: item.update_time,
    };
  }
}

module.exports = FriendLinkService;
