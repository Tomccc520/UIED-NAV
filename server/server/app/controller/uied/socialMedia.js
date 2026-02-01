/**
 * @file controller/uied/socialMedia.js
 * @description UIED 社交媒体控制器
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

'use strict';

const Controller = require('egg').Controller;

class SocialMediaController extends Controller {
  // ==================== 社交媒体分组 ====================
  async groupList() {
    const { ctx } = this;
    const params = { ...ctx.query, ...ctx.request.body };
    const result = await ctx.service.uied.socialMedia.groupList(params);
    ctx.body = { code: 200, msg: 'success', ...result };
  }

  async groupAll() {
    const { ctx } = this;
    const result = await ctx.service.uied.socialMedia.groupAll();
    ctx.body = { code: 200, msg: 'success', data: result };
  }

  async groupAdd() {
    const { ctx } = this;
    const data = ctx.request.body;
    const result = await ctx.service.uied.socialMedia.groupAdd(data);
    ctx.body = { code: 200, msg: '添加成功', data: result };
  }

  async groupEdit() {
    const { ctx } = this;
    const data = ctx.request.body;
    if (!data.id) {
      ctx.body = { code: 400, msg: '参数错误' };
      return;
    }
    await ctx.service.uied.socialMedia.groupEdit(data);
    ctx.body = { code: 200, msg: '编辑成功' };
  }

  async groupDel() {
    const { ctx } = this;
    const { id } = ctx.request.body;
    if (!id) {
      ctx.body = { code: 400, msg: '参数错误' };
      return;
    }
    await ctx.service.uied.socialMedia.groupDel(id);
    ctx.body = { code: 200, msg: '删除成功' };
  }

  // ==================== 社交媒体项目 ====================
  async itemList() {
    const { ctx } = this;
    const params = { ...ctx.query, ...ctx.request.body };
    const result = await ctx.service.uied.socialMedia.itemList(params);
    ctx.body = { code: 200, msg: 'success', ...result };
  }

  async itemAdd() {
    const { ctx } = this;
    const data = ctx.request.body;
    const result = await ctx.service.uied.socialMedia.itemAdd(data);
    ctx.body = { code: 200, msg: '添加成功', data: result };
  }

  async itemEdit() {
    const { ctx } = this;
    const data = ctx.request.body;
    if (!data.id) {
      ctx.body = { code: 400, msg: '参数错误' };
      return;
    }
    await ctx.service.uied.socialMedia.itemEdit(data);
    ctx.body = { code: 200, msg: '编辑成功' };
  }

  async itemDel() {
    const { ctx } = this;
    const { id } = ctx.request.body;
    if (!id) {
      ctx.body = { code: 400, msg: '参数错误' };
      return;
    }
    await ctx.service.uied.socialMedia.itemDel(id);
    ctx.body = { code: 200, msg: '删除成功' };
  }
}

module.exports = SocialMediaController;
