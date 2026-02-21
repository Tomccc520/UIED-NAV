/**
 * @file service/uied/wordpressConfig.js
 * @description WordPress 配置服务
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

'use strict';

const Service = require('egg').Service;

class WordpressConfigService extends Service {
  /**
   * 判断是否为可降级的库结构兼容错误
   */
  isSchemaCompatibilityError(error) {
    const code = String(error?.original?.code || error?.code || '').toUpperCase();
    const message = String(error?.message || '');
    return code === 'ER_NO_SUCH_TABLE'
      || code === 'ER_BAD_FIELD_ERROR'
      || message.includes('doesn\'t exist')
      || message.includes('Unknown column');
  }

  /**
   * 确保 WordPress 标签与组件配置表存在（新环境兜底）
   */
  async ensureTagWidgetTables() {
    const { app } = this;
    const cacheKey = '__uiedWordpressTagWidgetTablesReady__';
    if (app[cacheKey] === true) return;
    await app.model.query(
      `CREATE TABLE IF NOT EXISTS \`uied_wordpress_tag\` (
        \`id\` int unsigned NOT NULL AUTO_INCREMENT,
        \`config_id\` int unsigned DEFAULT NULL,
        \`wp_tag_id\` int unsigned NOT NULL DEFAULT 0,
        \`wp_tag_name\` varchar(128) NOT NULL DEFAULT '',
        \`display_name\` varchar(128) NOT NULL DEFAULT '',
        \`slug\` varchar(128) NOT NULL DEFAULT '',
        \`description\` varchar(500) NOT NULL DEFAULT '',
        \`sort\` int unsigned NOT NULL DEFAULT 0,
        \`visible\` tinyint unsigned NOT NULL DEFAULT 1,
        \`page_slug\` varchar(64) NOT NULL DEFAULT '',
        \`create_time\` int unsigned NOT NULL DEFAULT 0,
        \`update_time\` int unsigned NOT NULL DEFAULT 0,
        PRIMARY KEY (\`id\`),
        KEY \`idx_page_visible_sort\` (\`page_slug\`,\`visible\`,\`sort\`),
        KEY \`idx_slug\` (\`slug\`),
        KEY \`idx_config_id\` (\`config_id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='WordPress 标签映射配置'`,
      { type: app.Sequelize.QueryTypes.RAW }
    );

    await app.model.query(
      `CREATE TABLE IF NOT EXISTS \`uied_wordpress_widget\` (
        \`id\` int unsigned NOT NULL AUTO_INCREMENT,
        \`config_id\` int unsigned DEFAULT NULL,
        \`widget_key\` varchar(100) NOT NULL DEFAULT '',
        \`widget_name\` varchar(128) NOT NULL DEFAULT '',
        \`title\` varchar(200) NOT NULL DEFAULT '',
        \`content\` text,
        \`meta_json\` text,
        \`sort\` int unsigned NOT NULL DEFAULT 0,
        \`visible\` tinyint unsigned NOT NULL DEFAULT 1,
        \`page_slug\` varchar(64) NOT NULL DEFAULT '',
        \`create_time\` int unsigned NOT NULL DEFAULT 0,
        \`update_time\` int unsigned NOT NULL DEFAULT 0,
        PRIMARY KEY (\`id\`),
        KEY \`idx_page_visible_sort\` (\`page_slug\`,\`visible\`,\`sort\`),
        KEY \`idx_widget_key\` (\`widget_key\`),
        KEY \`idx_config_id\` (\`config_id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='WordPress 组件配置'`,
      { type: app.Sequelize.QueryTypes.RAW }
    );
    app[cacheKey] = true;
  }

  // ==================== WordPress 配置 ====================

  /**
   * 获取所有 WordPress 配置
   */
  async listConfigs() {
    const { app } = this;

    const configs = await app.model.query(
      'SELECT * FROM uied_wordpress_config ORDER BY create_time DESC',
      { type: app.Sequelize.QueryTypes.SELECT }
    );

    return configs.map(c => ({
      id: c.id,
      name: c.name,
      apiUrl: c.api_url,
      enabled: c.enabled === 1,
      isDefault: c.is_default === 1,
      cacheTime: c.cache_time,
      createdAt: c.create_time,
    }));
  }

  /**
   * 获取默认 WordPress 配置
   */
  async getDefaultConfig() {
    const { app } = this;

    let [ config ] = await app.model.query(
      'SELECT * FROM uied_wordpress_config WHERE enabled = 1 AND is_default = 1 LIMIT 1',
      { type: app.Sequelize.QueryTypes.SELECT }
    );

    if (!config) {
      [ config ] = await app.model.query(
        'SELECT * FROM uied_wordpress_config WHERE enabled = 1 LIMIT 1',
        { type: app.Sequelize.QueryTypes.SELECT }
      );
    }

    if (!config) return null;

    return {
      id: config.id,
      name: config.name,
      apiUrl: config.api_url,
      cacheTime: config.cache_time,
    };
  }

  /**
   * 创建 WordPress 配置
   */
  async addConfig(data) {
    const { app } = this;
    const now = Math.floor(Date.now() / 1000);

    if (data.isDefault) {
      await app.model.query(
        'UPDATE uied_wordpress_config SET is_default = 0',
        { type: app.Sequelize.QueryTypes.UPDATE }
      );
    }

    const [ result ] = await app.model.query(
      `INSERT INTO uied_wordpress_config (name, api_url, enabled, is_default, cache_time, create_time, update_time)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      {
        replacements: [
          data.name,
          data.apiUrl,
          data.enabled !== false ? 1 : 0,
          data.isDefault ? 1 : 0,
          data.cacheTime || 7200,
          now,
          now,
        ],
        type: app.Sequelize.QueryTypes.INSERT,
      }
    );

    return { id: result, ...data };
  }

  /**
   * 更新 WordPress 配置
   */
  async editConfig(data) {
    const { app } = this;
    const now = Math.floor(Date.now() / 1000);

    if (data.isDefault) {
      await app.model.query(
        'UPDATE uied_wordpress_config SET is_default = 0 WHERE id != ?',
        { replacements: [ data.id ], type: app.Sequelize.QueryTypes.UPDATE }
      );
    }

    const updates = [];
    const values = [];

    if (data.name !== undefined) { updates.push('name = ?'); values.push(data.name); }
    if (data.apiUrl !== undefined) { updates.push('api_url = ?'); values.push(data.apiUrl); }
    if (data.enabled !== undefined) { updates.push('enabled = ?'); values.push(data.enabled ? 1 : 0); }
    if (data.isDefault !== undefined) { updates.push('is_default = ?'); values.push(data.isDefault ? 1 : 0); }
    if (data.cacheTime !== undefined) { updates.push('cache_time = ?'); values.push(data.cacheTime); }

    updates.push('update_time = ?');
    values.push(now);
    values.push(data.id);

    await app.model.query(
      `UPDATE uied_wordpress_config SET ${updates.join(', ')} WHERE id = ?`,
      { replacements: values, type: app.Sequelize.QueryTypes.UPDATE }
    );

    return data;
  }

  /**
   * 删除 WordPress 配置
   */
  async delConfig(id) {
    const { app } = this;

    await app.model.query(
      'DELETE FROM uied_wordpress_config WHERE id = ?',
      { replacements: [ id ], type: app.Sequelize.QueryTypes.DELETE }
    );
  }

  // ==================== WordPress 分类配置 ====================

  /**
   * 获取分类配置列表
   */
  async listCategories(pageSlug) {
    const { app } = this;

    let whereClause = '1=1';
    const replacements = [];

    if (pageSlug) {
      whereClause += ' AND page_slug = ?';
      replacements.push(pageSlug);
    }

    let categories = [];
    try {
      categories = await app.model.query(
        `SELECT * FROM uied_wordpress_category WHERE ${whereClause} ORDER BY sort ASC, create_time DESC`,
        { replacements, type: app.Sequelize.QueryTypes.SELECT }
      );
    } catch (error) {
      if (!this.isSchemaCompatibilityError(error)) {
        throw error;
      }
      this.ctx.logger.warn('[wordpressConfig] listCategories 降级为空数组:', error.message);
      return [];
    }

    return categories.map(c => ({
      id: c.id,
      configId: c.config_id,
      wpCategoryId: c.wp_category_id,
      wpCategoryName: c.wp_category_name,
      displayName: c.display_name,
      slug: c.slug,
      description: c.description,
      order: c.sort,
      visible: c.visible === 1,
      pageSlug: c.page_slug,
    }));
  }

  /**
   * 创建分类配置
   */
  async addCategory(data) {
    const { app } = this;
    const now = Math.floor(Date.now() / 1000);

    const [ result ] = await app.model.query(
      `INSERT INTO uied_wordpress_category 
       (config_id, wp_category_id, wp_category_name, display_name, slug, description, sort, visible, page_slug, create_time, update_time)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      {
        replacements: [
          data.configId || null,
          data.wpCategoryId,
          data.wpCategoryName,
          data.displayName,
          data.slug,
          data.description || null,
          data.order || 0,
          data.visible !== false ? 1 : 0,
          data.pageSlug || null,
          now,
          now,
        ],
        type: app.Sequelize.QueryTypes.INSERT,
      }
    );

    return { id: result, ...data };
  }

  /**
   * 更新分类配置
   */
  async editCategory(data) {
    const { app } = this;
    const now = Math.floor(Date.now() / 1000);

    const updates = [];
    const values = [];

    if (data.wpCategoryId !== undefined) { updates.push('wp_category_id = ?'); values.push(data.wpCategoryId); }
    if (data.wpCategoryName !== undefined) { updates.push('wp_category_name = ?'); values.push(data.wpCategoryName); }
    if (data.displayName !== undefined) { updates.push('display_name = ?'); values.push(data.displayName); }
    if (data.slug !== undefined) { updates.push('slug = ?'); values.push(data.slug); }
    if (data.description !== undefined) { updates.push('description = ?'); values.push(data.description); }
    if (data.order !== undefined) { updates.push('sort = ?'); values.push(data.order); }
    if (data.visible !== undefined) { updates.push('visible = ?'); values.push(data.visible ? 1 : 0); }
    if (data.pageSlug !== undefined) { updates.push('page_slug = ?'); values.push(data.pageSlug); }

    updates.push('update_time = ?');
    values.push(now);
    values.push(data.id);

    await app.model.query(
      `UPDATE uied_wordpress_category SET ${updates.join(', ')} WHERE id = ?`,
      { replacements: values, type: app.Sequelize.QueryTypes.UPDATE }
    );

    return data;
  }

  /**
   * 删除分类配置
   */
  async delCategory(id) {
    const { app } = this;

    await app.model.query(
      'DELETE FROM uied_wordpress_category WHERE id = ?',
      { replacements: [ id ], type: app.Sequelize.QueryTypes.DELETE }
    );
  }

  // ==================== WordPress 标签配置 ====================

  /**
   * 获取标签配置列表
   */
  async listTags(pageSlug) {
    const { app } = this;
    await this.ensureTagWidgetTables();

    let whereClause = '1=1';
    const replacements = [];

    if (pageSlug) {
      whereClause += ' AND page_slug = ?';
      replacements.push(pageSlug);
    }

    let rows = [];
    try {
      rows = await app.model.query(
        `SELECT * FROM uied_wordpress_tag WHERE ${whereClause} ORDER BY sort ASC, create_time DESC`,
        { replacements, type: app.Sequelize.QueryTypes.SELECT }
      );
    } catch (error) {
      if (!this.isSchemaCompatibilityError(error)) {
        throw error;
      }
      this.ctx.logger.warn('[wordpressConfig] listTags 降级为空数组:', error.message);
      return [];
    }

    return rows.map(item => ({
      id: item.id,
      configId: item.config_id,
      wpTagId: item.wp_tag_id,
      wpTagName: item.wp_tag_name,
      displayName: item.display_name,
      slug: item.slug,
      description: item.description,
      order: item.sort,
      visible: item.visible === 1,
      pageSlug: item.page_slug,
    }));
  }

  /**
   * 创建标签配置
   */
  async addTag(data) {
    const { app } = this;
    await this.ensureTagWidgetTables();
    const now = Math.floor(Date.now() / 1000);

    const [ result ] = await app.model.query(
      `INSERT INTO uied_wordpress_tag
       (config_id, wp_tag_id, wp_tag_name, display_name, slug, description, sort, visible, page_slug, create_time, update_time)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      {
        replacements: [
          data.configId || null,
          data.wpTagId,
          data.wpTagName,
          data.displayName,
          data.slug,
          data.description || '',
          data.order || 0,
          data.visible !== false ? 1 : 0,
          data.pageSlug || '',
          now,
          now,
        ],
        type: app.Sequelize.QueryTypes.INSERT,
      }
    );

    return { id: result, ...data };
  }

  /**
   * 更新标签配置
   */
  async editTag(data) {
    const { app } = this;
    await this.ensureTagWidgetTables();
    const now = Math.floor(Date.now() / 1000);

    const updates = [];
    const values = [];

    if (data.configId !== undefined) { updates.push('config_id = ?'); values.push(data.configId || null); }
    if (data.wpTagId !== undefined) { updates.push('wp_tag_id = ?'); values.push(data.wpTagId); }
    if (data.wpTagName !== undefined) { updates.push('wp_tag_name = ?'); values.push(data.wpTagName); }
    if (data.displayName !== undefined) { updates.push('display_name = ?'); values.push(data.displayName); }
    if (data.slug !== undefined) { updates.push('slug = ?'); values.push(data.slug); }
    if (data.description !== undefined) { updates.push('description = ?'); values.push(data.description); }
    if (data.order !== undefined) { updates.push('sort = ?'); values.push(data.order); }
    if (data.visible !== undefined) { updates.push('visible = ?'); values.push(data.visible ? 1 : 0); }
    if (data.pageSlug !== undefined) { updates.push('page_slug = ?'); values.push(data.pageSlug || ''); }

    updates.push('update_time = ?');
    values.push(now);
    values.push(data.id);

    await app.model.query(
      `UPDATE uied_wordpress_tag SET ${updates.join(', ')} WHERE id = ?`,
      { replacements: values, type: app.Sequelize.QueryTypes.UPDATE }
    );

    return data;
  }

  /**
   * 删除标签配置
   */
  async delTag(id) {
    const { app } = this;
    await this.ensureTagWidgetTables();
    await app.model.query(
      'DELETE FROM uied_wordpress_tag WHERE id = ?',
      { replacements: [ id ], type: app.Sequelize.QueryTypes.DELETE }
    );
  }

  // ==================== WordPress 组件配置 ====================

  /**
   * 获取组件配置列表
   */
  async listWidgets(pageSlug) {
    const { app } = this;
    await this.ensureTagWidgetTables();

    let whereClause = '1=1';
    const replacements = [];
    if (pageSlug) {
      whereClause += ' AND page_slug = ?';
      replacements.push(pageSlug);
    }

    let rows = [];
    try {
      rows = await app.model.query(
        `SELECT * FROM uied_wordpress_widget WHERE ${whereClause} ORDER BY sort ASC, create_time DESC`,
        { replacements, type: app.Sequelize.QueryTypes.SELECT }
      );
    } catch (error) {
      if (!this.isSchemaCompatibilityError(error)) {
        throw error;
      }
      this.ctx.logger.warn('[wordpressConfig] listWidgets 降级为空数组:', error.message);
      return [];
    }

    return rows.map(item => ({
      id: item.id,
      configId: item.config_id,
      widgetKey: item.widget_key,
      widgetName: item.widget_name,
      title: item.title,
      content: item.content || '',
      meta: (() => {
        try {
          return item.meta_json ? JSON.parse(item.meta_json) : {};
        } catch (error) {
          return {};
        }
      })(),
      order: item.sort,
      visible: item.visible === 1,
      pageSlug: item.page_slug,
    }));
  }

  /**
   * 创建组件配置
   */
  async addWidget(data) {
    const { app } = this;
    await this.ensureTagWidgetTables();
    const now = Math.floor(Date.now() / 1000);

    const [ result ] = await app.model.query(
      `INSERT INTO uied_wordpress_widget
       (config_id, widget_key, widget_name, title, content, meta_json, sort, visible, page_slug, create_time, update_time)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      {
        replacements: [
          data.configId || null,
          data.widgetKey || '',
          data.widgetName || '',
          data.title || '',
          data.content || '',
          JSON.stringify(data.meta || {}),
          data.order || 0,
          data.visible !== false ? 1 : 0,
          data.pageSlug || '',
          now,
          now,
        ],
        type: app.Sequelize.QueryTypes.INSERT,
      }
    );

    return { id: result, ...data };
  }

  /**
   * 更新组件配置
   */
  async editWidget(data) {
    const { app } = this;
    await this.ensureTagWidgetTables();
    const now = Math.floor(Date.now() / 1000);

    const updates = [];
    const values = [];

    if (data.configId !== undefined) { updates.push('config_id = ?'); values.push(data.configId || null); }
    if (data.widgetKey !== undefined) { updates.push('widget_key = ?'); values.push(data.widgetKey || ''); }
    if (data.widgetName !== undefined) { updates.push('widget_name = ?'); values.push(data.widgetName || ''); }
    if (data.title !== undefined) { updates.push('title = ?'); values.push(data.title || ''); }
    if (data.content !== undefined) { updates.push('content = ?'); values.push(data.content || ''); }
    if (data.meta !== undefined) { updates.push('meta_json = ?'); values.push(JSON.stringify(data.meta || {})); }
    if (data.order !== undefined) { updates.push('sort = ?'); values.push(data.order || 0); }
    if (data.visible !== undefined) { updates.push('visible = ?'); values.push(data.visible ? 1 : 0); }
    if (data.pageSlug !== undefined) { updates.push('page_slug = ?'); values.push(data.pageSlug || ''); }

    updates.push('update_time = ?');
    values.push(now);
    values.push(data.id);

    await app.model.query(
      `UPDATE uied_wordpress_widget SET ${updates.join(', ')} WHERE id = ?`,
      { replacements: values, type: app.Sequelize.QueryTypes.UPDATE }
    );

    return data;
  }

  /**
   * 删除组件配置
   */
  async delWidget(id) {
    const { app } = this;
    await this.ensureTagWidgetTables();
    await app.model.query(
      'DELETE FROM uied_wordpress_widget WHERE id = ?',
      { replacements: [ id ], type: app.Sequelize.QueryTypes.DELETE }
    );
  }

  // ==================== WordPress 文章代理 ====================

  /**
   * 代理获取 WordPress 文章
   */
  async getPosts({ categoryId, tagId, page = 1, perPage = 10, orderBy = 'date', order = 'desc', search }) {
    const { ctx } = this;

    const config = await this.getDefaultConfig();
    if (!config) {
      throw new Error('没有可用的 WordPress 配置');
    }

    // 构建 WordPress API URL
    let url = `${config.apiUrl}/posts?page=${page}&per_page=${perPage}&orderby=${orderBy}&order=${order}&_embed=true`;
    if (categoryId) url += `&categories=${categoryId}`;
    if (tagId) url += `&tags=${tagId}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;

    const response = await ctx.curl(url, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; UIED-Nav/1.0)',
        Accept: 'application/json',
      },
      dataType: 'json',
    });

    if (response.status !== 200) {
      throw new Error(`WordPress API 错误: ${response.status}`);
    }

    const posts = response.data;

    // 处理文章数据
    return posts.map(post => {
      let thumbnail = '';
      if (post._embedded?.['wp:featuredmedia']?.[0]) {
        const media = post._embedded['wp:featuredmedia'][0];
        thumbnail = media.source_url || '';
        if (media.media_details?.sizes?.medium_large) {
          thumbnail = media.media_details.sizes.medium_large.source_url;
        } else if (media.media_details?.sizes?.medium) {
          thumbnail = media.media_details.sizes.medium.source_url;
        }
      }

      let authorName = '';
      if (post._embedded?.author?.[0]) {
        authorName = post._embedded.author[0].name || '';
      }

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
        isNew: this.isNewPost(post.date),
      };
    });
  }

  /**
   * 判断是否是新文章（7天内发布）
   */
  isNewPost(dateString) {
    const publishDate = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now - publishDate) / (1000 * 60 * 60 * 24));
    return diffInDays <= 7;
  }
}

module.exports = WordpressConfigService;
