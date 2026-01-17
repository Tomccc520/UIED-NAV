/**
 * @file importMissingWebsites.js
 * @description 后端API服务
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

/**
 * 导入缺失的网站数据
 * 从前端静态数据中导入数据库中不存在的网站
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

/**
 * 从前端数据文件中提取所有网站
 */
function extractWebsites(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const websites = [];
  
  // 匹配每个工具对象
  const regex = /\{\s*id:\s*['"]([^'"]+)['"],\s*name:\s*['"]([^'"]+)['"],\s*description:\s*['"]([^'"]*)['"]/g;
  
  let match;
  let lastIndex = 0;
  
  while ((match = regex.exec(content)) !== null) {
    const startIndex = match.index;
    
    // 找到对象结束位置
    let braceCount = 0;
    let endIndex = startIndex;
    for (let i = startIndex; i < content.length; i++) {
      if (content[i] === '{') braceCount++;
      if (content[i] === '}') braceCount--;
      if (braceCount === 0) {
        endIndex = i + 1;
        break;
      }
    }
    
    const objStr = content.substring(startIndex, endIndex);
    
    const website = {
      id: match[1],
      name: match[2],
      description: match[3],
    };
    
    // 提取其他字段
    const urlMatch = objStr.match(/url:\s*['"]([^'"]+)['"]/);
    if (urlMatch) website.url = urlMatch[1];
    
    const iconMatch = objStr.match(/iconUrl:\s*['"]([^'"]+)['"]/);
    if (iconMatch) website.iconUrl = iconMatch[1];
    
    const subMatch = objStr.match(/subcategory:\s*['"]([^'"]+)['"]/);
    if (subMatch) website.subcategory = subMatch[1];
    
    const catMatch = objStr.match(/category:\s*['"]([^'"]+)['"]/);
    if (catMatch) website.category = catMatch[1];
    
    website.isHot = /isHot:\s*true/.test(objStr);
    website.isFeatured = /isFeatured:\s*true/.test(objStr);
    website.isNew = /isNew:\s*true/.test(objStr);
    
    const tagsMatch = objStr.match(/tags:\s*\[([^\]]*)\]/);
    if (tagsMatch) {
      website.tags = tagsMatch[1].match(/['"]([^'"]+)['"]/g)?.map(t => t.replace(/['"]/g, '')) || [];
    } else {
      website.tags = [];
    }
    
    if (website.url) {
      websites.push(website);
    }
    
    lastIndex = endIndex;
  }
  
  return websites;
}

/**
 * 导入单个页面的缺失数据
 */
async function importMissingData(pageSlug, fileName) {
  const filePath = path.resolve(__dirname, '../../../frontend/src/data', fileName);
  
  if (!fs.existsSync(filePath)) {
    console.log(`   ⚠️ 文件不存在: ${fileName}`);
    return { imported: 0, skipped: 0 };
  }
  
  console.log(`\n📦 处理 ${pageSlug} (${fileName})...`);
  
  // 提取前端数据
  const frontendWebsites = extractWebsites(filePath);
  console.log(`   📊 前端数据: ${frontendWebsites.length} 个网站`);
  
  // 获取数据库中已存在的URL
  const existingWebsites = await prisma.website.findMany({
    select: { url: true }
  });
  const existingUrls = new Set(existingWebsites.map(w => w.url.toLowerCase().replace(/\/$/, '')));
  
  // 获取该页面的子分类（按slug索引）
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
    return { imported: 0, skipped: 0 };
  }
  
  // 构建子分类slug到ID的映射
  const subCategoryBySlug = new Map();
  let defaultCategoryId = null;
  
  for (const pc of page.pageCategories) {
    for (const sub of pc.category.children || []) {
      subCategoryBySlug.set(sub.slug, sub.id);
      if (!defaultCategoryId) {
        defaultCategoryId = sub.id;
      }
    }
  }
  
  let imported = 0;
  let skipped = 0;
  let noCategory = 0;
  
  for (const website of frontendWebsites) {
    const normalizedUrl = website.url.toLowerCase().replace(/\/$/, '');
    
    // 跳过已存在的
    if (existingUrls.has(normalizedUrl)) {
      skipped++;
      continue;
    }
    
    // 查找目标分类
    let targetCategoryId = null;
    
    if (website.subcategory) {
      targetCategoryId = subCategoryBySlug.get(website.subcategory);
    }
    
    if (!targetCategoryId) {
      targetCategoryId = defaultCategoryId;
    }
    
    if (!targetCategoryId) {
      noCategory++;
      continue;
    }
    
    try {
      await prisma.website.create({
        data: {
          name: website.name,
          description: website.description || '',
          url: website.url,
          iconUrl: website.iconUrl || null,
          categoryId: targetCategoryId,
          isNew: website.isNew || false,
          isFeatured: website.isFeatured || false,
          isHot: website.isHot || false,
          tags: JSON.stringify(website.tags || []),
          order: 0,
        }
      });
      imported++;
      existingUrls.add(normalizedUrl);
    } catch (e) {
      console.log(`   ❌ 导入失败: ${website.name} - ${e.message}`);
    }
  }
  
  console.log(`   ✅ 新增 ${imported}, 已存在 ${skipped}, 无分类 ${noCategory}`);
  return { imported, skipped };
}

/**
 * 主函数
 */
async function main() {
  console.log('🚀 开始导入缺失的网站数据...\n');
  
  const configs = [
    { slug: 'design', file: 'designToolsDatabase.js' },
    { slug: '3d', file: 'threeDToolsDatabase.js' },
    { slug: 'ecommerce', file: 'ecommerceToolsDatabase.js' },
    { slug: 'interior', file: 'interiorToolsDatabase.js' },
    { slug: 'font', file: 'fontToolsDatabase.js' },
  ];
  
  let totalImported = 0;
  
  for (const config of configs) {
    const result = await importMissingData(config.slug, config.file);
    totalImported += result.imported;
  }
  
  console.log('\n' + '='.repeat(50));
  console.log(`🎉 完成！共导入 ${totalImported} 个网站`);
  
  // 显示最终统计
  console.log('\n📊 最终统计:');
  for (const config of configs) {
    const count = await prisma.website.count({
      where: {
        category: {
          OR: [
            { pageCategories: { some: { page: { slug: config.slug } } } },
            { parent: { pageCategories: { some: { page: { slug: config.slug } } } } }
          ]
        }
      }
    });
    console.log(`   ${config.slug}: ${count} 个网站`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
