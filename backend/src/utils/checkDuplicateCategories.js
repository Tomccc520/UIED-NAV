/**
 * @file checkDuplicateCategories.js
 * @description 后端API服务
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDuplicates() {
  // 获取所有分类
  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' },
    include: {
      _count: { select: { websites: true } }
    }
  });
  
  // 按名称分组
  const byName = {};
  categories.forEach(cat => {
    if (!byName[cat.name]) byName[cat.name] = [];
    byName[cat.name].push(cat);
  });
  
  // 找出重复的名称
  console.log('=== 重复名称的分类 ===');
  let hasDuplicates = false;
  for (const [name, cats] of Object.entries(byName)) {
    if (cats.length > 1) {
      hasDuplicates = true;
      console.log(`\n名称: ${name} (共 ${cats.length} 个)`);
      cats.forEach(cat => {
        console.log(`  - ID: ${cat.id}, parentId: ${cat.parentId || 'null'}, slug: ${cat.slug}, websites: ${cat._count.websites}`);
      });
    }
  }
  if (!hasDuplicates) {
    console.log('没有重复名称的分类');
  }
  
  // 检查子分类是否有parentId=null的情况
  console.log('\n=== 检查子分类名称是否作为主分类存在 ===');
  const mainCategories = categories.filter(c => !c.parentId);
  const subCategories = categories.filter(c => c.parentId);
  
  console.log(`主分类数量: ${mainCategories.length}`);
  console.log(`子分类数量: ${subCategories.length}`);
  
  const subNames = new Set(subCategories.map(c => c.name));
  const mainNames = new Set(mainCategories.map(c => c.name));
  
  const overlap = [...subNames].filter(name => mainNames.has(name));
  if (overlap.length > 0) {
    console.log('\n以下名称同时存在于主分类和子分类中:');
    overlap.forEach(name => {
      const main = mainCategories.find(c => c.name === name);
      const subs = subCategories.filter(c => c.name === name);
      console.log(`  ${name}:`);
      console.log(`    主分类: ID=${main.id}, slug=${main.slug}`);
      subs.forEach(sub => {
        console.log(`    子分类: ID=${sub.id}, slug=${sub.slug}, parentId=${sub.parentId}`);
      });
    });
  } else {
    console.log('没有重叠');
  }
  
  // 列出所有主分类
  console.log('\n=== 所有主分类 ===');
  mainCategories.forEach(cat => {
    console.log(`  ${cat.name} (ID: ${cat.id}, slug: ${cat.slug})`);
  });
  
  await prisma.$disconnect();
}

checkDuplicates().catch(console.error);
