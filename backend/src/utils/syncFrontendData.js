/**
 * @file syncFrontendData.js
 * @description 后端API服务
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

/**
 * 同步前端静态数据到后端数据库
 * 通过分类名称匹配，将前端的网站数据导入到对应的子分类
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

// 数据文件配置
const dataConfigs = [
  { slug: 'design', file: 'designToolsDatabase.js', prefix: 'design' },
  { slug: '3d', file: 'threeDToolsDatabase.js', prefix: 'threeD' },
  { slug: 'ecommerce', file: 'ecommerceToolsDatabase.js', prefix: 'ecommerce' },
  { slug: 'interior', file: 'interiorToolsDatabase.js', prefix: 'interior' },
  { slug: 'font', file: 'fontToolsDatabase.js', prefix: 'font' },
  { slug: 'uiux', file: 'uiuxToolsDatabase.js', prefix: 'uiux' },
  { slug: 'ai', file: 'aiToolsDatabase.js', prefix: 'ai' },
];

/**
 * 动态导入前端数据模块
 */
async function loadFrontendData(fileName) {
  const filePath = path.resolve(__dirname, '../../../frontend/src/data', fileName);
  
  // 读取文件内容
  let content = fs.readFileSync(filePath, 'utf-8');
  
  // 移除 export 关键字，转换为可执行的JS
  content = content.replace(/export\s+const/g, 'const');
  content = content.replace(/export\s+function/g, 'function');
  
  // 添加返回语句
  content += `
    module.exports = {
      categories: typeof ${fileName.includes('design') ? 'designCategories' : 
                          fileName.includes('threeD') ? 'threeDCategories' :
                          fileName.includes('ecommerce') ? 'ecommerceCategories' :
                          fileName.includes('interior') ? 'interiorCategories' :
                          fileName.includes('font') ? 'fontCategories' :
                          fileName.includes('uiux') ? 'uiuxCategories' :
                          fileName.includes('ai') ? 'aiCategories' : 'categories'} !== 'undefined' ? 
                          ${fileName.includes('design') ? 'designCategories' : 
                          fileName.includes('threeD') ? 'threeDCategories' :
                          fileName.includes('ecommerce') ? 'ecommerceCategories' :
                          fileName.includes('interior') ? 'interiorCategories' :
                          fileName.includes('font') ? 'fontCategories' :
                          fileName.includes('uiux') ? 'uiuxCategories' :
                          fileName.includes('ai') ? 'aiCategories' : 'categories'} : [],
      tools: typeof ${fileName.includes('design') ? 'allDesignTools' : 
                     fileName.includes('threeD') ? 'allThreeDTools' :
                     fileName.includes('ecommerce') ? 'allEcommerceTools' :
                     fileName.includes('interior') ? 'allInteriorTools' :
                     fileName.includes('font') ? 'allFontTools' :
                     fileName.includes('uiux') ? 'allUIUXTools' :
                     fileName.includes('ai') ? 'allAITools' : 'tools'} !== 'undefined' ?
                     ${fileName.includes('design') ? 'allDesignTools' : 
                     fileName.includes('threeD') ? 'allThreeDTools' :
                     fileName.includes('ecommerce') ? 'allEcommerceTools' :
                     fileName.includes('interior') ? 'allInteriorTools' :
                     fileName.includes('font') ? 'allFontTools' :
                     fileName.includes('uiux') ? 'allUIUXTools' :
                     fileName.includes('ai') ? 'allAITools' : 'tools'} : []
    };
  `;
  
  // 写入临时文件
  const tempFile = path.resolve(__dirname, `temp_${fileName}`);
  fs.writeFileSync(tempFile, content);
  
  try {
    // 使用require加载
    delete require.cache[require.resolve(tempFile)];
    const data = require(tempFile);
    return data;
  } finally {
    // 删除临时文件
    fs.unlinkSync(tempFile);
  }
}

/**
 * 构建子分类名称到ID的映射
 */
async function buildSubCategoryMap(pageSlug) {
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
  
  if (!page) return new Map();
  
  const map = new Map();
  
  for (const pc of page.pageCategories) {
    const mainCat = pc.category;
    // 添加主分类映射
    map.set(mainCat.name.toLowerCase(), mainCat.id);
    
    // 添加子分类映射
    for (const sub of mainCat.children || []) {
      map.set(sub.name.toLowerCase(), sub.id);
    }
  }
  
  return map;
}

