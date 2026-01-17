/**
 * @file importAllPagesDataV2.js
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
 * 从前端数据文件导入所有分类和网站数据 - V2版本
 * 支持不同格式的数据文件
 */

// 页面配置 - 包含各种变量名格式
const pageConfigs = [
  { 
    slug: 'uiux', 
    name: 'UI导航', 
    file: 'uiuxToolsDatabase.js', 
    categoriesVar: 'uiuxCategories', 
    toolsVar: 'uiuxTools',
    allToolsVar: 'allUIUXTools'
  },
  { 
    slug: 'ai', 
    name: 'AI导航', 
    file: 'aiToolsDatabase.js', 
    categoriesVar: 'categories', 
    toolsVar: 'aiTools'
  },
  { 
    slug: 'design', 
    name: '平面导航', 
    file: 'designToolsDatabase.js', 
    categoriesVar: 'designCategories', 
    toolsVar: 'designTools',
    allToolsVar: 'allDesignTools'
  },
  { 
    slug: '3d', 
    name: '三维导航', 
    file: 'threeDToolsDatabase.js', 
    categoriesVar: 'threeDCategories', 
    toolsVar: 'allThreeDTools'
  },
  { 
    slug: 'ecommerce', 
    name: '电商导航', 
    file: 'ecommerceToolsDatabase.js', 
    categoriesVar: 'ecommerceCategories', 
    toolsVar: 'allEcommerceTools'
  },
  { 
    slug: 'interior', 
    name: '室内导航', 
    file: 'interiorToolsDatabase.js', 
    categoriesVar: 'interiorCategories', 
    toolsVar: 'allInteriorTools'
  },
  { 
    slug: 'font', 
    name: '字体导航', 
    file: 'fontToolsDatabase.js', 
    categoriesVar: 'fontCategories', 
    toolsVar: 'fontTools',
    allToolsVar: 'allFontTools'
  },
];

// 解析JS文件中的分类数据 - 支持多种格式
function parseCategories(content, varNames) {
  const names = Array.isArray(varNames) ? varNames : [varNames];
  
  for (const varName of names) {
    // 尝试匹配 export const xxx = [...]
    const patterns = [
      new RegExp(`export\\s+const\\s+${varName}\\s*=\\s*\\[([\\s\\S]*?)\\];`, 'm'),
      new RegExp(`const\\s+${varName}\\s*=\\s*\\[([\\s\\S]*?)\\];`, 'm'),
    ];
    
    for (const regex of patterns) {
      const match = content.match(regex);
      if (match) {
        try {
          return parseCategoriesArray(match[1]);
        } catch (e) {
          continue;
        }
      }
    }
  }
  
  return [];
}

function parseCategoriesArray(arrayContent) {
  const categories = [];
  
  // 更灵活的正则 - 匹配整个分类对象块
  const categoryBlockRegex = /\{\s*id:\s*['"]([^'"]+)['"][\s\S]*?(?:subCategories|subcategories):\s*\[([\s\S]*?)\]\s*\}/g;
  
  let categoryMatch;
  while ((categoryMatch = categoryBlockRegex.exec(arrayContent)) !== null) {
    const fullBlock = categoryMatch[0];
    const id = categoryMatch[1];
    const subCategoriesStr = categoryMatch[2];
    
    // 从块中提取各个字段
    const nameMatch = fullBlock.match(/name:\s*['"]([^'"]+)['"]/);
    const iconMatch = fullBlock.match(/(?:icon|iconUrl):\s*['"]([^'"]+)['"]/);
    const colorMatch = fullBlock.match(/color:\s*['"]([^'"]+)['"]/);
    const descMatch = fullBlock.match(/description:\s*['"]([^'"]*)['"]/);
    
    const name = nameMatch ? nameMatch[1] : '';
    const icon = iconMatch ? iconMatch[1] : 'default';
    const color = colorMatch ? colorMatch[1] : '#1890ff';
    const description = descMatch ? descMatch[1] : '';
    
    // 解析子分类
    const subcategories = [];
    const subRegex = /\{\s*id:\s*['"]([^'"]+)['"][^}]*?name:\s*['"]([^'"]+)['"]/g;
    let subMatch;
    while ((subMatch = subRegex.exec(subCategoriesStr)) !== null) {
      subcategories.push({
        id: subMatch[1],
        name: subMatch[2]
      });
    }
    
    if (name) {
      categories.push({
        id,
        name,
        icon,
        color,
        description,
        subcategories
      });
    }
  }
  
  return categories;
}

// 解析JS文件中的工具/网站数据
function parseTools(content, varNames) {
  const names = Array.isArray(varNames) ? varNames : [varNames];
  
  for (const varName of names) {
    const patterns = [
      new RegExp(`export\\s+const\\s+${varName}\\s*=\\s*\\[`, 'm'),
      new RegExp(`const\\s+${varName}\\s*=\\s*\\[`, 'm'),
    ];
    
    for (const regex of patterns) {
      const match = content.match(regex);
      if (match) {
        // 找到数组开始位置
        const startIndex = match.index + match[0].length - 1;
        const arrayContent = extractArrayContent(content, startIndex);
        if (arrayContent) {
          const tools = parseToolsArray(arrayContent);
          if (tools.length > 0) {
            return tools;
          }
        }
      }
    }
  }
  
  return [];
}

