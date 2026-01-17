/**
 * @file websiteRoutes.js
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
import { parsePaginationParams, formatPaginatedResponse } from '../utils/pagination.js';

const router = express.Router();
const prisma = new PrismaClient();

// 安全解析 tags
const parseTags = (tags) => {
  if (!tags) return [];
  try {
    return JSON.parse(tags);
  } catch {
    return tags.split(',').map(s => s.trim()).filter(Boolean);
  }
};

// 获取所有网站（支持分页）
router.get('/', asyncHandler(async (req, res) => {
  const { category, featured, hot, new: isNew, search, page, pageSize, ids, limit, sortField, sortOrder } = req.query;
  
  const where = {};
  
  // 支持按ID列表查询
  if (ids) {
    const idList = ids.split(',').map(id => id.trim()).filter(Boolean);
    if (idList.length > 0) {
      where.id = { in: idList };
    }
  }
  
  if (category) where.categoryId = category;
  if (featured === 'true') where.isFeatured = true;
  if (hot === 'true') where.isHot = true;
  if (isNew === 'true') where.isNew = true;
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { description: { contains: search } },
      { tags: { contains: search } }
    ];
  }

  // 处理排序 - 置顶优先
  let orderBy = [{ isPinned: 'desc' }, { order: 'asc' }];
  if (sortField) {
    const validFields = ['name', 'createdAt', 'updatedAt', 'order', 'clickCount'];
    if (validFields.includes(sortField)) {
      orderBy = [{ isPinned: 'desc' }, { [sortField]: sortOrder === 'descend' ? 'desc' : 'asc' }];
    }
  }

  // 检查是否需要分页
  const usePagination = page !== undefined || pageSize !== undefined;
  
  // 如果指定了limit但没有分页，使用limit
  const takeLimit = limit ? parseInt(limit) : undefined;
  
  if (usePagination) {
    // 分页模式
    const paginationParams = parsePaginationParams(req.query);
    
    // 并行获取数据和总数
    const [websites, total] = await Promise.all([
      prisma.website.findMany({
        where,
        include: { category: true },
        orderBy,
        skip: paginationParams.skip,
        take: paginationParams.take,
      }),
      prisma.website.count({ where }),
    ]);

    // 解析tags JSON字符串
    const websitesWithParsedTags = websites.map(site => ({
      ...site,
      tags: parseTags(site.tags)
    }));

    res.json(formatPaginatedResponse(websitesWithParsedTags, total, paginationParams));
  } else {
    // 非分页模式（向后兼容）
    const websites = await prisma.website.findMany({
      where,
      include: { category: true },
      orderBy,
      ...(takeLimit && { take: takeLimit })
    });

    // 解析tags JSON字符串
    const websitesWithParsedTags = websites.map(site => ({
      ...site,
      tags: parseTags(site.tags)
    }));

    res.json(websitesWithParsedTags);
  }
}));

// 获取单个网站
router.get('/:id', asyncHandler(async (req, res) => {
  const website = await prisma.website.findUnique({
    where: { id: req.params.id },
    include: {
      category: true
    }
  });
  if (!website) {
    throw ApiError.notFound('网站不存在');
  }
  website.tags = parseTags(website.tags);
  res.json(website);
}));

// 获取推荐网站
router.get('/featured/list', asyncHandler(async (req, res) => {
  const websites = await prisma.website.findMany({
    where: { isFeatured: true },
    include: { category: true },
    orderBy: { order: 'asc' }
  });
  const websitesWithParsedTags = websites.map(site => ({
    ...site,
    tags: JSON.parse(site.tags || '[]')
  }));
  res.json(websitesWithParsedTags);
}));

// 获取热门网站
router.get('/hot/list', asyncHandler(async (req, res) => {
  const websites = await prisma.website.findMany({
    where: { isHot: true },
    include: { category: true },
    orderBy: { order: 'asc' }
  });
  const websitesWithParsedTags = websites.map(site => ({
    ...site,
    tags: JSON.parse(site.tags || '[]')
  }));
  res.json(websitesWithParsedTags);
}));

// 创建网站
router.post('/', asyncHandler(async (req, res) => {
  const { name, description, url, iconUrl, categoryId, isNew, isFeatured, isHot, isPinned, tags, order } = req.body;
  
  if (!name || !url) {
    throw ApiError.validationError('网站名称和URL为必填项');
  }
  
  const website = await prisma.website.create({
    data: {
      name,
      description,
      url,
      iconUrl: iconUrl || null,
      categoryId,
      isNew: isNew || false,
      isFeatured: isFeatured || false,
      isHot: isHot || false,
      isPinned: isPinned || false,
      tags: typeof tags === 'string' ? tags : JSON.stringify(tags || []),
      order: order || 0,
    },
    include: { category: true }
  });
  
  res.json(website);
}));

// 更新网站
router.put('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description, url, iconUrl, categoryId, isNew, isFeatured, isHot, isPinned, tags, order } = req.body;
  
  const website = await prisma.website.update({
    where: { id },
    data: {
      name,
      description,
      url,
      iconUrl: iconUrl || null,
      categoryId,
      isNew,
      isFeatured,
      isHot,
      isPinned,
      tags: typeof tags === 'string' ? tags : JSON.stringify(tags || []),
      order,
    },
    include: { category: true }
  });
  
  res.json(website);
}));

// 删除网站
router.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  await prisma.website.delete({
    where: { id }
  });
  res.json({ success: true });
}));

// 记录网站点击
router.post('/:id/click', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const website = await prisma.website.update({
    where: { id },
    data: {
      clickCount: { increment: 1 }
    }
  });
  res.json({ success: true, clickCount: website.clickCount });
}));

// 获取点击统计数据
router.get('/stats/clicks', asyncHandler(async (req, res) => {
  const { limit = 20 } = req.query;
  
  // 获取点击量最高的网站
  const topWebsites = await prisma.website.findMany({
    take: parseInt(limit),
    orderBy: { clickCount: 'desc' },
    include: { category: true }
  });
  
  // 获取总点击量
  const totalClicks = await prisma.website.aggregate({
    _sum: { clickCount: true }
  });
  
  // 获取各分类的点击统计
  const categoryStats = await prisma.category.findMany({
    where: { parentId: null },
    include: {
      websites: {
        select: { clickCount: true }
      },
      children: {
        include: {
          websites: {
            select: { clickCount: true }
          }
        }
      }
    }
  });
  
  const categoryClickStats = categoryStats.map(cat => {
    let totalClicks = cat.websites.reduce((sum, w) => sum + w.clickCount, 0);
    cat.children.forEach(child => {
      totalClicks += child.websites.reduce((sum, w) => sum + w.clickCount, 0);
    });
    return {
      id: cat.id,
      name: cat.name,
      clickCount: totalClicks,
      websiteCount: cat.websites.length + cat.children.reduce((sum, c) => sum + c.websites.length, 0)
    };
  }).sort((a, b) => b.clickCount - a.clickCount);
  
  res.json({
    topWebsites: topWebsites.map(w => ({
      id: w.id,
      name: w.name,
      url: w.url,
      clickCount: w.clickCount,
      category: w.category?.name
    })),
    totalClicks: totalClicks._sum.clickCount || 0,
    categoryStats: categoryClickStats
  });
}));

export default router;
