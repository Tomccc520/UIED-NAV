/**
 * @file service/uied/commercialSlot.js
 * @description UIED 商业位体系服务（广告位配置/投放记录/公开投放）
 * @author UIED技术团队
 * @copyright Tomda (https://www.tomda.top)
 * @copyright UIED技术团队 (https://fsuied.com)
 * @createDate 2026-02-23
 */

'use strict';

const Service = require('egg').Service;

const SLOT_TABLE = 'uied_commercial_slot';
const BOOKING_TABLE = 'uied_commercial_booking';

class CommercialSlotService extends Service {
  /**
   * 确保商业位相关表存在
   */
  async ensureTables() {
    const { app } = this;
    const cacheKey = '__uiedCommercialSlotTablesReady__';
    if (app[cacheKey] === true) return;

    await app.model.query(
      `CREATE TABLE IF NOT EXISTS \`${SLOT_TABLE}\` (
        \`id\` int unsigned NOT NULL AUTO_INCREMENT,
        \`slot_key\` varchar(80) NOT NULL DEFAULT '',
        \`slot_name\` varchar(120) NOT NULL DEFAULT '',
        \`slot_type\` varchar(30) NOT NULL DEFAULT 'top',
        \`scope_type\` varchar(30) NOT NULL DEFAULT 'global',
        \`scope_value\` varchar(120) NOT NULL DEFAULT '',
        \`description\` varchar(255) NOT NULL DEFAULT '',
        \`sale_unit\` varchar(20) NOT NULL DEFAULT 'day',
        \`unit_price\` decimal(10,2) NOT NULL DEFAULT 0.00,
        \`max_positions\` int unsigned NOT NULL DEFAULT 1,
        \`sort\` int unsigned NOT NULL DEFAULT 0,
        \`is_enabled\` tinyint unsigned NOT NULL DEFAULT 1,
        \`extra_json\` text,
        \`is_delete\` tinyint unsigned NOT NULL DEFAULT 0,
        \`create_time\` int unsigned NOT NULL DEFAULT 0,
        \`update_time\` int unsigned NOT NULL DEFAULT 0,
        \`delete_time\` int unsigned NOT NULL DEFAULT 0,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`uk_slot_key_scope\` (\`slot_key\`, \`scope_type\`, \`scope_value\`),
        KEY \`idx_type_scope\` (\`slot_type\`, \`scope_type\`),
        KEY \`idx_enable_sort\` (\`is_enabled\`, \`sort\`),
        KEY \`idx_delete\` (\`is_delete\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='商业广告位配置表'`,
      { type: app.Sequelize.QueryTypes.RAW }
    );

    await app.model.query(
      `CREATE TABLE IF NOT EXISTS \`${BOOKING_TABLE}\` (
        \`id\` int unsigned NOT NULL AUTO_INCREMENT,
        \`slot_id\` int unsigned NOT NULL DEFAULT 0,
        \`slot_key\` varchar(80) NOT NULL DEFAULT '',
        \`slot_type\` varchar(30) NOT NULL DEFAULT 'top',
        \`scope_type\` varchar(30) NOT NULL DEFAULT 'global',
        \`scope_value\` varchar(120) NOT NULL DEFAULT '',
        \`sponsor_name\` varchar(120) NOT NULL DEFAULT '',
        \`sponsor_title\` varchar(200) NOT NULL DEFAULT '',
        \`target_url\` varchar(500) NOT NULL DEFAULT '',
        \`image_url\` varchar(500) NOT NULL DEFAULT '',
        \`text_content\` varchar(500) NOT NULL DEFAULT '',
        \`badge_text\` varchar(50) NOT NULL DEFAULT '',
        \`position_index\` int unsigned NOT NULL DEFAULT 1,
        \`sale_unit\` varchar(20) NOT NULL DEFAULT 'day',
        \`unit_price\` decimal(10,2) NOT NULL DEFAULT 0.00,
        \`total_price\` decimal(10,2) NOT NULL DEFAULT 0.00,
        \`start_time\` int unsigned NOT NULL DEFAULT 0,
        \`end_time\` int unsigned NOT NULL DEFAULT 0,
        \`status\` varchar(20) NOT NULL DEFAULT 'draft',
        \`is_show\` tinyint unsigned NOT NULL DEFAULT 1,
        \`contact_name\` varchar(60) NOT NULL DEFAULT '',
        \`contact_phone\` varchar(30) NOT NULL DEFAULT '',
        \`order_no\` varchar(64) NOT NULL DEFAULT '',
        \`note\` varchar(500) NOT NULL DEFAULT '',
        \`extra_json\` text,
        \`is_delete\` tinyint unsigned NOT NULL DEFAULT 0,
        \`create_time\` int unsigned NOT NULL DEFAULT 0,
        \`update_time\` int unsigned NOT NULL DEFAULT 0,
        \`delete_time\` int unsigned NOT NULL DEFAULT 0,
        PRIMARY KEY (\`id\`),
        KEY \`idx_slot\` (\`slot_id\`),
        KEY \`idx_slot_key\` (\`slot_key\`),
        KEY \`idx_scope\` (\`scope_type\`, \`scope_value\`),
        KEY \`idx_status_show_time\` (\`status\`, \`is_show\`, \`start_time\`, \`end_time\`),
        KEY \`idx_delete\` (\`is_delete\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='商业广告位投放记录表'`,
      { type: app.Sequelize.QueryTypes.RAW }
    );

    app[cacheKey] = true;
  }

