/**
 * @file service/uied/websiteTag.js
 * @description 网站标签管理服务
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

'use strict';

const Service = require('egg').Service;

class WebsiteTagService extends Service {
  /**
   * 获取标签列表
   */
  async list({ page = 1, pageSize = 20 }) {
    const { app } = this;
    const offset = (page - 1) * pageSize;

    const [ countResult ] = await app.model.query(
      'SELECT COUNT(*) as total FROM uied_website_tag WHERE is_delete = 0',
      { type: app.Sequelize.QueryTypes.SELECT }
    );

    const tags = await app.model.query(
      `SELECT t.*, 
        (SELECT COUNT(*) FROM uied_website_tag_relation r WHERE r.tag_id = t.id) as website_count
       FROM uied_website_tag t
       WHERE t.is_delete = 0
       ORDER BY t.sort ASC, t.name ASC
       LIMIT ? OFFSET ?`,
      { replacements: [ pageSize, offset ], type: app.Sequelize.QueryTypes.SELECT }
    );

    return {
      lists: tags.map(t => ({
        id: t.id,
        name: t.name,
        slug: t.slug,
        color: t.color,
        description: t.description,
        seoTitle: t.seo_title,
        seoDescription: t.seo_description,
        seoKeywords: t.seo_keywords,
        order: t.sort,
        websiteCount: t.website_count,
        createdAt: t.create_time,
      })),
      count: countResult.total,
      page,
      pageSize,
    };
  }

  /**
   * 获取所有标签
   */
  async all() {
    const { app } = this;

    const tags = await app.model.query(
      `SELECT t.*, 
        (SELECT COUNT(*) FROM uied_website_tag_relation r WHERE r.tag_id = t.id) as website_count
       FROM uied_website_tag t
       WHERE t.is_delete = 0
       ORDER BY t.sort ASC, t.name ASC`,
      { type: app.Sequelize.QueryTypes.SELECT }
    );

    return tags.map(t => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      color: t.color,
      description: t.description,
      seoTitle: t.seo_title,
      seoDescription: t.seo_description,
      seoKeywords: t.seo_keywords,
      order: t.sort,
      websiteCount: t.website_count,
    }));
  }

  /**
   * 获取标签详情
   */
  async detail(id) {
    const { app } = this;

    const [ tag ] = await app.model.query(
      `SELECT t.*, 
        (SELECT COUNT(*) FROM uied_website_tag_relation r WHERE r.tag_id = t.id) as website_count
       FROM uied_website_tag t
       WHERE t.id = ? AND t.is_delete = 0`,
      { replacements: [ id ], type: app.Sequelize.QueryTypes.SELECT }
    );

    if (!tag) return null;

    return {
      id: tag.id,
      name: tag.name,
      slug: tag.slug,
      color: tag.color,
      description: tag.description,
      seoTitle: tag.seo_title,
      seoDescription: tag.seo_description,
      seoKeywords: tag.seo_keywords,
      order: tag.sort,
      websiteCount: tag.website_count,
      createdAt: tag.create_time,
    };
  }

  /**
   * 创建标签
   */
  async add(data) {
    const { app } = this;
    const now = Math.floor(Date.now() / 1000);

    // 检查名称是否已存在
    const [ existingName ] = await app.model.query(
      'SELECT id FROM uied_website_tag WHERE name = ? AND is_delete = 0',
      { replacements: [ data.name ], type: app.Sequelize.QueryTypes.SELECT }
    );
    if (existingName) {
      throw new Error('标签名称已存在');
    }

    // 检查 slug 是否已存在
    const [ existingSlug ] = await app.model.query(
      'SELECT id FROM uied_website_tag WHERE slug = ? AND is_delete = 0',
      { replacements: [ data.slug ], type: app.Sequelize.QueryTypes.SELECT }
    );
    if (existingSlug) {
      throw new Error('标签标识已存在');
    }

    const [ result ] = await app.model.query(
      `INSERT INTO uied_website_tag (name, slug, color, description, seo_title, seo_description, seo_keywords, sort, create_time, update_time)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      {
        replacements: [
          data.name,
          data.slug,
          data.color || '#1890ff',
          data.description || null,
          data.seoTitle || null,
          data.seoDescription || null,
          data.seoKeywords || null,
          data.order || 0,
          now,
          now,
        ],
        type: app.Sequelize.QueryTypes.INSERT,
      }
    );

    return { id: result, ...data };
  }

  /**
   * 更新标签
   */
  async edit(data) {
    const { app } = this;
    const now = Math.floor(Date.now() / 1000);

    // 检查标签是否存在
    const [ existing ] = await app.model.query(
      'SELECT id FROM uied_website_tag WHERE id = ? AND is_delete = 0',
      { replacements: [ data.id ], type: app.Sequelize.QueryTypes.SELECT }
    );
    if (!existing) {
      throw new Error('标签不存在');
    }

    // 检查名称是否与其他标签冲突
    if (data.name) {
      const [ existingName ] = await app.model.query(
        'SELECT id FROM uied_website_tag WHERE name = ? AND id != ? AND is_delete = 0',
        { replacements: [ data.name, data.id ], type: app.Sequelize.QueryTypes.SELECT }
      );
      if (existingName) {
        throw new Error('标签名称已存在');
      }
    }

    // 检查 slug 是否与其他标签冲突
    if (data.slug) {
      const [ existingSlug ] = await app.model.query(
        'SELECT id FROM uied_website_tag WHERE slug = ? AND id != ? AND is_delete = 0',
        { replacements: [ data.slug, data.id ], type: app.Sequelize.QueryTypes.SELECT }
      );
      if (existingSlug) {
        throw new Error('标签标识已存在');
      }
    }

    const updates = [];
    const values = [];

    if (data.name !== undefined) { updates.push('name = ?'); values.push(data.name); }
    if (data.slug !== undefined) { updates.push('slug = ?'); values.push(data.slug); }
    if (data.color !== undefined) { updates.push('color = ?'); values.push(data.color); }
    if (data.description !== undefined) { updates.push('description = ?'); values.push(data.description); }
    if (data.seoTitle !== undefined) { updates.push('seo_title = ?'); values.push(data.seoTitle); }
    if (data.seoDescription !== undefined) { updates.push('seo_description = ?'); values.push(data.seoDescription); }
    if (data.seoKeywords !== undefined) { updates.push('seo_keywords = ?'); values.push(data.seoKeywords); }
    if (data.order !== undefined) { updates.push('sort = ?'); values.push(data.order); }

    updates.push('update_time = ?');
    values.push(now);
    values.push(data.id);

    await app.model.query(
      `UPDATE uied_website_tag SET ${updates.join(', ')} WHERE id = ?`,
      { replacements: values, type: app.Sequelize.QueryTypes.UPDATE }
    );

    return data;
  }

  /**
   * 删除标签
   */
  async del(id) {
    const { app } = this;
    const now = Math.floor(Date.now() / 1000);

    // 删除标签关联
    await app.model.query(
      'DELETE FROM uied_website_tag_relation WHERE tag_id = ?',
      { replacements: [ id ], type: app.Sequelize.QueryTypes.DELETE }
    );

    // 软删除标签
    await app.model.query(
      'UPDATE uied_website_tag SET is_delete = 1, delete_time = ? WHERE id = ?',
      { replacements: [ now, id ], type: app.Sequelize.QueryTypes.UPDATE }
    );
  }

  /**
   * 获取网站的标签
   */
  async getWebsiteTags(websiteId) {
    const { app } = this;

    const tags = await app.model.query(
      `SELECT t.* FROM uied_website_tag t
       INNER JOIN uied_website_tag_relation r ON t.id = r.tag_id
       WHERE r.website_id = ? AND t.is_delete = 0
       ORDER BY t.sort ASC`,
      { replacements: [ websiteId ], type: app.Sequelize.QueryTypes.SELECT }
    );

    return tags.map(t => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      color: t.color,
    }));
  }

  /**
   * 设置网站的标签
   */
  async setWebsiteTags(websiteId, tagIds) {
    const { app } = this;

    // 删除现有关联
    await app.model.query(
      'DELETE FROM uied_website_tag_relation WHERE website_id = ?',
      { replacements: [ websiteId ], type: app.Sequelize.QueryTypes.DELETE }
    );

    // 创建新关联
    if (tagIds && tagIds.length > 0) {
      const values = tagIds.map(tagId => `(${websiteId}, ${tagId})`).join(',');
      await app.model.query(
        `INSERT INTO uied_website_tag_relation (website_id, tag_id) VALUES ${values}`,
        { type: app.Sequelize.QueryTypes.INSERT }
      );
    }

    return this.getWebsiteTags(websiteId);
  }
}

module.exports = WebsiteTagService;
