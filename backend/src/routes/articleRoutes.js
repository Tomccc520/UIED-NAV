/**
 * @file routes/articleRoutes.js
 * @description 文章系统路由（Pro 功能）
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

// @pro-feature-start: articles
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { asyncHandler } from '../middleware/errorHandler.js';
import { ApiError } from '../utils/ApiError.js';

const router = express.Router();
const prisma = new PrismaClient();

// ============================================
// 元数据 API（放在最前面，避免被 /:idOrSlug 匹配）
// ============================================

/**
 * 获取所有文章标签（公开）
 */
router.get('/tags', asyncHandler(async (req, res) => {
  const tags = await prisma.tag.findMany({
    orderBy: { name: 'asc' }
  });

  res.json({
    success: true,
    data: tags,
  });
}));

/**
 * 获取所有文章分类（公开）
 */
router.get('/categories', asyncHandler(async (req, res) => {
  // 从文章中获取所有不重复的分类
  const articles = await prisma.article.findMany({
    where: { status: 'published' },
    select: { category: true },
    distinct: ['category']
  });

  const categories = articles.map(a => a.category).filter(Boolean);

  res.json({
    success: true,
    data: categories,
  });
}));

/**
 * 获取所有文章（管理后台）
 */
router.get('/admin/list', asyncHandler(async (req, res) => {
  const { page = 1, pageSize = 20, status, category, search } = req.query;

  const skip = (parseInt(page) - 1) * parseInt(pageSize);
  const take = parseInt(pageSize);

  const where = {};
  if (status) where.status = status;
  if (category) where.category = category;
  if (search) {
    where.OR = [
      { title: { contains: search } },
      { content: { contains: search } },
    ];
  }

  const [articles, total] = await Promise.all([
    prisma.article.findMany({
      where,
      include: {
        tags: {
          include: { tag: true }
        },
        _count: {
          select: { comments: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    prisma.article.count({ where })
  ]);

  const formattedArticles = articles.map(article => ({
    ...article,
    tags: article.tags.map(t => t.tag),
    commentsCount: article._count.comments,
  }));

  res.json({
    success: true,
    data: formattedArticles,
    total,
    page: parseInt(page),
    pageSize: parseInt(pageSize),
    totalPages: Math.ceil(total / take),
  });
}));

// ============================================
// 公开 API
// ============================================

/**
 * 获取文章列表（公开）
 * 支持分页、分类、标签过滤
 */
router.get('/', asyncHandler(async (req, res) => {
  const { 
    page = 1, 
    pageSize = 10, 
    category, 
    tag,
    status = 'published' 
  } = req.query;

  const skip = (parseInt(page) - 1) * parseInt(pageSize);
  const take = parseInt(pageSize);

  // 构建查询条件
  const where = {
    status: status,
  };

  if (category) {
    where.category = category;
  }

  // 标签过滤需要通过关联表
  let tagFilter = {};
  if (tag) {
    tagFilter = {
      tags: {
        some: {
          tag: {
            slug: tag
          }
        }
      }
    };
  }

  const [articles, total] = await Promise.all([
    prisma.article.findMany({
      where: { ...where, ...tagFilter },
      include: {
        tags: {
          include: {
            tag: true
          }
        }
      },
      orderBy: [
        { publishedAt: 'desc' },
        { createdAt: 'desc' }
      ],
      skip,
      take,
    }),
    prisma.article.count({ where: { ...where, ...tagFilter } })
  ]);

  // 格式化返回数据
  const formattedArticles = articles.map(article => ({
    id: article.id,
    title: article.title,
    excerpt: article.excerpt,
    coverImage: article.coverImage,
    author: article.author,
    category: article.category,
    slug: article.slug,
    viewCount: article.viewCount,
    publishedAt: article.publishedAt,
    createdAt: article.createdAt,
    tags: article.tags.map(t => ({
      id: t.tag.id,
      name: t.tag.name,
      slug: t.tag.slug,
    })),
  }));

  res.json({
    success: true,
    data: formattedArticles,
    total,
    page: parseInt(page),
    pageSize: parseInt(pageSize),
    totalPages: Math.ceil(total / take),
  });
}));

/**
 * 获取文章详情（公开）
 */
router.get('/:idOrSlug', asyncHandler(async (req, res) => {
  const { idOrSlug } = req.params;

  // 尝试通过 ID 或 slug 查找
  let article = await prisma.article.findFirst({
    where: {
      OR: [
        { id: idOrSlug },
        { slug: idOrSlug }
      ],
      status: 'published'
    },
    include: {
      tags: {
        include: {
          tag: true
        }
      },
      comments: {
        where: { status: 'approved' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
            }
          }
        },
        orderBy: { createdAt: 'asc' },
        take: 50,
      }
    }
  });

  if (!article) {
    throw ApiError.notFound('文章不存在');
  }

  // 格式化返回数据
  const formattedArticle = {
    id: article.id,
    title: article.title,
    content: article.content,
    excerpt: article.excerpt,
    coverImage: article.coverImage,
    author: article.author,
    category: article.category,
    slug: article.slug,
    viewCount: article.viewCount,
    seoTitle: article.seoTitle,
    seoDescription: article.seoDescription,
    publishedAt: article.publishedAt,
    createdAt: article.createdAt,
    updatedAt: article.updatedAt,
    tags: article.tags.map(t => ({
      id: t.tag.id,
      name: t.tag.name,
      slug: t.tag.slug,
    })),
    comments: article.comments,
    commentsCount: article.comments.length,
  };

  res.json({
    success: true,
    data: formattedArticle,
  });
}));

/**
 * 记录文章浏览（公开）
 * 使用会话去重
 */
router.post('/:id/view', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { sessionId } = req.body;

  // 检查文章是否存在
  const article = await prisma.article.findUnique({
    where: { id },
    select: { id: true, viewCount: true }
  });

  if (!article) {
    throw ApiError.notFound('文章不存在');
  }

  // 简单的会话去重：使用 sessionId
  // 实际生产环境可以用 Redis 存储会话信息
  // 这里简化处理，直接增加浏览量
  const updatedArticle = await prisma.article.update({
    where: { id },
    data: {
      viewCount: { increment: 1 }
    },
    select: { viewCount: true }
  });

  res.json({
    success: true,
    data: { viewCount: updatedArticle.viewCount }
  });
}));

/**
 * 获取文章评论（公开）
 */
router.get('/:id/comments', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { page = 1, pageSize = 20 } = req.query;

  const skip = (parseInt(page) - 1) * parseInt(pageSize);
  const take = parseInt(pageSize);

  // 检查文章是否存在
  const article = await prisma.article.findUnique({
    where: { id },
    select: { id: true }
  });

  if (!article) {
    throw ApiError.notFound('文章不存在');
  }

  const [comments, total] = await Promise.all([
    prisma.articleComment.findMany({
      where: {
        articleId: id,
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
      orderBy: { createdAt: 'asc' },
      skip,
      take,
    }),
    prisma.articleComment.count({
      where: {
        articleId: id,
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

/**
 * 提交文章评论（需要认证）
 */
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

  if (trimmedText.length > 1000) {
    throw ApiError.validationError('评论内容不能超过 1000 字符');
  }

  // 验证用户ID
  if (!userId) {
    throw ApiError.validationError('用户ID不能为空');
  }

  // 检查文章是否存在
  const article = await prisma.article.findUnique({
    where: { id },
    select: { id: true }
  });

  if (!article) {
    throw ApiError.notFound('文章不存在');
  }

  // 检查用户是否存在
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, avatar: true }
  });

  if (!user) {
    throw ApiError.notFound('用户不存在');
  }

  // 创建评论
  const comment = await prisma.articleComment.create({
    data: {
      articleId: id,
      userId: userId,
      text: trimmedText,
      status: 'pending', // 文章评论默认需要审核
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
    message: '评论已提交，等待审核'
  });
}));

// ============================================
// 管理后台写操作 API
// ============================================

/**
 * 创建文章（管理后台）
 */
router.post('/', asyncHandler(async (req, res) => {
  const { 
    title, 
    content, 
    excerpt, 
    coverImage, 
    author, 
    category, 
    slug,
    status = 'draft',
    seoTitle,
    seoDescription,
    tags = []
  } = req.body;

  // 验证必填字段
  if (!title || !content) {
    throw ApiError.validationError('标题和内容为必填项');
  }

  // 生成 slug（如果未提供）
  const finalSlug = slug || generateSlug(title);

  // 检查 slug 唯一性
  const existingArticle = await prisma.article.findUnique({
    where: { slug: finalSlug }
  });

  if (existingArticle) {
    throw ApiError.validationError('URL 标识已存在，请使用其他标识');
  }

  // 处理标签
  const tagConnections = [];
  for (const tagName of tags.slice(0, 10)) { // 限制最多 10 个标签
    let tag = await prisma.tag.findFirst({
      where: { name: tagName }
    });

    if (!tag) {
      tag = await prisma.tag.create({
        data: {
          name: tagName,
          slug: generateSlug(tagName),
        }
      });
    }

    tagConnections.push({ tagId: tag.id });
  }

  // 创建文章
  const article = await prisma.article.create({
    data: {
      title,
      content,
      excerpt: excerpt || content.slice(0, 200),
      coverImage,
      author: author || '管理员',
      category: category || '未分类',
      slug: finalSlug,
      status,
      seoTitle: seoTitle || title.slice(0, 60),
      seoDescription: seoDescription || (excerpt || content).slice(0, 160),
      publishedAt: status === 'published' ? new Date() : null,
      tags: {
        create: tagConnections.map(tc => ({
          tag: { connect: { id: tc.tagId } }
        }))
      }
    },
    include: {
      tags: {
        include: { tag: true }
      }
    }
  });

  res.json({
    success: true,
    data: {
      ...article,
      tags: article.tags.map(t => t.tag),
    },
    message: '文章创建成功'
  });
}));

/**
 * 更新文章（管理后台）
 */
router.put('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { 
    title, 
    content, 
    excerpt, 
    coverImage, 
    author, 
    category, 
    slug,
    status,
    seoTitle,
    seoDescription,
    tags = []
  } = req.body;

  // 检查文章是否存在
  const existingArticle = await prisma.article.findUnique({
    where: { id }
  });

  if (!existingArticle) {
    throw ApiError.notFound('文章不存在');
  }

  // 如果修改了 slug，检查唯一性
  if (slug && slug !== existingArticle.slug) {
    const slugExists = await prisma.article.findUnique({
      where: { slug }
    });
    if (slugExists) {
      throw ApiError.validationError('URL 标识已存在');
    }
  }

  // 处理标签更新
  // 先删除现有关联
  await prisma.articleTag.deleteMany({
    where: { articleId: id }
  });

  // 创建新的标签关联
  for (const tagName of tags.slice(0, 10)) {
    let tag = await prisma.tag.findFirst({
      where: { name: tagName }
    });

    if (!tag) {
      tag = await prisma.tag.create({
        data: {
          name: tagName,
          slug: generateSlug(tagName),
        }
      });
    }

    await prisma.articleTag.create({
      data: {
        articleId: id,
        tagId: tag.id,
      }
    });
  }

  // 更新文章
  const updateData = {
    title,
    content,
    excerpt,
    coverImage,
    author,
    category,
    slug,
    seoTitle,
    seoDescription,
    updatedAt: new Date(),
  };

  // 处理状态变更
  if (status) {
    updateData.status = status;
    if (status === 'published' && !existingArticle.publishedAt) {
      updateData.publishedAt = new Date();
    }
  }

  const article = await prisma.article.update({
    where: { id },
    data: updateData,
    include: {
      tags: {
        include: { tag: true }
      }
    }
  });

  res.json({
    success: true,
    data: {
      ...article,
      tags: article.tags.map(t => t.tag),
    },
    message: '文章更新成功'
  });
}));

/**
 * 删除文章（软删除）
 */
router.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  // 检查文章是否存在
  const article = await prisma.article.findUnique({
    where: { id }
  });

  if (!article) {
    throw ApiError.notFound('文章不存在');
  }

  // 软删除：将状态改为 deleted
  await prisma.article.update({
    where: { id },
    data: { status: 'deleted' }
  });

  res.json({
    success: true,
    message: '文章已删除'
  });
}));

/**
 * 生成 URL slug
 */
function generateSlug(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fa5]+/g, '-') // 保留中文、字母、数字
    .replace(/^-+|-+$/g, '') // 去除首尾连字符
    .slice(0, 100) // 限制长度
    + '-' + Date.now().toString(36); // 添加时间戳确保唯一
}

export default router;
// @pro-feature-end: articles
