/**
 * @file controller/uied/dailyHot.js
 * @description UIED 每日热榜控制器
 * @author UIED技术团队
 * @copyright Tomda (https://www.tomda.top)
 * @copyright UIED技术团队 (https://fsuied.com)
 * @createDate 2026-02-21
 */

'use strict';

const baseController = require('../baseController');

class DailyHotController extends baseController {
  /**
   * 获取每日热榜配置
   */
  async configGet() {
    const { ctx } = this;
    try {
      const data = await ctx.service.uied.dailyHot.getConfig();
      this.result({ data });
    } catch (error) {
      ctx.logger.error('获取每日热榜配置失败:', error);
      this.result({ code: 500, message: '获取每日热榜配置失败' });
    }
  }

  /**
   * 保存每日热榜配置
   */
  async configSave() {
    const { ctx } = this;
    try {
      const data = await ctx.service.uied.dailyHot.saveConfig(ctx.request.body || {});
      this.result({ data, message: '保存成功' });
    } catch (error) {
      ctx.logger.error('保存每日热榜配置失败:', error);
      this.result({ code: 500, message: error.message || '保存每日热榜配置失败' });
    }
  }

  /**
   * 获取每日热榜平台配置列表
   */
  async platformConfigList() {
    const { ctx } = this;
    const withRemote = String(ctx.query?.withRemote || '').trim() === '1';
    const forceRefresh = String(ctx.query?.refresh || '').trim() === '1';
    try {
      const list = await ctx.service.uied.dailyHot.getPlatformConfigList();
      if (!withRemote) {
        this.result({
          data: {
            list,
            total: Array.isArray(list) ? list.length : 0,
          },
        });
        return;
      }
      const merged = await ctx.service.uied.dailyHot.getPlatforms({ forceRefresh });
      this.result({
        data: {
          list,
          total: Array.isArray(list) ? list.length : 0,
          mergedPlatforms: merged?.platforms || [],
          mergedTotal: Number(merged?.total || 0),
          mergedFromCache: Boolean(merged?.fromCache),
        },
      });
    } catch (error) {
      ctx.logger.error('获取每日热榜平台配置失败:', error);
      this.result({ code: 500, message: error.message || '获取每日热榜平台配置失败' });
    }
  }

  /**
   * 保存每日热榜平台配置（支持单条/批量）
   */
  async platformConfigSave() {
    const { ctx } = this;
    const body = ctx.request.body || {};
    const list = Array.isArray(body.list)
      ? body.list
      : (body.platformTitle || body.title ? [ body ] : []);
    if (!Array.isArray(list) || list.length === 0) {
      this.result({ code: 400, message: '请提供平台配置数据' });
      return;
    }
    try {
      const data = await ctx.service.uied.dailyHot.savePlatformConfigList(list, {
        clearMissing: Boolean(body.clearMissing),
      });
      this.result({
        data: {
          list: data,
          total: Array.isArray(data) ? data.length : 0,
        },
        message: '保存成功',
      });
    } catch (error) {
      ctx.logger.error('保存每日热榜平台配置失败:', error);
      this.result({ code: 500, message: error.message || '保存每日热榜平台配置失败' });
    }
  }

  /**
   * 删除每日热榜平台配置
   */
  async platformConfigDel() {
    const { ctx } = this;
    const id = Number(ctx.request.body?.id || ctx.query?.id || 0);
    if (!Number.isInteger(id) || id <= 0) {
      this.result({ code: 400, message: '平台配置ID无效' });
      return;
    }
    try {
      const data = await ctx.service.uied.dailyHot.delPlatformConfig(id);
      this.result({ data, message: '删除成功' });
    } catch (error) {
      ctx.logger.error('删除每日热榜平台配置失败:', error);
      this.result({ code: 500, message: error.message || '删除每日热榜平台配置失败' });
    }
  }

  /**
   * 获取每日热榜后台字段草案
   */
  async schema() {
    const { ctx } = this;
    try {
      const [ draft, config, platformConfigs ] = await Promise.all([
        ctx.service.uied.dailyHot.getFieldDraft(),
        ctx.service.uied.dailyHot.getConfig(),
        ctx.service.uied.dailyHot.getPlatformConfigList(),
      ]);
      this.result({
        data: {
          draft,
          config,
          platformConfigs,
        },
      });
    } catch (error) {
      ctx.logger.error('获取每日热榜字段草案失败:', error);
      this.result({ code: 500, message: error.message || '获取每日热榜字段草案失败' });
    }
  }

  /**
   * 获取平台列表
   */
  async platforms() {
    const { ctx } = this;
    const forceRefresh = String(ctx.query?.refresh || '').trim() === '1';
    try {
      const data = await ctx.service.uied.dailyHot.getPlatforms({ forceRefresh });
      this.result({ data });
    } catch (error) {
      ctx.logger.error('获取每日热榜平台失败:', error);
      this.result({ code: 500, message: error.message || '获取每日热榜平台失败' });
    }
  }

  /**
   * 获取今日热榜聚合结果
   */
  async list() {
    const { ctx } = this;
    const query = ctx.query || {};
    try {
      const data = await ctx.service.uied.dailyHot.aggregateTodayHot({
        title: query.title,
        titles: query.titles,
        limit: query.limit,
        platformLimit: query.platformLimit,
        forceRefresh: String(query.refresh || '').trim() === '1',
      });
      this.result({ data });
    } catch (error) {
      ctx.logger.error('获取每日热榜聚合失败:', error);
      this.result({ code: 500, message: error.message || '获取每日热榜聚合失败' });
    }
  }

  /**
   * 刷新缓存并返回最新热榜
   */
  async refresh() {
    const { ctx } = this;
    const query = ctx.query || {};
    try {
      const data = await ctx.service.uied.dailyHot.aggregateTodayHot({
        title: query.title,
        titles: query.titles,
        limit: query.limit,
        platformLimit: query.platformLimit,
        forceRefresh: true,
      });
      this.result({ data, message: '刷新成功' });
    } catch (error) {
      ctx.logger.error('刷新每日热榜失败:', error);
      this.result({ code: 500, message: error.message || '刷新每日热榜失败' });
    }
  }
}

module.exports = DailyHotController;
