/**
 * @file bannerRoutes.js
 * @description 后端API服务
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// 获取所有 Banner（管理后台用）
router.get('/', async (req, res) => {
  try {
    const { pageSlug, position, visible } = req.query;
    
    const where = {};
    if (pageSlug) where.pageSlug = pageSlug === 'global' ? null : pageSlug;
    if (position) where.position = position;
    if (visible !== undefined) where.visible = visible === 'true';
    
    const items = await prisma.banner.findMany({
      where,
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    });
    
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 获取前端展示用的 Banner（只返回可见且在有效期内的）
router.get('/active', async (req, res) => {
  try {
    const { pageSlug, position, limit = 10 } = req.query;
    const now = new Date();
    
    const where = {
      visible: true,
      AND: [
        {
          OR: [
            { startDate: null, endDate: null },
            { startDate: { lte: now }, endDate: null },
            { startDate: null, endDate: { gte: now } },
            { startDate: { lte: now }, endDate: { gte: now } },
          ],
        },
      ],
    };
    
    // 页面筛选：返回全局 + 指定页面的 Banner
    if (pageSlug) {
      where.AND.push({
        OR: [
          { pageSlug: null }, // 全局
          { pageSlug: pageSlug }, // 指定页面
        ],
      });
    }
    
    // 位置筛选 - 支持逗号分隔的多位置存储（如 "top,bottom"）
    if (position) {
      where.position = { contains: position };
    }
    
    const items = await prisma.banner.findMany({
      where,
      orderBy: [{ order: 'asc' }],
      take: parseInt(limit),
    });
    
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 获取单个 Banner
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const item = await prisma.banner.findUnique({ where: { id } });
    
    if (!item) {
      return res.status(404).json({ error: '未找到' });
    }
    
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 创建 Banner
router.post('/', async (req, res) => {
  try {
    const item = await prisma.banner.create({
      data: req.body,
    });
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 更新 Banner
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const item = await prisma.banner.update({
      where: { id },
      data: req.body,
    });
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 删除 Banner
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.banner.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 记录点击
router.post('/:id/click', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.banner.update({
      where: { id },
      data: { clickCount: { increment: 1 } },
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
