/**
 * @file controller/uied/banner.js
 * @description UIED 广告管理控制器
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

'use strict';

const baseController = require('../baseController');

class BannerController extends baseController {
  async list() {
    const { ctx } = this;
    try {
      const params = { ...ctx.query, ...ctx.request.body };
      const result = await ctx.service.uied.banner.list(params);
      this.result({ data: result });
    } catch (error) {
      ctx.logger.error('获取广告列表失败:', error);
      this.result({ code: 500, message: '获取广告列表失败' });
    }
  }

  async detail() {
    const { ctx } = this;
    try {
      const { id } = { ...ctx.query, ...ctx.request.body };
      if (!id) {
        return this.result({ code: 400, message: '参数错误' });
      }
      const result = await ctx.service.uied.banner.detail(id);
      this.result({ data: result });
    } catch (error) {
      ctx.logger.error('获取广告详情失败:', error);
      this.result({ code: 500, message: '获取广告详情失败' });
    }
  }

  async add() {
    const { ctx } = this;
    try {
      const data = ctx.request.body;
      const result = await ctx.service.uied.banner.add(data);
      this.result({ data: result, message: '添加成功' });
    } catch (error) {
      ctx.logger.error('添加广告失败:', error);
      this.result({ code: 500, message: '添加广告失败' });
    }
  }

  async edit() {
    const { ctx } = this;
    try {
      const data = ctx.request.body;
      if (!data.id) {
        return this.result({ code: 400, message: '参数错误' });
      }
      await ctx.service.uied.banner.edit(data);
      this.result({ message: '编辑成功' });
    } catch (error) {
      ctx.logger.error('编辑广告失败:', error);
      this.result({ code: 500, message: '编辑广告失败' });
    }
  }

  async del() {
    const { ctx } = this;
    try {
      const { id } = ctx.request.body;
      if (!id) {
        return this.result({ code: 400, message: '参数错误' });
      }
      await ctx.service.uied.banner.del(id);
      this.result({ message: '删除成功' });
    } catch (error) {
      ctx.logger.error('删除广告失败:', error);
      this.result({ code: 500, message: '删除广告失败' });
    }
  }
}

module.exports = BannerController;
