/**
 * @file exportRoutes.js
 * @description 后端API服务
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

import express from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import exportService from '../services/exportService.js';
import { logService, LogAction } from '../services/logService.js';

const router = express.Router();

// 导出网站数据为 CSV
router.post('/websites/csv', asyncHandler(async (req, res) => {
  const { categoryId, status, startDate, endDate } = req.body;
  
  const result = await exportService.exportWebsitesCSV({
    categoryId,
    status,
    startDate,
    endDate,
  });

  // 记录操作日志
  await logService.log({
    adminId: req.admin?.id,
    adminName: req.admin?.username || 'system',
    action: LogAction.EXPORT,
    module: 'export',
    targetName: '网站数据 CSV',
    detail: { count: result.count, filename: result.filename },
    req,
  });

  res.json(result);
}));

// 导出网站数据为 JSON
router.post('/websites/json', asyncHandler(async (req, res) => {
  const { categoryId, status, startDate, endDate } = req.body;
  
  const result = await exportService.exportWebsitesJSON({
    categoryId,
    status,
    startDate,
    endDate,
  });

  // 记录操作日志
  await logService.log({
    adminId: req.admin?.id,
    adminName: req.admin?.username || 'system',
    action: LogAction.EXPORT,
    module: 'export',
    targetName: '网站数据 JSON',
    detail: { count: result.count, filename: result.filename },
    req,
  });

  res.json(result);
}));

// 导出分类数据为 CSV
router.post('/categories/csv', asyncHandler(async (req, res) => {
  const result = await exportService.exportCategoriesCSV();

  // 记录操作日志
  await logService.log({
    adminId: req.admin?.id,
    adminName: req.admin?.username || 'system',
    action: LogAction.EXPORT,
    module: 'export',
    targetName: '分类数据 CSV',
    detail: { count: result.count, filename: result.filename },
    req,
  });

  res.json(result);
}));

// 导出分类数据为 JSON
router.post('/categories/json', asyncHandler(async (req, res) => {
  const result = await exportService.exportCategoriesJSON();

  // 记录操作日志
  await logService.log({
    adminId: req.admin?.id,
    adminName: req.admin?.username || 'system',
    action: LogAction.EXPORT,
    module: 'export',
    targetName: '分类数据 JSON',
    detail: { count: result.count, filename: result.filename },
    req,
  });

  res.json(result);
}));

// 创建数据库备份
router.post('/backup', asyncHandler(async (req, res) => {
  const result = await exportService.createBackup();

  // 记录操作日志
  await logService.log({
    adminId: req.admin?.id,
    adminName: req.admin?.username || 'system',
    action: LogAction.EXPORT,
    module: 'backup',
    targetName: '数据库备份',
    detail: { filename: result.filename, size: result.size },
    req,
  });

  res.json(result);
}));

// 获取导出文件列表
router.get('/list', asyncHandler(async (req, res) => {
  const files = await exportService.getExportList();
  res.json(files);
}));

// 下载导出文件
router.get('/download/:filename', asyncHandler(async (req, res) => {
  const { filename } = req.params;
  
  try {
    const filepath = exportService.getExportFilePath(filename);
    res.download(filepath, filename);
  } catch (error) {
    res.status(404).json({ error: '文件不存在' });
  }
}));

// 删除导出文件
router.delete('/:filename', asyncHandler(async (req, res) => {
  const { filename } = req.params;
  
  await exportService.deleteExportFile(filename);

  // 记录操作日志
  await logService.log({
    adminId: req.admin?.id,
    adminName: req.admin?.username || 'system',
    action: LogAction.DELETE,
    module: 'export',
    targetName: filename,
    req,
  });

  res.json({ success: true });
}));

// 导出全量配置数据（用于恢复）
router.post('/config/full', asyncHandler(async (req, res) => {
  const result = await exportService.exportAllConfigJSON();

  // 记录操作日志
  await logService.log({
    adminId: req.admin?.id,
    adminName: req.admin?.username || 'system',
    action: LogAction.EXPORT,
    module: 'backup',
    targetName: '全量配置备份',
    detail: { counts: result.counts, filename: result.filename },
    req,
  });

  res.json(result);
}));

// 从备份恢复配置数据
router.post('/config/restore/:filename', asyncHandler(async (req, res) => {
  const { filename } = req.params;
  
  const filepath = exportService.getExportFilePath(filename);
  const result = await exportService.restoreFromJSON(filepath);

  // 记录操作日志
  await logService.log({
    adminId: req.admin?.id,
    adminName: req.admin?.username || 'system',
    action: LogAction.UPDATE,
    module: 'backup',
    targetName: '配置恢复',
    detail: { filename, restored: result.restored, errors: result.errors },
    req,
  });

  res.json(result);
}));

export default router;
