/**
 * @file service/uied/topicFactory.js
 * @description UIED 专题页工厂服务
 * @author UIED技术团队
 * @copyright Tomda (https://www.tomda.top)
 * @copyright UIED技术团队 (https://fsuied.com)
 * @createDate 2026-02-21
 */

'use strict';

const Service = require('egg').Service;

const TOPIC_TEMPLATE_TABLE = 'uied_topic_template';

class TopicFactoryService extends Service {
  /**
   * 确保专题模板表存在
   */
  async ensureTables() {
    const { app } = this;
    const cacheKey = '__uiedTopicFactoryTablesReady__';
    if (app[cacheKey] === true) return;

    await app.model.query(
      `CREATE TABLE IF NOT EXISTS \`${TOPIC_TEMPLATE_TABLE}\` (
        \`id\` int unsigned NOT NULL AUTO_INCREMENT,
        \`template_key\` varchar(64) NOT NULL DEFAULT '',
        \`template_name\` varchar(128) NOT NULL DEFAULT '',
        \`scene\` varchar(64) NOT NULL DEFAULT 'topic',
        \`description\` varchar(255) NOT NULL DEFAULT '',
        \`default_slug\` varchar(100) NOT NULL DEFAULT '',
        \`icon\` varchar(100) NOT NULL DEFAULT '',
        \`theme_color\` varchar(20) DEFAULT NULL,
        \`page_config_json\` text,
        \`category_slug_list\` text,
        \`is_enabled\` tinyint unsigned NOT NULL DEFAULT 1,
        \`sort\` int unsigned NOT NULL DEFAULT 0,
        \`extra_json\` text,
        \`is_delete\` tinyint unsigned NOT NULL DEFAULT 0,
        \`create_time\` int unsigned NOT NULL DEFAULT 0,
        \`update_time\` int unsigned NOT NULL DEFAULT 0,
        \`delete_time\` int unsigned NOT NULL DEFAULT 0,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`uk_template_key\` (\`template_key\`),
        KEY \`idx_enabled_sort\` (\`is_enabled\`,\`sort\`),
        KEY \`idx_delete\` (\`is_delete\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='专题页模板表'`,
      { type: app.Sequelize.QueryTypes.RAW }
    );

    app[cacheKey] = true;
  }

  /**
   * 获取默认模板
   */
  getDefaultTemplates() {
    return [
      {
        templateKey: 'ai-tools-directory',
        templateName: 'AI工具大全',
        scene: 'tool-directory',
        description: '适合 AI 工具收录与推荐运营',
        defaultSlug: 'ai-tools',
        icon: 'MagicStick',
        themeColor: '#7C3AED',
        sort: 10,
        isEnabled: true,
        categorySlugs: [ 'ai-xiezuo', 'ai-shengtupicture', 'ai-tupian', 'ai-shipin', 'ai-yinpin', 'ai-bangong', 'ai-sheji', 'ai-kaifa' ],
        pageConfig: {
          type: 'topic',
          searchEnabled: true,
          showHotRecommendations: true,
          showCategories: true,
          showSidebar: true,
          heroTitle: '发现高效 AI 工具集',
          heroHighlightText: 'AI Tools',
          heroSubtitle: '覆盖写作、生图、视频、开发、办公全链路能力。',
          searchPlaceholder: '搜索 AI 工具、模型、场景',
          hotSearchTags: [ 'AI写作', 'AI生图', 'AI视频', 'AI开发' ],
          heroBgType: 'gradient',
          heroBgValue: 'linear-gradient(135deg,#7C3AED 0%,#4F46E5 100%)',
        },
      },
      {
        templateKey: 'design-tools-directory',
        templateName: '设计工具大全',
        scene: 'tool-directory',
        description: '适合设计资源、灵感与插件导航',
        defaultSlug: 'design-tools',
        icon: 'Brush',
        themeColor: '#0EA5E9',
        sort: 20,
        isEnabled: true,
        categorySlugs: [ 'design-common-tools', 'design-inspiration', 'design-font', 'design-print', 'design-graphic', 'design-brand', 'design-photo' ],
        pageConfig: {
          type: 'topic',
          searchEnabled: true,
          showHotRecommendations: true,
          showCategories: true,
          showSidebar: true,
          heroTitle: '设计师必备工具导航',
          heroHighlightText: 'Design Hub',
          heroSubtitle: '从灵感、字体到插件素材，一站式检索设计效率工具。',
          searchPlaceholder: '搜索设计工具、字体、素材站',
          hotSearchTags: [ 'Figma', '字体下载', '图片素材', '配色工具' ],
          heroBgType: 'gradient',
          heroBgValue: 'linear-gradient(135deg,#0EA5E9 0%,#0284C7 100%)',
        },
      },
      {
        templateKey: 'cross-border-tools-directory',
        templateName: '跨境工具大全',
        scene: 'business-directory',
        description: '适合跨境电商与出海业务运营',
        defaultSlug: 'cross-border-tools',
        icon: 'Promotion',
        themeColor: '#F97316',
        sort: 30,
        isEnabled: true,
        categorySlugs: [ 'ai-dianshang', 'design-common-tools' ],
        pageConfig: {
          type: 'topic',
          searchEnabled: true,
          showHotRecommendations: true,
          showCategories: true,
          showSidebar: true,
          heroTitle: '跨境出海工具总览',
          heroHighlightText: 'Global Growth',
          heroSubtitle: '覆盖选品、投放、素材、自动化运营能力。',
          searchPlaceholder: '搜索选品、投放、客服、物流工具',
          hotSearchTags: [ '选品工具', '广告投放', '独立站', '跨境物流' ],
          heroBgType: 'gradient',
          heroBgValue: 'linear-gradient(135deg,#F97316 0%,#EA580C 100%)',
        },
      },
    ];
  }

