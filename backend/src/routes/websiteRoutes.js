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

// 获取单个网站详情（支持 ID 或 slug）
router.get('/:idOrSlug', asyncHandler(async (req, res) => {
  const { idOrSlug } = req.params;
  
  // 判断是 ID 还是 slug
  // CUID 格式：以 c 开头，后面是 20-30 个字母数字字符
  // slug 通常是小写字母、数字和连字符组成的短字符串
  const isCuid = /^c[a-z0-9]{20,30}$/i.test(idOrSlug);
  
  // 获取网站基本信息
  let website;
  if (isCuid) {
    // 按 ID 查询
    website = await prisma.website.findUnique({
      where: { id: idOrSlug },
      include: {
        category: {
          include: {
            parent: true,
          }
        }
      }
    });
  } else {
    // 按 slug 查询
    website = await prisma.website.findUnique({
      where: { slug: idOrSlug },
      include: {
        category: {
          include: {
            parent: true,
          }
        }
      }
    });
  }
  
  if (!website) {
    throw ApiError.notFound('网站不存在');
  }
  
  // 解析 tags
  website.tags = parseTags(website.tags);
  
  // 使用实际的 ID 进行后续查询
  const id = website.id;
  
  // @pro-feature-start: website-detail-pro-data
  // Pro 功能：获取评分、评论、收藏等信息
  // 获取评分统计
  const ratingStats = await prisma.rating.aggregate({
    where: { websiteId: id },
    _avg: { rating: true },
    _count: true,
  });
  
  // 获取评论数量
  const commentsCount = await prisma.websiteComment.count({
    where: { 
      websiteId: id,
      status: 'approved'
    }
  });
  
  const proData = {
    averageRating: ratingStats._avg.rating ? Math.round(ratingStats._avg.rating * 10) / 10 : null,
    totalRatings: ratingStats._count,
    userRating: null, // 需要用户登录后才能获取
    isFavorited: false, // 需要用户登录后才能获取
    commentsCount: commentsCount,
  };
  // @pro-feature-end: website-detail-pro-data
  
  // 返回完整的网站详情
  res.json({
    ...website,
    ...proData,
  });
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
  const { 
    name, description, url, iconUrl, categoryId, isNew, isFeatured, isHot, isPinned, tags, order, 
    slug,
    seoTitle, seoDescription, seoKeywords,
    detailContent, screenshots, visitBtnText
  } = req.body;
  
  if (!name || !url) {
    throw ApiError.validationError('网站名称和URL为必填项');
  }
  
  // 如果提供了 slug，检查是否已存在
  if (slug) {
    const existingSlug = await prisma.website.findUnique({
      where: { slug },
      select: { id: true }
    });
    if (existingSlug) {
      throw ApiError.validationError('固定链接已被使用，请更换');
    }
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
      slug: slug || null,
      // SEO 字段
      seoTitle: seoTitle || null,
      seoDescription: seoDescription || null,
      seoKeywords: seoKeywords || null,
      // 详情页内容字段
      detailContent: detailContent || null,
      screenshots: typeof screenshots === 'string' ? screenshots : JSON.stringify(screenshots || []),
      visitBtnText: visitBtnText || null,
    },
    include: { category: true }
  });
  
  res.json(website);
}));

// 更新网站
router.put('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { 
    name, description, url, iconUrl, categoryId, isNew, isFeatured, isHot, isPinned, tags, order, 
    slug,
    seoTitle, seoDescription, seoKeywords,
    detailContent, screenshots, visitBtnText
  } = req.body;
  
  // 如果提供了 slug，检查是否已被其他网站使用
  if (slug) {
    const existingSlug = await prisma.website.findFirst({
      where: { 
        slug,
        id: { not: id }
      },
      select: { id: true }
    });
    if (existingSlug) {
      throw ApiError.validationError('固定链接已被使用，请更换');
    }
  }
  
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
      slug: slug || null,
      // SEO 字段
      seoTitle: seoTitle || null,
      seoDescription: seoDescription || null,
      seoKeywords: seoKeywords || null,
      // 详情页内容字段
      detailContent: detailContent || null,
      screenshots: typeof screenshots === 'string' ? screenshots : JSON.stringify(screenshots || []),
      visitBtnText: visitBtnText || null,
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

