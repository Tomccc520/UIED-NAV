/**
 * @file checkDBDuplicates.js
 * @description 后端API服务
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
  // 检查数据库中的重复URL
  const websites = await prisma.website.findMany({
    select: { url: true }
  });
  
  const urlCount = {};
  for (const w of websites) {
    const url = w.url.toLowerCase().replace(/\/$/, '');
    urlCount[url] = (urlCount[url] || 0) + 1;
  }
  
  const duplicates = Object.entries(urlCount).filter(([_, count]) => count > 1);
  console.log('数据库中重复的URL数:', duplicates.length);
  console.log('数据库总网站数:', websites.length);
  console.log('数据库唯一URL数:', Object.keys(urlCount).length);
  
  if (duplicates.length > 0 && duplicates.length <= 30) {
    console.log('\n重复的URL:');
    for (const [url, count] of duplicates) {
      console.log('  ' + url + ': ' + count + '次');
    }
  }
  
  await prisma.$disconnect();
}

check().catch(console.error);
