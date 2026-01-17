/**
 * @file category.property.test.js
 * @description 后端API服务
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

/**
 * Category Property Tests
 * Property-based tests for category functionality
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
  categoryNameArb,
  categorySlugArb
} from '../utils/generators.js';

describe('Category Property Tests', () => {
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
   * **Property 4: Category Hierarchy Preservation**
   * *For any* category created with a parentId, the category SHALL appear
   * in the parent's children array when fetching the parent category.
   * 
   * **Validates: Requirements 2.3**
   */
  it('Property 4: Category hierarchy preservation - children appear in parent', async () => {
    await fc.assert(
      fc.asyncProperty(
        categoryNameArb,
        categoryNameArb,
        async (parentName, childName) => {
          const parentSlug = `parent-${Date.now()}-${Math.random().toString(36).slice(2)}`;
          const childSlug = `child-${Date.now()}-${Math.random().toString(36).slice(2)}`;

          // Create parent category
          const parent = await prisma.category.create({
            data: { name: parentName, slug: parentSlug, icon: 'folder', color: '#3B82F6' }
          });

          // Create child category with parentId
          const child = await prisma.category.create({
            data: { name: childName, slug: childSlug, icon: 'file', color: '#10B981', parentId: parent.id }
          });

          // Fetch parent with children
          const parentWithChildren = await prisma.category.findUnique({
            where: { id: parent.id },
            include: { children: true }
          });

          // Verify child appears in parent's children array
          expect(parentWithChildren.children).toBeDefined();
          expect(parentWithChildren.children.length).toBeGreaterThanOrEqual(1);
          
          const foundChild = parentWithChildren.children.find(c => c.id === child.id);
          expect(foundChild).toBeDefined();
          expect(foundChild.name).toBe(childName);
          expect(foundChild.parentId).toBe(parent.id);

          // Clean up
          await prisma.category.delete({ where: { id: child.id } });
          await prisma.category.delete({ where: { id: parent.id } });
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * **Property 5: Category Update Persistence**
   * *For any* category update operation, the updated fields SHALL be persisted
   * and returned in subsequent GET requests.
   * 
   * **Validates: Requirements 2.5**
   */
  it('Property 5: Category update persistence', async () => {
    await fc.assert(
      fc.asyncProperty(
        categoryNameArb,
        categoryNameArb,
        fc.string({ maxLength: 200 }),
        async (originalName, newName, newDescription) => {
          const slug = `update-test-${Date.now()}-${Math.random().toString(36).slice(2)}`;

          // Create category
          const created = await prisma.category.create({
            data: { name: originalName, slug, icon: 'folder', color: '#3B82F6' }
          });

          // Update category
          await prisma.category.update({
            where: { id: created.id },
            data: { name: newName, description: newDescription }
          });

          // Fetch updated category
          const fetched = await prisma.category.findUnique({
            where: { id: created.id }
          });

          // Verify updates are persisted
          expect(fetched.name).toBe(newName);
          expect(fetched.description).toBe(newDescription);
          expect(fetched.slug).toBe(slug); // Unchanged field

          // Clean up
          await prisma.category.delete({ where: { id: created.id } });
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * Additional Property: Slug Uniqueness
   * *For any* two categories, their slugs SHALL be unique.
   */
  it('Property: Slug uniqueness is enforced', async () => {
    const slug = `unique-slug-${Date.now()}`;
    
    // Create first category
    await prisma.category.create({
      data: { name: 'First', slug, icon: 'folder', color: '#3B82F6' }
    });

    // Attempt to create second category with same slug should fail
    await expect(
      prisma.category.create({
        data: { name: 'Second', slug, icon: 'folder', color: '#10B981' }
      })
    ).rejects.toThrow();
  });

  /**
   * Additional Property: Root categories have null parentId
   * *For any* category without a parentId, it SHALL be a root category.
   */
  it('Property: Root categories have null parentId', async () => {
    await fc.assert(
      fc.asyncProperty(
        categoryNameArb,
        async (name) => {
          const slug = `root-${Date.now()}-${Math.random().toString(36).slice(2)}`;

          // Create root category (no parentId)
          const root = await prisma.category.create({
            data: { name, slug, icon: 'folder', color: '#3B82F6' }
          });

          // Verify parentId is null
          expect(root.parentId).toBeNull();

          // Verify it appears in root categories query
          const rootCategories = await prisma.category.findMany({
            where: { parentId: null }
          });

          const found = rootCategories.find(c => c.id === root.id);
          expect(found).toBeDefined();

          // Clean up
          await prisma.category.delete({ where: { id: root.id } });
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * Additional Property: Order field affects sorting
   * *For any* set of categories with different order values,
   * sorting by order SHALL return them in ascending order.
   */
  it('Property: Order field affects sorting correctly', async () => {
    // Create categories with random orders
    const orders = [5, 1, 3, 2, 4];
    const categories = [];

    for (const order of orders) {
      const cat = await prisma.category.create({
        data: {
          name: `Cat ${order}`,
          slug: `cat-order-${order}-${Date.now()}`,
          icon: 'folder',
          color: '#3B82F6',
          order
        }
      });
      categories.push(cat);
    }

    // Fetch sorted
    const sorted = await prisma.category.findMany({
      where: { id: { in: categories.map(c => c.id) } },
      orderBy: { order: 'asc' }
    });

    // Verify order
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i].order).toBeGreaterThanOrEqual(sorted[i - 1].order);
    }

    // Clean up
    await prisma.category.deleteMany({
      where: { id: { in: categories.map(c => c.id) } }
    });
  });
});
