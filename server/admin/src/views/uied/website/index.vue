<!--
 * @file views/uied/website/index.vue
 * @description UIED 网站管理页面 - 含详情页编辑
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 2.0.0
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
                    <el-select class="w-[200px]" v-model="queryParams.categoryId" clearable placeholder="全部分类">
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
                    <el-button type="danger" :disabled="!selectedIds.length" @click="handleBatchDelete">
                        批量删除
                    </el-button>
                </div>
                <div class="text-gray-400">
                    共 {{ pager.count }} 个网站
                </div>
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
                        <el-avatar v-if="row.iconUrl" :src="row.iconUrl" :size="32" shape="square" />
                        <el-avatar v-else :size="32" shape="square">
                            {{ row.name?.charAt(0) }}
                        </el-avatar>
                    </template>
                </el-table-column>
                <el-table-column label="网站名称" prop="name" min-width="150" show-overflow-tooltip />
                <el-table-column label="分类" prop="categoryName" width="120" />
                <el-table-column label="URL" min-width="200" show-overflow-tooltip>
                    <template #default="{ row }">
                        <a :href="row.url" target="_blank" class="text-primary hover:underline">
                            {{ row.url }}
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

        <!-- 添加/编辑弹窗 -->
        <el-dialog
            v-model="showEdit"
            :title="editData.id ? '编辑网站' : '添加网站'"
            width="800px"
            :close-on-click-modal="false"
            top="5vh"
        >
            <el-tabs v-model="activeTab">
                <!-- 基础信息 -->
                <el-tab-pane label="基础信息" name="basic">
                    <el-form ref="editFormRef" :model="editData" :rules="editRules" label-width="100px">
                        <el-form-item label="网站名称" prop="name">
                            <el-input v-model="editData.name" placeholder="请输入网站名称" />
                        </el-form-item>
                        <el-form-item label="固定链接">
                            <el-input v-model="editData.slug" placeholder="留空自动生成，用于详情页URL">
                                <template #prepend>/website/</template>
                            </el-input>
                        </el-form-item>
                        <el-form-item label="网站URL" prop="url">
                            <el-input v-model="editData.url" placeholder="请输入网站URL" />
                        </el-form-item>
                        <el-form-item label="所属分类" prop="categoryId">
                            <el-select v-model="editData.categoryId" placeholder="请选择分类" style="width: 100%">
                                <el-option
                                    v-for="item in categoryList"
                                    :key="item.id"
                                    :label="item.name"
                                    :value="item.id"
                                />
                            </el-select>
                        </el-form-item>
                        <el-form-item label="网站描述">
                            <el-input v-model="editData.description" type="textarea" :rows="3" placeholder="请输入网站描述" />
                        </el-form-item>
                        <el-form-item label="图标URL">
                            <el-input v-model="editData.iconUrl" placeholder="请输入图标URL" />
                        </el-form-item>
                        <el-form-item label="标签">
                            <el-select
                                v-model="editData.tags"
                                multiple
                                filterable
                                allow-create
                                default-first-option
                                placeholder="输入标签后回车添加"
                                style="width: 100%"
                            />
                        </el-form-item>
                        <el-row :gutter="16">
                            <el-col :span="8">
                                <el-form-item label="排序">
                                    <el-input-number v-model="editData.sortOrder" :min="0" :max="9999" style="width: 100%" />
                                </el-form-item>
                            </el-col>
                            <el-col :span="8">
                                <el-form-item label="状态">
                                    <el-switch v-model="editData.isActive" :active-value="1" :inactive-value="0" />
                                </el-form-item>
                            </el-col>
                            <el-col :span="8">
                                <el-form-item label="置顶">
                                    <el-switch v-model="editData.isPinned" :active-value="1" :inactive-value="0" />
                                </el-form-item>
                            </el-col>
                        </el-row>
                    </el-form>
                </el-tab-pane>

                <!-- 详情页内容 -->
                <el-tab-pane label="详情页" name="detail">
                    <el-form :model="editData" label-width="100px">
                        <el-form-item label="访问按钮">
                            <el-input v-model="editData.visitBtnText" placeholder="默认：访问网站" />
                        </el-form-item>
                        <el-form-item label="详情内容">
                            <div style="width: 100%">
                                <el-input
                                    v-model="editData.detailContent"
                                    type="textarea"
                                    :rows="12"
                                    placeholder="支持 HTML 和简单 Markdown 格式，用于网站详情页展示"
                                />
                                <div class="text-gray-400 text-xs mt-1">
                                    支持 HTML 标签和简单 Markdown（标题、加粗、链接、列表等）
                                </div>
                            </div>
                        </el-form-item>
                        <el-form-item label="产品截图">
                            <div style="width: 100%">
                                <div v-for="(_url, index) in screenshotList" :key="index" class="flex items-center mb-2 gap-2">
                                    <el-input v-model="screenshotList[index]" placeholder="截图URL" />
                                    <el-button type="danger" link @click="removeScreenshot(index)">删除</el-button>
                                </div>
                                <el-button type="primary" link @click="addScreenshot">+ 添加截图URL</el-button>
                                <div class="text-gray-400 text-xs mt-1">
                                    添加产品截图URL，将在详情页展示为图片画廊
                                </div>
                            </div>
                        </el-form-item>
                    </el-form>
                </el-tab-pane>

                <!-- SEO 设置 -->
                <el-tab-pane label="SEO" name="seo">
                    <el-form :model="editData" label-width="100px">
                        <el-form-item label="SEO 标题">
                            <el-input v-model="editData.seoTitle" placeholder="留空使用网站名称" maxlength="100" show-word-limit />
                        </el-form-item>
                        <el-form-item label="SEO 描述">
                            <el-input
                                v-model="editData.seoDescription"
                                type="textarea"
                                :rows="3"
                                placeholder="留空使用网站描述"
                                maxlength="300"
                                show-word-limit
                            />
                        </el-form-item>
                        <el-form-item label="SEO 关键词">
                            <el-input v-model="editData.seoKeywords" placeholder="多个关键词用逗号分隔" maxlength="200" show-word-limit />
                        </el-form-item>
                    </el-form>
                </el-tab-pane>
            </el-tabs>
            <template #footer>
                <el-button @click="showEdit = false">取消</el-button>
                <el-button type="primary" :loading="editLoading" @click="handleSubmit">确定</el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script lang="ts" setup name="uiedWebsite">
