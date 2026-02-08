<!--
 * @file views/uied/category/index.vue
 * @description UIED 分类管理页面
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
-->
<template>
    <div class="category-lists">
        <el-card class="!border-none" shadow="never">
            <el-form ref="formRef" class="mb-[-16px]" :model="queryParams" :inline="true">
                <el-form-item label="分类名称">
                    <el-input
                        class="w-[200px]"
                        v-model="queryParams.keyword"
                        placeholder="搜索分类名称"
                        clearable
                        @keyup.enter="resetPage"
                    />
                </el-form-item>
                <el-form-item label="父级分类">
                    <el-select class="w-[200px]" v-model="queryParams.parentId" clearable placeholder="全部">
                        <el-option label="顶级分类" :value="0" />
                        <el-option
                            v-for="item in topCategories"
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
                    <el-button type="primary" @click="handleAdd()">
                        <template #icon><icon name="el-icon-Plus" /></template>
                        添加分类
                    </el-button>
                </div>
                <div class="text-gray-400">
                    共 {{ pager.count }} 个分类
                </div>
            </div>
            <el-table 
                size="large" 
                v-loading="pager.loading" 
                :data="pager.lists"
                row-key="id"
                :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
            >
                <el-table-column label="ID" prop="id" width="80" />
                <el-table-column label="图标" width="70">
                    <template #default="{ row }">
                        <el-avatar v-if="row.icon" :src="row.icon" :size="32" shape="square" />
                        <el-avatar v-else :size="32" shape="square">
                            {{ row.name?.charAt(0) }}
                        </el-avatar>
                    </template>
                </el-table-column>
                <el-table-column label="分类名称" prop="name" min-width="200" />
                <el-table-column label="别名" prop="slug" min-width="150" />
                <el-table-column label="父级" width="120">
                    <template #default="{ row }">
                        <span v-if="row.parentId === 0" class="text-gray-400">顶级分类</span>
                        <span v-else>{{ getParentName(row.parentId) }}</span>
                    </template>
                </el-table-column>
                <el-table-column label="网站数" prop="websiteCount" width="90" />
                <el-table-column label="排序" prop="sortOrder" width="80" />
                <el-table-column label="状态" width="80">
                    <template #default="{ row }">
                        <el-tag :type="row.isActive ? 'success' : 'info'" size="small">
                            {{ row.isActive ? '显示' : '隐藏' }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="操作" width="180" fixed="right">
                    <template #default="{ row }">
                        <el-button type="primary" link @click="handleAdd(row.id)">添加子分类</el-button>
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
            :title="editData.id ? '编辑分类' : '添加分类'"
            width="600px"
            :close-on-click-modal="false"
        >
            <el-form ref="editFormRef" :model="editData" :rules="editRules" label-width="100px">
                <el-form-item label="分类名称" prop="name">
                    <el-input v-model="editData.name" placeholder="请输入分类名称" />
                </el-form-item>
                <el-form-item label="分类别名" prop="slug">
                    <el-input v-model="editData.slug" placeholder="请输入分类别名（URL友好）" />
                </el-form-item>
                <el-form-item label="父级分类">
                    <el-select v-model="editData.parentId" placeholder="请选择父级分类" style="width: 100%">
                        <el-option label="顶级分类" :value="0" />
                        <el-option
                            v-for="item in topCategories"
                            :key="item.id"
                            :label="item.name"
                            :value="item.id"
                        />
                    </el-select>
                </el-form-item>
                <el-form-item label="分类描述">
                    <el-input v-model="editData.description" type="textarea" :rows="3" placeholder="请输入分类描述" />
                </el-form-item>
                <el-divider content-position="left">SEO 设置（提升搜索引擎排名）</el-divider>
                <el-form-item label="SEO标题">
                    <template #label>
                        <span>SEO标题</span>
                        <el-tooltip content="用于搜索引擎展示的页面标题，如「2025年最好的96个AI智能体工具」，建议30字以内，包含核心关键词" placement="top">
                            <el-icon style="margin-left: 4px; cursor: help; color: #909399;"><QuestionFilled /></el-icon>
                        </el-tooltip>
                    </template>
                    <el-input v-model="editData.seoTitle" placeholder="留空则使用分类名称" />
                </el-form-item>
                <el-form-item label="SEO描述">
                    <template #label>
                        <span>SEO描述</span>
                        <el-tooltip content="用于搜索引擎展示的页面描述，建议150字以内。会显示在分类页面头部，帮助用户和搜索引擎理解该分类内容" placement="top">
                            <el-icon style="margin-left: 4px; cursor: help; color: #909399;"><QuestionFilled /></el-icon>
                        </el-tooltip>
                    </template>
                    <el-input v-model="editData.seoDescription" type="textarea" :rows="3" placeholder="留空则使用分类描述" />
                </el-form-item>
                <el-form-item label="SEO关键词">
                    <template #label>
                        <span>SEO关键词</span>
                        <el-tooltip content="多个关键词用英文逗号分隔，建议5-10个核心关键词，有助于搜索引擎索引" placement="top">
                            <el-icon style="margin-left: 4px; cursor: help; color: #909399;"><QuestionFilled /></el-icon>
                        </el-tooltip>
                    </template>
                    <el-input v-model="editData.seoKeywords" placeholder="关键词1,关键词2,关键词3" />
                </el-form-item>
                <el-divider content-position="left">其他设置</el-divider>
                <el-form-item label="图标URL">
                    <el-input v-model="editData.icon" placeholder="请输入图标URL" />
                </el-form-item>
                <el-form-item label="主题色">
                    <el-color-picker v-model="editData.themeColor" />
                </el-form-item>
                <el-form-item label="排序">
                    <el-input-number v-model="editData.sortOrder" :min="0" :max="9999" />
                </el-form-item>
                <el-form-item label="状态">
                    <el-switch v-model="editData.isActive" :active-value="1" :inactive-value="0" />
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button @click="showEdit = false">取消</el-button>
                <el-button type="primary" :loading="editLoading" @click="handleSubmit">确定</el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script lang="ts" setup name="uiedCategory">
import { uiedCategoryList, uiedCategoryAll, uiedCategoryAdd, uiedCategoryEdit, uiedCategoryDelete } from '@/api/uied'
import { usePaging } from '@/hooks/usePaging'
import feedback from '@/utils/feedback'
import { QuestionFilled } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'

const queryParams = reactive({
    keyword: '',
    parentId: '' as string | number
})

const { pager, getLists, resetPage, resetParams } = usePaging({
    fetchFun: uiedCategoryList,
    params: queryParams
})

// 顶级分类列表
const topCategories = ref<any[]>([])
const allCategories = ref<any[]>([])

const getTopCategories = async () => {
    try {
        const res = await uiedCategoryAll()
        allCategories.value = res || []
        topCategories.value = (res || []).filter((item: any) => item.parentId === 0)
    } catch (error) {
        console.error('获取分类列表失败:', error)
    }
}

const getParentName = (parentId: number) => {
    const parent = allCategories.value.find(item => item.id === parentId)
    return parent?.name || '-'
}

// 编辑相关
const showEdit = ref(false)
const editLoading = ref(false)
const editFormRef = ref<FormInstance>()
const editData = reactive({
    id: 0,
    name: '',
    slug: '',
    parentId: 0,
    description: '',
    seoTitle: '',
    seoDescription: '',
    seoKeywords: '',
    icon: '',
    themeColor: '',
    sortOrder: 0,
    isActive: 1
})

const editRules: FormRules = {
    name: [{ required: true, message: '请输入分类名称', trigger: 'blur' }],
    slug: [{ required: true, message: '请输入分类别名', trigger: 'blur' }]
}

const resetEditData = () => {
    editData.id = 0
    editData.name = ''
    editData.slug = ''
    editData.parentId = 0
    editData.description = ''
    editData.seoTitle = ''
    editData.seoDescription = ''
    editData.seoKeywords = ''
    editData.icon = ''
    editData.themeColor = ''
    editData.sortOrder = 0
    editData.isActive = 1
}

const handleAdd = (parentId?: number) => {
    resetEditData()
    if (parentId) {
        editData.parentId = parentId
    }
    showEdit.value = true
}

const handleEdit = (row: any) => {
    editData.id = row.id
    editData.name = row.name
    editData.slug = row.slug || ''
    editData.parentId = row.parentId || 0
    editData.description = row.description || ''
    editData.seoTitle = row.seoTitle || ''
    editData.seoDescription = row.seoDescription || ''
    editData.seoKeywords = row.seoKeywords || ''
    editData.icon = row.icon || ''
    editData.themeColor = row.themeColor || ''
    editData.sortOrder = row.sortOrder || 0
    editData.isActive = row.isActive ? 1 : 0
    showEdit.value = true
}

const handleSubmit = async () => {
    await editFormRef.value?.validate()
    editLoading.value = true
    try {
        if (editData.id) {
            await uiedCategoryEdit(editData)
            feedback.msgSuccess('编辑成功')
        } else {
            await uiedCategoryAdd(editData)
            feedback.msgSuccess('添加成功')
        }
        showEdit.value = false
        getLists()
        getTopCategories()
    } finally {
        editLoading.value = false
    }
}

const handleDelete = async (id: number) => {
    await feedback.confirm('确定要删除该分类吗？删除后该分类下的网站将变为未分类状态。')
    await uiedCategoryDelete({ id })
    feedback.msgSuccess('删除成功')
    getLists()
    getTopCategories()
}

onMounted(() => {
    getTopCategories()
})

getLists()
</script>
