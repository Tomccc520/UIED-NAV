/**
 * @file seedHotRecommendations.js
 * @description 自动从数据库网站中生成热门推荐数据
 * 根据 isHot、isFeatured、clickCount 等字段选取热门网站
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * 为指定页面生成热门推荐
 * @param {string} pageSlug - 页面slug
 * @param {number} hotLimit - 热门推荐数量
 * @param {number} featuredLimit - 精选推荐数量
 */
async function seedHotRecommendationsForPage(pageSlug, hotLimit = 12, featuredLimit = 6) {
  console.log(`\n📌 正在为页面 "${pageSlug}" 生成热门推荐...`);
  
  // 获取页面关联的分类
  const page = await prisma.page.findUnique({
    where: { slug: pageSlug },
    include: {
      pageCategories: {
        where: { visible: true },
        include: {
          category: true
        }
      }
    }
  });
  
  if (!page) {
    console.log(`  ⚠️ 页面 "${pageSlug}" 不存在，跳过`);
    return;
  }
  
  const categoryIds = page.pageCategories.map(pc => pc.categoryId);
  
  if (categoryIds.length === 0) {
    console.log(`  ⚠️ 页面 "${pageSlug}" 没有关联分类，跳过`);
    return;
  }
  
  // 获取所有子分类ID
  const allCategoryIds = [...categoryIds];
  const childCategories = await prisma.category.findMany({
    where: { parentId: { in: categoryIds } },
    select: { id: true }
  });
  allCategoryIds.push(...childCategories.map(c => c.id));
  
  // 获取热门网站 (isHot = true 或 clickCount 最高)
  const hotWebsites = await prisma.website.findMany({
    where: {
      categoryId: { in: allCategoryIds },
      OR: [
        { isHot: true },
        { clickCount: { gt: 0 } }
      ]
    },
    orderBy: [
      { isHot: 'desc' },
      { clickCount: 'desc' },
      { order: 'asc' }
    ],
    take: hotLimit
  });
  
  // 如果热门网站不够，补充普通网站
  if (hotWebsites.length < hotLimit) {
    const existingIds = hotWebsites.map(w => w.id);
    const moreWebsites = await prisma.website.findMany({
      where: {
        categoryId: { in: allCategoryIds },
        id: { notIn: existingIds }
      },
      orderBy: [
        { order: 'asc' },
        { createdAt: 'desc' }
      ],
      take: hotLimit - hotWebsites.length
    });
    hotWebsites.push(...moreWebsites);
  }
  
  // 获取精选网站 (isFeatured = true)
  const featuredWebsites = await prisma.website.findMany({
    where: {
      categoryId: { in: allCategoryIds },
      isFeatured: true,
      id: { notIn: hotWebsites.map(w => w.id) }
    },
    orderBy: [
      { order: 'asc' },
      { clickCount: 'desc' }
    ],
    take: featuredLimit
  });
  
  // 如果精选网站不够，补充其他网站
  if (featuredWebsites.length < featuredLimit) {
    const existingIds = [...hotWebsites.map(w => w.id), ...featuredWebsites.map(w => w.id)];
    const moreWebsites = await prisma.website.findMany({
      where: {
        categoryId: { in: allCategoryIds },
        id: { notIn: existingIds }
      },
      orderBy: [
        { isNew: 'desc' },
        { order: 'asc' }
      ],
      take: featuredLimit - featuredWebsites.length
    });
    featuredWebsites.push(...moreWebsites);
  }
  
  // 删除该页面现有的热门推荐
  await prisma.hotRecommendation.deleteMany({
    where: { pageSlug }
  });
  
  // 创建热门推荐
  let order = 0;
  for (const website of hotWebsites) {
    await prisma.hotRecommendation.create({
      data: {
        name: website.name,
        description: website.description,
        url: website.url,
        iconUrl: website.iconUrl,
        pageSlug,
        position: 'hot',
        order: order++,
        visible: true
      }
    });
  }
  console.log(`  ✅ 添加了 ${hotWebsites.length} 个热门推荐`);
  
  // 创建精选推荐
  order = 0;
  for (const website of featuredWebsites) {
    await prisma.hotRecommendation.create({
      data: {
        name: website.name,
        description: website.description,
        url: website.url,
        iconUrl: website.iconUrl,
        pageSlug,
        position: 'featured',
        order: order++,
        visible: true
      }
    });
  }
  console.log(`  ✅ 添加了 ${featuredWebsites.length} 个精选推荐`);
}

/**
 * 为所有页面生成热门推荐
 */
async function seedAllHotRecommendations() {
  console.log('🚀 开始生成热门推荐数据...\n');
  
  // 获取所有可见页面
  const pages = await prisma.page.findMany({
    where: { visible: true },
    orderBy: { order: 'asc' }
  });
  
  console.log(`📋 找到 ${pages.length} 个页面`);
  
  for (const page of pages) {
    await seedHotRecommendationsForPage(page.slug);
  }
  
  // 统计结果
  const totalHot = await prisma.hotRecommendation.count({
    where: { position: 'hot' }
  });
  const totalFeatured = await prisma.hotRecommendation.count({
    where: { position: 'featured' }
  });
  
  console.log('\n✨ 热门推荐数据生成完成！');
  console.log(`   热门推荐总数: ${totalHot}`);
  console.log(`   精选推荐总数: ${totalFeatured}`);
}

// 执行
seedAllHotRecommendations()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