  /**
   * 获取默认广告位配置
   */
  getDefaultSlots() {
    return [
      {
        slotKey: 'home-top-pinned',
        slotName: '首页置顶位',
        slotType: 'top',
        scopeType: 'global',
        scopeValue: 'home',
        description: '首页顶部置顶商业位（按天售卖）',
        saleUnit: 'day',
        unitPrice: 199,
        maxPositions: 1,
        sort: 10,
        isEnabled: true,
      },
      {
        slotKey: 'category-inline-ad',
        slotName: '分类内广告位',
        slotType: 'category_ad',
        scopeType: 'category',
        scopeValue: 'all',
        description: '分类详情页内容区广告位（按周售卖）',
        saleUnit: 'week',
        unitPrice: 499,
        maxPositions: 2,
        sort: 20,
        isEnabled: true,
      },
      {
        slotKey: 'topic-sponsor',
        slotName: '专题赞助位',
        slotType: 'topic_sponsor',
        scopeType: 'topic',
        scopeValue: 'all',
        description: '专题页赞助位（按周售卖）',
        saleUnit: 'week',
        unitPrice: 899,
        maxPositions: 1,
        sort: 30,
        isEnabled: true,
      },
    ];
  }

  /**
   * 规范化布尔值
   */
  parseBoolean(value, fallback = false) {
    if (value === undefined || value === null || value === '') return fallback;
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value === 1;
    const text = String(value).trim().toLowerCase();
    if ([ '1', 'true', 'yes', 'y', 'on' ].includes(text)) return true;
    if ([ '0', 'false', 'no', 'n', 'off' ].includes(text)) return false;
    return fallback;
  }

  /**
   * 安全解析整数
   */
  parseIntSafe(value, fallback = 0, min = 0, max = 99999999) {
    const parsed = Number.parseInt(String(value ?? ''), 10);
    if (!Number.isInteger(parsed)) return fallback;
    return Math.max(min, Math.min(max, parsed));
  }

  /**
   * 安全解析金额
   */
  parsePrice(value, fallback = 0) {
    const parsed = Number.parseFloat(String(value ?? ''));
    if (!Number.isFinite(parsed)) return Number(fallback || 0).toFixed(2);
    const safe = Math.max(0, Math.min(99999999, parsed));
    return safe.toFixed(2);
  }

  /**
   * 安全解析 JSON 文本
   */
  safeParseJson(text, fallback = {}) {
    const raw = String(text || '').trim();
    if (!raw) return fallback;
    try {
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : fallback;
    } catch (error) {
      return fallback;
    }
  }

