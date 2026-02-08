<!--
 * @file views/uied/operationLog/index.vue
 * @description 操作日志页面
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
-->
<template>
  <div class="operation-log">
    <el-card class="!border-none" shadow="never">
      <el-form ref="formRef" class="mb-[-16px]" :model="queryParams" :inline="true">
        <el-form-item label="操作类型">
          <el-select v-model="queryParams.action" placeholder="全部" clearable style="width: 150px">
            <el-option label="创建" value="create" />
            <el-option label="更新" value="update" />
            <el-option label="删除" value="delete" />
            <el-option label="导入" value="import" />
            <el-option label="导出" value="export" />
          </el-select>
        </el-form-item>
        <el-form-item label="资源类型">
          <el-select v-model="queryParams.resource" placeholder="全部" clearable style="width: 150px">
            <el-option label="网站" value="website" />
            <el-option label="分类" value="category" />
            <el-option label="页面" value="page" />
            <el-option label="设置" value="setting" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="resetPage">查询</el-button>
          <el-button @click="resetParams">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
    <el-card class="!border-none mt-4" shadow="never">
      <el-table v-loading="loading" :data="lists" border>
        <el-table-column label="ID" prop="id" width="80" />
        <el-table-column label="操作类型" prop="action" width="100">
          <template #default="{ row }">
            <el-tag :type="getActionType(row.action)">{{ getActionLabel(row.action) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="资源类型" prop="resource" width="100" />
        <el-table-column label="资源ID" prop="resourceId" width="100" />
        <el-table-column label="描述" prop="description" min-width="200" show-overflow-tooltip />
        <el-table-column label="操作人" prop="operatorName" width="100" />
        <el-table-column label="IP地址" prop="ip" width="130" />
        <el-table-column label="操作时间" prop="createdAt" width="170">
          <template #default="{ row }">
            {{ formatTime(row.createdAt) }}
          </template>
        </el-table-column>
      </el-table>
      <div class="flex justify-end mt-4">
        <pagination v-model="pager" @change="getLists" />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import { usePaging } from '@/hooks/usePaging'
import Pagination from '@/components/pagination/index.vue'
import request from '@/utils/request'

const queryParams = reactive({
  action: '',
  resource: ''
})

const { pager, getLists, resetPage, resetParams, lists, loading } = usePaging({
  fetchFun: (params: any) => request.get({ url: '/uied/operationLog/list', params }),
  params: queryParams
})

const getActionType = (action: string) => {
  const types: Record<string, string> = {
    create: 'success',
    update: 'warning',
    delete: 'danger',
    import: 'primary',
    export: 'info'
  }
  return types[action] || 'info'
}

const getActionLabel = (action: string) => {
  const labels: Record<string, string> = {
    create: '创建',
    update: '更新',
    delete: '删除',
    import: '导入',
    export: '导出'
  }
  return labels[action] || action
}

const formatTime = (timestamp: number) => {
  if (!timestamp) return '-'
  const date = new Date(timestamp * 1000)
  return date.toLocaleString('zh-CN')
}

getLists()
</script>
