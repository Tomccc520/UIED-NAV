/**
 * @file accurateCount.js
 * @description 准确统计静态数据和数据库的网站数量
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

function countUrlsInFile(filePath, varName) {
  if (!fs.existsSync(filePath)) return { total: 0, unique: 0 };
  
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // 提取所有URL
  const urlPattern = /url:\s*['"]([^'"]+)['"]/g;
  const urls = [];
  let match;
  while ((match = urlPattern.exec(content)) !== null) {
    urls.push(match[1].toLowerCase().replace(/\/$/, ''));
  }
  
  const uniqueUrls = new Set(urls);
  return { total: urls.length, unique: uniqueUrls.size };
}

async function main() {
  console.log('=== 准确统计对比 ===\n');
  
  const files = [
    { name: 'AI', path: path.resolve(__dirname, '../../../frontend/src/data/aiToolsDatabase.js') },
    { name: 'UIUX', path: path.resolve(__dirname, '../../../frontend/src/data/uiuxToolsDatabase.js') },
    { name: 'Design', path: path.resolve(__dirname, '../../../frontend/src/data/designToolsDatabase.js') },
    { name: '3D', path: path.resolve(__dirname, '../../../frontend/src/data/threeDToolsDatabase.js') },
    { name: 'Font', path: path.resolve(__dirname, '../../../frontend/src/data/fontToolsDatabase.js') },
    { name: 'Ecommerce', path: path.resolve(__dirname, '../../../frontend/src/data/ecommerceToolsDatabase.js') },
    { name: 'Interior', path: path.resolve(__dirname, '../../../frontend/src/data/interiorToolsDatabase.js') },
  ];
  
  console.log('静态数据统计:');
  console.log('─'.repeat(50));
  
  let totalStatic = 0;
  const allStaticUrls = new Set();
  
  for (const file of files) {
    const stats = countUrlsInFile(file.path);
    console.log(`${file.name}: ${stats.total} 个URL (唯一: ${stats.unique})`);
    totalStatic += stats.total;
    
    // 收集所有URL
    const content = fs.readFileSync(file.path, 'utf-8');
    const urlPattern = /url:\s*['"]([^'"]+)['"]/g;
    let match;
    while ((match = urlPattern.exec(content)) !== null) {
      allStaticUrls.add(match[1].toLowerCase().replace(/\/$/, ''));
    }
  }
  
  console.log('─'.repeat(50));
  console.log(`静态数据总计: ${totalStatic} 个URL`);
  console.log(`静态数据唯一URL: ${allStaticUrls.size} 个`);
  console.log(`静态数据重复URL: ${totalStatic - allStaticUrls.size} 个`);
  
  // 数据库统计
  console.log('\n数据库统计:');
  console.log('─'.repeat(50));
  
  const dbWebsites = await prisma.website.findMany({
    select: { url: true }
  });
  
  const dbUrls = new Set(dbWebsites.map(w => w.url.toLowerCase().replace(/\/$/, '')));
  
  console.log(`数据库总网站数: ${dbWebsites.length}`);
  console.log(`数据库唯一URL: ${dbUrls.size}`);
  console.log(`数据库重复URL: ${dbWebsites.length - dbUrls.size}`);
  
  // 对比
  console.log('\n=== 对比结果 ===');
  console.log('─'.repeat(50));
  
  // 静态数据中有但数据库没有的
  const missingInDB = [];
  for (const url of allStaticUrls) {
    if (!dbUrls.has(url)) {
      missingInDB.push(url);
    }
  }
  
  // 数据库中有但静态数据没有的
  const extraInDB = [];
  for (const url of dbUrls) {
    if (!allStaticUrls.has(url)) {
      extraInDB.push(url);
    }
  }
  
  console.log(`静态数据有但数据库没有: ${missingInDB.length} 个`);
  console.log(`数据库有但静态数据没有: ${extraInDB.length} 个`);
  
  if (missingInDB.length > 0 && missingInDB.length <= 20) {
    console.log('\n缺失的URL示例:');
    missingInDB.slice(0, 10).forEach(url => console.log(`  ${url}`));
  }
  
  if (extraInDB.length > 0 && extraInDB.length <= 20) {
    console.log('\n数据库额外的URL示例:');
    extraInDB.slice(0, 10).forEach(url => console.log(`  ${url}`));
  }
  
  await prisma.$disconnect();
}

main().catch(console.error);
