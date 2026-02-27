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

const baseController = require('../baseController');

class SocialMediaController extends baseController {
  // ==================== 社交媒体分组 ====================
  async groupList() {
    const { ctx } = this;
    const params = { ...ctx.query, ...ctx.request.body };
    const result = await ctx.service.uied.socialMedia.groupList(params);
    this.result({ data: result });
  }

  async groupAll() {
    const { ctx } = this;
    const result = await ctx.service.uied.socialMedia.groupAll();
    this.result({ data: result });
  }

  async groupAdd() {
    const { ctx } = this;
    const data = ctx.request.body;
    const result = await ctx.service.uied.socialMedia.groupAdd(data);
    this.result({ data: result, message: '添加成功' });
  }

  async groupEdit() {
    const { ctx } = this;
    const data = ctx.request.body;
    if (!data.id) {
      return this.result({ code: 400, message: '参数错误' });
    }
    await ctx.service.uied.socialMedia.groupEdit(data);
    this.result({ message: '编辑成功' });
  }

  async groupDel() {
    const { ctx } = this;
    const { id } = ctx.request.body;
    if (!id) {
      return this.result({ code: 400, message: '参数错误' });
    }
    await ctx.service.uied.socialMedia.groupDel(id);
    this.result({ message: '删除成功' });
  }

  // ==================== 社交媒体项目 ====================
  async itemList() {
    const { ctx } = this;
    const params = { ...ctx.query, ...ctx.request.body };
    const result = await ctx.service.uied.socialMedia.itemList(params);
    this.result({ data: result });
  }

  async itemAdd() {
    const { ctx } = this;
    const data = ctx.request.body;
    const result = await ctx.service.uied.socialMedia.itemAdd(data);
    this.result({ data: result, message: '添加成功' });
  }

  async itemEdit() {
    const { ctx } = this;
    const data = ctx.request.body;
    if (!data.id) {
      return this.result({ code: 400, message: '参数错误' });
    }
    await ctx.service.uied.socialMedia.itemEdit(data);
    this.result({ message: '编辑成功' });
  }

  async itemDel() {
    const { ctx } = this;
    const { id } = ctx.request.body;
    if (!id) {
      return this.result({ code: 400, message: '参数错误' });
    }
    await ctx.service.uied.socialMedia.itemDel(id);
    this.result({ message: '删除成功' });
  }
}

module.exports = SocialMediaController;
