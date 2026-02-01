<!--
 * @file views/uied/page/index.vue
 * @description UIED 页面管理
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
-->
<template>
    <div class="page-lists">
        <el-card class="!border-none" shadow="never">
            <div class="mb-4 flex justify-between">
                <el-button type="primary" @click="handleAdd">
                    <template #icon><icon name="el-icon-Plus" /></template>
                    添加页面
                </el-button>
                <div class="text-gray-400">共 {{ pager.count }} 个页面</div>
            </div>
            <el-table size="large" v-loading="pager.loading" :data="pager.lists">
                <el-table-column label="ID" prop="id" width="80" />
                <el-table-column label="页面名称" prop="name" min-width="120" />
                <el-table-column label="别名" prop="slug" min-width="100" />
                <el-table-column label="标题" prop="title" min-width="150" show-overflow-tooltip />
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
                        <el-button type="primary" link @click="handleCategories(row)">分类配置</el-button>
                        <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
                        <el-button type="danger" link @click="handleDelete(row.id)">删除</el-button>
                    </template>
                </el-table-column>
            </el-table>
            <div class="flex justify-end mt-4">
                <pagination v-model="pager" @change="getLists" />
            </div>
        </el-card>

        <!-- 编辑弹窗 -->
        <el-dialog v-model="showEdit" :title="editData.id ? '编辑页面' : '添加页面'" width="600px">
            <el-form ref="editFormRef" :model="editData" :rules="editRules" label-width="100px">
                <el-form-item label="页面名称" prop="name">
                    <el-input v-model="editData.name" placeholder="请输入页面名称" />
                </el-form-item>
                <el-form-item label="页面别名" prop="slug">
                    <el-input v-model="editData.slug" placeholder="请输入页面别名（URL友好）" />
                </el-form-item>
                <el-form-item label="页面标题">
                    <el-input v-model="editData.title" placeholder="请输入页面标题" />
                </el-form-item>
                <el-form-item label="页面描述">
                    <el-input v-model="editData.description" type="textarea" :rows="2" />
                </el-form-item>
                <el-form-item label="Hero标题">
                    <el-input v-model="editData.heroTitle" placeholder="首屏大标题" />
                </el-form-item>
                <el-form-item label="Hero副标题">
                    <el-input v-model="editData.heroSubtitle" placeholder="首屏副标题" />
                </el-form-item>
                <el-form-item label="排序">
                    <el-input-number v-model="editData.sortOrder" :min="0" />
                </el-form-item>
                <el-form-item label="状态">
                    <el-switch v-model="editData.isActive" />
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button @click="showEdit = false">取消</el-button>
                <el-button type="primary" :loading="editLoading" @click="handleSubmit">确定</el-button>
            </template>
        </el-dialog>

        <!-- 分类配置弹窗 -->
        <el-dialog v-model="showCategories" title="页面分类配置" width="500px">
            <el-transfer
                v-model="selectedCategories"
                :data="allCategories"
                :titles="['可选分类', '已选分类']"
                :props="{ key: 'id', label: 'name' }"
            />
            <template #footer>
                <el-button @click="showCategories = false">取消</el-button>
                <el-button type="primary" :loading="categoryLoading" @click="handleSaveCategories">保存</el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script lang="ts" setup name="uiedPage">
import { uiedPageList, uiedPageAdd, uiedPageEdit, uiedPageDelete, uiedPageCategories, uiedPageUpdateCategories, uiedCategoryAll } from '@/api/uied'
import { usePaging } from '@/hooks/usePaging'
import feedback from '@/utils/feedback'
import type { FormInstance, FormRules } from 'element-plus'

const { pager, getLists } = usePaging({ fetchFun: uiedPageList })

const showEdit = ref(false)
const editLoading = ref(false)
const editFormRef = ref<FormInstance>()
const editData = reactive({ id: 0, name: '', slug: '', title: '', description: '', heroTitle: '', heroSubtitle: '', sortOrder: 0, isActive: true })
const editRules: FormRules = {
    name: [{ required: true, message: '请输入页面名称', trigger: 'blur' }],
    slug: [{ required: true, message: '请输入页面别名', trigger: 'blur' }]
}

const resetEditData = () => Object.assign(editData, { id: 0, name: '', slug: '', title: '', description: '', heroTitle: '', heroSubtitle: '', sortOrder: 0, isActive: true })

const handleAdd = () => { resetEditData(); showEdit.value = true }
const handleEdit = (row: any) => { Object.assign(editData, row); showEdit.value = true }

const handleSubmit = async () => {
    await editFormRef.value?.validate()
    editLoading.value = true
    try {
        if (editData.id) { await uiedPageEdit(editData); feedback.msgSuccess('编辑成功') }
        else { await uiedPageAdd(editData); feedback.msgSuccess('添加成功') }
        showEdit.value = false
        getLists()
    } finally { editLoading.value = false }
}

const handleDelete = async (id: number) => {
    await feedback.confirm('确定要删除该页面吗？')
    await uiedPageDelete({ id })
    feedback.msgSuccess('删除成功')
    getLists()
}

// 分类配置
const showCategories = ref(false)
const categoryLoading = ref(false)
const currentPageId = ref(0)
const allCategories = ref<any[]>([])
const selectedCategories = ref<number[]>([])

const handleCategories = async (row: any) => {
    currentPageId.value = row.id
    const [cats, pageCats] = await Promise.all([uiedCategoryAll(), uiedPageCategories({ id: row.id })])
    allCategories.value = cats || []
    selectedCategories.value = (pageCats || []).map((c: any) => c.id)
    showCategories.value = true
}

const handleSaveCategories = async () => {
    categoryLoading.value = true
    try {
        await uiedPageUpdateCategories({ pageId: currentPageId.value, categoryIds: selectedCategories.value })
        feedback.msgSuccess('保存成功')
        showCategories.value = false
    } finally { categoryLoading.value = false }
}

getLists()
</script>