  /**
   * 规范化布尔值
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
   * 规范化正整数
   */
  parsePositiveInt(value, fallback = 0, min = 1, max = 100000) {
    const parsed = Number.parseInt(String(value || ''), 10);
    if (!Number.isInteger(parsed) || parsed <= 0) return fallback;
    return Math.max(min, Math.min(max, parsed));
  }

  /**
   * 解析字符串数组
   */
  toStringList(value) {
    if (Array.isArray(value)) {
      return value.map(item => String(item || '').trim()).filter(Boolean);
    }
    const text = String(value || '').trim();
    if (!text) return [];
    return text
      .split(/[，,\n|]+/)
      .map(item => item.trim())
      .filter(Boolean);
  }

  /**
   * 规范化模板对象
   */
  normalizeTemplate(payload = {}, index = 0) {
    const source = payload && typeof payload === 'object' ? payload : {};
    const defaults = this.getDefaultTemplates()[index] || {};
    const templateKey = String(source.templateKey || source.key || defaults.templateKey || '').trim();
    const templateName = String(source.templateName || source.name || defaults.templateName || templateKey).trim() || templateKey;

    return {
      id: this.parsePositiveInt(source.id, 0, 1, 99999999),
      templateKey,
      templateName,
      scene: String(source.scene || defaults.scene || 'topic').trim() || 'topic',
      description: String(source.description || defaults.description || '').trim(),
      defaultSlug: String(source.defaultSlug || defaults.defaultSlug || '').trim(),
      icon: String(source.icon || defaults.icon || '').trim(),
      themeColor: String(source.themeColor || defaults.themeColor || '').trim() || null,
      pageConfig: source.pageConfig && typeof source.pageConfig === 'object' ? source.pageConfig : (defaults.pageConfig || {}),
      categorySlugs: this.toStringList(source.categorySlugs || defaults.categorySlugs || []),
      isEnabled: this.parseBoolean(source.isEnabled, defaults.isEnabled !== false),
      sort: this.parsePositiveInt(source.sort, defaults.sort || ((index + 1) * 10), 1, 100000),
      extra: source.extra && typeof source.extra === 'object' ? source.extra : {},
    };
  }