import { uiedWebsiteList, uiedWebsiteAdd, uiedWebsiteEdit, uiedWebsiteDelete, uiedWebsiteBatchDelete, uiedWebsiteDetail, uiedCategoryAll } from '@/api/uied'
import { usePaging } from '@/hooks/usePaging'
import feedback from '@/utils/feedback'
import type { FormInstance, FormRules } from 'element-plus'

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
    selectedIds.value = rows.map(row => row.id)
}

// 编辑相关
const showEdit = ref(false)
const editLoading = ref(false)
const editFormRef = ref<FormInstance>()
const activeTab = ref('basic')

// 截图列表（独立管理，提交时合并到 editData）
const screenshotList = ref<string[]>([])

const addScreenshot = () => {
    screenshotList.value.push('')
}

const removeScreenshot = (index: number) => {
    screenshotList.value.splice(index, 1)
}

const editData = reactive({
    id: 0,
    name: '',
    slug: '',
    url: '',
    categoryId: '' as string | number,
    description: '',
    iconUrl: '',
    tags: [] as string[],
    sortOrder: 0,
    isActive: 1,
    isPinned: 0,
    // 详情页字段
    detailContent: '',
    visitBtnText: '',
    // SEO 字段
    seoTitle: '',
    seoDescription: '',
    seoKeywords: '',
})

const editRules: FormRules = {
    name: [{ required: true, message: '请输入网站名称', trigger: 'blur' }],
    url: [{ required: true, message: '请输入网站URL', trigger: 'blur' }],
    categoryId: [{ required: true, message: '请选择分类', trigger: 'change' }]
}

const resetEditData = () => {
    editData.id = 0
    editData.name = ''
    editData.slug = ''
    editData.url = ''
    editData.categoryId = ''
    editData.description = ''
    editData.iconUrl = ''
    editData.tags = []
    editData.sortOrder = 0
    editData.isActive = 1
    editData.isPinned = 0
    editData.detailContent = ''
    editData.visitBtnText = ''
    editData.seoTitle = ''
    editData.seoDescription = ''
    editData.seoKeywords = ''
    screenshotList.value = []
    activeTab.value = 'basic'
}

const handleAdd = () => {
    resetEditData()
    showEdit.value = true
}

const handleEdit = async (row: any) => {
    resetEditData()
    editLoading.value = true
    showEdit.value = true
    try {
        // 通过详情接口获取完整数据（包含 detailContent、screenshots 等）
        const detail = await uiedWebsiteDetail({ id: row.id })
        const data = detail || row
        editData.id = data.id
        editData.name = data.name || ''
        editData.slug = data.slug || ''
        editData.url = data.url || ''
        editData.categoryId = data.categoryId || data.category_id || null
        editData.description = data.description || ''
        editData.iconUrl = data.iconUrl || data.icon_url || ''
        editData.tags = Array.isArray(data.tags) ? data.tags : []
        editData.sortOrder = data.order || data.sortOrder || data.sort || 0
        editData.isActive = (data.isActive || data.status !== 'disabled') ? 1 : 0
        editData.isPinned = data.isPinned ? 1 : 0
        editData.detailContent = data.detailContent || data.detail_content || ''
        editData.visitBtnText = data.visitBtnText || data.visit_btn_text || ''
        editData.seoTitle = data.seoTitle || data.seo_title || ''
        editData.seoDescription = data.seoDescription || data.seo_description || ''
        editData.seoKeywords = data.seoKeywords || data.seo_keywords || ''
        // 截图
        const screenshots = data.screenshots || []
        screenshotList.value = Array.isArray(screenshots) ? [...screenshots] : []
    } catch (error) {
        console.error('获取网站详情失败:', error)
        // 降级使用列表行数据
        editData.id = row.id
        editData.name = row.name || ''
        editData.url = row.url || ''
        editData.categoryId = row.categoryId || ''
        editData.description = row.description || ''
        editData.iconUrl = row.iconUrl || ''
        editData.sortOrder = row.sortOrder || 0
        editData.isActive = row.isActive ? 1 : 0
    } finally {
        editLoading.value = false
    }
}

const handleSubmit = async () => {
    await editFormRef.value?.validate()
    editLoading.value = true
    try {
        // 合并截图数据
        const screenshots = screenshotList.value.filter(url => url.trim() !== '')
        const submitData = {
            ...editData,
            screenshots,
            order: editData.sortOrder,
        }
        if (editData.id) {
            await uiedWebsiteEdit(submitData)
            feedback.msgSuccess('编辑成功')
        } else {
            await uiedWebsiteAdd(submitData)
            feedback.msgSuccess('添加成功')
        }
        showEdit.value = false
        getLists()
    } finally {
        editLoading.value = false
    }
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
