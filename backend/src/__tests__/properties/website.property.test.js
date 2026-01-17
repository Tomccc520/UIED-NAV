/**
 * @file website.property.test.js
 * @description 后端API服务
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

/**
 * Website Property Tests
 * Property-based tests for website functionality
 * 
 * **Feature: functional-testing**
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { 
  prisma, 
  setupTestDb, 
  teardownTestDb, 
  createTestCategory,
  cleanDatabase 
} from '../utils/testDb.js';
import { 
  validWebsiteArb, 
  invalidWebsiteArb,
  paginationArb,
  websiteNameArb,
  validUrlArb
} from '../utils/generators.js';

describe('Website Property Tests', () => {
  beforeAll(async () => {
    await setupTestDb();
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  beforeEach(async () => {
    await cleanDatabase();
  });

  /**
   * **Property 1: Website Creation Returns Valid Data**
   * *For any* valid website data (with name and URL), when creating a website,
   * the response SHALL contain the created website with a valid ID and all provided fields preserved.
   * 
   * **Validates: Requirements 1.1, 1.5**
   */
  it('Property 1: Website creation returns valid data with ID and preserved fields', async () => {
    // Create a category for testing
    const category = await createTestCategory({ name: 'Test Category', slug: 'test-cat-prop1' });

    await fc.assert(
      fc.asyncProperty(
        websiteNameArb,
        validUrlArb,
        async (name, url) => {
          // Clean up before each iteration
          await prisma.website.deleteMany({
            where: { url: { contains: url.replace(/^https?:\/\//, '').slice(0, 20) } }
          });

          const websiteData = {
            name,
            url,
            description: 'Test description',
            tags: '[]',
            categoryId: category.id,
          };

          const created = await prisma.website.create({
            data: websiteData
          });

          // Verify ID is assigned
          expect(created.id).toBeDefined();
          expect(typeof created.id).toBe('string');
          expect(created.id.length).toBeGreaterThan(0);

          // Verify fields are preserved
          expect(created.name).toBe(name);
          expect(created.url).toBe(url);
          expect(created.description).toBe('Test description');

          // Clean up
          await prisma.website.delete({ where: { id: created.id } });
        }
      ),
      { numRuns: 20 } // Reduced for faster testing
    );

    // Clean up category
    await prisma.category.delete({ where: { id: category.id } });
  });

  /**
   * **Property 2: Website-Category Association Integrity**
   * *For any* website created with a valid categoryId, the website's category reference
   * SHALL match the provided categoryId, and fetching websites by that categoryId
   * SHALL include the created website.
   * 
   * **Validates: Requirements 1.2, 3.1, 3.2**
   */
  it('Property 2: Website-category association integrity', async () => {
    // Create a category for testing
    const category = await createTestCategory({ name: 'Test Category', slug: 'test-cat-prop2' });

    await fc.assert(
      fc.asyncProperty(
        websiteNameArb,
        async (name) => {
          const url = `https://test-${Date.now()}-${Math.random().toString(36).slice(2)}.com`;
          
          const created = await prisma.website.create({
            data: {
              name,
              url,
              description: 'Test description',
              tags: '[]',
              categoryId: category.id,
            }
          });

          // Verify category reference matches
          expect(created.categoryId).toBe(category.id);

          // Verify website appears in category filter
          const filtered = await prisma.website.findMany({
            where: { categoryId: category.id }
          });
          
          const found = filtered.find(w => w.id === created.id);
          expect(found).toBeDefined();

          // Clean up
          await prisma.website.delete({ where: { id: created.id } });
        }
      ),
      { numRuns: 10 }
    );

    // Clean up category
    await prisma.category.delete({ where: { id: category.id } });
  });

  /**
   * **Property 3: Required Field Validation**
   * *For any* website creation request missing required fields (name or URL),
   * the operation SHALL fail.
   * 
   * **Validates: Requirements 1.4**
   */
  it('Property 3: Required field validation rejects invalid data', async () => {
    // Test missing name
    await expect(
      prisma.website.create({
        data: {
          url: 'https://test.com',
        }
      })
    ).rejects.toThrow();

    // Test missing URL
    await expect(
      prisma.website.create({
        data: {
          name: 'Test Website',
        }
      })
    ).rejects.toThrow();
  });

  /**
   * **Property 7: Pagination Consistency**
   * *For any* paginated request, the response SHALL contain correct pagination
   * and the number of items SHALL not exceed pageSize.
   * 
   * **Validates: Requirements 6.1**
   */
  it('Property 7: Pagination consistency', async () => {
    // Create a category for testing
    const category = await createTestCategory({ name: 'Pagination Category', slug: 'pagination-cat' });

    // Create 15 websites for pagination testing
    for (let i = 0; i < 15; i++) {
      await prisma.website.create({
        data: {
          name: `Website ${i}`,
          url: `https://site${i}-${Date.now()}.com`,
          description: `Test website ${i}`,
          tags: '[]',
          categoryId: category.id,
          order: i,
        }
      });
    }

    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 10 }), // page
        fc.integer({ min: 1, max: 10 }), // pageSize
        async (page, pageSize) => {
          const skip = (page - 1) * pageSize;
          
          const results = await prisma.website.findMany({
            skip,
            take: pageSize,
            orderBy: { order: 'asc' }
          });

          const total = await prisma.website.count();

          // Number of items should not exceed pageSize
          expect(results.length).toBeLessThanOrEqual(pageSize);

          // If not on last page, should have exactly pageSize items
          if (skip + pageSize <= total) {
            expect(results.length).toBe(pageSize);
          }

          // Results should be in correct order
          for (let i = 1; i < results.length; i++) {
            expect(results[i].order).toBeGreaterThanOrEqual(results[i - 1].order);
          }
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * **Property 6: Website Filtering by Category**
   * *For any* set of websites distributed across multiple categories,
   * filtering by a specific categoryId SHALL return only websites belonging to that category.
   * 
   * **Validates: Requirements 3.2, 3.3**
   */
  it('Property 6: Website filtering by category returns only matching websites', async () => {
    // Create two categories
    const cat1 = await createTestCategory({ name: 'Category 1', slug: 'cat-1-filter' });
    const cat2 = await createTestCategory({ name: 'Category 2', slug: 'cat-2-filter' });

    // Create websites in each category
    const website1 = await prisma.website.create({
      data: { name: 'Site 1', url: 'https://site1-filter.com', description: 'Test site 1', tags: '[]', categoryId: cat1.id }
    });
    const website2 = await prisma.website.create({
      data: { name: 'Site 2', url: 'https://site2-filter.com', description: 'Test site 2', tags: '[]', categoryId: cat1.id }
    });
    const website3 = await prisma.website.create({
      data: { name: 'Site 3', url: 'https://site3-filter.com', description: 'Test site 3', tags: '[]', categoryId: cat2.id }
    });

    // Filter by cat1
    const cat1Websites = await prisma.website.findMany({
      where: { categoryId: cat1.id }
    });

    // All results should belong to cat1
    expect(cat1Websites.length).toBe(2);
    cat1Websites.forEach(w => {
      expect(w.categoryId).toBe(cat1.id);
    });

    // Filter by cat2
    const cat2Websites = await prisma.website.findMany({
      where: { categoryId: cat2.id }
    });

    // All results should belong to cat2
    expect(cat2Websites.length).toBe(1);
    expect(cat2Websites[0].categoryId).toBe(cat2.id);

    // Clean up
    await prisma.website.deleteMany({
      where: { id: { in: [website1.id, website2.id, website3.id] } }
    });
    await prisma.category.deleteMany({
      where: { id: { in: [cat1.id, cat2.id] } }
    });
  });
});
