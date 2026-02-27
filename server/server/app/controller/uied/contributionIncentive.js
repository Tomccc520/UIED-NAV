/**
 * @file controller/uied/contributionIncentive.js
 * @description UIED 投稿激励闭环控制器（积分/等级/勋章/推荐位）
 * @author UIED技术团队
 * @copyright Tomda (https://www.tomda.top)
 * @copyright UIED技术团队 (https://fsuied.com)
 * @createDate 2026-02-21
 */

'use strict';

const baseController = require('../baseController');
const { reqAdminIdKey } = require('../../extend/config');

class ContributionIncentiveController extends baseController {
  /**
   * 获取投稿激励设置
   */
  async settingsGet() {
    const { ctx } = this;
    try {
      const data = await ctx.service.uied.contributionIncentive.getSettings();
      this.result({ data });
    } catch (error) {
      ctx.logger.error('获取投稿激励设置失败:', error);
      this.result({ code: 500, message: error.message || '获取投稿激励设置失败' });
    }
  }

  /**
   * 保存投稿激励设置
   */
  async settingsSave() {
    const { ctx } = this;
    const payload = ctx.request.body || {};
    try {
      const data = await ctx.service.uied.contributionIncentive.saveSettings(payload);
      this.result({ data, message: '保存成功' });
    } catch (error) {
      ctx.logger.error('保存投稿激励设置失败:', error);
      this.result({ code: 500, message: error.message || '保存投稿激励设置失败' });
    }
  }

  /**
   * 获取勋章列表
   */
  async badgeList() {
    const { ctx } = this;
    const includeDisabled = String(ctx.query?.includeDisabled || '1').trim() === '1';
    try {
      const list = await ctx.service.uied.contributionIncentive.badgeList({ includeDisabled });
      this.result({
        data: {
          list,
          total: Array.isArray(list) ? list.length : 0,
        },
      });
    } catch (error) {
      ctx.logger.error('获取投稿勋章列表失败:', error);
      this.result({ code: 500, message: error.message || '获取投稿勋章列表失败' });
    }
  }

  /**
   * 保存勋章
   */
  async badgeSave() {
    const { ctx } = this;
    const payload = ctx.request.body || {};
    try {
      const data = await ctx.service.uied.contributionIncentive.badgeSave(payload);
      this.result({ data, message: '保存成功' });
    } catch (error) {
      ctx.logger.error('保存投稿勋章失败:', error);
      this.result({ code: 500, message: error.message || '保存投稿勋章失败' });
    }
  }

  /**
   * 删除勋章
   */
  async badgeDel() {
    const { ctx } = this;
    const id = Number(ctx.request.body?.id || 0);
    if (!id) {
      this.result({ code: 400, message: '缺少勋章ID' });
      return;
    }
    try {
      const data = await ctx.service.uied.contributionIncentive.badgeDel(id);
      this.result({ data, message: '删除成功' });
    } catch (error) {
      ctx.logger.error('删除投稿勋章失败:', error);
      this.result({ code: 500, message: error.message || '删除投稿勋章失败' });
    }
  }

  /**
   * 获取推荐位列表
   */
  async featuredList() {
    const { ctx } = this;
    const query = ctx.query || {};
    try {
      const data = await ctx.service.uied.contributionIncentive.featuredList(query);
      this.result({ data });
    } catch (error) {
      ctx.logger.error('获取投稿推荐位列表失败:', error);
      this.result({ code: 500, message: error.message || '获取投稿推荐位列表失败' });
    }
  }

  /**
   * 保存推荐位
   */
  async featuredSave() {
    const { ctx } = this;
    const body = ctx.request.body || {};
    const adminId = Number(ctx.session?.[reqAdminIdKey] || 0);
    try {
      const data = await ctx.service.uied.contributionIncentive.featuredSave({
        ...body,
        adminId,
      });
      this.result({ data, message: '保存成功' });
    } catch (error) {
      ctx.logger.error('保存投稿推荐位失败:', error);
      this.result({ code: 500, message: error.message || '保存投稿推荐位失败' });
    }
  }

  /**
   * 删除推荐位
   */
  async featuredDel() {
    const { ctx } = this;
    const id = Number(ctx.request.body?.id || 0);
    if (!id) {
      this.result({ code: 400, message: '缺少推荐位ID' });
      return;
    }
    try {
      const data = await ctx.service.uied.contributionIncentive.featuredDel(id);
      this.result({ data, message: '删除成功' });
    } catch (error) {
      ctx.logger.error('删除投稿推荐位失败:', error);
      this.result({ code: 500, message: error.message || '删除投稿推荐位失败' });
    }
  }

  /**
   * 获取投稿激励用户列表
   */
  async userList() {
    const { ctx } = this;
    const query = ctx.query || {};
    try {
      const data = await ctx.service.uied.contributionIncentive.userList(query);
      this.result({ data });
    } catch (error) {
      ctx.logger.error('获取投稿激励用户列表失败:', error);
      this.result({ code: 500, message: error.message || '获取投稿激励用户列表失败' });
    }
  }

  /**
   * 获取投稿激励用户详情
   */
  async userDetail() {
    const { ctx } = this;
    const userId = Number(ctx.query?.userId || ctx.query?.id || 0);
    if (!userId) {
      this.result({ code: 400, message: '缺少用户ID' });
      return;
    }
    try {
      const data = await ctx.service.uied.contributionIncentive.userDetail(userId);
      this.result({ data });
    } catch (error) {
      ctx.logger.error('获取投稿激励用户详情失败:', error);
      this.result({ code: 500, message: error.message || '获取投稿激励用户详情失败' });
    }
  }

  /**
   * 获取投稿激励日志
   */
  async logList() {
    const { ctx } = this;
    const query = ctx.query || {};
    try {
      const data = await ctx.service.uied.contributionIncentive.logList(query);
      this.result({ data });
    } catch (error) {
      ctx.logger.error('获取投稿激励日志失败:', error);
      this.result({ code: 500, message: error.message || '获取投稿激励日志失败' });
    }
  }

  /**
   * 获取投稿激励排行榜
   */
  async leaderboard() {
    const { ctx } = this;
    const limit = Number.parseInt(String(ctx.query?.limit || ''), 10);
    try {
      const list = await ctx.service.uied.contributionIncentive.leaderboard(Number.isInteger(limit) ? limit : 20);
      this.result({
        data: {
          list,
          total: Array.isArray(list) ? list.length : 0,
        },
      });
    } catch (error) {
      ctx.logger.error('获取投稿激励排行榜失败:', error);
      this.result({ code: 500, message: error.message || '获取投稿激励排行榜失败' });
    }
  }

  /**
   * 获取投稿激励字段草案
   */
  async schema() {
    const { ctx } = this;
    try {
      const [ settings, badges, draft ] = await Promise.all([
        ctx.service.uied.contributionIncentive.getSettings(),
        ctx.service.uied.contributionIncentive.badgeList({ includeDisabled: true }),
        ctx.service.uied.contributionIncentive.getFieldDraft(),
      ]);
      this.result({
        data: {
          settings,
          badges,
          draft,
        },
      });
    } catch (error) {
      ctx.logger.error('获取投稿激励字段草案失败:', error);
      this.result({ code: 500, message: error.message || '获取投稿激励字段草案失败' });
    }
  }
}

module.exports = ContributionIncentiveController;