  /**
   * 规范化广告位配置
   */
  normalizeSlot(payload = {}, index = 0) {
    const source = payload && typeof payload === 'object' ? payload : {};
    const defaults = this.getDefaultSlots()[index] || {};
    return {
      id: this.parseIntSafe(source.id, 0, 0, 99999999),
      slotKey: String(source.slotKey || defaults.slotKey || '').trim(),
      slotName: String(source.slotName || defaults.slotName || '').trim(),
      slotType: String(source.slotType || defaults.slotType || 'top').trim() || 'top',
      scopeType: String(source.scopeType || defaults.scopeType || 'global').trim() || 'global',
      scopeValue: String(source.scopeValue || defaults.scopeValue || '').trim(),
      description: String(source.description || defaults.description || '').trim(),
      saleUnit: String(source.saleUnit || defaults.saleUnit || 'day').trim() || 'day',
      unitPrice: this.parsePrice(source.unitPrice, defaults.unitPrice || 0),
      maxPositions: this.parseIntSafe(source.maxPositions, defaults.maxPositions || 1, 1, 20),
      sort: this.parseIntSafe(source.sort, defaults.sort || ((index + 1) * 10), 0, 100000),
      isEnabled: this.parseBoolean(source.isEnabled, defaults.isEnabled !== false),
      extra: source.extra && typeof source.extra === 'object' ? source.extra : {},
    };
  }

  /**
   * 规范化投放记录
   */
  normalizeBooking(payload = {}) {
    const source = payload && typeof payload === 'object' ? payload : {};
    const unitPrice = this.parsePrice(source.unitPrice, 0);
    const totalPrice = this.parsePrice(source.totalPrice, unitPrice);
    return {
      id: this.parseIntSafe(source.id, 0, 0, 99999999),
      slotId: this.parseIntSafe(source.slotId, 0, 1, 99999999),
      slotKey: String(source.slotKey || '').trim(),
      slotType: String(source.slotType || '').trim(),
      scopeType: String(source.scopeType || '').trim(),
      scopeValue: String(source.scopeValue || '').trim(),
      sponsorName: String(source.sponsorName || '').trim(),
      sponsorTitle: String(source.sponsorTitle || '').trim(),
      targetUrl: String(source.targetUrl || '').trim(),
      imageUrl: String(source.imageUrl || '').trim(),
      textContent: String(source.textContent || '').trim(),
      badgeText: String(source.badgeText || '').trim(),
      positionIndex: this.parseIntSafe(source.positionIndex, 1, 1, 20),
      saleUnit: String(source.saleUnit || 'day').trim() || 'day',
      unitPrice,
      totalPrice,
      startTime: this.parseIntSafe(source.startTime, 0, 0, 9999999999),
      endTime: this.parseIntSafe(source.endTime, 0, 0, 9999999999),
      status: String(source.status || 'draft').trim() || 'draft',
      isShow: this.parseBoolean(source.isShow, true),
      contactName: String(source.contactName || '').trim(),
      contactPhone: String(source.contactPhone || '').trim(),
      orderNo: String(source.orderNo || '').trim(),
      note: String(source.note || '').trim(),
      extra: source.extra && typeof source.extra === 'object' ? source.extra : {},
    };
  }

