<!--
/**
 * @copyright Tomda (https://www.tomda.top)
 * @copyright UIED技术团队 (https://fsuied.com)
 * @author UIED技术团队
 * @createDate 2026-02-16
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
                <el-form-item label="文章状态">
                    <el-select class="w-[280px]" v-model="queryParams.isShow">
                        <el-option label="全部" value />
                        <el-option label="显示" :value="1" />
                        <el-option label="隐藏" :value="0" />
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
                <el-button
                    v-perms="['article:add', 'article:add/edit']"
                    type="primary"
                    class="mb-4"
                    @click="handleCreate"
                >
                    <template #icon>
                        <icon name="el-icon-Plus" />
                    </template>
                    发布文章
                </el-button>
            </div>
            <el-table size="large" v-loading="pager.loading" :data="pager.lists">
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
                <el-table-column label="作者" prop="author" min-width="120" />
                <el-table-column label="浏览量" prop="visit" min-width="100" />
                <el-table-column label="状态" min-width="100">
                    <template #default="{ row }">
                        <el-switch
                            v-perms="['article:change']"
                            v-model="row.isShow"
                            :active-value="1"
                            :inactive-value="0"
                            @change="changeStatus(row.id)"
                        />
                    </template>
                </el-table-column>
                <el-table-column label="排序" prop="sort" min-width="100" />
                <el-table-column label="发布时间" prop="createTime" min-width="120" />
                <el-table-column label="操作" width="120" fixed="right">
                    <template #default="{ row }">
                        <el-button
                            v-perms="['article:edit', 'article:add/edit']"
                            type="primary"
                            link
                            @click="handleEdit(row.id)"
                        >
                            编辑
                        </el-button>
                        <el-button
                            v-perms="['article:del']"
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
    </div>
</template>
<script lang="ts" setup name="articleLists">
import { articleLists, articleDelete, articleStatus, articleCateAll } from '@/api/article'
import { useDictOptions } from '@/hooks/useDictOptions'
import { usePaging } from '@/hooks/usePaging'
import { getRoutePath } from '@/router'
import feedback from '@/utils/feedback'

const queryParams = reactive({
    title: '',
    cid: '',
    isShow: ''
})
const router = useRouter()

const { pager, getLists, resetPage, resetParams } = usePaging({
    fetchFun: articleLists,
    params: queryParams
})

const { optionsData } = useDictOptions<{
    articleCate: any[]
}>({
    articleCate: {
        api: articleCateAll
    }
})

/**
 * 解析文章编辑路由，优先使用动态菜单路由，缺失时使用兜底路径
 */
const resolveEditPath = () => getRoutePath('article:add/edit') || '/article-manage/article/add/edit'

/**
 * 跳转到文章发布页
 */
const handleCreate = async () => {
    const path = resolveEditPath()
    if (!path) {
        feedback.msgError('未找到文章编辑路由，请在角色权限中授权 article:add/edit')
        return
    }
    await router.push({ path })
}

/**
 * 跳转到文章编辑页
 */
const handleEdit = async (id: number) => {
    const path = resolveEditPath()
    if (!path) {
        feedback.msgError('未找到文章编辑路由，请在角色权限中授权 article:add/edit')
        return
    }
    await router.push({
        path,
        query: { id }
    })
}

/**
 * 修改文章显示状态
 */
const changeStatus = async (id: number) => {
    try {
        await articleStatus({ id })
        feedback.msgSuccess('修改成功')
        getLists()
    } catch (error) {
        getLists()
    }
}

/**
 * 删除文章
 */
const handleDelete = async (id: number) => {
    await feedback.confirm('确定要删除？')
    await articleDelete({ id })
    feedback.msgSuccess('删除成功')
    getLists()
}

onActivated(() => {
    getLists()
})

getLists()
</script>
