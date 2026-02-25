<!--
/**
 * @copyright Tomda (https://www.tomda.top)
 * @copyright UIED技术团队 (https://fsuied.com)
 * @author UIED技术团队
 * @createDate 2026-02-13
 */
-->
<template>
    <div class="article-lists">
        <el-card class="!border-none" shadow="never">
            <el-form ref="formRef" class="mb-[-16px]" :model="queryParams" :inline="true">
                <el-form-item label="文章标题">
                    <el-input
                        class="w-[280px]"
                        v-model="queryParams.title"
                        clearable
                        @keyup.enter="resetPage"
                    />
                </el-form-item>
                <el-form-item label="栏目名称">
                    <el-select class="w-[280px]" v-model="queryParams.cid">
                        <el-option label="全部" value />
                        <el-option
                            v-for="item in optionsData.articleCate"
                            :key="item.id"
                            :label="item.name"
                            :value="item.id"
                        />
                    </el-select>
                </el-form-item>
                <el-form-item label="发布状态">
                    <el-select class="w-[280px]" v-model="queryParams.isShow">
                        <el-option label="全部" value />
                        <el-option label="已发布" :value="1" />
                        <el-option label="待发布" :value="0" />
                    </el-select>
                </el-form-item>
                <el-form-item label="审核状态">
                    <el-select class="w-[280px]" v-model="queryParams.reviewStatus">
                        <el-option label="全部" value />
                        <el-option label="待审核" :value="1" />
                        <el-option label="已通过" :value="2" />
                        <el-option label="已驳回" :value="3" />
                        <el-option label="需修改" :value="4" />
                    </el-select>
                </el-form-item>
                <el-form-item label="文章标签">
                    <el-select class="w-[280px]" v-model="queryParams.tagId" clearable>
                        <el-option label="全部" value />
                        <el-option
                            v-for="item in optionsData.articleTag"
                            :key="item.id"
                            :label="item.name"
                            :value="item.id"
                        />
                    </el-select>
                </el-form-item>
                <el-form-item label="所属专题">
                    <el-select class="w-[280px]" v-model="queryParams.topicId" clearable>
                        <el-option label="全部" value />
                        <el-option
                            v-for="item in optionsData.articleTopic"
                            :key="item.id"
                            :label="item.name"
                            :value="item.id"
                        />
                    </el-select>
                </el-form-item>
                <el-form-item>
                    <el-button type="primary" @click="resetPage">查询</el-button>
                    <el-button @click="resetParams">重置</el-button>
                </el-form-item>
            </el-form>
        </el-card>
        <el-card class="!border-none mt-4" shadow="never">
            <div>
                <router-link
                    v-perms="['article:add', 'article:add/edit']"
                    :to="{
                        path: articleEditRoutePath
                    }"
                >
                    <el-button type="primary" class="mb-4">
                        <template #icon>
                            <icon name="el-icon-Plus" />
                        </template>
                        发布文章
                    </el-button>
                </router-link>
            </div>
            <div class="article-summary mb-3">
                <el-tag effect="plain">当前列表 {{ pager.lists?.length || 0 }} 条</el-tag>
                <el-tag type="warning" effect="plain">待审核 {{ pageAuditPendingCount }} 条</el-tag>
                <el-tag type="success" effect="plain">已发布 {{ pagePublishedCount }} 条</el-tag>
                <el-tag type="info" effect="plain">待发布 {{ pageDraftCount }} 条</el-tag>
            </div>
            <el-table size="large" stripe v-loading="pager.loading" :data="pager.lists">
                <el-table-column label="ID" prop="id" min-width="80" />
                <el-table-column label="封面" min-width="100">
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
                <el-table-column
                    label="标题"
                    prop="title"
                    min-width="160"
                    show-tooltip-when-overflow
                />
                <el-table-column label="栏目" prop="category" min-width="100" />
                <el-table-column label="标签" min-width="160">
                    <template #default="{ row }">
                        <el-space wrap>
                            <el-tag
                                v-for="tag in row.tags || []"
                                :key="tag"
                                size="small"
                                effect="plain"
                            >
                                {{ tag }}
                            </el-tag>
                            <span v-if="!row.tags || row.tags.length === 0" class="text-info"
                                >-</span
                            >
                        </el-space>
                    </template>
                </el-table-column>
                <el-table-column label="专题" prop="topic" min-width="120" />
                <el-table-column label="作者" prop="author" min-width="120" />
                <el-table-column label="浏览量" prop="visit" min-width="100" />
                <el-table-column label="收藏数" prop="collectCount" min-width="100" />
                <el-table-column label="点赞数" prop="likeCount" min-width="100" />
                <el-table-column label="发布状态" min-width="120">
                    <template #default="{ row }">
                        <el-tag v-if="Number(row.isShow) === 1" type="success">已发布</el-tag>
                        <el-tag v-else type="info">待发布</el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="审核状态" min-width="120">
                    <template #default="{ row }">
                        <el-tag :type="getReviewTagType(row.reviewStatus)">
                            {{ row.reviewStatusName || '-' }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="审核备注" min-width="180" show-overflow-tooltip>
                    <template #default="{ row }">
                        <span>{{ row.reviewRemark || '-' }}</span>
                    </template>
                </el-table-column>
                <el-table-column label="排序" prop="sort" min-width="100" />
                <el-table-column label="发布时间" prop="createTime" min-width="120" />
                <el-table-column label="操作" width="160" fixed="right">
                    <template #default="{ row }">
                        <div class="article-actions">
                            <el-tooltip
                                content="审核通过并发布"
                                placement="top"
                                v-if="Number(row.reviewStatus) === 1 && Number(row.isShow) !== 1"
                            >
                                <el-button
                                    v-perms="['article:change']"
                                    type="success"
                                    link
                                    :icon="Select"
                                    @click="handleAuditPass(row)"
                                />
                            </el-tooltip>
                            <el-tooltip
                                :content="
                                    Number(row.isShow) === 1
                                        ? '前台查看'
                                        : '待发布文章暂不可在前台查看'
                                "
                                placement="top"
                            >
                                <el-button
                                    type="primary"
                                    link
                                    :icon="View"
                                    :disabled="Number(row.isShow) !== 1"
                                    @click="handleView(row)"
                                />
                            </el-tooltip>

                            <el-tooltip content="编辑" placement="top">
                                <el-button
                                    v-perms="['article:edit', 'article:add/edit']"
                                    type="primary"
                                    link
                                    :icon="EditPen"
                                    @click="handleEdit(row)"
                                />
                            </el-tooltip>

                            <el-tooltip
                                :content="Number(row.isShow) === 1 ? '转为待发布' : '发表'"
                                placement="top"
                            >
                                <el-button
                                    v-perms="['article:change']"
                                    type="primary"
                                    link
                                    :icon="Number(row.isShow) === 1 ? Document : Promotion"
                                    @click="togglePublish(row)"
                                />
                            </el-tooltip>

                            <el-tooltip content="删除" placement="top">
                                <el-button
                                    v-perms="['article:del']"
                                    type="danger"
                                    link
                                    :icon="Delete"
                                    @click="handleDelete(row.id)"
                                />
                            </el-tooltip>
                        </div>
                    </template>
                </el-table-column>
            </el-table>
            <div class="flex justify-end mt-4">
                <pagination v-model="pager" @change="getLists" />
            </div>
        </el-card>
    </div>
</template>
<script lang="ts" setup name="articleLists">
import { Delete, Document, EditPen, Promotion, Select, View } from '@element-plus/icons-vue'
import {
    articleLists,
    articleDelete,
    articleStatus,
    articleFrontAudit,
    articleCateAll,
    articleTagAll,
    articleTopicAll
} from '@/api/article'
import { useDictOptions } from '@/hooks/useDictOptions'
import { usePaging } from '@/hooks/usePaging'
import { getRoutePath } from '@/router'
import feedback from '@/utils/feedback'
import { useRouter } from 'vue-router'

const router = useRouter()
const queryParams = reactive({
    title: '',
    cid: '',
    isShow: '',
    reviewStatus: '',
    tagId: '',
    topicId: ''
})
/**
 * 获取文章编辑路由（优先权限菜单路由，兜底内置路由）
 */
const articleEditRoutePath = computed(
    () => getRoutePath('article:add/edit') || '/_detail/article/edit'
)

const { pager, getLists, resetPage, resetParams } = usePaging({
    fetchFun: articleLists,
    params: queryParams
})

const { optionsData } = useDictOptions<{
    articleCate: any[]
    articleTag: any[]
    articleTopic: any[]
}>({
    articleCate: {
        api: articleCateAll
    },
    articleTag: {
        api: articleTagAll
    },
    articleTopic: {
        api: articleTopicAll
    }
})

/**
 * 当前页待审核数量
 */
const pageAuditPendingCount = computed(
    () => (pager.lists || []).filter((item: any) => Number(item.reviewStatus) === 1).length
)

/**
 * 当前页已发布数量
 */
const pagePublishedCount = computed(
    () => (pager.lists || []).filter((item: any) => Number(item.isShow) === 1).length
)

/**
 * 当前页待发布数量
 */
const pageDraftCount = computed(
    () => (pager.lists || []).filter((item: any) => Number(item.isShow) !== 1).length
)

/**
 * 审核状态标签类型
 */
const getReviewTagType = (reviewStatus: number) => {
    const status = Number(reviewStatus || 0)
    if (status === 1) return 'warning'
    if (status === 2) return 'success'
    if (status === 3) return 'danger'
    if (status === 4) return 'info'
    return 'info'
}

/**
 * 切换发布状态（已发布 <-> 草稿）
 */
const togglePublish = async (row: any) => {
    try {
        await articleStatus({ id: row.id })
        feedback.msgSuccess(Number(row.isShow) === 1 ? '已转为待发布' : '已发表')
        getLists()
    } catch (error) {
        getLists()
    }
}

/**
 * 审核通过并发布（前端投稿）
 */
const handleAuditPass = async (row: any) => {
    try {
        await feedback.confirm('确认审核通过并直接发布该文章？')
    } catch (error) {
        return
    }
    await articleFrontAudit({
        id: Number(row.id),
        reviewStatus: 2
    })
    feedback.msgSuccess('审核通过并发布成功')
    getLists()
}

/**
 * 跳转到前台文章详情页（官网 news 详情页）
 */
const handleView = (row: any) => {
    // 开发环境默认端口3000，生产环境请配置环境变量
    const frontendUrl = import.meta.env.VITE_FRONTEND_URL || 'http://localhost:3000'
    window.open(`${frontendUrl}/news/${row.id}`, '_blank')
}

/**
 * 进入文章编辑页
 */
const handleEdit = (row: any) => {
    router.push({
        path: articleEditRoutePath.value,
        query: {
            id: row.id
        }
    })
}

const handleDelete = async (id: number) => {
    try {
        await feedback.confirm('确定要删除？')
    } catch (error) {
        return
    }
    await articleDelete({ id })
    feedback.msgSuccess('删除成功')
    getLists()
}

onActivated(() => {
    getLists()
})

getLists()
</script>

<style scoped>
.article-summary {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
}

.article-actions {
    display: inline-flex;
    align-items: center;
    gap: 4px;
}
</style>
