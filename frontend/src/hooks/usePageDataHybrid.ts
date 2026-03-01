/**
 * @file usePageDataHybrid.ts
 * @description 混合数据Hook - 从API获取页面数据
 * 已移除静态数据支持，完全使用API
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { pageService, PageFullData } from '../services/pageService';
import { debugLog } from '../utils/debugHelper';

export type DataSource = 'api' | 'static' | 'auto';
export type PageType = 'uiux' | 'ai' | 'design' | '3d' | 'ecommerce' | 'interior' | 'font';

interface UsePageDataHybridOptions {
  slug: string;
  pageType?: PageType;
  dataSource?: DataSource;
  enabled?: boolean;
}

interface Tool {
  id: string;
  name: string;
  description: string;
  url: string;
  isHot?: boolean;
  isFeatured?: boolean;
  isNew?: boolean;
  tags?: string[];
  category?: string;
}

interface CategoryData {
  id: string;
  name: string;
  slug?: string;
  icon?: string;
  color?: string;
  description?: string;
  subCategories?: { id: string; name: string; slug?: string }[];
}

interface UsePageDataHybridReturn {
  // 数据
  categories: CategoryData[];
  loading: boolean;
  error: Error | null;
  dataSource: 'api' | 'static';
  stats: { totalCategories: number; totalWebsites: number };
  
  // 方法
  getToolsByCategory: (categoryId: string) => Tool[];
  getToolsBySubCategory: (subCategoryId: string) => Tool[];
  getSubCategories: (categoryId: string) => { id: string; name: string }[];
  getHotTools: () => Tool[];
  searchTools: (keyword: string) => Tool[];
  getAllTools: () => Tool[];
  refetch: () => Promise<void>;
}

/**
 * 混合数据Hook - 优先使用API，失败时回退到静态数据
 */
export const usePageDataHybrid = ({
  slug,
  pageType,
  dataSource = 'auto',
  enabled = true
}: UsePageDataHybridOptions): UsePageDataHybridReturn => {
  const [apiData, setApiData] = useState<PageFullData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [actualDataSource, setActualDataSource] = useState<'api' | 'static'>('static');

  // 获取API数据
  const fetchApiData = useCallback(async () => {
    if (!enabled || !slug) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await pageService.getFullData(slug);
      
      // 检查API返回的数据是否有效
      if (result && result.categories && result.categories.length > 0) {
        setApiData(result);
        setActualDataSource('api');
      } else {
        // API数据为空
        setActualDataSource('api');
      }
    } catch (err) {
      debugLog.warn(`API获取失败: ${slug}`, err);
      setError(err as Error);
      setActualDataSource('api');
    } finally {
      setLoading(false);
    }
  }, [slug, enabled]);

  useEffect(() => {
    fetchApiData();
  }, [fetchApiData]);

  // 统一的数据访问方法 - 仅使用API数据
  const categories = useMemo((): CategoryData[] => {
    if (apiData) {
      return apiData.categories.map(cat => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        icon: cat.icon,
        color: cat.color,
        description: cat.description,
        subCategories: cat.subCategories
      }));
    }
    return [];
  }, [apiData]);

  const getToolsByCategory = useCallback((categoryId: string): Tool[] => {
    if (apiData) {
      const category = apiData.categories.find(c => c.id === categoryId);
      if (!category) return [];
      
      // 获取主分类和所有子分类的网站
      const tools: Tool[] = [];
      if (apiData.websitesByCategory[categoryId]) {
        tools.push(...apiData.websitesByCategory[categoryId].map(w => ({
          ...w,
          category: categoryId,
          tags: w.tags || []
        })));
      }
      for (const subCat of category.subCategories) {
        if (apiData.websitesByCategory[subCat.id]) {
          tools.push(...apiData.websitesByCategory[subCat.id].map(w => ({
            ...w,
            category: subCat.id,
            tags: w.tags || []
          })));
        }
      }
      return tools;
    }
    return [];
  }, [apiData]);

  const getToolsBySubCategory = useCallback((subCategoryId: string): Tool[] => {
    if (apiData) {
      return (apiData.websitesByCategory[subCategoryId] || []).map(w => ({
        ...w,
        category: subCategoryId,
        tags: w.tags || []
      }));
    }
    return [];
  }, [apiData]);

  const getSubCategories = useCallback((categoryId: string): { id: string; name: string }[] => {
    if (apiData) {
      const category = apiData.categories.find(c => c.id === categoryId);
      return category?.subCategories || [];
    }
    return [];
  }, [apiData]);

  const getHotTools = useCallback((): Tool[] => {
    if (apiData) {
      const allTools: Tool[] = [];
      Object.values(apiData.websitesByCategory).forEach(websites => {
        websites.forEach(w => {
          if (w.isHot) {
            allTools.push({ ...w, tags: w.tags || [] });
          }
        });
      });
      return allTools;
    }
    return [];
  }, [apiData]);

  const searchTools = useCallback((keyword: string): Tool[] => {
    if (apiData) {
      const lowerKeyword = keyword.toLowerCase();
      const results: Tool[] = [];
      Object.values(apiData.websitesByCategory).forEach(websites => {
        websites.forEach(w => {
          if (
            w.name.toLowerCase().includes(lowerKeyword) ||
            w.description.toLowerCase().includes(lowerKeyword) ||
            (w.tags || []).some(tag => tag.toLowerCase().includes(lowerKeyword))
          ) {
            results.push({ ...w, tags: w.tags || [] });
          }
        });
      });
      return results;
    }
    return [];
  }, [apiData]);

  const getAllTools = useCallback((): Tool[] => {
    if (apiData) {
      const allTools: Tool[] = [];
      Object.values(apiData.websitesByCategory).forEach(websites => {
        websites.forEach(w => {
          allTools.push({ ...w, tags: w.tags || [] });
        });
      });
      return allTools;
    }
    return [];
  }, [apiData]);

  const stats = useMemo(() => {
    if (apiData) {
      return apiData.stats;
    }
    return {
      totalCategories: categories.length,
      totalWebsites: getAllTools().length
    };
  }, [apiData, categories, getAllTools]);

  return {
    categories,
    loading,
    error,
    dataSource: actualDataSource,
    stats,
    getToolsByCategory,
    getToolsBySubCategory,
    getSubCategories,
    getHotTools,
    searchTools,
    getAllTools,
    refetch: fetchApiData
  };
};

export default usePageDataHybrid;
