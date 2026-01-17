/**
 * @file seed.js
 * @description 后端API服务
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 从前端数据导入
const categoriesData = [
  { name: 'AI工具', slug: 'ai-tools', icon: 'ai', color: '#667EEA', order: 1 },
  { name: 'UI设计', slug: 'ui-design', icon: 'ui', color: '#F093FB', order: 2 },
  { name: '平面设计', slug: 'graphic-design', icon: 'graphic', color: '#4FACFE', order: 3 },
  { name: '设计素材', slug: 'design-materials', icon: 'material', color: '#43E97B', order: 4 },
  { name: '配色工具', slug: 'color-tools', icon: 'color', color: '#FA709A', order: 5 },
  { name: '设计灵感', slug: 'design-inspiration', icon: 'inspiration', color: '#FFECD2', order: 6 },
  { name: '原型工具', slug: 'prototype-tools', icon: 'prototype', color: '#A8EDEA', order: 7 },
  { name: '图标字体', slug: 'icons-fonts', icon: 'font', color: '#D299C2', order: 8 },
  { name: '动画工具', slug: 'animation-tools', icon: 'animation', color: '#89F7FE', order: 9 },
  { name: '设计教程', slug: 'design-tutorials', icon: 'learn', color: '#FCB69F', order: 10 },
  { name: '图片素材', slug: 'image-resources', icon: 'photo', color: '#FF9A9E', order: 11 },
  { name: '设计工具', slug: 'design-tools', icon: 'kit', color: '#A8E6CF', order: 12 },
  { name: '前端开发', slug: 'frontend-dev', icon: 'developer', color: '#FFD93D', order: 13 },
  { name: '设计规范', slug: 'design-specs', icon: 'specs', color: '#6BCF7F', order: 14 },
  { name: '设计社区', slug: 'design-community', icon: 'community', color: '#4D79A4', order: 15 }
];

const websitesData = [
  // AI工具
  {
    name: 'ChatGPT',
    description: 'OpenAI开发的大型语言模型，支持对话和文本生成',
    url: 'https://chat.openai.com',
    categorySlug: 'ai-tools',
    isNew: false,
    isFeatured: true,
    isHot: true,
    tags: ['AI对话', '文本生成', 'OpenAI'],
    order: 1
  },
  {
    name: 'Midjourney',
    description: '基于AI的图像生成工具，创造惊人的艺术作品',
    url: 'https://www.midjourney.com',
    categorySlug: 'ai-tools',
    isNew: false,
    isFeatured: true,
    isHot: true,
    tags: ['AI绘画', '图像生成', '艺术创作'],
    order: 2
  },
  {
    name: 'Stable Diffusion',
    description: '开源的AI图像生成模型，免费且功能强大',
    url: 'https://stability.ai/stable-diffusion',
    categorySlug: 'ai-tools',
    isNew: false,
    isFeatured: false,
    isHot: true,
    tags: ['AI绘画', '开源', '图像生成'],
    order: 3
  },
  {
    name: 'Claude',
    description: 'Anthropic开发的AI助手，擅长分析和创作',
    url: 'https://claude.ai',
    categorySlug: 'ai-tools',
    isNew: true,
    isFeatured: false,
    isHot: false,
    tags: ['AI助手', '文本分析', 'Anthropic'],
    order: 4
  },
  // UI设计工具
  {
    name: 'Figma',
    description: '强大的界面设计和原型制作工具，支持实时协作设计',
    url: 'https://www.figma.com',
    categorySlug: 'ui-design',
    isNew: false,
    isFeatured: true,
    isHot: true,
    tags: ['设计工具', 'UI设计', '原型', '协作'],
    order: 1
  },
  {
    name: 'Adobe XD',
    description: '专业的用户体验设计工具，Adobe Creative Suite的一部分',
    url: 'https://www.adobe.com/products/xd.html',
    categorySlug: 'ui-design',
    isNew: false,
    isFeatured: true,
    isHot: false,
    tags: ['设计工具', 'UI设计', 'Adobe'],
    order: 2
  },
  {
    name: 'Sketch',
    description: 'Mac平台专业的界面设计工具，矢量图形编辑器',
    url: 'https://www.sketch.com',
    categorySlug: 'ui-design',
    isNew: false,
    isFeatured: true,
    isHot: false,
    tags: ['设计工具', 'UI设计', 'Mac', '矢量'],
    order: 3
  },
  // 配色工具
  {
    name: 'Coolors',
    description: '快速生成配色方案的在线工具',
    url: 'https://coolors.co',
    categorySlug: 'color-tools',
    isNew: false,
    isFeatured: true,
    isHot: true,
    tags: ['配色', '调色板', '在线工具'],
    order: 1
  },
  {
    name: 'Adobe Color',
    description: 'Adobe官方配色工具，提供丰富的色彩搭配',
    url: 'https://color.adobe.com',
    categorySlug: 'color-tools',
    isNew: false,
    isFeatured: false,
    isHot: false,
    tags: ['配色', 'Adobe', '色轮'],
    order: 2
  },
  // 设计灵感
  {
    name: 'Dribbble',
    description: '设计师作品展示和灵感分享社区',
    url: 'https://dribbble.com',
    categorySlug: 'design-inspiration',
    isNew: false,
    isFeatured: true,
    isHot: true,
    tags: ['设计灵感', '作品展示', '社区'],
    order: 1
  },
  {
    name: 'Behance',
    description: 'Adobe旗下的创意作品展示平台',
    url: 'https://www.behance.net',
    categorySlug: 'design-inspiration',
    isNew: false,
    isFeatured: true,
    isHot: false,
    tags: ['作品展示', '设计灵感', 'Adobe'],
    order: 2
  }
];

async function main() {
  console.log('🌱 开始数据填充...');

  // 清空现有数据
  await prisma.website.deleteMany();
  await prisma.category.deleteMany();
  console.log('✅ 清空现有数据');

  // 创建分类
  const categoryMap = {};
  for (const cat of categoriesData) {
    const category = await prisma.category.create({
      data: cat
    });
    categoryMap[cat.slug] = category.id;
    console.log(`✅ 创建分类: ${cat.name}`);
  }

  // 创建网站
  for (const site of websitesData) {
    const { categorySlug, tags, ...siteData } = site;
    await prisma.website.create({
      data: {
        ...siteData,
        categoryId: categoryMap[categorySlug],
        tags: JSON.stringify(tags)
      }
    });
    console.log(`✅ 创建网站: ${site.name}`);
  }

  console.log('🎉 数据填充完成！');
}

main()
  .catch((e) => {
    console.error('❌ 数据填充失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
