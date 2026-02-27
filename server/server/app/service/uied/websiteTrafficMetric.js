/**
 * @file service/uied/websiteTrafficMetric.js
 * @description 网站访问数据（高级版）服务：手动录入月访问量、时长、页数、跳出率与来源占比
 * @author UIED技术团队
 * @copyright Tomda (https://www.tomda.top)
 * @copyright UIED技术团队 (https://fsuied.com)
 * @createDate 2026-02-26
 */

'use strict';

const Service = require('egg').Service;

class WebsiteTrafficMetricService extends Service {
  /**
   * 确保访问数据表存在（新环境兜底）
   */
  async ensureTable() {
    const { app } = this;
    const cacheKey = '__uiedWebsiteTrafficMetricTableReady__';
    if (app[cacheKey] === true) return;
    await app.model.query(
      `CREATE TABLE IF NOT EXISTS \`uied_website_traffic_metric\` (
        \`id\` int unsigned NOT NULL AUTO_INCREMENT,
        \`website_id\` int unsigned NOT NULL DEFAULT 0,
        \`monthly_visits\` bigint unsigned NOT NULL DEFAULT 0,
        \`avg_visit_duration_seconds\` int unsigned NOT NULL DEFAULT 0,
        \`pages_per_visit\` decimal(10,2) NOT NULL DEFAULT 0.00,
        \`bounce_rate\` decimal(5,2) NOT NULL DEFAULT 0.00,
        \`source_breakdown_json\` text NULL,
        \`data_source\` varchar(32) NOT NULL DEFAULT 'manual',
        \`remark\` varchar(255) NOT NULL DEFAULT '',
        \`is_delete\` tinyint unsigned NOT NULL DEFAULT 0,
        \`create_time\` int unsigned NOT NULL DEFAULT 0,
        \`update_time\` int unsigned NOT NULL DEFAULT 0,
        \`delete_time\` int unsigned NOT NULL DEFAULT 0,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`uk_website_id\` (\`website_id\`),
        KEY \`idx_delete_update\` (\`is_delete\`, \`update_time\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='网站访问数据（高级版）'`,
      { type: app.Sequelize.QueryTypes.RAW }
    );
    app[cacheKey] = true;
  }

  /**
   * 读取单个网站访问数据
   * @param {number|string} websiteId 网站ID
   * @returns {Promise<object|null>} 规范化访问数据
   */
  async getByWebsiteId(websiteId) {
    const { app } = this;
    const normalizedId = Number.parseInt(String(websiteId || ''), 10);
    if (!Number.isInteger(normalizedId) || normalizedId <= 0) return null;
    await this.ensureTable();

    const [ row ] = await app.model.query(
      `SELECT *
       FROM uied_website_traffic_metric
       WHERE website_id = ? AND is_delete = 0
       LIMIT 1`,
      {
        replacements: [ normalizedId ],
        type: app.Sequelize.QueryTypes.SELECT,
      }
    );
    if (!row) return null;
    return this.normalizeRow(row);
  }

  /**
   * 保存单个网站访问数据（手动录入）
   * @param {number|string} websiteId 网站ID
   * @param {object} payload 前端提交数据
   * @returns {Promise<object|null>} 最新保存结果
   */
  async saveByWebsiteId(websiteId, payload = {}) {
    const { app } = this;
    const normalizedId = Number.parseInt(String(websiteId || ''), 10);
    if (!Number.isInteger(normalizedId) || normalizedId <= 0) return null;
    await this.ensureTable();
    const normalized = this.normalizePayload(payload);
    const now = Math.floor(Date.now() / 1000);

    if (this.isEmptyMetrics(normalized)) {
      await app.model.query(
        `UPDATE uied_website_traffic_metric
         SET is_delete = 1, delete_time = ?, update_time = ?
         WHERE website_id = ?`,
        {
          replacements: [ now, now, normalizedId ],
          type: app.Sequelize.QueryTypes.UPDATE,
        }
      );
      return null;
    }

    await app.model.query(
      `INSERT INTO uied_website_traffic_metric
       (website_id, monthly_visits, avg_visit_duration_seconds, pages_per_visit, bounce_rate,
        source_breakdown_json, data_source, remark, is_delete, create_time, update_time, delete_time)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, 0)
       ON DUPLICATE KEY UPDATE
         monthly_visits = VALUES(monthly_visits),
         avg_visit_duration_seconds = VALUES(avg_visit_duration_seconds),
         pages_per_visit = VALUES(pages_per_visit),
         bounce_rate = VALUES(bounce_rate),
         source_breakdown_json = VALUES(source_breakdown_json),
         data_source = VALUES(data_source),
         remark = VALUES(remark),
         is_delete = 0,
         delete_time = 0,
         update_time = VALUES(update_time)`,
      {
        replacements: [
          normalizedId,
          normalized.monthlyVisits,
          normalized.avgVisitDurationSeconds,
          normalized.pagesPerVisit,
          normalized.bounceRate,
          JSON.stringify(normalized.sourceBreakdown || {}),
          normalized.dataSource,
          normalized.remark,
          now,
          now,
        ],
        type: app.Sequelize.QueryTypes.INSERT,
      }
    );

    return await this.getByWebsiteId(normalizedId);
  }

