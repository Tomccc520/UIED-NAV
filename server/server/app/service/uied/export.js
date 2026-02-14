/**
 * @file service/uied/export.js
 * @description 数据导出服务
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

'use strict';

const Service = require('egg').Service;
const fs = require('fs');
const path = require('path');

class ExportService extends Service {
  /**
   * 获取导出目录
   */
  getExportDir() {
    const exportDir = path.join(this.app.baseDir, 'exports');
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }
    return exportDir;
  }

  /**
   * 导出网站数据为 JSON
   */
  async exportWebsitesJSON({ categoryId, status, startDate, endDate }) {
    const { app } = this;

    let whereClause = 'is_delete = 0';
    const replacements = [];

    if (categoryId) {
      whereClause += ' AND category_id = ?';
      replacements.push(categoryId);
    }
    if (status) {
      whereClause += ' AND status = ?';
      replacements.push(status);
    }
    if (startDate) {
      whereClause += ' AND create_time >= ?';
      replacements.push(Math.floor(new Date(startDate).getTime() / 1000));
    }
    if (endDate) {
      whereClause += ' AND create_time <= ?';
      replacements.push(Math.floor(new Date(endDate).getTime() / 1000));
    }

    const websites = await app.model.query(
      `SELECT * FROM uied_website WHERE ${whereClause} ORDER BY id`,
      { replacements, type: app.Sequelize.QueryTypes.SELECT }
    );

    const filename = `websites_${Date.now()}.json`;
    const filepath = path.join(this.getExportDir(), filename);

    fs.writeFileSync(filepath, JSON.stringify(websites, null, 2));

    return {
      filename,
      count: websites.length,
      path: `/exports/${filename}`,
    };
  }

  /**
   * 导出网站数据为 CSV
   */
  async exportWebsitesCSV({ categoryId, status, startDate, endDate }) {
    const { app } = this;

    let whereClause = 'is_delete = 0';
    const replacements = [];

    if (categoryId) {
      whereClause += ' AND category_id = ?';
      replacements.push(categoryId);
    }
    if (status) {
      whereClause += ' AND status = ?';
      replacements.push(status);
    }
    if (startDate) {
      whereClause += ' AND create_time >= ?';
      replacements.push(Math.floor(new Date(startDate).getTime() / 1000));
    }
    if (endDate) {
      whereClause += ' AND create_time <= ?';
      replacements.push(Math.floor(new Date(endDate).getTime() / 1000));
    }

    const websites = await app.model.query(
      `SELECT w.*, c.name as category_name FROM uied_website w
       LEFT JOIN uied_category c ON w.category_id = c.id
       WHERE w.${whereClause.replace('is_delete', 'w.is_delete')} ORDER BY w.id`,
      { replacements, type: app.Sequelize.QueryTypes.SELECT }
    );

    // 生成 CSV
    const headers = [ 'ID', '名称', 'URL', '描述', '分类', '标签', '点击数', '创建时间' ];
    const rows = websites.map(w => [
      w.id,
      `"${(w.name || '').replace(/"/g, '""')}"`,
      w.url,
      `"${(w.description || '').replace(/"/g, '""')}"`,
      w.category_name || '',
      w.tags || '',
      w.click_count || 0,
      new Date(w.create_time * 1000).toISOString(),
    ]);

    const csv = [ headers.join(','), ...rows.map(r => r.join(',')) ].join('\n');

    const filename = `websites_${Date.now()}.csv`;
    const filepath = path.join(this.getExportDir(), filename);

    fs.writeFileSync(filepath, '\ufeff' + csv); // BOM for Excel

    return {
      filename,
      count: websites.length,
      path: `/exports/${filename}`,
    };
  }

  /**
   * 导出分类数据为 JSON
   */
  async exportCategoriesJSON() {
    const { app } = this;

    const categories = await app.model.query(
      'SELECT * FROM uied_category WHERE is_delete = 0 ORDER BY id',
      { type: app.Sequelize.QueryTypes.SELECT }
    );

    const filename = `categories_${Date.now()}.json`;
    const filepath = path.join(this.getExportDir(), filename);

    fs.writeFileSync(filepath, JSON.stringify(categories, null, 2));

    return {
      filename,
      count: categories.length,
      path: `/exports/${filename}`,
    };
  }

  /**
   * 导出分类数据为 CSV
   */
  async exportCategoriesCSV() {
    const { app } = this;

    const categories = await app.model.query(
      'SELECT * FROM uied_category WHERE is_delete = 0 ORDER BY id',
      { type: app.Sequelize.QueryTypes.SELECT }
    );

    const headers = [ 'ID', '名称', 'Slug', '描述', '父分类ID', '排序', '创建时间' ];
    const rows = categories.map(c => [
      c.id,
      `"${(c.name || '').replace(/"/g, '""')}"`,
      c.slug || '',
      `"${(c.description || '').replace(/"/g, '""')}"`,
      c.parent_id || '',
      c.sort || 0,
      new Date(c.create_time * 1000).toISOString(),
    ]);

    const csv = [ headers.join(','), ...rows.map(r => r.join(',')) ].join('\n');

    const filename = `categories_${Date.now()}.csv`;
    const filepath = path.join(this.getExportDir(), filename);

    fs.writeFileSync(filepath, '\ufeff' + csv);

    return {
      filename,
      count: categories.length,
      path: `/exports/${filename}`,
    };
  }

  /**
   * 创建全量备份
   */
  async createBackup() {
    const { app } = this;

    const tables = [
      'uied_category', 'uied_website', 'uied_page', 'uied_page_category',
      'uied_hot_recommendation', 'uied_banner', 'uied_site_setting', 'uied_site_info',
      'uied_nav_menu', 'uied_footer_group', 'uied_footer_link', 'uied_friend_link',
      'uied_social_media_group', 'uied_social_media_item', 'uied_favicon_api',
    ];

    const backup = {};

    for (const table of tables) {
      try {
        const data = await app.model.query(
          `SELECT * FROM ${table}`,
          { type: app.Sequelize.QueryTypes.SELECT }
        );
        backup[table] = data;
      } catch (e) {
        backup[table] = [];
      }
    }

    const filename = `full_backup_${Date.now()}.json`;
    const filepath = path.join(this.getExportDir(), filename);

    fs.writeFileSync(filepath, JSON.stringify(backup, null, 2));

    const stats = fs.statSync(filepath);

    return {
      filename,
      size: stats.size,
      path: `/exports/${filename}`,
      counts: Object.fromEntries(
        Object.entries(backup).map(([ k, v ]) => [ k, v.length ])
      ),
    };
  }

  /**
   * 获取导出文件列表
   */
  async getExportList() {
    const exportDir = this.getExportDir();

    if (!fs.existsSync(exportDir)) {
      return [];
    }

    const files = fs.readdirSync(exportDir);

    return files
      .filter(f => f.endsWith('.json') || f.endsWith('.csv'))
      .map(f => {
        const filepath = path.join(exportDir, f);
        const stats = fs.statSync(filepath);
        return {
          filename: f,
          size: stats.size,
          createdAt: stats.birthtime,
          path: `/exports/${f}`,
        };
      })
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  /**
   * 获取导出文件路径
   */
  getExportFilePath(filename) {
    const filepath = path.join(this.getExportDir(), filename);
    if (!fs.existsSync(filepath)) {
      throw new Error('文件不存在');
    }
    return filepath;
  }

  /**
   * 删除导出文件
   */
  async deleteExportFile(filename) {
    const filepath = path.join(this.getExportDir(), filename);
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }
  }
}

module.exports = ExportService;
