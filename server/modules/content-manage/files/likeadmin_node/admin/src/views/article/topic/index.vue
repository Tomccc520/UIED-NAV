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
                title="温馨提示：专题适合活动聚合与营销落地，可关联多篇文章"
                :closable="false"
                show-icon
            />
        </el-card>
        <el-card class="!border-none mt-4" shadow="never" v-loading="pager.loading">
            <div>
                <el-button
                    class="mb-4"
                    v-perms="['article:topic:add']"
                    type="primary"
                    @click="handleAdd()"
                >
                    <template #icon>
                        <icon name="el-icon-Plus" />
                    </template>
                    新增
                </el-button>
            </div>
            <el-table size="large" :data="pager.lists">
                <el-table-column label="专题名称" prop="name" min-width="160" />
                <el-table-column label="Slug" prop="slug" min-width="180" />
                <el-table-column label="封面" min-width="120">
                    <template #default="{ row }">
                        <image-contain
                            v-if="row.image"
                            :src="row.image"
                            :width="60"
                            :height="45"
                            :preview-src-list="[row.image]"
                            preview-teleported
                            fit="contain"
                        />
                    </template>
                </el-table-column>
                <el-table-column label="简介" prop="intro" min-width="180" show-overflow-tooltip />
                <el-table-column label="文章数" prop="number" min-width="100" />
                <el-table-column label="前台路径" min-width="240" show-overflow-tooltip>
                    <template #default="{ row }">
                        <span class="text-info">{{ getTopicFrontendPath(row.id) }}</span>
                    </template>
                </el-table-column>
                <el-table-column label="状态" min-width="120">
                    <template #default="{ row }">
                        <el-switch
                            v-perms="['article:topic:change']"
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
                                @click="openTopicFrontend(row.id)"
                            />
                        </el-tooltip>
                        <el-tooltip content="复制路径" placement="top">
                            <el-button
                                type="primary"
                                link
                                :icon="Link"
                                @click="copyTopicFrontendPath(row.id)"
                            />
                        </el-tooltip>
                        <el-button
                            v-perms="['article:topic:edit']"
                            type="primary"
                            link
                            @click="handleEdit(row)"
                        >
                            编辑
                        </el-button>
                        <el-button
                            v-perms="['article:topic:del']"
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
    </div>
</template>
<script lang="ts" setup name="articleTopic">
import { Link, View } from '@element-plus/icons-vue'
import { articleTopicDelete, articleTopicLists, articleTopicStatus } from '@/api/article'
import { usePaging } from '@/hooks/usePaging'
import feedback from '@/utils/feedback'
import EditPopup from './edit.vue'
const editRef = shallowRef<InstanceType<typeof EditPopup>>()
const showEdit = ref(false)
const frontendUrl = (import.meta.env.VITE_FRONTEND_URL || 'http://localhost:3000').replace(
    /\/$/,
    ''
)

const { pager, getLists, resetPage } = usePaging({
    fetchFun: articleTopicLists
})
/**
 * 新增/编辑成功后刷新列表（回到第一页）
 */
const handlePopupSuccess = () => {
    resetPage()
}

/**
 * 生成专题前台访问路径
 */
const getTopicFrontendPath = (topicId: number | string) => `/news?topicId=${topicId}`

/**
 * 快速打开专题前台聚合页
 */
const openTopicFrontend = (topicId: number | string) => {
    const path = getTopicFrontendPath(topicId)
    window.open(`${frontendUrl}${path}`, '_blank')
}

/**
 * 复制专题前台访问路径
 */
const copyTopicFrontendPath = async (topicId: number | string) => {
    const path = getTopicFrontendPath(topicId)
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
    await articleTopicDelete({ id })
    feedback.msgSuccess('删除成功')
    resetPage()
}

const changeStatus = async (id: number) => {
    try {
        await articleTopicStatus({ id })
        feedback.msgSuccess('修改成功')
        getLists()
    } catch (error) {
        getLists()
    }
}

getLists()
</script>