  /**
   * 判断是否为空访问数据（全部未填写）
   * @param {object} metrics 规范化后的访问数据
   * @returns {boolean} 是否为空
   */
  isEmptyMetrics(metrics) {
    const source = metrics?.sourceBreakdown || {};
    const sourceTotal = Object.values(source)
      .map(value => Number(value || 0))
      .reduce((sum, value) => sum + (Number.isFinite(value) ? value : 0), 0);
    return (
      Number(metrics?.monthlyVisits || 0) <= 0 &&
      Number(metrics?.avgVisitDurationSeconds || 0) <= 0 &&
      Number(metrics?.pagesPerVisit || 0) <= 0 &&
      Number(metrics?.bounceRate || 0) <= 0 &&
      sourceTotal <= 0
    );
  }

  /**
   * 规范化数据库行数据为前端使用结构
   * @param {object} row 数据库行
   * @returns {object} 规范化对象
   */
  normalizeRow(row = {}) {
    const sourceBreakdown = this.normalizeSourceBreakdown(this.safeJsonParse(row.source_breakdown_json, {}));
    const updateTimeValue = Number(row.update_time || 0);
    return {
      websiteId: Number(row.website_id || 0),
      monthlyVisits: Number(row.monthly_visits || 0),
      avgVisitDurationSeconds: Number(row.avg_visit_duration_seconds || 0),
      pagesPerVisit: Number(row.pages_per_visit || 0),
      bounceRate: Number(row.bounce_rate || 0),
      sourceBreakdown,
      dataSource: String(row.data_source || 'manual'),
      remark: String(row.remark || ''),
      updatedAt: updateTimeValue > 0 ? new Date(updateTimeValue * 1000).toISOString() : null,
    };
  }

  /**
   * 规范化提交数据（数值裁剪 + 来源占比清洗）
   * @param {object} payload 提交数据
   * @returns {object} 规范化对象
   */
  normalizePayload(payload = {}) {
    const sourcePayload = payload?.sourceBreakdown || payload?.trafficSources || {};
    return {
      monthlyVisits: this.toInt(payload.monthlyVisits || payload.monthly_visits, 0, 0, 1000000000000),
      avgVisitDurationSeconds: this.toInt(
        payload.avgVisitDurationSeconds || payload.avg_visit_duration_seconds,
        0,
        0,
        86400
      ),
      pagesPerVisit: this.toDecimal(payload.pagesPerVisit || payload.pages_per_visit, 0, 0, 999.99, 2),
      bounceRate: this.toDecimal(payload.bounceRate || payload.bounce_rate, 0, 0, 100, 2),
      sourceBreakdown: this.normalizeSourceBreakdown(sourcePayload),
      dataSource: String(payload.dataSource || payload.data_source || 'manual').trim() || 'manual',
      remark: String(payload.remark || '').trim().slice(0, 255),
    };
  }

  /**
   * 规范化来源占比数据（百分比）
   * @param {object} source 来源占比
   * @returns {object} 规范化占比对象
   */
  normalizeSourceBreakdown(source = {}) {
    const mapping = {
      direct: [ 'direct', 'directTraffic' ],
      organicSearch: [ 'organicSearch', 'search', 'naturalSearch' ],
      email: [ 'email', 'mail' ],
      referral: [ 'referral', 'external', 'externalReferral' ],
      social: [ 'social', 'socialMedia' ],
      displayAds: [ 'displayAds', 'ads', 'display' ],
      others: [ 'others', 'other' ],
    };
    const result = {};
    Object.keys(mapping).forEach(key => {
      const aliases = mapping[key];
      let rawValue = '';
      for (const alias of aliases) {
        if (source && source[alias] !== undefined && source[alias] !== null && source[alias] !== '') {
          rawValue = source[alias];
          break;
        }
      }
      result[key] = this.toDecimal(rawValue, 0, 0, 100, 2);
    });
    return result;
  }

  /**
   * 安全解析 JSON
   * @param {string|object} value 原值
   * @param {any} fallback 兜底值
   * @returns {any} 解析结果
   */
  safeJsonParse(value, fallback) {
    if (!value) return fallback;
    if (typeof value === 'object') return value;
    try {
      return JSON.parse(value);
    } catch (error) {
      return fallback;
    }
  }

  /**
   * 转整数并裁剪范围
   * @param {any} value 原值
   * @param {number} fallback 默认值
   * @param {number} min 最小值
   * @param {number} max 最大值
   * @returns {number} 规范化整数
   */
  toInt(value, fallback = 0, min = 0, max = Number.MAX_SAFE_INTEGER) {
    const num = Number.parseInt(String(value ?? ''), 10);
    if (!Number.isFinite(num)) return fallback;
    return Math.min(Math.max(num, min), max);
  }

  /**
   * 转小数并裁剪范围
   * @param {any} value 原值
   * @param {number} fallback 默认值
   * @param {number} min 最小值
   * @param {number} max 最大值
   * @param {number} precision 保留位数
   * @returns {number} 规范化小数
   */
  toDecimal(value, fallback = 0, min = 0, max = Number.MAX_SAFE_INTEGER, precision = 2) {
    const num = Number(String(value ?? '').replace(/%/g, ''));
    if (!Number.isFinite(num)) return fallback;
    const clipped = Math.min(Math.max(num, min), max);
    return Number(clipped.toFixed(precision));
  }
}

module.exports = WebsiteTrafficMetricService;

