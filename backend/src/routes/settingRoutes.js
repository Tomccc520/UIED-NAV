/**
 * @file settingRoutes.js
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

// ========== 导航菜单 ==========

// 获取所有导航菜单（树形结构）
router.get('/nav-menus', asyncHandler(async (req, res) => {
  const menus = await prisma.navMenu.findMany({
    where: { parentId: null },
    include: {
      children: {
        orderBy: { order: 'asc' }
      }
    },
    orderBy: { order: 'asc' }
  });
  res.json(menus);
}));

// 获取所有导航菜单（扁平结构）
router.get('/nav-menus/flat', asyncHandler(async (req, res) => {
  const menus = await prisma.navMenu.findMany({
    orderBy: { order: 'asc' }
  });
  res.json(menus);
}));

// 创建导航菜单
router.post('/nav-menus', asyncHandler(async (req, res) => {
  const menu = await prisma.navMenu.create({
    data: req.body
  });
  res.status(201).json(menu);
}));

// 更新导航菜单
router.put('/nav-menus/:id', asyncHandler(async (req, res) => {
  const menu = await prisma.navMenu.update({
    where: { id: req.params.id },
    data: req.body
  });
  res.json(menu);
}));

// 删除导航菜单
router.delete('/nav-menus/:id', asyncHandler(async (req, res) => {
  await prisma.navMenu.delete({
    where: { id: req.params.id }
  });
  res.json({ message: 'Menu deleted successfully' });
}));


// ========== 页脚分组 ==========

// 获取所有页脚分组（含链接）
router.get('/footer-groups', asyncHandler(async (req, res) => {
  const groups = await prisma.footerGroup.findMany({
    include: {
      links: {
        orderBy: { order: 'asc' }
      }
    },
    orderBy: { order: 'asc' }
  });
  res.json(groups);
}));

// 创建页脚分组
router.post('/footer-groups', asyncHandler(async (req, res) => {
  const group = await prisma.footerGroup.create({
    data: req.body
  });
  res.status(201).json(group);
}));

// 更新页脚分组
router.put('/footer-groups/:id', asyncHandler(async (req, res) => {
  const group = await prisma.footerGroup.update({
    where: { id: req.params.id },
    data: req.body
  });
  res.json(group);
}));

// 删除页脚分组
router.delete('/footer-groups/:id', asyncHandler(async (req, res) => {
  await prisma.footerGroup.delete({
    where: { id: req.params.id }
  });
  res.json({ message: 'Footer group deleted successfully' });
}));

// ========== 页脚链接 ==========

// 创建页脚链接
router.post('/footer-links', asyncHandler(async (req, res) => {
  const link = await prisma.footerLink.create({
    data: req.body
  });
  res.status(201).json(link);
}));

// 更新页脚链接
router.put('/footer-links/:id', asyncHandler(async (req, res) => {
  const link = await prisma.footerLink.update({
    where: { id: req.params.id },
    data: req.body
  });
  res.json(link);
}));

// 删除页脚链接
router.delete('/footer-links/:id', asyncHandler(async (req, res) => {
  await prisma.footerLink.delete({
    where: { id: req.params.id }
  });
  res.json({ message: 'Footer link deleted successfully' });
}));

// ========== 友情链接 ==========

// 获取所有友情链接
router.get('/friend-links', asyncHandler(async (req, res) => {
  const links = await prisma.friendLink.findMany({
    where: { visible: true },
    orderBy: { order: 'asc' }
  });
  res.json(links);
}));

// 获取所有友情链接（管理用）
router.get('/friend-links/all', asyncHandler(async (req, res) => {
  const links = await prisma.friendLink.findMany({
    orderBy: { order: 'asc' }
  });
  res.json(links);
}));

// 创建友情链接
router.post('/friend-links', asyncHandler(async (req, res) => {
  const link = await prisma.friendLink.create({
    data: req.body
  });
  res.status(201).json(link);
}));

// 更新友情链接
router.put('/friend-links/:id', asyncHandler(async (req, res) => {
  const link = await prisma.friendLink.update({
    where: { id: req.params.id },
    data: req.body
  });
  res.json(link);
}));

// 删除友情链接
router.delete('/friend-links/:id', asyncHandler(async (req, res) => {
  await prisma.friendLink.delete({
    where: { id: req.params.id }
  });
  res.json({ message: 'Friend link deleted successfully' });
}));

// ========== 通用设置 ==========

// 获取固定链接设置
router.get('/permalink', asyncHandler(async (req, res) => {
  const setting = await prisma.siteSetting.findUnique({
    where: { key: 'permalink_config' }
  });
  if (!setting) {
    // 返回默认值
    res.json({ 
      success: true,
      data: {
        structure: 'plain',
        customPattern: ''
      }
    });
    return;
  }
  const data = JSON.parse(setting.value);
  // 移除旧的 hotRecommendationClickMode 字段
  delete data.hotRecommendationClickMode;
  res.json({ success: true, data });
}));

// 保存固定链接设置
router.put('/permalink', asyncHandler(async (req, res) => {
  const { structure, customPattern } = req.body;
  const value = JSON.stringify({
    structure: structure || 'plain',
    customPattern: customPattern || ''
  });
  
  const setting = await prisma.siteSetting.upsert({
    where: { key: 'permalink_config' },
    update: { value },
    create: { key: 'permalink_config', value }
  });
  res.json({ success: true, data: JSON.parse(setting.value) });
}));

// 获取热门推荐点击行为设置
router.get('/hot-recommendation-click', asyncHandler(async (req, res) => {
  const setting = await prisma.siteSetting.findUnique({
    where: { key: 'hot_recommendation_click' }
  });
  if (!setting) {
    res.json({ 
      success: true,
      data: { clickMode: 'direct' }
    });
    return;
  }
  res.json({ success: true, data: JSON.parse(setting.value) });
}));

// 保存热门推荐点击行为设置
router.put('/hot-recommendation-click', asyncHandler(async (req, res) => {
  const { clickMode } = req.body;
  const value = JSON.stringify({
    clickMode: clickMode || 'direct'
  });
  
  const setting = await prisma.siteSetting.upsert({
    where: { key: 'hot_recommendation_click' },
    update: { value },
    create: { key: 'hot_recommendation_click', value }
  });
  res.json({ success: true, data: JSON.parse(setting.value) });
}));

// 获取设置
router.get('/settings/:key', asyncHandler(async (req, res) => {
  const setting = await prisma.siteSetting.findUnique({
    where: { key: req.params.key }
  });
  if (!setting) {
    throw ApiError.notFound('设置项不存在');
  }
  res.json({ key: setting.key, value: JSON.parse(setting.value) });
}));

// 保存设置
router.put('/settings/:key', asyncHandler(async (req, res) => {
  const setting = await prisma.siteSetting.upsert({
    where: { key: req.params.key },
    update: { value: JSON.stringify(req.body.value) },
    create: { key: req.params.key, value: JSON.stringify(req.body.value) }
  });
  res.json({ key: setting.key, value: JSON.parse(setting.value) });
}));

export default router;
