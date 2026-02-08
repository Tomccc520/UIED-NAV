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
  
  // ==================== 页面相关 ====================
  // GET /api/pages - 获取所有页面
  router.get('/api/pages', controller.uied.frontend.pages);
  
  // GET /api/pages/:slug - 获取单个页面配置
  router.get('/api/pages/:slug', controller.uied.frontend.pageDetail);
  
  // GET /api/pages/:slug/full - 获取页面完整数据
  router.get('/api/pages/:slug/full', controller.uied.frontend.pageFullData);
  
  // GET /api/pages/:slug/hot - 获取页面热门推荐
  router.get('/api/pages/:slug/hot', controller.uied.frontend.pageHotWebsites);
  
  // GET /api/pages/:slug/hot-tags - 获取页面热门标签
  router.get('/api/pages/:slug/hot-tags', controller.uied.frontend.pageHotTags);
  
  // GET /api/pages/:slug/search - 搜索页面内的网站
  router.get('/api/pages/:slug/search', controller.uied.frontend.pageSearch);
  
  // ==================== 网站相关 ====================
  // GET /api/websites - 获取网站列表（支持通过 ids 参数批量获取）
  router.get('/api/websites', controller.uied.frontend.websites);
  // GET /api/websites/:idOrSlug - 获取网站详情
  router.get('/api/websites/:idOrSlug', controller.uied.frontend.websiteDetail);
  // GET /api/websites/:id/related - 获取相关推荐网站
  router.get('/api/websites/:id/related', controller.uied.frontend.websiteRelated);
  // POST /api/websites/:id/click - 记录网站点击
  router.post('/api/websites/:id/click', controller.uied.frontend.websiteClick);
  
  // ==================== 公开设置 ====================
  // GET /api/settings/public - 获取公开设置
  router.get('/api/settings/public', controller.uied.frontend.publicSettings);
  // GET /api/settings/detailPageConfig - 获取详情页配置
  router.get('/api/settings/detailPageConfig', controller.uied.frontend.detailPageConfig);
  // GET /api/settings/frontend-config - 获取前端配置
  router.get('/api/settings/frontend-config', controller.uied.frontend.frontendConfig);
  // GET /api/settings/permalink - 获取固定链接配置
  router.get('/api/settings/permalink', controller.uied.frontend.permalinkConfig);
  // GET /api/settings/favicon-apis - 获取启用的 Favicon API 列表
  router.get('/api/settings/favicon-apis', controller.uied.frontend.faviconApis);
  // GET /api/settings/website/:id/tags - 获取网站标签
  router.get('/api/settings/website/:id/tags', controller.uied.frontend.websiteTags);
  
  // ==================== 前端兼容路由（原 Express API 路径）====================
  // 导航菜单
  router.get('/api/settings/nav-menus', controller.uied.frontend.navMenus);
  // 页脚分组
  router.get('/api/settings/footer-groups', controller.uied.frontend.footer);
  // 友情链接
  router.get('/api/settings/friend-links', controller.uied.frontend.friendLinks);
  
  // ==================== 热门推荐 ====================
  // GET /api/hot-recommendations - 获取热门推荐
  router.get('/api/hot-recommendations', controller.uied.frontend.hotRecommendations);
  // GET /api/hot-recommendations/active - 获取激活的热门推荐（前端调用）
  router.get('/api/hot-recommendations/active', controller.uied.frontend.hotRecommendationsActive);
  // POST /api/hot-recommendations/:id/click - 记录热门推荐点击
  router.post('/api/hot-recommendations/:id/click', controller.uied.frontend.hotRecommendationClick);
  
  // GET /api/nav-menus - 获取导航菜单
  router.get('/api/nav-menus', controller.uied.frontend.navMenus);
  
  // GET /api/friend-links - 获取友情链接
  router.get('/api/friend-links', controller.uied.frontend.friendLinks);
  
  // GET /api/footer - 获取页脚设置
  router.get('/api/footer', controller.uied.frontend.footer);
  
  // GET /api/social-media - 获取社交媒体
  router.get('/api/social-media', controller.uied.frontend.socialMedia);
  
  // GET /api/banners - 获取广告
  router.get('/api/banners', controller.uied.frontend.banners);
  
  // GET /api/site-info - 获取站点信息
  router.get('/api/site-info', controller.uied.frontend.siteInfo);
  
  // ==================== 分类和标签（前端公开） ====================
  // GET /api/categories - 获取分类列表（树形结构，含网站数量）
  router.get('/api/categories', controller.uied.frontend.categories);
  // GET /api/categories/:idOrSlug - 获取分类详情及其网站
  router.get('/api/categories/:idOrSlug', controller.uied.frontend.categoryDetail);
  // GET /api/tags - 获取标签列表（含网站数量）
  router.get('/api/tags', controller.uied.frontend.tags);
  // GET /api/tags/:idOrSlug - 获取标签详情及其网站
  router.get('/api/tags/:idOrSlug', controller.uied.frontend.tagDetail);

  // ==================== 文章相关（前端） ====================
  // GET /api/articles - 获取文章列表
  router.get('/api/articles', controller.uied.frontend.articles);
  // GET /api/articles/meta/categories - 获取文章分类元数据
  router.get('/api/articles/meta/categories', controller.uied.frontend.articleCategories);
  // GET /api/articles/meta/tags - 获取文章标签元数据
  router.get('/api/articles/meta/tags', controller.uied.frontend.articleTags);
  // GET /api/articles/categories - 获取文章分类（兼容旧路由）
  router.get('/api/articles/categories', controller.uied.frontend.articleCategories);
  // GET /api/articles/:slug - 获取文章详情
  router.get('/api/articles/:slug', controller.uied.frontend.articleDetail);
  // POST /api/articles/:id/view - 记录文章浏览
  router.post('/api/articles/:id/view', controller.uied.frontend.articleView);
  // GET /api/articles/:id/comments - 获取文章评论
  router.get('/api/articles/:id/comments', controller.uied.frontend.articleComments);
  // POST /api/articles/:id/comments - 提交文章评论
  router.post('/api/articles/:id/comments', controller.uied.frontend.addArticleComment);
};
