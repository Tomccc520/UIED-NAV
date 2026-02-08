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
    const pageSize = parseInt(params.pageSize) || 100;
    const offset = (page - 1) * pageSize;

    const [countResult] = await app.model.query(
      'SELECT COUNT(*) as total FROM uied_social_media_group WHERE is_delete = 0',
      { type: app.Sequelize.QueryTypes.SELECT }
    );

    const lists = await app.model.query(
      `SELECT * FROM uied_social_media_group WHERE is_delete = 0 ORDER BY sort ASC, id ASC LIMIT ? OFFSET ?`,
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
      'SELECT * FROM uied_social_media_group WHERE is_delete = 0 ORDER BY sort ASC, id ASC',
      { type: app.Sequelize.QueryTypes.SELECT }
    );

    for (const group of groups) {
      const items = await app.model.query(
        'SELECT * FROM uied_social_media_item WHERE group_id = ? AND is_delete = 0 ORDER BY sort ASC',
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
      `INSERT INTO uied_social_media_group (name, icon, display_type, sort, is_show, create_time, update_time)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      {
        replacements: [
          data.name || '', 
          data.icon || null, 
          data.displayType || 'links',
          data.sort || data.sortOrder || 0, 
          data.isShow !== false ? 1 : 0, 
          now, now
        ],
        type: app.Sequelize.QueryTypes.INSERT,
      }
    );

    return { id: result };
  }

  async groupEdit(data) {
    const { app } = this;
    const now = Math.floor(Date.now() / 1000);

    await app.model.query(
      `UPDATE uied_social_media_group SET name = ?, icon = ?, display_type = ?, sort = ?, is_show = ?, update_time = ? WHERE id = ?`,
      {
        replacements: [
          data.name || '', 
          data.icon || null, 
          data.displayType || 'links',
          data.sort || data.sortOrder || 0, 
          data.isShow !== false ? 1 : 0, 
          now, data.id
        ],
        type: app.Sequelize.QueryTypes.UPDATE,
      }
    );
  }

  async groupDel(id) {
    const { app } = this;
    const now = Math.floor(Date.now() / 1000);
    // 软删除
    await app.model.query(
      'UPDATE uied_social_media_item SET is_delete = 1, delete_time = ? WHERE group_id = ?', 
      { replacements: [now, id], type: app.Sequelize.QueryTypes.UPDATE }
    );
    await app.model.query(
      'UPDATE uied_social_media_group SET is_delete = 1, delete_time = ? WHERE id = ?', 
      { replacements: [now, id], type: app.Sequelize.QueryTypes.UPDATE }
    );
  }

  // ==================== 社交媒体项目 ====================
  async itemList(params = {}) {
    const { app } = this;
    const page = parseInt(params.pageNo) || 1;
    const pageSize = parseInt(params.pageSize) || 15;
    const offset = (page - 1) * pageSize;
    const groupId = params.groupId;

    let whereClause = 'i.is_delete = 0';
    const replacements = [];
    if (groupId) {
      whereClause += ' AND i.group_id = ?';
      replacements.push(groupId);
    }

    const [countResult] = await app.model.query(
      `SELECT COUNT(*) as total FROM uied_social_media_item i WHERE ${whereClause}`,
      { replacements, type: app.Sequelize.QueryTypes.SELECT }
    );

    const lists = await app.model.query(
      `SELECT i.*, g.name as group_name FROM uied_social_media_item i
       LEFT JOIN uied_social_media_group g ON i.group_id = g.id
       WHERE ${whereClause} ORDER BY i.sort ASC, i.id ASC LIMIT ? OFFSET ?`,
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
      `INSERT INTO uied_social_media_item (group_id, name, type, icon, link, qr_code_url, description, extra_info, sort, is_show, create_time, update_time)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      {
        replacements: [
          data.groupId || 0, 
          data.name || '', 
          data.type || 'other',
          data.icon || null, 
          data.link || data.url || null, 
          data.qrCodeUrl || data.qrCode || null,
          data.description || null,
          data.extraInfo ? JSON.stringify(data.extraInfo) : null,
          data.sort || data.sortOrder || 0, 
          data.isShow !== false ? 1 : 0, 
          now, now,
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
      `UPDATE uied_social_media_item SET group_id = ?, name = ?, type = ?, icon = ?,
       link = ?, qr_code_url = ?, description = ?, extra_info = ?, sort = ?, is_show = ?, update_time = ? WHERE id = ?`,
      {
        replacements: [
          data.groupId || 0, 
          data.name || '', 
          data.type || 'other',
          data.icon || null, 
          data.link || data.url || null, 
          data.qrCodeUrl || data.qrCode || null,
          data.description || null,
          data.extraInfo ? JSON.stringify(data.extraInfo) : null,
          data.sort || data.sortOrder || 0, 
          data.isShow !== false ? 1 : 0, 
          now, data.id,
        ],
        type: app.Sequelize.QueryTypes.UPDATE,
      }
    );
  }

  async itemDel(id) {
    const { app } = this;
    const now = Math.floor(Date.now() / 1000);
    await app.model.query(
      'UPDATE uied_social_media_item SET is_delete = 1, delete_time = ? WHERE id = ?', 
      { replacements: [now, id], type: app.Sequelize.QueryTypes.UPDATE }
    );
  }

  formatGroup(item) {
    return {
      id: item.id,
      name: item.name,
      icon: item.icon,
      displayType: item.display_type,
      sort: item.sort,
      sortOrder: item.sort, // 兼容
      isShow: item.is_show === 1,
      isActive: item.is_show === 1, // 兼容
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
      name: item.name,
      type: item.type,
      icon: item.icon,
      link: item.link,
      url: item.link, // 兼容
      qrCodeUrl: item.qr_code_url,
      qrCode: item.qr_code_url, // 兼容
      description: item.description,
      extraInfo: item.extra_info ? JSON.parse(item.extra_info) : null,
      sort: item.sort,
      sortOrder: item.sort, // 兼容
      isShow: item.is_show === 1,
      isActive: item.is_show === 1, // 兼容
      createTime: item.create_time,
      updateTime: item.update_time,
    };
  }
}

module.exports = SocialMediaService;
