/**
 * @file api.ts
 * @description API响应类型定义 - 定义所有API响应的TypeScript类型
 * @copyright 版权所有 (c) 2025 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 * 
 * Requirements: 12.1
 */

// ============================================================================
// 通用类型
// ============================================================================

/**
 * API错误代码枚举
 */
export enum ErrorCode {
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  RATE_LIMITED = 'RATE_LIMITED',
  BAD_REQUEST = 'BAD_REQUEST',
  CONFLICT = 'CONFLICT',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
}

/**
 * API错误响应格式
 */
export interface ApiErrorResponse {
  code: ErrorCode | string;
  message: string;
  timestamp: string;
  path: string;
  details?: unknown;
}

/**
 * 分页参数
 */
export interface PaginationParams {
  page?: number;
  pageSize?: number;
  cursor?: string;
}

/**
 * 分页信息
 */
export interface PaginationInfo {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasMore: boolean;
  nextCursor?: string;
}

/**
 * 分页响应格式
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationInfo;
}

/**
 * 基础实体类型（带时间戳）
 */
export interface BaseEntity {
  id: string;
  createdAt?: string;
  updatedAt?: string;
}

// ============================================================================
// 站点信息类型
// ============================================================================

/**
 * 站点信息
 */
export interface SiteInfo {
  id: number;
  siteName: string;
  siteTitle: string;
  description: string;
  keywords: string;
  logo: string;
  favicon: string;
  icp?: string;
  icpLink?: string;
  copyright?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ============================================================================
// 页面类型
// ============================================================================

/**
 * 页面配置
 */
export interface PageConfig {
  id: string;
  name: string;
  slug: string;
  type: string;
  icon?: string;
  description?: string;
  order?: number;
  visible?: boolean;
  heroTitle?: string;
  heroSubtitle?: string;
  hotSearchTags?: string | string[];
  heroBgType?: 'default' | 'color' | 'gradient' | 'image';
  heroBgValue?: string;
  searchPlaceholder?: string;
  searchEnabled: boolean;
  showHotRecommendations: boolean;
  showCategories: boolean;
  showSidebar?: boolean;
  themeColor?: string;
}

/**
 * 页面完整数据
 */
export interface PageFullData {
  page: PageConfig;
  categories: Category[];
  websitesByCategory: Record<string, Website[]>;
  stats: {
    totalCategories: number;
    totalWebsites: number;
  };
}

// ============================================================================
// 分类类型
// ============================================================================

/**
 * 子分类
 */
export interface SubCategory {
  id: string;
  name: string;
  slug: string;
}

/**
 * 分类
 */
export interface Category extends BaseEntity {
  name: string;
  slug: string;
  icon: string;
  color: string;
  description?: string;
  parentId?: string;
  order: number;
  visible: boolean;
  children?: Category[];
  subCategories?: SubCategory[];
  _count?: {
    websites: number;
  };
}

// ============================================================================
// 网站类型
// ============================================================================

/**
 * 网站/工具
 */
export interface Website extends BaseEntity {
  name: string;
  description: string;
  url: string;
  iconUrl?: string;
  categoryId?: string;
  category?: Category;
  isNew: boolean;
  isFeatured: boolean;
  isHot: boolean;
  tags: string[];
  order?: number;
  clickCount?: number;
}

/**
 * 网站查询参数
 */
export interface WebsiteQueryParams {
  category?: string;
  featured?: boolean;
  hot?: boolean;
  new?: boolean;
  search?: string;
  page?: number;
  pageSize?: number;
}

// ============================================================================
// 搜索类型
// ============================================================================

/**
 * 搜索结果高亮
 */
export interface SearchHighlights {
  name?: string[];
  description?: string[];
}

/**
 * 搜索结果项
 */
export interface SearchResult {
  id: string;
  name: string;
  description: string;
  url: string;
  iconUrl?: string;
  highlights?: SearchHighlights;
  score?: number;
}

/**
 * 搜索响应
 */
export interface SearchResponse {
  results: SearchResult[];
  total: number;
  suggestions?: string[];
  query: string;
}

// ============================================================================
// 导航和设置类型
// ============================================================================

/**
 * 导航菜单项
 */
export interface NavMenuItem {
  id: string;
  text: string;
  link: string | null;
  external: boolean;
  label: string | null;
  labelType: string | null;
  icon: string | null;
  parentId: string | null;
  order: number;
  visible: boolean;
  children?: NavMenuItem[];
}

/**
 * 页脚链接
 */
export interface FooterLink {
  id: string;
  text: string;
  url: string;
  external: boolean;
  order: number;
  visible: boolean;
}

/**
 * 页脚分组
 */
export interface FooterGroup {
  id: string;
  title: string;
  order: number;
  visible: boolean;
  links: FooterLink[];
}

/**
 * 友情链接
 */
export interface FriendLink {
  id: string;
  name: string;
  url: string;
  order: number;
  visible: boolean;
}

// ============================================================================
// Banner和推荐类型
// ============================================================================

/**
 * Banner位置类型
 */
export type BannerPosition = 'hero' | 'sidebar' | 'footer' | 'popup';

/**
 * Banner
 */
export interface Banner {
  id: string;
  title: string;
  description?: string;
  imageUrl: string;
  linkUrl?: string;
  linkTarget: '_self' | '_blank';
  pageSlug?: string;
  position: string;
  order: number;
  visible: boolean;
  clickCount: number;
}

/**
 * 热门推荐位置类型
 */
export type HotRecommendationPosition = 'hot' | 'featured' | 'ad';

/**
 * 热门推荐
 */
export interface HotRecommendation {
  id: string;
  name: string;
  description: string;
  url: string;
  iconUrl?: string;
  pageSlug?: string;
  position: HotRecommendationPosition;
  order: number;
  visible: boolean;
  clickCount: number;
}

// ============================================================================
// 社交媒体类型
// ============================================================================

/**
 * 社交媒体
 */
export interface SocialMedia {
  id: string;
  name: string;
  icon: string;
  url: string;
  qrCode?: string;
  order: number;
  visible: boolean;
}

// ============================================================================
// 提交类型
// ============================================================================

/**
 * 提交状态
 */
export type SubmissionStatus = 'pending' | 'approved' | 'rejected';

/**
 * 网站提交
 */
export interface Submission {
  id: string;
  name: string;
  url: string;
  description?: string;
  email?: string;
  status: SubmissionStatus;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// AI配置类型
// ============================================================================

/**
 * AI配置
 */
export interface AIConfig {
  id: string;
  enabled: boolean;
  provider: string;
  apiKey?: string;
  model?: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
}

// ============================================================================
// 缓存类型
// ============================================================================

/**
 * 缓存条目
 */
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  key: string;
}

/**
 * 缓存统计
 */
export interface CacheStats {
  hits: number;
  misses: number;
  keys: number;
  ksize: number;
  vsize: number;
}

// ============================================================================
// Hook返回类型
// ============================================================================

/**
 * 通用数据Hook返回类型
 */
export interface UseDataReturn<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * 分页数据Hook返回类型
 */
export interface UsePaginatedDataReturn<T> extends UseDataReturn<T[]> {
  pagination: PaginationInfo | null;
  loadMore: () => Promise<void>;
  hasMore: boolean;
}

/**
 * 缓存Hook返回类型
 */
export interface UseCacheReturn<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  isStale: boolean;
  refetch: () => Promise<void>;
  invalidate: () => void;
}

