<!--
 * @file views/uied/websiteTag/index.vue
 * @description 网站标签管理页面
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
-->
<template>
  <div class="website-tag">
    <el-card class="!border-none" shadow="never">
      <el-form ref="formRef" class="mb-[-16px]" :model="queryParams" :inline="true">
        <el-form-item label="标签名称">
          <el-input v-model="queryParams.name" placeholder="请输入标签名称" clearable @keyup.enter="resetPage" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="resetPage">查询</el-button>
          <el-button @click="resetParams">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
    <el-card class="!border-none mt-4" shadow="never">
      <div class="flex justify-between mb-4">
        <el-button type="primary" @click="handleAdd">
          <template #icon><el-icon><Plus /></el-icon></template>
          新增标签
        </el-button>
      </div>
      <el-table v-loading="loading" :data="lists" border>
        <el-table-column label="ID" prop="id" width="80" />
        <el-table-column label="标签名称" prop="name" min-width="120">
          <template #default="{ row }">
            <el-tag :color="row.color" effect="dark" style="border: none;">{{ row.name }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="标识" prop="slug" min-width="100" />
        <el-table-column label="颜色" prop="color" width="100">
          <template #default="{ row }">
            <div class="flex items-center">
              <span class="w-4 h-4 rounded mr-2" :style="{ backgroundColor: row.color }"></span>
              {{ row.color }}
            </div>
          </template>
        </el-table-column>
        <el-table-column label="网站数量" prop="websiteCount" width="100" align="center" />
        <el-table-column label="排序" prop="order" width="80" align="center" />
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

    <!-- 编辑弹窗 -->
    <el-dialog v-model="showEdit" :title="editData.id ? '编辑标签' : '新增标签'" width="600px">
      <el-form ref="editFormRef" :model="editData" :rules="rules" label-width="80px">
        <el-form-item label="标签名称" prop="name">
          <el-input v-model="editData.name" placeholder="请输入标签名称" />
        </el-form-item>
        <el-form-item label="标识" prop="slug">
          <el-input v-model="editData.slug" placeholder="请输入标识（英文）" />
        </el-form-item>
        <el-form-item label="颜色" prop="color">
          <el-color-picker v-model="editData.color" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="editData.description" type="textarea" :rows="3" placeholder="请输入描述" />
        </el-form-item>
        <el-divider content-position="left">SEO 设置（提升搜索引擎排名）</el-divider>
        <el-form-item label="SEO标题">
          <template #label>
            <span>SEO标题</span>
            <el-tooltip content="用于搜索引擎展示的页面标题，如「2025年最好的96个AI智能体工具」，建议30字以内，包含核心关键词" placement="top">
              <el-icon style="margin-left: 4px; cursor: help; color: #909399;"><QuestionFilled /></el-icon>
            </el-tooltip>
          </template>
          <el-input v-model="editData.seoTitle" placeholder="留空则使用标签名称" />
        </el-form-item>
        <el-form-item label="SEO描述">
          <template #label>
            <span>SEO描述</span>
            <el-tooltip content="用于搜索引擎展示的页面描述，建议150字以内。会显示在标签页面头部，帮助用户和搜索引擎理解该标签内容" placement="top">
              <el-icon style="margin-left: 4px; cursor: help; color: #909399;"><QuestionFilled /></el-icon>
            </el-tooltip>
          </template>
          <el-input v-model="editData.seoDescription" type="textarea" :rows="3" placeholder="留空则使用标签描述" />
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
        <el-form-item label="排序">
          <el-input-number v-model="editData.order" :min="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEdit = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { Plus, QuestionFilled } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { usePaging } from '@/hooks/usePaging'
import Pagination from '@/components/pagination/index.vue'
import request from '@/utils/request'

const queryParams = reactive({
  name: ''
})

const { pager, getLists, resetPage, resetParams, lists, loading } = usePaging({
  fetchFun: (params: any) => request.get({ url: '/uied/websiteTag/list', params }),
  params: queryParams
})

const showEdit = ref(false)
const editFormRef = ref()
const editData = reactive({
  id: null as number | null,
  name: '',
  slug: '',
  color: '#1890ff',
  description: '',
  seoTitle: '',
  seoDescription: '',
  seoKeywords: '',
  order: 0
})

const rules = {
  name: [{ required: true, message: '请输入标签名称', trigger: 'blur' }],
  slug: [{ required: true, message: '请输入标识', trigger: 'blur' }]
}

const handleAdd = () => {
  Object.assign(editData, { id: null, name: '', slug: '', color: '#1890ff', description: '', seoTitle: '', seoDescription: '', seoKeywords: '', order: 0 })
  showEdit.value = true
}

const handleEdit = (row: any) => {
  Object.assign(editData, row)
  showEdit.value = true
}

const handleSubmit = async () => {
  await editFormRef.value?.validate()
  const api = editData.id ? '/uied/websiteTag/edit' : '/uied/websiteTag/add'
  await request.post({ url: api, params: editData })
  ElMessage.success(editData.id ? '编辑成功' : '新增成功')
  showEdit.value = false
  getLists()
}

const handleDelete = async (id: number) => {
  await ElMessageBox.confirm('确定要删除该标签吗？', '提示', { type: 'warning' })
  await request.post({ url: '/uied/websiteTag/del', params: { id } })
  ElMessage.success('删除成功')
  getLists()
}

getLists()
</script>
