/**
 * @file seoRoutes.js
 * @description 后端API服务
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

import express from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import sitemapService from '../services/sitemapService.js';
import { logService, LogAction } from '../services/logService.js';

const router = express.Router();

// 获取 SEO 文件状态
router.get('/status', asyncHandler(async (req, res) => {
  const status = await sitemapService.getStatus();
  res.json(status);
}));

// 生成 sitemap.xml
router.post('/generate-sitemap', asyncHandler(async (req, res) => {
  const result = await sitemapService.generateSitemap();

  // 记录操作日志
  await logService.log({
    adminId: req.admin?.id,
    adminName: req.admin?.username || 'system',
    action: LogAction.CREATE,
    module: 'seo',
    targetName: 'sitemap.xml',
    detail: { urlCount: result.urlCount },
    req,
  });

  res.json(result);
}));

// 生成 robots.txt
router.post('/generate-robots', asyncHandler(async (req, res) => {
  const result = await sitemapService.generateRobots();

  // 记录操作日志
  await logService.log({
    adminId: req.admin?.id,
    adminName: req.admin?.username || 'system',
    action: LogAction.CREATE,
    module: 'seo',
    targetName: 'robots.txt',
    req,
  });

  res.json(result);
}));

// 生成所有 SEO 文件
router.post('/generate-all', asyncHandler(async (req, res) => {
  const [sitemapResult, robotsResult] = await Promise.all([
    sitemapService.generateSitemap(),
    sitemapService.generateRobots(),
  ]);

  // 记录操作日志
  await logService.log({
    adminId: req.admin?.id,
    adminName: req.admin?.username || 'system',
    action: LogAction.CREATE,
    module: 'seo',
    targetName: 'SEO 文件',
    detail: { urlCount: sitemapResult.urlCount },
    req,
  });

  res.json({
    success: true,
    sitemap: sitemapResult,
    robots: robotsResult,
  });
}));

// 获取 sitemap 内容预览
router.get('/sitemap-preview', asyncHandler(async (req, res) => {
  const content = await sitemapService.getSitemapContent();
  if (content) {
    res.type('application/xml').send(content);
  } else {
    res.status(404).json({ error: 'sitemap.xml 不存在' });
  }
}));

// 获取 robots.txt 内容预览
router.get('/robots-preview', asyncHandler(async (req, res) => {
  const content = await sitemapService.getRobotsContent();
  if (content) {
    res.type('text/plain').send(content);
  } else {
    res.status(404).json({ error: 'robots.txt 不存在' });
  }
}));

export default router;
