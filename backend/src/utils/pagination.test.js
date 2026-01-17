/**
 * @file pagination.test.js
 * @description 后端API服务
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  parsePaginationParams,
  formatPaginatedResponse,
  createPrismaPageParams,
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
} from './pagination.js';

/**
 * Property-Based Tests for Pagination
 * 
 * Feature: api-optimization
 * Property 3: 分页数据完整性
 * Validates: Requirements 4.1, 4.2, 4.3
 */

describe('Pagination Utils - Property Tests', () => {
  /**
   * Property 3: 分页数据完整性
   * For any 分页请求，返回的pagination对象中total应等于所有页数据的总和，
   * 且遍历所有页应能获取完整数据集。
   * Validates: Requirements 4.1, 4.2, 4.3
   */
  describe('Property 3: Pagination Data Integrity', () => {
    it('parsePaginationParams should always return valid page and pageSize', () => {
      fc.assert(
        fc.property(
          fc.record({
            page: fc.oneof(fc.string(), fc.integer(), fc.constant(undefined)),
            pageSize: fc.oneof(fc.string(), fc.integer(), fc.constant(undefined)),
          }),
          (query) => {
            const result = parsePaginationParams(query);
            
            // Page should always be >= 1
            expect(result.page).toBeGreaterThanOrEqual(1);
            
            // PageSize should be between 1 and MAX_PAGE_SIZE
            expect(result.pageSize).toBeGreaterThanOrEqual(1);
            expect(result.pageSize).toBeLessThanOrEqual(MAX_PAGE_SIZE);
            
            // Skip should be calculated correctly
            expect(result.skip).toBe((result.page - 1) * result.pageSize);
            
            // Take should equal pageSize
            expect(result.take).toBe(result.pageSize);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('formatPaginatedResponse should calculate totalPages correctly', () => {
      fc.assert(
        fc.property(
          fc.array(fc.jsonValue(), { minLength: 0, maxLength: 50 }),
          fc.integer({ min: 0, max: 1000 }),
          fc.integer({ min: 1, max: 100 }),
          fc.integer({ min: 1, max: MAX_PAGE_SIZE }),
          (data, total, page, pageSize) => {
            const paginationParams = { page, pageSize };
            const result = formatPaginatedResponse(data, total, paginationParams);
            
            // Data should be passed through unchanged
            expect(result.data).toEqual(data);
            
            // Total should match
            expect(result.pagination.total).toBe(total);
            
            // Page and pageSize should match
            expect(result.pagination.page).toBe(page);
            expect(result.pagination.pageSize).toBe(pageSize);
            
            // TotalPages should be calculated correctly
            const expectedTotalPages = Math.ceil(total / pageSize);
            expect(result.pagination.totalPages).toBe(expectedTotalPages);
            
            // HasMore should be correct
            const expectedHasMore = page < expectedTotalPages;
            expect(result.pagination.hasMore).toBe(expectedHasMore);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('traversing all pages should cover all items', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 500 }),
          fc.integer({ min: 1, max: MAX_PAGE_SIZE }),
          (total, pageSize) => {
            // Simulate traversing all pages
            let itemsCovered = 0;
            let currentPage = 1;
            const totalPages = Math.ceil(total / pageSize);
            
            while (currentPage <= totalPages) {
              const paginationParams = { page: currentPage, pageSize };
              const itemsOnPage = Math.min(pageSize, total - itemsCovered);
              
              const result = formatPaginatedResponse(
                Array(itemsOnPage).fill(null),
                total,
                paginationParams
              );
              
              itemsCovered += result.data.length;
              
              // Check hasMore is correct
              if (currentPage < totalPages) {
                expect(result.pagination.hasMore).toBe(true);
              } else {
                expect(result.pagination.hasMore).toBe(false);
              }
              
              currentPage++;
            }
            
            // All items should be covered
            expect(itemsCovered).toBe(total);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('createPrismaPageParams should return correct Prisma query params', () => {
      fc.assert(
        fc.property(
          fc.record({
            page: fc.integer({ min: 1, max: 100 }).map(String),
            pageSize: fc.integer({ min: 1, max: MAX_PAGE_SIZE }).map(String),
          }),
          (query) => {
            const result = createPrismaPageParams(query);
            
            const expectedPage = parseInt(query.page, 10);
            const expectedPageSize = parseInt(query.pageSize, 10);
            
            // Prisma params should have skip and take
            expect(result.prismaParams.skip).toBe((expectedPage - 1) * expectedPageSize);
            expect(result.prismaParams.take).toBe(expectedPageSize);
            
            // Pagination info should have page and pageSize
            expect(result.paginationInfo.page).toBe(expectedPage);
            expect(result.paginationInfo.pageSize).toBe(expectedPageSize);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Edge case tests
   */
  describe('Edge Cases', () => {
    it('should handle negative page numbers by defaulting to 1', () => {
      const result = parsePaginationParams({ page: '-5', pageSize: '10' });
      expect(result.page).toBe(1);
    });

    it('should handle zero page by defaulting to 1', () => {
      const result = parsePaginationParams({ page: '0', pageSize: '10' });
      expect(result.page).toBe(1);
    });

    it('should handle pageSize exceeding MAX_PAGE_SIZE', () => {
      const result = parsePaginationParams({ page: '1', pageSize: '500' });
      expect(result.pageSize).toBe(MAX_PAGE_SIZE);
    });

    it('should handle missing parameters with defaults', () => {
      const result = parsePaginationParams({});
      expect(result.page).toBe(DEFAULT_PAGE);
      expect(result.pageSize).toBe(DEFAULT_PAGE_SIZE);
    });

    it('should handle non-numeric strings', () => {
      const result = parsePaginationParams({ page: 'abc', pageSize: 'xyz' });
      expect(result.page).toBe(DEFAULT_PAGE);
      expect(result.pageSize).toBe(DEFAULT_PAGE_SIZE);
    });

    it('should handle empty total correctly', () => {
      const result = formatPaginatedResponse([], 0, { page: 1, pageSize: 20 });
      expect(result.pagination.total).toBe(0);
      expect(result.pagination.totalPages).toBe(0);
      expect(result.pagination.hasMore).toBe(false);
    });
  });
});