// @pro-feature-start: ratings
// 获取网站评分统计
router.get('/:id/ratings', asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  // 检查网站是否存在
  const website = await prisma.website.findUnique({
    where: { id },
    select: { id: true }
  });
  
  if (!website) {
    throw ApiError.notFound('网站不存在');
  }
  
  // 获取评分统计
  const stats = await prisma.rating.aggregate({
    where: { websiteId: id },
    _avg: { rating: true },
    _count: true,
  });
  
  // 获取评分分布
  const distribution = await prisma.rating.groupBy({
    by: ['rating'],
    where: { websiteId: id },
    _count: true,
  });
  
  // 格式化评分分布
  const ratingDistribution = {
    1: 0, 2: 0, 3: 0, 4: 0, 5: 0
  };
  distribution.forEach(item => {
    ratingDistribution[item.rating] = item._count;
  });
  
  res.json({
    success: true,
    data: {
      averageRating: stats._avg.rating ? Math.round(stats._avg.rating * 10) / 10 : null,
      totalRatings: stats._count,
      distribution: ratingDistribution,
    }
  });
}));

// 提交/更新网站评分（需要认证 + Pro 功能）
router.post('/:id/rate', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rating, userId } = req.body;
  
  // 验证评分值
  if (!rating || rating < 1 || rating > 5 || !Number.isInteger(rating)) {
    throw ApiError.validationError('评分必须是 1-5 之间的整数');
  }
  
  // 验证用户ID（Pro 版本中会从认证中间件获取）
  if (!userId) {
    throw ApiError.validationError('用户ID不能为空');
  }
  
  // 检查网站是否存在
  const website = await prisma.website.findUnique({
    where: { id },
    select: { id: true }
  });
  
  if (!website) {
    throw ApiError.notFound('网站不存在');
  }
  
  // 检查用户是否存在
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true }
  });
  
  if (!user) {
    throw ApiError.notFound('用户不存在');
  }
  
  // 使用 upsert 创建或更新评分
  const result = await prisma.rating.upsert({
    where: {
      websiteId_userId: {
        websiteId: id,
        userId: userId,
      }
    },
    update: {
      rating: rating,
    },
    create: {
      websiteId: id,
      userId: userId,
      rating: rating,
    },
  });
  
  // 获取更新后的统计
  const stats = await prisma.rating.aggregate({
    where: { websiteId: id },
    _avg: { rating: true },
    _count: true,
  });
  
  res.json({
    success: true,
    data: {
      userRating: result.rating,
      averageRating: stats._avg.rating ? Math.round(stats._avg.rating * 10) / 10 : null,
      totalRatings: stats._count,
    },
    message: '评分成功'
  });
}));

// 获取用户对网站的评分
router.get('/:id/user-rating/:userId', asyncHandler(async (req, res) => {
  const { id, userId } = req.params;
  
  const rating = await prisma.rating.findUnique({
    where: {
      websiteId_userId: {
        websiteId: id,
        userId: userId,
      }
    },
    select: { rating: true }
  });
  
  res.json({
    success: true,
    data: {
      userRating: rating?.rating || null,
    }
  });
}));
// @pro-feature-end: ratings

