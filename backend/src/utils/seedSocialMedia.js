/**
 * @file seedSocialMedia.js
 * @description 后端API服务
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedSocialMedia() {
  console.log('🌱 开始初始化社交媒体数据...');

  try {
    // 清空现有数据
    await prisma.socialMedia.deleteMany({});

    // 创建默认社交媒体配置
    const socialMediaData = [
      {
        name: '交流群',
        type: 'wechat_group',
        qrCodeUrl: 'https://img.uied.cn/wp-content/footer/tomda-qr-code.jpg',
        description: '交流群',
        order: 1,
        visible: true,
      },
      {
        name: '公众号',
        type: 'wechat_official',
        qrCodeUrl: 'https://uied-1304770347.cos.ap-guangzhou.myqcloud.com/wp-content/uploads/2022/07/qrcode.webp',
        description: '公众号',
        order: 2,
        visible: true,
      },
    ];

    for (const data of socialMediaData) {
      await prisma.socialMedia.create({ data });
    }

    console.log('✅ 社交媒体数据初始化完成');
    console.log(`   - 创建了 ${socialMediaData.length} 个社交媒体配置`);
  } catch (error) {
    console.error('❌ 社交媒体数据初始化失败:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 如果直接运行此文件
const isMainModule = process.argv[1] && import.meta.url.endsWith(process.argv[1]);

if (isMainModule) {
  seedSocialMedia()
    .then(() => {
      console.log('🎉 数据初始化成功');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 数据初始化失败:', error);
      process.exit(1);
    });
}

export default seedSocialMedia;
