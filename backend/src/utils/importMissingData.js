/**
 * @file importMissingData.js
 * @description 导入缺失的网站数据
 * 
 * 使用方法: node src/utils/importMissingData.js
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

/**
 * 从JS文件中提取工具数据
 */
function extractToolsFromFile(filePath, toolsVarName) {
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // 找到工具数组的开始位置
  const exportPattern = new RegExp(`export\\s+const\\s+${toolsVarName}\\s*=\\s*\\[`);
  const match = content.match(exportPattern);
  
  if (!match) {
    console.log(`未找到 ${toolsVarName} 变量`);
    return [];
  }
  
  const startIndex = match.index + match[0].length - 1;
  
  // 找到匹配的结束括号
  let depth = 0;
  let endIndex = startIndex;
  for (let i = startIndex; i < content.length; i++) {
    if (content[i] === '[') depth++;
    if (content[i] === ']') depth--;
    if (depth === 0) {
      endIndex = i + 1;
      break;
    }
  }
  
  const arrayStr = content.substring(startIndex, endIndex);
  
  // 使用正则提取每个工具对象
  const tools = [];
  const toolPattern = /{\s*id:\s*['"]([^'"]+)['"],\s*name:\s*['"]([^'"]+)['"],\s*description:\s*['"]([^'"]*)['"]/g;
  
  let toolMatch;
  while ((toolMatch = toolPattern.exec(arrayStr)) !== null) {
    // 提取完整的工具对象
    const toolStart = toolMatch.index;
    let toolEnd = toolStart;
    let braceDepth = 0;
    
    for (let i = toolStart; i < arrayStr.length; i++) {
      if (arrayStr[i] === '{') braceDepth++;
      if (arrayStr[i] === '}') braceDepth--;
      if (braceDepth === 0) {
        toolEnd = i + 1;
        break;
      }
    }
    
    const toolStr = arrayStr.substring(toolStart, toolEnd);
    
    // 提取各字段
    const tool = {
      id: toolMatch[1],
      name: toolMatch[2],
      description: toolMatch[3],
    };
    
    // 提取URL
    const urlMatch = toolStr.match(/url:\s*['"]([^'"]+)['"]/);
    if (urlMatch) tool.url = urlMatch[1];
    
    // 提取category
    const catMatch = toolStr.match(/category:\s*['"]([^'"]+)['"]/);
    if (catMatch) tool.category = catMatch[1];
    
    // 提取subCategory
    const subCatMatch = toolStr.match(/subCategory:\s*['"]([^'"]+)['"]/);
    if (subCatMatch) tool.subCategory = subCatMatch[1];
    
    // 提取subcategory (小写版本)
    const subCatMatch2 = toolStr.match(/subcategory:\s*['"]([^'"]+)['"]/);
    if (subCatMatch2) tool.subCategory = subCatMatch2[1];
    
    // 提取标志
    tool.isHot = /isHot:\s*true/.test(toolStr);
    tool.isFeatured = /isFeatured:\s*true/.test(toolStr);
    tool.isNew = /isNew:\s*true/.test(toolStr);
    
    // 提取tags
    const tagsMatch = toolStr.match(/tags:\s*\[([^\]]*)\]/);
    if (tagsMatch) {
      tool.tags = tagsMatch[1].match(/['"]([^'"]+)['"]/g)?.map(t => t.replace(/['"]/g, '')) || [];
    }
    
    // 提取iconUrl
    const iconMatch = toolStr.match(/iconUrl:\s*['"]([^'"]+)['"]/);
    if (iconMatch) tool.iconUrl = iconMatch[1];
    
    if (tool.url) {
      tools.push(tool);
    }
  }
  
  return tools;
}

/**
 * 导入单个页面的缺失数据
 */
async function importMissingForPage(pageSlug, dataFilePath, toolsVarName) {
  console.log(`\n=== 处理 ${pageSlug} 页面 ===`);
  
  const fullPath = path.resolve(__dirname, dataFilePath);
  if (!fs.existsSync(fullPath)) {
    console.log(`文件不存在: ${fullPath}`);
    return { imported: 0, skipped: 0 };
  }
  
  // 提取静态数据中的工具
  const staticTools = extractToolsFromFile(fullPath, toolsVarName);
  console.log(`静态数据中有 ${staticTools.length} 个工具`);
  
  // 获取数据库中已有的URL
  const existingWebsites = await prisma.website.findMany({
    select: { url: true }
  });
  const existingUrls = new Set(existingWebsites.map(w => w.url.toLowerCase().replace(/\/$/, '')));
  
  // 获取数据库中的分类映射
  const allCategories = await prisma.category.findMany({
    include: { parent: true }
  });
  
  // 构建slug到ID的映射
  const categoryBySlug = new Map();
  const categoryByName = new Map();
  for (const cat of allCategories) {
    categoryBySlug.set(cat.slug, cat.id);
    categoryByName.set(cat.name, cat.id);
  }
  
  let imported = 0;
  let skipped = 0;
  let notFound = 0;
  
  for (const tool of staticTools) {
    // 规范化URL进行比较
    const normalizedUrl = tool.url.toLowerCase().replace(/\/$/, '');
    
    if (existingUrls.has(normalizedUrl)) {
      skipped++;
      continue;
    }
    
    // 查找目标分类
    let targetCategoryId = null;
    
    // 优先使用subCategory
    if (tool.subCategory) {
      targetCategoryId = categoryBySlug.get(tool.subCategory);
    }
    
    // 如果没找到，尝试用category
    if (!targetCategoryId && tool.category) {
      // 先找主分类
      const mainCatId = categoryBySlug.get(tool.category);
      if (mainCatId) {
        // 找该主分类的第一个子分类
        const subCat = allCategories.find(c => c.parentId === mainCatId);
        targetCategoryId = subCat?.id || mainCatId;
      }
    }
    
    if (!targetCategoryId) {
      // 尝试模糊匹配
      for (const [slug, id] of categoryBySlug) {
        if (slug.includes(tool.category) || slug.includes(tool.subCategory)) {
          targetCategoryId = id;
          break;
        }
      }
    }
    
    if (!targetCategoryId) {
      notFound++;
      if (notFound <= 10) {
        console.log(`  未找到分类: ${tool.category}/${tool.subCategory} - ${tool.name}`);
      }
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
      console.log(`  导入失败: ${tool.name} - ${e.message}`);
      skipped++;
    }
  }
  
  console.log(`导入: ${imported}, 跳过(已存在): ${skipped}, 未找到分类: ${notFound}`);
  return { imported, skipped, notFound };
}

async function main() {
  console.log('开始导入缺失的网站数据...\n');
  
  const pages = [
    { slug: 'ai', file: '../../../frontend/src/data/aiToolsDatabase.js', varName: 'aiTools' },
    { slug: 'uiux', file: '../../../frontend/src/data/uiuxToolsDatabase.js', varName: 'uiuxTools' },
    { slug: 'design', file: '../../../frontend/src/data/designToolsDatabase.js', varName: 'designTools' },
    { slug: '3d', file: '../../../frontend/src/data/threeDToolsDatabase.js', varName: 'allThreeDTools' },
    { slug: 'font', file: '../../../frontend/src/data/fontToolsDatabase.js', varName: 'fontTools' },
    { slug: 'ecommerce', file: '../../../frontend/src/data/ecommerceToolsDatabase.js', varName: 'ecommerceTools' },
    { slug: 'interior', file: '../../../frontend/src/data/interiorToolsDatabase.js', varName: 'allInteriorTools' },
  ];
  
  let totalImported = 0;
  let totalSkipped = 0;
  let totalNotFound = 0;
  
  for (const page of pages) {
    const result = await importMissingForPage(page.slug, page.file, page.varName);
    totalImported += result.imported;
    totalSkipped += result.skipped;
    totalNotFound += result.notFound || 0;
  }
  
  console.log('\n' + '='.repeat(50));
  console.log(`总计: 导入 ${totalImported}, 跳过 ${totalSkipped}, 未找到分类 ${totalNotFound}`);
  
  // 最终统计
  const finalCount = await prisma.website.count();
  console.log(`\n数据库网站总数: ${finalCount}`);
  
  await prisma.$disconnect();
}

main().catch(console.error);
