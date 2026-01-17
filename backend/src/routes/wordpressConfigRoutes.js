/**
 * @file wordpressConfigRoutes.js
 * @description 后端API服务
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

import express from 'express';
import { PrismaClient } from '@prisma/client';
import fetch from 'node-fetch';

const router = express.Router();
const prisma = new PrismaClient();

// ==================== WordPress 配置 ====================

// 获取所有 WordPress 配置
router.get('/configs', async (req, res) => {
  try {
    const configs = await prisma.wordPressConfig.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(configs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 获取默认 WordPress 配置
router.get('/configs/default', async (req, res) => {
  try {
    let config = await prisma.wordPressConfig.findFirst({
      where: { enabled: true, isDefault: true },
    });
    if (!config) {
      config = await prisma.wordPressConfig.findFirst({
        where: { enabled: true },
      });
    }
    if (!config) {
      return res.status(404).json({ error: '没有可用的 WordPress 配置' });
    }
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 创建 WordPress 配置
router.post('/configs', async (req, res) => {
  try {
    const { name, apiUrl, enabled, isDefault, cacheTime } = req.body;
    
    if (!name || !apiUrl) {
      return res.status(400).json({ error: '名称和API地址为必填项' });
    }
    
    // 如果设为默认，取消其他默认配置
    if (isDefault) {
      await prisma.wordPressConfig.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }
    
    const config = await prisma.wordPressConfig.create({
      data: {
        name,
        apiUrl,
        enabled: enabled !== false,
        isDefault: isDefault || false,
        cacheTime: cacheTime || 7200,
      },
    });
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 更新 WordPress 配置
router.put('/configs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { isDefault, ...data } = req.body;
    
    // 如果设为默认，取消其他默认配置
    if (isDefault) {
      await prisma.wordPressConfig.updateMany({
        where: { isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }
    
    const config = await prisma.wordPressConfig.update({
      where: { id },
      data: { ...data, isDefault },
    });
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 删除 WordPress 配置
router.delete('/configs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.wordPressConfig.delete({
      where: { id },
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== WordPress 分类配置 ====================

// 获取所有分类配置
router.get('/categories', async (req, res) => {
  try {
    const { pageSlug } = req.query;
    const where = {};
    if (pageSlug) where.pageSlug = pageSlug;
    
    const categories = await prisma.wordPressCategory.findMany({
      where,
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 获取前端展示用的分类（只返回可见的）
router.get('/categories/active', async (req, res) => {
  try {
    const { pageSlug } = req.query;
    
    const where = { visible: true };
    
    // 如果指定了 pageSlug，只返回该页面的分类
    if (pageSlug) {
      where.pageSlug = pageSlug;
    }
    
    const categories = await prisma.wordPressCategory.findMany({
      where,
      orderBy: [{ order: 'asc' }],
    });
    
    // 按 wpCategoryId 去重，保留第一个（order 最小的）
    const seenIds = new Set();
    const uniqueCategories = categories.filter(cat => {
      if (!seenIds.has(cat.wpCategoryId)) {
        seenIds.add(cat.wpCategoryId);
        return true;
      }
      return false;
    });
    
    res.json(uniqueCategories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 创建分类配置
router.post('/categories', async (req, res) => {
  try {
    const { configId, wpCategoryId, wpCategoryName, displayName, slug, description, order, visible, pageSlug } = req.body;
    
    if (!wpCategoryId || !wpCategoryName || !displayName || !slug) {
      return res.status(400).json({ error: 'WordPress分类ID、分类名称、显示名称和slug为必填项' });
    }
    
    const category = await prisma.wordPressCategory.create({
      data: {
        configId,
        wpCategoryId: parseInt(wpCategoryId),
        wpCategoryName,
        displayName,
        slug,
        description,
        order: order || 0,
        visible: visible !== false,
        pageSlug,
      },
    });
    res.json(category);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'slug已存在' });
    }
    res.status(500).json({ error: error.message });
  }
});

// 更新分类配置
router.put('/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const category = await prisma.wordPressCategory.update({
      where: { id },
      data: req.body,
    });
    res.json(category);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 删除分类配置
router.delete('/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.wordPressCategory.delete({
      where: { id },
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== WordPress 标签配置 ====================

// 获取所有标签配置
router.get('/tags', async (req, res) => {
  try {
    const { pageSlug } = req.query;
    const where = {};
    if (pageSlug) where.pageSlug = pageSlug;
    
    const tags = await prisma.wordPressTag.findMany({
      where,
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    });
    res.json(tags);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 获取前端展示用的标签（只返回可见的）
router.get('/tags/active', async (req, res) => {
  try {
    const { pageSlug } = req.query;
    
    const where = { visible: true };
    if (pageSlug) {
      where.OR = [
        { pageSlug: null },
        { pageSlug: pageSlug },
      ];
    }
    
    const tags = await prisma.wordPressTag.findMany({
      where,
      orderBy: [{ order: 'asc' }],
    });
    res.json(tags);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 创建标签配置
router.post('/tags', async (req, res) => {
  try {
    const { configId, wpTagId, wpTagName, displayName, slug, description, order, visible, pageSlug } = req.body;
    
    if (!wpTagId || !wpTagName || !displayName || !slug) {
      return res.status(400).json({ error: 'WordPress标签ID、标签名称、显示名称和slug为必填项' });
    }
    
    const tag = await prisma.wordPressTag.create({
      data: {
        configId,
        wpTagId: parseInt(wpTagId),
        wpTagName,
        displayName,
        slug,
        description,
        order: order || 0,
        visible: visible !== false,
        pageSlug,
      },
    });
    res.json(tag);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'slug已存在' });
    }
    res.status(500).json({ error: error.message });
  }
});

// 更新标签配置
router.put('/tags/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const tag = await prisma.wordPressTag.update({
      where: { id },
      data: req.body,
    });
    res.json(tag);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 删除标签配置
router.delete('/tags/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.wordPressTag.delete({
      where: { id },
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== WordPress 组件配置 ====================

// 获取所有组件配置
router.get('/widgets', async (req, res) => {
  try {
    const { pageSlug } = req.query;
    
    // 获取所有组件
    const widgets = await prisma.wordPressWidget.findMany({
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    });
    
    // 如果指定了 pageSlug，筛选匹配的组件（支持逗号分隔的多值）
    let filteredWidgets = widgets;
    if (pageSlug) {
      filteredWidgets = widgets.filter(w => {
        if (!w.pageSlug) return false;
        const slugs = w.pageSlug.split(',').map(s => s.trim());
        return slugs.includes(pageSlug);
      });
    }
    
    res.json(filteredWidgets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 获取前端展示用的组件配置
router.get('/widgets/active', async (req, res) => {
  try {
    const { pageSlug } = req.query;
    
    // 基础查询条件：只返回可见的组件
    const where = { visible: true };
    
    const widgets = await prisma.wordPressWidget.findMany({
      where,
      orderBy: [{ order: 'asc' }],
    });
    
    // 如果指定了 pageSlug，筛选匹配的组件
    let filteredWidgets = widgets;
    if (pageSlug) {
      filteredWidgets = widgets.filter(w => {
        // pageSlug 可能是逗号分隔的多个值
        if (!w.pageSlug) return false;
        const slugs = w.pageSlug.split(',').map(s => s.trim());
        return slugs.includes(pageSlug);
      });
    }
    
    // 解析 settings JSON
    const result = filteredWidgets.map(w => ({
      ...w,
      categoryIds: w.categoryIds ? w.categoryIds.split(',').map(Number).filter(n => !isNaN(n)) : [],
      tagIds: w.tagIds ? w.tagIds.split(',').map(Number).filter(n => !isNaN(n)) : [],
      settings: w.settings ? JSON.parse(w.settings) : {},
    }));
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 创建组件配置
router.post('/widgets', async (req, res) => {
  try {
    const { name, pageSlug, position, componentType, title, limit, showMoreLink, categoryIds, tagIds, order, visible, settings } = req.body;
    
    if (!name || !pageSlug || !position || !componentType) {
      return res.status(400).json({ error: '名称、页面、位置和组件类型为必填项' });
    }
    
    const widget = await prisma.wordPressWidget.create({
      data: {
        name,
        pageSlug,
        position,
        componentType,
        title,
        limit: limit || 6,
        showMoreLink,
        categoryIds: Array.isArray(categoryIds) ? categoryIds.join(',') : categoryIds,
        tagIds: Array.isArray(tagIds) ? tagIds.join(',') : tagIds,
        order: order || 0,
        visible: visible !== false,
        settings: settings ? JSON.stringify(settings) : null,
      },
    });
    res.json(widget);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: '该页面的该位置已存在组件配置' });
    }
    res.status(500).json({ error: error.message });
  }
});

// 更新组件配置
router.put('/widgets/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { categoryIds, tagIds, settings, ...data } = req.body;
    
    const widget = await prisma.wordPressWidget.update({
      where: { id },
      data: {
        ...data,
        categoryIds: Array.isArray(categoryIds) ? categoryIds.join(',') : categoryIds,
        tagIds: Array.isArray(tagIds) ? tagIds.join(',') : tagIds,
        settings: settings ? JSON.stringify(settings) : null,
      },
    });
    res.json(widget);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 删除组件配置
router.delete('/widgets/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.wordPressWidget.delete({
      where: { id },
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== WordPress 文章代理 ====================

// 代理获取 WordPress 文章（避免前端跨域问题）
router.get('/posts', async (req, res) => {
  try {
    const { categoryId, tagId, page = 1, perPage = 10, orderBy = 'date', order = 'desc', search } = req.query;
    
    // 获取默认配置
    let config = await prisma.wordPressConfig.findFirst({
      where: { enabled: true, isDefault: true },
    });
    if (!config) {
      config = await prisma.wordPressConfig.findFirst({
        where: { enabled: true },
      });
    }
    if (!config) {
      return res.status(400).json({ error: '没有可用的 WordPress 配置' });
    }
    
    // 构建 WordPress API URL
    let url = `${config.apiUrl}/posts?page=${page}&per_page=${perPage}&orderby=${orderBy}&order=${order}&_embed=true`;
    if (categoryId) url += `&categories=${categoryId}`;
    if (tagId) url += `&tags=${tagId}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    
    // 请求 WordPress API
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; UIED-Nav/1.0)',
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`WordPress API 错误: ${response.status}`);
    }
    
    const posts = await response.json();
    
    // 处理文章数据
    const processedPosts = posts.map(post => {
      // 获取特色图片
      let thumbnail = '';
      if (post._embedded && post._embedded['wp:featuredmedia'] && post._embedded['wp:featuredmedia'][0]) {
        const media = post._embedded['wp:featuredmedia'][0];
        thumbnail = media.source_url || '';
        if (media.media_details && media.media_details.sizes) {
          const sizes = media.media_details.sizes;
          if (sizes.medium_large) {
            thumbnail = sizes.medium_large.source_url;
          } else if (sizes.medium) {
            thumbnail = sizes.medium.source_url;
          }
        }
      }
      
      // 获取作者信息
      let authorName = '';
      let authorAvatar = '';
      if (post._embedded && post._embedded.author && post._embedded.author[0]) {
        const author = post._embedded.author[0];
        authorName = author.name || '';
        authorAvatar = author.avatar_urls && author.avatar_urls['96'] ? author.avatar_urls['96'] : '';
      }
      
      // 处理摘要
      let description = post.excerpt?.rendered || '';
      description = description.replace(/<\/?[^>]+(>|$)/g, '').trim();
      
      return {
        id: post.id.toString(),
        name: post.title.rendered,
        description,
        link: post.link,
        thumbnail,
        date: new Date(post.date).toLocaleDateString(),
        authorName,
        authorAvatar,
        isNew: isNewPost(post.date),
      };
    });
    
    res.json(processedPosts);
  } catch (error) {
    console.error('获取 WordPress 文章失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// 判断是否是新文章（7天内发布）
function isNewPost(dateString) {
  const publishDate = new Date(dateString);
  const now = new Date();
  const diffInDays = Math.floor((now - publishDate) / (1000 * 60 * 60 * 24));
  return diffInDays <= 7;
}

export default router;
