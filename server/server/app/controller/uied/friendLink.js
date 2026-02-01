/**
 * @file controller/uied/friendLink.js
 * @description UIED 友情链接控制器
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

'use strict';

const Controller = require('egg').Controller;

class FriendLinkController extends Controller {
  async list() {
    const { ctx } = this;
    const params = { ...ctx.query, ...ctx.request.body };
    const result = await ctx.service.uied.friendLink.list(params);
    ctx.body = { code: 200, msg: 'success', ...result };
  }

  async detail() {
    const { ctx } = this;
    const { id } = { ...ctx.query, ...ctx.request.body };
    if (!id) {
      ctx.body = { code: 400, msg: '参数错误' };
      return;
    }
    const result = await ctx.service.uied.friendLink.detail(id);
    ctx.body = { code: 200, msg: 'success', data: result };
  }

  async add() {
    const { ctx } = this;
    const data = ctx.request.body;
    const result = await ctx.service.uied.friendLink.add(data);
    ctx.body = { code: 200, msg: '添加成功', data: result };
  }

  async edit() {
    const { ctx } = this;
    const data = ctx.request.body;
    if (!data.id) {
      ctx.body = { code: 400, msg: '参数错误' };
      return;
    }
    await ctx.service.uied.friendLink.edit(data);
    ctx.body = { code: 200, msg: '编辑成功' };
  }

  async del() {
    const { ctx } = this;
    const { id } = ctx.request.body;
    if (!id) {
      ctx.body = { code: 400, msg: '参数错误' };
      return;
    }
    await ctx.service.uied.friendLink.del(id);
    ctx.body = { code: 200, msg: '删除成功' };
  }
}

module.exports = FriendLinkController;
