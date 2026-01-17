/**
 * @file mergeDuplicateCategories.js
 * @description 后端API服务
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

/**
 * 合并重复的分类
 * 将重复的分类合并为一个，让多个页面共享同一个分类
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function mergeDuplicateCategories() {
  console.log('🚀 开始合并重复分类...\n');
  
  // 查找重复的主分类
  const duplicates = await prisma.$queryRaw`
    SELECT name, GROUP_CONCAT(id) as ids
    FROM Category
    WHERE parentId IS NULL
    GROUP BY name
    HAVING COUNT(*) > 1
  `;
  
  console.log(`📊 发现 ${duplicates.length} 组重复分类\n`);
  
  for (const dup of duplicates) {
    const ids = dup.ids.split(',');
    console.log(`\n📦 处理: ${dup.name}`);
    console.log(`   IDs: ${ids.join(', ')}`);
    
    // 获取每个分类的网站数量
    const categoriesWithCount = [];
    for (const id of ids) {
      // 统计主分类和子分类的网站总数
      const mainCount = await prisma.website.count({ where: { categoryId: id } });
      const children = await prisma.category.findMany({ where: { parentId: id } });
      let subCount = 0;
      for (const child of children) {
        subCount += await prisma.website.count({ where: { categoryId: child.id } });
      }
      categoriesWithCount.push({
        id,
        mainCount,
        subCount,
        totalCount: mainCount + subCount,
        childrenCount: children.length
      });
      console.log(`   ${id}: 主分类${mainCount}个, 子分类${subCount}个, 共${mainCount + subCount}个网站, ${children.length}个子分类`);
    }
    
    // 选择网站最多的作为保留分类
    categoriesWithCount.sort((a, b) => b.totalCount - a.totalCount);
    const keepId = categoriesWithCount[0].id;
    const removeIds = categoriesWithCount.slice(1).map(c => c.id);
    
    console.log(`   ✅ 保留: ${keepId}`);
    console.log(`   ❌ 删除: ${removeIds.join(', ')}`);
    
    // 将要删除的分类的页面关联转移到保留的分类
    for (const removeId of removeIds) {
      // 获取要删除分类的页面关联
      const pageCategories = await prisma.pageCategory.findMany({
        where: { categoryId: removeId }
      });
      
      for (const pc of pageCategories) {
        // 检查保留分类是否已经关联到这个页面
        const existing = await prisma.pageCategory.findFirst({
          where: { pageId: pc.pageId, categoryId: keepId }
        });
        
        if (!existing) {
          // 更新关联到保留的分类
          await prisma.pageCategory.update({
            where: { id: pc.id },
            data: { categoryId: keepId }
          });
          console.log(`   📎 转移页面关联: ${pc.pageId} -> ${keepId}`);
        } else {
          // 删除重复的关联
          await prisma.pageCategory.delete({ where: { id: pc.id } });
          console.log(`   🗑️ 删除重复关联: ${pc.id}`);
        }
      }
      
      // 删除要删除分类的子分类（先删除子分类的网站关联）
      const childrenToRemove = await prisma.category.findMany({
        where: { parentId: removeId }
      });
      
      for (const child of childrenToRemove) {
        // 将子分类的网站转移到保留分类的对应子分类
        const keepChildren = await prisma.category.findMany({
          where: { parentId: keepId }
        });
        
        // 找到同名的子分类
        const matchingChild = keepChildren.find(kc => kc.name === child.name);
        if (matchingChild) {
          // 转移网站
          const updated = await prisma.website.updateMany({
            where: { categoryId: child.id },
            data: { categoryId: matchingChild.id }
          });
          if (updated.count > 0) {
            console.log(`   📦 转移 ${updated.count} 个网站: ${child.name} -> ${matchingChild.name}`);
          }
        }
        
        // 删除子分类
        await prisma.category.delete({ where: { id: child.id } });
      }
      
      // 删除主分类
      await prisma.category.delete({ where: { id: removeId } });
      console.log(`   🗑️ 删除分类: ${removeId}`);
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('🎉 合并完成！');
  
  // 验证结果
  console.log('\n📊 验证结果:');
  const remaining = await prisma.$queryRaw`
    SELECT name, COUNT(*) as count
    FROM Category
    WHERE parentId IS NULL
    GROUP BY name
    HAVING COUNT(*) > 1
  `;
  console.log(`   剩余重复分类: ${remaining.length}`);
}

mergeDuplicateCategories()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
