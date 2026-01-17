/**
 * @file authRoutes.js
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
import jwt from 'jsonwebtoken';
import { asyncHandler } from '../middleware/errorHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { logService, LogAction, LogModule } from '../services/logService.js';

const router = express.Router();
const prisma = new PrismaClient();

// JWT 密钥 - 生产环境必须设置环境变量
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// ========== 登录失败锁定机制 ==========
// 存储登录失败记录 { ip: { count: number, lockedUntil: Date } }
const loginAttempts = new Map();
const MAX_LOGIN_ATTEMPTS = 5; // 最多尝试5次
const LOCK_TIME = 30 * 60 * 1000; // 锁定30分钟
const ATTEMPT_WINDOW = 15 * 60 * 1000; // 15分钟内的尝试计数

// 检查IP是否被锁定
const isIPLocked = (ip) => {
  const record = loginAttempts.get(ip);
  if (!record) return false;
  
  if (record.lockedUntil && record.lockedUntil > Date.now()) {
    return true;
  }
  
  // 锁定已过期，清除记录
  if (record.lockedUntil && record.lockedUntil <= Date.now()) {
    loginAttempts.delete(ip);
    return false;
  }
  
  return false;
};

// 获取剩余锁定时间（分钟）
const getRemainingLockTime = (ip) => {
  const record = loginAttempts.get(ip);
  if (!record || !record.lockedUntil) return 0;
  const remaining = Math.ceil((record.lockedUntil - Date.now()) / 60000);
  return remaining > 0 ? remaining : 0;
};

// 记录登录失败
const recordFailedAttempt = (ip) => {
  const now = Date.now();
  let record = loginAttempts.get(ip);
  
  if (!record || (record.firstAttempt && now - record.firstAttempt > ATTEMPT_WINDOW)) {
    // 新记录或窗口已过期
    record = { count: 1, firstAttempt: now };
  } else {
    record.count++;
  }
  
  // 达到最大尝试次数，锁定IP
  if (record.count >= MAX_LOGIN_ATTEMPTS) {
    record.lockedUntil = now + LOCK_TIME;
    console.log(`[安全] IP ${ip} 登录失败${record.count}次，已锁定30分钟`);
  }
  
  loginAttempts.set(ip, record);
  return record.count;
};

// 清除登录失败记录（登录成功时调用）
const clearFailedAttempts = (ip) => {
  loginAttempts.delete(ip);
};

// 定期清理过期记录（每小时）
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of loginAttempts.entries()) {
    if (record.lockedUntil && record.lockedUntil <= now) {
      loginAttempts.delete(ip);
    } else if (record.firstAttempt && now - record.firstAttempt > ATTEMPT_WINDOW) {
      loginAttempts.delete(ip);
    }
  }
}, 60 * 60 * 1000);

// 密码加密 - 使用 PBKDF2（比 SHA256 更安全）
const hashPassword = (password) => {
  const salt = process.env.PASSWORD_SALT || 'uied-nav-salt';
  return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
};

// 兼容旧的 SHA256 密码（用于迁移）
const hashPasswordLegacy = (password) => {
  return crypto.createHash('sha256').update(password).digest('hex');
};

// 生成 JWT token
const generateToken = (adminId, username, role = 'admin') => {
  return jwt.sign(
    { adminId, username, role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

// 验证 JWT token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

// 登录
router.post('/login', asyncHandler(async (req, res) => {
  const { username, password } = req.body;
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';

  // 检查IP是否被锁定
  if (isIPLocked(ip)) {
    const remainingTime = getRemainingLockTime(ip);
    // 记录被锁定的登录尝试
    await logService.log({
      adminName: username || 'unknown',
      action: LogAction.LOGIN,
      module: LogModule.AUTH,
      detail: { reason: 'IP被锁定', ip, remainingMinutes: remainingTime },
      req,
      status: 'failed',
      errorMsg: `IP被锁定，剩余${remainingTime}分钟`,
    });
    throw ApiError.forbidden(`登录尝试过多，请${remainingTime}分钟后再试`);
  }

  if (!username || !password) {
    throw ApiError.validationError('用户名和密码不能为空');
  }

  const admin = await prisma.admin.findUnique({
    where: { username },
  });

  if (!admin) {
    // 记录失败尝试（用户不存在也计入，防止用户名枚举）
    const attempts = recordFailedAttempt(ip);
    await logService.log({
      adminName: username,
      action: LogAction.LOGIN,
      module: LogModule.AUTH,
      detail: { reason: '用户不存在', ip, attempts },
      req,
      status: 'failed',
      errorMsg: '用户名或密码错误',
    });
    throw ApiError.unauthorized('用户名或密码错误');
  }

  // 尝试新密码格式
  let passwordMatch = admin.password === hashPassword(password);
  
  // 兼容旧的 SHA256 密码格式
  if (!passwordMatch) {
    passwordMatch = admin.password === hashPasswordLegacy(password);
    // 如果旧密码匹配，自动升级到新格式
    if (passwordMatch) {
      await prisma.admin.update({
        where: { id: admin.id },
        data: { password: hashPassword(password) }
      });
    }
  }

  if (!passwordMatch) {
    // 记录登录失败
    const attempts = recordFailedAttempt(ip);
    const remainingAttempts = MAX_LOGIN_ATTEMPTS - attempts;
    
    await logService.log({
      adminName: username,
      action: LogAction.LOGIN,
      module: LogModule.AUTH,
      detail: { reason: '密码错误', ip, attempts, remainingAttempts },
      req,
      status: 'failed',
      errorMsg: '密码错误',
    });
    
    // 提示剩余尝试次数
    if (remainingAttempts > 0) {
      throw ApiError.unauthorized(`用户名或密码错误，还剩${remainingAttempts}次尝试机会`);
    } else {
      throw ApiError.forbidden('登录尝试过多，账号已被锁定30分钟');
    }
  }

  // 检查账号状态
  if (admin.status === 'disabled') {
    throw ApiError.forbidden('账号已被禁用，请联系管理员');
  }

  // 登录成功，清除失败记录
  clearFailedAttempts(ip);

  // 生成 JWT token（包含角色信息）
  const token = generateToken(admin.id, admin.username, admin.role);

  // 更新最后登录信息
  await prisma.admin.update({
    where: { id: admin.id },
    data: {
      lastLoginAt: new Date(),
      lastLoginIp: ip,
    },
  });

  // 记录登录成功日志（包含更多信息便于安全审计）
  await logService.log({
    adminId: admin.id,
    adminName: admin.username,
    action: LogAction.LOGIN,
    module: LogModule.AUTH,
    detail: { 
      loginTime: new Date().toISOString(), 
      ip,
      userAgent: req.headers['user-agent'] || 'unknown',
      // 记录上次登录信息
      lastLoginAt: admin.lastLoginAt?.toISOString() || '首次登录',
      lastLoginIp: admin.lastLoginIp || '无记录',
    },
    req,
  });

  res.json({
    token,
    user: {
      id: admin.id,
      username: admin.username,
      email: admin.email,
      nickname: admin.nickname,
      avatar: admin.avatar,
      role: admin.role,
    },
  });
}));

// 验证 token
router.get('/verify', asyncHandler(async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    throw ApiError.unauthorized('未登录或登录已过期');
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    throw ApiError.unauthorized('登录已过期，请重新登录');
  }

  res.json({
    user: {
      id: decoded.adminId,
      username: decoded.username,
    },
  });
}));

// 登出
router.post('/logout', asyncHandler(async (req, res) => {
  // JWT 是无状态的，客户端删除 token 即可
  // 记录登出日志
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token) {
    const decoded = verifyToken(token);
    if (decoded) {
      await logService.log({
        adminId: decoded.adminId,
        adminName: decoded.username,
        action: LogAction.LOGOUT,
        module: LogModule.AUTH,
        req,
      });
    }
  }
  res.json({ message: '已退出登录' });
}));

// 修改密码
router.put('/password', asyncHandler(async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    throw ApiError.unauthorized('未登录');
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    throw ApiError.unauthorized('登录已过期');
  }

  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    throw ApiError.validationError('请输入原密码和新密码');
  }

  if (newPassword.length < 6) {
    throw ApiError.validationError('新密码长度至少6位');
  }

  const admin = await prisma.admin.findUnique({
    where: { id: decoded.adminId },
  });

  // 验证原密码（兼容新旧格式）
  const oldPasswordMatch = admin.password === hashPassword(oldPassword) || 
                          admin.password === hashPasswordLegacy(oldPassword);

  if (!oldPasswordMatch) {
    throw ApiError.validationError('原密码错误');
  }

  await prisma.admin.update({
    where: { id: decoded.adminId },
    data: { password: hashPassword(newPassword) },
  });

  res.json({ message: '密码修改成功' });
}));

// 验证中间件（供其他路由使用）
export const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return next(ApiError.unauthorized('未登录，请先登录'));
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return next(ApiError.unauthorized('登录已过期，请重新登录'));
  }

  req.admin = decoded;
  next();
};

export default router;
