/**
 * @file SiteContext.tsx
 * @description 站点信息全局Context，实现站点信息的全局共享和缓存
 * @copyright 版权所有 (c) 2025 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 * 
 * Requirements: 8.1, 8.2, 8.4
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import api from '../services/api';

/**
 * 站点信息接口
 */
export interface SiteInfo {
  id: number;
  siteName: string;
  siteTitle: string;
  description: string;
  keywords: string;
  logo: string;
  favicon: string;
  icp?: string;
  icpLink?: string;
  copyright?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * 默认站点信息 - 用于降级处理
 * Requirements: 8.4
 */
export const DEFAULT_SITE_INFO: SiteInfo = {
  id: 0,
  siteName: 'UIED设计导航',
  siteTitle: 'UIED设计导航 - 设计师的工具导航平台',
  description: 'UIED设计导航汇集优质设计工具与资源',
  keywords: '设计导航,UI设计,UX设计',
  logo: '/logo-3.svg',
  favicon: '/favicon.ico',
};

/**
 * SiteContext值接口
 */
export interface SiteContextValue {
  siteInfo: SiteInfo;
  loading: boolean;
  error: Error | null;
  isUsingDefault: boolean;
  refresh: () => Promise<void>;
}

/**
 * 创建Context
 */
const SiteContext = createContext<SiteContextValue | undefined>(undefined);

/**
 * SiteProvider Props
 */
interface SiteProviderProps {
  children: ReactNode;
  /** 自定义默认值（用于测试） */
  defaultSiteInfo?: SiteInfo;
  /** 刷新间隔（毫秒），默认30分钟 */
  refreshInterval?: number;
}

/**
 * SiteProvider组件
 * 提供站点信息的全局状态管理
 * 
 * Requirements: 8.1, 8.2
 */
export const SiteProvider: React.FC<SiteProviderProps> = ({
  children,
  defaultSiteInfo = DEFAULT_SITE_INFO,
  refreshInterval = 30 * 60 * 1000, // 30分钟
}) => {
  const [siteInfo, setSiteInfo] = useState<SiteInfo>(defaultSiteInfo);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isUsingDefault, setIsUsingDefault] = useState(true);

  /**
   * 获取站点信息
   * Requirements: 8.1, 8.4
   */
  const fetchSiteInfo = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/site-info');
      
      if (response.data) {
        setSiteInfo(response.data);
        setIsUsingDefault(false);
        setError(null);
      } else {
        // API返回空数据，使用默认值
        setSiteInfo(defaultSiteInfo);
        setIsUsingDefault(true);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch site info');
      setError(error);
      console.error('Failed to fetch site info:', err);
      
      // 降级处理：使用默认值
      // Requirements: 8.4
      setSiteInfo(defaultSiteInfo);
      setIsUsingDefault(true);
    } finally {
      setLoading(false);
    }
  }, [defaultSiteInfo]);

  /**
   * 手动刷新方法
   * Requirements: 8.2
   */
  const refresh = useCallback(async () => {
    await fetchSiteInfo();
  }, [fetchSiteInfo]);

  /**
   * 初始化加载和定时刷新
   * Requirements: 8.1
   */
  useEffect(() => {
    fetchSiteInfo();

    // 设置定时刷新
    const intervalId = setInterval(fetchSiteInfo, refreshInterval);

    return () => {
      clearInterval(intervalId);
    };
  }, [fetchSiteInfo, refreshInterval]);

  const value: SiteContextValue = {
    siteInfo,
    loading,
    error,
    isUsingDefault,
    refresh,
  };

  return (
    <SiteContext.Provider value={value}>
      {children}
    </SiteContext.Provider>
  );
};

/**
 * useSiteContext Hook
 * 用于在组件中访问站点信息
 * 
 * @throws {Error} 如果在SiteProvider外部使用
 */
export const useSiteContext = (): SiteContextValue => {
  const context = useContext(SiteContext);
  
  if (context === undefined) {
    throw new Error('useSiteContext must be used within a SiteProvider');
  }
  
  return context;
};

/**
 * 降级处理工具函数
 * 用于在任何情况下都能获取有效的站点信息
 * 
 * Requirements: 8.4
 */
export const getSafeValue = <K extends keyof SiteInfo>(
  siteInfo: SiteInfo | null | undefined,
  key: K,
  fallback?: SiteInfo[K]
): SiteInfo[K] => {
  if (siteInfo && siteInfo[key] !== undefined && siteInfo[key] !== null) {
    const value = siteInfo[key];
    // For string fields, also check for empty strings
    if (typeof value === 'string' && value.length === 0) {
      return fallback !== undefined ? fallback : DEFAULT_SITE_INFO[key];
    }
    return value;
  }
  return fallback !== undefined ? fallback : DEFAULT_SITE_INFO[key];
};

/**
 * 合并站点信息与默认值
 * 确保所有必需字段都有值
 * 
 * Requirements: 8.4
 */
export const mergeSiteInfoWithDefaults = (
  siteInfo: Partial<SiteInfo> | null | undefined
): SiteInfo => {
  if (!siteInfo) {
    return { ...DEFAULT_SITE_INFO };
  }
  
  return {
    id: siteInfo.id ?? DEFAULT_SITE_INFO.id,
    siteName: siteInfo.siteName || DEFAULT_SITE_INFO.siteName,
    siteTitle: siteInfo.siteTitle || DEFAULT_SITE_INFO.siteTitle,
    description: siteInfo.description || DEFAULT_SITE_INFO.description,
    keywords: siteInfo.keywords || DEFAULT_SITE_INFO.keywords,
    logo: siteInfo.logo || DEFAULT_SITE_INFO.logo,
    favicon: siteInfo.favicon || DEFAULT_SITE_INFO.favicon,
    icp: siteInfo.icp,
    icpLink: siteInfo.icpLink,
    copyright: siteInfo.copyright,
    createdAt: siteInfo.createdAt,
    updatedAt: siteInfo.updatedAt,
  };
};

/**
 * 验证站点信息是否有效
 * 
 * Requirements: 8.4
 */
export const isValidSiteInfo = (siteInfo: unknown): siteInfo is SiteInfo => {
  if (!siteInfo || typeof siteInfo !== 'object') {
    return false;
  }
  
  const info = siteInfo as Record<string, unknown>;
  
  // 检查必需字段
  return (
    typeof info.siteName === 'string' &&
    typeof info.siteTitle === 'string' &&
    typeof info.description === 'string' &&
    typeof info.keywords === 'string' &&
    typeof info.logo === 'string' &&
    typeof info.favicon === 'string'
  );
};

export default SiteContext;
