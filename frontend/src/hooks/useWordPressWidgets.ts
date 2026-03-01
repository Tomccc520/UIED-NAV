/**
 * @file useWordPressWidgets.ts
 * @description WordPress 组件配置 Hook - 从 API 获取组件配置
 */

import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { unwrapApiList } from '../utils/apiResponse';
import { debugLog } from '../utils/debugHelper';

export interface WordPressWidget {
  id: string;
  name: string;
  pageSlug: string;
  position: string;
  componentType: string;
  title?: string;
  limit: number;
  showMoreLink?: string;
  categoryIds: number[];
  tagIds: number[];
  order: number;
  visible: boolean;
  settings?: Record<string, unknown>;
}

interface UseWordPressWidgetsOptions {
  pageSlug?: string;
  position?: string;
  enabled?: boolean;
}

interface UseWordPressWidgetsReturn {
  widgets: WordPressWidget[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  getWidgetByPosition: (position: string) => WordPressWidget | undefined;
}

/**
 * WordPress 组件配置 Hook
 */
export const useWordPressWidgets = (
  options: UseWordPressWidgetsOptions = {}
): UseWordPressWidgetsReturn => {
  const { pageSlug, enabled = true } = options;
  
  const [widgets, setWidgets] = useState<WordPressWidget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const params: Record<string, string> = {};
      if (pageSlug) params.pageSlug = pageSlug;
      
      debugLog.dev('[useWordPressWidgets] 请求参数:', { pageSlug, params });
      
      const response = await api.get('/wordpress/widgets/active', { params });
      
      const data = unwrapApiList<WordPressWidget>(response.data);
      
      // 注意：不在这里按 position 筛选，让 getWidgetByPosition 来处理
      // 这样 widgets 数组包含该页面的所有组件
      
      setWidgets(data);
    } catch (err) {
      setError(err as Error);
      debugLog.error('Failed to fetch WordPress widgets:', err);
      setWidgets([]);
    } finally {
      setLoading(false);
    }
  }, [pageSlug, enabled]); // 移除 position 依赖，因为不再在这里筛选

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 根据位置获取组件配置
  const getWidgetByPosition = useCallback((pos: string) => {
    // 先精确匹配位置
    let found = widgets.find(w => w.position === pos);
    
    // 如果没找到，尝试使用第一个可用的组件（兼容旧配置）
    if (!found && widgets.length > 0) {
      found = widgets[0];
    }
    
    return found;
  }, [widgets]);

  return {
    widgets,
    loading,
    error,
    refetch: fetchData,
    getWidgetByPosition,
  };
};

export default useWordPressWidgets;
