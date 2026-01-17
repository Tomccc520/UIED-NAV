/**
 * @file siteInfoRoutes.js
 * @description 后端API服务
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

import express from 'express';
import { PrismaClient } from '@prisma/client';
import { asyncHandler } from '../middleware/errorHandler.js';
import { siteInfoCache } from '../middleware/cache.js';
import { clearCacheByPattern, CACHE_KEYS } from '../services/cacheService.js';

const router = express.Router();
const prisma = new PrismaClient();

// 获取站点信息
router.get('/', siteInfoCache, asyncHandler(async (req, res) => {
  let siteInfo = await prisma.siteInfo.findFirst();
  
  // 如果没有站点信息，创建默认的
  if (!siteInfo) {
    siteInfo = await prisma.siteInfo.create({
      data: {
        siteName: 'UIED设计导航',
        siteTitle: 'UIED设计导航 - 设计师的工具导航平台',
        description: 'UIED设计导航汇集优质设计工具与资源，涵盖UI/UX设计、平面设计、AI设计工具等多个领域',
        keywords: '设计导航,UI设计,UX设计,设计工具,设计资源,Figma,Sketch,Adobe',
        logo: '/logo-3.svg',
        favicon: '/favicon.ico',
        icp: '粤ICP备2022056875号',
        icpLink: 'https://beian.miit.gov.cn',
        copyright: '© 2025 UIED设计导航 · 佛山市南海区迅捷腾达电子商务服务中心',
      },
    });
  }
  
  res.json(siteInfo);
}));

// 更新站点信息
router.put('/', asyncHandler(async (req, res) => {
  let siteInfo = await prisma.siteInfo.findFirst();
  
  if (siteInfo) {
    // 更新现有记录
    siteInfo = await prisma.siteInfo.update({
      where: { id: siteInfo.id },
      data: req.body,
    });
  } else {
    // 创建新记录
    siteInfo = await prisma.siteInfo.create({
      data: req.body,
    });
  }
  
  // 清除站点信息缓存
  clearCacheByPattern(CACHE_KEYS.SITE_INFO);
  res.json(siteInfo);
}));

export default router;
