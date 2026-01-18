/**
 * @file seedAdmin.js
 * @description 后端API服务
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

// 使用 PBKDF2 加密（与 authRoutes.js 保持一致）
const hashPassword = (password) => {
  const salt = process.env.PASSWORD_SALT || 'uied-nav-salt';
  return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
};

async function main() {
  console.log('🔐 创建默认管理员账号...');

  // 检查是否已存在管理员
  const existingAdmin = await prisma.admin.findFirst();
  if (existingAdmin) {
    console.log('⚠️  管理员账号已存在，跳过创建');
    return;
  }

  // 创建默认管理员
  const admin = await prisma.admin.create({
    data: {
      username: 'UIED',
      password: hashPassword('UIED123456'), // 默认密码
      email: 'admin@uied.cn',
      nickname: 'UIED 管理员',
      role: 'super_admin',
      status: 'active',
    },
  });

  console.log('✅ 默认管理员创建成功！');
  console.log('   用户名: UIED');
  console.log('   密码: UIED123456');
  console.log('   ⚠️  请登录后立即修改密码！');
}

main()
  .catch((e) => {
    console.error('❌ 创建管理员失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
