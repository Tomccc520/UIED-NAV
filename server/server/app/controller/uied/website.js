/**
 * @file controller/uied/website.js
 * @description UIED 网站管理控制器
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

'use strict';

const baseController = require('../baseController');

class WebsiteController extends baseController {
  /**
   * 获取网站列表（分页）
   */
  async list() {
    const { ctx } = this;
    try {
      const { pageNo = 1, pageSize = 15, categoryId, keyword, status, includeChildren } = ctx.query;
      const result = await ctx.service.uied.website.list({
        page: parseInt(pageNo),
        pageSize: parseInt(pageSize),
        categoryId,
        keyword,
        status,
        includeChildren: includeChildren === 'true' || includeChildren === '1',
      });
      this.result({ data: result });
    } catch (error) {
      ctx.logger.error('获取网站列表失败:', error);
      this.result({ code: 500, message: '获取网站列表失败' });
    }
  }

  /**
   * 获取网站详情
   */
  async detail() {
    const { ctx } = this;
    try {
      const { id, slug } = ctx.query;
      if (!id && !slug) {
        return this.result({ code: 400, message: '缺少网站ID或slug' });
      }
      const result = await ctx.service.uied.website.detail(id, slug);
      if (!result) {
        return this.result({ code: 404, message: '网站不存在' });
      }
      this.result({ data: result });
    } catch (error) {
      ctx.logger.error('获取网站详情失败:', error);
      this.result({ code: 500, message: '获取网站详情失败' });
    }
  }

  /**
   * 创建网站
   */
  async add() {
    const { ctx } = this;
    try {
      const data = ctx.request.body;
      if (!data.name || !data.url || !data.categoryId) {
        return this.result({ code: 400, message: '名称、URL和分类不能为空' });
      }
      const result = await ctx.service.uied.website.add(data);
      this.result({ data: result, message: '创建成功' });
    } catch (error) {
      ctx.logger.error('创建网站失败:', error);
      if (error.message.includes('已存在')) {
        return this.result({ code: 400, message: error.message });
      }
      this.result({ code: 500, message: '创建网站失败' });
    }
  }


  /**
   * 更新网站
   */
  async edit() {
    const { ctx } = this;
    try {
      const data = ctx.request.body;
      if (!data.id) {
        return this.result({ code: 400, message: '缺少网站ID' });
      }
      const result = await ctx.service.uied.website.edit(data);
      this.result({ data: result, message: '更新成功' });
    } catch (error) {
      ctx.logger.error('更新网站失败:', error);
      if (error.message.includes('已存在') || error.message.includes('不存在')) {
        return this.result({ code: 400, message: error.message });
      }
      this.result({ code: 500, message: '更新网站失败' });
    }
  }

  /**
   * 删除网站
   */
  async del() {
    const { ctx } = this;
    try {
      const { id } = ctx.request.body;
      if (!id) {
        return this.result({ code: 400, message: '缺少网站ID' });
      }
      await ctx.service.uied.website.del(id);
      this.result({ message: '删除成功' });
    } catch (error) {
      ctx.logger.error('删除网站失败:', error);
      this.result({ code: 500, message: '删除网站失败' });
    }
  }

  /**
   * 批量删除网站
   */
  async batchDel() {
    const { ctx } = this;
    try {
      const { ids } = ctx.request.body;
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return this.result({ code: 400, message: '请选择要删除的网站' });
      }
      await ctx.service.uied.website.batchDel(ids);
      this.result({ message: `成功删除 ${ids.length} 个网站` });
    } catch (error) {
      ctx.logger.error('批量删除失败:', error);
      this.result({ code: 500, message: '批量删除失败' });
    }
  }

  /**
   * 增加点击次数
   */
  async click() {
    const { ctx } = this;
    try {
      const { id } = ctx.request.body;
      if (!id) {
        return this.result({ code: 400, message: '缺少网站ID' });
      }
      await ctx.service.uied.website.incrementClick(id);
      this.result({ message: '成功' });
    } catch (error) {
      ctx.logger.error('增加点击次数失败:', error);
      this.result({ code: 500, message: '操作失败' });
    }
  }

  /**
   * 搜索网站（支持关键词搜索或ID列表查询）
   */
  async search() {
    const { ctx } = this;
    try {
      const { keyword, pageSlug, page = 1, pageSize = 20, ids } = ctx.query;
      
      // 如果传入了 ids，通过ID列表查询
      if (ids) {
        const idList = ids.split(',').map(id => id.trim()).filter(Boolean);
        const websites = await ctx.service.uied.website.getByIds(idList);
        return this.result({ data: { lists: websites, count: websites.length } });
      }
      
      // 否则按关键词搜索
      if (!keyword) {
        return this.result({ code: 400, message: '请输入搜索关键词' });
      }
      const result = await ctx.service.uied.website.search({
        keyword,
        pageSlug,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
      });
      this.result({ data: result });
    } catch (error) {
      ctx.logger.error('搜索失败:', error);
      this.result({ code: 500, message: '搜索失败' });
    }
  }
}

module.exports = WebsiteController;
