/**
 * @file userRoutes.js
 * @description 后端API服务
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

import express from 'express';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { asyncHandler } from '../middleware/errorHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { logService, LogAction, LogModule } from '../services/logService.js';

const router = express.Router();
const prisma = new PrismaClient();

// 密码加密
const hashPassword = (password) => {
  const salt = process.env.PASSWORD_SALT || 'uied-nav-salt';
  return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
};

// 角色权限定义
const ROLES = {
  super_admin: { level: 100, name: '超级管理员', canManageUsers: true, canManageAll: true },
  admin: { level: 50, name: '管理员', canManageUsers: false, canManageAll: true },
  editor: { level: 10, name: '编辑', canManageUsers: false, canManageAll: false },
};

// 检查是否有管理用户的权限
const checkUserManagePermission = (req, res, next) => {
  const currentRole = req.admin?.role || 'editor';
  const roleConfig = ROLES[currentRole];
  
  if (!roleConfig || !roleConfig.canManageUsers) {
    return next(ApiError.forbidden('没有用户管理权限'));
  }
  next();
};

// 获取用户列表
router.get('/', asyncHandler(async (req, res) => {
  const { page = 1, pageSize = 20, search, role, status } = req.query;
  
  const where = {};
  
  if (search) {
    where.OR = [
      { username: { contains: search } },
      { email: { contains: search } },
      { nickname: { contains: search } },
    ];
  }
  
  if (role) {
    where.role = role;
  }
  
  if (status) {
    where.status = status;
  }
  
  const [users, total] = await Promise.all([
    prisma.admin.findMany({
      where,
      select: {
        id: true,
        username: true,
        email: true,
        nickname: true,
        avatar: true,
        role: true,
        status: true,
        lastLoginAt: true,
        lastLoginIp: true,
        createdAt: true,
        updatedAt: true,
        // 不返回密码
      },
      orderBy: { createdAt: 'desc' },
      skip: (parseInt(page) - 1) * parseInt(pageSize),
      take: parseInt(pageSize),
    }),
    prisma.admin.count({ where }),
  ]);
  
  // 添加角色名称
  const usersWithRoleName = users.map(user => ({
    ...user,
    roleName: ROLES[user.role]?.name || user.role,
  }));
  
  res.json({
    data: usersWithRoleName,
    pagination: {
      total,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      totalPages: Math.ceil(total / parseInt(pageSize)),
    },
  });
}));

// 获取单个用户
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const user = await prisma.admin.findUnique({
    where: { id },
    select: {
      id: true,
      username: true,
      email: true,
      nickname: true,
      avatar: true,
      role: true,
      status: true,
      lastLoginAt: true,
      lastLoginIp: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  
  if (!user) {
    throw ApiError.notFound('用户不存在');
  }
  
  res.json({
    ...user,
    roleName: ROLES[user.role]?.name || user.role,
  });
}));

// 创建用户（仅超级管理员）
router.post('/', checkUserManagePermission, asyncHandler(async (req, res) => {
  const { username, password, email, nickname, role = 'editor', status = 'active' } = req.body;
  
  if (!username || !password) {
    throw ApiError.validationError('用户名和密码不能为空');
  }
  
  if (password.length < 6) {
    throw ApiError.validationError('密码长度至少6位');
  }
  
  // 检查用户名是否已存在
  const existingUser = await prisma.admin.findUnique({
    where: { username },
  });
  
  if (existingUser) {
    throw ApiError.conflict('用户名已存在');
  }
  
  // 检查邮箱是否已存在
  if (email) {
    const existingEmail = await prisma.admin.findUnique({
      where: { email },
    });
    if (existingEmail) {
      throw ApiError.conflict('邮箱已被使用');
    }
  }
  
  const user = await prisma.admin.create({
    data: {
      username,
      password: hashPassword(password),
      email: email || null,
      nickname: nickname || username,
      role,
      status,
    },
    select: {
      id: true,
      username: true,
      email: true,
      nickname: true,
      role: true,
      status: true,
      createdAt: true,
    },
  });
  
  // 记录日志
  await logService.log({
    adminId: req.admin.adminId,
    adminName: req.admin.username,
    action: LogAction.CREATE,
    module: LogModule.USER,
    targetId: user.id,
    targetName: user.username,
    detail: { username, email, role },
    req,
  });
  
  res.status(201).json(user);
}));

// 更新用户
router.put('/:id', checkUserManagePermission, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { email, nickname, role, status, avatar } = req.body;
  
  const existingUser = await prisma.admin.findUnique({
    where: { id },
  });
  
  if (!existingUser) {
    throw ApiError.notFound('用户不存在');
  }
  
  // 不能修改超级管理员的角色（保护措施）
  if (existingUser.role === 'super_admin' && role && role !== 'super_admin') {
    throw ApiError.forbidden('不能修改超级管理员的角色');
  }
  
  // 检查邮箱是否被其他用户使用
  if (email && email !== existingUser.email) {
    const existingEmail = await prisma.admin.findUnique({
      where: { email },
    });
    if (existingEmail) {
      throw ApiError.conflict('邮箱已被使用');
    }
  }
  
  const updateData = {};
  if (email !== undefined) updateData.email = email || null;
  if (nickname !== undefined) updateData.nickname = nickname;
  if (role !== undefined) updateData.role = role;
  if (status !== undefined) updateData.status = status;
  if (avatar !== undefined) updateData.avatar = avatar;
  
  const user = await prisma.admin.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      username: true,
      email: true,
      nickname: true,
      avatar: true,
      role: true,
      status: true,
      updatedAt: true,
    },
  });
  
  // 记录日志
  await logService.log({
    adminId: req.admin.adminId,
    adminName: req.admin.username,
    action: LogAction.UPDATE,
    module: LogModule.USER,
    targetId: user.id,
    targetName: user.username,
    detail: updateData,
    req,
  });
  
  res.json(user);
}));

// 重置用户密码（仅超级管理员）
router.put('/:id/password', checkUserManagePermission, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { newPassword } = req.body;
  
  if (!newPassword || newPassword.length < 6) {
    throw ApiError.validationError('新密码长度至少6位');
  }
  
  const existingUser = await prisma.admin.findUnique({
    where: { id },
  });
  
  if (!existingUser) {
    throw ApiError.notFound('用户不存在');
  }
  
  await prisma.admin.update({
    where: { id },
    data: { password: hashPassword(newPassword) },
  });
  
  // 记录日志
  await logService.log({
    adminId: req.admin.adminId,
    adminName: req.admin.username,
    action: LogAction.UPDATE,
    module: LogModule.USER,
    targetId: id,
    targetName: existingUser.username,
    detail: { action: '重置密码' },
    req,
  });
  
  res.json({ message: '密码重置成功' });
}));

// 删除用户（仅超级管理员）
router.delete('/:id', checkUserManagePermission, asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const existingUser = await prisma.admin.findUnique({
    where: { id },
  });
  
  if (!existingUser) {
    throw ApiError.notFound('用户不存在');
  }
  
  // 不能删除超级管理员
  if (existingUser.role === 'super_admin') {
    throw ApiError.forbidden('不能删除超级管理员');
  }
  
  // 不能删除自己
  if (existingUser.id === req.admin.adminId) {
    throw ApiError.forbidden('不能删除自己的账号');
  }
  
  await prisma.admin.delete({
    where: { id },
  });
  
  // 记录日志
  await logService.log({
    adminId: req.admin.adminId,
    adminName: req.admin.username,
    action: LogAction.DELETE,
    module: LogModule.USER,
    targetId: id,
    targetName: existingUser.username,
    req,
  });
  
  res.json({ message: '用户已删除' });
}));

// 获取角色列表
router.get('/roles/list', asyncHandler(async (req, res) => {
  const roles = Object.entries(ROLES).map(([key, value]) => ({
    value: key,
    label: value.name,
    level: value.level,
  }));
  
  res.json(roles);
}));

// 获取当前用户信息
router.get('/profile/me', asyncHandler(async (req, res) => {
  const user = await prisma.admin.findUnique({
    where: { id: req.admin.adminId },
    select: {
      id: true,
      username: true,
      email: true,
      nickname: true,
      avatar: true,
      role: true,
      status: true,
      lastLoginAt: true,
      createdAt: true,
    },
  });
  
  if (!user) {
    throw ApiError.notFound('用户不存在');
  }
  
  res.json({
    ...user,
    roleName: ROLES[user.role]?.name || user.role,
    permissions: ROLES[user.role] || {},
  });
}));

// 更新当前用户资料
router.put('/profile/me', asyncHandler(async (req, res) => {
  const { email, nickname, avatar } = req.body;
  
  const updateData = {};
  if (email !== undefined) updateData.email = email || null;
  if (nickname !== undefined) updateData.nickname = nickname;
  if (avatar !== undefined) updateData.avatar = avatar;
  
  // 检查邮箱是否被其他用户使用
  if (email) {
    const existingEmail = await prisma.admin.findFirst({
      where: {
        email,
        NOT: { id: req.admin.adminId },
      },
    });
    if (existingEmail) {
      throw ApiError.conflict('邮箱已被使用');
    }
  }
  
  const user = await prisma.admin.update({
    where: { id: req.admin.adminId },
    data: updateData,
    select: {
      id: true,
      username: true,
      email: true,
      nickname: true,
      avatar: true,
      role: true,
      updatedAt: true,
    },
  });
  
  res.json(user);
}));

export default router;
