/**
 * @file fixAllWebsiteCategories.js
 * @description 后端API服务
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

/**
 * 修复所有网站的分类关联 - 将网站关联到正确的子分类
 */

const dataFiles = [
  { file: 'uiuxToolsDatabase.js', prefix: 'uiux' },
  { file: 'aiToolsDatabase.js', prefix: 'ai' },
  { file: 'designToolsDatabase.js', prefix: 'design' },
  { file: 'threeDToolsDatabase.js', prefix: '3d' },
  { file: 'ecommerceToolsDatabase.js', prefix: 'ecommerce' },
  { file: 'interiorToolsDatabase.js', prefix: 'interior' },
  { file: 'fontToolsDatabase.js', prefix: 'font' },
];

async function main() {
  console.log('🔧 开始修复所有网站分类关联...\n');
  
  // 获取所有分类
  const allCategories = await prisma.category.findMany();
  
  // 创建多种映射方式
  const categoryMap = new Map();
  for (const cat of allCategories) {
    categoryMap.set(cat.slug, cat.id);
    categoryMap.set(cat.id, cat.id);
    // 去掉前缀的版本
    for (const prefix of ['uiux-', 'ai-', 'design-', '3d-', 'ecommerce-', 'interior-', 'font-']) {
      if (cat.slug.startsWith(prefix)) {
        const shortSlug = cat.slug.replace(prefix, '');
        if (!categoryMap.has(shortSlug)) {
          categoryMap.set(shortSlug, cat.id);
        }
      }
    }
  }
  
  console.log(`📂 数据库中有 ${allCategories.length} 个分类\n`);
  
  let totalUpdated = 0;
  
  for (const { file, prefix } of dataFiles) {
    const filePath = path.join(__dirname, '../../../frontend/src/data', file);
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️ 文件不存在: ${file}`);
      continue;
    }
    
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // 解析工具数据 - 更灵活的正则，支持 subCategory 和 subcategory
    const tools = [];
    
    // 匹配 subCategory (驼峰)
    const regex1 = /\{\s*(?:[^{}]*?)\burl:\s*['"]([^'"]+)['"](?:[^{}]*?)\bsubCategory:\s*['"]([^'"]+)['"](?:[^{}]*?)\}/gs;
    let match;
    while ((match = regex1.exec(content)) !== null) {
      tools.push({ url: match[1], subCategory: match[2] });
    }
    
    // 匹配 subcategory (小写)
    const regex2 = /\{\s*(?:[^{}]*?)\burl:\s*['"]([^'"]+)['"](?:[^{}]*?)\bsubcategory:\s*['"]([^'"]+)['"](?:[^{}]*?)\}/gs;
    while ((match = regex2.exec(content)) !== null) {
      tools.push({ url: match[1], subCategory: match[2] });
    }
    
    // 也尝试另一种顺序 - subCategory 在前
    const regex3 = /\{\s*(?:[^{}]*?)\bsubCategory:\s*['"]([^'"]+)['"](?:[^{}]*?)\burl:\s*['"]([^'"]+)['"](?:[^{}]*?)\}/gs;
    while ((match = regex3.exec(content)) !== null) {
      tools.push({ url: match[2], subCategory: match[1] });
    }
    
    // subcategory 在前
    const regex4 = /\{\s*(?:[^{}]*?)\bsubcategory:\s*['"]([^'"]+)['"](?:[^{}]*?)\burl:\s*['"]([^'"]+)['"](?:[^{}]*?)\}/gs;
    while ((match = regex4.exec(content)) !== null) {
      tools.push({ url: match[2], subCategory: match[1] });
    }
    
    if (tools.length === 0) {
      console.log(`📄 ${file}: 没有找到带子分类的网站`);
      continue;
    }
    
    // 去重
    const uniqueTools = [...new Map(tools.map(t => [t.url, t])).values()];
    console.log(`📄 ${file}: 找到 ${uniqueTools.length} 个有子分类的网站`);
    
    let updated = 0;
    for (const { url, subCategory } of uniqueTools) {
      // 查找网站
      const website = await prisma.website.findFirst({ where: { url } });
      if (!website) continue;
      
      // 尝试多种方式查找子分类ID
      let newCategoryId = null;
      
      // 1. 直接匹配
      newCategoryId = categoryMap.get(subCategory);
      
      // 2. 加前缀匹配
      if (!newCategoryId) {
        newCategoryId = categoryMap.get(`${prefix}-${subCategory}`);
      }
      
      // 3. 去掉前缀匹配
      if (!newCategoryId && subCategory.startsWith(`${prefix}-`)) {
        newCategoryId = categoryMap.get(subCategory.replace(`${prefix}-`, ''));
      }
      
      if (newCategoryId && newCategoryId !== website.categoryId) {
        await prisma.website.update({
          where: { id: website.id },
          data: { categoryId: newCategoryId }
        });
        updated++;
      }
    }
    
    console.log(`  ✅ 更新了 ${updated} 个网站\n`);
    totalUpdated += updated;
  }
  
  console.log(`\n📊 总计修复: ${totalUpdated} 个网站`);
  
  // 统计各页面数据
  console.log('\n📈 各页面数据统计:');
  const pages = await prisma.page.findMany({
    include: {
      pageCategories: {
        include: {
          category: {
            include: { children: true }
          }
        }
      }
    }
  });
  
  for (const page of pages) {
    const categoryIds = [];
    for (const pc of page.pageCategories) {
      categoryIds.push(pc.category.id);
      for (const child of pc.category.children) {
        categoryIds.push(child.id);
      }
    }
    
    const websiteCount = await prisma.website.count({
      where: { categoryId: { in: categoryIds } }
    });
    
    console.log(`  ${page.name}: ${websiteCount} 个网站`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
