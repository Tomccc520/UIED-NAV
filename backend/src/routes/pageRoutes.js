/**
 * @file pageRoutes.js
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
import { pageDataCache } from '../middleware/cache.js';
import { clearCacheByPattern, CACHE_KEYS } from '../services/cacheService.js';

const router = express.Router();
const prisma = new PrismaClient();

// 获取所有页面配置
router.get('/', pageDataCache, asyncHandler(async (req, res) => {
  const pages = await prisma.page.findMany({
    include: {
      pageCategories: {
        include: {
          category: true,
        },
        where: {
          visible: true,
        },
        orderBy: {
          order: 'asc',
        },
      },
    },
    orderBy: {
      order: 'asc',
    },
  });
  res.json(pages);
}));

// 获取页面完整数据（包含分类、子分类和网站）- 用于前端页面渲染
router.get('/:slug/full', pageDataCache, asyncHandler(async (req, res) => {
  const { slug } = req.params;
  
  // 获取页面配置
  const page = await prisma.page.findUnique({
    where: { slug },
    include: {
      pageCategories: {
        include: {
          category: {
            include: {
              children: {
                where: { visible: true },
                orderBy: { order: 'asc' },
              },
            },
          },
        },
        where: { visible: true },
        orderBy: { order: 'asc' },
      },
    },
  });

  if (!page) {
    throw ApiError.notFound('页面不存在');
  }

  // 获取该页面所有分类的ID（包括子分类）
  const categoryIds = [];
  const categories = [];
  
  for (const pc of page.pageCategories) {
    const cat = pc.category;
    categoryIds.push(cat.id);
    
    // 构建分类数据
    const categoryData = {
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      icon: cat.icon,
      color: cat.color,
      description: cat.description,
      order: pc.order,
      subCategories: cat.children.map(child => {
        categoryIds.push(child.id);
        return {
          id: child.id,
          name: child.name,
          slug: child.slug,
        };
      }),
    };
    
    categories.push(categoryData);
  }


  // 获取所有相关网站
  const websites = await prisma.website.findMany({
    where: {
      categoryId: { in: categoryIds },
    },
    orderBy: [
      { isPinned: 'desc' },  // 置顶优先
      { isHot: 'desc' },
      { isFeatured: 'desc' },
      { order: 'asc' },
    ],
  });

  // 按分类组织网站
  const websitesByCategory = {};
  for (const website of websites) {
    if (!websitesByCategory[website.categoryId]) {
      websitesByCategory[website.categoryId] = [];
    }
    
    // 安全解析 tags
    let parsedTags = [];
    if (website.tags) {
      try {
        parsedTags = JSON.parse(website.tags);
      } catch {
        // 如果不是 JSON，按逗号分隔处理
        parsedTags = website.tags.split(',').map(s => s.trim()).filter(Boolean);
      }
    }
    
    websitesByCategory[website.categoryId].push({
      id: website.id,
      name: website.name,
      description: website.description,
      url: website.url,
      iconUrl: website.iconUrl,
      isHot: website.isHot,
      isFeatured: website.isFeatured,
      isNew: website.isNew,
      tags: parsedTags,
    });
  }

  // 解析 hotSearchTags（可能是 JSON 数组或普通字符串）
  let parsedHotSearchTags = [];
  if (page.hotSearchTags) {
    try {
      parsedHotSearchTags = JSON.parse(page.hotSearchTags);
    } catch {
      // 如果不是 JSON，按逗号分隔处理
      parsedHotSearchTags = page.hotSearchTags.split(',').map(s => s.trim()).filter(Boolean);
    }
  }

  res.json({
    page: {
      id: page.id,
      name: page.name,
      slug: page.slug,
      type: page.type,
      icon: page.icon,
      description: page.description,
      heroTitle: page.heroTitle,
      heroHighlightText: page.heroHighlightText,
      heroSubtitle: page.heroSubtitle,
      hotSearchTags: parsedHotSearchTags,
      heroDisplayMode: page.heroDisplayMode || 'search',
      heroScrollWebsites: page.heroScrollWebsites,
      heroBgType: page.heroBgType || 'default',
      heroBgValue: page.heroBgValue,
      searchPlaceholder: page.searchPlaceholder,
      searchEnabled: page.searchEnabled,
      showHotRecommendations: page.showHotRecommendations,
      showCategories: page.showCategories,
      showSidebar: page.showSidebar,
      themeColor: page.themeColor,
    },
    categories,
    websitesByCategory,
    stats: {
      totalCategories: categories.length,
      totalWebsites: websites.length,
    },
  });
}));

// 获取页面的热门推荐
router.get('/:slug/hot', pageDataCache, asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const { limit = 12 } = req.query;
  
  const page = await prisma.page.findUnique({
    where: { slug },
    include: {
      pageCategories: {
        include: { category: { include: { children: true } } },
        where: { visible: true },
      },
    },
  });

  if (!page) {
    throw ApiError.notFound('页面不存在');
  }

  // 获取所有分类ID
  const categoryIds = [];
  for (const pc of page.pageCategories) {
    categoryIds.push(pc.category.id);
    for (const child of pc.category.children) {
      categoryIds.push(child.id);
    }
  }

  // 获取热门网站
  const hotWebsites = await prisma.website.findMany({
    where: {
      categoryId: { in: categoryIds },
      isHot: true,
    },
    take: parseInt(limit),
    orderBy: [
      { isFeatured: 'desc' },
      { order: 'asc' },
    ],
  });

  res.json(hotWebsites.map(w => {
    let parsedTags = [];
    if (w.tags) {
      try {
        parsedTags = JSON.parse(w.tags);
      } catch {
        parsedTags = w.tags.split(',').map(s => s.trim()).filter(Boolean);
      }
    }
    return { ...w, tags: parsedTags };
  }));
}));

// 获取页面的热门搜索标签（按点击量排序的网站名称）
router.get('/:slug/hot-tags', pageDataCache, asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const { limit = 10 } = req.query;
  
  const page = await prisma.page.findUnique({
    where: { slug },
    include: {
      pageCategories: {
        include: { category: { include: { children: true } } },
        where: { visible: true },
      },
    },
  });

  if (!page) {
    throw ApiError.notFound('页面不存在');
  }

  // 获取所有分类ID
  const categoryIds = [];
  for (const pc of page.pageCategories) {
    categoryIds.push(pc.category.id);
    for (const child of pc.category.children) {
      categoryIds.push(child.id);
    }
  }

  // 首先尝试获取有点击量的网站
  let topWebsites = await prisma.website.findMany({
    where: {
      categoryId: { in: categoryIds },
      clickCount: { gt: 0 }, // 只获取有点击量的
    },
    take: parseInt(limit),
    orderBy: [
      { clickCount: 'desc' },
      { isHot: 'desc' },
      { isFeatured: 'desc' },
    ],
    select: {
      id: true,
      name: true,
      clickCount: true,
    },
  });

  // 如果没有点击量数据，回退到热门/精选网站
  if (topWebsites.length === 0) {
    topWebsites = await prisma.website.findMany({
      where: {
        categoryId: { in: categoryIds },
        OR: [
          { isHot: true },
          { isFeatured: true },
        ],
      },
      take: parseInt(limit),
      orderBy: [
        { isHot: 'desc' },
        { isFeatured: 'desc' },
        { order: 'asc' },
      ],
      select: {
        id: true,
        name: true,
        clickCount: true,
      },
    });
  }

  // 返回网站名称作为热门标签
  res.json({
    tags: topWebsites.map(w => w.name),
    websites: topWebsites,
  });
}));


/**
 * 高亮搜索关键词
 * @param {string} text - 原始文本
 * @param {string} keyword - 搜索关键词
 * @returns {object} - 包含高亮片段的对象
 */
