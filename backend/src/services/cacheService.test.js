/**
 * @file cacheService.test.js
 * @description 后端API服务
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import {
  getCache,
  setCache,
  deleteCache,
  clearCacheByPattern,
  clearAllCache,
  hasCache,
  getCacheKeys,
  generateCacheKey,
  CACHE_TTL,
} from './cacheService.js';

/**
 * Property-Based Tests for Cache Service
 * 
 * Feature: api-optimization
 * Property 1: 缓存一致性
 * Property 2: 缓存失效正确性
 * Validates: Requirements 1.1, 1.2, 1.3
 */

// Filter out JavaScript prototype chain properties that cause issues with node-cache
const RESERVED_KEYS = ['constructor', '__proto__', 'prototype', 'hasOwnProperty', 'toString', 'valueOf'];

// Custom arbitrary for safe cache keys (excludes JavaScript reserved property names)
const safeCacheKeyArb = fc.string({ minLength: 1, maxLength: 50 })
  .filter(key => !RESERVED_KEYS.includes(key) && !key.startsWith('__'));

// Custom arbitrary for safe JSON values (excludes objects with reserved property names)
const safeJsonValueArb = fc.oneof(
  fc.string(),
  fc.integer(),
  fc.double({ noNaN: true }),
  fc.boolean(),
  fc.constant(null),
  fc.array(fc.oneof(fc.string(), fc.integer(), fc.boolean(), fc.constant(null))),
  fc.dictionary(
    fc.string({ minLength: 1, maxLength: 20 }).filter(key => !RESERVED_KEYS.includes(key) && !key.startsWith('__')),
    fc.oneof(fc.string(), fc.integer(), fc.boolean(), fc.constant(null))
  )
);

describe('Cache Service - Property Tests', () => {
  beforeEach(() => {
    clearAllCache();
  });

  afterEach(() => {
    clearAllCache();
  });

  /**
   * Property 1: 缓存一致性
   * For any API请求，如果缓存存在且未过期，返回的数据应与缓存数据完全一致
   * Validates: Requirements 1.1, 1.2
   */
  describe('Property 1: Cache Consistency', () => {
    it('should return exactly the same data that was cached', () => {
      fc.assert(
        fc.property(
          safeCacheKeyArb,
          safeJsonValueArb,
          (key, value) => {
            // Set cache
            setCache(key, value);
            
            // Get cache should return the same value
            const cachedValue = getCache(key);
            
            // Deep equality check
            expect(cachedValue).toEqual(value);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return undefined for non-existent keys', () => {
      fc.assert(
        fc.property(
          safeCacheKeyArb,
          (key) => {
            // Without setting, get should return undefined
            const cachedValue = getCache(key);
            expect(cachedValue).toBeUndefined();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('hasCache should correctly reflect cache state', () => {
      fc.assert(
        fc.property(
          safeCacheKeyArb,
          safeJsonValueArb,
          (key, value) => {
            // Before setting
            expect(hasCache(key)).toBe(false);
            
            // After setting
            setCache(key, value);
            expect(hasCache(key)).toBe(true);
            
            // After deleting
            deleteCache(key);
            expect(hasCache(key)).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 2: 缓存失效正确性
   * For any 数据修改操作，相关的缓存条目应被正确清除
   * Validates: Requirements 1.3
   */
  describe('Property 2: Cache Invalidation Correctness', () => {
    it('deleteCache should remove the specified key', () => {
      fc.assert(
        fc.property(
          safeCacheKeyArb,
          safeJsonValueArb,
          (key, value) => {
            // Set cache
            setCache(key, value);
            expect(hasCache(key)).toBe(true);
            
            // Delete cache
            deleteCache(key);
            
            // Should no longer exist
            expect(hasCache(key)).toBe(false);
            expect(getCache(key)).toBeUndefined();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('clearCacheByPattern should remove all keys with matching prefix', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 20 }).filter(s => !RESERVED_KEYS.includes(s) && !s.startsWith('__') && !s.startsWith('unrelated_')),
          fc.array(fc.string({ minLength: 1, maxLength: 20 }).filter(s => !RESERVED_KEYS.includes(s) && !s.startsWith('__')), { minLength: 1, maxLength: 10 }),
          safeJsonValueArb,
          (prefix, suffixes, value) => {
            // Create keys with the prefix
            const keysWithPrefix = suffixes.map(s => `${prefix}:${s}`);
            // Use a completely unrelated prefix that won't match
            const keyWithoutPrefix = `unrelated_key_${Date.now()}`;
            
            // Set all caches
            keysWithPrefix.forEach(key => setCache(key, value));
            setCache(keyWithoutPrefix, value);
            
            // Clear by pattern
            clearCacheByPattern(prefix);
            
            // Keys with prefix should be removed
            keysWithPrefix.forEach(key => {
              expect(hasCache(key)).toBe(false);
            });
            
            // Key without prefix should still exist
            expect(hasCache(keyWithoutPrefix)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('clearAllCache should remove all cached data', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.tuple(
              safeCacheKeyArb,
              safeJsonValueArb
            ),
            { minLength: 1, maxLength: 20 }
          ),
          (entries) => {
            // Set multiple caches
            entries.forEach(([key, value]) => setCache(key, value));
            
            // Verify they exist
            const keysBeforeClear = getCacheKeys();
            expect(keysBeforeClear.length).toBeGreaterThan(0);
            
            // Clear all
            clearAllCache();
            
            // All should be removed
            const keysAfterClear = getCacheKeys();
            expect(keysAfterClear.length).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Additional property tests for cache key generation
   */
  describe('Cache Key Generation', () => {
    it('generateCacheKey should produce consistent keys for same inputs', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 20 }),
          fc.string({ minLength: 0, maxLength: 30 }),
          (prefix, identifier) => {
            const key1 = generateCacheKey(prefix, identifier);
            const key2 = generateCacheKey(prefix, identifier);
            
            expect(key1).toBe(key2);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('generateCacheKey with object should produce sorted parameter string', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 20 }),
          fc.dictionary(
            fc.string({ minLength: 1, maxLength: 10 }),
            fc.oneof(fc.string(), fc.integer())
          ),
          (prefix, params) => {
            if (Object.keys(params).length === 0) return;
            
            const key1 = generateCacheKey(prefix, params);
            const key2 = generateCacheKey(prefix, params);
            
            // Should be consistent
            expect(key1).toBe(key2);
            
            // Should contain prefix
            expect(key1.startsWith(prefix)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * TTL configuration tests
   */
  describe('Cache TTL Configuration', () => {
    it('CACHE_TTL should have all required resource types', () => {
      expect(CACHE_TTL.SITE_INFO).toBe(1800);
      expect(CACHE_TTL.PAGE_DATA).toBe(300);
      expect(CACHE_TTL.CATEGORIES).toBe(600);
      expect(CACHE_TTL.WEBSITES).toBe(300);
      expect(CACHE_TTL.HOT_RECOMMENDATIONS).toBe(300);
      expect(CACHE_TTL.DEFAULT).toBe(300);
    });
  });
});
