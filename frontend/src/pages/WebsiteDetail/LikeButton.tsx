/**
 * @copyright Tomda (https://www.tomda.top)
 * @copyright UIED技术团队 (https://fsuied.com)
 * @author UIED技术团队
 * @createDate 2026-02-26
 */
/**
 * @file pages/WebsiteDetail/LikeButton.tsx
 * @description 网站点赞按钮组件（匿名/登录均可）
 */

import React, { useCallback, useEffect, useState } from 'react';
import { AxiosError } from 'axios';
import api from '../../services/api';
import { unwrapApiResponse } from '../../utils/apiResponse';
import { debugLog } from '../../utils/debugHelper';

interface LikeButtonProps {
  websiteId: string;
  initialLiked?: boolean;
  initialLikeCount?: number;
  onLikeChange?: (isLiked: boolean, likeCount: number) => void;
}

interface LikeResponsePayload {
  isLiked?: boolean;
  liked?: boolean;
  likeCount?: number;
  totalLikes?: number;
}

/**
 * 点赞图标（拇指）组件
 */
const LikeIcon: React.FC<{ filled: boolean; size?: number }> = ({ filled, size = 18 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={filled ? 'currentColor' : 'none'}
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M7 10v11" />
    <path d="M2 10h5v11H2z" />
    <path d="M7 21h9.24a2 2 0 0 0 1.95-1.57l1.36-6A2 2 0 0 0 17.6 11H14V6a2 2 0 0 0-2-2l-2 6-3 0z" />
  </svg>
);

/**
 * 网站点赞按钮组件
 */
const LikeButton: React.FC<LikeButtonProps> = ({
  websiteId,
  initialLiked = false,
  initialLikeCount = 0,
  onLikeChange,
}) => {
  const [isLiked, setIsLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * 外部状态变化时同步本地显示（切换详情页时避免沿用旧状态）
   */
  useEffect(() => {
    setIsLiked(initialLiked);
  }, [initialLiked]);

  /**
   * 外部计数变化时同步本地显示
   */
  useEffect(() => {
    setLikeCount(Number(initialLikeCount || 0));
  }, [initialLikeCount]);

  /**
   * 切换点赞状态（匿名与登录都可用）
   */
  const handleToggle = useCallback(async () => {
    if (isLoading) return;

    const prevLiked = isLiked;
    const prevCount = likeCount;
    const nextLiked = !prevLiked;
    const nextCount = Math.max(0, prevCount + (nextLiked ? 1 : -1));

    // 乐观更新
    setIsLiked(nextLiked);
    setLikeCount(nextCount);
    setError(null);

    try {
      setIsLoading(true);
      const response = prevLiked
        ? await api.delete(`/websites/${websiteId}/like`)
        : await api.post(`/websites/${websiteId}/like`);
      const data = unwrapApiResponse<LikeResponsePayload>(response.data, {});
      const finalLiked = (data.isLiked ?? data.liked ?? nextLiked) === true;
      const finalCount = Number(data.likeCount ?? data.totalLikes ?? nextCount);
      setIsLiked(finalLiked);
      setLikeCount(Number.isFinite(finalCount) ? Math.max(0, finalCount) : nextCount);
      onLikeChange?.(finalLiked, Number.isFinite(finalCount) ? Math.max(0, finalCount) : nextCount);
    } catch (err: unknown) {
      setIsLiked(prevLiked);
      setLikeCount(prevCount);
      debugLog.error('点赞操作失败:', err);
      const axiosError = err as AxiosError<{ message?: string; error?: string }>;
      setError(axiosError.response?.data?.message || axiosError.response?.data?.error || '点赞失败');
    } finally {
      setIsLoading(false);
    }
  }, [websiteId, isLiked, likeCount, isLoading, onLikeChange]);

  return (
    <div className="like-button-wrapper">
      <button
        type="button"
        className={`btn-like ${isLiked ? 'liked' : ''} ${isLoading ? 'loading' : ''}`}
        onClick={handleToggle}
        disabled={isLoading}
        title={isLiked ? '取消点赞' : '点赞'}
      >
        <LikeIcon filled={isLiked} />
        <span>{isLiked ? '已点赞' : '点赞'}</span>
        <span className="btn-like__count">{likeCount}</span>
      </button>
      {error && <span className="like-error">{error}</span>}
    </div>
  );
};

export default LikeButton;

