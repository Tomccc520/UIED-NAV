/**
 * @file service/uied/setting.js
 * @description UIED 站点设置服务
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

'use strict';

const Service = require('egg').Service;

class SettingService extends Service {
  /**
   * 获取单个设置
   */
  async get(key) {
    const { app } = this;
    
    const [setting] = await app.model.query(
      'SELECT `key`, `value`, description FROM uied_site_setting WHERE `key` = ?',
      { replacements: [key], type: app.Sequelize.QueryTypes.SELECT }
    );
    
    if (!setting) return null;
    
    try {
      return JSON.parse(setting.value);
    } catch {
      return setting.value;
    }
  }

  /**
   * 获取所有设置
   */
  async getAll() {
    const { app } = this;
    
    const settings = await app.model.query(
      'SELECT `key`, `value`, description FROM uied_site_setting',
      { type: app.Sequelize.QueryTypes.SELECT }
    );
    
    const result = {};
    for (const setting of settings) {
      try {
        result[setting.key] = JSON.parse(setting.value);
      } catch {
        result[setting.key] = setting.value;
      }
    }
    
    return result;
  }

  /**
   * 保存设置
   */
  async save(data) {
    const { app } = this;
    const now = Math.floor(Date.now() / 1000);
    
    for (const [key, value] of Object.entries(data)) {
      const valueStr = typeof value === 'object' ? JSON.stringify(value) : String(value);
      
      await app.model.query(
        `INSERT INTO uied_site_setting (\`key\`, \`value\`, create_time, update_time)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE \`value\` = ?, update_time = ?`,
        { replacements: [key, valueStr, now, now, valueStr, now], type: app.Sequelize.QueryTypes.INSERT }
      );
    }
  }

  /**
   * 获取站点信息
   */
  async getSiteInfo() {
    const { app } = this;
    
    const [info] = await app.model.query(
      'SELECT * FROM uied_site_info LIMIT 1',
      { type: app.Sequelize.QueryTypes.SELECT }
    );
    
    if (!info) return null;
    
    return {
      id: info.id,
      siteName: info.site_name,
      siteTitle: info.site_title,
      siteDescription: info.site_description,
      siteKeywords: info.site_keywords,
      logo: info.logo,
      favicon: info.favicon,
      icp: info.icp,
      copyright: info.copyright,
      contactEmail: info.contact_email,
      analyticsCode: info.analytics_code,
    };
  }

  /**
   * 保存站点信息
   */
  async saveSiteInfo(data) {
    const { app } = this;
    const now = Math.floor(Date.now() / 1000);
    
    // 检查是否存在记录
    const [existing] = await app.model.query(
      'SELECT id FROM uied_site_info LIMIT 1',
      { type: app.Sequelize.QueryTypes.SELECT }
    );
    
    if (existing) {
      await app.model.query(
        `UPDATE uied_site_info SET
          site_name = ?, site_title = ?, site_description = ?, site_keywords = ?,
          logo = ?, favicon = ?, icp = ?, copyright = ?, contact_email = ?,
          analytics_code = ?, update_time = ?
         WHERE id = ?`,
        {
          replacements: [
            data.siteName || '', data.siteTitle || '', data.siteDescription || '',
            data.siteKeywords || '', data.logo || '', data.favicon || '',
            data.icp || '', data.copyright || '', data.contactEmail || '',
            data.analyticsCode || '', now, existing.id,
          ],
          type: app.Sequelize.QueryTypes.UPDATE,
        }
      );
    } else {
      await app.model.query(
        `INSERT INTO uied_site_info (site_name, site_title, site_description, site_keywords,
          logo, favicon, icp, copyright, contact_email, analytics_code, create_time, update_time)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        {
          replacements: [
            data.siteName || '', data.siteTitle || '', data.siteDescription || '',
            data.siteKeywords || '', data.logo || '', data.favicon || '',
            data.icp || '', data.copyright || '', data.contactEmail || '',
            data.analyticsCode || '', now, now,
          ],
          type: app.Sequelize.QueryTypes.INSERT,
        }
      );
    }
  }

  /**
   * 获取公开设置（前端访问）
   */
  async getPublicSettings() {
    const siteInfo = await this.getSiteInfo();
    const settings = await this.getAll();
    
    return {
      siteInfo,
      ...settings,
    };
  }
}

module.exports = SettingService;
