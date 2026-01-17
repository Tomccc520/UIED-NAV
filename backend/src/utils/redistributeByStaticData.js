/**
 * @file redistributeByStaticData.js
 * @description 后端API服务
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

/**
 * 根据前端静态数据重新分配网站到子分类
 * 
 * 策略：
 * 1. 动态导入前端静态数据
 * 2. 根据 URL 匹配数据库中的网站
 * 3. 将网站移动到对应的子分类
 * 
 * 使用方法: node src/utils/redistributeByStaticData.js
 */

import { PrismaClient } from '@prisma/client';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

// 标准化 URL 用于匹配
function normalizeUrl(url) {
  if (!url) return '';
  return url.toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/$/, '')
    .split('?')[0]
    .split('#')[0];
}

// 根据子分类 ID 查找子分类名称
function findSubcategoryName(categories, categoryId, subcategoryId) {
  const category = categories.find(c => c.id === categoryId);
  if (!category || !category.subcategories) return null;
  const subcategory = category.subcategories.find(s => s.id === subcategoryId);
  return subcategory ? subcategory.name : null;
}

async function redistributeWebsites() {
  console.log('🔄 开始根据前端静态数据重新分配网站...\n');
  
  const frontendDataDir = path.join(__dirname, '../../../frontend/src/data');
  
  // 定义要处理的数据文件
  const dataFiles = [
    { 
      file: 'designToolsDatabase.js', 
      pageName: '平面导航',
      categoriesVar: 'designCategories',
      toolsVar: 'designTools'
    },
    { 
      file: 'threeDToolsDatabase.js', 
      pageName: '三维导航',
      categoriesVar: 'threeDCategories',
      toolsVar: 'threeDTools'
    },
    { 
      file: 'ecommerceToolsDatabase.js', 
      pageName: '电商导航',
      categoriesVar: 'ecommerceCategories',
      toolsVar: 'ecommerceTools'
    },
    { 
      file: 'interiorToolsDatabase.js', 
      pageName: '室内导航',
      categoriesVar: 'interiorCategories',
      toolsVar: 'interiorTools'
    },
    { 
      file: 'fontToolsDatabase.js', 
      pageName: '字体导航',
      categoriesVar: 'fontCategories',
      toolsVar: 'fontTools'
    },
  ];

  let totalMoved = 0;
  let totalNotFound = 0;

  for (const { file, pageName, categoriesVar, toolsVar } of dataFiles) {
    const filePath = path.join(frontendDataDir, file);
    
    console.log(`\n📄 处理 ${pageName} (${file})...`);
    console.log('─'.repeat(50));

    let categories, tools;
    try {
      const fileUrl = pathToFileURL(filePath).href;
      const module = await import(fileUrl);
      categories = module[categoriesVar] || [];
      tools = module[toolsVar] || [];
    } catch (e) {
      console.log(`  ⚠️ 导入文件失败: ${e.message}`);
      continue;
    }

    console.log(`  解析到 ${categories.length} 个分类, ${tools.length} 个工具`);

    // 统计有子分类的工具
    const toolsWithSubcat = tools.filter(t => t.subcategory);
    console.log(`  有子分类信息的工具: ${toolsWithSubcat.length} 个`);

    let pageMoved = 0;
    let pageNotFound = 0;

    // 构建 URL 到子分类名称的映射
    const urlToSubcategory = new Map();
    for (const tool of tools) {
      if (tool.subcategory) {
        const subcategoryName = findSubcategoryName(categories, tool.category, tool.subcategory);
        if (subcategoryName) {
          const normalizedUrl = normalizeUrl(tool.url);
          urlToSubcategory.set(normalizedUrl, subcategoryName);
        }
      }
    }

    console.log(`  URL映射数量: ${urlToSubcategory.size} 个`);

    // 获取数据库中该页面相关的所有网站
    const page = await prisma.page.findFirst({
      where: { name: pageName },
      include: {
        pageCategories: {
          include: {
            category: {
              include: {
                children: true,
                websites: true
              }
            }
          }
        }
      }
    });

    if (!page) {
      console.log(`  ⚠️ 未找到页面: ${pageName}`);
      continue;
    }

    // 遍历每个主分类
    for (const pc of page.pageCategories) {
      const mainCategory = pc.category;
      
      // 只处理有子分类且主分类下有网站的情况
      if (mainCategory.children.length === 0 || mainCategory.websites.length === 0) {
        continue;
      }

      console.log(`\n  📁 ${mainCategory.name}: ${mainCategory.websites.length} 个网站, ${mainCategory.children.length} 个子分类`);

      // 遍历主分类下的每个网站
      for (const website of mainCategory.websites) {
        const normalizedUrl = normalizeUrl(website.url);
        let subcategoryName = urlToSubcategory.get(normalizedUrl);

        // 如果精确匹配失败，尝试模糊匹配
        if (!subcategoryName) {
          for (const [staticUrl, name] of urlToSubcategory.entries()) {
            // 检查是否包含关系
            if (normalizedUrl.includes(staticUrl) || staticUrl.includes(normalizedUrl)) {
              subcategoryName = name;
              break;
            }
            // 检查域名是否相同
            const dbDomain = normalizedUrl.split('/')[0];
            const staticDomain = staticUrl.split('/')[0];
            if (dbDomain === staticDomain) {
              subcategoryName = name;
              break;
            }
          }
        }

        if (!subcategoryName) {
          pageNotFound++;
          continue;
        }

        // 找到对应的子分类
        const targetSubcategory = mainCategory.children.find(
          c => c.name === subcategoryName
        );

        if (!targetSubcategory) {
          pageNotFound++;
          continue;
        }

        // 移动网站到子分类
        await prisma.website.update({
          where: { id: website.id },
          data: { categoryId: targetSubcategory.id }
        });
        pageMoved++;
      }
    }

    console.log(`\n  ✅ ${pageName}: 移动 ${pageMoved} 个, 未匹配 ${pageNotFound} 个`);
    totalMoved += pageMoved;
    totalNotFound += pageNotFound;
  }

  console.log('\n' + '═'.repeat(50));
  console.log('📊 总结:');
  console.log(`  成功移动: ${totalMoved} 个网站`);
  console.log(`  未匹配: ${totalNotFound} 个网站 (将保留在父分类)`);
  console.log('═'.repeat(50));

  await prisma.$disconnect();
}

redistributeWebsites().catch(console.error);