function highlightKeyword(text, keyword) {
  if (!text || !keyword) {
    return { original: text || '', highlights: [] };
  }
  
  const lowerText = text.toLowerCase();
  const lowerKeyword = keyword.toLowerCase();
  const highlights = [];
  let startIndex = 0;
  
  // 查找所有匹配位置
  while (true) {
    const index = lowerText.indexOf(lowerKeyword, startIndex);
    if (index === -1) break;
    
    // 提取匹配片段及其上下文（前后各20个字符）
    const contextStart = Math.max(0, index - 20);
    const contextEnd = Math.min(text.length, index + keyword.length + 20);
    const fragment = text.substring(contextStart, contextEnd);
    
    highlights.push({
      fragment,
      matchStart: index - contextStart,
      matchEnd: index - contextStart + keyword.length,
    });
    
    startIndex = index + 1;
  }
  
  return { original: text, highlights };
}

/**
 * 计算搜索相关性分数
 * @param {object} website - 网站对象
 * @param {string} keyword - 搜索关键词
 * @returns {number} - 相关性分数
 */
function calculateRelevanceScore(website, keyword) {
  const lowerKeyword = keyword.toLowerCase();
  let score = 0;
  
  // 名称匹配（权重最高）
  if (website.name) {
    const lowerName = website.name.toLowerCase();
    if (lowerName === lowerKeyword) {
      score += 100; // 完全匹配
    } else if (lowerName.startsWith(lowerKeyword)) {
      score += 50; // 前缀匹配
    } else if (lowerName.includes(lowerKeyword)) {
      score += 30; // 包含匹配
    }
  }
  
  // 描述匹配
  if (website.description && website.description.toLowerCase().includes(lowerKeyword)) {
    score += 10;
  }
  
  // 标签匹配
  if (website.tags) {
    let tags = [];
    try {
      tags = JSON.parse(website.tags);
    } catch {
      tags = website.tags.split(',').map(s => s.trim()).filter(Boolean);
    }
    
    for (const tag of tags) {
      if (tag.toLowerCase().includes(lowerKeyword)) {
        score += 5;
      }
    }
  }
  
  // 热门和推荐加分
  if (website.isHot) score += 3;
  if (website.isFeatured) score += 2;
  if (website.isNew) score += 1;
  
  return score;
}

