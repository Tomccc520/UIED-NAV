/**
 * @file api/uied.ts
 * @description UIED 业务 API 接口
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

import request from '@/utils/request'

// ==================== 分类管理 ====================

// 分类列表（分页）
export function uiedCategoryList(params?: any) {
    return request.get({ url: '/uied/category/list', params })
}

// 分类列表（全部）
export function uiedCategoryAll(params?: any) {
    return request.get({ url: '/uied/category/all', params })
}

// 分类详情
export function uiedCategoryDetail(params: any) {
    return request.get({ url: '/uied/category/detail', params })
}

// 添加分类
export function uiedCategoryAdd(params: any) {
    return request.post({ url: '/uied/category/add', params })
}

// 编辑分类
export function uiedCategoryEdit(params: any) {
    return request.post({ url: '/uied/category/edit', params })
}

// 删除分类
export function uiedCategoryDelete(params: any) {
    return request.post({ url: '/uied/category/del', params })
}

// 分类排序
export function uiedCategorySort(params: any) {
    return request.post({ url: '/uied/category/sort', params })
}

// ==================== 网站管理 ====================

// 网站列表
export function uiedWebsiteList(params?: any) {
    return request.get({ url: '/uied/website/list', params })
}

// 网站详情
export function uiedWebsiteDetail(params: any) {
    return request.get({ url: '/uied/website/detail', params })
}

// 添加网站
export function uiedWebsiteAdd(params: any) {
    return request.post({ url: '/uied/website/add', params })
}

// 编辑网站
export function uiedWebsiteEdit(params: any) {
    return request.post({ url: '/uied/website/edit', params })
}

// 删除网站
export function uiedWebsiteDelete(params: any) {
    return request.post({ url: '/uied/website/del', params })
}

// 批量删除网站
export function uiedWebsiteBatchDelete(params: any) {
    return request.post({ url: '/uied/website/batchDel', params })
}

// 网站点击统计
export function uiedWebsiteClick(params: any) {
    return request.post({ url: '/uied/website/click', params })
}

// 网站搜索
export function uiedWebsiteSearch(params?: any) {
    return request.get({ url: '/uied/website/search', params })
}

// ==================== 页面管理 ====================

// 页面列表（分页）
export function uiedPageList(params?: any) {
    return request.get({ url: '/uied/page/list', params })
}

// 页面列表（全部）
export function uiedPageAll(params?: any) {
    return request.get({ url: '/uied/page/all', params })
}

// 页面详情
export function uiedPageDetail(params: any) {
    return request.get({ url: '/uied/page/detail', params })
}

// 添加页面
export function uiedPageAdd(params: any) {
    return request.post({ url: '/uied/page/add', params })
}

// 编辑页面
export function uiedPageEdit(params: any) {
    return request.post({ url: '/uied/page/edit', params })
}

// 删除页面
export function uiedPageDelete(params: any) {
    return request.post({ url: '/uied/page/del', params })
}

// 获取页面分类
export function uiedPageCategories(params: any) {
    return request.get({ url: '/uied/page/categories', params })
}

// 更新页面分类
export function uiedPageUpdateCategories(params: any) {
    return request.post({ url: '/uied/page/updateCategories', params })
}

// ==================== 热门推荐 ====================

// 热门推荐列表
export function uiedHotRecommendationList(params?: any) {
    return request.get({ url: '/uied/hotRecommendation/list', params })
}

// 热门推荐详情
export function uiedHotRecommendationDetail(params: any) {
    return request.get({ url: '/uied/hotRecommendation/detail', params })
}

// 添加热门推荐
export function uiedHotRecommendationAdd(params: any) {
    return request.post({ url: '/uied/hotRecommendation/add', params })
}

// 编辑热门推荐
export function uiedHotRecommendationEdit(params: any) {
    return request.post({ url: '/uied/hotRecommendation/edit', params })
}

// 删除热门推荐
export function uiedHotRecommendationDelete(params: any) {
    return request.post({ url: '/uied/hotRecommendation/del', params })
}

// ==================== 站点设置 ====================

// 获取设置
export function uiedSettingGet(params?: any) {
    return request.get({ url: '/uied/setting/get', params })
}

// 保存设置
export function uiedSettingSave(params: any) {
    return request.post({ url: '/uied/setting/save', params })
}

// 获取站点信息
export function uiedSiteInfo() {
    return request.get({ url: '/uied/setting/siteInfo' })
}

// 保存站点信息
export function uiedSaveSiteInfo(params: any) {
    return request.post({ url: '/uied/setting/saveSiteInfo', params })
}

// 获取公开设置
export function uiedPublicSettings() {
    return request.get({ url: '/uied/setting/public' })
}

// 交付初始化预览（不落库）
export function uiedDeliveryInitPreview(params?: any) {
    return request.get({ url: '/uied/delivery/init/preview', params })
}

// 执行交付初始化导入
export function uiedDeliveryInitExecute(params: any) {
    return request.post({ url: '/uied/delivery/init/execute', params })
}

// 导出客户交付包
export function uiedDeliveryPackageExport(params?: any) {
    return request.get({ url: '/uied/delivery/package/export', params })
}

// 获取许可证信息
export function uiedLicenseInfo() {
    return request.get({ url: '/uied/license/info' })
}

// 保存许可证信息
export function uiedSaveLicenseInfo(params: any) {
    return request.post({ url: '/uied/license/save', params })
}

// 获取功能开关列表
export function uiedFeatureList() {
    return request.get({ url: '/uied/feature/list' })
}

// 保存功能开关
export function uiedSaveFeature(params: any) {
    return request.post({ url: '/uied/feature/save', params })
}

// 获取商业版模式配置
export function uiedCommercialModeGet() {
    return request.get({ url: '/uied/commercial/mode/get' })
}

// 保存商业版模式配置
export function uiedCommercialModeSave(params: any) {
    return request.post({ url: '/uied/commercial/mode/save', params })
}

// 获取文章公开配置
export function uiedArticleConfig() {
    return request.get({ url: '/uied/setting/articleConfig' })
}

// 保存文章公开配置
export function uiedSaveArticleConfig(params: any) {
    return request.post({ url: '/uied/setting/saveArticleConfig', params })
}

// 获取文章专题配置
export function uiedArticleTopicsConfig() {
    return request.get({ url: '/uied/setting/articleTopicsConfig' })
}

// 保存文章专题配置
export function uiedSaveArticleTopicsConfig(params: any) {
    return request.post({ url: '/uied/setting/saveArticleTopicsConfig', params })
}

// ==================== 导航菜单 ====================

export function uiedNavMenuList(params?: any) {
    return request.get({ url: '/uied/navMenu/list', params })
}

export function uiedNavMenuAll() {
    return request.get({ url: '/uied/navMenu/all' })
}

export function uiedNavMenuDetail(params: any) {
    return request.get({ url: '/uied/navMenu/detail', params })
}

export function uiedNavMenuAdd(params: any) {
    return request.post({ url: '/uied/navMenu/add', params })
}

export function uiedNavMenuEdit(params: any) {
    return request.post({ url: '/uied/navMenu/edit', params })
}

export function uiedNavMenuDelete(params: any) {
    return request.post({ url: '/uied/navMenu/del', params })
}

export function uiedNavMenuSort(params: any) {
    return request.post({ url: '/uied/navMenu/sort', params })
}

// ==================== 友情链接 ====================

export function uiedFriendLinkList(params?: any) {
    return request.get({ url: '/uied/friendLink/list', params })
}

export function uiedFriendLinkDetail(params: any) {
    return request.get({ url: '/uied/friendLink/detail', params })
}

export function uiedFriendLinkAdd(params: any) {
    return request.post({ url: '/uied/friendLink/add', params })
}

export function uiedFriendLinkEdit(params: any) {
    return request.post({ url: '/uied/friendLink/edit', params })
}

export function uiedFriendLinkDelete(params: any) {
    return request.post({ url: '/uied/friendLink/del', params })
}

// ==================== 页脚设置 ====================

export function uiedFooterGroupList(params?: any) {
    return request.get({ url: '/uied/footer/groupList', params })
}

export function uiedFooterGroupAll() {
    return request.get({ url: '/uied/footer/groupAll' })
}

export function uiedFooterGroupAdd(params: any) {
    return request.post({ url: '/uied/footer/groupAdd', params })
}

export function uiedFooterGroupEdit(params: any) {
    return request.post({ url: '/uied/footer/groupEdit', params })
}

export function uiedFooterGroupDelete(params: any) {
    return request.post({ url: '/uied/footer/groupDel', params })
}

export function uiedFooterLinkList(params?: any) {
    return request.get({ url: '/uied/footer/linkList', params })
}

export function uiedFooterLinkAdd(params: any) {
    return request.post({ url: '/uied/footer/linkAdd', params })
}

export function uiedFooterLinkEdit(params: any) {
    return request.post({ url: '/uied/footer/linkEdit', params })
}

export function uiedFooterLinkDelete(params: any) {
    return request.post({ url: '/uied/footer/linkDel', params })
}

// ==================== 社交媒体 ====================

export function uiedSocialMediaGroupList(params?: any) {
    return request.get({ url: '/uied/socialMedia/groupList', params })
}

export function uiedSocialMediaGroupAll() {
    return request.get({ url: '/uied/socialMedia/groupAll' })
}

export function uiedSocialMediaGroupAdd(params: any) {
    return request.post({ url: '/uied/socialMedia/groupAdd', params })
}

export function uiedSocialMediaGroupEdit(params: any) {
    return request.post({ url: '/uied/socialMedia/groupEdit', params })
}

export function uiedSocialMediaGroupDelete(params: any) {
    return request.post({ url: '/uied/socialMedia/groupDel', params })
}

export function uiedSocialMediaItemList(params?: any) {
    return request.get({ url: '/uied/socialMedia/itemList', params })
}

export function uiedSocialMediaItemAdd(params: any) {
    return request.post({ url: '/uied/socialMedia/itemAdd', params })
}

export function uiedSocialMediaItemEdit(params: any) {
    return request.post({ url: '/uied/socialMedia/itemEdit', params })
}

export function uiedSocialMediaItemDelete(params: any) {
    return request.post({ url: '/uied/socialMedia/itemDel', params })
}

// ==================== 广告管理 ====================

export function uiedBannerList(params?: any) {
    return request.get({ url: '/uied/banner/list', params })
}

export function uiedBannerDetail(params: any) {
    return request.get({ url: '/uied/banner/detail', params })
}

export function uiedBannerAdd(params: any) {
    return request.post({ url: '/uied/banner/add', params })
}

export function uiedBannerEdit(params: any) {
    return request.post({ url: '/uied/banner/edit', params })
}

export function uiedBannerDelete(params: any) {
    return request.post({ url: '/uied/banner/del', params })
}

// ==================== Favicon API ====================

export function uiedFaviconApiList(params?: any) {
    return request.get({ url: '/uied/faviconApi/list', params })
}

export function uiedFaviconApiDetail(params: any) {
    return request.get({ url: '/uied/faviconApi/detail', params })
}

export function uiedFaviconApiAdd(params: any) {
    return request.post({ url: '/uied/faviconApi/add', params })
}

export function uiedFaviconApiEdit(params: any) {
    return request.post({ url: '/uied/faviconApi/edit', params })
}

export function uiedFaviconApiDelete(params: any) {
    return request.post({ url: '/uied/faviconApi/del', params })
}

export function uiedFaviconApiSetDefault(params: any) {
    return request.post({ url: '/uied/faviconApi/setDefault', params })
}

// ==================== 文章标签管理 ====================

// 文章标签列表（分页）
export function uiedArticleTagList(params?: any) {
    return request.get({ url: '/uied/articleTag/list', params })
}

// 文章标签列表（全部）
export function uiedArticleTagAll() {
    return request.get({ url: '/uied/articleTag/all' })
}

// 添加文章标签
export function uiedArticleTagAdd(params: any) {
    return request.post({ url: '/uied/articleTag/add', params })
}

// 编辑文章标签
export function uiedArticleTagEdit(params: any) {
    return request.post({ url: '/uied/articleTag/edit', params })
}

// 删除文章标签
export function uiedArticleTagDelete(params: any) {
    return request.post({ url: '/uied/articleTag/del', params })
}

// ==================== 文章分类管理 ====================

// 文章分类列表（分页）
export function uiedArticleCategoryList(params?: any) {
    return request.get({ url: '/uied/articleCategory/list', params })
}

// 文章分类列表（全部）
export function uiedArticleCategoryAll() {
    return request.get({ url: '/uied/articleCategory/all' })
}

// 添加文章分类
export function uiedArticleCategoryAdd(params: any) {
    return request.post({ url: '/uied/articleCategory/add', params })
}

// 编辑文章分类
export function uiedArticleCategoryEdit(params: any) {
    return request.post({ url: '/uied/articleCategory/edit', params })
}

// 删除文章分类
export function uiedArticleCategoryDelete(params: any) {
    return request.post({ url: '/uied/articleCategory/del', params })
}

// ==================== 文章批量操作 ====================

// 文章批量状态更新
export function uiedArticleBatchStatus(params: any) {
    return request.post({ url: '/uied/article/batchStatus', params })
}

// ==================== 评论管理 ====================

// 评论列表
export function uiedCommentList(params?: any) {
    return request.get({ url: '/uied/comment/list', params })
}

// 评论审核通过
export function uiedCommentApprove(params: any) {
    return request.post({ url: '/uied/comment/approve', params })
}

// 评论审核拒绝
export function uiedCommentReject(params: any) {
    return request.post({ url: '/uied/comment/reject', params })
}

// 删除评论
export function uiedCommentDelete(params: any) {
    return request.post({ url: '/uied/comment/del', params })
}

// 待审核评论数量
export function uiedCommentPendingCount() {
    return request.get({ url: '/uied/comment/pendingCount' })
}

// 评论统计
export function uiedCommentStats() {
    return request.get({ url: '/uied/comment/stats' })
}

// ==================== AI 配置管理 ====================

// AI 配置列表
export function uiedAiConfigList() {
    return request.get({ url: '/uied/aiConfig/list' })
}

// AI 配置详情
export function uiedAiConfigDetail(params: any) {
    return request.get({ url: '/uied/aiConfig/get', params })
}

// 添加 AI 配置
export function uiedAiConfigAdd(params: any) {
    return request.post({ url: '/uied/aiConfig/add', params })
}

// 编辑 AI 配置
export function uiedAiConfigEdit(params: any) {
    return request.post({ url: '/uied/aiConfig/edit', params })
}

// 删除 AI 配置
export function uiedAiConfigDelete(params: any) {
    return request.post({ url: '/uied/aiConfig/del', params })
}

// 测试 AI 连接
export function uiedAiConfigTest(params: any) {
    return request.post({ url: '/uied/aiConfig/test', params })
}

// ==================== AI 批量生成 ====================

// 批量生成网站信息
export function uiedAiConfigBatchGenerate(params: any) {
    return request.post({ url: '/uied/aiConfig/batchGenerate', params })
}

// 确认批量生成结果
export function uiedAiConfigBatchConfirm(params: any) {
    return request.post({ url: '/uied/aiConfig/batchConfirm', params })
}

// AI 生成网站详情内容
export function uiedAiGenerateDetailContent(params: any) {
    return request.post({ url: '/uied/aiConfig/generateDetailContent', params })
}

// ==================== AI 使用日志 ====================

// AI 使用日志列表
export function uiedAiUsageLogList(params?: any) {
    return request.get({ url: '/uied/aiUsageLog/list', params })
}

// AI 使用统计
export function uiedAiUsageLogStats() {
    return request.get({ url: '/uied/aiUsageLog/stats' })
}

// ==================== AI 功能开关 ====================

// 获取 AI 功能开关
export function uiedAiFeatureToggle() {
    return request.get({ url: '/uied/aiConfig/featureToggle' })
}

// 保存 AI 功能开关
export function uiedAiSaveFeatureToggle(params: any) {
    return request.post({ url: '/uied/aiConfig/saveFeatureToggle', params })
}

// AI 对话（用于编辑器 AI 功能）
export function uiedAiChat(params: any) {
    return request.post(
        {
            url: '/uied/aiConfig/chat',
            params,
            timeout: 90 * 1000
        },
        {
            ignoreCancelToken: true
        }
    )
}

// ==================== SEO 抓取 ====================

// 抓取网站 SEO 信息（含 favicon）
export function uiedSeoScraperFetch(params: any) {
    return request.post({ url: '/uied/seoScraper/fetch', params })
}

// ==================== WordPress 标签/组件配置 ====================

// WordPress 标签列表
export function uiedWordpressTagList(params?: any) {
    return request.get({ url: '/uied/wordpress/tags', params })
}

// 新增 WordPress 标签
export function uiedWordpressTagAdd(params: any) {
    return request.post({ url: '/uied/wordpress/tags/add', params })
}

// 编辑 WordPress 标签
export function uiedWordpressTagEdit(params: any) {
    return request.post({ url: '/uied/wordpress/tags/edit', params })
}

// 删除 WordPress 标签
export function uiedWordpressTagDel(params: any) {
    return request.post({ url: '/uied/wordpress/tags/del', params })
}

// WordPress 组件列表
export function uiedWordpressWidgetList(params?: any) {
    return request.get({ url: '/uied/wordpress/widgets', params })
}

// 新增 WordPress 组件
export function uiedWordpressWidgetAdd(params: any) {
    return request.post({ url: '/uied/wordpress/widgets/add', params })
}

// 编辑 WordPress 组件
export function uiedWordpressWidgetEdit(params: any) {
    return request.post({ url: '/uied/wordpress/widgets/edit', params })
}

// 删除 WordPress 组件
export function uiedWordpressWidgetDel(params: any) {
    return request.post({ url: '/uied/wordpress/widgets/del', params })
}

// ==================== 每日热榜 ====================

// 获取每日热榜配置
export function uiedDailyHotConfigGet() {
    return request.get({ url: '/uied/dailyHot/config/get' })
}

// 保存每日热榜配置
export function uiedDailyHotConfigSave(params: any) {
    return request.post({ url: '/uied/dailyHot/config/save', params })
}

// 获取热榜平台列表
export function uiedDailyHotPlatforms(params?: any) {
    return request.get({ url: '/uied/dailyHot/platforms', params })
}

// 获取热榜平台配置列表（持久化）
export function uiedDailyHotPlatformConfigList(params?: any) {
    return request.get({ url: '/uied/dailyHot/platformConfig/list', params })
}

// 保存热榜平台配置（支持批量）
export function uiedDailyHotPlatformConfigSave(params: any) {
    return request.post({ url: '/uied/dailyHot/platformConfig/save', params })
}

// 删除热榜平台配置
export function uiedDailyHotPlatformConfigDel(params: any) {
    return request.post({ url: '/uied/dailyHot/platformConfig/del', params })
}

// 获取每日热榜后台字段草案
export function uiedDailyHotSchema() {
    return request.get({ url: '/uied/dailyHot/schema' })
}

// 获取今日热榜聚合数据
export function uiedDailyHotList(params?: any) {
    return request.get({ url: '/uied/dailyHot/list', params })
}

// 刷新今日热榜缓存
export function uiedDailyHotRefresh(params?: any) {
    return request.get({ url: '/uied/dailyHot/refresh', params })
}

// ==================== 榜单系统 ====================

// 获取榜单配置列表
export function uiedRankBoardConfigList(params?: any) {
    return request.get({ url: '/uied/rankBoard/config/list', params })
}

// 保存榜单配置
export function uiedRankBoardConfigSave(params: any) {
    return request.post({ url: '/uied/rankBoard/config/save', params })
}

// 获取榜单聚合结果
export function uiedRankBoardList(params?: any) {
    return request.get({ url: '/uied/rankBoard/list', params })
}

// 预览单个榜单
export function uiedRankBoardPreview(params?: any) {
    return request.get({ url: '/uied/rankBoard/preview', params })
}

// 获取榜单字段草案
export function uiedRankBoardSchema() {
    return request.get({ url: '/uied/rankBoard/schema' })
}

// ==================== 专题页工厂 ====================

// 专题模板列表
export function uiedTopicFactoryTemplateList(params?: any) {
    return request.get({ url: '/uied/topicFactory/template/list', params })
}

// 专题模板详情
export function uiedTopicFactoryTemplateDetail(params?: any) {
    return request.get({ url: '/uied/topicFactory/template/detail', params })
}

// 保存专题模板
export function uiedTopicFactoryTemplateSave(params: any) {
    return request.post({ url: '/uied/topicFactory/template/save', params })
}

// 删除专题模板
export function uiedTopicFactoryTemplateDel(params: any) {
    return request.post({ url: '/uied/topicFactory/template/del', params })
}

// 预览专题创建结果
export function uiedTopicFactoryPreview(params?: any) {
    return request.get({ url: '/uied/topicFactory/preview', params })
}

// 一键创建专题页
export function uiedTopicFactoryCreate(params: any) {
    return request.post({ url: '/uied/topicFactory/createFromTemplate', params })
}

// 获取专题页工厂字段草案
export function uiedTopicFactorySchema() {
    return request.get({ url: '/uied/topicFactory/schema' })
}

// ==================== 投稿激励闭环 ====================

// 获取投稿激励设置
export function uiedContributionSettingsGet() {
    return request.get({ url: '/uied/contribution/settings/get' })
}

// 保存投稿激励设置
export function uiedContributionSettingsSave(params: any) {
    return request.post({ url: '/uied/contribution/settings/save', params })
}

// 获取勋章列表
export function uiedContributionBadgeList(params?: any) {
    return request.get({ url: '/uied/contribution/badge/list', params })
}

// 保存勋章
export function uiedContributionBadgeSave(params: any) {
    return request.post({ url: '/uied/contribution/badge/save', params })
}

// 删除勋章
export function uiedContributionBadgeDel(params: any) {
    return request.post({ url: '/uied/contribution/badge/del', params })
}

// 获取推荐位列表
export function uiedContributionFeaturedList(params?: any) {
    return request.get({ url: '/uied/contribution/featured/list', params })
}

// 保存推荐位
export function uiedContributionFeaturedSave(params: any) {
    return request.post({ url: '/uied/contribution/featured/save', params })
}

// 删除推荐位
export function uiedContributionFeaturedDel(params: any) {
    return request.post({ url: '/uied/contribution/featured/del', params })
}

// 获取激励用户列表
export function uiedContributionUserList(params?: any) {
    return request.get({ url: '/uied/contribution/user/list', params })
}

// 获取激励用户详情
export function uiedContributionUserDetail(params: any) {
    return request.get({ url: '/uied/contribution/user/detail', params })
}

// 获取积分日志
export function uiedContributionLogList(params?: any) {
    return request.get({ url: '/uied/contribution/log/list', params })
}

// 获取排行榜
export function uiedContributionLeaderboard(params?: any) {
    return request.get({ url: '/uied/contribution/leaderboard', params })
}

// 获取字段草案
export function uiedContributionSchema() {
    return request.get({ url: '/uied/contribution/schema' })
}

// ==================== 商业位体系 ====================

// 广告位配置列表
export function uiedCommercialSlotList(params?: any) {
    return request.get({ url: '/uied/commercialSlot/slot/list', params })
}

// 保存广告位配置
export function uiedCommercialSlotSave(params: any) {
    return request.post({ url: '/uied/commercialSlot/slot/save', params })
}

// 删除广告位配置
export function uiedCommercialSlotDel(params: any) {
    return request.post({ url: '/uied/commercialSlot/slot/del', params })
}

// 投放记录列表
export function uiedCommercialBookingList(params?: any) {
    return request.get({ url: '/uied/commercialSlot/booking/list', params })
}

// 保存投放记录
export function uiedCommercialBookingSave(params: any) {
    return request.post({ url: '/uied/commercialSlot/booking/save', params })
}

// 删除投放记录
export function uiedCommercialBookingDel(params: any) {
    return request.post({ url: '/uied/commercialSlot/booking/del', params })
}

// 字段草案
export function uiedCommercialSlotSchema() {
    return request.get({ url: '/uied/commercialSlot/schema' })
}
