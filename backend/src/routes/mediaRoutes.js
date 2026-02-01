/**
 * @file routes/mediaRoutes.js
 * @description 媒体库管理路由 - Pro 功能
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';
import { requireFeature } from '../middleware/featureGuard.js';
import ApiError from '../utils/ApiError.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();
const prisma = new PrismaClient();

// 上传目录
const uploadDir = path.join(__dirname, '../../uploads/media');

// 确保上传目录存在
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

/**
 * 解码文件名（处理中文乱码）
 * @param {string} filename - 原始文件名
 * @returns {string} 解码后的文件名
 */
const decodeFilename = (filename) => {
  if (!filename) return filename;
  
  try {
    // 方法1: 尝试从 latin1 解码为 utf8
    const decoded = Buffer.from(filename, 'latin1').toString('utf8');
    // 检查解码后是否包含有效的中文字符
    if (/[\u4e00-\u9fa5]/.test(decoded)) {
      return decoded;
    }
  } catch (e) {
    // 忽略错误
  }
  
  try {
    // 方法2: 尝试 URL 解码
    const urlDecoded = decodeURIComponent(filename);
    if (urlDecoded !== filename) {
      return urlDecoded;
    }
  } catch (e) {
    // 忽略错误
  }
  
  try {
    // 方法3: 尝试 escape/unescape
    const unescaped = unescape(filename);
    if (unescaped !== filename) {
      return unescaped;
    }
  } catch (e) {
    // 忽略错误
  }
  
  return filename;
};

// 配置 multer 存储
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folder = req.body.folder || 'default';
    const folderPath = path.join(uploadDir, folder);
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }
    cb(null, folderPath);
  },
  filename: (req, file, cb) => {
    // 先解码原始文件名
    file.originalname = decodeFilename(file.originalname);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `media-${uniqueSuffix}${ext}`);
  }
});

// 文件过滤器
const fileFilter = (req, file, cb) => {
  // 解码文件名（处理中文乱码）
  file.originalname = decodeFilename(file.originalname);
  
  // 允许的文件类型
  const allowedTypes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/bmp', 'image/ico', 'image/x-icon',
    'video/mp4', 'video/webm', 'video/ogg',
    'application/pdf',
    'application/zip', 'application/x-zip-compressed'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`不支持的文件类型: ${file.mimetype}`), false);
  }
};

// 默认文件大小限制 10MB
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }
});

// 异步处理包装器
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * 获取媒体列表
 * GET /api/media
 */
