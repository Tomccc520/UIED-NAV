<!--
 * @file views/uied/comment/index.vue
 * @description 评论管理页面
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
-->
<template>
    <div class="comment-lists">
        <!-- 统计卡片 -->
        <el-row :gutter="16" class="mb-4">
            <el-col :span="6">
                <el-card shadow="never" class="!border-none">
                    <div class="flex items-center justify-between">
                        <div>
                            <div class="text-gray-400 text-sm">全部评论</div>
                            <div class="text-2xl font-bold mt-1">{{ stats.totalCount }}</div>
                        </div>
                        <el-icon :size="32" class="text-gray-300"><ChatDotRound /></el-icon>
                    </div>
                </el-card>
            </el-col>
            <el-col :span="6">
                <el-card shadow="never" class="!border-none">
                    <div class="flex items-center justify-between">
                        <div>
                            <div class="text-gray-400 text-sm">待审核</div>
                            <div class="text-2xl font-bold mt-1 text-orange-500">{{ stats.pendingCount }}</div>
                        </div>
                        <el-icon :size="32" class="text-orange-300"><Clock /></el-icon>
                    </div>
                </el-card>
            </el-col>
            <el-col :span="6">
                <el-card shadow="never" class="!border-none">
                    <div class="flex items-center justify-between">
                        <div>
                            <div class="text-gray-400 text-sm">已通过</div>
                            <div class="text-2xl font-bold mt-1 text-green-500">{{ stats.approvedCount }}</div>
                        </div>
                        <el-icon :size="32" class="text-green-300"><CircleCheck /></el-icon>
                    </div>
                </el-card>
            </el-col>
            <el-col :span="6">
                <el-card shadow="never" class="!border-none">
                    <div class="flex items-center justify-between">
                        <div>
                            <div class="text-gray-400 text-sm">已拒绝</div>
                            <div class="text-2xl font-bold mt-1 text-red-500">{{ stats.rejectedCount }}</div>
                        </div>
                        <el-icon :size="32" class="text-red-300"><CircleClose /></el-icon>
                    </div>
                </el-card>
            </el-col>
        </el-row>

        <!-- 筛选栏 -->
        <el-card class="!border-none" shadow="never">
            <el-form ref="formRef" class="mb-[-16px]" :model="queryParams" :inline="true">
                <el-form-item label="审核状态">
                    <el-select
                        class="w-[160px]"
                        v-model="queryParams.status"
                        placeholder="全部状态"
                        clearable
                    >
                        <el-option label="待审核" value="pending" />
                        <el-option label="已通过" value="approved" />
                        <el-option label="已拒绝" value="rejected" />
                    </el-select>
                </el-form-item>
                <el-form-item label="评论类型">
                    <el-select
                        class="w-[160px]"
                        v-model="queryParams.type"
                        placeholder="全部类型"
                        clearable
                    >
                        <el-option label="网站评论" value="website" />
                        <el-option label="文章评论" value="article" />
                    </el-select>
                </el-form-item>
                <el-form-item>
                    <el-button type="primary" @click="resetPage">查询</el-button>
                    <el-button @click="resetParams">重置</el-button>
                </el-form-item>
            </el-form>
        </el-card>

        <!-- 评论列表 -->
        <el-card class="!border-none mt-4" shadow="never">
            <div class="mb-4 flex justify-between">
                <div class="flex items-center gap-2">
                    <span class="text-gray-500">评论管理</span>
                    <el-badge v-if="pendingCount > 0" :value="pendingCount" class="ml-1" />
                </div>
                <div class="text-gray-400">
                    共 {{ pager.count }} 条评论
                </div>
            </div>
            <el-table size="large" v-loading="pager.loading" :data="pager.lists">
                <el-table-column label="ID" prop="id" width="70" />
                <el-table-column label="评论内容" min-width="250">
                    <template #default="{ row }">
                        <span class="text-gray-700">
                            {{ truncateContent(row.content, 100) }}
                        </span>
                    </template>
                </el-table-column>
                <el-table-column label="类型" width="100">
                    <template #default="{ row }">
                        <el-tag v-if="row.type === 'website'" size="small">网站</el-tag>
                        <el-tag v-else-if="row.type === 'article'" type="info" size="small">文章</el-tag>
                        <el-tag v-else size="small">{{ row.type }}</el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="评论对象" prop="targetName" min-width="150">
                    <template #default="{ row }">
                        <span v-if="row.targetName" class="text-gray-600">{{ row.targetName }}</span>
                        <span v-else class="text-gray-400">-</span>
                    </template>
                </el-table-column>
                <el-table-column label="作者" width="120">
                    <template #default="{ row }">
                        <span class="text-gray-600">{{ row.author || row.nickname || '匿名' }}</span>
                    </template>
                </el-table-column>
                <el-table-column label="状态" width="100">
                    <template #default="{ row }">
                        <el-tag v-if="row.status === 'pending'" type="warning" size="small">待审核</el-tag>
                        <el-tag v-else-if="row.status === 'approved'" type="success" size="small">已通过</el-tag>
                        <el-tag v-else-if="row.status === 'rejected'" type="danger" size="small">已拒绝</el-tag>
                        <el-tag v-else size="small">{{ row.status }}</el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="评论时间" width="170">
                    <template #default="{ row }">
                        <span class="text-gray-400">{{ formatTime(row.create_time) }}</span>
                    </template>
                </el-table-column>
                <el-table-column label="操作" width="200" fixed="right">
                    <template #default="{ row }">
                        <template v-if="row.status === 'pending'">
                            <el-button type="success" link @click="handleApprove(row.id)">通过</el-button>
                            <el-button type="warning" link @click="handleReject(row.id)">拒绝</el-button>
                        </template>
                        <el-button type="danger" link @click="handleDelete(row.id)">删除</el-button>
                    </template>
                </el-table-column>
            </el-table>
            <div class="flex justify-end mt-4">
                <pagination v-model="pager" @change="getLists" />
            </div>
        </el-card>
    </div>