// ============================================================================
// 类型守卫
// ============================================================================

/**
 * 检查是否为API错误响应
 */
export function isApiErrorResponse(obj: unknown): obj is ApiErrorResponse {
  if (!obj || typeof obj !== 'object') return false;
  const error = obj as Record<string, unknown>;
  return (
    typeof error.code === 'string' &&
    typeof error.message === 'string' &&
    typeof error.timestamp === 'string' &&
    typeof error.path === 'string'
  );
}

/**
 * 检查是否为分页响应
 */
export function isPaginatedResponse<T>(obj: unknown): obj is PaginatedResponse<T> {
  if (!obj || typeof obj !== 'object') return false;
  const response = obj as Record<string, unknown>;
  return (
    Array.isArray(response.data) &&
    response.pagination !== null &&
    typeof response.pagination === 'object'
  );
}

/**
 * 检查是否为有效的站点信息
 */
export function isValidSiteInfo(obj: unknown): obj is SiteInfo {
  if (!obj || typeof obj !== 'object') return false;
  const info = obj as Record<string, unknown>;
  return (
    typeof info.siteName === 'string' &&
    typeof info.siteTitle === 'string' &&
    typeof info.description === 'string' &&
    typeof info.keywords === 'string' &&
    typeof info.logo === 'string' &&
    typeof info.favicon === 'string'
  );
}

// ============================================================================
// 导出所有类型
// ============================================================================

export type {
  // 重新导出以便统一导入
};
