<!--
 * @copyright Tomda (https://www.tomda.top)
 * @copyright UIED技术团队 (https://fsuied.com)
 * @author UIED技术团队
 * @createDate 2026.2.20
-->
<template>
    <div class="consumer-level-page">
        <el-card class="!border-none" shadow="never">
            <div class="flex items-center justify-between">
                <span class="font-medium">用户等级管理</span>
                <div class="flex gap-2">
                    <el-button @click="handleSeedTestUsers">初始化测试用户</el-button>
                    <el-button type="primary" @click="handleAdd">新增等级</el-button>
                </div>
            </div>
            <el-alert
                title="说明：这里是站点终端用户等级（用于会员权益/功能开关），不是源码购买者账号管理。"
                type="info"
                :closable="false"
                class="mt-4"
            />
        </el-card>

        <el-card class="!border-none mt-4" shadow="never">
            <el-table :data="levelList" v-loading="loading" size="large">
                <el-table-column prop="id" label="ID" width="80" />
                <el-table-column prop="name" label="等级名称" min-width="180" />
                <el-table-column prop="levelValue" label="等级值" width="120" />
                <el-table-column prop="remark" label="备注" min-width="220" />
                <el-table-column label="默认等级" width="120">
                    <template #default="{ row }">
                        <el-tag :type="Number(row.isDefault) === 1 ? 'success' : 'info'">
                            {{ Number(row.isDefault) === 1 ? '是' : '否' }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="操作" width="160" fixed="right">
                    <template #default="{ row }">
                        <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
                        <el-button type="danger" link @click="handleDelete(row.id)">删除</el-button>
                    </template>
                </el-table-column>
            </el-table>
        </el-card>

        <el-dialog
            v-model="showEdit"
            :title="editData.id ? '编辑等级' : '新增等级'"
            width="520px"
            :close-on-click-modal="false"
        >
            <el-form ref="editFormRef" :model="editData" :rules="editRules" label-width="100px">
                <el-form-item label="等级名称" prop="name">
                    <el-input v-model="editData.name" placeholder="请输入等级名称" />
                </el-form-item>
                <el-form-item label="等级值" prop="levelValue">
                    <el-input-number v-model="editData.levelValue" :min="0" :max="999" />
                </el-form-item>
                <el-form-item label="备注">
                    <el-input v-model="editData.remark" type="textarea" :rows="3" />
                </el-form-item>
                <el-form-item label="默认等级">
                    <el-switch v-model="editData.isDefault" :active-value="1" :inactive-value="0" />
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

<script lang="ts" setup name="consumerLevel">
/**
 * @copyright Tomda (https://www.tomda.top)
 * @copyright UIED技术团队 (https://fsuied.com)
 * @author UIED技术团队
 * @createDate 2026.2.20
 */
import { onMounted, reactive, ref } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import feedback from '@/utils/feedback'
import {
    addUserLevel,
    delUserLevel,
    editUserLevel,
    getUserLevelList,
    seedUserTestUsers
} from '@/api/consumer'

const loading = ref(false)
const showEdit = ref(false)
const editLoading = ref(false)
const editFormRef = ref<FormInstance>()
const levelList = ref<any[]>([])

const editData = reactive({
    id: 0,
    name: '',
    levelValue: 0,
    remark: '',
    isDefault: 0
})

const editRules: FormRules = {
    name: [{ required: true, message: '请输入等级名称', trigger: 'blur' }],
    levelValue: [{ required: true, message: '请输入等级值', trigger: 'blur' }]
}

/**
 * 加载等级列表
 */
const loadLevelList = async () => {
    loading.value = true
    try {
        const data = await getUserLevelList()
        levelList.value = Array.isArray(data) ? data : []
    } finally {
        loading.value = false
    }
}

/**
 * 重置编辑表单
 */
const resetEditData = () => {
    editData.id = 0
    editData.name = ''
    editData.levelValue = 0
    editData.remark = ''
    editData.isDefault = 0
}

/**
 * 新增等级
 */
const handleAdd = () => {
    resetEditData()
    showEdit.value = true
}

/**
 * 编辑等级
 */
const handleEdit = (row: any) => {
    editData.id = Number(row.id || 0)
    editData.name = String(row.name || '')
    editData.levelValue = Number(row.levelValue || 0)
    editData.remark = String(row.remark || '')
    editData.isDefault = Number(row.isDefault || 0)
    showEdit.value = true
}

/**
 * 提交等级编辑
 */
const handleSubmit = async () => {
    await editFormRef.value?.validate()
    editLoading.value = true
    try {
        const payload = {
            id: editData.id || undefined,
            name: editData.name,
            levelValue: editData.levelValue,
            remark: editData.remark,
            isDefault: editData.isDefault
        }
        if (editData.id) {
            await editUserLevel(payload)
            feedback.msgSuccess('等级编辑成功')
        } else {
            await addUserLevel(payload)
            feedback.msgSuccess('等级新增成功')
        }
        showEdit.value = false
        await loadLevelList()
    } finally {
        editLoading.value = false
    }
}

/**
 * 删除等级
 */
const handleDelete = async (id: number) => {
    await feedback.confirm('确定删除该等级吗？')
    await delUserLevel({ id })
    feedback.msgSuccess('删除成功')
    await loadLevelList()
}

/**
 * 初始化测试用户
 */
const handleSeedTestUsers = async () => {
    const result = await seedUserTestUsers()
    const total = Number(result?.total || 0)
    feedback.msgSuccess(`测试用户初始化成功，共处理 ${total} 条`)
}

onMounted(() => {
    loadLevelList()
})
</script>
