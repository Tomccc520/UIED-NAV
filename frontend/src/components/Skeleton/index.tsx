/**
 * @file Skeleton/index.tsx
 * @description 骨架屏组件 - 用于数据加载时显示占位内容
 * @copyright 版权所有 (c) 2025 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 * 
 * Requirements: 6.1 - WHEN 页面数据加载中 THEN THE Frontend_App SHALL 显示骨架屏而非空白页面
 */

import React from 'react';
import './index.css';

// 骨架屏变体类型
export type SkeletonVariant = 'text' | 'circular' | 'rectangular' | 'rounded';

// 骨架屏动画类型
export type SkeletonAnimation = 'pulse' | 'wave' | 'none';

export interface SkeletonProps {
  /** 变体类型 */
  variant?: SkeletonVariant;
  /** 宽度 */
  width?: number | string;
  /** 高度 */
  height?: number | string;
  /** 动画类型 */
  animation?: SkeletonAnimation;
  /** 自定义类名 */
  className?: string;
  /** 自定义样式 */
  style?: React.CSSProperties;
  /** 圆角大小（仅 rounded 变体有效） */
  borderRadius?: number | string;
}

/**
 * 基础骨架屏组件
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'text',
  width,
  height,
  animation = 'pulse',
  className = '',
  style,
  borderRadius,
}) => {
  const getVariantStyles = (): React.CSSProperties => {
    const baseStyles: React.CSSProperties = {
      width: width || '100%',
      height: height || (variant === 'text' ? '1em' : undefined),
    };

    switch (variant) {
      case 'circular':
        return {
          ...baseStyles,
          borderRadius: '50%',
          width: width || 40,
          height: height || 40,
        };
      case 'rectangular':
        return {
          ...baseStyles,
          borderRadius: 0,
        };
      case 'rounded':
        return {
          ...baseStyles,
          borderRadius: borderRadius || 8,
        };
      case 'text':
      default:
        return {
          ...baseStyles,
          borderRadius: 4,
        };
    }
  };

  return (
    <span
      className={`skeleton skeleton--${variant} skeleton--${animation} ${className}`}
      style={{ ...getVariantStyles(), ...style }}
    />
  );
};

// ToolCard 骨架屏属性
export interface ToolCardSkeletonProps {
  /** 自定义类名 */
  className?: string;
}

/**
 * 工具卡片骨架屏组件
 * 模拟 ToolCard 组件的加载状态
 */
export const ToolCardSkeleton: React.FC<ToolCardSkeletonProps> = ({ className = '' }) => {
  return (
    <div className={`skeleton-tool-card ${className}`}>
      {/* 图标区域 */}
      <div className="skeleton-tool-card__icon">
        <Skeleton variant="rounded" width={48} height={48} />
      </div>
      
      {/* 内容区域 */}
      <div className="skeleton-tool-card__content">
        {/* 标题 */}
        <Skeleton variant="text" width="60%" height={18} />
        {/* 描述 */}
        <Skeleton variant="text" width="100%" height={14} style={{ marginTop: 8 }} />
        <Skeleton variant="text" width="80%" height={14} style={{ marginTop: 4 }} />
        {/* 标签 */}
        <div className="skeleton-tool-card__tags">
          <Skeleton variant="rounded" width={50} height={20} />
          <Skeleton variant="rounded" width={60} height={20} />
          <Skeleton variant="rounded" width={45} height={20} />
        </div>
      </div>
    </div>
  );
};

// 工具网格骨架屏属性
export interface ToolGridSkeletonProps {
  /** 显示的卡片数量 */
  count?: number;
  /** 自定义类名 */
  className?: string;
}

/**
 * 工具网格骨架屏组件
 * 显示多个 ToolCardSkeleton
 */
export const ToolGridSkeleton: React.FC<ToolGridSkeletonProps> = ({ 
  count = 8, 
  className = '' 
}) => {
  return (
    <div className={`skeleton-tool-grid ${className}`}>
      {Array.from({ length: count }).map((_, index) => (
        <ToolCardSkeleton key={index} />
      ))}
    </div>
  );
};

// 分类侧边栏骨架屏属性
export interface CategorySidebarSkeletonProps {
  /** 显示的分类数量 */
  count?: number;
  /** 自定义类名 */
  className?: string;
}

/**
 * 分类侧边栏骨架屏组件
 */
export const CategorySidebarSkeleton: React.FC<CategorySidebarSkeletonProps> = ({ 
  count = 10, 
  className = '' 
}) => {
  return (
    <div className={`skeleton-category-sidebar ${className}`}>
      {/* 标题 */}
      <div className="skeleton-category-sidebar__header">
        <Skeleton variant="text" width={120} height={24} />
      </div>
      
      {/* 分类列表 */}
      <div className="skeleton-category-sidebar__list">
        {Array.from({ length: count }).map((_, index) => (
          <div key={index} className="skeleton-category-sidebar__item">
            <Skeleton variant="circular" width={24} height={24} />
            <Skeleton variant="text" width="70%" height={16} style={{ marginLeft: 12 }} />
            <Skeleton variant="text" width={30} height={14} style={{ marginLeft: 'auto' }} />
          </div>
        ))}
      </div>
    </div>
  );
};

// 热门推荐骨架屏属性
export interface HotRecommendationsSkeletonProps {
  /** 显示的卡片数量 */
  count?: number;
  /** 是否显示标题 */
  showTitle?: boolean;
  /** 是否显示子分类标签 */
  showSubCategories?: boolean;
  /** 自定义类名 */
  className?: string;
}

/**
 * 热门推荐骨架屏组件
 */