  /**
   * 初始化默认广告位
   */
  async initDefaults() {
    await this.ensureTables();
    const { app } = this;
    const now = Math.floor(Date.now() / 1000);
    const defaults = this.getDefaultSlots();
    for (let index = 0; index < defaults.length; index++) {
      const item = this.normalizeSlot(defaults[index], index);
      await app.model.query(
        `INSERT INTO ${SLOT_TABLE}
         (slot_key, slot_name, slot_type, scope_type, scope_value, description,
          sale_unit, unit_price, max_positions, sort, is_enabled, extra_json,
          is_delete, create_time, update_time, delete_time)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, 0)
         ON DUPLICATE KEY UPDATE
           slot_name = VALUES(slot_name),
           slot_type = VALUES(slot_type),
           description = VALUES(description),
           sale_unit = VALUES(sale_unit),
           unit_price = VALUES(unit_price),
           max_positions = VALUES(max_positions),
           sort = VALUES(sort),
           is_enabled = VALUES(is_enabled),
           is_delete = 0,
           delete_time = 0,
           update_time = VALUES(update_time)`,
        {
          replacements: [
            item.slotKey,
            item.slotName,
            item.slotType,
            item.scopeType,
            item.scopeValue,
            item.description,
            item.saleUnit,
            item.unitPrice,
            item.maxPositions,
            item.sort,
            item.isEnabled ? 1 : 0,
            JSON.stringify(item.extra || {}),
            now,
            now,
          ],
          type: app.Sequelize.QueryTypes.INSERT,
        }
      );
    }
  }

  /**
   * 格式化广告位行
   */
  formatSlotRow(row) {
    return {
      id: Number(row.id || 0),
      slotKey: String(row.slot_key || ''),
      slotName: String(row.slot_name || ''),
      slotType: String(row.slot_type || ''),
      scopeType: String(row.scope_type || ''),
      scopeValue: String(row.scope_value || ''),
      description: String(row.description || ''),
      saleUnit: String(row.sale_unit || 'day'),
      unitPrice: Number(row.unit_price || 0),
      maxPositions: Number(row.max_positions || 1),
      sort: Number(row.sort || 0),
      isEnabled: Number(row.is_enabled || 0) === 1,
      extra: this.safeParseJson(row.extra_json, {}),
      createTime: Number(row.create_time || 0),
      updateTime: Number(row.update_time || 0),
    };
  }

  /**
   * 格式化投放记录行
   */
  formatBookingRow(row) {
    return {
      id: Number(row.id || 0),
      slotId: Number(row.slot_id || 0),
      slotKey: String(row.slot_key || ''),
      slotType: String(row.slot_type || ''),
      scopeType: String(row.scope_type || ''),
      scopeValue: String(row.scope_value || ''),
      sponsorName: String(row.sponsor_name || ''),
      sponsorTitle: String(row.sponsor_title || ''),
      targetUrl: String(row.target_url || ''),
      imageUrl: String(row.image_url || ''),
      textContent: String(row.text_content || ''),
      badgeText: String(row.badge_text || ''),
      positionIndex: Number(row.position_index || 1),
      saleUnit: String(row.sale_unit || 'day'),
      unitPrice: Number(row.unit_price || 0),
      totalPrice: Number(row.total_price || 0),
      startTime: Number(row.start_time || 0),
      endTime: Number(row.end_time || 0),
      status: String(row.status || 'draft'),
      isShow: Number(row.is_show || 0) === 1,
      contactName: String(row.contact_name || ''),
      contactPhone: String(row.contact_phone || ''),
      orderNo: String(row.order_no || ''),
      note: String(row.note || ''),
      extra: this.safeParseJson(row.extra_json, {}),
      createTime: Number(row.create_time || 0),
      updateTime: Number(row.update_time || 0),
      slotName: row.slot_name !== undefined ? String(row.slot_name || '') : undefined,
    };
  }

  /**
   * 广告位配置列表
   */
  async slotList(params = {}) {
    await this.ensureTables();
    await this.initDefaults();
    const { app } = this;
    const includeDisabled = this.parseBoolean(params.includeDisabled, true);
    let whereSql = 'is_delete = 0';
    if (!includeDisabled) whereSql += ' AND is_enabled = 1';
    const rows = await app.model.query(
      `SELECT *
       FROM ${SLOT_TABLE}
       WHERE ${whereSql}
       ORDER BY sort ASC, id ASC`,
      { type: app.Sequelize.QueryTypes.SELECT }
    );
    return Array.isArray(rows) ? rows.map(row => this.formatSlotRow(row)) : [];
  }

