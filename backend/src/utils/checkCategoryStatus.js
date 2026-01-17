/**
 * @file checkCategoryStatus.js
 * @description 检查分类和子分类的导入状态，找出重复和缺失
 * 
 * 使用方法: node src/utils/checkCategoryStatus.js
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkCategoryStatus() {
  console.log('=== 检查分类状态 ===\n');
  
  // 获取所有分类
  const allCategories = await prisma.category.findMany({
    include: {
      _count: { select: { websites: true } },
      parent: true
    },
    orderBy: { name: 'asc' }
  });
  
  const mainCategories = allCategories.filter(c => !c.parentId);
  const subCategories = allCategories.filter(c => c.parentId);
  
  console.log(`总分类数: ${allCategories.length}`);
  console.log(`主分类数: ${mainCategories.length}`);
  console.log(`子分类数: ${subCategories.length}\n`);
  
  // 1. 检查重复的分类名称
  console.log('=== 1. 检查重复的分类名称 ===');
  const nameCount = {};
  allCategories.forEach(c => {
    nameCount[c.name] = (nameCount[c.name] || 0) + 1;
  });
  
  const duplicateNames = Object.entries(nameCount).filter(([_, count]) => count > 1);
  if (duplicateNames.length > 0) {
    console.log(`发现 ${duplicateNames.length} 个重复名称:`);
    for (const [name, count] of duplicateNames) {
      const cats = allCategories.filter(c => c.name === name);
      console.log(`\n  "${name}" (${count}次):`);
      cats.forEach(c => {
        const type = c.parentId ? `子分类 (父: ${c.parent?.name})` : '主分类';
        console.log(`    - ID: ${c.id}, slug: ${c.slug}, 类型: ${type}, 网站数: ${c._count.websites}`);
      });
    }
  } else {
    console.log('没有发现重复的分类名称');
  }
  
  // 2. 检查重复的 slug
  console.log('\n=== 2. 检查重复的 slug ===');
  const slugCount = {};
  allCategories.forEach(c => {
    slugCount[c.slug] = (slugCount[c.slug] || 0) + 1;
  });
  
  const duplicateSlugs = Object.entries(slugCount).filter(([_, count]) => count > 1);
  if (duplicateSlugs.length > 0) {
    console.log(`发现 ${duplicateSlugs.length} 个重复 slug:`);
    for (const [slug, count] of duplicateSlugs) {
      console.log(`  "${slug}": ${count}次`);
    }
  } else {
    console.log('没有发现重复的 slug');
  }
  
  // 3. 检查没有子分类的主分类
  console.log('\n=== 3. 没有子分类的主分类 ===');
  const mainWithoutSub = mainCategories.filter(main => {
    const subs = subCategories.filter(sub => sub.parentId === main.id);
    return subs.length === 0;
  });
  
  if (mainWithoutSub.length > 0) {
    console.log(`发现 ${mainWithoutSub.length} 个没有子分类的主分类:`);
    mainWithoutSub.forEach(c => {
      console.log(`  - ${c.name} (${c.slug}), 网站数: ${c._count.websites}`);
    });
  } else {
    console.log('所有主分类都有子分类');
  }
  
  // 4. 检查子分类没有网站的情况
  console.log('\n=== 4. 没有网站的子分类 ===');
  const emptySubCategories = subCategories.filter(c => c._count.websites === 0);
  if (emptySubCategories.length > 0) {
    console.log(`发现 ${emptySubCategories.length} 个没有网站的子分类:`);
    // 按父分类分组显示
    const groupedEmpty = {};
    emptySubCategories.forEach(c => {
      const parentName = c.parent?.name || '未知';
      if (!groupedEmpty[parentName]) {
        groupedEmpty[parentName] = [];
      }
      groupedEmpty[parentName].push(c.name);
    });
    
    for (const [parentName, subs] of Object.entries(groupedEmpty)) {
      console.log(`  ${parentName}:`);
      subs.forEach(name => console.log(`    - ${name}`));
    }
  } else {
    console.log('所有子分类都有网站');
  }
  
  // 5. 检查主分类还有直接网站的情况（应该都迁移到子分类了）
  console.log('\n=== 5. 主分类下仍有直接网站 ===');
  const mainWithDirectWebsites = mainCategories.filter(c => c._count.websites > 0);
  if (mainWithDirectWebsites.length > 0) {
    console.log(`发现 ${mainWithDirectWebsites.length} 个主分类仍有直接网站:`);
    mainWithDirectWebsites.forEach(c => {
      const subCount = subCategories.filter(sub => sub.parentId === c.id).length;
      console.log(`  - ${c.name}: ${c._count.websites} 个网站, ${subCount} 个子分类`);
    });
  } else {
    console.log('所有主分类的网站都已迁移到子分类');
  }
  
  // 6. 统计各页面的分类情况
  console.log('\n=== 6. 各页面分类统计 ===');
  const pages = await prisma.page.findMany({
    include: {
      pageCategories: {
        include: {
          category: {
            include: {
              children: {
                include: {
                  _count: { select: { websites: true } }
                }
              },
              _count: { select: { websites: true } }
            }
          }
        }
      }
    }
  });
  
  for (const page of pages) {
    const mainCats = page.pageCategories.length;
    let totalSubs = 0;
    let totalWebsites = 0;
    let emptySubs = 0;
    
    page.pageCategories.forEach(pc => {
      totalSubs += pc.category.children.length;
      totalWebsites += pc.category._count.websites;
      pc.category.children.forEach(child => {
        totalWebsites += child._count.websites;
        if (child._count.websites === 0) emptySubs++;
      });
    });
    
    console.log(`  ${page.name} (${page.slug}):`);
    console.log(`    主分类: ${mainCats}, 子分类: ${totalSubs}, 网站: ${totalWebsites}, 空子分类: ${emptySubs}`);
  }
  
  await prisma.$disconnect();
}

checkCategoryStatus().catch(console.error);
