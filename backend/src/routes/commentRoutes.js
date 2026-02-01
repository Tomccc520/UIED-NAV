/**
 * @file routes/commentRoutes.js
 * @description 评论管理路由（Pro 功能）
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

// @pro-feature-start: comments
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { requireFeature } from '../middleware/featureGuard.js';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * 获取所有评论（管理员）
 * GET /api/admin/comments
 */
router.get('/', requireFeature('comments'), async (req, res) => {
  try {
    const { type = 'website', status, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where = {};
    if (status) {
      where.status = status;
    }

    let comments = [];
    let total = 0;

    if (type === 'website') {
      // 获取网站评论
      [comments, total] = await Promise.all([
        prisma.websiteComment.findMany({
          where,
          include: {
            user: {
              select: { id: true, username: true, email: true },
            },
            website: {
              select: { id: true, title: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take,
        }),
        prisma.websiteComment.count({ where }),
      ]);
    } else if (type === 'article') {
      // 获取文章评论
      [comments, total] = await Promise.all([
        prisma.articleComment.findMany({
          where,
          include: {
            user: {
              select: { id: true, username: true, email: true },
            },
            article: {
              select: { id: true, title: true, slug: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take,
        }),
        prisma.articleComment.count({ where }),
      ]);
    }

    res.json({
      success: true,
      data: comments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / take),
      },
    });
  } catch (error) {
    console.error('获取评论列表失败:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * 批准评论
 * PUT /api/admin/comments/:id/approve
 */
router.put('/:id/approve', requireFeature('comments'), async (req, res) => {
  try {
    const { id } = req.params;
    const { type = 'website' } = req.body;

    let comment;
    if (type === 'website') {
      comment = await prisma.websiteComment.update({
        where: { id: parseInt(id) },
        data: { status: 'approved' },
      });
    } else if (type === 'article') {
      comment = await prisma.articleComment.update({
        where: { id: parseInt(id) },
        data: { status: 'approved' },
      });
    }

    res.json({ success: true, data: comment, message: '评论已批准' });
  } catch (error) {
    console.error('批准评论失败:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * 拒绝评论
 * PUT /api/admin/comments/:id/reject
 */
router.put('/:id/reject', requireFeature('comments'), async (req, res) => {
  try {
    const { id } = req.params;
    const { type = 'website' } = req.body;

    let comment;
    if (type === 'website') {
      comment = await prisma.websiteComment.update({
        where: { id: parseInt(id) },
        data: { status: 'rejected' },
      });
    } else if (type === 'article') {
      comment = await prisma.articleComment.update({
        where: { id: parseInt(id) },
        data: { status: 'rejected' },
      });
    }

    res.json({ success: true, data: comment, message: '评论已拒绝' });
  } catch (error) {
    console.error('拒绝评论失败:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * 删除评论
 * DELETE /api/admin/comments/:id
 */
router.delete('/:id', requireFeature('comments'), async (req, res) => {
  try {
    const { id } = req.params;
    const { type = 'website' } = req.query;

    if (type === 'website') {
      await prisma.websiteComment.delete({
        where: { id: parseInt(id) },
      });
    } else if (type === 'article') {
      await prisma.articleComment.delete({
        where: { id: parseInt(id) },
      });
    }

    res.json({ success: true, message: '评论已删除' });
  } catch (error) {
    console.error('删除评论失败:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
// @pro-feature-end: comments
