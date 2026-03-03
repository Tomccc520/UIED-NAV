/**
 * @copyright Tomda (https://www.tomda.top)
 * @copyright UIED技术团队 (https://fsuied.com)
 * @author UIED技术团队
 * @createDate 2026.3.2
 */

'use strict';

const baseController = require('../baseController');

class AdminSearchController extends baseController {
  /**
   * 全局搜索
   * GET /api/uied/search/global
   */
  async globalSearch() {
    const { ctx } = this;
    try {
      const { keyword, page = 1, pageSize = 20, type = 'all' } = ctx.query;

      if (!keyword || keyword.trim().length === 0) {
        return this.result({
          data: {
            websites: [],
            categories: [],
            pages: [],
            articles: [],
            users: [],
            total: 0,
          },
          message: '请输入搜索关键词',
        });
      }

      const data = await ctx.service.uied.adminSearch.globalSearch({
        keyword: keyword.trim(),
        page: Number(page),
        pageSize: Number(pageSize),
        type,
      });

      // 保存搜索历史
      if (ctx.user && ctx.user.id) {
        await ctx.service.uied.adminSearch.saveSearchHistory(ctx.user.id, keyword.trim());
      }

      this.result({ data });
    } catch (e) {
      ctx.logger.error('全局搜索失败:', e);
      this.result({ data: '', message: e.message, code: 1001 });
    }
  }

  /**
   * 快速搜索（用于顶部搜索框）
   * GET /api/uied/search/quick
   */
  async quickSearch() {
    const { ctx } = this;
    try {
      const { keyword } = ctx.query;

      if (!keyword || keyword.trim().length < 2) {
        return this.result({ data: { suggestions: [] } });
      }

      const data = await ctx.service.uied.adminSearch.quickSearch(keyword.trim());
      this.result({ data });
    } catch (e) {
      ctx.logger.error('快速搜索失败:', e);
      this.result({ data: { suggestions: [] }, message: e.message, code: 1001 });
    }
  }

  /**
   * 获取搜索历史
   * GET /api/uied/search/history
   */
  async getHistory() {
    const { ctx } = this;
    try {
      const { limit = 10 } = ctx.query;
      const userId = ctx.user?.id;

      if (!userId) {
        return this.result({ data: [] });
      }

      const data = await ctx.service.uied.adminSearch.getSearchHistory(userId, Number(limit));
      this.result({ data });
    } catch (e) {
      ctx.logger.error('获取搜索历史失败:', e);
      this.result({ data: [], message: e.message, code: 1001 });
    }
  }

  /**
   * 清空搜索历史
   * POST /api/uied/search/history/clear
   */
  async clearHistory() {
    const { ctx } = this;
    try {
      const userId = ctx.user?.id;

      if (!userId) {
        return this.result({ message: '未登录', code: 401 });
      }

      await ctx.service.uied.adminSearch.clearSearchHistory(userId);
      this.result({ message: '清空成功' });
    } catch (e) {
      ctx.logger.error('清空搜索历史失败:', e);
      this.result({ data: '', message: e.message, code: 1001 });
    }
  }
}

module.exports = AdminSearchController;

