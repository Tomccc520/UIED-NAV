/**
 * @file types/article.ts
 * @description 文章相关类型定义
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

import { PaginatedResponse, PaginationParams } from './api';

// ============================================================================
// 基础类型
// ============================================================================

/**
 * 文章标签
 */
export interface ArticleTag {
  id: number;
  name: string;
  slug: string;
  color?: string;
  articleCount?: number;
}

/**
 * 标签元数据（含文章数量）
 */
export interface TagMeta extends ArticleTag {
  articleCount: number;
}

/**
 * 文章分类元数据
 * 目前 API 返回的是 string[]，如果未来变为对象数组，可在此扩展
 */
export type CategoryMeta = string;

// ============================================================================
// 文章列表相关
// ============================================================================

/**
 * 文章列表项
 */
export interface ArticleListItem {
  id: number;
  title: string;
  excerpt: string;
  coverImage?: string;
  author: string;
  category: string;
  slug: string;
  viewCount: number;
  publishedAt: number | null;
  createdAt: number | null;
  updatedAt: number | null;
  tags: ArticleTag[];
}

/**
 * 文章列表查询参数
 */
export interface ArticleListParams extends PaginationParams {
  category?: string;
  tag?: string;
}

/**
 * 文章列表响应
 */
export type ArticleListResponse = PaginatedResponse<ArticleListItem>;

// ============================================================================
// 文章详情相关
// ============================================================================

/**
 * 文章详情
 */
export interface ArticleDetail extends ArticleListItem {
  content: string;
  seoTitle?: string;
  seoDescription?: string;
  status?: string;
}

// ============================================================================
// 评论相关
// ============================================================================

/**
 * 评论用户
 */
export interface CommentUser {
  id: number | string;
  nickname: string; // 对应 nickname
  avatar?: string;
}

/**
 * 评论项
 */
export interface CommentItem {
  id: number;
  articleId: number;
  parentId: number;
  isTop: number;
  content: string;
  userId: number;
  nickname: string;
  avatar?: string;
  likeCount: number;
  isLike: number;
  createTime: string; // "2026-02-17 10:00:00"
}

/**
 * 评论列表响应
 */
export type CommentListResponse = PaginatedResponse<CommentItem>;

/**
 * 发表评论参数
 */
export interface CreateCommentParams {
  text: string;
  parentId?: number;
}

/**
 * 记录阅读参数
 */
export interface RecordViewParams {
  id: number;
  viewCount?: number;
}
