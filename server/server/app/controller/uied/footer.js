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

const baseController = require('../baseController');

class FooterController extends baseController {
  // ==================== 页脚分组 ====================
  async groupList() {
    const { ctx } = this;
    const params = { ...ctx.query, ...ctx.request.body };
    const result = await ctx.service.uied.footer.groupList(params);
    this.result({ data: result });
  }

  async groupAll() {
    const { ctx } = this;
    const result = await ctx.service.uied.footer.groupAll();
    this.result({ data: result });
  }

  async groupAdd() {
    const { ctx } = this;
    const data = ctx.request.body;
    const result = await ctx.service.uied.footer.groupAdd(data);
    this.result({ data: result, message: '添加成功' });
  }

  async groupEdit() {
    const { ctx } = this;
    const data = ctx.request.body;
    if (!data.id) {
      return this.result({ code: 400, message: '参数错误' });
    }
    await ctx.service.uied.footer.groupEdit(data);
    this.result({ message: '编辑成功' });
  }

  async groupDel() {
    const { ctx } = this;
    const { id } = ctx.request.body;
    if (!id) {
      return this.result({ code: 400, message: '参数错误' });
    }
    await ctx.service.uied.footer.groupDel(id);
    this.result({ message: '删除成功' });
  }

  // ==================== 页脚链接 ====================
  async linkList() {
    const { ctx } = this;
    const params = { ...ctx.query, ...ctx.request.body };
    const result = await ctx.service.uied.footer.linkList(params);
    this.result({ data: result });
  }

  async linkAdd() {
    const { ctx } = this;
    const data = ctx.request.body;
    const result = await ctx.service.uied.footer.linkAdd(data);
    this.result({ data: result, message: '添加成功' });
  }

  async linkEdit() {
    const { ctx } = this;
    const data = ctx.request.body;
    if (!data.id) {
      return this.result({ code: 400, message: '参数错误' });
    }
    await ctx.service.uied.footer.linkEdit(data);
    this.result({ message: '编辑成功' });
  }

  async linkDel() {
    const { ctx } = this;
    const { id } = ctx.request.body;
    if (!id) {
      return this.result({ code: 400, message: '参数错误' });
    }
    await ctx.service.uied.footer.linkDel(id);
    this.result({ message: '删除成功' });
  }
}

module.exports = FooterController;
