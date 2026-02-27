/**
 * @file service/uied/deliveryInit.js
 * @description 商业版交付初始化向导服务（一键导入站点配置/分类/标签/示例数据）
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

'use strict';

const Service = require('egg').Service;

class DeliveryInitService extends Service {
  /**
   * 将值规范为布尔类型
   */
  parseBoolean(value, fallback = false) {
    if (value === undefined || value === null || value === '') return fallback;
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value === 1;
    const text = String(value).trim().toLowerCase();
    if ([ '1', 'true', 'yes', 'y', 'on' ].includes(text)) return true;
    if ([ '0', 'false', 'no', 'n', 'off' ].includes(text)) return false;
    return fallback;
  }

  /**
   * 规范化字符串字段
   */
  toText(value, fallback = '') {
    const text = String(value === undefined || value === null ? fallback : value).trim();
    return text || String(fallback || '');
  }

  /**
   * 将输入值规范化为整数
   */
  toInt(value, fallback = 0, min = null, max = null) {
    const parsed = Number.parseInt(String(value ?? ''), 10);
    if (!Number.isInteger(parsed)) return fallback;
    let result = parsed;
    if (typeof min === 'number') result = Math.max(min, result);
    if (typeof max === 'number') result = Math.min(max, result);
    return result;
  }

  /**
   * 将列表参数规范化为字符串数组
   */
  toStringList(value) {
    if (Array.isArray(value)) {
      return value.map(item => String(item || '').trim()).filter(Boolean);
    }
    const text = String(value || '').trim();
    if (!text) return [];
    return text.split(',').map(item => item.trim()).filter(Boolean);
  }

  /**
   * 规范化向导执行参数
   */
  normalizeOptions(input = {}) {
    const source = input && typeof input === 'object' ? input : {};
    const edition = this.ctx.service.uied.licenseCenter.normalizeEdition(source.edition || 'pro');
    return {
      profile: this.toText(source.profile, 'commercial_default'),
      edition,
      brandName: this.toText(source.brandName, 'UIED 商业导航系统'),
      brandDomain: this.toText(source.brandDomain, ''),
      customerName: this.toText(source.customerName, ''),
      companyName: this.toText(source.companyName, ''),
      contactEmail: this.toText(source.contactEmail, ''),
      domainLimit: this.toInt(source.domainLimit, 1, 1, 9999),
      domainWhitelist: this.toStringList(source.domainWhitelist),
      includeSiteSettings: this.parseBoolean(source.includeSiteSettings, true),
      includeWebsiteCategories: this.parseBoolean(source.includeWebsiteCategories, true),
      includeWebsiteTags: this.parseBoolean(source.includeWebsiteTags, true),
      includeSampleWebsites: this.parseBoolean(source.includeSampleWebsites, true),
      includeArticleCategories: this.parseBoolean(source.includeArticleCategories, true),
      includeArticleTags: this.parseBoolean(source.includeArticleTags, true),
      includeSampleArticles: this.parseBoolean(source.includeSampleArticles, true),
      applyLicense: this.parseBoolean(source.applyLicense, true),
      resetFeatureOverrides: this.parseBoolean(source.resetFeatureOverrides, true),
      seedUsers: this.parseBoolean(source.seedUsers, true),
      featureOverrides: source.featureOverrides && typeof source.featureOverrides === 'object'
        ? source.featureOverrides
        : {},
    };
  }

  /**
   * 获取预置的商业版初始化模板
   */
  getPreset(options) {
    const year = new Date().getFullYear();
    const agreementBase = options.brandDomain || 'https://example.com';
    const siteName = options.brandName || 'UIED 商业导航系统';
    const siteTitle = `${siteName} - 设计与效率资源平台`;

    return {
      siteInfo: {
        siteName,
        siteTitle,
        siteDescription: '面向商业交付的可运营网址导航系统，支持版本矩阵、许可证与功能开关。',
        siteKeywords: 'UIED,导航系统,商业版,资源导航,设计工具',
        logo: '',
        favicon: '',
        icp: '',
        copyright: `© ${year} ${siteName} 版权所有`,
        contactEmail: options.contactEmail || '',
        analyticsCode: '',
      },
      settings: {
        homepageConfig: {
          heroBannerEnabled: true,
          heroBgType: 'default',
          heroBgValue: '',
          heroDisplayMode: 'search',
          heroShowStats: true,
          heroShowHotTags: true,
          bannerCardsEnabled: true,
          hotRecommendationsEnabled: true,
          hotRecommendationsTitle: '精选推荐',
          topAdEnabled: false,
          topAdCode: '',
          homeCarouselEnabled: true,
          homeCarouselSort: 10,
          homeRecommendationEnabled: true,
          homeRecommendationSort: 20,
        },
        pageGlobalConfig: {
          websiteClickMode: 'detail',
          hotRecommendationClickMode: 'detail',
          showDirectArrow: true,
          directArrowNewWindow: true,
          detailPageNewWindow: false,
          pageSize: 24,
        },
        searchConfig: {
          placeholder: '搜索站点名称、标签、分类',
          debounceDelay: 250,
          aiSearchEnabled: true,
          aiSearchBtnText: 'AI 搜索',
          highlightKeyword: true,
          resultsPerPage: 24,
        },
        articleConfig: {
          enabled: true,
          homeSectionEnabled: true,
          homeSectionTitle: '精选文章',
          homeSectionSubtitle: '聚合运营实战、产品增长与设计趋势',
          homeSectionLimit: 9,
          listPageTitle: '运营与产品专栏',
          listPageDescription: '持续更新可直接复用的运营方案与商业化经验',
          listPageCoverImage: '',
          commentsEnabled: true,
          topicsEnabled: true,
        },
        exitModalConfig: {
          enabled: true,
          title: '即将离开本站',
          description: '即将访问第三方站点，请注意链接安全与版权信息。',
          autoRedirect: true,
          countdown: 5,
          logo: '',
          showAgreementLinks: true,
          userAgreementText: '用户协议',
          userAgreementUrl: `${agreementBase}/user-agreement`,
          copyrightAgreementText: '版权协议',
          copyrightAgreementUrl: `${agreementBase}/copyright-agreement`,
        },
      },
      websiteCategories: [
        { name: 'UI 设计', slug: 'ui-design', icon: 'Figma', color: '#1677ff', description: '界面、组件与设计系统资源', sort: 10 },
        { name: 'AI 工具', slug: 'ai-tools', icon: 'AI', color: '#7c3aed', description: 'AI 生成、分析与协作工具', sort: 20 },
        { name: '灵感素材', slug: 'inspiration', icon: 'Design', color: '#f59e0b', description: '案例、素材与灵感聚合', sort: 30 },
        { name: '前端开发', slug: 'frontend-dev', icon: 'Code', color: '#10b981', description: '前端框架、组件与工程化', sort: 40 },
        { name: '效率协作', slug: 'productivity', icon: 'Tool', color: '#ef4444', description: '协作、项目管理与自动化', sort: 50 },
      ],
      websiteTags: [
        { name: '官方', slug: 'official', color: '#1677ff', description: '官方网站与一手入口', sort: 10 },
        { name: '免费', slug: 'free', color: '#16a34a', description: '可免费使用或有免费版本', sort: 20 },
        { name: '热门', slug: 'hot', color: '#f97316', description: '社区高频使用工具', sort: 30 },
        { name: 'AI', slug: 'ai', color: '#7c3aed', description: 'AI 能力相关资源', sort: 40 },
        { name: '设计', slug: 'design', color: '#0ea5e9', description: '设计类站点标签', sort: 50 },
      ],
      sampleWebsites: [
        {
          name: 'Figma',
          slug: 'figma',
          url: 'https://www.figma.com/',
          description: '协作式界面设计平台',
          categorySlug: 'ui-design',
          tagSlugs: [ 'official', 'design', 'hot' ],
          isFeatured: 1,
          isHot: 1,
          sort: 10,
        },
        {
          name: 'Dribbble',
          slug: 'dribbble',
          url: 'https://dribbble.com/',
          description: '设计作品展示与灵感社区',
          categorySlug: 'inspiration',
          tagSlugs: [ 'official', 'design', 'hot' ],
          isFeatured: 1,
          isHot: 1,
          sort: 20,
        },
        {
          name: 'ChatGPT',
          slug: 'chatgpt',
          url: 'https://chat.openai.com/',
          description: '通用 AI 对话与生产力助手',
          categorySlug: 'ai-tools',
          tagSlugs: [ 'official', 'ai', 'hot' ],
          isFeatured: 1,
          isHot: 1,
          sort: 30,
        },
        {
          name: 'GitHub',
          slug: 'github',
          url: 'https://github.com/',
          description: '代码托管与协作开发平台',
          categorySlug: 'frontend-dev',
          tagSlugs: [ 'official', 'hot' ],
          isFeatured: 0,
          isHot: 1,
          sort: 40,
        },
        {
          name: 'Notion',
          slug: 'notion',
          url: 'https://www.notion.so/',
          description: '团队知识库与项目协作工具',
          categorySlug: 'productivity',
          tagSlugs: [ 'official', 'hot' ],
          isFeatured: 0,
          isHot: 1,
          sort: 50,
        },
      ],
      articleCategories: [
        { name: '产品增长', slug: 'growth', description: '增长策略与数据实践', sortOrder: 10 },
        { name: '设计实践', slug: 'design-practice', description: '设计方法与案例复盘', sortOrder: 20 },
        { name: '运营策略', slug: 'operations', description: '内容与运营体系搭建', sortOrder: 30 },
      ],
      articleTags: [
        { name: 'SaaS', slug: 'saas', color: '#3b82f6', sortOrder: 10 },
        { name: '商业化', slug: 'commercialization', color: '#8b5cf6', sortOrder: 20 },
        { name: '运营', slug: 'ops', color: '#f59e0b', sortOrder: 30 },
        { name: '设计', slug: 'design', color: '#06b6d4', sortOrder: 40 },
      ],
      sampleArticles: [
        {
          title: '导航系统商业化上线清单',
          slug: 'delivery-checklist-for-nav-commercial',
          author: 'UIED Team',
          categorySlug: 'operations',
          tagSlugs: [ 'commercialization', 'ops' ],
          excerpt: '从授权、矩阵、交付到验收的一站式上线清单。',
          content: '# 导航系统商业化上线清单\n\n- 许可证策略\n- 功能矩阵\n- 交付包结构\n- 验收与运维',
          seoTitle: '导航系统商业化上线清单',
          seoDescription: '覆盖授权、版本矩阵与交付流程的商业版上线指南。',
        },
        {
          title: 'Free/Pro/Enterprise 能力矩阵实践',
          slug: 'feature-matrix-best-practice',
          author: 'UIED Team',
          categorySlug: 'growth',
          tagSlugs: [ 'saas', 'commercialization' ],
          excerpt: '如何用一套主干代码实现多版本售卖与可运营。',
          content: '# Free/Pro/Enterprise 能力矩阵实践\n\n建议统一走 hasFeature 判定，避免分支代码漂移。',
          seoTitle: 'Free/Pro/Enterprise 能力矩阵实践',
          seoDescription: '主干一套代码 + 能力开关 的落地经验。',
        },
        {
          title: '面向交付的后台可配置设计',
          slug: 'configurable-backend-for-delivery',
          author: 'UIED Team',
          categorySlug: 'design-practice',
          tagSlugs: [ 'design', 'ops' ],
          excerpt: '用配置化思路替代硬编码，提升售卖版复用效率。',
          content: '# 面向交付的后台可配置设计\n\n聚焦站点设置、弹窗协议、文章模块与运营位。',
          seoTitle: '面向交付的后台可配置设计',
          seoDescription: '通过后台配置化实现高复用交付。',
        },
      ],
    };
  }

  /**
   * 获取表字段缓存，避免重复查询信息架构表
   */
  async getTableColumns(tableName) {
    if (!this._tableColumnCache) {
      this._tableColumnCache = new Map();
    }
    if (this._tableColumnCache.has(tableName)) {
      return this._tableColumnCache.get(tableName);
    }
    const rows = await this.app.model.query(
      `SELECT COLUMN_NAME
       FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = ?`,
      {
        replacements: [ tableName ],
        type: this.app.Sequelize.QueryTypes.SELECT,
      }
    );
    const set = new Set((rows || []).map(item => String(item?.COLUMN_NAME || '')));
    this._tableColumnCache.set(tableName, set);
    return set;
  }

  /**
   * 解析文章表分类字段（兼容不同命名）
   */
  async resolveArticleCategoryColumn() {
    if (this._articleCategoryColumn !== undefined) {
      return this._articleCategoryColumn;
    }
    const rows = await this.app.model.query(
      `SELECT COLUMN_NAME
       FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'uied_article'
         AND COLUMN_NAME IN ('category_id', 'categoryId', 'cate_id')`,
      { type: this.app.Sequelize.QueryTypes.SELECT }
    );
    const available = new Set((rows || []).map(item => String(item?.COLUMN_NAME || '')));
    if (available.has('category_id')) {
      this._articleCategoryColumn = 'category_id';
    } else if (available.has('categoryId')) {
      this._articleCategoryColumn = 'categoryId';
    } else if (available.has('cate_id')) {
      this._articleCategoryColumn = 'cate_id';
    } else {
      this._articleCategoryColumn = '';
    }
    return this._articleCategoryColumn;
  }

  /**
   * 按 slug 执行通用 upsert（支持软删除恢复）
   */
  async upsertBySlug(tableName, rowData = {}) {
    const { app } = this;
    const columns = await this.getTableColumns(tableName);
    const nowTs = Math.floor(Date.now() / 1000);
    const nowDate = new Date();
    const slug = this.toText(rowData.slug, '');
    if (!slug) {
      throw new Error(`表 ${tableName} 缺少 slug，无法 upsert`);
    }

    const [ existing ] = await app.model.query(
      `SELECT id FROM \`${tableName}\` WHERE \`slug\` = ? LIMIT 1`,
      {
        replacements: [ slug ],
        type: app.Sequelize.QueryTypes.SELECT,
      }
    );

    if (existing && existing.id) {
      const updateData = { ...rowData };
      if (columns.has('is_delete')) updateData.is_delete = 0;
      if (columns.has('delete_time')) updateData.delete_time = 0;
      if (columns.has('update_time')) updateData.update_time = nowTs;
      if (columns.has('updatedAt')) updateData.updatedAt = nowDate;

      const setFragments = [];
      const replacements = [];
      Object.keys(updateData).forEach(key => {
        if (!columns.has(key)) return;
        setFragments.push(`\`${key}\` = ?`);
        replacements.push(updateData[key]);
      });
      if (setFragments.length) {
        replacements.push(Number(existing.id));
        await app.model.query(
          `UPDATE \`${tableName}\` SET ${setFragments.join(', ')} WHERE id = ?`,
          {
            replacements,
            type: app.Sequelize.QueryTypes.UPDATE,
          }
        );
      }
      return { id: Number(existing.id), action: 'updated' };
    }

    const insertData = { ...rowData };
    if (columns.has('is_delete')) insertData.is_delete = 0;
    if (columns.has('create_time')) insertData.create_time = nowTs;
    if (columns.has('update_time')) insertData.update_time = nowTs;
    if (columns.has('delete_time')) insertData.delete_time = 0;
    if (columns.has('createdAt')) insertData.createdAt = nowDate;
    if (columns.has('updatedAt')) insertData.updatedAt = nowDate;

    const insertKeys = Object.keys(insertData).filter(key => columns.has(key));
    const placeholders = insertKeys.map(() => '?').join(', ');
    const replacements = insertKeys.map(key => insertData[key]);

    const [ insertId ] = await app.model.query(
      `INSERT INTO \`${tableName}\` (${insertKeys.map(key => `\`${key}\``).join(', ')})
       VALUES (${placeholders})`,
      {
        replacements,
        type: app.Sequelize.QueryTypes.INSERT,
      }
    );
    return { id: Number(insertId || 0), action: 'created' };
  }

  /**
   * 批量 upsert 网站分类
   */
  async upsertWebsiteCategories(rows = []) {
    const slugIdMap = new Map();
    const slugNameMap = new Map();
    let created = 0;
    let updated = 0;
    for (const item of rows) {
      const result = await this.upsertBySlug('uied_category', {
        name: this.toText(item.name, ''),
        slug: this.toText(item.slug, ''),
        icon: this.toText(item.icon, ''),
        color: this.toText(item.color, '#1890ff'),
        description: this.toText(item.description, ''),
        seo_title: this.toText(item.seoTitle || item.name, ''),
        seo_description: this.toText(item.seoDescription || item.description, ''),
        seo_keywords: this.toText(item.seoKeywords || item.name, ''),
        parent_id: this.toInt(item.parentId, 0) || null,
        sort: this.toInt(item.sort, 0),
        is_show: this.parseBoolean(item.is_show !== undefined ? item.is_show : item.isActive, true) ? 1 : 0,
      });
      if (result.action === 'created') created += 1;
      if (result.action === 'updated') updated += 1;
      slugIdMap.set(item.slug, result.id);
      slugNameMap.set(item.slug, item.name);
    }
    return { created, updated, slugIdMap, slugNameMap };
  }

  /**
   * 批量 upsert 网站标签
   */
  async upsertWebsiteTags(rows = []) {
    const slugIdMap = new Map();
    const slugNameMap = new Map();
    let created = 0;
    let updated = 0;
    for (const item of rows) {
      const result = await this.upsertBySlug('uied_website_tag', {
        name: this.toText(item.name, ''),
        slug: this.toText(item.slug, ''),
        color: this.toText(item.color, '#1890ff'),
        description: this.toText(item.description, ''),
        seo_title: this.toText(item.seoTitle || item.name, ''),
        seo_description: this.toText(item.seoDescription || item.description, ''),
        seo_keywords: this.toText(item.seoKeywords || item.name, ''),
        sort: this.toInt(item.sort, 0),
      });
      if (result.action === 'created') created += 1;
      if (result.action === 'updated') updated += 1;
      slugIdMap.set(item.slug, result.id);
      slugNameMap.set(item.slug, item.name);
    }
    return { created, updated, slugIdMap, slugNameMap };
  }

  /**
   * 批量 upsert 文章分类
   */
  async upsertArticleCategories(rows = []) {
    const slugInfoMap = new Map();
    let created = 0;
    let updated = 0;
    for (const item of rows) {
      const result = await this.upsertBySlug('uied_article_category', {
        name: this.toText(item.name, ''),
        slug: this.toText(item.slug, ''),
        description: this.toText(item.description, ''),
        sort_order: this.toInt(item.sortOrder, 0),
      });
      if (result.action === 'created') created += 1;
      if (result.action === 'updated') updated += 1;
      slugInfoMap.set(item.slug, {
        id: result.id,
        name: item.name,
      });
    }
    return { created, updated, slugInfoMap };
  }

  /**
   * 批量 upsert 文章标签
   */
  async upsertArticleTags(rows = []) {
    const slugInfoMap = new Map();
    let created = 0;
    let updated = 0;
    for (const item of rows) {
      const result = await this.upsertBySlug('uied_article_tag', {
        name: this.toText(item.name, ''),
        slug: this.toText(item.slug, ''),
        color: this.toText(item.color, '#1890ff'),
        sort_order: this.toInt(item.sortOrder, 0),
      });
      if (result.action === 'created') created += 1;
      if (result.action === 'updated') updated += 1;
      slugInfoMap.set(item.slug, {
        id: result.id,
        name: item.name,
      });
    }
    return { created, updated, slugInfoMap };
  }

  /**
   * 为网站重建标签关联
   */
  async setWebsiteTagRelations(websiteId, tagIds = []) {
    const { app } = this;
    await app.model.query(
      'DELETE FROM uied_website_tag_relation WHERE website_id = ?',
      {
        replacements: [ websiteId ],
        type: app.Sequelize.QueryTypes.DELETE,
      }
    );
    if (!Array.isArray(tagIds) || tagIds.length === 0) return;
    const placeholders = tagIds.map(() => '(?, ?)').join(', ');
    const replacements = [];
    tagIds.forEach(tagId => {
      replacements.push(Number(websiteId), Number(tagId));
    });
    await app.model.query(
      `INSERT INTO uied_website_tag_relation (website_id, tag_id) VALUES ${placeholders}`,
      {
        replacements,
        type: app.Sequelize.QueryTypes.INSERT,
      }
    );
  }

  /**
   * 为文章重建标签关联（兼容 createdAt/updatedAt 字段）
   */
  async setArticleTagRelations(articleId, tagIds = []) {
    const { app } = this;
    const nowTs = Math.floor(Date.now() / 1000);
    const nowDate = new Date();
    const columns = await this.getTableColumns('uied_article_tag_relation');
    await app.model.query(
      'DELETE FROM uied_article_tag_relation WHERE article_id = ?',
      {
        replacements: [ articleId ],
        type: app.Sequelize.QueryTypes.DELETE,
      }
    );
    if (!Array.isArray(tagIds) || tagIds.length === 0) return;

    const availableColumns = [ 'article_id', 'tag_id', 'create_time', 'createdAt', 'updatedAt' ]
      .filter(key => columns.has(key));
    if (!availableColumns.includes('article_id') || !availableColumns.includes('tag_id')) return;

    const rowPlaceholder = `(${availableColumns.map(() => '?').join(', ')})`;
    const placeholders = tagIds.map(() => rowPlaceholder).join(', ');
    const replacements = [];
    tagIds.forEach(tagId => {
      availableColumns.forEach(column => {
        if (column === 'article_id') replacements.push(Number(articleId));
        else if (column === 'tag_id') replacements.push(Number(tagId));
        else if (column === 'create_time') replacements.push(nowTs);
        else if (column === 'createdAt') replacements.push(nowDate);
        else if (column === 'updatedAt') replacements.push(nowDate);
      });
    });

    await app.model.query(
      `INSERT INTO uied_article_tag_relation (${availableColumns.map(key => `\`${key}\``).join(', ')})
       VALUES ${placeholders}`,
      {
        replacements,
        type: app.Sequelize.QueryTypes.INSERT,
      }
    );
  }

  /**
   * 批量 upsert 示例网站并绑定标签
   */
  async upsertSampleWebsites(rows = [], websiteCategoryMap, websiteTagMap) {
    const { app } = this;
    const nowTs = Math.floor(Date.now() / 1000);
    let created = 0;
    let updated = 0;

    for (const item of rows) {
      let categoryId = Number(websiteCategoryMap.get(item.categorySlug) || 0);
      if (!categoryId) {
        const [ categoryRow ] = await app.model.query(
          'SELECT id FROM uied_category WHERE slug = ? AND is_delete = 0 LIMIT 1',
          {
            replacements: [ item.categorySlug ],
            type: app.Sequelize.QueryTypes.SELECT,
          }
        );
        categoryId = Number(categoryRow?.id || 0);
      }
      if (!categoryId) continue;
      const tagIds = [];
      for (const slug of (item.tagSlugs || [])) {
        let tagId = Number(websiteTagMap.get(slug) || 0);
        if (!tagId) {
          const [ tagRow ] = await app.model.query(
            'SELECT id FROM uied_website_tag WHERE slug = ? AND is_delete = 0 LIMIT 1',
            {
              replacements: [ slug ],
              type: app.Sequelize.QueryTypes.SELECT,
            }
          );
          tagId = Number(tagRow?.id || 0);
        }
        if (tagId > 0) tagIds.push(tagId);
      }
      const tagNames = (item.tagSlugs || []).map(slug => slug).join(',');

      const [ existing ] = await app.model.query(
        'SELECT id FROM uied_website WHERE slug = ? LIMIT 1',
        {
          replacements: [ item.slug ],
          type: app.Sequelize.QueryTypes.SELECT,
        }
      );

      if (existing && existing.id) {
        await app.model.query(
          `UPDATE uied_website
           SET name = ?,
               description = ?,
               url = ?,
               category_id = ?,
               is_featured = ?,
               is_hot = ?,
               sort = ?,
               tags = ?,
               seo_title = ?,
               seo_description = ?,
               status = 'active',
               is_delete = 0,
               delete_time = 0,
               update_time = ?
           WHERE id = ?`,
          {
            replacements: [
              this.toText(item.name, ''),
              this.toText(item.description, ''),
              this.toText(item.url, ''),
              Number(categoryId),
              this.toInt(item.isFeatured, 0),
              this.toInt(item.isHot, 0),
              this.toInt(item.sort, 0),
              tagNames,
              this.toText(item.name, ''),
              this.toText(item.description, ''),
              nowTs,
              Number(existing.id),
            ],
            type: app.Sequelize.QueryTypes.UPDATE,
          }
        );
        await this.setWebsiteTagRelations(Number(existing.id), tagIds);
        updated += 1;
      } else {
        const [ websiteId ] = await app.model.query(
          `INSERT INTO uied_website
           (name, slug, description, url, icon_url, category_id, is_new, is_featured, is_hot, is_pinned, tags, sort, click_count,
            seo_title, seo_description, seo_keywords, detail_content, thumbnail, visit_btn_text, status, is_delete, create_time, update_time, delete_time)
           VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, 0, ?, ?, 0, ?, ?, ?, ?, ?, ?, 'active', 0, ?, ?, 0)`,
          {
            replacements: [
              this.toText(item.name, ''),
              this.toText(item.slug, ''),
              this.toText(item.description, ''),
              this.toText(item.url, ''),
              '',
              Number(categoryId),
              this.toInt(item.isFeatured, 0),
              this.toInt(item.isHot, 0),
              tagNames,
              this.toInt(item.sort, 0),
              this.toText(item.name, ''),
              this.toText(item.description, ''),
              this.toText(item.tagSlugs ? item.tagSlugs.join(',') : '', ''),
              this.toText(item.description, ''),
              '',
              '访问网站',
              nowTs,
              nowTs,
            ],
            type: app.Sequelize.QueryTypes.INSERT,
          }
        );
        await this.setWebsiteTagRelations(Number(websiteId || 0), tagIds);
        created += 1;
      }
    }

    return { created, updated };
  }

  /**
   * 批量 upsert 示例文章并绑定标签
   */
  async upsertSampleArticles(rows = [], articleCategoryMap, articleTagMap) {
    const { app } = this;
    const nowTs = Math.floor(Date.now() / 1000);
    const articleCategoryColumn = await this.resolveArticleCategoryColumn();
    let created = 0;
    let updated = 0;

    for (const item of rows) {
      let categoryInfo = articleCategoryMap.get(item.categorySlug) || null;
      if (!categoryInfo || !categoryInfo.id) {
        const [ categoryRow ] = await app.model.query(
          'SELECT id, name FROM uied_article_category WHERE slug = ? AND is_delete = 0 LIMIT 1',
          {
            replacements: [ item.categorySlug ],
            type: app.Sequelize.QueryTypes.SELECT,
          }
        );
        if (categoryRow && categoryRow.id) {
          categoryInfo = {
            id: Number(categoryRow.id),
            name: String(categoryRow.name || ''),
          };
        }
      }
      const tagIds = [];
      for (const slug of (item.tagSlugs || [])) {
        let tagId = Number((articleTagMap.get(slug) || {}).id || 0);
        if (!tagId) {
          const [ tagRow ] = await app.model.query(
            'SELECT id FROM uied_article_tag WHERE slug = ? AND is_delete = 0 LIMIT 1',
            {
              replacements: [ slug ],
              type: app.Sequelize.QueryTypes.SELECT,
            }
          );
          tagId = Number(tagRow?.id || 0);
        }
        if (tagId > 0) tagIds.push(tagId);
      }
      const categoryName = categoryInfo ? this.toText(categoryInfo.name, '未分类') : '未分类';
      const [ existing ] = await app.model.query(
        'SELECT id, published_at FROM uied_article WHERE slug = ? LIMIT 1',
        {
          replacements: [ item.slug ],
          type: app.Sequelize.QueryTypes.SELECT,
        }
      );

      if (existing && existing.id) {
        const updateFragments = [
          'title = ?',
          'content = ?',
          'excerpt = ?',
          'cover_image = ?',
          'author = ?',
          'category = ?',
          'status = \'published\'',
          'seo_title = ?',
          'seo_description = ?',
          'published_at = ?',
          'is_delete = 0',
          'delete_time = 0',
          'update_time = ?',
        ];
        const updateReplacements = [
          this.toText(item.title, ''),
          this.toText(item.content, ''),
          this.toText(item.excerpt, ''),
          '',
          this.toText(item.author, 'UIED Team'),
          categoryName,
          this.toText(item.seoTitle || item.title, ''),
          this.toText(item.seoDescription || item.excerpt, ''),
          Number(existing.published_at || nowTs),
          nowTs,
        ];
        if (articleCategoryColumn) {
          updateFragments.splice(6, 0, `\`${articleCategoryColumn}\` = ?`);
          updateReplacements.splice(6, 0, Number(categoryInfo?.id || 0) || null);
        }
        updateReplacements.push(Number(existing.id));
        await app.model.query(
          `UPDATE uied_article
           SET ${updateFragments.join(', ')}
           WHERE id = ?`,
          {
            replacements: updateReplacements,
            type: app.Sequelize.QueryTypes.UPDATE,
          }
        );
        await this.setArticleTagRelations(Number(existing.id), tagIds);
        updated += 1;
      } else {
        const insertColumns = [
          'old_id',
          'title',
          'content',
          'excerpt',
          'cover_image',
          'author',
          'category',
          'slug',
          'status',
          'view_count',
          'seo_title',
          'seo_description',
          'published_at',
          'is_delete',
          'create_time',
          'update_time',
          'delete_time',
        ];
        const insertValues = [
          '',
          this.toText(item.title, ''),
          this.toText(item.content, ''),
          this.toText(item.excerpt, ''),
          '',
          this.toText(item.author, 'UIED Team'),
          categoryName,
          this.toText(item.slug, ''),
          'published',
          0,
          this.toText(item.seoTitle || item.title, ''),
          this.toText(item.seoDescription || item.excerpt, ''),
          nowTs,
          0,
          nowTs,
          nowTs,
          0,
        ];
        if (articleCategoryColumn) {
          insertColumns.splice(7, 0, `\`${articleCategoryColumn}\``);
          insertValues.splice(7, 0, Number(categoryInfo?.id || 0) || null);
        }

        const [ articleId ] = await app.model.query(
          `INSERT INTO uied_article (${insertColumns.join(', ')})
           VALUES (${insertColumns.map(() => '?').join(', ')})`,
          {
            replacements: insertValues,
            type: app.Sequelize.QueryTypes.INSERT,
          }
        );
        await this.setArticleTagRelations(Number(articleId || 0), tagIds);
        created += 1;
      }
    }

    return { created, updated };
  }

  /**
   * 按软删除规则查询指定表
   */
  async selectRowsWithSoftDelete(tableName, { orderBy = 'id ASC', includeDeleted = false } = {}) {
    const columns = await this.getTableColumns(tableName);
    let whereClause = '1=1';
    if (!includeDeleted && columns.has('is_delete')) {
      whereClause = 'is_delete = 0';
    }
    return this.app.model.query(
      `SELECT * FROM \`${tableName}\`
       WHERE ${whereClause}
       ORDER BY ${orderBy}`,
      { type: this.app.Sequelize.QueryTypes.SELECT }
    );
  }

  /**
   * 导出客户交付包（站点配置 + 分类标签 + license + feature）
   */
  async exportCustomerPackage(input = {}) {
    const options = {
      includeWebsiteData: this.parseBoolean(input.includeWebsiteData, false),
      includeArticleData: this.parseBoolean(input.includeArticleData, false),
    };
    const settingKeys = [
      'homepageConfig',
      'pageGlobalConfig',
      'searchConfig',
      'appearanceConfig',
      'cardStyleConfig',
      'sidebarConfig',
      'exitModalConfig',
      'detailPageConfig',
      'articleConfig',
      'articleTopicsConfig',
    ];
    const settings = {};
    for (const key of settingKeys) {
      settings[key] = await this.ctx.service.uied.setting.get(key);
    }
    const siteInfo = await this.ctx.service.uied.setting.getSiteInfo();
    const websiteCategories = await this.selectRowsWithSoftDelete('uied_category', { orderBy: 'id ASC' });
    const websiteTags = await this.selectRowsWithSoftDelete('uied_website_tag', { orderBy: 'id ASC' });
    const articleCategories = await this.selectRowsWithSoftDelete('uied_article_category', { orderBy: 'id ASC' });
    const articleTags = await this.selectRowsWithSoftDelete('uied_article_tag', { orderBy: 'id ASC' });
    const licenseInfo = await this.ctx.service.uied.licenseCenter.getLicenseInfo();
    const featureOverrides = await this.ctx.service.uied.licenseCenter.getFeatureOverrides();
    const commercialMode = await this.ctx.service.uied.licenseCenter.getCommercialMode();
    const packageData = {
      meta: {
        exportedAt: new Date().toISOString(),
        profile: 'commercial_delivery_package',
        edition: String(licenseInfo.effectiveEdition || 'free'),
        includes: {
          siteInfo: true,
          settings: true,
          websiteCategories: true,
          websiteTags: true,
          articleCategories: true,
          articleTags: true,
          license: true,
          featureOverrides: true,
          commercialMode: true,
          websiteData: options.includeWebsiteData,
          articleData: options.includeArticleData,
        },
      },
      siteInfo: siteInfo || {},
      settings,
      website: {
        categories: websiteCategories,
        tags: websiteTags,
      },
      article: {
        categories: articleCategories,
        tags: articleTags,
      },
      license: {
        edition: licenseInfo.edition,
        status: licenseInfo.status,
        rawStatus: licenseInfo.rawStatus,
        licenseKey: licenseInfo.licenseKey,
        customerName: licenseInfo.customerName,
        companyName: licenseInfo.companyName,
        contactEmail: licenseInfo.contactEmail,
        domainLimit: licenseInfo.domainLimit,
        domainWhitelist: licenseInfo.domainWhitelist,
        issuedAt: licenseInfo.issuedAt,
        expiresAt: licenseInfo.expiresAt,
        note: licenseInfo.note,
        signVersion: licenseInfo.signVersion,
        signature: licenseInfo.signature,
      },
      featureOverrides,
      commercialMode,
    };

    if (options.includeWebsiteData) {
      packageData.website.websites = await this.selectRowsWithSoftDelete('uied_website', { orderBy: 'id ASC' });
    }
    if (options.includeArticleData) {
      packageData.article.articles = await this.selectRowsWithSoftDelete('uied_article', { orderBy: 'id ASC' });
    }

    return packageData;
  }

  /**
   * 获取初始化预览信息（不落库）
   */
  async preview(input = {}) {
    const options = this.normalizeOptions(input);
    const preset = this.getPreset(options);
    return {
      profile: options.profile,
      edition: options.edition,
      modules: {
        siteSettings: options.includeSiteSettings,
        websiteCategories: options.includeWebsiteCategories,
        websiteTags: options.includeWebsiteTags,
        sampleWebsites: options.includeSampleWebsites,
        articleCategories: options.includeArticleCategories,
        articleTags: options.includeArticleTags,
        sampleArticles: options.includeSampleArticles,
        license: options.applyLicense,
        seedUsers: options.seedUsers,
      },
      counts: {
        websiteCategories: preset.websiteCategories.length,
        websiteTags: preset.websiteTags.length,
        sampleWebsites: preset.sampleWebsites.length,
        articleCategories: preset.articleCategories.length,
        articleTags: preset.articleTags.length,
        sampleArticles: preset.sampleArticles.length,
      },
      examples: {
        websiteCategories: preset.websiteCategories.slice(0, 3).map(item => item.name),
        websiteTags: preset.websiteTags.slice(0, 3).map(item => item.name),
        sampleWebsites: preset.sampleWebsites.slice(0, 3).map(item => item.name),
        sampleArticles: preset.sampleArticles.slice(0, 3).map(item => item.title),
      },
    };
  }

  /**
   * 执行一键初始化导入
   */
  async execute(input = {}) {
    const options = this.normalizeOptions(input);
    const preset = this.getPreset(options);
    const summary = {
      siteSettings: { saved: false },
      websiteCategories: { created: 0, updated: 0 },
      websiteTags: { created: 0, updated: 0 },
      sampleWebsites: { created: 0, updated: 0 },
      articleCategories: { created: 0, updated: 0 },
      articleTags: { created: 0, updated: 0 },
      sampleArticles: { created: 0, updated: 0 },
      license: { applied: false },
      users: { seeded: false, total: 0 },
    };

    let websiteCategoryIdMap = new Map();
    let websiteTagIdMap = new Map();
    let articleCategoryInfoMap = new Map();
    let articleTagInfoMap = new Map();

    if (options.includeSiteSettings) {
      await this.ctx.service.uied.setting.saveSiteInfo(preset.siteInfo);
      await this.ctx.service.uied.setting.save(preset.settings);
      summary.siteSettings.saved = true;
    }

    if (options.includeWebsiteCategories) {
      const categoryResult = await this.upsertWebsiteCategories(preset.websiteCategories);
      summary.websiteCategories = { created: categoryResult.created, updated: categoryResult.updated };
      websiteCategoryIdMap = categoryResult.slugIdMap;
    }

    if (options.includeWebsiteTags) {
      const websiteTagResult = await this.upsertWebsiteTags(preset.websiteTags);
      summary.websiteTags = { created: websiteTagResult.created, updated: websiteTagResult.updated };
      websiteTagIdMap = websiteTagResult.slugIdMap;
    }

    if (options.includeSampleWebsites) {
      const websiteResult = await this.upsertSampleWebsites(
        preset.sampleWebsites,
        websiteCategoryIdMap,
        websiteTagIdMap
      );
      summary.sampleWebsites = websiteResult;
    }

    if (options.includeArticleCategories) {
      const articleCategoryResult = await this.upsertArticleCategories(preset.articleCategories);
      summary.articleCategories = {
        created: articleCategoryResult.created,
        updated: articleCategoryResult.updated,
      };
      articleCategoryInfoMap = articleCategoryResult.slugInfoMap;
    }

    if (options.includeArticleTags) {
      const articleTagResult = await this.upsertArticleTags(preset.articleTags);
      summary.articleTags = {
        created: articleTagResult.created,
        updated: articleTagResult.updated,
      };
      articleTagInfoMap = articleTagResult.slugInfoMap;
    }

    if (options.includeSampleArticles) {
      const articleResult = await this.upsertSampleArticles(
        preset.sampleArticles,
        articleCategoryInfoMap,
        articleTagInfoMap
      );
      summary.sampleArticles = articleResult;
    }

    if (options.applyLicense) {
      const nowTs = Math.floor(Date.now() / 1000);
      const licenseInfo = await this.ctx.service.uied.licenseCenter.saveLicenseInfo({
        edition: options.edition,
        status: 'active',
        licenseKey: `UIED-${options.edition.toUpperCase()}-${String(nowTs).slice(-8)}`,
        customerName: options.customerName,
        companyName: options.companyName,
        contactEmail: options.contactEmail,
        domainLimit: options.domainLimit,
        domainWhitelist: options.domainWhitelist,
        issuedAt: nowTs,
        expiresAt: 0,
        note: '交付初始化向导自动生成',
      });
      if (options.resetFeatureOverrides) {
        await this.ctx.service.uied.licenseCenter.saveFeatureOverrides({});
      } else if (options.featureOverrides && Object.keys(options.featureOverrides).length > 0) {
        await this.ctx.service.uied.licenseCenter.saveFeatureOverrides(options.featureOverrides);
      }
      summary.license = {
        applied: true,
        edition: licenseInfo.effectiveEdition,
        status: licenseInfo.status,
      };
    }

    if (options.seedUsers) {
      const userSeedResult = await this.ctx.service.user.seedTestUsers();
      summary.users = {
        seeded: true,
        total: Number(userSeedResult?.total || 0),
      };
    }

    return {
      profile: options.profile,
      edition: options.edition,
      summary,
    };
  }
}

module.exports = DeliveryInitService;
