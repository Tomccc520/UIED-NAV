/**
 * @file importAllData.js
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
 * 从前端数据文件导入所有分类和网站数据
 */

// 页面配置
const pageConfigs = [
  { slug: 'uiux', name: 'UI导航', file: 'uiuxToolsDatabase.js', categoriesVar: 'uiuxCategories', toolsVar: 'uiuxTools' },
  { slug: 'ai', name: 'AI导航', file: 'aiToolsDatabase.js', categoriesVar: 'categories', toolsVar: 'tools' },
  { slug: 'design', name: '平面导航', file: 'designToolsDatabase.js', categoriesVar: 'categories', toolsVar: 'tools' },
  { slug: '3d', name: '三维导航', file: 'threeDToolsDatabase.js', categoriesVar: 'categories', toolsVar: 'tools' },
  { slug: 'ecommerce', name: '电商导航', file: 'ecommerceToolsDatabase.js', categoriesVar: 'categories', toolsVar: 'tools' },
  { slug: 'interior', name: '室内导航', file: 'interiorToolsDatabase.js', categoriesVar: 'categories', toolsVar: 'tools' },
  { slug: 'font', name: '字体导航', file: 'fontToolsDatabase.js', categoriesVar: 'categories', toolsVar: 'tools' },
];

// 解析JS文件中的分类数据
function parseCategories(content, varName) {
  // 尝试匹配 export const xxx = [...]
  const regex = new RegExp(`export\\s+const\\s+${varName}\\s*=\\s*\\[([\\s\\S]*?)\\];`, 'm');
  const match = content.match(regex);
  
  if (!match) {
    console.log(`  未找到变量: ${varName}`);
    return [];
  }

  try {
    // 简单解析：提取分类对象
    const arrayContent = match[1];
    const categories = [];
    
    // 匹配每个分类对象
    const categoryRegex = /\{\s*id:\s*['"]([^'"]+)['"],\s*name:\s*['"]([^'"]+)['"][^}]*?(?:icon:\s*['"]([^'"]+)['"])?[^}]*?(?:color:\s*['"]([^'"]+)['"])?[^}]*?(?:description:\s*['"]([^'"]+)['"])?[^}]*?(?:subCategories|subcategories):\s*\[([\s\S]*?)\]/g;
    
    let categoryMatch;
    while ((categoryMatch = categoryRegex.exec(arrayContent)) !== null) {
      const [, id, name, icon, color, description, subCategoriesStr] = categoryMatch;
      
      // 解析子分类
      const subcategories = [];
      const subRegex = /\{\s*id:\s*['"]([^'"]+)['"],\s*name:\s*['"]([^'"]+)['"]/g;
      let subMatch;
      while ((subMatch = subRegex.exec(subCategoriesStr)) !== null) {
        subcategories.push({
          id: subMatch[1],
          name: subMatch[2]
        });
      }
      
      categories.push({
        id,
        name,
        icon: icon || 'default',
        color: color || '#1890ff',
        description: description || '',
        subcategories
      });
    }
    
    return categories;
  } catch (error) {
    console.error(`  解析分类失败:`, error.message);
    return [];
  }
}

// 解析JS文件中的工具/网站数据
function parseTools(content, varName) {
  // 尝试匹配 export const xxx = [...]
  const regex = new RegExp(`export\\s+const\\s+${varName}\\s*=\\s*\\[([\\s\\S]*?)\\];\\s*(?:export|$|/\\*)`, 'm');
  const match = content.match(regex);
  
  if (!match) {
    // 尝试另一种格式
    const regex2 = new RegExp(`export\\s+const\\s+${varName}\\s*=\\s*\\[([\\s\\S]+)`, 'm');
    const match2 = content.match(regex2);
    if (!match2) {
      console.log(`  未找到工具变量: ${varName}`);
      return [];
    }
    // 找到数组结束位置
    let depth = 1;
    let endIndex = 0;
    const str = match2[1];
    for (let i = 0; i < str.length && depth > 0; i++) {
      if (str[i] === '[') depth++;
      if (str[i] === ']') depth--;
      endIndex = i;
    }
    return parseToolsArray(str.substring(0, endIndex));
  }

  return parseToolsArray(match[1]);
}

function parseToolsArray(arrayContent) {
  const tools = [];
  
  // 匹配每个工具对象
  const toolRegex = /\{\s*id:\s*['"]([^'"]+)['"],\s*name:\s*['"]([^'"]+)['"],\s*description:\s*['"]([^'"]+)['"],\s*url:\s*['"]([^'"]+)['"][^}]*?(?:category:\s*['"]([^'"]+)['"])?[^}]*?(?:subCategory:\s*['"]([^'"]+)['"])?[^}]*?(?:isHot:\s*(true|false))?[^}]*?(?:isFeatured:\s*(true|false))?[^}]*?(?:isNew:\s*(true|false))?[^}]*?\}/g;
  
  let toolMatch;
  while ((toolMatch = toolRegex.exec(arrayContent)) !== null) {
    const [, id, name, description, url, category, subCategory, isHot, isFeatured, isNew] = toolMatch;
    
    tools.push({
      id,
      name,
      description,
      url,
      category: category || '',
      subCategory: subCategory || '',
      isHot: isHot === 'true',
      isFeatured: isFeatured === 'true',
      isNew: isNew === 'true'
    });
  }
  
  return tools;
}

