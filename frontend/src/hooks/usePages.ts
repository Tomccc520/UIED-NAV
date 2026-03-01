/**
 * @file usePages.ts
 * @description 前端用户界面组件
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

import { useState, useEffect } from 'react';
import { pageService, PageConfig } from '../services/pageService';

interface UsePagesReturn {
  pages: PageConfig[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * 获取所有页面配置的 Hook
 * 用于导航栏动态生成页面切换选项
 */
export const usePages = (): UsePagesReturn => {
  const [pages, setPages] = useState<PageConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchPages = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await pageService.getAll();
      // 只返回可见的页面，按 order 排序
      const visiblePages = data
        .filter(p => p.visible !== false)
        .sort((a, b) => (a.order || 0) - (b.order || 0));
      setPages(visiblePages);
    } catch (err) {
      setError(err as Error);
      console.error('Failed to fetch pages:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPages();
  }, []);

  return {
    pages,
    loading,
    error,
    refetch: fetchPages,
  };
};

export default usePages;
