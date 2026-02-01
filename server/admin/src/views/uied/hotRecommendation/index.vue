<!--
 * @file views/uied/hotRecommendation/index.vue
 * @description UIED 热门推荐管理
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
-->
<template>
    <div class="hot-recommendation-lists">
        <el-card class="!border-none" shadow="never">
            <div class="mb-4 flex justify-between">
                <el-button type="primary" @click="handleAdd">
                    <template #icon><icon name="el-icon-Plus" /></template>
                    添加推荐
                </el-button>
                <div class="text-gray-400">共 {{ pager.count }} 条推荐</div>
            </div>
            <el-table size="large" v-loading="pager.loading" :data="pager.lists">
                <el-table-column label="ID" prop="id" width="80" />
                <el-table-column label="网站" min-width="200">
                    <template #default="{ row }">
                        <div class="flex items-center gap-2">
                            <el-avatar v-if="row.websiteIcon" :src="row.websiteIcon" :size="24" shape="square" />
                            <span>{{ row.websiteName || row.title }}</span>
                        </div>
                    </template>
                </el-table-column>
                <el-table-column label="标题" prop="title" min-width="150" show-overflow-tooltip />
                <el-table-column label="位置" prop="position" width="100" />
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

        <!-- 编辑弹窗 -->
        <el-dialog v-model="showEdit" :title="editData.id ? '编辑推荐' : '添加推荐'" width="500px">
            <el-form ref="editFormRef" :model="editData" :rules="editRules" label-width="80px">
                <el-form-item label="选择网站" prop="websiteId">
                    <el-select v-model="editData.websiteId" filterable remote :remote-method="searchWebsites" 
                        placeholder="搜索网站" style="width: 100%">
                        <el-option v-for="w in websiteOptions" :key="w.id" :label="w.name" :value="w.id" />
                    </el-select>
                </el-form-item>
                <el-form-item label="标题">
                    <el-input v-model="editData.title" placeholder="留空则使用网站名称" />
                </el-form-item>
                <el-form-item label="描述">
                    <el-input v-model="editData.description" type="textarea" :rows="2" />
                </el-form-item>
                <el-form-item label="位置">
                    <el-select v-model="editData.position" style="width: 100%">
                        <el-option label="侧边栏" value="sidebar" />
                        <el-option label="首页" value="home" />
                        <el-option label="底部" value="footer" />
                    </el-select>
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
    </div>
</template>

<script lang="ts" setup name="uiedHotRecommendation">
import { uiedHotRecommendationList, uiedHotRecommendationAdd, uiedHotRecommendationEdit, uiedHotRecommendationDelete, uiedWebsiteSearch } from '@/api/uied'
import { usePaging } from '@/hooks/usePaging'
import feedback from '@/utils/feedback'
import type { FormInstance, FormRules } from 'element-plus'

const { pager, getLists } = usePaging({ fetchFun: uiedHotRecommendationList })

const showEdit = ref(false)
const editLoading = ref(false)
const editFormRef = ref<FormInstance>()
const editData = reactive({ id: 0, websiteId: undefined as number | undefined, title: '', description: '', position: 'sidebar', sortOrder: 0, isActive: true })
const editRules: FormRules = { websiteId: [{ required: true, message: '请选择网站', trigger: 'change' }] }

const websiteOptions = ref<any[]>([])
const searchWebsites = async (query: string) => {
    if (query) {
        const res = await uiedWebsiteSearch({ keyword: query, pageSize: 20 })
        websiteOptions.value = res?.lists || []
    }
}

const resetEditData = () => Object.assign(editData, { id: 0, websiteId: undefined, title: '', description: '', position: 'sidebar', sortOrder: 0, isActive: true })

const handleAdd = () => { resetEditData(); showEdit.value = true }
const handleEdit = (row: any) => { 
    Object.assign(editData, row)
    if (row.websiteId && row.websiteName) {
        websiteOptions.value = [{ id: row.websiteId, name: row.websiteName }]
    }
    showEdit.value = true 
}

const handleSubmit = async () => {
    await editFormRef.value?.validate()
    editLoading.value = true
    try {
        if (editData.id) { await uiedHotRecommendationEdit(editData); feedback.msgSuccess('编辑成功') }
        else { await uiedHotRecommendationAdd(editData); feedback.msgSuccess('添加成功') }
        showEdit.value = false
        getLists()
    } finally { editLoading.value = false }
}

const handleDelete = async (id: number) => {
    await feedback.confirm('确定要删除该推荐吗？')
    await uiedHotRecommendationDelete({ id })
    feedback.msgSuccess('删除成功')
    getLists()
}

getLists()
</script>
