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
    return request.get({ url: '/uied/aiConfig/detail', params })
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
