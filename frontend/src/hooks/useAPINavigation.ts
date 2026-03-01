/**
 * @file useAPINavigation.ts
 * @description API导航Hook - 从后端API获取数据的导航Hook
 * 可以替代useNavigation，实现前后端数据对接
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigation, type NavigationHookReturn, type DataService } from './useNavigation';
import { APIDataService, createAPIDataService } from '../services/apiDataService';
import { NavMenuType } from '../types';
import { IconComponent } from '../types/icon';
import { debugLog } from '../utils/debugHelper';

interface UseAPINavigationConfig {
  slug: string;
  navType: NavMenuType;
  iconComponents: Record<string, IconComponent>;
  searchPageType?: string;
  fallbackDataService?: DataService; // 可选的静态数据服务作为后备
}

interface UseAPINavigationReturn extends NavigationHookReturn {
  dataSource: 'api' | 'static' | 'loading';
  apiError: Error | null;
  apiDataService: APIDataService | null;
  refetchData: () => Promise<void>;
}

/**
 * API导航Hook - 优先使用API数据，失败时可回退到静态数据
 */
export const useAPINavigation = (config: UseAPINavigationConfig): UseAPINavigationReturn => {
  const { slug, navType, iconComponents, searchPageType, fallbackDataService } = config;
  
  const [apiDataService, setApiDataService] = useState<APIDataService | null>(null);
  const [dataSource, setDataSource] = useState<'api' | 'static' | 'loading'>('loading');
  const [apiError, setApiError] = useState<Error | null>(null);
  const [dataVersion, setDataVersion] = useState(0); // 用于触发重新初始化

  // 加载API数据
  const loadAPIData = useCallback(async () => {
    setDataSource('loading');
    setApiError(null);
    
    try {
      const service = createAPIDataService(slug, iconComponents);
      await service.loadData();
      
      if (service.isLoaded() && !service.getError()) {
        // 检查数据是否有效
        const navItems = service.getNavItems();
        debugLog.dev(`[useAPINavigation] ${slug} - API数据加载成功，分类数量: ${navItems.length}`);
        debugLog.dev(`[useAPINavigation] ${slug} - 分类列表:`, navItems.map(item => item.name));
        if (navItems.length > 0) {
          debugLog.dev(`[useAPINavigation] ${slug} - 第一个分类ID: ${navItems[0].id}`);
          setApiDataService(service);
          setDataSource('api');
          setDataVersion(v => v + 1); // 触发重新初始化
          return;
        }
      }
      
      // API数据无效，使用静态数据
      throw new Error('API数据为空或无效');
    } catch (err) {
      console.warn(`API加载失败，使用静态数据: ${slug}`, err);
      setApiError(err as Error);
      setDataSource('static');
      setDataVersion(v => v + 1); // 触发重新初始化
    }
  }, [slug, iconComponents]);

  // 初始化加载
  useEffect(() => {
    loadAPIData();
  }, [loadAPIData]);

  // 选择使用的数据服务
  const activeDataService = useMemo((): DataService => {
    if (dataSource === 'api' && apiDataService) {
      return apiDataService;
    }
    if (fallbackDataService) {
      return fallbackDataService;
    }
    // 返回一个空的数据服务
    return {
      getNavItems: () => [],
      getWebsites: () => [],
      searchWebsites: () => [],
      getStats: () => ({
        totalWebsites: 0,
        totalCategories: 0,
        updateDate: new Date().toISOString().split('T')[0]
      })
    };
  }, [dataSource, apiDataService, fallbackDataService]);

  // 使用基础导航Hook
  const navigationResult = useNavigation({
    navType,
    dataService: activeDataService,
    searchPageType,
    dataVersion, // 传递数据版本以触发重新初始化
    pageSlug: slug // 传递页面标识以支持页面级跳转提醒配置
  });

  // 重新获取数据
  const refetchData = useCallback(async () => {
    await loadAPIData();
  }, [loadAPIData]);

  return {
    ...navigationResult,
    dataSource,
    apiError,
    apiDataService,
    refetchData
  };
};

export default useAPINavigation;
