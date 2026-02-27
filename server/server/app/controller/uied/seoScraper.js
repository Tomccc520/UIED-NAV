/**
 * @file controller/uied/seoScraper.js
 * @description SEO 信息抓取控制器
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

'use strict';

const baseController = require('../baseController');

class SeoScraperController extends baseController {
  /**
   * 从 URL 抓取 SEO 信息
   */
  async fetch() {
    const { ctx } = this;
    try {
      const { url } = ctx.request.body;

      if (!url) {
        return this.result({ code: 400, message: '请提供URL' });
      }

      // 验证 URL 格式
      try {
        new URL(url.startsWith('http') ? url : `https://${url}`);
      } catch (e) {
        return this.result({ code: 400, message: '无效的URL格式' });
      }

      const result = await ctx.service.uied.seoScraper.fetch(url);
      this.result({ data: result });
    } catch (error) {
      ctx.logger.error('SEO 抓取失败:', error);
      this.result({ code: 500, message: error.message || 'SEO信息抓取失败' });
    }
  }
}

module.exports = SeoScraperController;
