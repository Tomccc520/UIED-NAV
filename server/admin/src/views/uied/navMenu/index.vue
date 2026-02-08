<!--
 * @file views/uied/navMenu/index.vue
 * @description UIED 导航菜单管理
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
-->
<template>
    <div class="nav-menu-lists">
        <el-card class="!border-none" shadow="never">
            <div class="mb-4 flex justify-between items-center">
                <div class="flex gap-4 items-center">
                    <el-button type="primary" @click="handleAdd(0)">
                        <template #icon><icon name="el-icon-Plus" /></template>
                        添加菜单
                    </el-button>
                    <div class="text-gray-500 text-sm">
                        共 <span class="text-primary font-medium">{{ totalMenus }}</span> 个菜单，
                        <span class="text-primary font-medium">{{ topLevelMenus }}</span> 个顶级分类
                    </div>
                </div>
                <el-button @click="toggleExpand">
                    {{ isExpanded ? '全部收起' : '全部展开' }}
                </el-button>
            </div>
            <el-table 
                ref="tableRef"
                size="large" 
                v-loading="loading" 
                :data="menuTree" 
                row-key="id" 
                :default-expand-all="isExpanded"
                :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
                border
            >
                <el-table-column label="菜单名称" prop="name" min-width="200">
                    <template #default="{ row }">
                        <div class="flex items-center gap-2">
                            <el-icon v-if="row.icon" class="text-gray-500"><component :is="row.icon" /></el-icon>
                            <span :class="{ 'font-medium': !row.parentId }">{{ row.name }}</span>
                            <el-tag v-if="row.label" :type="row.labelType === 'shop' ? 'success' : 'info'" size="small">
                                {{ row.label }}
                            </el-tag>
                            <el-tag v-if="row.children?.length" type="info" size="small" class="ml-1">
                                {{ row.children.length }}个子菜单
                            </el-tag>
                        </div>
                    </template>
                </el-table-column>
                <el-table-column label="链接" prop="url" min-width="200" show-overflow-tooltip />
                <el-table-column label="排序" prop="sortOrder" width="80" align="center" />
                <el-table-column label="新窗口" width="80" align="center">
                    <template #default="{ row }">
                        <el-tag :type="row.openInNewTab ? 'success' : 'info'" size="small">
                            {{ row.openInNewTab ? '是' : '否' }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="状态" width="80" align="center">
                    <template #default="{ row }">
                        <el-tag :type="row.isActive ? 'success' : 'info'" size="small">
                            {{ row.isActive ? '显示' : '隐藏' }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="操作" width="200" fixed="right" align="center">
                    <template #default="{ row }">
                        <el-button type="primary" link @click="handleAdd(row.id)">添加子菜单</el-button>
                        <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
                        <el-button type="danger" link @click="handleDelete(row.id)">删除</el-button>
                    </template>
                </el-table-column>
            </el-table>
        </el-card>

        <!-- 编辑弹窗 -->
        <el-dialog v-model="showEdit" :title="editData.id ? '编辑菜单' : '添加菜单'" width="500px">
            <el-form ref="editFormRef" :model="editData" :rules="editRules" label-width="80px">
                <el-form-item label="上级菜单">
                    <el-tree-select v-model="editData.parentId" :data="menuTreeOptions" check-strictly
                        :render-after-expand="false" placeholder="顶级菜单" style="width: 100%" />
                </el-form-item>
                <el-form-item label="菜单名称" prop="name">
                    <el-input v-model="editData.name" placeholder="请输入菜单名称" />
                </el-form-item>
                <el-form-item label="链接地址">
                    <el-input v-model="editData.url" placeholder="请输入链接地址" />
                </el-form-item>
                <el-form-item label="图标">
                    <el-input v-model="editData.icon" placeholder="图标类名" />
                </el-form-item>
                <el-form-item label="排序">
                    <el-input-number v-model="editData.sortOrder" :min="0" />
                </el-form-item>
                <el-form-item label="标签">
                    <el-input v-model="editData.label" placeholder="如: New, 热门" />
                </el-form-item>
                <el-form-item label="标签类型">
                    <el-select v-model="editData.labelType" placeholder="选择标签样式" clearable style="width: 100%">
                        <el-option label="信息(蓝色)" value="info" />
                        <el-option label="成功(绿色)" value="shop" />
                        <el-option label="警告(橙色)" value="warning" />
                        <el-option label="危险(红色)" value="danger" />
                    </el-select>
                </el-form-item>
                <el-form-item label="新窗口">
                    <el-switch v-model="editData.openInNewTab" />
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

<script lang="ts" setup name="uiedNavMenu">
import { uiedNavMenuAll, uiedNavMenuAdd, uiedNavMenuEdit, uiedNavMenuDelete } from '@/api/uied'
import feedback from '@/utils/feedback'
import type { FormInstance, FormRules, TableInstance } from 'element-plus'

const loading = ref(false)
const menuTree = ref<any[]>([])
const menuTreeOptions = ref<any[]>([])
const isExpanded = ref(true)
const tableRef = ref<TableInstance>()

// 计算菜单统计
const totalMenus = computed(() => {
    const countMenus = (items: any[]): number => {
        return items.reduce((sum, item) => sum + 1 + countMenus(item.children || []), 0)
    }
    return countMenus(menuTree.value)
})

const topLevelMenus = computed(() => menuTree.value.length)

const showEdit = ref(false)
const editLoading = ref(false)
const editFormRef = ref<FormInstance>()
const editData = reactive({ id: 0, parentId: 0, name: '', url: '', icon: '', sortOrder: 0, label: '', labelType: '', openInNewTab: false, isActive: true })
const editRules: FormRules = { name: [{ required: true, message: '请输入菜单名称', trigger: 'blur' }] }

const getLists = async () => {
    loading.value = true
    try {
        const res = await uiedNavMenuAll()
        // request interceptor 已解包 data，res 直接就是数组
        menuTree.value = Array.isArray(res) ? res : (res || [])
        menuTreeOptions.value = [{ value: 0, label: '顶级菜单' }, ...buildTreeOptions(menuTree.value)]
    } finally {
        loading.value = false
    }
}

const buildTreeOptions = (items: any[]): any[] => {
    return items.map(item => ({
        value: item.id,
        label: item.name,
        children: item.children?.length ? buildTreeOptions(item.children) : undefined,
    }))
}

const resetEditData = () => Object.assign(editData, { id: 0, parentId: 0, name: '', url: '', icon: '', sortOrder: 0, label: '', labelType: '', openInNewTab: false, isActive: true })

const handleAdd = (parentId: number) => { resetEditData(); editData.parentId = parentId; showEdit.value = true }
const handleEdit = (row: any) => { Object.assign(editData, row); showEdit.value = true }

const handleSubmit = async () => {
    await editFormRef.value?.validate()
    editLoading.value = true
    try {
        if (editData.id) { await uiedNavMenuEdit(editData); feedback.msgSuccess('编辑成功') }
        else { await uiedNavMenuAdd(editData); feedback.msgSuccess('添加成功') }
        showEdit.value = false
        getLists()
    } finally { editLoading.value = false }
}

const handleDelete = async (id: number) => {
    await feedback.confirm('确定要删除该菜单吗？子菜单也会被删除')
    await uiedNavMenuDelete({ id })
    feedback.msgSuccess('删除成功')
    getLists()
}

// 切换展开/收起
const toggleExpand = () => {
    isExpanded.value = !isExpanded.value
    // 重新加载数据以应用展开状态
    getLists()
}

getLists()
</script>
