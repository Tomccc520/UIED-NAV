/**
 * @file setup.js
 * @description 后端API服务
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

/**
 * Vitest Setup File
 * Ensures tests use a separate test database
 * 
 * CRITICAL: This file runs BEFORE any test imports
 * It sets the DATABASE_URL to use test.db instead of dev.db
 */

// 强制设置测试数据库 URL - 必须在任何 Prisma 导入之前
process.env.DATABASE_URL = 'file:./test.db';
process.env.NODE_ENV = 'test';

console.log('🧪 Test environment initialized');
console.log('📁 Database URL:', process.env.DATABASE_URL);
console.log('⚠️  Using ISOLATED test database (test.db), NOT production database (dev.db)');
