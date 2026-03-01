/**
 * @file useEnhancedSearch.ts
 * @description 增强搜索Hook - 提供搜索建议、历史记录、高级筛选等功能
 * @copyright 版权所有 (c) 2025 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Tool } from './useNavigation';

// 搜索历史项接口
interface SearchHistoryItem {
  keyword: string;
  timestamp: number;
  resultCount: number;
}

// 搜索建议项接口
interface SearchSuggestion {
  text: string;
  type: 'history' | 'keyword' | 'tag' | 'category';
  count?: number;
}

// 搜索筛选选项接口
interface SearchFilters {
  category?: string;
  tags?: string[];
  isNew?: boolean;
  isHot?: boolean;
  isFeatured?: boolean;
  sortBy?: 'relevance' | 'name' | 'popularity';
}

// Hook配置接口
interface EnhancedSearchConfig {
  allTools: Tool[];
  maxHistoryItems?: number;
  maxSuggestions?: number;
  debounceMs?: number;
}

// Hook返回值接口
export interface EnhancedSearchReturn {
  // 状态
  searchValue: string;
  suggestions: SearchSuggestion[];
  searchHistory: SearchHistoryItem[];
  filters: SearchFilters;
  isLoading: boolean;
  
  // 方法
  setSearchValue: (value: string) => void;
  performSearch: (keyword: string, filters?: SearchFilters) => Tool[];
  addToHistory: (keyword: string, resultCount: number) => void;
  clearHistory: () => void;
  removeHistoryItem: (keyword: string) => void;
  setFilters: (filters: SearchFilters) => void;
  resetFilters: () => void;
  getSuggestions: (input: string) => SearchSuggestion[];
}

/**
 * 增强搜索Hook
 * @param config Hook配置
 * @returns Hook返回值
 */
