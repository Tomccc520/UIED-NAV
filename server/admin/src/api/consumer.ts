import request from '@/utils/request'

// 用户列表
export function getUserList(params: any) {
    return request.get({ url: '/user/list', params })
}

// 用户详情
export function getUserDetail(params: any) {
    return request.get({ url: '/user/detail', params })
}

// 用户编辑
export function userEdit(params: any) {
    return request.post({ url: '/user/edit', params })
}

/**
 * 获取用户等级列表
 */
export function getUserLevelList() {
    return request.get({ url: '/user/level/list' })
}

/**
 * 获取用户分组列表
 */
export function getUserGroupList() {
    return request.get({ url: '/user/group/list' })
}

/**
 * 获取用户标签列表
 */
export function getUserTagList() {
    return request.get({ url: '/user/tag/list' })
}

/**
 * 新增用户等级
 */
export function addUserLevel(params: any) {
    return request.post({ url: '/user/level/add', params })
}

/**
 * 编辑用户等级
 */
export function editUserLevel(params: any) {
    return request.post({ url: '/user/level/edit', params })
}

/**
 * 删除用户等级
 */
export function delUserLevel(params: any) {
    return request.post({ url: '/user/level/del', params })
}

/**
 * 初始化测试用户
 */
export function seedUserTestUsers() {
    return request.post({ url: '/user/seed/testUsers' })
}

/**
 * 获取作者下拉选项（用于文章编辑）
 */
export function getAuthorUserOptions(params?: {
    keyword?: string
    userType?: number | ''
    pageSize?: number
}) {
    return request.get({ url: '/user/author/options', params })
}
