/**
 * @file service/uied/socialMedia.js
 * @description UIED 社交媒体服务
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

'use strict';

const Service = require('egg').Service;

class SocialMediaService extends Service {
  // ==================== 社交媒体分组 ====================
  async groupList(params = {}) {
    const { app } = this;
    const page = parseInt(params.pageNo) || 1;
    const pageSize = parseInt(params.pageSize) || 20;
    const offset = (page - 1) * pageSize;

    const [countResult] = await app.model.query(
      'SELECT COUNT(*) as total FROM uied_social_media_group',
      { type: app.Sequelize.QueryTypes.SELECT }
    );

    const lists = await app.model.query(
      `SELECT * FROM uied_social_media_group ORDER BY sort_order ASC, id ASC LIMIT ? OFFSET ?`,
      { replacements: [pageSize, offset], type: app.Sequelize.QueryTypes.SELECT }
    );

    return {
      lists: lists.map(this.formatGroup),
      count: countResult.total,
      pageNo: page,
      pageSize,
    };
  }

  async groupAll() {
    const { app } = this;
    const groups = await app.model.query(
      'SELECT * FROM uied_social_media_group ORDER BY sort_order ASC, id ASC',
      { type: app.Sequelize.QueryTypes.SELECT }
    );

    for (const group of groups) {
      const items = await app.model.query(
        'SELECT * FROM uied_social_media_item WHERE group_id = ? ORDER BY sort_order ASC',
        { replacements: [group.id], type: app.Sequelize.QueryTypes.SELECT }
      );
      group.items = items.map(this.formatItem);
    }

    return groups.map(this.formatGroup);
  }

  async groupAdd(data) {
    const { app } = this;
    const now = Math.floor(Date.now() / 1000);

    const [result] = await app.model.query(
      `INSERT INTO uied_social_media_group (name, position, sort_order, is_active, create_time, update_time)
       VALUES (?, ?, ?, ?, ?, ?)`,
      {
        replacements: [data.name || '', data.position || 'footer', data.sortOrder || 0, data.isActive !== false ? 1 : 0, now, now],
        type: app.Sequelize.QueryTypes.INSERT,
      }
    );

    return { id: result };
  }

  async groupEdit(data) {
    const { app } = this;
    const now = Math.floor(Date.now() / 1000);

    await app.model.query(
      `UPDATE uied_social_media_group SET name = ?, position = ?, sort_order = ?, is_active = ?, update_time = ? WHERE id = ?`,
      {
        replacements: [data.name || '', data.position || 'footer', data.sortOrder || 0, data.isActive !== false ? 1 : 0, now, data.id],
        type: app.Sequelize.QueryTypes.UPDATE,
      }
    );
  }

  async groupDel(id) {
    const { app } = this;
    await app.model.query('DELETE FROM uied_social_media_item WHERE group_id = ?', {
      replacements: [id],
      type: app.Sequelize.QueryTypes.DELETE,
    });
    await app.model.query('DELETE FROM uied_social_media_group WHERE id = ?', {
      replacements: [id],
      type: app.Sequelize.QueryTypes.DELETE,
    });
  }

  // ==================== 社交媒体项目 ====================
  async itemList(params = {}) {
    const { app } = this;
    const page = parseInt(params.pageNo) || 1;
    const pageSize = parseInt(params.pageSize) || 20;
    const offset = (page - 1) * pageSize;
    const groupId = params.groupId;

    let whereClause = '';
    const replacements = [];
    if (groupId) {
      whereClause = 'WHERE i.group_id = ?';
      replacements.push(groupId);
    }

    const [countResult] = await app.model.query(
      `SELECT COUNT(*) as total FROM uied_social_media_item i ${whereClause.replace('i.', '')}`,
      { replacements, type: app.Sequelize.QueryTypes.SELECT }
    );

    const lists = await app.model.query(
      `SELECT i.*, g.name as group_name FROM uied_social_media_item i
       LEFT JOIN uied_social_media_group g ON i.group_id = g.id
       ${whereClause} ORDER BY i.sort_order ASC, i.id ASC LIMIT ? OFFSET ?`,
      { replacements: [...replacements, pageSize, offset], type: app.Sequelize.QueryTypes.SELECT }
    );

    return {
      lists: lists.map(this.formatItem),
      count: countResult.total,
      pageNo: page,
      pageSize,
    };
  }

  async itemAdd(data) {
    const { app } = this;
    const now = Math.floor(Date.now() / 1000);

    const [result] = await app.model.query(
      `INSERT INTO uied_social_media_item (group_id, platform, name, url, icon, qr_code, sort_order, is_active, create_time, update_time)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      {
        replacements: [
          data.groupId || 0, data.platform || '', data.name || '', data.url || '',
          data.icon || '', data.qrCode || '', data.sortOrder || 0, data.isActive !== false ? 1 : 0, now, now,
        ],
        type: app.Sequelize.QueryTypes.INSERT,
      }
    );

    return { id: result };
  }

  async itemEdit(data) {
    const { app } = this;
    const now = Math.floor(Date.now() / 1000);

    await app.model.query(
      `UPDATE uied_social_media_item SET group_id = ?, platform = ?, name = ?, url = ?,
       icon = ?, qr_code = ?, sort_order = ?, is_active = ?, update_time = ? WHERE id = ?`,
      {
        replacements: [
          data.groupId || 0, data.platform || '', data.name || '', data.url || '',
          data.icon || '', data.qrCode || '', data.sortOrder || 0, data.isActive !== false ? 1 : 0, now, data.id,
        ],
        type: app.Sequelize.QueryTypes.UPDATE,
      }
    );
  }

  async itemDel(id) {
    const { app } = this;
    await app.model.query('DELETE FROM uied_social_media_item WHERE id = ?', {
      replacements: [id],
      type: app.Sequelize.QueryTypes.DELETE,
    });
  }

  formatGroup(item) {
    return {
      id: item.id,
      name: item.name,
      position: item.position,
      sortOrder: item.sort_order,
      isActive: item.is_active === 1,
      items: item.items || [],
      createTime: item.create_time,
      updateTime: item.update_time,
    };
  }

  formatItem(item) {
    return {
      id: item.id,
      groupId: item.group_id,
      groupName: item.group_name,
      platform: item.platform,
      name: item.name,
      url: item.url,
      icon: item.icon,
      qrCode: item.qr_code,
      sortOrder: item.sort_order,
      isActive: item.is_active === 1,
      createTime: item.create_time,
      updateTime: item.update_time,
    };
  }
}

module.exports = SocialMediaService;
