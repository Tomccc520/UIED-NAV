/**
 * @file importCategories.js
 * @description 后端API服务
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * 从前端uiuxToolsDatabase.js导入分类数据
 * 这个脚本会读取前端的分类结构并导入到数据库
 */

// UI/UX分类数据（从前端文件复制）
const uiuxCategories = [
  {
    id: 'design-inspiration',
    name: '设计灵感',
    description: '优秀设计案例与创意展示平台',
    icon: 'inspiration',
    color: '#3B82F6',
    subcategories: [
      { id: 'design-inspiration-web', name: '网页灵感' },
      { id: 'design-inspiration-ui', name: '界面灵感' },
      { id: 'design-inspiration-motion', name: '动效灵感' },
      { id: 'design-inspiration-game', name: '游戏灵感' }
    ]
  },
  {
    id: 'common-recommendations',
    name: '常用推荐',
    description: 'UI/UX设计师常用工具与推荐资源',
    icon: 'prototype',
    color: '#10B981',
    subcategories: [
      { id: 'common-recommendations-discover', name: '发现产品' },
      { id: 'common-recommendations-review', name: '设计走查' },
      { id: 'common-recommendations-tools', name: '设计工具' },
      { id: 'common-recommendations-collaboration', name: '协作平台' },
      { id: 'common-recommendations-guidelines', name: '设计规范' },
      { id: 'common-recommendations-competitor', name: '竞品分析' }
    ]
  },
  {
    id: 'design-system',
    name: '设计系统',
    description: '企业级设计系统与UI组件库',
    icon: 'system',
    color: '#EC4899',
    subcategories: [
      { id: 'design-system-pc', name: 'PC端' },
      { id: 'design-system-mobile', name: '移动端' },
      { id: 'design-system-miniapp', name: '小程序' },
      { id: 'design-system-ai', name: '人工智能' }
    ]
  },
  {
    id: 'motion-design',
    name: '动效设计',
    description: '界面交互动效、动画素材与实现工具',
    icon: 'animation',
    color: '#0EA5E9',
    subcategories: [
      { id: 'motion-design-interaction', name: '交互工具' },
      { id: 'motion-design-material', name: '动效素材' },
      { id: 'motion-design-reference', name: '动效参考' },
      { id: 'motion-design-plugins', name: '落地插件' }
    ]
  },
  {
    id: 'design-plugins',
    name: '设计插件',
    description: '提升设计效率的各类插件工具',
    icon: 'plugin',
    color: '#8B5CF6',
    subcategories: [
      { id: 'design-plugins-figma', name: 'Figma插件' },
      { id: 'design-plugins-sketch', name: 'Sketch插件' },
      { id: 'design-plugins-xd', name: 'Adobe XD插件' },
      { id: 'design-plugins-photoshop', name: 'Photoshop插件' }
    ]
  },
  {
    id: 'design-resources',
    name: '设计素材',
    description: '高质量设计素材与资源库',
    icon: 'material',
    color: '#F59E0B',
    subcategories: [
      { id: 'design-resources-ui', name: 'UI素材' },
      { id: 'design-resources-icons', name: '图标素材' },
      { id: 'design-resources-images', name: '可商用图库' },
      { id: 'design-resources-illustrations', name: '可商用插画' },
      { id: 'design-resources-video', name: '可商用视频' },
      { id: 'design-resources-fonts', name: '可商用字体' },
      { id: 'design-resources-mockups', name: '样机素材' },
      { id: 'design-resources-fontwebsites', name: '字体网站' },
      { id: 'design-resources-soundeffects', name: '音效网站' },
      { id: 'design-resources-ppt', name: 'PPT资源' },
      { id: 'design-resources-3d', name: '3D素材' },
      { id: 'design-resources-3dmodels', name: '3D模型' },
      { id: 'design-resources-aepr', name: 'AE/PR模板' },
      { id: 'design-resources-cutout', name: '免抠素材' }
    ]
  },
  {
    id: 'data-visualization',
    name: '数字孪生',
    description: '数据可视化与数字孪生技术工具资源',
    icon: 'digital',
    color: '#6366F1',
    subcategories: [
      { id: 'data-visualization-inspiration', name: '可视化灵感' },
      { id: 'data-visualization-platform', name: '可视化平台' },
      { id: 'data-visualization-map', name: '可视化地图' },
      { id: 'data-visualization-components', name: '可视化组件' }
    ]
  },
  {
    id: 'automotive-design',
    name: '车载设计',
    description: '汽车界面与交互设计相关资源与工具',
    icon: 'carui',
    color: '#3B82F6',
    subcategories: [
      { id: 'automotive-design-hmi', name: '车机交互' },
      { id: 'automotive-design-ui', name: '车载界面' },
      { id: 'automotive-design-tools', name: '设计工具' },
      { id: 'automotive-design-guidelines', name: '设计规范' }
    ]
  },
  {
    id: 'design-teams',
    name: '设计团队',
    description: '优秀设计团队与设计机构资源分享',
    icon: 'designteam',
    color: '#059669',
    subcategories: [
      { id: 'design-teams-internet', name: '互联网团队' },
      { id: 'design-teams-agencies', name: '设计机构' },
      { id: 'design-teams-automotive', name: '汽车团队' },
      { id: 'design-teams-innovation', name: '创新工作室' },
      { id: 'design-teams-hardware', name: '硬件团队' },
      { id: 'design-teams-recruitment', name: '大厂招聘' }
    ]
  },
  {
    id: 'game-ui',
    name: '游戏设计',
    description: '游戏界面设计资源与工具',
    icon: 'gameui',
    color: '#7C3AED',
    subcategories: [
      { id: 'game-ui-inspiration', name: '游戏界面灵感' },
      { id: 'game-ui-resources', name: '游戏素材' },
      { id: 'game-ui-tools', name: '游戏UI工具' },
      { id: 'game-ui-guidelines', name: '游戏设计规范' }
    ]
  },
  {
    id: 'metaverse-vrar',
    name: '元宇宙与VR/AR',
    description: '虚拟现实与增强现实界面设计资源',
    icon: 'metaverse',
    color: '#2563EB',
    subcategories: [
      { id: 'metaverse-vrar-inspiration', name: '空间界面灵感' },
      { id: 'metaverse-vrar-tools', name: '空间设计工具' },
      { id: 'metaverse-vrar-resources', name: '3D资源' },
      { id: 'metaverse-vrar-guidelines', name: '空间设计规范' }
    ]
  },
  {
    id: 'other-content',
    name: '其他内容',
    description: '个人网站、炫酷网站和毕业作品展示',
    icon: 'othercontent',
    color: '#F97316',
    subcategories: [
      { id: 'other-content-personal', name: '个人网站' },
      { id: 'other-content-cool', name: '炫酷网站' },
      { id: 'other-content-graduation', name: '毕业作品展' }
    ]
  }
];