/**
 * 同步单个页面的数据
 */
async function syncPageData(config) {
  console.log(`\n📦 同步 ${config.slug} 页面数据...`);
  
  // 加载前端数据
  let frontendData;
  try {
    frontendData = await loadFrontendData(config.file);
  } catch (e) {
    console.log(`   ❌ 加载数据失败: ${e.message}`);
    return { imported: 0, skipped: 0, errors: 0 };
  }
  
  const { categories, tools } = frontendData;
  console.log(`   📊 前端数据: ${categories?.length || 0} 个分类, ${tools?.length || 0} 个工具`);
  
  if (!tools || tools.length === 0) {
    console.log(`   ⚠️ 没有工具数据`);
    return { imported: 0, skipped: 0, errors: 0 };
  }
  
  // 构建分类映射
  const categoryMap = await buildSubCategoryMap(config.slug);
  console.log(`   🔗 数据库分类映射: ${categoryMap.size} 个`);
  
  // 构建前端分类ID到名称的映射
  const frontendCatNameMap = new Map();
  for (const cat of categories || []) {
    frontendCatNameMap.set(cat.id, cat.name);
    for (const sub of cat.subcategories || []) {
      frontendCatNameMap.set(sub.id, sub.name);
    }
  }
  
  // 获取现有网站URL
  const existingWebsites = await prisma.website.findMany({
    select: { url: true }
  });
  const existingUrls = new Set(existingWebsites.map(w => w.url.toLowerCase().replace(/\/$/, '')));
  
  let imported = 0;
  let skipped = 0;
  let errors = 0;
  
  for (const tool of tools) {
    // 标准化URL
    const normalizedUrl = tool.url?.toLowerCase().replace(/\/$/, '');
    if (!normalizedUrl || existingUrls.has(normalizedUrl)) {
      skipped++;
      continue;
    }
    
    // 查找目标分类ID
    let targetCategoryId = null;
    
    // 1. 尝试通过子分类名称匹配
    if (tool.subcategory) {
      const subName = frontendCatNameMap.get(tool.subcategory);
      if (subName) {
        targetCategoryId = categoryMap.get(subName.toLowerCase());
      }
    }
    
    // 2. 尝试通过主分类名称匹配
    if (!targetCategoryId && tool.category) {
      const catName = frontendCatNameMap.get(tool.category);
      if (catName) {
        targetCategoryId = categoryMap.get(catName.toLowerCase());
      }
    }
    
    // 3. 直接用名称匹配
    if (!targetCategoryId) {
      targetCategoryId = categoryMap.get(tool.subcategory?.toLowerCase()) ||
                         categoryMap.get(tool.category?.toLowerCase());
    }
    
    if (!targetCategoryId) {
      // 使用页面的第一个子分类作为默认
      const page = await prisma.page.findUnique({
        where: { slug: config.slug },
        include: {
          pageCategories: {
            include: {
              category: { include: { children: true } }
            },
            orderBy: { order: 'asc' },
            take: 1
          }
        }
      });
      
      if (page?.pageCategories[0]?.category?.children?.[0]) {
        targetCategoryId = page.pageCategories[0].category.children[0].id;
      }
    }
    
    if (!targetCategoryId) {
      errors++;
      continue;
    }
    
    try {
      await prisma.website.create({
        data: {
          name: tool.name || 'Unknown',
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
      errors++;
    }
  }
  
  console.log(`   ✅ 完成: 新增 ${imported}, 跳过 ${skipped}, 错误 ${errors}`);
  return { imported, skipped, errors };
}

/**
 * 主函数
 */
async function main() {
  console.log('🚀 开始同步前端静态数据到数据库...\n');
  
  let totalImported = 0;
  let totalSkipped = 0;
  let totalErrors = 0;
  
  for (const config of dataConfigs) {
    const result = await syncPageData(config);
    totalImported += result.imported;
    totalSkipped += result.skipped;
    totalErrors += result.errors;
  }
  
  console.log('\n' + '='.repeat(50));
  console.log(`🎉 同步完成！`);
  console.log(`   新增: ${totalImported}`);
  console.log(`   跳过: ${totalSkipped}`);
  console.log(`   错误: ${totalErrors}`);
  
  // 显示最终统计
  console.log('\n📊 最终数据统计:');
  for (const config of dataConfigs) {
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
