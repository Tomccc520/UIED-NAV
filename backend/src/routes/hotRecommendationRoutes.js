/**
 * @file hotRecommendationRoutes.js
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
import { ApiError } from '../utils/ApiError.js';

const router = express.Router();
const prisma = new PrismaClient();

// 获取热门推荐列表
router.get('/', asyncHandler(async (req, res) => {
  const { pageSlug, position, visible } = req.query;
  
  const where = {};
  if (pageSlug) where.pageSlug = pageSlug === 'global' ? null : pageSlug;
  if (position) where.position = position;
  if (visible !== undefined) where.visible = visible === 'true';
  
  const items = await prisma.hotRecommendation.findMany({
    where,
    orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
  });
  
  res.json(items);
}));

// 获取前端展示用的热门推荐（只返回可见且在有效期内的）
router.get('/active', asyncHandler(async (req, res) => {
  const { pageSlug, position, limit = 100 } = req.query;
  const now = new Date();
  
  console.log('[HotRecommendations] 获取活跃推荐, 参数:', { pageSlug, position, limit, now: now.toISOString() });
  
  const where = {
    visible: true,
    AND: [
      {
        OR: [
          // 没有设置日期限制
          { startDate: null, endDate: null },
          // 只设置了开始日期，且已经开始
          { startDate: { lte: now }, endDate: null },
          // 只设置了结束日期，且还没结束
          { startDate: null, endDate: { gte: now } },
          // 设置了开始和结束日期，且在有效期内
          { startDate: { lte: now }, endDate: { gte: now } },
        ],
      },
    ],
  };
  
  // 页面筛选：返回全局推荐 + 指定页面的推荐
  if (pageSlug) {
    where.AND.push({
      OR: [
        { pageSlug: null }, // 全局（null）
        { pageSlug: '' }, // 全局（空字符串）
        { pageSlug: pageSlug }, // 指定页面
      ],
    });
  }
  
  // 位置筛选（如果不是 'all' 则筛选）
  if (position && position !== 'all') {
    where.position = position;
  }
  
  console.log('[HotRecommendations] 查询条件:', JSON.stringify(where, null, 2));
  
  const items = await prisma.hotRecommendation.findMany({
    where,
    orderBy: [{ order: 'asc' }],
    take: parseInt(limit),
  });
  
  console.log('[HotRecommendations] 查询结果数量:', items.length);
  
  res.json(items);
}));

// 获取单个热门推荐
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const item = await prisma.hotRecommendation.findUnique({ where: { id } });
  
  if (!item) {
    throw ApiError.notFound('热门推荐不存在');
  }
  
  res.json(item);
}));

// 创建热门推荐
router.post('/', asyncHandler(async (req, res) => {
  const data = { ...req.body };
  // 将空字符串的 pageSlug 转换为 null
  if (data.pageSlug === '') {
    data.pageSlug = null;
  }
  const item = await prisma.hotRecommendation.create({
    data,
  });
  res.json(item);
}));

// 更新热门推荐
router.put('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const data = { ...req.body };
  // 将空字符串的 pageSlug 转换为 null
  if (data.pageSlug === '') {
    data.pageSlug = null;
  }
  const item = await prisma.hotRecommendation.update({
    where: { id },
    data,
  });
  res.json(item);
}));

// 删除热门推荐
router.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  await prisma.hotRecommendation.delete({ where: { id } });
  res.json({ success: true });
}));

// 记录点击
router.post('/:id/click', asyncHandler(async (req, res) => {
  const { id } = req.params;
  await prisma.hotRecommendation.update({
    where: { id },
    data: { clickCount: { increment: 1 } },
  });
  res.json({ success: true });
}));

export default router;