function extractArrayContent(content, startIndex) {
  let depth = 0;
  let start = startIndex;
  let end = startIndex;
  
  for (let i = startIndex; i < content.length; i++) {
    if (content[i] === '[') {
      if (depth === 0) start = i;
      depth++;
    }
    if (content[i] === ']') {
      depth--;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }
  
  return content.substring(start + 1, end);
}

function parseToolsArray(arrayContent) {
  const tools = [];
  
  // 使用更灵活的方式 - 匹配整个工具对象块
  const toolBlockRegex = /\{\s*id:\s*['"]([^'"]+)['"][\s\S]*?\n\s*\}/g;
  
  let blockMatch;
  while ((blockMatch = toolBlockRegex.exec(arrayContent)) !== null) {
    const fullBlock = blockMatch[0];
    const id = blockMatch[1];
    
    // 从块中提取各个字段
    const nameMatch = fullBlock.match(/name:\s*['"]([^'"]+)['"]/);
    const descMatch = fullBlock.match(/description:\s*['"]([^'"]*)['"]/);
    const urlMatch = fullBlock.match(/url:\s*['"]([^'"]+)['"]/);
    const categoryMatch = fullBlock.match(/category:\s*['"]([^'"]+)['"]/);
    const subCategoryMatch = fullBlock.match(/subCategory:\s*['"]([^'"]+)['"]/);
    const isHotMatch = fullBlock.match(/isHot:\s*(true|false)/);
    const isFeaturedMatch = fullBlock.match(/isFeatured:\s*(true|false)/);
    const isNewMatch = fullBlock.match(/isNew:\s*(true|false)/);
    
    const name = nameMatch ? nameMatch[1] : '';
    const url = urlMatch ? urlMatch[1] : '';
    
    if (name && url) {
      tools.push({
        id,
        name,
        description: descMatch ? descMatch[1] : '',
        url,
        category: categoryMatch ? categoryMatch[1] : '',
        subCategory: subCategoryMatch ? subCategoryMatch[1] : '',
        isHot: isHotMatch ? isHotMatch[1] === 'true' : false,
        isFeatured: isFeaturedMatch ? isFeaturedMatch[1] === 'true' : false,
        isNew: isNewMatch ? isNewMatch[1] === 'true' : false
      });
    }
  }
  
  return tools;
}

async function importPageData(pageConfig) {
  const { slug, name, file, categoriesVar, toolsVar, allToolsVar } = pageConfig;
  console.log(`\n📂 处理页面: ${name} (${slug})`);
  
  const filePath = path.join(__dirname, '../../../frontend/src/data', file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`  ⚠️ 文件不存在: ${file}`);
    return { categories: 0, websites: 0 };
  }
  
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // 解析分类 - 尝试多个变量名
  const categoryVarNames = [categoriesVar, 'categories', `${slug}Categories`];
  const categories = parseCategories(content, categoryVarNames);
  console.log(`  找到 ${categories.length} 个主分类`);
  
  // 解析工具 - 尝试多个变量名
  const toolVarNames = [toolsVar, allToolsVar, 'tools', `${slug}Tools`, `all${slug.charAt(0).toUpperCase() + slug.slice(1)}Tools`].filter(Boolean);
  const tools = parseTools(content, toolVarNames);
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
  const categoryIdMap = new Map();
  
  // 导入分类
  for (let i = 0; i < categories.length; i++) {
    const cat = categories[i];
    const categorySlug = cat.id.startsWith(slug) ? cat.id : `${slug}-${cat.id}`;
    
    try {
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
        where: { pageId_categoryId: { pageId: page.id, categoryId: dbCategory.id } }
      });
      
      if (!existingRelation) {
        await prisma.pageCategory.create({
          data: { pageId: page.id, categoryId: dbCategory.id, order: i, visible: true }
        });
      }
      
      // 导入子分类
      if (cat.subcategories && cat.subcategories.length > 0) {
        for (let j = 0; j < cat.subcategories.length; j++) {
          const subCat = cat.subcategories[j];
          const subCategorySlug = subCat.id.startsWith(slug) ? subCat.id : `${slug}-${subCat.id}`;
          
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
      let categoryId = null;
      
      // 优先使用子分类
      if (tool.subCategory && categoryIdMap.has(tool.subCategory)) {
        categoryId = categoryIdMap.get(tool.subCategory);
      } else if (tool.category && categoryIdMap.has(tool.category)) {
        categoryId = categoryIdMap.get(tool.category);
      }
      
      // 尝试通过slug查找
      if (!categoryId && tool.subCategory) {
        const subCatSlug = tool.subCategory.startsWith(slug) ? tool.subCategory : `${slug}-${tool.subCategory}`;
        const subCat = await prisma.category.findUnique({ where: { slug: subCatSlug } });
        if (subCat) categoryId = subCat.id;
      }
      
      if (!categoryId && tool.category) {
        const catSlug = tool.category.startsWith(slug) ? tool.category : `${slug}-${tool.category}`;
        const cat = await prisma.category.findUnique({ where: { slug: catSlug } });
        if (cat) categoryId = cat.id;
      }
      
      if (!categoryId) {
        // 使用第一个分类作为默认
        if (categories.length > 0) {
          const firstCatSlug = categories[0].id.startsWith(slug) ? categories[0].id : `${slug}-${categories[0].id}`;
          const firstCat = await prisma.category.findUnique({ where: { slug: firstCatSlug } });
          if (firstCat) categoryId = firstCat.id;
        }
      }
      
      if (!categoryId) continue;
      
      // 检查是否已存在
      const existing = await prisma.website.findFirst({ where: { url: tool.url } });
      if (existing) continue;
      
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
      if (!error.message.includes('Unique constraint')) {
        // console.error(`  ❌ 导入网站失败: ${tool.name}`, error.message);
      }
    }
  }
  
  console.log(`  📊 导入完成: ${importedCategories} 个分类, ${importedWebsites} 个网站`);
  
  return { categories: importedCategories, websites: importedWebsites };
}

async function main() {
  console.log('🚀 开始导入所有数据 (V2)...\n');
  
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
