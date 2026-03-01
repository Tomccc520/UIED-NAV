/**
 * @file pages/WebsiteDetail/RatingWidget.tsx
 * @description 网站评分组件（Pro 功能）
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

// @pro-feature-start: ratings
import React, { useState, useCallback, useEffect } from 'react';
import { AxiosError } from 'axios';
import api from '../../services/api';
import { unwrapApiResponse } from '../../utils/apiResponse';
import { debugLog } from '../../utils/debugHelper';

interface RatingWidgetProps {
  websiteId: string;
  averageRating: number | null;
  totalRatings: number;
  userRating: number | null;
  userId?: string; // Pro 版本中从认证获取
  onRatingChange?: (newRating: number, newAverage: number, newTotal: number) => void;
}

interface RatingResponse {
  userRating: number;
  averageRating: number;
  totalRatings: number;
}

/**
 * 星星图标组件
 */
const StarIcon: React.FC<{ 
  filled: boolean; 
  half?: boolean;
  size?: number;
  onClick?: () => void;
  onMouseEnter?: () => void;
  interactive?: boolean;
}> = ({ filled, half = false, size = 24, onClick, onMouseEnter, interactive = false }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={filled ? '#fadb14' : (half ? 'url(#halfGradient)' : 'none')}
    stroke="#fadb14"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    onClick={onClick}
    onMouseEnter={onMouseEnter}
    style={{ cursor: interactive ? 'pointer' : 'default' }}
    className={interactive ? 'rating-star interactive' : 'rating-star'}
  >
    {half && (
      <defs>
        <linearGradient id="halfGradient">
          <stop offset="50%" stopColor="#fadb14" />
          <stop offset="50%" stopColor="transparent" />
        </linearGradient>
      </defs>
    )}
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

/**
 * 评分 Widget 组件
 * 显示平均评分和交互式评分界面
 */
const RatingWidget: React.FC<RatingWidgetProps> = ({
  websiteId,
  averageRating,
  totalRatings,
  userRating: initialUserRating,
  userId,
  onRatingChange,
}) => {
  const [userRating, setUserRating] = useState<number | null>(initialUserRating);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * 切换详情页时同步用户评分状态
   */
  useEffect(() => {
    setUserRating(initialUserRating);
  }, [initialUserRating]);

  /**
   * 提交评分
   */
  const handleRate = useCallback(async (rating: number) => {
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      setError(null);

      const response = await api.post(`/websites/${websiteId}/rate`, {
        rating,
        ...(userId ? { userId } : {}),
      });
      const data = unwrapApiResponse<Partial<RatingResponse>>(response.data, {});
      if (typeof data.userRating === 'number') {
        setUserRating(data.userRating);
      }
      if (
        typeof data.userRating === 'number' &&
        typeof data.averageRating === 'number' &&
        typeof data.totalRatings === 'number'
      ) {
        onRatingChange?.(data.userRating, data.averageRating, data.totalRatings);
      }
    } catch (err: unknown) {
      debugLog.error('评分失败:', err);
      const axiosError = err as AxiosError<{ message?: string }>;
      setError(axiosError.response?.data?.message || '评分失败，请稍后重试');
    } finally {
      setIsSubmitting(false);
    }
  }, [websiteId, userId, isSubmitting, onRatingChange]);

  /**
   * 渲染显示用的星星（支持半星）
   */
  const renderDisplayStars = (rating: number | null) => {
    if (rating === null) return null;
    
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(<StarIcon key={i} filled size={20} />);
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push(<StarIcon key={i} filled={false} half size={20} />);
      } else {
        stars.push(<StarIcon key={i} filled={false} size={20} />);
      }
    }

    return stars;
  };

  /**
   * 渲染交互式评分星星
   */
  const renderInteractiveStars = () => {
    const displayRating = hoverRating ?? userRating ?? 0;

    return (
      <div 
        className="rating-stars-interactive"
        onMouseLeave={() => setHoverRating(null)}
      >
        {[1, 2, 3, 4, 5].map((star) => (
          <StarIcon
            key={star}
            filled={star <= displayRating}
            size={28}
            interactive
            onClick={() => handleRate(star)}
            onMouseEnter={() => setHoverRating(star)}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="rating-widget">
      <h3 className="rating-widget-title">用户评分</h3>
      
      {/* 平均评分展示 */}
      <div className="rating-summary">
        <div className="rating-score">
          <span className="rating-number">
            {averageRating !== null ? averageRating.toFixed(1) : '-'}
          </span>
          <span className="rating-max">/ 5</span>
        </div>
        <div className="rating-stars-display">
          {renderDisplayStars(averageRating)}
        </div>
        <div className="rating-count">
          {totalRatings > 0 ? `${totalRatings} 人评分` : '暂无评分'}
        </div>
      </div>

      {/* 用户评分区域 */}
      <div className="rating-user-section">
        <p className="rating-prompt">
          {userRating ? '您的评分（点击可修改）' : '点击星星评分'}
        </p>
        {renderInteractiveStars()}
        
        {isSubmitting && (
          <p className="rating-status submitting">提交中...</p>
        )}
        
        {error && (
          <p className="rating-status error">{error}</p>
        )}
        
        {!userId && <p className="rating-login-hint">匿名评分已启用（登录后会绑定到账号）</p>}
      </div>
    </div>
  );
};

export default RatingWidget;
// @pro-feature-end: ratings