  /**
   * 保存广告位配置
   */
  async slotSave(payload = {}) {
    await this.ensureTables();
    const { app } = this;
    const now = Math.floor(Date.now() / 1000);
    const slot = this.normalizeSlot(payload);
    if (!slot.slotKey) throw new Error('广告位键不能为空');
    if (!slot.slotName) throw new Error('广告位名称不能为空');

    if (slot.id > 0) {
      await app.model.query(
        `UPDATE ${SLOT_TABLE}
         SET slot_key = ?, slot_name = ?, slot_type = ?, scope_type = ?, scope_value = ?,
             description = ?, sale_unit = ?, unit_price = ?, max_positions = ?, sort = ?, is_enabled = ?,
             extra_json = ?, update_time = ?, is_delete = 0, delete_time = 0
         WHERE id = ?`,
        {
          replacements: [
            slot.slotKey,
            slot.slotName,
            slot.slotType,
            slot.scopeType,
            slot.scopeValue,
            slot.description,
            slot.saleUnit,
            slot.unitPrice,
            slot.maxPositions,
            slot.sort,
            slot.isEnabled ? 1 : 0,
            JSON.stringify(slot.extra || {}),
            now,
            slot.id,
          ],
          type: app.Sequelize.QueryTypes.UPDATE,
        }
      );
      const list = await this.slotList({ includeDisabled: true });
      return list.find(item => item.id === slot.id) || null;
    }

    const [ insertRes ] = await app.model.query(
      `INSERT INTO ${SLOT_TABLE}
       (slot_key, slot_name, slot_type, scope_type, scope_value, description,
        sale_unit, unit_price, max_positions, sort, is_enabled, extra_json,
        is_delete, create_time, update_time, delete_time)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, 0)`,
      {
        replacements: [
          slot.slotKey,
          slot.slotName,
          slot.slotType,
          slot.scopeType,
          slot.scopeValue,
          slot.description,
          slot.saleUnit,
          slot.unitPrice,
          slot.maxPositions,
          slot.sort,
          slot.isEnabled ? 1 : 0,
          JSON.stringify(slot.extra || {}),
          now,
          now,
        ],
        type: app.Sequelize.QueryTypes.INSERT,
      }
    );

    const insertedId = Number(insertRes || 0);
    const list = await this.slotList({ includeDisabled: true });
    return list.find(item => item.id === insertedId) || null;
  }

  /**
   * 删除广告位配置（软删除）
   */
  async slotDel(id) {
    await this.ensureTables();
    const { app } = this;
    const slotId = this.parseIntSafe(id, 0, 1, 99999999);
    if (!slotId) throw new Error('广告位ID无效');
    const now = Math.floor(Date.now() / 1000);
    await app.model.query(
      `UPDATE ${SLOT_TABLE}
       SET is_delete = 1, delete_time = ?, update_time = ?
       WHERE id = ? AND is_delete = 0`,
      {
        replacements: [ now, now, slotId ],
        type: app.Sequelize.QueryTypes.UPDATE,
      }
    );
    return { id: slotId };
  }

  /**
   * 投放记录列表（后台）
   */
  async bookingList(params = {}) {
    await this.ensureTables();
    await this.initDefaults();
    const { app } = this;
    const pageNo = this.parseIntSafe(params.pageNo, 1, 1, 9999);
    const pageSize = this.parseIntSafe(params.pageSize, 20, 1, 100);
    const offset = (pageNo - 1) * pageSize;
    const slotKey = String(params.slotKey || '').trim();
    const status = String(params.status || '').trim();

    let whereSql = 'b.is_delete = 0';
    const replacements = [];
    if (slotKey) {
      whereSql += ' AND b.slot_key = ?';
      replacements.push(slotKey);
    }
    if (status) {
      whereSql += ' AND b.status = ?';
      replacements.push(status);
    }

    const [ countRow ] = await app.model.query(
      `SELECT COUNT(*) AS total
       FROM ${BOOKING_TABLE} b
       WHERE ${whereSql}`,
      {
        replacements,
        type: app.Sequelize.QueryTypes.SELECT,
      }
    );

    const rows = await app.model.query(
      `SELECT b.*, s.slot_name
       FROM ${BOOKING_TABLE} b
       LEFT JOIN ${SLOT_TABLE} s ON s.id = b.slot_id AND s.is_delete = 0
       WHERE ${whereSql}
       ORDER BY b.start_time DESC, b.id DESC
       LIMIT ? OFFSET ?`,
      {
        replacements: [ ...replacements, pageSize, offset ],
        type: app.Sequelize.QueryTypes.SELECT,
      }
    );

    return {
      pageNo,
      pageSize,
      total: Number(countRow?.total || 0),
      lists: Array.isArray(rows) ? rows.map(row => this.formatBookingRow(row)) : [],
    };
  }