  /**
   * 初始化默认模板
   */
  async initDefaults() {
    const { app } = this;
    const now = Math.floor(Date.now() / 1000);
    const defaults = this.getDefaultTemplates();

    for (let index = 0; index < defaults.length; index++) {
      const row = this.normalizeTemplate(defaults[index], index);
      await app.model.query(
        `INSERT INTO ${TOPIC_TEMPLATE_TABLE}
         (template_key, template_name, scene, description, default_slug, icon, theme_color,
          page_config_json, category_slug_list, is_enabled, sort, extra_json,
          is_delete, create_time, update_time, delete_time)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, 0)
         ON DUPLICATE KEY UPDATE
           template_name = VALUES(template_name),
           scene = VALUES(scene),
           description = VALUES(description),
           default_slug = VALUES(default_slug),
           icon = VALUES(icon),
           theme_color = VALUES(theme_color),
           page_config_json = VALUES(page_config_json),
           category_slug_list = VALUES(category_slug_list),
           is_enabled = VALUES(is_enabled),
           sort = VALUES(sort),
           extra_json = VALUES(extra_json),
           is_delete = 0,
           delete_time = 0,
           update_time = VALUES(update_time)`,
        {
          replacements: [
            row.templateKey,
            row.templateName,
            row.scene,
            row.description,
            row.defaultSlug,
            row.icon,
            row.themeColor,
            JSON.stringify(row.pageConfig || {}),
            JSON.stringify(row.categorySlugs || []),
            row.isEnabled ? 1 : 0,
            row.sort,
            JSON.stringify(row.extra || {}),
            now,
            now,
          ],
          type: app.Sequelize.QueryTypes.INSERT,
        }
      );
    }
  }

  /**
   * 获取模板列表
   */
  async listTemplates({ includeDisabled = true } = {}) {
    await this.ensureTables();
    await this.initDefaults();

    const { app } = this;
    const enabledSql = includeDisabled ? '' : ' AND is_enabled = 1';
    const rows = await app.model.query(
      `SELECT id, template_key, template_name, scene, description, default_slug, icon, theme_color,
              page_config_json, category_slug_list, is_enabled, sort, extra_json
       FROM ${TOPIC_TEMPLATE_TABLE}
       WHERE is_delete = 0 ${enabledSql}
       ORDER BY sort ASC, id ASC`,
      { type: app.Sequelize.QueryTypes.SELECT }
    );

    return (Array.isArray(rows) ? rows : []).map((row, index) => {
      let pageConfig = {};
      let categorySlugs = [];
      let extra = {};
      try { pageConfig = row.page_config_json ? JSON.parse(row.page_config_json) : {}; } catch (error) { pageConfig = {}; }
      try { categorySlugs = row.category_slug_list ? JSON.parse(row.category_slug_list) : []; } catch (error) { categorySlugs = []; }
      try { extra = row.extra_json ? JSON.parse(row.extra_json) : {}; } catch (error) { extra = {}; }

      return this.normalizeTemplate({
        id: row.id,
        templateKey: row.template_key,
        templateName: row.template_name,
        scene: row.scene,
        description: row.description,
        defaultSlug: row.default_slug,
        icon: row.icon,
        themeColor: row.theme_color,
        pageConfig,
        categorySlugs,
        isEnabled: row.is_enabled === 1,
        sort: row.sort || (index + 1) * 10,
        extra,
      }, index);
    });
  }

  /**
   * 获取模板详情
   */
  async detailTemplate({ id, templateKey }) {
    const list = await this.listTemplates({ includeDisabled: true });
    if (id) {
      return list.find(item => item.id === Number(id)) || null;
    }
    if (templateKey) {
      return list.find(item => item.templateKey === String(templateKey).trim()) || null;
    }
    return null;
  }

