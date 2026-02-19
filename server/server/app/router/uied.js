/**
 * @file router/uied.js
 * @description UIED 业务路由配置
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

'use strict';

module.exports = app => {
  const { router, controller } = app;
  
  // ==================== 分类管理 ====================
  router.all('/api/uied/category/list', controller.uied.category.list);
  router.all('/api/uied/category/all', controller.uied.category.all);
  router.all('/api/uied/category/detail', controller.uied.category.detail);
  router.all('/api/uied/category/add', controller.uied.category.add);
  router.all('/api/uied/category/edit', controller.uied.category.edit);
  router.all('/api/uied/category/del', controller.uied.category.del);
  router.all('/api/uied/category/sort', controller.uied.category.sort);
  
  // ==================== 网站管理 ====================
  router.all('/api/uied/website/list', controller.uied.website.list);
  router.all('/api/uied/website/detail', controller.uied.website.detail);
  router.all('/api/uied/website/add', controller.uied.website.add);
  router.all('/api/uied/website/edit', controller.uied.website.edit);
  router.all('/api/uied/website/del', controller.uied.website.del);
  router.all('/api/uied/website/batchDel', controller.uied.website.batchDel);
  router.all('/api/uied/website/click', controller.uied.website.click);
  router.all('/api/uied/website/search', controller.uied.website.search);
  
  // ==================== 页面管理 ====================
  router.all('/api/uied/page/list', controller.uied.page.list);
  router.all('/api/uied/page/all', controller.uied.page.all);
  router.all('/api/uied/page/detail', controller.uied.page.detail);
  router.all('/api/uied/page/add', controller.uied.page.add);
  router.all('/api/uied/page/edit', controller.uied.page.edit);
  router.all('/api/uied/page/del', controller.uied.page.del);
  router.all('/api/uied/page/categories', controller.uied.page.categories);
  router.all('/api/uied/page/updateCategories', controller.uied.page.updateCategories);
  
  // ==================== 热门推荐 ====================
  router.all('/api/uied/hotRecommendation/list', controller.uied.hotRecommendation.list);
  router.all('/api/uied/hotRecommendation/detail', controller.uied.hotRecommendation.detail);
  router.all('/api/uied/hotRecommendation/add', controller.uied.hotRecommendation.add);
  router.all('/api/uied/hotRecommendation/edit', controller.uied.hotRecommendation.edit);
  router.all('/api/uied/hotRecommendation/del', controller.uied.hotRecommendation.del);
  
  // ==================== 站点设置 ====================
  router.all('/api/uied/setting/get', controller.uied.setting.get);
  router.all('/api/uied/setting/save', controller.uied.setting.save);
  router.all('/api/uied/setting/siteInfo', controller.uied.setting.siteInfo);
  router.all('/api/uied/setting/saveSiteInfo', controller.uied.setting.saveSiteInfo);
  router.all('/api/uied/setting/public', controller.uied.setting.publicSettings);
  router.all('/api/uied/setting/articleConfig', controller.uied.setting.articleConfig);
  router.all('/api/uied/setting/saveArticleConfig', controller.uied.setting.saveArticleConfig);
  router.all('/api/uied/setting/articleTopicsConfig', controller.uied.setting.articleTopicsConfig);
  router.all('/api/uied/setting/saveArticleTopicsConfig', controller.uied.setting.saveArticleTopicsConfig);

  // ==================== 许可证中心 ====================
  router.all('/api/uied/license/info', controller.uied.licenseCenter.info);
  router.all('/api/uied/license/save', controller.uied.licenseCenter.save);
  router.all('/api/uied/feature/list', controller.uied.licenseCenter.featureList);
  router.all('/api/uied/feature/check', controller.uied.licenseCenter.featureCheck);
  router.all('/api/uied/feature/save', controller.uied.licenseCenter.saveFeature);
  
  // ==================== 导航菜单 ====================
  router.all('/api/uied/navMenu/list', controller.uied.navMenu.list);
  router.all('/api/uied/navMenu/all', controller.uied.navMenu.all);
  router.all('/api/uied/navMenu/detail', controller.uied.navMenu.detail);
  router.all('/api/uied/navMenu/add', controller.uied.navMenu.add);
  router.all('/api/uied/navMenu/edit', controller.uied.navMenu.edit);
  router.all('/api/uied/navMenu/del', controller.uied.navMenu.del);
  router.all('/api/uied/navMenu/sort', controller.uied.navMenu.sort);
  
  // ==================== 友情链接 ====================
  router.all('/api/uied/friendLink/list', controller.uied.friendLink.list);
  router.all('/api/uied/friendLink/detail', controller.uied.friendLink.detail);
  router.all('/api/uied/friendLink/add', controller.uied.friendLink.add);
  router.all('/api/uied/friendLink/edit', controller.uied.friendLink.edit);
  router.all('/api/uied/friendLink/del', controller.uied.friendLink.del);
  
  // ==================== 页脚设置 ====================
  router.all('/api/uied/footer/groupList', controller.uied.footer.groupList);
  router.all('/api/uied/footer/groupAll', controller.uied.footer.groupAll);
  router.all('/api/uied/footer/groupAdd', controller.uied.footer.groupAdd);
  router.all('/api/uied/footer/groupEdit', controller.uied.footer.groupEdit);
  router.all('/api/uied/footer/groupDel', controller.uied.footer.groupDel);
  router.all('/api/uied/footer/linkList', controller.uied.footer.linkList);
  router.all('/api/uied/footer/linkAdd', controller.uied.footer.linkAdd);
  router.all('/api/uied/footer/linkEdit', controller.uied.footer.linkEdit);
  router.all('/api/uied/footer/linkDel', controller.uied.footer.linkDel);
  
  // ==================== 社交媒体 ====================
  router.all('/api/uied/socialMedia/groupList', controller.uied.socialMedia.groupList);
  router.all('/api/uied/socialMedia/groupAll', controller.uied.socialMedia.groupAll);
  router.all('/api/uied/socialMedia/groupAdd', controller.uied.socialMedia.groupAdd);
  router.all('/api/uied/socialMedia/groupEdit', controller.uied.socialMedia.groupEdit);
  router.all('/api/uied/socialMedia/groupDel', controller.uied.socialMedia.groupDel);
  router.all('/api/uied/socialMedia/itemList', controller.uied.socialMedia.itemList);
  router.all('/api/uied/socialMedia/itemAdd', controller.uied.socialMedia.itemAdd);
  router.all('/api/uied/socialMedia/itemEdit', controller.uied.socialMedia.itemEdit);
  router.all('/api/uied/socialMedia/itemDel', controller.uied.socialMedia.itemDel);
  
  // ==================== 广告管理 ====================
  router.all('/api/uied/banner/list', controller.uied.banner.list);
  router.all('/api/uied/banner/detail', controller.uied.banner.detail);
  router.all('/api/uied/banner/add', controller.uied.banner.add);
  router.all('/api/uied/banner/edit', controller.uied.banner.edit);
  router.all('/api/uied/banner/del', controller.uied.banner.del);
  
  // ==================== Favicon API ====================
  router.all('/api/uied/faviconApi/list', controller.uied.faviconApi.list);
  router.all('/api/uied/faviconApi/detail', controller.uied.faviconApi.detail);
  router.all('/api/uied/faviconApi/add', controller.uied.faviconApi.add);
  router.all('/api/uied/faviconApi/edit', controller.uied.faviconApi.edit);
  router.all('/api/uied/faviconApi/del', controller.uied.faviconApi.del);
  router.all('/api/uied/faviconApi/setDefault', controller.uied.faviconApi.setDefault);
  
  // ==================== 网站标签 ====================
  router.all('/api/uied/websiteTag/list', controller.uied.websiteTag.list);
  router.all('/api/uied/websiteTag/all', controller.uied.websiteTag.all);
  router.all('/api/uied/websiteTag/detail', controller.uied.websiteTag.detail);
  router.all('/api/uied/websiteTag/add', controller.uied.websiteTag.add);
  router.all('/api/uied/websiteTag/edit', controller.uied.websiteTag.edit);
  router.all('/api/uied/websiteTag/del', controller.uied.websiteTag.del);
  router.all('/api/uied/websiteTag/websiteTags', controller.uied.websiteTag.websiteTags);
  router.all('/api/uied/websiteTag/setWebsiteTags', controller.uied.websiteTag.setWebsiteTags);
  
  // ==================== SEO 抓取 ====================
  router.all('/api/uied/seoScraper/fetch', controller.uied.seoScraper.fetch);
  
  // ==================== 网站提交 ====================
  router.all('/api/uied/submission/checkUrl', controller.uied.submission.checkUrl);
  router.all('/api/uied/submission/submit', controller.uied.submission.submit);
  router.all('/api/uied/submission/status', controller.uied.submission.status);
  router.all('/api/uied/submission/list', controller.uied.submission.list);
  router.all('/api/uied/submission/pendingCount', controller.uied.submission.pendingCount);
  router.all('/api/uied/submission/approve', controller.uied.submission.approve);
  router.all('/api/uied/submission/reject', controller.uied.submission.reject);
  router.all('/api/uied/submission/edit', controller.uied.submission.edit);
  router.all('/api/uied/submission/del', controller.uied.submission.del);
  
  // ==================== 数据导出 ====================
  router.all('/api/uied/export/websites', controller.uied.export.websites);
  router.all('/api/uied/export/categories', controller.uied.export.categories);
  router.all('/api/uied/export/all', controller.uied.export.all);
  router.all('/api/uied/export/websitesCSV', controller.uied.export.websitesCSV);
  router.all('/api/uied/export/websitesJSON', controller.uied.export.websitesJSON);
  router.all('/api/uied/export/categoriesCSV', controller.uied.export.categoriesCSV);
  router.all('/api/uied/export/categoriesJSON', controller.uied.export.categoriesJSON);
  router.all('/api/uied/export/backup', controller.uied.export.backup);
  router.all('/api/uied/export/list', controller.uied.export.list);
  router.all('/api/uied/export/download/:filename', controller.uied.export.download);
  router.all('/api/uied/export/del', controller.uied.export.del);
  
  // ==================== 操作日志 ====================
  router.all('/api/uied/operationLog/list', controller.uied.operationLog.list);
  router.all('/api/uied/operationLog/stats', controller.uied.operationLog.stats);
  router.all('/api/uied/operationLog/cleanup', controller.uied.operationLog.cleanup);
  router.all('/api/uied/operationLog/del', controller.uied.operationLog.del);
  
  // ==================== 监控 ====================
  router.all('/api/uied/monitor/statistics', controller.uied.monitor.statistics);
  router.all('/api/uied/monitor/failedWebsites', controller.uied.monitor.failedWebsites);
  router.all('/api/uied/monitor/config', controller.uied.monitor.getConfig);
  router.all('/api/uied/monitor/updateConfig', controller.uied.monitor.updateConfig);
  router.all('/api/uied/monitor/checkWebsite', controller.uied.monitor.checkWebsite);
  router.all('/api/uied/monitor/checkAll', controller.uied.monitor.checkAll);
  router.all('/api/uied/monitor/resetStatus', controller.uied.monitor.resetStatus);
  
  // ==================== AI 配置 ====================
  router.all('/api/uied/aiConfig/list', controller.uied.aiConfig.list);
  router.all('/api/uied/aiConfig/default', controller.uied.aiConfig.getDefault);
  router.all('/api/uied/aiConfig/get', controller.uied.aiConfig.get);
  router.all('/api/uied/aiConfig/save', controller.uied.aiConfig.save);
  router.all('/api/uied/aiConfig/test', controller.uied.aiConfig.test);
  router.all('/api/uied/aiConfig/add', controller.uied.aiConfig.add);
  router.all('/api/uied/aiConfig/edit', controller.uied.aiConfig.edit);
  router.all('/api/uied/aiConfig/del', controller.uied.aiConfig.del);
  router.all('/api/uied/aiConfig/generateWebsiteInfo', controller.uied.aiConfig.generateWebsiteInfo);
  router.all('/api/uied/aiConfig/generateDetailContent', controller.uied.aiConfig.generateDetailContent);
  router.all('/api/uied/aiConfig/batchGenerate', controller.uied.aiConfig.batchGenerate);
  router.all('/api/uied/aiConfig/batchConfirm', controller.uied.aiConfig.batchConfirm);
  router.all('/api/uied/aiConfig/chat', controller.uied.aiConfig.chat);
  router.all('/api/ai/chat/completions/editor', controller.uied.aiConfig.chatCompletionsEditor);
  router.all('/api/uied/aiConfig/featureToggle', controller.uied.aiConfig.featureToggle);
  router.all('/api/uied/aiConfig/saveFeatureToggle', controller.uied.aiConfig.saveFeatureToggle);
  
  // ==================== AI 使用日志 ====================
  router.all('/api/uied/aiUsageLog/list', controller.uied.aiUsageLog.list);
  router.all('/api/uied/aiUsageLog/stats', controller.uied.aiUsageLog.stats);
  
  // ==================== 文章管理 ====================
  router.all('/api/uied/article/list', controller.uied.article.list);
  router.all('/api/uied/article/detail', controller.uied.article.detail);
  router.all('/api/uied/article/add', controller.uied.article.add);
  router.all('/api/uied/article/edit', controller.uied.article.edit);
  router.all('/api/uied/article/del', controller.uied.article.del);
  router.all('/api/uied/article/batchStatus', controller.uied.article.batchStatus);
  router.all('/api/uied/article/categories', controller.uied.article.categories);
  
  // ==================== 文章标签 ====================
  router.all('/api/uied/articleTag/list', controller.uied.articleTag.list);
  router.all('/api/uied/articleTag/all', controller.uied.articleTag.all);
  router.all('/api/uied/articleTag/add', controller.uied.articleTag.add);
  router.all('/api/uied/articleTag/edit', controller.uied.articleTag.edit);
  router.all('/api/uied/articleTag/del', controller.uied.articleTag.del);
  router.all('/api/uied/articleTag/articleTags', controller.uied.articleTag.articleTags);
  router.all('/api/uied/articleTag/setArticleTags', controller.uied.articleTag.setArticleTags);
  // 兼容旧风格命名（给新前端渐进迁移使用）
  router.all('/api/uied/article/tag/list', controller.uied.articleTag.list);
  router.all('/api/uied/article/tag/all', controller.uied.articleTag.all);
  router.all('/api/uied/article/tag/add', controller.uied.articleTag.add);
  router.all('/api/uied/article/tag/edit', controller.uied.articleTag.edit);
  router.all('/api/uied/article/tag/del', controller.uied.articleTag.del);
  
  // ==================== 文章分类 ====================
  router.all('/api/uied/articleCategory/list', controller.uied.articleCategory.list);
  router.all('/api/uied/articleCategory/all', controller.uied.articleCategory.all);
  router.all('/api/uied/articleCategory/add', controller.uied.articleCategory.add);
  router.all('/api/uied/articleCategory/edit', controller.uied.articleCategory.edit);
  router.all('/api/uied/articleCategory/del', controller.uied.articleCategory.del);
  // 兼容旧风格命名（给新前端渐进迁移使用）
  router.all('/api/uied/article/cate/list', controller.uied.articleCategory.list);
  router.all('/api/uied/article/cate/all', controller.uied.articleCategory.all);
  router.all('/api/uied/article/cate/add', controller.uied.articleCategory.add);
  router.all('/api/uied/article/cate/edit', controller.uied.articleCategory.edit);
  router.all('/api/uied/article/cate/del', controller.uied.articleCategory.del);
  
  // ==================== 评论管理 ====================
  router.all('/api/uied/comment/list', controller.uied.comment.list);
  router.all('/api/uied/comment/detail', controller.uied.comment.detail);
  router.all('/api/uied/comment/approve', controller.uied.comment.approve);
  router.all('/api/uied/comment/reject', controller.uied.comment.reject);
  router.all('/api/uied/comment/del', controller.uied.comment.del);
  router.all('/api/uied/comment/pendingCount', controller.uied.comment.pendingCount);
  router.all('/api/uied/comment/stats', controller.uied.comment.stats);
  
  // ==================== 数据统计 ====================
  router.all('/api/uied/statistics/clicks', controller.uied.statistics.clicks);
  router.all('/api/uied/statistics/search', controller.uied.statistics.search);
  router.all('/api/uied/statistics/overview', controller.uied.statistics.overview);
  router.all('/api/uied/statistics/recent', controller.uied.statistics.recent);
  
  // ==================== WordPress 配置 ====================
  router.all('/api/uied/wordpress/configs', controller.uied.wordpressConfig.configList);
  router.all('/api/uied/wordpress/configs/default', controller.uied.wordpressConfig.configDefault);
  router.all('/api/uied/wordpress/configs/add', controller.uied.wordpressConfig.configAdd);
  router.all('/api/uied/wordpress/configs/edit', controller.uied.wordpressConfig.configEdit);
  router.all('/api/uied/wordpress/configs/del', controller.uied.wordpressConfig.configDel);
  router.all('/api/uied/wordpress/categories', controller.uied.wordpressConfig.categoryList);
  router.all('/api/uied/wordpress/categories/add', controller.uied.wordpressConfig.categoryAdd);
  router.all('/api/uied/wordpress/categories/edit', controller.uied.wordpressConfig.categoryEdit);
  router.all('/api/uied/wordpress/categories/del', controller.uied.wordpressConfig.categoryDel);
  router.all('/api/uied/wordpress/posts', controller.uied.wordpressConfig.posts);
};
