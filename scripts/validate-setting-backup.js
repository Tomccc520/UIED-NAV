#!/usr/bin/env node
/**
 * @copyright Tomda (https://www.tomda.top)
 * @copyright UIED技术团队 (https://fsuied.com)
 * @author UIED技术团队
 * @createDate 2026-03-02
 */

'use strict';

const fs = require('fs');
const path = require('path');

/**
 * 打印命令行用法
 */
function printUsage() {
  console.log('用法: node scripts/validate-setting-backup.js <备份文件路径>');
  console.log('示例: node scripts/validate-setting-backup.js ./uied_setting_backup_20260302_120000.json');
}

/**
 * 判断是否为普通对象
 */
function isPlainObject(value) {
  return Object.prototype.toString.call(value) === '[object Object]';
}

/**
 * 读取并解析备份 JSON 文件
 */
function readBackupJson(filePath) {
  const absPath = path.resolve(filePath);
  if (!fs.existsSync(absPath)) {
    throw new Error(`文件不存在: ${absPath}`);
  }
  const raw = fs.readFileSync(absPath, 'utf8');
  if (!String(raw || '').trim()) {
    throw new Error('备份文件为空');
  }
  let parsed = null;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new Error('备份文件不是有效 JSON');
  }
  if (!isPlainObject(parsed)) {
    throw new Error('备份文件顶层必须是 JSON 对象');
  }
  return { absPath, parsed };
}

/**
 * 校验备份结构并输出摘要
 */
function validateBackupPayload(payload) {
  const result = {
    version: String(payload.version || ''),
    hasSettings: isPlainObject(payload.settings),
    hasSiteInfo: isPlainObject(payload.siteInfo),
    hasAuthConfig: isPlainObject(payload.authConfig),
    settingsCount: 0,
    warnings: [],
  };

  if (result.hasSettings) {
    result.settingsCount = Object.keys(payload.settings).length;
  } else {
    result.warnings.push('缺少 settings 对象（将无法导入主要配置）');
  }

  if (!result.version) {
    result.warnings.push('未发现 version 字段（建议使用系统导出的标准备份）');
  }

  if (!result.hasSiteInfo) {
    result.warnings.push('缺少 siteInfo 对象（导入时不会恢复站点信息）');
  }

  if (!result.hasAuthConfig) {
    result.warnings.push('缺少 authConfig 对象（导入时不会恢复登录/注册配置）');
  }

  return result;
}

/**
 * 主流程：校验并打印结果
 */
function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    printUsage();
    process.exit(1);
  }

  try {
    const { absPath, parsed } = readBackupJson(filePath);
    const report = validateBackupPayload(parsed);
    console.log('设置备份校验通过');
    console.log(`文件: ${absPath}`);
    console.log(`版本: ${report.version || '(未提供)'}`);
    console.log(`settings 数量: ${report.settingsCount}`);
    console.log(`包含 siteInfo: ${report.hasSiteInfo ? '是' : '否'}`);
    console.log(`包含 authConfig: ${report.hasAuthConfig ? '是' : '否'}`);
    if (report.warnings.length > 0) {
      console.log('警告:');
      report.warnings.forEach((item, index) => {
        console.log(`  ${index + 1}. ${item}`);
      });
    }
  } catch (error) {
    console.error(`校验失败: ${error.message || error}`);
    process.exit(1);
  }
}

main();
