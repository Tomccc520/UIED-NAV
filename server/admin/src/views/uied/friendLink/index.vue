<!--
 * @file views/uied/friendLink/index.vue
 * @description UIED 友情链接管理
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
-->
<template>
    <div class="friend-link-lists">
        <el-card class="!border-none" shadow="never">
            <div class="mb-4 flex justify-between">
                <el-button type="primary" @click="handleAdd">
                    <template #icon><icon name="el-icon-Plus" /></template>
                    添加链接
                </el-button>
                <div class="text-gray-400">共 {{ pager.count }} 条链接</div>
            </div>
            <el-table size="large" v-loading="pager.loading" :data="pager.lists">
                <el-table-column label="ID" prop="id" width="80" />
                <el-table-column label="名称" prop="name" min-width="150" />
                <el-table-column label="链接" prop="url" min-width="200" show-overflow-tooltip />
                <el-table-column label="Logo" width="80">
                    <template #default="{ row }">
                        <el-avatar v-if="row.logo" :src="row.logo" :size="32" shape="square" />
                        <span v-else>-</span>
                    </template>
                </el-table-column>
                <el-table-column
                    label="描述"
                    prop="description"
                    min-width="150"
                    show-overflow-tooltip
                />
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
        <el-dialog v-model="showEdit" :title="editData.id ? '编辑链接' : '添加链接'" width="500px">
            <el-form ref="editFormRef" :model="editData" :rules="editRules" label-width="80px">
                <el-form-item label="名称" prop="name">
                    <el-input v-model="editData.name" placeholder="请输入名称" />
                </el-form-item>
                <el-form-item label="链接" prop="url">
                    <el-input v-model="editData.url" placeholder="请输入链接地址" />
                </el-form-item>
                <el-form-item label="Logo">
                    <el-input v-model="editData.logo" placeholder="Logo URL" />
                </el-form-item>
                <el-form-item label="描述">
                    <el-input v-model="editData.description" type="textarea" :rows="2" />
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
                <el-button type="primary" :loading="editLoading" @click="handleSubmit"
                    >确定</el-button
                >
            </template>
        </el-dialog>
    </div>
</template>

<script lang="ts" setup name="uiedFriendLink">
import {
    uiedFriendLinkList,
    uiedFriendLinkAdd,
    uiedFriendLinkEdit,
    uiedFriendLinkDelete
} from '@/api/uied'
import { usePaging } from '@/hooks/usePaging'
import feedback from '@/utils/feedback'
import type { FormInstance, FormRules } from 'element-plus'

const { pager, getLists } = usePaging({ fetchFun: uiedFriendLinkList })

const showEdit = ref(false)
const editLoading = ref(false)
const editFormRef = ref<FormInstance>()
const editData = reactive({
    id: 0,
    name: '',
    url: '',
    logo: '',
    description: '',
    sortOrder: 0,
    isActive: true
})
const editRules: FormRules = {
    name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
    url: [{ required: true, message: '请输入链接', trigger: 'blur' }]
}

const resetEditData = () =>
    Object.assign(editData, {
        id: 0,
        name: '',
        url: '',
        logo: '',
        description: '',
        sortOrder: 0,
        isActive: true
    })

const handleAdd = () => {
    resetEditData()
    showEdit.value = true
}
const handleEdit = (row: any) => {
    Object.assign(editData, row)
    showEdit.value = true
}

const handleSubmit = async () => {
    await editFormRef.value?.validate()
    editLoading.value = true
    try {
        if (editData.id) {
            await uiedFriendLinkEdit(editData)
            feedback.msgSuccess('编辑成功')
        } else {
            await uiedFriendLinkAdd(editData)
            feedback.msgSuccess('添加成功')
        }
        showEdit.value = false
        getLists()
    } finally {
        editLoading.value = false
    }
}

const handleDelete = async (id: number) => {
    await feedback.confirm('确定要删除该链接吗？')
    await uiedFriendLinkDelete({ id })
    feedback.msgSuccess('删除成功')
    getLists()
}

getLists()
</script>
