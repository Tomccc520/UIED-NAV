<!--
/**
 * @copyright Tomda (https://www.tomda.top)
 * @copyright UIED技术团队 (https://fsuied.com)
 * @author UIED技术团队
 * @createDate 2026-02-16
 */
-->
<template>
    <div class="submission">
        <el-card class="!border-none" shadow="never">
            <el-form ref="formRef" class="mb-[-16px]" :model="queryParams" :inline="true">
                <el-form-item label="状态">
                    <el-select
                        v-model="queryParams.status"
                        placeholder="全部"
                        clearable
                        style="width: 120px"
                    >
                        <el-option label="待审核" value="pending" />
                        <el-option label="已通过" value="approved" />
                        <el-option label="已拒绝" value="rejected" />
                    </el-select>
                </el-form-item>
                <el-form-item label="网址">
                    <el-input
                        v-model="queryParams.url"
                        placeholder="请输入网址"
                        clearable
                        @keyup.enter="resetPage"
                    />
                </el-form-item>
                <el-form-item>
                    <el-button type="primary" @click="resetPage">查询</el-button>
                    <el-button @click="resetParams">重置</el-button>
                </el-form-item>
            </el-form>
        </el-card>
        <el-card class="!border-none mt-4" shadow="never">
            <el-table v-loading="loading" :data="lists" border>
                <el-table-column label="ID" prop="id" width="80" />
                <el-table-column label="网址" prop="url" min-width="200" show-overflow-tooltip />
                <el-table-column label="名称" prop="name" width="150" />
                <el-table-column label="提交人" prop="submitterName" width="100" />
                <el-table-column label="邮箱" prop="submitterEmail" width="150" />
                <el-table-column label="状态" prop="status" width="100">
                    <template #default="{ row }">
                        <el-tag :type="getStatusType(row.status)">{{
                            getStatusLabel(row.status)
                        }}</el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="提交时间" prop="createdAt" width="170">
                    <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
                </el-table-column>
                <el-table-column label="操作" width="200" fixed="right">
                    <template #default="{ row }">
                        <template v-if="row.status === 'pending'">
                            <el-button type="success" link @click="handleApprove(row)"
                                >通过</el-button
                            >
                            <el-button type="danger" link @click="handleReject(row)"
                                >拒绝</el-button
                            >
                        </template>
                        <el-button type="primary" link @click="handleView(row)">查看</el-button>
                        <el-button type="danger" link @click="handleDelete(row.id)">删除</el-button>
                    </template>
                </el-table-column>
            </el-table>
            <div class="flex justify-end mt-4">
                <pagination v-model="pager" @change="getLists" />
            </div>
        </el-card>

        <!-- 详情弹窗 -->
        <el-dialog v-model="showDetail" title="提交详情" width="600px">
            <el-descriptions :column="1" border>
                <el-descriptions-item label="网址">{{ detailData.url }}</el-descriptions-item>
                <el-descriptions-item label="名称">{{ detailData.name }}</el-descriptions-item>
                <el-descriptions-item label="描述">{{
                    detailData.description
                }}</el-descriptions-item>
                <el-descriptions-item label="提交人">{{
                    detailData.submitterName
                }}</el-descriptions-item>
                <el-descriptions-item label="邮箱">{{
                    detailData.submitterEmail
                }}</el-descriptions-item>
                <el-descriptions-item label="IP">{{ detailData.submitterIp }}</el-descriptions-item>
                <el-descriptions-item label="状态">
                    <el-tag :type="getStatusType(detailData.status)">{{
                        getStatusLabel(detailData.status)
                    }}</el-tag>
                </el-descriptions-item>
                <el-descriptions-item v-if="detailData.rejectReason" label="拒绝原因">{{
                    detailData.rejectReason
                }}</el-descriptions-item>
            </el-descriptions>
        </el-dialog>

        <!-- 拒绝原因弹窗 -->
        <el-dialog v-model="showReject" title="拒绝原因" width="400px">
            <el-input
                v-model="rejectReason"
                type="textarea"
                :rows="3"
                placeholder="请输入拒绝原因"
            />
            <template #footer>
                <el-button @click="showReject = false">取消</el-button>
                <el-button type="primary" @click="confirmReject">确定</el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { usePaging } from '@/hooks/usePaging'
import Pagination from '@/components/pagination/index.vue'
import request from '@/utils/request'
import feedback from '@/utils/feedback'

type TagType = '' | 'success' | 'warning' | 'danger' | 'info'
type SubmissionStatus = 'pending' | 'approved' | 'rejected'

const queryParams = reactive({ status: '', url: '' })
const { pager, getLists, resetPage, resetParams, lists, loading } = usePaging({
    fetchFun: (params: any) => request.get({ url: '/uied/submission/list', params }),
    params: queryParams
})

const showDetail = ref(false)
const detailData = ref<any>({})
const showReject = ref(false)
const rejectReason = ref('')
const currentRejectId = ref<number | null>(null)
const statusTypeMap: Record<SubmissionStatus, TagType> = {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger'
}
const statusLabelMap: Record<SubmissionStatus, string> = {
    pending: '待审核',
    approved: '已通过',
    rejected: '已拒绝'
}

/**
 * 获取状态标签颜色类型
 */
const getStatusType = (status: string): TagType =>
    statusTypeMap[status as SubmissionStatus] || 'info'

/**
 * 获取状态标签文案
 */
const getStatusLabel = (status: string) =>
    statusLabelMap[status as SubmissionStatus] || status || '-'

const formatTime = (ts: number) => (ts ? new Date(ts * 1000).toLocaleString('zh-CN') : '-')

const handleView = (row: any) => {
    detailData.value = row
    showDetail.value = true
}

/**
 * 审核通过提交
 */
const handleApprove = async (row: any) => {
    try {
        await feedback.confirm('确定通过该提交吗？')
    } catch (error) {
        return
    }
    await request.post({ url: '/uied/submission/approve', params: { id: row.id } })
    feedback.msgSuccess('审核通过')
    getLists()
}

/**
 * 打开拒绝弹窗
 */
const handleReject = (row: any) => {
    currentRejectId.value = row.id
    rejectReason.value = ''
    showReject.value = true
}

/**
 * 确认拒绝提交
 */
const confirmReject = async () => {
    const id = Number(currentRejectId.value || 0)
    const reason = String(rejectReason.value || '').trim()
    if (!id) {
        feedback.msgWarning('提交记录不存在，请刷新后重试')
        return
    }
    if (!reason) {
        feedback.msgWarning('请输入拒绝原因')
        return
    }
    await request.post({
        url: '/uied/submission/reject',
        params: { id, reason }
    })
    feedback.msgSuccess('已拒绝')
    showReject.value = false
    getLists()
}

/**
 * 删除提交记录
 */
const handleDelete = async (id: number) => {
    try {
        await feedback.confirm('确定删除该提交记录吗？')
    } catch (error) {
        return
    }
    await request.post({ url: '/uied/submission/del', params: { id } })
    feedback.msgSuccess('删除成功')
    getLists()
}

getLists()
</script>
