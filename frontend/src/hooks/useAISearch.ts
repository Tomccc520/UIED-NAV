/**
 * @file useAISearch.ts
 * @description AI 智能搜索 Hook - 使用 AI 进行自然语言搜索
 */

import { useState, useCallback } from 'react';
import api from '../services/api';
import { unwrapApiResponse } from '../utils/apiResponse';

export interface AISearchResult {
  id: string;
  name: string;
  description: string;
  url: string;
  iconUrl?: string;
  tags?: string;
}

interface UseAISearchReturn {
  search: (query: string, options?: { categoryId?: string; limit?: number }) => Promise<void>;
  results: AISearchResult[];
  loading: boolean;
  error: Error | null;
  mode: 'ai' | 'keyword' | '';
  reason: string;
  message: string;
  clearResults: () => void;
}

/**
 * AI 智能搜索 Hook
 */
export const useAISearch = (): UseAISearchReturn => {
  const [results, setResults] = useState<AISearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [mode, setMode] = useState<'ai' | 'keyword' | ''>('');
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState('');

  const search = useCallback(async (
    query: string, 
    options: { categoryId?: string; limit?: number } = {}
  ) => {
    if (!query.trim()) {
      setResults([]);
      setMode('');
      setMessage('');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.post('/ai-config/smart-search', {
        query,
        categoryId: options.categoryId,
        limit: options.limit || 10,
      });
      const payload = unwrapApiResponse<{
        results?: AISearchResult[];
        mode?: 'ai' | 'keyword';
        reason?: string;
        message?: string;
      }>(response.data, {});

      setResults(Array.isArray(payload.results) ? payload.results : []);
      setMode(payload.mode || 'keyword');
      setReason(payload.reason || '');
      setMessage(payload.message || '');
    } catch (err) {
      setError(err as Error);
      console.error('AI search failed:', err);
      setResults([]);
      setMode('');
      setMessage('搜索失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  }, []);

  const clearResults = useCallback(() => {
    setResults([]);
    setMode('');
    setReason('');
    setMessage('');
    setError(null);
  }, []);

  return {
    search,
    results,
    loading,
    error,
    mode,
    reason,
    message,
    clearResults,
  };
};

export default useAISearch;
