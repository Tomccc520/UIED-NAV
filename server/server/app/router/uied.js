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
};
