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
   * 设置禁止缓存响应头，确保后台配置改动能被前端及时读取。
   */
  setNoCacheHeaders() {
    const { ctx } = this;
    ctx.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    ctx.set('Pragma', 'no-cache');
    ctx.set('Expires', '0');
    ctx.set('Surrogate-Control', 'no-store');
  }

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
   * 获取页面统计（兼容旧前端）
   * GET /api/pages/:slug/stats
   */
  async pageStats() {
    const { ctx } = this;
    const { slug } = ctx.params;

    try {
      const data = await ctx.service.uied.frontend.getPageFullData(slug);
      if (!data) {
        ctx.status = 404;
        ctx.body = { error: '页面不存在' };
        return;
      }
      const totalWebsites = Number(data?.stats?.totalWebsites || 0);
      const totalCategories = Number(data?.stats?.totalCategories || 0);
      ctx.body = { totalWebsites, totalCategories };
    } catch (error) {
      ctx.logger.error('获取页面统计失败:', error);
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
   * 获取精选网站列表（兼容旧前端）
   * GET /api/websites/featured/list
   */
  async featuredWebsites() {
    const { ctx } = this;
    const limit = this.parsePositiveInt(ctx.query?.limit, 24);

    try {
      const websites = await ctx.service.uied.frontend.getHotWebsites(limit);
      ctx.body = (Array.isArray(websites) ? websites : []).filter(item => item?.isFeatured === true);
    } catch (error) {
      ctx.logger.error('获取精选网站失败:', error);
      ctx.status = 500;
      ctx.body = { error: error.message };
    }
  }

  /**
   * 获取热门网站列表（兼容旧前端）
   * GET /api/websites/hot/list
   */
  async hotWebsites() {
    const { ctx } = this;
    const limit = this.parsePositiveInt(ctx.query?.limit, 24);

    try {
      const websites = await ctx.service.uied.frontend.getHotWebsites(limit);
      ctx.body = (Array.isArray(websites) ? websites : []).filter(item => item?.isHot === true);
    } catch (error) {
      ctx.logger.error('获取热门网站失败:', error);
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
    const { limit = 6, mode, manualIds } = ctx.query;

    try {
      /**
       * 相关推荐支持多种推荐模式，供详情页侧边栏高级配置使用
       */
      const websites = await ctx.service.uied.frontend.getRelatedWebsites(id, {
        limit: parseInt(limit),
        mode: String(mode || '').trim(),
        manualIds: String(manualIds || '').trim(),
      });
      ctx.body = websites;
    } catch (error) {
      ctx.logger.error('获取相关推荐失败:', error);
      ctx.status = 500;
      ctx.body = { error: error.message };
    }
  }

  /**
   * 网站对比 AI 分析（前台公开接口）
   * POST /api/compare/websites/ai-analysis
   */
  async websiteCompareAiAnalysis() {
    const { ctx } = this;
    const body = ctx.request.body || {};
    const leftIdOrSlug = String(body.leftIdOrSlug || body.left || ctx.query?.leftIdOrSlug || ctx.query?.left || '').trim();
    const rightIdOrSlug = String(body.rightIdOrSlug || body.right || ctx.query?.rightIdOrSlug || ctx.query?.right || '').trim();

    if (!leftIdOrSlug || !rightIdOrSlug) {
      ctx.status = 400;
      ctx.body = { error: '请提供左右对比网站参数' };
      return;
    }

    try {
      const result = await ctx.service.uied.frontend.getWebsiteCompareAiAnalysis(leftIdOrSlug, rightIdOrSlug);
      ctx.body = result;
    } catch (error) {
      ctx.logger.error('生成网站对比 AI 分析失败:', error);
      ctx.status = Number(error?.status || 500);
      ctx.body = { error: error.message || '生成网站对比 AI 分析失败' };
    }
  }

  /**
   * 网站健康探测（本地探测站点响应时间/状态码/SSL）
   * GET /api/websites/:id/health
   */
  async websiteHealth() {
    const { ctx } = this;
    const { id } = ctx.params;

    try {
      const websiteId = this.parsePositiveInt(id, 0);
      if (!websiteId) {
        ctx.status = 400;
        ctx.body = { error: '无效的网站ID' };
        return;
      }
      const timeoutMs = this.parsePositiveInt(ctx.query?.timeout, 6000);
      const forceRefresh = this.parseBoolean(ctx.query?.refresh, false);
      const result = await ctx.service.uied.websiteHealthProbe.probeByWebsiteId(websiteId, {
        timeoutMs,
        forceRefresh,
      });
      ctx.body = result;
    } catch (error) {
      ctx.logger.error('网站健康探测失败:', error);
      ctx.status = Number(error?.status || 500);
      ctx.body = { error: error.message || '健康探测失败' };
    }
  }

  /**
   * 获取网站预览截图（优先本地上传/截图，其次 Playwright 缓存，最后 mShots 兜底）
   * GET /api/websites/:id/preview-snapshot
   */
  async websitePreviewSnapshot() {
    const { ctx } = this;
    const { id } = ctx.params;

    try {
      const websiteId = this.parsePositiveInt(id, 0);
      if (!websiteId) {
        ctx.status = 400;
        ctx.body = { error: '无效的网站ID' };
        return;
      }

      const timeoutMs = this.parsePositiveInt(ctx.query?.timeout, 12000);
      const forceRefresh = this.parseBoolean(ctx.query?.refresh, false);
      const result = await ctx.service.uied.websitePreviewSnapshot.getPreviewSnapshotByWebsiteId(websiteId, {
        timeoutMs,
        forceRefresh,
      });
      ctx.body = result;
    } catch (error) {
      ctx.logger.error('获取网站预览截图失败:', error);
      ctx.status = Number(error?.status || 500);
      ctx.body = { error: error.message || '获取网站预览截图失败' };
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
   * 获取网站评论（前端）
   * GET /api/websites/:id/comments
   */
  async websiteComments() {
    const { ctx } = this;
    const { id } = ctx.params;
    const { page = 1, pageSize = 10 } = ctx.query;

    try {
      const websiteId = this.parsePositiveInt(id, 0);
      if (!websiteId) {
        ctx.status = 400;
        ctx.body = { error: '网站ID无效' };
        return;
      }
      const pageNo = this.parsePositiveInt(page, 1);
      const limit = this.parsePositiveInt(pageSize, 10);
      /**
       * 评论功能被后台关闭时，评论列表返回空数据，避免前端出现历史评论残留。
       */
      if (!(await this.isWebsiteCommentsEnabled())) {
        ctx.body = {
          lists: [],
          total: 0,
          page: pageNo,
          pageSize: limit,
          totalPages: 0,
        };
        return;
      }
      const result = await ctx.service.uied.comment.list({
        websiteId,
        page: pageNo,
        pageSize: limit,
        type: 'website',
        status: 'approved',
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
      ctx.logger.error('获取网站评论失败:', error);
      ctx.status = 500;
      ctx.body = { error: error.message || '获取评论失败' };
    }
  }

  /**
   * 提交网站评论（前端）
   * POST /api/websites/:id/comments
   */
  async addWebsiteComment() {
    const { ctx } = this;
    const { id } = ctx.params;
    const { text, userId, userName } = ctx.request.body;

    try {
      const websiteId = this.parsePositiveInt(id, 0);
      if (!websiteId) {
        ctx.status = 400;
        ctx.body = { error: '网站ID无效' };
        return;
      }
      const content = String(text || '').trim();
      if (!content) {
        ctx.status = 400;
        ctx.body = { error: '评论内容不能为空' };
        return;
      }
      if (content.length > 1000) {
        ctx.status = 400;
        ctx.body = { error: '评论内容不能超过1000字符' };
        return;
      }
      /**
       * 评论功能被后台关闭时，直接拒绝提交。
       */
      if (!(await this.isWebsiteCommentsEnabled())) {
        ctx.status = 403;
        ctx.body = { error: '网站评论功能已关闭' };
        return;
      }

      const comment = await ctx.service.uied.comment.add({
        websiteId,
        parentId: this.parsePositiveInt(ctx.request.body?.parentId, 0),
        content,
        userId,
        userName,
      });
      ctx.body = comment;
    } catch (error) {
      ctx.logger.error('提交网站评论失败:', error);
      ctx.status = 500;
      ctx.body = { error: error.message || '提交评论失败' };
    }
  }

  /**
   * 网站评分（兼容旧前端）
   * POST /api/websites/:id/rate
   */
  async websiteRate() {
    const { ctx } = this;
    const { id } = ctx.params;
    const rating = Number(ctx.request.body?.rating || 0);

    const websiteId = this.parsePositiveInt(id, 0);
    if (!websiteId) {
      ctx.status = 400;
      ctx.body = { error: '网站ID无效' };
      return;
    }
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      ctx.status = 400;
      ctx.body = { error: '评分范围应为 1-5' };
      return;
    }

    try {
      const result = await ctx.service.uied.websiteInteraction.rateWebsite(websiteId, rating);
      ctx.body = {
        userRating: result.userRating,
        averageRating: result.averageRating,
        totalRatings: result.totalRatings,
        message: '评分成功',
      };
    } catch (error) {
      ctx.logger.error('网站评分失败:', error);
      ctx.status = 500;
      ctx.body = { error: error.message || '评分失败' };
    }
  }

  /**
   * 添加网站收藏（兼容旧前端）
   * POST /api/websites/:id/favorite
   */
  async websiteFavoriteAdd() {
    const { ctx } = this;
    const { id } = ctx.params;
    const websiteId = this.parsePositiveInt(id, 0);
    if (!websiteId) {
      ctx.status = 400;
      ctx.body = { error: '网站ID无效' };
      return;
    }
    try {
      const result = await ctx.service.uied.websiteInteraction.addFavorite(websiteId);
      ctx.body = {
        favorited: true,
        totalFavorites: result.totalFavorites,
        message: '收藏成功',
      };
    } catch (error) {
      ctx.logger.error('添加收藏失败:', error);
      ctx.status = 500;
      ctx.body = { error: error.message || '收藏失败' };
    }
  }

  /**
   * 取消网站收藏（兼容旧前端）
   * DELETE /api/websites/:id/favorite
   */
  async websiteFavoriteDel() {
    const { ctx } = this;
    const { id } = ctx.params;
    const websiteId = this.parsePositiveInt(id, 0);
    if (!websiteId) {
      ctx.status = 400;
      ctx.body = { error: '网站ID无效' };
      return;
    }
    try {
      const result = await ctx.service.uied.websiteInteraction.removeFavorite(websiteId);
      ctx.body = {
        favorited: false,
        totalFavorites: result.totalFavorites,
        message: '已取消收藏',
      };
    } catch (error) {
      ctx.logger.error('取消收藏失败:', error);
      ctx.status = 500;
      ctx.body = { error: error.message || '取消收藏失败' };
    }
  }

  /**
   * 添加网站点赞（匿名/登录均可）
   * POST /api/websites/:id/like
   */
  async websiteLikeAdd() {
    const { ctx } = this;
    const { id } = ctx.params;
    const websiteId = this.parsePositiveInt(id, 0);
    if (!websiteId) {
      ctx.status = 400;
      ctx.body = { error: '网站ID无效' };
      return;
    }
    try {
      const result = await ctx.service.uied.websiteInteraction.addLike(websiteId);
      ctx.body = {
        isLiked: true,
        likeCount: Number(result.likeCount || 0),
        message: '点赞成功',
      };
    } catch (error) {
      ctx.logger.error('网站点赞失败:', error);
      ctx.status = 500;
      ctx.body = { error: error.message || '点赞失败' };
    }
  }

  /**
   * 取消网站点赞（匿名/登录均可）
   * DELETE /api/websites/:id/like
   */
  async websiteLikeDel() {
    const { ctx } = this;
    const { id } = ctx.params;
    const websiteId = this.parsePositiveInt(id, 0);
    if (!websiteId) {
      ctx.status = 400;
      ctx.body = { error: '网站ID无效' };
      return;
    }
    try {
      const result = await ctx.service.uied.websiteInteraction.removeLike(websiteId);
      ctx.body = {
        isLiked: false,
        likeCount: Number(result.likeCount || 0),
        message: '已取消点赞',
      };
    } catch (error) {
      ctx.logger.error('取消网站点赞失败:', error);
      ctx.status = 500;
      ctx.body = { error: error.message || '取消点赞失败' };
    }
  }

  /**
   * 抓取站点图标（兼容旧前端）
   * GET /api/favicon-api/fetch
   */
  async faviconFetch() {
    const { ctx } = this;
    const url = String(ctx.query?.url || ctx.request.body?.url || '').trim();

    if (!url) {
      ctx.status = 400;
      ctx.body = { error: '请提供URL' };
      return;
    }

    try {
      const seoData = await ctx.service.uied.seoScraper.fetch(url);
      ctx.body = {
        faviconUrl: String(seoData?.favicon || ''),
        favicon: String(seoData?.favicon || ''),
        title: String(seoData?.title || ''),
        description: String(seoData?.description || ''),
        keywords: String(seoData?.keywords || ''),
        ogImage: String(seoData?.ogImage || ''),
      };
    } catch (error) {
      ctx.logger.error('抓取站点图标失败:', error);
      ctx.status = 500;
      ctx.body = { error: error.message || '抓取失败' };
    }
  }

  /**
   * AI 智能搜索（兼容旧前端）
   * POST /api/ai-search
   * POST /api/ai-config/smart-search
   */
  async aiSearch() {
    const { ctx } = this;
    const body = ctx.request.body || {};
    const query = String(body.query || '').trim();
    const limit = Math.min(this.parsePositiveInt(body.limit, 10), 100);
    const categoryId = this.parsePositiveInt(body.categoryId, 0);
    const rawSearchConfig = await ctx.service.uied.setting.get('searchConfig');
    const searchConfig = ctx.service.uied.setting.normalizeSearchConfig(rawSearchConfig || {});

    if (searchConfig.enabled === false) {
      ctx.status = 403;
      ctx.body = {
        results: [],
        mode: 'keyword',
        reason: '站内搜索已关闭',
        message: '站内搜索功能已关闭',
        reasoning: '后台已关闭站内搜索，请联系管理员开启后重试',
      };
      return;
    }

    if (searchConfig.aiSearchEnabled === false) {
      ctx.status = 403;
      ctx.body = {
        results: [],
        mode: 'keyword',
        reason: 'AI 搜索已关闭',
        message: 'AI 搜索功能已关闭',
        reasoning: '后台已关闭 AI 搜索，请联系管理员开启后重试',
      };
      return;
    }

    if (!query) {
      ctx.body = {
        results: [],
        mode: 'keyword',
        reason: '关键词为空，未执行检索',
        message: '请输入搜索关键词',
        reasoning: '请输入搜索关键词后再尝试 AI 搜索',
      };
      return;
    }

    try {
      const pattern = `%${query}%`;
      const exactPattern = query;
      const prefixPattern = `${query}%`;
      const whereSql = categoryId > 0 ? ' AND w.category_id = ? ' : '';

      /**
       * AI 搜索兜底为关键词检索时，仍按相关性优先排序，提升结果可用性。
       */
      const relevanceOrderSql = `
        (
          (CASE WHEN w.name = ? THEN 900 ELSE 0 END)
          + (CASE WHEN w.name LIKE ? THEN 620 ELSE 0 END)
          + (CASE WHEN w.name LIKE ? THEN 380 ELSE 0 END)
          + (CASE WHEN w.tags LIKE ? THEN 280 ELSE 0 END)
          + (CASE WHEN w.description LIKE ? THEN 150 ELSE 0 END)
          + (CASE WHEN w.url LIKE ? THEN 110 ELSE 0 END)
        ) DESC
      `;

      const whereReplacements = categoryId > 0
        ? [ pattern, pattern, pattern, pattern, categoryId ]
        : [ pattern, pattern, pattern, pattern ];
      const relevanceReplacements = [
        exactPattern,
        prefixPattern,
        pattern,
        pattern,
        pattern,
        pattern,
      ];
      const replacements = [ ...whereReplacements, ...relevanceReplacements, limit ];
      const rows = await ctx.app.model.query(
        `
        SELECT w.id, w.name, w.slug, w.description, w.url, w.icon_url AS iconUrl, w.tags,
               w.is_hot AS isHot, w.is_featured AS isFeatured, w.is_new AS isNew,
               c.name AS category
        FROM uied_website w
        LEFT JOIN uied_category c ON c.id = w.category_id
        WHERE w.is_delete = 0
          AND (
            w.name LIKE ?
            OR w.description LIKE ?
            OR w.tags LIKE ?
            OR w.url LIKE ?
          )
          ${whereSql}
        ORDER BY
          ${relevanceOrderSql},
          w.is_pinned DESC,
          w.is_hot DESC,
          w.is_featured DESC,
          w.click_count DESC,
          w.id DESC
        LIMIT ?
        `,
        { replacements, type: ctx.app.Sequelize.QueryTypes.SELECT }
      );

      const results = (Array.isArray(rows) ? rows : []).map(item => ({
        id: String(item?.id || ''),
        name: String(item?.name || ''),
        slug: String(item?.slug || ''),
        description: String(item?.description || ''),
        url: String(item?.url || ''),
        iconUrl: String(item?.iconUrl || ''),
        category: String(item?.category || ''),
        tags: this.safeJsonParse(item?.tags, []),
        isHot: Number(item?.isHot || 0) === 1,
        isFeatured: Number(item?.isFeatured || 0) === 1,
        isNew: Number(item?.isNew || 0) === 1,
      }));

      ctx.body = {
        results,
        mode: 'keyword',
        reason: '当前为关键词匹配结果',
        message: `找到 ${results.length} 个结果`,
        reasoning: '已按名称、描述、标签和网址进行关键词匹配排序',
      };
    } catch (error) {
      ctx.logger.error('AI搜索失败（关键词兜底）:', error);
      ctx.status = 500;
      ctx.body = { error: error.message || 'AI搜索失败' };
    }
  }

  /**
   * 获取 WordPress 分类配置（兼容旧前端）
   * GET /api/wordpress/categories/active
   */
  async wordpressCategoriesActive() {
    const { ctx } = this;
    const pageSlug = String(ctx.query?.pageSlug || '').trim();

    try {
      const categories = await ctx.service.uied.wordpressConfig.listCategories(pageSlug || undefined);
      ctx.body = (Array.isArray(categories) ? categories : []).filter(item => item?.visible !== false);
    } catch (error) {
      ctx.logger.error('获取 WordPress 分类失败:', error);
      // 兼容旧前端：异常时返回空数组，避免页面硬失败
      ctx.body = [];
    }
  }

  /**
   * 获取 WordPress 标签配置（兼容旧前端）
   * GET /api/wordpress/tags
   */
  async wordpressTags() {
    const { ctx } = this;
    const pageSlug = String(ctx.query?.pageSlug || '').trim();
    try {
      const tags = await ctx.service.uied.wordpressConfig.listTags(pageSlug || undefined);
      ctx.body = (Array.isArray(tags) ? tags : []).filter(item => item?.visible !== false);
    } catch (error) {
      ctx.logger.error('获取 WordPress 标签失败:', error);
      ctx.body = [];
    }
  }

  /**
   * 获取 WordPress 组件配置（兼容旧前端）
   * GET /api/wordpress/widgets/active
   */
  async wordpressWidgetsActive() {
    const { ctx } = this;
    const pageSlug = String(ctx.query?.pageSlug || '').trim();
    try {
      const widgets = await ctx.service.uied.wordpressConfig.listWidgets(pageSlug || undefined);
      ctx.body = (Array.isArray(widgets) ? widgets : []).filter(item => item?.visible !== false);
    } catch (error) {
      ctx.logger.error('获取 WordPress 组件失败:', error);
      ctx.body = [];
    }
  }

  /**
   * 获取公开设置
   * GET /api/settings/public
   */
  async publicSettings() {
    const { ctx } = this;

    try {
      this.setNoCacheHeaders();
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
      this.setNoCacheHeaders();
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
        articleConfig,
        articleTopicsConfig,
      ] = await Promise.all([
        ctx.service.uied.setting.get('exitModalConfig'),
        ctx.service.uied.setting.get('pageGlobalConfig'),
        ctx.service.uied.setting.get('appearanceConfig'),
        ctx.service.uied.setting.get('homepageConfig'),
        ctx.service.uied.setting.get('cardStyleConfig'),
        ctx.service.uied.setting.get('sidebarConfig'),
        ctx.service.uied.setting.get('searchConfig'),
        ctx.service.uied.setting.get('articleConfig'),
        ctx.service.uied.setting.get('articleTopicsConfig'),
      ]);

      /**
       * 规范化页面点击配置，兼容历史值并确保前端行为稳定
       */
      const normalizedPageGlobalConfig = ctx.service.uied.setting.normalizePageGlobalConfig(
        pageGlobalConfig || {}
      );
      /**
       * 规范化跳转弹窗配置，确保前端能直接读取协议与品牌字段
       */
      const normalizedExitModalConfig = ctx.service.uied.setting.normalizeExitModalConfig(
        exitModalConfig || {}
      );
      const normalizedSearchConfig = ctx.service.uied.setting.normalizeSearchConfig(
        searchConfig || {}
      );

      ctx.body = {
        exitModalEnabled: true,
        exitModalConfig: normalizedExitModalConfig,
        popupConfig: normalizedExitModalConfig,
        pageGlobalConfig: normalizedPageGlobalConfig,
        appearanceConfig: appearanceConfig || {},
        homepageConfig: homepageConfig || {},
        cardStyleConfig: cardStyleConfig || {},
        sidebarConfig: sidebarConfig || {},
        searchConfig: normalizedSearchConfig,
        articleConfig: ctx.service.uied.setting.normalizeArticleConfig(articleConfig || {}),
        articleTopicsConfig: ctx.service.uied.setting.normalizeArticleTopicsConfig(articleTopicsConfig || {}),
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
        articleConfig: {},
        articleTopicsConfig: {},
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
        builtinKey: menu.builtinKey || '',
        linkMode: menu.linkMode || 'custom',
        children: (menu.children || []).map(transformMenu),
      });

      const [ dailyHotConfig, rankBoardConfig ] = await Promise.all([
        this.getDailyHotDisplayConfig().catch(() => null),
        this.getRankBoardDisplayConfig().catch(() => null),
      ]);
      const result = this.applyBuiltinNavMenuRefs(menus.map(transformMenu), { dailyHotConfig, rankBoardConfig });
      const withDailyHot = this.appendDailyHotNavMenuItem(result, dailyHotConfig);
      ctx.body = this.appendRankBoardNavMenuItem(withDailyHot, rankBoardConfig);
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
          builtinKey: link.builtinKey || '',
          linkMode: link.linkMode || 'custom',
        })),
      }));

      const [ dailyHotConfig, rankBoardConfig ] = await Promise.all([
        this.getDailyHotDisplayConfig().catch(() => null),
        this.getRankBoardDisplayConfig().catch(() => null),
      ]);
      const resolved = this.applyBuiltinFooterLinks(result, { dailyHotConfig, rankBoardConfig });
      const withDailyHot = this.appendDailyHotFooterLink(resolved, dailyHotConfig);
      ctx.body = this.appendRankBoardFooterLink(withDailyHot, rankBoardConfig);
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
   * 获取每日热榜公开显示配置
   * GET /api/daily-hot/config
   */
  async dailyHotConfig() {
    const { ctx } = this;

    try {
      const config = await ctx.service.uied.dailyHot.getConfig();
      ctx.body = {
        enabled: config?.enabled !== false,
        defaultPlatforms: Array.isArray(config?.defaultPlatforms) ? config.defaultPlatforms.map(item => String(item || '').trim()).filter(Boolean) : [],
        defaultLimit: Number(config?.defaultLimit || 10),
        maxPlatforms: Number(config?.maxPlatforms || 12),
        displayPlacements: Array.isArray(config?.displayPlacements) ? config.displayPlacements : [],
        displayLabel: String(config?.displayLabel || '每日热榜'),
        displayPath: String(config?.displayPath || '/p/daily-hot'),
        displaySort: Number(config?.displaySort || 90),
        displayDesktop: config?.displayDesktop !== false,
        displayMobile: config?.displayMobile !== false,
        displayOpenInNewTab: config?.displayOpenInNewTab === true,
        updatedAt: Number(config?.updatedAt || 0),
      };
    } catch (error) {
      ctx.logger.error('获取每日热榜公开配置失败:', error);
      ctx.status = 500;
      ctx.body = { error: error.message || '获取每日热榜公开配置失败' };
    }
  }

  /**
   * 获取今日热榜聚合数据
   * GET /api/daily-hot
   */
  async dailyHotList() {
    const { ctx } = this;
    const title = String(ctx.query?.title || '').trim();
    const titles = String(ctx.query?.titles || '').trim();
    const limit = this.parsePositiveInt(ctx.query?.limit, 10);
    const platformLimit = this.parsePositiveInt(ctx.query?.platformLimit, 6);
    const forceRefresh = this.parseBoolean(ctx.query?.refresh, false);

    try {
      const result = await ctx.service.uied.dailyHot.aggregateTodayHot({
        title,
        titles,
        limit: Math.max(1, Math.min(limit, 30)),
        platformLimit: Math.max(1, Math.min(platformLimit, 20)),
        forceRefresh,
      });
      ctx.body = result;
    } catch (error) {
      ctx.logger.error('获取今日热榜失败:', error);
      ctx.status = 500;
      ctx.body = { error: error.message || '获取今日热榜失败' };
    }
  }

  /**
   * 获取热榜平台列表
   * GET /api/daily-hot/platforms
   */
  async dailyHotPlatforms() {
    const { ctx } = this;
    const forceRefresh = this.parseBoolean(ctx.query?.refresh, false);

    try {
      const result = await ctx.service.uied.dailyHot.getPlatforms({ forceRefresh });
      ctx.body = result;
    } catch (error) {
      ctx.logger.error('获取热榜平台列表失败:', error);
      ctx.status = 500;
      ctx.body = { error: error.message || '获取热榜平台列表失败' };
    }
  }

  /**
   * 获取榜单系统聚合数据
   * GET /api/rankings
   */
  async rankings() {
    const { ctx } = this;
    const boardKey = String(ctx.query?.boardKey || '').trim();
    const limit = this.parsePositiveInt(ctx.query?.limit, 20);
    try {
      const data = await ctx.service.uied.rankBoard.getBoardList({
        boardKey,
        limit: Math.max(1, Math.min(limit, 100)),
      });
      ctx.body = data;
    } catch (error) {
      ctx.logger.error('获取榜单系统数据失败:', error);
      ctx.status = 500;
      ctx.body = { error: error.message || '获取榜单系统数据失败' };
    }
  }

  /**
   * 获取单个榜单数据
   * GET /api/rankings/:key
   */
  async rankingDetail() {
    const { ctx } = this;
    const boardKey = String(ctx.params?.key || '').trim();
    const limit = this.parsePositiveInt(ctx.query?.limit, 20);
    if (!boardKey) {
      ctx.status = 400;
      ctx.body = { error: '缺少榜单键' };
      return;
    }
    try {
      const data = await ctx.service.uied.rankBoard.getBoardList({
        boardKey,
        limit: Math.max(1, Math.min(limit, 100)),
      });
      const board = Array.isArray(data?.boards) && data.boards.length > 0 ? data.boards[0] : null;
      if (!board) {
        ctx.status = 404;
        ctx.body = { error: '榜单不存在' };
        return;
      }
      ctx.body = board;
    } catch (error) {
      ctx.logger.error('获取榜单详情失败:', error);
      ctx.status = 500;
      ctx.body = { error: error.message || '获取榜单详情失败' };
    }
  }

  /**
   * 判断网站详情页评论功能是否开启
   */
  async isWebsiteCommentsEnabled() {
    const { ctx } = this;
    try {
      const detailPageConfig = await ctx.service.uied.setting.getSettingByKey('detailPageConfig');
      return detailPageConfig?.commentsEnabled !== false;
    } catch (error) {
      ctx.logger.warn('读取网站评论开关失败，按开启处理:', error);
      return true;
    }
  }

  /**
   * 判断文章评论功能是否开启
   */
  async isArticleCommentsEnabled() {
    const { ctx } = this;
    try {
      const articleConfig = await ctx.service.uied.setting.getSettingByKey('articleConfig');
      const normalized = ctx.service.uied.setting.normalizeArticleConfig(articleConfig || {});
      return normalized?.commentsEnabled !== false;
    } catch (error) {
      ctx.logger.warn('读取文章评论开关失败，按开启处理:', error);
      return true;
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
   * 解析布尔值参数
   */
  parseBoolean(value, defaultValue = false) {
    if (value === undefined || value === null || value === '') return defaultValue;
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value === 1;
    const text = String(value).trim().toLowerCase();
    if ([ '1', 'true', 'yes', 'y', 'on' ].includes(text)) return true;
    if ([ '0', 'false', 'no', 'n', 'off' ].includes(text)) return false;
    return defaultValue;
  }

  /**
   * 判断是否为可降级的库结构兼容错误
   */
  isSchemaCompatibilityError(error) {
    const code = String(error?.original?.code || error?.code || '').toUpperCase();
    const message = String(error?.message || '');
    return code === 'ER_NO_SUCH_TABLE'
      || code === 'ER_BAD_FIELD_ERROR'
      || code === 'ER_CANT_AGGREGATE_2COLLATIONS'
      || message.includes('doesn\'t exist')
      || message.includes('Unknown column')
      || message.includes('Illegal mix of collations');
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

    /**
     * 统一执行标签计数 SQL，并转换为 Map 结果
     */
    const runCountQuery = async sql => {
      const rows = await ctx.model.query(
        sql,
        {
          replacements: [ ids ],
          type: ctx.model.QueryTypes.SELECT,
        }
      );
      return new Map((Array.isArray(rows) ? rows : []).map(item => [
        this.parsePositiveInt(item.tagId, 0),
        this.parsePositiveInt(item.total, 0),
      ]));
    };

    try {
      return await runCountQuery(
        `
        SELECT r.tag_id AS tagId, COUNT(DISTINCT r.article_id) AS total
        FROM uied_article_tag_relation r
        INNER JOIN uied_article a
          ON a.id = r.article_id
         AND a.is_delete = 0
         AND a.status = 'published'
        INNER JOIN uied_article_tag t
          ON t.id = r.tag_id
         AND t.is_delete = 0
        WHERE 1 = 1
          AND r.tag_id IN (?)
        GROUP BY r.tag_id
        `
      );
    } catch (error) {
      /**
       * 兼容旧表结构（la_article*），避免历史环境直接报错
       */
      if (!this.isSchemaCompatibilityError(error)) {
        ctx.logger.warn(`FrontendController.getPublicTagCountMap fallback empty: ${error.message || error}`);
        return new Map();
      }
      try {
        return await runCountQuery(
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
          `
        );
      } catch (legacyError) {
        ctx.logger.warn(`FrontendController.getPublicTagCountMap fallback empty: ${legacyError.message || legacyError}`);
        return new Map();
      }
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
    const categoryId = this.parsePositiveInt(item?.categoryId ?? item?.category_id ?? item?.cid, 0);
    const categoryName = String(item?.category || '').trim()
      || String(categoryMap.get(categoryId) || '').trim()
      || '未分类';
    const rawTags = Array.isArray(item?.tags) ? item.tags : [];
    const tags = rawTags
      .map(tagItem => {
        /**
         * 兼容标签对象数组（新接口）与字符串数组（旧接口）
         */
        if (tagItem && typeof tagItem === 'object') {
          const rawName = String(tagItem.name || '').trim();
          const tagMeta = tagMetaByName.get(rawName);
          const name = rawName || String(tagMeta?.name || '').trim();
          if (!name) return null;
          return {
            id: this.parsePositiveInt(tagItem.id ?? tagMeta?.id, 0),
            name,
            slug: String(tagItem.slug || tagMeta?.slug || name),
            color: String(tagItem.color || ''),
          };
        }
        const name = String(tagItem || '').trim();
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
      excerpt: String(item?.excerpt || item?.summary || item?.intro || ''),
      coverImage: String(item?.coverImage || item?.cover_image || item?.image || ''),
      author: String(item?.author || ''),
      category: categoryName,
      slug: String(item?.slug || this.buildArticleSlug(id)),
      viewCount: this.parsePositiveInt(item?.viewCount ?? item?.visit, 0),
      publishedAt: this.toTimestampMs(item?.publishedAt ?? item?.reviewTime ?? item?.createTime),
      createdAt: this.toTimestampMs(item?.createdAt ?? item?.createTime),
      updatedAt: this.toTimestampMs(item?.updatedAt ?? item?.updateTime),
      tags,
    };
  }

  /**
   * 格式化文章详情（前端详情页）
   */
  formatArticleDetailItem(item, { categoryMap = new Map(), tagMetaById = new Map() } = {}) {
    const id = this.parsePositiveInt(item?.id, 0);
    const categoryId = this.parsePositiveInt(item?.categoryId ?? item?.category_id ?? item?.cid, 0);
    const categoryName = String(item?.category || '').trim()
      || String(categoryMap.get(categoryId) || '').trim()
      || '未分类';
    const rawTags = Array.isArray(item?.tags) ? item.tags : [];
    const tags = rawTags.map(tag => {
      const tagId = this.parsePositiveInt(tag?.id ?? tag?.tagId, 0);
      const meta = tagMetaById.get(tagId);
      return {
        id: tagId,
        name: String(tag?.name || meta?.name || ''),
        slug: String(tag?.slug || meta?.slug || tagId || ''),
        color: String(tag?.color || ''),
      };
    }).filter(tag => tag.id > 0 && tag.name);

    const excerpt = String(item?.excerpt || item?.summary || item?.intro || '').trim();
    return {
      id,
      title: String(item?.title || ''),
      content: String(item?.content || ''),
      excerpt,
      coverImage: String(item?.coverImage || item?.cover_image || item?.image || ''),
      author: String(item?.author || ''),
      category: categoryName,
      slug: String(item?.slug || this.buildArticleSlug(id)),
      status: String(item?.status || '').trim() || (Number(item?.isShow || 0) === 1 ? 'published' : 'draft'),
      viewCount: this.parsePositiveInt(item?.viewCount ?? item?.visit, 0),
      seoTitle: String(item?.seoTitle || item?.title || ''),
      seoDescription: String(item?.seoDescription || excerpt),
      publishedAt: this.toTimestampMs(item?.publishedAt ?? item?.reviewTime),
      createdAt: this.toTimestampMs(item?.createdAt ?? item?.createTime),
      updatedAt: this.toTimestampMs(item?.updatedAt ?? item?.updateTime),
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
      tagSlug,
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

      const [ categoriesResult, tagsResult ] = await Promise.allSettled([
        ctx.service.uied.articleCategory.all(),
        ctx.service.uied.articleTag.all(),
      ]);
      const categories = categoriesResult.status === 'fulfilled' ? categoriesResult.value : [];
      const tags = tagsResult.status === 'fulfilled' ? tagsResult.value : [];

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
        status: 'published',
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
      let article = null;
      let isLegacyArticle = false;
      /**
       * 优先按 ID 解析，若不是数字 slug 则回退按真实 slug 查询
       */
      if (articleId > 0) {
        try {
          article = await ctx.service.uied.article.detail(articleId);
        } catch (error) {
          if (String(error?.message || '').includes('文章不存在')) {
            article = null;
          } else {
            throw error;
          }
        }
      } else {
        article = await ctx.service.uied.article.detailBySlug(String(slug || '').trim());
      }
      /**
       * 兼容历史文章表（la_article）：
       * 当新表查不到数字 ID 时，尝试读取旧文章服务，避免 /article/:id 旧链接失效。
       */
      if (!article && articleId > 0) {
        try {
          const legacyArticle = await ctx.service.article.detail(articleId);
          if (legacyArticle) {
            article = legacyArticle;
            isLegacyArticle = true;
          }
        } catch (legacyError) {
          if (!String(legacyError?.message || '').includes('文章不存在')) {
            throw legacyError;
          }
        }
      }
      if (!article) {
        ctx.status = 404;
        ctx.body = { error: '文章不存在' };
        return;
      }
      const [ categoriesResult, tagsResult ] = await Promise.allSettled([
        ctx.service.uied.articleCategory.all(),
        ctx.service.uied.articleTag.all(),
      ]);
      const categories = categoriesResult.status === 'fulfilled' ? categoriesResult.value : [];
      const tags = tagsResult.status === 'fulfilled' ? tagsResult.value : [];
      const categoryMap = new Map((Array.isArray(categories) ? categories : []).map(item => [
        this.parsePositiveInt(item.id, 0),
        String(item.name || ''),
      ]));
      const tagCountMap = await this.getPublicTagCountMap((Array.isArray(tags) ? tags : []).map(item => item.id));
      const tagMetaList = (Array.isArray(tags) ? tags : []).map(item => this.formatArticleTagMeta(item, tagCountMap));
      const tagMetaById = new Map(tagMetaList.map(item => [ item.id, item ]));
      /**
       * 旧文章表字段为 cid，分类名称可能为空，补一次分类名称兜底。
       */
      if (
        isLegacyArticle
        && !String(article?.category || '').trim()
        && this.parsePositiveInt(article?.cid, 0) > 0
      ) {
        try {
          const legacyCategory = await ctx.service.article.cateDetail(this.parsePositiveInt(article.cid, 0));
          article.category = String(legacyCategory?.name || '').trim();
        } catch (legacyCategoryError) {
          ctx.logger.warn(
            `articleDetail legacy category fallback skipped: ${legacyCategoryError?.message || legacyCategoryError}`
          );
        }
      }
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
    const { page = 1, pageSize = 10, sort = 'latest' } = ctx.query;

    try {
      const articleId = this.parsePositiveInt(id, 0);
      if (!articleId) {
        ctx.status = 400;
        ctx.body = { error: '文章ID无效' };
        return;
      }
      const pageNo = this.parsePositiveInt(page, 1);
      const limit = this.parsePositiveInt(pageSize, 10);
      /**
       * 文章评论被后台关闭时，返回空列表，前端可保持稳定渲染。
       */
      if (!(await this.isArticleCommentsEnabled())) {
        ctx.body = {
          lists: [],
          total: 0,
          page: pageNo,
          pageSize: limit,
          totalPages: 0,
        };
        return;
      }
      const result = await ctx.service.uied.comment.list({
        articleId,
        page: pageNo,
        pageSize: limit,
        type: 'article',
        status: 'approved',
        sort: String(sort || 'latest').trim().toLowerCase() === 'hot' ? 'hot' : 'latest',
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
      /**
       * 文章评论被后台关闭时，不允许继续提交。
       */
      if (!(await this.isArticleCommentsEnabled())) {
        ctx.status = 403;
        ctx.body = { error: '文章评论功能已关闭' };
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
   * 全站搜索
   * GET /api/search
   */
  async globalSearch() {
    const { ctx } = this;
    try {
      const rawSearchConfig = await ctx.service.uied.setting.get('searchConfig');
      const searchConfig = ctx.service.uied.setting.normalizeSearchConfig(rawSearchConfig || {});
      if (searchConfig.enabled === false) {
        ctx.status = 403;
        ctx.body = {
          lists: [],
          categories: [],
          tags: [],
          total: 0,
          pageNo: 1,
          pageSize: 20,
          message: '站内搜索功能已关闭',
        };
        return;
      }

      const { keyword, page = 1, pageSize = 20, type = 'all' } = ctx.query;

      if (!keyword || keyword.trim().length === 0) {
        ctx.body = {
          lists: [],
          total: 0,
          pageNo: parseInt(page),
          pageSize: parseInt(pageSize),
          message: '请输入搜索关键词',
        };
        return;
      }

      const data = await ctx.service.uied.search.globalSearch({
        keyword: keyword.trim(),
        page: Number(page),
        pageSize: Number(pageSize),
        type,
      });

      ctx.body = data;
    } catch (e) {
      ctx.logger.error('全站搜索失败:', e);
      ctx.status = 500;
      ctx.body = { error: e.message };
    }
  }

  /**
   * 高级搜索
   * POST /api/search/advanced
   */
  async advancedSearch() {
    const { ctx } = this;
    try {
      const rawSearchConfig = await ctx.service.uied.setting.get('searchConfig');
      const searchConfig = ctx.service.uied.setting.normalizeSearchConfig(rawSearchConfig || {});
      if (searchConfig.enabled === false) {
        ctx.status = 403;
        ctx.body = {
          lists: [],
          total: 0,
          pageNo: 1,
          pageSize: 20,
          message: '站内搜索功能已关闭',
        };
        return;
      }

      const params = ctx.request.body || {};
      const data = await ctx.service.uied.search.advancedSearch(params);
      ctx.body = data;
    } catch (e) {
      ctx.logger.error('高级搜索失败:', e);
      ctx.status = 500;
      ctx.body = { error: e.message };
    }
  }

  /**
   * 搜索建议
   * GET /api/search/suggestions
   */
  async searchSuggestions() {
    const { ctx } = this;
    try {
      const rawSearchConfig = await ctx.service.uied.setting.get('searchConfig');
      const searchConfig = ctx.service.uied.setting.normalizeSearchConfig(rawSearchConfig || {});
      if (searchConfig.enabled === false) {
        ctx.body = { websites: [], categories: [] };
        return;
      }

      const { keyword } = ctx.query;
      const data = await ctx.service.uied.search.getSuggestions(keyword);
      ctx.body = data;
    } catch (e) {
      ctx.logger.error('获取搜索建议失败:', e);
      ctx.status = 500;
      ctx.body = { error: e.message };
    }
  }

  /**
   * 热门搜索
   * GET /api/search/hot
   */
  async hotSearches() {
    const { ctx } = this;
    try {
      const rawSearchConfig = await ctx.service.uied.setting.get('searchConfig');
      const searchConfig = ctx.service.uied.setting.normalizeSearchConfig(rawSearchConfig || {});
      if (searchConfig.enabled === false) {
        ctx.body = [];
        return;
      }

      const data = await ctx.service.uied.search.getHotSearches();
      ctx.body = data;
    } catch (e) {
      ctx.logger.error('获取热门搜索失败:', e);
      ctx.status = 500;
      ctx.body = { error: e.message };
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
   * 投稿激励排行榜（前台公开）
   * GET /api/contribution/leaderboard
   */
  async contributionLeaderboard() {
    const { ctx } = this;
    const limit = Number.parseInt(String(ctx.query?.limit || ''), 10);
    try {
      const list = await ctx.service.uied.contributionIncentive.leaderboard(Number.isInteger(limit) ? limit : 20);
      ctx.body = {
        list: Array.isArray(list) ? list : [],
        total: Array.isArray(list) ? list.length : 0,
      };
    } catch (error) {
      ctx.logger.error('获取投稿激励排行榜失败:', error);
      ctx.status = 500;
      ctx.body = { error: error.message };
    }
  }

  /**
   * 优质投稿推荐位（前台公开）
   * GET /api/contribution/featured-submissions
   */
  async contributionFeaturedSubmissions() {
    const { ctx } = this;
    const limit = Number.parseInt(String(ctx.query?.limit || ''), 10);
    try {
      const list = await ctx.service.uied.contributionIncentive.featuredPublicList(Number.isInteger(limit) ? limit : 20);
      ctx.body = {
        list: Array.isArray(list) ? list : [],
        total: Array.isArray(list) ? list.length : 0,
      };
    } catch (error) {
      ctx.logger.error('获取优质投稿推荐位失败:', error);
      ctx.status = 500;
      ctx.body = { error: error.message };
    }
  }

  /**
   * 商业位公开投放列表（前台公开）
   * GET /api/commercial/placements
   */
  async commercialPlacements() {
    const { ctx } = this;
    const params = ctx.query || {};
    try {
      const data = await ctx.service.uied.commercialSlot.publicPlacements(params);
      ctx.body = data;
    } catch (error) {
      ctx.logger.error('获取商业位投放列表失败:', error);
      ctx.status = 500;
      ctx.body = { error: error.message };
    }
  }

  /**
   * 获取每日热榜显示配置（供导航菜单/页脚自动注入使用）
   */
  async getDailyHotDisplayConfig() {
    const { ctx } = this;
    const config = await ctx.service.uied.dailyHot.getConfig();
    const placements = Array.isArray(config?.displayPlacements)
      ? config.displayPlacements.map(item => String(item || '').trim()).filter(Boolean)
      : [];
    return {
      enabled: config?.enabled !== false,
      displayPlacements: Array.from(new Set(placements)),
      displayLabel: String(config?.displayLabel || '每日热榜').trim() || '每日热榜',
      displayPath: this.normalizePath(config?.displayPath || '/p/daily-hot'),
      displaySort: this.parsePositiveInt(config?.displaySort, 90),
      displayDesktop: config?.displayDesktop !== false,
      displayMobile: config?.displayMobile !== false,
      displayOpenInNewTab: config?.displayOpenInNewTab === true,
    };
  }

  /**
   * 获取榜单系统显示配置（供导航菜单/页脚自动注入使用）
   */
  async getRankBoardDisplayConfig() {
    const { ctx } = this;
    const config = await ctx.service.uied.rankBoard.getPublicConfig();
    const placements = Array.isArray(config?.displayPlacements)
      ? config.displayPlacements.map(item => String(item || '').trim()).filter(Boolean)
      : [];
    return {
      enabled: config?.enabled !== false,
      displayPlacements: Array.from(new Set(placements)),
      displayLabel: String(config?.displayLabel || '榜单系统').trim() || '榜单系统',
      displayPath: this.normalizePath(config?.displayPath || '/p/rankings'),
      displaySort: this.parsePositiveInt(config?.displaySort, 88),
      displayDesktop: config?.displayDesktop !== false,
      displayMobile: config?.displayMobile !== false,
      displayOpenInNewTab: config?.displayOpenInNewTab === true,
      defaultMetric: String(config?.defaultMetric || 'visit').trim().toLowerCase(),
      defaultPeriod: String(config?.defaultPeriod || 'day').trim().toLowerCase(),
    };
  }

  /**
   * 规范化路径（确保前导斜杠）
   */
  normalizePath(path) {
    const text = String(path || '').trim();
    if (!text) return '/';
    if (/^(https?:)?\/\//i.test(text)) return text;
    return text.startsWith('/') ? text : `/${text}`;
  }

  /**
   * 按内置入口配置解析导航菜单项（当前支持 daily_hot / rankings）
   */
  applyBuiltinNavMenuRefs(rows = [], context = {}) {
    const list = Array.isArray(rows) ? rows : [];
    const dailyHotConfig = context?.dailyHotConfig || null;
    const rankBoardConfig = context?.rankBoardConfig || null;

    return list.map(item => {
      const next = {
        ...item,
        children: this.applyBuiltinNavMenuRefs(item?.children || [], context),
      };
      const builtinKey = String(next?.builtinKey || '').trim().toLowerCase();
      if (builtinKey === 'daily_hot' && dailyHotConfig) {
        next.link = dailyHotConfig.displayPath || next.link || '/p/daily-hot';
        if (!String(next.text || '').trim()) {
          next.text = dailyHotConfig.displayLabel || '每日热榜';
        }
      } else if (builtinKey === 'rankings' && rankBoardConfig) {
        next.link = rankBoardConfig.displayPath || next.link || '/p/rankings';
        if (!String(next.text || '').trim()) {
          next.text = rankBoardConfig.displayLabel || '榜单系统';
        }
      }
      return next;
    });
  }

  /**
   * 按内置入口配置解析页脚链接（当前支持 daily_hot / rankings）
   */
  applyBuiltinFooterLinks(groups = [], context = {}) {
    const list = Array.isArray(groups) ? groups : [];
    const dailyHotConfig = context?.dailyHotConfig || null;
    const rankBoardConfig = context?.rankBoardConfig || null;

    return list.map(group => ({
      ...group,
      links: (Array.isArray(group?.links) ? group.links : []).map(link => {
        const next = { ...link };
        const builtinKey = String(next?.builtinKey || '').trim().toLowerCase();
        if (builtinKey === 'daily_hot' && dailyHotConfig) {
          next.url = dailyHotConfig.displayPath || next.url || '/p/daily-hot';
          if (!String(next.text || '').trim()) {
            next.text = dailyHotConfig.displayLabel || '每日热榜';
          }
        } else if (builtinKey === 'rankings' && rankBoardConfig) {
          next.url = rankBoardConfig.displayPath || next.url || '/p/rankings';
          if (!String(next.text || '').trim()) {
            next.text = rankBoardConfig.displayLabel || '榜单系统';
          }
        }
        return next;
      }),
    }));
  }

  /**
   * 判断导航菜单是否已存在同目标链接（避免重复注入）
   */
  hasNavMenuLink(rows = [], targetPath = '', builtinKeys = []) {
    const list = Array.isArray(rows) ? rows : [];
    const normalizedTarget = this.normalizePath(targetPath);
    const builtinKeySet = new Set((Array.isArray(builtinKeys) ? builtinKeys : []).map(item => String(item || '').trim().toLowerCase()));
    const walk = items => items.some(item => {
      const builtinKey = String(item?.builtinKey || '').trim().toLowerCase();
      if (builtinKey && builtinKeySet.has(builtinKey)) return true;
      const currentLink = item?.link ? this.normalizePath(item.link) : '';
      if (currentLink && currentLink === normalizedTarget) return true;
      return Array.isArray(item?.children) && walk(item.children);
    });
    return walk(list);
  }

  /**
   * 按每日热榜配置自动注入导航菜单入口（首页菜单）
   */
  appendDailyHotNavMenuItem(rows = [], config = null) {
    const list = Array.isArray(rows) ? rows.slice() : [];
    if (!config || config.enabled === false) return list;
    if (!Array.isArray(config.displayPlacements) || !config.displayPlacements.includes('home_menu')) return list;
    if (!config.displayPath || this.hasNavMenuLink(list, config.displayPath, [ 'daily_hot' ])) return list;

    list.push({
      id: 'builtin:daily-hot',
      text: config.displayLabel,
      link: config.displayPath,
      external: config.displayOpenInNewTab === true,
      label: '内置',
      labelType: 'info',
      icon: 'TrendCharts',
      parentId: null,
      order: Number(config.displaySort || 90),
      visible: true,
      children: [],
      builtin: true,
      builtinKey: 'daily_hot',
      displayDesktop: config.displayDesktop !== false,
      displayMobile: config.displayMobile !== false,
    });

    return list.sort((a, b) => Number(a?.order || 0) - Number(b?.order || 0));
  }

  /**
   * 判断页脚链接是否已存在同目标链接（避免重复注入）
   */
  hasFooterLink(groups = [], targetPath = '', builtinKeys = []) {
    const normalizedTarget = this.normalizePath(targetPath);
    const builtinKeySet = new Set((Array.isArray(builtinKeys) ? builtinKeys : []).map(item => String(item || '').trim().toLowerCase()));
    return (Array.isArray(groups) ? groups : []).some(group =>
      Array.isArray(group?.links) && group.links.some(link => {
        const builtinKey = String(link?.builtinKey || '').trim().toLowerCase();
        if (builtinKey && builtinKeySet.has(builtinKey)) return true;
        const currentLink = link?.url ? this.normalizePath(link.url) : '';
        return currentLink && currentLink === normalizedTarget;
      })
    );
  }

  /**
   * 按每日热榜配置自动注入页脚链接（页脚显示）
   */
  appendDailyHotFooterLink(groups = [], config = null) {
    const list = Array.isArray(groups) ? groups.map(group => ({
      ...group,
      links: Array.isArray(group?.links) ? group.links.slice() : [],
    })) : [];

    if (!config || config.enabled === false) return list;
    if (!Array.isArray(config.displayPlacements) || !config.displayPlacements.includes('footer_link')) return list;
    if (!config.displayPath || this.hasFooterLink(list, config.displayPath, [ 'daily_hot' ])) return list;

    const targetGroup = list.find(group => group?.visible !== false)
      || null;

    const builtinLink = {
      id: 'builtin:daily-hot-footer',
      text: config.displayLabel,
      url: config.displayPath,
      external: config.displayOpenInNewTab === true,
      order: Number(config.displaySort || 90),
      visible: true,
      builtin: true,
      builtinKey: 'daily_hot',
      displayDesktop: config.displayDesktop !== false,
      displayMobile: config.displayMobile !== false,
    };

    if (targetGroup) {
      targetGroup.links.push(builtinLink);
      targetGroup.links.sort((a, b) => Number(a?.order || 0) - Number(b?.order || 0));
      return list;
    }

    return [
      ...list,
      {
        id: 'builtin:daily-hot-group',
        title: '热门榜单',
        order: 999,
        visible: true,
        links: [ builtinLink ],
        builtin: true,
        builtinKey: 'daily_hot',
      },
    ];
  }

  /**
   * 按榜单系统配置自动注入导航菜单入口（首页菜单）
   */
  appendRankBoardNavMenuItem(rows = [], config = null) {
    const list = Array.isArray(rows) ? rows.slice() : [];
    if (!config || config.enabled === false) return list;
    if (!Array.isArray(config.displayPlacements) || !config.displayPlacements.includes('home_menu')) return list;
    if (!config.displayPath || this.hasNavMenuLink(list, config.displayPath, [ 'rankings' ])) return list;

    list.push({
      id: 'builtin:rankings',
      text: config.displayLabel || '榜单系统',
      link: config.displayPath || '/p/rankings',
      external: config.displayOpenInNewTab === true,
      label: '内置',
      labelType: 'info',
      icon: 'DataAnalysis',
      parentId: null,
      order: Number(config.displaySort || 88),
      visible: true,
      children: [],
      builtin: true,
      builtinKey: 'rankings',
      displayDesktop: config.displayDesktop !== false,
      displayMobile: config.displayMobile !== false,
    });

    return list.sort((a, b) => Number(a?.order || 0) - Number(b?.order || 0));
  }

  /**
   * 按榜单系统配置自动注入页脚链接（页脚显示）
   */
  appendRankBoardFooterLink(groups = [], config = null) {
    const list = Array.isArray(groups) ? groups.map(group => ({
      ...group,
      links: Array.isArray(group?.links) ? group.links.slice() : [],
    })) : [];
    if (!config || config.enabled === false) return list;
    if (!Array.isArray(config.displayPlacements) || !config.displayPlacements.includes('footer_link')) return list;
    if (!config.displayPath || this.hasFooterLink(list, config.displayPath, [ 'rankings' ])) return list;

    const builtinLink = {
      id: 'builtin:rankings-footer',
      text: config.displayLabel || '榜单系统',
      url: config.displayPath || '/p/rankings',
      external: config.displayOpenInNewTab === true,
      order: Number(config.displaySort || 88),
      visible: true,
      builtin: true,
      builtinKey: 'rankings',
      displayDesktop: config.displayDesktop !== false,
      displayMobile: config.displayMobile !== false,
    };

    const targetGroup = list.find(group => group?.visible !== false) || null;
    if (targetGroup) {
      targetGroup.links.push(builtinLink);
      targetGroup.links.sort((a, b) => Number(a?.order || 0) - Number(b?.order || 0));
      return list;
    }

    return [
      ...list,
      {
        id: 'builtin:rankings-group',
        title: '榜单专区',
        order: 998,
        visible: true,
        links: [ builtinLink ],
        builtin: true,
        builtinKey: 'rankings',
      },
    ];
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
