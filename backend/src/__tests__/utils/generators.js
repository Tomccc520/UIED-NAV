/**
 * @file generators.js
 * @description 后端API服务
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

/**
 * Test Data Generators using fast-check
 * Provides arbitrary generators for property-based testing
 */
import * as fc from 'fast-check';

// ==================== Website Generators ====================

/**
 * Generate a valid website URL
 */
export const validUrlArb = fc.webUrl({ withPath: true });

/**
 * Generate a valid website name (1-100 characters)
 */
export const websiteNameArb = fc.string({ minLength: 1, maxLength: 100 })
  .filter(s => s.trim().length > 0);

/**
 * Generate a valid website description (0-500 characters)
 */
export const websiteDescriptionArb = fc.string({ maxLength: 500 });

/**
 * Generate valid tags array
 */
export const tagsArb = fc.array(
  fc.string({ minLength: 1, maxLength: 30 }).filter(s => s.trim().length > 0),
  { maxLength: 10 }
);

/**
 * Generate a valid website object for creation
 */
export const validWebsiteArb = fc.record({
  name: websiteNameArb,
  url: validUrlArb,
  description: fc.option(websiteDescriptionArb, { nil: undefined }),
  iconUrl: fc.option(validUrlArb, { nil: undefined }),
  tags: fc.option(tagsArb, { nil: undefined }),
  isNew: fc.boolean(),
  isFeatured: fc.boolean(),
  isHot: fc.boolean(),
  order: fc.integer({ min: 0, max: 1000 }),
});

/**
 * Generate an invalid website object (missing required fields)
 */
export const invalidWebsiteArb = fc.oneof(
  // Missing name
  fc.record({
    url: validUrlArb,
    description: fc.option(websiteDescriptionArb, { nil: undefined }),
  }),
  // Missing URL
  fc.record({
    name: websiteNameArb,
    description: fc.option(websiteDescriptionArb, { nil: undefined }),
  }),
  // Empty name
  fc.record({
    name: fc.constant(''),
    url: validUrlArb,
  }),
  // Empty URL
  fc.record({
    name: websiteNameArb,
    url: fc.constant(''),
  })
);

// ==================== Category Generators ====================

/**
 * Generate a valid category slug (URL-friendly)
 */
