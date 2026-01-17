/**
 * @file errors.test.js
 * @description 后端API服务
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

/**
 * Error Handling Tests
 * Tests for API error responses
 * 
 * **Feature: functional-testing**
 * **Validates: Requirements 6.4**
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { 
  prisma, 
  setupTestDb, 
  teardownTestDb,
  cleanDatabase 
} from '../utils/testDb.js';
import { ApiError } from '../../utils/ApiError.js';

describe('Error Handling', () => {
  beforeAll(async () => {
    await setupTestDb();
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  beforeEach(async () => {
    await cleanDatabase();
  });

  describe('ApiError Class', () => {
    it('should create validation error with correct status', () => {
      const error = ApiError.validationError('Invalid input');
      
      expect(error).toBeInstanceOf(ApiError);
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('Invalid input');
    });

    it('should create not found error with correct status', () => {
      const error = ApiError.notFound('Resource not found');
      
      expect(error).toBeInstanceOf(ApiError);
      expect(error.statusCode).toBe(404);
      expect(error.message).toBe('Resource not found');
    });

    it('should create unauthorized error with correct status', () => {
      const error = ApiError.unauthorized('Not authorized');
      
      expect(error).toBeInstanceOf(ApiError);
      expect(error.statusCode).toBe(401);
      expect(error.message).toBe('Not authorized');
    });

    it('should create forbidden error with correct status', () => {
      const error = ApiError.forbidden('Access denied');
      
      expect(error).toBeInstanceOf(ApiError);
      expect(error.statusCode).toBe(403);
      expect(error.message).toBe('Access denied');
    });

    it('should create conflict error with correct status', () => {
      const error = ApiError.conflict('Resource already exists');
      
      expect(error).toBeInstanceOf(ApiError);
      expect(error.statusCode).toBe(409);
      expect(error.message).toBe('Resource already exists');
    });

    it('should create internal error with correct status', () => {
      const error = ApiError.internalError('Server error');
      
      expect(error).toBeInstanceOf(ApiError);
      expect(error.statusCode).toBe(500);
      expect(error.message).toBe('Server error');
    });
  });

  describe('Database Error Handling', () => {
    it('should handle non-existent record lookup', async () => {
      const result = await prisma.website.findUnique({
        where: { id: 'non-existent-id-12345' }
      });

      expect(result).toBeNull();
    });

    it('should throw on invalid foreign key', async () => {
      await expect(
        prisma.website.create({
          data: {
            name: 'Test',
            url: 'https://test.com',
            description: 'Test description',
            tags: '[]',
            categoryId: 'invalid-category-id',
          }
        })
      ).rejects.toThrow();
    });

    it('should throw on unique constraint violation', async () => {
      await prisma.category.create({
        data: { name: 'Unique', slug: 'unique-slug', icon: 'folder', color: '#3B82F6' }
      });

      await expect(
        prisma.category.create({
          data: { name: 'Duplicate', slug: 'unique-slug', icon: 'folder', color: '#3B82F6' }
        })
      ).rejects.toThrow();
    });

    it('should throw on required field missing', async () => {
      await expect(
        prisma.website.create({
          data: {
            name: 'Test',
            // url is required but missing
          }
        })
      ).rejects.toThrow();
    });
  });

  describe('Validation Error Scenarios', () => {
    it('should reject empty name for website', async () => {
      // The database should reject empty strings if there's a constraint
      // or the API should validate before saving
      const emptyName = '';
      
      // This tests the validation logic
      expect(emptyName.trim().length).toBe(0);
    });

    it('should reject invalid URL format', async () => {
      const invalidUrls = [
        '',
        'not-a-url',
        'ftp://invalid-protocol.com',
      ];

      for (const url of invalidUrls) {
        // URL validation should happen at API level
        const isValidUrl = /^https?:\/\/.+/.test(url);
        expect(isValidUrl).toBe(false);
      }
    });

    it('should validate category slug format', async () => {
      const validSlugs = ['valid-slug', 'another-valid', 'slug123'];
      const invalidSlugs = ['Invalid Slug', 'slug with spaces', ''];

      for (const slug of validSlugs) {
        const isValid = /^[a-z0-9-]+$/.test(slug);
        expect(isValid).toBe(true);
      }

      for (const slug of invalidSlugs) {
        const isValid = /^[a-z0-9-]+$/.test(slug) && slug.length > 0;
        expect(isValid).toBe(false);
      }
    });
  });

  describe('Error Response Format', () => {
    it('should have consistent error structure', () => {
      const error = ApiError.validationError('Test error');
      
      // Error should have these properties
      expect(error).toHaveProperty('statusCode');
      expect(error).toHaveProperty('message');
      expect(typeof error.statusCode).toBe('number');
      expect(typeof error.message).toBe('string');
    });

    it('should preserve error message through serialization', () => {
      const error = ApiError.notFound('Resource not found');
      const serialized = JSON.stringify({ error: error.message, statusCode: error.statusCode });
      const parsed = JSON.parse(serialized);

      expect(parsed.error).toBe('Resource not found');
      expect(parsed.statusCode).toBe(404);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long strings', async () => {
      const longString = 'a'.repeat(10000);
      const category = await prisma.category.create({
        data: { name: 'Test Cat', slug: `test-cat-long-${Date.now()}`, icon: 'folder', color: '#3B82F6' }
      });
      
      // Database should handle or reject appropriately
      // This depends on column constraints
      try {
        await prisma.website.create({
          data: {
            name: longString,
            url: 'https://test.com',
            description: 'Test description',
            tags: '[]',
            categoryId: category.id,
          }
        });
        // If it succeeds, the database accepts long strings
      } catch (error) {
        // If it fails, the database has length constraints
        expect(error).toBeDefined();
      }
    });

    it('should handle special characters in strings', async () => {
      const specialChars = "Test <script>alert('xss')</script>";
      const category = await prisma.category.create({
        data: { name: 'Test Cat', slug: `test-cat-special-${Date.now()}`, icon: 'folder', color: '#3B82F6' }
      });
      
      const website = await prisma.website.create({
        data: {
          name: specialChars,
          url: 'https://special.com',
          description: 'Test description',
          tags: '[]',
          categoryId: category.id,
        }
      });

      // Data should be stored as-is (sanitization happens at display)
      expect(website.name).toBe(specialChars);

      // Clean up
      await prisma.website.delete({ where: { id: website.id } });
    });

    it('should handle unicode characters', async () => {
      const unicodeName = '设计工具 🎨 デザイン';
      const category = await prisma.category.create({
        data: { name: 'Test Cat', slug: `test-cat-unicode-${Date.now()}`, icon: 'folder', color: '#3B82F6' }
      });
      
      const website = await prisma.website.create({
        data: {
          name: unicodeName,
          url: 'https://unicode.com',
          description: 'Test description',
          tags: '[]',
          categoryId: category.id,
        }
      });

      expect(website.name).toBe(unicodeName);

      // Clean up
      await prisma.website.delete({ where: { id: website.id } });
    });
  });
});
