/**
 * @file removeDuplicateUrls.js
 * @description 删除数据库中重复的URL，保留第一个
 * 
 * 使用方法: node src/utils/removeDuplicateUrls.js
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function removeDuplicates() {
  console.log('开始清理重复的URL...\n');
  
  // 获取所有网站
  const websites = await prisma.website.findMany({
    orderBy: { createdAt: 'asc' } // 按创建时间排序，保留最早的
  });
  
  console.log(`数据库中共有 ${websites.length} 个网站`);
  
  // 按URL分组
  const urlMap = new Map(); // url -> [website ids]
  
  for (const website of websites) {
    const normalizedUrl = website.url.toLowerCase().replace(/\/$/, '');
    
    if (!urlMap.has(normalizedUrl)) {
      urlMap.set(normalizedUrl, []);
    }
    urlMap.get(normalizedUrl).push(website);
  }
  
  // 找出重复的
  const duplicates = [];
  for (const [url, sites] of urlMap) {
    if (sites.length > 1) {
      // 保留第一个，删除其余的
      for (let i = 1; i < sites.length; i++) {
        duplicates.push({
          id: sites[i].id,
          name: sites[i].name,
          url: sites[i].url,
          keepId: sites[0].id,
          keepName: sites[0].name
        });
      }
    }
  }
  
  console.log(`发现 ${duplicates.length} 个重复的网站需要删除\n`);
  
  if (duplicates.length === 0) {
    console.log('没有重复的URL，无需清理');
    await prisma.$disconnect();
    return;
  }
  
  // 显示将要删除的
  console.log('将要删除的重复网站:');
  for (const dup of duplicates.slice(0, 20)) {
    console.log(`  删除: ${dup.name} (${dup.id})`);
    console.log(`  保留: ${dup.keepName} (${dup.keepId})`);
    console.log(`  URL: ${dup.url}\n`);
  }
  
  if (duplicates.length > 20) {
    console.log(`  ... 还有 ${duplicates.length - 20} 个\n`);
  }
  
  // 执行删除
  const idsToDelete = duplicates.map(d => d.id);
  
  const result = await prisma.website.deleteMany({
    where: {
      id: { in: idsToDelete }
    }
  });
  
  console.log(`成功删除 ${result.count} 个重复的网站`);
  
  // 验证结果
  const finalCount = await prisma.website.count();
  console.log(`\n清理后数据库网站总数: ${finalCount}`);
  
  await prisma.$disconnect();
}

removeDuplicates().catch(console.error);
