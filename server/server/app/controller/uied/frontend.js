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
      ctx.body = { success: true, data: websites };
    } catch (error) {
      ctx.logger.error('获取相关推荐失败:', error);
      ctx.status = 500;
      ctx.body = { success: false, error: error.message };
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
      ctx.body = { success: true };
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
      ctx.body = {
        success: true,
        data: config || {},
      };
    } catch (error) {
      ctx.logger.error('获取详情页配置失败:', error);
      ctx.body = { success: true, data: {} };
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
      ctx.body = { success: true, data: tags || [] };
    } catch (error) {
      ctx.logger.error('获取网站标签失败:', error);
      ctx.body = { success: true, data: [] };
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
      ctx.body = {
        success: true,
        data: config || { structure: 'plain', customPattern: '' },
      };
    } catch (error) {
      ctx.logger.error('获取固定链接配置失败:', error);
      ctx.body = {
        success: true,
        data: { structure: 'plain', customPattern: '' },
      };
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
      ctx.body = { success: true, data: apis };
    } catch (error) {
      ctx.logger.error('获取 Favicon API 列表失败:', error);
      ctx.body = { success: true, data: [] };
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
      ctx.body = { success: true };
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
      const transformMenu = (menu) => ({
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
      ctx.body = { success: true, data: result };
    } catch (error) {
      ctx.logger.error('获取激活广告失败:', error);
      ctx.status = 500;
      ctx.body = { success: false, error: error.message };
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
      ctx.body = { success: true };
    } catch (error) {
      ctx.logger.error('记录广告点击失败:', error);
      ctx.status = 500;
      ctx.body = { success: false, error: error.message };
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
   * 获取文章列表（前端）
   * GET /api/articles
   */
  async articles() {
    const { ctx } = this;
    const { page = 1, pageSize = 10, category, tag } = ctx.query;
    
    try {
      const result = await ctx.service.uied.article.publicList({ page, pageSize, category, tag });
      ctx.body = {
        success: true,
        data: result.lists,
        total: result.total,
        page: result.page,
        pageSize: result.pageSize,
        totalPages: Math.ceil(result.total / result.pageSize),
      };
    } catch (error) {
      ctx.logger.error('获取文章列表失败:', error);
      ctx.status = 500;
      ctx.body = { success: false, error: error.message };
    }
  }

  /**
   * 获取文章分类（前端）
   * GET /api/articles/categories
   */
  async articleCategories() {
    const { ctx } = this;
    
    try {
      const categories = await ctx.service.uied.article.categories();
      ctx.body = {
        success: true,
        data: categories,
      };
    } catch (error) {
      ctx.logger.error('获取文章分类失败:', error);
      ctx.status = 500;
      ctx.body = { success: false, error: error.message };
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
      const article = await ctx.service.uied.article.detailBySlug(slug);
      if (!article) {
        ctx.status = 404;
        ctx.body = { success: false, error: '文章不存在' };
        return;
      }
      ctx.body = {
        success: true,
        data: article,
      };
    } catch (error) {
      ctx.logger.error('获取文章详情失败:', error);
      ctx.status = 500;
      ctx.body = { success: false, error: error.message };
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
      await ctx.service.uied.article.recordView(id);
      ctx.body = { success: true };
    } catch (error) {
      ctx.logger.error('记录文章浏览失败:', error);
      ctx.status = 500;
      ctx.body = { success: false, error: error.message };
    }
  }

  /**
   * 获取文章标签（前端）
   * GET /api/articles/meta/tags
   */
  async articleTags() {
    const { ctx } = this;
    
    try {
      const tags = await ctx.service.uied.article.tags();
      ctx.body = {
        success: true,
        data: tags,
      };
    } catch (error) {
      ctx.logger.error('获取文章标签失败:', error);
      ctx.status = 500;
      ctx.body = { success: false, error: error.message };
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
      const result = await ctx.service.uied.comment.articleComments(id, { page, pageSize });
      ctx.body = {
        success: true,
        data: result.lists,
        total: result.total,
        page: result.page,
        pageSize: result.pageSize,
      };
    } catch (error) {
      ctx.logger.error('获取文章评论失败:', error);
      ctx.status = 500;
      ctx.body = { success: false, error: error.message };
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
      // 验证评论内容
      if (!text || text.trim().length === 0) {
        ctx.status = 400;
        ctx.body = { success: false, error: '评论内容不能为空' };
        return;
      }
      
      if (text.length > 1000) {
        ctx.status = 400;
        ctx.body = { success: false, error: '评论内容不能超过1000字符' };
        return;
      }
      
      const comment = await ctx.service.uied.comment.addArticleComment({
        articleId: id,
        content: text.trim(),
        userId: userId || 'anonymous',
        userName: userName || '匿名用户',
      });
      
      ctx.body = {
        success: true,
        data: comment,
      };
    } catch (error) {
      ctx.logger.error('提交文章评论失败:', error);
      ctx.status = 500;
      ctx.body = { success: false, error: error.message };
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
      
      ctx.body = { success: true, data: tree };
    } catch (error) {
      ctx.logger.error('获取分类列表失败:', error);
      ctx.status = 500;
      ctx.body = { success: false, error: error.message };
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
        [category] = await ctx.app.model.query(
          `SELECT id, name, slug, icon, color, description,
                  seo_title as seoTitle, seo_description as seoDescription, seo_keywords as seoKeywords,
                  parent_id as parentId
           FROM uied_category WHERE id = ? AND is_delete = 0`,
          { replacements: [idOrSlug], type: ctx.app.Sequelize.QueryTypes.SELECT }
        );
      }
      if (!category) {
        [category] = await ctx.app.model.query(
          `SELECT id, name, slug, icon, color, description,
                  seo_title as seoTitle, seo_description as seoDescription, seo_keywords as seoKeywords,
                  parent_id as parentId
           FROM uied_category WHERE slug = ? AND is_delete = 0`,
          { replacements: [idOrSlug], type: ctx.app.Sequelize.QueryTypes.SELECT }
        );
      }
      
      if (!category) {
        ctx.status = 404;
        ctx.body = { success: false, error: '分类不存在' };
        return;
      }
      
      // 收集该分类及其子分类的所有ID
      const subCategories = await ctx.app.model.query(
        `SELECT id, name, slug FROM uied_category
         WHERE parent_id = ? AND is_delete = 0 AND is_show = 1
         ORDER BY sort ASC`,
        { replacements: [category.id], type: ctx.app.Sequelize.QueryTypes.SELECT }
      );
      
      const allCategoryIds = [category.id, ...subCategories.map(s => s.id)];
      const placeholders = allCategoryIds.map(() => '?').join(',');
      
      // 获取网站总数
      const [countResult] = await ctx.app.model.query(
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
        { replacements: [...allCategoryIds, parseInt(pageSize), offset], type: ctx.app.Sequelize.QueryTypes.SELECT }
      );
      
      // 获取父分类信息
      let parentCategory = null;
      if (category.parentId) {
        [parentCategory] = await ctx.app.model.query(
          `SELECT id, name, slug FROM uied_category WHERE id = ? AND is_delete = 0`,
          { replacements: [category.parentId], type: ctx.app.Sequelize.QueryTypes.SELECT }
        );
      }
      
      ctx.body = {
        success: true,
        data: {
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
        },
      };
    } catch (error) {
      ctx.logger.error('获取分类详情失败:', error);
      ctx.status = 500;
      ctx.body = { success: false, error: error.message };
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
      
      ctx.body = {
        success: true,
        data: tags.map(t => ({
          id: String(t.id),
          name: t.name,
          slug: t.slug,
          color: t.color,
          description: t.description,
          seoTitle: t.seoTitle,
          seoDescription: t.seoDescription,
          seoKeywords: t.seoKeywords,
          websiteCount: t.websiteCount || 0,
        })),
      };
    } catch (error) {
      ctx.logger.error('获取标签列表失败:', error);
      ctx.status = 500;
      ctx.body = { success: false, error: error.message };
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
        [tag] = await ctx.app.model.query(
          `SELECT id, name, slug, color, description,
                  seo_title as seoTitle, seo_description as seoDescription, seo_keywords as seoKeywords
           FROM uied_website_tag WHERE id = ? AND is_delete = 0`,
          { replacements: [idOrSlug], type: ctx.app.Sequelize.QueryTypes.SELECT }
        );
      }
      if (!tag) {
        [tag] = await ctx.app.model.query(
          `SELECT id, name, slug, color, description,
                  seo_title as seoTitle, seo_description as seoDescription, seo_keywords as seoKeywords
           FROM uied_website_tag WHERE slug = ? AND is_delete = 0`,
          { replacements: [idOrSlug], type: ctx.app.Sequelize.QueryTypes.SELECT }
        );
      }
      
      if (!tag) {
        ctx.status = 404;
        ctx.body = { success: false, error: '标签不存在' };
        return;
      }
      
      // 获取网站总数
      const [countResult] = await ctx.app.model.query(
        `SELECT COUNT(*) as total FROM uied_website_tag_relation r
         INNER JOIN uied_website w ON r.website_id = w.id
         WHERE r.tag_id = ? AND w.is_delete = 0`,
        { replacements: [tag.id], type: ctx.app.Sequelize.QueryTypes.SELECT }
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
        { replacements: [tag.id, parseInt(pageSize), offset], type: ctx.app.Sequelize.QueryTypes.SELECT }
      );
      
      ctx.body = {
        success: true,
        data: {
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
        },
      };
    } catch (error) {
      ctx.logger.error('获取标签详情失败:', error);
      ctx.status = 500;
      ctx.body = { success: false, error: error.message };
    }
  }

  /**
   * 安全解析 JSON
   */
  safeJsonParse(str, defaultValue = []) {
    if (!str) return defaultValue;
    try {
      return JSON.parse(str);
    } catch {
      if (typeof str === 'string') {
        return str.split(',').map(s => s.trim()).filter(Boolean);
      }
      return defaultValue;
    }
  }
}

module.exports = FrontendController;
