/**
 * @file importAIData.js
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
 * 专门导入AI导航数据
 */

// AI分类数据 - 直接从前端文件复制
const aiCategories = [
  {
    id: 'ai-xiezuo',
    name: 'AI写作工具',
    icon: 'blog',
    color: '#6366f1',
    description: 'AI文案生成、论文写作和内容创作工具',
    subCategories: [
      { id: 'ai-xiezuo-writing', name: 'AI写作工具' },
      { id: 'ai-xiezuo-paper', name: 'AI论文工具' },
      { id: 'ai-xiezuo-detection', name: 'AI内容检测' },
      { id: 'ai-xiezuo-bot', name: 'AI机器人' },
      { id: 'ai-xiezuo-prompt', name: 'AI提示词' }
    ]
  },
  {
    id: 'ai-shengtupicture',
    name: 'AI生图工具',
    icon: 'image',
    color: '#dc2626',
    description: 'AI图像生成、绘画创作和艺术设计工具',
    subCategories: [
      { id: 'ai-shengtupicture-huihua', name: 'AI绘画工具' },
      { id: 'ai-shengtupicture-prompt', name: 'AI绘画提示' },
      { id: 'ai-shengtupicture-model', name: 'AI绘画模型' },
      { id: 'ai-shengtupicture-community', name: 'AI绘画社区' }
    ]
  },
  {
    id: 'ai-tupian',
    name: 'AI图片工具',
    icon: 'photo',
    color: '#059669',
    description: 'AI图片处理、修复、增强和编辑工具',
    subCategories: [
      { id: 'ai-tupian-zengqiang', name: 'AI图像增强' },
      { id: 'ai-tupian-qushuiyin', name: 'AI图去水印' },
      { id: 'ai-tupian-xiugai', name: 'AI图片修改' },
      { id: 'ai-tupian-wusunfangda', name: 'AI无损放大' },
      { id: 'ai-tupian-mote', name: 'AI模特生成' },
      { id: 'ai-tupian-chuli', name: 'AI图象处理' },
      { id: 'ai-tupian-koutu', name: 'AI图片抠图' },
      { id: 'ai-tupian-touxiang', name: 'AI头像生成' }
    ]
  },
  {
    id: 'ai-shipin',
    name: 'AI视频工具',
    icon: 'video',
    color: '#7c3aed',
    description: 'AI视频生成、编辑、处理和增强工具',
    subCategories: [
      { id: 'ai-shipin-shengcheng', name: 'AI视频生成' },
      { id: 'ai-shipin-koutu', name: 'AI视频抠像' },
      { id: 'ai-shipin-zimu', name: 'AI字幕翻译' },
      { id: 'ai-shipin-zongjie', name: 'AI视频总结' },
      { id: 'ai-shipin-jianji', name: 'AI视频剪辑' },
      { id: 'ai-shipin-wenan', name: 'AI视频文案' },
      { id: 'ai-shipin-huanlian', name: 'AI视频换脸' },
      { id: 'ai-shipin-shuziren', name: 'AI虚拟数字人' },
      { id: 'ai-shipin-qushuiyin', name: 'AI视频去水印' },
      { id: 'ai-shipin-zengqiang', name: 'AI视频画质增强' }
    ]
  },
  {
    id: 'ai-yinpin',
    name: 'AI音频工具',
    icon: 'music',
    color: '#ea580c',
    description: 'AI音频生成、处理、编辑和制作工具',
    subCategories: [
      { id: 'ai-yinpin-zhizuo', name: 'AI音频制作' },
      { id: 'ai-yinpin-tts', name: 'AI文字转音' },
      { id: 'ai-yinpin-kelong', name: 'AI音频克隆' },
      { id: 'ai-yinpin-fenli', name: 'AI人声分离' },
      { id: 'ai-yinpin-geshou', name: 'AI音乐歌手' },
      { id: 'ai-yinpin-bianqu', name: 'AI编曲作曲' }
    ]
  },
  {
    id: 'ai-bangong',
    name: 'AI办公工具',
    icon: 'briefcase',
    color: '#10b981',
    description: 'AI办公自动化、文档处理和效率提升工具',
    subCategories: [
      { id: 'ai-bangong-ppt', name: 'AI PPT' },
      { id: 'ai-bangong-wendang', name: 'AI文档工具' },
      { id: 'ai-bangong-siweidaotu', name: 'AI思维导图' },
      { id: 'ai-bangong-xiaolu', name: 'AI效率工具' },
      { id: 'ai-bangong-biaoge', name: 'AI表格处理' },
      { id: 'ai-bangong-huiyi', name: 'AI会议工具' }
    ]
  },
  {
    id: 'ai-sheji',
    name: 'AI设计工具',
    icon: 'palette',
    color: '#f59e0b',
    description: 'AI设计创作、界面设计和视觉创意工具',
    subCategories: [
      { id: 'ai-sheji-logo', name: 'AI Logo' },
      { id: 'ai-sheji-3d', name: 'AI 3D建模' },
      { id: 'ai-sheji-gongju', name: 'AI设计工具' },
      { id: 'ai-sheji-jiemian', name: 'AI界面工具' },
      { id: 'ai-sheji-touxiang', name: 'AI头像生成' },
      { id: 'ai-sheji-mote', name: 'AI模特生成' },
      { id: 'ai-sheji-shinei', name: 'AI室内生成' },
      { id: 'ai-sheji-jianzhu', name: 'AI建筑设计' }
    ]
  },
  {
    id: 'ai-kaifa',
    name: 'AI开发工具',
    icon: 'code',
    color: '#8b5cf6',
    description: 'AI编程辅助、低代码开发和技术工具',
    subCategories: [
      { id: 'ai-kaifa-daimahua', name: 'AI低代码' },
      { id: 'ai-kaifa-biancheng', name: 'AI编程工具' }
    ]
  },
  {
    id: 'ai-xuexi',
    name: 'AI学习平台',
    icon: 'academic-cap',
    color: '#06b6d4',
    description: 'AI学习资源、教育平台和知识获取工具',
    subCategories: [
      { id: 'ai-xuexi-zhinan', name: 'AI学习指南' },
      { id: 'ai-xuexi-wangzhan', name: 'AI学习网站' }
    ]
  },
  {
    id: 'ai-pingtai',
    name: 'AI平台网站',
    icon: 'globe-alt',
    color: '#ef4444',
    description: 'AI平台服务、开放接口和技术基础设施',
    subCategories: [
      { id: 'ai-pingtai-damoxing', name: 'AI大模型' },
      { id: 'ai-pingtai-yuanyuzhou', name: 'AI元宇宙' },
      { id: 'ai-pingtai-kaifang', name: 'AI开放平台' },
      { id: 'ai-pingtai-suanli', name: 'AI算力平台' },
      { id: 'ai-pingtai-guanli', name: 'AI管理机构' }
    ]
  },
  {
    id: 'ai-dianshang',
    name: 'AI电商工具',
    icon: 'shopping-cart',
    color: '#84cc16',
    description: 'AI电商运营、商品管理和营销推广工具',
    subCategories: [
      { id: 'ai-dianshang-shangpin', name: 'AI商品工具' },
      { id: 'ai-dianshang-mote', name: 'AI模特生成' }
    ]
  }
];

