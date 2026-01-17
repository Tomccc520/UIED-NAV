/**
 * @file adminRoutes.js
 * @description 后端API服务
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

import express from 'express';
import { PrismaClient } from '@prisma/client';
import { body, validationResult } from 'express-validator';

const router = express.Router();
const prisma = new PrismaClient();

// ========== 分类管理 ==========

// 创建分类
router.post('/categories', [
  body('name').notEmpty().withMessage('分类名称不能为空'),
  body('slug').notEmpty().withMessage('Slug不能为空'),
  body('icon').notEmpty().withMessage('图标不能为空'),
  body('color').notEmpty().withMessage('颜色不能为空')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const category = await prisma.category.create({
      data: req.body
    });
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 更新分类
router.put('/categories/:id', async (req, res) => {
  try {
    const category = await prisma.category.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.json(category);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 删除分类
router.delete('/categories/:id', async (req, res) => {
  try {
    await prisma.category.delete({
      where: { id: req.params.id }
    });
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== 网站管理 ==========

// 创建网站
router.post('/websites', [
  body('name').notEmpty().withMessage('网站名称不能为空'),
  body('url').isURL().withMessage('URL格式不正确'),
  body('categoryId').notEmpty().withMessage('分类ID不能为空')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const data = { ...req.body };
    // 将tags数组转为JSON字符串
    if (Array.isArray(data.tags)) {
      data.tags = JSON.stringify(data.tags);
    }
    
    const website = await prisma.website.create({
      data,
      include: { category: true }
    });
    
    website.tags = JSON.parse(website.tags || '[]');
    res.status(201).json(website);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 更新网站
router.put('/websites/:id', async (req, res) => {
  try {
    const data = { ...req.body };
    // 将tags数组转为JSON字符串
    if (Array.isArray(data.tags)) {
      data.tags = JSON.stringify(data.tags);
    }
    
    const website = await prisma.website.update({
      where: { id: req.params.id },
      data,
      include: { category: true }
    });
    
    website.tags = JSON.parse(website.tags || '[]');
    res.json(website);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 删除网站
router.delete('/websites/:id', async (req, res) => {
  try {
    await prisma.website.delete({
      where: { id: req.params.id }
    });
    res.json({ message: 'Website deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 批量更新网站顺序
router.put('/websites/reorder', async (req, res) => {
  try {
    const { items } = req.body; // [{ id, order }, ...]
    
    const updates = items.map(item =>
      prisma.website.update({
        where: { id: item.id },
        data: { order: item.order }
      })
    );
    
    await prisma.$transaction(updates);
    res.json({ message: 'Order updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
