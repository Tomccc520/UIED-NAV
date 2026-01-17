/**
 * @file seedSettings.js
 * @description 后端API服务
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 导航菜单数据
const navMenusData = [
  {
    text: '首页',
    link: null,
    external: false,
    order: 1,
    visible: true,
    children: [
      { text: '设计文章', link: 'https://www.uied.cn/', external: true, order: 1 },
      { text: '学习文章', link: 'https://www.uied.cn/category/wenzhang', external: true, order: 2 },
      { text: '设计素材', link: 'https://www.uied.cn/sucai', external: true, order: 3 },
      { text: '设计资讯', link: 'https://hot.uied.cn/', external: true, order: 4 },
      { text: '设计交流', link: 'https://www.uied.cn/wechat', external: true, order: 5 }
    ]
  },
  { text: '快讯', link: 'https://uiedtool.com/tools/ai-news', external: true, order: 2, visible: true },
  { text: '摸鱼', link: 'https://www.uied.cn/circle', external: true, label: '偷学', labelType: 'info', order: 3, visible: true },
  { text: '榜单', link: 'https://hot.uied.cn/', external: true, order: 4, visible: true },
  {
    text: 'AIGC',
    link: 'https://www.uied.cn/aigc',
    external: true,
    label: 'New',
    labelType: 'shop',
    order: 5,
    visible: true,
    children: [
      { text: 'AI文章', link: 'https://www.uied.cn/category/aigc/ai', external: true, order: 1 },
      { text: 'AI资讯', link: 'https://hot.uied.cn/ai-realtime', external: true, order: 2 },
      { text: 'AI工具', link: 'https://hao.uied.cn/ai', external: true, order: 3 },
      { text: 'AI交流', link: 'https://www.uied.cn/wechat', external: true, order: 4 },
      { text: 'AI知识库', link: 'https://dfz3y4k04g.feishu.cn/wiki/ZjddwTFpWivK6ukwBoDc5DoHnVt', external: true, order: 5 }
    ]
  },
  { text: '投稿', link: 'https://www.uied.cn/tougao', external: true, order: 6, visible: true },
  { text: '技术团队', link: 'https://fsuied.com/', external: true, order: 7, visible: true },
  { text: 'GPT5', link: 'https://www.wenxiaobai.com/?forceLogin=true&source=uied&ad_source=uied', external: true, label: '可生图', labelType: 'info', order: 8, visible: true },
  { text: '在线工具', link: 'https://uiedtool.com/', external: true, label: '免费', labelType: 'shop', order: 9, visible: true }
];

// 页脚分组数据
const footerGroupsData = [
  {
    title: '支持与服务',
    order: 1,
    links: [
      { text: '开通VIP', url: '/vips', external: false, order: 1 },
      { text: '网站协议', url: '/protocol', external: false, order: 2 },
      { text: '法律声明', url: '/legal', external: false, order: 3 },
      { text: '网站地图', url: 'https://www.uied.cn/sitemap.xml', external: true, order: 4 }
    ]
  },
  {
    title: '关注我们',
    order: 2,
    links: [
      { text: '花瓣画板', url: 'https://huaban.com/user/uied', external: true, order: 1 },
      { text: '知乎主页', url: 'https://www.zhihu.com/org/uiedyong-hu-ti-yan-jiao-liu-xue-xi', external: true, order: 2 },
      { text: '设计导航', url: 'https://www.88sheji.cn/', external: true, order: 3 },
      { text: '商务合作', url: 'http://hezuo.tomda.top/', external: true, order: 4 }
    ]
  },
  {
    title: '设计文章',
    order: 3,
    links: [
      { text: 'UI文章', url: 'https://www.uied.cn/category/wenzhang/ui-wenzhang', external: true, order: 1 },
      { text: 'AIGC文章', url: 'https://www.uied.cn/category/wenzhang/ai', external: true, order: 2 },
      { text: '设计干货', url: 'https://www.uied.cn/category/wenzhang/ganhuo', external: true, order: 3 },
      { text: '效率工具', url: 'https://www.uied.cn/category/wenzhang/tool', external: true, order: 4 }
    ]
  },
  {
    title: '设计素材',
    order: 4,
    links: [
      { text: '设计组件', url: 'https://www.uied.cn/category/ui/zujian', external: true, order: 1 },
      { text: '设计样机', url: 'https://www.uied.cn/category/mockup', external: true, order: 2 },
      { text: '三维素材', url: 'https://www.uied.cn/category/3d', external: true, order: 3 }
    ]
  }
];

// 友情链接数据
const friendLinksData = [
  { name: 'UI/UX设计导航', url: '/uiux', order: 1 },
  { name: '平面设计导航', url: '/plane', order: 2 },
  { name: 'AI设计工具导航', url: '/ai', order: 3 },
  { name: '3D设计导航', url: '/3d', order: 4 },
  { name: 'UIED学习平台', url: 'https://www.uied.cn/', order: 5 },
  { name: 'UIED资讯热榜', url: 'https://hot.uied.cn/', order: 6 },
  { name: '拜拜导航', url: 'https://www.88sheji.cn/', order: 7 },
  { name: 'UIED技术团队', url: 'https://fsuied.com/', order: 8 }
];

async function main() {
  console.log('🌱 开始填充设置数据...');

  // 清空现有数据
  await prisma.footerLink.deleteMany();
  await prisma.footerGroup.deleteMany();
  await prisma.navMenu.deleteMany();
  await prisma.friendLink.deleteMany();
  console.log('✅ 清空现有设置数据');

  // 创建导航菜单
  for (const menu of navMenusData) {
    const { children, ...menuData } = menu;
    const createdMenu = await prisma.navMenu.create({
      data: menuData
    });
    console.log(`✅ 创建导航菜单: ${menu.text}`);

    // 创建子菜单
    if (children && children.length > 0) {
      for (const child of children) {
        await prisma.navMenu.create({
          data: {
            ...child,
            parentId: createdMenu.id,
            visible: true
          }
        });
        console.log(`  ✅ 创建子菜单: ${child.text}`);
      }
    }
  }

  // 创建页脚分组和链接
  for (const group of footerGroupsData) {
    const { links, ...groupData } = group;
    const createdGroup = await prisma.footerGroup.create({
      data: {
        ...groupData,
        visible: true
      }
    });
    console.log(`✅ 创建页脚分组: ${group.title}`);

    // 创建链接
    for (const link of links) {
      await prisma.footerLink.create({
        data: {
          ...link,
          groupId: createdGroup.id,
          visible: true
        }
      });
    }
  }

  // 创建友情链接
  for (const link of friendLinksData) {
    await prisma.friendLink.create({
      data: {
        ...link,
        visible: true
      }
    });
    console.log(`✅ 创建友情链接: ${link.name}`);
  }

  console.log('🎉 设置数据填充完成！');
}

main()
  .catch((e) => {
    console.error('❌ 数据填充失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
