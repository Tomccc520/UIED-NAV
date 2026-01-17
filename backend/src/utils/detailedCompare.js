/**
 * @file detailedCompare.js
 * @description 详细对比每个页面的静态数据和数据库数据
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

// 动态导入静态数据
async function getStaticStats() {
  const stats = {};
  
  // AI数据
  try {
    const aiPath = path.join(__dirname, '../../../frontend/src/data/aiToolsDatabase.js');
    const aiContent = fs.readFileSync(aiPath, 'utf-8');
    
    // 统计各分类的工具数
    const aiCategories = aiContent.match(/id:\s*['"]ai-[^'"]+['"]/g) || [];
    const aiTools = aiContent.match(/{\s*id:\s*['"][^'"]+['"],\s*name:\s*['"][^'"]+['"],\s*description:/g) || [];
    
    stats.ai = {
      categories: new Set(aiCategories.map(m => m.match(/['"]([^'"]+)['"]/)[1])).size,
      tools: aiTools.length
    };
  } catch (e) {
    console.log('AI数据读取失败:', e.message);
  }
  
  // UIUX数据
  try {
    const uiuxPath = path.join(__dirname, '../../../frontend/src/data/uiuxToolsDatabase.js');
    const uiuxContent = fs.readFileSync(uiuxPath, 'utf-8');
    const uiuxTools = uiuxContent.match(/{\s*id:\s*['"][^'"]+['"],\s*name:\s*['"][^'"]+['"],\s*description:/g) || [];
    stats.uiux = { tools: uiuxTools.length };
  } catch (e) {
    console.log('UIUX数据读取失败:', e.message);
  }
  
  // Design数据
  try {
    const designPath = path.join(__dirname, '../../../frontend/src/data/designToolsDatabase.js');
    const designContent = fs.readFileSync(designPath, 'utf-8');
    const designTools = designContent.match(/{\s*id:\s*['"][^'"]+['"],\s*name:\s*['"][^'"]+['"],\s*description:/g) || [];
    stats.design = { tools: designTools.length };
  } catch (e) {
    console.log('Design数据读取失败:', e.message);
  }
  
  // 3D数据
  try {
    const threeDPath = path.join(__dirname, '../../../frontend/src/data/threeDToolsDatabase.js');
    const threeDContent = fs.readFileSync(threeDPath, 'utf-8');
    const threeDTools = threeDContent.match(/{\s*id:\s*['"][^'"]+['"],\s*name:\s*['"][^'"]+['"],\s*description:/g) || [];
    stats.threeD = { tools: threeDTools.length };
  } catch (e) {
    console.log('3D数据读取失败:', e.message);
  }
  
  // Font数据
  try {
    const fontPath = path.join(__dirname, '../../../frontend/src/data/fontToolsDatabase.js');
    const fontContent = fs.readFileSync(fontPath, 'utf-8');
    const fontTools = fontContent.match(/{\s*id:\s*['"][^'"]+['"],\s*name:\s*['"][^'"]+['"],\s*description:/g) || [];
    stats.font = { tools: fontTools.length };
  } catch (e) {
    console.log('Font数据读取失败:', e.message);
  }
  
  // Ecommerce数据
  try {
    const ecommercePath = path.join(__dirname, '../../../frontend/src/data/ecommerceToolsDatabase.js');
    const ecommerceContent = fs.readFileSync(ecommercePath, 'utf-8');
    const ecommerceTools = ecommerceContent.match(/{\s*id:\s*['"][^'"]+['"],\s*name:\s*['"][^'"]+['"],\s*description:/g) || [];
    stats.ecommerce = { tools: ecommerceTools.length };
  } catch (e) {
    console.log('Ecommerce数据读取失败:', e.message);
  }
  
  // Interior数据
  try {
    const interiorPath = path.join(__dirname, '../../../frontend/src/data/interiorToolsDatabase.js');
    const interiorContent = fs.readFileSync(interiorPath, 'utf-8');
    const interiorTools = interiorContent.match(/{\s*id:\s*['"][^'"]+['"],\s*name:\s*['"][^'"]+['"],\s*description:/g) || [];
    stats.interior = { tools: interiorTools.length };
  } catch (e) {
    console.log('Interior数据读取失败:', e.message);
  }
  
  return stats;
}

async function compare() {
  console.log('=== 详细对比静态数据 vs 数据库 ===\n');
  
  const staticStats = await getStaticStats();
  
  // 获取数据库各页面统计
  const pages = await prisma.page.findMany({
    include: {
      pageCategories: {
        include: {
          category: {
            include: {
              children: true
            }
          }
        }
      }
    }
  });
  
  const comparison = [
    { page: 'AI导航', slug: 'ai', staticKey: 'ai' },
    { page: 'UI导航', slug: 'uiux', staticKey: 'uiux' },
    { page: '平面导航', slug: 'design', staticKey: 'design' },
    { page: '三维导航', slug: '3d', staticKey: 'threeD' },
    { page: '字体导航', slug: 'font', staticKey: 'font' },
    { page: '电商导航', slug: 'ecommerce', staticKey: 'ecommerce' },
    { page: '室内导航', slug: 'interior', staticKey: 'interior' },
  ];
  
  console.log('页面对比:');
  console.log('─'.repeat(60));
  console.log('页面名称\t\t静态数据\t数据库\t\t差异');
  console.log('─'.repeat(60));
  
  let totalStatic = 0;
  let totalDB = 0;
  
  for (const item of comparison) {
    const pageData = pages.find(p => p.slug === item.slug);
    
    // 获取该页面所有分类ID
    const categoryIds = [];
    if (pageData) {
      for (const pc of pageData.pageCategories) {
        categoryIds.push(pc.category.id);
        for (const child of pc.category.children) {
          categoryIds.push(child.id);
        }
      }
    }
    
    // 数据库网站数
    const dbCount = categoryIds.length > 0 
      ? await prisma.website.count({ where: { categoryId: { in: categoryIds } } })
      : 0;
    
    // 静态数据数
    const staticCount = staticStats[item.staticKey]?.tools || 0;
    
    const diff = staticCount - dbCount;
    const diffStr = diff > 0 ? `+${diff}` : diff.toString();
    
    totalStatic += staticCount;
    totalDB += dbCount;
    
    console.log(`${item.page}\t\t${staticCount}\t\t${dbCount}\t\t${diffStr}`);
  }
  
  console.log('─'.repeat(60));
  console.log(`总计\t\t\t${totalStatic}\t\t${totalDB}\t\t${totalStatic - totalDB}`);
  
  // 检查哪些网站可能缺失
  console.log('\n=== 检查可能缺失的数据 ===');
  
  // 检查AI页面的详细情况
  const aiPage = pages.find(p => p.slug === 'ai');
  if (aiPage) {
    console.log('\nAI页面分类详情:');
    for (const pc of aiPage.pageCategories) {
      const mainCount = await prisma.website.count({ where: { categoryId: pc.category.id } });
      let subTotal = 0;
      for (const child of pc.category.children) {
        const subCount = await prisma.website.count({ where: { categoryId: child.id } });
        subTotal += subCount;
      }
      console.log(`  ${pc.category.name}: 主分类 ${mainCount}, 子分类总计 ${subTotal}`);
    }
  }
  
  await prisma.$disconnect();
}

compare().catch(console.error);
