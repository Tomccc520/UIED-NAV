import request from '@/utils/request'

// 文章分类列表
export function articleCateLists(params?: any) {
    return request.get({ url: '/article/cate/list', params })
}
// 文章分类列表
export function articleCateAll(params?: any) {
    return request.get({ url: '/article/cate/all', params })
}

// 添加文章分类
export function articleCateAdd(params: any) {
    return request.post({ url: '/article/cate/add', params })
}

// 编辑文章分类
export function articleCateEdit(params: any) {
    return request.post({ url: '/article/cate/edit', params })
}

// 删除文章分类
export function articleCateDelete(params: any) {
    return request.post({ url: '/article/cate/del', params })
}

// 文章分类详情
export function articleCateDetail(params: any) {
    return request.get({ url: '/article/cate/detail', params })
}

// 文章分类状态
export function articleCateStatus(params: any) {
    return request.post({ url: '/article/cate/change', params })
}

// 文章列表
export function articleLists(params?: any) {
    return request.get({ url: '/article/list', params })
}
// 文章列表
export function articleAll(params?: any) {
    return request.get({ url: '/article/all', params })
}

// 添加文章
export function articleAdd(params: any) {
    return request.post({ url: '/article/add', params })
}

// 编辑文章
export function articleEdit(params: any) {
    return request.post({ url: '/article/edit', params })
}

// 删除文章
export function articleDelete(params: any) {
    return request.post({ url: '/article/del', params })
}

// 文章详情
export function articleDetail(params: any) {
    return request.get({ url: '/article/detail', params })
}

// 文章分类状态
export function articleStatus(params: any) {
    return request.post({ url: '/article/change', params })
}

export function articleTagLists(params?: any) {
    return request.get({ url: '/article/tag/list', params })
}

export function articleTagAll(params?: any) {
    return request.get({ url: '/article/tag/all', params })
}

export function articleTagAdd(params: any) {
    return request.post({ url: '/article/tag/add', params })
}

export function articleTagEdit(params: any) {
    return request.post({ url: '/article/tag/edit', params })
}

export function articleTagDelete(params: any) {
    return request.post({ url: '/article/tag/del', params })
}

export function articleTagDetail(params: any) {
    return request.get({ url: '/article/tag/detail', params })
}

export function articleTagStatus(params: any) {
    return request.post({ url: '/article/tag/change', params })
}

export function articleTagBatchStatus(params: { ids: number[] | string; isShow: 0 | 1 }) {
    return request.post({ url: '/article/tag/batch/change', params })
}

export function articleTagBatchDelete(params: { ids: number[] | string }) {
    return request.post({ url: '/article/tag/batch/del', params })
}

export function articleTagMerge(params: { fromIds: number[] | string; toId: number }) {
    return request.post({ url: '/article/tag/merge', params })
}

export function articleTopicLists(params?: any) {
    return request.get({ url: '/article/topic/list', params })
}

export function articleTopicAll(params?: any) {
    return request.get({ url: '/article/topic/all', params })
}

export function articleTopicAdd(params: any) {
    return request.post({ url: '/article/topic/add', params })
}

export function articleTopicEdit(params: any) {
    return request.post({ url: '/article/topic/edit', params })
}

export function articleTopicDelete(params: any) {
    return request.post({ url: '/article/topic/del', params })
}

export function articleTopicDetail(params: any) {
    return request.get({ url: '/article/topic/detail', params })
}

export function articleTopicStatus(params: any) {
    return request.post({ url: '/article/topic/change', params })
}

export function articleFrontAudit(params: {
    id: number
    reviewStatus: number
    reviewRemark?: string
}) {
    return request.post({ url: '/article/front/audit', params })
}

export function articleFrontAuditMessageList(params?: {
    pageNo?: number
    pageSize?: number
    reviewStatus?: number | string
}) {
    return request.get({ url: '/article/front/audit/message/list', params })
}

export function articleImportWechat(params: { url: string }) {
    return request.post({ url: '/article/import/wechat', params })
}

export function articleVisitIncr(params: { id: number }) {
    return request.post({ url: '/article/visit/incr', params })
}

export function articleCollectToggle(params: { id: number }) {
    return request.post({ url: '/article/collect/toggle', params })
}

export function articleLikeToggle(params: { id: number }) {
    return request.post({ url: '/article/like/toggle', params })
}

export function articleStats(params: { ids: string }) {
    return request.get({ url: '/article/stats', params })
}

export function articleCommentManageList(params?: any) {
    return request.get({ url: '/article/comment/manage/list', params })
}

export function articleCommentManageReplies(params?: any) {
    return request.get({ url: '/article/comment/manage/replies', params })
}

export function articleCommentManageChange(params: { id: number }) {
    return request.post({ url: '/article/comment/manage/change', params })
}

export function articleCommentTopToggle(params: { id: number }) {
    return request.post({ url: '/article/comment/top/toggle', params })
}

export function articleCommentManageDel(params: { id: number }) {
    return request.post({ url: '/article/comment/manage/del', params })
}

export function articleCommentManageBatchChange(params: { ids: number[] | string; isShow: 0 | 1 }) {
    return request.post({ url: '/article/comment/manage/batch/change', params })
}

export function articleCommentManageBatchDel(params: { ids: number[] | string }) {
    return request.post({ url: '/article/comment/manage/batch/del', params })
}

export function articleCommentSensitiveDetail() {
    return request.get({ url: '/article/comment/manage/sensitive/detail' })
}

export function articleCommentSensitiveSave(params: {
    sensitiveWords: string
    comboBlacklist?: string
    maxLinks?: number
    duplicateWindowSec?: number
    duplicateThreshold?: number
    cooldownSec?: number
    userWindowSec?: number
    userMaxCount?: number
    ipWindowSec?: number
    ipMaxCount?: number
}) {
    return request.post({ url: '/article/comment/manage/sensitive/save', params })
}

export function articleCommentReportList(params?: any) {
    return request.get({ url: '/article/comment/manage/report/list', params })
}

export function articleCommentManageReportList(params?: any) {
    return articleCommentReportList(params)
}

export function articleCommentReportHandle(params: {
    id: number
    status: 1 | 2
    action?: 'none' | 'hide_comment' | 'delete_comment'
    handleRemark?: string
}) {
    return request.post({ url: '/article/comment/manage/report/handle', params })
}

export function articleCommentManageReportHandle(params: {
    id: number
    status: 1 | 2
    action?: 'none' | 'hide_comment' | 'delete_comment'
    handleRemark?: string
}) {
    return articleCommentReportHandle(params)
}

export function articleCommentMuteList(params?: any) {
    return request.get({ url: '/article/comment/manage/mute/list', params })
}

export function articleCommentManageMuteList(params?: any) {
    return articleCommentMuteList(params)
}

export function articleCommentMuteAdd(params: {
    userId?: number
    ip?: string
    reason?: string
    durationMinutes: number
}) {
    return request.post({ url: '/article/comment/manage/mute/add', params })
}

export function articleCommentManageMuteAdd(params: {
    userId?: number
    ip?: string
    reason?: string
    durationMinutes: number
}) {
    return articleCommentMuteAdd(params)
}

export function articleCommentMuteDel(params: { id: number }) {
    return request.post({ url: '/article/comment/manage/mute/del', params })
}

export function articleCommentManageMuteDel(params: { id: number }) {
    return articleCommentMuteDel(params)
}
