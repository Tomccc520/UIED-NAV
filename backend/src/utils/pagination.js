/**
 * @file pagination.js
 * @description 后端API服务
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

/**
 * 分页工具函数
 * 实现分页参数解析和响应格式化
 * Requirements: 4.1, 4.2, 4.3
 */

/**
 * 默认分页配置
 */
export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

/**
 * 解析分页参数
 * @param {Object} query - 请求查询参数
 * @returns {Object} 解析后的分页参数
 */
export function parsePaginationParams(query) {
  const page = Math.max(1, parseInt(query.page, 10) || DEFAULT_PAGE);
  let pageSize = parseInt(query.pageSize, 10) || DEFAULT_PAGE_SIZE;
  
  // 限制最大页面大小
  pageSize = Math.min(Math.max(1, pageSize), MAX_PAGE_SIZE);
  
  const skip = (page - 1) * pageSize;
  
  return {
    page,
    pageSize,
    skip,
    take: pageSize,
  };
}

/**
 * 格式化分页响应
 * @param {Array} data - 数据数组
 * @param {number} total - 总数
 * @param {Object} paginationParams - 分页参数
 * @returns {Object} 格式化的分页响应
 */
export function formatPaginatedResponse(data, total, paginationParams) {
  const { page, pageSize } = paginationParams;
  const totalPages = Math.ceil(total / pageSize);
  
  return {
    data,
    pagination: {
      total,
      page,
      pageSize,
      totalPages,
      hasMore: page < totalPages,
    },
  };
}

/**
 * 创建Prisma分页查询参数
 * @param {Object} query - 请求查询参数
 * @returns {Object} Prisma查询参数和分页信息
 */
export function createPrismaPageParams(query) {
  const params = parsePaginationParams(query);
  return {
    prismaParams: {
      skip: params.skip,
      take: params.take,
    },
    paginationInfo: {
      page: params.page,
      pageSize: params.pageSize,
    },
  };
}
