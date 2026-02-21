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
  /**
   * 按功能键创建商业版能力守卫中间件
   */
  const featureGuard = featureKey => app.middleware.commercialFeatureGuard({ featureKey });
  /**
   * 注册带能力校验的全方法路由
   */
  const allFeature = (path, featureKey, action) => router.all(path, featureGuard(featureKey), action);
  
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

  // ==================== 每日热榜 ====================
  router.all('/api/uied/dailyHot/config/get', controller.uied.dailyHot.configGet);
  router.all('/api/uied/dailyHot/config/save', controller.uied.dailyHot.configSave);
  router.all('/api/uied/dailyHot/platforms', controller.uied.dailyHot.platforms);
  router.all('/api/uied/dailyHot/platformConfig/list', controller.uied.dailyHot.platformConfigList);
  router.all('/api/uied/dailyHot/platformConfig/save', controller.uied.dailyHot.platformConfigSave);
  router.all('/api/uied/dailyHot/platformConfig/del', controller.uied.dailyHot.platformConfigDel);
  router.all('/api/uied/dailyHot/schema', controller.uied.dailyHot.schema);
  router.all('/api/uied/dailyHot/list', controller.uied.dailyHot.list);
  router.all('/api/uied/dailyHot/refresh', controller.uied.dailyHot.refresh);

  // ==================== 榜单系统 ====================
  router.all('/api/uied/rankBoard/config/list', controller.uied.rankBoard.configList);
  router.all('/api/uied/rankBoard/config/save', controller.uied.rankBoard.configSave);
  router.all('/api/uied/rankBoard/list', controller.uied.rankBoard.list);
  router.all('/api/uied/rankBoard/preview', controller.uied.rankBoard.preview);
  router.all('/api/uied/rankBoard/schema', controller.uied.rankBoard.schema);
  
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

  // ==================== 交付初始化向导 ====================
  router.all('/api/uied/delivery/init/preview', controller.uied.deliveryInit.preview);
  router.all('/api/uied/delivery/init/execute', controller.uied.deliveryInit.execute);
  router.all('/api/uied/delivery/package/export', controller.uied.deliveryInit.exportPackage);

  // ==================== 许可证中心 ====================
  router.all('/api/uied/license/info', controller.uied.licenseCenter.info);
  router.all('/api/uied/license/save', controller.uied.licenseCenter.save);
  router.all('/api/uied/license/sign', controller.uied.licenseCenter.sign);
  router.all('/api/uied/license/verify', controller.uied.licenseCenter.verify);
  router.all('/api/uied/feature/list', controller.uied.licenseCenter.featureList);
  router.all('/api/uied/feature/check', controller.uied.licenseCenter.featureCheck);
  router.all('/api/uied/feature/save', controller.uied.licenseCenter.saveFeature);
  router.all('/api/uied/commercial/mode/get', controller.uied.licenseCenter.commercialMode);
  router.all('/api/uied/commercial/mode/save', controller.uied.licenseCenter.saveCommercialMode);
  router.all('/api/uied/commercial/overview', controller.uied.licenseCenter.overview);
  
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
  allFeature('/api/uied/monitor/statistics', 'monitoring', controller.uied.monitor.statistics);
  allFeature('/api/uied/monitor/failedWebsites', 'monitoring', controller.uied.monitor.failedWebsites);
  allFeature('/api/uied/monitor/config', 'monitoring', controller.uied.monitor.getConfig);
  allFeature('/api/uied/monitor/updateConfig', 'monitoring', controller.uied.monitor.updateConfig);
  allFeature('/api/uied/monitor/checkWebsite', 'monitoring', controller.uied.monitor.checkWebsite);
  allFeature('/api/uied/monitor/checkAll', 'monitoring', controller.uied.monitor.checkAll);
  allFeature('/api/uied/monitor/resetStatus', 'monitoring', controller.uied.monitor.resetStatus);
  
  // ==================== AI 配置 ====================
  allFeature('/api/uied/aiConfig/list', 'ai_assistant', controller.uied.aiConfig.list);
  allFeature('/api/uied/aiConfig/default', 'ai_assistant', controller.uied.aiConfig.getDefault);
  allFeature('/api/uied/aiConfig/get', 'ai_assistant', controller.uied.aiConfig.get);
  // 兼容旧 API：detail 与 get 指向同一实现
  allFeature('/api/uied/aiConfig/detail', 'ai_assistant', controller.uied.aiConfig.get);
  allFeature('/api/uied/aiConfig/save', 'ai_assistant', controller.uied.aiConfig.save);
  allFeature('/api/uied/aiConfig/test', 'ai_assistant', controller.uied.aiConfig.test);
  allFeature('/api/uied/aiConfig/add', 'ai_assistant', controller.uied.aiConfig.add);
  allFeature('/api/uied/aiConfig/edit', 'ai_assistant', controller.uied.aiConfig.edit);
  allFeature('/api/uied/aiConfig/del', 'ai_assistant', controller.uied.aiConfig.del);
  allFeature('/api/uied/aiConfig/generateWebsiteInfo', 'ai_assistant', controller.uied.aiConfig.generateWebsiteInfo);
  allFeature('/api/uied/aiConfig/generateDetailContent', 'ai_assistant', controller.uied.aiConfig.generateDetailContent);
  allFeature('/api/uied/aiConfig/batchGenerate', 'ai_assistant', controller.uied.aiConfig.batchGenerate);
  allFeature('/api/uied/aiConfig/batchConfirm', 'ai_assistant', controller.uied.aiConfig.batchConfirm);
  allFeature('/api/uied/aiConfig/chat', 'ai_assistant', controller.uied.aiConfig.chat);
  allFeature('/api/ai/chat/completions/editor', 'ai_assistant', controller.uied.aiConfig.chatCompletionsEditor);
  allFeature('/api/uied/aiConfig/featureToggle', 'ai_assistant', controller.uied.aiConfig.featureToggle);
  allFeature('/api/uied/aiConfig/saveFeatureToggle', 'ai_assistant', controller.uied.aiConfig.saveFeatureToggle);
  
  // ==================== AI 使用日志 ====================
  allFeature('/api/uied/aiUsageLog/list', 'ai_assistant', controller.uied.aiUsageLog.list);
  allFeature('/api/uied/aiUsageLog/stats', 'ai_assistant', controller.uied.aiUsageLog.stats);
  
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
  allFeature('/api/uied/comment/list', 'comments', controller.uied.comment.list);
  allFeature('/api/uied/comment/detail', 'comments', controller.uied.comment.detail);
  allFeature('/api/uied/comment/approve', 'comments', controller.uied.comment.approve);
  allFeature('/api/uied/comment/reject', 'comments', controller.uied.comment.reject);
  allFeature('/api/uied/comment/del', 'comments', controller.uied.comment.del);
  allFeature('/api/uied/comment/pendingCount', 'comments', controller.uied.comment.pendingCount);
  allFeature('/api/uied/comment/stats', 'comments', controller.uied.comment.stats);
  
  // ==================== 数据统计 ====================
  allFeature('/api/uied/statistics/clicks', 'data_statistics', controller.uied.statistics.clicks);
  allFeature('/api/uied/statistics/search', 'data_statistics', controller.uied.statistics.search);
  allFeature('/api/uied/statistics/overview', 'data_statistics', controller.uied.statistics.overview);
  allFeature('/api/uied/statistics/recent', 'data_statistics', controller.uied.statistics.recent);
  
  // ==================== WordPress 配置 ====================
  allFeature('/api/uied/wordpress/configs', 'wordpress_channel', controller.uied.wordpressConfig.configList);
  allFeature('/api/uied/wordpress/configs/default', 'wordpress_channel', controller.uied.wordpressConfig.configDefault);
  allFeature('/api/uied/wordpress/configs/add', 'wordpress_channel', controller.uied.wordpressConfig.configAdd);
  allFeature('/api/uied/wordpress/configs/edit', 'wordpress_channel', controller.uied.wordpressConfig.configEdit);
  allFeature('/api/uied/wordpress/configs/del', 'wordpress_channel', controller.uied.wordpressConfig.configDel);
  allFeature('/api/uied/wordpress/categories', 'wordpress_channel', controller.uied.wordpressConfig.categoryList);
  allFeature('/api/uied/wordpress/categories/add', 'wordpress_channel', controller.uied.wordpressConfig.categoryAdd);
  allFeature('/api/uied/wordpress/categories/edit', 'wordpress_channel', controller.uied.wordpressConfig.categoryEdit);
  allFeature('/api/uied/wordpress/categories/del', 'wordpress_channel', controller.uied.wordpressConfig.categoryDel);
  allFeature('/api/uied/wordpress/tags', 'wordpress_channel', controller.uied.wordpressConfig.tagList);
  allFeature('/api/uied/wordpress/tags/add', 'wordpress_channel', controller.uied.wordpressConfig.tagAdd);
  allFeature('/api/uied/wordpress/tags/edit', 'wordpress_channel', controller.uied.wordpressConfig.tagEdit);
  allFeature('/api/uied/wordpress/tags/del', 'wordpress_channel', controller.uied.wordpressConfig.tagDel);
  allFeature('/api/uied/wordpress/widgets', 'wordpress_channel', controller.uied.wordpressConfig.widgetList);
  allFeature('/api/uied/wordpress/widgets/add', 'wordpress_channel', controller.uied.wordpressConfig.widgetAdd);
  allFeature('/api/uied/wordpress/widgets/edit', 'wordpress_channel', controller.uied.wordpressConfig.widgetEdit);
  allFeature('/api/uied/wordpress/widgets/del', 'wordpress_channel', controller.uied.wordpressConfig.widgetDel);
  allFeature('/api/uied/wordpress/posts', 'wordpress_channel', controller.uied.wordpressConfig.posts);
};
