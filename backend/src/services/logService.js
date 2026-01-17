/**
 * @file logService.js
 * @description 后端API服务
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * 操作日志服务
 * 用于记录管理员的所有操作
 */
export const logService = {
  /**
   * 记录操作日志
   * @param {Object} params - 日志参数
   * @param {string} params.adminId - 管理员ID
   * @param {string} params.adminName - 管理员用户名
   * @param {string} params.action - 操作类型 (create/update/delete/login/logout/approve/reject)
   * @param {string} params.module - 操作模块 (website/category/page/settings/auth/submission)
   * @param {string} [params.targetId] - 操作目标ID
   * @param {string} [params.targetName] - 操作目标名称
   * @param {Object} [params.detail] - 操作详情
   * @param {Object} [params.req] - Express请求对象（用于获取IP和UA）
   * @param {string} [params.status] - 操作状态 (success/failed)
   * @param {string} [params.errorMsg] - 错误信息
   */
  async log({ adminId, adminName, action, module, targetId, targetName, detail, req, status = 'success', errorMsg }) {
    try {
      const ip = req ? (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '') : '';
      const userAgent = req ? (req.headers['user-agent'] || '') : '';

      await prisma.operationLog.create({
        data: {
          adminId,
          adminName,
          action,
          module,
          targetId,
          targetName,
          detail: detail ? JSON.stringify(detail) : null,
          ip: typeof ip === 'string' ? ip.split(',')[0].trim() : '',
          userAgent: userAgent.substring(0, 500), // 限制长度
          status,
          errorMsg,
        },
      });
    } catch (error) {
      // 日志记录失败不应影响主业务
      console.error('记录操作日志失败:', error);
    }
  },

  /**
   * 查询操作日志
   * @param {Object} params - 查询参数
   * @param {number} [params.page=1] - 页码
   * @param {number} [params.pageSize=20] - 每页数量
   * @param {string} [params.adminName] - 管理员用户名
   * @param {string} [params.action] - 操作类型
   * @param {string} [params.module] - 操作模块
   * @param {string} [params.startDate] - 开始日期
   * @param {string} [params.endDate] - 结束日期
   */
  async query({ page = 1, pageSize = 20, adminName, action, module, startDate, endDate }) {
    const where = {};

    if (adminName) {
      where.adminName = { contains: adminName };
    }
    if (action) {
      where.action = action;
    }
    if (module) {
      where.module = module;
    }
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate + 'T23:59:59');
      }
    }

    const [items, total] = await Promise.all([
      prisma.operationLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.operationLog.count({ where }),
    ]);

    return {
      items: items.map(item => ({
        ...item,
        detail: item.detail ? JSON.parse(item.detail) : null,
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  },

  /**
   * 获取操作统计
   */
  async getStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [todayCount, totalCount, actionStats, moduleStats] = await Promise.all([
      // 今日操作数
      prisma.operationLog.count({
        where: { createdAt: { gte: today } },
      }),
      // 总操作数
      prisma.operationLog.count(),
      // 按操作类型统计
      prisma.operationLog.groupBy({
        by: ['action'],
        _count: { action: true },
        orderBy: { _count: { action: 'desc' } },
        take: 10,
      }),
      // 按模块统计
      prisma.operationLog.groupBy({
        by: ['module'],
        _count: { module: true },
        orderBy: { _count: { module: 'desc' } },
        take: 10,
      }),
    ]);

    return {
      todayCount,
      totalCount,
      actionStats: actionStats.map(s => ({ action: s.action, count: s._count.action })),
      moduleStats: moduleStats.map(s => ({ module: s.module, count: s._count.module })),
    };
  },

  /**
   * 清理旧日志（保留最近N天）
   * @param {number} days - 保留天数
   */
  async cleanup(days = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const result = await prisma.operationLog.deleteMany({
      where: { createdAt: { lt: cutoffDate } },
    });

    return result.count;
  },
};

// 操作类型常量
export const LogAction = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  LOGIN: 'login',
  LOGOUT: 'logout',
  APPROVE: 'approve',
  REJECT: 'reject',
  IMPORT: 'import',
  EXPORT: 'export',
  UPLOAD: 'upload',
  USER: 'user',
};

// 模块常量
export const LogModule = {
  AUTH: 'auth',
  WEBSITE: 'website',
  CATEGORY: 'category',
  PAGE: 'page',
  BANNER: 'banner',
  HOT_RECOMMENDATION: 'hot_recommendation',
  NAV_MENU: 'nav_menu',
  FOOTER: 'footer',
  FRIEND_LINK: 'friend_link',
  SOCIAL_MEDIA: 'social_media',
  SITE_INFO: 'site_info',
  SETTINGS: 'settings',
  SUBMISSION: 'submission',
  AI_CONFIG: 'ai_config',
  WORDPRESS: 'wordpress',
  FAVICON_API: 'favicon_api',
  UPLOAD: 'upload',
  USER: 'user',
};

export default logService;
