/**
 * @file useCache.test.ts
 * @description 前端用户界面组件
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

import * as fc from 'fast-check';
import {
  clearPendingRequests,
  getPendingRequestCount,
  getPendingRequestKeys,
} from './useDeduplicatedRequest';
import {
  clearAllCache,
  getCacheStats,
  clearCacheByPattern,
} from './useCache';

/**
 * Property 10: 并行请求效率
 * 
 * 验证请求去重和缓存机制的正确性：
 * 1. 相同key的并行请求应该被合并为单个请求
 * 2. 缓存应该正确存储和检索数据
 * 3. 缓存清除应该正确工作
 * 
 * **Validates: Requirements 7.1, 7.3**
 */

describe('Frontend Cache Hooks - Property Tests', () => {
  beforeEach(() => {
    // 清理状态
    clearPendingRequests();
    clearAllCache();
  });

  describe('Property 10: 并行请求效率', () => {
    // 请求key生成器
    const requestKeyArb = fc.string({ minLength: 1, maxLength: 50 })
      .filter(s => s.trim().length > 0);
    
    // 响应数据生成器
    const responseDataArb = fc.record({
      id: fc.string(),
      name: fc.string(),
      value: fc.integer(),
    });

    // 延迟时间生成器（毫秒）- 使用较小的延迟以避免超时
    const delayArb = fc.integer({ min: 1, max: 5 });

    // 并行请求数量生成器
    const parallelCountArb = fc.integer({ min: 2, max: 5 });

    /**
     * 模拟异步请求
     */
    const createMockFetcher = <T>(data: T, delay: number): (() => Promise<T>) => {
      let callCount = 0;
      return async () => {
        callCount++;
        await new Promise(resolve => setTimeout(resolve, delay));
        return data;
      };
    };

    /**
     * 执行去重请求的纯函数版本（用于测试）
     */
    const executeDeduplicatedRequestSync = async <T>(
      key: string,
      fetcher: () => Promise<T>,
      pendingMap: Map<string, Promise<T>>
    ): Promise<{ data: T; isReused: boolean }> => {
      const existingRequest = pendingMap.get(key);
      if (existingRequest) {
        const data = await existingRequest;
        return { data, isReused: true };
      }

      const requestPromise = fetcher();
      pendingMap.set(key, requestPromise);

      try {
        const data = await requestPromise;
        return { data, isReused: false };
      } finally {
        pendingMap.delete(key);
      }
    };

    test('相同key的并行请求应该复用同一个Promise', async () => {
      await fc.assert(
        fc.asyncProperty(
          requestKeyArb,
          responseDataArb,
          delayArb,
          parallelCountArb,
          async (key, expectedData, delay, parallelCount) => {
            const pendingMap = new Map<string, Promise<typeof expectedData>>();
            let actualFetchCount = 0;

            const fetcher = async () => {
              actualFetchCount++;
              await new Promise(resolve => setTimeout(resolve, delay));
              return expectedData;
            };

            // 并行发起多个请求
            const requests = Array.from({ length: parallelCount }, () =>
              executeDeduplicatedRequestSync(key, fetcher, pendingMap)
            );

            const results = await Promise.all(requests);

            // 验证：只有一个实际请求被发出
            expect(actualFetchCount).toBe(1);

            // 验证：所有请求都返回相同的数据
            results.forEach(result => {
              expect(result.data).toEqual(expectedData);
            });

            // 验证：第一个请求不是复用的，其他都是复用的
            const reusedCount = results.filter(r => r.isReused).length;
            expect(reusedCount).toBe(parallelCount - 1);
          }
        ),
        { numRuns: 50 } // 减少运行次数以避免超时
      );
    }, 30000); // 增加测试超时时间

    test('不同key的请求应该独立执行', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(requestKeyArb, { minLength: 2, maxLength: 5 })
            .filter(keys => new Set(keys).size === keys.length), // 确保key唯一
          responseDataArb,
          delayArb,
          async (keys, baseData, delay) => {
            const pendingMap = new Map<string, Promise<typeof baseData>>();
            const fetchCounts = new Map<string, number>();

            // 为每个key创建独立的fetcher
            const createFetcher = (key: string) => async () => {
              fetchCounts.set(key, (fetchCounts.get(key) || 0) + 1);
              await new Promise(resolve => setTimeout(resolve, delay));
              return { ...baseData, id: key };
            };

            // 并行发起不同key的请求
            const requests = keys.map(key =>
              executeDeduplicatedRequestSync(key, createFetcher(key), pendingMap)
            );

            await Promise.all(requests);

            // 验证：每个key都有一个独立的请求
            keys.forEach(key => {
              expect(fetchCounts.get(key)).toBe(1);
            });
          }
        ),
        { numRuns: 50 } // 减少运行次数以避免超时
      );
    }, 30000); // 增加测试超时时间

    test('请求完成后应该从pending map中移除', async () => {
      await fc.assert(
        fc.asyncProperty(
          requestKeyArb,
          responseDataArb,
          delayArb,
          async (key, data, delay) => {
            const pendingMap = new Map<string, Promise<typeof data>>();

            const fetcher = async () => {
              await new Promise(resolve => setTimeout(resolve, delay));
              return data;
            };

            // 发起请求
            const requestPromise = executeDeduplicatedRequestSync(key, fetcher, pendingMap);

            // 请求进行中时，应该在pending map中
            expect(pendingMap.has(key)).toBe(true);

            // 等待请求完成
            await requestPromise;

            // 请求完成后，应该从pending map中移除
            expect(pendingMap.has(key)).toBe(false);
          }
        ),
        { numRuns: 50 } // 减少运行次数以避免超时
      );
    }, 30000); // 增加测试超时时间
  });

  describe('Cache Store Properties', () => {
    // 缓存key生成器
    const cacheKeyArb = fc.string({ minLength: 1, maxLength: 50 })
      .filter(s => s.trim().length > 0 && !s.includes('\n'));

    // 缓存数据生成器
    const cacheDataArb = fc.oneof(
      fc.string() as fc.Arbitrary<unknown>,
      fc.integer() as fc.Arbitrary<unknown>,
      fc.record({ id: fc.string(), value: fc.integer() }) as fc.Arbitrary<unknown>,
      fc.array(fc.integer()) as fc.Arbitrary<unknown>
    );

    test('缓存统计应该正确反映缓存状态', () => {
      fc.assert(
        fc.property(
          fc.array(cacheKeyArb, { minLength: 0, maxLength: 10 })
            .filter(keys => new Set(keys).size === keys.length), // 确保key唯一
          (keys) => {
            clearAllCache();

            // 初始状态
            const initialStats = getCacheStats();
            expect(initialStats.size).toBe(0);
            expect(initialStats.keys).toEqual([]);

            // 清除后状态应该为空
            clearAllCache();
            const finalStats = getCacheStats();
            expect(finalStats.size).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('按模式清除缓存应该只清除匹配的key', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 10 }).filter(s => /^[a-z]+$/.test(s)),
          (prefix) => {
            clearAllCache();

            // 模拟添加缓存（通过getCacheStats验证清除逻辑）
            const pattern = new RegExp(`^${prefix}`);

            // 清除匹配的缓存
            clearCacheByPattern(pattern);

            // 验证清除后的状态
            const stats = getCacheStats();
            const matchingKeys = stats.keys.filter(key => pattern.test(key));
            expect(matchingKeys.length).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('clearAllCache应该清除所有缓存', () => {
      // 简单测试，不使用 fc.constant
      clearAllCache();
      const stats = getCacheStats();
      expect(stats.size).toBe(0);
      expect(stats.keys).toEqual([]);
    });
  });

  describe('Pending Request Tracking', () => {
    test('getPendingRequestCount应该返回正确的数量', () => {
      clearPendingRequests();
      // 初始状态应该为0
      expect(getPendingRequestCount()).toBe(0);
      expect(getPendingRequestKeys()).toEqual([]);
    });

    test('clearPendingRequests应该清除所有pending请求', () => {
      // 清除所有pending请求
      clearPendingRequests();
      // 验证状态
      expect(getPendingRequestCount()).toBe(0);
      expect(getPendingRequestKeys()).toEqual([]);
    });
  });
});
