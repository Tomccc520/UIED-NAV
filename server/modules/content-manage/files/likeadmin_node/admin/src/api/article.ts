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

// 文章标签列表
export function articleTagLists(params?: any) {
    return request.get({ url: '/article/tag/list', params })
}
// 文章标签下拉
export function articleTagAll(params?: any) {
    return request.get({ url: '/article/tag/all', params })
}
// 添加文章标签
export function articleTagAdd(params: any) {
    return request.post({ url: '/article/tag/add', params })
}
// 编辑文章标签
export function articleTagEdit(params: any) {
    return request.post({ url: '/article/tag/edit', params })
}
// 删除文章标签
export function articleTagDelete(params: any) {
    return request.post({ url: '/article/tag/del', params })
}
// 文章标签详情
export function articleTagDetail(params: any) {
    return request.get({ url: '/article/tag/detail', params })
}
// 文章标签状态
export function articleTagStatus(params: any) {
    return request.post({ url: '/article/tag/change', params })
}
// 文章标签批量状态
export function articleTagBatchStatus(params: { ids: number[] | string; isShow: 0 | 1 }) {
    return request.post({ url: '/article/tag/batch/change', params })
}
// 文章标签批量删除
export function articleTagBatchDelete(params: { ids: number[] | string }) {
    return request.post({ url: '/article/tag/batch/del', params })
}
// 文章标签合并
export function articleTagMerge(params: { fromIds: number[] | string; toId: number }) {
    return request.post({ url: '/article/tag/merge', params })
}

// 文章专题列表
export function articleTopicLists(params?: any) {
    return request.get({ url: '/article/topic/list', params })
}
// 文章专题下拉
export function articleTopicAll(params?: any) {
    return request.get({ url: '/article/topic/all', params })
}
// 添加文章专题
export function articleTopicAdd(params: any) {
    return request.post({ url: '/article/topic/add', params })
}
// 编辑文章专题
export function articleTopicEdit(params: any) {
    return request.post({ url: '/article/topic/edit', params })
}
// 删除文章专题
export function articleTopicDelete(params: any) {
    return request.post({ url: '/article/topic/del', params })
}
// 文章专题详情
export function articleTopicDetail(params: any) {
    return request.get({ url: '/article/topic/detail', params })
}
// 文章专题状态
export function articleTopicStatus(params: any) {
    return request.post({ url: '/article/topic/change', params })
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

/**
 * 投稿审核（通过/驳回/需修改）
 */
export function articleFrontAudit(params: {
    id: number
    reviewStatus: number
    reviewRemark?: string
}) {
    return request.post({ url: '/article/front/audit', params })
}

/**
 * 投稿审核消息列表（前端个人中心）
 */
export function articleFrontAuditMessageList(params?: {
    pageNo?: number
    pageSize?: number
    reviewStatus?: number | string
}) {
    return request.get({ url: '/article/front/audit/message/list', params })
}

/**
 * 公众号文章导入
 */
export function articleImportWechat(params: { url: string }) {
    return request.post({ url: '/article/import/wechat', params })
}

/**
 * 文章阅读量 +1
 */
export function articleVisitIncr(params: { id: number }) {
    return request.post({ url: '/article/visit/incr', params })
}

/**
 * 文章收藏切换（需前台登录 Token）
 */
export function articleCollectToggle(params: { id: number }) {
    return request.post({ url: '/article/collect/toggle', params })
}

/**
 * 文章点赞切换（需前台登录 Token）
 */
export function articleLikeToggle(params: { id: number }) {
    return request.post({ url: '/article/like/toggle', params })
}

/**
 * 批量获取文章互动统计
 */
export function articleStats(params: { ids: string }) {
    return request.get({ url: '/article/stats', params })
}

/**
 * 评论管理列表（后台）
 */
export function articleCommentManageList(params?: any) {
    return request.get({ url: '/article/comment/manage/list', params })
}

/**
 * 评论回复列表（后台）
 */
export function articleCommentManageReplies(params?: any) {
    return request.get({ url: '/article/comment/manage/replies', params })
}

/**
 * 评论管理状态切换（后台）
 */
export function articleCommentManageChange(params: { id: number }) {
    return request.post({ url: '/article/comment/manage/change', params })
}

/**
 * 评论置顶切换（后台）
 */
export function articleCommentTopToggle(params: { id: number }) {
    return request.post({ url: '/article/comment/top/toggle', params })
}

/**
 * 评论管理删除（后台）
 */
export function articleCommentManageDel(params: { id: number }) {
    return request.post({ url: '/article/comment/manage/del', params })
}

/**
 * 评论管理批量状态切换（后台）
 */
export function articleCommentManageBatchChange(params: { ids: number[] | string; isShow: 0 | 1 }) {
    return request.post({ url: '/article/comment/manage/batch/change', params })
}

/**
 * 评论管理批量删除（后台）
 */
export function articleCommentManageBatchDel(params: { ids: number[] | string }) {
    return request.post({ url: '/article/comment/manage/batch/del', params })
}

/**
 * 评论敏感词配置详情（后台）
 */
export function articleCommentSensitiveDetail() {
    return request.get({ url: '/article/comment/manage/sensitive/detail' })
}

/**
 * 评论敏感词配置保存（后台）
 */
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

/**
 * 评论举报列表（后台）
 */
export function articleCommentReportList(params?: any) {
    return request.get({ url: '/article/comment/manage/report/list', params })
}

/**
 * 评论举报列表（后台，兼容旧命名）
 */
export function articleCommentManageReportList(params?: any) {
    return articleCommentReportList(params)
}

/**
 * 评论举报处理（后台）
 */
export function articleCommentReportHandle(params: {
    id: number
    status: 1 | 2
    action?: 'none' | 'hide_comment' | 'delete_comment'
    handleRemark?: string
}) {
    return request.post({ url: '/article/comment/manage/report/handle', params })
}

/**
 * 评论举报处理（后台，兼容旧命名）
 */
export function articleCommentManageReportHandle(params: {
    id: number
    status: 1 | 2
    action?: 'none' | 'hide_comment' | 'delete_comment'
    handleRemark?: string
}) {
    return articleCommentReportHandle(params)
}

/**
 * 评论禁言列表（后台）
 */
export function articleCommentMuteList(params?: any) {
    return request.get({ url: '/article/comment/manage/mute/list', params })
}

/**
 * 评论禁言列表（后台，兼容旧命名）
 */
export function articleCommentManageMuteList(params?: any) {
    return articleCommentMuteList(params)
}

/**
 * 评论禁言新增（后台）
 */
export function articleCommentMuteAdd(params: {
    userId?: number
    ip?: string
    reason?: string
    durationMinutes: number
}) {
    return request.post({ url: '/article/comment/manage/mute/add', params })
}

/**
 * 评论禁言新增（后台，兼容旧命名）
 */
export function articleCommentManageMuteAdd(params: {
    userId?: number
    ip?: string
    reason?: string
    durationMinutes: number
}) {
    return articleCommentMuteAdd(params)
}

/**
 * 评论禁言解除（后台）
 */
export function articleCommentMuteDel(params: { id: number }) {
    return request.post({ url: '/article/comment/manage/mute/del', params })
}

/**
 * 评论禁言解除（后台，兼容旧命名）
 */
export function articleCommentManageMuteDel(params: { id: number }) {
    return articleCommentMuteDel(params)
}
