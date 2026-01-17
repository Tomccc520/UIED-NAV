/**
 * @file categoryRoutes.js
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
import { categoriesCache } from '../middleware/cache.js';
import { clearCacheByPattern, CACHE_KEYS } from '../services/cacheService.js';

const router = express.Router();
const prisma = new PrismaClient();

// 获取所有分类（包含子分类，支持分页）
router.get('/', categoriesCache, asyncHandler(async (req, res) => {
  const { flat, page, pageSize } = req.query;
  
  // 检查是否需要分页
  const usePagination = page !== undefined || pageSize !== undefined;
  
  if (flat === 'true') {
    // 返回扁平列表，包含parentId，用于Transfer组件
    if (usePagination) {
      const paginationParams = parsePaginationParams(req.query);
      
      const [categories, total] = await Promise.all([
        prisma.category.findMany({
          orderBy: [
            { parentId: 'asc' },
            { order: 'asc' },
          ],
          include: {
            _count: {
              select: { websites: true },
            },
          },
          skip: paginationParams.skip,
          take: paginationParams.take,
        }),
        prisma.category.count(),
      ]);
      
      res.json(formatPaginatedResponse(categories, total, paginationParams));
    } else {
      const categories = await prisma.category.findMany({
        orderBy: [
          { parentId: 'asc' },
          { order: 'asc' },
        ],
        include: {
          _count: {
            select: { websites: true },
          },
        },
      });
      res.json(categories);
    }
  } else {
    // 返回树形结构 - 只返回主分类（parentId为null的分类）
    if (usePagination) {
      const paginationParams = parsePaginationParams(req.query);
      
      const [categories, total] = await Promise.all([
        prisma.category.findMany({
          where: {
            parentId: null,
          },
          orderBy: { order: 'asc' },
          include: {
            _count: {
              select: { websites: true },
            },
            children: {
              orderBy: { order: 'asc' },
              include: {
                _count: {
                  select: { websites: true },
                },
              },
            },
          },
          skip: paginationParams.skip,
          take: paginationParams.take,
        }),
        prisma.category.count({ where: { parentId: null } }),
      ]);
      
      res.json(formatPaginatedResponse(categories, total, paginationParams));
    } else {
      const categories = await prisma.category.findMany({
        where: {
          parentId: null,
        },
        orderBy: { order: 'asc' },
        include: {
          _count: {
            select: { websites: true },
          },
          children: {
            orderBy: { order: 'asc' },
            include: {
              _count: {
                select: { websites: true },
              },
            },
          },
        },
      });
      res.json(categories);
    }
  }
}));

// 获取单个分类
router.get('/:id', categoriesCache, asyncHandler(async (req, res) => {
  const category = await prisma.category.findUnique({
    where: { id: req.params.id },
    include: {
      websites: {
        orderBy: { order: 'asc' },
      },
      children: {
        orderBy: { order: 'asc' },
      },
      parent: true,
    },
  });
  if (!category) {
    throw ApiError.notFound('分类不存在');
  }
  res.json(category);
}));


// 通过slug获取分类
router.get('/slug/:slug', categoriesCache, asyncHandler(async (req, res) => {
  const category = await prisma.category.findUnique({
    where: { slug: req.params.slug },
    include: {
      websites: {
        orderBy: { order: 'asc' },
      },
      children: {
        orderBy: { order: 'asc' },
      },
    },
  });
  if (!category) {
    throw ApiError.notFound('分类不存在');
  }
  res.json(category);
}));

// 创建分类
router.post('/', asyncHandler(async (req, res) => {
  console.log('创建分类请求数据:', req.body);
  
  const { name, slug, parentId, ...rest } = req.body;
  
  // 验证必填字段
  if (!name || !slug) {
    throw ApiError.validationError('分类名称和URL标识为必填项');
  }
  
  // 检查slug是否已存在
  const existingCategory = await prisma.category.findUnique({
    where: { slug },
  });
  if (existingCategory) {
    throw ApiError.conflict(`URL标识 "${slug}" 已存在，请使用其他标识`);
  }
  
  // 如果有parentId，验证父分类是否存在
  if (parentId) {
    const parentCategory = await prisma.category.findUnique({
      where: { id: parentId },
    });
    if (!parentCategory) {
      throw ApiError.validationError('父分类不存在');
    }
  }
  
  const category = await prisma.category.create({
    data: {
      name,
      slug,
      parentId: parentId || null,
      ...rest,
    },
    include: {
      _count: {
        select: { websites: true },
      },
    },
  });
  console.log('分类创建成功:', category);
  // 清除分类相关缓存和页面数据缓存
  clearCacheByPattern(CACHE_KEYS.CATEGORIES);
  clearCacheByPattern(CACHE_KEYS.PAGE_DATA);
  res.json(category);
}));

// 更新分类
router.put('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const category = await prisma.category.update({
    where: { id },
    data: req.body,
    include: {
      _count: {
        select: { websites: true },
      },
    },
  });
  // 清除分类相关缓存和页面数据缓存
  clearCacheByPattern(CACHE_KEYS.CATEGORIES);
  clearCacheByPattern(CACHE_KEYS.PAGE_DATA);
  res.json(category);
}));

// 删除分类
router.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  await prisma.category.delete({
    where: { id },
  });
  // 清除分类相关缓存和页面数据缓存
  clearCacheByPattern(CACHE_KEYS.CATEGORIES);
  clearCacheByPattern(CACHE_KEYS.PAGE_DATA);
  res.json({ success: true });
}));

export default router;
