/**
 * @file socialMediaRoutes.js
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

// ========== 旧版 API（兼容）==========

// 获取所有社交媒体配置（旧版）
router.get('/', async (req, res) => {
  try {
    const socialMedia = await prisma.socialMedia.findMany({
      orderBy: { order: 'asc' }
    });
    res.json(socialMedia);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 创建社交媒体配置（旧版）
router.post('/', async (req, res) => {
  try {
    const socialMedia = await prisma.socialMedia.create({
      data: req.body
    });
    res.json(socialMedia);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 更新社交媒体配置（旧版）
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const socialMedia = await prisma.socialMedia.update({
      where: { id },
      data: req.body
    });
    res.json(socialMedia);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 删除社交媒体配置（旧版）
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.socialMedia.delete({
      where: { id }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== 新版分组 API ==========

// 获取所有分组及其项目
router.get('/groups', async (req, res) => {
  try {
    const groups = await prisma.socialMediaGroup.findMany({
      where: { visible: true },
      include: {
        items: {
          where: { visible: true },
          orderBy: { order: 'asc' }
        }
      },
      orderBy: { order: 'asc' }
    });
    res.json(groups);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 获取所有分组（管理后台用，包含隐藏的）
router.get('/groups/all', async (req, res) => {
  try {
    const groups = await prisma.socialMediaGroup.findMany({
      include: {
        items: {
          orderBy: { order: 'asc' }
        }
      },
      orderBy: { order: 'asc' }
    });
    res.json(groups);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 创建分组
router.post('/groups', async (req, res) => {
  try {
    const group = await prisma.socialMediaGroup.create({
      data: req.body
    });
    res.json(group);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 更新分组
router.put('/groups/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const group = await prisma.socialMediaGroup.update({
      where: { id },
      data: req.body
    });
    res.json(group);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 删除分组
router.delete('/groups/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.socialMediaGroup.delete({
      where: { id }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== 分组项目 API ==========

// 创建项目
router.post('/items', async (req, res) => {
  try {
    const item = await prisma.socialMediaItem.create({
      data: req.body
    });
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 更新项目
router.put('/items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const item = await prisma.socialMediaItem.update({
      where: { id },
      data: req.body
    });
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 删除项目
router.delete('/items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.socialMediaItem.delete({
      where: { id }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
