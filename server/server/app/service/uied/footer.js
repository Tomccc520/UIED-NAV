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
  /**
   * 规范化内置入口键（当前先支持 daily_hot，后续可扩展）
   */
  normalizeBuiltinKey(value) {
    const key = String(value || '').trim().toLowerCase();
    if (!key) return '';
    const allowSet = new Set([ 'daily_hot' ]);
    return allowSet.has(key) ? key : '';
  }

  /**
   * 从 old_id 中提取内置入口键
   */
  parseBuiltinKeyFromOldId(oldId) {
    const text = String(oldId || '').trim();
    if (!text.startsWith('builtin:')) return '';
    return this.normalizeBuiltinKey(text.slice('builtin:'.length));
  }

  /**
   * 生成 old_id 存储值（内置入口模式）
   */
  buildOldIdFromBuiltinKey(builtinKey) {
    const normalized = this.normalizeBuiltinKey(builtinKey);
    return normalized ? `builtin:${normalized}` : null;
  }

  /**
   * 获取内置入口默认链接（用于后台保存时兜底）
   */
  getBuiltinDefaultUrl(builtinKey) {
    const normalized = this.normalizeBuiltinKey(builtinKey);
    if (normalized === 'daily_hot') return '/p/daily-hot';
    return '';
  }

  /**
   * 构建页脚链接保存数据（统一处理内置入口/自定义链接）
   */
  buildLinkPersistPayload(data = {}) {
    const linkMode = String(data.linkMode || '').trim().toLowerCase();
    const builtinKey = this.normalizeBuiltinKey(data.builtinKey);
    const useBuiltin = linkMode === 'builtin' && Boolean(builtinKey);
    const rawOldId = String(data.oldId || '').trim();
    const oldId = useBuiltin
      ? this.buildOldIdFromBuiltinKey(builtinKey)
      : (this.parseBuiltinKeyFromOldId(rawOldId) ? null : (rawOldId || null));
    const rawUrl = String(data.url || '').trim();
    const url = useBuiltin ? (rawUrl || this.getBuiltinDefaultUrl(builtinKey)) : rawUrl;

    return {
      groupId: data.groupId || 0,
      text: data.text || data.name || '',
      url,
      external: data.external || data.openInNewTab ? 1 : 0,
      sort: data.sort || data.sortOrder || 0,
      isShow: data.isShow !== false ? 1 : 0,
      builtinKey: useBuiltin ? builtinKey : '',
      oldId,
      hasBuiltinControl: Object.prototype.hasOwnProperty.call(data, 'builtinKey')
        || Object.prototype.hasOwnProperty.call(data, 'linkMode'),
    };
  }

  // ==================== 页脚分组 ====================
  async groupList(params = {}) {
    const { app } = this;
    const page = parseInt(params.pageNo) || 1;
    const pageSize = parseInt(params.pageSize) || 15;
    const offset = (page - 1) * pageSize;

    const [ countResult ] = await app.model.query(
      'SELECT COUNT(*) as total FROM uied_footer_group WHERE is_delete = 0',
      { type: app.Sequelize.QueryTypes.SELECT }
    );

    const groups = await app.model.query(
      'SELECT * FROM uied_footer_group WHERE is_delete = 0 ORDER BY sort ASC, id ASC LIMIT ? OFFSET ?',
      { replacements: [ pageSize, offset ], type: app.Sequelize.QueryTypes.SELECT }
    );

    // 获取每个分组的链接
    for (const group of groups) {
      const links = await app.model.query(
        'SELECT * FROM uied_footer_link WHERE group_id = ? AND is_delete = 0 ORDER BY sort ASC',
        { replacements: [ group.id ], type: app.Sequelize.QueryTypes.SELECT }
      );
      group.links = links.map(item => this.formatLink(item));
    }

    return {
      lists: groups.map(item => this.formatGroup(item)),
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
        { replacements: [ group.id ], type: app.Sequelize.QueryTypes.SELECT }
      );
      group.links = links.map(item => this.formatLink(item));
    }

    return groups.map(item => this.formatGroup(item));
  }

  async groupAdd(data) {
    const { app } = this;
    const now = Math.floor(Date.now() / 1000);

    const [ result ] = await app.model.query(
      `INSERT INTO uied_footer_group (title, sort, is_show, create_time, update_time)
       VALUES (?, ?, ?, ?, ?)`,
      {
        replacements: [
          data.title || data.name || '',
          data.sort || data.sortOrder || 0,
          data.isShow !== false ? 1 : 0,
          now, now,
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
      'UPDATE uied_footer_group SET title = ?, sort = ?, is_show = ?, update_time = ? WHERE id = ?',
      {
        replacements: [
          data.title || data.name || '',
          data.sort || data.sortOrder || 0,
          data.isShow !== false ? 1 : 0,
          now, data.id,
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
      { replacements: [ now, id ], type: app.Sequelize.QueryTypes.UPDATE }
    );
    await app.model.query(
      'UPDATE uied_footer_group SET is_delete = 1, delete_time = ? WHERE id = ?',
      { replacements: [ now, id ], type: app.Sequelize.QueryTypes.UPDATE }
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

    const [ countResult ] = await app.model.query(
      `SELECT COUNT(*) as total FROM uied_footer_link l WHERE ${whereClause}`,
      { replacements, type: app.Sequelize.QueryTypes.SELECT }
    );

    const lists = await app.model.query(
      `SELECT l.*, g.title as group_name FROM uied_footer_link l
       LEFT JOIN uied_footer_group g ON l.group_id = g.id
       WHERE ${whereClause} ORDER BY l.sort ASC, l.id ASC LIMIT ? OFFSET ?`,
      { replacements: [ ...replacements, pageSize, offset ], type: app.Sequelize.QueryTypes.SELECT }
    );

    return {
      lists: lists.map(item => this.formatLink(item)),
      count: countResult.total,
      pageNo: page,
      pageSize,
    };
  }

  async linkAdd(data) {
    const { app } = this;
    const now = Math.floor(Date.now() / 1000);
    const payload = this.buildLinkPersistPayload(data);

    const [ result ] = await app.model.query(
      `INSERT INTO uied_footer_link (old_id, group_id, text, url, external, sort, is_show, create_time, update_time)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      {
        replacements: [
          payload.oldId,
          payload.groupId,
          payload.text,
          payload.url,
          payload.external,
          payload.sort,
          payload.isShow,
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
    const payload = this.buildLinkPersistPayload(data);

    if (payload.hasBuiltinControl) {
      await app.model.query(
        `UPDATE uied_footer_link SET old_id = ?, group_id = ?, text = ?, url = ?, external = ?,
         sort = ?, is_show = ?, update_time = ? WHERE id = ?`,
        {
          replacements: [
            payload.oldId,
            payload.groupId,
            payload.text,
            payload.url,
            payload.external,
            payload.sort,
            payload.isShow,
            now, data.id,
          ],
          type: app.Sequelize.QueryTypes.UPDATE,
        }
      );
      return;
    }

    await app.model.query(
      `UPDATE uied_footer_link SET group_id = ?, text = ?, url = ?, external = ?,
       sort = ?, is_show = ?, update_time = ? WHERE id = ?`,
      {
        replacements: [
          payload.groupId,
          payload.text,
          payload.url,
          payload.external,
          payload.sort,
          payload.isShow,
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
      { replacements: [ now, id ], type: app.Sequelize.QueryTypes.UPDATE }
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
    const builtinKey = this.parseBuiltinKeyFromOldId(item.old_id);
    return {
      id: item.id,
      oldId: item.old_id,
      builtinKey,
      linkMode: builtinKey ? 'builtin' : 'custom',
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
