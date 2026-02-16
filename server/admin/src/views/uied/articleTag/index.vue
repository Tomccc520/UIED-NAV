<!--
 * @file views/uied/articleTag/index.vue
 * @description 文章标签管理页面
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
-->
<template>
    <div class="article-tag-lists">
        <el-card class="!border-none" shadow="never">
            <el-form ref="formRef" class="mb-[-16px]" :model="queryParams" :inline="true">
                <el-form-item label="标签名称">
                    <el-input
                        class="w-[200px]"
                        v-model="queryParams.keyword"
                        placeholder="搜索标签名称"
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
            <div class="mb-4 flex justify-between">
                <div>
                    <el-button type="primary" @click="handleAdd">
                        <template #icon><icon name="el-icon-Plus" /></template>
                        添加标签
                    </el-button>
                </div>
                <div class="text-gray-400">共 {{ pager.count }} 个标签</div>
            </div>
            <el-table size="large" v-loading="pager.loading" :data="pager.lists">
                <el-table-column label="ID" prop="id" width="80" />
                <el-table-column label="标签名称" prop="name" min-width="150">
                    <template #default="{ row }">
                        <el-tag
                            :color="row.color || undefined"
                            :style="
                                row.color
                                    ? { color: getContrastColor(row.color), borderColor: row.color }
                                    : {}
                            "
                            size="default"
                        >
                            {{ row.name }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="标识(Slug)" prop="slug" min-width="150" />
                <el-table-column label="颜色" width="100">
                    <template #default="{ row }">
                        <div v-if="row.color" class="flex items-center gap-2">
                            <span
                                class="inline-block w-4 h-4 rounded"
                                :style="{ backgroundColor: row.color }"
                            ></span>
                            <span class="text-xs text-gray-400">{{ row.color }}</span>
                        </div>
                        <span v-else class="text-gray-400">-</span>
                    </template>
                </el-table-column>
                <el-table-column label="排序" prop="sort_order" width="80" />
                <el-table-column label="文章数" prop="articleCount" width="90" />
                <el-table-column label="操作" width="150" fixed="right">
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

        <!-- 添加/编辑弹窗 -->
        <el-dialog
            v-model="showEdit"
            :title="editData.id ? '编辑标签' : '添加标签'"
            width="500px"
            :close-on-click-modal="false"
        >
            <el-form ref="editFormRef" :model="editData" :rules="editRules" label-width="100px">
                <el-form-item label="标签名称" prop="name">
                    <el-input v-model="editData.name" placeholder="请输入标签名称" />
                </el-form-item>
                <el-form-item label="标识(Slug)" prop="slug">
                    <el-input v-model="editData.slug" placeholder="请输入标签标识（URL友好）" />
                </el-form-item>
                <el-form-item label="标签颜色">
                    <div class="flex items-center gap-3">
                        <el-color-picker v-model="editData.color" />
                        <span v-if="editData.color" class="text-xs text-gray-400">{{
                            editData.color
                        }}</span>
                    </div>
                </el-form-item>
                <el-form-item label="排序">
                    <el-input-number v-model="editData.sortOrder" :min="0" :max="9999" />
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button @click="showEdit = false">取消</el-button>
                <el-button type="primary" :loading="editLoading" @click="handleSubmit"
                    >确定</el-button
                >
            </template>
        </el-dialog>
    </div>
</template>

<script lang="ts" setup name="uiedArticleTag">
/**
 * @file views/uied/articleTag/index.vue
 * @description 文章标签管理页面
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */
import {
    uiedArticleTagList,
    uiedArticleTagAdd,
    uiedArticleTagEdit,
    uiedArticleTagDelete
} from '@/api/uied'
import { usePaging } from '@/hooks/usePaging'
import feedback from '@/utils/feedback'
import type { FormInstance, FormRules } from 'element-plus'

// 搜索参数
const queryParams = reactive({
    keyword: ''
})

const { pager, getLists, resetPage, resetParams } = usePaging({
    fetchFun: uiedArticleTagList,
    params: queryParams
})

// 编辑相关
const showEdit = ref(false)
const editLoading = ref(false)
const editFormRef = ref<FormInstance>()
const editData = reactive({
    id: 0,
    name: '',
    slug: '',
    color: '',
    sortOrder: 0
})

const editRules: FormRules = {
    name: [{ required: true, message: '请输入标签名称', trigger: 'blur' }],
    slug: [{ required: true, message: '请输入标签标识', trigger: 'blur' }]
}

// 重置编辑数据
const resetEditData = () => {
    editData.id = 0
    editData.name = ''
    editData.slug = ''
    editData.color = ''
    editData.sortOrder = 0
}

// 添加标签
const handleAdd = () => {
    resetEditData()
    showEdit.value = true
}

// 编辑标签
const handleEdit = (row: any) => {
    editData.id = row.id
    editData.name = row.name
    editData.slug = row.slug || ''
    editData.color = row.color || ''
    editData.sortOrder = row.sort_order || 0
    showEdit.value = true
}

// 提交表单
const handleSubmit = async () => {
    await editFormRef.value?.validate()
    editLoading.value = true
    try {
        const params = {
            id: editData.id || undefined,
            name: editData.name,
            slug: editData.slug,
            color: editData.color,
            sort_order: editData.sortOrder
        }
        if (editData.id) {
            await uiedArticleTagEdit(params)
            feedback.msgSuccess('编辑成功')
        } else {
            await uiedArticleTagAdd(params)
            feedback.msgSuccess('添加成功')
        }
        showEdit.value = false
        getLists()
    } finally {
        editLoading.value = false
    }
}

// 删除标签
const handleDelete = async (id: number) => {
    await feedback.confirm('确定要删除该标签吗？删除后关联的文章将取消该标签。')
    await uiedArticleTagDelete({ id })
    feedback.msgSuccess('删除成功')
    getLists()
}

/**
 * 根据背景色计算对比文字颜色
 * 浅色背景用深色文字，深色背景用白色文字
 */
const getContrastColor = (hexColor: string): string => {
    if (!hexColor) return '#333'
    const hex = hexColor.replace('#', '')
    const r = parseInt(hex.substring(0, 2), 16)
    const g = parseInt(hex.substring(2, 4), 16)
    const b = parseInt(hex.substring(4, 6), 16)
    // 使用 YIQ 公式计算亮度
    const yiq = (r * 299 + g * 587 + b * 114) / 1000
    return yiq >= 128 ? '#333333' : '#ffffff'
}

getLists()
</script>
