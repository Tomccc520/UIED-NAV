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

    const [ countResult ] = await app.model.query(
      'SELECT COUNT(*) as total FROM uied_nav_menu WHERE is_delete = 0',
      { type: app.Sequelize.QueryTypes.SELECT }
    );

    const lists = await app.model.query(
      'SELECT * FROM uied_nav_menu WHERE is_delete = 0 ORDER BY sort ASC, id ASC LIMIT ? OFFSET ?',
      { replacements: [ pageSize, offset ], type: app.Sequelize.QueryTypes.SELECT }
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
      'SELECT * FROM uied_nav_menu WHERE is_delete = 0 ORDER BY sort ASC, id ASC',
      { type: app.Sequelize.QueryTypes.SELECT }
    );
    return this.buildTree(items.map(this.formatItem));
  }

  /**
   * 导航菜单详情
   */
  async detail(id) {
    const { app } = this;
    const [ item ] = await app.model.query(
      'SELECT * FROM uied_nav_menu WHERE id = ? AND is_delete = 0',
      { replacements: [ id ], type: app.Sequelize.QueryTypes.SELECT }
    );
    return item ? this.formatItem(item) : null;
  }

  /**
   * 添加导航菜单
   */
  async add(data) {
    const { app } = this;
    const now = Math.floor(Date.now() / 1000);

    const [ result ] = await app.model.query(
      `INSERT INTO uied_nav_menu (text, link, icon, parent_id, sort, is_show, external, label, label_type, create_time, update_time)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      {
        replacements: [
          data.text || data.name || '',
          data.link || data.url || '',
          data.icon || '',
          data.parentId || null,
          data.sort || data.sortOrder || 0,
          data.isShow !== false ? 1 : 0,
          data.external || data.openInNewTab ? 1 : 0,
          data.label || null,
          data.labelType || null,
          now, now,
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
      `UPDATE uied_nav_menu SET text = ?, link = ?, icon = ?, parent_id = ?,
       sort = ?, is_show = ?, external = ?, label = ?, label_type = ?, update_time = ? WHERE id = ?`,
      {
        replacements: [
          data.text || data.name || '',
          data.link || data.url || '',
          data.icon || '',
          data.parentId || null,
          data.sort || data.sortOrder || 0,
          data.isShow !== false ? 1 : 0,
          data.external || data.openInNewTab ? 1 : 0,
          data.label || null,
          data.labelType || null,
          now, data.id,
        ],
        type: app.Sequelize.QueryTypes.UPDATE,
      }
    );
  }

  /**
   * 删除导航菜单（软删除）
   */
  async del(id) {
    const { app } = this;
    const now = Math.floor(Date.now() / 1000);
    // 软删除，同时删除子菜单
    await app.model.query(
      'UPDATE uied_nav_menu SET is_delete = 1, delete_time = ? WHERE id = ? OR parent_id = ?',
      {
        replacements: [ now, id, id ],
        type: app.Sequelize.QueryTypes.UPDATE,
      }
    );
  }

  /**
   * 排序
   */
  async sort(items) {
    const { app } = this;
    for (const item of items) {
      await app.model.query('UPDATE uied_nav_menu SET sort = ? WHERE id = ?', {
        replacements: [ item.sort || item.sortOrder, item.id ],
        type: app.Sequelize.QueryTypes.UPDATE,
      });
    }
  }

  /**
   * 格式化数据 - 映射数据库字段到前端字段
   */
  formatItem(item) {
    return {
      id: item.id,
      text: item.text,
      name: item.text, // 兼容前端
      link: item.link,
      url: item.link, // 兼容前端
      icon: item.icon,
      parentId: item.parent_id,
      sort: item.sort,
      sortOrder: item.sort, // 兼容前端
      isShow: item.is_show === 1,
      isActive: item.is_show === 1, // 兼容前端
      external: item.external === 1,
      openInNewTab: item.external === 1, // 兼容前端
      label: item.label,
      labelType: item.label_type,
      createTime: item.create_time,
      updateTime: item.update_time,
    };
  }

  /**
   * 构建树形结构
   */
  buildTree(items, parentId = null) {
    return items
      .filter(item => item.parentId === parentId)
      .map(item => ({
        ...item,
        children: this.buildTree(items, item.id),
      }));
  }
}

module.exports = NavMenuService;
