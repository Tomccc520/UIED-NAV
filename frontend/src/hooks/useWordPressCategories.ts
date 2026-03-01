/**
 * @file useWordPressCategories.ts
 * @description WordPress 分类配置 Hook - 从 API 获取分类配置
 */

import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { unwrapApiList } from '../utils/apiResponse';

export interface WordPressCategory {
  id: string;
  wpCategoryId: number;
  wpCategoryName: string;
  displayName: string;
  slug: string;
  description?: string;
  order: number;
  visible: boolean;
  pageSlug?: string;
}

interface UseWordPressCategoriesOptions {
  pageSlug?: string;
  enabled?: boolean;
}

interface UseWordPressCategoriesReturn {
  categories: WordPressCategory[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  getCategoryById: (wpCategoryId: number) => WordPressCategory | undefined;
}

// 默认分类数据（作为备用）
const DEFAULT_CATEGORIES: WordPressCategory[] = [
  { id: '1', wpCategoryId: 334, wpCategoryName: 'UI', displayName: 'UI', slug: 'ui', order: 1, visible: true },
  { id: '2', wpCategoryId: 337, wpCategoryName: 'UX', displayName: 'UX', slug: 'ux', order: 2, visible: true },
  { id: '3', wpCategoryId: 336, wpCategoryName: '产品', displayName: '产品', slug: 'product', order: 3, visible: true },
  { id: '4', wpCategoryId: 335, wpCategoryName: '平面', displayName: '平面', slug: 'graphic', order: 4, visible: true },
  { id: '5', wpCategoryId: 1031, wpCategoryName: '三维', displayName: '三维', slug: '3d', order: 5, visible: true },
  { id: '6', wpCategoryId: 307, wpCategoryName: '设计干货', displayName: '设计干货', slug: 'tips', order: 6, visible: true },
  { id: '7', wpCategoryId: 1861, wpCategoryName: '设计灵感', displayName: '设计灵感', slug: 'inspiration', order: 7, visible: true },
  { id: '8', wpCategoryId: 319, wpCategoryName: '字体', displayName: '字体', slug: 'font', order: 8, visible: true },
  { id: '9', wpCategoryId: 417, wpCategoryName: 'AIGC', displayName: 'AIGC', slug: 'aigc', order: 9, visible: true },
];

/**
 * WordPress 分类配置 Hook
 */
export const useWordPressCategories = (
  options: UseWordPressCategoriesOptions = {}
): UseWordPressCategoriesReturn => {
  const { pageSlug, enabled = true } = options;
  
  const [categories, setCategories] = useState<WordPressCategory[]>(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!enabled) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const params: Record<string, string> = {};
      if (pageSlug) params.pageSlug = pageSlug;
      
      const response = await api.get('/wordpress/categories/active', { params });
      const normalized = unwrapApiList<WordPressCategory>(response.data);
      if (normalized.length > 0) {
        setCategories(normalized);
      } else {
        // 如果 API 返回空数据，使用默认分类
        setCategories(DEFAULT_CATEGORIES);
      }
    } catch (err) {
      setError(err as Error);
      console.error('Failed to fetch WordPress categories:', err);
      // 出错时使用默认分类
      setCategories(DEFAULT_CATEGORIES);
    } finally {
      setLoading(false);
    }
  }, [pageSlug, enabled]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 根据 WordPress 分类 ID 获取分类
  const getCategoryById = useCallback((wpCategoryId: number) => {
    return categories.find(cat => cat.wpCategoryId === wpCategoryId);
  }, [categories]);

  return {
    categories,
    loading,
    error,
    refetch: fetchData,
    getCategoryById,
  };
};

export default useWordPressCategories;
