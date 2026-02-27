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

const baseController = require('../baseController');

class NavMenuController extends baseController {
  /**
   * 导航菜单列表
   */
  async list() {
    const { ctx } = this;
    try {
      const params = { ...ctx.query, ...ctx.request.body };
      const result = await ctx.service.uied.navMenu.list(params);
      this.result({ data: result });
    } catch (error) {
      ctx.logger.error('获取导航菜单列表失败:', error);
      this.result({ code: 500, message: '获取导航菜单列表失败' });
    }
  }

  /**
   * 全部导航菜单（树形）
   */
  async all() {
    const { ctx } = this;
    try {
      const result = await ctx.service.uied.navMenu.all();
      this.result({ data: result });
    } catch (error) {
      ctx.logger.error('获取全部导航菜单失败:', error);
      this.result({ code: 500, message: '获取全部导航菜单失败' });
    }
  }

  /**
   * 导航菜单详情
   */
  async detail() {
    const { ctx } = this;
    try {
      const { id } = { ...ctx.query, ...ctx.request.body };
      if (!id) {
        return this.result({ code: 400, message: '参数错误' });
      }
      const result = await ctx.service.uied.navMenu.detail(id);
      this.result({ data: result });
    } catch (error) {
      ctx.logger.error('获取导航菜单详情失败:', error);
      this.result({ code: 500, message: '获取导航菜单详情失败' });
    }
  }

  /**
   * 添加导航菜单
   */
  async add() {
    const { ctx } = this;
    try {
      const data = ctx.request.body;
      const result = await ctx.service.uied.navMenu.add(data);
      this.result({ data: result, message: '添加成功' });
    } catch (error) {
      ctx.logger.error('添加导航菜单失败:', error);
      this.result({ code: 500, message: '添加导航菜单失败' });
    }
  }

  /**
   * 编辑导航菜单
   */
  async edit() {
    const { ctx } = this;
    try {
      const data = ctx.request.body;
      if (!data.id) {
        return this.result({ code: 400, message: '参数错误' });
      }
      await ctx.service.uied.navMenu.edit(data);
      this.result({ message: '编辑成功' });
    } catch (error) {
      ctx.logger.error('编辑导航菜单失败:', error);
      this.result({ code: 500, message: '编辑导航菜单失败' });
    }
  }

  /**
   * 删除导航菜单
   */
  async del() {
    const { ctx } = this;
    try {
      const { id } = ctx.request.body;
      if (!id) {
        return this.result({ code: 400, message: '参数错误' });
      }
      await ctx.service.uied.navMenu.del(id);
      this.result({ message: '删除成功' });
    } catch (error) {
      ctx.logger.error('删除导航菜单失败:', error);
      this.result({ code: 500, message: '删除导航菜单失败' });
    }
  }

  /**
   * 排序
   */
  async sort() {
    const { ctx } = this;
    try {
      const { items } = ctx.request.body;
      if (!items || !Array.isArray(items)) {
        return this.result({ code: 400, message: '参数错误' });
      }
      await ctx.service.uied.navMenu.sort(items);
      this.result({ message: '排序成功' });
    } catch (error) {
      ctx.logger.error('排序失败:', error);
      this.result({ code: 500, message: '排序失败' });
    }
  }
}

module.exports = NavMenuController;
