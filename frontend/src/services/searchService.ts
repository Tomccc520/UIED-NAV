/**
 * @copyright Tomda (https://www.tomda.top)
 * @copyright UIED技术团队 (https://fsuied.com)
 * @author UIED技术团队
 * @createDate 2026.3.1
 */

import api from './api';
import { unwrapApiResponse } from '../utils/apiResponse';

export interface SearchParams {
  keyword: string;
  page?: number;
  pageSize?: number;
  type?: 'all' | 'website' | 'category' | 'tag';
}

export interface AdvancedSearchParams {
  keyword?: string;
  categoryId?: number;
  tags?: string[];
  pageSlug?: string;
  sortBy?: 'hot' | 'new' | 'name';
  page?: number;
  pageSize?: number;
}

export interface SearchResult {
  lists: any[];
  categories?: any[];
  tags?: any[];
  total: number;
  pageNo: number;
  pageSize: number;
  keyword?: string;
}

export interface AiSearchResultItem {
  id: string;
  name: string;
  description: string;
  url: string;
  slug?: string;
  iconUrl?: string;
  category?: string;
  tags?: string[] | string;
  isNew?: boolean;
  isHot?: boolean;
  isFeatured?: boolean;
}

export interface AiSearchResponse {
  results: AiSearchResultItem[];
  mode?: 'ai' | 'keyword';
  reason?: string;
  message?: string;
  reasoning?: string;
}

export const searchService = {
  /**
   * 全站搜索
   */
  globalSearch: async (params: SearchParams): Promise<SearchResult> => {
    const response = await api.get('/search', { params });
    return unwrapApiResponse<SearchResult>(response.data, {
      lists: [],
      total: 0,
      pageNo: 1,
      pageSize: 20,
    });
  },

  /**
   * 高级搜索
   */
  advancedSearch: async (params: AdvancedSearchParams): Promise<SearchResult> => {
    const response = await api.post('/search/advanced', params);
    return unwrapApiResponse<SearchResult>(response.data, {
      lists: [],
      total: 0,
      pageNo: 1,
      pageSize: 20,
    });
  },

  /**
   * 获取搜索建议
   */
  getSuggestions: async (keyword: string): Promise<any> => {
    const response = await api.get('/search/suggestions', { params: { keyword } });
    return unwrapApiResponse<any>(response.data, { websites: [], categories: [] });
  },

  /**
   * 获取热门搜索
   */
  getHotSearches: async (): Promise<string[]> => {
    const response = await api.get('/search/hot');
    return unwrapApiResponse<string[]>(response.data, []);
  },

  /**
   * AI智能搜索
   */
  aiSearch: async (query: string, limit: number = 10): Promise<AiSearchResponse> => {
    const response = await api.post('/ai-search', { query, limit });
    return unwrapApiResponse<AiSearchResponse>(response.data, { results: [] });
  },
};

export default searchService;
