/**
 * @file useBanners.ts
 * @description Banner 数据获取 Hook
 */

import { useState, useEffect } from 'react';
import api from '../services/api';
import { unwrapApiList } from '../utils/apiResponse';

export interface Banner {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string; // 图片类型时使用
  linkUrl?: string;
  linkTarget: string;
  contentType?: string; // 'image' | 'html'
  htmlContent?: string; // HTML 代码类型时使用
  pageSlug?: string;
  position: string;
  order: number;
  visible: boolean;
  clickCount: number;
}

interface UseBannersOptions {
  pageSlug?: string;
  position?: string;
  limit?: number;
}

export function useBanners(options: UseBannersOptions = {}) {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBanners = async () => {
      setLoading(true);
      try {
        const params: Record<string, string | number> = {};
        if (options.pageSlug) params.pageSlug = options.pageSlug;
        if (options.position) params.position = options.position;
        if (options.limit) params.limit = options.limit;

        const res = await api.get('/banners/active', { params });
        setBanners(unwrapApiList<Banner>(res.data));
        setError(null);
      } catch (err: unknown) {
        console.error('获取 Banner 失败:', err);
        setError(err instanceof Error ? err.message : '获取 Banner 失败');
        setBanners([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBanners();
  }, [options.pageSlug, options.position, options.limit]);

  const recordClick = async (bannerId: string) => {
    try {
      await api.post(`/banners/${bannerId}/click`);
    } catch (error) {
      console.error('记录点击失败:', error);
    }
  };

  return { banners, loading, error, recordClick };
}

export default useBanners;
