/**
 * @file controller/uied/export.js
 * @description 数据导出控制器
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

'use strict';

const baseController = require('../baseController');

class ExportController extends baseController {
  /**
   * 导出网站数据（简化版，直接返回 JSON）
   */
  async websites() {
    const { ctx } = this;
    try {
      // 直接查询数据库返回 JSON
      const websites = await ctx.model.query(
        'SELECT * FROM uied_website WHERE is_delete = 0 ORDER BY id',
        { type: ctx.app.Sequelize.QueryTypes.SELECT }
      );
      ctx.set('Content-Type', 'application/json');
      ctx.set('Content-Disposition', `attachment; filename=uied_websites_${Date.now()}.json`);
      ctx.body = JSON.stringify(websites, null, 2);
    } catch (error) {
      ctx.logger.error('导出网站数据失败:', error);
      this.result({ code: 500, message: '导出失败' });
    }
  }

  /**
   * 导出分类数据（简化版，直接返回 JSON）
   */
  async categories() {
    const { ctx } = this;
    try {
      // 直接查询数据库返回 JSON
      const categories = await ctx.model.query(
        'SELECT * FROM uied_category WHERE is_delete = 0 ORDER BY id',
        { type: ctx.app.Sequelize.QueryTypes.SELECT }
      );
      ctx.set('Content-Type', 'application/json');
      ctx.set('Content-Disposition', `attachment; filename=uied_categories_${Date.now()}.json`);
      ctx.body = JSON.stringify(categories, null, 2);
    } catch (error) {
      ctx.logger.error('导出分类数据失败:', error);
      this.result({ code: 500, message: '导出失败' });
    }
  }

  /**
   * 导出全部数据
   */
  async all() {
    const { ctx } = this;
    try {
      // 查询所有表数据
      const tables = [
        'uied_category', 'uied_website', 'uied_page', 'uied_page_category',
        'uied_hot_recommendation', 'uied_banner', 'uied_site_setting', 'uied_site_info',
        'uied_nav_menu', 'uied_footer_group', 'uied_footer_link', 'uied_friend_link',
        'uied_social_media_group', 'uied_social_media_item', 'uied_favicon_api',
      ];

      const backup = {};
      for (const table of tables) {
        try {
          const data = await ctx.model.query(
            `SELECT * FROM ${table}`,
            { type: ctx.app.Sequelize.QueryTypes.SELECT }
          );
          backup[table] = data;
        } catch (e) {
          backup[table] = [];
        }
      }

      ctx.set('Content-Type', 'application/json');
      ctx.set('Content-Disposition', `attachment; filename=uied_backup_${Date.now()}.json`);
      ctx.body = JSON.stringify(backup, null, 2);
    } catch (error) {
      ctx.logger.error('导出全部数据失败:', error);
      this.result({ code: 500, message: '导出失败' });
    }
  }

  /**
   * 导出网站数据为 CSV
   */
  async websitesCSV() {
    const { ctx } = this;
    try {
      const { categoryId, status, startDate, endDate } = ctx.request.body;
      const result = await ctx.service.uied.export.exportWebsitesCSV({
        categoryId,
        status,
        startDate,
        endDate,
      });
      this.result({ data: result, message: '导出成功' });
    } catch (error) {
      ctx.logger.error('导出网站CSV失败:', error);
      this.result({ code: 500, message: '导出失败' });
    }
  }

  /**
   * 导出网站数据为 JSON
   */
  async websitesJSON() {
    const { ctx } = this;
    try {
      const { categoryId, status, startDate, endDate } = ctx.request.body;
      const result = await ctx.service.uied.export.exportWebsitesJSON({
        categoryId,
        status,
        startDate,
        endDate,
      });
      this.result({ data: result, message: '导出成功' });
    } catch (error) {
      ctx.logger.error('导出网站JSON失败:', error);
      this.result({ code: 500, message: '导出失败' });
    }
  }

  /**
   * 导出分类数据为 CSV
   */
  async categoriesCSV() {
    const { ctx } = this;
    try {
      const result = await ctx.service.uied.export.exportCategoriesCSV();
      this.result({ data: result, message: '导出成功' });
    } catch (error) {
      ctx.logger.error('导出分类CSV失败:', error);
      this.result({ code: 500, message: '导出失败' });
    }
  }

  /**
   * 导出分类数据为 JSON
   */
  async categoriesJSON() {
    const { ctx } = this;
    try {
      const result = await ctx.service.uied.export.exportCategoriesJSON();
      this.result({ data: result, message: '导出成功' });
    } catch (error) {
      ctx.logger.error('导出分类JSON失败:', error);
      this.result({ code: 500, message: '导出失败' });
    }
  }

  /**
   * 创建数据库备份
   */
  async backup() {
    const { ctx } = this;
    try {
      const result = await ctx.service.uied.export.createBackup();
      this.result({ data: result, message: '备份成功' });
    } catch (error) {
      ctx.logger.error('创建备份失败:', error);
      this.result({ code: 500, message: '备份失败' });
    }
  }

  /**
   * 获取导出文件列表
   */
  async list() {
    const { ctx } = this;
    try {
      const result = await ctx.service.uied.export.getExportList();
      this.result({ data: result });
    } catch (error) {
      ctx.logger.error('获取导出列表失败:', error);
      this.result({ code: 500, message: '获取列表失败' });
    }
  }

  /**
   * 下载导出文件
   */
  async download() {
    const { ctx } = this;
    try {
      const { filename } = ctx.params;
      const filepath = ctx.service.uied.export.getExportFilePath(filename);
      ctx.attachment(filename);
      ctx.set('Content-Type', 'application/octet-stream');
      ctx.body = require('fs').createReadStream(filepath);
    } catch (error) {
      ctx.logger.error('下载文件失败:', error);
      this.result({ code: 404, message: '文件不存在' });
    }
  }

  /**
   * 删除导出文件
   */
  async del() {
    const { ctx } = this;
    try {
      const { filename } = ctx.request.body;
      if (!filename) {
        return this.result({ code: 400, message: '缺少文件名' });
      }
      await ctx.service.uied.export.deleteExportFile(filename);
      this.result({ message: '删除成功' });
    } catch (error) {
      ctx.logger.error('删除文件失败:', error);
      this.result({ code: 500, message: '删除失败' });
    }
  }
}

module.exports = ExportController;
