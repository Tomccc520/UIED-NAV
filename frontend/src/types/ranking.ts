/**
 * @file ranking.ts
 * @description 榜单系统类型定义
 * @copyright 版权所有 (c) 2025 UIED技术团队
 */

import { Website } from './api';

/**
 * 榜单标识符类型
 */
export type RankingKey =
  | 'daily_visits'
  | 'weekly_visits'
  | 'monthly_visits'
  | 'daily_favorites'
  | 'weekly_favorites'
  | 'monthly_favorites'
  | 'daily_likes'
  | 'weekly_likes'
  | 'monthly_likes'
  | 'today_hot'
  | 'seven_day_rising'
  | 'new_sites'
  | 'editor_pick'
  | string;

/**
 * 榜单扩展配置（用于前端标签切换、显示位置等）
 */
export interface RankingBoardExtra {
  metric?: 'visit' | 'favorite' | 'like' | 'curated' | string;
  period?: 'day' | 'week' | 'month' | 'all' | string;
  boardGroup?: 'metric' | 'operations' | string;
  displayPlacements?: string[];
  showOnRankingsPage?: boolean;
}

/**
 * 榜单系统前台入口配置
 */
export interface RankingPublicConfig {
  enabled?: boolean;
  displayPlacements?: string[];
  displayLabel?: string;
  displayPath?: string;
  displaySort?: number;
  displayDesktop?: boolean;
  displayMobile?: boolean;
  displayOpenInNewTab?: boolean;
  defaultMetric?: string;
  defaultPeriod?: string;
  maxVisibleBoards?: number;
  updatedAt?: number;
}

/**
 * 榜单配置
 */
export interface RankingConfig {
  key: RankingKey;
  title: string;
  description: string;
  icon?: string;
  enabled: boolean;
  limit: number;
  sortOrder: number;
}

/**
 * 榜单数据项
 */
export interface RankedWebsite extends Website {
  score?: number;
  viewCount?: number;
}

/**
 * 榜单数据响应
 */
export interface RankingBoardData {
  key: RankingKey;
  title: string;
  description: string;
  icon?: string;
  boardKey?: string;
  boardName?: string;
  algorithm?: string;
  isEnabled?: boolean;
  sort?: number;
  limitCount?: number;
  total?: number;
  extra?: RankingBoardExtra;
  metric?: string;
  period?: string;
  items: RankedWebsite[];
}

/**
 * 榜单列表响应
 */
export type RankingListResponse = RankingBoardData[];

/**
 * 榜单系统聚合响应
 */
export interface RankingBoardsAggregateResponse {
  boards: RankingBoardData[];
  total?: number;
  requestedAt?: number;
  publicConfig?: RankingPublicConfig;
}
