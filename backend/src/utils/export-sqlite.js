/**
 * @file utils/export-sqlite.js
 * @description 从 SQLite 导出所有数据为 JSON 格式
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

// 所有需要导出的表
const tables = [
  // 核心业务表
  { name: 'Category', model: 'category' },
  { name: 'Website', model: 'website' },
  { name: 'Page', model: 'page' },
  { name: 'PageCategory', model: 'pageCategory' },
  { name: 'HotRecommendation', model: 'hotRecommendation' },
  { name: 'Banner', model: 'banner' },
  
  // 系统配置表
  { name: 'Admin', model: 'admin' },
  { name: 'SiteSetting', model: 'siteSetting' },
  { name: 'SiteInfo', model: 'siteInfo' },
  { name: 'NavMenu', model: 'navMenu' },
  { name: 'FooterGroup', model: 'footerGroup' },
  { name: 'FooterLink', model: 'footerLink' },
  { name: 'FriendLink', model: 'friendLink' },
  { name: 'SocialMediaGroup', model: 'socialMediaGroup' },
  { name: 'SocialMediaItem', model: 'socialMediaItem' },
  { name: 'SocialMedia', model: 'socialMedia' },
  
  // 功能配置表
  { name: 'FaviconApi', model: 'faviconApi' },
  { name: 'AiConfig', model: 'aiConfig' },
  { name: 'MonitorConfig', model: 'monitorConfig' },
  { name: 'MonitorLog', model: 'monitorLog' },
  { name: 'Configuration', model: 'configuration' },
  { name: 'ConfigurationVersion', model: 'configurationVersion' },
  { name: 'WordPressConfig', model: 'wordPressConfig' },
  { name: 'WordPressCategory', model: 'wordPressCategory' },
  { name: 'WordPressTag', model: 'wordPressTag' },
  { name: 'WordPressWidget', model: 'wordPressWidget' },
  
  // Pro 功能表
  { name: 'User', model: 'user' },
  { name: 'Rating', model: 'rating' },
  { name: 'WebsiteComment', model: 'websiteComment' },
  { name: 'ArticleComment', model: 'articleComment' },
  { name: 'Favorite', model: 'favorite' },
  { name: 'BrowsingHistory', model: 'browsingHistory' },
  { name: 'Article', model: 'article' },
  { name: 'Tag', model: 'tag' },
  { name: 'ArticleTag', model: 'articleTag' },
  { name: 'Media', model: 'media' },
  { name: 'WebsiteTag', model: 'websiteTag' },
  { name: 'WebsiteTagRelation', model: 'websiteTagRelation' },
  
  // 日志表
  { name: 'OperationLog', model: 'operationLog' },
  { name: 'SearchLog', model: 'searchLog' },
  { name: 'WebsiteSubmission', model: 'websiteSubmission' },
];

async function exportData() {
  console.log('开始导出 SQLite 数据...\n');
  
  const exportData = {
    exportedAt: new Date().toISOString(),
    tables: {},
    statistics: {},
  };
  
  let totalRecords = 0;
  
  for (const table of tables) {
    try {
      const data = await prisma[table.model].findMany();
      exportData.tables[table.name] = data;
      exportData.statistics[table.name] = data.length;
      totalRecords += data.length;
      console.log(`✅ ${table.name}: ${data.length} 条记录`);
    } catch (error) {
      console.log(`⚠️  ${table.name}: 跳过 (${error.message})`);
      exportData.tables[table.name] = [];
      exportData.statistics[table.name] = 0;
    }
  }
  
  // 创建导出目录
  const exportDir = path.join(__dirname, '../../../data');
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true });
  }
  
  // 生成文件名
  const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const filename = `export_${timestamp}.json`;
  const filepath = path.join(exportDir, filename);
  
  // 写入文件
  fs.writeFileSync(filepath, JSON.stringify(exportData, null, 2));
  
  console.log('\n========================================');
  console.log(`导出完成！`);
  console.log(`总记录数: ${totalRecords}`);
  console.log(`文件路径: ${filepath}`);
  console.log('========================================\n');
  
  // 打印统计信息
  console.log('数据统计:');
  console.log(`- 网站: ${exportData.statistics.Website || 0}`);
  console.log(`- 分类: ${exportData.statistics.Category || 0}`);
  console.log(`- 页面: ${exportData.statistics.Page || 0}`);
  console.log(`- 文章: ${exportData.statistics.Article || 0}`);
  console.log(`- 管理员: ${exportData.statistics.Admin || 0}`);
  
  return exportData;
}

// 运行导出
exportData()
  .then(() => {
    console.log('\n导出脚本执行完成');
    process.exit(0);
  })
  .catch((error) => {
    console.error('导出失败:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
