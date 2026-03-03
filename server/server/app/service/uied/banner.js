/**
 * @file service/uied/banner.js
 * @description UIED 广告管理服务
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

'use strict';

const Service = require('egg').Service;

class BannerService extends Service {
  /**
   * 规范化广告位置参数，兼容前后端不同命名
   */
  normalizePosition(position) {
    const map = {
      top: 'home',
      bottom: 'footer',
      popup: 'detail',
    };
    return map[position] || position || '';
  }

  /**
   * 获取广告位置别名集合（兼容后台配置值与前端请求值不一致）
   * @param {string} position 前端传入的位置标识
   * @return {string[]} 可匹配的位置列表
   */
  getPositionAliases(position) {
    const normalized = String(position || '').trim();
    if (!normalized) return [];

    const aliasGroups = {
      top: [ 'top', 'home', 'global_strip' ],
      home: [ 'home', 'top', 'global_strip' ],
      global_strip: [ 'global_strip', 'home', 'top' ],
      bottom: [ 'bottom', 'footer' ],
      footer: [ 'footer', 'bottom' ],
      sidebar: [ 'sidebar', 'website_detail_sidebar', 'detail_sidebar' ],
      website_detail_sidebar: [ 'website_detail_sidebar', 'sidebar', 'detail_sidebar' ],
      detail_sidebar: [ 'detail_sidebar', 'website_detail_sidebar', 'sidebar' ],
      popup: [ 'popup', 'detail' ],
      detail: [ 'detail', 'popup' ],
      detail_top: [ 'detail_top' ],
      detail_inline: [ 'detail_inline' ],
      detail_bottom: [ 'detail_bottom' ],
    };

    const aliases = aliasGroups[normalized] || [ normalized ];
    return Array.from(new Set(aliases.filter(Boolean)));
  }

  async list(params = {}) {
    const { app } = this;
    const page = parseInt(params.pageNo) || 1;
    const pageSize = parseInt(params.pageSize) || 15;
    const offset = (page - 1) * pageSize;

    const [ countResult ] = await app.model.query(
      'SELECT COUNT(*) as total FROM uied_banner WHERE is_delete = 0',
      { type: app.Sequelize.QueryTypes.SELECT }
    );

    const lists = await app.model.query(
      'SELECT * FROM uied_banner WHERE is_delete = 0 ORDER BY sort ASC, id ASC LIMIT ? OFFSET ?',
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
      'SELECT * FROM uied_banner WHERE id = ? AND is_delete = 0',
      { replacements: [ id ], type: app.Sequelize.QueryTypes.SELECT }
    );
    return item ? this.formatItem(item) : null;
  }

  async add(data) {
    const { app } = this;
    const now = Math.floor(Date.now() / 1000);

    const [ result ] = await app.model.query(
      `INSERT INTO uied_banner (title, description, image_url, link_url, link_target, content_type, 
       html_content, page_slug, position, sort, is_show, start_time, end_time, create_time, update_time)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      {
        replacements: [
          data.title || '', data.description || '', data.imageUrl || data.image || '',
          data.linkUrl || data.url || '', data.linkTarget || '_blank', data.contentType || 'image',
          data.htmlContent || '', data.pageSlug || null, data.position || 'top',
          data.sort || data.sortOrder || 0, data.isShow !== false ? 1 : 0,
          data.startTime || null, data.endTime || null, now, now,
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
      `UPDATE uied_banner SET title = ?, description = ?, image_url = ?, link_url = ?, link_target = ?,
       content_type = ?, html_content = ?, page_slug = ?, position = ?, sort = ?, is_show = ?, 
       start_time = ?, end_time = ?, update_time = ? WHERE id = ?`,
      {
        replacements: [
          data.title || '', data.description || '', data.imageUrl || data.image || '',
          data.linkUrl || data.url || '', data.linkTarget || '_blank', data.contentType || 'image',
          data.htmlContent || '', data.pageSlug || null, data.position || 'top',
          data.sort || data.sortOrder || 0, data.isShow !== false ? 1 : 0,
          data.startTime || null, data.endTime || null, now, data.id,
        ],
        type: app.Sequelize.QueryTypes.UPDATE,
      }
    );
  }

  async del(id) {
    const { app } = this;
    const now = Math.floor(Date.now() / 1000);
    // 软删除
    await app.model.query('UPDATE uied_banner SET is_delete = 1, delete_time = ? WHERE id = ?', {
      replacements: [ now, id ],
      type: app.Sequelize.QueryTypes.UPDATE,
    });
  }

  /**
   * 获取前端可用的激活广告
   */
  async active(params = {}) {
    const { app } = this;
    const now = Math.floor(Date.now() / 1000);
    const limit = parseInt(params.limit) || 20;
    const position = this.normalizePosition(params.position);
    const pageSlug = params.pageSlug || '';

    let whereSql = 'is_delete = 0 AND is_show = 1';
    const replacements = [];

    // 生效时间控制：为空或0表示不限制
    whereSql += ' AND (start_time IS NULL OR start_time = 0 OR start_time <= ?)';
    whereSql += ' AND (end_time IS NULL OR end_time = 0 OR end_time >= ?)';
    replacements.push(now, now);

    if (position) {
      const positionAliases = this.getPositionAliases(position);
      if (positionAliases.length > 1) {
        whereSql += ` AND position IN (${positionAliases.map(() => '?').join(',')})`;
        replacements.push(...positionAliases);
      } else {
        whereSql += ' AND position = ?';
        replacements.push(positionAliases[0] || position);
      }
    }

    // page_slug 为空表示全局；支持 all 作为通配值
    if (pageSlug) {
      whereSql += ' AND (page_slug IS NULL OR page_slug = \'\' OR page_slug = ? OR page_slug = \'all\')';
      replacements.push(pageSlug);
    }

    const lists = await app.model.query(
      `SELECT * FROM uied_banner WHERE ${whereSql} ORDER BY sort ASC, id ASC LIMIT ?`,
      { replacements: [ ...replacements, limit ], type: app.Sequelize.QueryTypes.SELECT }
    );

    return lists.map(this.formatItem);
  }

  /**
   * 记录广告点击
   */
  async recordClick(id) {
    const { app } = this;
    await app.model.query(
      'UPDATE uied_banner SET click_count = click_count + 1 WHERE id = ? AND is_delete = 0',
      { replacements: [ id ], type: app.Sequelize.QueryTypes.UPDATE }
    );
  }

  formatItem(item) {
    return {
      id: item.id,
      title: item.title,
      description: item.description,
      imageUrl: item.image_url,
      image: item.image_url, // 兼容
      linkUrl: item.link_url,
      url: item.link_url, // 兼容
      linkTarget: item.link_target,
      contentType: item.content_type,
      htmlContent: item.html_content,
      pageSlug: item.page_slug,
      position: item.position,
      sort: item.sort,
      sortOrder: item.sort, // 兼容
      isShow: item.is_show === 1,
      isActive: item.is_show === 1, // 兼容
      startTime: item.start_time,
      endTime: item.end_time,
      clickCount: item.click_count,
      createTime: item.create_time,
      updateTime: item.update_time,
    };
  }
}

module.exports = BannerService;
