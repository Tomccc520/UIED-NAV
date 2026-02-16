<!--
/**
 * @copyright Tomda (https://www.tomda.top)
 * @copyright UIED技术团队 (https://fsuied.com)
 * @author UIED技术团队
 * @createDate 2026.2.11
 */
-->
<template>
    <div>
        <el-card class="!border-none" shadow="never">
            <el-alert
                type="warning"
                title="温馨提示：标签用于文章多维检索与聚合展示，可多选"
                :closable="false"
                show-icon
            />
        </el-card>
        <el-card class="!border-none mt-4" shadow="never" v-loading="pager.loading">
            <div class="mb-3 flex items-center gap-2 flex-wrap">
                <el-button v-perms="['article:tag:add']" type="primary" @click="handleAdd()">
                    <template #icon>
                        <icon name="el-icon-Plus" />
                    </template>
                    新增
                </el-button>
                <el-button
                    v-perms="['article:tag:change']"
                    type="success"
                    plain
                    @click="handleBatchChange(1)"
                >
                    批量显示
                </el-button>
                <el-button
                    v-perms="['article:tag:change']"
                    type="warning"
                    plain
                    @click="handleBatchChange(0)"
                >
                    批量隐藏
                </el-button>
                <el-button
                    v-perms="['article:tag:del']"
                    type="danger"
                    plain
                    @click="handleBatchDelete"
                >
                    批量删除
                </el-button>
                <el-button
                    v-perms="['article:tag:edit']"
                    type="primary"
                    plain
                    @click="openMergeDialog"
                >
                    合并标签
                </el-button>
                <span class="text-xs text-tx-secondary">已选 {{ selectedIds.length }} 项</span>
            </div>
            <el-table
                row-key="id"
                size="large"
                :data="pager.lists"
                @selection-change="handleSelectionChange"
            >
                <el-table-column type="selection" width="48" :reserve-selection="true" />
                <el-table-column label="标签名称" prop="name" min-width="160" />
                <el-table-column label="Slug" prop="slug" min-width="160" />
                <el-table-column label="文章数" prop="number" min-width="120" />
                <el-table-column label="前台路径" min-width="240" show-overflow-tooltip>
                    <template #default="{ row }">
                        <span class="text-info">{{ getTagFrontendPath(row.id) }}</span>
                    </template>
                </el-table-column>
                <el-table-column label="状态" min-width="120">
                    <template #default="{ row }">
                        <el-switch
                            v-perms="['article:tag:change']"
                            v-model="row.isShow"
                            :active-value="1"
                            :inactive-value="0"
                            @change="changeStatus(row.id)"
                        />
                    </template>
                </el-table-column>
                <el-table-column label="排序" prop="sort" min-width="120" />
                <el-table-column label="操作" width="220" fixed="right">
                    <template #default="{ row }">
                        <el-tooltip content="前台查看" placement="top">
                            <el-button
                                type="primary"
                                link
                                :icon="View"
                                @click="openTagFrontend(row.id)"
                            />
                        </el-tooltip>
                        <el-tooltip content="复制路径" placement="top">
                            <el-button
                                type="primary"
                                link
                                :icon="Link"
                                @click="copyTagFrontendPath(row.id)"
                            />
                        </el-tooltip>
                        <el-button
                            v-perms="['article:tag:edit']"
                            type="primary"
                            link
                            @click="handleEdit(row)"
                        >
                            编辑
                        </el-button>
                        <el-button
                            v-perms="['article:tag:del']"
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
        <edit-popup
            v-if="showEdit"
            ref="editRef"
            @success="handlePopupSuccess"
            @close="showEdit = false"
        />
        <el-dialog v-model="mergeDialog.visible" title="合并标签" width="520px">
            <el-alert
                type="warning"
                :closable="false"
                show-icon
                title="来源标签会被删除，关联文章将迁移到目标标签"
                class="mb-4"
            />
            <el-form label-position="top">
                <el-form-item label="目标标签">
                    <el-select
                        v-model="mergeDialog.toId"
                        class="w-full"
                        filterable
                        placeholder="请选择目标标签"
                    >
                        <el-option
                            v-for="item in mergeDialog.options"
                            :key="item.id"
                            :label="`${item.name} (${item.slug || '-'})`"
                            :value="Number(item.id)"
                        />
                    </el-select>
                </el-form-item>
                <el-form-item label="本次来源标签">
                    <el-space wrap>
                        <el-tag v-for="id in selectedIds" :key="id" type="info" effect="plain">
                            #{{ id }}
                        </el-tag>
                    </el-space>
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button @click="mergeDialog.visible = false">取消</el-button>
                <el-button type="primary" @click="handleMergeConfirm">确认合并</el-button>
            </template>
        </el-dialog>
    </div>
