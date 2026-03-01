/**
 * @file useCache.ts
 * @description 通用缓存Hook - 实现SWR（stale-while-revalidate）策略
 * @copyright 版权所有 (c) 2025 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * 缓存条目接口
 */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

/**
 * 内存缓存存储
 */
const cacheStore = new Map<string, CacheEntry<unknown>>();

/**
 * useCache Hook 配置选项
 */
export interface UseCacheOptions<T> {
  /** 缓存键 */
  key: string;
  /** 数据获取函数 */
  fetcher: () => Promise<T>;
  /** 缓存时间（毫秒），默认5分钟 */
  ttl?: number;
  /** 是否使用SWR策略，默认true */
  staleWhileRevalidate?: boolean;
  /** 是否启用，默认true */
  enabled?: boolean;
  /** 初始数据 */
  initialData?: T;
  /** 数据变化回调 */
  onSuccess?: (data: T) => void;
  /** 错误回调 */
  onError?: (error: Error) => void;
}

/**
 * useCache Hook 返回值
 */
export interface UseCacheReturn<T> {
  /** 缓存数据 */
  data: T | null;
  /** 是否正在加载 */
  loading: boolean;
  /** 错误信息 */
  error: Error | null;
  /** 数据是否过期（使用SWR时可能返回过期数据） */
  isStale: boolean;
  /** 是否正在后台刷新 */
  isRevalidating: boolean;
  /** 手动刷新数据 */
  refetch: () => Promise<void>;
  /** 使缓存失效 */
  invalidate: () => void;
}

/**
 * 检查缓存是否过期
 */
const isCacheExpired = <T>(entry: CacheEntry<T>): boolean => {
  return Date.now() - entry.timestamp > entry.ttl;
};

/**
 * 从缓存获取数据
 */
const getFromCache = <T>(key: string): CacheEntry<T> | null => {
  const entry = cacheStore.get(key) as CacheEntry<T> | undefined;
  return entry || null;
};

/**
 * 设置缓存数据
 */
const setCache = <T>(key: string, data: T, ttl: number): void => {
  cacheStore.set(key, {
    data,
    timestamp: Date.now(),
    ttl,
  });
};

/**
 * 删除缓存
 */
const deleteCache = (key: string): void => {
  cacheStore.delete(key);
};

/**
 * 清除所有缓存
 */
export const clearAllCache = (): void => {
  cacheStore.clear();
};

/**
 * 清除匹配模式的缓存
 */
export const clearCacheByPattern = (pattern: string | RegExp): void => {
  const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
  const keys = Array.from(cacheStore.keys());
  keys.forEach(key => {
    if (regex.test(key)) {
      cacheStore.delete(key);
    }
  });
};

/**
 * 获取缓存统计信息
 */
export const getCacheStats = (): { size: number; keys: string[] } => {
  return {
    size: cacheStore.size,
    keys: Array.from(cacheStore.keys()),
  };
};

/**
 * 默认TTL（5分钟）
 */
const DEFAULT_TTL = 5 * 60 * 1000;

/**
 * 通用缓存Hook - 实现SWR（stale-while-revalidate）策略
 * 
 * @example
 * ```tsx
 * const { data, loading, error, refetch } = useCache({
 *   key: 'page-data-ai',
 *   fetcher: () => pageService.getFullData('ai'),
 *   ttl: 5 * 60 * 1000, // 5分钟
 *   staleWhileRevalidate: true,
 * });
 * ```
 */
export const useCache = <T>({
  key,
  fetcher,
  ttl = DEFAULT_TTL,
  staleWhileRevalidate = true,
  enabled = true,
  initialData,
  onSuccess,
  onError,
}: UseCacheOptions<T>): UseCacheReturn<T> => {
  const [data, setData] = useState<T | null>(() => {
    // 初始化时检查缓存
    const cached = getFromCache<T>(key);
    if (cached) {
      return cached.data;
    }
    return initialData || null;
  });
  const [loading, setLoading] = useState<boolean>(!data);
  const [error, setError] = useState<Error | null>(null);
  const [isStale, setIsStale] = useState<boolean>(false);
  const [isRevalidating, setIsRevalidating] = useState<boolean>(false);

  // 使用ref跟踪当前请求，避免竞态条件
  const fetchIdRef = useRef<number>(0);
  const isMountedRef = useRef<boolean>(true);

  /**
   * 获取数据的核心函数
   */
  const fetchData = useCallback(async (isBackground = false): Promise<void> => {
    if (!enabled) return;

    const fetchId = ++fetchIdRef.current;

    try {
      if (isBackground) {
        setIsRevalidating(true);
      } else {
        setLoading(true);
      }

      const result = await fetcher();

      // 检查组件是否仍然挂载且请求未被取消
      if (!isMountedRef.current || fetchId !== fetchIdRef.current) {
        return;
      }

      // 更新缓存
      setCache(key, result, ttl);

      // 更新状态
      setData(result);
      setError(null);
      setIsStale(false);

      // 调用成功回调
      onSuccess?.(result);
    } catch (err) {
      // 检查组件是否仍然挂载且请求未被取消
      if (!isMountedRef.current || fetchId !== fetchIdRef.current) {
        return;
      }

      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);

      // 调用错误回调
      onError?.(error);
    } finally {
      if (isMountedRef.current && fetchId === fetchIdRef.current) {
        setLoading(false);
        setIsRevalidating(false);
      }
    }
  }, [enabled, fetcher, key, ttl, onSuccess, onError]);

  /**
   * 手动刷新数据
   */
  const refetch = useCallback(async (): Promise<void> => {
    await fetchData(false);
  }, [fetchData]);

  /**
   * 使缓存失效
   */
  const invalidate = useCallback((): void => {
    deleteCache(key);
    setIsStale(true);
  }, [key]);

  /**
   * 初始化和SWR逻辑
   */
  useEffect(() => {
    isMountedRef.current = true;

    if (!enabled) {
      return;
    }

    const cached = getFromCache<T>(key);

    if (cached) {
      // 有缓存数据
      setData(cached.data);
      
      if (isCacheExpired(cached)) {
        // 缓存过期
        setIsStale(true);
        
        if (staleWhileRevalidate) {
          // SWR策略：先返回过期数据，后台刷新
          fetchData(true);
        } else {
          // 非SWR：直接重新获取
          fetchData(false);
        }
      } else {
        // 缓存有效
        setIsStale(false);
        setLoading(false);
      }
    } else {
      // 无缓存，直接获取
      fetchData(false);
    }

    return () => {
      isMountedRef.current = false;
    };
  }, [key, enabled, staleWhileRevalidate, fetchData]);

  return {
    data,
    loading,
    error,
    isStale,
    isRevalidating,
    refetch,
    invalidate,
  };
};

export default useCache;
