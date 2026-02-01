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
    const pageSize = parseInt(params.pageSize) || 20;
    const offset = (page - 1) * pageSize;

    const [countResult] = await app.model.query(
      'SELECT COUNT(*) as total FROM uied_footer_group',
      { type: app.Sequelize.QueryTypes.SELECT }
    );

    const lists = await app.model.query(
      `SELECT * FROM uied_footer_group ORDER BY sort_order ASC, id ASC LIMIT ? OFFSET ?`,
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
      'SELECT * FROM uied_footer_group ORDER BY sort_order ASC, id ASC',
      { type: app.Sequelize.QueryTypes.SELECT }
    );

    // 获取每个分组的链接
    for (const group of groups) {
      const links = await app.model.query(
        'SELECT * FROM uied_footer_link WHERE group_id = ? ORDER BY sort_order ASC',
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
      `INSERT INTO uied_footer_group (name, sort_order, is_active, create_time, update_time)
       VALUES (?, ?, ?, ?, ?)`,
      {
        replacements: [data.name || '', data.sortOrder || 0, data.isActive !== false ? 1 : 0, now, now],
        type: app.Sequelize.QueryTypes.INSERT,
      }
    );

    return { id: result };
  }

  async groupEdit(data) {
    const { app } = this;
    const now = Math.floor(Date.now() / 1000);

    await app.model.query(
      `UPDATE uied_footer_group SET name = ?, sort_order = ?, is_active = ?, update_time = ? WHERE id = ?`,
      {
        replacements: [data.name || '', data.sortOrder || 0, data.isActive !== false ? 1 : 0, now, data.id],
        type: app.Sequelize.QueryTypes.UPDATE,
      }
    );
  }

  async groupDel(id) {
    const { app } = this;
    // 同时删除分组下的链接
    await app.model.query('DELETE FROM uied_footer_link WHERE group_id = ?', {
      replacements: [id],
      type: app.Sequelize.QueryTypes.DELETE,
    });
    await app.model.query('DELETE FROM uied_footer_group WHERE id = ?', {
      replacements: [id],
      type: app.Sequelize.QueryTypes.DELETE,
    });
  }

  // ==================== 页脚链接 ====================
  async linkList(params = {}) {
    const { app } = this;
    const page = parseInt(params.pageNo) || 1;
    const pageSize = parseInt(params.pageSize) || 20;
    const offset = (page - 1) * pageSize;
    const groupId = params.groupId;

    let whereClause = '';
    const replacements = [];
    if (groupId) {
      whereClause = 'WHERE group_id = ?';
      replacements.push(groupId);
    }

    const [countResult] = await app.model.query(
      `SELECT COUNT(*) as total FROM uied_footer_link ${whereClause}`,
      { replacements, type: app.Sequelize.QueryTypes.SELECT }
    );

    const lists = await app.model.query(
      `SELECT l.*, g.name as group_name FROM uied_footer_link l
       LEFT JOIN uied_footer_group g ON l.group_id = g.id
       ${whereClause} ORDER BY l.sort_order ASC, l.id ASC LIMIT ? OFFSET ?`,
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
      `INSERT INTO uied_footer_link (group_id, name, url, icon, sort_order, is_active, open_in_new_tab, create_time, update_time)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      {
        replacements: [
          data.groupId || 0, data.name || '', data.url || '', data.icon || '',
          data.sortOrder || 0, data.isActive !== false ? 1 : 0, data.openInNewTab ? 1 : 0, now, now,
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
      `UPDATE uied_footer_link SET group_id = ?, name = ?, url = ?, icon = ?,
       sort_order = ?, is_active = ?, open_in_new_tab = ?, update_time = ? WHERE id = ?`,
      {
        replacements: [
          data.groupId || 0, data.name || '', data.url || '', data.icon || '',
          data.sortOrder || 0, data.isActive !== false ? 1 : 0, data.openInNewTab ? 1 : 0, now, data.id,
        ],
        type: app.Sequelize.QueryTypes.UPDATE,
      }
    );
  }

  async linkDel(id) {
    const { app } = this;
    await app.model.query('DELETE FROM uied_footer_link WHERE id = ?', {
      replacements: [id],
      type: app.Sequelize.QueryTypes.DELETE,
    });
  }

  formatGroup(item) {
    return {
      id: item.id,
      name: item.name,
      sortOrder: item.sort_order,
      isActive: item.is_active === 1,
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
      name: item.name,
      url: item.url,
      icon: item.icon,
      sortOrder: item.sort_order,
      isActive: item.is_active === 1,
      openInNewTab: item.open_in_new_tab === 1,
      createTime: item.create_time,
      updateTime: item.update_time,
    };
  }
}

module.exports = FooterService;
