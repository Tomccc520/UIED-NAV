/**
 * @file exportService.js
 * @description 后端API服务
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

import { PrismaClient } from '@prisma/client';
import { Parser } from 'json2csv';
import archiver from 'archiver';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

/**
 * 数据导出和备份服务
 */
export const exportService = {
  /**
   * 获取导出目录
   */
  getExportDir() {
    return path.join(__dirname, '../../exports');
  },

  /**
   * 确保导出目录存在
   */
  async ensureExportDir() {
    const exportDir = this.getExportDir();
    try {
      await fs.promises.access(exportDir);
    } catch {
      await fs.promises.mkdir(exportDir, { recursive: true });
    }
    return exportDir;
  },

  /**
   * 导出后台设置配置为 JSON（不包含分类和网站数据）
   * 只备份：页面、Banner、热门推荐、导航菜单、页脚、友链、社交媒体、站点信息、AI配置、WordPress配置、Favicon API
   */
  async exportAllConfigJSON() {
    const exportDir = await this.ensureExportDir();
    
    // 只获取后台设置配置数据（不包含分类和网站）
    const [
      pages,
      pageCategories,
      banners,
      hotRecommendations,
      navMenus,
      footerGroups,
      footerLinks,
      friendLinks,
      socialMedia,
      socialMediaGroups,
      socialMediaItems,
      siteInfo,
      aiConfig,
      wordpressConfig,
      faviconApi,
    ] = await Promise.all([
      prisma.page.findMany({ orderBy: { order: 'asc' } }),
      prisma.pageCategory.findMany({ orderBy: { order: 'asc' } }),
      prisma.banner.findMany({ orderBy: { order: 'asc' } }),
      prisma.hotRecommendation.findMany({ orderBy: { order: 'asc' } }),
      prisma.navMenu.findMany({ orderBy: { order: 'asc' } }),
      prisma.footerGroup.findMany({ orderBy: { order: 'asc' } }),
      prisma.footerLink.findMany({ orderBy: { order: 'asc' } }),
      prisma.friendLink.findMany({ orderBy: { order: 'asc' } }),
      prisma.socialMedia.findMany({ orderBy: { order: 'asc' } }),
      prisma.socialMediaGroup.findMany({ orderBy: { order: 'asc' } }),
      prisma.socialMediaItem.findMany({ orderBy: { order: 'asc' } }),
      prisma.siteInfo.findMany(),
      prisma.aiConfig.findMany(),
      prisma.wordPressConfig.findMany(),
      prisma.faviconApi.findMany({ orderBy: { order: 'asc' } }),
    ]);

    const backupData = {
      exportedAt: new Date().toISOString(),
      version: '2.1',
      type: 'settings_only',
      description: '后台设置备份（不包含分类和网站数据）',
      data: {
        pages,
        pageCategories,
        banners,
        hotRecommendations,
        navMenus,
        footerGroups,
        footerLinks,
        friendLinks,
        socialMedia,
        socialMediaGroups,
        socialMediaItems,
        siteInfo,
        aiConfig,
        wordpressConfig,
        faviconApi,
      },
      counts: {
        pages: pages.length,
        pageCategories: pageCategories.length,
        banners: banners.length,
        hotRecommendations: hotRecommendations.length,
        navMenus: navMenus.length,
        footerGroups: footerGroups.length,
        footerLinks: footerLinks.length,
        friendLinks: friendLinks.length,
        socialMedia: socialMedia.length,
        socialMediaGroups: socialMediaGroups.length,
        socialMediaItems: socialMediaItems.length,
        siteInfo: siteInfo.length,
        aiConfig: aiConfig.length,
        wordpressConfig: wordpressConfig.length,
        faviconApi: faviconApi.length,
      },
    };

    const json = JSON.stringify(backupData, null, 2);
    const filename = `settings_backup_${Date.now()}.json`;
    const filepath = path.join(exportDir, filename);

    await fs.promises.writeFile(filepath, json, 'utf8');

    return {
      filename,
      filepath,
      counts: backupData.counts,
      size: Buffer.byteLength(json, 'utf8'),
    };
  },

  /**
   * 从 JSON 备份恢复设置配置数据（不恢复分类和网站）
   */
  async restoreFromJSON(filepath) {
    const content = await fs.promises.readFile(filepath, 'utf8');
    const backupData = JSON.parse(content);

    if (!backupData.data) {
      throw new Error('无效的备份文件格式');
    }

    const { data } = backupData;
    const results = {
      restored: {},
      errors: [],
      skipped: [],
    };

    // 跳过分类和网站数据（这些由数据库本地管理）
    if (data.categories) {
      results.skipped.push('categories - 分类数据不会被恢复，请使用数据库备份');
    }
    if (data.websites) {
      results.skipped.push('websites - 网站数据不会被恢复，请使用数据库备份');
    }

    // 1. 恢复独立配置表
    const independentTables = [
      { name: 'siteInfo', model: prisma.siteInfo, data: data.siteInfo },
      { name: 'aiConfig', model: prisma.aiConfig, data: data.aiConfig },
      { name: 'wordpressConfig', model: prisma.wordPressConfig, data: data.wordpressConfig },
      { name: 'faviconApi', model: prisma.faviconApi, data: data.faviconApi },
      { name: 'friendLinks', model: prisma.friendLink, data: data.friendLinks },
      { name: 'socialMedia', model: prisma.socialMedia, data: data.socialMedia },
    ];

    for (const table of independentTables) {
      if (table.data && table.data.length > 0) {
        try {
          await table.model.deleteMany();
          for (const item of table.data) {
            await table.model.create({ data: this.cleanDataForRestore(item) });
          }
          results.restored[table.name] = table.data.length;
        } catch (error) {
          results.errors.push({ table: table.name, error: error.message });
        }
      }
    }

    // 1.5 恢复关注交流分组和项目（需要先删除项目再删除分组）
    if (data.socialMediaGroups && data.socialMediaGroups.length > 0) {
      try {
        // 先删除所有项目
        await prisma.socialMediaItem.deleteMany();
        // 再删除所有分组
        await prisma.socialMediaGroup.deleteMany();
        // 恢复分组
        for (const group of data.socialMediaGroups) {
          await prisma.socialMediaGroup.create({ data: this.cleanDataForRestore(group) });
        }
        results.restored.socialMediaGroups = data.socialMediaGroups.length;
        
        // 恢复项目
        if (data.socialMediaItems && data.socialMediaItems.length > 0) {
          for (const item of data.socialMediaItems) {
            await prisma.socialMediaItem.create({ data: this.cleanDataForRestore(item) });
          }
          results.restored.socialMediaItems = data.socialMediaItems.length;
        }
      } catch (error) {
        results.errors.push({ table: 'socialMediaGroups', error: error.message });
      }
    }

    // 2. 恢复页面（不删除页面分类关联，因为分类可能不存在）
    if (data.pages && data.pages.length > 0) {
      try {
        await prisma.pageCategory.deleteMany();
        await prisma.page.deleteMany();
        for (const page of data.pages) {
          await prisma.page.create({ data: this.cleanDataForRestore(page) });
        }
        results.restored.pages = data.pages.length;
      } catch (error) {
        results.errors.push({ table: 'pages', error: error.message });
      }
    }

    // 3. 恢复页面分类关联（只恢复存在的分类关联）
    if (data.pageCategories && data.pageCategories.length > 0) {
      let restoredCount = 0;
      for (const pc of data.pageCategories) {
        try {
          // 检查分类是否存在
          const categoryExists = await prisma.category.findUnique({ where: { id: pc.categoryId } });
          const pageExists = await prisma.page.findUnique({ where: { id: pc.pageId } });
          if (categoryExists && pageExists) {
            await prisma.pageCategory.create({ data: this.cleanDataForRestore(pc) });
            restoredCount++;
          }
        } catch (error) {
          // 忽略单个关联恢复失败
        }
      }
      if (restoredCount > 0) {
        results.restored.pageCategories = restoredCount;
      }
    }

    // 4. 恢复 Banner
    if (data.banners && data.banners.length > 0) {
      try {
        await prisma.banner.deleteMany();
        for (const banner of data.banners) {
          await prisma.banner.create({ data: this.cleanDataForRestore(banner) });
        }
        results.restored.banners = data.banners.length;
      } catch (error) {
        results.errors.push({ table: 'banners', error: error.message });
      }
    }

    // 5. 恢复热门推荐
    if (data.hotRecommendations && data.hotRecommendations.length > 0) {
      try {
        await prisma.hotRecommendation.deleteMany();
        for (const rec of data.hotRecommendations) {
          await prisma.hotRecommendation.create({ data: this.cleanDataForRestore(rec) });
        }
        results.restored.hotRecommendations = data.hotRecommendations.length;
      } catch (error) {
        results.errors.push({ table: 'hotRecommendations', error: error.message });
      }
    }

    // 6. 恢复导航菜单
    if (data.navMenus && data.navMenus.length > 0) {
      try {
        await prisma.navMenu.deleteMany();
        const parentMenus = data.navMenus.filter(m => !m.parentId);
        for (const menu of parentMenus) {
          await prisma.navMenu.create({ data: this.cleanDataForRestore(menu) });
        }
        const childMenus = data.navMenus.filter(m => m.parentId);
        for (const menu of childMenus) {
          await prisma.navMenu.create({ data: this.cleanDataForRestore(menu) });
        }
        results.restored.navMenus = data.navMenus.length;
      } catch (error) {
        results.errors.push({ table: 'navMenus', error: error.message });
      }
    }

    // 7. 恢复页脚分组和链接
    if (data.footerGroups && data.footerGroups.length > 0) {
      try {
        await prisma.footerLink.deleteMany();
        await prisma.footerGroup.deleteMany();
        for (const group of data.footerGroups) {
          await prisma.footerGroup.create({ data: this.cleanDataForRestore(group) });
        }
        results.restored.footerGroups = data.footerGroups.length;
      } catch (error) {
        results.errors.push({ table: 'footerGroups', error: error.message });
      }
    }

    if (data.footerLinks && data.footerLinks.length > 0) {
      try {
        for (const link of data.footerLinks) {
          await prisma.footerLink.create({ data: this.cleanDataForRestore(link) });
        }
        results.restored.footerLinks = data.footerLinks.length;
      } catch (error) {
        results.errors.push({ table: 'footerLinks', error: error.message });
      }
    }

    return results;
  },

  /**
   * 清理数据用于恢复（移除自动生成的字段）
   */
  cleanDataForRestore(item) {
    const cleaned = { ...item };
    // 保留 id 以保持关联关系
    // 移除时间戳字段，让数据库自动生成
    delete cleaned.createdAt;
    delete cleaned.updatedAt;
    return cleaned;
  },
  /**
   * 获取导出目录
   */
  getExportDir() {
    return path.join(__dirname, '../../exports');
  },

  /**
   * 确保导出目录存在
   */
  async ensureExportDir() {
    const exportDir = this.getExportDir();
    try {
      await fs.promises.access(exportDir);
    } catch {
      await fs.promises.mkdir(exportDir, { recursive: true });
    }
    return exportDir;
  },

  /**
   * 导出网站数据为 CSV
   */
  async exportWebsitesCSV(filters = {}) {
    const exportDir = await this.ensureExportDir();
    
    const where = this.buildWebsiteFilter(filters);
    const websites = await prisma.website.findMany({
      where,
      include: { category: true },
      orderBy: { createdAt: 'desc' },
    });

    const data = websites.map(w => ({
      id: w.id,
      name: w.name,
      description: w.description,
      url: w.url,
      iconUrl: w.iconUrl || '',
      category: w.category?.name || '',
      categoryId: w.categoryId,
      isNew: w.isNew ? '是' : '否',
      isFeatured: w.isFeatured ? '是' : '否',
      isHot: w.isHot ? '是' : '否',
      tags: w.tags,
      order: w.order,
      clickCount: w.clickCount,
      status: w.status,
      createdAt: w.createdAt.toISOString(),
      updatedAt: w.updatedAt.toISOString(),
    }));

    const fields = [
      { label: 'ID', value: 'id' },
      { label: '名称', value: 'name' },
      { label: '描述', value: 'description' },
      { label: 'URL', value: 'url' },
      { label: '图标URL', value: 'iconUrl' },
      { label: '分类', value: 'category' },
      { label: '分类ID', value: 'categoryId' },
      { label: '新网站', value: 'isNew' },
      { label: '推荐', value: 'isFeatured' },
      { label: '热门', value: 'isHot' },
      { label: '标签', value: 'tags' },
      { label: '排序', value: 'order' },
      { label: '点击量', value: 'clickCount' },
      { label: '状态', value: 'status' },
      { label: '创建时间', value: 'createdAt' },
      { label: '更新时间', value: 'updatedAt' },
    ];

    const parser = new Parser({ fields, withBOM: true });
    const csv = parser.parse(data);

    const filename = `websites_${Date.now()}.csv`;
    const filepath = path.join(exportDir, filename);

    await fs.promises.writeFile(filepath, csv, 'utf8');

    return {
      filename,
      filepath,
      count: websites.length,
      size: Buffer.byteLength(csv, 'utf8'),
    };
  },

  /**
   * 导出网站数据为 JSON
   */
  async exportWebsitesJSON(filters = {}) {
    const exportDir = await this.ensureExportDir();
    
    const where = this.buildWebsiteFilter(filters);
    const websites = await prisma.website.findMany({
      where,
      include: { category: { select: { id: true, name: true, slug: true } } },
      orderBy: { createdAt: 'desc' },
    });

    const json = JSON.stringify(websites, null, 2);
    const filename = `websites_${Date.now()}.json`;
    const filepath = path.join(exportDir, filename);

    await fs.promises.writeFile(filepath, json, 'utf8');

    return {
      filename,
      filepath,
      count: websites.length,
      size: Buffer.byteLength(json, 'utf8'),
    };
  },

  /**
   * 导出分类数据为 CSV
   */
  async exportCategoriesCSV() {
    const exportDir = await this.ensureExportDir();
    
    const categories = await prisma.category.findMany({
      include: {
        _count: { select: { websites: true } },
        parent: { select: { name: true } },
      },
      orderBy: { order: 'asc' },
    });

    const data = categories.map(c => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      icon: c.icon,
      color: c.color,
      description: c.description || '',
      parentName: c.parent?.name || '',
      parentId: c.parentId || '',
      order: c.order,
      visible: c.visible ? '是' : '否',
      websiteCount: c._count.websites,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    }));

    const fields = [
      { label: 'ID', value: 'id' },
      { label: '名称', value: 'name' },
      { label: 'Slug', value: 'slug' },
      { label: '图标', value: 'icon' },
      { label: '颜色', value: 'color' },
      { label: '描述', value: 'description' },
      { label: '父分类', value: 'parentName' },
      { label: '父分类ID', value: 'parentId' },
      { label: '排序', value: 'order' },
      { label: '可见', value: 'visible' },
      { label: '网站数', value: 'websiteCount' },
      { label: '创建时间', value: 'createdAt' },
      { label: '更新时间', value: 'updatedAt' },
    ];

    const parser = new Parser({ fields, withBOM: true });
    const csv = parser.parse(data);

    const filename = `categories_${Date.now()}.csv`;
    const filepath = path.join(exportDir, filename);

    await fs.promises.writeFile(filepath, csv, 'utf8');

    return {
      filename,
      filepath,
      count: categories.length,
      size: Buffer.byteLength(csv, 'utf8'),
    };
  },

  /**
   * 导出分类数据为 JSON
   */
  async exportCategoriesJSON() {
    const exportDir = await this.ensureExportDir();
    
    const categories = await prisma.category.findMany({
      include: {
        _count: { select: { websites: true } },
      },
      orderBy: { order: 'asc' },
    });

    const json = JSON.stringify(categories, null, 2);
    const filename = `categories_${Date.now()}.json`;
    const filepath = path.join(exportDir, filename);

    await fs.promises.writeFile(filepath, json, 'utf8');

    return {
      filename,
      filepath,
      count: categories.length,
      size: Buffer.byteLength(json, 'utf8'),
    };
  },

  /**
   * 创建数据库备份
   */
  async createBackup() {
    const exportDir = await this.ensureExportDir();
    const dbPath = path.join(__dirname, '../../prisma/dev.db');

    // 检查数据库文件是否存在
    try {
      await fs.promises.access(dbPath);
    } catch {
      throw new Error('数据库文件不存在');
    }

    const timestamp = Date.now();
    const zipFilename = `backup_${timestamp}.zip`;
    const zipFilepath = path.join(exportDir, zipFilename);

    // 创建压缩包
    await this.createZip(dbPath, zipFilepath, `backup_${timestamp}.db`);

    const stats = await fs.promises.stat(zipFilepath);

    return {
      filename: zipFilename,
      filepath: zipFilepath,
      size: stats.size,
      createdAt: new Date().toISOString(),
    };
  },

  /**
   * 创建 ZIP 压缩包
   */
  createZip(sourceFile, targetFile, archiveName) {
    return new Promise((resolve, reject) => {
      const output = fs.createWriteStream(targetFile);
      const archive = archiver('zip', { zlib: { level: 9 } });

      output.on('close', () => resolve());
      archive.on('error', (err) => reject(err));

      archive.pipe(output);
      archive.file(sourceFile, { name: archiveName });
      archive.finalize();
    });
  },

  /**
   * 获取导出文件列表
   */
  async getExportList() {
    const exportDir = await this.ensureExportDir();
    
    try {
      const files = await fs.promises.readdir(exportDir);
      const fileInfos = await Promise.all(
        files.map(async (filename) => {
          const filepath = path.join(exportDir, filename);
          const stats = await fs.promises.stat(filepath);
          
          // 解析文件类型
          let type = 'unknown';
          if (filename.startsWith('websites_')) type = 'websites';
          else if (filename.startsWith('categories_')) type = 'categories';
          else if (filename.startsWith('settings_backup_')) type = 'settings_backup';
          else if (filename.startsWith('full_backup_')) type = 'full_backup';
          else if (filename.startsWith('backup_')) type = 'backup';

          // 解析格式
          let format = 'unknown';
          if (filename.endsWith('.csv')) format = 'csv';
          else if (filename.endsWith('.json')) format = 'json';
          else if (filename.endsWith('.zip')) format = 'zip';

          return {
            filename,
            type,
            format,
            size: stats.size,
            createdAt: stats.birthtime.toISOString(),
          };
        })
      );

      // 按创建时间倒序排列
      return fileInfos.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } catch {
      return [];
    }
  },

  /**
   * 删除导出文件
   */
  async deleteExportFile(filename) {
    const exportDir = this.getExportDir();
    const filepath = path.join(exportDir, filename);

    // 安全检查：确保文件在导出目录内
    const resolvedPath = path.resolve(filepath);
    const resolvedDir = path.resolve(exportDir);
    if (!resolvedPath.startsWith(resolvedDir)) {
      throw new Error('非法文件路径');
    }

    await fs.promises.unlink(filepath);
    return { success: true };
  },

  /**
   * 获取导出文件路径
   */
  getExportFilePath(filename) {
    const exportDir = this.getExportDir();
    const filepath = path.join(exportDir, filename);

    // 安全检查
    const resolvedPath = path.resolve(filepath);
    const resolvedDir = path.resolve(exportDir);
    if (!resolvedPath.startsWith(resolvedDir)) {
      throw new Error('非法文件路径');
    }

    return filepath;
  },

  /**
   * 构建网站筛选条件
   */
  buildWebsiteFilter(filters) {
    const where = {};

    if (filters.categoryId) {
      where.categoryId = filters.categoryId;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.createdAt.lte = new Date(filters.endDate + 'T23:59:59');
      }
    }

    return where;
  },
};

export default exportService;
