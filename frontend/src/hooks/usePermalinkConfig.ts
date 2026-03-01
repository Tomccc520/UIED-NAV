/**
 * @file usePermalinkConfig.ts
 * @description 固定链接配置 Hook - 获取后台配置的 URL 结构和热门推荐点击行为
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export interface PermalinkConfig {
  structure: 'plain' | 'id' | 'name' | 'custom';
  customPattern: string;
}

const defaultConfig: PermalinkConfig = {
  structure: 'plain',
  customPattern: '',
};

// 全局缓存
let cachedConfig: PermalinkConfig | null = null;
let configPromise: Promise<PermalinkConfig> | null = null;

/**
 * 获取固定链接配置 Hook
 */
export const usePermalinkConfig = () => {
  const [config, setConfig] = useState<PermalinkConfig>(cachedConfig || defaultConfig);
  const [loading, setLoading] = useState(!cachedConfig);

  const fetchConfig = useCallback(async () => {
    if (cachedConfig) {
      setConfig(cachedConfig);
      setLoading(false);
      return;
    }

    if (configPromise) {
      const result = await configPromise;
      setConfig(result);
      setLoading(false);
      return;
    }

    setLoading(true);
    configPromise = api.get('/settings/permalink')
      .then(res => {
        const data = res.data.data || res.data;
        const newConfig: PermalinkConfig = {
          structure: data.structure || 'plain',
          customPattern: data.customPattern || '',
        };
        cachedConfig = newConfig;
        return newConfig;
      })
      .catch(() => {
        cachedConfig = defaultConfig;
        return defaultConfig;
      })
      .finally(() => {
        configPromise = null;
      });

    const result = await configPromise;
    setConfig(result);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  return { config, loading };
};

/**
 * 直接获取配置（非 Hook 版本）
 */
export const getPermalinkConfig = async (): Promise<PermalinkConfig> => {
  if (cachedConfig) return cachedConfig;
  
  try {
    const res = await api.get('/settings/permalink');
    const data = res.data.data || res.data;
    cachedConfig = {
      structure: data.structure || 'plain',
      customPattern: data.customPattern || '',
    };
    return cachedConfig;
  } catch {
    return defaultConfig;
  }
};

/**
 * 根据配置生成网站详情页 URL
 */
export const generateWebsiteUrl = (
  config: PermalinkConfig,
  website: { id: string; slug?: string }
): string => {
  const { structure, customPattern } = config;
  const slug = website.slug || website.id;
  
  switch (structure) {
    case 'plain':
      return `/website/${website.id}`;
    case 'id':
      return `/website/${website.id}.html`;
    case 'name':
      return `/website/${slug}`;
    case 'custom':
      if (customPattern) {
        return `/website/${customPattern
          .replace('%id%', website.id)
          .replace('%slug%', slug)
          .replace('%name%', slug)}`;
      }
      return `/website/${website.id}`;
    default:
      return `/website/${website.id}`;
  }
};

export default usePermalinkConfig;