router.get('/', asyncHandler(async (req, res) => {
  const { 
    page = 1, 
    pageSize = 20, 
    folder, 
    mimeType,
    search,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;
  
  const skip = (parseInt(page) - 1) * parseInt(pageSize);
  const take = parseInt(pageSize);
  
  // 构建查询条件
  const where = {};
  if (folder) where.folder = folder;
  if (mimeType) where.mimeType = { startsWith: mimeType };
  if (search) {
    where.OR = [
      { originalName: { contains: search } },
      { alt: { contains: search } }
    ];
  }
  
  // 查询数据
  const [items, total] = await Promise.all([
    prisma.media.findMany({
      where,
      skip,
      take,
      orderBy: { [sortBy]: sortOrder }
    }),
    prisma.media.count({ where })
  ]);
  
  res.json({
    success: true,
    data: items,
    pagination: {
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      total,
      totalPages: Math.ceil(total / take)
    }
  });
}));

/**
 * 获取单个媒体详情
 * GET /api/media/:id
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const media = await prisma.media.findUnique({
    where: { id }
  });
  
  if (!media) {
    throw ApiError.notFound('媒体文件不存在');
  }
  
  res.json({ success: true, data: media });
}));

/**
 * 上传媒体文件
 * POST /api/media/upload
 */
router.post('/upload', upload.single('file'), asyncHandler(async (req, res) => {
  if (!req.file) {
    throw ApiError.validationError('请选择要上传的文件');
  }
  
  const { folder = 'default', alt } = req.body;
  const file = req.file;
  
  // 获取图片尺寸（如果是图片）
  let width = null;
  let height = null;
  
  if (file.mimetype.startsWith('image/')) {
    try {
      // 简单方式：不依赖额外库，前端可以传递尺寸
      // 或者后续可以添加 sharp 库来获取
    } catch (e) {
      console.warn('获取图片尺寸失败:', e);
    }
  }
  
  // 构建访问 URL
  const relativePath = `/uploads/media/${folder}/${file.filename}`;
  
  // 保存到数据库
  const media = await prisma.media.create({
    data: {
      filename: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      url: relativePath,
      width,
      height,
      alt: alt || null,
      folder,
      uploadedBy: req.admin?.username || 'admin'
    }
  });
  
  res.json({
    success: true,
    data: media,
    message: '上传成功'
  });
}));

/**
 * 批量上传媒体文件
 * POST /api/media/upload-multiple
 */
router.post('/upload-multiple', upload.array('files', 10), asyncHandler(async (req, res) => {
  if (!req.files || req.files.length === 0) {
    throw ApiError.validationError('请选择要上传的文件');
  }
  
  const { folder = 'default' } = req.body;
  const results = [];
  
  for (const file of req.files) {
    const relativePath = `/uploads/media/${folder}/${file.filename}`;
    
    const media = await prisma.media.create({
      data: {
        filename: file.filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        url: relativePath,
        folder,
        uploadedBy: req.admin?.username || 'admin'
      }
    });
    
    results.push(media);
  }
  
  res.json({
    success: true,
    data: results,
    message: `成功上传 ${results.length} 个文件`
  });
}));

/**
 * 更新媒体信息
 * PUT /api/media/:id
 */
router.put('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { alt, folder } = req.body;
  
  const existing = await prisma.media.findUnique({
    where: { id }
  });
  
  if (!existing) {
    throw ApiError.notFound('媒体文件不存在');
  }
  
  // 如果更改了文件夹，需要移动文件
  if (folder && folder !== existing.folder) {
    const oldPath = path.join(__dirname, '../../', existing.url);
    const newFolderPath = path.join(uploadDir, folder);
    const newPath = path.join(newFolderPath, existing.filename);
    
    if (!fs.existsSync(newFolderPath)) {
      fs.mkdirSync(newFolderPath, { recursive: true });
    }
    
    if (fs.existsSync(oldPath)) {
      fs.renameSync(oldPath, newPath);
    }
  }
  
  const media = await prisma.media.update({
    where: { id },
    data: {
      alt: alt !== undefined ? alt : existing.alt,
      folder: folder || existing.folder,
      url: folder ? `/uploads/media/${folder}/${existing.filename}` : existing.url
    }
  });
  
  res.json({ success: true, data: media });
}));

/**
 * 删除媒体文件
 * DELETE /api/media/:id
 */
router.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const media = await prisma.media.findUnique({
    where: { id }
  });
  
  if (!media) {
    throw ApiError.notFound('媒体文件不存在');
  }
  
  // 删除物理文件
  const filePath = path.join(__dirname, '../../', media.url);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
  
  // 删除数据库记录
  await prisma.media.delete({
    where: { id }
  });
  
  res.json({ success: true, message: '删除成功' });
}));

/**
 * 批量删除媒体文件
 * POST /api/media/batch-delete
 */
router.post('/batch-delete', asyncHandler(async (req, res) => {
  const { ids } = req.body;
  
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    throw ApiError.validationError('请选择要删除的文件');
  }
  
  // 获取要删除的媒体信息
  const mediaList = await prisma.media.findMany({
    where: { id: { in: ids } }
  });
  
  // 删除物理文件
  for (const media of mediaList) {
    const filePath = path.join(__dirname, '../../', media.url);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
  
  // 批量删除数据库记录
  await prisma.media.deleteMany({
    where: { id: { in: ids } }
  });
  
  res.json({ 
    success: true, 
    message: `成功删除 ${mediaList.length} 个文件` 
  });
}));

/**
 * 获取文件夹列表
 * GET /api/media/folders
 */
router.get('/folders/list', asyncHandler(async (req, res) => {
  const folders = await prisma.media.groupBy({
    by: ['folder'],
    _count: { id: true }
  });
  
  res.json({
    success: true,
    data: folders.map(f => ({
      name: f.folder,
      count: f._count.id
    }))
  });
}));

/**
 * 获取媒体库统计
 * GET /api/media/stats
 */
router.get('/stats/overview', asyncHandler(async (req, res) => {
  const [total, totalSize, byType] = await Promise.all([
    prisma.media.count(),
    prisma.media.aggregate({ _sum: { size: true } }),
    prisma.media.groupBy({
      by: ['mimeType'],
      _count: { id: true }
    })
  ]);
  
  res.json({
    success: true,
    data: {
      totalFiles: total,
      totalSize: totalSize._sum.size || 0,
      byType: byType.map(t => ({
        type: t.mimeType,
        count: t._count.id
      }))
    }
  });
}));

export default router;
