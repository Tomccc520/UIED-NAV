/**
 * @file migrateWebsitesToSubCategoriesV2.js
 * @description 将主分类下的网站迁移到对应的子分类
 * 
 * 策略：
 * 1. 获取所有有子分类但网站在主分类的情况
 * 2. 将网站平均分配到子分类中
 * 
 * 使用方法: node src/utils/migrateWebsitesToSubCategoriesV2.js
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateWebsites() {
  console.log('开始迁移网站到子分类...\n');
  
  let totalMigrated = 0;
  
  // 获取所有主分类（有子分类且主分类下有网站的）
  const mainCategories = await prisma.category.findMany({
    where: { 
      parentId: null,
      websites: {
        some: {} // 有网站
      }
    },
    include: {
      children: {
        where: { visible: true },
        orderBy: { order: 'asc' }
      },
      websites: {
        orderBy: { order: 'asc' }
      }
    }
  });
  
  console.log(`找到 ${mainCategories.length} 个有网站的主分类\n`);
  
  for (const mainCat of mainCategories) {
    // 跳过没有子分类的主分类
    if (mainCat.children.length === 0) {
      console.log(`跳过 "${mainCat.name}": 没有子分类`);
      continue;
    }
    
    const websiteCount = mainCat.websites.length;
    const subCatCount = mainCat.children.length;
    
    console.log(`\n处理 "${mainCat.name}": ${websiteCount} 个网站, ${subCatCount} 个子分类`);
    
    // 计算每个子分类应该分配多少网站
    const websitesPerSubCat = Math.ceil(websiteCount / subCatCount);
    
    let websiteIndex = 0;
    for (let i = 0; i < subCatCount; i++) {
      const subCat = mainCat.children[i];
      const startIndex = websiteIndex;
      const endIndex = Math.min(websiteIndex + websitesPerSubCat, websiteCount);
      const websitesToMove = mainCat.websites.slice(startIndex, endIndex);
      
      if (websitesToMove.length === 0) continue;
      
      // 批量更新网站的分类
      const websiteIds = websitesToMove.map(w => w.id);
      await prisma.website.updateMany({
        where: { id: { in: websiteIds } },
        data: { categoryId: subCat.id }
      });
      
      console.log(`  -> "${subCat.name}": 分配 ${websitesToMove.length} 个网站`);
      totalMigrated += websitesToMove.length;
      websiteIndex = endIndex;
    }
  }
  
  console.log(`\n=== 迁移完成 ===`);
  console.log(`共迁移 ${totalMigrated} 个网站到子分类`);
  
  await prisma.$disconnect();
}

migrateWebsites().catch(console.error);
