/**
 * @file controller/uied/frontend.js
 * @description UIED 前端兼容控制器 - 提供与原 Express API 兼容的接口
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

'use strict';

const Controller = require('egg').Controller;

class FrontendController extends Controller {
  /**
   * 获取所有页面配置
   * GET /api/pages
   */
  async pages() {
    const { ctx } = this;
    try {
      const pages = await ctx.service.uied.frontend.getAllPages();
      ctx.body = pages;
    } catch (error) {
      ctx.logger.error('获取页面列表失败:', error);
      ctx.status = 500;
      ctx.body = { error: error.message };
    }
  }

  /**
   * 获取单个页面配置
   * GET /api/pages/:slug
   */
  async pageDetail() {
    const { ctx } = this;
    const { slug } = ctx.params;

    try {
      const page = await ctx.service.uied.page.detail(null, slug);
      if (!page) {
        ctx.status = 404;
        ctx.body = { error: '页面不存在' };
        return;
      }
      ctx.body = page;
    } catch (error) {
      ctx.logger.error('获取页面详情失败:', error);
      ctx.status = 500;
      ctx.body = { error: error.message };
    }
  }

  /**
   * 获取页面完整数据
   * GET /api/pages/:slug/full
   */
  async pageFullData() {
    const { ctx } = this;
    const { slug } = ctx.params;

    try {
      const data = await ctx.service.uied.frontend.getPageFullData(slug);
      if (!data) {
        ctx.status = 404;
        ctx.body = { error: '页面不存在' };
        return;
      }
      ctx.body = data;
    } catch (error) {
      ctx.logger.error('获取页面完整数据失败:', error);
      ctx.status = 500;
      ctx.body = { error: error.message };
    }
  }

  /**
   * 获取页面热门推荐
   * GET /api/pages/:slug/hot
   */
  async pageHotWebsites() {
    const { ctx } = this;
    const { slug } = ctx.params;
    const { limit = 12 } = ctx.query;

    try {
      const websites = await ctx.service.uied.frontend.getPageHotWebsites(slug, limit);
      ctx.body = websites;
    } catch (error) {
      ctx.logger.error('获取热门推荐失败:', error);
      ctx.status = 500;
      ctx.body = { error: error.message };
    }
  }

  /**
   * 获取页面热门标签
   * GET /api/pages/:slug/hot-tags
   */
  async pageHotTags() {
    const { ctx } = this;
    const { slug } = ctx.params;
    const { limit = 10 } = ctx.query;

    try {
      const data = await ctx.service.uied.frontend.getPageHotTags(slug, limit);
      ctx.body = data;
    } catch (error) {
      ctx.logger.error('获取热门标签失败:', error);
      ctx.status = 500;
      ctx.body = { error: error.message };
    }
  }

  /**
   * 搜索页面内的网站
   * GET /api/pages/:slug/search
   */
  async pageSearch() {
    const { ctx } = this;
    const { slug } = ctx.params;
    const { q, limit = 50 } = ctx.query;

    try {
      const data = await ctx.service.uied.frontend.searchPageWebsites(slug, q, limit);
      ctx.body = data;
    } catch (error) {
      ctx.logger.error('搜索失败:', error);
      ctx.status = 500;
      ctx.body = { error: error.message };
    }
  }

  /**
   * 获取网站列表（支持通过 ids 参数批量获取）
   * GET /api/websites
   * 支持新数字ID和旧cuid格式ID
   */
  async websites() {
    const { ctx } = this;
    const { ids, limit = 100 } = ctx.query;

    try {
      if (ids) {
        // 通过 ids 批量获取（支持新数字ID和旧cuid格式）
        const idList = ids.split(',').map(id => id.trim()).filter(id => id);
        if (idList.length === 0) {
          ctx.body = { websites: [] };
          return;
        }
        const websites = await ctx.service.uied.frontend.getWebsitesByIds(idList);
        ctx.body = { websites };
      } else {
        // 获取热门网站列表
        const websites = await ctx.service.uied.frontend.getHotWebsites(parseInt(limit));
        ctx.body = { websites };
      }
    } catch (error) {
      ctx.logger.error('获取网站列表失败:', error);
      ctx.status = 500;
      ctx.body = { error: error.message };
    }
  }

  /**
   * 获取网站详情
   * GET /api/websites/:idOrSlug
   */
  async websiteDetail() {
    const { ctx } = this;
    const { idOrSlug } = ctx.params;

    try {
      const website = await ctx.service.uied.frontend.getWebsiteDetail(idOrSlug);
      if (!website) {
        ctx.status = 404;
        ctx.body = { error: '网站不存在' };
        return;
      }
      ctx.body = website;
    } catch (error) {
      ctx.logger.error('获取网站详情失败:', error);
      ctx.status = 500;
      ctx.body = { error: error.message };
    }
  }

  /**
   * 获取相关推荐网站
   * GET /api/websites/:id/related
   */
  async websiteRelated() {
    const { ctx } = this;
    const { id } = ctx.params;
    const { limit = 6 } = ctx.query;

    try {
      const websites = await ctx.service.uied.frontend.getRelatedWebsites(id, parseInt(limit));
      ctx.body = websites;
    } catch (error) {
      ctx.logger.error('获取相关推荐失败:', error);
      ctx.status = 500;
      ctx.body = { error: error.message };
    }
  }

  /**
   * 记录网站点击
   * POST /api/websites/:id/click
   */
  async websiteClick() {
    const { ctx } = this;
    const { id } = ctx.params;

    try {
      await ctx.service.uied.website.click(id);
      ctx.body = {};
    } catch (error) {
      ctx.logger.error('记录点击失败:', error);
      ctx.status = 500;
      ctx.body = { error: error.message };
    }
  }

  /**
   * 获取公开设置
   * GET /api/settings/public
   */
  async publicSettings() {
    const { ctx } = this;

    try {
      const settings = await ctx.service.uied.setting.getPublicSettings();
      ctx.body = settings;
    } catch (error) {
      ctx.logger.error('获取公开设置失败:', error);
      ctx.status = 500;
      ctx.body = { error: error.message };
    }
  }

  /**
   * 获取详情页配置
   * GET /api/settings/detailPageConfig
   */
  async detailPageConfig() {
    const { ctx } = this;

    try {
      const config = await ctx.service.uied.setting.getSettingByKey('detailPageConfig');
      ctx.body = config || {};
    } catch (error) {
      ctx.logger.error('获取详情页配置失败:', error);
      ctx.body = {};
    }
  }

  /**
   * 获取网站标签
   * GET /api/settings/website/:id/tags
   */
  async websiteTags() {
    const { ctx } = this;
    const { id } = ctx.params;

    try {
      const tags = await ctx.service.uied.websiteTag.getWebsiteTags(id);
      ctx.body = tags || [];
    } catch (error) {
      ctx.logger.error('获取网站标签失败:', error);
      ctx.body = [];
    }
  }

  /**
   * 获取前端配置（跳转弹窗、页面全局配置等）
   * GET /api/settings/frontend-config
   */
  async frontendConfig() {
    const { ctx } = this;

    try {
      const [
        exitModalConfig,
        pageGlobalConfig,
        appearanceConfig,
        homepageConfig,
        cardStyleConfig,
        sidebarConfig,
        searchConfig,
      ] = await Promise.all([
        ctx.service.uied.setting.get('exitModalConfig'),
        ctx.service.uied.setting.get('pageGlobalConfig'),
        ctx.service.uied.setting.get('appearanceConfig'),
        ctx.service.uied.setting.get('homepageConfig'),
        ctx.service.uied.setting.get('cardStyleConfig'),
        ctx.service.uied.setting.get('sidebarConfig'),
        ctx.service.uied.setting.get('searchConfig'),
      ]);

      /**
       * 规范化页面点击配置，兼容历史值并确保前端行为稳定
       */
      const normalizedPageGlobalConfig = ctx.service.uied.setting.normalizePageGlobalConfig(
        pageGlobalConfig || {}
      );

      ctx.body = {
        exitModalEnabled: true,
        exitModalConfig: exitModalConfig || {},
        pageGlobalConfig: normalizedPageGlobalConfig,
        appearanceConfig: appearanceConfig || {},
        homepageConfig: homepageConfig || {},
        cardStyleConfig: cardStyleConfig || {},
        sidebarConfig: sidebarConfig || {},
        searchConfig: searchConfig || {},
      };
    } catch (error) {
      ctx.logger.error('获取前端配置失败:', error);
      ctx.body = {
        exitModalEnabled: true,
        exitModalConfig: {},
        pageGlobalConfig: {},
        appearanceConfig: {},
        homepageConfig: {},
        cardStyleConfig: {},
        sidebarConfig: {},
        searchConfig: {},
      };
    }
  }

  /**
   * 获取固定链接配置
   * GET /api/settings/permalink
   */
  async permalinkConfig() {
    const { ctx } = this;

    try {
      const config = await ctx.service.uied.setting.get('permalink_config');
      ctx.body = config || { structure: 'plain', customPattern: '' };
    } catch (error) {
      ctx.logger.error('获取固定链接配置失败:', error);
      ctx.body = { structure: 'plain', customPattern: '' };
    }
  }

  /**
   * 获取启用的 Favicon API 列表（前端用于动态获取网站图标）
   * GET /api/settings/favicon-apis
   */
  async faviconApis() {
    const { ctx } = this;

    try {
      const apis = await ctx.service.uied.frontend.getFaviconApis();
      ctx.body = apis;
    } catch (error) {
      ctx.logger.error('获取 Favicon API 列表失败:', error);
      ctx.body = [];
    }
  }

  /**
   * 获取热门推荐列表
   * GET /api/hot-recommendations
   */
  async hotRecommendations() {
    const { ctx } = this;

    try {
      const result = await ctx.service.uied.hotRecommendation.list({ page: 1, pageSize: 100 });
      ctx.body = result.lists;
    } catch (error) {
      ctx.logger.error('获取热门推荐失败:', error);
      ctx.status = 500;
      ctx.body = { error: error.message };
    }
  }

  /**
   * 获取激活的热门推荐（前端调用）
   * GET /api/hot-recommendations/active
   */
  async hotRecommendationsActive() {
    const { ctx } = this;
    const { position, limit = 20 } = ctx.query;

    try {
      const result = await ctx.service.uied.hotRecommendation.getActive(position, parseInt(limit));
      ctx.body = result;
    } catch (error) {
      ctx.logger.error('获取激活热门推荐失败:', error);
      ctx.status = 500;
      ctx.body = { error: error.message };
    }
  }

  /**
   * 记录热门推荐点击
   * POST /api/hot-recommendations/:id/click
   */
  async hotRecommendationClick() {
    const { ctx } = this;
    const { id } = ctx.params;

    try {
      await ctx.service.uied.hotRecommendation.recordClick(id);
      ctx.body = {};
    } catch (error) {
      ctx.logger.error('记录热门推荐点击失败:', error);
      ctx.status = 500;
      ctx.body = { error: error.message };
    }
  }

  /**
   * 获取导航菜单
   * GET /api/nav-menus 和 GET /api/settings/nav-menus
   * 返回格式与前端 Navbar 组件期望的格式一致
   */
  async navMenus() {
    const { ctx } = this;

    try {
      const menus = await ctx.service.uied.navMenu.all();

      // 转换为前端期望的格式
      const transformMenu = menu => ({
        id: String(menu.id),
        text: menu.text,
        link: menu.link || null,
        external: menu.external || false,
        label: menu.label || null,
        labelType: menu.labelType || null,
        icon: menu.icon || null,
        parentId: menu.parentId ? String(menu.parentId) : null,
        order: menu.sort || 0,
        visible: menu.isShow !== false,
        children: (menu.children || []).map(transformMenu),
      });

      ctx.body = menus.map(transformMenu);
    } catch (error) {
      ctx.logger.error('获取导航菜单失败:', error);
      ctx.status = 500;
      ctx.body = { error: error.message };
    }
  }

  /**
   * 获取友情链接
   * GET /api/friend-links 和 GET /api/settings/friend-links
   * 返回格式与前端 useFriendLinks hook 期望的格式一致
   */
  async friendLinks() {
    const { ctx } = this;

    try {
      const result = await ctx.service.uied.friendLink.list({ page: 1, pageSize: 100 });

      // 转换为前端期望的格式，只返回可见的链接
      const links = result.lists
        .filter(link => link.isShow !== false)
        .map(link => ({
          id: String(link.id),
          name: link.name,
          url: link.url,
          order: link.sort || 0,
          visible: link.isShow !== false,
        }));

      ctx.body = links;
    } catch (error) {
      ctx.logger.error('获取友情链接失败:', error);
      ctx.status = 500;
      ctx.body = { error: error.message };
    }
  }

  /**
   * 获取页脚设置
   * GET /api/footer 和 GET /api/settings/footer-groups
   * 返回格式与前端 useFooterGroups hook 期望的格式一致
   */
  async footer() {
    const { ctx } = this;

    try {
      const groups = await ctx.service.uied.footer.groupAll();

      // 转换为前端期望的格式
      const result = groups.map(group => ({
        id: String(group.id),
        title: group.title,
        order: group.sort || 0,
        visible: group.isShow !== false,
        links: (group.links || []).map(link => ({
          id: String(link.id),
          text: link.text,
          url: link.url,
          external: link.external || false,
          order: link.sort || 0,
          visible: link.isShow !== false,
        })),
      }));

      ctx.body = result;
    } catch (error) {
      ctx.logger.error('获取页脚设置失败:', error);
      ctx.status = 500;
      ctx.body = { error: error.message };
    }
  }

  /**
   * 获取社交媒体
   * GET /api/social-media
   * 返回格式与前端 useSocialMedia hook 期望的格式一致
   */
  async socialMedia() {
    const { ctx } = this;

    try {
      const groups = await ctx.service.uied.socialMedia.groupAll();
      const result = [];

      for (const group of groups) {
        const items = await ctx.service.uied.socialMedia.itemList({ groupId: group.id });

        // 转换为前端期望的格式
        result.push({
          id: String(group.id),
          name: group.name,
          icon: group.icon,
          displayType: group.displayType,
          order: group.sort || 0,
          visible: group.isShow !== false,
          items: (items.lists || []).map(item => ({
            id: String(item.id),
            name: item.name,
            type: item.type,
            qrCodeUrl: item.qrCodeUrl || item.qrCode,
            link: item.link || item.url,
            description: item.description,
            extraInfo: item.extraInfo,
            order: item.sort || 0,
            visible: item.isShow !== false,
          })),
        });
      }

      ctx.body = result;
    } catch (error) {
      ctx.logger.error('获取社交媒体失败:', error);
      ctx.status = 500;
      ctx.body = { error: error.message };
    }
  }

  /**
   * 获取广告
   * GET /api/banners
   */
  async banners() {
    const { ctx } = this;
    const { position } = ctx.query;

    try {
      const result = await ctx.service.uied.banner.list({ page: 1, pageSize: 100, position });
      ctx.body = result.lists;
    } catch (error) {
      ctx.logger.error('获取广告失败:', error);
      ctx.status = 500;
      ctx.body = { error: error.message };
    }
  }

  /**
   * 获取激活广告（前端调用）
   * GET /api/banners/active
   */
  async bannersActive() {
    const { ctx } = this;
    const { pageSlug, position, limit } = ctx.query;

    try {
      const result = await ctx.service.uied.banner.active({ pageSlug, position, limit });
      ctx.body = result;
    } catch (error) {
      ctx.logger.error('获取激活广告失败:', error);
      ctx.status = 500;
      ctx.body = { error: error.message };
    }
  }

  /**
   * 记录广告点击
   * POST /api/banners/:id/click
   */
  async bannerClick() {
    const { ctx } = this;
    const { id } = ctx.params;

    try {
      await ctx.service.uied.banner.recordClick(id);
      ctx.body = {};
    } catch (error) {
      ctx.logger.error('记录广告点击失败:', error);
      ctx.status = 500;
      ctx.body = { error: error.message };
    }
  }

  /**
   * 获取站点信息
   * GET /api/site-info
   */
  async siteInfo() {
    const { ctx } = this;

    try {
      const info = await ctx.service.uied.setting.getSiteInfo();
      ctx.body = info;
    } catch (error) {
      ctx.logger.error('获取站点信息失败:', error);
      ctx.status = 500;
      ctx.body = { error: error.message };
    }
  }

  /**
   * 解析正整数参数
   */
  parsePositiveInt(value, defaultValue = 0) {
    const parsed = Number.parseInt(String(value ?? ''), 10);
    if (!Number.isInteger(parsed) || parsed <= 0) return defaultValue;
    return parsed;
  }

  /**
   * 将时间值转换为毫秒时间戳
   */
  toTimestampMs(value) {
    if (value === null || value === undefined || value === '') return null;
    if (typeof value === 'number') {
      if (value <= 0) return null;
      return value > 1e12 ? value : value * 1000;
    }
    const text = String(value).trim();
    if (!text) return null;
    const ts = Date.parse(text);
    if (Number.isNaN(ts)) return null;
    return ts;
  }

  /**
   * 由文章 ID 生成前端详情 slug
   */
  buildArticleSlug(articleId) {
    const id = this.parsePositiveInt(articleId, 0);
    return id > 0 ? String(id) : '';
  }

  /**
   * 由 slug 解析文章 ID（兼容纯数字或末尾带数字的 slug）
   */
  resolveArticleIdBySlug(slug) {
    const text = String(slug || '').trim();
    if (!text) return 0;
    if (/^\d+$/.test(text)) return this.parsePositiveInt(text, 0);
    const match = text.match(/(\d+)(?!.*\d)/);
    if (!match) return 0;
    return this.parsePositiveInt(match[1], 0);
  }

  /**
   * 读取公开标签的文章数量映射
   */
  async getPublicTagCountMap(tagIds = []) {
    const { ctx } = this;
    const ids = Array.isArray(tagIds)
      ? tagIds.map(id => this.parsePositiveInt(id, 0)).filter(Boolean)
      : [];
    if (!ids.length) return new Map();
    try {
      const rows = await ctx.model.query(
        `
        SELECT r.tag_id AS tagId, COUNT(DISTINCT r.article_id) AS total
        FROM la_article_tag_rel r
        INNER JOIN la_article a
          ON a.id = r.article_id
         AND a.is_delete = 0
         AND a.is_show = 1
        INNER JOIN la_article_tag t
          ON t.id = r.tag_id
         AND t.is_delete = 0
         AND t.is_show = 1
        WHERE r.is_delete = 0
          AND r.tag_id IN (?)
        GROUP BY r.tag_id
        `,
        {
          replacements: [ ids ],
          type: ctx.model.QueryTypes.SELECT,
        }
      );
      return new Map((Array.isArray(rows) ? rows : []).map(item => [
        this.parsePositiveInt(item.tagId, 0),
        this.parsePositiveInt(item.total, 0),
      ]));
    } catch (error) {
      ctx.logger.warn(`FrontendController.getPublicTagCountMap fallback empty: ${error.message || error}`);
      return new Map();
    }
  }

  /**
   * 格式化标签元数据（前端文章页）
   */
  formatArticleTagMeta(tagItem, tagCountMap = new Map()) {
    const id = this.parsePositiveInt(tagItem?.id, 0);
    const name = String(tagItem?.name || '').trim();
    const slug = String(tagItem?.slug || '').trim() || String(id || '');
    return {
      id,
      name,
      slug,
      color: '',
      articleCount: this.parsePositiveInt(tagCountMap.get(id), 0),
    };
  }

  /**
   * 格式化文章列表项（前端文章卡片）
   */
  formatArticleListItem(item, { categoryMap = new Map(), tagMetaByName = new Map() } = {}) {
    const id = this.parsePositiveInt(item?.id, 0);
    const categoryName = String(item?.category || '').trim()
      || String(categoryMap.get(this.parsePositiveInt(item?.cid, 0)) || '').trim()
      || '未分类';
    const rawTagNames = Array.isArray(item?.tags) ? item.tags : [];
    const tags = rawTagNames
      .map(tagName => {
        const name = String(tagName || '').trim();
        if (!name) return null;
        const tagMeta = tagMetaByName.get(name);
        return {
          id: this.parsePositiveInt(tagMeta?.id, 0),
          name,
          slug: String(tagMeta?.slug || name),
          color: '',
        };
      })
      .filter(Boolean);

    return {
      id,
      title: String(item?.title || ''),
      excerpt: String(item?.summary || item?.intro || ''),
      coverImage: String(item?.image || ''),
      author: String(item?.author || ''),
      category: categoryName,
      slug: this.buildArticleSlug(id),
      viewCount: this.parsePositiveInt(item?.visit, 0),
      publishedAt: this.toTimestampMs(item?.reviewTime || item?.createTime),
      createdAt: this.toTimestampMs(item?.createTime),
      updatedAt: this.toTimestampMs(item?.updateTime),
      tags,
    };
  }

  /**
   * 格式化文章详情（前端详情页）
   */
  formatArticleDetailItem(item, { categoryMap = new Map(), tagMetaById = new Map() } = {}) {
    const id = this.parsePositiveInt(item?.id, 0);
    const categoryName = String(categoryMap.get(this.parsePositiveInt(item?.cid, 0)) || '').trim() || '未分类';
    const rawTags = Array.isArray(item?.tags) ? item.tags : [];
    const tags = rawTags.map(tag => {
      const tagId = this.parsePositiveInt(tag?.id, 0);
      const meta = tagMetaById.get(tagId);
      return {
        id: tagId,
        name: String(tag?.name || meta?.name || ''),
        slug: String(meta?.slug || tagId || ''),
        color: '',
      };
    }).filter(tag => tag.id > 0 && tag.name);

    const excerpt = String(item?.summary || item?.intro || '').trim();
    return {
      id,
      title: String(item?.title || ''),
      content: String(item?.content || ''),
      excerpt,
      coverImage: String(item?.image || ''),
      author: String(item?.author || ''),
      category: categoryName,
      slug: this.buildArticleSlug(id),
      status: Number(item?.isShow || 0) === 1 ? 'published' : 'draft',
      viewCount: this.parsePositiveInt(item?.visit, 0),
      seoTitle: String(item?.title || ''),
      seoDescription: excerpt,
      publishedAt: this.toTimestampMs(item?.reviewTime),
      createdAt: this.toTimestampMs(item?.createTime),
      updatedAt: this.toTimestampMs(item?.updateTime),
      tags,
    };
  }

  /**
   * 获取文章列表（前端）
   * GET /api/articles
   */
  async articles() {
    const { ctx } = this;
    const {
      page,
      pageNo,
      pageSize,
      limit,
      category,
      categoryId,
      cid,
      categorySlug,
      cateSlug,
      tag,
      tagId,
      tag_id,
      tagSlug
    } = ctx.query;

    try {
      const currentPage = this.parsePositiveInt(page || pageNo, 1);
      const currentPageSize = this.parsePositiveInt(pageSize || limit, 10);
      const categoryText = String(category || '').trim();
      const categorySlugText = String(categorySlug || cateSlug || '').trim();
      const categoryIdValue = this.parsePositiveInt(categoryId || cid, 0);
      const tagText = String(tag || '').trim();
      const tagSlugText = String(tagSlug || '').trim();
      const tagIdValue = this.parsePositiveInt(tagId || tag_id, 0);

      const [ categories, tags ] = await Promise.all([
        ctx.service.uied.articleCategory.all(),
        ctx.service.uied.articleTag.all(),
      ]);

      const categoryMap = new Map((Array.isArray(categories) ? categories : []).map(item => [
        this.parsePositiveInt(item.id, 0),
        String(item.name || ''),
      ]));
      const categoryByName = new Map((Array.isArray(categories) ? categories : []).map(item => [
        String(item.name || ''),
        this.parsePositiveInt(item.id, 0),
      ]));
      const categoryBySlug = new Map((Array.isArray(categories) ? categories : []).map(item => [
        String(item.slug || ''),
        this.parsePositiveInt(item.id, 0),
      ]));

      const tagCountMap = await this.getPublicTagCountMap((Array.isArray(tags) ? tags : []).map(item => item.id));
      const tagMetaList = (Array.isArray(tags) ? tags : []).map(item => this.formatArticleTagMeta(item, tagCountMap));
      const tagMetaByName = new Map(tagMetaList.map(item => [ item.name, item ]));
      const tagMetaBySlug = new Map(tagMetaList.map(item => [ item.slug, item ]));
      const tagMetaById = new Map(tagMetaList.map(item => [ this.parsePositiveInt(item.id, 0), item ]));

      let resolvedCategoryId = 0;
      if (categoryIdValue > 0) {
        resolvedCategoryId = categoryIdValue;
      } else if (categorySlugText) {
        resolvedCategoryId = categoryBySlug.get(categorySlugText) || 0;
      } else if (categoryText) {
        resolvedCategoryId = categoryByName.get(categoryText) || 0;
      }
      if ((categoryIdValue > 0 || categorySlugText || categoryText) && !resolvedCategoryId) {
        ctx.body = { lists: [], total: 0, page: currentPage, pageSize: currentPageSize, totalPages: 0 };
        return;
      }

      let resolvedTagMeta = null;
      if (tagIdValue > 0) {
        resolvedTagMeta = tagMetaById.get(tagIdValue) || null;
      } else if (tagSlugText) {
        resolvedTagMeta = tagMetaBySlug.get(tagSlugText) || null;
      } else if (tagText) {
        // 兼容老前端传“标签名称”而不是 slug 的场景
        resolvedTagMeta = tagMetaBySlug.get(tagText) || tagMetaByName.get(tagText) || null;
      }
      if ((tagIdValue > 0 || tagSlugText || tagText) && !resolvedTagMeta) {
        ctx.body = { lists: [], total: 0, page: currentPage, pageSize: currentPageSize, totalPages: 0 };
        return;
      }

      const result = await ctx.service.uied.article.list({
        page: currentPage,
        pageSize: currentPageSize,
        categoryId: resolvedCategoryId || undefined,
        tagId: resolvedTagMeta ? resolvedTagMeta.id : undefined,
        status: 'published'
      });

      const lists = (Array.isArray(result?.lists) ? result.lists : []).map(item => this.formatArticleListItem(item, {
        categoryMap,
        tagMetaByName,
      }));
      const total = this.parsePositiveInt(result?.count, lists.length);
      ctx.body = {
        lists,
        total,
        page: currentPage,
        pageSize: currentPageSize,
        totalPages: total > 0 ? Math.ceil(total / currentPageSize) : 0,
      };
    } catch (error) {
      ctx.logger.error('获取文章列表失败:', error);
      ctx.status = 500;
      ctx.body = { error: error.message };
    }
  }

  /**
   * 获取文章分类（前端）
   * GET /api/articles/categories
   */
  async articleCategories() {
    const { ctx } = this;

    try {
      const categories = await ctx.service.uied.articleCategory.all();
      const names = Array.from(new Set(
        (Array.isArray(categories) ? categories : [])
          .map(item => String(item?.name || '').trim())
          .filter(Boolean)
      ));
      ctx.body = names;
    } catch (error) {
      ctx.logger.error('获取文章分类失败:', error);
      ctx.status = 500;
      ctx.body = { error: error.message };
    }
  }

  /**
   * 获取文章详情（前端）
   * GET /api/articles/:slug
   */
  async articleDetail() {
    const { ctx } = this;
    const { slug } = ctx.params;

    try {
      const articleId = this.resolveArticleIdBySlug(slug);
      if (!articleId) {
        ctx.status = 404;
        ctx.body = { error: '文章不存在' };
        return;
      }
      let article = null;
      try {
        article = await ctx.service.uied.article.detail(articleId);
      } catch (error) {
        if (String(error?.message || '').includes('文章不存在')) {
          article = null;
        } else {
          throw error;
        }
      }
      if (!article) {
        ctx.status = 404;
        ctx.body = { error: '文章不存在' };
        return;
      }
      const [ categories, tags ] = await Promise.all([
        ctx.service.uied.articleCategory.all(),
        ctx.service.uied.articleTag.all(),
      ]);
      const categoryMap = new Map((Array.isArray(categories) ? categories : []).map(item => [
        this.parsePositiveInt(item.id, 0),
        String(item.name || ''),
      ]));
      const tagCountMap = await this.getPublicTagCountMap((Array.isArray(tags) ? tags : []).map(item => item.id));
      const tagMetaList = (Array.isArray(tags) ? tags : []).map(item => this.formatArticleTagMeta(item, tagCountMap));
      const tagMetaById = new Map(tagMetaList.map(item => [ item.id, item ]));
      ctx.body = this.formatArticleDetailItem(article, { categoryMap, tagMetaById });
    } catch (error) {
      ctx.logger.error('获取文章详情失败:', error);
      ctx.status = 500;
      ctx.body = { error: error.message };
    }
  }

  /**
   * 记录文章浏览
   * POST /api/articles/:id/view
   */
  async articleView() {
    const { ctx } = this;
    const { id } = ctx.params;

    try {
      const articleId = this.parsePositiveInt(id, 0);
      if (!articleId) {
        ctx.status = 400;
        ctx.body = { error: '文章ID无效' };
        return;
      }
      const result = await ctx.service.uied.article.visitIncr(articleId);
      ctx.body = {
        id: this.parsePositiveInt(result?.id, articleId),
        viewCount: this.parsePositiveInt(result?.visit, 0),
      };
    } catch (error) {
      const message = String(error?.message || '');
      if (message.includes('文章不存在')) {
        ctx.status = 404;
        ctx.body = { error: message };
      } else {
        ctx.logger.error('记录文章浏览失败:', error);
        ctx.status = 500;
        ctx.body = { error: message };
      }
    }
  }

  /**
   * 获取文章标签（前端）
   * GET /api/articles/meta/tags
   */
  async articleTags() {
    const { ctx } = this;

    try {
      const tags = await ctx.service.uied.articleTag.all();
      const tagCountMap = await this.getPublicTagCountMap((Array.isArray(tags) ? tags : []).map(item => item.id));
      ctx.body = (Array.isArray(tags) ? tags : []).map(item => this.formatArticleTagMeta(item, tagCountMap));
    } catch (error) {
      ctx.logger.error('获取文章标签失败:', error);
      ctx.status = 500;
      ctx.body = { error: error.message };
    }
  }

  /**
   * 获取文章评论（前端）
   * GET /api/articles/:id/comments
   */
  async articleComments() {
    const { ctx } = this;
    const { id } = ctx.params;
    const { page = 1, pageSize = 10 } = ctx.query;

    try {
      const articleId = this.parsePositiveInt(id, 0);
      if (!articleId) {
        ctx.status = 400;
        ctx.body = { error: '文章ID无效' };
        return;
      }
      const pageNo = this.parsePositiveInt(page, 1);
      const limit = this.parsePositiveInt(pageSize, 10);
      const result = await ctx.service.uied.comment.list({
        articleId,
        page: pageNo,
        pageSize: limit,
        type: 'article',
        status: 'approved'
      });
      const total = this.parsePositiveInt(result?.count, 0);
      ctx.body = {
        lists: Array.isArray(result?.lists) ? result.lists : [],
        total,
        page: pageNo,
        pageSize: limit,
        totalPages: total > 0 ? Math.ceil(total / limit) : 0,
      };
    } catch (error) {
      const message = String(error?.message || '');
      if (message.includes('文章不存在')) {
        ctx.status = 404;
        ctx.body = { error: message };
      } else {
        ctx.logger.error('获取文章评论失败:', error);
        ctx.status = 500;
        ctx.body = { error: message };
      }
    }
  }

  /**
   * 提交文章评论（前端）
   * POST /api/articles/:id/comments
   */
  async addArticleComment() {
    const { ctx } = this;
    const { id } = ctx.params;
    const { text, userId, userName } = ctx.request.body;

    try {
      const articleId = this.parsePositiveInt(id, 0);
      if (!articleId) {
        ctx.status = 400;
        ctx.body = { error: '文章ID无效' };
        return;
      }
      // 验证评论内容
      if (!text || text.trim().length === 0) {
        ctx.status = 400;
        ctx.body = { error: '评论内容不能为空' };
        return;
      }

      if (text.length > 1000) {
        ctx.status = 400;
        ctx.body = { error: '评论内容不能超过1000字符' };
        return;
      }

      const comment = await ctx.service.uied.comment.add({
        articleId,
        parentId: this.parsePositiveInt(ctx.request.body?.parentId, 0),
        content: text.trim(),
        userId,
        userName,
      });

      ctx.body = comment;
    } catch (error) {
      const message = String(error?.message || '');
      if (message.includes('未登录') || message.includes('登录已失效')) {
        ctx.status = 401;
      } else if (message.includes('文章不存在')) {
        ctx.status = 404;
      } else if (message.includes('不能为空') || message.includes('过于频繁') || message.includes('禁言')) {
        ctx.status = 400;
      } else {
        ctx.status = 500;
      }
      ctx.logger.error('提交文章评论失败:', error);
      ctx.body = { message, error: message };
    }
  }
  /**
   * 获取分类列表（前端公开，树形结构含网站数量）
   * GET /api/categories
   */
  async categories() {
    const { ctx } = this;

    try {
      // 获取所有可见的主分类（parent_id IS NULL）及其子分类和网站数量
      const categories = await ctx.app.model.query(
        `SELECT c.id, c.name, c.slug, c.icon, c.color, c.description,
                c.seo_title as seoTitle, c.seo_description as seoDescription, c.seo_keywords as seoKeywords,
                c.parent_id as parentId,
                (SELECT COUNT(*) FROM uied_website w WHERE w.category_id = c.id AND w.is_delete = 0) as websiteCount
         FROM uied_category c
         WHERE c.is_delete = 0 AND c.is_show = 1
         ORDER BY c.sort ASC, c.id ASC`,
        { type: ctx.app.Sequelize.QueryTypes.SELECT }
      );

      // 构建树形结构
      const rootCategories = categories.filter(c => !c.parentId);
      const childMap = {};
      for (const cat of categories) {
        if (cat.parentId) {
          if (!childMap[cat.parentId]) childMap[cat.parentId] = [];
          childMap[cat.parentId].push(cat);
        }
      }

      const tree = rootCategories.map(cat => {
        const children = childMap[cat.id] || [];
        const totalWebsites = children.reduce((sum, c) => sum + (c.websiteCount || 0), 0) + (cat.websiteCount || 0);
        return {
          id: String(cat.id),
          name: cat.name,
          slug: cat.slug,
          icon: cat.icon,
          color: cat.color,
          description: cat.description,
          seoTitle: cat.seoTitle,
          seoDescription: cat.seoDescription,
          seoKeywords: cat.seoKeywords,
          websiteCount: totalWebsites,
          children: children.map(child => ({
            id: String(child.id),
            name: child.name,
            slug: child.slug,
            icon: child.icon,
            color: child.color,
            description: child.description,
            seoTitle: child.seoTitle,
            seoDescription: child.seoDescription,
            seoKeywords: child.seoKeywords,
            websiteCount: child.websiteCount || 0,
          })),
        };
      });

      ctx.body = tree;
    } catch (error) {
      ctx.logger.error('获取分类列表失败:', error);
      ctx.status = 500;
      ctx.body = { error: error.message };
    }
  }

  /**
   * 获取分类详情及其网站
   * GET /api/categories/:idOrSlug
   */
  async categoryDetail() {
    const { ctx } = this;
    const { idOrSlug } = ctx.params;
    const { page = 1, pageSize = 24 } = ctx.query;
    const offset = (parseInt(page) - 1) * parseInt(pageSize);

    try {
      // 按 ID 或 slug 查找分类
      let category;
      if (/^\d+$/.test(String(idOrSlug))) {
        [ category ] = await ctx.app.model.query(
          `SELECT id, name, slug, icon, color, description,
                  seo_title as seoTitle, seo_description as seoDescription, seo_keywords as seoKeywords,
                  parent_id as parentId
           FROM uied_category WHERE id = ? AND is_delete = 0`,
          { replacements: [ idOrSlug ], type: ctx.app.Sequelize.QueryTypes.SELECT }
        );
      }
      if (!category) {
        [ category ] = await ctx.app.model.query(
          `SELECT id, name, slug, icon, color, description,
                  seo_title as seoTitle, seo_description as seoDescription, seo_keywords as seoKeywords,
                  parent_id as parentId
           FROM uied_category WHERE slug = ? AND is_delete = 0`,
          { replacements: [ idOrSlug ], type: ctx.app.Sequelize.QueryTypes.SELECT }
        );
      }

      if (!category) {
        ctx.status = 404;
        ctx.body = { error: '分类不存在' };
        return;
      }

      // 收集该分类及其子分类的所有ID
      const subCategories = await ctx.app.model.query(
        `SELECT id, name, slug FROM uied_category
         WHERE parent_id = ? AND is_delete = 0 AND is_show = 1
         ORDER BY sort ASC`,
        { replacements: [ category.id ], type: ctx.app.Sequelize.QueryTypes.SELECT }
      );

      const allCategoryIds = [ category.id, ...subCategories.map(s => s.id) ];
      const placeholders = allCategoryIds.map(() => '?').join(',');

      // 获取网站总数
      const [ countResult ] = await ctx.app.model.query(
        `SELECT COUNT(*) as total FROM uied_website
         WHERE category_id IN (${placeholders}) AND is_delete = 0`,
        { replacements: allCategoryIds, type: ctx.app.Sequelize.QueryTypes.SELECT }
      );

      // 获取分页网站
      const websites = await ctx.app.model.query(
        `SELECT id, name, slug, description, url, icon_url as iconUrl,
                is_hot as isHot, is_featured as isFeatured, is_new as isNew, tags
         FROM uied_website
         WHERE category_id IN (${placeholders}) AND is_delete = 0
         ORDER BY is_pinned DESC, is_hot DESC, is_featured DESC, sort ASC
         LIMIT ? OFFSET ?`,
        { replacements: [ ...allCategoryIds, parseInt(pageSize), offset ], type: ctx.app.Sequelize.QueryTypes.SELECT }
      );

      // 获取父分类信息
      let parentCategory = null;
      if (category.parentId) {
        [ parentCategory ] = await ctx.app.model.query(
          'SELECT id, name, slug FROM uied_category WHERE id = ? AND is_delete = 0',
          { replacements: [ category.parentId ], type: ctx.app.Sequelize.QueryTypes.SELECT }
        );
      }

      ctx.body = {
        category: {
          id: String(category.id),
          name: category.name,
          slug: category.slug,
          icon: category.icon,
          color: category.color,
          description: category.description,
          seoTitle: category.seoTitle,
          seoDescription: category.seoDescription,
          seoKeywords: category.seoKeywords,
          parent: parentCategory ? { id: String(parentCategory.id), name: parentCategory.name, slug: parentCategory.slug } : null,
          subCategories: subCategories.map(s => ({ id: String(s.id), name: s.name, slug: s.slug })),
        },
        websites: websites.map(w => ({
          id: String(w.id),
          name: w.name,
          slug: w.slug,
          description: w.description || '',
          url: w.url,
          iconUrl: w.iconUrl,
          isHot: w.isHot === 1,
          isFeatured: w.isFeatured === 1,
          isNew: w.isNew === 1,
          tags: this.safeJsonParse(w.tags, []),
        })),
        total: countResult.total,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
      };
    } catch (error) {
      ctx.logger.error('获取分类详情失败:', error);
      ctx.status = 500;
      ctx.body = { error: error.message };
    }
  }

  /**
   * 获取标签列表（前端公开，含网站数量）
   * GET /api/tags
   */
  async tags() {
    const { ctx } = this;

    try {
      const tags = await ctx.app.model.query(
        `SELECT t.id, t.name, t.slug, t.color, t.description,
                t.seo_title as seoTitle, t.seo_description as seoDescription, t.seo_keywords as seoKeywords,
                (SELECT COUNT(*) FROM uied_website_tag_relation r WHERE r.tag_id = t.id) as websiteCount
         FROM uied_website_tag t
         WHERE t.is_delete = 0
         ORDER BY t.sort ASC, t.name ASC`,
        { type: ctx.app.Sequelize.QueryTypes.SELECT }
      );

      ctx.body = tags.map(t => ({
        id: String(t.id),
        name: t.name,
        slug: t.slug,
        color: t.color,
        description: t.description,
        seoTitle: t.seoTitle,
        seoDescription: t.seoDescription,
        seoKeywords: t.seoKeywords,
        websiteCount: t.websiteCount || 0,
      }));
    } catch (error) {
      ctx.logger.error('获取标签列表失败:', error);
      ctx.status = 500;
      ctx.body = { error: error.message };
    }
  }

  /**
   * 获取标签详情及其网站
   * GET /api/tags/:idOrSlug
   */
  async tagDetail() {
    const { ctx } = this;
    const { idOrSlug } = ctx.params;
    const { page = 1, pageSize = 24 } = ctx.query;
    const offset = (parseInt(page) - 1) * parseInt(pageSize);

    try {
      // 按 ID 或 slug 查找标签
      let tag;
      if (/^\d+$/.test(String(idOrSlug))) {
        [ tag ] = await ctx.app.model.query(
          `SELECT id, name, slug, color, description,
                  seo_title as seoTitle, seo_description as seoDescription, seo_keywords as seoKeywords
           FROM uied_website_tag WHERE id = ? AND is_delete = 0`,
          { replacements: [ idOrSlug ], type: ctx.app.Sequelize.QueryTypes.SELECT }
        );
      }
      if (!tag) {
        [ tag ] = await ctx.app.model.query(
          `SELECT id, name, slug, color, description,
                  seo_title as seoTitle, seo_description as seoDescription, seo_keywords as seoKeywords
           FROM uied_website_tag WHERE slug = ? AND is_delete = 0`,
          { replacements: [ idOrSlug ], type: ctx.app.Sequelize.QueryTypes.SELECT }
        );
      }

      if (!tag) {
        ctx.status = 404;
        ctx.body = { error: '标签不存在' };
        return;
      }

      // 获取网站总数
      const [ countResult ] = await ctx.app.model.query(
        `SELECT COUNT(*) as total FROM uied_website_tag_relation r
         INNER JOIN uied_website w ON r.website_id = w.id
         WHERE r.tag_id = ? AND w.is_delete = 0`,
        { replacements: [ tag.id ], type: ctx.app.Sequelize.QueryTypes.SELECT }
      );

      // 获取分页网站
      const websites = await ctx.app.model.query(
        `SELECT w.id, w.name, w.slug, w.description, w.url, w.icon_url as iconUrl,
                w.is_hot as isHot, w.is_featured as isFeatured, w.is_new as isNew, w.tags
         FROM uied_website w
         INNER JOIN uied_website_tag_relation r ON w.id = r.website_id
         WHERE r.tag_id = ? AND w.is_delete = 0
         ORDER BY w.is_pinned DESC, w.is_hot DESC, w.sort ASC
         LIMIT ? OFFSET ?`,
        { replacements: [ tag.id, parseInt(pageSize), offset ], type: ctx.app.Sequelize.QueryTypes.SELECT }
      );

      ctx.body = {
        tag: {
          id: String(tag.id),
          name: tag.name,
          slug: tag.slug,
          color: tag.color,
          description: tag.description,
          seoTitle: tag.seoTitle,
          seoDescription: tag.seoDescription,
          seoKeywords: tag.seoKeywords,
        },
        websites: websites.map(w => ({
          id: String(w.id),
          name: w.name,
          slug: w.slug,
          description: w.description || '',
          url: w.url,
          iconUrl: w.iconUrl,
          isHot: w.isHot === 1,
          isFeatured: w.isFeatured === 1,
          isNew: w.isNew === 1,
          tags: this.safeJsonParse(w.tags, []),
        })),
        total: countResult.total,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
      };
    } catch (error) {
      ctx.logger.error('获取标签详情失败:', error);
      ctx.status = 500;
      ctx.body = { error: error.message };
    }
  }

  /**
   * 安全解析 JSON
   */
  safeJsonParse(str, defaultValue = []) {
    if (!str) return defaultValue;
    try {
      return JSON.parse(str);
    } catch (error) {
      if (typeof str === 'string') {
        return str.split(',').map(s => s.trim()).filter(Boolean);
      }
      return defaultValue;
    }
  }
}

module.exports = FrontendController;
