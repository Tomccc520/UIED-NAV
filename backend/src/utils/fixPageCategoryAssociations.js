/**
 * @file fixPageCategoryAssociations.js
 * @description 后端API服务
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

/**
 * 修复页面分类关联 - 删除子分类关联，只保留主分类
 * 
 * 问题：之前的分类选择允许选择子分类，导致侧边栏显示子分类
 * 解决：删除所有子分类的关联，只保留主分类（parentId为null的分类）
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixPageCategoryAssociations() {
  console.log('开始修复页面分类关联...\n');

  try {
    // 1. 获取所有子分类ID（parentId不为null的分类）
    const subCategories = await prisma.category.findMany({
      where: {
        parentId: { not: null }
      },
      select: { id: true, name: true, parentId: true }
    });

    const subCategoryIds = subCategories.map(c => c.id);
    console.log(`找到 ${subCategories.length} 个子分类`);

    // 2. 查找所有关联到子分类的页面分类记录
    const wrongAssociations = await prisma.pageCategory.findMany({
      where: {
        categoryId: { in: subCategoryIds }
      },
      include: {
        page: { select: { name: true, slug: true } },
        category: { select: { name: true, parentId: true } }
      }
    });

    console.log(`\n找到 ${wrongAssociations.length} 个错误的子分类关联：`);
    
    for (const assoc of wrongAssociations) {
      console.log(`  - 页面 "${assoc.page.name}" (${assoc.page.slug}) 关联了子分类 "${assoc.category.name}"`);
    }

    if (wrongAssociations.length === 0) {
      console.log('\n没有需要修复的关联，数据已经是正确的！');
      return;
    }

    // 3. 删除这些错误的关联
    console.log('\n正在删除错误的子分类关联...');
    
    const deleteResult = await prisma.pageCategory.deleteMany({
      where: {
        categoryId: { in: subCategoryIds }
      }
    });

    console.log(`\n✅ 成功删除 ${deleteResult.count} 个错误的子分类关联`);

    // 4. 显示修复后的状态
    console.log('\n修复后的页面分类状态：');
    const pages = await prisma.page.findMany({
      include: {
        pageCategories: {
          include: {
            category: { select: { name: true, parentId: true } }
          }
        }
      },
      orderBy: { order: 'asc' }
    });

    for (const page of pages) {
      const mainCats = page.pageCategories.filter(pc => pc.category.parentId === null);
      console.log(`  ${page.name} (${page.slug}): ${mainCats.length} 个主分类`);
    }

  } catch (error) {
    console.error('修复失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixPageCategoryAssociations();
