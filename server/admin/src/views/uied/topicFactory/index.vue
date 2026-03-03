<!--
 * @copyright Tomda (https://www.tomda.top)
 * @copyright UIED技术团队 (https://fsuied.com)
 * @author UIED技术团队
 * @createDate 2026-02-21
-->
<template>
    <div class="uied-topic-factory-page">
        <el-card class="!border-none mb-4" shadow="never">
            <template #header>
                <div class="flex items-center justify-between">
                    <span class="font-medium">专题页模板工厂</span>
                    <el-button @click="loadTemplates" :loading="loading">刷新</el-button>
                </div>
            </template>
            <el-alert
                title="可一键复制模板创建专题页：AI工具大全 / 设计工具大全 / 跨境工具大全"
                type="info"
                :closable="false"
                class="mb-4"
            />
            <el-table :data="templateRows" v-loading="loading" size="small">
                <el-table-column prop="templateKey" label="模板键" min-width="160" />
                <el-table-column label="模板名称" min-width="140">
                    <template #default="{ row }">
                        <el-input v-model="row.templateName" />
                    </template>
                </el-table-column>
                <el-table-column label="场景" width="140">
                    <template #default="{ row }">
                        <el-input v-model="row.scene" />
                    </template>
                </el-table-column>
                <el-table-column label="描述" min-width="220">
                    <template #default="{ row }">
                        <el-input v-model="row.description" />
                    </template>
                </el-table-column>
                <el-table-column label="默认slug" width="160">
                    <template #default="{ row }">
                        <el-input v-model="row.defaultSlug" />
                    </template>
                </el-table-column>
                <el-table-column label="启用" width="90">
                    <template #default="{ row }">
                        <el-switch v-model="row.isEnabled" />
                    </template>
                </el-table-column>
                <el-table-column label="排序" width="100">
                    <template #default="{ row }">
                        <el-input-number
                            v-model="row.sort"
                            :min="1"
                            :max="100000"
                            class="!w-full"
                        />
                    </template>
                </el-table-column>
                <el-table-column label="操作" width="240" fixed="right">
                    <template #default="{ row }">
                        <div class="flex gap-2">
                            <el-button link type="primary" @click="handleSaveTemplate(row)"
                                >保存</el-button
                            >
                            <el-button link type="success" @click="openCreateDialog(row)"
                                >一键创建</el-button
                            >
                            <el-button
                                link
                                type="danger"
                                :disabled="isBuiltinTemplate(row.templateKey)"
                                @click="handleDeleteTemplate(row)"
                            >
                                删除
                            </el-button>
                        </div>
                    </template>
                </el-table-column>
            </el-table>
        </el-card>

        <el-card class="!border-none" shadow="never">
            <template #header>
                <div class="flex items-center justify-between">
                    <span class="font-medium">字段草案（前后端对接）</span>
                    <el-button @click="loadSchema" :loading="schemaLoading">刷新草案</el-button>
                </div>
            </template>
            <pre class="schema-view">{{ schemaText }}</pre>
        </el-card>

        <el-dialog
            v-model="createDialogVisible"
            title="一键创建专题页"
            width="680px"
            destroy-on-close
        >
            <el-form :model="createForm" label-width="120px">
                <el-form-item label="模板键">
                    <el-input v-model="createForm.templateKey" disabled />
                </el-form-item>
                <el-form-item label="专题名称">
                    <el-input v-model="createForm.pageName" placeholder="例如：AI工具大全" />
                </el-form-item>
                <el-form-item label="专题别名">
                    <el-input v-model="createForm.pageSlug" placeholder="例如：ai-tools" />
                </el-form-item>
                <el-form-item label="分类Slug">
                    <el-input
                        v-model="createForm.categorySlugsText"
                        type="textarea"
                        :rows="3"
                        placeholder="逗号分隔，例如 ai-xiezuo,ai-kaifa"
                    />
                </el-form-item>
                <el-form-item label="专题排序">
                    <el-input-number
                        v-model="createForm.sortOrder"
                        :min="0"
                        :max="100000"
                        class="!w-full"
                    />
                </el-form-item>
            </el-form>

            <el-alert
                v-if="previewInfo"
                :title="`预览：匹配分类 ${previewInfo.categoryCount} 个，最终slug：${
                    previewInfo.pageData?.slug || '-'
                }`"
                type="success"
                :closable="false"
                class="mb-3"
            />

            <template #footer>
                <div class="flex justify-end gap-2">
                    <el-button @click="handlePreview">预览</el-button>
                    <el-button type="primary" :loading="creating" @click="handleCreateTopic"
                        >确认创建</el-button
                    >
                </div>
            </template>
        </el-dialog>
    </div>
</template>

<script lang="ts" setup name="uiedTopicFactoryIndex">
/**
 * @copyright Tomda (https://www.tomda.top)
 * @copyright UIED技术团队 (https://fsuied.com)
 * @author UIED技术团队
 * @createDate 2026-02-21
 */
import { computed, onMounted, reactive, ref } from 'vue'
import feedback from '@/utils/feedback'
import {
    uiedTopicFactoryCreate,
    uiedTopicFactoryPreview,
    uiedTopicFactorySchema,
    uiedTopicFactoryTemplateDel,
    uiedTopicFactoryTemplateList,
    uiedTopicFactoryTemplateSave
} from '@/api/uied'

interface TopicTemplateRow {
    id?: number
    templateKey: string
    templateName: string
    scene: string
    description: string
    defaultSlug: string
    icon: string
    themeColor?: string
    categorySlugs: string[]
    isEnabled: boolean
    sort: number
    pageConfig: Record<string, any>
}

const BUILTIN_KEYS = [
    'ai-tools-directory',
    'design-tools-directory',
    'cross-border-tools-directory'
]

const loading = ref(false)
const schemaLoading = ref(false)
const creating = ref(false)
const createDialogVisible = ref(false)
const templateRows = ref<TopicTemplateRow[]>([])
const schemaData = ref<Record<string, any>>({})
const previewInfo = ref<any>(null)

const createForm = reactive({
    templateKey: '',
    pageName: '',
    pageSlug: '',
    categorySlugsText: '',
    sortOrder: 0
})

/**
 * 判断是否为内置模板
 */
const isBuiltinTemplate = (key: string) => BUILTIN_KEYS.includes(String(key || '').trim())

/**
 * 字段草案展示文本
 */
const schemaText = computed(() => JSON.stringify(schemaData.value || {}, null, 2))

/**
 * 将分类文本解析为数组
 */
const parseCategorySlugs = () => {
    return String(createForm.categorySlugsText || '')
        .split(/[，,\n|]+/)
        .map((item) => item.trim())
        .filter(Boolean)
}

/**
 * 加载模板列表
 */
const loadTemplates = async () => {
    loading.value = true
    try {
        const data = await uiedTopicFactoryTemplateList({ includeDisabled: 1 })
        const list = Array.isArray(data?.list) ? data.list : []
        templateRows.value = list.map((item: any) => ({
            id: item.id,
            templateKey: String(item.templateKey || ''),
            templateName: String(item.templateName || ''),
            scene: String(item.scene || ''),
            description: String(item.description || ''),
            defaultSlug: String(item.defaultSlug || ''),
            icon: String(item.icon || ''),
            themeColor: item.themeColor,
            categorySlugs: Array.isArray(item.categorySlugs) ? item.categorySlugs : [],
            isEnabled: item.isEnabled !== false,
            sort: Number(item.sort || 10),
            pageConfig:
                item.pageConfig && typeof item.pageConfig === 'object' ? item.pageConfig : {}
        }))
    } finally {
        loading.value = false
    }
}

/**
 * 加载字段草案
 */
const loadSchema = async () => {
    schemaLoading.value = true
    try {
        const data = await uiedTopicFactorySchema()
        schemaData.value = data || {}
    } finally {
        schemaLoading.value = false
    }
}

/**
 * 保存模板
 */
const handleSaveTemplate = async (row: TopicTemplateRow) => {
    await uiedTopicFactoryTemplateSave({
        id: row.id,
        templateKey: row.templateKey,
        templateName: row.templateName,
        scene: row.scene,
        description: row.description,
        defaultSlug: row.defaultSlug,
        icon: row.icon,
        themeColor: row.themeColor,
        categorySlugs: row.categorySlugs,
        isEnabled: row.isEnabled,
        sort: Number(row.sort || 10),
        pageConfig: row.pageConfig || {}
    })
    feedback.msgSuccess('模板保存成功')
    await loadTemplates()
}

/**
 * 删除模板
 */
const handleDeleteTemplate = async (row: TopicTemplateRow) => {
    await feedback.confirm(`确定删除模板：${row.templateName}？`)
    await uiedTopicFactoryTemplateDel({ id: row.id })
    feedback.msgSuccess('删除成功')
    await loadTemplates()
}

/**
 * 打开创建弹窗
 */
const openCreateDialog = (row: TopicTemplateRow) => {
    createForm.templateKey = row.templateKey
    createForm.pageName = row.templateName
    createForm.pageSlug = row.defaultSlug
    createForm.categorySlugsText = (Array.isArray(row.categorySlugs) ? row.categorySlugs : []).join(
        ','
    )
    createForm.sortOrder = Number(row.sort || 0)
    previewInfo.value = null
    createDialogVisible.value = true
}

/**
 * 预览创建结果
 */
const handlePreview = async () => {
    if (!createForm.templateKey || !createForm.pageName) {
        feedback.msgError('请先填写模板键和专题名称')
        return
    }
    const data = await uiedTopicFactoryPreview({
        templateKey: createForm.templateKey,
        pageName: createForm.pageName,
        pageSlug: createForm.pageSlug,
        categorySlugs: parseCategorySlugs(),
        sortOrder: Number(createForm.sortOrder || 0)
    })
    previewInfo.value = data
}

/**
 * 一键创建专题页
 */
const handleCreateTopic = async () => {
    if (!createForm.templateKey || !createForm.pageName) {
        feedback.msgError('请先填写模板键和专题名称')
        return
    }
    creating.value = true
    try {
        const data = await uiedTopicFactoryCreate({
            templateKey: createForm.templateKey,
            pageName: createForm.pageName,
            pageSlug: createForm.pageSlug,
            categorySlugs: parseCategorySlugs(),
            sortOrder: Number(createForm.sortOrder || 0)
        })
        feedback.msgSuccess(`创建成功：${data?.pageName || ''}（${data?.pageSlug || ''}）`)
        createDialogVisible.value = false
    } finally {
        creating.value = false
    }
}

onMounted(async () => {
    await Promise.all([loadTemplates(), loadSchema()])
})
</script>

<style scoped>
.uied-topic-factory-page {
    display: flex;
    flex-direction: column;
}

.schema-view {
    margin: 0;
    padding: 12px;
    background: #f7f8fa;
    border-radius: 8px;
    max-height: 380px;
    overflow: auto;
    font-size: 12px;
    line-height: 1.6;
}
</style>
