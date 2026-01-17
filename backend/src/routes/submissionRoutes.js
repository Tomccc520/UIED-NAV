/**
 * @file submissionRoutes.js
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

// ==================== 前端提交接口 ====================

// 检查URL是否已存在（前端用户）
router.get('/check-url', async (req, res) => {
  try {
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({ error: 'URL为必填项' });
    }
    
    // 标准化URL：去掉协议和末尾斜杠
    const normalizedUrl = url.replace(/^https?:\/\//, '').replace(/\/$/, '');
    
    // 检查网站表
    const existingWebsite = await prisma.website.findFirst({
      where: { url: { contains: normalizedUrl } },
      select: { id: true, name: true, url: true }
    });
    
    if (existingWebsite) {
      return res.json({ 
        exists: true, 
        type: 'website',
        message: '该网站已被收录',
        website: existingWebsite
      });
    }
    
    // 检查待审核队列
    const existingSubmission = await prisma.websiteSubmission.findFirst({
      where: { 
        url: { contains: normalizedUrl },
        status: 'pending'
      },
      select: { id: true, name: true, url: true, createdAt: true }
    });
    
    if (existingSubmission) {
      return res.json({ 
        exists: true, 
        type: 'pending',
        message: '该网站已在审核队列中',
        submission: existingSubmission
      });
    }
    
    res.json({ exists: false });
  } catch (error) {
    console.error('检查URL失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// 提交网站（前端用户）
router.post('/', async (req, res) => {
  try {
    const { name, description, url, iconUrl, categoryId, tags, submitterName, submitterEmail } = req.body;
    
    if (!name || !url) {
      return res.status(400).json({ error: '网站名称和URL为必填项' });
    }
    
    // 检查URL是否已存在（在网站表或提交表中）
    const existingWebsite = await prisma.website.findFirst({
      where: { url: { contains: url.replace(/^https?:\/\//, '').replace(/\/$/, '') } }
    });
    
    if (existingWebsite) {
      return res.status(400).json({ error: '该网站已被收录' });
    }
    
    const existingSubmission = await prisma.websiteSubmission.findFirst({
      where: { 
        url: { contains: url.replace(/^https?:\/\//, '').replace(/\/$/, '') },
        status: 'pending'
      }
    });
    
    if (existingSubmission) {
      return res.status(400).json({ error: '该网站已在审核队列中' });
    }
    
    // 获取提交者IP
    const submitterIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
    
    const submission = await prisma.websiteSubmission.create({
      data: {
        name,
        description: description || '',
        url,
        iconUrl,
        categoryId,
        tags,
        submitterName,
        submitterEmail,
        submitterIp: typeof submitterIp === 'string' ? submitterIp : submitterIp[0],
        status: 'pending',
      },
    });
    
    res.json({ success: true, message: '提交成功，等待审核', id: submission.id });
  } catch (error) {
    console.error('提交网站失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// 查询提交状态（前端用户）
router.get('/status/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const submission = await prisma.websiteSubmission.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        url: true,
        status: true,
        rejectReason: true,
        createdAt: true,
        reviewedAt: true,
      }
    });
    
    if (!submission) {
      return res.status(404).json({ error: '未找到提交记录' });
    }
    
    res.json(submission);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== 后台管理接口 ====================

// 获取所有提交（后台管理）
router.get('/', async (req, res) => {
  try {
    const { status, page = 1, pageSize = 20 } = req.query;
    
    const where = {};
    if (status) where.status = status;
    
    const [items, total] = await Promise.all([
      prisma.websiteSubmission.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (parseInt(page) - 1) * parseInt(pageSize),
        take: parseInt(pageSize),
      }),
      prisma.websiteSubmission.count({ where }),
    ]);
    
    res.json({ items, total, page: parseInt(page), pageSize: parseInt(pageSize) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 获取待审核数量
router.get('/pending-count', async (req, res) => {
  try {
    const count = await prisma.websiteSubmission.count({
      where: { status: 'pending' }
    });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 审核通过
router.post('/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const { categoryId } = req.body;
    
    const submission = await prisma.websiteSubmission.findUnique({ where: { id } });
    if (!submission) {
      return res.status(404).json({ error: '未找到提交记录' });
    }
    
    if (submission.status !== 'pending') {
      return res.status(400).json({ error: '该提交已被处理' });
    }
    
    const finalCategoryId = categoryId || submission.categoryId;
    if (!finalCategoryId) {
      return res.status(400).json({ error: '请选择分类' });
    }
    
    // 创建网站
    await prisma.website.create({
      data: {
        name: submission.name,
        description: submission.description,
        url: submission.url,
        iconUrl: submission.iconUrl,
        categoryId: finalCategoryId,
        tags: submission.tags || '',
        isNew: true,
      },
    });
    
    // 更新提交状态
    await prisma.websiteSubmission.update({
      where: { id },
      data: {
        status: 'approved',
        reviewedAt: new Date(),
      },
    });
    
    res.json({ success: true, message: '审核通过，网站已添加' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 审核拒绝
router.post('/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    const submission = await prisma.websiteSubmission.findUnique({ where: { id } });
    if (!submission) {
      return res.status(404).json({ error: '未找到提交记录' });
    }
    
    if (submission.status !== 'pending') {
      return res.status(400).json({ error: '该提交已被处理' });
    }
    
    await prisma.websiteSubmission.update({
      where: { id },
      data: {
        status: 'rejected',
        rejectReason: reason || '不符合收录标准',
        reviewedAt: new Date(),
      },
    });
    
    res.json({ success: true, message: '已拒绝' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 删除提交记录
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.websiteSubmission.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 更新提交记录（编辑）
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, url, iconUrl, categoryId, tags } = req.body;
    
    const submission = await prisma.websiteSubmission.update({
      where: { id },
      data: {
        name,
        description,
        url,
        iconUrl,
        categoryId,
        tags,
      },
    });
    
    res.json(submission);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
