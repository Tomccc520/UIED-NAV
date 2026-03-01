#!/usr/bin/env node
/**
 * @copyright Tomda (https://www.tomda.top)
 * @copyright UIED技术团队 (https://fsuied.com)
 * @author UIED技术团队
 * @createDate 2026-02-28
 *
 * @file backfill-license-message-extra.js
 * @description 历史授权审核消息扩展字段回填脚本（补齐 extra.licenseId）
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const SERVER_DIR = path.join(ROOT_DIR, 'server', 'server');
const MYSQL2_PATH = path.join(SERVER_DIR, 'node_modules', 'mysql2', 'promise');

/**
 * 解析命令行参数
 * @param {string[]} argv 原始参数
 * @returns {Record<string, any>} 解析结果
 */
function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i += 1) {
    const current = String(argv[i] || '');
    if (!current.startsWith('--')) continue;
    const [rawKey, inlineValue] = current.split('=');
    const key = rawKey.replace(/^--/, '');
    if (inlineValue !== undefined) {
      args[key] = inlineValue;
      continue;
    }
    const next = argv[i + 1];
    if (next && !String(next).startsWith('--')) {
      args[key] = next;
      i += 1;
      continue;
    }
    args[key] = true;
  }
  return args;
}

/**
 * 输出脚本帮助信息
 */
function printHelp() {
  const lines = [
    '用法：',
    '  node scripts/backfill-license-message-extra.js',
    '  node scripts/backfill-license-message-extra.js --write',
    '',
    '说明：',
    '  默认仅预演，不写库；加 --write 才会真正更新消息 extra 字段。',
    '',
    '可选参数：',
    '  --host 127.0.0.1',
    '  --port 3308',
    '  --user uied',
    '  --password uied123456',
    '  --database uied_nav',
    '  --table-prefix la_',
    '  --message-table la_user_message',
    '  --license-table la_license',
    '  --limit 0                  0 表示全量扫描（默认）',
    '  --since-id 0',
    '  --write',
    '  --report-file /绝对路径/report.json',
    '  --help',
  ];
  console.log(lines.join('\n'));
}

/**
 * 安全解析 JSON
 * @param {string} text 原始文本
 * @returns {{ ok: boolean, value: any }} 解析结果
 */
function safeParseJson(text) {
  const raw = String(text || '').trim();
  if (!raw) {
    return { ok: true, value: {} };
  }
  try {
    const value = JSON.parse(raw);
    if (value && typeof value === 'object') {
      return { ok: true, value };
    }
    return { ok: true, value: {} };
  } catch (_error) {
    return { ok: false, value: {} };
  }
}

/**
 * 读取本地默认数据库配置
 * @returns {{ host:string, port:number, user:string, password:string, database:string }} 默认配置
 */
function loadDefaultDatabaseConfig() {
  try {
    const configFactory = require(path.join(SERVER_DIR, 'config', 'config.local.js'));
    const config = typeof configFactory === 'function'
      ? configFactory({ baseDir: SERVER_DIR, name: 'vue-admin-serve' })
      : configFactory;
    const sequelize = config?.sequelize || {};
    return {
      host: String(sequelize.host || '127.0.0.1'),
      port: Number(sequelize.port || 3306),
      user: String(sequelize.username || 'root'),
      password: String(sequelize.password || ''),
      database: String(sequelize.database || ''),
    };
  } catch (_error) {
    return {
      host: '127.0.0.1',
      port: 3306,
      user: 'root',
      password: '',
      database: '',
    };
  }
}

/**
 * 读取默认表前缀
 * @returns {string} 表前缀
 */
function loadDefaultTablePrefix() {
  try {
    const extendConfig = require(path.join(SERVER_DIR, 'app', 'extend', 'config.js'));
    return String(extendConfig?.dbTablePrefix || 'la_').trim() || 'la_';
  } catch (_error) {
    return 'la_';
  }
}

/**
 * 从扩展字段提取授权ID
 * @param {Record<string, any>} extra 扩展信息
 * @returns {number} 授权ID
 */
