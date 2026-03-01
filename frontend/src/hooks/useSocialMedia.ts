/**
 * @file useSocialMedia.ts
 * @description 前端用户界面组件
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

import { useState, useEffect } from 'react';
import api from '../services/api';

export interface SocialMediaItem {
  id: string;
  name: string;
  type: string;
  qrCodeUrl?: string;
  link?: string;
  description?: string;
  order: number;
  visible: boolean;
}

export const useSocialMedia = () => {
  const [socialMedia, setSocialMedia] = useState<SocialMediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchSocialMedia = async () => {
      try {
        setLoading(true);
        const response = await api.get('/social-media');
        // 只返回可见的项目
        const visibleItems = response.data
          .filter((item: SocialMediaItem) => item.visible)
          .sort((a: SocialMediaItem, b: SocialMediaItem) => a.order - b.order);
        setSocialMedia(visibleItems);
        setError(null);
      } catch (err) {
        setError(err as Error);
        console.error('Failed to fetch social media:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSocialMedia();
  }, []);

  return { socialMedia, loading, error };
};
