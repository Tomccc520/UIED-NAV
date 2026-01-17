/**
 * @file redistributeAllPages.js
 * @description 后端API服务
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

/**
 * 综合网站分配脚本
 * 
 * 策略：
 * 1. 对于有静态数据的页面（平面、字体），根据静态数据分配
 * 2. 对于没有静态数据的页面（三维、电商、室内），平均分配到子分类
 * 
 * 使用方法: node src/utils/redistributeAllPages.js
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

// 平均分配网站到子分类
async function distributeEvenly(mainCategory) {
  const websites = mainCategory.websites;
  const children = mainCategory.children;
  
  if (children.length === 0 || websites.length === 0) {
    return { moved: 0, notMoved: 0 };
  }
  
  const websitesPerChild = Math.ceil(websites.length / children.length);
  let moved = 0;
  
  for (let i = 0; i < websites.length; i++) {
    const childIndex = Math.floor(i / websitesPerChild);
    const targetChild = children[Math.min(childIndex, children.length - 1)];
    
    await prisma.website.update({
      where: { id: websites[i].id },
      data: { categoryId: targetChild.id }
    });
    moved++;
  }
  
  return { moved, notMoved: 0 };
}

// 根据静态数据分配网站
async function distributeByStaticData(mainCategory, urlToSubcategory) {
  const websites = mainCategory.websites;
  const children = mainCategory.children;
  
  if (children.length === 0 || websites.length === 0) {
    return { moved: 0, notMoved: 0 };
  }
  
  let moved = 0;
  let notMoved = 0;
  
  for (const website of websites) {
    const normalizedUrl = normalizeUrl(website.url);
    let subcategoryName = urlToSubcategory.get(normalizedUrl);
    
    // 模糊匹配
    if (!subcategoryName) {
      for (const [staticUrl, name] of urlToSubcategory.entries()) {
        if (normalizedUrl.includes(staticUrl) || staticUrl.includes(normalizedUrl)) {
          subcategoryName = name;
          break;
        }
        const dbDomain = normalizedUrl.split('/')[0];
        const staticDomain = staticUrl.split('/')[0];
        if (dbDomain === staticDomain) {
          subcategoryName = name;
          break;
        }
      }
    }
    
    if (!subcategoryName) {
      notMoved++;
      continue;
    }
    
    const targetChild = children.find(c => c.name === subcategoryName);
    if (!targetChild) {
      notMoved++;
      continue;
    }
    
    await prisma.website.update({
      where: { id: website.id },
      data: { categoryId: targetChild.id }
    });
    moved++;
  }
  
  return { moved, notMoved };
}

async function redistributeAllPages() {
  console.log('🔄 开始综合分配网站到子分类...\n');
  
  const frontendDataDir = path.join(__dirname, '../../../frontend/src/data');
  
  // 定义页面配置
  const pageConfigs = [
    { 
      pageName: '平面导航',
      file: 'designToolsDatabase.js',
      categoriesVar: 'designCategories',
      toolsVar: 'designTools',
      useStaticData: true
    },
    { 
      pageName: '字体导航',
      file: 'fontToolsDatabase.js',
      categoriesVar: 'fontCategories',
      toolsVar: 'fontTools',
      useStaticData: true
    },
    { 
      pageName: '三维导航',
      useStaticData: false
    },
    { 
      pageName: '电商导航',
      useStaticData: false
    },
    { 
      pageName: '室内导航',
      useStaticData: false
    },
  ];

  let totalMoved = 0;
  let totalNotMoved = 0;

  for (const config of pageConfigs) {
    console.log(`\n📄 处理 ${config.pageName}...`);
    console.log('─'.repeat(50));

    // 获取页面数据
    const page = await prisma.page.findFirst({
      where: { name: config.pageName },
      include: {
        pageCategories: {
          include: {
            category: {
              include: {
                children: {
                  orderBy: { order: 'asc' }
                },
                websites: {
                  orderBy: { order: 'asc' }
                }
              }
            }
          }
        }
      }
    });

    if (!page) {
      console.log(`  ⚠️ 未找到页面: ${config.pageName}`);
      continue;
    }

    let urlToSubcategory = new Map();
    
    // 如果使用静态数据，加载映射
    if (config.useStaticData && config.file) {
      try {
        const filePath = path.join(frontendDataDir, config.file);
        const fileUrl = pathToFileURL(filePath).href;
        const module = await import(fileUrl);
        const categories = module[config.categoriesVar] || [];
        const tools = module[config.toolsVar] || [];
        
        console.log(`  静态数据: ${categories.length} 个分类, ${tools.length} 个工具`);
        
        for (const tool of tools) {
          if (tool.subcategory) {
            const subcategoryName = findSubcategoryName(categories, tool.category, tool.subcategory);
            if (subcategoryName) {
              urlToSubcategory.set(normalizeUrl(tool.url), subcategoryName);
            }
          }
        }
        console.log(`  URL映射: ${urlToSubcategory.size} 个`);
      } catch (e) {
        console.log(`  ⚠️ 加载静态数据失败: ${e.message}`);
        config.useStaticData = false;
      }
    }

    let pageMoved = 0;
    let pageNotMoved = 0;

    // 遍历每个主分类
    for (const pc of page.pageCategories) {
      const mainCategory = pc.category;
      
      if (mainCategory.children.length === 0 || mainCategory.websites.length === 0) {
        continue;
      }

      console.log(`\n  📁 ${mainCategory.name}: ${mainCategory.websites.length} 个网站 → ${mainCategory.children.length} 个子分类`);

      let result;
      if (config.useStaticData && urlToSubcategory.size > 0) {
        result = await distributeByStaticData(mainCategory, urlToSubcategory);
        // 对于未匹配的，平均分配
        if (result.notMoved > 0) {
          console.log(`     静态匹配: ${result.moved} 个, 未匹配: ${result.notMoved} 个 → 平均分配`);
          // 重新获取未分配的网站
          const remainingWebsites = await prisma.website.findMany({
            where: { categoryId: mainCategory.id }
          });
          if (remainingWebsites.length > 0) {
            const websitesPerChild = Math.ceil(remainingWebsites.length / mainCategory.children.length);
            for (let i = 0; i < remainingWebsites.length; i++) {
              const childIndex = Math.floor(i / websitesPerChild);
              const targetChild = mainCategory.children[Math.min(childIndex, mainCategory.children.length - 1)];
              await prisma.website.update({
                where: { id: remainingWebsites[i].id },
                data: { categoryId: targetChild.id }
              });
            }
            result.moved += remainingWebsites.length;
            result.notMoved = 0;
          }
        }
      } else {
        result = await distributeEvenly(mainCategory);
        console.log(`     平均分配: ${result.moved} 个`);
      }

      pageMoved += result.moved;
      pageNotMoved += result.notMoved;
    }

    console.log(`\n  ✅ ${config.pageName}: 移动 ${pageMoved} 个`);
    totalMoved += pageMoved;
    totalNotMoved += pageNotMoved;
  }

  console.log('\n' + '═'.repeat(50));
  console.log('📊 总结:');
  console.log(`  成功移动: ${totalMoved} 个网站到子分类`);
  console.log('═'.repeat(50));

  await prisma.$disconnect();
}

redistributeAllPages().catch(console.error);