export const categorySlugArb = fc.string({ minLength: 1, maxLength: 50 })
  .map(s => s.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').slice(0, 50))
  .filter(s => s.length > 0 && s !== '-');

/**
 * Generate a valid category name
 */
export const categoryNameArb = fc.string({ minLength: 1, maxLength: 50 })
  .filter(s => s.trim().length > 0);

/**
 * Generate a valid hex color string
 */
const hexColorArb = fc.stringOf(
  fc.constantFrom('0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f'),
  { minLength: 6, maxLength: 6 }
).map(s => `#${s}`);

/**
 * Generate a valid category object for creation
 */
export const validCategoryArb = fc.record({
  name: categoryNameArb,
  slug: categorySlugArb,
  description: fc.option(fc.string({ maxLength: 200 }), { nil: undefined }),
  icon: fc.option(fc.string({ maxLength: 50 }), { nil: undefined }),
  color: fc.option(hexColorArb, { nil: undefined }),
  order: fc.integer({ min: 0, max: 100 }),
  visible: fc.boolean(),
});

/**
 * Generate an invalid category object
 */
export const invalidCategoryArb = fc.oneof(
  // Missing name
  fc.record({
    slug: categorySlugArb,
  }),
  // Missing slug
  fc.record({
    name: categoryNameArb,
  }),
  // Empty name
  fc.record({
    name: fc.constant(''),
    slug: categorySlugArb,
  }),
  // Empty slug
  fc.record({
    name: categoryNameArb,
    slug: fc.constant(''),
  })
);

// ==================== Banner Generators ====================

/**
 * Generate a valid banner object
 */
export const validBannerArb = fc.record({
  title: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
  imageUrl: validUrlArb,
  linkUrl: fc.option(validUrlArb, { nil: undefined }),
  position: fc.constantFrom('top', 'sidebar', 'bottom'),
  visible: fc.boolean(),
  order: fc.integer({ min: 0, max: 100 }),
});

// ==================== Submission Generators ====================

/**
 * Generate a valid website submission
 */
export const validSubmissionArb = fc.record({
  name: websiteNameArb,
  url: validUrlArb,
  description: fc.option(websiteDescriptionArb, { nil: undefined }),
  iconUrl: fc.option(validUrlArb, { nil: undefined }),
  tags: fc.option(fc.string({ maxLength: 200 }), { nil: undefined }),
  submitterName: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
  submitterEmail: fc.option(fc.emailAddress(), { nil: undefined }),
});

// ==================== Auth Generators ====================

/**
 * Generate valid login credentials
 */
export const validCredentialsArb = fc.record({
  username: fc.string({ minLength: 3, maxLength: 20 }).filter(s => /^[a-zA-Z0-9_]+$/.test(s)),
  password: fc.string({ minLength: 6, maxLength: 50 }),
});

// ==================== Page Generators ====================

/**
 * Generate a valid page slug
 */
export const pageSlugArb = fc.string({ minLength: 1, maxLength: 30 })
  .map(s => s.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').slice(0, 30))
  .filter(s => s.length > 0 && s !== '-');

/**
 * Generate a valid page object
 */
export const validPageArb = fc.record({
  name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
  slug: pageSlugArb,
  type: fc.constantFrom('navigation', 'article', 'custom'),
  description: fc.option(fc.string({ maxLength: 200 }), { nil: undefined }),
  heroTitle: fc.option(fc.string({ maxLength: 100 }), { nil: undefined }),
  heroSubtitle: fc.option(fc.string({ maxLength: 200 }), { nil: undefined }),
  visible: fc.boolean(),
  order: fc.integer({ min: 0, max: 100 }),
});

// ==================== Hot Recommendation Generators ====================

/**
 * Generate a valid hot recommendation
 */
export const validHotRecommendationArb = fc.record({
  title: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
  description: fc.option(fc.string({ maxLength: 200 }), { nil: undefined }),
  imageUrl: fc.option(validUrlArb, { nil: undefined }),
  linkUrl: validUrlArb,
  position: fc.constantFrom('hero', 'sidebar', 'bottom'),
  visible: fc.boolean(),
  order: fc.integer({ min: 0, max: 100 }),
});

// ==================== Social Media Generators ====================

/**
 * Generate a valid social media configuration
 */
export const validSocialMediaArb = fc.record({
  platform: fc.constantFrom('wechat', 'weibo', 'twitter', 'github', 'bilibili', 'xiaohongshu'),
  name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
  url: validUrlArb,
  icon: fc.option(fc.string({ maxLength: 50 }), { nil: undefined }),
  order: fc.integer({ min: 0, max: 100 }),
});

// ==================== Navigation Menu Generators ====================

/**
 * Generate a valid navigation menu item
 */
export const validNavMenuArb = fc.record({
  name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
  url: fc.option(validUrlArb, { nil: undefined }),
  icon: fc.option(fc.string({ maxLength: 50 }), { nil: undefined }),
  visible: fc.boolean(),
  order: fc.integer({ min: 0, max: 100 }),
});

// ==================== Search Query Generators ====================

/**
 * Generate a valid search query
 */
export const searchQueryArb = fc.string({ minLength: 1, maxLength: 100 })
  .filter(s => s.trim().length > 0);

// ==================== Pagination Generators ====================

/**
 * Generate valid pagination parameters
 */
export const paginationArb = fc.record({
  page: fc.integer({ min: 1, max: 100 }),
  pageSize: fc.integer({ min: 1, max: 100 }),
});

// ==================== Date Range Generators ====================

/**
 * Generate a date in the past
 */
export const pastDateArb = fc.date({ min: new Date('2020-01-01'), max: new Date() });

/**
 * Generate a date in the future
 */
export const futureDateArb = fc.date({ min: new Date(), max: new Date('2030-12-31') });

/**
 * Generate a valid date range (start before end)
 */
export const dateRangeArb = fc.tuple(pastDateArb, futureDateArb)
  .map(([start, end]) => ({ startDate: start, endDate: end }));
