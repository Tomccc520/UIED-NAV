/**
 * @file websiteService.ts
 * @description 前端用户界面组件
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

import api from './api';
import { Category } from './categoryService';
import { unwrapApiResponse } from '../utils/apiResponse';

export interface Website {
  id: string;
  name: string;
  description: string;
  url: string;
  categoryId: string;
  category?: Category;
  isNew: boolean;
  isFeatured: boolean;
  isHot: boolean;
  tags: string[];
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface WebsiteQueryParams {
  category?: string;
  featured?: boolean;
  hot?: boolean;
  new?: boolean;
  search?: string;
}

/**
 * 统一解包网站列表接口，兼容数组直出与 { websites } 包装结构。
 */
const unwrapWebsiteList = (payload: unknown): Website[] => {
  const data = unwrapApiResponse<Website[] | { websites?: Website[] }>(payload, []);
  return Array.isArray(data) ? data : (data.websites || []);
};

export const websiteService = {
  // 获取所有网站
  getAll: async (params?: WebsiteQueryParams): Promise<Website[]> => {
    const response = await api.get('/websites', { params });
    return unwrapWebsiteList(response.data);
  },

  // 获取单个网站
  getById: async (id: string): Promise<Website> => {
    const response = await api.get(`/websites/${id}`);
    return unwrapApiResponse<Website>(response.data, {} as Website);
  },

  // 获取推荐网站
  getFeatured: async (): Promise<Website[]> => {
    const response = await api.get('/websites/featured/list');
    return unwrapWebsiteList(response.data);
  },

  // 获取热门网站
  getHot: async (): Promise<Website[]> => {
    const response = await api.get('/websites/hot/list');
    return unwrapWebsiteList(response.data);
  },

  // 搜索网站
  search: async (keyword: string): Promise<Website[]> => {
    const response = await api.get('/websites', {
      params: { search: keyword }
    });
    return unwrapWebsiteList(response.data);
  },
};

export default websiteService;
