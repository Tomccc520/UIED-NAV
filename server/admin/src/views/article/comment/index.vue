<!--
/**
 * @copyright Tomda (https://www.tomda.top)
 * @copyright UIED技术团队 (https://fsuied.com)
 * @author UIED技术团队
 * @createDate 2026.2.13
 */
-->
<template>
    <div class="article-comment">
        <el-card class="!border-none" shadow="never">
            <el-form class="mb-[-16px]" :model="queryParams" :inline="true">
                <el-form-item label="文章ID">
                    <el-input class="w-[220px]" v-model="queryParams.articleId" clearable />
                </el-form-item>
                <el-form-item label="评论内容">
                    <el-input class="w-[280px]" v-model="queryParams.keyword" clearable />
                </el-form-item>
                <el-form-item label="显示状态">
                    <el-select class="w-[180px]" v-model="queryParams.isShow" clearable>
                        <el-option label="全部" value />
                        <el-option label="显示" :value="1" />
                        <el-option label="隐藏" :value="0" />
                    </el-select>
                </el-form-item>
                <el-form-item>
                    <el-button type="primary" @click="resetPage">查询</el-button>
                    <el-button @click="resetParams">重置</el-button>
                    <el-button
                        v-perms="['article:comment:manage:change']"
                        type="success"
                        plain
                        @click="openSensitiveDialog"
                    >
                        敏感词与拦截规则
                    </el-button>
                    <el-button
                        v-perms="['article:comment:manage:list']"
                        type="warning"
                        plain
                        @click="openReportDialog"
                    >
                        举报待处理
                    </el-button>
                    <el-button
                        v-perms="['article:comment:manage:list']"
                        type="info"
                        plain
                        @click="openMuteDialog"
                    >
                        禁言管理
                    </el-button>
                </el-form-item>
            </el-form>
        </el-card>
        <el-card class="!border-none mt-4" shadow="never">
            <div class="mb-3 flex items-center gap-2">
                <el-button
                    v-perms="['article:comment:manage:change']"
                    type="success"
                    plain
                    @click="handleBatchChange(1)"
                >
                    批量显示
                </el-button>
                <el-button
                    v-perms="['article:comment:manage:change']"
                    type="warning"
                    plain
                    @click="handleBatchChange(0)"
                >
                    批量隐藏
                </el-button>
                <el-button
                    v-perms="['article:comment:manage:del']"
                    type="danger"
                    plain
                    @click="handleBatchDelete"
                >
                    批量删除
                </el-button>
                <span class="text-xs text-tx-secondary">已选 {{ selectedIds.length }} 项</span>
            </div>
            <el-table
                row-key="id"
                size="large"
                v-loading="pager.loading"
                :data="pager.lists"
                @selection-change="handleSelectionChange"
            >
                <el-table-column type="selection" width="48" :reserve-selection="true" />
                <el-table-column label="ID" prop="id" min-width="80" />
                <el-table-column label="文章ID" prop="articleId" min-width="100" />
                <el-table-column
                    label="文章标题"
                    prop="articleTitle"
                    min-width="200"
                    show-tooltip-when-overflow
                />
                <el-table-column label="留言用户" prop="nickname" min-width="120" />
                <el-table-column label="IP" prop="ip" min-width="120" />
                <el-table-column label="置顶" min-width="90">
                    <template #default="{ row }">
                        <el-tag v-if="Number(row.isTop) === 1" type="warning" effect="dark">
                            置顶
                        </el-tag>
                        <span v-else class="text-tx-secondary">-</span>
                    </template>
                </el-table-column>
                <el-table-column label="回复数" min-width="120">
                    <template #default="{ row }">
                        <div class="flex items-center gap-2">
                            <el-tag type="info">{{ row.replyCount || 0 }}</el-tag>
                            <el-button
                                v-if="(row.replyCount || 0) > 0"
                                type="primary"
                                link
                                @click="openReplyDrawer(row)"
                            >
                                管理回复
                            </el-button>
                        </div>
                    </template>
                </el-table-column>
                <el-table-column label="评论内容" min-width="320">
                    <template #default="{ row }">
                        <div class="leading-6" v-html="row.contentHighlighted || row.content"></div>
                        <div v-if="row.hitSensitiveWords?.length" class="mt-1">
                            <el-tag
                                v-for="word in row.hitSensitiveWords"
                                :key="word"
                                class="mr-1"
                                type="danger"
                                effect="plain"
                                size="small"
                            >
                                {{ word }}
                            </el-tag>
                        </div>
                    </template>
                </el-table-column>
                <el-table-column label="显示状态" min-width="120">
                    <template #default="{ row }">
                        <el-switch
                            v-perms="['article:comment:manage:change']"
                            v-model="row.isShow"
                            :active-value="1"
                            :inactive-value="0"
                            @change="handleChangeStatus(row.id)"
                        />
                    </template>
                </el-table-column>
                <el-table-column label="评论时间" prop="createTime" min-width="180" />
                <el-table-column label="操作" width="120" fixed="right">
                    <template #default="{ row }">
                        <el-button
                            v-perms="['article:comment:manage:change']"
                            type="primary"
                            link
                            @click="handleToggleTop(row)"
                        >
                            {{ Number(row.isTop) === 1 ? '取消置顶' : '置顶' }}
                        </el-button>
                        <el-button
                            v-perms="['article:comment:manage:del']"
                            type="danger"
                            link
                            @click="handleDelete(row.id)"
                        >
                            删除
                        </el-button>
                    </template>
                </el-table-column>
            </el-table>
            <div class="flex justify-end mt-4">
                <pagination v-model="pager" @change="getLists" />
            </div>
        </el-card>

        <el-drawer
            v-model="replyDrawer.visible"
            size="52%"
            :title="`回复管理（评论ID：${replyDrawer.rootId || '-'}）`"
            destroy-on-close
        >
            <template #default>
                <div class="mb-4 text-sm text-tx-secondary">
                    原评论：{{ replyDrawer.rootContent || '-' }}
                </div>
                <el-form class="mb-3" :inline="true">
                    <el-form-item label="关键词">
                        <el-input
                            class="w-[260px]"
                            v-model="replyDrawer.query.keyword"
                            clearable
                            @keyup.enter="fetchReplies(true)"
                        />
                    </el-form-item>
                    <el-form-item label="显示状态">
                        <el-select class="w-[180px]" v-model="replyDrawer.query.isShow" clearable>
                            <el-option label="全部" value="" />
                            <el-option label="显示" :value="1" />
                            <el-option label="隐藏" :value="0" />
                        </el-select>
                    </el-form-item>
                    <el-form-item>
                        <el-button type="primary" @click="fetchReplies(true)">查询</el-button>
                    </el-form-item>
                </el-form>
                <el-table size="small" v-loading="replyDrawer.loading" :data="replyDrawer.lists">
                    <el-table-column label="ID" prop="id" min-width="80" />
                    <el-table-column label="上级ID" prop="parentId" min-width="90" />
                    <el-table-column label="留言用户" prop="nickname" min-width="120" />
                    <el-table-column label="回复内容" min-width="300">
                        <template #default="{ row }">
                            <div
                                class="leading-6"
                                v-html="row.contentHighlighted || row.content"
                            ></div>
                            <div v-if="row.hitSensitiveWords?.length" class="mt-1">
                                <el-tag
                                    v-for="word in row.hitSensitiveWords"
                                    :key="word"
                                    class="mr-1"
                                    type="danger"
                                    effect="plain"
                                    size="small"
                                >
                                    {{ word }}
                                </el-tag>
                            </div>
                        </template>
                    </el-table-column>
                    <el-table-column label="显示状态" min-width="120">
                        <template #default="{ row }">
                            <el-switch
                                v-perms="['article:comment:manage:change']"
                                v-model="row.isShow"
                                :active-value="1"
                                :inactive-value="0"
                                @change="handleChangeStatus(row.id, true)"
                            />
                        </template>
                    </el-table-column>
                    <el-table-column label="回复时间" prop="createTime" min-width="180" />
                    <el-table-column label="操作" width="90" fixed="right">
                        <template #default="{ row }">
                            <el-button
                                v-perms="['article:comment:manage:del']"
                                type="danger"
                                link
                                @click="handleDelete(row.id, true)"
                            >
                                删除
                            </el-button>
                        </template>
                    </el-table-column>
                </el-table>
                <div class="flex justify-end mt-4">
                    <el-pagination
                        background
                        layout="total, prev, pager, next, sizes"
                        :total="replyDrawer.total"
                        v-model:current-page="replyDrawer.pageNo"
                        v-model:page-size="replyDrawer.pageSize"
                        @current-change="() => fetchReplies(false)"
                        @size-change="() => fetchReplies(true)"
                    />
                </div>
            </template>
        </el-drawer>

        <el-dialog v-model="sensitiveDialog.visible" title="敏感词与垃圾评论拦截规则" width="680px">
            <el-form label-position="top">
                <el-form-item label="敏感词（命中即隐藏）">
                    <el-input
                        v-model="sensitiveDialog.form.sensitiveWords"
                        type="textarea"
                        :rows="4"
                        placeholder="例如：加微信, 引流, 赌博, 返现"
                    />
                </el-form-item>
                <el-form-item label="黑名单词组合（命中 2 个及以上则隐藏）">
                    <el-input
                        v-model="sensitiveDialog.form.comboBlacklist"
                        type="textarea"
                        :rows="3"
                        placeholder="例如：兼职, 日结, 私聊, 微信"
                    />
                </el-form-item>
                <el-row :gutter="12">
                    <el-col :span="8">
                        <el-form-item label="最大链接数">
                            <el-input-number
                                v-model="sensitiveDialog.form.maxLinks"
                                :min="0"
                                :max="10"
                            />
                        </el-form-item>
                    </el-col>
                    <el-col :span="8">
                        <el-form-item label="重复检测窗口(秒)">
                            <el-input-number
                                v-model="sensitiveDialog.form.duplicateWindowSec"
                                :min="30"
                                :max="86400"
                                :step="30"
                            />
                        </el-form-item>
                    </el-col>
                    <el-col :span="8">
                        <el-form-item label="重复阈值">
                            <el-input-number
                                v-model="sensitiveDialog.form.duplicateThreshold"
                                :min="1"
                                :max="20"
                            />
                        </el-form-item>
                    </el-col>
                </el-row>
                <el-divider>冷却与限流</el-divider>
                <el-row :gutter="12">
                    <el-col :span="8">
                        <el-form-item label="冷却时间(秒)">
                            <el-input-number
                                v-model="sensitiveDialog.form.cooldownSec"
                                :min="0"
                                :max="3600"
                            />
                        </el-form-item>
                    </el-col>
                    <el-col :span="8">
                        <el-form-item label="用户窗口(秒)">
                            <el-input-number
                                v-model="sensitiveDialog.form.userWindowSec"
                                :min="10"
                                :max="86400"
                            />
                        </el-form-item>
                    </el-col>
                    <el-col :span="8">
                        <el-form-item label="用户窗口上限">
                            <el-input-number
                                v-model="sensitiveDialog.form.userMaxCount"
                                :min="1"
                                :max="200"
                            />
                        </el-form-item>
                    </el-col>
                </el-row>
                <el-row :gutter="12">
                    <el-col :span="8">
                        <el-form-item label="IP窗口(秒)">
                            <el-input-number
                                v-model="sensitiveDialog.form.ipWindowSec"
                                :min="10"
                                :max="86400"
                            />
                        </el-form-item>
                    </el-col>
                    <el-col :span="8">
                        <el-form-item label="IP窗口上限">
                            <el-input-number
                                v-model="sensitiveDialog.form.ipMaxCount"
                                :min="1"
                                :max="500"
                            />
                        </el-form-item>
                    </el-col>
                </el-row>
            </el-form>
            <template #footer>
                <el-button @click="sensitiveDialog.visible = false">取消</el-button>
                <el-button
                    type="primary"
                    :loading="sensitiveDialog.saving"
                    @click="handleSaveSensitive"
                >
                    保存
                </el-button>
            </template>
        </el-dialog>

        <el-dialog v-model="reportDialog.visible" title="评论举报待处理队列" width="980px">
            <el-form :inline="true" class="mb-3">
                <el-form-item label="状态">
                    <el-select v-model="reportDialog.query.status" class="w-[140px]">
                        <el-option label="待处理" :value="0" />
                        <el-option label="已处理" :value="1" />
                        <el-option label="已忽略" :value="2" />
                    </el-select>
                </el-form-item>
                <el-form-item label="关键词">
                    <el-input
                        v-model="reportDialog.query.keyword"
                        class="w-[220px]"
                        clearable
                        @keyup.enter="fetchReportList(true)"
                    />
                </el-form-item>
                <el-form-item>
                    <el-button type="primary" @click="fetchReportList(true)">查询</el-button>
                </el-form-item>
            </el-form>
            <el-table v-loading="reportDialog.loading" :data="reportDialog.lists" size="small">
                <el-table-column label="ID" prop="id" width="70" />
                <el-table-column
                    label="文章"
                    prop="articleTitle"
                    min-width="180"
                    show-tooltip-when-overflow
                />
                <el-table-column label="举报人" prop="reporterNickname" width="120" />
                <el-table-column label="举报原因" prop="reason" width="130" />
                <el-table-column
                    label="举报内容"
                    prop="content"
                    min-width="180"
                    show-tooltip-when-overflow
                />
                <el-table-column
                    label="被举报评论"
                    prop="commentContent"
                    min-width="220"
                    show-tooltip-when-overflow
                />
                <el-table-column label="状态" width="90">
                    <template #default="{ row }">
                        <el-tag
                            :type="
                                row.status === 0 ? 'warning' : row.status === 1 ? 'success' : 'info'
                            "
                        >
                            {{ row.statusName }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="时间" prop="createTime" width="160" />
                <el-table-column label="操作" width="170" fixed="right">
                    <template #default="{ row }">
                        <el-button
                            v-if="row.status === 0"
                            v-perms="['article:comment:manage:change']"
                            type="primary"
                            link
                            @click="handleReport(row, 1, 'hide_comment')"
                        >
                            处理并隐藏
                        </el-button>
                        <el-button
                            v-if="row.status === 0"
                            v-perms="['article:comment:manage:change']"
                            type="info"
                            link
                            @click="handleReport(row, 2, 'none')"
                        >
                            忽略
                        </el-button>
                    </template>
                </el-table-column>
            </el-table>
            <div class="flex justify-end mt-3">
                <el-pagination
                    background
                    layout="total, prev, pager, next, sizes"
                    :total="reportDialog.total"
                    v-model:current-page="reportDialog.pageNo"
                    v-model:page-size="reportDialog.pageSize"
                    @current-change="() => fetchReportList(false)"
                    @size-change="() => fetchReportList(true)"
                />
            </div>
        </el-dialog>

        <el-dialog v-model="muteDialog.visible" title="评论禁言管理" width="980px">
            <el-form :inline="true" class="mb-3">
                <el-form-item label="用户ID">
                    <el-input-number v-model="muteDialog.form.userId" :min="1" :max="99999999" />
                </el-form-item>
                <el-form-item label="IP">
                    <el-input v-model="muteDialog.form.ip" class="w-[180px]" clearable />
                </el-form-item>
                <el-form-item label="时长(分钟)">
                    <el-input-number
                        v-model="muteDialog.form.durationMinutes"
                        :min="1"
                        :max="43200"
                    />
                </el-form-item>
                <el-form-item label="原因">
                    <el-input v-model="muteDialog.form.reason" class="w-[220px]" clearable />
                </el-form-item>
                <el-form-item>
                    <el-button
                        v-perms="['article:comment:manage:change']"
                        type="primary"
                        :loading="muteDialog.saving"
                        @click="handleAddMute"
                    >
                        新增禁言
                    </el-button>
                </el-form-item>
            </el-form>
            <el-form :inline="true" class="mb-3">
                <el-form-item label="关键词">
                    <el-input
                        v-model="muteDialog.query.keyword"
                        class="w-[220px]"
                        clearable
                        @keyup.enter="fetchMuteList(true)"
                    />
                </el-form-item>
                <el-form-item label="状态">
                    <el-select v-model="muteDialog.query.active" class="w-[140px]">
                        <el-option label="生效中" :value="1" />
                        <el-option label="已过期" :value="0" />
                    </el-select>
                </el-form-item>
                <el-form-item>
                    <el-button type="primary" @click="fetchMuteList(true)">查询</el-button>
                </el-form-item>
            </el-form>
            <el-table v-loading="muteDialog.loading" :data="muteDialog.lists" size="small">
                <el-table-column label="ID" prop="id" width="70" />
                <el-table-column label="用户ID" prop="userId" width="90" />
                <el-table-column label="用户昵称" prop="userNickname" width="120" />
                <el-table-column label="IP" prop="ip" width="150" />
                <el-table-column
                    label="原因"
                    prop="reason"
                    min-width="180"
                    show-tooltip-when-overflow
                />
                <el-table-column label="到期时间" prop="expireTime" width="160" />
                <el-table-column label="状态" width="90">
                    <template #default="{ row }">
                        <el-tag :type="row.isActive === 1 ? 'danger' : 'info'">
                            {{ row.isActive === 1 ? '生效中' : '已过期' }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="操作" width="100" fixed="right">
                    <template #default="{ row }">
                        <el-button
                            v-if="row.isActive === 1"
                            v-perms="['article:comment:manage:del']"
                            type="danger"
                            link
                            @click="handleDelMute(row.id)"
                        >
                            解除
                        </el-button>
                    </template>
                </el-table-column>
            </el-table>
            <div class="flex justify-end mt-3">
                <el-pagination
                    background
                    layout="total, prev, pager, next, sizes"
                    :total="muteDialog.total"
                    v-model:current-page="muteDialog.pageNo"
                    v-model:page-size="muteDialog.pageSize"
                    @current-change="() => fetchMuteList(false)"
                    @size-change="() => fetchMuteList(true)"
                />
            </div>
        </el-dialog>
    </div>
</template>

<script lang="ts" setup name="articleComment">
import {
    articleCommentManageBatchChange,
    articleCommentManageBatchDel,
    articleCommentManageChange,
    articleCommentManageDel,
    articleCommentManageList,
    articleCommentManageMuteAdd,
    articleCommentManageMuteDel,
    articleCommentManageMuteList,
    articleCommentManageReportHandle,
    articleCommentManageReportList,
    articleCommentManageReplies,
    articleCommentSensitiveDetail,
    articleCommentSensitiveSave,
    articleCommentTopToggle
} from '@/api/article'
import { usePaging } from '@/hooks/usePaging'
import feedback from '@/utils/feedback'

const queryParams = reactive({
    articleId: '',
    keyword: '',
    isShow: ''
})

const { pager, getLists, resetPage, resetParams } = usePaging({
    fetchFun: articleCommentManageList,
    params: queryParams
})
const selectedIds = ref<number[]>([])
const sensitiveDialog = reactive({
    visible: false,
    saving: false,
    form: {
        sensitiveWords: '',
        comboBlacklist: '',
        maxLinks: 2,
        duplicateWindowSec: 300,
        duplicateThreshold: 2,
        cooldownSec: 15,
        userWindowSec: 60,
        userMaxCount: 6,
        ipWindowSec: 60,
        ipMaxCount: 20
    }
})
const reportDialog = reactive({
    visible: false,
    loading: false,
    pageNo: 1,
    pageSize: 10,
    total: 0,
    query: {
        status: 0,
        keyword: ''
    },
    lists: [] as any[]
})
const muteDialog = reactive({
    visible: false,
    loading: false,
    pageNo: 1,
    pageSize: 10,
    total: 0,
    query: {
        keyword: '',
        active: 1
    },
    lists: [] as any[],
    form: {
        userId: undefined as number | undefined,
        ip: '',
        durationMinutes: 60,
        reason: ''
    },
    saving: false
})

const replyDrawer = reactive({
    visible: false,
    loading: false,
    rootId: 0,
    rootContent: '',
    pageNo: 1,
    pageSize: 10,
    total: 0,
    lists: [] as any[],
    query: {
        keyword: '',
        isShow: ''
    }
})

/**
 * 打开回复管理抽屉
 */
const openReplyDrawer = async (row: any) => {
    replyDrawer.visible = true
    replyDrawer.rootId = Number(row.id || 0)
    replyDrawer.rootContent = String(row.content || '')
    replyDrawer.pageNo = 1
    replyDrawer.query.keyword = ''
    replyDrawer.query.isShow = ''
    await fetchReplies(true)
}

/**
 * 拉取回复列表
 */
const fetchReplies = async (reset = false) => {
    if (!replyDrawer.rootId) return
    if (reset) {
        replyDrawer.pageNo = 1
    }
    replyDrawer.loading = true
    try {
        const data = await articleCommentManageReplies({
            commentId: replyDrawer.rootId,
            pageNo: replyDrawer.pageNo,
            pageSize: replyDrawer.pageSize,
            keyword: replyDrawer.query.keyword,
            isShow: replyDrawer.query.isShow
        })
        replyDrawer.total = Number(data?.count || 0)
        replyDrawer.lists = Array.isArray(data?.lists) ? data.lists : []
        replyDrawer.rootContent = String(data?.root?.content || replyDrawer.rootContent || '')
    } finally {
        replyDrawer.loading = false
    }
}

/**
 * 切换评论显示状态
 */
const handleChangeStatus = async (id: number, isReply = false) => {
    try {
        await articleCommentManageChange({ id })
        feedback.msgSuccess('修改成功')
        if (isReply && replyDrawer.visible) {
            fetchReplies()
            getLists()
            return
        }
        getLists()
    } catch (error) {
        if (isReply && replyDrawer.visible) {
            fetchReplies()
            return
        }
        getLists()
    }
}

/**
 * 删除评论
 */
const handleDelete = async (id: number, isReply = false) => {
    try {
        await feedback.confirm('确定删除该评论？')
    } catch (error) {
        return
    }
    await articleCommentManageDel({ id })
    feedback.msgSuccess('删除成功')
    if (isReply && replyDrawer.visible) {
        fetchReplies()
    }
    getLists()
}

/**
 * 表格勾选变化
 */
const handleSelectionChange = (rows: any[]) => {
    selectedIds.value = (Array.isArray(rows) ? rows : [])
        .map((row: any) => Number(row?.id || 0))
        .filter((id: number) => id > 0)
}

/**
 * 评论置顶切换
 */
const handleToggleTop = async (row: any) => {
    await articleCommentTopToggle({ id: Number(row.id || 0) })
    feedback.msgSuccess(Number(row.isTop || 0) === 1 ? '已取消置顶' : '置顶成功')
    getLists()
}

/**
 * 读取敏感词配置
 */
const loadSensitiveWords = async () => {
    const data = await articleCommentSensitiveDetail()
    sensitiveDialog.form.sensitiveWords = String(data?.sensitiveWords || '')
    sensitiveDialog.form.comboBlacklist = String(data?.comboBlacklist || '')
    sensitiveDialog.form.maxLinks = Number(data?.maxLinks || 2)
    sensitiveDialog.form.duplicateWindowSec = Number(data?.duplicateWindowSec || 300)
    sensitiveDialog.form.duplicateThreshold = Number(data?.duplicateThreshold || 2)
    sensitiveDialog.form.cooldownSec = Number(data?.cooldownSec || 15)
    sensitiveDialog.form.userWindowSec = Number(data?.userWindowSec || 60)
    sensitiveDialog.form.userMaxCount = Number(data?.userMaxCount || 6)
    sensitiveDialog.form.ipWindowSec = Number(data?.ipWindowSec || 60)
    sensitiveDialog.form.ipMaxCount = Number(data?.ipMaxCount || 20)
}

/**
 * 打开规则配置弹窗
 */
const openSensitiveDialog = async () => {
    await loadSensitiveWords()
    sensitiveDialog.visible = true
}

/**
 * 保存敏感词配置
 */
const handleSaveSensitive = async () => {
    sensitiveDialog.saving = true
    try {
        await articleCommentSensitiveSave({
            sensitiveWords: sensitiveDialog.form.sensitiveWords,
            comboBlacklist: sensitiveDialog.form.comboBlacklist,
            maxLinks: Number(sensitiveDialog.form.maxLinks || 0),
            duplicateWindowSec: Number(sensitiveDialog.form.duplicateWindowSec || 300),
            duplicateThreshold: Number(sensitiveDialog.form.duplicateThreshold || 2),
            cooldownSec: Number(sensitiveDialog.form.cooldownSec || 15),
            userWindowSec: Number(sensitiveDialog.form.userWindowSec || 60),
            userMaxCount: Number(sensitiveDialog.form.userMaxCount || 6),
            ipWindowSec: Number(sensitiveDialog.form.ipWindowSec || 60),
            ipMaxCount: Number(sensitiveDialog.form.ipMaxCount || 20)
        })
        feedback.msgSuccess('保存成功')
        sensitiveDialog.visible = false
        await getLists()
    } finally {
        sensitiveDialog.saving = false
    }
}

/**
 * 打开举报队列弹窗
 */
const openReportDialog = async () => {
    reportDialog.visible = true
    reportDialog.pageNo = 1
    await fetchReportList(true)
}

/**
 * 获取举报列表
 */
const fetchReportList = async (reset = false) => {
    if (reset) reportDialog.pageNo = 1
    reportDialog.loading = true
    try {
        const data = await articleCommentManageReportList({
            pageNo: reportDialog.pageNo,
            pageSize: reportDialog.pageSize,
            status: reportDialog.query.status,
            keyword: reportDialog.query.keyword
        })
        reportDialog.total = Number(data?.count || 0)
        reportDialog.lists = Array.isArray(data?.lists) ? data.lists : []
    } finally {
        reportDialog.loading = false
    }
}

/**
 * 处理举报
 */
const handleReport = async (
    row: any,
    status: 1 | 2,
    action: 'none' | 'hide_comment' | 'delete_comment'
) => {
    await articleCommentManageReportHandle({
        id: Number(row.id || 0),
        status,
        action
    })
    feedback.msgSuccess('处理成功')
    fetchReportList()
    getLists()
}

/**
 * 打开禁言管理弹窗
 */
const openMuteDialog = async () => {
    muteDialog.visible = true
    muteDialog.pageNo = 1
    await fetchMuteList(true)
}

/**
 * 获取禁言列表
 */
const fetchMuteList = async (reset = false) => {
    if (reset) muteDialog.pageNo = 1
    muteDialog.loading = true
    try {
        const data = await articleCommentManageMuteList({
            pageNo: muteDialog.pageNo,
            pageSize: muteDialog.pageSize,
            keyword: muteDialog.query.keyword,
            active: muteDialog.query.active
        })
        muteDialog.total = Number(data?.count || 0)
        muteDialog.lists = Array.isArray(data?.lists) ? data.lists : []
    } finally {
        muteDialog.loading = false
    }
}

/**
 * 新增禁言
 */
const handleAddMute = async () => {
    muteDialog.saving = true
    try {
        await articleCommentManageMuteAdd({
            userId: muteDialog.form.userId,
            ip: muteDialog.form.ip,
            durationMinutes: Number(muteDialog.form.durationMinutes || 60),
            reason: muteDialog.form.reason
        })
        feedback.msgSuccess('禁言成功')
        muteDialog.form.userId = undefined
        muteDialog.form.ip = ''
        muteDialog.form.reason = ''
        muteDialog.form.durationMinutes = 60
        fetchMuteList(true)
    } finally {
        muteDialog.saving = false
    }
}

/**
 * 解除禁言
 */
const handleDelMute = async (id: number) => {
    await articleCommentManageMuteDel({ id })
    feedback.msgSuccess('已解除禁言')
    fetchMuteList()
}

/**
 * 批量状态切换
 */
const handleBatchChange = async (isShow: 0 | 1) => {
    if (!selectedIds.value.length) {
        feedback.msgWarning('请先选择评论')
        return
    }
    await articleCommentManageBatchChange({
        ids: selectedIds.value,
        isShow
    })
    feedback.msgSuccess('批量操作成功')
    selectedIds.value = []
    getLists()
}

/**
 * 批量删除
 */
const handleBatchDelete = async () => {
    if (!selectedIds.value.length) {
        feedback.msgWarning('请先选择评论')
        return
    }
    try {
        await feedback.confirm(`确定删除选中的 ${selectedIds.value.length} 条评论？`)
    } catch (error) {
        return
    }
    await articleCommentManageBatchDel({
        ids: selectedIds.value
    })
    feedback.msgSuccess('批量删除成功')
    selectedIds.value = []
    getLists()
}

loadSensitiveWords()
getLists()
</script>

<style lang="scss" scoped>
:deep(.cm-sensitive-mark) {
    background: #ffe5e5;
    color: #d93026;
    border-radius: 3px;
    padding: 0 2px;
}
</style>
