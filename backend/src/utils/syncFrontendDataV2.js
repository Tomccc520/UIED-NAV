/**
 * @file syncFrontendDataV2.js
 * @description 后端API服务
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

/**
 * 同步前端静态数据到后端数据库 V2
 * 使用正则表达式解析前端JS文件
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

/**
 * 解析前端数据文件中的工具数组
 */
function parseToolsFromFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const tools = [];
  
  // 匹配所有工具对象 { id: '...', name: '...', ... }
  const toolRegex = /\{\s*id:\s*['"]([^'"]+)['"],\s*name:\s*['"]([^'"]+)['"],\s*description:\s*['"]([^'"]*)['"]/g;
  
  let match;
  while ((match = toolRegex.exec(content)) !== null) {
    const startIndex = match.index;
    
    // 找到这个对象的结束位置
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
    
    // 解析各个字段
    const tool = {
      id: match[1],
      name: match[2],
      description: match[3],
    };
    
    // 解析URL
    const urlMatch = objStr.match(/url:\s*['"]([^'"]+)['"]/);
    if (urlMatch) tool.url = urlMatch[1];
    
    // 解析iconUrl
    const iconMatch = objStr.match(/iconUrl:\s*['"]([^'"]+)['"]/);
    if (iconMatch) tool.iconUrl = iconMatch[1];
    
    // 解析category
    const catMatch = objStr.match(/category:\s*['"]([^'"]+)['"]/);
    if (catMatch) tool.category = catMatch[1];
    
    // 解析subcategory
    const subMatch = objStr.match(/subcategory:\s*['"]([^'"]+)['"]/);
    if (subMatch) tool.subcategory = subMatch[1];
    
    // 解析isHot
    tool.isHot = /isHot:\s*true/.test(objStr);
    
    // 解析isFeatured
    tool.isFeatured = /isFeatured:\s*true/.test(objStr);
    
    // 解析isNew
    tool.isNew = /isNew:\s*true/.test(objStr);
    
    // 解析tags
    const tagsMatch = objStr.match(/tags:\s*\[([^\]]*)\]/);
    if (tagsMatch) {
      tool.tags = tagsMatch[1].match(/['"]([^'"]+)['"]/g)?.map(t => t.replace(/['"]/g, '')) || [];
    }
    
    if (tool.url) {
      tools.push(tool);
    }
  }
  
  return tools;
}

/**
 * 解析分类数据
 */
function parseCategoriesFromFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const categories = [];
  
  // 匹配分类定义
  const catRegex = /\{\s*id:\s*['"]([^'"]+)['"],\s*name:\s*['"]([^'"]+)['"]/g;
  
  let match;
  while ((match = catRegex.exec(content)) !== null) {
    const startIndex = match.index;
    
    // 检查是否在 Categories 数组中
    const before = content.substring(Math.max(0, startIndex - 200), startIndex);
    if (!before.includes('Categories')) continue;
    
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
    
    const category = {
      id: match[1],
      name: match[2],
      subcategories: []
    };
    
    // 解析子分类
    const subRegex = /\{\s*id:\s*['"]([^'"]+)['"],\s*name:\s*['"]([^'"]+)['"]\s*\}/g;
    let subMatch;
    while ((subMatch = subRegex.exec(objStr)) !== null) {
      category.subcategories.push({
        id: subMatch[1],
        name: subMatch[2]
      });
    }
    
    categories.push(category);
  }
  
  return categories;
}

/**
 * 同步数据
 */
async function syncData() {
  console.log('🚀 开始同步前端数据...\n');
  
  const dataDir = path.resolve(__dirname, '../../../frontend/src/data');
  const files = [
    'designToolsDatabase.js',
    'threeDToolsDatabase.js',
    'ecommerceToolsDatabase.js',
    'interiorToolsDatabase.js',
    'fontToolsDatabase.js',
    'uiuxToolsDatabase.js',
    'aiToolsDatabase.js',
  ];
  
  // 获取所有现有URL
  const existingWebsites = await prisma.website.findMany({
    select: { url: true }
  });
  const existingUrls = new Set(existingWebsites.map(w => w.url.toLowerCase().replace(/\/$/, '')));
  console.log(`📊 数据库现有 ${existingUrls.size} 个网站\n`);
  
  // 获取所有分类（按名称索引）
  const allCategories = await prisma.category.findMany();
  const categoryByName = new Map();
  for (const cat of allCategories) {
    categoryByName.set(cat.name.toLowerCase(), cat.id);
  }
  console.log(`📊 数据库有 ${allCategories.length} 个分类\n`);
  
  let totalImported = 0;
  let totalSkipped = 0;
  
  for (const file of files) {
    const filePath = path.join(dataDir, file);
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️ 文件不存在: ${file}`);
      continue;
    }
    
    console.log(`📦 处理 ${file}...`);
    
    const categories = parseCategoriesFromFile(filePath);
    const tools = parseToolsFromFile(filePath);
    
    console.log(`   解析到 ${categories.length} 个分类, ${tools.length} 个工具`);
    
    // 构建前端分类ID到名称的映射
    const frontendIdToName = new Map();
    for (const cat of categories) {
      frontendIdToName.set(cat.id, cat.name);
      for (const sub of cat.subcategories) {
        frontendIdToName.set(sub.id, sub.name);
      }
    }
    
    let imported = 0;
    let skipped = 0;
    
    for (const tool of tools) {
      const normalizedUrl = tool.url.toLowerCase().replace(/\/$/, '');
      if (existingUrls.has(normalizedUrl)) {
        skipped++;
        continue;
      }
      
      // 查找目标分类
      let targetCategoryId = null;
      
      // 1. 通过子分类名称查找
      if (tool.subcategory) {
        const subName = frontendIdToName.get(tool.subcategory);
        if (subName) {
          targetCategoryId = categoryByName.get(subName.toLowerCase());
        }
      }
      
      // 2. 通过主分类名称查找
      if (!targetCategoryId && tool.category) {
        const catName = frontendIdToName.get(tool.category);
        if (catName) {
          targetCategoryId = categoryByName.get(catName.toLowerCase());
        }
      }
      
      if (!targetCategoryId) {
        skipped++;
        continue;
      }
      
      try {
        await prisma.website.create({
          data: {
            name: tool.name,
            description: tool.description || '',
            url: tool.url,
            iconUrl: tool.iconUrl || null,
            categoryId: targetCategoryId,
            isNew: tool.isNew || false,
            isFeatured: tool.isFeatured || false,
            isHot: tool.isHot || false,
            tags: JSON.stringify(tool.tags || []),
            order: 0,
          }
        });
        imported++;
        existingUrls.add(normalizedUrl);
      } catch (e) {
        skipped++;
      }
    }
    
    console.log(`   ✅ 新增 ${imported}, 跳过 ${skipped}\n`);
    totalImported += imported;
    totalSkipped += skipped;
  }
  
  console.log('='.repeat(50));
  console.log(`🎉 同步完成！新增 ${totalImported}, 跳过 ${totalSkipped}`);
  
  // 显示最终统计
  console.log('\n📊 最终统计:');
  const total = await prisma.website.count();
  console.log(`   总网站数: ${total}`);
}

syncData()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
