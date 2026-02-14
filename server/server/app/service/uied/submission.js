/**
 * @file service/uied/submission.js
 * @description 网站提交服务
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

'use strict';

const Service = require('egg').Service;

class SubmissionService extends Service {
  /**
   * 检查 URL 是否已存在
   */
  async checkUrl(url) {
    const { app } = this;

    // 标准化 URL
    const normalizedUrl = url.replace(/^https?:\/\//, '').replace(/\/$/, '');

    // 检查网站表
    const [ existingWebsite ] = await app.model.query(
      `SELECT id, name, url FROM uied_website 
       WHERE url LIKE ? AND is_delete = 0`,
      { replacements: [ `%${normalizedUrl}%` ], type: app.Sequelize.QueryTypes.SELECT }
    );

    if (existingWebsite) {
      return {
        exists: true,
        type: 'website',
        message: '该网站已被收录',
        website: existingWebsite,
      };
    }

    // 检查待审核队列
    const [ existingSubmission ] = await app.model.query(
      `SELECT id, name, url, create_time as createdAt FROM uied_website_submission 
       WHERE url LIKE ? AND status = 'pending'`,
      { replacements: [ `%${normalizedUrl}%` ], type: app.Sequelize.QueryTypes.SELECT }
    );

    if (existingSubmission) {
      return {
        exists: true,
        type: 'pending',
        message: '该网站已在审核队列中',
        submission: existingSubmission,
      };
    }

    return { exists: false };
  }

  /**
   * 提交网站
   */
  async submit(data) {
    const { app } = this;
    const now = Math.floor(Date.now() / 1000);

    // 检查 URL 是否已存在
    const checkResult = await this.checkUrl(data.url);
    if (checkResult.exists) {
      throw new Error(checkResult.message);
    }

    const [ result ] = await app.model.query(
      `INSERT INTO uied_website_submission 
       (name, description, url, icon_url, category_id, tags, submitter_name, submitter_email, submitter_ip, status, create_time, update_time)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
      {
        replacements: [
          data.name,
          data.description || '',
          data.url,
          data.iconUrl || null,
          data.categoryId || null,
          data.tags || null,
          data.submitterName || null,
          data.submitterEmail || null,
          data.submitterIp || null,
          now,
          now,
        ],
        type: app.Sequelize.QueryTypes.INSERT,
      }
    );

    return { id: result, message: '提交成功，等待审核' };
  }

  /**
   * 获取提交状态
   */
  async getStatus(id) {
    const { app } = this;

    const [ submission ] = await app.model.query(
      `SELECT id, name, url, status, reject_reason as rejectReason, 
              create_time as createdAt, reviewed_at as reviewedAt
       FROM uied_website_submission WHERE id = ?`,
      { replacements: [ id ], type: app.Sequelize.QueryTypes.SELECT }
    );

    return submission || null;
  }

  /**
   * 获取提交列表（后台管理）
   */
  async list({ page = 1, pageSize = 20, status }) {
    const { app } = this;
    const offset = (page - 1) * pageSize;

    let whereClause = '1=1';
    const replacements = [];

    if (status) {
      whereClause += ' AND status = ?';
      replacements.push(status);
    }

    const [ countResult ] = await app.model.query(
      `SELECT COUNT(*) as total FROM uied_website_submission WHERE ${whereClause}`,
      { replacements, type: app.Sequelize.QueryTypes.SELECT }
    );

    const submissions = await app.model.query(
      `SELECT * FROM uied_website_submission
       WHERE ${whereClause}
       ORDER BY create_time DESC
       LIMIT ? OFFSET ?`,
      { replacements: [ ...replacements, pageSize, offset ], type: app.Sequelize.QueryTypes.SELECT }
    );

    return {
      lists: submissions.map(s => ({
        id: s.id,
        name: s.name,
        description: s.description,
        url: s.url,
        iconUrl: s.icon_url,
        categoryId: s.category_id,
        tags: s.tags,
        submitterName: s.submitter_name,
        submitterEmail: s.submitter_email,
        submitterIp: s.submitter_ip,
        status: s.status,
        rejectReason: s.reject_reason,
        createdAt: s.create_time,
        reviewedAt: s.reviewed_at,
      })),
      count: countResult.total,
      page,
      pageSize,
    };
  }

  /**
   * 获取待审核数量
   */
  async getPendingCount() {
    const { app } = this;

    const [ result ] = await app.model.query(
      "SELECT COUNT(*) as count FROM uied_website_submission WHERE status = 'pending'",
      { type: app.Sequelize.QueryTypes.SELECT }
    );

    return result.count;
  }

  /**
   * 审核通过
   */
  async approve(id, categoryId) {
    const { app } = this;
    const now = Math.floor(Date.now() / 1000);

    // 获取提交记录
    const [ submission ] = await app.model.query(
      'SELECT * FROM uied_website_submission WHERE id = ?',
      { replacements: [ id ], type: app.Sequelize.QueryTypes.SELECT }
    );

    if (!submission) {
      throw new Error('未找到提交记录');
    }

    if (submission.status !== 'pending') {
      throw new Error('该提交已被处理');
    }

    const finalCategoryId = categoryId || submission.category_id;
    if (!finalCategoryId) {
      throw new Error('请选择分类');
    }

    // 创建网站
    await app.model.query(
      `INSERT INTO uied_website 
       (name, description, url, icon_url, category_id, tags, is_new, create_time, update_time)
       VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)`,
      {
        replacements: [
          submission.name,
          submission.description || '',
          submission.url,
          submission.icon_url,
          finalCategoryId,
          submission.tags || '',
          now,
          now,
        ],
        type: app.Sequelize.QueryTypes.INSERT,
      }
    );

    // 更新提交状态
    await app.model.query(
      "UPDATE uied_website_submission SET status = 'approved', reviewed_at = ?, update_time = ? WHERE id = ?",
      { replacements: [ now, now, id ], type: app.Sequelize.QueryTypes.UPDATE }
    );

    return { message: '审核通过，网站已添加' };
  }

  /**
   * 审核拒绝
   */
  async reject(id, reason) {
    const { app } = this;
    const now = Math.floor(Date.now() / 1000);

    // 检查提交记录
    const [ submission ] = await app.model.query(
      'SELECT status FROM uied_website_submission WHERE id = ?',
      { replacements: [ id ], type: app.Sequelize.QueryTypes.SELECT }
    );

    if (!submission) {
      throw new Error('未找到提交记录');
    }

    if (submission.status !== 'pending') {
      throw new Error('该提交已被处理');
    }

    await app.model.query(
      "UPDATE uied_website_submission SET status = 'rejected', reject_reason = ?, reviewed_at = ?, update_time = ? WHERE id = ?",
      { replacements: [ reason || '不符合收录标准', now, now, id ], type: app.Sequelize.QueryTypes.UPDATE }
    );

    return { message: '已拒绝' };
  }

  /**
   * 删除提交记录
   */
  async del(id) {
    const { app } = this;

    await app.model.query(
      'DELETE FROM uied_website_submission WHERE id = ?',
      { replacements: [ id ], type: app.Sequelize.QueryTypes.DELETE }
    );
  }

  /**
   * 更新提交记录
   */
  async edit(data) {
    const { app } = this;
    const now = Math.floor(Date.now() / 1000);

    const updates = [];
    const values = [];

    if (data.name !== undefined) { updates.push('name = ?'); values.push(data.name); }
    if (data.description !== undefined) { updates.push('description = ?'); values.push(data.description); }
    if (data.url !== undefined) { updates.push('url = ?'); values.push(data.url); }
    if (data.iconUrl !== undefined) { updates.push('icon_url = ?'); values.push(data.iconUrl); }
    if (data.categoryId !== undefined) { updates.push('category_id = ?'); values.push(data.categoryId); }
    if (data.tags !== undefined) { updates.push('tags = ?'); values.push(data.tags); }

    updates.push('update_time = ?');
    values.push(now);
    values.push(data.id);

    await app.model.query(
      `UPDATE uied_website_submission SET ${updates.join(', ')} WHERE id = ?`,
      { replacements: values, type: app.Sequelize.QueryTypes.UPDATE }
    );

    return data;
  }
}

module.exports = SubmissionService;
