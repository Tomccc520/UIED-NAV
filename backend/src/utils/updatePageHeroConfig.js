/**
 * @file updatePageHeroConfig.js
 * @description 后端API服务
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

/**
 * 更新页面 Hero 配置
 * 为现有页面添加 heroTitle, heroSubtitle, hotSearchTags 数据
 */

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// 页面 Hero 配置数据
const pageHeroConfigs = {
  'uiux': {
    heroTitle: '发现专业UI/UX工具',
    heroSubtitle: '精选UI/UX设计师必备工具与资源，提升设计效率与创意灵感',
    hotSearchTags: 'Figma,蓝湖,Figma插件,Sketch,Axure,UIED,稿定设计',
  },
  'ai': {
    heroTitle: '发现强大的AI工具',
    heroSubtitle: '聚合国内外AI精选内容，探索AI技术前沿与应用',
    hotSearchTags: '即梦AI,通义千问,智谱清言,文心一格,讯飞星火,豆包,月之暗面',
  },
  'design': {
    heroTitle: '发现优质设计资源',
    heroSubtitle: '汇聚全球优质设计网站与资源，为设计师提供无限创意灵感',
    hotSearchTags: '站酷,平面灵感,花瓣网,UIED,海报,设计灵感,古田路9号',
  },
  '3d': {
    heroTitle: '发现专业3D工具',
    heroSubtitle: '精选3D建模、渲染、动画等专业工具，助力三维设计创作',
    hotSearchTags: '3ds Max,Maya,Blender,SketchUp,KeyShot,V-Ray,Corona,Lumion',
  },
  'ecommerce': {
    heroTitle: '发现电商设计工具',
    heroSubtitle: '专业电商设计工具与资源，助力电商视觉营销与品牌建设',
    hotSearchTags: '淘宝美工,电商设计,产品摄影,详情页,主图设计,店铺装修',
  },
  'interior': {
    heroTitle: '发现室内设计工具',
    heroSubtitle: '专业室内设计软件与资源，打造理想空间设计方案',
    hotSearchTags: 'SketchUp,3ds Max,AutoCAD,V-Ray,Lumion,Enscape,室内设计',
  },
  'font': {
    heroTitle: '发现优质字体资源',
    heroSubtitle: '精选字体资源、字体工具与字体设计软件，助力字体设计创作',
    hotSearchTags: '中文字体,英文字体,免费商用字体,思源字体,苹方',
  },
};

async function updatePageHeroConfig() {
  console.log('🚀 开始更新页面 Hero 配置...\n');

  for (const [slug, config] of Object.entries(pageHeroConfigs)) {
    try {
      const page = await prisma.page.findUnique({
        where: { slug },
      });

      if (page) {
        await prisma.page.update({
          where: { slug },
          data: {
            heroTitle: config.heroTitle,
            heroSubtitle: config.heroSubtitle,
            hotSearchTags: config.hotSearchTags,
          },
        });
        console.log(`✅ 更新页面 "${slug}" Hero 配置成功`);
      } else {
        console.log(`⚠️ 页面 "${slug}" 不存在，跳过`);
      }
    } catch (error) {
      console.error(`❌ 更新页面 "${slug}" 失败:`, error.message);
    }
  }

  console.log('\n✅ 页面 Hero 配置更新完成！');
}

updatePageHeroConfig()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
