/**
 * @copyright Tomda (https://www.tomda.top)
 * @copyright UIED技术团队 (https://fsuied.com)
 * @author UIED技术团队
 * @createDate 2026-02-25
 */
/**
 * @file dailyHotService.ts
 * @description 每日热榜服务
 * @copyright 版权所有 (c) 2025 UIED技术团队
 */

import api from './api';
import { unwrapApiResponse } from '../utils/apiResponse';
import { DailyHotItem, DailyHotPlatform, DailyHotParams, DailyHotDisplayConfig } from '../types/dailyHot';
import { AxiosError } from 'axios';

interface DailyHotBackendPlatformRow {
  title?: string;
  platformTitle?: string;
  displayName?: string;
  isEnabled?: boolean;
  sort?: number;
  icon?: string;
  url?: string;
  link?: string;
}

interface DailyHotBackendItemRow {
  title?: string;
  url?: string;
  mobileUrl?: string;
  hot?: string | number;
  desc?: string;
  cover?: string;
  timestamp?: string;
}

interface DailyHotBackendPlatformResultRow {
  platform?: string;
  title?: string;
  displayName?: string;
  items?: DailyHotBackendItemRow[];
}

interface DailyHotBackendAggregateResponse {
  platforms?: DailyHotBackendPlatformResultRow[];
}

/**
 * 将热榜时间字段规范化为可读时间（兼容毫秒/秒级时间戳）
 */
const normalizeDailyHotTimestamp = (value: unknown): string => {
  const raw = String(value ?? '').trim();
  if (!raw) return '';

  // 已是常见可读格式时直接返回，避免重复格式化
  if (/[-/:年月日]/.test(raw) && !/^\d+$/.test(raw)) {
    return raw;
  }

  if (!/^\d{10,13}$/.test(raw)) {
    return raw;
  }

  const numeric = Number(raw);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return raw;
  }

  const timestampMs = raw.length === 10 ? numeric * 1000 : numeric;
  const date = new Date(timestampMs);
  if (Number.isNaN(date.getTime())) {
    return raw;
  }

  try {
    return new Intl.DateTimeFormat('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(date);
  } catch (error) {
    return raw;
  }
};

/**
 * 判断是否为 404 错误（用于前后端版本短暂不一致时兜底重试）
 */
const is404Error = (error: unknown): boolean => {
  return error instanceof AxiosError && error.response?.status === 404;
};

/**
 * 获取接口并在 404 时尝试兼容路径（/api 前缀与非 /api 前缀）
 */
const requestWithCompatiblePath = async <T>(
  apiPath: string,
  params?: Record<string, unknown>,
  timeoutMs = 30000
): Promise<T> => {
  try {
    const response = await api.get<T>(apiPath, { params, timeout: timeoutMs });
    return response.data;
  } catch (error) {
    if (!is404Error(error)) throw error;

    // 兼容某些环境下 API baseURL 被改成后端根路径或历史代理规则
    const legacyPath = apiPath.startsWith('/api/') ? apiPath.replace(/^\/api/, '') : `/api${apiPath}`;
    const response = await api.get<T>(legacyPath, { params, timeout: timeoutMs });
    return response.data;
  }
};

/**
 * 将后端单条热榜项统一映射为前端使用结构
 */
const mapDailyHotItem = (item: DailyHotBackendItemRow): DailyHotItem => {
  return {
    title: String(item?.title || ''),
    url: String(item?.mobileUrl || item?.url || ''),
    hotValue: item?.hot ?? '',
    desc: String(item?.desc || ''),
    cover: String(item?.cover || ''),
    timestamp: normalizeDailyHotTimestamp(item?.timestamp),
  };
};

/**
 * 将后端聚合响应转换为旧版组件兼容的 Record<平台标题, 列表>
 */
