/**
 * @file seedPages.js
 * @description 后端API服务
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedPages() {
  console.log('🌱 开始初始化页面配置数据...');

  try {
    // 清空现有数据
    await prisma.pageCategory.deleteMany({});
    await prisma.page.deleteMany({});

    // 创建默认页面配置
    const pagesData = [
      {
        name: 'UI导航',
        slug: 'uiux',
        type: 'uiux',
        icon: 'Figma',
        description: 'UI/UX设计工具和资源导航',
        order: 1,
        visible: true,
        searchPlaceholder: '搜索UI/UX工具...',
        searchEnabled: true,
        showHotRecommendations: true,
        showCategories: true,
      },
      {
        name: 'AI导航',
        slug: 'ai',
        type: 'ai',
        icon: 'AI',
        description: 'AI工具和资源导航',
        order: 2,
        visible: true,
        searchPlaceholder: '搜索AI工具...',
        searchEnabled: true,
        showHotRecommendations: true,
        showCategories: true,
      },
      {
        name: '平面导航',
        slug: 'design',
        type: 'design',
        icon: 'Design',
        description: '平面设计工具和资源导航',
        order: 3,
        visible: true,
        searchPlaceholder: '搜索设计工具...',
        searchEnabled: true,
        showHotRecommendations: true,
        showCategories: true,
      },
      {
        name: '三维导航',
        slug: '3d',
        type: '3d',
        icon: '3D',
        description: '3D设计工具和资源导航',
        order: 4,
        visible: true,
        searchPlaceholder: '搜索3D工具...',
        searchEnabled: true,
        showHotRecommendations: true,
        showCategories: true,
      },
      {
        name: '电商导航',
        slug: 'ecommerce',
        type: 'ecommerce',
        icon: 'Ecommerce',
        description: '电商设计工具和资源导航',
        order: 5,
        visible: true,
        searchPlaceholder: '搜索电商工具...',
        searchEnabled: true,
        showHotRecommendations: true,
        showCategories: true,
      },
      {
        name: '室内导航',
        slug: 'interior',
        type: 'interior',
        icon: 'Design',
        description: '室内设计工具和资源导航',
        order: 6,
        visible: true,
        searchPlaceholder: '搜索室内设计工具...',
        searchEnabled: true,
        showHotRecommendations: true,
        showCategories: true,
      },
      {
        name: '字体导航',
        slug: 'font',
        type: 'font',
        icon: 'Font',
        description: '字体资源导航',
        order: 7,
        visible: true,
        searchPlaceholder: '搜索字体资源...',
        searchEnabled: true,
        showHotRecommendations: true,
        showCategories: true,
      },
    ];

    for (const data of pagesData) {
      await prisma.page.create({ data });
    }

    console.log('✅ 页面配置数据初始化完成');
    console.log(`   - 创建了 ${pagesData.length} 个页面配置`);
  } catch (error) {
    console.error('❌ 页面配置数据初始化失败:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 如果直接运行此文件
const isMainModule =
  process.argv[1] && import.meta.url.endsWith(process.argv[1]);

if (isMainModule) {
  seedPages()
    .then(() => {
      console.log('🎉 数据初始化成功');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 数据初始化失败:', error);
      process.exit(1);
    });
}

export default seedPages;
