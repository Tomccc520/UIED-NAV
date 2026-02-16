<!--
 * @file views/uied/aiConfig/index.vue
 * @description AI 助手管理页面 - 多 Tab 布局（配置管理、批量生成、使用统计、功能开关）
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 2.0.0
-->
<template>
    <div class="ai-config">
        <el-card class="!border-none" shadow="never">
            <template #header>
                <div class="flex items-center justify-between">
                    <span class="text-lg font-medium">AI 助手管理</span>
                </div>
            </template>

            <el-tabs v-model="activeTab">
                <!-- Tab 1: 配置管理 -->
                <el-tab-pane label="配置管理" name="config">
                    <!-- 操作栏 -->
                    <div class="mb-4 flex justify-between items-center">
                        <el-button type="primary" @click="handleAdd">
                            <template #icon><icon name="el-icon-Plus" /></template>
                            新增配置
                        </el-button>
                        <span class="text-gray-400 text-sm">共 {{ configList.length }} 个配置</span>
                    </div>

                    <!-- 配置列表表格 -->
                    <el-table :data="configList" v-loading="configLoading" size="large">
                        <el-table-column
                            label="名称"
                            prop="name"
                            min-width="120"
                            show-overflow-tooltip
                        />
                        <el-table-column label="提供商" prop="provider" width="120">
                            <template #default="{ row }">
                                <el-tag size="small">{{ getProviderLabel(row.provider) }}</el-tag>
                            </template>
                        </el-table-column>
                        <el-table-column
                            label="模型"
                            prop="model"
                            min-width="150"
                            show-overflow-tooltip
                        />
                        <el-table-column label="状态" width="90" align="center">
                            <template #default="{ row }">
                                <el-switch
                                    :model-value="row.is_enabled === 1"
                                    @change="(val: string | number | boolean) => handleToggleEnabled(row, !!val)"
                                    size="small"
                                />
                            </template>
                        </el-table-column>
                        <el-table-column label="默认" width="90" align="center">
                            <template #default="{ row }">
                                <el-tag
                                    v-if="row.is_default === 1"
                                    type="success"
                                    size="small"
                                    effect="dark"
                                    >默认</el-tag
                                >
                                <el-button
                                    v-else
                                    link
                                    type="primary"
                                    size="small"
                                    @click="handleSetDefault(row)"
                                    >设为默认</el-button
                                >
                            </template>
                        </el-table-column>
                        <el-table-column label="操作" width="200" fixed="right">
                            <template #default="{ row }">
                                <el-button type="primary" link @click="handleEdit(row)"
                                    >编辑</el-button
                                >
                                <el-button
                                    type="success"
                                    link
                                    :disabled="!row.api_key"
                                    @click="handleTestConnection(row)"
                                    >测试连接</el-button
                                >
                                <el-button type="danger" link @click="handleDelete(row)"
                                    >删除</el-button
                                >
                            </template>
                        </el-table-column>
                    </el-table>
                </el-tab-pane>

                <!-- Tab 2: 批量生成 -->
                <el-tab-pane label="批量生成" name="batch">
                    <!-- 步骤一：选择网站和字段 -->
                    <div v-if="!batchGenerating && batchResults.length === 0" class="batch-setup">
                        <el-form label-width="100px">
                            <!-- 网站选择器 -->
                            <el-form-item label="选择网站">
                                <el-select
                                    v-model="selectedWebsiteIds"
                                    multiple
                                    filterable
                                    remote
                                    reserve-keyword
                                    :remote-method="searchWebsites"
                                    :loading="websiteSearchLoading"
                                    placeholder="请搜索并选择网站"
                                    style="width: 100%"
                                    @focus="handleWebsiteSelectFocus"
                                >
                                    <el-option
                                        v-for="item in websiteOptions"
                                        :key="item.id"
                                        :label="item.title || item.name"
                                        :value="item.id"
                                    >
                                        <span>{{ item.title || item.name }}</span>
                                        <span
                                            style="color: #999; font-size: 12px; margin-left: 8px"
                                            >{{ item.url }}</span
                                        >
                                    </el-option>
                                </el-select>
                            </el-form-item>

                            <!-- 生成字段选择 -->
                            <el-form-item label="生成字段">
                                <el-checkbox-group v-model="selectedFields">
                                    <el-checkbox label="description">网站描述</el-checkbox>
                                    <el-checkbox label="tags">网站标签</el-checkbox>
                                </el-checkbox-group>
                            </el-form-item>

                            <!-- 生成按钮 -->
                            <el-form-item>
                                <el-button
                                    type="primary"
                                    :disabled="
                                        selectedWebsiteIds.length === 0 ||
                                        selectedFields.length === 0
                                    "
                                    @click="handleBatchGenerate"
                                >
                                    开始批量生成（{{ selectedWebsiteIds.length }} 个网站）
                                </el-button>
                            </el-form-item>
                        </el-form>
                    </div>

                    <!-- 步骤二：生成进度展示 -->
                    <div v-if="batchGenerating" class="batch-progress">
                        <div class="mb-4 text-center">
                            <el-progress
                                :percentage="batchProgress"
                                :stroke-width="20"
                                striped
                                striped-flow
                            />
                        </div>
                        <div class="text-center text-gray-500 mt-2">
                            正在处理：{{ batchCurrentName || '准备中...' }} （{{
                                batchProcessed
                            }}/{{ batchTotal }}）
                        </div>
                    </div>

                    <!-- 步骤三：结果预览和确认 -->
                    <div v-if="!batchGenerating && batchResults.length > 0" class="batch-results">
                        <div class="mb-4 flex justify-between items-center">
                            <span class="text-lg font-medium">生成结果预览</span>
                            <div>
                                <el-button @click="handleBatchReset">重新选择</el-button>
                                <el-button
                                    type="primary"
                                    :loading="batchConfirmLoading"
                                    @click="handleBatchConfirm"
                                >
                                    确认保存
                                </el-button>
                            </div>
                        </div>

                        <el-table :data="batchResults" size="large">
                            <el-table-column
                                label="网站名称"
                                prop="name"
                                width="160"
                                show-overflow-tooltip
                            />
                            <el-table-column label="状态" width="100" align="center">
                                <template #default="{ row }">
                                    <el-tag
                                        v-if="row.status === 'success'"
                                        type="success"
                                        size="small"
                                        >成功</el-tag
                                    >
                                    <el-tooltip v-else :content="row.error" placement="top">
                                        <el-tag type="danger" size="small">失败</el-tag>
                                    </el-tooltip>
                                </template>
                            </el-table-column>
                            <el-table-column
                                v-if="selectedFields.includes('description')"
                                label="描述"
                                min-width="250"
                            >
                                <template #default="{ row }">
                                    <el-input
                                        v-if="row.status === 'success'"
                                        v-model="row.description"
                                        type="textarea"
                                        :autosize="{ minRows: 2, maxRows: 4 }"
                                    />
                                    <span v-else class="text-gray-400">—</span>
                                </template>
                            </el-table-column>
                            <el-table-column
                                v-if="selectedFields.includes('tags')"
                                label="标签"
                                min-width="200"
                            >
                                <template #default="{ row }">
                                    <el-input
                                        v-if="row.status === 'success'"
                                        v-model="row.tags"
                                        placeholder="多个标签用逗号分隔"
                                    />
                                    <span v-else class="text-gray-400">—</span>
                                </template>
                            </el-table-column>
                        </el-table>

                        <div class="mt-2 text-gray-400 text-sm">
                            共 {{ batchResults.length }} 个结果， 成功
                            {{ batchResults.filter((r) => r.status === 'success').length }} 个，
                            失败
                            {{ batchResults.filter((r) => r.status !== 'success').length }} 个。
                            可在表格中直接编辑生成内容，确认无误后点击「确认保存」。
                        </div>
                    </div>
                </el-tab-pane>

                <!-- Tab 3: 使用统计 -->
                <el-tab-pane label="使用统计" name="stats">
                    <!-- AI 未配置时的引导提示 -->
                    <div
                        v-if="configList.length === 0 && !configLoading"
                        class="flex flex-col items-center justify-center"
                        style="min-height: 300px"
                    >
                        <el-empty description="暂未配置 AI 服务">
                            <el-button type="primary" @click="activeTab = 'config'"
                                >前往配置</el-button
                            >
                        </el-empty>
                        <p class="text-gray-400 mt-2">
                            请先在「配置管理」中添加 AI 配置，启用后即可查看使用统计
                        </p>
                    </div>

                    <div v-else>
                        <!-- 汇总卡片 -->
                        <el-row :gutter="16" class="mb-4">
                            <el-col :xs="12" :sm="6">
                                <el-card shadow="hover" class="stats-card">
                                    <div class="stats-card-title">总调用次数</div>
                                    <div class="stats-card-value">{{ statsData.totalCalls }}</div>
                                </el-card>
                            </el-col>
                            <el-col :xs="12" :sm="6">
                                <el-card shadow="hover" class="stats-card">
                                    <div class="stats-card-title">总 Token 消耗</div>
                                    <div class="stats-card-value">{{ statsData.totalTokens }}</div>
                                </el-card>
                            </el-col>
                            <el-col :xs="12" :sm="6">
                                <el-card shadow="hover" class="stats-card">
                                    <div class="stats-card-title">成功率</div>
                                    <div class="stats-card-value">{{ statsData.successRate }}%</div>
                                </el-card>
                            </el-col>
                            <el-col :xs="12" :sm="6">
                                <el-card shadow="hover" class="stats-card">
                                    <div class="stats-card-title">今日调用</div>
                                    <div class="stats-card-value">{{ statsData.todayCalls }}</div>
                                </el-card>
                            </el-col>
                        </el-row>

                        <!-- 筛选栏 -->
                        <div class="mb-4 flex items-center gap-3 flex-wrap">
                            <el-select
                                v-model="logFilter.feature_type"
                                placeholder="功能类型"
                                clearable
                                style="width: 160px"
                                @change="handleLogFilterChange"
                            >
                                <el-option label="全部类型" value="" />
                                <el-option label="AI 对话" value="chat" />
                                <el-option label="内容生成" value="generate" />
                                <el-option label="AI 搜索" value="search" />
                                <el-option label="批量生成" value="batch_generate" />
                            </el-select>
                            <el-date-picker
                                v-model="logFilter.dateRange"
                                type="daterange"
                                range-separator="至"
                                start-placeholder="开始日期"
                                end-placeholder="结束日期"
                                value-format="YYYY-MM-DD"
                                style="width: 280px"
                                @change="handleLogFilterChange"
                            />
                        </div>

                        <!-- 日志表格 -->
                        <el-table :data="logList" v-loading="logLoading" size="large">
                            <el-table-column label="时间" width="170">
                                <template #default="{ row }">
                                    {{ formatTimestamp(row.create_time) }}
                                </template>
                            </el-table-column>
                            <el-table-column label="功能类型" width="120">
                                <template #default="{ row }">
                                    <el-tag
                                        size="small"
                                        :type="getFeatureTypeTagType(row.feature_type)"
                                    >
                                        {{ getFeatureTypeLabel(row.feature_type) }}
                                    </el-tag>
                                </template>
                            </el-table-column>
                            <el-table-column label="状态" width="90" align="center">
                                <template #default="{ row }">
                                    <el-tag
                                        size="small"
                                        :type="
                                            row.response_status === 'success' ? 'success' : 'danger'
                                        "
                                    >
                                        {{ row.response_status === 'success' ? '成功' : '失败' }}
                                    </el-tag>
                                </template>
                            </el-table-column>
                            <el-table-column
                                label="Token"
                                prop="tokens_used"
                                width="100"
                                align="right"
                            />
                            <el-table-column
                                label="耗时(ms)"
                                prop="duration_ms"
                                width="100"
                                align="right"
                            />
                            <el-table-column
                                label="请求内容"
                                prop="request_content"
                                min-width="200"
                                show-overflow-tooltip
                            />
                            <el-table-column
                                label="错误信息"
                                prop="error_message"
                                min-width="160"
                                show-overflow-tooltip
                            >
                                <template #default="{ row }">
                                    <span v-if="row.error_message" class="text-red-500">{{
                                        row.error_message
                                    }}</span>
                                    <span v-else class="text-gray-300">—</span>
                                </template>
                            </el-table-column>
                        </el-table>

                        <!-- 分页 -->
                        <div class="mt-4 flex justify-end">
                            <el-pagination
                                v-model:current-page="logPagination.page"
                                v-model:page-size="logPagination.pageSize"
                                :total="logPagination.total"
                                :page-sizes="[10, 20, 50, 100]"
                                layout="total, sizes, prev, pager, next"
                                @current-change="loadLogList"
                                @size-change="handleLogPageSizeChange"
                            />
                        </div>
                    </div>
                </el-tab-pane>

                <!-- Tab 4: 功能开关 -->
                <el-tab-pane label="功能开关" name="toggle">
                    <div v-loading="toggleLoading" style="max-width: 600px">
                        <el-form label-width="140px" class="toggle-form">
                            <!-- 全局开关 -->
                            <el-card shadow="never" class="mb-4">
                                <div class="flex items-center justify-between">
                                    <div>
                                        <div class="text-base font-medium">AI 全局开关</div>
                                        <div class="text-gray-400 text-sm mt-1">
                                            关闭后将禁用所有 AI 功能，前端将隐藏 AI 相关入口
                                        </div>
                                    </div>
                                    <el-switch
                                        v-model="toggleForm.aiEnabled"
                                        active-text="开启"
                                        inactive-text="关闭"
                                    />
                                </div>
                            </el-card>

                            <!-- 子功能开关 -->
                            <el-card shadow="never">
                                <template #header>
                                    <span class="text-sm font-medium">功能模块开关</span>
                                </template>

                                <!-- AI 搜索 -->
                                <div class="toggle-item">
                                    <div class="toggle-item-info">
                                        <div class="toggle-item-title">AI 搜索</div>
                                        <div class="toggle-item-desc">
                                            启用后支持自然语言搜索理解和智能匹配排序
                                        </div>
                                    </div>
                                    <el-switch
                                        v-model="toggleForm.aiSearch"
                                        :disabled="!toggleForm.aiEnabled"
                                    />
                                </div>

                                <el-divider style="margin: 12px 0" />

                                <!-- AI 内容生成 -->
                                <div class="toggle-item">
                                    <div class="toggle-item-info">
                                        <div class="toggle-item-title">AI 内容生成</div>
                                        <div class="toggle-item-desc">
                                            启用后支持 AI 自动生成网站描述、标签等信息
                                        </div>
                                    </div>
                                    <el-switch
                                        v-model="toggleForm.aiGenerate"
                                        :disabled="!toggleForm.aiEnabled"
                                    />
                                </div>

                                <el-divider style="margin: 12px 0" />

                                <!-- AI 对话助手 -->
                                <div class="toggle-item">
                                    <div class="toggle-item-info">
                                        <div class="toggle-item-title">AI 对话助手</div>
                                        <div class="toggle-item-desc">
                                            启用后在前端详情页展示 AI 对话助手入口
                                        </div>
                                    </div>
                                    <el-switch
                                        v-model="toggleForm.aiChat"
                                        :disabled="!toggleForm.aiEnabled"
                                    />
                                </div>
                            </el-card>

                            <!-- 保存按钮 -->
                            <div class="mt-4">
                                <el-button
                                    type="primary"
                                    :loading="toggleSaveLoading"
                                    @click="handleSaveToggle"
                                >
                                    保存配置
                                </el-button>
                            </div>
                        </el-form>
                    </div>
                </el-tab-pane>
            </el-tabs>
        </el-card>

        <!-- 新增/编辑配置弹窗 -->
        <el-dialog
            v-model="showEditDialog"
            :title="editForm.id ? '编辑 AI 配置' : '新增 AI 配置'"
            width="600px"
            :close-on-click-modal="false"
        >
            <el-form ref="editFormRef" :model="editForm" :rules="editRules" label-width="100px">
                <el-form-item label="配置名称" prop="name">
                    <el-input v-model="editForm.name" placeholder="请输入配置名称，如：主力配置" />
                </el-form-item>
                <el-form-item label="提供商" prop="provider">
                    <el-select
                        v-model="editForm.provider"
                        placeholder="请选择 AI 提供商"
                        style="width: 100%"
                    >
                        <el-option label="OpenAI" value="openai" />
                        <el-option label="Azure OpenAI" value="azure" />
                        <el-option label="Claude" value="claude" />
                        <el-option label="通义千问" value="qwen" />
                        <el-option label="文心一言" value="wenxin" />
                        <el-option label="SiliconFlow" value="siliconflow" />
                        <el-option label="DeepSeek" value="deepseek" />
                        <el-option label="其他" value="other" />
                    </el-select>
                </el-form-item>
                <el-form-item label="API 地址" prop="apiUrl">
                    <el-input
                        v-model="editForm.apiUrl"
                        placeholder="请输入 API 地址，如：https://api.openai.com/v1"
                    />
                </el-form-item>
                <el-form-item label="API 密钥" prop="apiKey">
                    <el-input
                        v-model="editForm.apiKey"
                        type="password"
                        show-password
                        placeholder="请输入 API 密钥"
                    />
                </el-form-item>
                <el-form-item label="模型" prop="model">
                    <el-input
                        v-model="editForm.model"
                        placeholder="请输入模型名称，如：gpt-3.5-turbo"
                    />
                </el-form-item>
                <el-row :gutter="16">
                    <el-col :span="12">
                        <el-form-item label="启用">
                            <el-switch v-model="editForm.enabled" />
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="设为默认">
                            <el-switch v-model="editForm.isDefault" />
                        </el-form-item>
                    </el-col>
                </el-row>
            </el-form>
            <template #footer>
                <el-button @click="showEditDialog = false">取消</el-button>
                <el-button
                    type="success"
                    :loading="testLoading"
                    :disabled="!editForm.apiKey"
                    @click="handleTestFromDialog"
                >
                    测试连接
                </el-button>
                <el-button type="primary" :loading="saveLoading" @click="handleSave">
                    确定
                </el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts" name="uiedAiConfig">
