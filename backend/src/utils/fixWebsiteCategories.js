/**
 * @file fixWebsiteCategories.js
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
 * 修复网站分类关联 - 将网站关联到正确的子分类
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
  console.log('🔧 开始修复网站分类关联...\n');
  
  // 获取所有子分类
  const subCategories = await prisma.category.findMany({
    where: { parentId: { not: null } }
  });
  
  // 创建 slug -> id 映射
  const subCategoryMap = new Map();
  for (const cat of subCategories) {
    subCategoryMap.set(cat.slug, cat.id);
    // 也添加不带前缀的版本
    for (const prefix of ['uiux-', 'ai-', 'design-', '3d-', 'ecommerce-', 'interior-', 'font-']) {
      const shortSlug = cat.slug.replace(new RegExp(`^${prefix}`), '');
      if (!subCategoryMap.has(shortSlug)) {
        subCategoryMap.set(shortSlug, cat.id);
      }
    }
  }
  
  console.log(`📂 数据库中有 ${subCategories.length} 个子分类\n`);
  
  let totalUpdated = 0;
  
  for (const { file, prefix } of dataFiles) {
    const filePath = path.join(__dirname, '../../../frontend/src/data', file);
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️ 文件不存在: ${file}`);
      continue;
    }
    
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // 解析工具数据
    const tools = [];
    const objectRegex = /\{\s*id:\s*['"]([^'"]+)['"][\s\S]*?url:\s*['"]([^'"]+)['"][\s\S]*?\}/g;
    let objMatch;
    while ((objMatch = objectRegex.exec(content)) !== null) {
      const block = objMatch[0];
      const url = objMatch[2];
      
      const subCatMatch = block.match(/subCategory:\s*['"]([^'"]+)['"]/);
      if (subCatMatch && url) {
        tools.push({ url, subCategory: subCatMatch[1] });
      }
    }
    
    if (tools.length === 0) continue;
    
    console.log(`📄 ${file}: 找到 ${tools.length} 个有子分类的网站`);
    
    let updated = 0;
    for (const { url, subCategory } of tools) {
      // 查找网站
      const website = await prisma.website.findFirst({ where: { url } });
      if (!website) continue;
      
      // 查找子分类ID
      let newCategoryId = subCategoryMap.get(subCategory);
      if (!newCategoryId) {
        newCategoryId = subCategoryMap.get(`${prefix}-${subCategory}`);
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
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