  /**
   * 保存模板
   */
  async saveTemplate(payload = {}) {
    await this.ensureTables();
    await this.initDefaults();

    const { app } = this;
    const now = Math.floor(Date.now() / 1000);
    const row = this.normalizeTemplate(payload);

    if (!row.templateKey) throw new Error('模板键不能为空');
    if (!row.templateName) throw new Error('模板名称不能为空');

    await app.model.query(
      `INSERT INTO ${TOPIC_TEMPLATE_TABLE}
       (template_key, template_name, scene, description, default_slug, icon, theme_color,
        page_config_json, category_slug_list, is_enabled, sort, extra_json,
        is_delete, create_time, update_time, delete_time)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, 0)
       ON DUPLICATE KEY UPDATE
         template_name = VALUES(template_name),
         scene = VALUES(scene),
         description = VALUES(description),
         default_slug = VALUES(default_slug),
         icon = VALUES(icon),
         theme_color = VALUES(theme_color),
         page_config_json = VALUES(page_config_json),
         category_slug_list = VALUES(category_slug_list),
         is_enabled = VALUES(is_enabled),
         sort = VALUES(sort),
         extra_json = VALUES(extra_json),
         is_delete = 0,
         delete_time = 0,
         update_time = VALUES(update_time)`,
      {
        replacements: [
          row.templateKey,
          row.templateName,
          row.scene,
          row.description,
          row.defaultSlug,
          row.icon,
          row.themeColor,
          JSON.stringify(row.pageConfig || {}),
          JSON.stringify(row.categorySlugs || []),
          row.isEnabled ? 1 : 0,
          row.sort,
          JSON.stringify(row.extra || {}),
          now,
          now,
        ],
        type: app.Sequelize.QueryTypes.INSERT,
      }
    );

    return this.detailTemplate({ templateKey: row.templateKey });
  }

  /**
   * 删除模板
   */
  async delTemplate(id) {
    await this.ensureTables();
    const { app } = this;
    const now = Math.floor(Date.now() / 1000);
    const templateId = this.parsePositiveInt(id, 0, 1, 99999999);
    if (!templateId) throw new Error('模板ID无效');

    await app.model.query(
      `UPDATE ${TOPIC_TEMPLATE_TABLE}
       SET is_delete = 1, delete_time = ?, update_time = ?
       WHERE id = ? AND is_delete = 0`,
      {
        replacements: [ now, now, templateId ],
        type: app.Sequelize.QueryTypes.UPDATE,
      }
    );

    return { id: templateId };
  }

  /**
   * 生成基础 slug
   */
  generateBaseSlug(text = '') {
    const raw = String(text || '').trim().toLowerCase();
    const slug = raw
      .replace(/[^\w\u4e00-\u9fa5-]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80);
    return slug || `topic-${Date.now().toString(36)}`;
  }

  /**
   * 生成唯一页面 slug
   */
  async buildUniquePageSlug(base) {
    const { app } = this;
    const baseSlug = this.generateBaseSlug(base);
    let slug = baseSlug;

    for (let index = 0; index < 100; index++) {
      const [ existing ] = await app.model.query(
        'SELECT id FROM uied_page WHERE slug = ? AND is_delete = 0 LIMIT 1',
        { replacements: [ slug ], type: app.Sequelize.QueryTypes.SELECT }
      );
      if (!existing) return slug;
      slug = `${baseSlug}-${index + 1}`.slice(0, 100);
    }

    return `${baseSlug}-${Date.now().toString(36)}`.slice(0, 100);
  }

  /**
   * 通过分类 slug 匹配分类 ID 列表
   */
  async resolveCategoryIdsBySlugs(slugs = []) {
    const { app } = this;
    const slugList = this.toStringList(slugs);
    if (!slugList.length) return [];

    const placeholders = slugList.map(() => '?').join(',');
    const rows = await app.model.query(
      `SELECT id, slug
       FROM uied_category
       WHERE is_delete = 0 AND slug IN (${placeholders})
       ORDER BY sort ASC, id ASC`,
      {
        replacements: slugList,
        type: app.Sequelize.QueryTypes.SELECT,
      }
    );

    const map = new Map((Array.isArray(rows) ? rows : []).map(item => [ String(item.slug || ''), Number(item.id || 0) ]));
    const ids = [];
    slugList.forEach(slug => {
      const id = map.get(slug);
      if (id) ids.push(id);
    });

    return Array.from(new Set(ids));
  }

