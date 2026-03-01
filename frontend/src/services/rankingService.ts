/**
 * @copyright Tomda (https://www.tomda.top)
 * @copyright UIED技术团队 (https://fsuied.com)
 * @author UIED技术团队
 * @createDate 2026-02-25
 */
/**
 * @file rankingService.ts
 * @description 榜单系统服务
 * @copyright 版权所有 (c) 2025 UIED技术团队
 */

import api from './api';
import { unwrapApiResponse } from '../utils/apiResponse';
import { RankingBoardData, RankingBoardsAggregateResponse, RankingKey } from '../types/ranking';

interface RankingBoardsPayload {
  boards?: RankingBoardData[];
  publicConfig?: any;
  total?: number;
  requestedAt?: number;
}

/**
 * 标准化单个榜单详情响应，兼容 {code,data} 与直出对象
 */
const normalizeRankingBoardDetailResponse = (payload: unknown): RankingBoardData => {
  return normalizeRankingBoardRow(unwrapApiResponse<RankingBoardData>(payload, {} as RankingBoardData));
};

/**
 * 统一榜单行字段（兼容 boardKey/boardName 与 key/title 两种格式）
 */
const normalizeRankingBoardRow = (row: any): RankingBoardData => {
  const source = row && typeof row === 'object' ? row : {};
  return {
    ...source,
    key: (source.key || source.boardKey || '') as RankingKey,
    title: String(source.title || source.boardName || source.key || source.boardKey || ''),
    description: String(source.description || ''),
    items: Array.isArray(source.items) ? source.items : [],
    extra: source.extra && typeof source.extra === 'object' ? source.extra : {},
    metric: String(source.metric || source.extra?.metric || ''),
    period: String(source.period || source.extra?.period || ''),
  };
};

/**
 * 获取榜单系统聚合响应（含前台公共配置）
 * @param limit 每个榜单返回条目数量
 */
export const getRankingsAggregate = async (limit?: number): Promise<RankingBoardsAggregateResponse> => {
  try {
    const response = await api.get<any>('/rankings', {
      params: { limit }
    });
    const unwrapped = unwrapApiResponse<RankingBoardsPayload | RankingBoardData[]>(response.data, [] as any);
    if (Array.isArray(unwrapped)) {
      return {
        boards: unwrapped.map(normalizeRankingBoardRow)
      };
    }
    return {
      boards: Array.isArray(unwrapped?.boards) ? unwrapped.boards.map(normalizeRankingBoardRow) : [],
      total: Number((unwrapped as any)?.total || 0),
      requestedAt: Number((unwrapped as any)?.requestedAt || 0),
      publicConfig: (unwrapped as any)?.publicConfig || undefined
    };
  } catch (error) {
    console.error('获取榜单聚合数据失败:', error);
    throw error;
  }
};

/**
 * 获取所有榜单数据
 * @param limit 每个榜单返回的条目数量（可选）
 */
export const getRankings = async (limit?: number): Promise<RankingBoardData[]> => {
  const data = await getRankingsAggregate(limit);
  return Array.isArray(data?.boards) ? data.boards : [];
};

/**
 * 获取指定榜单详情
 * @param key 榜单标识符
 * @param limit 返回条目数量（可选）
 */
export const getRankingByKey = async (key: RankingKey, limit?: number): Promise<RankingBoardData> => {
  try {
    const response = await api.get<RankingBoardData>(`/rankings/${key}`, {
      params: { limit }
    });
    return normalizeRankingBoardDetailResponse(response.data);
  } catch (error) {
    console.error(`获取榜单详情失败 [${key}]:`, error);
    throw error;
  }
};
