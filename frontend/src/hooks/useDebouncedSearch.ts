/**
 * @file useDebouncedSearch.ts
 * @description 搜索防抖Hook - 实现300ms防抖，减少不必要的API请求
 * @copyright 版权所有 (c) 2025 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 * @requirements 9.1 - 搜索防抖处理
 */

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * 搜索结果接口
 */
export interface SearchResult<T> {
  data: T[];
  loading: boolean;
  error: Error | null;
  query: string;
}

/**
 * 防抖搜索配置
 */
export interface DebouncedSearchConfig<T> {
  /** 搜索函数 */
  searchFn: (query: string) => Promise<T[]>;
  /** 防抖延迟时间（毫秒），默认300ms */
  delay?: number;
  /** 最小搜索字符数，默认1 */
  minChars?: number;
  /** 是否启用，默认true */
  enabled?: boolean;
}

/**
 * 防抖搜索Hook返回值
 */
export interface UseDebouncedSearchReturn<T> {
  /** 搜索结果 */
  results: T[];
  /** 是否正在加载 */
  loading: boolean;
  /** 错误信息 */
  error: Error | null;
  /** 当前搜索词 */
  query: string;
  /** 设置搜索词 */
  setQuery: (query: string) => void;
  /** 立即执行搜索（跳过防抖） */
  searchImmediately: (query: string) => Promise<void>;
  /** 清除搜索结果 */
  clear: () => void;
  /** 是否正在防抖等待中 */
  isDebouncing: boolean;
}

/**
 * 搜索防抖Hook
 * 实现300ms防抖，减少不必要的API请求
 * 
 * @param config 配置选项
 * @returns 搜索状态和方法
 * 
 * @example
 * ```tsx
 * const { results, loading, query, setQuery } = useDebouncedSearch({
 *   searchFn: async (q) => api.search(q),
 *   delay: 300,
 * });
 * 
 * return (
 *   <input value={query} onChange={(e) => setQuery(e.target.value)} />
 * );
 * ```
 */
export function useDebouncedSearch<T>(
  config: DebouncedSearchConfig<T>
): UseDebouncedSearchReturn<T> {
  const {
    searchFn,
    delay = 300,
    minChars = 1,
    enabled = true,
  } = config;

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isDebouncing, setIsDebouncing] = useState(false);

  // 用于跟踪最新的请求，避免竞态条件
  const latestRequestRef = useRef<number>(0);
  // 防抖定时器
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * 执行搜索
   */
  const executeSearch = useCallback(async (searchQuery: string, requestId: number) => {
    if (!enabled) return;

    const trimmedQuery = searchQuery.trim();
    
    // 如果查询为空或长度不足，清空结果
    if (!trimmedQuery || trimmedQuery.length < minChars) {
      setResults([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await searchFn(trimmedQuery);
      
      // 只有当这是最新的请求时才更新结果
      if (requestId === latestRequestRef.current) {
        setResults(data);
        setError(null);
      }
    } catch (err) {
      // 只有当这是最新的请求时才更新错误
      if (requestId === latestRequestRef.current) {
        setError(err instanceof Error ? err : new Error('搜索失败'));
        setResults([]);
      }
    } finally {
      // 只有当这是最新的请求时才更新加载状态
      if (requestId === latestRequestRef.current) {
        setLoading(false);
      }
    }
  }, [searchFn, minChars, enabled]);

  /**
   * 防抖搜索
   */
  useEffect(() => {
    // 清除之前的定时器
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    const trimmedQuery = query.trim();

    // 如果查询为空，立即清空结果
    if (!trimmedQuery || trimmedQuery.length < minChars) {
      setResults([]);
      setLoading(false);
      setIsDebouncing(false);
      return;
    }

    // 设置防抖状态
    setIsDebouncing(true);

    // 创建新的请求ID
    const requestId = Date.now();
    latestRequestRef.current = requestId;

    // 设置防抖定时器
    debounceTimerRef.current = setTimeout(() => {
      setIsDebouncing(false);
      executeSearch(query, requestId);
    }, delay);

    // 清理函数
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query, delay, minChars, executeSearch]);

  /**
   * 立即执行搜索（跳过防抖）
   */
  const searchImmediately = useCallback(async (searchQuery: string) => {
    // 清除防抖定时器
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    setIsDebouncing(false);

    // 更新查询词
    setQuery(searchQuery);

    // 创建新的请求ID并立即执行
    const requestId = Date.now();
    latestRequestRef.current = requestId;
    await executeSearch(searchQuery, requestId);
  }, [executeSearch]);

  /**
   * 清除搜索结果
   */
  const clear = useCallback(() => {
    // 清除防抖定时器
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    setQuery('');
    setResults([]);
    setLoading(false);
    setError(null);
    setIsDebouncing(false);
  }, []);

  return {
    results,
    loading,
    error,
    query,
    setQuery,
    searchImmediately,
    clear,
    isDebouncing,
  };
}

/**
 * 简化版防抖Hook - 仅用于防抖值
 * 
 * @param value 需要防抖的值
 * @param delay 防抖延迟（毫秒）
 * @returns 防抖后的值
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default useDebouncedSearch;
