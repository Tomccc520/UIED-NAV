/**
 * @file pages/WebsiteDetail/FavoriteButton.tsx
 * @description 收藏按钮组件（Pro 功能）
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

// @pro-feature-start: favorites
import React, { useState, useCallback, useEffect } from 'react';
import { AxiosError } from 'axios';
import api from '../../services/api';
import { unwrapApiResponse } from '../../utils/apiResponse';
import { debugLog } from '../../utils/debugHelper';

interface FavoriteButtonProps {
  websiteId: string;
  initialFavorited?: boolean;
  userId?: string;
  onFavoriteChange?: (isFavorited: boolean, totalFavorites?: number) => void;
}

interface FavoriteResponsePayload {
  favorited?: boolean;
  totalFavorites?: number;
}

/**
 * 心形图标
 */
const HeartIcon: React.FC<{ filled: boolean; size?: number }> = ({ filled, size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={filled ? '#ff4d4f' : 'none'}
    stroke={filled ? '#ff4d4f' : 'currentColor'}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

/**
 * 收藏按钮组件
 */
const FavoriteButton: React.FC<FavoriteButtonProps> = ({
  websiteId,
  initialFavorited = false,
  userId,
  onFavoriteChange,
}) => {
  const [isFavorited, setIsFavorited] = useState(initialFavorited);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * 外部详情数据切换时同步收藏状态
   */
  useEffect(() => {
    setIsFavorited(initialFavorited);
  }, [initialFavorited]);

  /**
   * 切换收藏状态
   */
  const handleToggle = useCallback(async () => {
    if (isLoading) return;

    // 乐观更新
    const previousState = isFavorited;
    setIsFavorited(!isFavorited);
    setError(null);

    try {
      setIsLoading(true);

      let totalFavorites: number | undefined;
      if (previousState) {
        // 取消收藏
        const response = await api.delete(`/websites/${websiteId}/favorite`, userId ? { data: { userId } } : undefined);
        const data = unwrapApiResponse<FavoriteResponsePayload>(response.data, {});
        if (typeof data.totalFavorites === 'number') totalFavorites = data.totalFavorites;
      } else {
        // 添加收藏
        const response = await api.post(`/websites/${websiteId}/favorite`, userId ? { userId } : {});
        const data = unwrapApiResponse<FavoriteResponsePayload>(response.data, {});
        if (typeof data.totalFavorites === 'number') totalFavorites = data.totalFavorites;
      }

      onFavoriteChange?.(!previousState, totalFavorites);
    } catch (err: unknown) {
      // 回滚状态
      setIsFavorited(previousState);
      debugLog.error('收藏操作失败:', err);
      const axiosError = err as AxiosError<{ message?: string }>;
      setError(axiosError.response?.data?.message || '操作失败');
    } finally {
      setIsLoading(false);
    }
  }, [websiteId, userId, isFavorited, isLoading, onFavoriteChange]);

  return (
    <div className="favorite-button-wrapper">
      <button
        className={`btn-favorite ${isFavorited ? 'favorited' : ''} ${isLoading ? 'loading' : ''}`}
        onClick={handleToggle}
        disabled={isLoading}
        title={isFavorited ? '取消收藏' : '添加收藏'}
      >
        <HeartIcon filled={isFavorited} />
        <span>{isFavorited ? '已收藏' : '收藏'}</span>
      </button>
      {error && <span className="favorite-error">{error}</span>}
    </div>
  );
};

export default FavoriteButton;
// @pro-feature-end: favorites
