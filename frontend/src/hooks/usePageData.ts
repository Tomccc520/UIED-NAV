/**
 * @file usePageData.ts
 * @description 前端用户界面组件
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { pageService, PageFullData, Website, Category, SubCategory } from '../services/pageService';
import { debugLog } from '../utils/debugHelper';

interface UsePageDataOptions {
  slug: string;
  enabled?: boolean;
}

interface UsePageDataReturn {
  // 数据
  pageConfig: PageFullData['page'] | null;
  categories: Category[];
  websitesByCategory: Record<string, Website[]>;
  stats: PageFullData['stats'] | null;
  dynamicHotTags: string[];
  
  // 状态
  loading: boolean;
  error: Error | null;
  
  // 方法
  getWebsitesByCategory: (categoryId: string) => Website[];
  getWebsitesBySubCategory: (subCategoryId: string) => Website[];
  getSubCategories: (categoryId: string) => SubCategory[];
  getHotWebsites: () => Website[];
  getFeaturedWebsites: () => Website[];
  searchWebsites: (keyword: string) => Website[];
  getAllWebsites: () => Website[];
  refetch: () => Promise<void>;
}

/**
 * 页面数据 Hook - 从 API 获取页面配置、分类和网站数据
 */
export const usePageData = ({ slug, enabled = true }: UsePageDataOptions): UsePageDataReturn => {
  const [data, setData] = useState<PageFullData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [dynamicHotTags, setDynamicHotTags] = useState<string[]>([]);
  // 用于跟踪是否是首次加载
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // 获取数据
  const fetchData = useCallback(async () => {
    if (!enabled || !slug) return;
    
    try {
      // 只在首次加载时显示 loading 状态，避免刷新时闪烁
      if (isInitialLoad) {
        setLoading(true);
      }
      setError(null);
      const result = await pageService.getFullData(slug);
      setData(result);
      setIsInitialLoad(false);
    } catch (err) {
      setError(err as Error);
      debugLog.error(`Failed to fetch page data for ${slug}:`, err);
    } finally {
      setLoading(false);
    }
  }, [slug, enabled, isInitialLoad]);

  // 获取动态热门标签（按点击量排序）
  const fetchHotTags = useCallback(async () => {
    if (!enabled || !slug) return;
    
    try {
      const response = await pageService.getHotTags(slug, 10);
      setDynamicHotTags(response.tags || []);
    } catch (err) {
      debugLog.error(`Failed to fetch hot tags for ${slug}:`, err);
      // 失败时不影响其他功能
    }
  }, [slug, enabled]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchHotTags();
  }, [fetchHotTags]);

  // 所有网站的扁平列表
  const allWebsites = useMemo(() => {
    if (!data?.websitesByCategory) return [];
    return Object.values(data.websitesByCategory).flat();
  }, [data?.websitesByCategory]);

  // 根据主分类获取网站
  const getWebsitesByCategory = useCallback((categoryId: string): Website[] => {
    if (!data?.websitesByCategory || !data?.categories) return [];
    
    // 找到该分类
    const category = data.categories.find(c => c.id === categoryId);
    if (!category) return [];
    
    // 获取该分类及其子分类的所有网站
    const websites: Website[] = [];
    
    // 主分类的网站
    if (data.websitesByCategory[categoryId]) {
      websites.push(...data.websitesByCategory[categoryId]);
    }
    
    // 子分类的网站
    for (const subCat of category.subCategories) {
      if (data.websitesByCategory[subCat.id]) {
        websites.push(...data.websitesByCategory[subCat.id]);
      }
    }
    
    return websites;
  }, [data]);

  // 根据子分类获取网站
  const getWebsitesBySubCategory = useCallback((subCategoryId: string): Website[] => {
    if (!data?.websitesByCategory) return [];
    return data.websitesByCategory[subCategoryId] || [];
  }, [data?.websitesByCategory]);

  // 获取分类的子分类
  const getSubCategories = useCallback((categoryId: string): SubCategory[] => {
    if (!data?.categories) return [];
    const category = data.categories.find(c => c.id === categoryId);
    return category?.subCategories || [];
  }, [data?.categories]);

  // 获取热门网站
  const getHotWebsites = useCallback((): Website[] => {
    return allWebsites.filter(w => w.isHot);
  }, [allWebsites]);

  // 获取推荐网站
  const getFeaturedWebsites = useCallback((): Website[] => {
    return allWebsites.filter(w => w.isFeatured);
  }, [allWebsites]);

  // 搜索网站
  const searchWebsites = useCallback((keyword: string): Website[] => {
    if (!keyword) return [];
    const lowerKeyword = keyword.toLowerCase();
    return allWebsites.filter(w => 
      w.name.toLowerCase().includes(lowerKeyword) ||
      w.description.toLowerCase().includes(lowerKeyword) ||
      w.tags.some(tag => tag.toLowerCase().includes(lowerKeyword))
    );
  }, [allWebsites]);

  // 获取所有网站
  const getAllWebsites = useCallback((): Website[] => {
    return allWebsites;
  }, [allWebsites]);

  return {
    pageConfig: data?.page || null,
    categories: data?.categories || [],
    websitesByCategory: data?.websitesByCategory || {},
    stats: data?.stats || null,
    dynamicHotTags,
    loading,
    error,
    getWebsitesByCategory,
    getWebsitesBySubCategory,
    getSubCategories,
    getHotWebsites,
    getFeaturedWebsites,
    searchWebsites,
    getAllWebsites,
    refetch: fetchData,
  };
};

export default usePageData;