  /**
   * 保存投放记录
   */
  async bookingSave(payload = {}) {
    await this.ensureTables();
    await this.initDefaults();
    const { app } = this;
    const now = Math.floor(Date.now() / 1000);
    const booking = this.normalizeBooking(payload);
    if (!booking.slotId && !booking.slotKey) throw new Error('请先选择广告位');
    if (!booking.sponsorTitle) throw new Error('投放标题不能为空');
    if (!booking.targetUrl) throw new Error('跳转链接不能为空');

    let slot = null;
    if (booking.slotId > 0) {
      const [ row ] = await app.model.query(
        `SELECT id, slot_key, slot_type, scope_type, scope_value, slot_name, sale_unit, unit_price
         FROM ${SLOT_TABLE}
         WHERE id = ? AND is_delete = 0
         LIMIT 1`,
        {
          replacements: [ booking.slotId ],
          type: app.Sequelize.QueryTypes.SELECT,
        }
      );
      slot = row || null;
    } else if (booking.slotKey) {
      const [ row ] = await app.model.query(
        `SELECT id, slot_key, slot_type, scope_type, scope_value, slot_name, sale_unit, unit_price
         FROM ${SLOT_TABLE}
         WHERE slot_key = ? AND is_delete = 0
         ORDER BY id ASC
         LIMIT 1`,
        {
          replacements: [ booking.slotKey ],
          type: app.Sequelize.QueryTypes.SELECT,
        }
      );
      slot = row || null;
    }

    if (!slot) throw new Error('广告位不存在');

    const final = {
      ...booking,
      slotId: Number(slot.id || 0),
      slotKey: String(slot.slot_key || booking.slotKey || ''),
      slotType: String(slot.slot_type || booking.slotType || ''),
      scopeType: String(slot.scope_type || booking.scopeType || 'global'),
      scopeValue: String(booking.scopeValue || slot.scope_value || ''),
      saleUnit: String(booking.saleUnit || slot.sale_unit || 'day'),
      unitPrice: this.parsePrice(booking.unitPrice, slot.unit_price || 0),
      totalPrice: this.parsePrice(booking.totalPrice, booking.unitPrice || slot.unit_price || 0),
      orderNo: String(booking.orderNo || `CM${Date.now()}`),
      status: String(booking.status || 'active').trim() || 'active',
    };

    if (final.endTime > 0 && final.startTime > 0 && final.endTime < final.startTime) {
      throw new Error('结束时间不能小于开始时间');
    }

    if (final.id > 0) {
      await app.model.query(
        `UPDATE ${BOOKING_TABLE}
         SET slot_id = ?, slot_key = ?, slot_type = ?, scope_type = ?, scope_value = ?,
             sponsor_name = ?, sponsor_title = ?, target_url = ?, image_url = ?, text_content = ?, badge_text = ?,
             position_index = ?, sale_unit = ?, unit_price = ?, total_price = ?,
             start_time = ?, end_time = ?, status = ?, is_show = ?,
             contact_name = ?, contact_phone = ?, order_no = ?, note = ?, extra_json = ?,
             update_time = ?, is_delete = 0, delete_time = 0
         WHERE id = ?`,
        {
          replacements: [
            final.slotId,
            final.slotKey,
            final.slotType,
            final.scopeType,
            final.scopeValue,
            final.sponsorName,
            final.sponsorTitle,
            final.targetUrl,
            final.imageUrl,
            final.textContent,
            final.badgeText,
            final.positionIndex,
            final.saleUnit,
            final.unitPrice,
            final.totalPrice,
            final.startTime,
            final.endTime,
            final.status,
            final.isShow ? 1 : 0,
            final.contactName,
            final.contactPhone,
            final.orderNo,
            final.note,
            JSON.stringify(final.extra || {}),
            now,
            final.id,
          ],
          type: app.Sequelize.QueryTypes.UPDATE,
        }
      );
      const listResult = await this.bookingList({ pageNo: 1, pageSize: 200 });
      return (listResult.lists || []).find(item => item.id === final.id) || null;
    }

    const [ insertRes ] = await app.model.query(
      `INSERT INTO ${BOOKING_TABLE}
       (slot_id, slot_key, slot_type, scope_type, scope_value, sponsor_name, sponsor_title,
        target_url, image_url, text_content, badge_text, position_index,
        sale_unit, unit_price, total_price, start_time, end_time, status, is_show,
        contact_name, contact_phone, order_no, note, extra_json,
        is_delete, create_time, update_time, delete_time)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, 0)`,
      {
        replacements: [
          final.slotId,
          final.slotKey,
          final.slotType,
          final.scopeType,
          final.scopeValue,
          final.sponsorName,
          final.sponsorTitle,
          final.targetUrl,
          final.imageUrl,
          final.textContent,
          final.badgeText,
          final.positionIndex,
          final.saleUnit,
          final.unitPrice,
          final.totalPrice,
          final.startTime,
          final.endTime,
          final.status,
          final.isShow ? 1 : 0,
          final.contactName,
          final.contactPhone,
          final.orderNo,
          final.note,
          JSON.stringify(final.extra || {}),
          now,
          now,
        ],
        type: app.Sequelize.QueryTypes.INSERT,
      }
    );

    const insertedId = Number(insertRes || 0);
    const listResult = await this.bookingList({ pageNo: 1, pageSize: 200 });
    return (listResult.lists || []).find(item => item.id === insertedId) || null;
  }

