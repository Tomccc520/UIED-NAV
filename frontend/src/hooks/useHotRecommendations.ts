/**
 * @file useHotRecommendations.ts
 * @description 热门推荐数据 Hook - 从 API 获取热门推荐
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../services/api';
import { unwrapApiList } from '../utils/apiResponse';
import { debugLog } from '../utils/debugHelper';

export interface HotRecommendation {
  id: string;
  name: string;
  description: string;
  url: string;
  iconUrl?: string;
  pageSlug?: string;
  position: 'hot' | 'featured' | 'ad';
  order: number;
  visible: boolean;
  clickCount: number;
  websiteId?: number | null;
  websiteSlug?: string | null;
}

interface UseHotRecommendationsOptions {
  pageSlug?: string;
  position?: 'hot' | 'featured' | 'ad' | 'all'; // 新增 'all' 选项
  limit?: number;
  enabled?: boolean;
}

interface UseHotRecommendationsReturn {
  items: HotRecommendation[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  recordClick: (id: string) => Promise<void>;
  getByPosition: (position: 'hot' | 'featured' | 'ad') => HotRecommendation[];
  // 新增：获取所有位置的统计
  positionStats: { position: string; name: string; count: number }[];
}

// 位置名称映射
const positionNames: Record<string, string> = {
  'hot': '热门推荐',
  'featured': '精选推荐',
  'ad': 'UIED系列',
};

/**
 * 热门推荐 Hook
 */
export const useHotRecommendations = (
  options: UseHotRecommendationsOptions = {}
): UseHotRecommendationsReturn => {
  const { pageSlug, position, limit = 50, enabled = true } = options;
  
  const [items, setItems] = useState<HotRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  /**
   * 统一解包热门推荐列表响应，兼容旧结构与 { code, data, message } 结构。
   */
  const unwrapHotRecommendationList = useCallback((payload: unknown): HotRecommendation[] => {
    return unwrapApiList<HotRecommendation>(payload);
  }, []);

  /**
   * 获取热门推荐数据。
   */
  const fetchData = useCallback(async () => {
    if (!enabled) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const params: Record<string, string | number> = { limit };
      if (pageSlug) params.pageSlug = pageSlug;
      // 如果 position 是 'all' 或未指定，不传 position 参数，获取所有
      if (position && position !== 'all') params.position = position;
      
      const response = await api.get('/hot-recommendations/active', { params });
      const normalizedItems = unwrapHotRecommendationList(response.data);
      setItems(Array.isArray(normalizedItems) ? normalizedItems : []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err : new Error('获取热门推荐失败'));
      setItems([]);
      debugLog.error('Failed to fetch hot recommendations:', err);
    } finally {
      setLoading(false);
    }
  }, [enabled, limit, pageSlug, position, unwrapHotRecommendationList]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 记录点击
  const recordClick = useCallback(async (id: string) => {
    try {
      await api.post(`/hot-recommendations/${id}/click`);
    } catch (err) {
      debugLog.error('Failed to record click:', err);
    }
  }, []);

  // 按位置筛选
  const safeItems = useMemo(() => (Array.isArray(items) ? items : []), [items]);

  // 按位置筛选
  const getByPosition = useCallback((pos: 'hot' | 'featured' | 'ad') => {
    return safeItems.filter(item => item.position === pos);
  }, [safeItems]);

  // 计算位置统计
  const positionStats = useMemo(() => {
    const stats: { position: string; name: string; count: number }[] = [];
    const positions = ['hot', 'featured', 'ad'] as const;
    
    positions.forEach(pos => {
      const count = safeItems.filter(item => item.position === pos).length;
      if (count > 0) {
        stats.push({
          position: pos,
          name: positionNames[pos] || pos,
          count
        });
      }
    });
    
    return stats;
  }, [safeItems]);

  return {
    items,
    loading,
    error,
    refetch: fetchData,
    recordClick,
    getByPosition,
    positionStats,
  };
};

export default useHotRecommendations;
