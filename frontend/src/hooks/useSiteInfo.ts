/**
 * @file useSiteInfo.ts
 * @description 前端用户界面组件
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

import { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import SiteContext, { 
  DEFAULT_SITE_INFO,
} from '../contexts/SiteContext';

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
 * useSiteInfo Hook
 * 
 * 如果在SiteProvider内部使用，会使用Context中的数据
 * 如果在SiteProvider外部使用，会独立获取数据（向后兼容）
 * 
 * Requirements: 8.1, 8.2, 8.4
 */
export const useSiteInfo = () => {
  // 尝试使用Context
  const context = useContext(SiteContext);
  
  // 始终调用standalone hook以遵守React Hooks规则
  const standaloneResult = useSiteInfoStandalone();
  
  // 如果在SiteProvider内部，使用Context数据
  if (context !== undefined) {
    return {
      siteInfo: context.siteInfo,
      loading: context.loading,
      error: context.error,
      refresh: context.refresh,
      isUsingDefault: context.isUsingDefault,
    };
  }
  
  // 向后兼容：如果在SiteProvider外部使用，返回独立获取的数据
  return standaloneResult;
};

/**
 * 独立的站点信息Hook（不依赖Context）
 * 用于向后兼容
 */
const useSiteInfoStandalone = () => {
  const [siteInfo, setSiteInfo] = useState<SiteInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchSiteInfo = async () => {
    try {
      setLoading(true);
      const response = await api.get('/site-info');
      setSiteInfo(response.data);
      setError(null);
    } catch (err) {
      setError(err as Error);
      console.error('Failed to fetch site info:', err);
      // 设置默认值以防API失败
      setSiteInfo(DEFAULT_SITE_INFO);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSiteInfo();
    
    // 每30秒刷新一次站点信息
    const interval = setInterval(fetchSiteInfo, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // 提供手动刷新方法
  const refresh = () => {
    fetchSiteInfo();
  };

  return { 
    siteInfo, 
    loading, 
    error, 
    refresh,
    isUsingDefault: siteInfo === null || siteInfo === DEFAULT_SITE_INFO,
  };
};
