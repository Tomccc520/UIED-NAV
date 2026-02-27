'use strict';

const Service = require('egg').Service;
const Sequelize = require('sequelize');
const moment = require('moment');
const urlUtil = require('../util/urlUtil');
const { backstageTokenKey, publicUrl, userTokenKey, reqAdminIdKey } = require('../extend/config');

const Op = Sequelize.Op;

const formatTime = (value) => {
  if (!value) return '';
  return moment(Number(value) * 1000).format('YYYY-MM-DD HH:mm:ss');
};

class ArticleService extends Service {
  /**
   * 统一补齐表字段（兼容历史库）
   */
  async ensureTableColumn(tableName, columnName, addColumnSql) {
    const { ctx } = this;
    const [ rows ] = await ctx.model.query(
      `
      SELECT COUNT(1) AS cnt
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ?
        AND COLUMN_NAME = ?
      `,
      {
        replacements: [ String(tableName || ''), String(columnName || '') ],
      }
    );
    const exists = Number(rows?.[0]?.cnt || 0) > 0;
    if (exists) return true;
    await ctx.model.query(addColumnSql);
    return true;
  }

  /**
   * 统一补齐索引（兼容历史库）
   */
  async ensureTableIndex(tableName, indexName, addIndexSql) {
    const { ctx } = this;
    const [ rows ] = await ctx.model.query(
      `
      SELECT COUNT(1) AS cnt
      FROM INFORMATION_SCHEMA.STATISTICS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ?
        AND INDEX_NAME = ?
      `,
      {
        replacements: [ String(tableName || ''), String(indexName || '') ],
      }
    );
    const exists = Number(rows?.[0]?.cnt || 0) > 0;
    if (exists) return true;
    await ctx.model.query(addIndexSql);
    return true;
  }

  /**
   * 规范化 slug（仅保留英文/数字/中划线）
   */
  normalizeSlug(value = '') {
    return String(value || '')
      .trim()
      .toLowerCase()
      .replace(/[\s_]+/g, '-')
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * 解析并校验 slug 输入值
   */
  parseSlugInput(rawSlug = '') {
    const source = String(rawSlug || '').trim();
    if (!source) {
      return { hasInput: false, slug: '' };
    }
    const slug = this.normalizeSlug(source);
    if (!slug) {
      throw new Error('slug 仅支持英文、数字和中划线');
    }
    return { hasInput: true, slug };
  }

  /**
   * 为标签/专题生成可用 slug（手填冲突报错；自动生成冲突自动补序号）
   */
  async resolveUniqueSlug(model, {
    rawSlug = '',
    name = '',
    currentId = 0,
    prefix = 'item',
  } = {}) {
    const parsed = this.parseSlugInput(rawSlug);
    let baseSlug = parsed.slug || this.normalizeSlug(name);
    if (!baseSlug) {
      baseSlug = `${prefix}-${Number(currentId || 0) || Math.floor(Date.now() / 1000)}`;
    }
    const id = Number(currentId || 0);

    /**
     * 判断 slug 是否被其他记录占用（含软删除记录，避免唯一索引冲突）
     */
    const isSlugTaken = async (slug) => {
      const where = { slug };
      if (id > 0) {
        where.id = { [Op.ne]: id };
      }
      const row = await model.findOne({
        attributes: [ 'id' ],
        where,
      });
      return Boolean(row);
    };

    if (parsed.hasInput) {
      const taken = await isSlugTaken(baseSlug);
      if (taken) {
        throw new Error('slug 已存在，请更换后重试');
      }
      return baseSlug;
    }

    let candidate = baseSlug;
    let seq = 2;
    while (await isSlugTaken(candidate)) {
      candidate = `${baseSlug}-${seq}`;
      seq += 1;
    }
    return candidate;
  }

  /**
   * 生成删除态 slug（释放原 slug 供新记录复用）
   */
  buildDeletedSlug(slug = '', prefix = 'item', id = 0, now = 0) {
    const base = this.normalizeSlug(slug) || `${prefix}-${Number(id || 0)}`;
    return `${base}-deleted-${Number(id || 0)}-${Number(now || Math.floor(Date.now() / 1000))}`;
  }

  /**
   * 回填并修复 slug 唯一性（用于上线前历史数据兼容）
   */
  async repairSlugRows(model, {
    prefix = 'item',
  } = {}) {
    const rows = await model.findAll({
      attributes: [ 'id', 'name', 'slug' ],
      order: [[ 'id', 'ASC' ]],
    });
    if (!rows.length) return true;
    const used = new Set();
    for (let i = 0; i < rows.length; i += 1) {
      const row = rows[i];
      const id = Number(row.id || 0);
      const rawName = String(row.name || '');
      const currentSlug = this.normalizeSlug(row.slug || '');
      let baseSlug = currentSlug || this.normalizeSlug(rawName) || `${prefix}-${id}`;
      let candidate = baseSlug;
      let seq = 2;
      while (used.has(candidate)) {
        candidate = `${baseSlug}-${seq}`;
        seq += 1;
      }
      used.add(candidate);
      if (candidate !== String(row.slug || '')) {
        await model.update(
          { slug: candidate },
          { where: { id } }
        );
      }
    }
    return true;
  }

  /**
   * 投稿审核状态文案
   * 0=草稿 1=待审核 2=已通过 3=已驳回 4=需修改
   */
  getReviewStatusName(status) {
    const value = Number(status || 0);
    if (value === 1) return '待审核';
    if (value === 2) return '已通过';
    if (value === 3) return '已驳回';
    if (value === 4) return '需修改';
    return '草稿';
  }

  /**
   * 解析审核动作标识（给前端消息分类使用）
   */
  resolveReviewAction(reviewStatus) {
    const status = Number(reviewStatus || 0);
    if (status === 2) return 'pass';
    if (status === 3) return 'reject';
    if (status === 4) return 'revise';
    return 'pending';
  }

  /**
   * 构建投稿审核通知文案
   */
  buildFrontAuditNotifyPayload(articleTitle, reviewStatus, reviewRemark = '') {
    const safeTitle = String(articleTitle || '').trim();
    const safeRemark = String(reviewRemark || '').trim();
    const status = Number(reviewStatus || 0);
    if (status === 2) {
      return {
        title: '投稿审核通过',
        content: `你投稿的《${safeTitle}》已审核通过并发布。`,
      };
    }
    if (status === 4) {
      return {
        title: '投稿需修改',
        content: `你投稿的《${safeTitle}》需要修改后再提交。${safeRemark ? ` 备注：${safeRemark}` : ''}`,
      };
    }
    return {
      title: '投稿审核未通过',
      content: `你投稿的《${safeTitle}》未通过审核，请修改后重新提交。${safeRemark ? ` 备注：${safeRemark}` : ''}`,
    };
  }

  /**
   * 解析投稿审核消息扩展信息
   */
  parseAuditMessageExtra(extraText = '') {
    const raw = String(extraText || '').trim();
    if (!raw) return {};
    try {
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (error) {
      return {};
    }
  }

  /**
   * 确保文章审核字段存在（兼容历史库）
   */
  async ensureArticleReviewColumns() {
    const { app, ctx } = this;
    if (app.__articleReviewColumnsReady) return true;
    try {
      await this.ensureTableColumn(
        'la_article',
        'review_status',
        "ALTER TABLE `la_article` ADD COLUMN `review_status` tinyint unsigned NOT NULL DEFAULT 2 COMMENT '0草稿 1待审核 2通过 3驳回' AFTER `is_show`;"
      );
      await this.ensureTableColumn(
        'la_article',
        'review_remark',
        "ALTER TABLE `la_article` ADD COLUMN `review_remark` varchar(255) NOT NULL DEFAULT '' COMMENT '审核备注' AFTER `review_status`;"
      );
      await this.ensureTableColumn(
        'la_article',
        'review_time',
        "ALTER TABLE `la_article` ADD COLUMN `review_time` int unsigned NOT NULL DEFAULT 0 COMMENT '审核时间' AFTER `review_remark`;"
      );
      await this.ensureTableColumn(
        'la_article',
        'review_admin_id',
        "ALTER TABLE `la_article` ADD COLUMN `review_admin_id` int unsigned NOT NULL DEFAULT 0 COMMENT '审核管理员ID' AFTER `review_time`;"
      );
      app.__articleReviewColumnsReady = true;
      return true;
    } catch (error) {
      ctx.logger.warn(`ensureArticleReviewColumns skipped: ${error.message || error}`);
      return false;
    }
  }

  /**
   * 确保标签/专题 slug 字段与唯一索引存在（兼容历史库）
   */
  async ensureTagAndTopicSlugColumns() {
    const { app, ctx } = this;
    if (app.__articleTagTopicSlugReady) return true;
    try {
      await this.ensureTableColumn(
        'la_article_tag',
        'slug',
        "ALTER TABLE `la_article_tag` ADD COLUMN `slug` varchar(120) NOT NULL DEFAULT '' COMMENT '英文别名' AFTER `name`;"
      );
      await this.ensureTableColumn(
        'la_article_topic',
        'slug',
        "ALTER TABLE `la_article_topic` ADD COLUMN `slug` varchar(120) NOT NULL DEFAULT '' COMMENT '英文别名' AFTER `name`;"
      );
      await this.repairSlugRows(ctx.model.ArticleTag, { prefix: 'tag' });
      await this.repairSlugRows(ctx.model.ArticleTopic, { prefix: 'topic' });
      await this.ensureTableIndex(
        'la_article_tag',
        'uk_slug',
        'ALTER TABLE `la_article_tag` ADD UNIQUE INDEX `uk_slug` (`slug`);'
      );
      await this.ensureTableIndex(
        'la_article_topic',
        'uk_slug',
        'ALTER TABLE `la_article_topic` ADD UNIQUE INDEX `uk_slug` (`slug`);'
      );
      app.__articleTagTopicSlugReady = true;
      return true;
    } catch (error) {
      ctx.logger.warn(`ensureTagAndTopicSlugColumns skipped: ${error.message || error}`);
      return false;
    }
  }

  /**
   * 解码常见 HTML 实体
   */
  decodeHtmlEntities(value = '') {
    return String(value || '')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, '\'')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&nbsp;/g, ' ')
      .trim();
  }

  /**
   * 解码 JS 字符串中的常见转义（用于解析脚本变量里的 URL）
   */
  decodeJsEscapes(value = '') {
    const source = String(value || '');
    if (!source) return '';
    return source
      .replace(/\\\//g, '/')
      .replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => {
        try {
          return String.fromCharCode(parseInt(hex, 16));
        } catch (error) {
          return '';
        }
      })
      .replace(/\\x([0-9a-fA-F]{2})/g, (_, hex) => {
        try {
          return String.fromCharCode(parseInt(hex, 16));
        } catch (error) {
          return '';
        }
      })
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '')
      .replace(/\\"/g, '"')
      .replace(/\\'/g, '\'')
      .trim();
  }

