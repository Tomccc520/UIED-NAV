/**
 * @file controller/uied/wordpressConfig.js
 * @description WordPress 配置控制器
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

'use strict';

const baseController = require('../baseController');

class WordpressConfigController extends baseController {
  // ==================== WordPress 配置 ====================

  /**
   * 获取所有 WordPress 配置
   */
  async configList() {
    const { ctx } = this;
    try {
      const result = await ctx.service.uied.wordpressConfig.listConfigs();
      this.result({ data: result });
    } catch (error) {
      ctx.logger.error('获取WordPress配置列表失败:', error);
      this.result({ code: 500, message: '获取配置失败' });
    }
  }

  /**
   * 获取默认 WordPress 配置
   */
  async configDefault() {
    const { ctx } = this;
    try {
      const result = await ctx.service.uied.wordpressConfig.getDefaultConfig();
      if (!result) {
        return this.result({ code: 404, message: '没有可用的 WordPress 配置' });
      }
      this.result({ data: result });
    } catch (error) {
      ctx.logger.error('获取默认WordPress配置失败:', error);
      this.result({ code: 500, message: '获取配置失败' });
    }
  }

  /**
   * 创建 WordPress 配置
   */
  async configAdd() {
    const { ctx } = this;
    try {
      const data = ctx.request.body;
      if (!data.name || !data.apiUrl) {
        return this.result({ code: 400, message: '名称和API地址为必填项' });
      }
      const result = await ctx.service.uied.wordpressConfig.addConfig(data);
      this.result({ data: result, message: '创建成功' });
    } catch (error) {
      ctx.logger.error('创建WordPress配置失败:', error);
      this.result({ code: 500, message: '创建失败' });
    }
  }

  /**
   * 更新 WordPress 配置
   */
  async configEdit() {
    const { ctx } = this;
    try {
      const data = ctx.request.body;
      if (!data.id) {
        return this.result({ code: 400, message: '缺少配置ID' });
      }
      const result = await ctx.service.uied.wordpressConfig.editConfig(data);
      this.result({ data: result, message: '更新成功' });
    } catch (error) {
      ctx.logger.error('更新WordPress配置失败:', error);
      this.result({ code: 500, message: '更新失败' });
    }
  }

  /**
   * 删除 WordPress 配置
   */
  async configDel() {
    const { ctx } = this;
    try {
      const { id } = ctx.request.body;
      if (!id) {
        return this.result({ code: 400, message: '缺少配置ID' });
      }
      await ctx.service.uied.wordpressConfig.delConfig(parseInt(id));
      this.result({ message: '删除成功' });
    } catch (error) {
      ctx.logger.error('删除WordPress配置失败:', error);
      this.result({ code: 500, message: '删除失败' });
    }
  }

  // ==================== WordPress 分类配置 ====================

  /**
   * 获取分类配置列表
   */
  async categoryList() {
    const { ctx } = this;
    try {
      const { pageSlug } = ctx.query;
      const result = await ctx.service.uied.wordpressConfig.listCategories(pageSlug);
      this.result({ data: result });
    } catch (error) {
      ctx.logger.error('获取WordPress分类配置失败:', error);
      this.result({ code: 500, message: '获取分类失败' });
    }
  }

  /**
   * 创建分类配置
   */
  async categoryAdd() {
    const { ctx } = this;
    try {
      const data = ctx.request.body;
      if (!data.wpCategoryId || !data.wpCategoryName || !data.displayName || !data.slug) {
        return this.result({ code: 400, message: 'WordPress分类ID、分类名称、显示名称和slug为必填项' });
      }
      const result = await ctx.service.uied.wordpressConfig.addCategory(data);
      this.result({ data: result, message: '创建成功' });
    } catch (error) {
      ctx.logger.error('创建WordPress分类配置失败:', error);
      this.result({ code: 500, message: '创建失败' });
    }
  }

  /**
   * 更新分类配置
   */
  async categoryEdit() {
    const { ctx } = this;
    try {
      const data = ctx.request.body;
      if (!data.id) {
        return this.result({ code: 400, message: '缺少分类ID' });
      }
      const result = await ctx.service.uied.wordpressConfig.editCategory(data);
      this.result({ data: result, message: '更新成功' });
    } catch (error) {
      ctx.logger.error('更新WordPress分类配置失败:', error);
      this.result({ code: 500, message: '更新失败' });
    }
  }

  /**
   * 删除分类配置
   */
  async categoryDel() {
    const { ctx } = this;
    try {
      const { id } = ctx.request.body;
      if (!id) {
        return this.result({ code: 400, message: '缺少分类ID' });
      }
      await ctx.service.uied.wordpressConfig.delCategory(parseInt(id));
      this.result({ message: '删除成功' });
    } catch (error) {
      ctx.logger.error('删除WordPress分类配置失败:', error);
      this.result({ code: 500, message: '删除失败' });
    }
  }

  // ==================== WordPress 文章代理 ====================

  /**
   * 代理获取 WordPress 文章
   */
  async posts() {
    const { ctx } = this;
    try {
      const { categoryId, tagId, page = 1, perPage = 10, orderBy = 'date', order = 'desc', search } = ctx.query;
      const result = await ctx.service.uied.wordpressConfig.getPosts({
        categoryId,
        tagId,
        page: parseInt(page),
        perPage: parseInt(perPage),
        orderBy,
        order,
        search,
      });
      this.result({ data: result });
    } catch (error) {
      ctx.logger.error('获取WordPress文章失败:', error);
      this.result({ code: 500, message: error.message || '获取文章失败' });
    }
  }
}

module.exports = WordpressConfigController;