// 解析AI工具数据
function parseAITools(content) {
  const tools = [];
  
  // 匹配工具对象
  const toolRegex = /\{\s*id:\s*['"]([^'"]+)['"][^}]*?name:\s*['"]([^'"]+)['"][^}]*?description:\s*['"]([^'"]*?)['"][^}]*?url:\s*['"]([^'"]+)['"][^}]*?category:\s*['"]([^'"]+)['"][^}]*?subCategory:\s*['"]([^'"]+)['"][^}]*?(?:isHot:\s*(true|false))?[^}]*?(?:isFeatured:\s*(true|false))?[^}]*?(?:isNew:\s*(true|false))?[^}]*?\}/g;
  
  let match;
  while ((match = toolRegex.exec(content)) !== null) {
    const [, id, name, description, url, category, subCategory, isHot, isFeatured, isNew] = match;
    
    if (name && url) {
      tools.push({
        id,
        name,
        description: description || '',
        url,
        category,
        subCategory,
        isHot: isHot === 'true',
        isFeatured: isFeatured === 'true',
        isNew: isNew === 'true'
      });
    }
  }
  
  return tools;
}

async function main() {
  console.log('🚀 开始导入AI导航数据...\n');
  
  // 获取或创建AI页面
  let page = await prisma.page.findUnique({ where: { slug: 'ai' } });
  if (!page) {
    page = await prisma.page.create({
      data: {
        name: 'AI导航',
        slug: 'ai',
        type: 'ai',
        order: 1,
        visible: true,
        searchEnabled: true,
        showHotRecommendations: true,
        showCategories: true,
      }
    });
    console.log('✅ 创建页面: AI导航');
  }
  
  let importedCategories = 0;
  let importedWebsites = 0;
  const categoryIdMap = new Map();
  
  // 导入分类
  console.log('\n📂 导入分类...');
  for (let i = 0; i < aiCategories.length; i++) {
    const cat = aiCategories[i];
    
    try {
      let dbCategory = await prisma.category.findUnique({ where: { slug: cat.id } });
      
      if (!dbCategory) {
        dbCategory = await prisma.category.create({
          data: {
            name: cat.name,
            slug: cat.id,
            icon: cat.icon,
            color: cat.color,
            description: cat.description,
            order: i,
            visible: true,
          }
        });
        importedCategories++;
        console.log(`  ✅ 创建主分类: ${cat.name}`);
      } else {
        console.log(`  ⏭️  主分类已存在: ${cat.name}`);
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
      if (cat.subCategories && cat.subCategories.length > 0) {
        for (let j = 0; j < cat.subCategories.length; j++) {
          const subCat = cat.subCategories[j];
          
          let dbSubCategory = await prisma.category.findUnique({ where: { slug: subCat.id } });
          
          if (!dbSubCategory) {
            dbSubCategory = await prisma.category.create({
              data: {
                name: subCat.name,
                slug: subCat.id,
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
  
  // 读取并解析AI工具数据
  console.log('\n📂 导入网站...');
  const filePath = path.join(__dirname, '../../../frontend/src/data/aiToolsDatabase.js');
  const content = fs.readFileSync(filePath, 'utf-8');
  const tools = parseAITools(content);
  console.log(`  找到 ${tools.length} 个工具`);
  
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
        const subCat = await prisma.category.findUnique({ where: { slug: tool.subCategory } });
        if (subCat) categoryId = subCat.id;
      }
      
      if (!categoryId && tool.category) {
        const cat = await prisma.category.findUnique({ where: { slug: tool.category } });
        if (cat) categoryId = cat.id;
      }
      
      if (!categoryId) {
        // 使用第一个分类作为默认
        const firstCat = await prisma.category.findUnique({ where: { slug: aiCategories[0].id } });
        if (firstCat) categoryId = firstCat.id;
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
  
  console.log(`\n📊 导入完成: ${importedCategories} 个分类, ${importedWebsites} 个网站`);
  
  // 显示统计
  const categoryCount = await prisma.category.count();
  const websiteCount = await prisma.website.count();
  
  console.log(`\n📈 数据库统计:`);
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