  /**
   * 转义 HTML 属性值
   */
  escapeHtmlAttr(value = '') {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  /**
   * 从 HTML 标签中提取属性值
   */
  getAttrFromTag(tag = '', attrName = '') {
    if (!tag || !attrName) return '';
    const re = new RegExp(`\\b${attrName}\\s*=\\s*(?:\"([^\"]*)\"|'([^']*)'|([^\\s>]+))`, 'i');
    const matched = String(tag).match(re);
    const value = matched ? (matched[1] || matched[2] || matched[3] || '') : '';
    return this.decodeHtmlEntities(value);
  }

  /**
   * 规范化 URL（兼容 // 前缀）
   */
  normalizeProtocolUrl(rawUrl = '') {
    const text = String(rawUrl || '').trim();
    if (!text) return '';
    if (text.startsWith('//')) return `https:${text}`;
    return text;
  }

  /**
   * 从文本中提取第一个可用的 http(s) 链接（兼容 markdown 粘贴场景）
   */
  extractFirstHttpUrl(rawText = '') {
    const text = String(rawText || '').trim();
    if (!text) return '';
    // 先尝试 markdown 链接 [text](https://...)
    const markdownMatch = text.match(/\[[^\]]*\]\((https?:\/\/[^)\s]+)\)/i);
    if (markdownMatch && markdownMatch[1]) {
      return String(markdownMatch[1]).trim();
    }
    // 再提取裸链接
    const directMatch = text.match(/https?:\/\/[^\s]+/i);
    if (directMatch && directMatch[0]) {
      return String(directMatch[0]).trim();
    }
    return text;
  }

  /**
   * 提取 meta 内容（兼容 name/property 顺序）
   */
  extractMetaContent(html = '', key = '') {
    if (!html || !key) return '';
    const escapedKey = String(key).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const reg1 = new RegExp(
      `<meta[^>]+(?:name|property)\\s*=\\s*["']${escapedKey}["'][^>]*content\\s*=\\s*["']([^"']*)["'][^>]*>`,
      'i'
    );
    const reg2 = new RegExp(
      `<meta[^>]+content\\s*=\\s*["']([^"']*)["'][^>]+(?:name|property)\\s*=\\s*["']${escapedKey}["'][^>]*>`,
      'i'
    );
    const hit = String(html).match(reg1) || String(html).match(reg2);
    return this.decodeHtmlEntities(hit ? hit[1] : '');
  }

  /**
   * 提取页面脚本中的字符串变量值（如 msg_title / msg_desc）
   */
  extractJsStringValue(html = '', key = '') {
    if (!html || !key) return '';
    const escapedKey = String(key).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // 兼容：
    // 1) var msg_desc = htmlDecode("...")
    // 2) var msg_title = '...'.html(false);
    const reg = new RegExp(
      `${escapedKey}\\s*=\\s*(?:htmlDecode\\s*\\()?\\s*(?:"((?:\\\\.|[^"])*)"|'((?:\\\\.|[^'])*)')\\s*(?:\\))?\\s*(?:\\.html\\((?:true|false)?\\))?\\s*[;,]`,
      'i'
    );
    const matched = String(html).match(reg);
    const raw = matched ? (matched[1] || matched[2] || '') : '';
    const normalized = this.decodeHtmlEntities(
      String(raw)
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '')
        .replace(/\\"/g, '"')
        .replace(/\\'/g, '\'')
    );
    return this.sanitizeWechatMetaText(normalized);
  }

  /**
   * 清理公众号变量文本，移除脚本残片与噪音
   */
  sanitizeWechatMetaText(value = '') {
    let next = String(value || '');
    if (!next) return '';
    next = this.stripHtmlTags(next);
    next = next.replace(/\.html\((?:true|false)?\)\s*;?/gi, '');
    next = next.replace(/\bvar\s+msg_[a-z0-9_]+\s*=\s*[\s\S]*$/i, '');
    next = next.replace(/\bhtmlDecode\s*\([\s\S]*$/i, '');
    next = next.replace(/['"`]+$/g, '');
    next = next.replace(/^[\s"'`]+|[\s"'`]+$/g, '');
    return String(next || '').trim();
  }

  /**
   * 去除 HTML 标签并提取纯文本
   */
  stripHtmlTags(html = '') {
    return this.decodeHtmlEntities(String(html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
  }

  /**
   * 规范化公众号正文里的图片标签，优先使用 data-src
   */
  normalizeWechatImages(contentHtml = '') {
    const source = String(contentHtml || '');
    return source.replace(/<img\b[^>]*>/gi, (tag) => {
      const rawSrc =
        this.getAttrFromTag(tag, 'data-src') ||
        this.getAttrFromTag(tag, 'data-original') ||
        this.getAttrFromTag(tag, 'data-actualsrc') ||
        this.getAttrFromTag(tag, 'src');
      const src = this.normalizeProtocolUrl(rawSrc);
      if (!src || /^data:image\//i.test(src)) return '';
      let nextTag = String(tag || '');
      if (!nextTag) return '';
      // 已有 src 就替换；没有则补充，尽量保留原 class/style/width/height
      if (/\bsrc\s*=/i.test(nextTag)) {
        nextTag = nextTag.replace(
          /\bsrc\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/i,
          `src="${this.escapeHtmlAttr(src)}"`
        );
      } else {
        nextTag = nextTag.replace(/<img\b/i, `<img src="${this.escapeHtmlAttr(src)}"`);
      }
      // 清理公众号私有冗余属性
      nextTag = nextTag
        .replace(/\sdata-src\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
        .replace(/\sdata-original\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
        .replace(/\sdata-actualsrc\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '');
      // 移除会导致前台“有img但看不见”的隐藏样式
      nextTag = nextTag.replace(/\sstyle\s*=\s*(?:"([^"]*)"|'([^']*)')/i, (all, s1, s2) => {
        const styleRaw = String(s1 || s2 || '');
        const normalizedStyle = styleRaw
          .replace(/display\s*:\s*none\s*;?/ig, '')
          .replace(/visibility\s*:\s*hidden\s*;?/ig, '')
          .replace(/\s{2,}/g, ' ')
          .trim();
        if (!normalizedStyle) return '';
        return ` style="${this.escapeHtmlAttr(normalizedStyle)}"`;
      });
      return nextTag;
    });
  }

  /**
   * 判断URL是否像图片地址（用于占位节点转图片）
   */
  isLikelyImageUrl(url = '') {
    const text = String(url || '').toLowerCase();
    if (!text) return false;
    return (
      /\.(png|jpe?g|gif|webp|bmp|svg)(\?|$)/.test(text) ||
      text.includes('wx_fmt=') ||
      text.includes('/mmbiz_') ||
      text.includes('/sz_mmbiz_')
    );
  }

  /**
   * 从标签的 style 属性里提取 background-image/url 图片地址
   */
  getStyleImageUrlFromTag(tag = '') {
    const raw = String(tag || '');
    if (!raw) return '';
    const styleMatch = raw.match(/\bstyle\s*=\s*(?:"([^"]*)"|'([^']*)')/i);
    const styleText = String(styleMatch ? (styleMatch[1] || styleMatch[2] || '') : '').trim();
    if (!styleText) return '';
    const urlMatch = styleText.match(/url\((?:"([^"]+)"|'([^']+)'|([^)]+))\)/i);
    const styleUrl = String(urlMatch ? (urlMatch[1] || urlMatch[2] || urlMatch[3] || '') : '').trim();
    if (!styleUrl) return '';
    return this.normalizeProtocolUrl(styleUrl);
  }

  /**
   * 将正文中“非img但携带 data-src/data-original/data-actualsrc 的节点”转换为 img
   * 目的：保持公众号图文原始顺序，避免图片被后置追加
   */
  normalizeWechatImageLikeNodes(contentHtml = '') {
    const source = String(contentHtml || '');
    if (!source) return '';
    const reg = /<([a-z0-9-]+)\b[^>]*(?:data-src|data-original|data-actualsrc|style\s*=\s*(?:"[^"]*url\([^)]+\)[^"]*"|'[^']*url\([^)]+\)[^']*'))[^>]*>(?:[\s\S]*?<\/\1>)?/gi;
    return source.replace(reg, (tag) => {
      const raw = String(tag || '');
      if (!raw) return '';
      if (/^<img\b/i.test(raw)) return raw;
      const picked =
        this.getAttrFromTag(raw, 'data-src') ||
        this.getAttrFromTag(raw, 'data-original') ||
        this.getAttrFromTag(raw, 'data-actualsrc') ||
        this.getStyleImageUrlFromTag(raw) ||
        '';
      const src = this.normalizeProtocolUrl(picked);
      if (!src || !this.isLikelyImageUrl(src)) return raw;
      return `<img src="${this.escapeHtmlAttr(src)}" />`;
    });
  }

  /**
   * 按段落间隔插入兜底图片（避免全部堆到文末）
   */
  injectFallbackImagesByParagraph(content = '', urls = [], interval = 3) {
    const html = String(content || '');
    const list = Array.isArray(urls) ? urls.filter(Boolean) : [];
    if (!html || !list.length) return html;

    const chunks = html.split(/<\/p>/i);
    if (chunks.length <= 1) {
      const fallbackHtml = list
        .map(url => `<p><img src="${this.escapeHtmlAttr(url)}" /></p>`)
        .join('');
      return `${html}${fallbackHtml}`;
    }

    const step = Math.max(1, Number(interval || 3));
    let used = 0;
    const nextChunks = chunks.map((part, index) => {
      if (!part) return part;
      let block = `${part}</p>`;
      const paragraphIndex = index + 1;
      if (used < list.length && paragraphIndex % step === 0) {
        const imgUrl = list[used];
        used += 1;
        block += `<p><img src="${this.escapeHtmlAttr(imgUrl)}" /></p>`;
      }
      return block;
    });
    return nextChunks.join('').replace(/<\/p>\s*$/i, '</p>');
  }

  /**
   * 规范化公众号正文 HTML（保留主体结构，移除脚本样式）
   */
  sanitizeWechatContent(contentHtml = '') {
    let next = String(contentHtml || '');
    next = next.replace(/<script[\s\S]*?<\/script>/gi, '');
    next = next.replace(/<!--[\s\S]*?-->/g, '');
    next = this.normalizeWechatImageLikeNodes(next);
    next = this.normalizeWechatImages(next);
    return next.trim();
  }

  /**
   * 从公众号整页 HTML 中兜底提取图片 URL（兼容 msg_cdn_url / cdn_url_* 变量）
   */
  extractWechatImageUrlsFromHtml(html = '') {
    const source = String(html || '');
    if (!source) return [];
    const urls = [];
    const pushUrl = (value = '') => {
      const text = this.normalizeProtocolUrl(
        this.decodeHtmlEntities(this.decodeJsEscapes(String(value || '').trim()))
      );
      if (!text) return;
      if (!/^https?:\/\//i.test(text)) return;
      if (/^data:image\//i.test(text)) return;
      urls.push(text);
    };

    // 1) 常规 img 标签属性
    const imgTags = source.match(/<img\b[^>]*>/gi) || [];
    for (let i = 0; i < imgTags.length; i += 1) {
      const tag = imgTags[i];
      pushUrl(this.getAttrFromTag(tag, 'data-src'));
      pushUrl(this.getAttrFromTag(tag, 'data-original'));
      pushUrl(this.getAttrFromTag(tag, 'data-actualsrc'));
      pushUrl(this.getAttrFromTag(tag, 'src'));
    }

    // 2) 公众号脚本变量：msg_cdn_url / cdn_url_xxx
    const scriptVarReg = /\b(?:msg_cdn_url|cdn_url_[a-z0-9_]+|[a-z0-9_]*cdn_url[a-z0-9_]*)\s*=\s*(?:"((?:\\.|[^"])*)"|'((?:\\.|[^'])*)')/gi;
    let scriptMatch;
    while ((scriptMatch = scriptVarReg.exec(source)) !== null) {
      pushUrl(scriptMatch[1] || scriptMatch[2] || '');
    }

    // 3) 兜底扫描脚本中的 mmbiz 裸 URL（兼容转义斜杠）
    const mmbizUrlReg = /(https?:\\\/\\\/mmbiz\.qpic\.cn[^\s"'<>]+)/gi;
    let mmbizMatch;
    while ((mmbizMatch = mmbizUrlReg.exec(source)) !== null) {
      pushUrl(mmbizMatch[1] || '');
    }

    const unique = Array.from(new Set(urls.filter(Boolean)));
    return unique;
  }

  /**
   * 按元素 ID 提取内部 HTML（支持同标签嵌套，避免正则截断）
   */
  extractElementInnerHtmlById(html = '', elementId = '') {
    const source = String(html || '');
    const id = String(elementId || '').trim();
    if (!source || !id) return '';

    const escapedId = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const startTagReg = new RegExp(
      `<([a-z0-9]+)\\b[^>]*\\bid\\s*=\\s*(['"])${escapedId}\\2[^>]*>`,
      'i'
    );
    const startMatch = source.match(startTagReg);
    if (!startMatch || startMatch.index === undefined) return '';

    const tagName = String(startMatch[1] || '').toLowerCase();
    const startTagEndIndex = startMatch.index + startMatch[0].length;
    const rest = source.slice(startTagEndIndex);

    // 使用同标签计数，找到与起始标签配对的结束标签
    const tagTokenReg = new RegExp(`<\\/?${tagName}\\b[^>]*>`, 'gi');
    let depth = 1;
    let match;
    while ((match = tagTokenReg.exec(rest)) !== null) {
      const token = String(match[0] || '');
      const isClose = /^<\//.test(token);
      if (isClose) {
        depth -= 1;
      } else {
        depth += 1;
      }
      if (depth === 0) {
        return rest.slice(0, match.index);
      }
    }
    return '';
  }

  /**
   * 按 class 提取首个元素的内部 HTML（支持同标签嵌套）
   */
  extractElementInnerHtmlByClass(html = '', className = '') {
    const source = String(html || '');
    const targetClass = String(className || '').trim();
    if (!source || !targetClass) return '';

    const escapedClass = targetClass.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const startTagReg = new RegExp(
      `<([a-z0-9]+)\\b[^>]*\\bclass\\s*=\\s*(['"])[^'"]*\\b${escapedClass}\\b[^'"]*\\2[^>]*>`,
      'i'
    );
    const startMatch = source.match(startTagReg);
    if (!startMatch || startMatch.index === undefined) return '';

    const tagName = String(startMatch[1] || '').toLowerCase();
    const startTagEndIndex = startMatch.index + startMatch[0].length;
    const rest = source.slice(startTagEndIndex);
    const tagTokenReg = new RegExp(`<\\/?${tagName}\\b[^>]*>`, 'gi');
    let depth = 1;
    let match;
    while ((match = tagTokenReg.exec(rest)) !== null) {
      const token = String(match[0] || '');
      const isClose = /^<\//.test(token);
      if (isClose) {
        depth -= 1;
      } else {
        depth += 1;
      }
      if (depth === 0) {
        return rest.slice(0, match.index);
      }
    }
    return '';
  }

  /**
   * 校验并规范化公众号文章链接
   */
  normalizeWechatArticleUrl(rawUrl = '') {
    const extracted = this.extractFirstHttpUrl(rawUrl);
    const text = this.normalizeProtocolUrl(extracted)
      .replace(/[)\],;]+$/g, '');
    if (!text) throw new Error('请输入公众号文章链接');
    let parsed;
    try {
      parsed = new URL(text);
    } catch (error) {
      throw new Error('公众号文章链接格式错误');
    }
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new Error('仅支持 http/https 链接');
    }
    const host = String(parsed.hostname || '').toLowerCase();
    if (host !== 'mp.weixin.qq.com' && host !== 'weixin.qq.com') {
      throw new Error('仅支持公众号文章链接（mp.weixin.qq.com）');
    }
    parsed.hash = '';
    return parsed.toString();
  }

  /**
   * 抓取公众号页面 HTML（请求头兜底重试）
   */
  async fetchWechatArticleHtml(url = '') {
    const { ctx } = this;
    const articleUrl = String(url || '').trim();
    if (!articleUrl) {
      throw new Error('公众号文章链接为空');
    }

    const baseHeaders = {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X) AppleWebKit/537.36 Chrome/120 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      Connection: 'keep-alive',
    };
    const headerCandidates = [
      { ...baseHeaders, Referer: 'https://mp.weixin.qq.com/' },
      { ...baseHeaders },
    ];
    const transferConfig = this.config.remoteImageTransfer || {};

    /**
     * 执行一次抓取（支持控制 TLS 校验）
     */
    const curlOnce = async (headers = {}, rejectUnauthorized = true) => {
      return await ctx.curl(articleUrl, {
        method: 'GET',
        dataType: 'text',
        timeout: 15000,
        followRedirect: true,
        rejectUnauthorized,
        headers,
      });
    };

    /**
     * 判断是否允许对当前域名启用“不校验证书”兜底
     */
    const allowInsecureTlsForCurrentHost = () => {
      try {
        const parsed = new URL(articleUrl);
        const host = String(parsed.hostname || '').trim().toLowerCase();
        const allow = Boolean(transferConfig.allowInsecureTls);
        const domains = Array.isArray(transferConfig.insecureDomains) ? transferConfig.insecureDomains : [];
        const whitelist = domains.map(v => String(v || '').trim().toLowerCase());
        return allow && whitelist.includes(host);
      } catch (error) {
        return false;
      }
    };

    /**
     * 判断错误是否为证书链相关错误
     */
    const isTlsIssuerError = (error) => {
      const message = String(error && error.message ? error.message : '').toLowerCase();
      const code = String(error && error.code ? error.code : '').toUpperCase();
      return (
        message.includes('unable to get local issuer certificate') ||
        message.includes('self-signed certificate') ||
        message.includes('unable to verify the first certificate') ||
        code === 'UNABLE_TO_GET_ISSUER_CERT_LOCALLY' ||
        code === 'DEPTH_ZERO_SELF_SIGNED_CERT' ||
        code === 'SELF_SIGNED_CERT_IN_CHAIN' ||
        code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE'
      );
    };

    let lastStatus = 0;
    let lastError = null;
    for (let i = 0; i < headerCandidates.length; i += 1) {
      try {
        const response = await curlOnce(headerCandidates[i], true);
        const status = Number(response.status || 0);
        if (status >= 400) {
          lastStatus = status;
          continue;
        }
        const html = String(response.data || '');
        if (html.trim()) {
          return html;
        }
      } catch (error) {
        lastError = error;
      }
    }

    // 证书链异常兜底：仅在配置允许且域名白名单命中时，降级为不校验证书重试
    if (lastError && isTlsIssuerError(lastError) && allowInsecureTlsForCurrentHost()) {
      ctx.logger.warn(`fetchWechatArticleHtml retry insecure tls: url=${articleUrl}`);
      lastError = null;
      for (let i = 0; i < headerCandidates.length; i += 1) {
        try {
          const response = await curlOnce(headerCandidates[i], false);
          const status = Number(response.status || 0);
          if (status >= 400) {
            lastStatus = status;
            continue;
          }
          const html = String(response.data || '');
          if (html.trim()) {
            return html;
          }
        } catch (error) {
          lastError = error;
        }
      }
    }

    if (lastError) {
      throw lastError;
    }
    if (lastStatus >= 400) {
      throw new Error(`公众号文章抓取失败(${lastStatus})`);
    }
    throw new Error('公众号文章内容为空');
  }

  /**
   * 从页面脚本中提取跳转链接（兼容 location.href / location.replace）
   */
  extractWechatScriptRedirectUrl(html = '', baseUrl = '') {
    const source = String(html || '');
    if (!source) return '';
    const patterns = [
      /location\.replace\(\s*['"]([^'"]+)['"]\s*\)/i,
      /location\.href\s*=\s*['"]([^'"]+)['"]/i,
      /window\.location\.href\s*=\s*['"]([^'"]+)['"]/i,
    ];
    for (let i = 0; i < patterns.length; i += 1) {
      const matched = source.match(patterns[i]);
      if (!matched || !matched[1]) continue;
      try {
        const parsed = new URL(String(matched[1]), String(baseUrl || ''));
        const host = String(parsed.hostname || '').toLowerCase();
        if (host === 'mp.weixin.qq.com' || host === 'weixin.qq.com') {
          parsed.hash = '';
          return parsed.toString();
        }
      } catch (error) {
        // ignore
      }
    }
    return '';
  }

  /**
   * 提取公众号正文容器（多级兜底）
   */
  extractWechatRawContent(html = '') {
    const source = String(html || '');
    let rawContent = this.extractElementInnerHtmlById(source, 'js_content');
    let sourceType = 'id#js_content';
    if (!rawContent) {
      rawContent = this.extractElementInnerHtmlByClass(source, 'rich_media_content');
      sourceType = 'class.rich_media_content';
    }
    if (!rawContent) {
      rawContent = this.extractElementInnerHtmlById(source, 'activity-detail');
      sourceType = 'id#activity-detail';
    }
    return { rawContent, sourceType };
  }

  /**
   * 公众号链接导入：抓取标题/简介/作者/正文/封面
   */
  async importWechatArticle(rawUrl = '') {
    const { ctx } = this;
    const articleUrl = this.normalizeWechatArticleUrl(rawUrl);
    let html = await this.fetchWechatArticleHtml(articleUrl);
    let { rawContent, sourceType } = this.extractWechatRawContent(html);

    // 某些链接会先返回脚本跳转页，这里自动二次抓取一次
    if (!rawContent) {
      const redirectUrl = this.extractWechatScriptRedirectUrl(html, articleUrl);
      if (redirectUrl && redirectUrl !== articleUrl) {
        html = await this.fetchWechatArticleHtml(redirectUrl);
        const nextExtract = this.extractWechatRawContent(html);
        rawContent = nextExtract.rawContent;
        sourceType = `${nextExtract.sourceType}(redirect)`;
      }
    }

    let content = this.sanitizeWechatContent(rawContent);
    if (!content) {
      ctx.logger.warn(
        `importWechatArticle empty content: url=${articleUrl}, sourceType=${sourceType}, hasJsContent=${/id=(['"])js_content\\1/i.test(html)}`
      );
      throw new Error('未识别到公众号正文内容，请确认链接是否可公开访问');
    }

    const title =
      this.extractJsStringValue(html, 'msg_title') ||
      this.extractMetaContent(html, 'og:title') ||
      this.extractMetaContent(html, 'twitter:title') ||
      '';
    const intro =
      this.extractJsStringValue(html, 'msg_desc') ||
      this.extractMetaContent(html, 'description') ||
      this.extractMetaContent(html, 'og:description') ||
      this.stripHtmlTags(content).slice(0, 120);
    const author =
      this.extractJsStringValue(html, 'nickname') ||
      this.extractMetaContent(html, 'author') ||
      '';
    const fallbackImages = this.extractWechatImageUrlsFromHtml(html);
    const remoteImgTags = content.match(/<img\b[^>]*\bsrc\s*=\s*["']https?:\/\/[^"']+["'][^>]*>/gi) || [];
    const visibleRemoteImgCount = remoteImgTags.filter(tag => !/display\s*:\s*none|visibility\s*:\s*hidden/i.test(String(tag || ''))).length;
    if (visibleRemoteImgCount < 2 && fallbackImages.length > 0) {
      // 无图模板兜底：按段落插入，降低“文案一段后全是图片”的割裂感
      content = this.injectFallbackImagesByParagraph(content, fallbackImages.slice(0, 12), 3);
    }
    const image = this.extractFirstImageFromContent(content) || String(fallbackImages[0] || '');
    ctx.logger.info(
      `importWechatArticle image-detect: contentImg=${(/<img\\b/gi.exec(content) ? (content.match(/<img\\b/gi) || []).length : 0)}, visibleRemoteImg=${visibleRemoteImgCount}, fallbackImg=${fallbackImages.length}, url=${articleUrl}`
    );
    const normalizedTitle = this.sanitizeWechatMetaText(title);
    const normalizedIntro = this.sanitizeWechatMetaText(intro);
    const normalizedAuthor = this.sanitizeWechatMetaText(author);

    return {
      sourceUrl: articleUrl,
      title: String(normalizedTitle || '').trim(),
      intro: String(normalizedIntro || '').trim(),
      author: String(normalizedAuthor || '').trim(),
      image: String(image || '').trim(),
      content,
    };
  }

  /**
   * 从正文 HTML 中提取第一张图片地址（用于未设置封面图时的兜底）
   */
  extractFirstImageFromContent(content) {
    const raw = String(content || '');
    const match = raw.match(/<img\b[^>]*>/i);
    if (!match) return '';
    const tag = match[0];
    const decodeHtml = (value = '') => {
      return String(value || '')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, '\'')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .trim();
    };
    const getAttr = (attrName) => {
      const re = new RegExp(`\\b${attrName}\\s*=\\s*(?:\"([^\"]*)\"|'([^']*)'|([^\\s>]+))`, 'i');
      const m = tag.match(re);
      return decodeHtml(m ? (m[1] || m[2] || m[3] || '') : '');
    };
    const picked =
      getAttr('data-src') ||
      getAttr('data-original') ||
      getAttr('data-actualsrc') ||
      getAttr('src') ||
      '';
    if (!picked) return '';
    // base64 图片不适合作为封面落库
    if (/^data:image\//i.test(picked)) return '';
    // 兼容 //example.com
    if (picked.startsWith('//')) return `https:${picked}`;
    return picked;
  }

  /**
   * 规范化封面图存储值（尽量存相对路径；外链保持原样）
   */
  normalizeStoreImageValue(value) {
    const raw = String(value || '').trim();
    if (!raw) return '';
    // 外链：仅当是本站 publicUrl 才转相对路径，避免 urlUtil.toRelativeUrl 误替换导致链接被破坏
    if (/^https?:\/\//i.test(raw)) {
      const base = String(publicUrl || '').trim();
      if (base && raw.startsWith(base)) {
        try {
          return urlUtil.toRelativeUrl(raw);
        } catch (error) {
          return raw;
        }
      }
      return raw;
    }
    // 相对路径（/public/uploads/...）
    return raw;
  }
  /**
   * 判断是否为有效的后台管理员请求
   * 说明：文章接口已允许免登录访问，因此需要在服务层兜底区分“匿名访问”和“后台访问”。
   */
  async isValidAdminRequest() {
    const { ctx } = this;
    const token = String(ctx.request.header.token || '').trim();
    if (!token) return false;
    try {
      const tokenKey = backstageTokenKey + token;
      const exist = await ctx.service.redis.exists(tokenKey);
      return Number(exist) > 0;
    } catch (error) {
      ctx.logger.warn(`ArticleService.isValidAdminRequest warn: ${error.message || error}`);
      return false;
    }
  }

  /**
   * 确保文章点赞表存在（兼容历史库未初始化场景）
   */
  async ensureArticleLikeTable() {
    const { ctx, app } = this;
    if (app.__articleLikeTableReady) return true;
    try {
      await ctx.model.query(`
        CREATE TABLE IF NOT EXISTS \`la_article_like\` (
          \`id\` int unsigned NOT NULL AUTO_INCREMENT,
          \`user_id\` int unsigned NOT NULL DEFAULT 0,
          \`article_id\` int unsigned NOT NULL DEFAULT 0,
          \`is_delete\` tinyint unsigned NOT NULL DEFAULT 0,
          \`create_time\` int unsigned NOT NULL DEFAULT 0,
          \`update_time\` int unsigned NOT NULL DEFAULT 0,
          \`delete_time\` int unsigned NOT NULL DEFAULT 0,
          PRIMARY KEY (\`id\`),
          UNIQUE KEY \`uk_user_article\` (\`user_id\`,\`article_id\`),
          KEY \`idx_article_delete\` (\`article_id\`,\`is_delete\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);
      app.__articleLikeTableReady = true;
      return true;
    } catch (error) {
      ctx.logger.warn(`ensureArticleLikeTable skipped: ${error.message || error}`);
      return false;
    }
  }

  /**
   * 确保文章留言表存在（兼容历史库未初始化场景）
   */
  async ensureArticleCommentTable() {
    const { ctx, app } = this;
    if (app.__articleCommentTableReady) return true;
    try {
      await ctx.model.query(`
        CREATE TABLE IF NOT EXISTS \`la_article_comment\` (
          \`id\` int unsigned NOT NULL AUTO_INCREMENT,
          \`user_id\` int unsigned NOT NULL DEFAULT 0,
          \`article_id\` int unsigned NOT NULL DEFAULT 0,
          \`parent_id\` int unsigned NOT NULL DEFAULT 0,
          \`content\` varchar(1000) NOT NULL DEFAULT '',
          \`ip\` varchar(64) NOT NULL DEFAULT '',
          \`is_top\` tinyint unsigned NOT NULL DEFAULT 0,
          \`is_show\` tinyint unsigned NOT NULL DEFAULT 1,
          \`is_delete\` tinyint unsigned NOT NULL DEFAULT 0,
          \`create_time\` int unsigned NOT NULL DEFAULT 0,
          \`update_time\` int unsigned NOT NULL DEFAULT 0,
          \`delete_time\` int unsigned NOT NULL DEFAULT 0,
          PRIMARY KEY (\`id\`),
          KEY \`idx_article_delete\` (\`article_id\`,\`is_delete\`),
          KEY \`idx_parent_delete\` (\`parent_id\`,\`is_delete\`),
          KEY \`idx_user_delete\` (\`user_id\`,\`is_delete\`),
          KEY \`idx_ip_delete\` (\`ip\`,\`is_delete\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);
      await ctx.model.query(
        'ALTER TABLE `la_article_comment` ADD COLUMN `is_top` tinyint unsigned NOT NULL DEFAULT 0 AFTER `content`;'
      ).catch(() => {});
      await ctx.model.query(
        'ALTER TABLE `la_article_comment` ADD COLUMN `ip` varchar(64) NOT NULL DEFAULT \'\' AFTER `content`;'
      ).catch(() => {});
      await ctx.model.query(
        'ALTER TABLE `la_article_comment` ADD INDEX `idx_ip_delete` (`ip`,`is_delete`);'
      ).catch(() => {});
      app.__articleCommentTableReady = true;
      return true;
    } catch (error) {
      ctx.logger.warn(`ensureArticleCommentTable skipped: ${error.message || error}`);
      return false;
    }
  }

  /**
   * 确保评论点赞表存在
   */
  async ensureArticleCommentLikeTable() {
    const { ctx, app } = this;
    if (app.__articleCommentLikeTableReady) return true;
    try {
      await ctx.model.query(`
        CREATE TABLE IF NOT EXISTS \`la_article_comment_like\` (
          \`id\` int unsigned NOT NULL AUTO_INCREMENT,
          \`user_id\` int unsigned NOT NULL DEFAULT 0,
          \`comment_id\` int unsigned NOT NULL DEFAULT 0,
          \`is_delete\` tinyint unsigned NOT NULL DEFAULT 0,
          \`create_time\` int unsigned NOT NULL DEFAULT 0,
          \`update_time\` int unsigned NOT NULL DEFAULT 0,
          \`delete_time\` int unsigned NOT NULL DEFAULT 0,
          PRIMARY KEY (\`id\`),
          UNIQUE KEY \`uk_user_comment\` (\`user_id\`,\`comment_id\`),
          KEY \`idx_comment_delete\` (\`comment_id\`,\`is_delete\`),
          KEY \`idx_user_delete\` (\`user_id\`,\`is_delete\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);
      app.__articleCommentLikeTableReady = true;
      return true;
    } catch (error) {
      ctx.logger.warn(`ensureArticleCommentLikeTable skipped: ${error.message || error}`);
      return false;
    }
  }

  /**
   * 确保评论禁言表存在
   */
  async ensureArticleCommentMuteTable() {
    const { ctx, app } = this;
    if (app.__articleCommentMuteTableReady) return true;
    try {
      await ctx.model.query(`
        CREATE TABLE IF NOT EXISTS \`la_article_comment_mute\` (
          \`id\` int unsigned NOT NULL AUTO_INCREMENT,
          \`user_id\` int unsigned NOT NULL DEFAULT 0,
          \`ip\` varchar(64) NOT NULL DEFAULT '',
          \`reason\` varchar(255) NOT NULL DEFAULT '',
          \`expire_time\` int unsigned NOT NULL DEFAULT 0,
          \`is_delete\` tinyint unsigned NOT NULL DEFAULT 0,
          \`create_time\` int unsigned NOT NULL DEFAULT 0,
          \`update_time\` int unsigned NOT NULL DEFAULT 0,
          \`delete_time\` int unsigned NOT NULL DEFAULT 0,
          PRIMARY KEY (\`id\`),
          KEY \`idx_user_expire\` (\`user_id\`,\`expire_time\`,\`is_delete\`),
          KEY \`idx_ip_expire\` (\`ip\`,\`expire_time\`,\`is_delete\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);
      app.__articleCommentMuteTableReady = true;
      return true;
    } catch (error) {
      ctx.logger.warn(`ensureArticleCommentMuteTable skipped: ${error.message || error}`);
      return false;
    }
  }

  /**
   * 确保评论举报表存在
   */
  async ensureArticleCommentReportTable() {
    const { ctx, app } = this;
    if (app.__articleCommentReportTableReady) return true;
    try {
      await ctx.model.query(`
        CREATE TABLE IF NOT EXISTS \`la_article_comment_report\` (
          \`id\` int unsigned NOT NULL AUTO_INCREMENT,
          \`comment_id\` int unsigned NOT NULL DEFAULT 0,
          \`article_id\` int unsigned NOT NULL DEFAULT 0,
          \`reporter_user_id\` int unsigned NOT NULL DEFAULT 0,
          \`reason\` varchar(120) NOT NULL DEFAULT '',
          \`content\` varchar(500) NOT NULL DEFAULT '',
          \`status\` tinyint unsigned NOT NULL DEFAULT 0,
          \`handle_admin_id\` int unsigned NOT NULL DEFAULT 0,
          \`handle_remark\` varchar(255) NOT NULL DEFAULT '',
          \`handle_time\` int unsigned NOT NULL DEFAULT 0,
          \`is_delete\` tinyint unsigned NOT NULL DEFAULT 0,
          \`create_time\` int unsigned NOT NULL DEFAULT 0,
          \`update_time\` int unsigned NOT NULL DEFAULT 0,
          \`delete_time\` int unsigned NOT NULL DEFAULT 0,
          PRIMARY KEY (\`id\`),
          KEY \`idx_comment_status\` (\`comment_id\`,\`status\`,\`is_delete\`),
          KEY \`idx_reporter\` (\`reporter_user_id\`,\`is_delete\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);
      app.__articleCommentReportTableReady = true;
      return true;
    } catch (error) {
      ctx.logger.warn(`ensureArticleCommentReportTable skipped: ${error.message || error}`);
      return false;
    }
  }

  /**
   * 确保文章作者关联表存在（用于前端投稿列表/草稿编辑鉴权）
   */
  async ensureArticleAuthorRelTable() {
    const { ctx, app } = this;
    if (app.__articleAuthorRelTableReady) return true;
    try {
      await ctx.model.query(`
        CREATE TABLE IF NOT EXISTS \`la_article_author_rel\` (
          \`id\` int unsigned NOT NULL AUTO_INCREMENT,
          \`article_id\` int unsigned NOT NULL DEFAULT 0,
          \`user_id\` int unsigned NOT NULL DEFAULT 0,
          \`is_delete\` tinyint unsigned NOT NULL DEFAULT 0,
          \`create_time\` int unsigned NOT NULL DEFAULT 0,
          \`update_time\` int unsigned NOT NULL DEFAULT 0,
          \`delete_time\` int unsigned NOT NULL DEFAULT 0,
          PRIMARY KEY (\`id\`),
          UNIQUE KEY \`uk_article_user\` (\`article_id\`,\`user_id\`),
          KEY \`idx_user_delete\` (\`user_id\`,\`is_delete\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);
      app.__articleAuthorRelTableReady = true;
      return true;
    } catch (error) {
      ctx.logger.warn(`ensureArticleAuthorRelTable skipped: ${error.message || error}`);
      return false;
    }
  }

  /**
   * 获取当前前台登录用户ID（可选强制登录）
   */
  async getFrontendUserId(required = false) {
    const { ctx } = this;
    const token = String(ctx.request.header.token || '').trim();
    if (!token) {
      if (required) throw new Error('未登录');
      return 0;
    }
    const appConfig = ctx.app.config || {};
    const userTokenRedisKey = String(appConfig.userTokenKey || userTokenKey || '').trim() || 'user:token:';
    const uid = await ctx.service.redis.get(userTokenRedisKey + token);
    const userId = Number(uid || 0);
    if (!userId) {
      if (required) throw new Error('登录已失效');
      return 0;
    }
    return userId;
  }

  /**
   * 批量查询文章收藏数映射
   */
  async getArticleCollectCountMap(articleIds = []) {
    const { ctx } = this;
    const ids = this.parseIdArray(articleIds);
    const countMap = new Map();
    if (!ids.length) return countMap;
    const rows = await ctx.model.ArticleCollect.findAll({
      attributes: [ 'article_id', [Sequelize.fn('COUNT', Sequelize.col('id')), 'total' ] ],
      where: {
        article_id: { [Op.in]: ids },
        is_delete: 0,
      },
      group: [ 'article_id' ],
    });
    rows.forEach(item => {
      countMap.set(Number(item.get('article_id') || 0), Number(item.get('total') || 0));
    });
    return countMap;
  }

  /**
   * 批量查询文章点赞数映射
   */
  async getArticleLikeCountMap(articleIds = []) {
    const { ctx } = this;
    const ids = this.parseIdArray(articleIds);
    const countMap = new Map();
    if (!ids.length) return countMap;
    const ready = await this.ensureArticleLikeTable();
    if (!ready) return countMap;
    try {
      const rows = await ctx.model.ArticleLike.findAll({
        attributes: [ 'article_id', [Sequelize.fn('COUNT', Sequelize.col('id')), 'total' ] ],
        where: {
          article_id: { [Op.in]: ids },
          is_delete: 0,
        },
        group: [ 'article_id' ],
      });
      rows.forEach(item => {
        countMap.set(Number(item.get('article_id') || 0), Number(item.get('total') || 0));
      });
    } catch (error) {
      ctx.logger.warn(`getArticleLikeCountMap fallback empty: ${error.message || error}`);
    }
    return countMap;
  }

  /**
   * 批量查询文章留言数映射
   */
  async getArticleCommentCountMap(articleIds = []) {
    const { ctx } = this;
    const ids = this.parseIdArray(articleIds);
    const countMap = new Map();
    if (!ids.length) return countMap;
    const ready = await this.ensureArticleCommentTable();
    if (!ready) return countMap;
    try {
      const rows = await ctx.model.ArticleComment.findAll({
        attributes: [ 'article_id', [Sequelize.fn('COUNT', Sequelize.col('id')), 'total' ] ],
        where: {
          article_id: { [Op.in]: ids },
          is_delete: 0,
          is_show: 1,
        },
        group: [ 'article_id' ],
      });
      rows.forEach(item => {
        countMap.set(Number(item.get('article_id') || 0), Number(item.get('total') || 0));
      });
    } catch (error) {
      ctx.logger.warn(`getArticleCommentCountMap fallback empty: ${error.message || error}`);
    }
    return countMap;
  }

  /**
   * 获取当前用户的收藏状态映射
   */
  async getUserCollectStatusMap(articleIds = [], userId = 0) {
    const { ctx } = this;
    const ids = this.parseIdArray(articleIds);
    const statusMap = new Map();
    if (!ids.length || !Number(userId || 0)) return statusMap;
    const rows = await ctx.model.ArticleCollect.findAll({
      attributes: [ 'article_id' ],
      where: {
        article_id: { [Op.in]: ids },
        user_id: Number(userId),
        is_delete: 0,
      },
    });
    rows.forEach(item => {
      statusMap.set(Number(item.get('article_id') || 0), 1);
    });
    return statusMap;
  }

  /**
   * 获取当前用户的点赞状态映射
   */
  async getUserLikeStatusMap(articleIds = [], userId = 0) {
    const { ctx } = this;
    const ids = this.parseIdArray(articleIds);
    const statusMap = new Map();
    if (!ids.length || !Number(userId || 0)) return statusMap;
    const ready = await this.ensureArticleLikeTable();
    if (!ready) return statusMap;
    try {
      const rows = await ctx.model.ArticleLike.findAll({
        attributes: [ 'article_id' ],
        where: {
          article_id: { [Op.in]: ids },
          user_id: Number(userId),
          is_delete: 0,
        },
      });
      rows.forEach(item => {
        statusMap.set(Number(item.get('article_id') || 0), 1);
      });
    } catch (error) {
      ctx.logger.warn(`getUserLikeStatusMap fallback empty: ${error.message || error}`);
    }
    return statusMap;
  }

  /**
   * 批量聚合文章互动数据（收藏/点赞 + 当前用户状态）
   */
  async getArticleInteractionStats(articleIds = [], userId = 0) {
    const ids = this.parseIdArray(articleIds);
    const [ collectMap, likeMap, commentMap, userCollectMap, userLikeMap ] = await Promise.all([
      this.getArticleCollectCountMap(ids),
      this.getArticleLikeCountMap(ids),
      this.getArticleCommentCountMap(ids),
      this.getUserCollectStatusMap(ids, userId),
      this.getUserLikeStatusMap(ids, userId),
    ]);
    return { collectMap, likeMap, commentMap, userCollectMap, userLikeMap };
  }

  /**
   * 批量获取文章作者资料映射
   */
  async getArticleAuthorMap(articleIds = [], forcePublic = false) {
    const { ctx } = this;
    const ids = this.parseIdArray(articleIds);
    const map = new Map();
    if (!ids.length) return map;
    const ready = await this.ensureArticleAuthorRelTable();
    if (!ready) return map;
    const rels = await ctx.model.ArticleAuthorRel.findAll({
      where: {
        article_id: { [Op.in]: ids },
        is_delete: 0,
      },
      attributes: [ 'id', 'article_id', 'user_id' ],
      order: [[ 'id', 'DESC' ]],
    }).catch(() => []);
    if (!rels.length) return map;
    const userIds = Array.from(new Set(rels.map(item => Number(item.user_id || 0)).filter(Boolean)));
    const authorMap = await ctx.service.user.getAuthorProfileMap(userIds, forcePublic);
    rels.forEach(item => {
      const articleId = Number(item.article_id || 0);
      const userId = Number(item.user_id || 0);
      if (!articleId || !userId) return;
      if (map.has(articleId)) return;
      const author = authorMap.get(userId);
      if (author) {
        map.set(articleId, author);
      }
    });
    return map;
  }

  /**
   * 解析作者输入（支持用户ID或用户名/昵称/真实姓名）
   */
  async resolveAuthorInput(authorInput = '') {
    const { ctx } = this;
    const keyword = String(authorInput || '').trim();
    if (!keyword) {
      return { userId: 0, authorName: '' };
    }
    let user = null;
    if (/^\d+$/.test(keyword)) {
      user = await ctx.model.User.findOne({
        where: {
          id: Number(keyword),
          isDelete: 0,
        },
        attributes: [ 'id', 'nickname', 'username', 'realName' ],
      });
      if (!user) {
        throw new Error('作者ID对应用户不存在');
      }
    } else {
      const users = await ctx.model.User.findAll({
        where: {
          isDelete: 0,
          [Op.or]: [
            { nickname: keyword },
            { username: keyword },
            { realName: keyword },
          ],
        },
        attributes: [ 'id', 'nickname', 'username', 'realName' ],
        limit: 2,
        order: [[ 'id', 'DESC' ]],
      });
      if (!users.length) {
        throw new Error('作者名称未匹配到用户，请填写用户ID或正确名称');
      }
      if (users.length > 1) {
        throw new Error('作者名称匹配到多个用户，请填写用户ID');
      }
      user = users[0];
    }
    const userId = Number(user?.id || 0);
    const authorName = String(user?.nickname || user?.username || user?.realName || `用户${userId}`);
    return { userId, authorName };
  }

  /**
   * 保存文章作者关联（覆盖为单作者）
   */
  async saveArticleAuthorRelation(articleId, userId, now = Math.floor(Date.now() / 1000)) {
    const { ctx } = this;
    const id = Number(articleId || 0);
    const uid = Number(userId || 0);
    if (!id) return;
    const ready = await this.ensureArticleAuthorRelTable();
    if (!ready) return;
    await ctx.model.ArticleAuthorRel.update({
      is_delete: 1,
      delete_time: now,
      update_time: now,
    }, {
      where: {
        article_id: id,
        is_delete: 0,
      },
    });
    if (!uid) return;
    const exists = await ctx.model.ArticleAuthorRel.findOne({
      where: {
        article_id: id,
        user_id: uid,
      },
    });
    if (exists) {
      await ctx.model.ArticleAuthorRel.update({
        is_delete: 0,
        delete_time: 0,
        update_time: now,
      }, {
        where: { id: Number(exists.id || 0) },
      });
      return;
    }
    await ctx.model.ArticleAuthorRel.create({
      article_id: id,
      user_id: uid,
      is_delete: 0,
      create_time: now,
      update_time: now,
      delete_time: 0,
    });
  }

  /**
   * 构建文章分类查询条件
   */
  async buildCategoryWhere(params = {}) {
    const where = { is_delete: 0 };
    const isAdminRequest = await this.isValidAdminRequest();
    if (isAdminRequest) {
      if (params.isShow !== undefined && params.isShow !== null && params.isShow !== '') {
        where.is_show = Number(params.isShow);
      }
      return where;
    }
    where.is_show = 1;
    return where;
  }

  /**
   * 构建文章列表查询条件
   */
  async buildArticleWhere(params = {}) {
    const { title, cid, isShow, reviewStatus } = params;
    const where = { is_delete: 0 };
    if (title) {
      where.title = { [Op.like]: `%${title}%` };
    }
    if (cid) {
      where.cid = cid;
    }
    const isAdminRequest = await this.isValidAdminRequest();
    if (isAdminRequest) {
      await this.ensureArticleReviewColumns();
      if (isShow !== undefined && isShow !== '') {
        where.is_show = Number(isShow);
      }
      if (reviewStatus !== undefined && reviewStatus !== '') {
        where.review_status = Number(reviewStatus);
      }
      return where;
    }
    where.is_show = 1;
    return where;
  }

  /**
   * 解析并清洗 ID 数组（去重、仅保留正整数）
   */
  parseIdArray(input) {
    const raw = Array.isArray(input) ? input : (input ? String(input).split(',') : []);
    const ids = raw
      .map(item => Number(item))
      .filter(item => Number.isInteger(item) && item > 0);
    return Array.from(new Set(ids));
  }

  /**
   * 规范化专题ID
   */
  normalizeTopicId(input) {
    const id = Number(input || 0);
    if (!Number.isInteger(id) || id <= 0) return 0;
    return id;
  }

  /**
   * 保存文章标签关联（覆盖模式）
   */
  async saveArticleTagRelations(articleId, tagIds = []) {
    const { ctx } = this;
    const now = Math.floor(Date.now() / 1000);
    const cleanArticleId = Number(articleId || 0);
    if (!cleanArticleId) return;
    const cleanTagIds = this.parseIdArray(tagIds);

    try {
      await ctx.model.ArticleTagRel.update({
        is_delete: 1,
        delete_time: now,
        update_time: now,
      }, {
        where: {
          article_id: cleanArticleId,
          is_delete: 0,
        },
      });

      if (!cleanTagIds.length) return;
      await ctx.model.ArticleTagRel.bulkCreate(cleanTagIds.map(tagId => ({
        article_id: cleanArticleId,
        tag_id: tagId,
        is_delete: 0,
        create_time: now,
        update_time: now,
        delete_time: 0,
      })));
    } catch (error) {
      ctx.logger.warn(`saveArticleTagRelations skipped: ${error.message || error}`);
    }
  }

  /**
   * 保存文章专题关联（覆盖模式，一篇文章最多一个专题）
   */
  async saveArticleTopicRelation(articleId, topicId = 0) {
    const { ctx } = this;
    const now = Math.floor(Date.now() / 1000);
    const cleanArticleId = Number(articleId || 0);
    if (!cleanArticleId) return;
    const cleanTopicId = this.normalizeTopicId(topicId);

    try {
      await ctx.model.ArticleTopicRel.update({
        is_delete: 1,
        delete_time: now,
        update_time: now,
      }, {
        where: {
          article_id: cleanArticleId,
          is_delete: 0,
        },
      });

      if (!cleanTopicId) return;
      await ctx.model.ArticleTopicRel.create({
        article_id: cleanArticleId,
        topic_id: cleanTopicId,
        is_delete: 0,
        create_time: now,
        update_time: now,
        delete_time: 0,
      });
    } catch (error) {
      ctx.logger.warn(`saveArticleTopicRelation skipped: ${error.message || error}`);
    }
  }

  /**
   * 批量查询文章标签信息映射
   */
  async getArticleTagInfoByArticleIds(articleIds = []) {
    const { ctx } = this;
    const ids = this.parseIdArray(articleIds);
    const tagIdsMap = new Map();
    const tagNamesMap = new Map();
    const tagObjectsMap = new Map();
    if (!ids.length) return { tagIdsMap, tagNamesMap, tagObjectsMap };

    try {
      const rels = await ctx.model.ArticleTagRel.findAll({
        where: {
          article_id: { [Op.in]: ids },
          is_delete: 0,
        },
        attributes: [ 'article_id', 'tag_id' ],
      });
      const allTagIds = Array.from(new Set(rels.map(item => Number(item.tag_id || 0)).filter(Boolean)));
      const tags = allTagIds.length ? await ctx.model.ArticleTag.findAll({
        where: {
          id: { [Op.in]: allTagIds },
          is_delete: 0,
        },
        attributes: [ 'id', 'name' ],
      }) : [];
      const tagNameMap = new Map(tags.map(item => [ Number(item.id), String(item.name || '') ]));

      rels.forEach(item => {
        const articleId = Number(item.article_id || 0);
        const tagId = Number(item.tag_id || 0);
        if (!articleId || !tagId) return;
        if (!tagIdsMap.has(articleId)) tagIdsMap.set(articleId, []);
        tagIdsMap.get(articleId).push(tagId);
      });
      tagIdsMap.forEach((list, articleId) => {
        const uniqueIds = Array.from(new Set(list));
        tagIdsMap.set(articleId, uniqueIds);
        const names = uniqueIds.map(id => String(tagNameMap.get(id) || '')).filter(Boolean);
        const tagObjects = uniqueIds
          .map(id => ({ id: Number(id), name: String(tagNameMap.get(id) || '') }))
          .filter(item => item.id > 0 && item.name);
        tagNamesMap.set(articleId, names);
        tagObjectsMap.set(articleId, tagObjects);
      });
    } catch (error) {
      ctx.logger.warn(`getArticleTagInfoByArticleIds skipped: ${error.message || error}`);
    }
    return { tagIdsMap, tagNamesMap, tagObjectsMap };
  }

  /**
   * 批量查询文章专题信息映射
   */
  async getArticleTopicInfoByArticleIds(articleIds = []) {
    const { ctx } = this;
    const ids = this.parseIdArray(articleIds);
    const topicIdMap = new Map();
    const topicNameMap = new Map();
    if (!ids.length) return { topicIdMap, topicNameMap };

    try {
      const rels = await ctx.model.ArticleTopicRel.findAll({
        where: {
          article_id: { [Op.in]: ids },
          is_delete: 0,
        },
        attributes: [ 'article_id', 'topic_id' ],
      });
      const topicIds = Array.from(new Set(rels.map(item => Number(item.topic_id || 0)).filter(Boolean)));
      const topics = topicIds.length ? await ctx.model.ArticleTopic.findAll({
        where: {
          id: { [Op.in]: topicIds },
          is_delete: 0,
        },
        attributes: [ 'id', 'name' ],
      }) : [];
      const topicMap = new Map(topics.map(item => [ Number(item.id), String(item.name || '') ]));

      rels.forEach(item => {
        const articleId = Number(item.article_id || 0);
        const topicId = Number(item.topic_id || 0);
        if (!articleId || !topicId) return;
        topicIdMap.set(articleId, topicId);
        topicNameMap.set(articleId, topicMap.get(topicId) || '');
      });
    } catch (error) {
      ctx.logger.warn(`getArticleTopicInfoByArticleIds skipped: ${error.message || error}`);
    }
    return { topicIdMap, topicNameMap };
  }

  /**
   * 应用标签/专题过滤条件
   */
  async applyTagAndTopicFilter(where = {}, params = {}) {
    const { ctx } = this;
    const tagId = Number(params.tagId || 0);
    const topicId = Number(params.topicId || 0);
    let mergedIds = null;

    if (tagId > 0) {
      try {
        const rels = await ctx.model.ArticleTagRel.findAll({
          where: { tag_id: tagId, is_delete: 0 },
          attributes: [ 'article_id' ],
        });
        const ids = Array.from(new Set(rels.map(item => Number(item.article_id || 0)).filter(Boolean)));
        mergedIds = ids;
      } catch (error) {
        throw new Error('标签筛选不可用，请先初始化标签数据表');
      }
    }

    if (topicId > 0) {
      try {
        const rels = await ctx.model.ArticleTopicRel.findAll({
          where: { topic_id: topicId, is_delete: 0 },
          attributes: [ 'article_id' ],
        });
        const ids = Array.from(new Set(rels.map(item => Number(item.article_id || 0)).filter(Boolean)));
        mergedIds = mergedIds === null ? ids : mergedIds.filter(id => ids.includes(id));
      } catch (error) {
        throw new Error('专题筛选不可用，请先初始化专题数据表');
      }
    }

    if (mergedIds !== null) {
      where.id = { [Op.in]: mergedIds.length ? mergedIds : [ -1 ] };
    }
    return where;
  }

  async cateList(params) {
    const { ctx } = this;
    const pageNo = Number(params.pageNo || 1);
    const pageSize = Number(params.pageSize || 10);
    const limit = pageSize;
    const offset = pageSize * (pageNo - 1);

    const categoryWhere = await this.buildCategoryWhere(params);
    const articleWhere = await this.buildArticleWhere(params);
    const { count, rows } = await ctx.model.ArticleCategory.findAndCountAll({
      where: categoryWhere,
      limit,
      offset,
      order: [[ 'sort', 'DESC' ], [ 'id', 'DESC' ]],
    });

    const articleCounts = await ctx.model.Article.findAll({
      attributes: [ 'cid', [Sequelize.fn('COUNT', Sequelize.col('id')), 'total'] ],
      where: articleWhere,
      group: [ 'cid' ],
    });
    const countMap = new Map();
    articleCounts.forEach(item => {
      countMap.set(item.get('cid'), Number(item.get('total') || 0));
    });

    const lists = rows.map(item => ({
      id: item.id,
      name: item.name,
      sort: item.sort,
      isShow: item.is_show,
      number: countMap.get(item.id) || 0,
    }));

    return {
      pageNo,
      pageSize,
      count,
      lists,
    };
  }

  /**
   * 获取文章分类下拉数据
   */
  async cateAll(params = {}) {
    const { ctx } = this;
    const where = await this.buildCategoryWhere(params);
    const rows = await ctx.model.ArticleCategory.findAll({
      where,
      order: [[ 'sort', 'DESC' ], [ 'id', 'DESC' ]],
    });
    return rows.map(item => ({
      id: item.id,
      name: item.name,
      isShow: item.is_show,
      sort: item.sort,
    }));
  }

  async cateDetail(id) {
    const { ctx } = this;
    const row = await ctx.model.ArticleCategory.findOne({
      where: { id, is_delete: 0 },
    });
    if (!row) throw new Error('栏目不存在');
    return {
      id: row.id,
      name: row.name,
      sort: row.sort,
      isShow: row.is_show,
    };
  }

  async cateAdd(params) {
    const { ctx } = this;
    const now = Math.floor(Date.now() / 1000);
    await ctx.model.ArticleCategory.create({
      name: params.name || '',
      sort: Number(params.sort || 9999),
      is_show: Number(params.isShow ?? 1),
      is_delete: 0,
      create_time: now,
      update_time: now,
    });
  }

  async cateEdit(params) {
    const { ctx } = this;
    const now = Math.floor(Date.now() / 1000);
    await ctx.model.ArticleCategory.update({
      name: params.name || '',
      sort: Number(params.sort || 9999),
      is_show: Number(params.isShow ?? 1),
      update_time: now,
    }, {
      where: { id: params.id, is_delete: 0 },
    });
  }

  async cateDel(id) {
    const { ctx } = this;
    const now = Math.floor(Date.now() / 1000);
    await ctx.model.ArticleCategory.update({
      is_delete: 1,
      delete_time: now,
      update_time: now,
    }, {
      where: { id, is_delete: 0 },
    });
  }

  async cateChange(id) {
    const { ctx } = this;
    const row = await ctx.model.ArticleCategory.findOne({ where: { id, is_delete: 0 } });
    if (!row) throw new Error('栏目不存在');
    const now = Math.floor(Date.now() / 1000);
    const nextStatus = row.is_show === 1 ? 0 : 1;
    await ctx.model.ArticleCategory.update({
      is_show: nextStatus,
      update_time: now,
    }, {
      where: { id },
    });
  }

  /**
   * 文章标签列表
   */
  async tagList(params) {
    const { ctx } = this;
    await this.ensureTagAndTopicSlugColumns();
    const pageNo = Number(params.pageNo || 1);
    const pageSize = Number(params.pageSize || 10);
    const where = { is_delete: 0 };
    if (params.name) {
      where.name = { [Op.like]: `%${params.name}%` };
    }
    if (params.isShow !== undefined && params.isShow !== '') {
      where.is_show = Number(params.isShow);
    }

    const limit = pageSize;
    const offset = pageSize * (pageNo - 1);
    const { count, rows } = await ctx.model.ArticleTag.findAndCountAll({
      where,
      limit,
      offset,
      order: [[ 'sort', 'DESC' ], [ 'id', 'DESC' ]],
    });

    const tagIds = rows.map(item => Number(item.id || 0)).filter(Boolean);
    const relCounts = tagIds.length ? await ctx.model.ArticleTagRel.findAll({
      attributes: [ 'tag_id', [Sequelize.fn('COUNT', Sequelize.col('article_id')), 'total'] ],
      where: {
        tag_id: { [Op.in]: tagIds },
        is_delete: 0,
      },
      group: [ 'tag_id' ],
    }) : [];
    const countMap = new Map();
    relCounts.forEach(item => {
      countMap.set(Number(item.get('tag_id')), Number(item.get('total') || 0));
    });

    return {
      pageNo,
      pageSize,
      count,
      lists: rows.map(item => ({
        id: item.id,
        name: item.name,
        slug: item.slug || '',
        sort: item.sort,
        isShow: item.is_show,
        number: countMap.get(Number(item.id)) || 0,
      })),
    };
  }

  /**
   * 文章标签下拉数据
   */
  async tagAll(params = {}) {
    const { ctx } = this;
    await this.ensureTagAndTopicSlugColumns();
    const where = { is_delete: 0 };
    const isAdminRequest = await this.isValidAdminRequest();
    if (isAdminRequest) {
      if (params.isShow !== undefined && params.isShow !== '') {
        where.is_show = Number(params.isShow);
      }
    } else {
      where.is_show = 1;
    }
    try {
      const rows = await ctx.model.ArticleTag.findAll({
        where,
        order: [[ 'sort', 'DESC' ], [ 'id', 'DESC' ]],
      });
      return rows.map(item => ({
        id: item.id,
        name: item.name,
        slug: item.slug || '',
        isShow: item.is_show,
        sort: item.sort,
      }));
    } catch (error) {
      ctx.logger.warn(`tagAll fallback empty: ${error.message || error}`);
      return [];
    }
  }

  /**
   * 标签详情
   */
  async tagDetail(id) {
    const { ctx } = this;
    await this.ensureTagAndTopicSlugColumns();
    const row = await ctx.model.ArticleTag.findOne({
      where: { id, is_delete: 0 },
    });
    if (!row) throw new Error('标签不存在');
    return {
      id: row.id,
      name: row.name,
      slug: row.slug || '',
      sort: row.sort,
      isShow: row.is_show,
    };
  }

  /**
   * 标签新增
   */
  async tagAdd(params) {
    const { ctx } = this;
    await this.ensureTagAndTopicSlugColumns();
    const now = Math.floor(Date.now() / 1000);
    const slug = await this.resolveUniqueSlug(ctx.model.ArticleTag, {
      rawSlug: params.slug,
      name: params.name,
      prefix: 'tag',
    });
    await ctx.model.ArticleTag.create({
      name: params.name || '',
      slug,
      sort: Number(params.sort || 9999),
      is_show: Number(params.isShow ?? 1),
      is_delete: 0,
      create_time: now,
      update_time: now,
    });
  }

  /**
   * 标签编辑
   */
  async tagEdit(params) {
    const { ctx } = this;
    await this.ensureTagAndTopicSlugColumns();
    const now = Math.floor(Date.now() / 1000);
    const slug = await this.resolveUniqueSlug(ctx.model.ArticleTag, {
      rawSlug: params.slug,
      name: params.name,
      currentId: params.id,
      prefix: 'tag',
    });
    await ctx.model.ArticleTag.update({
      name: params.name || '',
      slug,
      sort: Number(params.sort || 9999),
      is_show: Number(params.isShow ?? 1),
      update_time: now,
    }, {
      where: { id: params.id, is_delete: 0 },
    });
  }

  /**
   * 标签删除
   */
  async tagDel(id) {
    await this.tagBatchDel([ id ]);
  }

  /**
   * 标签批量状态切换
   */
  async tagBatchChange(ids, isShow) {
    const { ctx } = this;
    await this.ensureTagAndTopicSlugColumns();
    const idList = this.parseIdArray(ids);
    if (!idList.length) {
      throw new Error('请先选择标签');
    }
    const status = Number(isShow);
    if (status !== 0 && status !== 1) {
      throw new Error('状态参数错误');
    }
    const now = Math.floor(Date.now() / 1000);
    await ctx.model.ArticleTag.update({
      is_show: status,
      update_time: now,
    }, {
      where: {
        id: { [Op.in]: idList },
        is_delete: 0,
      },
    });
    return true;
  }

  /**
   * 标签批量删除（软删）
   */
  async tagBatchDel(ids) {
    const { ctx } = this;
    await this.ensureTagAndTopicSlugColumns();
    const idList = this.parseIdArray(ids);
    if (!idList.length) {
      throw new Error('请先选择标签');
    }
    const rows = await ctx.model.ArticleTag.findAll({
      attributes: [ 'id', 'slug' ],
      where: {
        id: { [Op.in]: idList },
        is_delete: 0,
      },
    });
    if (!rows.length) return true;
    const now = Math.floor(Date.now() / 1000);
    for (let i = 0; i < rows.length; i += 1) {
      const row = rows[i];
      const rowId = Number(row.id || 0);
      if (!rowId) continue;
      await ctx.model.ArticleTag.update({
        slug: this.buildDeletedSlug(row.slug, 'tag', rowId, now),
        is_delete: 1,
        delete_time: now,
        update_time: now,
      }, {
        where: { id: rowId, is_delete: 0 },
      });
    }
    await ctx.model.ArticleTagRel.update({
      is_delete: 1,
      delete_time: now,
      update_time: now,
    }, {
      where: {
        tag_id: { [Op.in]: rows.map(item => Number(item.id || 0)).filter(Boolean) },
        is_delete: 0,
      },
    });
    return true;
  }

  /**
   * 标签合并（多个来源标签 => 目标标签）
   */
  async tagMerge(fromIds, toId) {
    const { ctx } = this;
    await this.ensureTagAndTopicSlugColumns();
    const targetId = Number(toId || 0);
    if (!targetId) {
      throw new Error('请选择目标标签');
    }
    const sourceIds = this.parseIdArray(fromIds).filter(id => id !== targetId);
    if (!sourceIds.length) {
      throw new Error('请选择要合并的来源标签');
    }
    const now = Math.floor(Date.now() / 1000);
    const targetRow = await ctx.model.ArticleTag.findOne({
      attributes: [ 'id' ],
      where: { id: targetId, is_delete: 0 },
    });
    if (!targetRow) {
      throw new Error('目标标签不存在');
    }

    // 将来源标签关联迁移到目标标签（避免重复关联）
    const relRows = await ctx.model.ArticleTagRel.findAll({
      attributes: [ 'article_id' ],
      where: {
        tag_id: { [Op.in]: sourceIds },
        is_delete: 0,
      },
    });
    const articleIds = Array.from(new Set(relRows.map(item => Number(item.article_id || 0)).filter(Boolean)));
    for (let i = 0; i < articleIds.length; i += 1) {
      const articleId = articleIds[i];
      const exist = await ctx.model.ArticleTagRel.findOne({
        attributes: [ 'id' ],
        where: {
          article_id: articleId,
          tag_id: targetId,
          is_delete: 0,
        },
      });
      if (!exist) {
        await ctx.model.ArticleTagRel.create({
          article_id: articleId,
          tag_id: targetId,
          is_delete: 0,
          create_time: now,
          update_time: now,
          delete_time: 0,
        });
      }
    }
    // 来源标签关联置删
    await ctx.model.ArticleTagRel.update({
      is_delete: 1,
      delete_time: now,
      update_time: now,
    }, {
      where: {
        tag_id: { [Op.in]: sourceIds },
        is_delete: 0,
      },
    });
    // 来源标签软删并释放 slug
    await this.tagBatchDel(sourceIds);
    return true;
  }

  /**
   * 标签状态切换
   */
  async tagChange(id) {
    const { ctx } = this;
    const row = await ctx.model.ArticleTag.findOne({ where: { id, is_delete: 0 } });
    if (!row) throw new Error('标签不存在');
    const now = Math.floor(Date.now() / 1000);
    const nextStatus = row.is_show === 1 ? 0 : 1;
    await ctx.model.ArticleTag.update({
      is_show: nextStatus,
      update_time: now,
    }, {
      where: { id },
    });
  }

  /**
   * 专题列表
   */
  async topicList(params) {
    const { ctx } = this;
    await this.ensureTagAndTopicSlugColumns();
    const pageNo = Number(params.pageNo || 1);
    const pageSize = Number(params.pageSize || 10);
    const where = { is_delete: 0 };
    if (params.name) {
      where.name = { [Op.like]: `%${params.name}%` };
    }
    if (params.isShow !== undefined && params.isShow !== '') {
      where.is_show = Number(params.isShow);
    }

    const limit = pageSize;
    const offset = pageSize * (pageNo - 1);
    const { count, rows } = await ctx.model.ArticleTopic.findAndCountAll({
      where,
      limit,
      offset,
      order: [[ 'sort', 'DESC' ], [ 'id', 'DESC' ]],
    });

    const topicIds = rows.map(item => Number(item.id || 0)).filter(Boolean);
    const relCounts = topicIds.length ? await ctx.model.ArticleTopicRel.findAll({
      attributes: [ 'topic_id', [Sequelize.fn('COUNT', Sequelize.col('article_id')), 'total'] ],
      where: {
        topic_id: { [Op.in]: topicIds },
        is_delete: 0,
      },
      group: [ 'topic_id' ],
    }) : [];
    const countMap = new Map();
    relCounts.forEach(item => {
      countMap.set(Number(item.get('topic_id')), Number(item.get('total') || 0));
    });

    return {
      pageNo,
      pageSize,
      count,
      lists: rows.map(item => ({
        id: item.id,
        name: item.name,
        slug: item.slug || '',
        intro: item.intro,
        image: item.image ? urlUtil.toAbsoluteUrl(item.image) : '',
        sort: item.sort,
        isShow: item.is_show,
        number: countMap.get(Number(item.id)) || 0,
      })),
    };
  }

  /**
   * 专题下拉数据
   */
  async topicAll(params = {}) {
    const { ctx } = this;
    await this.ensureTagAndTopicSlugColumns();
    const where = { is_delete: 0 };
    const isAdminRequest = await this.isValidAdminRequest();
    if (isAdminRequest) {
      if (params.isShow !== undefined && params.isShow !== '') {
        where.is_show = Number(params.isShow);
      }
    } else {
      where.is_show = 1;
    }
    try {
      const rows = await ctx.model.ArticleTopic.findAll({
        where,
        order: [[ 'sort', 'DESC' ], [ 'id', 'DESC' ]],
      });
      return rows.map(item => ({
        id: item.id,
        name: item.name,
        slug: item.slug || '',
        intro: item.intro,
        image: item.image ? urlUtil.toAbsoluteUrl(item.image) : '',
        isShow: item.is_show,
        sort: item.sort,
      }));
    } catch (error) {
      ctx.logger.warn(`topicAll fallback empty: ${error.message || error}`);
      return [];
    }
  }

  /**
   * 专题详情
   */
  async topicDetail(id) {
    const { ctx } = this;
    await this.ensureTagAndTopicSlugColumns();
    const row = await ctx.model.ArticleTopic.findOne({
      where: { id, is_delete: 0 },
    });
    if (!row) throw new Error('专题不存在');
    return {
      id: row.id,
      name: row.name,
      slug: row.slug || '',
      intro: row.intro,
      image: row.image ? urlUtil.toAbsoluteUrl(row.image) : '',
      sort: row.sort,
      isShow: row.is_show,
    };
  }

  /**
   * 专题新增
   */
  async topicAdd(params) {
    const { ctx } = this;
    await this.ensureTagAndTopicSlugColumns();
    const now = Math.floor(Date.now() / 1000);
    const slug = await this.resolveUniqueSlug(ctx.model.ArticleTopic, {
      rawSlug: params.slug,
      name: params.name,
      prefix: 'topic',
    });
    await ctx.model.ArticleTopic.create({
      name: params.name || '',
      slug,
      intro: params.intro || '',
      image: params.image ? this.normalizeStoreImageValue(params.image) : '',
      sort: Number(params.sort || 9999),
      is_show: Number(params.isShow ?? 1),
      is_delete: 0,
      create_time: now,
      update_time: now,
    });
  }

  /**
   * 专题编辑
   */
  async topicEdit(params) {
    const { ctx } = this;
    await this.ensureTagAndTopicSlugColumns();
    const now = Math.floor(Date.now() / 1000);
    const slug = await this.resolveUniqueSlug(ctx.model.ArticleTopic, {
      rawSlug: params.slug,
      name: params.name,
      currentId: params.id,
      prefix: 'topic',
    });
    await ctx.model.ArticleTopic.update({
      name: params.name || '',
      slug,
      intro: params.intro || '',
      image: params.image ? this.normalizeStoreImageValue(params.image) : '',
      sort: Number(params.sort || 9999),
      is_show: Number(params.isShow ?? 1),
      update_time: now,
    }, {
      where: { id: params.id, is_delete: 0 },
    });
  }

  /**
   * 专题删除
   */
  async topicDel(id) {
    const { ctx } = this;
    await this.ensureTagAndTopicSlugColumns();
    const row = await ctx.model.ArticleTopic.findOne({
      attributes: [ 'id', 'slug' ],
      where: { id, is_delete: 0 },
    });
    if (!row) return true;
    const now = Math.floor(Date.now() / 1000);
    await ctx.model.ArticleTopic.update({
      slug: this.buildDeletedSlug(row.slug, 'topic', id, now),
      is_delete: 1,
      delete_time: now,
      update_time: now,
    }, {
      where: { id, is_delete: 0 },
    });
    await ctx.model.ArticleTopicRel.update({
      is_delete: 1,
      delete_time: now,
      update_time: now,
    }, {
      where: { topic_id: id, is_delete: 0 },
    });
  }

  /**
   * 专题状态切换
   */
  async topicChange(id) {
    const { ctx } = this;
    const row = await ctx.model.ArticleTopic.findOne({ where: { id, is_delete: 0 } });
    if (!row) throw new Error('专题不存在');
    const now = Math.floor(Date.now() / 1000);
    const nextStatus = row.is_show === 1 ? 0 : 1;
    await ctx.model.ArticleTopic.update({
      is_show: nextStatus,
      update_time: now,
    }, {
      where: { id },
    });
  }

  async list(params) {
    const { ctx } = this;
    await this.ensureArticleReviewColumns();
    const pageNo = Number(params.pageNo || 1);
    const pageSize = Number(params.pageSize || 10);
    const where = await this.buildArticleWhere(params);
    await this.applyTagAndTopicFilter(where, params);

    const limit = pageSize;
    const offset = pageSize * (pageNo - 1);
    const { count, rows } = await ctx.model.Article.findAndCountAll({
      where,
      limit,
      offset,
      order: [[ 'id', 'DESC' ]],
    });

    const categoryIds = Array.from(new Set(rows.map(item => item.cid)));
    const categories = categoryIds.length
      ? await ctx.model.ArticleCategory.findAll({
        where: { id: { [Op.in]: categoryIds } },
        attributes: [ 'id', 'name' ],
      })
      : [];
    const categoryMap = new Map(categories.map(item => [ item.id, item.name ]));
    const articleIds = rows.map(item => Number(item.id || 0)).filter(Boolean);
    const { tagIdsMap, tagNamesMap } = await this.getArticleTagInfoByArticleIds(articleIds);
    const { topicIdMap, topicNameMap } = await this.getArticleTopicInfoByArticleIds(articleIds);
    const authorMap = await this.getArticleAuthorMap(articleIds, true);
    const { collectMap, likeMap, commentMap } = await this.getArticleInteractionStats(articleIds, 0);

    const lists = rows.map(item => ({
      id: item.id,
      title: item.title,
      image: item.image ? urlUtil.toAbsoluteUrl(item.image) : '',
      cid: item.cid,
      category: categoryMap.get(item.cid) || '',
      tagIds: tagIdsMap.get(Number(item.id)) || [],
      tags: tagNamesMap.get(Number(item.id)) || [],
      topicId: topicIdMap.get(Number(item.id)) || 0,
      topic: topicNameMap.get(Number(item.id)) || '',
      author: item.author,
      authorUser: authorMap.get(Number(item.id)) || null,
      visit: item.visit,
      collectCount: collectMap.get(Number(item.id)) || 0,
      likeCount: likeMap.get(Number(item.id)) || 0,
      commentCount: commentMap.get(Number(item.id)) || 0,
      isShow: item.is_show,
      reviewStatus: Number(item.review_status || 0),
      reviewStatusName: this.getReviewStatusName(item.review_status),
      reviewRemark: String(item.review_remark || ''),
      reviewTime: formatTime(item.review_time),
      reviewAdminId: Number(item.review_admin_id || 0),
      sort: item.sort,
      createTime: formatTime(item.create_time),
    }));

    return {
      pageNo,
      pageSize,
      count,
      lists,
    };
  }

  async all() {
    const { ctx } = this;
    const rows = await ctx.model.Article.findAll({
      where: { is_delete: 0, is_show: 1 },
      order: [[ 'sort', 'DESC' ], [ 'id', 'DESC' ]],
    });
    return rows.map(item => ({
      id: item.id,
      title: item.title,
      cid: item.cid,
      image: item.image ? urlUtil.toAbsoluteUrl(item.image) : '',
    }));
  }

  async detail(id) {
    const { ctx } = this;
    await this.ensureArticleReviewColumns();
    const detailWhere = { id, is_delete: 0 };
    const isAdminRequest = await this.isValidAdminRequest();
    if (!isAdminRequest) {
      detailWhere.is_show = 1;
    }
    const row = await ctx.model.Article.findOne({ where: detailWhere });
    if (!row) throw new Error('文章不存在');
    const userId = await this.getFrontendUserId(false);
    const authorMap = await this.getArticleAuthorMap([ Number(row.id) ], !isAdminRequest);
    const { collectMap, likeMap, commentMap, userCollectMap, userLikeMap } = await this.getArticleInteractionStats(
      [ Number(row.id) ],
      userId
    );
    const { tagIdsMap, tagNamesMap, tagObjectsMap } = await this.getArticleTagInfoByArticleIds([ Number(row.id) ]);
    const { topicIdMap, topicNameMap } = await this.getArticleTopicInfoByArticleIds([ Number(row.id) ]);
    return {
      id: row.id,
      title: row.title,
      image: row.image ? urlUtil.toAbsoluteUrl(row.image) : '',
      cid: row.cid,
      tagIds: tagIdsMap.get(Number(row.id)) || [],
      tags: tagObjectsMap.get(Number(row.id)) || [],
      tagNames: tagNamesMap.get(Number(row.id)) || [],
      topicId: topicIdMap.get(Number(row.id)) || 0,
      topic: topicNameMap.get(Number(row.id)) || '',
      intro: row.intro,
      author: row.author,
      authorUser: authorMap.get(Number(row.id)) || null,
      content: row.content,
      visit: row.visit,
      collectCount: collectMap.get(Number(row.id)) || 0,
      likeCount: likeMap.get(Number(row.id)) || 0,
      commentCount: commentMap.get(Number(row.id)) || 0,
      isCollect: userCollectMap.get(Number(row.id)) ? 1 : 0,
      isLike: userLikeMap.get(Number(row.id)) ? 1 : 0,
      sort: row.sort,
      isShow: row.is_show,
      reviewStatus: Number(row.review_status || 0),
      reviewStatusName: this.getReviewStatusName(row.review_status),
      reviewRemark: String(row.review_remark || ''),
      reviewTime: formatTime(row.review_time),
      reviewAdminId: Number(row.review_admin_id || 0),
      summary: row.summary,
      createTime: formatTime(row.create_time),
      updateTime: formatTime(row.update_time),
    };
  }

  async add(params) {
    const { ctx } = this;
    await this.ensureArticleReviewColumns();
    const now = Math.floor(Date.now() / 1000);
    const authorInput = String(params.author || '').trim();
    if (!authorInput) {
      throw new Error('请选择作者（后台用户）');
    }
    const authorInfo = await this.resolveAuthorInput(authorInput);
    if (!Number(authorInfo.userId || 0)) {
      throw new Error('请选择有效作者');
    }
    // 未设置封面图时，默认取正文第一张图（仅作为“地址引用”，不静默抓图）
    const coverImage = String(params.image || '').trim() || this.extractFirstImageFromContent(params.content);
    const isShowValue = Number(params.isShow ?? 1);
    const reviewStatusValue = isShowValue === 1 ? 2 : 0;
    // 说明：返回新增文章ID，便于前端“保存草稿/发表”后立即进入编辑态并做前台预览跳转
    const row = await ctx.model.Article.create({
      cid: Number(params.cid || 0),
      title: params.title || '',
      intro: params.intro || '',
      summary: params.summary || '',
      image: this.normalizeStoreImageValue(coverImage),
      content: params.content || '',
      author: authorInfo.authorName || '',
      visit: Number(params.visit || 0),
      sort: Number(params.sort || 0),
      is_show: isShowValue,
      review_status: reviewStatusValue,
      review_remark: '',
      review_time: reviewStatusValue === 2 ? now : 0,
      review_admin_id: reviewStatusValue === 2 ? Number(ctx.session[reqAdminIdKey] || 0) : 0,
      is_delete: 0,
      create_time: now,
      update_time: now,
    });
    await this.saveArticleAuthorRelation(row?.id, authorInfo.userId, now);
    await this.saveArticleTagRelations(row?.id, params.tagIds);
    await this.saveArticleTopicRelation(row?.id, params.topicId);
    return row?.id;
  }

  /**
   * 生成文章管理测试数据（用于联调与演示）
   * 说明：
   * 1. 自动补齐基础分类/标签/专题（不存在则创建）
   * 2. 批量写入测试文章，并关联标签与专题
   * 3. 不依赖前台用户表，作者字段直接写入展示名称
   */
  async seedTestData(params = {}) {
    const { ctx } = this;
    await this.ensureArticleReviewColumns();
    await this.ensureTagAndTopicSlugColumns();

    const count = Math.max(1, Math.min(50, Number(params.count || 12)));
    const now = Math.floor(Date.now() / 1000);
    const seedPrefix = Number(params.prefixTs || now);

    const categoryTemplates = [ 'AI设计', '产品运营', '效率工具' ];
    const tagTemplates = [ 'AI', '教程', '实战', '导航', '效率', '产品' ];
    const topicTemplates = [
      { name: '售卖版上线指南', intro: '围绕可配置主题系统的上线实践与经验沉淀。' },
      { name: '内容增长实践', intro: '聚焦内容分发、SEO 与转化优化。' },
      { name: '前后端规范收敛', intro: '沉淀模块化规范与可维护工程实践。' },
    ];

    /**
     * 获取或创建文章分类
     */
    const ensureCategory = async (name, sort) => {
      const exists = await ctx.model.ArticleCategory.findOne({
        where: { name, is_delete: 0 },
        attributes: [ 'id', 'name' ],
      });
      if (exists) return exists;
      return ctx.model.ArticleCategory.create({
        name,
        sort,
        is_show: 1,
        is_delete: 0,
        create_time: now,
        update_time: now,
      });
    };

    /**
     * 获取或创建文章标签
     */
    const ensureTag = async (name, sort) => {
      const exists = await ctx.model.ArticleTag.findOne({
        where: { name, is_delete: 0 },
        attributes: [ 'id', 'name', 'slug' ],
      });
      if (exists) return exists;
      const slug = await this.resolveUniqueSlug(ctx.model.ArticleTag, {
        rawSlug: '',
        name,
        prefix: 'tag',
      });
      return ctx.model.ArticleTag.create({
        name,
        slug,
        sort,
        is_show: 1,
        is_delete: 0,
        create_time: now,
        update_time: now,
      });
    };

    /**
     * 获取或创建文章专题
     */
    const ensureTopic = async (name, intro, sort) => {
      const exists = await ctx.model.ArticleTopic.findOne({
        where: { name, is_delete: 0 },
        attributes: [ 'id', 'name', 'slug' ],
      });
      if (exists) return exists;
      const slug = await this.resolveUniqueSlug(ctx.model.ArticleTopic, {
        rawSlug: '',
        name,
        prefix: 'topic',
      });
      return ctx.model.ArticleTopic.create({
        name,
        slug,
        intro,
        image: '',
        sort,
        is_show: 1,
        is_delete: 0,
        create_time: now,
        update_time: now,
      });
    };

    const categories = [];
    for (let i = 0; i < categoryTemplates.length; i += 1) {
      const row = await ensureCategory(categoryTemplates[i], 999 - i);
      categories.push(row);
    }

    const tags = [];
    for (let i = 0; i < tagTemplates.length; i += 1) {
      const row = await ensureTag(tagTemplates[i], 999 - i);
      tags.push(row);
    }

    const topics = [];
    for (let i = 0; i < topicTemplates.length; i += 1) {
      const row = await ensureTopic(
        topicTemplates[i].name,
        topicTemplates[i].intro,
        999 - i
      );
      topics.push(row);
    }

    const createdIds = [];
    for (let i = 0; i < count; i += 1) {
      const category = categories[i % categories.length];
      const topic = topics[i % topics.length];
      const tagA = tags[i % tags.length];
      const tagB = tags[(i + 2) % tags.length];
      const chosenTagIds = Array.from(new Set([
        Number(tagA?.id || 0),
        Number(tagB?.id || 0),
      ].filter(Boolean)));
      const isShow = i % 4 === 0 ? 0 : 1;
      const reviewStatus = isShow === 1 ? 2 : 0;
      const articleIndex = i + 1;
      const title = `测试文章 ${seedPrefix}-${articleIndex}`;
      const intro = `这是用于联调的测试简介（第 ${articleIndex} 篇），可用于列表筛选与详情展示验证。`;
      const summary = `测试摘要 ${articleIndex}：覆盖分类、标签、专题、发布状态与审核状态。`;
      const content = [
        `<h2>${title}</h2>`,
        '<p>该内容由系统自动生成，用于文章管理页面联调。</p>',
        `<p>所属栏目：${String(category?.name || '-')}</p>`,
        `<p>关联标签：${chosenTagIds.map(id => {
          const row = tags.find(item => Number(item.id || 0) === id);
          return String(row?.name || '');
        }).filter(Boolean).join('、') || '-'}</p>`,
        `<p>所属专题：${String(topic?.name || '-')}</p>`,
        '<blockquote>你可以直接编辑此文，验证编辑器、AI 助手、发布流程与前台展示。</blockquote>',
      ].join('');

      const row = await ctx.model.Article.create({
        cid: Number(category?.id || 0),
        title,
        intro,
        summary,
        image: '',
        content,
        author: `测试作者${(i % 3) + 1}`,
        visit: 20 + i * 3,
        sort: 999 - i,
        is_show: isShow,
        review_status: reviewStatus,
        review_remark: '',
        review_time: reviewStatus === 2 ? now : 0,
        review_admin_id: reviewStatus === 2 ? Number(ctx.session[reqAdminIdKey] || 0) : 0,
        is_delete: 0,
        create_time: now + i,
        update_time: now + i,
      });
      const articleId = Number(row?.id || 0);
      if (!articleId) continue;
      createdIds.push(articleId);
      await this.saveArticleTagRelations(articleId, chosenTagIds);
      await this.saveArticleTopicRelation(articleId, Number(topic?.id || 0));
    }

    return {
      created: createdIds.length,
      articleIds: createdIds,
      categoryCount: categories.length,
      tagCount: tags.length,
      topicCount: topics.length,
    };
  }

  /**
   * 官网前台投稿文章（写入内容管理，默认待发布）
   */
  async frontAdd(params = {}) {
    const { ctx } = this;
    await this.ensureArticleReviewColumns();
    const userId = await this.getFrontendUserId(true);
    await this.ensureArticleAuthorRelTable();
    const title = String(params.title || '').trim();
    const content = String(params.content || '').trim();
    const cid = Number(params.cid || 0);
    if (!title) throw new Error('请输入文章标题');
    if (!cid) throw new Error('请选择文章分类');
    if (!content) throw new Error('请输入文章内容');

    const cate = await ctx.model.ArticleCategory.findOne({
      where: {
        id: cid,
        is_delete: 0,
        is_show: 1,
      },
      attributes: [ 'id', 'name' ],
    });
    if (!cate) {
      throw new Error('文章分类不存在或不可用');
    }

    const user = await ctx.model.User.findOne({
      where: { id: Number(userId), isDelete: 0 },
      attributes: [ 'id', 'nickname', 'username' ],
    });
    const intro = String(params.intro || '').trim() || this.stripHtmlTags(content).slice(0, 120);
    const summary = String(params.summary || '').trim() || intro.slice(0, 200);
    const author =
      String(params.author || '').trim() ||
      String(user?.nickname || user?.username || `用户${userId}`);
    const now = Math.floor(Date.now() / 1000);
    const coverImage = String(params.image || '').trim() || this.extractFirstImageFromContent(content);

    const row = await ctx.model.Article.create({
      cid,
      title,
      intro,
      summary,
      image: this.normalizeStoreImageValue(coverImage),
      content,
      author,
      visit: 0,
      sort: 0,
      is_show: 0,
      review_status: 1,
      review_remark: '',
      review_time: 0,
      review_admin_id: 0,
      is_delete: 0,
      create_time: now,
      update_time: now,
    });
    await ctx.model.ArticleAuthorRel.create({
      article_id: Number(row?.id || 0),
      user_id: Number(userId),
      is_delete: 0,
      create_time: now,
      update_time: now,
      delete_time: 0,
    });
    await this.saveArticleTagRelations(row?.id, params.tagIds);
    await this.saveArticleTopicRelation(row?.id, params.topicId);
    /**
     * 投稿提交奖励采用“旁路失败不阻断主流程”，避免积分模块异常影响投稿可用性
     */
    try {
      await ctx.service.uied.contributionIncentive.rewardSubmissionCreated(Number(userId), Number(row?.id || 0));
    } catch (rewardError) {
      ctx.logger.warn(`frontAdd rewardSubmissionCreated skipped: ${rewardError.message || rewardError}`);
    }
    return {
      id: Number(row?.id || 0),
      isShow: 0,
      reviewStatus: 1,
      reviewStatusName: this.getReviewStatusName(1),
    };
  }

  /**
   * 前端作者投稿列表（含草稿/已发布）
   */
  async frontList(params = {}) {
    const { ctx } = this;
    await this.ensureArticleReviewColumns();
    const userId = await this.getFrontendUserId(true);
    const ready = await this.ensureArticleAuthorRelTable();
    if (!ready) {
      return {
        pageNo: 1,
        pageSize: 10,
        count: 0,
        lists: [],
      };
    }
    const pageNo = Number(params.pageNo || 1);
    const pageSize = Number(params.pageSize || 10);
    const limit = Math.max(1, Math.min(50, pageSize));
    const offset = limit * (Math.max(1, pageNo) - 1);
    const relWhere = {
      user_id: Number(userId),
      is_delete: 0,
    };
    /**
     * 合并文章ID过滤条件（用于状态/标题联合筛选）
     */
    const mergeArticleIdsFilter = (articleIds = []) => {
      const cleanIds = Array.from(new Set((Array.isArray(articleIds) ? articleIds : [])
        .map(id => Number(id || 0))
        .filter(Boolean)));
      if (!cleanIds.length) return false;
      const currentIds = relWhere.article_id && Array.isArray(relWhere.article_id[Op.in])
        ? relWhere.article_id[Op.in]
        : [];
      if (currentIds.length) {
        const nextSet = new Set(cleanIds);
        const merged = currentIds.filter(id => nextSet.has(Number(id)));
        if (!merged.length) return false;
        relWhere.article_id = { [Op.in]: merged };
        return true;
      }
      relWhere.article_id = { [Op.in]: cleanIds };
      return true;
    };
    if (params.isShow !== undefined && params.isShow !== null && params.isShow !== '') {
      // 通过文章状态过滤时需要先查文章ID集合
      const stateArticles = await ctx.model.Article.findAll({
        where: {
          is_delete: 0,
          is_show: Number(params.isShow),
        },
        attributes: [ 'id' ],
      });
      const stateIds = stateArticles.map(item => Number(item.id || 0)).filter(Boolean);
      if (!mergeArticleIdsFilter(stateIds)) {
        return {
          pageNo: Math.max(1, pageNo),
          pageSize: limit,
          count: 0,
          lists: [],
        };
      }
    }
    if (params.reviewStatus !== undefined && params.reviewStatus !== null && params.reviewStatus !== '') {
      const reviewArticles = await ctx.model.Article.findAll({
        where: {
          is_delete: 0,
          review_status: Number(params.reviewStatus),
        },
        attributes: [ 'id' ],
      });
      const reviewIds = reviewArticles.map(item => Number(item.id || 0)).filter(Boolean);
      if (!mergeArticleIdsFilter(reviewIds)) {
        return {
          pageNo: Math.max(1, pageNo),
          pageSize: limit,
          count: 0,
          lists: [],
        };
      }
    }
    if (params.title) {
      const keyword = String(params.title || '').trim();
      const titleArticles = await ctx.model.Article.findAll({
        where: {
          is_delete: 0,
          title: { [Op.like]: `%${keyword}%` },
        },
        attributes: [ 'id' ],
      });
      const titleIds = titleArticles.map(item => Number(item.id || 0)).filter(Boolean);
      if (!mergeArticleIdsFilter(titleIds)) {
        return {
          pageNo: Math.max(1, pageNo),
          pageSize: limit,
          count: 0,
          lists: [],
        };
      }
    }

    const { count, rows } = await ctx.model.ArticleAuthorRel.findAndCountAll({
      where: relWhere,
      order: [[ 'id', 'DESC' ]],
      limit,
      offset,
    });
    const articleIds = Array.from(new Set(rows.map(item => Number(item.article_id || 0)).filter(Boolean)));
    if (!articleIds.length) {
      return {
        pageNo: Math.max(1, pageNo),
        pageSize: limit,
        count,
        lists: [],
      };
    }
    const articleWhere = {
      id: { [Op.in]: articleIds },
      is_delete: 0,
    };
    const articles = await ctx.model.Article.findAll({
      where: articleWhere,
      attributes: [
        'id',
        'cid',
        'title',
        'intro',
        'summary',
        'image',
        'author',
        'visit',
        'is_show',
        'review_status',
        'review_remark',
        'review_time',
        'create_time',
        'update_time',
      ],
    });
    const articleMap = new Map(articles.map(item => [ Number(item.id), item ]));
    const authorProfileMap = await ctx.service.user.getAuthorProfileMap([ Number(userId) ], false);
    const currentAuthor = authorProfileMap.get(Number(userId)) || null;
    const { collectMap, likeMap, commentMap } = await this.getArticleInteractionStats(articleIds, 0);
    const lists = rows
      .map(item => {
        const articleId = Number(item.article_id || 0);
        const article = articleMap.get(articleId);
        if (!article) return null;
        return {
          id: articleId,
          cid: Number(article.cid || 0),
          title: String(article.title || ''),
          intro: String(article.intro || ''),
          summary: String(article.summary || ''),
          image: article.image ? urlUtil.toAbsoluteUrl(article.image) : '',
          author: String(article.author || ''),
          authorUser: currentAuthor,
          visit: Number(article.visit || 0),
          collectCount: collectMap.get(articleId) || 0,
          likeCount: likeMap.get(articleId) || 0,
          commentCount: commentMap.get(articleId) || 0,
          isShow: Number(article.is_show || 0),
          reviewStatus: Number(article.review_status || 0),
          reviewStatusName: this.getReviewStatusName(article.review_status),
          reviewRemark: String(article.review_remark || ''),
          reviewTime: formatTime(article.review_time),
          createTime: formatTime(article.create_time),
          updateTime: formatTime(article.update_time),
        };
      })
      .filter(Boolean);
    return {
      pageNo: Math.max(1, pageNo),
      pageSize: limit,
      count,
      lists,
    };
  }

  /**
   * 前端作者投稿详情（仅本人可见）
   */
  async frontDetail(articleId = 0) {
    const { ctx } = this;
    await this.ensureArticleReviewColumns();
    const userId = await this.getFrontendUserId(true);
    const id = Number(articleId || 0);
    if (!id) throw new Error('文章ID不能为空');
    const ready = await this.ensureArticleAuthorRelTable();
    if (!ready) throw new Error('投稿服务初始化失败，请稍后重试');
    const rel = await ctx.model.ArticleAuthorRel.findOne({
      where: {
        article_id: id,
        user_id: Number(userId),
        is_delete: 0,
      },
    });
    if (!rel) throw new Error('无权限查看该投稿');
    const row = await ctx.model.Article.findOne({
      where: {
        id,
        is_delete: 0,
      },
    });
    if (!row) throw new Error('文章不存在');
    const authorUserMap = await ctx.service.user.getAuthorProfileMap([ Number(userId) ], false);
    const { tagIdsMap, tagNamesMap, tagObjectsMap } = await this.getArticleTagInfoByArticleIds([id]);
    const { topicIdMap, topicNameMap } = await this.getArticleTopicInfoByArticleIds([id]);
    const { collectMap, likeMap, commentMap } = await this.getArticleInteractionStats([id], 0);
    return {
      id,
      cid: Number(row.cid || 0),
      title: String(row.title || ''),
      intro: String(row.intro || ''),
      summary: String(row.summary || ''),
      image: row.image ? urlUtil.toAbsoluteUrl(row.image) : '',
      content: String(row.content || ''),
      author: String(row.author || ''),
      authorUser: authorUserMap.get(Number(userId)) || null,
      visit: Number(row.visit || 0),
      collectCount: collectMap.get(id) || 0,
      likeCount: likeMap.get(id) || 0,
      commentCount: commentMap.get(id) || 0,
      tagIds: tagIdsMap.get(id) || [],
      tags: tagObjectsMap.get(id) || [],
      tagNames: tagNamesMap.get(id) || [],
      topicId: topicIdMap.get(id) || 0,
      topic: topicNameMap.get(id) || '',
      isShow: Number(row.is_show || 0),
      reviewStatus: Number(row.review_status || 0),
      reviewStatusName: this.getReviewStatusName(row.review_status),
      reviewRemark: String(row.review_remark || ''),
      reviewTime: formatTime(row.review_time),
      createTime: formatTime(row.create_time),
      updateTime: formatTime(row.update_time),
    };
  }

  /**
   * 前端作者编辑投稿草稿（仅可编辑本人草稿）
   */
  async frontEdit(params = {}) {
    const { ctx } = this;
    await this.ensureArticleReviewColumns();
    const userId = await this.getFrontendUserId(true);
    const id = Number(params.id || 0);
    if (!id) throw new Error('文章ID不能为空');
    const ready = await this.ensureArticleAuthorRelTable();
    if (!ready) throw new Error('投稿服务初始化失败，请稍后重试');
    const rel = await ctx.model.ArticleAuthorRel.findOne({
      where: {
        article_id: id,
        user_id: Number(userId),
        is_delete: 0,
      },
    });
    if (!rel) throw new Error('无权限编辑该投稿');

    const row = await ctx.model.Article.findOne({
      where: {
        id,
        is_delete: 0,
      },
    });
    if (!row) throw new Error('文章不存在');
    if (Number(row.is_show || 0) === 1) {
      throw new Error('已发布文章请在后台编辑');
    }

    const title = String(params.title || '').trim();
    const content = String(params.content || '').trim();
    const cid = Number(params.cid || 0);
    if (!title) throw new Error('请输入文章标题');
    if (!cid) throw new Error('请选择文章分类');
    if (!content) throw new Error('请输入文章内容');

    const cate = await ctx.model.ArticleCategory.findOne({
      where: {
        id: cid,
        is_delete: 0,
        is_show: 1,
      },
      attributes: [ 'id' ],
    });
    if (!cate) throw new Error('文章分类不存在或不可用');

    const intro = String(params.intro || '').trim() || this.stripHtmlTags(content).slice(0, 120);
    const summary = String(params.summary || '').trim() || intro.slice(0, 200);
    const coverImage = String(params.image || '').trim() || this.extractFirstImageFromContent(content);
    const now = Math.floor(Date.now() / 1000);
    await ctx.model.Article.update({
      cid,
      title,
      intro,
      summary,
      image: this.normalizeStoreImageValue(coverImage),
      content,
      update_time: now,
      is_show: 0,
      review_status: 1,
      review_remark: '',
      review_time: 0,
      review_admin_id: 0,
    }, {
      where: { id, is_delete: 0 },
    });
    if (Object.prototype.hasOwnProperty.call(params, 'tagIds')) {
      await this.saveArticleTagRelations(id, params.tagIds);
    }
    if (Object.prototype.hasOwnProperty.call(params, 'topicId')) {
      await this.saveArticleTopicRelation(id, params.topicId);
    }
    return {
      id,
      isShow: 0,
      reviewStatus: 1,
      reviewStatusName: this.getReviewStatusName(1),
    };
  }

  /**
   * 后台审核前端投稿（通过/驳回/需修改）
   */
  async frontAudit(params = {}) {
    const { ctx } = this;
    await this.ensureArticleReviewColumns();
    await this.ensureArticleAuthorRelTable();
    const id = Number(params.id || 0);
    if (!id) throw new Error('文章ID不能为空');
    const reviewStatus = Number(params.reviewStatus || 0);
    if (![ 2, 3, 4 ].includes(reviewStatus)) {
      throw new Error('审核状态仅支持 2(通过) / 3(驳回) / 4(需修改)');
    }
    const reviewRemark = String(params.reviewRemark || '').trim().slice(0, 255);
    if ([ 3, 4 ].includes(reviewStatus) && !reviewRemark) {
      throw new Error('驳回/需修改请填写审核备注');
    }
    const row = await ctx.model.Article.findOne({
      where: { id, is_delete: 0 },
      attributes: [ 'id', 'title' ],
    });
    if (!row) throw new Error('文章不存在');
    const rel = await ctx.model.ArticleAuthorRel.findOne({
      where: {
        article_id: id,
        is_delete: 0,
      },
      order: [[ 'id', 'DESC' ]],
      attributes: [ 'user_id' ],
    });
    if (!rel) throw new Error('该文章非前端投稿，不能走投稿审核');

    const now = Math.floor(Date.now() / 1000);
    const adminId = Number(ctx.session[reqAdminIdKey] || 0);
    const isPass = reviewStatus === 2;
    await ctx.model.Article.update({
      is_show: isPass ? 1 : 0,
      review_status: reviewStatus,
      review_remark: isPass ? '' : reviewRemark,
      review_time: now,
      review_admin_id: adminId,
      update_time: now,
    }, {
      where: { id, is_delete: 0 },
    });

    const ownerUserId = Number(rel.user_id || 0);
    if (ownerUserId > 0) {
      const notify = this.buildFrontAuditNotifyPayload(row.title, reviewStatus, reviewRemark);
      const extra = {
        targetType: 'article',
        articleId: Number(id),
        path: `/article/detail?id=${id}`,
        webPath: `/article/${id}`,
        reviewStatus,
        reviewAction: this.resolveReviewAction(reviewStatus),
        reviewRemark: isPass ? '' : reviewRemark,
      };
      await ctx.service.user.createUserMessage(ownerUserId, notify.title, notify.content, 'article_audit', extra);
      /**
       * 审核通过奖励同样采用“旁路失败不阻断主流程”，确保审核链路稳定
       */
      if (isPass) {
        try {
          await ctx.service.uied.contributionIncentive.rewardSubmissionPublished(ownerUserId, Number(id), adminId);
        } catch (rewardError) {
          ctx.logger.warn(`frontAudit rewardSubmissionPublished skipped: ${rewardError.message || rewardError}`);
        }
      }
    }

    return {
      id,
      isShow: isPass ? 1 : 0,
      reviewStatus,
      reviewStatusName: this.getReviewStatusName(reviewStatus),
      reviewRemark: isPass ? '' : reviewRemark,
      reviewTime: formatTime(now),
      reviewAdminId: adminId,
    };
  }

  /**
   * 投稿审核通知列表（前端个人中心）
   */
  async frontAuditMessageList(params = {}) {
    const { ctx } = this;
    const userId = await this.getFrontendUserId(true);
    const pageNo = Math.max(1, Number(params.pageNo || 1));
    const pageSize = Math.max(1, Math.min(50, Number(params.pageSize || 10)));
    const reviewStatus = params.reviewStatus !== undefined && params.reviewStatus !== null && params.reviewStatus !== ''
      ? Number(params.reviewStatus)
      : null;

    const rows = await ctx.model.UserMessage.findAll({
      where: {
        userId: Number(userId),
        type: 'article_audit',
      },
      order: [[ 'id', 'DESC' ]],
    });

    const normalized = rows.map(item => {
      const row = item.toJSON ? item.toJSON() : item;
      const extra = this.parseAuditMessageExtra(row.extra);
      const currentStatus = Number(extra.reviewStatus || 0);
      const action = String(extra.reviewAction || this.resolveReviewAction(currentStatus));
      return {
        id: Number(row.id || 0),
        title: String(row.title || ''),
        content: String(row.content || ''),
        isRead: Number(row.isRead || 0),
        createTime: row.createTime || '',
        articleId: Number(extra.articleId || 0),
        path: String(extra.path || ''),
        webPath: String(extra.webPath || ''),
        reviewStatus: currentStatus,
        reviewStatusName: this.getReviewStatusName(currentStatus),
        reviewAction: action,
        reviewRemark: String(extra.reviewRemark || ''),
      };
    }).filter(item => {
      if (reviewStatus === null) return true;
      return Number(item.reviewStatus || 0) === reviewStatus;
    });

    const total = normalized.length;
    const offset = pageSize * (pageNo - 1);
    const lists = normalized.slice(offset, offset + pageSize);
    return {
      pageNo,
      pageSize,
      total,
      lists,
    };
  }

  async edit(params) {
    const { ctx } = this;
    await this.ensureArticleReviewColumns();
    const now = Math.floor(Date.now() / 1000);
    const authorInput = String(params.author || '').trim();
    if (!authorInput) {
      throw new Error('请选择作者（后台用户）');
    }
    const authorInfo = await this.resolveAuthorInput(authorInput);
    if (!Number(authorInfo.userId || 0)) {
      throw new Error('请选择有效作者');
    }
    // 未设置封面图时，默认取正文第一张图（仅作为“地址引用”，不静默抓图）
    const coverImage = String(params.image || '').trim() || this.extractFirstImageFromContent(params.content);
    const isShowValue = Number(params.isShow ?? 1);
    const reviewStatusValue = isShowValue === 1 ? 2 : 0;
    await ctx.model.Article.update({
      cid: Number(params.cid || 0),
      title: params.title || '',
      intro: params.intro || '',
      summary: params.summary || '',
      image: this.normalizeStoreImageValue(coverImage),
      content: params.content || '',
      author: authorInfo.authorName || '',
      visit: Number(params.visit || 0),
      sort: Number(params.sort || 0),
      is_show: isShowValue,
      review_status: reviewStatusValue,
      review_remark: reviewStatusValue === 2 ? '' : String(params.reviewRemark || ''),
      review_time: reviewStatusValue === 2 ? now : 0,
      review_admin_id: reviewStatusValue === 2 ? Number(ctx.session[reqAdminIdKey] || 0) : 0,
      update_time: now,
    }, {
      where: { id: params.id, is_delete: 0 },
    });
    await this.saveArticleAuthorRelation(params.id, authorInfo.userId, now);
    if (Object.prototype.hasOwnProperty.call(params, 'tagIds')) {
      await this.saveArticleTagRelations(params.id, params.tagIds);
    }
    if (Object.prototype.hasOwnProperty.call(params, 'topicId')) {
      await this.saveArticleTopicRelation(params.id, params.topicId);
    }
  }

  async del(id) {
    const { ctx } = this;
    const now = Math.floor(Date.now() / 1000);
    await ctx.model.Article.update({
      is_delete: 1,
      delete_time: now,
      update_time: now,
    }, {
      where: { id, is_delete: 0 },
    });
    try {
      await ctx.model.ArticleTagRel.update({
        is_delete: 1,
        delete_time: now,
        update_time: now,
      }, {
        where: { article_id: id, is_delete: 0 },
      });
      await ctx.model.ArticleTopicRel.update({
        is_delete: 1,
        delete_time: now,
        update_time: now,
      }, {
        where: { article_id: id, is_delete: 0 },
      });
    } catch (error) {
      ctx.logger.warn(`article del relation cleanup skipped: ${error.message || error}`);
    }
  }

  async change(id) {
    const { ctx } = this;
    await this.ensureArticleReviewColumns();
    const row = await ctx.model.Article.findOne({ where: { id, is_delete: 0 } });
    if (!row) throw new Error('文章不存在');
    const now = Math.floor(Date.now() / 1000);
    const nextStatus = row.is_show === 1 ? 0 : 1;
    const nextReviewStatus = nextStatus === 1 ? 2 : Number(row.review_status || 0);
    await ctx.model.Article.update({
      is_show: nextStatus,
      review_status: nextReviewStatus,
      review_time: nextStatus === 1 ? now : Number(row.review_time || 0),
      review_admin_id: nextStatus === 1 ? Number(ctx.session[reqAdminIdKey] || 0) : Number(row.review_admin_id || 0),
      update_time: now,
    }, {
      where: { id },
    });
  }

  /**
   * 校验文章是否可用于前台互动（已发布且未删除）
   */
  async assertPublicArticle(articleId = 0) {
    const { ctx } = this;
    const id = Number(articleId || 0);
    if (!id) throw new Error('文章ID不能为空');
    const row = await ctx.model.Article.findOne({
      where: {
        id,
        is_delete: 0,
        is_show: 1,
      },
      attributes: [ 'id', 'visit' ],
    });
    if (!row) throw new Error('文章不存在或未发布');
    return row;
  }

  /**
   * 阅读量 +1（前台详情页进入时调用）
   */
  async visitIncr(articleId = 0) {
    const { ctx } = this;
    const row = await this.assertPublicArticle(articleId);
    await ctx.model.Article.increment(
      { visit: 1 },
      {
        where: { id: Number(row.id) },
      }
    );
    return {
      id: Number(row.id),
      visit: Number(row.visit || 0) + 1,
    };
  }

  /**
   * 前台文章收藏列表（兼容 website 端接口路径）
   */
  async collectList(params = {}) {
    const { ctx } = this;
    const userId = await this.getFrontendUserId(true);
    return await ctx.service.user.articleCollectList(userId, params);
  }

  /**
   * 收藏切换（前台用户维度）
   */
  async collectToggle(articleId = 0) {
    const { ctx } = this;
    const row = await this.assertPublicArticle(articleId);
    const userId = await this.getFrontendUserId(true);
    const now = Math.floor(Date.now() / 1000);
    const exists = await ctx.model.ArticleCollect.findOne({
      where: {
        user_id: Number(userId),
        article_id: Number(row.id),
      },
    });
    let isCollect = 1;
    if (exists) {
      const nextDelete = Number(exists.is_delete || 0) === 1 ? 0 : 1;
      await ctx.model.ArticleCollect.update({
        is_delete: nextDelete,
        update_time: now,
        delete_time: nextDelete === 1 ? now : 0,
      }, {
        where: { id: Number(exists.id) },
      });
      isCollect = nextDelete === 0 ? 1 : 0;
    } else {
      await ctx.model.ArticleCollect.create({
        user_id: Number(userId),
        article_id: Number(row.id),
        is_delete: 0,
        create_time: now,
        update_time: now,
        delete_time: 0,
      });
      isCollect = 1;
    }
    const collectCount = await ctx.model.ArticleCollect.count({
      where: {
        article_id: Number(row.id),
        is_delete: 0,
      },
    });
    return {
      id: Number(row.id),
      isCollect,
      collectCount: Number(collectCount || 0),
    };
  }

  /**
   * 点赞切换（前台用户维度）
   */
  async likeToggle(articleId = 0) {
    const { ctx } = this;
    const row = await this.assertPublicArticle(articleId);
    const userId = await this.getFrontendUserId(true);
    const ready = await this.ensureArticleLikeTable();
    if (!ready) {
      throw new Error('点赞表初始化失败，请稍后重试');
    }
    const now = Math.floor(Date.now() / 1000);
    const exists = await ctx.model.ArticleLike.findOne({
      where: {
        user_id: Number(userId),
        article_id: Number(row.id),
      },
    });
    let isLike = 1;
    if (exists) {
      const nextDelete = Number(exists.is_delete || 0) === 1 ? 0 : 1;
      await ctx.model.ArticleLike.update({
        is_delete: nextDelete,
        update_time: now,
        delete_time: nextDelete === 1 ? now : 0,
      }, {
        where: { id: Number(exists.id) },
      });
      isLike = nextDelete === 0 ? 1 : 0;
    } else {
      await ctx.model.ArticleLike.create({
        user_id: Number(userId),
        article_id: Number(row.id),
        is_delete: 0,
        create_time: now,
        update_time: now,
        delete_time: 0,
      });
      isLike = 1;
    }
    const likeCount = await ctx.model.ArticleLike.count({
      where: {
        article_id: Number(row.id),
        is_delete: 0,
      },
    });
    return {
      id: Number(row.id),
      isLike,
      likeCount: Number(likeCount || 0),
    };
  }

  /**
   * 批量获取文章互动统计（前台列表卡片用）
   */
  async stats(ids = []) {
    const { ctx } = this;
    const articleIds = this.parseIdArray(ids);
    if (!articleIds.length) return [];
    const userId = await this.getFrontendUserId(false);
    const rows = await ctx.model.Article.findAll({
      where: {
        id: { [Op.in]: articleIds },
        is_delete: 0,
        is_show: 1,
      },
      attributes: [ 'id', 'visit' ],
    });
    const rowMap = new Map(rows.map(item => [ Number(item.id), Number(item.visit || 0) ]));
    const { collectMap, likeMap, commentMap, userCollectMap, userLikeMap } = await this.getArticleInteractionStats(
      articleIds,
      userId
    );
    return articleIds
      .filter(id => rowMap.has(id))
      .map(id => ({
        id,
        visit: rowMap.get(id) || 0,
        collectCount: collectMap.get(id) || 0,
        likeCount: likeMap.get(id) || 0,
        commentCount: commentMap.get(id) || 0,
        isCollect: userCollectMap.get(id) ? 1 : 0,
        isLike: userLikeMap.get(id) ? 1 : 0,
      }));
  }

  /**
   * 清洗留言内容（纯文本、长度限制）
   */
  sanitizeCommentContent(content = '') {
    return String(content || '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 500);
  }

  /**
   * 解析文章作者用户ID（优先作者关联表，回退 author 字段）
   */
  async resolveArticleAuthorUserId(articleId = 0) {
    const { ctx } = this;
    const id = Number(articleId || 0);
    if (!id) return 0;
    await this.ensureArticleAuthorRelTable();
    const authorRel = await ctx.model.ArticleAuthorRel.findOne({
      where: {
        article_id: id,
        is_delete: 0,
      },
      order: [[ 'id', 'DESC' ]],
      attributes: [ 'user_id' ],
    }).catch(() => null);
    let articleAuthorId = Number(authorRel?.user_id || 0);
    if (articleAuthorId > 0) return articleAuthorId;
    const article = await ctx.model.Article.findOne({
      where: { id, is_delete: 0 },
      attributes: [ 'author' ],
    }).catch(() => null);
    const legacyAuthor = String(article?.author || '').trim();
    if (!legacyAuthor) return 0;
    try {
      const authorInfo = await this.resolveAuthorInput(legacyAuthor);
      articleAuthorId = Number(authorInfo.userId || 0);
      return articleAuthorId;
    } catch (error) {
      return 0;
    }
  }

  /**
   * 发送评论提醒站内信（文章作者 + 被回复用户）
   */
  async sendCommentNotify({
    articleId = 0,
    articleTitle = '',
    commentId = 0,
    senderId = 0,
    senderName = '',
    parentUserId = 0,
    parentId = 0,
  } = {}) {
    const { ctx } = this;
    const id = Number(articleId || 0);
    const fromUserId = Number(senderId || 0);
    if (!id || !fromUserId) return;
    const articleAuthorId = await this.resolveArticleAuthorUserId(id);
    const targets = new Map();
    if (articleAuthorId > 0 && articleAuthorId !== fromUserId) {
      targets.set(articleAuthorId, 'article_comment');
    }
    const replyToUserId = Number(parentUserId || 0);
    if (replyToUserId > 0 && replyToUserId !== fromUserId) {
      targets.set(replyToUserId, 'article_comment_reply');
    }
    if (!targets.size) return;
    const safeSenderName = String(senderName || `用户${fromUserId}`).trim();
    const safeArticleTitle = String(articleTitle || '').trim() || `文章#${id}`;
    const safeCommentId = Number(commentId || 0);
    const safeParentId = Number(parentId || 0);
    const extra = {
      targetType: 'article',
      articleId: id,
      commentId: safeCommentId,
      parentId: safeParentId,
      path: `/article/detail?id=${id}`,
      webPath: `/article/${id}`,
    };
    await Promise.all(Array.from(targets.entries()).map(async ([ userId, noticeType ]) => {
      const title = noticeType === 'article_comment_reply' ? '你收到一条新回复' : '你的文章有新评论';
      const content = noticeType === 'article_comment_reply'
        ? `${safeSenderName} 回复了你在《${safeArticleTitle}》下的评论，点击查看详情。`
        : `${safeSenderName} 评论了你的文章《${safeArticleTitle}》，点击查看详情。`;
      try {
        await ctx.service.user.createUserMessage(userId, title, content, noticeType, extra);
      } catch (error) {
        ctx.logger.warn(`sendCommentNotify failed user=${userId}: ${error.message || error}`);
      }
    }));
  }

  /**
   * 文章留言列表（前台）
   */
  async commentList(params = {}) {
    const { ctx } = this;
    const articleId = Number(params.articleId || params.id || 0);
    if (!articleId) {
      throw new Error('文章ID不能为空');
    }
    await this.assertPublicArticle(articleId);
    const ready = await this.ensureArticleCommentTable();
    if (!ready) {
      return {
        pageNo: 1,
        pageSize: 10,
        count: 0,
        lists: [],
      };
    }
    const pageNo = Number(params.pageNo || 1);
    const pageSize = Number(params.pageSize || 10);
    const limit = Math.max(1, Math.min(50, pageSize));
    const offset = limit * (Math.max(1, pageNo) - 1);
    const currentUserId = await this.getFrontendUserId(false);
    await this.ensureArticleCommentLikeTable();

    const { count, rows } = await ctx.model.ArticleComment.findAndCountAll({
      where: {
        article_id: articleId,
        is_delete: 0,
        is_show: 1,
      },
      order: [[ 'is_top', 'DESC' ], [ 'id', 'DESC' ]],
      limit,
      offset,
    });

    const userIds = Array.from(new Set(rows.map(item => Number(item.user_id || 0)).filter(Boolean)));
    const commentIds = Array.from(new Set(rows.map(item => Number(item.id || 0)).filter(Boolean)));
    const users = userIds.length
      ? await ctx.model.User.findAll({
        where: {
          id: { [Op.in]: userIds },
          isDelete: 0,
        },
        attributes: [ 'id', 'nickname', 'avatar' ],
      })
      : [];
    let likeCountMap = new Map();
    if (commentIds.length) {
      const likeRows = await ctx.model.query(
        'SELECT comment_id, COUNT(1) AS total FROM la_article_comment_like WHERE is_delete=0 AND comment_id IN (?) GROUP BY comment_id',
        { replacements: [ commentIds ], type: ctx.model.QueryTypes.SELECT }
      ).catch(() => []);
      likeCountMap = new Map((Array.isArray(likeRows) ? likeRows : []).map(item => [ Number(item.comment_id || 0), Number(item.total || 0) ]));
    }
    let likeStatusMap = new Map();
    if (currentUserId > 0 && commentIds.length) {
      const likedRows = await ctx.model.query(
        'SELECT comment_id FROM la_article_comment_like WHERE is_delete=0 AND user_id=? AND comment_id IN (?)',
        { replacements: [ Number(currentUserId), commentIds ], type: ctx.model.QueryTypes.SELECT }
      ).catch(() => []);
      likeStatusMap = new Map((Array.isArray(likedRows) ? likedRows : []).map(item => [ Number(item.comment_id || 0), 1 ]));
    }
    const userMap = new Map(users.map(item => [ Number(item.id), item ]));
    const lists = rows.map(item => {
      const user = userMap.get(Number(item.user_id || 0));
      const commentId = Number(item.id || 0);
      return {
        id: commentId,
        articleId: Number(item.article_id || 0),
        parentId: Number(item.parent_id || 0),
        isTop: Number(item.is_top || 0),
        content: String(item.content || ''),
        userId: Number(item.user_id || 0),
        nickname: String(user?.nickname || `用户${item.user_id || ''}`),
        avatar: user?.avatar ? urlUtil.toAbsoluteUrl(user.avatar) : '',
        likeCount: Number(likeCountMap.get(commentId) || 0),
        isLike: Number(likeStatusMap.get(commentId) || 0),
        createTime: formatTime(item.create_time),
      };
    });
    return {
      pageNo: Math.max(1, pageNo),
      pageSize: limit,
      count,
      lists,
    };
  }

  /**
   * 解析拦截词列表
   */
  parseWordList(raw = '') {
    if (!raw) return [];
    return Array.from(new Set(
      String(raw || '')
        .split(/[\n,，;；\s]+/g)
        .map(item => String(item || '').trim())
        .filter(item => item.length >= 2)
    ));
  }

  /**
   * 获取评论拦截配置
   */
  async getCommentModerationConfig() {
    const { ctx } = this;
    const sensitiveWords = String(await ctx.service.common.getVal('article_comment', 'sensitiveWords', '') || '');
    const comboBlacklist = String(await ctx.service.common.getVal('article_comment', 'comboBlacklist', '') || '');
    const maxLinks = Number(await ctx.service.common.getVal('article_comment', 'maxLinks', '2') || 2);
    const duplicateWindowSec = Number(await ctx.service.common.getVal('article_comment', 'duplicateWindowSec', '300') || 300);
    const duplicateThreshold = Number(await ctx.service.common.getVal('article_comment', 'duplicateThreshold', '2') || 2);
    const cooldownSec = Number(await ctx.service.common.getVal('article_comment', 'cooldownSec', '15') || 15);
    const userWindowSec = Number(await ctx.service.common.getVal('article_comment', 'userWindowSec', '60') || 60);
    const userMaxCount = Number(await ctx.service.common.getVal('article_comment', 'userMaxCount', '6') || 6);
    const ipWindowSec = Number(await ctx.service.common.getVal('article_comment', 'ipWindowSec', '60') || 60);
    const ipMaxCount = Number(await ctx.service.common.getVal('article_comment', 'ipMaxCount', '20') || 20);
    return {
      sensitiveWords,
      comboBlacklist,
      maxLinks: Math.max(0, Math.min(10, Math.floor(maxLinks))),
      duplicateWindowSec: Math.max(30, Math.min(86400, Math.floor(duplicateWindowSec))),
      duplicateThreshold: Math.max(1, Math.min(20, Math.floor(duplicateThreshold))),
      cooldownSec: Math.max(0, Math.min(3600, Math.floor(cooldownSec))),
      userWindowSec: Math.max(10, Math.min(86400, Math.floor(userWindowSec))),
      userMaxCount: Math.max(1, Math.min(200, Math.floor(userMaxCount))),
      ipWindowSec: Math.max(10, Math.min(86400, Math.floor(ipWindowSec))),
      ipMaxCount: Math.max(1, Math.min(500, Math.floor(ipMaxCount))),
      sensitiveList: this.parseWordList(sensitiveWords),
      comboList: this.parseWordList(comboBlacklist),
    };
  }

  /**
   * 获取客户端IP（兼容代理头）
   */
  getClientIp() {
    const { ctx } = this;
    const xff = String(ctx.request.header['x-forwarded-for'] || '').split(',')[0].trim();
    const real = String(ctx.request.header['x-real-ip'] || '').trim();
    const raw = xff || real || String(ctx.ip || ctx.request.ip || '').trim();
    const text = raw.replace(/^::ffff:/, '').trim();
    return text.slice(0, 64);
  }

  /**
   * 获取评论敏感词列表（兼容旧调用）
   */
  async getCommentSensitiveWords() {
    const conf = await this.getCommentModerationConfig();
    return conf.sensitiveList;
  }

  /**
   * 查询当前用户/IP是否被禁言
   */
  async getActiveCommentMute({ userId = 0, ip = '' } = {}) {
    const { ctx } = this;
    const ready = await this.ensureArticleCommentMuteTable();
    if (!ready) return null;
    const uid = Number(userId || 0);
    const addr = String(ip || '').trim();
    if (!uid && !addr) return null;
    const now = Math.floor(Date.now() / 1000);
    const where = {
      is_delete: 0,
      expire_time: { [Op.gt]: now },
      [Op.or]: [],
    };
    if (uid > 0) where[Op.or].push({ user_id: uid });
    if (addr) where[Op.or].push({ ip: addr });
    if (!where[Op.or].length) return null;
    const row = await ctx.model.query(
      'SELECT id,user_id,ip,reason,expire_time FROM la_article_comment_mute WHERE is_delete=0 AND expire_time>? AND ((user_id>0 AND user_id=?) OR (ip<>"" AND ip=?)) ORDER BY expire_time DESC LIMIT 1',
      { replacements: [ now, uid, addr ], type: ctx.model.QueryTypes.SELECT }
    ).then(res => Array.isArray(res) ? res[0] : null).catch(() => null);
    return row || null;
  }

  /**
   * 校验评论冷却与限流
   */
  async assertCommentRateLimit({
    userId = 0,
    ip = '',
    cooldownSec = 0,
    userWindowSec = 60,
    userMaxCount = 6,
    ipWindowSec = 60,
    ipMaxCount = 20,
  } = {}) {
    const { ctx } = this;
    const now = Math.floor(Date.now() / 1000);
    const uid = Number(userId || 0);
    const addr = String(ip || '').trim();
    if (cooldownSec > 0) {
      if (uid > 0) {
        const row = await ctx.model.ArticleComment.findOne({
          where: {
            user_id: uid,
            is_delete: 0,
          },
          order: [[ 'id', 'DESC' ]],
          attributes: [ 'create_time' ],
        });
        if (row && now - Number(row.create_time || 0) < cooldownSec) {
          throw new Error(`评论过于频繁，请${cooldownSec}秒后再试`);
        }
      }
      if (addr) {
        const row = await ctx.model.ArticleComment.findOne({
          where: {
            ip: addr,
            is_delete: 0,
          },
          order: [[ 'id', 'DESC' ]],
          attributes: [ 'create_time' ],
        });
        if (row && now - Number(row.create_time || 0) < cooldownSec) {
          throw new Error(`评论过于频繁，请${cooldownSec}秒后再试`);
        }
      }
    }
    if (uid > 0 && userWindowSec > 0 && userMaxCount > 0) {
      const count = await ctx.model.ArticleComment.count({
        where: {
          user_id: uid,
          is_delete: 0,
          create_time: { [Op.gte]: now - userWindowSec },
        },
      });
      if (Number(count || 0) >= userMaxCount) {
        throw new Error(`评论过于频繁，请稍后再试（${userWindowSec}秒内最多${userMaxCount}次）`);
      }
    }
    if (addr && ipWindowSec > 0 && ipMaxCount > 0) {
      const count = await ctx.model.ArticleComment.count({
        where: {
          ip: addr,
          is_delete: 0,
          create_time: { [Op.gte]: now - ipWindowSec },
        },
      });
      if (Number(count || 0) >= ipMaxCount) {
        throw new Error(`当前网络评论过于频繁，请稍后再试（${ipWindowSec}秒内最多${ipMaxCount}次）`);
      }
    }
  }

  /**
   * 统计文本中的链接数量
   */
  countLinksInContent(content = '') {
    const text = String(content || '').toLowerCase();
    if (!text) return 0;
    const reg = /(https?:\/\/|www\.|[a-z0-9-]+\.(com|cn|net|org|top|xyz|io|co)\b)/gi;
    const matched = text.match(reg);
    return Array.isArray(matched) ? matched.length : 0;
  }

  /**
   * 判断是否命中重复文本规则
   */
  async isDuplicateCommentHit({
    userId = 0,
    articleId = 0,
    content = '',
    duplicateWindowSec = 300,
    duplicateThreshold = 2,
  } = {}) {
    const { ctx } = this;
    const uid = Number(userId || 0);
    const aid = Number(articleId || 0);
    if (!uid || !aid || !content) return false;
    const now = Math.floor(Date.now() / 1000);
    const startAt = Math.max(0, now - Math.max(30, Number(duplicateWindowSec || 300)));
    const count = await ctx.model.ArticleComment.count({
      where: {
        user_id: uid,
        article_id: aid,
        content: String(content || ''),
        is_delete: 0,
        create_time: { [Op.gte]: startAt },
      },
    });
    return Number(count || 0) >= Math.max(1, Number(duplicateThreshold || 2));
  }

  /**
   * 计算文本命中的拦截词
   */
  matchSensitiveWords(content = '', words = []) {
    const text = String(content || '');
    return words.filter(word => text.includes(word));
  }

  /**
   * 转义 HTML 字符
   */
  escapeHtml(text = '') {
    return String(text || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * 高亮命中的敏感词（仅后台管理展示）
   */
  highlightSensitiveContent(content = '', hits = []) {
    let html = this.escapeHtml(content);
    const orderedHits = Array.from(new Set((Array.isArray(hits) ? hits : []).filter(Boolean)))
      .sort((a, b) => String(b).length - String(a).length);
    orderedHits.forEach(word => {
      const escaped = String(word).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const reg = new RegExp(escaped, 'g');
      html = html.replace(reg, `<mark class="cm-sensitive-mark">${this.escapeHtml(word)}</mark>`);
    });
    return html;
  }

  /**
   * 解析批量ID参数
   */
  parseBatchIds(ids) {
    if (Array.isArray(ids)) {
      return Array.from(new Set(ids.map(item => Number(item)).filter(item => Number.isInteger(item) && item > 0)));
    }
    const text = String(ids || '').trim();
    if (!text) return [];
    return Array.from(new Set(
      text
        .split(',')
        .map(item => Number(item))
        .filter(item => Number.isInteger(item) && item > 0)
    ));
  }

  /**
   * 后台评论敏感词配置详情
   */
  async commentManageSensitiveDetail() {
    const conf = await this.getCommentModerationConfig();
    return {
      sensitiveWords: conf.sensitiveWords,
      comboBlacklist: conf.comboBlacklist,
      maxLinks: conf.maxLinks,
      duplicateWindowSec: conf.duplicateWindowSec,
      duplicateThreshold: conf.duplicateThreshold,
      cooldownSec: conf.cooldownSec,
      userWindowSec: conf.userWindowSec,
      userMaxCount: conf.userMaxCount,
      ipWindowSec: conf.ipWindowSec,
      ipMaxCount: conf.ipMaxCount,
      list: conf.sensitiveList,
      comboList: conf.comboList,
    };
  }

  /**
   * 后台评论敏感词配置保存
   */
  async commentManageSensitiveSave(params = {}) {
    const { ctx } = this;
    const raw = String(params.sensitiveWords || '').trim();
    const comboBlacklist = String(params.comboBlacklist || '').trim();
    const maxLinks = Math.max(0, Math.min(10, Math.floor(Number(params.maxLinks ?? 2))));
    const duplicateWindowSec = Math.max(30, Math.min(86400, Math.floor(Number(params.duplicateWindowSec ?? 300))));
    const duplicateThreshold = Math.max(1, Math.min(20, Math.floor(Number(params.duplicateThreshold ?? 2))));
    const cooldownSec = Math.max(0, Math.min(3600, Math.floor(Number(params.cooldownSec ?? 15))));
    const userWindowSec = Math.max(10, Math.min(86400, Math.floor(Number(params.userWindowSec ?? 60))));
    const userMaxCount = Math.max(1, Math.min(200, Math.floor(Number(params.userMaxCount ?? 6))));
    const ipWindowSec = Math.max(10, Math.min(86400, Math.floor(Number(params.ipWindowSec ?? 60))));
    const ipMaxCount = Math.max(1, Math.min(500, Math.floor(Number(params.ipMaxCount ?? 20))));
    await Promise.all([
      ctx.service.common.set('article_comment', 'sensitiveWords', raw),
      ctx.service.common.set('article_comment', 'comboBlacklist', comboBlacklist),
      ctx.service.common.set('article_comment', 'maxLinks', String(maxLinks)),
      ctx.service.common.set('article_comment', 'duplicateWindowSec', String(duplicateWindowSec)),
      ctx.service.common.set('article_comment', 'duplicateThreshold', String(duplicateThreshold)),
      ctx.service.common.set('article_comment', 'cooldownSec', String(cooldownSec)),
      ctx.service.common.set('article_comment', 'userWindowSec', String(userWindowSec)),
      ctx.service.common.set('article_comment', 'userMaxCount', String(userMaxCount)),
      ctx.service.common.set('article_comment', 'ipWindowSec', String(ipWindowSec)),
      ctx.service.common.set('article_comment', 'ipMaxCount', String(ipMaxCount)),
    ]);
    return await this.commentManageSensitiveDetail();
  }

  /**
   * 发布文章留言（前台用户）
   */
  async commentAdd(params = {}) {
    const { ctx } = this;
    const articleId = Number(params.articleId || params.id || 0);
    if (!articleId) throw new Error('文章ID不能为空');
    await this.assertPublicArticle(articleId);
    const ready = await this.ensureArticleCommentTable();
    if (!ready) throw new Error('留言服务初始化失败，请稍后重试');
    const userId = await this.getFrontendUserId(true);
    const clientIp = this.getClientIp();
    const parentId = Number(params.parentId || 0);
    const content = this.sanitizeCommentContent(params.content);
    if (!content) throw new Error('留言内容不能为空');
    const moderationConf = await this.getCommentModerationConfig();
    const activeMute = await this.getActiveCommentMute({ userId, ip: clientIp });
    if (activeMute) {
      throw new Error(`当前已被禁言至 ${formatTime(activeMute.expire_time)}，请稍后再试`);
    }
    await this.assertCommentRateLimit({
      userId,
      ip: clientIp,
      cooldownSec: moderationConf.cooldownSec,
      userWindowSec: moderationConf.userWindowSec,
      userMaxCount: moderationConf.userMaxCount,
      ipWindowSec: moderationConf.ipWindowSec,
      ipMaxCount: moderationConf.ipMaxCount,
    });
    const hitSensitiveWords = this.matchSensitiveWords(content, moderationConf.sensitiveList);
    const hitComboWords = this.matchSensitiveWords(content, moderationConf.comboList);
    const linkCount = this.countLinksInContent(content);
    const duplicateHit = await this.isDuplicateCommentHit({
      userId,
      articleId,
      content,
      duplicateWindowSec: moderationConf.duplicateWindowSec,
      duplicateThreshold: moderationConf.duplicateThreshold,
    });
    const interceptReasons = [];
    if (hitSensitiveWords.length) {
      interceptReasons.push('sensitive_word');
    }
    if (moderationConf.maxLinks > 0 && linkCount > moderationConf.maxLinks) {
      interceptReasons.push('too_many_links');
    }
    if (duplicateHit) {
      interceptReasons.push('duplicate_text');
    }
    if (hitComboWords.length >= 2) {
      interceptReasons.push('combo_blacklist');
    }
    const autoHidden = interceptReasons.length > 0;

    let parent = null;
    if (parentId > 0) {
      parent = await ctx.model.ArticleComment.findOne({
        where: {
          id: parentId,
          article_id: articleId,
          is_delete: 0,
        },
      });
      if (!parent) {
        throw new Error('回复目标不存在');
      }
    }

    const article = await ctx.model.Article.findOne({
      where: {
        id: articleId,
        is_delete: 0,
      },
      attributes: [ 'id', 'title' ],
    });

    const now = Math.floor(Date.now() / 1000);
    const row = await ctx.model.ArticleComment.create({
      user_id: Number(userId),
      article_id: articleId,
      parent_id: parentId > 0 ? parentId : 0,
      content,
      ip: clientIp,
      is_top: 0,
      is_show: autoHidden ? 0 : 1,
      is_delete: 0,
      create_time: now,
      update_time: now,
      delete_time: 0,
    });

    const user = await ctx.model.User.findOne({
      where: { id: Number(userId), isDelete: 0 },
      attributes: [ 'id', 'nickname', 'avatar' ],
    });
    const commentCount = await ctx.model.ArticleComment.count({
      where: {
        article_id: articleId,
        is_delete: 0,
        is_show: 1,
      },
    });
    await this.sendCommentNotify({
      articleId,
      articleTitle: String(article?.title || ''),
      commentId: Number(row.id || 0),
      senderId: Number(userId),
      senderName: String(user?.nickname || `用户${userId}`),
      parentUserId: Number(parent?.user_id || 0),
      parentId: parentId > 0 ? parentId : 0,
    });

    return {
      id: Number(row.id || 0),
      articleId,
      parentId: parentId > 0 ? parentId : 0,
      content,
      userId: Number(userId),
      nickname: String(user?.nickname || `用户${userId}`),
      avatar: user?.avatar ? urlUtil.toAbsoluteUrl(user.avatar) : '',
      commentCount: Number(commentCount || 0),
      isShow: autoHidden ? 0 : 1,
      autoHidden,
      hitSensitiveWords,
      hitComboWords,
      linkCount,
      interceptReasons,
      createTime: formatTime(now),
    };
  }

  /**
   * 评论点赞切换（前台用户）
   */
  async commentLikeToggle(params = {}) {
    const { ctx } = this;
    const readyComment = await this.ensureArticleCommentTable();
    const readyLike = await this.ensureArticleCommentLikeTable();
    if (!readyComment || !readyLike) throw new Error('评论服务初始化失败');
    const commentId = Number(params.commentId || params.id || 0);
    if (!commentId) throw new Error('评论ID不能为空');
    const userId = await this.getFrontendUserId(true);
    const comment = await ctx.model.ArticleComment.findOne({
      where: {
        id: commentId,
        is_delete: 0,
        is_show: 1,
      },
      attributes: [ 'id', 'article_id' ],
    });
    if (!comment) throw new Error('评论不存在或已隐藏');
    const now = Math.floor(Date.now() / 1000);
    const existRow = await ctx.model.query(
      'SELECT id,is_delete FROM la_article_comment_like WHERE user_id=? AND comment_id=? LIMIT 1',
      {
        replacements: [ Number(userId), commentId ],
        type: ctx.model.QueryTypes.SELECT,
      }
    ).then(res => Array.isArray(res) ? res[0] : null).catch(() => null);
    let isLike = 0;
    if (!existRow) {
      await ctx.model.query(
        'INSERT INTO la_article_comment_like (user_id,comment_id,is_delete,create_time,update_time,delete_time) VALUES (?,?,0,?,?,0)',
        {
          replacements: [ Number(userId), commentId, now, now ],
          type: ctx.model.QueryTypes.INSERT,
        }
      );
      isLike = 1;
    } else if (Number(existRow.is_delete || 0) === 1) {
      await ctx.model.query(
        'UPDATE la_article_comment_like SET is_delete=0,delete_time=0,update_time=? WHERE id=?',
        { replacements: [ now, Number(existRow.id || 0) ], type: ctx.model.QueryTypes.UPDATE }
      );
      isLike = 1;
    } else {
      await ctx.model.query(
        'UPDATE la_article_comment_like SET is_delete=1,delete_time=?,update_time=? WHERE id=?',
        { replacements: [ now, now, Number(existRow.id || 0) ], type: ctx.model.QueryTypes.UPDATE }
      );
      isLike = 0;
    }
    const [ countRow ] = await ctx.model.query(
      'SELECT COUNT(1) AS c FROM la_article_comment_like WHERE is_delete=0 AND comment_id=?',
      { replacements: [ commentId ], type: ctx.model.QueryTypes.SELECT }
    );
    return {
      commentId,
      articleId: Number(comment.article_id || 0),
      isLike,
      likeCount: Number(countRow?.c || 0),
    };
  }

  /**
   * 后台文章评论列表
   */
  async commentManageList(params = {}) {
    const { ctx } = this;
    const ready = await this.ensureArticleCommentTable();
    if (!ready) {
      return {
        pageNo: 1,
        pageSize: 10,
        count: 0,
        lists: [],
      };
    }
    const pageNo = Number(params.pageNo || 1);
    const pageSize = Number(params.pageSize || 10);
    const limit = Math.max(1, Math.min(100, pageSize));
    const offset = limit * (Math.max(1, pageNo) - 1);
    const where = { is_delete: 0 };
    const mode = String(params.mode || 'root').trim().toLowerCase();
    // 默认仅展示一级评论，便于后台“按评论管理回复”
    if (mode !== 'all') {
      where.parent_id = 0;
    }
    if (params.articleId) {
      where.article_id = Number(params.articleId);
    }
    if (params.isShow !== undefined && params.isShow !== null && params.isShow !== '') {
      where.is_show = Number(params.isShow);
    }
    if (params.keyword) {
      where.content = { [Op.like]: `%${String(params.keyword).trim()}%` };
    }

    const { count, rows } = await ctx.model.ArticleComment.findAndCountAll({
      where,
      limit,
      offset,
      order: [[ 'is_top', 'DESC' ], [ 'id', 'DESC' ]],
    });
    const articleIds = Array.from(new Set(rows.map(item => Number(item.article_id || 0)).filter(Boolean)));
    const rootIds = rows.map(item => Number(item.id || 0)).filter(Boolean);
    const userIds = Array.from(new Set(rows.map(item => Number(item.user_id || 0)).filter(Boolean)));
    const [ articles, users ] = await Promise.all([
      articleIds.length
        ? ctx.model.Article.findAll({
          where: { id: { [Op.in]: articleIds }, is_delete: 0 },
          attributes: [ 'id', 'title', 'is_show' ],
        })
        : Promise.resolve([]),
      userIds.length
        ? ctx.model.User.findAll({
          where: { id: { [Op.in]: userIds }, isDelete: 0 },
          attributes: [ 'id', 'nickname', 'avatar' ],
        })
        : Promise.resolve([]),
    ]);
    const articleMap = new Map(articles.map(item => [ Number(item.id), item ]));
    const userMap = new Map(users.map(item => [ Number(item.id), item ]));
    // 统计当前页每条一级评论下的回复总数（含多级回复）
    const replyCountMap = new Map();
    if (rootIds.length && mode !== 'all' && articleIds.length) {
      const allRows = await ctx.model.ArticleComment.findAll({
        where: {
          is_delete: 0,
          article_id: { [Op.in]: articleIds },
        },
        attributes: [ 'id', 'parent_id', 'article_id' ],
      });
      const byArticleChildren = new Map();
      allRows.forEach(row => {
        const articleId = Number(row.article_id || 0);
        const parentId = Number(row.parent_id || 0);
        const id = Number(row.id || 0);
        if (!byArticleChildren.has(articleId)) {
          byArticleChildren.set(articleId, new Map());
        }
        const childMap = byArticleChildren.get(articleId);
        if (!childMap.has(parentId)) {
          childMap.set(parentId, []);
        }
        childMap.get(parentId).push(id);
      });
      rows.forEach(row => {
        const articleId = Number(row.article_id || 0);
        const rootId = Number(row.id || 0);
        const childMap = byArticleChildren.get(articleId) || new Map();
        const stack = [ rootId ];
        const visited = new Set([ rootId ]);
        let total = 0;
        while (stack.length) {
          const current = stack.pop();
          const children = childMap.get(current) || [];
          children.forEach(childId => {
            if (visited.has(childId)) return;
            visited.add(childId);
            total += 1;
            stack.push(childId);
          });
        }
        replyCountMap.set(rootId, total);
      });
    }

    const sensitiveWords = await this.getCommentSensitiveWords();
    const lists = rows.map(item => {
      const articleId = Number(item.article_id || 0);
      const userId = Number(item.user_id || 0);
      const article = articleMap.get(articleId);
      const user = userMap.get(userId);
      const id = Number(item.id || 0);
      const content = String(item.content || '');
      const hitSensitiveWords = this.matchSensitiveWords(content, sensitiveWords);
      return {
        id,
        articleId,
        articleTitle: String(article?.title || ''),
        articleIsShow: Number(article?.is_show || 0),
        parentId: Number(item.parent_id || 0),
        isReply: Number(item.parent_id || 0) > 0,
        isTop: Number(item.is_top || 0),
        replyCount: Number(replyCountMap.get(id) || 0),
        content,
        contentHighlighted: this.highlightSensitiveContent(content, hitSensitiveWords),
        hitSensitiveWords,
        ip: String(item.ip || ''),
        userId,
        nickname: String(user?.nickname || `用户${userId}`),
        avatar: user?.avatar ? urlUtil.toAbsoluteUrl(user.avatar) : '',
        isShow: Number(item.is_show || 0),
        createTime: formatTime(item.create_time),
      };
    });
    return {
      pageNo: Math.max(1, pageNo),
      pageSize: limit,
      count,
      lists,
    };
  }

  /**
   * 后台：获取某条评论下的回复列表（含多级回复）
   */
  async commentManageReplies(params = {}) {
    const { ctx } = this;
    const ready = await this.ensureArticleCommentTable();
    if (!ready) {
      return {
        pageNo: 1,
        pageSize: 10,
        count: 0,
        lists: [],
      };
    }
    const commentId = Number(params.commentId || 0);
    if (!commentId) throw new Error('评论ID不能为空');
    const root = await ctx.model.ArticleComment.findOne({
      where: {
        id: commentId,
        is_delete: 0,
      },
    });
    if (!root) throw new Error('评论不存在');
    const articleId = Number(root.article_id || 0);
    const pageNo = Math.max(1, Number(params.pageNo || 1));
    const pageSize = Math.max(1, Math.min(100, Number(params.pageSize || 10)));
    const offset = (pageNo - 1) * pageSize;
    const keyword = String(params.keyword || '').trim();
    const hasShowFilter = params.isShow !== undefined && params.isShow !== null && params.isShow !== '';
    const showValue = hasShowFilter ? Number(params.isShow) : -1;

    const allRows = await ctx.model.ArticleComment.findAll({
      where: {
        article_id: articleId,
        is_delete: 0,
      },
      order: [[ 'create_time', 'ASC' ], [ 'id', 'ASC' ]],
    });
    const childrenMap = new Map();
    const rowMap = new Map();
    allRows.forEach(row => {
      const id = Number(row.id || 0);
      const parentId = Number(row.parent_id || 0);
      rowMap.set(id, row);
      if (!childrenMap.has(parentId)) {
        childrenMap.set(parentId, []);
      }
      childrenMap.get(parentId).push(id);
    });
    const descendantIds = [];
    const visited = new Set([ commentId ]);
    const queue = [ commentId ];
    while (queue.length) {
      const current = queue.shift();
      const children = childrenMap.get(current) || [];
      children.forEach(id => {
        if (visited.has(id)) return;
        visited.add(id);
        descendantIds.push(id);
        queue.push(id);
      });
    }
    let descendants = descendantIds
      .map(id => rowMap.get(id))
      .filter(Boolean);
    if (keyword) {
      descendants = descendants.filter(item => String(item.content || '').includes(keyword));
    }
    if (hasShowFilter) {
      descendants = descendants.filter(item => Number(item.is_show || 0) === showValue);
    }

    const count = descendants.length;
    const pageRows = descendants.slice(offset, offset + pageSize);
    const userIds = Array.from(new Set(pageRows.map(item => Number(item.user_id || 0)).filter(Boolean)));
    const users = userIds.length
      ? await ctx.model.User.findAll({
        where: { id: { [Op.in]: userIds }, isDelete: 0 },
        attributes: [ 'id', 'nickname', 'avatar' ],
      })
      : [];
    const userMap = new Map(users.map(item => [ Number(item.id), item ]));

    const sensitiveWords = await this.getCommentSensitiveWords();
    const lists = pageRows.map(item => {
      const id = Number(item.id || 0);
      const userId = Number(item.user_id || 0);
      const parentId = Number(item.parent_id || 0);
      const user = userMap.get(userId);
      const content = String(item.content || '');
      const hitSensitiveWords = this.matchSensitiveWords(content, sensitiveWords);
      return {
        id,
        articleId,
        rootId: commentId,
        parentId,
        content,
        contentHighlighted: this.highlightSensitiveContent(content, hitSensitiveWords),
        hitSensitiveWords,
        ip: String(item.ip || ''),
        userId,
        nickname: String(user?.nickname || `用户${userId}`),
        avatar: user?.avatar ? urlUtil.toAbsoluteUrl(user.avatar) : '',
        isShow: Number(item.is_show || 0),
        createTime: formatTime(item.create_time),
      };
    });
    return {
      pageNo,
      pageSize,
      count,
      root: {
        id: Number(root.id || 0),
        articleId,
        content: String(root.content || ''),
      },
      lists,
    };
  }

  /**
   * 后台文章评论状态切换
   */
  async commentManageChange(id = 0) {
    const { ctx } = this;
    const commentId = Number(id || 0);
    if (!commentId) throw new Error('评论ID不能为空');
    const ready = await this.ensureArticleCommentTable();
    if (!ready) throw new Error('评论服务初始化失败');
    const row = await ctx.model.ArticleComment.findOne({
      where: {
        id: commentId,
        is_delete: 0,
      },
    });
    if (!row) throw new Error('评论不存在');
    const now = Math.floor(Date.now() / 1000);
    const nextStatus = Number(row.is_show || 0) === 1 ? 0 : 1;
    await ctx.model.ArticleComment.update({
      is_show: nextStatus,
      update_time: now,
    }, {
      where: { id: commentId },
    });
  }

  /**
   * 评论置顶切换（仅文章作者或管理员）
   */
  async commentTopToggle(params = {}) {
    const { ctx } = this;
    const commentId = Number(params.id || params.commentId || 0);
    if (!commentId) throw new Error('评论ID不能为空');
    const ready = await this.ensureArticleCommentTable();
    if (!ready) throw new Error('评论服务初始化失败');
    const row = await ctx.model.ArticleComment.findOne({
      where: {
        id: commentId,
        is_delete: 0,
      },
    });
    if (!row) throw new Error('评论不存在');
    const articleId = Number(row.article_id || 0);
    if (!articleId) throw new Error('评论数据异常');

    const isAdmin = await this.isValidAdminRequest();
    if (!isAdmin) {
      const userId = await this.getFrontendUserId(true);
      const authorId = await this.resolveArticleAuthorUserId(articleId);
      if (!authorId || Number(authorId) !== Number(userId)) {
        throw new Error('无权限置顶该评论');
      }
    }
    // 仅允许置顶一级评论，回复不参与置顶排序
    if (Number(row.parent_id || 0) > 0) {
      throw new Error('仅支持置顶一级评论');
    }

    const now = Math.floor(Date.now() / 1000);
    const nextTop = Number(row.is_top || 0) === 1 ? 0 : 1;
    await ctx.model.ArticleComment.update({
      is_top: nextTop,
      update_time: now,
    }, {
      where: {
        id: commentId,
        is_delete: 0,
      },
    });
    return {
      id: commentId,
      articleId,
      isTop: nextTop,
    };
  }

  /**
   * 后台文章评论删除
   */
  async commentManageDel(id = 0) {
    const { ctx } = this;
    const commentId = Number(id || 0);
    if (!commentId) throw new Error('评论ID不能为空');
    const ready = await this.ensureArticleCommentTable();
    if (!ready) throw new Error('评论服务初始化失败');
    const now = Math.floor(Date.now() / 1000);
    await ctx.model.ArticleComment.update({
      is_delete: 1,
      delete_time: now,
      update_time: now,
    }, {
      where: {
        id: commentId,
        is_delete: 0,
      },
    });
  }

  /**
   * 后台文章评论批量显示/隐藏
   */
  async commentManageBatchChange(params = {}) {
    const { ctx } = this;
    const ready = await this.ensureArticleCommentTable();
    if (!ready) throw new Error('评论服务初始化失败');
    const ids = this.parseBatchIds(params.ids);
    if (!ids.length) throw new Error('评论ID不能为空');
    const isShow = Number(params.isShow) === 1 ? 1 : 0;
    const now = Math.floor(Date.now() / 1000);
    const [ affected ] = await ctx.model.ArticleComment.update({
      is_show: isShow,
      update_time: now,
    }, {
      where: {
        id: { [Op.in]: ids },
        is_delete: 0,
      },
    });
    return {
      ids,
      isShow,
      affected: Number(affected || 0),
    };
  }

  /**
   * 后台文章评论批量删除
   */
  async commentManageBatchDel(params = {}) {
    const { ctx } = this;
    const ready = await this.ensureArticleCommentTable();
    if (!ready) throw new Error('评论服务初始化失败');
    const ids = this.parseBatchIds(params.ids);
    if (!ids.length) throw new Error('评论ID不能为空');
    const now = Math.floor(Date.now() / 1000);
    const [ affected ] = await ctx.model.ArticleComment.update({
      is_delete: 1,
      delete_time: now,
      update_time: now,
    }, {
      where: {
        id: { [Op.in]: ids },
        is_delete: 0,
      },
    });
    return {
      ids,
      affected: Number(affected || 0),
    };
  }

  /**
   * 前台评论举报
   */
  async commentReportAdd(params = {}) {
    const { ctx } = this;
    const ready = await this.ensureArticleCommentReportTable();
    if (!ready) throw new Error('举报服务初始化失败');
    const userId = await this.getFrontendUserId(true);
    const commentId = Number(params.commentId || params.id || 0);
    if (!commentId) throw new Error('评论ID不能为空');
    const reason = String(params.reason || '').trim().slice(0, 120);
    const content = String(params.content || '').trim().slice(0, 500);
    if (!reason) throw new Error('举报原因不能为空');
    const comment = await ctx.model.ArticleComment.findOne({
      where: {
        id: commentId,
        is_delete: 0,
      },
      attributes: [ 'id', 'article_id' ],
    });
    if (!comment) throw new Error('评论不存在');
    const now = Math.floor(Date.now() / 1000);
    const exist = await ctx.model.query(
      'SELECT id FROM la_article_comment_report WHERE is_delete=0 AND status=0 AND comment_id=? AND reporter_user_id=? LIMIT 1',
      { replacements: [ commentId, userId ], type: ctx.model.QueryTypes.SELECT }
    ).then(res => Array.isArray(res) ? res[0] : null);
    if (exist && Number(exist.id || 0) > 0) {
      throw new Error('你已举报过该评论，请等待处理');
    }
    await ctx.model.query(
      'INSERT INTO la_article_comment_report (comment_id,article_id,reporter_user_id,reason,content,status,handle_admin_id,handle_remark,handle_time,is_delete,create_time,update_time,delete_time) VALUES (?,?,?,?,?,0,0,"",0,0,?,?,0)',
      {
        replacements: [
          commentId,
          Number(comment.article_id || 0),
          Number(userId),
          reason,
          content,
          now,
          now,
        ],
        type: ctx.model.QueryTypes.INSERT,
      }
    );
    return { commentId, articleId: Number(comment.article_id || 0), status: 0 };
  }

  /**
   * 后台举报列表
   */
  async commentManageReportList(params = {}) {
    const { ctx } = this;
    const ready = await this.ensureArticleCommentReportTable();
    if (!ready) {
      return { pageNo: 1, pageSize: 10, count: 0, lists: [] };
    }
    const pageNo = Math.max(1, Number(params.pageNo || 1));
    const pageSize = Math.max(1, Math.min(100, Number(params.pageSize || 10)));
    const offset = (pageNo - 1) * pageSize;
    const where = [ 'r.is_delete=0' ];
    const replacements = [];
    if (params.status !== undefined && params.status !== null && params.status !== '') {
      where.push('r.status=?');
      replacements.push(Number(params.status));
    }
    if (params.articleId) {
      where.push('r.article_id=?');
      replacements.push(Number(params.articleId));
    }
    if (params.keyword) {
      const kw = `%${String(params.keyword).trim()}%`;
      where.push('(r.reason LIKE ? OR r.content LIKE ? OR c.content LIKE ?)');
      replacements.push(kw, kw, kw);
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const [ countRow ] = await ctx.model.query(
      `SELECT COUNT(1) AS c FROM la_article_comment_report r
       LEFT JOIN la_article_comment c ON c.id=r.comment_id
       ${whereSql}`,
      { replacements, type: ctx.model.QueryTypes.SELECT }
    );
    const rows = await ctx.model.query(
      `SELECT
         r.id,r.comment_id,r.article_id,r.reporter_user_id,r.reason,r.content,r.status,
         r.handle_admin_id,r.handle_remark,r.handle_time,r.create_time,
         c.content AS comment_content,c.is_show AS comment_is_show,c.is_delete AS comment_is_delete,
         a.title AS article_title,
         u.nickname AS reporter_nickname,
         m.nickname AS handle_admin_name
       FROM la_article_comment_report r
       LEFT JOIN la_article_comment c ON c.id=r.comment_id
       LEFT JOIN la_article a ON a.id=r.article_id
       LEFT JOIN la_user u ON u.id=r.reporter_user_id
       LEFT JOIN la_system_auth_admin m ON m.id=r.handle_admin_id
       ${whereSql}
       ORDER BY r.status ASC,r.id DESC
       LIMIT ? OFFSET ?`,
      {
        replacements: [ ...replacements, pageSize, offset ],
        type: ctx.model.QueryTypes.SELECT,
      }
    );
    const statusNameMap = {
      0: '待处理',
      1: '已处理',
      2: '已忽略',
    };
    const lists = (Array.isArray(rows) ? rows : []).map(item => ({
      id: Number(item.id || 0),
      commentId: Number(item.comment_id || 0),
      articleId: Number(item.article_id || 0),
      articleTitle: String(item.article_title || ''),
      reporterUserId: Number(item.reporter_user_id || 0),
      reporterNickname: String(item.reporter_nickname || `用户${item.reporter_user_id || ''}`),
      reason: String(item.reason || ''),
      content: String(item.content || ''),
      status: Number(item.status || 0),
      statusName: statusNameMap[Number(item.status || 0)] || '待处理',
      commentContent: String(item.comment_content || ''),
      commentIsShow: Number(item.comment_is_show || 0),
      commentIsDelete: Number(item.comment_is_delete || 0),
      handleAdminId: Number(item.handle_admin_id || 0),
      handleAdminName: String(item.handle_admin_name || ''),
      handleRemark: String(item.handle_remark || ''),
      handleTime: formatTime(item.handle_time || 0),
      createTime: formatTime(item.create_time || 0),
    }));
    return {
      pageNo,
      pageSize,
      count: Number(countRow?.c || 0),
      lists,
    };
  }

  /**
   * 后台处理举报
   */
  async commentManageReportHandle(params = {}) {
    const { ctx } = this;
    const ready = await this.ensureArticleCommentReportTable();
    if (!ready) throw new Error('举报服务初始化失败');
    await this.ensureArticleCommentTable();
    const id = Number(params.id || 0);
    if (!id) throw new Error('举报ID不能为空');
    const status = Number(params.status || 0);
    if (![ 1, 2 ].includes(status)) throw new Error('处理状态不正确');
    const action = String(params.action || '').trim();
    const handleRemark = String(params.handleRemark || '').trim().slice(0, 255);
    const now = Math.floor(Date.now() / 1000);
    const reportRow = await ctx.model.query(
      'SELECT id,comment_id,status FROM la_article_comment_report WHERE id=? AND is_delete=0 LIMIT 1',
      { replacements: [ id ], type: ctx.model.QueryTypes.SELECT }
    ).then(res => Array.isArray(res) ? res[0] : null);
    if (!reportRow) throw new Error('举报记录不存在');
    const commentId = Number(reportRow.comment_id || 0);
    if (commentId > 0 && status === 1) {
      if (action === 'hide_comment') {
        await ctx.model.ArticleComment.update({
          is_show: 0,
          update_time: now,
        }, {
          where: { id: commentId, is_delete: 0 },
        });
      } else if (action === 'delete_comment') {
        await ctx.model.ArticleComment.update({
          is_delete: 1,
          delete_time: now,
          update_time: now,
        }, {
          where: { id: commentId, is_delete: 0 },
        });
      }
    }
    const adminId = Number(ctx.session?.admin_id || 0);
    await ctx.model.query(
      'UPDATE la_article_comment_report SET status=?,handle_admin_id=?,handle_remark=?,handle_time=?,update_time=? WHERE id=? AND is_delete=0',
      {
        replacements: [ status, adminId, handleRemark, now, now, id ],
        type: ctx.model.QueryTypes.UPDATE,
      }
    );
    return { id, status, action };
  }

  /**
   * 后台禁言列表
   */
  async commentManageMuteList(params = {}) {
    const { ctx } = this;
    const ready = await this.ensureArticleCommentMuteTable();
    if (!ready) return { pageNo: 1, pageSize: 10, count: 0, lists: [] };
    const pageNo = Math.max(1, Number(params.pageNo || 1));
    const pageSize = Math.max(1, Math.min(100, Number(params.pageSize || 10)));
    const offset = (pageNo - 1) * pageSize;
    const now = Math.floor(Date.now() / 1000);
    const where = [ 'm.is_delete=0' ];
    const replacements = [];
    if (params.keyword) {
      const kw = `%${String(params.keyword).trim()}%`;
      where.push('(m.reason LIKE ? OR u.nickname LIKE ? OR m.ip LIKE ?)');
      replacements.push(kw, kw, kw);
    }
    if (params.active !== undefined && params.active !== null && params.active !== '') {
      if (Number(params.active) === 1) {
        where.push('m.expire_time>?');
        replacements.push(now);
      } else {
        where.push('m.expire_time<=?');
        replacements.push(now);
      }
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const [ countRow ] = await ctx.model.query(
      `SELECT COUNT(1) AS c FROM la_article_comment_mute m
       LEFT JOIN la_user u ON u.id=m.user_id
       ${whereSql}`,
      { replacements, type: ctx.model.QueryTypes.SELECT }
    );
    const rows = await ctx.model.query(
      `SELECT m.id,m.user_id,m.ip,m.reason,m.expire_time,m.create_time,u.nickname
       FROM la_article_comment_mute m
       LEFT JOIN la_user u ON u.id=m.user_id
       ${whereSql}
       ORDER BY m.id DESC
       LIMIT ? OFFSET ?`,
      {
        replacements: [ ...replacements, pageSize, offset ],
        type: ctx.model.QueryTypes.SELECT,
      }
    );
    const lists = (Array.isArray(rows) ? rows : []).map(item => ({
      id: Number(item.id || 0),
      userId: Number(item.user_id || 0),
      userNickname: String(item.nickname || ''),
      ip: String(item.ip || ''),
      reason: String(item.reason || ''),
      expireTime: formatTime(item.expire_time || 0),
      isActive: Number(item.expire_time || 0) > now ? 1 : 0,
      createTime: formatTime(item.create_time || 0),
    }));
    return {
      pageNo,
      pageSize,
      count: Number(countRow?.c || 0),
      lists,
    };
  }

  /**
   * 后台新增禁言
   */
  async commentManageMuteAdd(params = {}) {
    const { ctx } = this;
    const ready = await this.ensureArticleCommentMuteTable();
    if (!ready) throw new Error('禁言服务初始化失败');
    const userId = Number(params.userId || 0);
    const ip = String(params.ip || '').trim().slice(0, 64);
    if (!userId && !ip) throw new Error('用户ID和IP至少填写一个');
    const reason = String(params.reason || '').trim().slice(0, 255);
    const durationMinutes = Math.max(1, Math.min(43200, Number(params.durationMinutes || 60)));
    const now = Math.floor(Date.now() / 1000);
    const expireTime = now + Math.floor(durationMinutes * 60);
    await ctx.model.query(
      'INSERT INTO la_article_comment_mute (user_id,ip,reason,expire_time,is_delete,create_time,update_time,delete_time) VALUES (?,?,?,?,0,?,?,0)',
      {
        replacements: [ userId, ip, reason, expireTime, now, now ],
        type: ctx.model.QueryTypes.INSERT,
      }
    );
    return { userId, ip, expireTime };
  }

  /**
   * 后台解除禁言
   */
  async commentManageMuteDel(id = 0) {
    const { ctx } = this;
    const muteId = Number(id || 0);
    if (!muteId) throw new Error('禁言ID不能为空');
    const ready = await this.ensureArticleCommentMuteTable();
    if (!ready) throw new Error('禁言服务初始化失败');
    const now = Math.floor(Date.now() / 1000);
    await ctx.model.query(
      'UPDATE la_article_comment_mute SET is_delete=1,delete_time=?,update_time=? WHERE id=? AND is_delete=0',
      { replacements: [ now, now, muteId ], type: ctx.model.QueryTypes.UPDATE }
    );
    return true;
  }
}

module.exports = ArticleService;
