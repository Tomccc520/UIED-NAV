<!--
 * @file views/uied/website/index.vue
 * @description UIED 网站管理列表页面
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 3.1.0 - 增加前端路径快捷查看列
-->
<template>
    <div class="website-lists">
        <el-card class="!border-none" shadow="never">
            <el-form ref="formRef" class="mb-[-16px]" :model="queryParams" :inline="true">
                <el-form-item label="网站名称">
                    <el-input
                        class="w-[200px]"
                        v-model="queryParams.keyword"
                        placeholder="搜索名称/描述/URL"
                        clearable
                        @keyup.enter="resetPage"
                    />
                </el-form-item>
                <el-form-item label="所属分类">
                    <el-select
                        class="w-[200px]"
                        v-model="queryParams.categoryId"
                        clearable
                        placeholder="全部分类"
                    >
                        <el-option
                            v-for="item in categoryList"
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
            <div class="mb-4 flex justify-between">
                <div>
                    <el-button type="primary" @click="handleAdd">
                        <template #icon><icon name="el-icon-Plus" /></template>
                        添加网站
                    </el-button>
                    <el-button
                        type="danger"
                        :disabled="!selectedIds.length"
                        @click="handleBatchDelete"
                    >
                        批量删除
                    </el-button>
                </div>
                <div class="text-gray-400">共 {{ pager.count }} 个网站</div>
            </div>
            <el-table
                size="large"
                v-loading="pager.loading"
                :data="pager.lists"
                @selection-change="handleSelectionChange"
            >
                <el-table-column type="selection" width="50" />
                <el-table-column label="ID" prop="id" width="80" />
                <el-table-column label="图标" width="70">
                    <template #default="{ row }">
                        <el-avatar
                            v-if="row.iconUrl"
                            :src="row.iconUrl"
                            :size="32"
                            shape="square"
                        />
                        <el-avatar v-else :size="32" shape="square">
                            {{ row.name?.charAt(0) }}
                        </el-avatar>
                    </template>
                </el-table-column>
                <el-table-column
                    label="网站名称"
                    prop="name"
                    min-width="150"
                    show-overflow-tooltip
                />
                <el-table-column label="分类" prop="categoryName" width="120" />
                <el-table-column label="URL" min-width="200" show-overflow-tooltip>
                    <template #default="{ row }">
                        <a :href="row.url" target="_blank" class="text-primary hover:underline">{{
                            row.url
                        }}</a>
                    </template>
                </el-table-column>
                <el-table-column label="前端" width="80" align="center">
                    <template #default="{ row }">
                        <a :href="getFrontendUrl(row)" target="_blank">
                            <el-button type="primary" link size="small">查看</el-button>
                        </a>
                    </template>
                </el-table-column>
                <el-table-column label="点击量" prop="clickCount" width="90" />
                <el-table-column label="排序" prop="sortOrder" width="80" />
                <el-table-column label="状态" width="80">
                    <template #default="{ row }">
                        <el-tag :type="row.isActive ? 'success' : 'info'" size="small">
                            {{ row.isActive ? '显示' : '隐藏' }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="操作" width="120" fixed="right">
                    <template #default="{ row }">
                        <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
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

<script lang="ts" setup name="uiedWebsite">
import {
    uiedWebsiteList,
    uiedWebsiteDelete,
    uiedWebsiteBatchDelete,
    uiedCategoryAll
} from '@/api/uied'
import { usePaging } from '@/hooks/usePaging'
import feedback from '@/utils/feedback'

const router = useRouter()

// 前端访问地址（开发环境 localhost:3003，生产环境可根据实际域名修改）
const FRONTEND_BASE_URL = 'http://localhost:3003'
const getFrontendUrl = (row: any) => {
    const path = row.slug || row.id
    return `${FRONTEND_BASE_URL}/website/${path}`
}

const queryParams = reactive({
    keyword: '',
    categoryId: ''
})

const { pager, getLists, resetPage, resetParams } = usePaging({
    fetchFun: uiedWebsiteList,
    params: queryParams
})

// 分类列表
const categoryList = ref<any[]>([])
const getCategoryList = async () => {
    try {
        const res = await uiedCategoryAll()
        categoryList.value = res || []
    } catch (error) {
        console.error('获取分类列表失败:', error)
    }
}

// 选中的ID
const selectedIds = ref<number[]>([])
const handleSelectionChange = (rows: any[]) => {
    selectedIds.value = rows.map((row) => row.id)
}

// 跳转到编辑页面
const handleAdd = () => {
    router.push('/uied/website/edit')
}

const handleEdit = (row: any) => {
    router.push(`/uied/website/edit?id=${row.id}`)
}

const handleDelete = async (id: number) => {
    await feedback.confirm('确定要删除该网站吗？')
    await uiedWebsiteDelete({ id })
    feedback.msgSuccess('删除成功')
    getLists()
}

const handleBatchDelete = async () => {
    await feedback.confirm(`确定要删除选中的 ${selectedIds.value.length} 个网站吗？`)
    await uiedWebsiteBatchDelete({ ids: selectedIds.value })
    feedback.msgSuccess('删除成功')
    selectedIds.value = []
    getLists()
}

onMounted(() => {
    getCategoryList()
})

getLists()
</script>
