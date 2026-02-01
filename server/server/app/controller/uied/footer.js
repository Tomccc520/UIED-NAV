/**
 * @file controller/uied/footer.js
 * @description UIED 页脚设置控制器
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

'use strict';

const Controller = require('egg').Controller;

class FooterController extends Controller {
  // ==================== 页脚分组 ====================
  async groupList() {
    const { ctx } = this;
    const params = { ...ctx.query, ...ctx.request.body };
    const result = await ctx.service.uied.footer.groupList(params);
    ctx.body = { code: 200, msg: 'success', ...result };
  }

  async groupAll() {
    const { ctx } = this;
    const result = await ctx.service.uied.footer.groupAll();
    ctx.body = { code: 200, msg: 'success', data: result };
  }

  async groupAdd() {
    const { ctx } = this;
    const data = ctx.request.body;
    const result = await ctx.service.uied.footer.groupAdd(data);
    ctx.body = { code: 200, msg: '添加成功', data: result };
  }

  async groupEdit() {
    const { ctx } = this;
    const data = ctx.request.body;
    if (!data.id) {
      ctx.body = { code: 400, msg: '参数错误' };
      return;
    }
    await ctx.service.uied.footer.groupEdit(data);
    ctx.body = { code: 200, msg: '编辑成功' };
  }

  async groupDel() {
    const { ctx } = this;
    const { id } = ctx.request.body;
    if (!id) {
      ctx.body = { code: 400, msg: '参数错误' };
      return;
    }
    await ctx.service.uied.footer.groupDel(id);
    ctx.body = { code: 200, msg: '删除成功' };
  }

  // ==================== 页脚链接 ====================
  async linkList() {
    const { ctx } = this;
    const params = { ...ctx.query, ...ctx.request.body };
    const result = await ctx.service.uied.footer.linkList(params);
    ctx.body = { code: 200, msg: 'success', ...result };
  }

  async linkAdd() {
    const { ctx } = this;
    const data = ctx.request.body;
    const result = await ctx.service.uied.footer.linkAdd(data);
    ctx.body = { code: 200, msg: '添加成功', data: result };
  }

  async linkEdit() {
    const { ctx } = this;
    const data = ctx.request.body;
    if (!data.id) {
      ctx.body = { code: 400, msg: '参数错误' };
      return;
    }
    await ctx.service.uied.footer.linkEdit(data);
    ctx.body = { code: 200, msg: '编辑成功' };
  }

  async linkDel() {
    const { ctx } = this;
    const { id } = ctx.request.body;
    if (!id) {
      ctx.body = { code: 400, msg: '参数错误' };
      return;
    }
    await ctx.service.uied.footer.linkDel(id);
    ctx.body = { code: 200, msg: '删除成功' };
  }
}

module.exports = FooterController;
