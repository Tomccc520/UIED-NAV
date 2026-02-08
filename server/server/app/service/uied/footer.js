/**
 * @file service/uied/footer.js
 * @description UIED 页脚设置服务
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

'use strict';

const Service = require('egg').Service;

class FooterService extends Service {
  // ==================== 页脚分组 ====================
  async groupList(params = {}) {
    const { app } = this;
    const page = parseInt(params.pageNo) || 1;
    const pageSize = parseInt(params.pageSize) || 15;
    const offset = (page - 1) * pageSize;

    const [countResult] = await app.model.query(
      'SELECT COUNT(*) as total FROM uied_footer_group WHERE is_delete = 0',
      { type: app.Sequelize.QueryTypes.SELECT }
    );

    const groups = await app.model.query(
      `SELECT * FROM uied_footer_group WHERE is_delete = 0 ORDER BY sort ASC, id ASC LIMIT ? OFFSET ?`,
      { replacements: [pageSize, offset], type: app.Sequelize.QueryTypes.SELECT }
    );

    // 获取每个分组的链接
    for (const group of groups) {
      const links = await app.model.query(
        'SELECT * FROM uied_footer_link WHERE group_id = ? AND is_delete = 0 ORDER BY sort ASC',
        { replacements: [group.id], type: app.Sequelize.QueryTypes.SELECT }
      );
      group.links = links.map(this.formatLink);
    }

    return {
      lists: groups.map(this.formatGroup),
      count: countResult.total,
      pageNo: page,
      pageSize,
    };
  }

  async groupAll() {
    const { app } = this;
    const groups = await app.model.query(
      'SELECT * FROM uied_footer_group WHERE is_delete = 0 ORDER BY sort ASC, id ASC',
      { type: app.Sequelize.QueryTypes.SELECT }
    );

    // 获取每个分组的链接
    for (const group of groups) {
      const links = await app.model.query(
        'SELECT * FROM uied_footer_link WHERE group_id = ? AND is_delete = 0 ORDER BY sort ASC',
        { replacements: [group.id], type: app.Sequelize.QueryTypes.SELECT }
      );
      group.links = links.map(this.formatLink);
    }

    return groups.map(this.formatGroup);
  }

  async groupAdd(data) {
    const { app } = this;
    const now = Math.floor(Date.now() / 1000);

    const [result] = await app.model.query(
      `INSERT INTO uied_footer_group (title, sort, is_show, create_time, update_time)
       VALUES (?, ?, ?, ?, ?)`,
      {
        replacements: [
          data.title || data.name || '', 
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
      `UPDATE uied_footer_group SET title = ?, sort = ?, is_show = ?, update_time = ? WHERE id = ?`,
      {
        replacements: [
          data.title || data.name || '', 
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
    // 软删除分组及其链接
    await app.model.query(
      'UPDATE uied_footer_link SET is_delete = 1, delete_time = ? WHERE group_id = ?', 
      { replacements: [now, id], type: app.Sequelize.QueryTypes.UPDATE }
    );
    await app.model.query(
      'UPDATE uied_footer_group SET is_delete = 1, delete_time = ? WHERE id = ?', 
      { replacements: [now, id], type: app.Sequelize.QueryTypes.UPDATE }
    );
  }

  // ==================== 页脚链接 ====================
  async linkList(params = {}) {
    const { app } = this;
    const page = parseInt(params.pageNo) || 1;
    const pageSize = parseInt(params.pageSize) || 15;
    const offset = (page - 1) * pageSize;
    const groupId = params.groupId;

    let whereClause = 'l.is_delete = 0';
    const replacements = [];
    if (groupId) {
      whereClause += ' AND l.group_id = ?';
      replacements.push(groupId);
    }

    const [countResult] = await app.model.query(
      `SELECT COUNT(*) as total FROM uied_footer_link l WHERE ${whereClause}`,
      { replacements, type: app.Sequelize.QueryTypes.SELECT }
    );

    const lists = await app.model.query(
      `SELECT l.*, g.title as group_name FROM uied_footer_link l
       LEFT JOIN uied_footer_group g ON l.group_id = g.id
       WHERE ${whereClause} ORDER BY l.sort ASC, l.id ASC LIMIT ? OFFSET ?`,
      { replacements: [...replacements, pageSize, offset], type: app.Sequelize.QueryTypes.SELECT }
    );

    return {
      lists: lists.map(this.formatLink),
      count: countResult.total,
      pageNo: page,
      pageSize,
    };
  }

  async linkAdd(data) {
    const { app } = this;
    const now = Math.floor(Date.now() / 1000);

    const [result] = await app.model.query(
      `INSERT INTO uied_footer_link (group_id, text, url, external, sort, is_show, create_time, update_time)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      {
        replacements: [
          data.groupId || 0, 
          data.text || data.name || '', 
          data.url || '', 
          data.external || data.openInNewTab ? 1 : 0,
          data.sort || data.sortOrder || 0, 
          data.isShow !== false ? 1 : 0, 
          now, now,
        ],
        type: app.Sequelize.QueryTypes.INSERT,
      }
    );

    return { id: result };
  }

  async linkEdit(data) {
    const { app } = this;
    const now = Math.floor(Date.now() / 1000);

    await app.model.query(
      `UPDATE uied_footer_link SET group_id = ?, text = ?, url = ?, external = ?,
       sort = ?, is_show = ?, update_time = ? WHERE id = ?`,
      {
        replacements: [
          data.groupId || 0, 
          data.text || data.name || '', 
          data.url || '', 
          data.external || data.openInNewTab ? 1 : 0,
          data.sort || data.sortOrder || 0, 
          data.isShow !== false ? 1 : 0, 
          now, data.id,
        ],
        type: app.Sequelize.QueryTypes.UPDATE,
      }
    );
  }

  async linkDel(id) {
    const { app } = this;
    const now = Math.floor(Date.now() / 1000);
    await app.model.query(
      'UPDATE uied_footer_link SET is_delete = 1, delete_time = ? WHERE id = ?', 
      { replacements: [now, id], type: app.Sequelize.QueryTypes.UPDATE }
    );
  }

  formatGroup(item) {
    return {
      id: item.id,
      title: item.title,
      name: item.title, // 兼容
      sort: item.sort,
      sortOrder: item.sort, // 兼容
      isShow: item.is_show === 1,
      isActive: item.is_show === 1, // 兼容
      links: item.links || [],
      createTime: item.create_time,
      updateTime: item.update_time,
    };
  }

  formatLink(item) {
    return {
      id: item.id,
      groupId: item.group_id,
      groupName: item.group_name,
      text: item.text,
      name: item.text, // 兼容
      url: item.url,
      external: item.external === 1,
      openInNewTab: item.external === 1, // 兼容
      sort: item.sort,
      sortOrder: item.sort, // 兼容
      isShow: item.is_show === 1,
      isActive: item.is_show === 1, // 兼容
      createTime: item.create_time,
      updateTime: item.update_time,
    };
  }
}

module.exports = FooterService;
