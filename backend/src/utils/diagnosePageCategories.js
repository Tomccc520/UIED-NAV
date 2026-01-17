/**
 * @file diagnosePageCategories.js
 * @description 后端API服务
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

/**
 * 诊断页面分类问题
 * 检查为什么某些分类在某些页面不显示
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function diagnose() {
  console.log('=== 页面分类诊断工具 ===\n');
  
  // 1. 获取所有页面及其分类
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
        },
        orderBy: { order: 'asc' }
      }
    },
    orderBy: { order: 'asc' }
  });
  
  console.log(`共有 ${pages.length} 个页面\n`);
  
  // 2. 检查每个页面的分类情况
  for (const page of pages) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📄 页面: ${page.name} (slug: ${page.slug})`);
    console.log(`${'='.repeat(60)}`);
    
    if (page.pageCategories.length === 0) {
      console.log('  ⚠️  该页面没有关联任何分类！');
      continue;
    }
    
    console.log(`  关联了 ${page.pageCategories.length} 个主分类:\n`);
    
    let totalWebsites = 0;
    
    for (const pc of page.pageCategories) {
      const cat = pc.category;
      const directWebsites = cat._count.websites;
      const subWebsites = cat.children.reduce((sum, child) => sum + child._count.websites, 0);
      const total = directWebsites + subWebsites;
      totalWebsites += total;
      
      console.log(`  📁 ${cat.name} (ID: ${cat.id.slice(0, 8)}...)`);
      console.log(`     slug: ${cat.slug}`);
      console.log(`     直接网站: ${directWebsites}, 子分类网站: ${subWebsites}, 总计: ${total}`);
      
      if (cat.children.length > 0) {
        console.log(`     子分类 (${cat.children.length} 个):`);
        for (const child of cat.children) {
          const status = child._count.websites > 0 ? '✅' : '⚠️';
          console.log(`       ${status} ${child.name}: ${child._count.websites} 个网站 (ID: ${child.id.slice(0, 8)}...)`);
        }
      } else {
        console.log(`     ⚠️  没有子分类`);
      }
    }
    
    console.log(`\n  📊 该页面总网站数: ${totalWebsites}`);
  }
  
  // 3. 检查是否有重复名称的分类
  console.log(`\n\n${'='.repeat(60)}`);
  console.log('🔍 检查重复名称的分类');
  console.log(`${'='.repeat(60)}\n`);
  
  const allCategories = await prisma.category.findMany({
    include: {
      parent: true,
      _count: { select: { websites: true } }
    }
  });
  
  const byName = {};
  allCategories.forEach(cat => {
    if (!byName[cat.name]) byName[cat.name] = [];
    byName[cat.name].push(cat);
  });
  
  let hasDuplicates = false;
  for (const [name, cats] of Object.entries(byName)) {
    if (cats.length > 1) {
      hasDuplicates = true;
      console.log(`⚠️  "${name}" 有 ${cats.length} 个同名分类:`);
      cats.forEach(cat => {
        const parentInfo = cat.parent ? `父分类: ${cat.parent.name}` : '主分类';
        console.log(`   - ID: ${cat.id.slice(0, 8)}..., ${parentInfo}, slug: ${cat.slug}, 网站: ${cat._count.websites}`);
      });
      console.log('');
    }
  }
  
  if (!hasDuplicates) {
    console.log('✅ 没有重复名称的分类');
  }
  
  // 4. 检查"设计素材"分类的具体情况
  console.log(`\n\n${'='.repeat(60)}`);
  console.log('🔍 检查"设计素材"分类');
  console.log(`${'='.repeat(60)}\n`);
  
  const designResourcesCats = allCategories.filter(c => 
    c.name.includes('设计素材') || c.slug.includes('design-resources')
  );
  
  if (designResourcesCats.length === 0) {
    console.log('❌ 没有找到"设计素