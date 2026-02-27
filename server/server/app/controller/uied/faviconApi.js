/**
 * @file controller/uied/faviconApi.js
 * @description UIED Favicon API 配置控制器
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

'use strict';

const baseController = require('../baseController');

class FaviconApiController extends baseController {
  async list() {
    const { ctx } = this;
    const params = { ...ctx.query, ...ctx.request.body };
    const result = await ctx.service.uied.faviconApi.list(params);
    this.result({ data: result });
  }

  async detail() {
    const { ctx } = this;
    const { id } = { ...ctx.query, ...ctx.request.body };
    if (!id) {
      return this.result({ code: 400, message: '参数错误' });
    }
    const result = await ctx.service.uied.faviconApi.detail(id);
    this.result({ data: result });
  }

  async add() {
    const { ctx } = this;
    const data = ctx.request.body;
    const result = await ctx.service.uied.faviconApi.add(data);
    this.result({ data: result, message: '添加成功' });
  }

  async edit() {
    const { ctx } = this;
    const data = ctx.request.body;
    if (!data.id) {
      return this.result({ code: 400, message: '参数错误' });
    }
    await ctx.service.uied.faviconApi.edit(data);
    this.result({ message: '编辑成功' });
  }

  async del() {
    const { ctx } = this;
    const { id } = ctx.request.body;
    if (!id) {
      return this.result({ code: 400, message: '参数错误' });
    }
    await ctx.service.uied.faviconApi.del(id);
    this.result({ message: '删除成功' });
  }

  async setDefault() {
    const { ctx } = this;
    const { id } = ctx.request.body;
    if (!id) {
      return this.result({ code: 400, message: '参数错误' });
    }
    await ctx.service.uied.faviconApi.setDefault(id);
    this.result({ message: '设置成功' });
  }
}

module.exports = FaviconApiController;
