/**
 * @file index.ts
 * @description 通用类型定义
 * @copyright 版权所有 (c) 2025 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

// 导出所有API类型
export * from './api';
export * from './ranking';
export * from './dailyHot';

/**
 * 导航菜单类型枚举
 */
export enum NavMenuType {
  UIUX = 'uiux',
  AI = 'ai',
  DESIGN = 'design',
  THREE_D = '3d',
  ECOMMERCE = 'ecommerce',
  INTERIOR = 'interior',
  FONT = 'font',
  TOOLS = 'tools',
  RESOURCES = 'resources'
}

/**
 * 排名项目/文章类型
 */
export interface RankItem {
  id: string;
  name: string;
  description?: string;
  link: string;
  thumbnail?: string;
  date?: string;
  authorName?: string;
  authorAvatar?: string;
  viewCount?: number;
  score?: number;
  timeAgo?: string;
  isNew?: boolean;
  isHot?: boolean;
  isFeatured?: boolean;
  category?: string;
  subCategory?: string;
  tags?: string[];
} 