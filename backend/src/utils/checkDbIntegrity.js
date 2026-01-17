/**
 * @file checkDbIntegrity.js
 * @description 后端API服务
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

/**
 * 数据库完整性检查脚本
 * 用于检查数据库数据是否完整
 * 
 * 使用方法: node src/utils/checkDbIntegrity.js
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkIntegrity() {
  console.log('🔍 检查数据库完整性...\n');
  console.log('📁 数据库路径:', process.env.DATABASE_URL || 'file:./prisma/dev.db');
  console.log('');

  try {
    // 检查各表数据量
    const [
      categoryCount,
      websiteCount,
      pageCount,
      bannerCount,
      hotRecCount,
      navMenuCount,
      footerGroupCount,
      footerLinkCount,
      friendLinkCount,
      socialMediaCount,
      siteInfoCount,
      aiConfigCount,
      wpConfigCount,
    ] = await Promise.all([
      prisma.category.count(),
      prisma.website.count(),
      prisma.page.count(),
      prisma.banner.count(),
      prisma.hotRecommendation.count(),
      prisma.navMenu.count(),
      prisma.footerGroup.count(),
      prisma.footerLink.count(),
      prisma.friendLink.count(),
      prisma.socialMedia.count(),
      prisma.siteInfo.count(),
      prisma.aiConfig.count(),
      prisma.wordPressConfig.count(),
    ]);

    console.log('📊 数据统计:');
    console.log('─'.repeat(40));
    console.log(`  分类 (Category):        ${categoryCount}`);
    console.log(`  网站 (Website):         ${websiteCount}`);
    console.log(`  页面 (Page):            ${pageCount}`);
    console.log(`  Banner:                 ${bannerCount}`);
    console.log(`  热门推荐:               ${hotRecCount}`);
    console.log(`  导航菜单:               ${navMenuCount}`);
    console.log(`  页脚分组:               ${footerGroupCount}`);
    console.log(`  页脚链接:               ${footerLinkCount}`);
    console.log(`  友情链接:               ${friendLinkCount}`);
    console.log(`  社交媒体:               ${socialMediaCount}`);
    console.log(`  站点信息:               ${siteInfoCount}`);
    console.log(`  AI配置:                 ${aiConfigCount}`);
    console.log(`  WordPress配置:          ${wpConfigCount}`);
    console.log('─'.repeat(40));

    // 检查数据完整性
    const issues = [];

    if (categoryCount === 0) {
      issues.push('⚠️  分类数据为空');
    }
    if (websiteCount === 0) {
      issues.push('⚠️  网站数据为空');
    }

    // 检查空分类（没有网站的分类）
    const emptyCategories = await prisma.category.count({
      where: {
        websites: { none: {} },
        children: { none: {} },
      },
    });
    if (emptyCategories > 0) {
      console.log(`\n📝 提示: 有 ${emptyCategories} 个空分类（无网站和子分类）`);
    }

    if (issues.length > 0) {
      console.log('\n⚠️  发现问题:');
      issues.forEach(issue => console.log(`  ${issue}`));
    } else {
      console.log('\n✅ 数据库完整性检查通过');
    }

    // 显示最近更新的数据
    const recentWebsite = await prisma.website.findFirst({
      orderBy: { updatedAt: 'desc' },
      select: { name: true, updatedAt: true },
    });
    const recentCategory = await prisma.category.findFirst({
      orderBy: { updatedAt: 'desc' },
      select: { name: true, updatedAt: true },
    });

    console.log('\n📅 最近更新:');
    if (recentWebsite) {
      console.log(`  网站: ${recentWebsite.name} (${recentWebsite.updatedAt.toLocaleString('zh-CN')})`);
    }
    if (recentCategory) {
      console.log(`  分类: ${recentCategory.name} (${recentCategory.updatedAt.toLocaleString('zh-CN')})`);
    }

  } catch (error) {
    console.error('❌ 检查失败:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkIntegrity();
