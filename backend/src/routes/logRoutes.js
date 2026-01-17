/**
 * @file logRoutes.js
 * @description 后端API服务
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

import express from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { logService } from '../services/logService.js';

const router = express.Router();

// 获取操作日志列表
router.get('/', asyncHandler(async (req, res) => {
  const { page, pageSize, adminName, action, module, startDate, endDate } = req.query;
  
  const result = await logService.query({
    page: parseInt(page) || 1,
    pageSize: parseInt(pageSize) || 20,
    adminName,
    action,
    module,
    startDate,
    endDate,
  });
  
  res.json(result);
}));

// 获取操作统计
router.get('/stats', asyncHandler(async (req, res) => {
  const stats = await logService.getStats();
  res.json(stats);
}));

// 清理旧日志（仅管理员可用）
router.post('/cleanup', asyncHandler(async (req, res) => {
  const { days = 90 } = req.body;
  const count = await logService.cleanup(days);
  res.json({ success: true, message: `已清理 ${count} 条日志`, count });
}));

export default router;
