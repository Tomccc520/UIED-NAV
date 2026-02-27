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
                            <icon
                                v-if="resolveMenuIcon(row.icon)"
                                :name="resolveMenuIcon(row.icon)"
                                :size="16"
                            />
                            <span :class="{ 'font-medium': !row.parentId }">{{ row.name }}</span>
                            <el-tag
                                v-if="row.label"
                                :type="row.labelType === 'shop' ? 'success' : 'info'"
                                size="small"
                            >
                                {{ row.label }}
                            </el-tag>
                            <el-tag
                                v-if="row.children?.length"
                                type="info"
                                size="small"
                                class="ml-1"
                            >
                                {{ row.children.length }}个子菜单
                            </el-tag>
                        </div>
                    </template>
                </el-table-column>
                <el-table-column label="分类层级" width="100" align="center">
                    <template #default="{ row }">
                        <el-tag :type="row.parentId ? 'info' : 'success'" size="small">
                            {{ row.parentId ? '子菜单' : '分类' }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="链接类型" width="100" align="center">
                    <template #default="{ row }">
                        <el-tag :type="row.linkMode === 'builtin' ? 'warning' : 'info'" size="small">
                            {{ row.linkMode === 'builtin' ? '内置功能' : '自定义' }}
                        </el-tag>
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
                        <el-button type="primary" link @click="handleAdd(row.id)"
                            >添加子菜单</el-button
                        >
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
                    <el-tree-select
                        v-model="editData.parentId"
                        :data="menuTreeOptions"
                        check-strictly
                        :render-after-expand="false"
                        placeholder="顶级菜单"
                        style="width: 100%"
                    />
                </el-form-item>
                <el-form-item label="菜单名称" prop="name">
                    <el-input v-model="editData.name" placeholder="请输入菜单名称" />
                </el-form-item>
                <el-form-item label="链接类型">
                    <el-radio-group v-model="editData.linkMode">
                        <el-radio label="custom">自定义链接</el-radio>
                        <el-radio label="builtin">内置功能</el-radio>
                    </el-radio-group>
                </el-form-item>
                <el-form-item v-if="editData.linkMode === 'builtin'" label="内置功能" prop="builtinKey">
                    <el-select v-model="editData.builtinKey" placeholder="请选择内置功能" style="width: 100%">
                        <el-option
                            v-for="item in builtinNavEntryOptions"
                            :key="item.key"
                            :label="item.label"
                            :value="item.key"
                        />
                    </el-select>
                    <div class="text-xs text-gray-400 mt-1">
                        运营只需配置标题/标签/排序，路径由系统自动维护
                        <span v-if="builtinLinkPreview">（当前预览：{{ builtinLinkPreview }}）</span>
                    </div>
                </el-form-item>
                <el-form-item v-else label="链接地址">
                    <el-input v-model="editData.url" placeholder="请输入链接地址" />
                </el-form-item>
                <el-form-item label="图标">
                    <div class="w-full">
                        <icon-picker v-model="editData.icon" />
                        <div class="text-xs text-gray-400 mt-1">
                            推荐使用图标选择器，系统会自动保存标准图标名
                        </div>
                    </div>
                </el-form-item>
                <el-form-item label="排序">
                    <el-input-number v-model="editData.sortOrder" :min="0" />
                </el-form-item>
                <el-form-item label="标签">
                    <el-input v-model="editData.label" placeholder="如: New, 热门" />
                </el-form-item>
                <el-form-item label="标签类型">
                    <el-select
                        v-model="editData.labelType"
                        placeholder="选择标签样式"
                        clearable
                        style="width: 100%"
                    >
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
                <el-button type="primary" :loading="editLoading" @click="handleSubmit"
                    >确定</el-button
                >
            </template>
        </el-dialog>
    </div>
</template>

<script lang="ts" setup name="uiedNavMenu">
import { uiedNavMenuAll, uiedNavMenuAdd, uiedNavMenuEdit, uiedNavMenuDelete } from '@/api/uied'
import feedback from '@/utils/feedback'
import type { FormInstance, FormRules, TableInstance } from 'element-plus'
import {
    EL_ICON_PREFIX,
    LOCAL_ICON_PREFIX,
    getElementPlusIconNames,
    getLocalIconNames
} from '@/components/icon'

interface NavMenuItem {
    id: number
    parentId: number
    name: string
    url: string
    icon: string
    sortOrder: number
    label: string
    labelType: string
    openInNewTab: boolean
    isActive: boolean
    builtinKey?: string
    linkMode?: 'custom' | 'builtin'
    children?: NavMenuItem[]
}

interface BuiltinNavEntryOption {
    key: string
    label: string
    defaultPath: string
}

const loading = ref(false)
const menuTree = ref<NavMenuItem[]>([])
const menuTreeOptions = ref<any[]>([])
const isExpanded = ref(true)
const tableRef = ref<TableInstance>()
const iconNameSet = new Set<string>([...getElementPlusIconNames(), ...getLocalIconNames()])
const builtinNavEntryOptions: BuiltinNavEntryOption[] = [
    { key: 'daily_hot', label: '每日热榜', defaultPath: '/p/daily-hot' }
]

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
const editData = reactive({
    id: 0,
    parentId: 0,
    name: '',
    linkMode: 'custom' as 'custom' | 'builtin',
    builtinKey: '',
    url: '',
    icon: '',
    sortOrder: 0,
    label: '',
    labelType: '',
    openInNewTab: false,
    isActive: true
})
const editRules: FormRules = {
    name: [{ required: true, message: '请输入菜单名称', trigger: 'blur' }],
    builtinKey: [{
        validator: (_rule, value, callback) => {
            if (editData.linkMode === 'builtin' && !String(value || '').trim()) {
                callback(new Error('请选择内置功能'))
                return
            }
            callback()
        },
        trigger: 'change'
    }]
}

/**
 * 获取内置入口默认路径（用于内置功能模式自动回填）
 */
const getBuiltinDefaultPath = (builtinKey?: string): string => {
    const option = builtinNavEntryOptions.find((item) => item.key === String(builtinKey || '').trim())
    return option?.defaultPath || ''
}

/**
 * 内置入口路径预览
 */
const builtinLinkPreview = computed(() => {
    if (editData.linkMode !== 'builtin') return ''
    return getBuiltinDefaultPath(editData.builtinKey)
})

/**
 * 解析并规范化图标名称，兼容历史无前缀图标值
 */
const normalizeIconName = (icon?: string): string => {
    if (!icon) return ''
    const iconName = String(icon).trim()
    if (!iconName) return ''
    if (iconName.startsWith(EL_ICON_PREFIX) || iconName.startsWith(LOCAL_ICON_PREFIX))
        return iconName
    return `${EL_ICON_PREFIX}${iconName}`
}

/**
 * 获取可安全渲染的图标名，避免无效图标导致组件渲染异常
 */
const resolveMenuIcon = (icon?: string): string => {
    const normalized = normalizeIconName(icon)
    return iconNameSet.has(normalized) ? normalized : ''
}

/**
 * 获取导航菜单树数据
 */
const getLists = async () => {
    loading.value = true
    try {
        const res = await uiedNavMenuAll()
        // request interceptor 已解包 data，res 直接就是数组
        menuTree.value = (Array.isArray(res) ? res : res || []).map((item: NavMenuItem) => ({
            ...item,
            icon: normalizeIconName(item.icon),
            linkMode: item.builtinKey ? 'builtin' : 'custom'
        }))
        menuTreeOptions.value = [
            { value: 0, label: '顶级菜单' },
            ...buildTreeOptions(menuTree.value)
        ]
    } finally {
        loading.value = false
    }
}

/**
 * 构建树形选择数据
 */
const buildTreeOptions = (items: NavMenuItem[]): any[] => {
    return items.map((item) => ({
        value: item.id,
        label: item.name,
        children: item.children?.length ? buildTreeOptions(item.children) : undefined
    }))
}

/**
 * 重置编辑表单数据
 */
const resetEditData = () =>
    Object.assign(editData, {
        id: 0,
        parentId: 0,
        name: '',
        linkMode: 'custom',
        builtinKey: '',
        url: '',
        icon: '',
        sortOrder: 0,
        label: '',
        labelType: '',
        openInNewTab: false,
        isActive: true
    })

/**
 * 打开新增菜单弹窗
 */
const handleAdd = (parentId: number) => {
    resetEditData()
    editData.parentId = parentId
    showEdit.value = true
}

/**
 * 打开编辑菜单弹窗
 */
const handleEdit = (row: NavMenuItem) => {
    Object.assign(editData, row, {
        icon: normalizeIconName(row.icon),
        linkMode: row.builtinKey ? 'builtin' : 'custom',
        builtinKey: String(row.builtinKey || '')
    })
    showEdit.value = true
}

/**
 * 当链接类型切换为内置功能时，同步默认路径（仅做回填预览/保存兜底）
 */
watch(
    () => [editData.linkMode, editData.builtinKey],
    ([linkMode]) => {
        if (linkMode !== 'builtin') return
        const defaultPath = getBuiltinDefaultPath(editData.builtinKey)
        if (defaultPath) {
            editData.url = defaultPath
        }
    },
    { immediate: false }
)

/**
 * 提交菜单编辑数据
 */
const handleSubmit = async () => {
    await editFormRef.value?.validate()
    editLoading.value = true
    try {
        const submitData = {
            ...editData,
            icon: normalizeIconName(editData.icon),
            builtinKey: editData.linkMode === 'builtin' ? String(editData.builtinKey || '').trim() : '',
            url: editData.linkMode === 'builtin'
                ? (getBuiltinDefaultPath(editData.builtinKey) || String(editData.url || ''))
                : String(editData.url || '').trim()
        }
        if (editData.id) {
            await uiedNavMenuEdit(submitData)
            feedback.msgSuccess('编辑成功')
        } else {
            await uiedNavMenuAdd(submitData)
            feedback.msgSuccess('添加成功')
        }
        showEdit.value = false
        getLists()
    } finally {
        editLoading.value = false
    }
}

/**
 * 删除菜单
 */
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
