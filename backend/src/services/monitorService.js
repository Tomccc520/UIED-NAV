/**
 * @file monitorService.js
 * @description 后端API服务
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

/**
 * 网站状态监控服务
 */
export const monitorService = {
  /**
   * 获取监控配置
   */
  async getConfig() {
    let config = await prisma.monitorConfig.findFirst();
    if (!config) {
      // 创建默认配置
      config = await prisma.monitorConfig.create({
        data: {
          checkInterval: 86400,
          timeout: 10000,
          maxRetries: 3,
          enabled: true,
        },
      });
    }
    return config;
  },

  /**
   * 更新监控配置
   */
  async updateConfig(data) {
    const config = await this.getConfig();
    return await prisma.monitorConfig.update({
      where: { id: config.id },
      data: {
        checkInterval: data.checkInterval,
        timeout: data.timeout,
        maxRetries: data.maxRetries,
        enabled: data.enabled,
      },
    });
  },

  /**
   * 检查单个网站状态
   */
  async checkWebsite(websiteId) {
    const website = await prisma.website.findUnique({ where: { id: websiteId } });
    if (!website) {
      throw new Error('网站不存在');
    }

    const config = await this.getConfig();
    const startTime = Date.now();

    try {
      const response = await axios.get(website.url, {
        timeout: config.timeout,
        maxRedirects: 5,
        validateStatus: (status) => status < 500,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; UIED-Monitor/1.0)',
        },
      });

      const responseTime = Date.now() - startTime;
      const isSuccess = response.status >= 200 && response.status < 400;

      // 更新网站状态
      await prisma.website.update({
        where: { id: websiteId },
        data: {
          status: isSuccess ? 'active' : 'failed',
          lastCheckedAt: new Date(),
          failedCount: isSuccess ? 0 : website.failedCount + 1,
          statusMessage: isSuccess ? null : `HTTP ${response.status}`,
        },
      });

      // 记录日志
      await prisma.monitorLog.create({
        data: {
          websiteId,
          status: isSuccess ? 'success' : 'failed',
          httpStatus: response.status,
          responseTime,
          errorMessage: isSuccess ? null : `HTTP ${response.status}`,
        },
      });

      return {
        success: isSuccess,
        status: response.status,
        responseTime,
        websiteId,
        websiteName: website.name,
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error.code === 'ECONNABORTED' 
        ? '请求超时' 
        : error.code === 'ENOTFOUND'
        ? '域名无法解析'
        : error.message || '网络错误';

      // 更新网站状态
      await prisma.website.update({
        where: { id: websiteId },
        data: {
          status: 'failed',
          lastCheckedAt: new Date(),
          failedCount: website.failedCount + 1,
          statusMessage: errorMessage,
        },
      });

      // 记录日志
      await prisma.monitorLog.create({
        data: {
          websiteId,
          status: 'failed',
          responseTime,
          errorMessage,
        },
      });

      return {
        success: false,
        error: errorMessage,
        responseTime,
        websiteId,
        websiteName: website.name,
      };
    }
  },

  /**
   * 批量检查所有网站
   */
  async checkAllWebsites(options = {}) {
    const { batchSize = 10, delayMs = 1000 } = options;
    
    const websites = await prisma.website.findMany({
      select: { id: true, name: true, url: true },
    });

    const results = {
      total: websites.length,
      success: 0,
      failed: 0,
      details: [],
    };

    // 分批处理，避免同时发起太多请求
    for (let i = 0; i < websites.length; i += batchSize) {
      const batch = websites.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(website => this.checkWebsite(website.id))
      );

      batchResults.forEach(result => {
        if (result.success) {
          results.success++;
        } else {
          results.failed++;
        }
        results.details.push(result);
      });

      // 批次间延迟
      if (i + batchSize < websites.length) {
        await this.sleep(delayMs);
      }
    }

    return results;
  },

  /**
   * 获取监控统计
   */
  async getStatistics() {
    const [total, active, failed, unchecked] = await Promise.all([
      prisma.website.count(),
      prisma.website.count({ where: { status: 'active' } }),
      prisma.website.count({ where: { status: 'failed' } }),
      prisma.website.count({ where: { status: 'unchecked' } }),
    ]);

    // 获取最近检测时间
    const lastCheck = await prisma.monitorLog.findFirst({
      orderBy: { checkedAt: 'desc' },
      select: { checkedAt: true },
    });

    return {
      total,
      active,
      failed,
      unchecked,
      lastCheckAt: lastCheck?.checkedAt || null,
      activeRate: total > 0 ? ((active / total) * 100).toFixed(1) : 0,
    };
  },

  /**
   * 获取失效网站列表
   */
  async getFailedWebsites(options = {}) {
    const { page = 1, pageSize = 20 } = options;

    const [websites, total] = await Promise.all([
      prisma.website.findMany({
        where: { status: 'failed' },
        include: { 
          category: { select: { id: true, name: true } },
        },
        orderBy: { lastCheckedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.website.count({ where: { status: 'failed' } }),
    ]);

    return {
      items: websites,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  },

  /**
   * 获取网站监控日志
   */
  async getWebsiteLogs(websiteId, options = {}) {
    const { page = 1, pageSize = 20 } = options;

    const [logs, total] = await Promise.all([
      prisma.monitorLog.findMany({
        where: { websiteId },
        orderBy: { checkedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.monitorLog.count({ where: { websiteId } }),
    ]);

    return {
      items: logs,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  },

  /**
   * 清理旧的监控日志
   */
  async cleanupLogs(days = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const result = await prisma.monitorLog.deleteMany({
      where: { checkedAt: { lt: cutoffDate } },
    });

    return result.count;
  },

  /**
   * 重置网站状态
   */
  async resetWebsiteStatus(websiteId) {
    await prisma.website.update({
      where: { id: websiteId },
      data: {
        status: 'unchecked',
        lastCheckedAt: null,
        failedCount: 0,
        statusMessage: null,
      },
    });
  },

  /**
   * 辅助函数：延迟
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },
};

export default monitorService;