async function importCategories() {
  console.log('🌱 开始导入分类数据...\n');
  
  let importedCount = 0;
  let skippedCount = 0;
  let order = 0;

  for (const category of uiuxCategories) {
    try {
      // 检查主分类是否已存在
      const existingCategory = await prisma.category.findUnique({
        where: { slug: category.id }
      });

      let parentCategory;
      
      if (existingCategory) {
        console.log(`⏭️  主分类已存在: ${category.name} (${category.id})`);
        parentCategory = existingCategory;
        skippedCount++;
      } else {
        // 创建主分类
        parentCategory = await prisma.category.create({
          data: {
            name: category.name,
            slug: category.id,
            icon: category.icon,
            color: category.color,
            description: category.description,
            order: order++,
            visible: true,
          }
        });
        console.log(`✅ 创建主分类: ${category.name} (${category.id})`);
        importedCount++;
      }

      // 导入子分类
      if (category.subcategories && category.subcategories.length > 0) {
        let subOrder = 0;
        for (const subcategory of category.subcategories) {
          try {
            const existingSubCategory = await prisma.category.findUnique({
              where: { slug: subcategory.id }
            });

            if (existingSubCategory) {
              console.log(`   ⏭️  子分类已存在: ${subcategory.name} (${subcategory.id})`);
              skippedCount++;
            } else {
              await prisma.category.create({
                data: {
                  name: subcategory.name,
                  slug: subcategory.id,
                  icon: category.icon, // 继承父分类图标
                  color: category.color, // 继承父分类颜色
                  description: `${category.name} - ${subcategory.name}`,
                  parentId: parentCategory.id,
                  order: subOrder++,
                  visible: true,
                }
              });
              console.log(`   ✅ 创建子分类: ${subcategory.name} (${subcategory.id})`);
              importedCount++;
            }
          } catch (error) {
            console.error(`   ❌ 创建子分类失败: ${subcategory.name}`, error.message);
          }
        }
      }
      console.log(''); // 空行分隔
    } catch (error) {
      console.error(`❌ 创建主分类失败: ${category.name}`, error.message);
    }
  }

  console.log('\n🎉 导入完成！');
  console.log(`✅ 成功导入: ${importedCount} 个分类`);
  console.log(`⏭️  跳过已存在: ${skippedCount} 个分类`);
  console.log(`📊 总计: ${importedCount + skippedCount} 个分类\n`);
}

// 执行导入
importCategories()
  .catch((error) => {
    console.error('💥 导入失败:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