</template>

<script lang="ts" setup name="uiedComment">
/**
 * @file views/uied/comment/index.vue
 * @description 评论管理页面
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */
import {
    uiedCommentList,
    uiedCommentApprove,
    uiedCommentReject,
    uiedCommentDelete,
    uiedCommentPendingCount,
    uiedCommentStats
} from '@/api/uied'
import { usePaging } from '@/hooks/usePaging'
import feedback from '@/utils/feedback'
import { ChatDotRound, Clock, CircleCheck, CircleClose } from '@element-plus/icons-vue'

// 筛选参数
const queryParams = reactive({
    status: '',
    type: ''
})

const { pager, getLists, resetPage, resetParams } = usePaging({
    fetchFun: uiedCommentList,
    params: queryParams
})

// 统计数据
const stats = reactive({
    totalCount: 0,
    pendingCount: 0,
    approvedCount: 0,
    rejectedCount: 0
})

// 待审核数量（用于 badge 显示）
const pendingCount = ref(0)

// 获取统计数据
const getStats = async () => {
    try {
        const res = await uiedCommentStats()
        stats.totalCount = res?.totalCount ?? 0
        stats.pendingCount = res?.pendingCount ?? 0
        stats.approvedCount = res?.approvedCount ?? 0
        stats.rejectedCount = res?.rejectedCount ?? 0
    } catch (error) {
        console.error('获取评论统计失败:', error)
    }
}

// 获取待审核数量
const getPendingCount = async () => {
    try {
        const res = await uiedCommentPendingCount()
        pendingCount.value = res?.count ?? 0
    } catch (error) {
        console.error('获取待审核数量失败:', error)
    }
}

// 截断评论内容
const truncateContent = (content: string, maxLen: number): string => {
    if (!content) return '-'
    return content.length > maxLen ? content.substring(0, maxLen) + '...' : content
}

// 格式化时间戳（unix 秒 → 可读日期）
const formatTime = (timestamp: number): string => {
    if (!timestamp) return '-'
    const date = new Date(timestamp * 1000)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const seconds = String(date.getSeconds()).padStart(2, '0')
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

// 审核通过
const handleApprove = async (id: number) => {
    await uiedCommentApprove({ id })
    feedback.msgSuccess('审核通过')
    refreshData()
}

// 审核拒绝
const handleReject = async (id: number) => {
    await uiedCommentReject({ id })
    feedback.msgSuccess('已拒绝')
    refreshData()
}

// 删除评论
const handleDelete = async (id: number) => {
    await feedback.confirm('确定要删除该评论吗？删除后无法恢复。')
    await uiedCommentDelete({ id })
    feedback.msgSuccess('删除成功')
    refreshData()
}

// 刷新列表和统计数据
const refreshData = () => {
    getLists()
    getStats()
    getPendingCount()
}

// 初始化加载
getLists()
getStats()
getPendingCount()
</script>
