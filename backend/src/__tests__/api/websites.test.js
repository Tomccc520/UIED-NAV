/**
 * @file websites.test.js
 * @description 后端API服务
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

/**
 * Website API Tests
 * Tests for /api/websites endpoints
 * 
 * **Feature: functional-testing**
 * **Validates: Requirements 1.1, 1.2, 6.1**
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { 
  prisma, 
  setupTestDb, 
  teardownTestDb, 
  createTestCategory, 
  createTestWebsite,
  cleanDatabase 
} from '../utils/testDb.js';

describe('Website API', () => {
  beforeAll(async () => {
    await setupTestDb();
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  beforeEach(async () => {
    await cleanDatabase();
  });

  describe('GET /api/websites', () => {
    it('should return empty array when no websites exist', async () => {
      const websites = await prisma.website.findMany();
      expect(websites).toEqual([]);
    });

    it('should return all websites', async () => {
      // Create a shared category for both websites
      const category = await createTestCategory({ name: 'Shared Cat', slug: 'shared-cat' });
      
      // Create test websites with the same category
      await createTestWebsite({ name: 'Website 1', url: 'https://site1.com', categoryId: category.id });
      await createTestWebsite({ name: 'Website 2', url: 'https://site2.com', categoryId: category.id });

      const websites = await prisma.website.findMany();
      expect(websites).toHaveLength(2);
      expect(websites[0]).toHaveProperty('id');
      expect(websites[0]).toHaveProperty('name');
      expect(websites[0]).toHaveProperty('url');
    });

    it('should filter websites by category', async () => {
      const category = await createTestCategory({ name: 'Test Cat', slug: 'test-cat' });
      await createTestWebsite({ name: 'In Category', url: 'https://in-cat.com', categoryId: category.id });
      await createTestWebsite({ name: 'No Category', url: 'https://no-cat.com' });

      const filtered = await prisma.website.findMany({
        where: { categoryId: category.id }
      });
      
      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe('In Category');
    });

    it('should filter websites by featured flag', async () => {
      await createTestWebsite({ name: 'Featured', url: 'https://featured.com', isFeatured: true });
      await createTestWebsite({ name: 'Not Featured', url: 'https://not-featured.com', isFeatured: false });

      const featured = await prisma.website.findMany({
        where: { isFeatured: true }
      });
      
      expect(featured).toHaveLength(1);
      expect(featured[0].name).toBe('Featured');
    });

    it('should filter websites by hot flag', async () => {
      await createTestWebsite({ name: 'Hot', url: 'https://hot.com', isHot: true });
      await createTestWebsite({ name: 'Not Hot', url: 'https://not-hot.com', isHot: false });

      const hot = await prisma.website.findMany({
        where: { isHot: true }
      });
      
      expect(hot).toHaveLength(1);
      expect(hot[0].name).toBe('Hot');
    });

    it('should search websites by name', async () => {
      await createTestWebsite({ name: 'Figma Design', url: 'https://figma.com' });
      await createTestWebsite({ name: 'GitHub', url: 'https://github.com' });

      const results = await prisma.website.findMany({
        where: {
          OR: [
            { name: { contains: 'Figma' } },
            { description: { contains: 'Figma' } },
          ]
        }
      });
      
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Figma Design');
    });

    it('should support pagination', async () => {
      // Create a shared category for all websites
      const category = await createTestCategory({ name: 'Pagination Cat', slug: 'pagination-cat' });
      
      // Create 5 websites with explicit order
      for (let i = 1; i <= 5; i++) {
        await createTestWebsite({ 
          name: `Website ${i}`, 
          url: `https://site${i}.com`, 
          order: i,
          categoryId: category.id 
        });
      }

      const page1 = await prisma.website.findMany({
        skip: 0,
        take: 2,
        orderBy: { order: 'asc' }
      });
      
      const page2 = await prisma.website.findMany({
        skip: 2,
        take: 2,
        orderBy: { order: 'asc' }
      });

      expect(page1).toHaveLength(2);
      expect(page2).toHaveLength(2);
      expect(page1[0].name).toBe('Website 1');
      expect(page2[0].name).toBe('Website 3');
    });
  });

  describe('GET /api/websites/:id', () => {
    it('should return a single website by id', async () => {
      const created = await createTestWebsite({ name: 'Single Website', url: 'https://single.com' });

      const website = await prisma.website.findUnique({
        where: { id: created.id }
      });

      expect(website).not.toBeNull();
      expect(website.name).toBe('Single Website');
      expect(website.url).toBe('https://single.com');
    });

    it('should return null for non-existent id', async () => {
      const website = await prisma.website.findUnique({
        where: { id: 'non-existent-id' }
      });

      expect(website).toBeNull();
    });

    it('should include category when requested', async () => {
      const category = await createTestCategory({ name: 'Test Cat', slug: 'test-cat' });
      const created = await createTestWebsite({ 
        name: 'With Category', 
        url: 'https://with-cat.com',
        categoryId: category.id 
      });

      const website = await prisma.website.findUnique({
        where: { id: created.id },
        include: { category: true }
      });

      expect(website.category).not.toBeNull();
      expect(website.category.name).toBe('Test Cat');
    });
  });

  describe('POST /api/websites', () => {
    it('should create a website with valid data', async () => {
      const category = await createTestCategory({ name: 'Test Cat', slug: 'test-cat-create' });
      const websiteData = {
        name: 'New Website',
        url: 'https://new-website.com',
        description: 'A new test website',
        tags: '[]',
        categoryId: category.id,
      };

      const created = await prisma.website.create({
        data: websiteData
      });

      expect(created).toHaveProperty('id');
      expect(created.name).toBe('New Website');
      expect(created.url).toBe('https://new-website.com');
      expect(created.description).toBe('A new test website');
    });

    it('should create a website with category association', async () => {
      const category = await createTestCategory({ name: 'Test Cat', slug: 'test-cat-assoc' });
      
      const created = await prisma.website.create({
        data: {
          name: 'Categorized Website',
          url: 'https://categorized.com',
          description: 'A categorized website',
          tags: '[]',
          categoryId: category.id,
        },
        include: { category: true }
      });

      expect(created.categoryId).toBe(category.id);
      expect(created.category.name).toBe('Test Cat');
    });

    it('should create a website with tags', async () => {
      const category = await createTestCategory({ name: 'Test Cat', slug: 'test-cat-tags' });
      const created = await prisma.website.create({
        data: {
          name: 'Tagged Website',
          url: 'https://tagged.com',
          description: 'A tagged website',
          tags: JSON.stringify(['design', 'tools', 'ui']),
          categoryId: category.id,
        }
      });

      const tags = JSON.parse(created.tags);
      expect(tags).toContain('design');
      expect(tags).toContain('tools');
      expect(tags).toContain('ui');
    });

    it('should set default values for optional fields', async () => {
      const category = await createTestCategory({ name: 'Test Cat', slug: 'test-cat-defaults' });
      const created = await prisma.website.create({
        data: {
          name: 'Minimal Website',
          url: 'https://minimal.com',
          description: 'A minimal website',
          tags: '[]',
          categoryId: category.id,
        }
      });

      expect(created.isNew).toBe(false);
      expect(created.isFeatured).toBe(false);
      expect(created.isHot).toBe(false);
      expect(created.clickCount).toBe(0);
    });
  });

  describe('PUT /api/websites/:id', () => {
    it('should update a website', async () => {
      const created = await createTestWebsite({ name: 'Original', url: 'https://original.com' });

      const updated = await prisma.website.update({
        where: { id: created.id },
        data: { name: 'Updated Name', description: 'Updated description' }
      });

      expect(updated.name).toBe('Updated Name');
      expect(updated.description).toBe('Updated description');
      expect(updated.url).toBe('https://original.com'); // Unchanged
    });

    it('should update website category', async () => {
      const category1 = await createTestCategory({ name: 'Cat 1', slug: 'cat-1' });
      const category2 = await createTestCategory({ name: 'Cat 2', slug: 'cat-2' });
      const website = await createTestWebsite({ 
        name: 'Website', 
        url: 'https://website.com',
        categoryId: category1.id 
      });

      const updated = await prisma.website.update({
        where: { id: website.id },
        data: { categoryId: category2.id }
      });

      expect(updated.categoryId).toBe(category2.id);
    });
  });

  describe('DELETE /api/websites/:id', () => {
    it('should delete a website', async () => {
      const created = await createTestWebsite({ name: 'To Delete', url: 'https://delete.com' });

      await prisma.website.delete({
        where: { id: created.id }
      });

      const found = await prisma.website.findUnique({
        where: { id: created.id }
      });

      expect(found).toBeNull();
    });
  });

  describe('POST /api/websites/:id/click', () => {
    it('should increment click count', async () => {
      const created = await createTestWebsite({ name: 'Clickable', url: 'https://click.com' });
      expect(created.clickCount).toBe(0);

      const updated = await prisma.website.update({
        where: { id: created.id },
        data: { clickCount: { increment: 1 } }
      });

      expect(updated.clickCount).toBe(1);

      // Click again
      const updated2 = await prisma.website.update({
        where: { id: created.id },
        data: { clickCount: { increment: 1 } }
      });

      expect(updated2.clickCount).toBe(2);
    });
  });
});