export const useEnhancedSearch = (config: EnhancedSearchConfig): EnhancedSearchReturn => {
  const {
    allTools,
    maxHistoryItems = 10,
    maxSuggestions = 8,
    debounceMs = 300
  } = config;

  // 状态管理
  const [searchValue, setSearchValue] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [filters, setFilters] = useState<SearchFilters>({});
  const [isLoading, setIsLoading] = useState(false);

  // 本地存储键名
  const HISTORY_KEY = 'uied-search-history';

  // 从本地存储加载搜索历史
  useEffect(() => {
    try {
      const saved = localStorage.getItem(HISTORY_KEY);
      if (saved) {
        const history = JSON.parse(saved) as SearchHistoryItem[];
        setSearchHistory(history.slice(0, maxHistoryItems));
      }
    } catch (error) {
      console.error('加载搜索历史失败:', error);
    }
  }, [maxHistoryItems]);

  // 保存搜索历史到本地存储
  const saveHistoryToStorage = useCallback((history: SearchHistoryItem[]) => {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch (error) {
      console.error('保存搜索历史失败:', error);
    }
  }, []);

  // 获取所有可用的标签和分类
  const { allTags, allCategories } = useMemo(() => {
    const tags = new Set<string>();
    const categories = new Set<string>();
    
    allTools.forEach(tool => {
      tool.tags.forEach(tag => tags.add(tag));
      categories.add(tool.category);
    });
    
    return {
      allTags: Array.from(tags),
      allCategories: Array.from(categories)
    };
  }, [allTools]);

  /**
   * 生成搜索建议
   */
  const getSuggestions = useCallback((input: string): SearchSuggestion[] => {
    if (!input.trim()) {
      // 没有输入时，显示搜索历史
      return searchHistory
        .slice(0, maxSuggestions)
        .map(item => ({
          text: item.keyword,
          type: 'history' as const,
          count: item.resultCount
        }));
    }

    const lowercaseInput = input.toLowerCase();
    const suggestions: SearchSuggestion[] = [];

    // 1. 匹配的工具名称
    const matchingTools = allTools
      .filter(tool => tool.name.toLowerCase().includes(lowercaseInput))
      .slice(0, 3)
      .map(tool => ({
        text: tool.name,
        type: 'keyword' as const
      }));
    suggestions.push(...matchingTools);

    // 2. 匹配的标签
    const matchingTags = allTags
      .filter(tag => tag.toLowerCase().includes(lowercaseInput))
      .slice(0, 3)
      .map(tag => ({
        text: tag,
        type: 'tag' as const,
        count: allTools.filter(tool => tool.tags.includes(tag)).length
      }));
    suggestions.push(...matchingTags);

    // 3. 匹配的分类
    const matchingCategories = allCategories
      .filter(category => category.toLowerCase().includes(lowercaseInput))
      .slice(0, 2)
      .map(category => ({
        text: category,
        type: 'category' as const,
        count: allTools.filter(tool => tool.category === category).length
      }));
    suggestions.push(...matchingCategories);

    // 4. 匹配的历史记录
    const matchingHistory = searchHistory
      .filter(item => item.keyword.toLowerCase().includes(lowercaseInput))
      .slice(0, 2)
      .map(item => ({
        text: item.keyword,
        type: 'history' as const,
        count: item.resultCount
      }));
    suggestions.push(...matchingHistory);

    // 去重并限制数量
    const uniqueSuggestions = suggestions
      .filter((suggestion, index, self) => 
        self.findIndex(s => s.text === suggestion.text) === index
      )
      .slice(0, maxSuggestions);

    return uniqueSuggestions;
  }, [allTools, allTags, allCategories, searchHistory, maxSuggestions]);

  /**
   * 执行搜索
   */
  const performSearch = useCallback((keyword: string, searchFilters?: SearchFilters): Tool[] => {
    const trimmedKeyword = keyword.trim();
    if (!trimmedKeyword) return [];

    setIsLoading(true);

    // 基础搜索逻辑
    let results = allTools.filter(tool => {
      const nameMatch = tool.name.toLowerCase().includes(trimmedKeyword.toLowerCase());
      const descriptionMatch = tool.description.toLowerCase().includes(trimmedKeyword.toLowerCase());
      const tagMatch = tool.tags.some(tag => tag.toLowerCase().includes(trimmedKeyword.toLowerCase()));
      
      return nameMatch || descriptionMatch || tagMatch;
    });

    // 应用筛选器
    const activeFilters = searchFilters || filters;
    
    if (activeFilters.category) {
      results = results.filter(tool => tool.category === activeFilters.category);
    }
    
    if (activeFilters.tags && activeFilters.tags.length > 0) {
      results = results.filter(tool => 
        activeFilters.tags!.some(tag => tool.tags.includes(tag))
      );
    }
    
    if (activeFilters.isNew) {
      results = results.filter(tool => tool.isNew);
    }
    
    if (activeFilters.isHot) {
      results = results.filter(tool => tool.isHot);
    }
    
    if (activeFilters.isFeatured) {
      results = results.filter(tool => tool.isFeatured);
    }

    // 排序
    const sortBy = activeFilters.sortBy || 'relevance';
    if (sortBy === 'name') {
      results.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'popularity') {
      // 按热门程度排序：热门 > 推荐 > 新增
      results.sort((a, b) => {
        const getScore = (tool: Tool) => {
          let score = 0;
          if (tool.isHot) score += 3;
          if (tool.isFeatured) score += 2;
          if (tool.isNew) score += 1;
          return score;
        };
        return getScore(b) - getScore(a);
      });
    } else {
      // 相关性排序：优先匹配名称，然后是描述，最后是标签
      results.sort((a, b) => {
        const getRelevanceScore = (tool: Tool) => {
          let score = 0;
          const lowerKeyword = trimmedKeyword.toLowerCase();
          
          if (tool.name.toLowerCase().includes(lowerKeyword)) {
            score += 10;
            if (tool.name.toLowerCase().startsWith(lowerKeyword)) {
              score += 5; // 名称开头匹配加分
            }
          }
          
          if (tool.description.toLowerCase().includes(lowerKeyword)) {
            score += 3;
          }
          
          tool.tags.forEach(tag => {
            if (tag.toLowerCase().includes(lowerKeyword)) {
              score += 1;
            }
          });
          
          return score;
        };
        
        return getRelevanceScore(b) - getRelevanceScore(a);
      });
    }

    setIsLoading(false);
    return results;
  }, [allTools, filters]);

  /**
   * 添加到搜索历史
   */
  const addToHistory = useCallback((keyword: string, resultCount: number) => {
    const trimmedKeyword = keyword.trim();
    if (!trimmedKeyword) return;

    const newItem: SearchHistoryItem = {
      keyword: trimmedKeyword,
      timestamp: Date.now(),
      resultCount
    };

    setSearchHistory(prev => {
      // 移除相同的历史记录
      const filtered = prev.filter(item => item.keyword !== trimmedKeyword);
      // 添加新记录到开头
      const newHistory = [newItem, ...filtered].slice(0, maxHistoryItems);
      
      // 保存到本地存储
      saveHistoryToStorage(newHistory);
      
      return newHistory;
    });
  }, [maxHistoryItems, saveHistoryToStorage]);

  /**
   * 清空搜索历史
   */
  const clearHistory = useCallback(() => {
    setSearchHistory([]);
    localStorage.removeItem(HISTORY_KEY);
  }, []);

  /**
   * 删除单个历史记录
   */
  const removeHistoryItem = useCallback((keyword: string) => {
    setSearchHistory(prev => {
      const newHistory = prev.filter(item => item.keyword !== keyword);
      saveHistoryToStorage(newHistory);
      return newHistory;
    });
  }, [saveHistoryToStorage]);

  /**
   * 重置筛选器
   */
  const resetFilters = useCallback(() => {
    setFilters({});
  }, []);

  // 实时更新搜索建议
  useEffect(() => {
    const timer = setTimeout(() => {
      setSuggestions(getSuggestions(searchValue));
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [searchValue, getSuggestions, debounceMs]);

  return {
    // 状态
    searchValue,
    suggestions,
    searchHistory,
    filters,
    isLoading,
    
    // 方法
    setSearchValue,
    performSearch,
    addToHistory,
    clearHistory,
    removeHistoryItem,
    setFilters,
    resetFilters,
    getSuggestions
  };
}; 