  /**
   * 删除投放记录（软删除）
   */
  async bookingDel(id) {
    await this.ensureTables();
    const { app } = this;
    const bookingId = this.parseIntSafe(id, 0, 1, 99999999);
    if (!bookingId) throw new Error('投放记录ID无效');
    const now = Math.floor(Date.now() / 1000);
    await app.model.query(
      `UPDATE ${BOOKING_TABLE}
       SET is_delete = 1, delete_time = ?, update_time = ?
       WHERE id = ? AND is_delete = 0`,
      {
        replacements: [ now, now, bookingId ],
        type: app.Sequelize.QueryTypes.UPDATE,
      }
    );
    return { id: bookingId };
  }

  /**
   * 获取公开投放列表（前台）
   */
  async publicPlacements(params = {}) {
    await this.ensureTables();
    await this.initDefaults();
    const { app } = this;
    const now = Math.floor(Date.now() / 1000);
    const limit = this.parseIntSafe(params.limit, 20, 1, 100);
    const slotKey = String(params.slotKey || '').trim();
    const slotType = String(params.slotType || '').trim();
    const scopeType = String(params.scopeType || '').trim();
    const scopeValue = String(params.scopeValue || '').trim();

    let whereSql = `b.is_delete = 0
      AND b.is_show = 1
      AND b.status IN ('active', 'paid')
      AND (b.start_time = 0 OR b.start_time <= ?)
      AND (b.end_time = 0 OR b.end_time >= ?)
      AND s.is_delete = 0
      AND s.is_enabled = 1`;
    const replacements = [ now, now ];

    if (slotKey) {
      whereSql += ' AND b.slot_key = ?';
      replacements.push(slotKey);
    }
    if (slotType) {
      whereSql += ' AND b.slot_type = ?';
      replacements.push(slotType);
    }
    if (scopeType) {
      whereSql += ' AND b.scope_type = ?';
      replacements.push(scopeType);
    }
    if (scopeValue) {
      whereSql += ' AND (b.scope_value = ? OR b.scope_value = \'all\' OR b.scope_value = \'\')';
      replacements.push(scopeValue);
    }

    const rows = await app.model.query(
      `SELECT b.*, s.slot_name, s.max_positions
       FROM ${BOOKING_TABLE} b
       INNER JOIN ${SLOT_TABLE} s ON s.id = b.slot_id
       WHERE ${whereSql}
       ORDER BY b.position_index ASC, b.id DESC
       LIMIT ?`,
      {
        replacements: [ ...replacements, limit ],
        type: app.Sequelize.QueryTypes.SELECT,
      }
    );

    const list = Array.isArray(rows) ? rows.map(row => this.formatBookingRow(row)) : [];
    return {
      list,
      total: list.length,
    };
  }

