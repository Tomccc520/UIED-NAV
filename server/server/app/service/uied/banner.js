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
  async list(params = {}) {
    const { app } = this;
    const page = parseInt(params.pageNo) || 1;
    const pageSize = parseInt(params.pageSize) || 15;
    const offset = (page - 1) * pageSize;

    const [countResult] = await app.model.query(
      'SELECT COUNT(*) as total FROM uied_banner WHERE is_delete = 0',
      { type: app.Sequelize.QueryTypes.SELECT }
    );

    const lists = await app.model.query(
      `SELECT * FROM uied_banner WHERE is_delete = 0 ORDER BY sort ASC, id ASC LIMIT ? OFFSET ?`,
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
      'SELECT * FROM uied_banner WHERE id = ? AND is_delete = 0',
      { replacements: [id], type: app.Sequelize.QueryTypes.SELECT }
    );
    return item ? this.formatItem(item) : null;
  }

  async add(data) {
    const { app } = this;
    const now = Math.floor(Date.now() / 1000);

    const [result] = await app.model.query(
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
      replacements: [now, id],
      type: app.Sequelize.QueryTypes.UPDATE,
    });
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
