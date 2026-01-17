/**
 * @file seedFaviconApis.js
 * @description 后端API服务
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const defaultApis = [
  {
    name: 'Cravatar Favicon',
    urlTemplate: 'https://cn.cravatar.com/favicon/api/index.php?url={domain}',
    description: 'Cravatar Favicon服务，国内访问速度快',
    order: 0,
    enabled: true,
  },
  {
    name: 'Favicon.im',
    urlTemplate: 'https://favicon.im/{domain}',
    description: 'Favicon.im服务，简单快速',
    order: 1,
    enabled: true,
  },
];

async function seedFaviconApis() {
  console.log('开始初始化 Favicon API 配置...');
  
  for (const api of defaultApis) {
    const existing = await prisma.faviconApi.findFirst({
      where: { name: api.name },
    });
    
    if (!existing) {
      await prisma.faviconApi.create({ data: api });
      console.log(`✓ 创建: ${api.name}`);
    } else {
      console.log(`- 跳过: ${api.name} (已存在)`);
    }
  }
  
  console.log('Favicon API 配置初始化完成！');
}

seedFaviconApis()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
