/**
 * @file service/uied/navMenu.js
 * @description UIED 导航菜单服务
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

'use strict';

const Service = require('egg').Service;

class NavMenuService extends Service {
  /**
   * 导航菜单列表（分页）
   */
  async list(params = {}) {
    const { app } = this;
    const page = parseInt(params.pageNo) || 1;
    const pageSize = parseInt(params.pageSize) || 20;
    const offset = (page - 1) * pageSize;

    const [countResult] = await app.model.query(
      'SELECT COUNT(*) as total FROM uied_nav_menu',
      { type: app.Sequelize.QueryTypes.SELECT }
    );

    const lists = await app.model.query(
      `SELECT * FROM uied_nav_menu ORDER BY sort_order ASC, id ASC LIMIT ? OFFSET ?`,
      { replacements: [pageSize, offset], type: app.Sequelize.QueryTypes.SELECT }
    );

    return {
      lists: lists.map(this.formatItem),
      count: countResult.total,
      pageNo: page,
      pageSize,
    };
  }

  /**
   * 全部导航菜单（树形）
   */
  async all() {
    const { app } = this;
    const items = await app.model.query(
      'SELECT * FROM uied_nav_menu ORDER BY sort_order ASC, id ASC',
      { type: app.Sequelize.QueryTypes.SELECT }
    );
    return this.buildTree(items.map(this.formatItem));
  }

  /**
   * 导航菜单详情
   */
  async detail(id) {
    const { app } = this;
    const [item] = await app.model.query(
      'SELECT * FROM uied_nav_menu WHERE id = ?',
      { replacements: [id], type: app.Sequelize.QueryTypes.SELECT }
    );
    return item ? this.formatItem(item) : null;
  }

  /**
   * 添加导航菜单
   */
  async add(data) {
    const { app } = this;
    const now = Math.floor(Date.now() / 1000);

    const [result] = await app.model.query(
      `INSERT INTO uied_nav_menu (name, url, icon, parent_id, sort_order, is_active, open_in_new_tab, create_time, update_time)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      {
        replacements: [
          data.name || '', data.url || '', data.icon || '',
          data.parentId || 0, data.sortOrder || 0, data.isActive !== false ? 1 : 0,
          data.openInNewTab ? 1 : 0, now, now,
        ],
        type: app.Sequelize.QueryTypes.INSERT,
      }
    );

    return { id: result };
  }

  /**
   * 编辑导航菜单
   */
  async edit(data) {
    const { app } = this;
    const now = Math.floor(Date.now() / 1000);

    await app.model.query(
      `UPDATE uied_nav_menu SET name = ?, url = ?, icon = ?, parent_id = ?,
       sort_order = ?, is_active = ?, open_in_new_tab = ?, update_time = ? WHERE id = ?`,
      {
        replacements: [
          data.name || '', data.url || '', data.icon || '',
          data.parentId || 0, data.sortOrder || 0, data.isActive !== false ? 1 : 0,
          data.openInNewTab ? 1 : 0, now, data.id,
        ],
        type: app.Sequelize.QueryTypes.UPDATE,
      }
    );
  }

  /**
   * 删除导航菜单
   */
  async del(id) {
    const { app } = this;
    // 同时删除子菜单
    await app.model.query('DELETE FROM uied_nav_menu WHERE id = ? OR parent_id = ?', {
      replacements: [id, id],
      type: app.Sequelize.QueryTypes.DELETE,
    });
  }

  /**
   * 排序
   */
  async sort(items) {
    const { app } = this;
    for (const item of items) {
      await app.model.query('UPDATE uied_nav_menu SET sort_order = ? WHERE id = ?', {
        replacements: [item.sortOrder, item.id],
        type: app.Sequelize.QueryTypes.UPDATE,
      });
    }
  }

  /**
   * 格式化数据
   */
  formatItem(item) {
    return {
      id: item.id,
      name: item.name,
      url: item.url,
      icon: item.icon,
      parentId: item.parent_id,
      sortOrder: item.sort_order,
      isActive: item.is_active === 1,
      openInNewTab: item.open_in_new_tab === 1,
      createTime: item.create_time,
      updateTime: item.update_time,
    };
  }

  /**
   * 构建树形结构
   */
  buildTree(items, parentId = 0) {
    return items
      .filter(item => item.parentId === parentId)
      .map(item => ({
        ...item,
        children: this.buildTree(items, item.id),
      }));
  }
}

module.exports = NavMenuService;
