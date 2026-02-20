/**
 * @file router/frontend.js
 * @description 前端兼容路由 - 提供与原 Express API 兼容的路由
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

'use strict';

module.exports = app => {
  const { router, controller } = app;
  const frontendNormalize = app.middleware.frontendResponseNormalizer();
  const legacyRouteGuard = app.middleware.commercialLegacyRouteGuard();
  /**
   * 注册前台 GET 路由（统一挂载响应归一化中间件）
   */
  const get = (path, action) => router.get(path, frontendNormalize, action);
  /**
   * 注册前台 POST 路由（统一挂载响应归一化中间件）
   */
  const post = (path, action) => router.post(path, frontendNormalize, action);
  /**
   * 注册前台 DELETE 路由（统一挂载响应归一化中间件）
   */
  const del = (path, action) => router.delete(path, frontendNormalize, action);
  /**
   * 注册旧兼容 GET 路由（可被严格商业版模式一键关闭）
   */
  const getLegacy = (path, action) => router.get(path, legacyRouteGuard, frontendNormalize, action);
  /**
   * 注册旧兼容 POST 路由（可被严格商业版模式一键关闭）
   */
  const postLegacy = (path, action) => router.post(path, legacyRouteGuard, frontendNormalize, action);
  /**
   * 注册旧兼容 DELETE 路由（可被严格商业版模式一键关闭）
   */
  const delLegacy = (path, action) => router.delete(path, legacyRouteGuard, frontendNormalize, action);
  
  // ==================== 页面相关 ====================
  // GET /api/pages - 获取所有页面
  get('/api/pages', controller.uied.frontend.pages);
  
  // GET /api/pages/:slug - 获取单个页面配置
  get('/api/pages/:slug', controller.uied.frontend.pageDetail);
  
  // GET /api/pages/:slug/full - 获取页面完整数据
  get('/api/pages/:slug/full', controller.uied.frontend.pageFullData);
  // GET /api/pages/:slug/stats - 获取页面统计（兼容旧前端）
  get('/api/pages/:slug/stats', controller.uied.frontend.pageStats);
  
  // GET /api/pages/:slug/hot - 获取页面热门推荐
  get('/api/pages/:slug/hot', controller.uied.frontend.pageHotWebsites);
  
  // GET /api/pages/:slug/hot-tags - 获取页面热门标签
  get('/api/pages/:slug/hot-tags', controller.uied.frontend.pageHotTags);
  
  // GET /api/pages/:slug/search - 搜索页面内的网站
  get('/api/pages/:slug/search', controller.uied.frontend.pageSearch);
  
  // ==================== 网站相关 ====================
  // GET /api/websites - 获取网站列表（支持通过 ids 参数批量获取）
  get('/api/websites', controller.uied.frontend.websites);
  // GET /api/websites/featured/list - 获取精选网站（兼容旧前端）
  get('/api/websites/featured/list', controller.uied.frontend.featuredWebsites);
  // GET /api/websites/hot/list - 获取热门网站（兼容旧前端）
  get('/api/websites/hot/list', controller.uied.frontend.hotWebsites);
  // GET /api/websites/:idOrSlug - 获取网站详情
  get('/api/websites/:idOrSlug', controller.uied.frontend.websiteDetail);
  // GET /api/websites/:id/related - 获取相关推荐网站
  get('/api/websites/:id/related', controller.uied.frontend.websiteRelated);
  // POST /api/websites/:id/click - 记录网站点击
  post('/api/websites/:id/click', controller.uied.frontend.websiteClick);
  // GET /api/websites/:id/comments - 获取网站评论
  get('/api/websites/:id/comments', controller.uied.frontend.websiteComments);
  // POST /api/websites/:id/comments - 发表评论
  post('/api/websites/:id/comments', controller.uied.frontend.addWebsiteComment);
  // POST /api/websites/:id/rate - 网站评分（兼容旧前端）
  post('/api/websites/:id/rate', controller.uied.frontend.websiteRate);
  // POST /api/websites/:id/favorite - 添加收藏（兼容旧前端）
  post('/api/websites/:id/favorite', controller.uied.frontend.websiteFavoriteAdd);
  // DELETE /api/websites/:id/favorite - 取消收藏（兼容旧前端）
  del('/api/websites/:id/favorite', controller.uied.frontend.websiteFavoriteDel);
  
  // ==================== 公开设置 ====================
  // GET /api/settings/public - 获取公开设置
  get('/api/settings/public', controller.uied.frontend.publicSettings);
  // GET /uied/setting/public - 获取公开设置（兼容旧前端无 /api 前缀）
  getLegacy('/uied/setting/public', controller.uied.frontend.publicSettings);
  // GET /api/settings/detailPageConfig - 获取详情页配置
  get('/api/settings/detailPageConfig', controller.uied.frontend.detailPageConfig);
  // GET /api/public/detail-sidebar-config - 获取详情侧栏配置（兼容旧前端）
  get('/api/public/detail-sidebar-config', controller.uied.frontend.detailPageConfig);
  // GET /api/settings/frontend-config - 获取前端配置
  get('/api/settings/frontend-config', controller.uied.frontend.frontendConfig);
  // GET /api/settings/permalink - 获取固定链接配置
  get('/api/settings/permalink', controller.uied.frontend.permalinkConfig);
  // GET /api/settings/favicon-apis - 获取启用的 Favicon API 列表
  get('/api/settings/favicon-apis', controller.uied.frontend.faviconApis);
  // GET /api/favicon-api/fetch - 抓取站点 favicon（兼容旧前端）
  get('/api/favicon-api/fetch', controller.uied.frontend.faviconFetch);
  // GET /api/settings/website/:id/tags - 获取网站标签
  get('/api/settings/website/:id/tags', controller.uied.frontend.websiteTags);
  
  // ==================== 前端兼容路由（原 Express API 路径）====================
  // 导航菜单
  get('/api/settings/nav-menus', controller.uied.frontend.navMenus);
  // 页脚分组
  get('/api/settings/footer-groups', controller.uied.frontend.footer);
  // 友情链接
  get('/api/settings/friend-links', controller.uied.frontend.friendLinks);
  
  // ==================== 热门推荐 ====================
  // GET /api/hot-recommendations - 获取热门推荐
  get('/api/hot-recommendations', controller.uied.frontend.hotRecommendations);
  // GET /api/hot-recommendations/active - 获取激活的热门推荐（前端调用）
  get('/api/hot-recommendations/active', controller.uied.frontend.hotRecommendationsActive);
  // POST /api/hot-recommendations/:id/click - 记录热门推荐点击
  post('/api/hot-recommendations/:id/click', controller.uied.frontend.hotRecommendationClick);

  // ==================== 前端提交与 AI 兼容接口 ====================
  // GET /api/submissions/check-url - 检查提交 URL
  get('/api/submissions/check-url', controller.uied.submission.checkUrl);
  // POST /api/submissions - 前端提交网站
  post('/api/submissions', controller.uied.submission.submit);
  // POST /api/ai-config/generate-website-info - AI 生成网站信息
  post('/api/ai-config/generate-website-info', controller.uied.aiConfig.generateWebsiteInfo);
  // POST /api/ai-config/chat - AI 聊天
  post('/api/ai-config/chat', controller.uied.aiConfig.chat);
  // POST /api/ai-config/smart-search - AI 智能搜索（兼容旧前端）
  post('/api/ai-config/smart-search', controller.uied.frontend.aiSearch);
  // POST /api/ai-search - AI 智能搜索（统一前端入口）
  post('/api/ai-search', controller.uied.frontend.aiSearch);
  // GET /api/wordpress/categories/active - WordPress 分类（兼容旧前端）
  get('/api/wordpress/categories/active', controller.uied.frontend.wordpressCategoriesActive);
  // GET /api/wordpress/tags - WordPress 标签（兼容旧前端）
  get('/api/wordpress/tags', controller.uied.frontend.wordpressTags);
  // GET /api/wordpress/widgets/active - WordPress 组件（兼容旧前端）
  get('/api/wordpress/widgets/active', controller.uied.frontend.wordpressWidgetsActive);
  
  // GET /api/nav-menus - 获取导航菜单
  get('/api/nav-menus', controller.uied.frontend.navMenus);
  
  // GET /api/friend-links - 获取友情链接
  get('/api/friend-links', controller.uied.frontend.friendLinks);
  
  // GET /api/footer - 获取页脚设置
  get('/api/footer', controller.uied.frontend.footer);
  
  // GET /api/social-media - 获取社交媒体
  get('/api/social-media', controller.uied.frontend.socialMedia);
  
  // GET /api/banners - 获取广告
  get('/api/banners', controller.uied.frontend.banners);
  // GET /api/banners/active - 获取激活广告
  get('/api/banners/active', controller.uied.frontend.bannersActive);
  // POST /api/banners/:id/click - 记录广告点击
  post('/api/banners/:id/click', controller.uied.frontend.bannerClick);
  
  // GET /api/site-info - 获取站点信息
  get('/api/site-info', controller.uied.frontend.siteInfo);
  
  // ==================== 分类和标签（前端公开） ====================
  // GET /api/categories - 获取分类列表（树形结构，含网站数量）
  get('/api/categories', controller.uied.frontend.categories);
  // GET /api/categories/:idOrSlug - 获取分类详情及其网站
  get('/api/categories/:idOrSlug', controller.uied.frontend.categoryDetail);
  // GET /api/tags - 获取标签列表（含网站数量）
  get('/api/tags', controller.uied.frontend.tags);
  // GET /api/tags/:idOrSlug - 获取标签详情及其网站
  get('/api/tags/:idOrSlug', controller.uied.frontend.tagDetail);

  // ==================== 文章相关（前端） ====================
  // GET /api/articles - 获取文章列表
  get('/api/articles', controller.uied.frontend.articles);
  // GET /articles - 获取文章列表（兼容旧前端无 /api 前缀）
  getLegacy('/articles', controller.uied.frontend.articles);
  // GET /api/articles/meta/categories - 获取文章分类元数据
  get('/api/articles/meta/categories', controller.uied.frontend.articleCategories);
  // GET /articles/meta/categories - 获取文章分类元数据（兼容旧前端无 /api 前缀）
  getLegacy('/articles/meta/categories', controller.uied.frontend.articleCategories);
  // GET /api/articles/meta/tags - 获取文章标签元数据
  get('/api/articles/meta/tags', controller.uied.frontend.articleTags);
  // GET /articles/meta/tags - 获取文章标签元数据（兼容旧前端无 /api 前缀）
  getLegacy('/articles/meta/tags', controller.uied.frontend.articleTags);
  // GET /api/articles/categories - 获取文章分类（兼容旧路由）
  get('/api/articles/categories', controller.uied.frontend.articleCategories);
  // GET /articles/categories - 获取文章分类（兼容旧前端无 /api 前缀）
  getLegacy('/articles/categories', controller.uied.frontend.articleCategories);
  // GET /api/articles/:slug - 获取文章详情
  get('/api/articles/:slug', controller.uied.frontend.articleDetail);
  // GET /articles/:slug - 获取文章详情（兼容旧前端无 /api 前缀）
  getLegacy('/articles/:slug', controller.uied.frontend.articleDetail);
  // POST /api/articles/:id/view - 记录文章浏览
  post('/api/articles/:id/view', controller.uied.frontend.articleView);
  // POST /articles/:id/view - 记录文章浏览（兼容旧前端无 /api 前缀）
  postLegacy('/articles/:id/view', controller.uied.frontend.articleView);
  // GET /api/articles/:id/comments - 获取文章评论
  get('/api/articles/:id/comments', controller.uied.frontend.articleComments);
  // GET /articles/:id/comments - 获取文章评论（兼容旧前端无 /api 前缀）
  getLegacy('/articles/:id/comments', controller.uied.frontend.articleComments);
  // POST /api/articles/:id/comments - 提交文章评论
  post('/api/articles/:id/comments', controller.uied.frontend.addArticleComment);
  // POST /articles/:id/comments - 提交文章评论（兼容旧前端无 /api 前缀）
  postLegacy('/articles/:id/comments', controller.uied.frontend.addArticleComment);
};
