/**
 * @file sitemapService.js
 * @description 后端API服务
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

import { PrismaClient } from '@prisma/client';
import { create } from 'xmlbuilder2';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

/**
 * SEO Sitemap 服务
 */
export const sitemapService = {
  /**
   * 获取 public 目录路径
   */
  getPublicDir() {
    return path.join(__dirname, '../../public');
  },

  /**
   * 确保 public 目录存在
   */
  async ensurePublicDir() {
    const publicDir = this.getPublicDir();
    try {
      await fs.access(publicDir);
    } catch {
      await fs.mkdir(publicDir, { recursive: true });
    }
    return publicDir;
  },

  /**
   * 生成 sitemap.xml
   */
  async generateSitemap() {
    const baseUrl = process.env.FRONTEND_URL || 'https://www.uied.cn';
    const publicDir = await this.ensurePublicDir();
    const sitemapPath = path.join(publicDir, 'sitemap.xml');

    // 获取所有公开页面
    const pages = await this.getAllPages();
    const categories = await prisma.category.findMany({
      where: { visible: true },
      orderBy: { updatedAt: 'desc' },
    });

    // 构建 XML
    const root = create({ version: '1.0', encoding: 'UTF-8' })
      .ele('urlset', { xmlns: 'http://www.sitemaps.org/schemas/sitemap/0.9' });

    // 添加首页
    root.ele('url')
      .ele('loc').txt(baseUrl).up()
      .ele('changefreq').txt('daily').up()
      .ele('priority').txt('1.0').up()
      .ele('lastmod').txt(new Date().toISOString().split('T')[0]).up();

    // 添加页面
    for (const page of pages) {
      root.ele('url')
        .ele('loc').txt(`${baseUrl}/${page.slug}`).up()
        .ele('changefreq').txt('weekly').up()
        .ele('priority').txt('0.8').up()
        .ele('lastmod').txt(page.updatedAt.toISOString().split('T')[0]).up();
    }

    // 添加分类页面
    for (const category of categories) {
      root.ele('url')
        .ele('loc').txt(`${baseUrl}/category/${category.slug}`).up()
        .ele('changefreq').txt('daily').up()
        .ele('priority').txt('0.7').up()
        .ele('lastmod').txt(category.updatedAt.toISOString().split('T')[0]).up();
    }

    const xml = root.end({ prettyPrint: true });

    // 写入文件
    await fs.writeFile(sitemapPath, xml, 'utf8');

    const urlCount = 1 + pages.length + categories.length;
    console.log(`[SEO] Sitemap 已生成，包含 ${urlCount} 个 URL`);

    return {
      success: true,
      urlCount,
      path: sitemapPath,
      generatedAt: new Date().toISOString(),
    };
  },

  /**
   * 生成 robots.txt
   */
  async generateRobots() {
    const baseUrl = process.env.FRONTEND_URL || 'https://www.uied.cn';
    const publicDir = await this.ensurePublicDir();
    const robotsPath = path.join(publicDir, 'robots.txt');

    const content = `# UIED 设计导航 robots.txt
User-agent: *
Allow: /

# Sitemap
Sitemap: ${baseUrl}/sitemap.xml

# 禁止爬取管理后台
Disallow: /admin/
Disallow: /api/
`;

    await fs.writeFile(robotsPath, content, 'utf8');
    console.log('[SEO] robots.txt 已生成');

    return {
      success: true,
      path: robotsPath,
      generatedAt: new Date().toISOString(),
    };
  },

  /**
   * 获取所有可见页面
   */
  async getAllPages() {
    return await prisma.page.findMany({
      where: { visible: true },
      orderBy: { updatedAt: 'desc' },
    });
  },

  /**
   * 获取 SEO 文件状态
   */
  async getStatus() {
    const publicDir = this.getPublicDir();
    const sitemapPath = path.join(publicDir, 'sitemap.xml');
    const robotsPath = path.join(publicDir, 'robots.txt');

    let sitemapInfo = null;
    let robotsInfo = null;

    try {
      const sitemapStats = await fs.stat(sitemapPath);
      const sitemapContent = await fs.readFile(sitemapPath, 'utf8');
      const urlCount = (sitemapContent.match(/<url>/g) || []).length;
      sitemapInfo = {
        exists: true,
        size: sitemapStats.size,
        modifiedAt: sitemapStats.mtime.toISOString(),
        urlCount,
      };
    } catch {
      sitemapInfo = { exists: false };
    }

    try {
      const robotsStats = await fs.stat(robotsPath);
      robotsInfo = {
        exists: true,
        size: robotsStats.size,
        modifiedAt: robotsStats.mtime.toISOString(),
      };
    } catch {
      robotsInfo = { exists: false };
    }

    return {
      sitemap: sitemapInfo,
      robots: robotsInfo,
      baseUrl: process.env.FRONTEND_URL || 'https://www.uied.cn',
    };
  },

  /**
   * 读取 sitemap 内容
   */
  async getSitemapContent() {
    const publicDir = this.getPublicDir();
    const sitemapPath = path.join(publicDir, 'sitemap.xml');
    
    try {
      return await fs.readFile(sitemapPath, 'utf8');
    } catch {
      return null;
    }
  },

  /**
   * 读取 robots.txt 内容
   */
  async getRobotsContent() {
    const publicDir = this.getPublicDir();
    const robotsPath = path.join(publicDir, 'robots.txt');
    
    try {
      return await fs.readFile(robotsPath, 'utf8');
    } catch {
      return null;
    }
  },
};

export default sitemapService;
