/**
 * @file fixPageCategories.js
 * @description 后端API服务
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * 修复页面分类关联 - 让 uiux 页面关联到正确的分类（有子分类的那些）
 */

async function main() {
  console.log('🔧 开始修复页面分类关联...\n');
  
  // 获取 uiux 页面
  const uiuxPage = await prisma.page.findUnique({ where: { slug: 'uiux' } });
  if (!uiuxPage) {
    console.log('❌ 找不到 uiux 页面');
    return;
  }
  
  // 获取所有有子分类的主分类 - 不带 uiux 前缀的（原始分类）
  const mainCategoriesWithChildren = await prisma.category.findMany({
    where: {
      parentId: null,
      children: { some: {} },
      NOT: { slug: { startsWith: 'uiux-' } },
      // 只要前端数据中定义的分类
      slug: {
        in: [
          'design-inspiration',
          'common-recommendations', 
          'design-system',
          'motion-design',
          'design-plugins',
          'design-resources',
          'data-visualization',
          'automotive-design',
          'design-teams',
          'game-ui',
          'metaverse-vrar',
          'other-content'
        ]
      }
    },
    include: {
      children: true,
      _count: { select: { children: true } }
    },
    orderBy: { order: 'asc' }
  });
  
  console.log(`📂 找到 ${mainCategoriesWithChildren.length} 个有子分类的主分类:\n`);
  for (const cat of mainCategoriesWithChildren) {
    console.log(`  - ${cat.name} (${cat.slug}): ${cat._count.children} 个子分类`);
  }
  
  // 删除 uiux 页面现有的分类关联
  await prisma.pageCategory.deleteMany({
    where: { pageId: uiuxPage.id }
  });
  console.log('\n🗑️ 已清除 uiux 页面的旧分类关联');
  
  // 重新关联到有子分类的主分类
  for (let i = 0; i < mainCategoriesWithChildren.length; i++) {
    const cat = mainCategoriesWithChildren[i];
    await prisma.pageCategory.create({
      data: {
        pageId: uiuxPage.id,
        categoryId: cat.id,
        order: i,
        visible: true
      }
    });
  }
  
  console.log(`\n✅ 已为 uiux 页面关联 ${mainCategoriesWithChildren.length} 个主分类`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
