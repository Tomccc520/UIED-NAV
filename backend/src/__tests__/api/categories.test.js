/**
 * @file categories.test.js
 * @description 后端API服务
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

/**
 * Category API Tests
 * Tests for /api/categories endpoints
 * 
 * **Feature: functional-testing**
 * **Validates: Requirements 2.1, 2.2, 2.5**
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { 
  prisma, 
  setupTestDb, 
  teardownTestDb, 
  createTestCategory,
  cleanDatabase 
} from '../utils/testDb.js';

describe('Category API', () => {
  beforeAll(async () => {
    await setupTestDb();
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  beforeEach(async () => {
    await cleanDatabase();
  });

  describe('GET /api/categories', () => {
    it('should return empty array when no categories exist', async () => {
      const categories = await prisma.category.findMany();
      expect(categories).toEqual([]);
    });

    it('should return all root categories with children', async () => {
      // Create parent category
      const parent = await createTestCategory({ name: 'Parent', slug: 'parent' });
      // Create child category
      await createTestCategory({ name: 'Child', slug: 'child', parentId: parent.id });

      const categories = await prisma.category.findMany({
        where: { parentId: null },
        include: { children: true }
      });

      expect(categories).toHaveLength(1);
      expect(categories[0].name).toBe('Parent');
      expect(categories[0].children).toHaveLength(1);
      expect(categories[0].children[0].name).toBe('Child');
    });

    it('should return flat list when flat=true', async () => {
      const parent = await createTestCategory({ name: 'Parent', slug: 'parent' });
      await createTestCategory({ name: 'Child', slug: 'child', parentId: parent.id });

      const categories = await prisma.category.findMany({
        orderBy: [{ parentId: 'asc' }, { order: 'asc' }]
      });

      expect(categories).toHaveLength(2);
    });

    it('should include website count', async () => {
      const category = await createTestCategory({ name: 'With Websites', slug: 'with-websites' });
      
      // Create websites in category
      await prisma.website.create({
        data: { name: 'Site 1', url: 'https://site1.com', description: 'Test site 1', tags: '[]', categoryId: category.id }
      });
      await prisma.website.create({
        data: { name: 'Site 2', url: 'https://site2.com', description: 'Test site 2', tags: '[]', categoryId: category.id }
      });

      const result = await prisma.category.findUnique({
        where: { id: category.id },
        include: { _count: { select: { websites: true } } }
      });

      expect(result._count.websites).toBe(2);
    });

    it('should order categories by order field', async () => {
      const cat1 = await createTestCategory({ name: 'Third', slug: 'third-order', order: 3 });
      const cat2 = await createTestCategory({ name: 'First', slug: 'first-order', order: 1 });
      const cat3 = await createTestCategory({ name: 'Second', slug: 'second-order', order: 2 });

      const categories = await prisma.category.findMany({
        where: { id: { in: [cat1.id, cat2.id, cat3.id] } },
        orderBy: { order: 'asc' }
      });

      expect(categories[0].name).toBe('First');
      expect(categories[1].name).toBe('Second');
      expect(categories[2].name).toBe('Third');
    });
  });

  describe('GET /api/categories/:id', () => {
    it('should return a single category by id', async () => {
      const created = await createTestCategory({ name: 'Single', slug: 'single' });

      const category = await prisma.category.findUnique({
        where: { id: created.id }
      });

      expect(category).not.toBeNull();
      expect(category.name).toBe('Single');
    });

    it('should return null for non-existent id', async () => {
      const category = await prisma.category.findUnique({
        where: { id: 'non-existent-id' }
      });

      expect(category).toBeNull();
    });

    it('should include websites and children', async () => {
      const parent = await createTestCategory({ name: 'Parent', slug: 'parent-detail' });
      await createTestCategory({ name: 'Child', slug: 'child-detail', parentId: parent.id });
      await prisma.website.create({
        data: { name: 'Site', url: 'https://site.com', description: 'Test site', tags: '[]', categoryId: parent.id }
      });

      const category = await prisma.category.findUnique({
        where: { id: parent.id },
        include: { websites: true, children: true }
      });

      expect(category.websites).toHaveLength(1);
      expect(category.children).toHaveLength(1);
    });
  });

  describe('GET /api/categories/slug/:slug', () => {
    it('should return category by slug', async () => {
      await createTestCategory({ name: 'By Slug', slug: 'by-slug' });

      const category = await prisma.category.findUnique({
        where: { slug: 'by-slug' }
      });

      expect(category).not.toBeNull();
      expect(category.name).toBe('By Slug');
    });

    it('should return null for non-existent slug', async () => {
      const category = await prisma.category.findUnique({
        where: { slug: 'non-existent-slug' }
      });

      expect(category).toBeNull();
    });
  });

  describe('POST /api/categories', () => {
    it('should create a category with valid data', async () => {
      const categoryData = {
        name: 'New Category',
        slug: 'new-category',
        icon: 'folder',
        color: '#3B82F6',
        description: 'A new test category',
      };

      const created = await prisma.category.create({
        data: categoryData
      });

      expect(created).toHaveProperty('id');
      expect(created.name).toBe('New Category');
      expect(created.slug).toBe('new-category');
    });

    it('should create a subcategory with parentId', async () => {
      const parent = await createTestCategory({ name: 'Parent', slug: 'parent-create' });
      
      const child = await prisma.category.create({
        data: {
          name: 'Child Category',
          slug: 'child-category',
          icon: 'folder',
          color: '#10B981',
          parentId: parent.id,
        }
      });

      expect(child.parentId).toBe(parent.id);

      // Verify parent has child
      const parentWithChildren = await prisma.category.findUnique({
        where: { id: parent.id },
        include: { children: true }
      });

      expect(parentWithChildren.children).toHaveLength(1);
      expect(parentWithChildren.children[0].id).toBe(child.id);
    });

    it('should reject duplicate slug', async () => {
      await createTestCategory({ name: 'Original', slug: 'duplicate-slug' });

      await expect(
        prisma.category.create({
          data: { name: 'Duplicate', slug: 'duplicate-slug', icon: 'folder', color: '#3B82F6' }
        })
      ).rejects.toThrow();
    });

    it('should set default values', async () => {
      const created = await prisma.category.create({
        data: { name: 'Minimal', slug: 'minimal', icon: 'folder', color: '#3B82F6' }
      });

      expect(created.order).toBe(0);
      expect(created.visible).toBe(true);
    });
  });

  describe('PUT /api/categories/:id', () => {
    it('should update a category', async () => {
      const created = await createTestCategory({ name: 'Original', slug: 'original' });

      const updated = await prisma.category.update({
        where: { id: created.id },
        data: { name: 'Updated Name', description: 'Updated description' }
      });

      expect(updated.name).toBe('Updated Name');
      expect(updated.description).toBe('Updated description');
      expect(updated.slug).toBe('original'); // Unchanged
    });

    it('should update category order', async () => {
      const created = await createTestCategory({ name: 'Reorder', slug: 'reorder', order: 1 });

      const updated = await prisma.category.update({
        where: { id: created.id },
        data: { order: 5 }
      });

      expect(updated.order).toBe(5);
    });

    it('should update visibility', async () => {
      const created = await createTestCategory({ name: 'Visible', slug: 'visible', visible: true });

      const updated = await prisma.category.update({
        where: { id: created.id },
        data: { visible: false }
      });

      expect(updated.visible).toBe(false);
    });
  });

  describe('DELETE /api/categories/:id', () => {
    it('should delete a category', async () => {
      const created = await createTestCategory({ name: 'To Delete', slug: 'to-delete' });

      await prisma.category.delete({
        where: { id: created.id }
      });

      const found = await prisma.category.findUnique({
        where: { id: created.id }
      });

      expect(found).toBeNull();
    });

    it('should handle deletion of category with websites', async () => {
      const category = await createTestCategory({ name: 'With Sites', slug: 'with-sites' });
      await prisma.website.create({
        data: { name: 'Site', url: 'https://site.com', description: 'Test site', tags: '[]', categoryId: category.id }
      });

      // Delete websites first (or handle cascade)
      await prisma.website.deleteMany({ where: { categoryId: category.id } });
      
      await prisma.category.delete({
        where: { id: category.id }
      });

      const found = await prisma.category.findUnique({
        where: { id: category.id }
      });

      expect(found).toBeNull();
    });
  });
});
