/**
 * @file useWordPressTags.ts
 * @description WordPress 标签配置 Hook - 从 API 获取标签配置
 */

import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { unwrapApiList } from '../utils/apiResponse';

export interface WordPressTag {
  id: string;
  wpTagId: number;
  wpTagName: string;
  displayName: string;
  slug: string;
  description?: string;
  order: number;
  visible: boolean;
}

interface UseWordPressTagsOptions {
  enabled?: boolean;
}

interface UseWordPressTagsReturn {
  tags: WordPressTag[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  getTagById: (wpTagId: number) => WordPressTag | undefined;
}

/**
 * WordPress 标签配置 Hook
 */
export const useWordPressTags = (
  options: UseWordPressTagsOptions = {}
): UseWordPressTagsReturn => {
  const { enabled = true } = options;
  
  const [tags, setTags] = useState<WordPressTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!enabled) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/wordpress/tags');

      const normalized = unwrapApiList<WordPressTag>(response.data);
      if (normalized.length > 0) {
        // 只返回可见的标签
        const visibleTags = normalized.filter((tag: WordPressTag) => tag.visible);
        setTags(visibleTags);
      } else {
        setTags([]);
      }
    } catch (err) {
      setError(err as Error);
      console.error('Failed to fetch WordPress tags:', err);
      setTags([]);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 根据 WordPress 标签 ID 获取标签
  const getTagById = useCallback((wpTagId: number) => {
    return tags.find(tag => tag.wpTagId === wpTagId);
  }, [tags]);

  return {
    tags,
    loading,
    error,
    refetch: fetchData,
    getTagById,
  };
};

export default useWordPressTags;
