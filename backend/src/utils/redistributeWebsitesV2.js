/**
 * @file redistributeWebsitesV2.js
 * @description 后端API服务
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

/**
 * 重新分配网站到正确的子分类 V2
 * 使用slug匹配前端subcategory ID
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

/**
 * 从前端数据文件中提取网站的URL到子分类ID的映射
 */
function extractUrlToSubcategoryMap(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const map = new Map();
  
  // 更精确的正则匹配
  const toolBlocks = content.split(/\n\s*\{/);
  
  for (const block of toolBlocks) {
    // 提取url
    const urlMatch = block.match(/url:\s*['"]([^'"]+)['"]/);
    // 提取subcategory
    const subMatch = block.match(/subcategory:\s*['"]([^'"]+)['"]/);
    
    if (urlMatch && subMatch) {
      const url = urlMatch[1].toLowerCase().replace(/\/$/, '');
      const subcategory = subMatch[1];
      map.set(url, subcategory);
    }
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
  
  // 提取URL到子分类ID的映射
  const urlToSubcategory = extractUrlToSubcategoryMap(filePath);
  console.log(`   📊 提取到 ${urlToSubcategory.size} 个URL映射`);
  
  // 获取数据库中该页面的所有子分类（按slug索引）
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
  
  // 构建子分类slug到ID的映射
  const subCategoryBySlug = new Map();
  const allCategoryIds = [];
  
  for (const pc of page.pageCategories) {
    allCategoryIds.push(pc.category.id);
    for (const sub of pc.category.children || []) {
      subCategoryBySlug.set(sub.slug, sub.id);
      allCategoryIds.push(sub.id);
    }
  }
  
  console.log(`   📊 数据库有 ${subCategoryBySlug.size} 个子分类`);
  
  // 获取该页面的所有网站
  const websites = await prisma.website.findMany({
    where: {
      categoryId: { in: allCategoryIds }
    }
  });
  
  console.log(`   📊 数据库中有 ${websites.length} 个网站`);
  
  let updated = 0;
  let notFound = 0;
  let alreadyCorrect = 0;
  
  for (const website of websites) {
    const normalizedUrl = website.url.toLowerCase().replace(/\/$/, '');
    const frontendSubcategoryId = urlToSubcategory.get(normalizedUrl);
    
    if (!frontendSubcategoryId) {
      notFound++;
      continue;
    }
    
    // 查找数据库中对应的子分类（通过slug匹配）
    const targetCategoryId = subCategoryBySlug.get(frontendSubcategoryId);
    
    if (!targetCategoryId) {
      // 尝试添加页面前缀匹配
      const prefixedSlug = `${pageSlug}-${frontendSubcategoryId}`;
      const targetWithPrefix = subCategoryBySlug.get(prefixedSlug);
      if (targetWithPrefix) {
        if (website.categoryId !== targetWithPrefix) {
          await prisma.website.update({
            where: { id: website.id },
            data: { categoryId: targetWithPrefix }
          });
          updated++;
        } else {
          alreadyCorrect++;
        }
      } else {
        notFound++;
      }
      continue;
    }
    
    // 如果分类不同，更新
    if (website.categoryId !== targetCategoryId) {
      await prisma.website.update({
        where: { id: website.id },
        data: { categoryId: targetCategoryId }
      });
      updated++;
    } else {
      alreadyCorrect++;
    }
  }
  
  console.log(`   ✅ 更新 ${updated}, 已正确 ${alreadyCorrect}, 未匹配 ${notFound}`);
  return { updated, notFound, alreadyCorrect };
}

/**
 * 主函数
 */
async function main() {
  console.log('🚀 开始重新分配网站到正确的子分类 (V2)...\n');
  
  const configs = [
    { slug: 'design', file: 'designToolsDatabase.js' },
    { slug: '3d', file: 'threeDToolsDatabase.js' },
    { slug: 'ecommerce', file: 'ecommerceToolsDatabase.js' },
    { slug: 'interior', file: 'interiorToolsDatabase.js' },
    { slug: 'font', file: 'fontToolsDatabase.js' },
  ];
  
  let totalUpdated = 0;
  let totalNotFound = 0;
  
  for (const config of configs) {
    const result = await processDataFile(config.slug, config.file);
    totalUpdated += result.updated;
    totalNotFound += result.notFound;
  }
  
  console.log('\n' + '='.repeat(50));
  console.log(`🎉 完成！更新 ${totalUpdated}, 未匹配 ${totalNotFound}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
