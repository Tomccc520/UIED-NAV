/**
 * @file config/features.js
 * @description 功能开关配置 - 控制开源版和商业版功能
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

/**
 * 功能列表配置
 * 定义不同版本可用的功能
 */
const FEATURES = {
  // 开源版功能（免费）
  free: [
    'website_management',      // 网站管理
    'category_management',     // 分类管理
    'page_management',         // 页面管理
    'basic_search',            // 基础搜索
    'basic_detail',            // 基础详情页
    'import_export',           // 导入导出
    'favicon_fetch',           // Favicon 获取
  ],
  
  // 个人版功能（¥699）
  // @pro-feature-start: personal-features
  personal: [
    'ratings',                 // 评分功能
    'comments',                // 评论功能
    'favorites',               // 收藏功能
    'sharing',                 // 分享功能
    'related_websites',        // 相关推荐
    'browsing_history',        // 浏览历史
    'articles',                // 文章系统
    'article_comments',        // 文章评论
    'advanced_search',         // 高级搜索
    'no_ads',                  // 去广告
  ],
  // @pro-feature-end: personal-features
  
  // 企业版功能（¥2999）
  // @pro-feature-start: enterprise-features
  enterprise: [
    'statistics',              // 数据统计
    'monitoring',              // 网站监控
    'advanced_seo',            // 高级 SEO
    'api_access',              // API 接口
    'multi_user',              // 多用户管理
    'data_export',             // 数据导出
    'custom_branding',         // 自定义品牌
  ],
  // @pro-feature-end: enterprise-features
};

/**
 * 检查许可证是否包含指定功能
 * @param {Object} license - 许可证对象 { type: 'free'|'personal'|'enterprise', features: [] }
 * @param {string} feature - 功能名称
 * @returns {boolean} 是否有权限使用该功能
 */
function hasFeature(license, feature) {
  // 如果没有许可证或许可证类型为 free，只能使用免费功能
  if (!license || license.type === 'free') {
    return FEATURES.free.includes(feature);
  }
  
  // 构建当前许可证可用的功能列表
  const availableFeatures = [
    ...FEATURES.free,
    ...FEATURES.personal,
  ];
  
  // 企业版额外包含企业功能
  if (license.type === 'enterprise') {
    availableFeatures.push(...FEATURES.enterprise);
  }
  
  return availableFeatures.includes(feature);
}

/**
 * 获取功能所需的最低版本
 * @param {string} feature - 功能名称
 * @returns {string} 版本名称
 */
function getRequiredVersion(feature) {
  if (FEATURES.enterprise.includes(feature)) {
    return '企业版';
  }
  if (FEATURES.personal.includes(feature)) {
    return '个人版';
  }
  return '开源版';
}

/**
 * 获取指定版本的所有功能
 * @param {string} licenseType - 许可证类型 'free'|'personal'|'enterprise'
 * @returns {string[]} 功能列表
 */
function getFeaturesForLicense(licenseType) {
  const features = [...FEATURES.free];
  
  if (licenseType === 'personal' || licenseType === 'enterprise') {
    features.push(...FEATURES.personal);
  }
  
  if (licenseType === 'enterprise') {
    features.push(...FEATURES.enterprise);
  }
  
  return features;
}

module.exports = {
  FEATURES,
  hasFeature,
  getRequiredVersion,
  getFeaturesForLicense,
};