// @pro-feature-start: comments
// 获取网站评论列表
router.get('/:id/comments', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { page = 1, pageSize = 20 } = req.query;
  
  // 检查网站是否存在
  const website = await prisma.website.findUnique({
    where: { id },
    select: { id: true }
  });
  
  if (!website) {
    throw ApiError.notFound('网站不存在');
  }
  
  const skip = (parseInt(page) - 1) * parseInt(pageSize);
  const take = parseInt(pageSize);
  
  // 获取已批准的评论
  const [comments, total] = await Promise.all([
    prisma.websiteComment.findMany({
      where: { 
        websiteId: id,
        status: 'approved'
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    prisma.websiteComment.count({
      where: { 
        websiteId: id,
        status: 'approved'
      }
    })
  ]);
  
  res.json({
    success: true,
    data: comments,
    total,
    page: parseInt(page),
    pageSize: parseInt(pageSize),
    totalPages: Math.ceil(total / take),
  });
}));

// 提交网站评论（需要认证 + Pro 功能）
router.post('/:id/comments', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { text, userId } = req.body;
  
  // 验证评论内容
  if (!text || typeof text !== 'string') {
    throw ApiError.validationError('评论内容不能为空');
  }
  
  const trimmedText = text.trim();
  if (trimmedText.length === 0) {
    throw ApiError.validationError('评论内容不能为空');
  }
  
  if (trimmedText.length > 500) {
    throw ApiError.validationError('评论内容不能超过 500 字符');
  }
  
  // 验证用户ID
  if (!userId) {
    throw ApiError.validationError('用户ID不能为空');
  }
  
  // 检查网站是否存在
  const website = await prisma.website.findUnique({
    where: { id },
    select: { id: true }
  });
  
  if (!website) {
    throw ApiError.notFound('网站不存在');
  }
  
  // 检查用户是否存在
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, avatar: true }
  });
  
  if (!user) {
    throw ApiError.notFound('用户不存在');
  }
  
  // 创建评论（默认状态为 approved，可根据需要改为 pending 需审核）
  const comment = await prisma.websiteComment.create({
    data: {
      websiteId: id,
      userId: userId,
      text: trimmedText,
      status: 'approved', // 开源版默认直接通过，Pro 版可改为 pending
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          avatar: true,
        }
      }
    }
  });
  
  res.json({
    success: true,
    data: comment,
    message: '评论发表成功'
  });
}));
// @pro-feature-end: comments

// @pro-feature-start: favorites
// 添加收藏
router.post('/:id/favorite', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;
  
  // 验证用户ID
  if (!userId) {
    throw ApiError.validationError('用户ID不能为空');
  }
  
  // 检查网站是否存在
  const website = await prisma.website.findUnique({
    where: { id },
    select: { id: true, name: true }
  });
  
  if (!website) {
    throw ApiError.notFound('网站不存在');
  }
  
  // 检查用户是否存在
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true }
  });
  
  if (!user) {
    throw ApiError.notFound('用户不存在');
  }
  
  // 检查是否已收藏
  const existing = await prisma.favorite.findUnique({
    where: {
      websiteId_userId: {
        websiteId: id,
        userId: userId,
      }
    }
  });
  
  if (existing) {
    return res.json({
      success: true,
      data: { isFavorited: true },
      message: '已在收藏夹中'
    });
  }
  
  // 创建收藏
  await prisma.favorite.create({
    data: {
      websiteId: id,
      userId: userId,
    }
  });
  
  res.json({
    success: true,
    data: { isFavorited: true },
    message: '收藏成功'
  });
}));

// 取消收藏
router.delete('/:id/favorite', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;
  
  // 验证用户ID
  if (!userId) {
    throw ApiError.validationError('用户ID不能为空');
  }
  
  // 删除收藏（如果存在）
  await prisma.favorite.deleteMany({
    where: {
      websiteId: id,
      userId: userId,
    }
  });
  
  res.json({
    success: true,
    data: { isFavorited: false },
    message: '已取消收藏'
  });
}));

// 检查收藏状态
router.get('/:id/favorite/:userId', asyncHandler(async (req, res) => {
  const { id, userId } = req.params;
  
  const favorite = await prisma.favorite.findUnique({
    where: {
      websiteId_userId: {
        websiteId: id,
        userId: userId,
      }
    }
  });
  
  res.json({
    success: true,
    data: { isFavorited: !!favorite }
  });
}));
// @pro-feature-end: favorites