  /**
   * 获取字段草案（后台配置页参考）
   */
  getFieldDraft() {
    return {
      slotTypeOptions: [
        { label: '置顶位', value: 'top' },
        { label: '分类广告位', value: 'category_ad' },
        { label: '专题赞助位', value: 'topic_sponsor' },
      ],
      scopeTypeOptions: [
        { label: '全局', value: 'global' },
        { label: '首页', value: 'home' },
        { label: '分类页', value: 'category' },
        { label: '专题页', value: 'topic' },
      ],
      saleUnitOptions: [
        { label: '按天', value: 'day' },
        { label: '按周', value: 'week' },
      ],
      bookingStatusOptions: [
        { label: '草稿', value: 'draft' },
        { label: '待确认', value: 'pending' },
        { label: '已付款', value: 'paid' },
        { label: '投放中', value: 'active' },
        { label: '已结束', value: 'expired' },
        { label: '手动下线', value: 'disabled' },
      ],
      slotFields: [
        { key: 'slotKey', type: 'input', label: '广告位键', required: true },
        { key: 'slotName', type: 'input', label: '广告位名称', required: true },
        { key: 'slotType', type: 'select', label: '广告位类型', required: true },
        { key: 'scopeType', type: 'select', label: '作用范围', required: true },
        { key: 'scopeValue', type: 'input', label: '范围值', required: false },
        { key: 'saleUnit', type: 'select', label: '售卖单位', required: true },
        { key: 'unitPrice', type: 'number', label: '单价', required: true },
        { key: 'maxPositions', type: 'number', label: '最大位数', required: true },
        { key: 'sort', type: 'number', label: '排序', required: true },
        { key: 'isEnabled', type: 'switch', label: '启用', required: true },
      ],
      bookingFields: [
        { key: 'slotId', type: 'number', label: '广告位ID', required: true },
        { key: 'sponsorName', type: 'input', label: '客户名称', required: false },
        { key: 'sponsorTitle', type: 'input', label: '投放标题', required: true },
        { key: 'targetUrl', type: 'input', label: '跳转链接', required: true },
        { key: 'imageUrl', type: 'input', label: '图片地址', required: false },
        { key: 'textContent', type: 'textarea', label: '文案', required: false },
        { key: 'badgeText', type: 'input', label: '角标', required: false },
        { key: 'positionIndex', type: 'number', label: '位序', required: true },
        { key: 'saleUnit', type: 'select', label: '售卖单位', required: true },
        { key: 'unitPrice', type: 'number', label: '单价', required: true },
        { key: 'totalPrice', type: 'number', label: '总价', required: true },
        { key: 'startTime', type: 'number', label: '开始时间戳', required: false },
        { key: 'endTime', type: 'number', label: '结束时间戳', required: false },
        { key: 'status', type: 'select', label: '状态', required: true },
        { key: 'isShow', type: 'switch', label: '显示', required: true },
      ],
    };
  }
}

module.exports = CommercialSlotService;