const normalizeDailyHotListResponse = (payload: unknown): Record<string, DailyHotItem[]> => {
  const unwrapped = unwrapApiResponse<DailyHotBackendAggregateResponse>(payload, {});

  // 兼容旧版后端已直接返回 Record<string, DailyHotItem[]>
  if (unwrapped && typeof unwrapped === 'object' && !Array.isArray(unwrapped) && !Array.isArray(unwrapped.platforms)) {
    const maybeRecord = unwrapped as Record<string, unknown>;
    const keys = Object.keys(maybeRecord);
    const isRecordShape = keys.length > 0 && maybeRecord[keys[0]] instanceof Array;
    if (isRecordShape) {
      return maybeRecord as Record<string, DailyHotItem[]>;
    }
  }

  const rows = Array.isArray(unwrapped?.platforms) ? unwrapped.platforms : [];
  return rows.reduce<Record<string, DailyHotItem[]>>((accumulator, row) => {
    const list = Array.isArray(row?.items) ? row.items.map(mapDailyHotItem) : [];
    /**
     * 同时挂载 displayName/title/platform 三种键，避免前端 tab 使用 platformTitle 时取不到数据
     */
    const keys = Array.from(new Set([
      String(row?.displayName || '').trim(),
      String(row?.title || '').trim(),
      String(row?.platform || '').trim(),
    ].filter(Boolean)));
    if (keys.length === 0) return accumulator;
    keys.forEach((key) => {
      accumulator[key] = list;
    });
    return accumulator;
  }, {});
};

/**
 * 将后端平台列表响应标准化为组件使用的字段结构
 */
const normalizeDailyHotPlatformsResponse = (payload: unknown): DailyHotPlatform[] => {
  const unwrapped = unwrapApiResponse<{ platforms?: DailyHotBackendPlatformRow[] }>(payload, {});
  const rows = Array.isArray(unwrapped?.platforms) ? unwrapped.platforms : [];
  return rows.map((row) => {
    const platformTitle = String(row?.platformTitle || row?.title || '').trim();
    return {
      platformTitle,
      displayName: String(row?.displayName || platformTitle),
      icon: row?.icon ? String(row.icon) : undefined,
      url: row?.url ? String(row.url) : (row?.link ? String(row.link) : undefined),
      isEnabled: row?.isEnabled !== false,
      sort: typeof row?.sort === 'number' ? row.sort : Number(row?.sort || 0),
    };
  }).filter((item) => Boolean(item.platformTitle));
};

/**
 * 获取每日热榜聚合数据
 * @param params 查询参数
 */
export const getDailyHot = async (params?: DailyHotParams): Promise<Record<string, DailyHotItem[]>> => {
  try {
    const payload = await requestWithCompatiblePath<unknown>(
      '/daily-hot',
      params ? (params as unknown as Record<string, unknown>) : undefined
    );
    return normalizeDailyHotListResponse(payload);
  } catch (error) {
    console.error('获取每日热榜数据失败:', error);
    throw error;
  }
};

/**
 * 获取热榜平台列表
 * @param refresh 是否强制刷新缓存
 */
export const getDailyHotPlatforms = async (refresh?: boolean): Promise<DailyHotPlatform[]> => {
  try {
    const payload = await requestWithCompatiblePath<unknown>(
      '/daily-hot/platforms',
      { refresh: refresh ? 1 : undefined }
    );
    return normalizeDailyHotPlatformsResponse(payload);
  } catch (error) {
    console.error('获取热榜平台列表失败:', error);
    throw error;
  }
};

/**
 * 获取每日热榜公开展示配置（首页入口/导航快捷入口等）
 */
export const getDailyHotDisplayConfig = async (): Promise<DailyHotDisplayConfig> => {
  const fallback: DailyHotDisplayConfig = {
    enabled: true,
    defaultPlatforms: [ '哔哩哔哩', '知乎', '微博' ],
    defaultLimit: 10,
    maxPlatforms: 12,
    displayPlacements: [],
    displayLabel: '每日热榜',
    displayPath: '/p/daily-hot',
    displaySort: 90,
    displayDesktop: true,
    displayMobile: true,
    displayOpenInNewTab: false,
    updatedAt: 0,
  };

  try {
    const payload = await requestWithCompatiblePath<unknown>('/daily-hot/config');
    return unwrapApiResponse<DailyHotDisplayConfig>(payload, fallback);
  } catch (error) {
    console.error('获取每日热榜展示配置失败:', error);
    return fallback;
  }
};
