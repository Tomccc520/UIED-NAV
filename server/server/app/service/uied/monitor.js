/**
 * @file service/uied/monitor.js
 * @description 网站监控服务
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

'use strict';

const Service = require('egg').Service;

class MonitorService extends Service {
  /**
   * 获取监控统计
   */
  async getStatistics() {
    const { app } = this;

    // 总网站数
    const [ totalResult ] = await app.model.query(
      'SELECT COUNT(*) as count FROM uied_website WHERE is_delete = 0',
      { type: app.Sequelize.QueryTypes.SELECT }
    );

    // 正常网站数
    const [ normalResult ] = await app.model.query(
      "SELECT COUNT(*) as count FROM uied_website WHERE is_delete = 0 AND (status = 'normal' OR status IS NULL OR status = '')",
      { type: app.Sequelize.QueryTypes.SELECT }
    );

    // 失效网站数
    const [ failedResult ] = await app.model.query(
      "SELECT COUNT(*) as count FROM uied_website WHERE is_delete = 0 AND status = 'failed'",
      { type: app.Sequelize.QueryTypes.SELECT }
    );

    // 未检查网站数
    const [ uncheckedResult ] = await app.model.query(
      "SELECT COUNT(*) as count FROM uied_website WHERE is_delete = 0 AND status = 'unchecked'",
      { type: app.Sequelize.QueryTypes.SELECT }
    );

    return {
      total: totalResult.count,
      normal: normalResult.count,
      failed: failedResult.count,
      unchecked: uncheckedResult.count,
    };
  }

  /**
   * 获取失效网站列表
   */
  async getFailedWebsites({ page = 1, pageSize = 20 }) {
    const { app } = this;
    const offset = (page - 1) * pageSize;

    const [ countResult ] = await app.model.query(
      "SELECT COUNT(*) as total FROM uied_website WHERE is_delete = 0 AND status = 'failed'",
      { type: app.Sequelize.QueryTypes.SELECT }
    );

    const websites = await app.model.query(
      `SELECT w.id, w.name, w.url, w.status, w.last_check_time as lastCheckTime,
              w.check_error as checkError, c.name as categoryName
       FROM uied_website w
       LEFT JOIN uied_category c ON w.category_id = c.id
       WHERE w.is_delete = 0 AND w.status = 'failed'
       ORDER BY w.last_check_time DESC
       LIMIT ? OFFSET ?`,
      { replacements: [ pageSize, offset ], type: app.Sequelize.QueryTypes.SELECT }
    );

    return {
      lists: websites,
      count: countResult.total,
      page,
      pageSize,
    };
  }

  /**
   * 获取监控配置
   */
  async getConfig() {
    const { app } = this;

    const [ config ] = await app.model.query(
      'SELECT * FROM uied_monitor_config LIMIT 1',
      { type: app.Sequelize.QueryTypes.SELECT }
    );

    if (!config) {
      // 返回默认配置
      return {
        checkInterval: 86400,
        timeout: 10000,
        maxRetries: 3,
        enabled: true,
      };
    }

    return {
      id: config.id,
      checkInterval: config.check_interval,
      timeout: config.timeout,
      maxRetries: config.max_retries,
      enabled: config.enabled === 1,
    };
  }

  /**
   * 更新监控配置
   */
  async updateConfig(data) {
    const { app } = this;
    const now = Math.floor(Date.now() / 1000);

    const [ existing ] = await app.model.query(
      'SELECT id FROM uied_monitor_config LIMIT 1',
      { type: app.Sequelize.QueryTypes.SELECT }
    );

    if (existing) {
      await app.model.query(
        `UPDATE uied_monitor_config SET 
         check_interval = ?, timeout = ?, max_retries = ?, enabled = ?, update_time = ?
         WHERE id = ?`,
        {
          replacements: [
            data.checkInterval,
            data.timeout,
            data.maxRetries,
            data.enabled ? 1 : 0,
            now,
            existing.id,
          ],
          type: app.Sequelize.QueryTypes.UPDATE,
        }
      );
    } else {
      await app.model.query(
        `INSERT INTO uied_monitor_config (check_interval, timeout, max_retries, enabled, create_time, update_time)
         VALUES (?, ?, ?, ?, ?, ?)`,
        {
          replacements: [
            data.checkInterval,
            data.timeout,
            data.maxRetries,
            data.enabled ? 1 : 0,
            now,
            now,
          ],
          type: app.Sequelize.QueryTypes.INSERT,
        }
      );
    }

    return data;
  }

  /**
   * 检查单个网站
   */
  async checkWebsite(id) {
    const { ctx, app } = this;
    const now = Math.floor(Date.now() / 1000);

    const [ website ] = await app.model.query(
      'SELECT id, name, url FROM uied_website WHERE id = ? AND is_delete = 0',
      { replacements: [ id ], type: app.Sequelize.QueryTypes.SELECT }
    );

    if (!website) {
      throw new Error('网站不存在');
    }

    let status = 'normal';
    let checkError = null;

    try {
      const response = await ctx.curl(website.url, {
        timeout: 10000,
        followRedirect: true,
        maxRedirects: 3,
      });

      if (response.status >= 400) {
        status = 'failed';
        checkError = `HTTP ${response.status}`;
      }
    } catch (error) {
      status = 'failed';
      checkError = error.message;
    }

    // 更新网站状态
    await app.model.query(
      'UPDATE uied_website SET status = ?, last_check_time = ?, check_error = ? WHERE id = ?',
      { replacements: [ status, now, checkError, id ], type: app.Sequelize.QueryTypes.UPDATE }
    );

    return {
      websiteId: id,
      websiteName: website.name,
      success: status === 'normal',
      status,
      error: checkError,
    };
  }

  /**
   * 检查所有网站
   */
  async checkAllWebsites({ batchSize = 10, delayMs = 1000 }) {
    const { app } = this;

    const websites = await app.model.query(
      'SELECT id FROM uied_website WHERE is_delete = 0',
      { type: app.Sequelize.QueryTypes.SELECT }
    );

    let checked = 0;
    let failed = 0;
    /**
     * 执行单个站点监测并累计统计信息。
     */
    const checkSingleWebsite = async w => {
      try {
        const result = await this.checkWebsite(w.id);
        checked++;
        if (!result.success) failed++;
      } catch (e) {
        checked++;
        failed++;
      }
    };

    for (let i = 0; i < websites.length; i += batchSize) {
      const batch = websites.slice(i, i + batchSize);

      await Promise.all(batch.map(checkSingleWebsite));

      // 延迟避免请求过快
      if (i + batchSize < websites.length) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }

    return {
      total: websites.length,
      checked,
      failed,
      success: checked - failed,
    };
  }

  /**
   * 重置网站状态
   */
  async resetWebsiteStatus(id) {
    const { app } = this;

    await app.model.query(
      "UPDATE uied_website SET status = 'unchecked', last_check_time = NULL, check_error = NULL WHERE id = ?",
      { replacements: [ id ], type: app.Sequelize.QueryTypes.UPDATE }
    );
  }
}

module.exports = MonitorService;
