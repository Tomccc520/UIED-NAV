/**
 * @file redistributeWebsites.js
 * @description 后端API服务
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

/**
 * 重新分配网站到正确的子分类
 * 根据前端静态数据中的 subcategory 字段，将网站分配到对应的子分类
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

/**
 * 从前端数据文件中提取网站的URL到子分类的映射
 */
function extractUrlToSubcategoryMap(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const map = new Map();
  
  // 匹配工具对象，提取url和subcategory
  // 格式: { id: '...', name: '...', ..., url: '...', ..., subcategory: '...', ... }
  const regex = /\{[^{}]*url:\s*['"]([^'"]+)['"][^{}]*subcategory:\s*['"]([^'"]+)['"][^{}]*\}|\{[^{}]*subcategory:\s*['"]([^'"]+)['"][^{}]*url:\s*['"]([^'"]+)['"][^{}]*\}/g;
  
  let match;
  while ((match = regex.exec(content)) !== null) {
    const url = match[1] || match[4];
    const subcategory = match[2] || match[3];
    if (url && subcategory) {
      map.set(url.toLowerCase().replace(/\/$/, ''), subcategory);
    }
  }
  
  return map;
}

/**
 * 从前端数据文件中提取子分类ID到名称的映射
 */
function extractSubcategoryNames(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const map = new Map();
  
  // 匹配子分类定义: { id: '...', name: '...' }
  const regex = /\{\s*id:\s*['"]([^'"]+)['"],\s*name:\s*['"]([^'"]+)['"]\s*\}/g;
  
  let match;
  while ((match = regex.exec(content)) !== null) {
    map.set(match[1], match[2]);
  }
  
  return map;
}

/**
 * 处理单个数据文件
 */
async function processDataFile(pageSlug, fileName) {
  const filePath = path.resolve(__dirname, '../../../frontend/src/data', fileName);
  
  if (!fs.existsSync(filePath)) {
    console.log(`   ⚠️ 文件不存在: ${fileName}`);
    return { updated: 0, notFound: 0 };
  }
  
  console.log(`\n📦 处理 ${pageSlug} (${fileName})...`);
  
  // 提取URL到子分类的映射
  const urlToSubcategory = extractUrlToSubcategoryMap(filePath);
  const subcategoryNames = extractSubcategoryNames(filePath);
  
  console.log(`   📊 提取到 ${urlToSubcategory.size} 个URL映射, ${subcategoryNames.size} 个子分类名称`);
  
  // 获取数据库中该页面的所有子分类（按名称索引）
  const page = await prisma.page.findUnique({
    where: { slug: pageSlug },
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
  
  if (!page) {
    console.log(`   ⚠️ 页面不存在: ${pageSlug}`);
    return { updated: 0, notFound: 0 };
  }
  
  // 构建子分类名称到ID的映射
  const subCategoryByName = new Map();
  for (const pc of page.pageCategories) {
    for (const sub of pc.category.children || []) {
      subCategoryByName.set(sub.name.toLowerCase(), sub.id);
    }
  }
  
  // 获取该页面所有分类ID
  const allCategoryIds = [];
  for (const pc of page.pageCategories) {
    allCategoryIds.push(pc.category.id);
    for (const sub of pc.category.children || []) {
      allCategoryIds.push(sub.id);
    }
  }
  
  // 获取该页面的所有网站
  const websites = await prisma.website.findMany({
    where: {
      categoryId: { in: allCategoryIds }
    }
  });
  
  console.log(`   📊 数据库中有 ${websites.length} 个网站`);
  
  let updated = 0;
  let notFound = 0;
  
  for (const website of websites) {
    const normalizedUrl = website.url.toLowerCase().replace(/\/$/, '');
    const frontendSubcategoryId = urlToSubcategory.get(normalizedUrl);
    
    if (!frontendSubcategoryId) {
      notFound++;
      continue;
    }
    
    // 获取子分类名称
    const subcategoryName = subcategoryNames.get(frontendSubcategoryId);
    if (!subcategoryName) {
      notFound++;
      continue;
    }
    
    // 查找数据库中对应的子分类
    const targetCategoryId = subCategoryByName.get(subcategoryName.toLowerCase());
    if (!targetCategoryId) {
      notFound++;
      continue;
    }
    
    // 如果分类不同，更新
    if (website.categoryId !== targetCategoryId) {
      await prisma.website.update({
        where: { id: website.id },
        data: { categoryId: targetCategoryId }
      });
      updated++;
    }
  }
  
  console.log(`   ✅ 更新 ${updated} 个, 未匹配 ${notFound} 个`);
  return { updated, notFound };
}

/**
 * 主函数
 */
async function main() {
  console.log('🚀 开始重新分配网站到正确的子分类...\n');
  
  const configs = [
    { slug: 'design', file: 'designToolsDatabase.js' },
    { slug: '3d', file: 'threeDToolsDatabase.js' },
    { slug: 'ecommerce', file: 'ecommerceToolsDatabase.js' },
    { slug: 'interior', file: 'interiorToolsDatabase.js' },
    { slug: 'font', file: 'fontToolsDatabase.js' },
    { slug: 'uiux', file: 'uiuxToolsDatabase.js' },
    { slug: 'ai', file: 'aiToolsDatabase.js' },
  ];
  
  let totalUpdated = 0;
  let totalNotFound = 0;
  
  for (const config of configs) {
    const result = await processDataFile(config.slug, config.file);
    totalUpdated += result.updated;
    totalNotFound += result.notFound;
  }
  
  console.log('\n' + '='.repeat(50));
  console.log(`🎉 完成！更新 ${totalUpdated} 个, 未匹配 ${totalNotFound} 个`);
  
  // 验证结果
  console.log('\n📊 验证结果 (平面导航前3个分类):');
  const designData = await prisma.page.findUnique({
    where: { slug: 'design' },
    include: {
      pageCategories: {
        include: {
          category: {
            include: {
              children: {
                include: {
                  _count: { select: { websites: true } }
                }
              }
            }
          }
        },
        take: 3
      }
    }
  });
  
  for (const pc of designData?.pageCategories || []) {
    console.log(`\n${pc.category.name}:`);
    for (const sub of pc.category.children || []) {
      const count = sub._count?.websites || 0;
      const icon = count > 0 ? '✅' : '❌';
      console.log(`  ${icon} ${sub.name}: ${count}`);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
