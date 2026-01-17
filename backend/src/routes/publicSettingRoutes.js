/**
 * @file publicSettingRoutes.js
 * @description 后端API服务
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

/**
 * 公开设置路由 - 前端需要的只读设置接口
 * 这些接口不需要认证，供前端展示使用
 */
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();
const prisma = new PrismaClient();

// 获取单个设置项 - 公开只读（用于前端获取配置）
router.get('/settings/:key', asyncHandler(async (req, res) => {
  const setting = await prisma.siteSetting.findUnique({
    where: { key: req.params.key }
  });
  if (!setting) {
    return res.status(404).json({ error: '设置项不存在' });
  }
  res.json({ key: setting.key, value: JSON.parse(setting.value) });
}));

// 获取导航菜单（树形结构）- 公开
router.get('/nav-menus', asyncHandler(async (req, res) => {
  const menus = await prisma.navMenu.findMany({
    where: { parentId: null, visible: true },
    include: {
      children: {
        where: { visible: true },
        orderBy: { order: 'asc' }
      }
    },
    orderBy: { order: 'asc' }
  });
  res.json(menus);
}));

// 获取页脚分组（含链接）- 公开
router.get('/footer-groups', asyncHandler(async (req, res) => {
  const groups = await prisma.footerGroup.findMany({
    where: { visible: true },
    include: {
      links: {
        where: { visible: true },
        orderBy: { order: 'asc' }
      }
    },
    orderBy: { order: 'asc' }
  });
  res.json(groups);
}));

// 获取友情链接 - 公开
router.get('/friend-links', asyncHandler(async (req, res) => {
  const links = await prisma.friendLink.findMany({
    where: { visible: true },
    orderBy: { order: 'asc' }
  });
  res.json(links);
}));

// 获取前端功能配置 - 公开
router.get('/frontend-config', asyncHandler(async (req, res) => {
  // 批量获取所有配置
  const settings = await prisma.siteSetting.findMany({
    where: {
      key: {
        in: ['exitModalEnabled', 'exitModalConfig', 'pageGlobalConfig']
      }
    }
  });
  
  // 转换为对象
  const settingsMap = {};
  settings.forEach(s => {
    try {
      settingsMap[s.key] = JSON.parse(s.value);
    } catch {
      settingsMap[s.key] = s.value;
    }
  });
  
  // 默认配置
  const defaultExitModalConfig = {
    enabled: true,
    title: '即将离开本站',
    description: '您即将访问第三方网站，请注意保护个人信息安全。',
    confirmText: '继续访问',
    cancelText: '返回',
    showReport: true,
    reportText: '举报此链接',
    autoRedirect: false,
    autoRedirectSeconds: 5,
    showAd: false,
    adCode: '',
    adPosition: 'bottom',
  };
  
  const defaultPageGlobalConfig = {
    defaultLayout: 'grid',
    gridColumns: 4,
    showSidebar: true,
    sidebarPosition: 'left',
    cardStyle: 'default',
    showCardTags: true,
    showCardDescription: true,
    maxDescriptionLines: 2,
    defaultPageSize: 20,
    showPagination: true,
    showSearch: true,
    searchPlaceholder: '搜索工具...',
    defaultThemeColor: '#2563EB',
    enableDarkMode: false,
  };
  
  // 合并配置
  const exitModalConfig = { ...defaultExitModalConfig, ...settingsMap.exitModalConfig };
  const exitModalEnabled = settingsMap.exitModalEnabled ?? exitModalConfig.enabled;
  
  res.json({
    exitModalEnabled,
    exitModalConfig: {
      ...exitModalConfig,
      enabled: exitModalEnabled
    },
    pageGlobalConfig: { ...defaultPageGlobalConfig, ...settingsMap.pageGlobalConfig },
  });
}));

export default router;
