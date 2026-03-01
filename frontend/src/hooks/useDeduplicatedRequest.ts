/**
 * @file useDeduplicatedRequest.ts
 * @description 请求去重Hook - 实现相同请求复用，避免重复请求
 * @copyright 版权所有 (c) 2025 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * 进行中的请求存储
 * key: 请求标识符
 * value: Promise对象
 */
const pendingRequests = new Map<string, Promise<unknown>>();

/**
 * 请求订阅者计数
 * 用于跟踪每个请求有多少个组件在等待
 */
const subscriberCount = new Map<string, number>();

/**
 * useDeduplicatedRequest Hook 配置选项
 */
export interface UseDeduplicatedRequestOptions<T> {
  /** 请求唯一标识符 */
  key: string;
  /** 数据获取函数 */
  fetcher: () => Promise<T>;
  /** 是否启用，默认true */
  enabled?: boolean;
  /** 成功回调 */
  onSuccess?: (data: T) => void;
  /** 错误回调 */
  onError?: (error: Error) => void;
}

/**
 * useDeduplicatedRequest Hook 返回值
 */
export interface UseDeduplicatedRequestReturn<T> {
  /** 响应数据 */
  data: T | null;
  /** 是否正在加载 */
  loading: boolean;
  /** 错误信息 */
  error: Error | null;
  /** 是否复用了已有请求 */
  isReused: boolean;
  /** 手动触发请求 */
  execute: () => Promise<T | null>;
  /** 重置状态 */
  reset: () => void;
}

/**
 * 增加订阅者计数
 */
const incrementSubscribers = (key: string): void => {
  const count = subscriberCount.get(key) || 0;
  subscriberCount.set(key, count + 1);
};

/**
 * 减少订阅者计数
 */
const decrementSubscribers = (key: string): void => {
  const count = subscriberCount.get(key) || 0;
  if (count <= 1) {
    subscriberCount.delete(key);
  } else {
    subscriberCount.set(key, count - 1);
  }
};

/**
 * 获取当前进行中的请求数量
 */
export const getPendingRequestCount = (): number => {
  return pendingRequests.size;
};

/**
 * 获取当前进行中的请求键列表
 */
export const getPendingRequestKeys = (): string[] => {
  return Array.from(pendingRequests.keys());
};

/**
 * 清除所有进行中的请求（用于测试）
 */
export const clearPendingRequests = (): void => {
  pendingRequests.clear();
  subscriberCount.clear();
};

/**
 * 执行去重请求
 * 如果相同key的请求正在进行中，则复用该请求
 */
const executeDeduplicatedRequest = async <T>(
  key: string,
  fetcher: () => Promise<T>
): Promise<{ data: T; isReused: boolean }> => {
  // 检查是否有进行中的相同请求
  const existingRequest = pendingRequests.get(key);
  if (existingRequest) {
    // 复用已有请求
    incrementSubscribers(key);
    try {
      const data = await existingRequest as T;
      return { data, isReused: true };
    } finally {
      decrementSubscribers(key);
    }
  }

  // 创建新请求
  const requestPromise = fetcher();
  pendingRequests.set(key, requestPromise);
  incrementSubscribers(key);

  try {
    const data = await requestPromise;
    return { data, isReused: false };
  } finally {
    // 请求完成后清理
    decrementSubscribers(key);
    // 只有当没有其他订阅者时才删除请求
    if (!subscriberCount.has(key)) {
      pendingRequests.delete(key);
    }
  }
};

/**
 * 请求去重Hook - 实现相同请求复用
 * 
 * 当多个组件同时请求相同数据时，只会发出一个实际的网络请求，
 * 所有组件共享同一个请求的结果。
 * 
 * @example
 * ```tsx
 * // 组件A和组件B同时使用相同的key
 * // 只会发出一个实际请求，两个组件共享结果
 * const { data, loading, isReused } = useDeduplicatedRequest({
 *   key: 'site-info',
 *   fetcher: () => api.get('/site-info'),
 * });
 * ```
 */
export const useDeduplicatedRequest = <T>({
  key,
  fetcher,
  enabled = true,
  onSuccess,
  onError,
}: UseDeduplicatedRequestOptions<T>): UseDeduplicatedRequestReturn<T> => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [isReused, setIsReused] = useState<boolean>(false);

  // 使用ref跟踪组件挂载状态
  const isMountedRef = useRef<boolean>(true);
  // 使用ref跟踪当前请求ID，避免竞态条件
  const requestIdRef = useRef<number>(0);

  /**
   * 执行请求
   */
  const execute = useCallback(async (): Promise<T | null> => {
    if (!enabled) return null;

    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);

    try {
      const result = await executeDeduplicatedRequest(key, fetcher);

      // 检查组件是否仍然挂载且请求未被取消
      if (!isMountedRef.current || requestId !== requestIdRef.current) {
        return null;
      }

      setData(result.data);
      setIsReused(result.isReused);
      onSuccess?.(result.data);
      return result.data;
    } catch (err) {
      // 检查组件是否仍然挂载且请求未被取消
      if (!isMountedRef.current || requestId !== requestIdRef.current) {
        return null;
      }

      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      onError?.(error);
      return null;
    } finally {
      if (isMountedRef.current && requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [key, fetcher, enabled, onSuccess, onError]);

  /**
   * 重置状态
   */
  const reset = useCallback((): void => {
    setData(null);
    setLoading(false);
    setError(null);
    setIsReused(false);
  }, []);

  /**
   * 组件挂载时自动执行请求
   */
  useEffect(() => {
    isMountedRef.current = true;

    if (enabled) {
      execute();
    }

    return () => {
      isMountedRef.current = false;
    };
  }, [enabled, execute]);

  return {
    data,
    loading,
    error,
    isReused,
    execute,
    reset,
  };
};

export default useDeduplicatedRequest;
