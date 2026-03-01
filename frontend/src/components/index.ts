/**
 * @file index.ts
 * @description 前端用户界面组件
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

// 导出所有组件
export { default as CategorySidebar } from './CategorySidebar';
export { default as HeroBanner } from './HeroBanner';
export { default as ToolCard } from './ToolCard';
export { default as Banner } from './Banner';
export { default as HotRecommendations } from './HotRecommendations';
export { default as LazyImage } from './LazyImage';
export type { LazyImageProps, LazyImageState } from './LazyImage';

// 骨架屏组件
export { 
  Skeleton,
  ToolCardSkeleton,
  ToolGridSkeleton,
  CategorySidebarSkeleton,
  HotRecommendationsSkeleton,
  ArticleCardSkeleton,
  ArticleGridSkeleton,
  RankingListSkeleton,
  HeroBannerSkeleton,
  PageSkeleton
} from './Skeleton';
export type {
  SkeletonProps,
  SkeletonVariant,
  SkeletonAnimation,
  ToolCardSkeletonProps,
  ToolGridSkeletonProps,
  CategorySidebarSkeletonProps,
  HotRecommendationsSkeletonProps,
  ArticleCardSkeletonProps,
  ArticleGridSkeletonProps,
  RankingListSkeletonProps,
  HeroBannerSkeletonProps,
  PageSkeletonProps
} from './Skeleton'; 