function resolveLicenseId(extra = {}) {
  if (!extra || typeof extra !== 'object') return 0;
  const directId = Number(extra.licenseId || extra.license_id || 0);
  if (directId > 0) return directId;
  const license = extra.license && typeof extra.license === 'object' ? extra.license : null;
  const nestedId = Number(license?.licenseId || license?.license_id || license?.id || 0);
  if (nestedId > 0) return nestedId;
  const payload = extra.payload && typeof extra.payload === 'object' ? extra.payload : null;
  return Number(payload?.licenseId || payload?.license_id || 0);
}

/**
 * 从扩展字段提取订单ID
 * @param {Record<string, any>} extra 扩展信息
 * @returns {number} 订单ID
 */
function resolveOrderId(extra = {}) {
  if (!extra || typeof extra !== 'object') return 0;
  const directId = Number(extra.orderId || extra.order_id || 0);
  if (directId > 0) return directId;
  const payload = extra.payload && typeof extra.payload === 'object' ? extra.payload : null;
  return Number(payload?.orderId || payload?.order_id || 0);
}

/**
 * 保证报告目录存在
 * @param {string} filePath 报告文件路径
 */
function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

/**
 * 写出 JSON 报告
 * @param {string} reportFile 报告路径
 * @param {object} data 报告内容
 */
function writeReport(reportFile, data) {
  ensureDir(reportFile);
  fs.writeFileSync(reportFile, JSON.stringify(data, null, 2), 'utf8');
}

/**
 * 读取数据表字段列表
 * @param {any} connection MySQL 连接
 * @param {string} tableName 数据表名
 * @returns {Promise<Set<string>>} 字段集合
 */
async function getTableColumns(connection, tableName) {
  const [rows] = await connection.query(`SHOW COLUMNS FROM \`${tableName}\``);
  return new Set((rows || []).map(item => String(item.Field || '').trim()).filter(Boolean));
}

/**
 * 从授权表中按订单ID查找授权ID
 * @param {any} connection MySQL 连接
 * @param {string} licenseTable 授权表
 * @param {string} orderColumn 订单字段
 * @param {number} userId 用户ID
 * @param {number} orderId 订单ID
 * @returns {Promise<number>} 授权ID
 */
async function findLicenseIdByOrderId(connection, licenseTable, orderColumn, userId, orderId) {
  const [rows] = await connection.query(
    `
    SELECT id
    FROM \`${licenseTable}\`
    WHERE user_id = ?
      AND \`${orderColumn}\` = ?
      AND is_delete = 0
    ORDER BY id DESC
    LIMIT 1
    `,
    [ Number(userId || 0), Number(orderId || 0) ]
  );
  return Number(rows?.[0]?.id || 0);
}

/**
 * 执行回填
 */