</template>
<script lang="ts" setup name="articleTag">
import { Link, View } from '@element-plus/icons-vue'
import {
    articleTagAll,
    articleTagBatchDelete,
    articleTagBatchStatus,
    articleTagDelete,
    articleTagLists,
    articleTagMerge,
    articleTagStatus
} from '@/api/article'
import { usePaging } from '@/hooks/usePaging'
import feedback from '@/utils/feedback'
import EditPopup from './edit.vue'
const editRef = shallowRef<InstanceType<typeof EditPopup>>()
const showEdit = ref(false)
const frontendUrl = (import.meta.env.VITE_FRONTEND_URL || 'http://localhost:3000').replace(
    /\/$/,
    ''
)
const selectedIds = ref<number[]>([])
const mergeDialog = reactive({
    visible: false,
    toId: 0,
    options: [] as Array<{ id: number; name: string; slug?: string }>
})

const { pager, getLists, resetPage } = usePaging({
    fetchFun: articleTagLists
})
/**
 * 新增/编辑成功后刷新列表（回到第一页）
 */
const handlePopupSuccess = () => {
    resetPage()
}

/**
 * 生成标签前台访问路径
 */
const getTagFrontendPath = (tagId: number | string) => `/news?tagId=${tagId}`

/**
 * 快速打开标签前台聚合页
 */
const openTagFrontend = (tagId: number | string) => {
    const path = getTagFrontendPath(tagId)
    window.open(`${frontendUrl}${path}`, '_blank')
}

/**
 * 复制标签前台访问路径
 */
const copyTagFrontendPath = async (tagId: number | string) => {
    const path = getTagFrontendPath(tagId)
    try {
        if (navigator?.clipboard?.writeText) {
            await navigator.clipboard.writeText(path)
        } else {
            const textArea = document.createElement('textarea')
            textArea.value = path
            document.body.appendChild(textArea)
            textArea.select()
            document.execCommand('copy')
            document.body.removeChild(textArea)
        }
        feedback.msgSuccess('路径已复制')
    } catch (error) {
        feedback.msgError('复制失败，请手动复制')
    }
}

/**
 * 表格多选变更
 */
const handleSelectionChange = (rows: any[]) => {
    selectedIds.value = (Array.isArray(rows) ? rows : [])
        .map((item: any) => Number(item?.id || 0))
        .filter((id: number) => id > 0)
}

/**
 * 加载标签下拉（用于合并目标选择）
 */
const loadMergeTagOptions = async () => {
    const rows = await articleTagAll()
    mergeDialog.options = (Array.isArray(rows) ? rows : [])
        .map((item: any) => ({
            id: Number(item?.id || 0),
            name: String(item?.name || ''),
            slug: String(item?.slug || '')
        }))
        .filter((item: any) => item.id > 0)
}

/**
 * 打开合并标签弹窗
 */
const openMergeDialog = async () => {
    if (!selectedIds.value.length) {
        feedback.msgWarning('请先勾选要合并的标签')
        return
    }
    await loadMergeTagOptions()
    mergeDialog.toId = 0
    mergeDialog.visible = true
}

/**
 * 批量切换显示状态
 */
const handleBatchChange = async (isShow: 0 | 1) => {
    if (!selectedIds.value.length) {
        feedback.msgWarning('请先勾选标签')
        return
    }
    await articleTagBatchStatus({
        ids: selectedIds.value,
        isShow
    })
    feedback.msgSuccess('批量操作成功')
    selectedIds.value = []
    getLists()
}

/**
 * 批量删除标签
 */
const handleBatchDelete = async () => {
    if (!selectedIds.value.length) {
        feedback.msgWarning('请先勾选标签')
        return
    }
    try {
        await feedback.confirm(`确定删除选中的 ${selectedIds.value.length} 个标签？`)
    } catch (error) {
        return
    }
    await articleTagBatchDelete({
        ids: selectedIds.value
    })
    feedback.msgSuccess('批量删除成功')
    selectedIds.value = []
    resetPage()
}

/**
 * 确认执行标签合并
 */
const handleMergeConfirm = async () => {
    const targetId = Number(mergeDialog.toId || 0)
    if (!targetId) {
        feedback.msgWarning('请选择目标标签')
        return
    }
    const fromIds = selectedIds.value.filter((id) => id !== targetId)
    if (!fromIds.length) {
        feedback.msgWarning('来源标签不能为空（不能全部等于目标标签）')
        return
    }
    try {
        await feedback.confirm(`确认将 ${fromIds.length} 个标签合并到目标标签？`)
    } catch (error) {
        return
    }
    await articleTagMerge({
        fromIds,
        toId: targetId
    })
    feedback.msgSuccess('标签合并成功')
    mergeDialog.visible = false
    selectedIds.value = []
    resetPage()
}

const handleAdd = async () => {
    showEdit.value = true
    await nextTick()
    editRef.value?.open('add')
}

const handleEdit = async (data: any) => {
    showEdit.value = true
    await nextTick()
    editRef.value?.open('edit')
    editRef.value?.getDetail(data)
}

const handleDelete = async (id: number) => {
    try {
        await feedback.confirm('确定要删除？')
    } catch (error) {
        return
    }
    await articleTagDelete({ id })
    feedback.msgSuccess('删除成功')
    resetPage()
}

const changeStatus = async (id: number) => {
    try {
        await articleTagStatus({ id })
        feedback.msgSuccess('修改成功')
        getLists()
    } catch (error) {
        getLists()
    }
}

getLists()
</script>
