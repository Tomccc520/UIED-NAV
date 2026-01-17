/**
 * @file seoScraperRoutes.js
 * @description SEO信息抓取路由
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

import express from 'express';
import { scrapeSeoInfo } from '../services/seoScraperService.js';

const router = express.Router();

/**
 * POST /api/seo-scraper/fetch
 * 从URL抓取SEO信息
 */
router.post('/fetch', async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        error: '请提供URL',
      });
    }

    // 验证URL格式
    try {
      new URL(url.startsWith('http') ? url : `https://${url}`);
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: '无效的URL格式',
      });
    }

    const seoInfo = await scrapeSeoInfo(url);

    res.json({
      success: true,
      data: seoInfo,
    });
  } catch (error) {
    console.error('SEO信息抓取失败:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'SEO信息抓取失败',
    });
  }
});

export default router;
