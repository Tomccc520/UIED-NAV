/**
 * @file importAllStaticData.js
 * @description 后端API服务
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

/**
 * 完整数据导入脚本
 * 从前端静态数据导入所有网站数据到后端数据库
 * 保持与前端数据结构一致（网站存储在子分类下）
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

// 前端数据文件映射
const dataFiles = {
  uiux: '../../frontend/src/data/uiuxToolsDatabase.js',
  ai: '../../frontend/src/data/aiToolsDatabase.js',
  design: '../../frontend/src/data/designToolsDatabase.js',
  '3d': '../../frontend/src/data/threeDToolsDatabase.js',
  ecommerce: '../../frontend/src/data/ecommerceToolsDatabase.js',
  interior: '../../frontend/src/data/interiorToolsDatabase.js',
  font: '../../frontend/src/data/fontToolsDatabase.js',
};

/**
 * 解析前端JS数据文件
 */
function parseJsDataFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // 提取分类数据
  const categoriesMatch = content.match(/export\s+const\s+\w+Categories\s*=\s*(\[[\s\S]*?\]);/);
  const toolsMatch = content.match(/export\s+const\s+all\w+Tools\s*=\s*(\[[\s\S]*?\]);/);
  
  let categories = [];
  let tools = [];
  
  if (categoriesMatch) {
    try {
      // 使用eval解析（注意：仅用于可信数据）
      categories = eval(categoriesMatch[1]);
    } catch (e) {
      console.error('解析分类数据失败:', e.message);
    }
  }
  
  if (toolsMatch) {
    try {
      tools = eval(toolsMatch[1]);
    } catch (e) {
      console.error('解析工具数据失败:', e.message);
    }
  }
  
  return { categories, tools };
}

/**
 * 导入单个页面的数据
 */
async function importPageData(pageSlug, dataFilePath) {
  console.log(`\n📦 开始导入 ${pageSlug} 页面数据...`);
  
  const fullPath = path.resolve(__dirname, dataFilePath);
  if (!fs.existsSync(fullPath)) {
    console.log(`   ⚠️ 数据文件不存在: ${fullPath}`);
    return { imported: 0, skipped: 0 };
  }
  
  const { categories, tools } = parseJsDataFile(fullPath);
  console.log(`   📊 解析到 ${categories.length} 个分类, ${tools.length} 个工具`);
  
  // 获取页面信息
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
  
  // 构建分类映射（前端ID -> 数据库ID）
  const categoryMap = new Map();
  const subCategoryMap = new Map();
  
  for (const pc of page.pageCategories) {
    const dbCat = pc.category;
    // 尝试通过slug或name匹配
    const frontendCat = categories.find(c => 
      c.slug === dbCat.slug || 
      c.name === dbCat.name ||
      c.id === dbCat.slug
    );
    
    if (frontendCat) {
      categoryMap.set(frontendCat.id, dbCat.id);
      
      // 映射子分类
      if (frontendCat.subcategories && dbCat.children) {
        for (const frontendSub of frontendCat.subcategories) {
          const dbSub = dbCat.children.find(s => 
            s.slug === frontendSub.slug ||
            s.name === frontendSub.name ||
            s.slug.includes(frontendSub.id)
          );
          if (dbSub) {
            subCategoryMap.set(frontendSub.id, dbSub.id);
          }
        }
      }
    }
  }
  
  console.log(`   🔗 映射到 ${categoryMap.size} 个主分类, ${subCategoryMap.size} 个子分类`);
  
  // 获取现有网站URL列表（用于去重）
  const existingWebsites = await prisma.website.findMany({
    select: { url: true }
  });
  const existingUrls = new Set(existingWebsites.map(w => w.url.toLowerCase()));
  
  let imported = 0;
  let skipped = 0;
  
  // 导入工具数据
  for (const tool of tools) {
    // 检查URL是否已存在
    if (existingUrls.has(tool.url?.toLowerCase())) {
      skipped++;
      continue;
    }
    
    // 确定目标分类ID（优先使用子分类）
    let targetCategoryId = null;
    
    if (tool.subcategory && subCategoryMap.has(tool.subcategory)) {
      targetCategoryId = subCategoryMap.get(tool.subcategory);
    } else if (tool.category && categoryMap.has(tool.category)) {
      // 如果没有子分类，使用主分类的第一个子分类
      const mainCatId = categoryMap.get(tool.category);
      const mainCat = page.pageCategories.find(pc => pc.category.id === mainCatId)?.category;
      if (mainCat?.children?.length > 0) {
        targetCategoryId = mainCat.children[0].id;
      } else {
        targetCategoryId = mainCatId;
      }
    }
    
    if (!targetCategoryId) {
      // 尝试通过分类名称查找
      const catByName = await prisma.category.findFirst({
        where: {
          OR: [
            { name: tool.category },
            { slug: { contains: tool.category } }
          ]
        }
      });
      if (catByName) {
        targetCategoryId = catByName.id;
      }
    }
    
    if (!targetCategoryId) {
      console.log(`   ⚠️ 无法找到分类: ${tool.category}/${tool.subcategory} for ${tool.name}`);
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
          order: tool.order || 0,
        }
      });
      imported++;
      existingUrls.add(tool.url.toLowerCase());
    } catch (e) {
      console.log(`   ❌ 导入失败: ${tool.name} - ${e.message}`);
      skipped++;
    }
  }
  
  console.log(`   ✅ 导入完成: 新增 ${imported}, 跳过 ${skipped}`);
  return { imported, skipped };
}

/**
 * 主函数
 */
async function main() {
  console.log('🚀 开始完整数据导入...\n');
  
  let totalImported = 0;
  let totalSkipped = 0;
  
  for (const [pageSlug, dataFile] of Object.entries(dataFiles)) {
    const result = await importPageData(pageSlug, dataFile);
    totalImported += result.imported;
    totalSkipped += result.skipped;
  }
  
  console.log('\n' + '='.repeat(50));
  console.log(`🎉 导入完成！总计: 新增 ${totalImported}, 跳过 ${totalSkipped}`);
  
  // 验证结果
  console.log('\n📊 验证结果:');
  for (const pageSlug of Object.keys(dataFiles)) {
    const count = await prisma.website.count({
      where: {
        category: {
          OR: [
            { pageCategories: { some: { page: { slug: pageSlug } } } },
            { parent: { pageCategories: { some: { page: { slug: pageSlug } } } } }
          ]
        }
      }
    });
    console.log(`   ${pageSlug}: ${count} 个网站`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
