/**
 * @file pageService.ts
 * @description 前端用户界面组件
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

import api from './api';
import { unwrapApiList, unwrapApiResponse } from '../utils/apiResponse';

// 页面配置类型
export interface PageConfig {
  id: string;
  name: string;
  slug: string;
  type: string;
  icon?: string;
  description?: string;
  order?: number;
  visible?: boolean;
  heroTitle?: string;
  heroSubtitle?: string;
  heroHighlightText?: string;  // 高亮文本
  hotSearchTags?: string | string[];  // 可能是字符串或数组
  heroDisplayMode?: string;  // 显示模式: search, iconScroll
  heroScrollWebsites?: string; // 滚动图标的网站ID列表，JSON数组
  heroBgType?: string;  // 背景类型: default, color, gradient, image
  heroBgValue?: string; // 背景值
  searchPlaceholder?: string;
  searchEnabled: boolean;
  showHotRecommendations: boolean;
  showCategories: boolean;
  showSidebar?: boolean;
  themeColor?: string;
}

// 子分类类型
export interface SubCategory {
  id: string;
  name: string;
  slug: string;
}

// 分类类型
export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
  description?: string;
  order: number;
  subCategories: SubCategory[];
}

// 网站/工具类型
export interface Website {
  id: string;
  name: string;
  description: string;
  url: string;
  iconUrl?: string;
  isHot: boolean;
  isFeatured: boolean;
  isNew: boolean;
  tags: string[];
}

// 页面完整数据类型
export interface PageFullData {
  page: PageConfig;
  categories: Category[];
  websitesByCategory: Record<string, Website[]>;
  stats: {
    totalCategories: number;
    totalWebsites: number;
  };
}

/**
 * 统一解包页面内网站列表，兼容数组直出与 { websites } 包装结构。
 */
const unwrapWebsiteList = (payload: unknown): Website[] => {
  const data = unwrapApiResponse<Website[] | { websites?: Website[] }>(payload, []);
  return Array.isArray(data) ? data : (data.websites || []);
};

// 页面服务
export const pageService = {
  // 获取所有页面配置
  getAll: async (): Promise<PageConfig[]> => {
    const response = await api.get('/pages');
    return unwrapApiList<PageConfig>(response.data);
  },

  // 获取单个页面配置
  getBySlug: async (slug: string): Promise<PageConfig> => {
    const response = await api.get(`/pages/${slug}`);
    return unwrapApiResponse<PageConfig>(response.data, {} as PageConfig);
  },

  // 获取页面完整数据（包含分类和网站）
  getFullData: async (slug: string): Promise<PageFullData> => {
    const response = await api.get(`/pages/${slug}/full`);
    return unwrapApiResponse<PageFullData>(response.data, {} as PageFullData);
  },

  // 获取页面热门推荐
  getHotWebsites: async (slug: string, limit: number = 12): Promise<Website[]> => {
    const response = await api.get(`/pages/${slug}/hot`, { params: { limit } });
    return unwrapWebsiteList(response.data);
  },

  // 获取页面热门搜索标签（按点击量排序）
  getHotTags: async (slug: string, limit: number = 10): Promise<{ tags: string[]; websites: { id: string; name: string; clickCount: number }[] }> => {
    const response = await api.get(`/pages/${slug}/hot-tags`, { params: { limit } });
    return unwrapApiResponse<{ tags: string[]; websites: { id: string; name: string; clickCount: number }[] }>(
      response.data,
      { tags: [], websites: [] }
    );
  },

  // 搜索页面内的网站
  search: async (slug: string, query: string, limit: number = 50): Promise<Website[]> => {
    const response = await api.get(`/pages/${slug}/search`, { params: { q: query, limit } });
    const data = unwrapApiResponse<Website[] | { results?: Website[] }>(response.data, []);
    return Array.isArray(data) ? data : (data.results || []);
  },
};

export default pageService;