  /**
   * 构建创建专题页的结构化数据
   */
  async buildTopicCreatePayload(payload = {}) {
    const template = await this.detailTemplate({
      id: payload.templateId,
      templateKey: payload.templateKey,
    });
    if (!template) {
      throw new Error('模板不存在');
    }

    const pageConfig = template.pageConfig || {};
    const overrides = payload.overrides && typeof payload.overrides === 'object' ? payload.overrides : {};
    const pageName = String(payload.pageName || overrides.pageName || template.templateName || '').trim();
    if (!pageName) {
      throw new Error('专题名称不能为空');
    }

    const pageSlugInput = String(payload.pageSlug || overrides.pageSlug || template.defaultSlug || pageName).trim();
    const pageSlug = await this.buildUniquePageSlug(pageSlugInput);

    const categoryIdsFromBody = Array.isArray(payload.categoryIds)
      ? payload.categoryIds.map(item => this.parsePositiveInt(item, 0, 1, 99999999)).filter(Boolean)
      : [];
    const categorySlugs = this.toStringList(payload.categorySlugs || template.categorySlugs || []);
    const categoryIdsFromSlug = await this.resolveCategoryIdsBySlugs(categorySlugs);
    const categoryIds = Array.from(new Set([ ...categoryIdsFromBody, ...categoryIdsFromSlug ])).filter(Boolean);

    return {
      template,
      pageData: {
        name: pageName,
        slug: pageSlug,
        type: String(overrides.type || pageConfig.type || 'topic').trim() || 'topic',
        description: String(payload.description || overrides.description || template.description || '').trim(),
        icon: String(payload.icon || overrides.icon || template.icon || '').trim(),
        heroTitle: String(overrides.heroTitle || pageConfig.heroTitle || pageName).trim(),
        heroHighlightText: String(overrides.heroHighlightText || pageConfig.heroHighlightText || '').trim(),
        heroSubtitle: String(overrides.heroSubtitle || pageConfig.heroSubtitle || '').trim(),
        hotSearchTags: Array.isArray(overrides.hotSearchTags)
          ? overrides.hotSearchTags
          : (Array.isArray(pageConfig.hotSearchTags) ? pageConfig.hotSearchTags : []),
        heroBgType: String(overrides.heroBgType || pageConfig.heroBgType || 'default').trim() || 'default',
        heroBgValue: String(overrides.heroBgValue || pageConfig.heroBgValue || '').trim(),
        heroDisplayMode: String(overrides.heroDisplayMode || pageConfig.heroDisplayMode || 'search').trim() || 'search',
        heroScrollWebsites: Array.isArray(overrides.heroScrollWebsites)
          ? overrides.heroScrollWebsites
          : (Array.isArray(pageConfig.heroScrollWebsites) ? pageConfig.heroScrollWebsites : []),
        searchPlaceholder: String(overrides.searchPlaceholder || pageConfig.searchPlaceholder || '').trim(),
        searchEnabled: this.parseBoolean(overrides.searchEnabled, this.parseBoolean(pageConfig.searchEnabled, true)),
        showHotRecommendations: this.parseBoolean(overrides.showHotRecommendations, this.parseBoolean(pageConfig.showHotRecommendations, true)),
        showCategories: this.parseBoolean(overrides.showCategories, this.parseBoolean(pageConfig.showCategories, true)),
        showSidebar: this.parseBoolean(overrides.showSidebar, this.parseBoolean(pageConfig.showSidebar, true)),
        themeColor: String(payload.themeColor || overrides.themeColor || template.themeColor || pageConfig.themeColor || '').trim() || null,
        sortOrder: this.parsePositiveInt(payload.sortOrder || overrides.sortOrder, template.sort || 0, 0, 100000),
        isActive: this.parseBoolean(payload.isActive, true),
      },
      categoryIds,
      matchedCategorySlugs: categorySlugs,
    };
  }

  /**
   * 预览创建结果
   */
  async previewCreate(payload = {}) {
    const data = await this.buildTopicCreatePayload(payload);
    return {
      template: data.template,
      pageData: data.pageData,
      categoryIds: data.categoryIds,
      categoryCount: data.categoryIds.length,
      matchedCategorySlugs: data.matchedCategorySlugs,
    };
  }