async function importPageData(pageConfig) {
  const { slug, name, file, categoriesVar, toolsVar } = pageConfig;
  console.log(`\n📂 处理页面: ${name} (${slug})`);
  
  const filePath = path.join(__dirname, '../../../frontend/src/data', file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`  ⚠️ 文件不存在: ${file}`);
    return { categories: 0, websites: 0 };
  }
  
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // 解析分类
  const categories = parseCategories(content, categoriesVar);
  console.log(`  找到 ${categories.length} 个主分类`);
  
  // 解析工具
  const tools = parseTools(content, toolsVar);
  console.log(`  找到 ${tools.length} 个工具/网站`);
  
  // 获取或创建页面
  let page = await prisma.page.findUnique({ where: { slug } });
  if (!page) {
    page = await prisma.page.create({
      data: {
        name,
        slug,
        type: slug,
        order: 0,
        visible: true,
        searchEnabled: true,
        showHotRecommendations: true,
        showCategories: true,
      }
    });
    console.log(`  ✅ 创建页面: ${name}`);
  }
  
  let importedCategories = 0;
  let importedWebsites = 0;
  const categoryIdMap = new Map(); // 用于映射旧ID到新ID
  
  // 导入分类
  for (let i = 0; i < categories.length; i++) {
    const cat = categories[i];
    const categorySlug = `${slug}-${cat.id}`;
    
    try {
      // 检查是否已存在
      let dbCategory = await prisma.category.findUnique({ where: { slug: categorySlug } });
      
      if (!dbCategory) {
        dbCategory = await prisma.category.create({
          data: {
            name: cat.name,
            slug: categorySlug,
            icon: cat.icon,
            color: cat.color,
            description: cat.description,
            order: i,
            visible: true,
          }
        });
        importedCategories++;
        console.log(`  ✅ 创建主分类: ${cat.name}`);
      }
      
      categoryIdMap.set(cat.id, dbCategory.id);
      
      // 关联到页面
      const existingRelation = await prisma.pageCategory.findUnique({
        where: {
          pageId_categoryId: {
            pageId: page.id,
            categoryId: dbCategory.id
          }
        }
      });
      
      if (!existingRelation) {
        await prisma.pageCategory.create({
          data: {
            pageId: page.id,
            categoryId: dbCategory.id,
            order: i,
            visible: true,
          }
        });
      }
      
      // 导入子分类
      if (cat.subcategories && cat.subcategories.length > 0) {
        for (let j = 0; j < cat.subcategories.length; j++) {
          const subCat = cat.subcategories[j];
          const subCategorySlug = `${slug}-${subCat.id}`;
          
          let dbSubCategory = await prisma.category.findUnique({ where: { slug: subCategorySlug } });
          
          if (!dbSubCategory) {
            dbSubCategory = await prisma.category.create({
              data: {
                name: subCat.name,
                slug: subCategorySlug,
                icon: cat.icon,
                color: cat.color,
                description: `${cat.name} - ${subCat.name}`,
                parentId: dbCategory.id,
                order: j,
                visible: true,
              }
            });
            importedCategories++;
          }
          
          categoryIdMap.set(subCat.id, dbSubCategory.id);
        }
      }
    } catch (error) {
      console.error(`  ❌ 导入分类失败: ${cat.name}`, error.message);
    }
  }
  
  // 导入网站
  for (const tool of tools) {
    try {
      // 确定分类ID
      let categoryId = null;
      
      // 优先使用子分类
      if (tool.subCategory && categoryIdMap.has(tool.subCategory)) {
        categoryId = categoryIdMap.get(tool.subCategory);
      } else if (tool.category && categoryIdMap.has(tool.category)) {
        categoryId = categoryIdMap.get(tool.category);
      }
      
      if (!categoryId) {
        // 使用第一个分类作为默认
        if (categories.length > 0) {
          const firstCatSlug = `${slug}-${categories[0].id}`;
          const firstCat = await prisma.category.findUnique({ where: { slug: firstCatSlug } });
          if (firstCat) categoryId = firstCat.id;
        }
      }
      
      if (!categoryId) {
        console.log(`  ⚠️ 跳过网站(无分类): ${tool.name}`);
        continue;
      }
      
      // 检查是否已存在（按URL判断）
      const existing = await prisma.website.findFirst({
        where: { url: tool.url }
      });
      
      if (existing) {
        continue; // 跳过已存在的
      }
      
      await prisma.website.create({
        data: {
          name: tool.name,
          description: tool.description,
          url: tool.url,
          categoryId,
          isNew: tool.isNew || false,
          isFeatured: tool.isFeatured || false,
          isHot: tool.isHot || false,
          tags: JSON.stringify([]),
          order: 0,
        }
      });
      importedWebsites++;
    } catch (error) {
      // 忽略重复错误
      if (!error.message.includes('Unique constraint')) {
        console.error(`  ❌ 导入网站失败: ${tool.name}`, error.message);
      }
    }
  }
  
  console.log(`  📊 导入完成: ${importedCategories} 个分类, ${importedWebsites} 个网站`);
  
  return { categories: importedCategories, websites: importedWebsites };
}

async function main() {
  console.log('🚀 开始导入所有数据...\n');
  
  let totalCategories = 0;
  let totalWebsites = 0;
  
  for (const config of pageConfigs) {
    const result = await importPageData(config);
    totalCategories += result.categories;
    totalWebsites += result.websites;
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('🎉 导入完成！');
  console.log(`📊 总计导入: ${totalCategories} 个分类, ${totalWebsites} 个网站`);
  
  // 显示统计
  const categoryCount = await prisma.category.count();
  const websiteCount = await prisma.website.count();
  const pageCount = await prisma.page.count();
  
  console.log(`\n📈 数据库统计:`);
  console.log(`   - 页面: ${pageCount} 个`);
  console.log(`   - 分类: ${categoryCount} 个`);
  console.log(`   - 网站: ${websiteCount} 个`);
}

main()
  .catch((error) => {
    console.error('💥 导入失败:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
