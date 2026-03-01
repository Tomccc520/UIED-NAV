/**
 * @file usePageConfig.ts
 * @description 页面配置 Hook - 获取页面的 Hero 区域配置和滚动网站数据
 */

import { useState, useEffect } from 'react';
import api from '../services/api';
import { unwrapApiResponse } from '../utils/apiResponse';
import { debugLog } from '../utils/debugHelper';

interface PageConfig {
  heroTitle?: string;
  heroSubtitle?: string;
  heroHighlightText?: string;
  hotSearchTags?: string | string[];
  heroDisplayMode?: string;
  heroScrollWebsites?: string;
  heroBgType?: string;
  heroBgValue?: string;
  searchPlaceholder?: string;
  searchEnabled?: boolean;
  showHotRecommendations?: boolean;
  showCategories?: boolean;
  showSidebar?: boolean;
  themeColor?: string;
}

interface ScrollWebsite {
  id: string;
  name: string;
  iconUrl?: string;
  url: string;
  oldId?: string;
}

interface UsePageConfigReturn {
  pageConfig: PageConfig | null;
  heroScrollWebsites: ScrollWebsite[];
  dynamicHotTags: string[];
  loading: boolean;
  error: Error | null;
}

interface PageFullDataResponse {
  page?: PageConfig;
}

interface HotTagsResponse {
  tags?: string[];
}

interface WebsiteListResponse {
  websites?: ScrollWebsite[];
}

/**
 * 页面配置 Hook
 * @param slug - 页面 slug
 * @param enabled - 是否启用（默认 true）
 */
export const usePageConfig = (slug: string, enabled: boolean = true): UsePageConfigReturn => {
  const [pageConfig, setPageConfig] = useState<PageConfig | null>(null);
  const [heroScrollWebsites, setHeroScrollWebsites] = useState<ScrollWebsite[]>([]);
  const [dynamicHotTags, setDynamicHotTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // 获取页面配置
  useEffect(() => {
    if (!enabled || !slug) return;

    setLoading(true);
    api.get(`/pages/${slug}/full`)
      .then(res => {
        const data = unwrapApiResponse<PageFullDataResponse>(res.data, {});
        setPageConfig(data.page || null);
        setError(null);
      })
      .catch(err => {
        debugLog.error('获取页面配置失败:', err);
        setError(err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [slug, enabled]);

  // 获取动态热门标签（按点击量排序）
  useEffect(() => {
    if (!enabled || !slug) return;

    api.get(`/pages/${slug}/hot-tags`, { params: { limit: 10 } })
      .then(res => {
        const data = unwrapApiResponse<HotTagsResponse>(res.data, {});
        const tags = data.tags || [];
        setDynamicHotTags(tags);
      })
      .catch(err => {
        debugLog.error('获取热门标签失败:', err);
        // 失败时不影响其他功能
      });
  }, [slug, enabled]);

  // 获取滚动图标墙的网站数据
  useEffect(() => {
    debugLog.dev('[usePageConfig] heroDisplayMode:', pageConfig?.heroDisplayMode);
    debugLog.dev('[usePageConfig] heroScrollWebsites:', pageConfig?.heroScrollWebsites);
    
    if (!pageConfig?.heroDisplayMode || pageConfig.heroDisplayMode !== 'iconScroll') {
      setHeroScrollWebsites([]);
      return;
    }

    if (!pageConfig.heroScrollWebsites) {
      setHeroScrollWebsites([]);
      return;
    }

    try {
      const websiteIds = JSON.parse(pageConfig.heroScrollWebsites);
      debugLog.dev('[usePageConfig] Parsed websiteIds:', websiteIds);
      
      if (!Array.isArray(websiteIds) || websiteIds.length === 0) {
        setHeroScrollWebsites([]);
        return;
      }

      api.get('/websites', { params: { ids: websiteIds.join(','), limit: 100 } })
        .then(res => {
          debugLog.dev('[usePageConfig] Websites API response:', res.data);
          const rawData = unwrapApiResponse<ScrollWebsite[] | WebsiteListResponse>(res.data, []);
          const websites = Array.isArray(rawData) ? rawData : (rawData.websites || []);
          // 按原顺序排列，支持新数字ID和旧cuid格式匹配，使用字符串比较确保类型匹配
          const sortedWebsites = websiteIds
            .map((id: string | number) => websites.find((w) => String(w.id) === String(id) || String(w.oldId || '') === String(id)))
            .filter((w): w is ScrollWebsite => Boolean(w && w.id && w.name && w.url))
            .map((w) => ({
              id: w.id,
              name: w.name,
              iconUrl: w.iconUrl,
              url: w.url,
              oldId: w.oldId,
            }));
          debugLog.dev('[usePageConfig] Final heroScrollWebsites:', sortedWebsites);
          setHeroScrollWebsites(sortedWebsites);
        })
        .catch(err => {
          debugLog.error('获取滚动网站数据失败:', err);
        });
    } catch (e) {
      debugLog.error('解析滚动网站ID失败:', e);
      setHeroScrollWebsites([]);
    }
  }, [pageConfig?.heroDisplayMode, pageConfig?.heroScrollWebsites]);

  return {
    pageConfig,
    heroScrollWebsites,
    dynamicHotTags,
    loading,
    error
  };
};

export default usePageConfig;
