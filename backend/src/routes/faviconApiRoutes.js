/**
 * @file faviconApiRoutes.js
 * @description 后端API服务
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

import express from 'express';
import { PrismaClient } from '@prisma/client';
import { getCache, setCache, CACHE_TTL } from '../services/cacheService.js';

const router = express.Router();
const prisma = new PrismaClient();

// Favicon缓存键前缀
const FAVICON_CACHE_PREFIX = 'favicon:';
// Favicon缓存时间：7天（秒）
const FAVICON_CACHE_TTL = 7 * 24 * 60 * 60;

// 获取所有 Favicon API 配置
router.get('/', async (req, res) => {
  try {
    const apis = await prisma.faviconApi.findMany({
      orderBy: { order: 'asc' },
    });
    res.json(apis);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 获取启用的 Favicon API（按优先级排序）
router.get('/enabled', async (req, res) => {
  try {
    const apis = await prisma.faviconApi.findMany({
      where: { enabled: true },
      orderBy: { order: 'asc' },
    });
    res.json(apis);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 创建 Favicon API 配置
router.post('/', async (req, res) => {
  try {
    const { name, urlTemplate, description, order, enabled } = req.body;
    
    if (!name || !urlTemplate) {
      return res.status(400).json({ error: '名称和URL模板为必填项' });
    }
    
    const api = await prisma.faviconApi.create({
      data: {
        name,
        urlTemplate,
        description: description || null,
        order: order || 0,
        enabled: enabled !== false,
      },
    });
    res.json(api);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 更新 Favicon API 配置
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const api = await prisma.faviconApi.update({
      where: { id },
      data: req.body,
    });
    res.json(api);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 删除 Favicon API 配置
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.faviconApi.delete({
      where: { id },
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 根据URL获取favicon（使用配置的API，带缓存）
router.get('/fetch', async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) {
      return res.status(400).json({ error: '请提供URL参数' });
    }
    
    // 解析域名
    let domain;
    try {
      const urlObj = new URL(url);
      domain = urlObj.hostname;
    } catch {
      return res.status(400).json({ error: '无效的URL' });
    }
    
    // 检查缓存
    const cacheKey = `${FAVICON_CACHE_PREFIX}${domain}`;
    const cachedResult = getCache(cacheKey);
    if (cachedResult) {
      return res.json({ ...cachedResult, cached: true });
    }
    
    // 获取启用的API配置
    const apis = await prisma.faviconApi.findMany({
      where: { enabled: true },
      orderBy: { order: 'asc' },
    });
    
    let result;
    
    if (apis.length === 0) {
      // 如果没有配置，使用默认的Google API
      const defaultUrl = `https://t3.gstatic.cn/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&size=128&url=${domain}`;
      result = { faviconUrl: defaultUrl, source: 'default' };
    } else {
      // 使用第一个启用的API
      const api = apis[0];
      const faviconUrl = api.urlTemplate
        .replace('{domain}', domain)
        .replace('{url}', encodeURIComponent(url));
      
      result = { 
        faviconUrl, 
        source: api.name,
        allApis: apis.map(a => ({
          name: a.name,
          url: a.urlTemplate.replace('{domain}', domain).replace('{url}', encodeURIComponent(url))
        }))
      };
    }
    
    // 存入缓存（7天）
    setCache(cacheKey, result, FAVICON_CACHE_TTL);
    
    res.json({ ...result, cached: false });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
