/**
 * @file importBySubcategory.js
 * @description 后端API服务
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

/**
 * 按子分类导入网站数据
 * 根据前端数据的subcategory字段，导入到数据库对应的子分类
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

// 前端数据文件
const dataFiles = [
  '../../../frontend/src/data/uiuxToolsDatabase.js',
  '../../../frontend/src/data/aiToolsDatabase.js', 
  '../../../frontend/src/data/designToolsDatabase.js',
  '../../../frontend/src/data/threeDToolsDatabase.js',
  '../../../frontend/src/data/ecommerceToolsDatabase.js',
  '../../../frontend/src/data/interiorToolsDatabase.js',
  '../../../frontend/src/data/fontToolsDatabase.js',
];

/**
 * 从文件中提取网站数据
 */
function extractWebsites(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const websites = [];
  
  // 简单的正则提取
  const blocks = content.split(/\n\s*\{/).slice(1);
  
  for (const block of blocks) {
    const urlMatch = block.match(/url:\s*['"]([^'"]+)['"]/);
    const nameMatch = block.match(/name:\s*['"]([^'"]+)['"]/);
    const descMatch = block.match(/description:\s*['"]([^'"]*)['"]/);
    // 支持 subcategory 和 subCategory 两种格式
    const subMatch = block.match(/sub[Cc]ategory:\s*['"]([^'"]+)['"]/);
    const iconMatch = block.match(/iconUrl:\s*['"]([^'"]+)['"]/);
    
    if (urlMatch && nameMatch && subMatch) {
      websites.push({
        url: urlMatch[1],
        name: nameMatch[1],
        description: descMatch ? descMatch[1] : '',
        subcategory: subMatch[1],
        iconUrl: iconMatch ? iconMatch[1] : null,
        isHot: /isHot:\s*true/.test(block),
        isFeatured: /isFeatured:\s*true/.test(block),
        isNew: /isNew:\s*true/.test(block),
      });
    }
  }
  
  return websites;
}

async function main() {
  console.log('🚀 开始按子分类导入网站...\n');
  
  // 获取所有子分类（按slug索引）
  const allCategories = await prisma.category.findMany({
    where: { parentId: { not: null } }
  });
  const categoryBySlug = new Map();
  for (const cat of allCategories) {
    categoryBySlug.set(cat.slug, cat.id);
  }
  console.log(`📊 数据库有 ${categoryBySlug.size} 个子分类\n`);
  
  // 获取已存在的URL
  const existing = await prisma.website.findMany({ select: { url: true } });
  const existingUrls = new Set(existing.map(w => w.url.toLowerCase().replace(/\/$/, '')));
  console.log(`📊 数据库已有 ${existingUrls.size} 个网站\n`);
  
  let totalImported = 0;
  let totalSkipped = 0;
  let totalNoCategory = 0;
  
  for (const file of dataFiles) {
    const filePath = path.resolve(__dirname, file);
    if (!fs.existsSync(filePath)) continue;
    
    const fileName = path.basename(file);
    const websites = extractWebsites(filePath);
    console.log(`📦 ${fileName}: ${websites.length} 个网站`);
    
    let imported = 0, skipped = 0, noCategory = 0;
    
    for (const w of websites) {
      const normalizedUrl = w.url.toLowerCase().replace(/\/$/, '');
      if (existingUrls.has(normalizedUrl)) {
        skipped++;
        continue;
      }
      
      const categoryId = categoryBySlug.get(w.subcategory);
      if (!categoryId) {
        noCategory++;
        continue;
      }
      
      try {
        await prisma.website.create({
          data: {
            name: w.name,
            description: w.description,
            url: w.url,
            iconUrl: w.iconUrl,
            categoryId: categoryId,
            isHot: w.isHot,
            isFeatured: w.isFeatured,
            isNew: w.isNew,
            tags: '[]',
            order: 0,
          }
        });
        imported++;
        existingUrls.add(normalizedUrl);
      } catch (e) {
        skipped++;
      }
    }
    
    console.log(`   ✅ 新增 ${imported}, 跳过 ${skipped}, 无分类 ${noCategory}`);
    totalImported += imported;
    totalSkipped += skipped;
    totalNoCategory += noCategory;
  }
  
  console.log('\n' + '='.repeat(50));
  console.log(`🎉 完成！新增 ${totalImported}, 跳过 ${totalSkipped}, 无分类 ${totalNoCategory}`);
  
  // 最终统计
  const total = await prisma.website.count();
  console.log(`\n📊 数据库总网站数: ${total}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