/**
 * 获取热门推荐作为搜索建议
 * @param {PrismaClient} prisma - Prisma客户端
 * @param {string[]} categoryIds - 分类ID列表
 * @param {number} limit - 返回数量限制
 * @returns {Promise<object[]>} - 热门推荐列表
 */
async function getHotRecommendations(prisma, categoryIds, limit = 8) {
  const hotWebsites = await prisma.website.findMany({
    where: {
      categoryId: { in: categoryIds },
      OR: [
        { isHot: true },
        { isFeatured: true },
      ],
    },
    take: limit,
    orderBy: [
      { isHot: 'desc' },
      { isFeatured: 'desc' },
      { order: 'asc' },
    ],
  });

  return hotWebsites.map(w => {
    let parsedTags = [];
    if (w.tags) {
      try {
        parsedTags = JSON.parse(w.tags);
      } catch {
        parsedTags = w.tags.split(',').map(s => s.trim()).filter(Boolean);
      }
    }
    return {
      id: w.id,
      name: w.name,
      description: w.description,
      url: w.url,
      iconUrl: w.iconUrl,
      isHot: w.isHot,
      isFeatured: w.isFeatured,
      tags: parsedTags,
    };
  });
}

/**
 * 生成搜索建议词
 * @param {string} query - 搜索词
 * @param {object[]} allWebsites - 所有网站列表
 * @returns {string[]} - 建议词列表
 */
function generateSearchSuggestions(query, allWebsites) {
  const suggestions = new Set();
  const lowerQuery = query.toLowerCase();
  
  // 从网站名称中提取相关建议
  for (const website of allWebsites) {
    if (suggestions.size >= 5) break;
    
    // 检查名称是否包含查询词的部分
    const lowerName = website.name.toLowerCase();
    if (lowerName.includes(lowerQuery.substring(0, 2)) || 
        lowerQuery.includes(lowerName.substring(0, 2))) {
      suggestions.add(website.name);
    }
    
    // 从标签中提取建议
    if (website.tags) {
      let tags = [];
      try {
        tags = JSON.parse(website.tags);
      } catch {
        tags = website.tags.split(',').map(s => s.trim()).filter(Boolean);
      }
      
      for (const tag of tags) {
        if (suggestions.size >= 5) break;
        if (tag.toLowerCase().includes(lowerQuery.substring(0, 2))) {
          suggestions.add(tag);
        }
      }
    }
  }
  
  return Array.from(suggestions).slice(0, 5);
}

