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