  /**
   * 一键创建专题页
   */
  async createFromTemplate(payload = {}) {
    const { app } = this;
    const now = Math.floor(Date.now() / 1000);
    const built = await this.buildTopicCreatePayload(payload);
    const pageData = built.pageData;

    const [ insertResult ] = await app.model.query(
      `INSERT INTO uied_page (name, slug, type, description, icon, hero_title, hero_highlight_text,
        hero_subtitle, hot_search_tags, hero_bg_type, hero_bg_value, hero_display_mode,
        hero_scroll_websites, search_placeholder, search_enabled, show_hot_recommendations,
        show_categories, show_sidebar, theme_color, sort, is_show, create_time, update_time)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      {
        replacements: [
          pageData.name,
          pageData.slug,
          pageData.type,
          pageData.description || '',
          pageData.icon || '',
          pageData.heroTitle || '',
          pageData.heroHighlightText || '',
          pageData.heroSubtitle || '',
          JSON.stringify(Array.isArray(pageData.hotSearchTags) ? pageData.hotSearchTags : []),
          pageData.heroBgType || 'default',
          pageData.heroBgValue || '',
          pageData.heroDisplayMode || 'search',
          JSON.stringify(Array.isArray(pageData.heroScrollWebsites) ? pageData.heroScrollWebsites : []),
          pageData.searchPlaceholder || '',
          pageData.searchEnabled ? 1 : 0,
          pageData.showHotRecommendations ? 1 : 0,
          pageData.showCategories ? 1 : 0,
          pageData.showSidebar ? 1 : 0,
          pageData.themeColor,
          pageData.sortOrder || 0,
          pageData.isActive ? 1 : 0,
          now,
          now,
        ],
        type: app.Sequelize.QueryTypes.INSERT,
      }
    );

    const pageId = Number(insertResult || 0);

    if (pageId > 0 && built.categoryIds.length > 0) {
      for (let index = 0; index < built.categoryIds.length; index++) {
        const categoryId = built.categoryIds[index];
        await app.model.query(
          `INSERT INTO uied_page_category (page_id, category_id, sort, is_show, is_delete, create_time, update_time, delete_time)
           VALUES (?, ?, ?, 1, 0, ?, ?, 0)
           ON DUPLICATE KEY UPDATE
             sort = VALUES(sort),
             is_show = 1,
             is_delete = 0,
             delete_time = 0,
             update_time = VALUES(update_time)`,
          {
            replacements: [ pageId, categoryId, index + 1, now, now ],
            type: app.Sequelize.QueryTypes.INSERT,
          }
        );
      }
    }

    return {
      id: pageId,
      templateKey: built.template.templateKey,
      templateName: built.template.templateName,
      pageName: pageData.name,
      pageSlug: pageData.slug,
      categoryIds: built.categoryIds,
      categoryCount: built.categoryIds.length,
    };
  }

  /**
   * 获取后台字段草案
   */
  getFieldDraft() {
    return {
      createFields: [
        { key: 'templateKey', type: 'select', label: '模板选择', required: true },
        { key: 'pageName', type: 'input', label: '专题名称', required: true },
        { key: 'pageSlug', type: 'input', label: '专题别名', required: false, remark: '为空时自动生成并保证唯一' },
        { key: 'categoryIds', type: 'array-number', label: '分类ID列表', required: false },
        { key: 'categorySlugs', type: 'array-string', label: '分类Slug列表', required: false },
        { key: 'sortOrder', type: 'number', label: '专题排序', required: false, min: 0, max: 100000, defaultValue: 0 },
      ],
      templateFields: [
        { key: 'templateKey', type: 'input', label: '模板键', required: true },
        { key: 'templateName', type: 'input', label: '模板名称', required: true },
        { key: 'scene', type: 'input', label: '模板场景', required: true },
        { key: 'description', type: 'textarea', label: '模板描述', required: false },
        { key: 'defaultSlug', type: 'input', label: '默认别名', required: false },
        { key: 'icon', type: 'input', label: '图标', required: false },
        { key: 'themeColor', type: 'input', label: '主题色', required: false },
        { key: 'categorySlugs', type: 'array-string', label: '默认分类 Slug', required: false },
      ],
    };
  }
}

module.exports = TopicFactoryService;
