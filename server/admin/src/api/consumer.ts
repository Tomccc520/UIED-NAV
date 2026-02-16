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
 * 获取作者下拉选项（用于文章编辑）
 */
export function getAuthorUserOptions(params?: {
    keyword?: string
    userType?: number | ''
    pageSize?: number
}) {
    return request.get({ url: '/user/author/options', params })
}
