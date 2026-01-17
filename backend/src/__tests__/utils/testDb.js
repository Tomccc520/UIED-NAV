/**
 * @file testDb.js
 * @description 后端API服务
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

/**
 * Test Database Utilities
 * Provides setup, teardown, and seeding functions for test isolation
 */
import { PrismaClient } from '@prisma/client';

// 确保测试使用独立的测试数据库
const testDatabaseUrl = process.env.DATABASE_URL || 'file:./test.db';
console.log('🔧 Test database URL:', testDatabaseUrl);

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: testDatabaseUrl,
    },
  },
});

/**
 * Clean all test data from the database
 * Order matters due to foreign key constraints
 */
export async function cleanDatabase() {
  const tablesToClean = [
    'SearchLog',
    'OperationLog',
    'WebsiteSubmission',
    'MonitorLog',
    'Website',
    'PageCategory',
    'Page',
    'Category',
    'Banner',
    'HotRecommendation',
    'SocialMedia',
    'FooterLink',
    'FooterGroup',
    'NavMenu',
    'FriendLink',
    'SiteInfo',
    'AiConfig',
    'WordPressConfig',
    'MonitorConfig',
    'MonitorResult',
  ];

  for (const table of tablesToClean) {
    try {
      await prisma.$executeRawUnsafe(`DELETE FROM "${table}"`);
    } catch (error) {
      // Table might not exist, ignore
    }
  }
}

/**
 * Setup test environment
 */
export async function setupTestDb() {
  await cleanDatabase();
}

/**
 * Teardown test environment
 */
export async function teardownTestDb() {
  await cleanDatabase();
  await prisma.$disconnect();
}

/**
 * Create a test category
 */
export async function createTestCategory(data = {}) {
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 8);
  const defaultData = {
    name: `Test Category ${timestamp}`,
    slug: `test-category-${timestamp}-${random}`,
    icon: 'folder',
    color: '#3B82F6',
    order: 0,
    visible: true,
  };
  
  return prisma.category.create({
    data: { ...defaultData, ...data },
  });
}

/**
 * Create a test website
 */
export async function createTestWebsite(data = {}) {
  const timestamp = Date.now();
  
  // If no categoryId provided, create a category first
  let categoryId = data.categoryId;
  if (!categoryId) {
    const category = await createTestCategory();
    categoryId = category.id;
  }
  
  const defaultData = {
    name: `Test Website ${timestamp}`,
    url: `https://test-${timestamp}.example.com`,
    description: 'Test website description',
    tags: '[]',
    categoryId,
    order: 0,
  };
  
  return prisma.website.create({
    data: { ...defaultData, ...data },
  });
}

/**
 * Create a test page
 */
export async function createTestPage(data = {}) {
  const defaultData = {
    name: `Test Page ${Date.now()}`,
    slug: `test-page-${Date.now()}`,
    type: 'navigation',
    order: 0,
    visible: true,
  };
  
  return prisma.page.create({
    data: { ...defaultData, ...data },
  });
}

/**
 * Create a test banner
 */
export async function createTestBanner(data = {}) {
  const defaultData = {
    title: `Test Banner ${Date.now()}`,
    imageUrl: `https://test-${Date.now()}.example.com/banner.jpg`,
    position: 'top',
    visible: true,
    order: 0,
  };
  
  return prisma.banner.create({
    data: { ...defaultData, ...data },
  });
}

/**
 * Create a test submission
 */
export async function createTestSubmission(data = {}) {
  const defaultData = {
    name: `Test Submission ${Date.now()}`,
    url: `https://submission-${Date.now()}.example.com`,
    status: 'pending',
  };
  
  return prisma.websiteSubmission.create({
    data: { ...defaultData, ...data },
  });
}

/**
 * Create a test hot recommendation
 */
export async function createTestHotRecommendation(data = {}) {
  const defaultData = {
    title: `Test Recommendation ${Date.now()}`,
    linkUrl: `https://rec-${Date.now()}.example.com`,
    position: 'hero',
    visible: true,
    order: 0,
  };
  
  return prisma.hotRecommendation.create({
    data: { ...defaultData, ...data },
  });
}

/**
 * Create a test social media
 */
export async function createTestSocialMedia(data = {}) {
  const defaultData = {
    platform: 'github',
    name: `Test Social ${Date.now()}`,
    url: `https://github.com/test-${Date.now()}`,
    order: 0,
  };
  
  return prisma.socialMedia.create({
    data: { ...defaultData, ...data },
  });
}

/**
 * Create a test navigation menu
 */
export async function createTestNavMenu(data = {}) {
  const defaultData = {
    name: `Test Menu ${Date.now()}`,
    url: `https://menu-${Date.now()}.example.com`,
    visible: true,
    order: 0,
  };
  
  return prisma.navMenu.create({
    data: { ...defaultData, ...data },
  });
}

/**
 * Create test site info
 */
export async function createTestSiteInfo(data = {}) {
  const defaultData = {
    siteName: 'Test Site',
    siteTitle: 'Test Site Title',
    description: 'Test site description',
    keywords: 'test, keywords',
  };
  
  // First delete existing site info
  await prisma.siteInfo.deleteMany();
  
  return prisma.siteInfo.create({
    data: { ...defaultData, ...data },
  });
}

/**
 * Seed database with test data
 */
export async function seedTestData() {
  // Create categories with required fields
  const category1 = await createTestCategory({ 
    name: 'Design Tools', 
    slug: 'design-tools',
    icon: 'palette',
    color: '#8B5CF6'
  });
  const category2 = await createTestCategory({ 
    name: 'Development', 
    slug: 'development',
    icon: 'code',
    color: '#10B981'
  });
  const subCategory = await createTestCategory({ 
    name: 'UI Design', 
    slug: 'ui-design',
    icon: 'layout',
    color: '#F59E0B',
    parentId: category1.id 
  });

  // Create websites with required fields
  const website1 = await createTestWebsite({
    name: 'Figma',
    url: 'https://figma.com',
    description: 'Collaborative design tool',
    tags: '["design", "ui", "collaboration"]',
    categoryId: subCategory.id,
    isHot: true,
  });
  const website2 = await createTestWebsite({
    name: 'GitHub',
    url: 'https://github.com',
    description: 'Code hosting platform',
    tags: '["code", "git", "collaboration"]',
    categoryId: category2.id,
    isFeatured: true,
  });

  // Create page
  const page = await createTestPage({
    name: 'Design',
    slug: 'design',
  });

  // Link page to category
  await prisma.pageCategory.create({
    data: {
      pageId: page.id,
      categoryId: category1.id,
      order: 0,
      visible: true,
    },
  });

  // Create banner
  const banner = await createTestBanner({
    title: 'Welcome Banner',
    visible: true,
  });

  // Create site info
  const siteInfo = await createTestSiteInfo();

  return {
    categories: [category1, category2, subCategory],
    websites: [website1, website2],
    page,
    banner,
    siteInfo,
  };
}

export { prisma };
