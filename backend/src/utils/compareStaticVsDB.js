/**
 * @file compareStaticVsDB.js
 * @description 对比前端静态数据和数据库中的网站数量
 * 
 * 使用方法: node src/utils/compareStaticVsDB.js
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

// 读取前端静态数据文件
function readStaticData(filename) {
  const filePath = path.join(__dirname, '../../../frontend/src/data', filename);
  const content = fs.readFileSync(filePath, 'utf-8');
  return content;
}

// 统计静态数据中的工具数量
function countToolsInFile(content) {
  // 匹配所有工具对象（通过 id: 和 name: 模式）
  const toolMatches = content.match(/{\s*id:\s*['"][^'"]+['"]/g);
  return toolMatches ? toolMatches.length : 0;
}

// 统计分类数量
function countCategoriesInFile(content) {
  // 匹配分类定义
  const categoryMatches = content.match(/{\s*id:\s*['"][^'"]+['"],\s*name:\s*['"][^'"]+['"],\s*icon/g);
  return categoryMatches ? categoryMatches.length : 0;
}

async function compareData() {
  console.log('=== 对比前端静态数据 vs 数据库 ===\n');
  
  // 数据库统计
  const dbWebsites = await prisma.website.count();
  const dbCategories = await prisma.category.count();
  const dbMainCategories = await prisma.category.count({ where: { parentId: null } });
  const dbSubCategories = await prisma.category.count({ where: { NOT: { parentId: null } } });
  
  console.log('数据库统计:');
  console.log(`  网站总数: ${dbWebsites}`);
  console.log(`  分类总数: ${dbCategories} (主分类: ${dbMainCategories}, 子分类: ${dbSubCategories})`);
  
  // 静态数据文件列表
  const staticFiles = [
    { name: 'aiToolsDatabase.js', page: 'AI' },
    { name: 'uiuxToolsDatabase.js', page: 'UIUX' },
    { name: 'designToolsDatabase.js', page: 'Design' },
    { name: 'threeDToolsDatabase.js', page: '3D' },
    { name: 'fontToolsDatabase.js', page: 'Font' },
    { name: 'ecommerceToolsDatabase.js', page: 'Ecommerce' },
    { name: 'interiorToolsDatabase.js', page: 'Interior' },
  ];
  
  console.log('\n前端静态数据统计:');
  let totalStaticTools = 0;
  
  for (const file of staticFiles) {
    try {
      const content = readStaticData(file.name);
      const toolCount = countToolsInFile(content);
      totalStaticTools += toolCount;
      console.log(`  ${file.page}: ~${toolCount} 个工具`);
    } catch (e) {
      console.log(`  ${file.page}: 文件读取失败`);
    }
  }
  
  console.log(`\n静态数据工具总数估计: ~${totalStaticTools}`);
  console.log(`数据库网站总数: ${dbWebsites}`);
  console.log(`差异: ${totalStaticTools - dbWebsites} 个`);
  
  // 按页面对比
  console.log('\n=== 按页面详细对比 ===');
  
  const pages = await prisma.page.findMany({
    include: {
      pageCategories: {
        include: {
          category: {
            include: {
              children: true,
              _count: { select: { websites: true } }
            }
          }
        }
      }
    }
  });
  
  for (const page of pages) {
    let pageWebsiteCount = 0;
    const categoryIds = [];
    
    for (const pc of page.pageCategories) {
      categoryIds.push(pc.category.id);
      pageWebsiteCount += pc.category._count.websites;
      
      for (const child of pc.category.children) {
        categoryIds.push(child.id);
      }
    }
    
    // 获取该页面所有分类下的网站数
    const websiteCount = await prisma.website.count({
      where: { categoryId: { in: categoryIds } }
    });
    
    console.log(`\n${page.name} (${page.slug}):`);
    console.log(`  数据库网站数: ${websiteCount}`);
    console.log(`  主分类数: ${page.pageCategories.length}`);
  }
  
  // 检查是否有网站没有关联到任何页面
  console.log('\n=== 检查孤立数据 ===');
  
  // 获取所有页面关联的分类ID
  const allPageCategoryIds = [];
  for (const page of pages) {
    for (const pc of page.pageCategories) {
      allPageCategoryIds.push(pc.category.id);
      for (const child of pc.category.children) {
        allPageCategoryIds.push(child.id);
      }
    }
  }
  
  // 查找不在任何页面中的分类
  const orphanCategories = await prisma.category.findMany({
    where: {
      id: { notIn: allPageCategoryIds }
    },
    include: {
      _count: { select: { websites: true } }
    }
  });
  
  if (orphanCategories.length > 0) {
    console.log(`发现 ${orphanCategories.length} 个未关联到页面的分类:`);
    let orphanWebsites = 0;
    for (const cat of orphanCategories) {
      orphanWebsites += cat._count.websites;
      if (cat._count.websites > 0) {
        console.log(`  - ${cat.name} (${cat.slug}): ${cat._count.websites} 个网站`);
      }
    }
    console.log(`这些分类共有 ${orphanWebsites} 个网站`);
  } else {
    console.log('所有分类都已关联到页面');
  }
  
  await prisma.$disconnect();
}

compareData().catch(console.error);