/**
 * @file views/uied/aiConfig/index.vue
 * @description AI 助手管理页面 - 配置管理 Tab 完整实现
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 2.0.0
 */

import { ref, reactive, onMounted, nextTick, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import {
    uiedAiConfigList,
    uiedAiConfigAdd,
    uiedAiConfigEdit,
    uiedAiConfigDelete,
    uiedAiConfigTest,
    uiedAiConfigBatchGenerate,
    uiedAiConfigBatchConfirm,
    uiedWebsiteList,
    uiedAiUsageLogList,
    uiedAiUsageLogStats,
    uiedAiFeatureToggle,
    uiedAiSaveFeatureToggle
} from '@/api/uied'

// ==================== Tab 控制 ====================

const activeTab = ref('config')

// ==================== 提供商标签映射 ====================

const providerMap: Record<string, string> = {
    openai: 'OpenAI',
    azure: 'Azure OpenAI',
    claude: 'Claude',
    qwen: '通义千问',
    wenxin: '文心一言',
    siliconflow: 'SiliconFlow',
    deepseek: 'DeepSeek',
    other: '其他'
}

const getProviderLabel = (provider: string): string => {
    return providerMap[provider] || provider || '未知'
}

// ==================== 配置列表 ====================

const configList = ref<any[]>([])
const configLoading = ref(false)

/** 加载配置列表 */
const loadConfigList = async () => {
    configLoading.value = true
    try {
        const res = await uiedAiConfigList()
        // API 返回的数据可能是数组或包含 list 的对象
        configList.value = Array.isArray(res) ? res : res?.lists || res?.list || []
    } catch (error) {
        console.error('获取AI配置列表失败:', error)
        ElMessage.error('获取配置列表失败')
        configList.value = []
    } finally {
        configLoading.value = false
    }
}

// ==================== 启用/禁用切换 ====================

/** 切换配置启用状态 */
const handleToggleEnabled = async (row: any, val: boolean) => {
    try {
        await uiedAiConfigEdit({
            id: row.id,
            is_enabled: val ? 1 : 0
        })
        ElMessage.success(val ? '已启用' : '已禁用')
        loadConfigList()
    } catch (error) {
        console.error('切换启用状态失败:', error)
        ElMessage.error('操作失败')
    }
}

// ==================== 设置默认配置 ====================

/** 设置为默认配置 */
const handleSetDefault = async (row: any) => {
    try {
        await uiedAiConfigEdit({
            id: row.id,
            is_default: 1
        })
        ElMessage.success('已设为默认配置')
        loadConfigList()
    } catch (error) {
        console.error('设置默认配置失败:', error)
        ElMessage.error('操作失败')
    }
}

// ==================== 测试连接 ====================

const testLoading = ref(false)

/** 从表格行测试连接 */
const handleTestConnection = async (row: any) => {
    testLoading.value = true
    try {
        await uiedAiConfigTest({
            provider: row.provider,
            apiKey: row.api_key,
            apiUrl: row.api_url
        })
        ElMessage.success('连接成功')
    } catch (error: any) {
        ElMessage.error(error?.msg || error?.message || '连接失败')
    } finally {
        testLoading.value = false
    }
}

/** 从弹窗中测试连接 */
const handleTestFromDialog = async () => {
    if (!editForm.apiKey) {
        ElMessage.warning('请先填写 API 密钥')
        return
    }
    testLoading.value = true
    try {
        await uiedAiConfigTest({
            provider: editForm.provider,
            apiKey: editForm.apiKey,
            apiUrl: editForm.apiUrl
        })
        ElMessage.success('连接成功')
    } catch (error: any) {
        ElMessage.error(error?.msg || error?.message || '连接失败')
    } finally {
        testLoading.value = false
    }
}

// ==================== 新增/编辑弹窗 ====================

const showEditDialog = ref(false)
const saveLoading = ref(false)
const editFormRef = ref<FormInstance>()

const editForm = reactive({
    id: 0,
    name: '',
    provider: 'openai',
    apiUrl: '',
    apiKey: '',
    model: '',
    enabled: true,
    isDefault: false
})

const editRules: FormRules = {
    name: [{ required: true, message: '请输入配置名称', trigger: 'blur' }],
    provider: [{ required: true, message: '请选择 AI 提供商', trigger: 'change' }],
    apiUrl: [{ required: true, message: '请输入 API 地址', trigger: 'blur' }],
    apiKey: [{ required: true, message: '请输入 API 密钥', trigger: 'blur' }],
    model: [{ required: true, message: '请输入模型名称', trigger: 'blur' }]
}

/** 重置编辑表单 */
const resetEditForm = () => {
    editForm.id = 0
    editForm.name = ''
    editForm.provider = 'openai'
    editForm.apiUrl = ''
    editForm.apiKey = ''
    editForm.model = ''
    editForm.enabled = true
    editForm.isDefault = false
}

/** 新增配置 */
const handleAdd = () => {
    resetEditForm()
    showEditDialog.value = true
    // 等待 DOM 更新后清除表单验证状态
    nextTick(() => {
        editFormRef.value?.clearValidate()
    })
}

/** 编辑配置 */
const handleEdit = (row: any) => {
    resetEditForm()
    editForm.id = row.id
    editForm.name = row.name || ''
    editForm.provider = row.provider || 'openai'
    editForm.apiUrl = row.api_url || ''
    editForm.apiKey = row.api_key || ''
    editForm.model = row.model || ''
    editForm.enabled = row.is_enabled === 1
    editForm.isDefault = row.is_default === 1
    showEditDialog.value = true
    nextTick(() => {
        editFormRef.value?.clearValidate()
    })
}

/** 保存配置（新增或编辑） */
const handleSave = async () => {
    await editFormRef.value?.validate()
    saveLoading.value = true
    try {
        const submitData = {
            name: editForm.name,
            provider: editForm.provider,
            api_url: editForm.apiUrl,
            api_key: editForm.apiKey,
            model: editForm.model,
            is_enabled: editForm.enabled ? 1 : 0,
            is_default: editForm.isDefault ? 1 : 0
        }

        if (editForm.id) {
            await uiedAiConfigEdit({ id: editForm.id, ...submitData })
            ElMessage.success('编辑成功')
        } else {
            await uiedAiConfigAdd(submitData)
            ElMessage.success('新增成功')
        }
        showEditDialog.value = false
        loadConfigList()
    } catch (error) {
        console.error('保存配置失败:', error)
        ElMessage.error('保存失败')
    } finally {
        saveLoading.value = false
    }
}

// ==================== 删除配置 ====================

/** 删除配置 */
const handleDelete = async (row: any) => {
    try {
        await ElMessageBox.confirm(`确定要删除配置「${row.name}」吗？`, '删除确认', {
            type: 'warning'
        })
        await uiedAiConfigDelete({ id: row.id })
        ElMessage.success('删除成功')
        loadConfigList()
    } catch (error: any) {
        // 用户取消操作不提示错误
        if (error === 'cancel' || error?.toString?.().includes('cancel')) return
        console.error('删除配置失败:', error)
        ElMessage.error('删除失败')
    }
}

// ==================== 批量生成 ====================

/** 网站选择相关 */
const selectedWebsiteIds = ref<number[]>([])
const websiteOptions = ref<any[]>([])
const websiteSearchLoading = ref(false)

/** 生成字段选择 */
const selectedFields = ref<string[]>(['description', 'tags'])

/** 生成进度相关 */
const batchGenerating = ref(false)
const batchProgress = ref(0)
const batchCurrentName = ref('')
const batchProcessed = ref(0)
const batchTotal = ref(0)

/** 生成结果 */
const batchResults = ref<any[]>([])
const batchConfirmLoading = ref(false)

/** 搜索网站（远程搜索） */
const searchWebsites = async (query: string) => {
    if (!query && websiteOptions.value.length > 0) return
    websiteSearchLoading.value = true
    try {
        const res = await uiedWebsiteList({ keyword: query, pageSize: 50 })
        const data = res?.lists || res?.list || res?.data?.lists || res?.data?.list || []
        websiteOptions.value = Array.isArray(data) ? data : []
    } catch (error) {
        console.error('搜索网站失败:', error)
        websiteOptions.value = []
    } finally {
        websiteSearchLoading.value = false
    }
}

/** 网站选择器获得焦点时加载初始数据 */
const handleWebsiteSelectFocus = () => {
    if (websiteOptions.value.length === 0) {
        searchWebsites('')
    }
}

/** 开始批量生成 */
const handleBatchGenerate = async () => {
    if (selectedWebsiteIds.value.length === 0) {
        ElMessage.warning('请先选择网站')
        return
    }
    if (selectedFields.value.length === 0) {
        ElMessage.warning('请选择要生成的字段')
        return
    }

    batchGenerating.value = true
    batchProgress.value = 0
    batchProcessed.value = 0
    batchTotal.value = selectedWebsiteIds.value.length
    batchCurrentName.value = '准备中...'
    batchResults.value = []

    try {
        const res = await uiedAiConfigBatchGenerate({
            websiteIds: selectedWebsiteIds.value,
            fields: selectedFields.value
        })

        const data = res?.data || res
        const results = data?.results || []
        batchResults.value = results
        batchProcessed.value = results.length
        batchProgress.value = 100
        batchCurrentName.value = ''

        const successCount = results.filter((r: any) => r.status === 'success').length
        const failCount = results.length - successCount

        if (failCount === 0) {
            ElMessage.success(`批量生成完成，共 ${successCount} 个网站`)
        } else if (successCount === 0) {
            ElMessage.warning('批量生成全部失败，请检查 AI 配置')
        } else {
            ElMessage.warning(`批量生成完成：成功 ${successCount} 个，失败 ${failCount} 个`)
        }
    } catch (error: any) {
        console.error('批量生成失败:', error)
        ElMessage.error(error?.msg || error?.message || '批量生成失败，请检查 AI 配置')
    } finally {
        batchGenerating.value = false
    }
}

/** 确认保存批量生成结果 */
const handleBatchConfirm = async () => {
    // 只保存成功的结果
    const successResults = batchResults.value.filter((r) => r.status === 'success')
    if (successResults.length === 0) {
        ElMessage.warning('没有可保存的结果')
        return
    }

    batchConfirmLoading.value = true
    try {
        const confirmData = successResults.map((r) => ({
            websiteId: r.websiteId,
            description: r.description,
            tags: r.tags
        }))

        await uiedAiConfigBatchConfirm({ results: confirmData })
        ElMessage.success(`已保存 ${successResults.length} 个网站的生成结果`)
        handleBatchReset()
    } catch (error: any) {
        console.error('确认保存失败:', error)
        ElMessage.error(error?.msg || error?.message || '保存失败')
    } finally {
        batchConfirmLoading.value = false
    }
}

/** 重置批量生成状态 */
const handleBatchReset = () => {
    selectedWebsiteIds.value = []
    batchResults.value = []
    batchProgress.value = 0
    batchProcessed.value = 0
    batchTotal.value = 0
    batchCurrentName.value = ''
    batchGenerating.value = false
}

// ==================== 使用统计 ====================

/** 统计汇总数据 */
const statsData = reactive({
    totalCalls: 0,
    totalTokens: 0,
    successRate: 0,
    todayCalls: 0
})

/** 日志筛选条件 */
const logFilter = reactive({
    feature_type: '',
    dateRange: undefined as [string, string] | undefined
})

/** 日志分页 */
const logPagination = reactive({
    page: 1,
    pageSize: 20,
    total: 0
})

/** 日志列表 */
const logList = ref<any[]>([])
const logLoading = ref(false)

/** 功能类型标签映射 */
const featureTypeMap: Record<string, string> = {
    chat: 'AI 对话',
    generate: '内容生成',
    search: 'AI 搜索',
    batch_generate: '批量生成'
}

/** 获取功能类型中文标签 */
const getFeatureTypeLabel = (type: string): string => {
    return featureTypeMap[type] || type || '未知'
}

/** 获取功能类型标签颜色 */
const getFeatureTypeTagType = (type: string): '' | 'success' | 'warning' | 'info' | 'danger' => {
    const typeColorMap: Record<string, '' | 'success' | 'warning' | 'info' | 'danger'> = {
        chat: '',
        generate: 'success',
        search: 'warning',
        batch_generate: 'info'
    }
    return typeColorMap[type] || 'info'
}

/** 格式化 Unix 时间戳为可读时间 */
const formatTimestamp = (timestamp: number): string => {
    if (!timestamp) return '—'
    const date = new Date(timestamp * 1000)
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    const h = String(date.getHours()).padStart(2, '0')
    const min = String(date.getMinutes()).padStart(2, '0')
    const s = String(date.getSeconds()).padStart(2, '0')
    return `${y}-${m}-${d} ${h}:${min}:${s}`
}

/** 加载统计汇总数据 */
const loadStats = async () => {
    try {
        const res = await uiedAiUsageLogStats()
        const data = res?.data || res || {}
        statsData.totalCalls = data.totalCalls ?? 0
        statsData.totalTokens = data.totalTokens ?? 0
        statsData.successRate = data.successRate ?? 0
        statsData.todayCalls = data.todayCalls ?? 0
    } catch (error) {
        console.error('获取使用统计失败:', error)
    }
}

/** 加载日志列表 */
const loadLogList = async () => {
    logLoading.value = true
    try {
        const params: any = {
            page: logPagination.page,
            pageSize: logPagination.pageSize
        }
        // 按功能类型筛选
        if (logFilter.feature_type) {
            params.feature_type = logFilter.feature_type
        }
        // 按时间范围筛选
        if (logFilter.dateRange && logFilter.dateRange.length === 2) {
            params.start_time = logFilter.dateRange[0]
            params.end_time = logFilter.dateRange[1]
        }

        const res = await uiedAiUsageLogList(params)
        const data = res?.data || res || {}
        logList.value = data?.lists || data?.list || []
        logPagination.total = data?.count ?? data?.total ?? 0
    } catch (error) {
        console.error('获取使用日志失败:', error)
        logList.value = []
        logPagination.total = 0
    } finally {
        logLoading.value = false
    }
}

/** 筛选条件变化时重新加载 */
const handleLogFilterChange = () => {
    logPagination.page = 1
    loadLogList()
}

/** 分页大小变化 */
const handleLogPageSizeChange = () => {
    logPagination.page = 1
    loadLogList()
}

// ==================== 功能开关 ====================

/** 功能开关表单 */
const toggleForm = reactive({
    aiEnabled: true,
    aiSearch: true,
    aiGenerate: true,
    aiChat: false
})

const toggleLoading = ref(false)
const toggleSaveLoading = ref(false)

/** 加载功能开关配置 */
const loadFeatureToggle = async () => {
    toggleLoading.value = true
    try {
        const res = await uiedAiFeatureToggle()
        const data = res?.data || res || {}
        toggleForm.aiEnabled = data.aiEnabled ?? true
        toggleForm.aiSearch = data.aiSearch ?? true
        toggleForm.aiGenerate = data.aiGenerate ?? true
        toggleForm.aiChat = data.aiChat ?? false
    } catch (error) {
        console.error('获取功能开关配置失败:', error)
        ElMessage.error('获取功能开关配置失败')
    } finally {
        toggleLoading.value = false
    }
}

/** 保存功能开关配置 */
const handleSaveToggle = async () => {
    toggleSaveLoading.value = true
    try {
        await uiedAiSaveFeatureToggle({
            aiEnabled: toggleForm.aiEnabled,
            aiSearch: toggleForm.aiSearch,
            aiGenerate: toggleForm.aiGenerate,
            aiChat: toggleForm.aiChat
        })
        ElMessage.success('功能开关配置已保存')
    } catch (error: any) {
        console.error('保存功能开关配置失败:', error)
        ElMessage.error(error?.msg || error?.message || '保存失败')
    } finally {
        toggleSaveLoading.value = false
    }
}

// ==================== Tab 切换监听 ====================

/** 切换 Tab 时加载对应数据 */
watch(activeTab, (newTab) => {
    if (newTab === 'stats') {
        loadStats()
        loadLogList()
    } else if (newTab === 'toggle') {
        loadFeatureToggle()
    }
})

// ==================== 生命周期 ====================

onMounted(() => {
    loadConfigList()
})
</script>

<style scoped>
.stats-card {
    text-align: center;
    margin-bottom: 8px;
}
.stats-card .el-card__body {
    padding: 16px;
}
.stats-card-title {
    font-size: 13px;
    color: #909399;
    margin-bottom: 8px;
}
.stats-card-value {
    font-size: 28px;
    font-weight: 600;
    color: #303133;
}

/* 功能开关样式 */
.toggle-form {
    padding: 16px 0;
}
.toggle-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
}
.toggle-item-info {
    flex: 1;
    margin-right: 16px;
}
.toggle-item-title {
    font-size: 14px;
    font-weight: 500;
    color: #303133;
}
.toggle-item-desc {
    font-size: 12px;
    color: #909399;
    margin-top: 4px;
}
</style>