// @pro-feature-start: related-websites
// 获取相关网站推荐
router.get('/:id/related', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { limit = 6 } = req.query;
  
  // 检查网站是否存在
  const website = await prisma.website.findUnique({
    where: { id },
    select: { 
      id: true, 
      categoryId: true, 
      tags: true,
      category: {
        select: {
          id: true,
          parentId: true,
        }
      }
    }
  });
  
  if (!website) {
    throw ApiError.notFound('网站不存在');
  }
  
  // 获取同分类的网站
  const sameCategoryWebsites = await prisma.website.findMany({
    where: {
      id: { not: id },
      categoryId: website.categoryId,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      url: true,
      iconUrl: true,
      tags: true,
      category: {
        select: {
          id: true,
          name: true,
        }
      }
    },
    orderBy: [
      { clickCount: 'desc' },
      { createdAt: 'desc' },
    ],
    take: parseInt(limit),
  });
  
  let relatedWebsites = [...sameCategoryWebsites];
  
  // 如果不够，补充同父分类的网站
  if (relatedWebsites.length < parseInt(limit) && website.category?.parentId) {
    const siblingCategories = await prisma.category.findMany({
      where: {
        parentId: website.category.parentId,
        id: { not: website.categoryId },
      },
      select: { id: true }
    });
    
    const siblingCategoryIds = siblingCategories.map(c => c.id);
    const existingIds = relatedWebsites.map(w => w.id);
    
    const siblingWebsites = await prisma.website.findMany({
      where: {
        id: { notIn: [id, ...existingIds] },
        categoryId: { in: siblingCategoryIds },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        url: true,
        iconUrl: true,
        tags: true,
        category: {
          select: {
            id: true,
            name: true,
          }
        }
      },
      orderBy: [
        { clickCount: 'desc' },
        { createdAt: 'desc' },
      ],
      take: parseInt(limit) - relatedWebsites.length,
    });
    
    relatedWebsites = [...relatedWebsites, ...siblingWebsites];
  }
  
  // 解析标签
  const result = relatedWebsites.map(w => ({
    ...w,
    tags: parseTags(w.tags),
  }));
  
  res.json({
    success: true,
    data: result,
  });
}));
// @pro-feature-end: related-websites

// @pro-feature-start: browsing-history
// 记录浏览历史
router.post('/:id/view', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;
  
  // 如果没有用户ID，直接返回成功（匿名用户不记录）
  if (!userId) {
    return res.json({
      success: true,
      message: '匿名访问'
    });
  }
  
  // 检查网站是否存在
  const website = await prisma.website.findUnique({
    where: { id },
    select: { id: true }
  });
  
  if (!website) {
    throw ApiError.notFound('网站不存在');
  }
  
  // 检查用户是否存在
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true }
  });
  
  if (!user) {
    throw ApiError.notFound('用户不存在');
  }
  
  // 使用 upsert 实现幂等性（同一用户多次访问只更新时间戳）
  await prisma.browsingHistory.upsert({
    where: {
      websiteId_userId: {
        websiteId: id,
        userId: userId,
      }
    },
    update: {
      viewedAt: new Date(),
    },
    create: {
      websiteId: id,
      userId: userId,
    },
  });
  
  // 检查并限制历史记录数量（每用户最多 100 条）
  const historyCount = await prisma.browsingHistory.count({
    where: { userId }
  });
  
  if (historyCount > 100) {
    // 删除最旧的记录
    const oldestRecords = await prisma.browsingHistory.findMany({
      where: { userId },
      orderBy: { viewedAt: 'asc' },
      take: historyCount - 100,
      select: { id: true }
    });
    
    await prisma.browsingHistory.deleteMany({
      where: {
        id: { in: oldestRecords.map(r => r.id) }
      }
    });
  }
  
  res.json({
    success: true,
    message: '浏览记录已保存'
  });
}));

// 获取用户浏览历史
router.get('/history/:userId', asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { page = 1, pageSize = 20 } = req.query;
  
  const skip = (parseInt(page) - 1) * parseInt(pageSize);
  const take = parseInt(pageSize);
  
  const [history, total] = await Promise.all([
    prisma.browsingHistory.findMany({
      where: { userId },
      include: {
        website: {
          select: {
            id: true,
            name: true,
            description: true,
            url: true,
            iconUrl: true,
            category: {
              select: {
                id: true,
                name: true,
              }
            }
          }
        }
      },
      orderBy: { viewedAt: 'desc' },
      skip,
      take,
    }),
    prisma.browsingHistory.count({
      where: { userId }
    })
  ]);
  
  res.json({
    success: true,
    data: history,
    total,
    page: parseInt(page),
    pageSize: parseInt(pageSize),
    totalPages: Math.ceil(total / take),
  });
}));
// @pro-feature-end: browsing-history

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

