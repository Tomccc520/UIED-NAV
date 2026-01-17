/**
 * @file associations.test.js
 * @description 后端API服务
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

/**
 * Website-Category Association Tests
 * Tests for website-category relationships
 * 
 * **Feature: functional-testing**
 * **Validates: Requirements 3.1, 3.2, 3.3**
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

describe('Website-Category Association', () => {
  beforeAll(async () => {
    await setupTestDb();
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  beforeEach(async () => {
    await cleanDatabase();
  });

  describe('Website Creation with Category', () => {
    it('should create website with category association', async () => {
      const category = await createTestCategory({ name: 'Test Cat', slug: 'test-cat' });
      
      const website = await prisma.website.create({
        data: {
          name: 'Test Website',
          url: 'https://test.com',
          description: 'A test website',
          tags: '[]',
          categoryId: category.id,
        },
        include: { category: true }
      });

      expect(website.categoryId).toBe(category.id);
      expect(website.category).not.toBeNull();
      expect(website.category.name).toBe('Test Cat');
    });

    it('should create website in subcategory', async () => {
      const parent = await createTestCategory({ name: 'Parent', slug: 'parent' });
      const child = await createTestCategory({ name: 'Child', slug: 'child', parentId: parent.id });
      
      const website = await prisma.website.create({
        data: {
          name: 'Subcategory Website',
          url: 'https://subcat.com',
          description: 'A subcategory website',
          tags: '[]',
          categoryId: child.id,
        },
        include: { category: { include: { parent: true } } }
      });

      expect(website.categoryId).toBe(child.id);
      expect(website.category.parentId).toBe(parent.id);
      expect(website.category.parent.name).toBe('Parent');
    });
  });

  describe('Filtering Websites by Category', () => {
    it('should filter websites by category ID', async () => {
      const cat1 = await createTestCategory({ name: 'Category 1', slug: 'cat-1' });
      const cat2 = await createTestCategory({ name: 'Category 2', slug: 'cat-2' });
      
      await createTestWebsite({ name: 'Site 1', url: 'https://site1.com', categoryId: cat1.id });
      await createTestWebsite({ name: 'Site 2', url: 'https://site2.com', categoryId: cat1.id });
      await createTestWebsite({ name: 'Site 3', url: 'https://site3.com', categoryId: cat2.id });

      const cat1Websites = await prisma.website.findMany({
        where: { categoryId: cat1.id }
      });

      expect(cat1Websites).toHaveLength(2);
      cat1Websites.forEach(w => {
        expect(w.categoryId).toBe(cat1.id);
      });
    });

    it('should filter websites by subcategory', async () => {
      const parent = await createTestCategory({ name: 'Parent', slug: 'parent-filter' });
      const sub1 = await createTestCategory({ name: 'Sub 1', slug: 'sub-1', parentId: parent.id });
      const sub2 = await createTestCategory({ name: 'Sub 2', slug: 'sub-2', parentId: parent.id });
      
      await createTestWebsite({ name: 'Sub1 Site', url: 'https://sub1.com', categoryId: sub1.id });
      await createTestWebsite({ name: 'Sub2 Site', url: 'https://sub2.com', categoryId: sub2.id });

      const sub1Websites = await prisma.website.findMany({
        where: { categoryId: sub1.id }
      });

      expect(sub1Websites).toHaveLength(1);
      expect(sub1Websites[0].name).toBe('Sub1 Site');
    });

    it('should get all websites in parent and subcategories', async () => {
      const parent = await createTestCategory({ name: 'Parent', slug: 'parent-all' });
      const sub1 = await createTestCategory({ name: 'Sub 1', slug: 'sub-1-all', parentId: parent.id });
      const sub2 = await createTestCategory({ name: 'Sub 2', slug: 'sub-2-all', parentId: parent.id });
      
      await createTestWebsite({ name: 'Parent Site', url: 'https://parent.com', categoryId: parent.id });
      await createTestWebsite({ name: 'Sub1 Site', url: 'https://sub1-all.com', categoryId: sub1.id });
      await createTestWebsite({ name: 'Sub2 Site', url: 'https://sub2-all.com', categoryId: sub2.id });

      // Get all category IDs (parent + children)
      const categoryIds = [parent.id, sub1.id, sub2.id];
      
      const allWebsites = await prisma.website.findMany({
        where: { categoryId: { in: categoryIds } }
      });

      expect(allWebsites).toHaveLength(3);
    });
  });

  describe('Moving Website Between Categories', () => {
    it('should move website to different category', async () => {
      const cat1 = await createTestCategory({ name: 'Category 1', slug: 'cat-move-1' });
      const cat2 = await createTestCategory({ name: 'Category 2', slug: 'cat-move-2' });
      
      const website = await createTestWebsite({ 
        name: 'Moving Site', 
        url: 'https://moving.com', 
        categoryId: cat1.id 
      });

      expect(website.categoryId).toBe(cat1.id);

      // Move to cat2
      const moved = await prisma.website.update({
        where: { id: website.id },
        data: { categoryId: cat2.id }
      });

      expect(moved.categoryId).toBe(cat2.id);

      // Verify cat1 no longer has the website
      const cat1Websites = await prisma.website.findMany({
        where: { categoryId: cat1.id }
      });
      expect(cat1Websites).toHaveLength(0);

      // Verify cat2 has the website
      const cat2Websites = await prisma.website.findMany({
        where: { categoryId: cat2.id }
      });
      expect(cat2Websites).toHaveLength(1);
      expect(cat2Websites[0].id).toBe(website.id);
    });

    it('should update website category association', async () => {
      const cat1 = await createTestCategory({ name: 'Category 1', slug: 'cat-update-1' });
      const cat2 = await createTestCategory({ name: 'Category 2', slug: 'cat-update-2' });
      
      const website = await createTestWebsite({ 
        name: 'Update Site', 
        url: 'https://update.com', 
        categoryId: cat1.id 
      });

      // Update to cat2
      const updated = await prisma.website.update({
        where: { id: website.id },
        data: { categoryId: cat2.id }
      });

      expect(updated.categoryId).toBe(cat2.id);
      
      // Verify the change persisted
      const fetched = await prisma.website.findUnique({
        where: { id: website.id },
        include: { category: true }
      });
      
      expect(fetched.category.name).toBe('Category 2');
    });
  });

  describe('Category with Websites Count', () => {
    it('should count websites in category', async () => {
      const category = await createTestCategory({ name: 'Count Cat', slug: 'count-cat' });
      
      await createTestWebsite({ name: 'Site 1', url: 'https://count1.com', categoryId: category.id });
      await createTestWebsite({ name: 'Site 2', url: 'https://count2.com', categoryId: category.id });
      await createTestWebsite({ name: 'Site 3', url: 'https://count3.com', categoryId: category.id });

      const result = await prisma.category.findUnique({
        where: { id: category.id },
        include: { _count: { select: { websites: true } } }
      });

      expect(result._count.websites).toBe(3);
    });

    it('should count websites in subcategories', async () => {
      const parent = await createTestCategory({ name: 'Parent', slug: 'parent-count' });
      const sub1 = await createTestCategory({ name: 'Sub 1', slug: 'sub-1-count', parentId: parent.id });
      const sub2 = await createTestCategory({ name: 'Sub 2', slug: 'sub-2-count', parentId: parent.id });
      
      await createTestWebsite({ name: 'Sub1 Site 1', url: 'https://sub1-1.com', categoryId: sub1.id });
      await createTestWebsite({ name: 'Sub1 Site 2', url: 'https://sub1-2.com', categoryId: sub1.id });
      await createTestWebsite({ name: 'Sub2 Site 1', url: 'https://sub2-1.com', categoryId: sub2.id });

      const parentWithChildren = await prisma.category.findUnique({
        where: { id: parent.id },
        include: {
          _count: { select: { websites: true } },
          children: {
            include: { _count: { select: { websites: true } } }
          }
        }
      });

      // Parent has 0 direct websites
      expect(parentWithChildren._count.websites).toBe(0);
      
      // Check children counts - find by id since slug might not be unique across tests
      const sub1Result = parentWithChildren.children.find(c => c.id === sub1.id);
      const sub2Result = parentWithChildren.children.find(c => c.id === sub2.id);
      
      expect(sub1Result).toBeDefined();
      expect(sub2Result).toBeDefined();
      expect(sub1Result._count.websites).toBe(2);
      expect(sub2Result._count.websites).toBe(1);
    });
  });
});
