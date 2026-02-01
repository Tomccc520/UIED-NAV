/**
 * @file controller/uied/navMenu.js
 * @description UIED 导航菜单控制器
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

'use strict';

const Controller = require('egg').Controller;

class NavMenuController extends Controller {
  /**
   * 导航菜单列表
   */
  async list() {
    const { ctx } = this;
    const params = { ...ctx.query, ...ctx.request.body };
    const result = await ctx.service.uied.navMenu.list(params);
    ctx.body = { code: 200, msg: 'success', ...result };
  }

  /**
   * 全部导航菜单（树形）
   */
  async all() {
    const { ctx } = this;
    const result = await ctx.service.uied.navMenu.all();
    ctx.body = { code: 200, msg: 'success', data: result };
  }

  /**
   * 导航菜单详情
   */
  async detail() {
    const { ctx } = this;
    const { id } = { ...ctx.query, ...ctx.request.body };
    if (!id) {
      ctx.body = { code: 400, msg: '参数错误' };
      return;
    }
    const result = await ctx.service.uied.navMenu.detail(id);
    ctx.body = { code: 200, msg: 'success', data: result };
  }

  /**
   * 添加导航菜单
   */
  async add() {
    const { ctx } = this;
    const data = ctx.request.body;
    const result = await ctx.service.uied.navMenu.add(data);
    ctx.body = { code: 200, msg: '添加成功', data: result };
  }

  /**
   * 编辑导航菜单
   */
  async edit() {
    const { ctx } = this;
    const data = ctx.request.body;
    if (!data.id) {
      ctx.body = { code: 400, msg: '参数错误' };
      return;
    }
    await ctx.service.uied.navMenu.edit(data);
    ctx.body = { code: 200, msg: '编辑成功' };
  }

  /**
   * 删除导航菜单
   */
  async del() {
    const { ctx } = this;
    const { id } = ctx.request.body;
    if (!id) {
      ctx.body = { code: 400, msg: '参数错误' };
      return;
    }
    await ctx.service.uied.navMenu.del(id);
    ctx.body = { code: 200, msg: '删除成功' };
  }

  /**
   * 排序
   */
  async sort() {
    const { ctx } = this;
    const { items } = ctx.request.body;
    if (!items || !Array.isArray(items)) {
      ctx.body = { code: 400, msg: '参数错误' };
      return;
    }
    await ctx.service.uied.navMenu.sort(items);
    ctx.body = { code: 200, msg: '排序成功' };
  }
}

module.exports = NavMenuController;
