/**
 * @file controller/uied/websiteTag.js
 * @description 网站标签管理控制器
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

'use strict';

const baseController = require('../baseController');

class WebsiteTagController extends baseController {
  /**
   * 获取标签列表（分页）
   */
  async list() {
    const { ctx } = this;
    try {
      const { pageNo = 1, pageSize = 20 } = ctx.query;
      const result = await ctx.service.uied.websiteTag.list({
        page: parseInt(pageNo),
        pageSize: parseInt(pageSize),
      });
      this.result({ data: result });
    } catch (error) {
      ctx.logger.error('获取标签列表失败:', error);
      this.result({ code: 500, message: '获取标签列表失败' });
    }
  }

  /**
   * 获取所有标签
   */
  async all() {
    const { ctx } = this;
    try {
      const result = await ctx.service.uied.websiteTag.all();
      this.result({ data: result });
    } catch (error) {
      ctx.logger.error('获取所有标签失败:', error);
      this.result({ code: 500, message: '获取标签失败' });
    }
  }

  /**
   * 获取标签详情
   */
  async detail() {
    const { ctx } = this;
    try {
      const { id } = ctx.query;
      if (!id) {
        return this.result({ code: 400, message: '缺少标签ID' });
      }
      const result = await ctx.service.uied.websiteTag.detail(parseInt(id));
      if (!result) {
        return this.result({ code: 404, message: '标签不存在' });
      }
      this.result({ data: result });
    } catch (error) {
      ctx.logger.error('获取标签详情失败:', error);
      this.result({ code: 500, message: '获取标签详情失败' });
    }
  }

  /**
   * 创建标签
   */
  async add() {
    const { ctx } = this;
    try {
      const data = ctx.request.body;
      if (!data.name || !data.slug) {
        return this.result({ code: 400, message: '名称和标识不能为空' });
      }
      const result = await ctx.service.uied.websiteTag.add(data);
      this.result({ data: result, message: '创建成功' });
    } catch (error) {
      ctx.logger.error('创建标签失败:', error);
      if (error.message.includes('已存在')) {
        return this.result({ code: 400, message: error.message });
      }
      this.result({ code: 500, message: '创建标签失败' });
    }
  }

  /**
   * 更新标签
   */
  async edit() {
    const { ctx } = this;
    try {
      const data = ctx.request.body;
      if (!data.id) {
        return this.result({ code: 400, message: '缺少标签ID' });
      }
      const result = await ctx.service.uied.websiteTag.edit(data);
      this.result({ data: result, message: '更新成功' });
    } catch (error) {
      ctx.logger.error('更新标签失败:', error);
      if (error.message.includes('已存在') || error.message.includes('不存在')) {
        return this.result({ code: 400, message: error.message });
      }
      this.result({ code: 500, message: '更新标签失败' });
    }
  }

  /**
   * 删除标签
   */
  async del() {
    const { ctx } = this;
    try {
      const { id } = ctx.request.body;
      if (!id) {
        return this.result({ code: 400, message: '缺少标签ID' });
      }
      await ctx.service.uied.websiteTag.del(parseInt(id));
      this.result({ message: '删除成功' });
    } catch (error) {
      ctx.logger.error('删除标签失败:', error);
      this.result({ code: 500, message: '删除标签失败' });
    }
  }

  /**
   * 获取网站的标签
   */
  async websiteTags() {
    const { ctx } = this;
    try {
      const { websiteId } = ctx.query;
      if (!websiteId) {
        return this.result({ code: 400, message: '缺少网站ID' });
      }
      const result = await ctx.service.uied.websiteTag.getWebsiteTags(parseInt(websiteId));
      this.result({ data: result });
    } catch (error) {
      ctx.logger.error('获取网站标签失败:', error);
      this.result({ code: 500, message: '获取网站标签失败' });
    }
  }

  /**
   * 设置网站的标签
   */
  async setWebsiteTags() {
    const { ctx } = this;
    try {
      const { websiteId, tagIds } = ctx.request.body;
      if (!websiteId) {
        return this.result({ code: 400, message: '缺少网站ID' });
      }
      const result = await ctx.service.uied.websiteTag.setWebsiteTags(
        parseInt(websiteId),
        tagIds || []
      );
      this.result({ data: result, message: '设置成功' });
    } catch (error) {
      ctx.logger.error('设置网站标签失败:', error);
      this.result({ code: 500, message: '设置网站标签失败' });
    }
  }
}

module.exports = WebsiteTagController;
