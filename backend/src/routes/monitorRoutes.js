/**
 * @file monitorRoutes.js
 * @description 后端API服务
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

import express from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { ApiError } from '../utils/ApiError.js';
import monitorService from '../services/monitorService.js';
import { logService, LogAction, LogModule } from '../services/logService.js';

const router = express.Router();

// 获取监控统计
router.get('/statistics', asyncHandler(async (req, res) => {
  const statistics = await monitorService.getStatistics();
  res.json(statistics);
}));

// 获取失效网站列表
router.get('/failed-websites', asyncHandler(async (req, res) => {
  const { page = 1, pageSize = 20 } = req.query;
  const result = await monitorService.getFailedWebsites({
    page: parseInt(page),
    pageSize: parseInt(pageSize),
  });
  res.json(result);
}));

// 获取监控配置
router.get('/config', asyncHandler(async (req, res) => {
  const config = await monitorService.getConfig();
  res.json(config);
}));

// 更新监控配置
router.put('/config', asyncHandler(async (req, res) => {
  const { checkInterval, timeout, maxRetries, enabled } = req.body;
  
  const config = await monitorService.updateConfig({
    checkInterval: parseInt(checkInterval) || 86400,
    timeout: parseInt(timeout) || 10000,
    maxRetries: parseInt(maxRetries) || 3,
    enabled: enabled !== false,
  });

  // 记录操作日志
  await logService.log({
    adminId: req.admin?.id,
    adminName: req.admin?.username || 'system',
    action: LogAction.UPDATE,
    module: 'monitor',
    targetName: '监控配置',
    detail: { checkInterval, timeout, maxRetries, enabled },
    req,
  });

  res.json(config);
}));

// 手动检查单个网站
router.post('/check/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await monitorService.checkWebsite(id);

  // 记录操作日志
  await logService.log({
    adminId: req.admin?.id,
    adminName: req.admin?.username || 'system',
    action: 'check',
    module: 'monitor',
    targetId: id,
    targetName: result.websiteName,
    detail: { success: result.success, status: result.status },
    req,
  });

  res.json(result);
}));

// 手动检查所有网站
router.post('/check-all', asyncHandler(async (req, res) => {
  const { batchSize = 10, delayMs = 1000 } = req.body;

  // 记录开始日志
  await logService.log({
    adminId: req.admin?.id,
    adminName: req.admin?.username || 'system',
    action: 'check_all',
    module: 'monitor',
    targetName: '全部网站',
    detail: { batchSize, delayMs },
    req,
  });

  const result = await monitorService.checkAllWebsites({
    batchSize: parseInt(batchSize),
    delayMs: parseInt(delayMs),
  });

  res.json(result);
}));

// 获取网站监控日志
router.get('/logs/:websiteId', asyncHandler(async (req, res) => {
  const { websiteId } = req.params;
  const { page = 1, pageSize = 20 } = req.query;
  
  const result = await monitorService.getWebsiteLogs(websiteId, {
    page: parseInt(page),
    pageSize: parseInt(pageSize),
  });
  
  res.json(result);
}));

// 重置网站状态
router.post('/reset/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  await monitorService.resetWebsiteStatus(id);

  // 记录操作日志
  await logService.log({
    adminId: req.admin?.id,
    adminName: req.admin?.username || 'system',
    action: 'reset',
    module: 'monitor',
    targetId: id,
    req,
  });

  res.json({ success: true });
}));

// 清理旧日志
router.post('/cleanup-logs', asyncHandler(async (req, res) => {
  const { days = 30 } = req.body;
  const count = await monitorService.cleanupLogs(parseInt(days));

  // 记录操作日志
  await logService.log({
    adminId: req.admin?.id,
    adminName: req.admin?.username || 'system',
    action: 'cleanup',
    module: 'monitor',
    detail: { days, deletedCount: count },
    req,
  });

  res.json({ success: true, deletedCount: count });
}));

export default router;
