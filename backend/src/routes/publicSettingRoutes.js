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

// 获取固定链接配置 - 公开（前端需要根据配置生成 URL）
router.get('/permalink', asyncHandler(async (req, res) => {
  const setting = await prisma.siteSetting.findUnique({
    where: { key: 'permalink_config' }
  });
  if (!setting) {
    // 返回默认值
    res.json({ 
      success: true,
      data: {
        structure: 'plain',
        customPattern: ''
      }
    });
    return;
  }
  const data = JSON.parse(setting.value);
  // 移除旧的 hotRecommendationClickMode 字段
  delete data.hotRecommendationClickMode;
  res.json({ success: true, data });
}));

// 获取热门推荐点击行为配置 - 公开
router.get('/hot-recommendation-click', asyncHandler(async (req, res) => {
  const setting = await prisma.siteSetting.findUnique({
    where: { key: 'hot_recommendation_click' }
  });
  if (!setting) {
    res.json({ 
      success: true,
      data: { clickMode: 'direct' }
    });
    return;
  }
  res.json({ success: true, data: JSON.parse(setting.value) });
}));

// 获取详情页侧边栏配置 - 公开
router.get('/detail-sidebar-config', asyncHandler(async (req, res) => {
  const setting = await prisma.siteSetting.findUnique({
    where: { key: 'detailSidebarConfig' }
  });
  
  // 默认配置
  const defaultConfig = {
    enabled: true,
    showRelated: true,
    relatedTitle: '你可能还喜欢',
    relatedCount: 6,
    relatedMode: 'auto',
    manualWebsiteIds: [],
    showTags: true,
    tagsTitle: '深入探索',
    showCategory: true,
    categoryTitle: '相关分类',
    visitBtnText: '访问网站',
  };
  
  if (!setting) {
    res.json({ success: true, data: defaultConfig });
    return;
  }
  
  const data = JSON.parse(setting.value);
  res.json({ success: true, data: { ...defaultConfig, ...data } });
}));

// 获取网站的标签 - 公开（前端详情页使用）
router.get('/website/:websiteId/tags', asyncHandler(async (req, res) => {
  const { websiteId } = req.params;
  
  const tags = await prisma.websiteTagRelation.findMany({
    where: { websiteId },
    include: { tag: true }
  });
  
  res.json({
    success: true,
    data: tags.map(r => r.tag)
  });
}));

// 获取详情页全局配置 - 公开（版权、免责声明等）
router.get('/detailPageConfig', asyncHandler(async (req, res) => {
  const setting = await prisma.siteSetting.findUnique({
    where: { key: 'detailPageConfig' }
  });
  
  // 默认配置 - 与后台管理默认值保持一致
  const defaultConfig = {
    copyrightEnabled: true,
    copyrightText: '本站收录的网站资源均来自互联网，仅供学习和研究使用。',
    copyrightLink: '',
    disclaimerEnabled: true,
    disclaimerText: '免责声明：本站不对所收录网站的内容、安全性、合法性负责，访问时请注意甄别。',
    footerTipEnabled: true,
    footerTipText: '如果您发现本页面收录的网站存在问题，欢迎向我们反馈。',
    shareEnabled: true,
    shareText: '分享给朋友',
    reportEnabled: true,
    reportText: '举报问题',
    reportEmail: '',
  };
  
  if (!setting) {
    res.json({ success: true, data: defaultConfig });
    return;
  }
  
  const data = JSON.parse(setting.value);
  res.json({ success: true, data: { ...defaultConfig, ...data } });
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
  
  // 默认配置 - 默认关闭弹窗，点击网站卡片跳转详情页
  const defaultExitModalConfig = {
    enabled: false,  // 默认关闭，点击跳转详情页
    title: '即将离开本站',
    description: '您即将访问第三方网站，请注意保护个人信息安全。',
    confirmText: '继续访问',
    cancelText: '返回',
    showReport: true,
    reportText: '举报此链接',
    autoRedirect: false,
    autoRedirectSeconds: 5,
    openInNewWindow: true,  // 默认新窗口打开
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
    websiteClickMode: 'detail',  // 默认跳转详情页
    detailPageNewWindow: false,  // 默认当前窗口打开详情页
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
