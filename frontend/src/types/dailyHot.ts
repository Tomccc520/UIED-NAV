/**
 * @file dailyHot.ts
 * @description 每日热榜类型定义
 * @copyright 版权所有 (c) 2025 UIED技术团队
 */

/**
 * 热榜单项数据
 */
export interface DailyHotItem {
  title: string;
  url: string;
  hotValue?: string | number; // 热度值
  author?: string;
  timestamp?: string;
  cover?: string;
  desc?: string;
}

/**
 * 平台信息
 */
export interface DailyHotPlatform {
  platformTitle: string; // 平台标识，如 'bilibili'
  displayName: string;   // 显示名称，如 'B站'
  icon?: string;         // 平台图标
  url?: string;          // 平台主页链接
  isEnabled?: boolean;
  sort?: number;
}

/**
 * 热榜聚合响应
 */
export interface DailyHotResponse {
  [platform: string]: DailyHotItem[];
}

/**
 * 热榜请求参数
 */
export interface DailyHotParams {
  title?: string;        // 单个平台标题
  titles?: string;       // 多平台标题（逗号分隔）
  limit?: number;        // 每个平台返回条数
  platformLimit?: number;// 最多聚合平台数
  refresh?: number;      // 1 强制刷新
}

/**
 * 每日热榜前台展示配置
 */
export interface DailyHotDisplayConfig {
  enabled: boolean;
  defaultPlatforms?: string[];
  defaultLimit?: number;
  maxPlatforms?: number;
  displayPlacements: string[];
  displayLabel: string;
  displayPath: string;
  displaySort: number;
  displayDesktop: boolean;
  displayMobile: boolean;
  displayOpenInNewTab: boolean;
  updatedAt: number;
}