export const HotRecommendationsSkeleton: React.FC<HotRecommendationsSkeletonProps> = ({
  count = 8,
  showTitle = true,
  showSubCategories = true,
  className = '',
}) => {
  return (
    <div className={`skeleton-hot-recommendations ${className}`}>
      {/* 标题 */}
      {showTitle && (
        <div className="skeleton-hot-recommendations__header">
          <Skeleton variant="text" width={150} height={28} />
        </div>
      )}
      
      {/* 子分类标签 */}
      {showSubCategories && (
        <div className="skeleton-hot-recommendations__tabs">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton 
              key={index} 
              variant="rounded" 
              width={80} 
              height={32} 
              style={{ marginRight: 8 }} 
            />
          ))}
        </div>
      )}
      
      {/* 工具网格 */}
      <ToolGridSkeleton count={count} />
    </div>
  );
};

// 文章卡片骨架屏属性
export interface ArticleCardSkeletonProps {
  /** 自定义类名 */
  className?: string;
}

/**
 * 文章卡片骨架屏组件
 */
export const ArticleCardSkeleton: React.FC<ArticleCardSkeletonProps> = ({ className = '' }) => {
  return (
    <div className={`skeleton-article-card ${className}`}>
      {/* 缩略图 */}
      <Skeleton variant="rounded" width="100%" height={160} />
      
      {/* 内容区域 */}
      <div className="skeleton-article-card__content">
        {/* 标题 */}
        <Skeleton variant="text" width="90%" height={20} />
        <Skeleton variant="text" width="70%" height={20} style={{ marginTop: 4 }} />
        
        {/* 元信息 */}
        <div className="skeleton-article-card__meta">
          <Skeleton variant="circular" width={24} height={24} />
          <Skeleton variant="text" width={80} height={14} style={{ marginLeft: 8 }} />
          <Skeleton variant="text" width={60} height={14} style={{ marginLeft: 'auto' }} />
        </div>
      </div>
    </div>
  );
};

// 文章网格骨架屏属性
export interface ArticleGridSkeletonProps {
  /** 显示的卡片数量 */
  count?: number;
  /** 自定义类名 */
  className?: string;
}

/**
 * 文章网格骨架屏组件
 */
export const ArticleGridSkeleton: React.FC<ArticleGridSkeletonProps> = ({ 
  count = 6, 
  className = '' 
}) => {
  return (
    <div className={`skeleton-article-grid ${className}`}>
      {Array.from({ length: count }).map((_, index) => (
        <ArticleCardSkeleton key={index} />
      ))}
    </div>
  );
};

// 排行榜骨架屏属性
export interface RankingListSkeletonProps {
  /** 显示的条目数量 */
  count?: number;
  /** 自定义类名 */
  className?: string;
}

/**
 * 排行榜骨架屏组件
 */
export const RankingListSkeleton: React.FC<RankingListSkeletonProps> = ({ 
  count = 10, 
  className = '' 
}) => {
  return (
    <div className={`skeleton-ranking-list ${className}`}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="skeleton-ranking-list__item">
          {/* 排名 */}
          <Skeleton variant="circular" width={24} height={24} />
          
          {/* 内容 */}
          <div className="skeleton-ranking-list__content">
            <Skeleton variant="text" width="80%" height={16} />
            <div className="skeleton-ranking-list__meta">
              <Skeleton variant="text" width={40} height={12} />
              <Skeleton variant="text" width={40} height={12} style={{ marginLeft: 12 }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Hero Banner 骨架屏属性
export interface HeroBannerSkeletonProps {
  /** 自定义类名 */
  className?: string;
}

/**
 * Hero Banner 骨架屏组件
 */
export const HeroBannerSkeleton: React.FC<HeroBannerSkeletonProps> = ({ className = '' }) => {
  return (
    <div className={`skeleton-hero-banner ${className}`}>
      {/* 标题 */}
      <Skeleton variant="text" width={300} height={40} style={{ marginBottom: 16 }} />
      
      {/* 副标题 */}
      <Skeleton variant="text" width={400} height={20} style={{ marginBottom: 24 }} />
      
      {/* 搜索框 */}
      <Skeleton variant="rounded" width={500} height={48} style={{ marginBottom: 16 }} />
      
      {/* 热门标签 */}
      <div className="skeleton-hero-banner__tags">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton 
            key={index} 
            variant="rounded" 
            width={70} 
            height={28} 
            style={{ marginRight: 8 }} 
          />
        ))}
      </div>
    </div>
  );
};

// 页面骨架屏属性
export interface PageSkeletonProps {
  /** 是否显示侧边栏 */
  showSidebar?: boolean;
  /** 工具卡片数量 */
  toolCount?: number;
  /** 自定义类名 */
  className?: string;
}

/**
 * 完整页面骨架屏组件
 * 组合多个骨架屏组件，模拟完整页面加载状态
 */
export const PageSkeleton: React.FC<PageSkeletonProps> = ({
  showSidebar = true,
  toolCount = 12,
  className = '',
}) => {
  return (
    <div className={`skeleton-page ${className}`}>
      {/* Hero Banner */}
      <HeroBannerSkeleton />
      
      {/* 主内容区域 */}
      <div className="skeleton-page__main">
        {/* 侧边栏 */}
        {showSidebar && <CategorySidebarSkeleton />}
        
        {/* 内容区域 */}
        <div className="skeleton-page__content">
          {/* 热门推荐 */}
          <HotRecommendationsSkeleton count={8} />
          
          {/* 分类内容 */}
          <div className="skeleton-page__section">
            <Skeleton variant="text" width={150} height={28} style={{ marginBottom: 16 }} />
            <ToolGridSkeleton count={toolCount} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Skeleton;
