/**
 * @file monitorJob.js
 * @description 后端API服务
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

import cron from 'node-cron';
import monitorService from '../services/monitorService.js';

let scheduledTask = null;

/**
 * 启动监控定时任务
 */
export function startMonitorJob() {
  // 每天凌晨2点执行监控
  scheduledTask = cron.schedule('0 2 * * *', async () => {
    console.log('[Monitor] 开始执行网站状态检测...');
    
    try {
      const config = await monitorService.getConfig();
      
      if (!config.enabled) {
        console.log('[Monitor] 监控已禁用，跳过执行');
        return;
      }

      const results = await monitorService.checkAllWebsites({
        batchSize: 10,
        delayMs: 1000,
      });

      console.log(`[Monitor] 检测完成: 总计 ${results.total}, 成功 ${results.success}, 失败 ${results.failed}`);

      // 清理30天前的日志
      const cleanedCount = await monitorService.cleanupLogs(30);
      if (cleanedCount > 0) {
        console.log(`[Monitor] 清理了 ${cleanedCount} 条旧日志`);
      }
    } catch (error) {
      console.error('[Monitor] 执行失败:', error);
    }
  }, {
    timezone: 'Asia/Shanghai',
  });

  console.log('[Monitor] 定时任务已启动，每天凌晨2点执行');
}

/**
 * 停止监控定时任务
 */
export function stopMonitorJob() {
  if (scheduledTask) {
    scheduledTask.stop();
    scheduledTask = null;
    console.log('[Monitor] 定时任务已停止');
  }
}

/**
 * 手动触发一次监控
 */
export async function runMonitorNow() {
  console.log('[Monitor] 手动触发网站状态检测...');
  
  try {
    const results = await monitorService.checkAllWebsites({
      batchSize: 10,
      delayMs: 1000,
    });

    console.log(`[Monitor] 检测完成: 总计 ${results.total}, 成功 ${results.success}, 失败 ${results.failed}`);
    return results;
  } catch (error) {
    console.error('[Monitor] 执行失败:', error);
    throw error;
  }
}

export default {
  startMonitorJob,
  stopMonitorJob,
  runMonitorNow,
};