/**
 * 获取 slug 统计信息
 * GET /api/websites/slug-stats
 */
router.get('/slug-stats', asyncHandler(async (req, res) => {
  const [total, withSlug, withoutSlug] = await Promise.all([
    prisma.website.count(),
    prisma.website.count({ where: { slug: { not: null } } }),
    prisma.website.count({ where: { OR: [{ slug: null }, { slug: '' }] } })
  ]);
  
  res.json({
    success: true,
    data: {
      total,
      withSlug,
      withoutSlug
    }
  });
}));

// 生成 slug（根据名称自动生成拼音）
router.post('/generate-slug', asyncHandler(async (req, res) => {
  const { name, url, excludeId } = req.body;
  
  if (!name) {
    throw ApiError.validationError('请提供网站名称');
  }
  
  // 动态导入 slugHelper
  const { generateSlug, ensureUniqueSlug } = await import('../utils/slugHelper.js');
  
  // 生成基础 slug
  const baseSlug = generateSlug(name, url);
  
  // 检查唯一性的函数
  const checkExists = async (slug, excludeId) => {
    const where = { slug };
    if (excludeId) {
      where.NOT = { id: excludeId };
    }
    const existing = await prisma.website.findFirst({ where, select: { id: true } });
    return !!existing;
  };
  
  // 确保唯一性
  const uniqueSlug = await ensureUniqueSlug(baseSlug, checkExists, excludeId);
  
  res.json({
    success: true,
    data: {
      slug: uniqueSlug,
      baseSlug,
      isUnique: uniqueSlug === baseSlug
    }
  });
}));

// 批量生成 slug（为没有 slug 的网站自动生成）
router.post('/batch-generate-slugs', asyncHandler(async (req, res) => {
  const { mode = 'pinyin', dryRun = false } = req.body;
  
  // 动态导入 slugHelper
  const { generateSlug, ensureUniqueSlug } = await import('../utils/slugHelper.js');
  
  // 获取没有 slug 的网站
  const websites = await prisma.website.findMany({
    where: { OR: [{ slug: null }, { slug: '' }] },
    select: { id: true, name: true, url: true },
    orderBy: { createdAt: 'asc' }
  });
  
  if (websites.length === 0) {
    return res.json({
      success: true,
      message: '所有网站都已有固定链接',
      data: { updated: 0, total: 0 }
    });
  }
  
  // 收集已存在的 slug
  const existingSlugs = await prisma.website.findMany({
    where: { slug: { not: null } },
    select: { slug: true }
  });
  const slugSet = new Set(existingSlugs.map(w => w.slug));
  
  // 检查唯一性的函数
  const checkExists = async (slug) => slugSet.has(slug);
  
  const results = [];
  let updated = 0;
  
  for (const website of websites) {
    const baseSlug = generateSlug(website.name, website.url);
    const uniqueSlug = await ensureUniqueSlug(baseSlug, checkExists);
    slugSet.add(uniqueSlug); // 添加到集合中避免重复
    
    results.push({
      id: website.id,
      name: website.name,
      slug: uniqueSlug
    });
    
    if (!dryRun) {
      await prisma.website.update({
        where: { id: website.id },
        data: { slug: uniqueSlug }
      });
      updated++;
    }
  }
  
  res.json({
    success: true,
    message: dryRun 
      ? `预览模式：将为 ${results.length} 个网站生成固定链接`
      : `成功为 ${updated} 个网站生成固定链接`,
    data: {
      updated: dryRun ? 0 : updated,
      total: results.length,
      preview: results.slice(0, 20) // 只返回前 20 条预览
    }
  });
}));

export default router;
