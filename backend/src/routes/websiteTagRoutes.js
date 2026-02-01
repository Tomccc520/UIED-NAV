/**
 * @file routes/websiteTagRoutes.js
 * @description 网站标签管理路由
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

// 获取所有标签
router.get('/', asyncHandler(async (req, res) => {
  const tags = await prisma.websiteTag.findMany({
    include: {
      _count: {
        select: { websites: true }
      }
    },
    orderBy: [
      { order: 'asc' },
      { name: 'asc' }
    ]
  });
  
  res.json({ success: true, data: tags });
}));

// 获取单个标签
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const tag = await prisma.websiteTag.findUnique({
    where: { id },
    include: {
      _count: {
        select: { websites: true }
      }
    }
  });
  
  if (!tag) {
    throw ApiError.notFound('标签不存在');
  }
  
  res.json({ success: true, data: tag });
}));

// 创建标签
router.post('/', asyncHandler(async (req, res) => {
  const { name, slug, color, description, order } = req.body;
  
  if (!name || !slug) {
    throw ApiError.badRequest('名称和标识不能为空');
  }
  
  // 检查名称是否已存在
  const existingName = await prisma.websiteTag.findUnique({
    where: { name }
  });
  if (existingName) {
    throw ApiError.badRequest('标签名称已存在');
  }
  
  // 检查 slug 是否已存在
  const existingSlug = await prisma.websiteTag.findUnique({
    where: { slug }
  });
  if (existingSlug) {
    throw ApiError.badRequest('标签标识已存在');
  }
  
  const tag = await prisma.websiteTag.create({
    data: {
      name,
      slug,
      color: color || '#1890ff',
      description: description || null,
      order: order || 0
    }
  });
  
  res.status(201).json({ success: true, data: tag });
}));

// 更新标签
router.put('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, slug, color, description, order } = req.body;
  
  // 检查标签是否存在
  const existing = await prisma.websiteTag.findUnique({
    where: { id }
  });
  if (!existing) {
    throw ApiError.notFound('标签不存在');
  }
  
  // 检查名称是否与其他标签冲突
  if (name && name !== existing.name) {
    const existingName = await prisma.websiteTag.findUnique({
      where: { name }
    });
    if (existingName) {
      throw ApiError.badRequest('标签名称已存在');
    }
  }
  
  // 检查 slug 是否与其他标签冲突
  if (slug && slug !== existing.slug) {
    const existingSlug = await prisma.websiteTag.findUnique({
      where: { slug }
    });
    if (existingSlug) {
      throw ApiError.badRequest('标签标识已存在');
    }
  }
  
  const tag = await prisma.websiteTag.update({
    where: { id },
    data: {
      name: name ?? existing.name,
      slug: slug ?? existing.slug,
      color: color ?? existing.color,
      description: description !== undefined ? description : existing.description,
      order: order ?? existing.order
    }
  });
  
  res.json({ success: true, data: tag });
}));

// 删除标签
router.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  // 检查标签是否存在
  const existing = await prisma.websiteTag.findUnique({
    where: { id }
  });
  if (!existing) {
    throw ApiError.notFound('标签不存在');
  }
  
  // 删除标签（关联关系会自动删除）
  await prisma.websiteTag.delete({
    where: { id }
  });
  
  res.json({ success: true, message: '删除成功' });
}));

// 获取标签下的网站
router.get('/:id/websites', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { page = 1, pageSize = 20 } = req.query;
  
  const skip = (parseInt(page) - 1) * parseInt(pageSize);
  const take = parseInt(pageSize);
  
  const [websites, total] = await Promise.all([
    prisma.websiteTagRelation.findMany({
      where: { tagId: id },
      include: {
        website: {
          include: {
            category: {
              select: { id: true, name: true, slug: true }
            }
          }
        }
      },
      skip,
      take
    }),
    prisma.websiteTagRelation.count({
      where: { tagId: id }
    })
  ]);
  
  res.json({
    success: true,
    data: websites.map(r => r.website),
    pagination: {
      total,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      totalPages: Math.ceil(total / parseInt(pageSize))
    }
  });
}));

// 为网站添加标签
router.post('/website/:websiteId/tags', asyncHandler(async (req, res) => {
  const { websiteId } = req.params;
  const { tagIds } = req.body;
  
  if (!Array.isArray(tagIds)) {
    throw ApiError.badRequest('tagIds 必须是数组');
  }
  
  // 检查网站是否存在
  const website = await prisma.website.findUnique({
    where: { id: websiteId }
  });
  if (!website) {
    throw ApiError.notFound('网站不存在');
  }
  
  // 删除现有关联
  await prisma.websiteTagRelation.deleteMany({
    where: { websiteId }
  });
  
  // 创建新关联
  if (tagIds.length > 0) {
    await prisma.websiteTagRelation.createMany({
      data: tagIds.map(tagId => ({
        websiteId,
        tagId
      })),
      skipDuplicates: true
    });
  }
  
  // 返回更新后的网站标签
  const updatedTags = await prisma.websiteTagRelation.findMany({
    where: { websiteId },
    include: { tag: true }
  });
  
  res.json({
    success: true,
    data: updatedTags.map(r => r.tag)
  });
}));

// 获取网站的标签
router.get('/website/:websiteId/tags', asyncHandler(async (req, res) => {
  const { websiteId } = req.params;
  
  const tags = await prisma.websiteTagRelation.findMany({
    where: { websiteId },
    include: { tag: true }
  });
  
  res.json({
    success: true,
    data: tags.map(r => r.tag)
  });
}));

export default router;