// 搜索页面内的网站（带高亮、相关性排序和热门推荐）
router.get('/:slug/search', asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const { q, limit = 50, highlight = 'true' } = req.query;
  
  if (!q) {
    return res.json({ results: [], total: 0, query: '', suggestions: [], recommendations: [] });
  }

  const page = await prisma.page.findUnique({
    where: { slug },
    include: {
      pageCategories: {
        include: { category: { include: { children: true } } },
        where: { visible: true },
      },
    },
  });

  if (!page) {
    throw ApiError.notFound('页面不存在');
  }

  // 获取所有分类ID
  const categoryIds = [];
  for (const pc of page.pageCategories) {
    categoryIds.push(pc.category.id);
    for (const child of pc.category.children) {
      categoryIds.push(child.id);
    }
  }

  // 搜索网站
  const websites = await prisma.website.findMany({
    where: {
      categoryId: { in: categoryIds },
      OR: [
        { name: { contains: q } },
        { description: { contains: q } },
        { tags: { contains: q } },
      ],
    },
    orderBy: [
      { isHot: 'desc' },
      { isFeatured: 'desc' },
    ],
  });

  // 处理搜索结果
  const enableHighlight = highlight === 'true';
  const results = websites.map(w => {
    let parsedTags = [];
    if (w.tags) {
      try {
        parsedTags = JSON.parse(w.tags);
      } catch {
        parsedTags = w.tags.split(',').map(s => s.trim()).filter(Boolean);
      }
    }
    
    const result = {
      ...w,
      tags: parsedTags,
      score: calculateRelevanceScore(w, q),
    };
    
    // 添加高亮信息
    if (enableHighlight) {
      result.highlights = {
        name: highlightKeyword(w.name, q).highlights,
        description: highlightKeyword(w.description, q).highlights,
      };
    }
    
    return result;
  });

  // 按相关性分数排序
  results.sort((a, b) => b.score - a.score);

  // 限制返回数量
  const limitedResults = results.slice(0, parseInt(limit));

  // 如果没有搜索结果，返回热门推荐
  let recommendations = [];
  let suggestions = [];
  
  if (results.length === 0) {
    // 获取热门推荐
    recommendations = await getHotRecommendations(prisma, categoryIds, 8);
    
    // 获取所有网站用于生成建议词
    const allWebsites = await prisma.website.findMany({
      where: { categoryId: { in: categoryIds } },
      take: 100,
    });
    
    // 生成搜索建议词
    suggestions = generateSearchSuggestions(q, allWebsites);
  }

  res.json({
    results: limitedResults,
    total: results.length,
    query: q,
    suggestions,
    recommendations,
  });
}));

// 获取单个页面配置（支持 slug 或 id）
router.get('/:slugOrId', pageDataCache, asyncHandler(async (req, res) => {
  const { slugOrId } = req.params;
  
  // 先尝试按 slug 查找
  let page = await prisma.page.findUnique({
    where: { slug: slugOrId },
    include: {
      pageCategories: {
        include: {
          category: true,
        },
        orderBy: {
          order: 'asc',
        },
      },
    },
  });

  // 如果没找到，尝试按 id 查找
  if (!page) {
    page = await prisma.page.findUnique({
      where: { id: slugOrId },
      include: {
        pageCategories: {
          include: {
            category: true,
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
    });
  }

  if (!page) {
    throw ApiError.notFound('页面不存在');
  }

  res.json(page);
}));

// 创建页面
router.post('/', asyncHandler(async (req, res) => {
  const page = await prisma.page.create({
    data: req.body,
  });
  // 清除页面相关缓存
  clearCacheByPattern(CACHE_KEYS.PAGE_DATA);
  res.json(page);
}));

// 更新页面
router.put('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const page = await prisma.page.update({
    where: { id },
    data: req.body,
  });
  // 清除页面相关缓存
  clearCacheByPattern(CACHE_KEYS.PAGE_DATA);
  res.json(page);
}));

// 删除页面
router.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  await prisma.page.delete({
    where: { id },
  });
  // 清除页面相关缓存
  clearCacheByPattern(CACHE_KEYS.PAGE_DATA);
  res.json({ success: true });
}));

// 为页面添加分类
router.post('/:pageId/categories', asyncHandler(async (req, res) => {
  const { pageId } = req.params;
  const { categoryId, order = 0, visible = true } = req.body;

  const pageCategory = await prisma.pageCategory.create({
    data: {
      pageId,
      categoryId,
      order,
      visible,
    },
    include: {
      category: true,
    },
  });

  // 清除页面相关缓存
  clearCacheByPattern(CACHE_KEYS.PAGE_DATA);
  res.json(pageCategory);
}));

// 更新页面分类关联
router.put('/:pageId/categories/:categoryId', asyncHandler(async (req, res) => {
  const { pageId, categoryId } = req.params;
  const { order, visible } = req.body;

  const pageCategory = await prisma.pageCategory.updateMany({
    where: {
      pageId,
      categoryId,
    },
    data: {
      order,
      visible,
    },
  });

  // 清除页面相关缓存
  clearCacheByPattern(CACHE_KEYS.PAGE_DATA);
  res.json(pageCategory);
}));

// 删除页面分类关联
router.delete('/:pageId/categories/:categoryId', asyncHandler(async (req, res) => {
  const { pageId, categoryId } = req.params;

  await prisma.pageCategory.deleteMany({
    where: {
      pageId,
      categoryId,
    },
  });

  // 清除页面相关缓存
  clearCacheByPattern(CACHE_KEYS.PAGE_DATA);
  res.json({ success: true });
}));

export default router;
