<!--
/**
 * @copyright Tomda (https://www.tomda.top)
 * @copyright UIED技术团队 (https://fsuied.com)
 * @author UIED技术团队
 * @createDate 2026-02-17
 */
-->
<template>
    <div>
        <el-card class="!border-none" shadow="never">
            <el-alert
                type="warning"
                title="温馨提示：用于管理网站的分类，只可添加到一级"
                :closable="false"
                show-icon
            />
        </el-card>
        <el-card class="!border-none mt-4" shadow="never" v-loading="pager.loading">
            <div>
                <el-button
                    class="mb-4"
                    v-perms="['article:cate:add']"
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
                <el-table-column label="栏目名称" prop="name" min-width="120" />
                <el-table-column label="文章数" prop="number" min-width="120" />
                <el-table-column label="前台路径" min-width="240" show-overflow-tooltip>
                    <template #default="{ row }">
                        <span class="text-info">{{ getCategoryFrontendPath(row) }}</span>
                    </template>
                </el-table-column>
                <el-table-column label="状态" min-width="120">
                    <template #default="{ row }">
                        <el-switch
                            v-perms="['article:cate:change']"
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
                                @click="openCategoryFrontend(row)"
                            />
                        </el-tooltip>
                        <el-tooltip content="复制路径" placement="top">
                            <el-button
                                type="primary"
                                link
                                :icon="Link"
                                @click="copyCategoryFrontendPath(row)"
                            />
                        </el-tooltip>
                        <el-button
                            v-perms="['article:cate:edit']"
                            type="primary"
                            link
                            @click="handleEdit(row)"
                        >
                            编辑
                        </el-button>
                        <el-button
                            v-perms="['article:cate:del']"
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
        <edit-popup v-if="showEdit" ref="editRef" @success="getLists" @close="showEdit = false" />
    </div>
</template>
<script lang="ts" setup name="articleColumn">
import { Link, View } from '@element-plus/icons-vue'
import { articleCateDelete, articleCateLists, articleCateStatus } from '@/api/article'
import { usePaging } from '@/hooks/usePaging'
import feedback from '@/utils/feedback'
import EditPopup from './edit.vue'
const editRef = shallowRef<InstanceType<typeof EditPopup>>()
const showEdit = ref(false)
const frontendUrl = (import.meta.env.VITE_FRONTEND_URL || 'http://localhost:3003').replace(
    /\/$/,
    ''
)
/**
 * 规范化前台路由路径，确保始终为「/xxx」格式
 */
const normalizeFrontendRoutePath = (rawPath: string, fallbackPath = '/articles') => {
    const source = String(rawPath || '').trim() || String(fallbackPath || '').trim()
    const normalized = source.replace(/^\/+|\/+$/g, '')
    return normalized ? `/${normalized}` : '/'
}
const frontendArticleListPath = normalizeFrontendRoutePath(
    import.meta.env.VITE_FRONTEND_ARTICLE_LIST_PATH || '/articles',
    '/articles'
)
const frontendArticleCategoryQueryKey = (
    import.meta.env.VITE_FRONTEND_ARTICLE_CATEGORY_QUERY_KEY || 'categoryId'
)
    .trim()
    .replace(/^\?/, '')

const { pager, getLists } = usePaging({
    fetchFun: articleCateLists
})
/**
 * 生成分类前台访问路径
 */
const getCategoryFrontendPath = (row: any) => {
    const queryKey = frontendArticleCategoryQueryKey || 'categoryId'
    const value = String(row?.id || '').trim()
    if (!value) return frontendArticleListPath
    return `${frontendArticleListPath}?${encodeURIComponent(queryKey)}=${encodeURIComponent(value)}`
}

/**
 * 在新窗口打开分类前台聚合页
 */
const openCategoryFrontend = (row: any) => {
    const path = getCategoryFrontendPath(row)
    window.open(`${frontendUrl}${path}`, '_blank')
}

/**
 * 复制分类前台路径
 */
const copyCategoryFrontendPath = async (row: any) => {
    const path = getCategoryFrontendPath(row)
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
 * 打开新增弹窗
 */
const handleAdd = async () => {
    showEdit.value = true
    await nextTick()
    editRef.value?.open('add')
}

/**
 * 打开编辑弹窗
 */
const handleEdit = async (data: any) => {
    showEdit.value = true
    await nextTick()
    editRef.value?.open('edit')
    editRef.value?.getDetail(data)
}

/**
 * 删除分类
 */
const handleDelete = async (id: number) => {
    await feedback.confirm('确定要删除？')
    await articleCateDelete({ id })
    feedback.msgSuccess('删除成功')
    getLists()
}

/**
 * 切换分类显示状态
 */
const changeStatus = async (id: number) => {
    try {
        await articleCateStatus({ id })
        feedback.msgSuccess('修改成功')
        getLists()
    } catch (error) {
        getLists()
    }
}

getLists()
</script>
