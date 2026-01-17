/**
 * @file resetAdminPassword.js
 * @description 后端API服务
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

/**
 * 重置管理员密码 - 使用与后端相同的加密方式
 */
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

// 与 authRoutes.js 相同的加密方式
const hashPassword = (password) => {
  const salt = process.env.PASSWORD_SALT || 'uied-nav-salt';
  return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
};

async function resetAdmin() {
  const hashedPassword = hashPassword('admin123');
  await prisma.admin.updateMany({
    where: { username: 'admin' },
    data: { 
      password: hashedPassword,
      status: 'active'
    }
  });
  console.log('✅ 管理员密码已重置为: admin123');
  await prisma.$disconnect();
}

resetAdmin();
