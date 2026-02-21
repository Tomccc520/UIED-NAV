/**
 * @file controller/uied/rankBoard.js
 * @description UIED 榜单系统控制器
 * @author UIED技术团队
 * @copyright Tomda (https://www.tomda.top)
 * @copyright UIED技术团队 (https://fsuied.com)
 * @createDate 2026-02-21
 */

'use strict';

const baseController = require('../baseController');

class RankBoardController extends baseController {
  /**
   * 获取榜单配置列表
   */
  async configList() {
    const { ctx } = this;
    const includeDisabled = String(ctx.query?.includeDisabled || '1').trim() === '1';
    try {
      const list = await ctx.service.uied.rankBoard.getConfigList({ includeDisabled });
      this.result({
        data: {
          list,
          total: Array.isArray(list) ? list.length : 0,
        },
      });
    } catch (error) {
      ctx.logger.error('获取榜单配置失败:', error);
      this.result({ code: 500, message: error.message || '获取榜单配置失败' });
    }
  }

  /**
   * 保存榜单配置
   */
  async configSave() {
    const { ctx } = this;
    const list = Array.isArray(ctx.request.body?.list) ? ctx.request.body.list : [];
    if (list.length === 0) {
      this.result({ code: 400, message: '请提供配置列表' });
      return;
    }
    try {
      const rows = await ctx.service.uied.rankBoard.saveConfigList(list);
      this.result({
        data: {
          list: rows,
          total: Array.isArray(rows) ? rows.length : 0,
        },
        message: '保存成功',
      });
    } catch (error) {
      ctx.logger.error('保存榜单配置失败:', error);
      this.result({ code: 500, message: error.message || '保存榜单配置失败' });
    }
  }

  /**
   * 获取榜单聚合列表
   */
  async list() {
    const { ctx } = this;
    const boardKey = String(ctx.query?.boardKey || '').trim();
    const limit = Number.parseInt(String(ctx.query?.limit || ''), 10);
    try {
      const data = await ctx.service.uied.rankBoard.getBoardList({
        boardKey,
        limit: Number.isInteger(limit) ? limit : undefined,
      });
      this.result({ data });
    } catch (error) {
      ctx.logger.error('获取榜单聚合失败:', error);
      this.result({ code: 500, message: error.message || '获取榜单聚合失败' });
    }
  }

  /**
   * 预览单个榜单
   */
  async preview() {
    const { ctx } = this;
    const boardKey = String(ctx.query?.boardKey || '').trim();
    const limit = Number.parseInt(String(ctx.query?.limit || ''), 10);
    if (!boardKey) {
      this.result({ code: 400, message: '缺少榜单键 boardKey' });
      return;
    }
    try {
      const items = await ctx.service.uied.rankBoard.queryBoardItems(boardKey, limit || 20);
      this.result({
        data: {
          boardKey,
          total: Array.isArray(items) ? items.length : 0,
          items,
        },
      });
    } catch (error) {
      ctx.logger.error('预览榜单失败:', error);
      this.result({ code: 500, message: error.message || '预览榜单失败' });
    }
  }

  /**
   * 获取后台字段草案
   */
  async schema() {
    const { ctx } = this;
    try {
      const [ draft, configs ] = await Promise.all([
        ctx.service.uied.rankBoard.getFieldDraft(),
        ctx.service.uied.rankBoard.getConfigList({ includeDisabled: true }),
      ]);
      this.result({
        data: {
          draft,
          configs,
        },
      });
    } catch (error) {
      ctx.logger.error('获取榜单字段草案失败:', error);
      this.result({ code: 500, message: error.message || '获取榜单字段草案失败' });
    }
  }
}

module.exports = RankBoardController;
