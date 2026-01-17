/**
 * @file cleanDuplicateCategories.js
 * @description 后端API服务
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

/**
 * 清理重复分类数据
 * 
 * 问题1: 同名的主分类和子分类（子分类是主分类的子分类，但名称相同）
 * 解决: 将子分类的网站移动到主分类，然后删除子分类
 * 
 * 问题2: 不同主分类下的同名子分类（如电商素材下的子分类与UIUX设计素材下的子分类同名）
 * 解决: 保留有网站的子分类，删除空的子分类
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanDuplicateCategories() {
  console.log('=== 开始清理重复分类 ===\n');
  
  // 获取所有分类
  const allCategories = await prisma.category.findMany({
    include: {
      _count: { select: { websites: true } },
      parent: { select: { name: true, id: true } }
    }
  });
  
  const mainCats = allCategories.filter(c => !c.parentId);
  const subCats = allCategories.filter(c => c.parentId);
  
  console.log(`主分类数量: ${mainCats.length}`);
  console.log(`子分类数量: ${subCats.length}\n`);
  
  // 问题1: 同名的主分类和子分类
  console.log('=== 处理同名的主分类和子分类 ===');
  const mainCatNames = new Map(mainCats.map(c => [c.name, c]));
  
  for (const sub of subCats) {
    const mainCat = mainCatNames.get(sub.name);
    if (mainCat && sub.parentId === mainCat.id) {
      // 子分类是主分类的直接子分类，且名称相同
      console.log(`\n发现: "${sub.name}" 是主分类也是其子分类`);
      console.log(`  主分类 ID: ${mainCat.id}, 网站数: ${mainCat._count.websites}`);
      console.log(`  子分类 ID: ${sub.id}, 网站数: ${sub._count.websites}`);
      
      if (sub._count.websites > 0) {
        // 将子分类的网站移动到主分类
        console.log(`  -> 将 ${sub._count.websites} 个网站从子分类移动到主分类`);
        await prisma.website.updateMany({
          where: { categoryId: sub.id },
          data: { categoryId: mainCat.id }
        });
      }
      
      // 删除子分类
      console.log(`  -> 删除子分类`);
      await prisma.category.delete({ where: { id: sub.id } });
    }
  }
  
  // 问题2: 不同主分类下的同名空子分类
  console.log('\n=== 处理空的重复子分类 ===');
  
  // 重新获取子分类（因为可能已经删除了一些）
  const remainingSubCats = await prisma.category.findMany({
    where: { parentId: { not: null } },
    include: {
      _count: { select: { websites: true } },
      parent: { select: { name: true } }
    }
  });
  
  // 按名称分组
  const subCatsByName = new Map();
  for (const sub of remainingSubCats) {
    if (!subCatsByName.has(sub.name)) {
      subCatsByName.set(sub.name, []);
    }
    subCatsByName.get(sub.name).push(sub);
  }
  
  // 找出重复名称的子分类
  for (const [name, cats] of subCatsByName) {
    if (cats.length > 1) {
      // 检查是否有空的子分类可以删除
      const withWebsites = cats.filter(c => c._count.websites > 0);
      const empty = cats.filter(c => c._count.websites === 0);
      
      if (empty.length > 0 && withWebsites.length > 0) {
        console.log(`\n"${name}" 有 ${cats.length} 个同名子分类:`);
        for (const c of cats) {
          console.log(`  - ${c.parent?.name || 'Unknown'} 下, 网站数: ${c._count.websites}`);
        }
        
        // 删除空的子分类
        for (const emptySubCat of empty) {
          console.log(`  -> 删除空子分类 (父分类: ${emptySubCat.parent?.name})`);
          await prisma.category.delete({ where: { id: emptySubCat.id } });
        }
      }
    }
  }
  
  // 最终统计
  const finalCategories = await prisma.category.findMany();
  const finalMain = finalCategories.filter(c => !c.parentId).length;
  const finalSub = finalCategories.filter(c => c.parentId).length;
  
  console.log('\n=== 清理完成 ===');
  console.log(`主分类: ${mainCats.length} -> ${finalMain}`);
  console.log(`子分类: ${subCats.length} -> ${finalSub}`);
  
  await prisma.$disconnect();
}

// 运行
cleanDuplicateCategories().catch(console.error);
