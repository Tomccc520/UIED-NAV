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
};
