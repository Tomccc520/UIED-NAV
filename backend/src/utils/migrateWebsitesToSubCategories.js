/**
 * @file migrateWebsitesToSubCategories.js
 * @description 后端API服务
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

/**
 * 数据迁移脚本：将主分类的网站迁移到子分类
 * 
 * 问题：平面导航、3D导航、电商导航、室内导航、字体导航的网站数据
 * 存储在主分类下，而UI导航和AI导航的网站存储在子分类下。
 * 
 * 解决方案：将主分类的网站迁移到对应的第一个子分类下，
 * 保持数据结构与UI导航和AI导航一致。
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateWebsitesToSubCategories() {
  console.log('开始迁移网站数据到子分类...\n');
  
  // 获取所有主分类（没有父分类的分类）
  const mainCategories = await prisma.category.findMany({
    where: {
      parentId: null
    },
    include: {
      children: {
        orderBy: { order: 'asc' }
      },
      websites: true
    }
  });
  
  let totalMigrated = 0;
  
  for (const mainCat of mainCategories) {
    // 检查主分类是否有网站
    if (mainCat.websites.length === 0) {
      continue;
    }
    
    // 检查是否有子分类
    if (mainCat.children.length === 0) {
      console.log(`⚠️  ${mainCat.name}: 有 ${mainCat.websites.length} 个网站但没有子分类，跳过`);
      continue;
    }
    
    // 获取第一个子分类
    const firstSubCategory = mainCat.children[0];
    
    console.log(`📦 ${mainCat.name}: 将 ${mainCat.websites.length} 个网站迁移到子分类 "${firstSubCategory.name}"`);
    
    // 批量更新网站的分类ID
    const result = await prisma.website.updateMany({
      where: {
        categoryId: mainCat.id
      },
      data: {
        categoryId: firstSubCategory.id
      }
    });
    
    totalMigrated += result.count;
    console.log(`   ✅ 已迁移 ${result.count} 个网站\n`);
  }
  
  console.log(`\n🎉 迁移完成！共迁移 ${totalMigrated} 个网站`);
  
  // 验证迁移结果
  console.log('\n📊 验证迁移结果：');
  
  const pages = ['design', '3d', 'ecommerce', 'interior', 'font'];
  
  for (const slug of pages) {
    const page = await prisma.page.findUnique({
      where: { slug },
      include: {
        pageCategories: {
          include: {
            category: {
              include: {
                children: true,
                websites: true
              }
            }
          }
        }
      }
    });
    
    if (!page) continue;
    
    let mainTotal = 0;
    let subTotal = 0;
    
    for (const pc of page.pageCategories) {
      mainTotal += pc.category.websites.length;
      for (const child of pc.category.children) {
        const childWebsites = await prisma.website.count({
          where: { categoryId: child.id }
        });
        subTotal += childWebsites;
      }
    }
    
    console.log(`   ${page.name}: 主分类=${mainTotal}, 子分类=${subTotal}`);
  }
}

// 执行迁移
migrateWebsitesToSubCategories()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