async function main() {
  const args = parseArgs(process.argv);
  if (args.help) {
    printHelp();
    process.exit(0);
  }

  const defaultDb = loadDefaultDatabaseConfig();
  const tablePrefix = String(args['table-prefix'] || loadDefaultTablePrefix()).trim() || 'la_';
  const messageTable = String(args['message-table'] || `${tablePrefix}user_message`).trim();
  const licenseTable = String(args['license-table'] || `${tablePrefix}license`).trim();
  const reportFile = String(
    args['report-file'] || path.join(ROOT_DIR, 'docs', 'API', 'reports', 'license_message_backfill_latest.json')
  ).trim();
  const rawLimit = Number(args.limit || 0);
  const limit = rawLimit > 0 ? rawLimit : 0;
  const sinceId = Math.max(0, Number(args['since-id'] || 0));
  const writeMode = Boolean(args.write);

  const dbConfig = {
    host: String(args.host || defaultDb.host || '127.0.0.1'),
    port: Number(args.port || defaultDb.port || 3306),
    user: String(args.user || defaultDb.user || 'root'),
    password: String(args.password !== undefined ? args.password : defaultDb.password || ''),
    database: String(args.database || defaultDb.database || '').trim(),
    charset: 'utf8mb4',
  };

  if (!dbConfig.database) {
    console.error('缺少数据库名，请通过 --database 指定。');
    process.exit(1);
  }

  const mysql = require(MYSQL2_PATH);
  const connection = await mysql.createConnection(dbConfig);
  const report = {
    generatedAt: new Date().toISOString(),
    mode: writeMode ? 'write' : 'dry-run',
    db: {
      host: dbConfig.host,
      port: dbConfig.port,
      database: dbConfig.database,
      messageTable,
      licenseTable,
    },
    summary: {
      scanned: 0,
      updated: 0,
      alreadyStandard: 0,
      normalizedFromNested: 0,
      resolvedByOrderId: 0,
      skippedNoMatch: 0,
      skippedInvalidExtra: 0,
    },
    samples: [],
  };

  try {
    const licenseColumns = await getTableColumns(connection, licenseTable);
    const orderColumn = licenseColumns.has('order_id')
      ? 'order_id'
      : (licenseColumns.has('orderId') ? 'orderId' : '');

    const listSql = [
      'SELECT id, user_id, type, extra',
      `FROM \`${messageTable}\``,
      "WHERE type IN ('license_domain_audit', 'license_audit')",
      '  AND id > ?',
      'ORDER BY id ASC',
    ];
    const replacements = [ sinceId ];
    if (limit > 0) {
      listSql.push('LIMIT ?');
      replacements.push(limit);
    }
    const [rows] = await connection.query(listSql.join('\n'), replacements);

    for (const row of (rows || [])) {
      report.summary.scanned += 1;
      const parsed = safeParseJson(row.extra);
      if (!parsed.ok) {
        report.summary.skippedInvalidExtra += 1;
        continue;
      }

      const extra = parsed.value && typeof parsed.value === 'object' ? { ...parsed.value } : {};
      const directLicenseId = Number(extra.licenseId || 0);
      const resolvedLicenseId = resolveLicenseId(extra);

      if (directLicenseId > 0) {
        report.summary.alreadyStandard += 1;
        continue;
      }

      let nextLicenseId = 0;
      let reason = '';
      if (resolvedLicenseId > 0) {
        nextLicenseId = resolvedLicenseId;
        reason = 'nested';
      } else {
        const orderId = resolveOrderId(extra);
        if (orderId > 0 && orderColumn) {
          nextLicenseId = await findLicenseIdByOrderId(connection, licenseTable, orderColumn, row.user_id, orderId);
          if (nextLicenseId > 0) {
            reason = 'orderId';
          }
        }
      }

      if (nextLicenseId <= 0) {
        report.summary.skippedNoMatch += 1;
        continue;
      }

      extra.licenseId = nextLicenseId;
      const nextExtraText = JSON.stringify(extra);

      if (writeMode) {
        await connection.query(
          `UPDATE \`${messageTable}\` SET extra = ? WHERE id = ? LIMIT 1`,
          [ nextExtraText, Number(row.id || 0) ]
        );
      }

      report.summary.updated += 1;
      if (reason === 'nested') {
        report.summary.normalizedFromNested += 1;
      }
      if (reason === 'orderId') {
        report.summary.resolvedByOrderId += 1;
      }
      if (report.samples.length < 20) {
        report.samples.push({
          id: Number(row.id || 0),
          userId: Number(row.user_id || 0),
          type: String(row.type || ''),
          licenseId: nextLicenseId,
          reason,
          writeMode,
        });
      }
    }
  } finally {
    await connection.end();
  }

  writeReport(reportFile, report);

  console.log('\n=== 历史授权审核消息回填结果 ===');
  console.log(`模式: ${writeMode ? '写入模式' : '预演模式'}`);
  console.log(`扫描消息: ${report.summary.scanned}`);
  console.log(`已更新: ${report.summary.updated}`);
  console.log(`已标准化(原本已有 licenseId): ${report.summary.alreadyStandard}`);
  console.log(`从嵌套字段补齐: ${report.summary.normalizedFromNested}`);
  console.log(`从订单ID反查补齐: ${report.summary.resolvedByOrderId}`);
  console.log(`无可回填数据: ${report.summary.skippedNoMatch}`);
  console.log(`非法 JSON: ${report.summary.skippedInvalidExtra}`);
  console.log(`报告文件: ${reportFile}\n`);
}

main().catch(error => {
  console.error(`脚本执行失败: ${error.message || error}`);
  process.exit(1);
});
