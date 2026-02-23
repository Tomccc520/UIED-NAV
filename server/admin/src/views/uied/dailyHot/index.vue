<!--
 * @copyright Tomda (https://www.tomda.top)
 * @copyright UIED技术团队 (https://fsuied.com)
 * @author UIED技术团队
 * @createDate 2026-02-21
-->
<template>
    <div class="uied-dailyhot-page">
        <el-card class="!border-none mb-4" shadow="never">
            <template #header>
                <div class="flex items-center justify-between">
                    <span class="font-medium">每日热榜全局配置</span>
                    <el-button type="primary" :loading="globalSaving" @click="handleSaveGlobalConfig">
                        保存全局配置
                    </el-button>
                </div>
            </template>
            <el-form label-width="160px" :model="globalForm" v-loading="globalLoading">
                <el-row :gutter="16">
                    <el-col :span="8">
                        <el-form-item label="启用每日热榜">
                            <el-switch v-model="globalForm.enabled" />
                        </el-form-item>
                    </el-col>
                    <el-col :span="8">
                        <el-form-item label="默认每平台条数">
                            <el-input-number v-model="globalForm.defaultLimit" :min="1" :max="30" class="!w-full" />
                        </el-form-item>
                    </el-col>
                    <el-col :span="8">
                        <el-form-item label="最多聚合平台数">
                            <el-input-number v-model="globalForm.maxPlatforms" :min="1" :max="50" class="!w-full" />
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="接口地址">
                            <el-input v-model="globalForm.apiBaseUrl" placeholder="https://api.pearktrue.cn/api/dailyhot/" />
                        </el-form-item>
                    </el-col>
                    <el-col :span="6">
                        <el-form-item label="请求超时(ms)">
                            <el-input-number v-model="globalForm.timeoutMs" :min="1000" :max="30000" class="!w-full" />
                        </el-form-item>
                    </el-col>
                    <el-col :span="6">
                        <el-form-item label="全局缓存秒数">
                            <el-input-number v-model="globalForm.cacheTtlSeconds" :min="30" :max="86400" class="!w-full" />
                        </el-form-item>
                    </el-col>
                    <el-col :span="24">
                        <el-form-item label="默认平台（每行一个）">
                            <el-input
                                v-model="defaultPlatformsText"
                                type="textarea"
                                :rows="4"
                                placeholder="哔哩哔哩\n知乎\n微博"
                            />
                        </el-form-item>
                    </el-col>
                    <el-col :span="24">
                        <el-form-item label="前台显示位置">
                            <el-checkbox-group v-model="globalForm.displayPlacements">
                                <el-checkbox
                                    v-for="item in displayPlacementOptions"
                                    :key="item.value"
                                    :label="item.value"
                                >
                                    {{ item.label }}
                                </el-checkbox>
                            </el-checkbox-group>
                        </el-form-item>
                    </el-col>
                    <el-col :span="8">
                        <el-form-item label="入口名称">
                            <el-input v-model="globalForm.displayLabel" placeholder="每日热榜" />
                        </el-form-item>
                    </el-col>
                    <el-col :span="10">
                        <el-form-item label="入口路径">
                            <el-input v-model="globalForm.displayPath" placeholder="/p/daily-hot" />
                        </el-form-item>
                    </el-col>
                    <el-col :span="6">
                        <el-form-item label="入口排序">
                            <el-input-number v-model="globalForm.displaySort" :min="1" :max="9999" class="!w-full" />
                        </el-form-item>
                    </el-col>
                    <el-col :span="8">
                        <el-form-item label="桌面端显示">
                            <el-switch v-model="globalForm.displayDesktop" />
                        </el-form-item>
                    </el-col>
                    <el-col :span="8">
                        <el-form-item label="移动端显示">
                            <el-switch v-model="globalForm.displayMobile" />
                        </el-form-item>
                    </el-col>
                    <el-col :span="8">
                        <el-form-item label="新窗口打开">
                            <el-switch v-model="globalForm.displayOpenInNewTab" />
                        </el-form-item>
                    </el-col>
                </el-row>
            </el-form>
        </el-card>

        <el-card class="!border-none mb-4" shadow="never">
            <template #header>
                <div class="flex items-center justify-between">
                    <span class="font-medium">平台持久化配置</span>
                    <div class="flex gap-2">
                        <el-button @click="loadPlatformConfigs">刷新</el-button>
                        <el-button @click="handleAddPlatformRow">新增平台</el-button>
                        <el-button type="primary" :loading="platformSaving" @click="handleSavePlatformRows">
                            保存平台配置
                        </el-button>
                    </div>
                </div>
            </template>
            <el-alert
                title="平台字段：平台选择/默认排序/缓存策略（平台缓存秒数 + 平台超时）"
                type="info"
                :closable="false"
                class="mb-4"
            />
            <el-alert
                title="显示位置说明：导航菜单/页脚入口会按“每日热榜全局配置”自动注入，无需在前端配置中重复手工维护。"
                type="success"
                :closable="false"
                class="mb-4"
            />
            <el-table :data="platformRows" v-loading="platformLoading" size="small">
                <el-table-column label="平台标题" min-width="160">
                    <template #default="{ row }">
                        <el-input v-model="row.platformTitle" placeholder="如：哔哩哔哩" />
                    </template>
                </el-table-column>
                <el-table-column label="展示名称" min-width="140">
                    <template #default="{ row }">
                        <el-input v-model="row.displayName" placeholder="前台显示名" />
                    </template>
                </el-table-column>
                <el-table-column label="启用" width="90">
                    <template #default="{ row }">
                        <el-switch v-model="row.isEnabled" />
                    </template>
                </el-table-column>
                <el-table-column label="排序" width="100">
                    <template #default="{ row }">
                        <el-input-number v-model="row.sort" :min="1" :max="100000" class="!w-full" />
                    </template>
                </el-table-column>
                <el-table-column label="缓存秒数" width="120">
                    <template #default="{ row }">
                        <el-input-number v-model="row.cacheTtlSeconds" :min="30" :max="86400" class="!w-full" />
                    </template>
                </el-table-column>
                <el-table-column label="默认条数" width="110">
                    <template #default="{ row }">
                        <el-input-number v-model="row.limitCount" :min="1" :max="30" class="!w-full" />
                    </template>
                </el-table-column>
                <el-table-column label="超时(ms)" width="120">
                    <template #default="{ row }">
                        <el-input-number v-model="row.requestTimeoutMs" :min="1000" :max="30000" class="!w-full" />
                    </template>
                </el-table-column>
                <el-table-column label="操作" width="100" fixed="right">
                    <template #default="{ row, $index }">
                        <el-button type="danger" link @click="handleDeletePlatformRow(row, $index)">
                            删除
                        </el-button>
                    </template>
                </el-table-column>
            </el-table>
        </el-card>

        <el-card class="!border-none" shadow="never">
            <template #header>
                <div class="flex items-center justify-between">
                    <span class="font-medium">后台页面字段草案</span>
                    <el-button @click="loadSchema">刷新草案</el-button>
                </div>
            </template>
            <pre class="schema-view">{{ schemaText }}</pre>
        </el-card>
    </div>
</template>

<script lang="ts" setup name="uiedDailyHotIndex">
/**
 * @copyright Tomda (https://www.tomda.top)
 * @copyright UIED技术团队 (https://fsuied.com)
 * @author UIED技术团队
 * @createDate 2026-02-21
 */
import { computed, onMounted, reactive, ref } from 'vue'
import feedback from '@/utils/feedback'
import {
    uiedDailyHotConfigGet,
    uiedDailyHotConfigSave,
    uiedDailyHotPlatformConfigDel,
    uiedDailyHotPlatformConfigList,
    uiedDailyHotPlatformConfigSave,
    uiedDailyHotSchema
} from '@/api/uied'

interface GlobalForm {
    enabled: boolean
    apiBaseUrl: string
    timeoutMs: number
    cacheTtlSeconds: number
    defaultPlatforms: string[]
    defaultLimit: number
    maxPlatforms: number
    displayPlacements: string[]
    displayLabel: string
    displayPath: string
    displaySort: number
    displayDesktop: boolean
    displayMobile: boolean
    displayOpenInNewTab: boolean
}

interface PlatformRow {
    id?: number
    platformTitle: string
    displayName: string
    isEnabled: boolean
    sort: number
    cacheTtlSeconds: number
    limitCount: number
    requestTimeoutMs: number
}

const globalLoading = ref(false)
const globalSaving = ref(false)
const platformLoading = ref(false)
const platformSaving = ref(false)
const schemaLoading = ref(false)
const schemaData = ref<Record<string, any>>({})
const platformRows = ref<PlatformRow[]>([])
const displayPlacementOptions = [
    { value: 'home_menu', label: '首页菜单入口' },
    { value: 'footer_link', label: '页脚链接' },
    { value: 'fixed_link', label: '固定悬浮入口' },
    { value: 'nav_quick_entry', label: '导航快捷入口' }
]

const globalForm = reactive<GlobalForm>({
    enabled: true,
    apiBaseUrl: 'https://api.pearktrue.cn/api/dailyhot/',
    timeoutMs: 12000,
    cacheTtlSeconds: 600,
    defaultPlatforms: [ '哔哩哔哩', '知乎', '微博' ],
    defaultLimit: 10,
    maxPlatforms: 20,
    displayPlacements: [ 'home_menu', 'footer_link' ],
    displayLabel: '每日热榜',
    displayPath: '/p/daily-hot',
    displaySort: 90,
    displayDesktop: true,
    displayMobile: true,
    displayOpenInNewTab: false
})

/**
 * 规范化为区间整数
 */
const toInt = (value: any, fallback: number, min: number, max: number) => {
    const parsed = Number.parseInt(String(value ?? ''), 10)
    if (!Number.isInteger(parsed)) return fallback
    return Math.min(max, Math.max(min, parsed))
}

/**
 * 默认平台文本和数组双向映射
 */
const defaultPlatformsText = computed({
    get() {
        return Array.isArray(globalForm.defaultPlatforms)
            ? globalForm.defaultPlatforms.join('\n')
            : ''
    },
    set(value: string) {
        globalForm.defaultPlatforms = String(value || '')
            .split(/[\n,，|]+/)
            .map((item) => item.trim())
            .filter(Boolean)
    }
})

/**
 * 草案 JSON 文本
 */
const schemaText = computed(() => JSON.stringify(schemaData.value || {}, null, 2))

/**
 * 加载全局配置
 */
const loadGlobalConfig = async () => {
    globalLoading.value = true
    try {
        const data = await uiedDailyHotConfigGet()
        globalForm.enabled = data?.enabled !== false
        globalForm.apiBaseUrl = String(data?.apiBaseUrl || 'https://api.pearktrue.cn/api/dailyhot/')
        globalForm.timeoutMs = toInt(data?.timeoutMs, 12000, 1000, 30000)
        globalForm.cacheTtlSeconds = toInt(data?.cacheTtlSeconds, 600, 30, 86400)
        globalForm.defaultLimit = toInt(data?.defaultLimit, 10, 1, 30)
        globalForm.maxPlatforms = toInt(data?.maxPlatforms, 20, 1, 50)
        globalForm.defaultPlatforms = Array.isArray(data?.defaultPlatforms) ? data.defaultPlatforms : []
        globalForm.displayPlacements = Array.isArray(data?.displayPlacements)
            ? data.displayPlacements.map((item: any) => String(item || '')).filter(Boolean)
            : [ 'home_menu', 'footer_link' ]
        globalForm.displayLabel = String(data?.displayLabel || '每日热榜')
        globalForm.displayPath = String(data?.displayPath || '/p/daily-hot')
        globalForm.displaySort = toInt(data?.displaySort, 90, 1, 9999)
        globalForm.displayDesktop = data?.displayDesktop !== false
        globalForm.displayMobile = data?.displayMobile !== false
        globalForm.displayOpenInNewTab = data?.displayOpenInNewTab === true
    } finally {
        globalLoading.value = false
    }
}

/**
 * 加载平台配置列表
 */
const loadPlatformConfigs = async () => {
    platformLoading.value = true
    try {
        const data = await uiedDailyHotPlatformConfigList()
        const list = Array.isArray(data?.list) ? data.list : []
        platformRows.value = list.map((item: any) => ({
            id: item.id,
            platformTitle: String(item.platformTitle || ''),
            displayName: String(item.displayName || item.platformTitle || ''),
            isEnabled: item.isEnabled !== false,
            sort: toInt(item.sort, 10, 1, 100000),
            cacheTtlSeconds: toInt(item.cacheTtlSeconds, 600, 30, 86400),
            limitCount: toInt(item.limitCount, 10, 1, 30),
            requestTimeoutMs: toInt(item.requestTimeoutMs, 12000, 1000, 30000)
        }))
    } finally {
        platformLoading.value = false
    }
}

/**
 * 加载字段草案
 */
const loadSchema = async () => {
    schemaLoading.value = true
    try {
        const data = await uiedDailyHotSchema()
        schemaData.value = data || {}
    } finally {
        schemaLoading.value = false
    }
}

/**
 * 初次加载页面数据
 */
const loadPageData = async () => {
    await Promise.all([ loadGlobalConfig(), loadPlatformConfigs(), loadSchema() ])
}

/**
 * 保存全局配置
 */
const handleSaveGlobalConfig = async () => {
    globalSaving.value = true
    try {
        await uiedDailyHotConfigSave({
            enabled: globalForm.enabled,
            apiBaseUrl: globalForm.apiBaseUrl,
            timeoutMs: toInt(globalForm.timeoutMs, 12000, 1000, 30000),
            cacheTtlSeconds: toInt(globalForm.cacheTtlSeconds, 600, 30, 86400),
            defaultPlatforms: Array.isArray(globalForm.defaultPlatforms) ? globalForm.defaultPlatforms : [],
            defaultLimit: toInt(globalForm.defaultLimit, 10, 1, 30),
            maxPlatforms: toInt(globalForm.maxPlatforms, 20, 1, 50),
            displayPlacements: Array.isArray(globalForm.displayPlacements)
                ? globalForm.displayPlacements.map((item) => String(item || '').trim()).filter(Boolean)
                : [],
            displayLabel: String(globalForm.displayLabel || '').trim() || '每日热榜',
            displayPath: String(globalForm.displayPath || '').trim() || '/p/daily-hot',
            displaySort: toInt(globalForm.displaySort, 90, 1, 9999),
            displayDesktop: globalForm.displayDesktop !== false,
            displayMobile: globalForm.displayMobile !== false,
            displayOpenInNewTab: globalForm.displayOpenInNewTab === true
        })
        feedback.msgSuccess('全局配置保存成功')
    } finally {
        globalSaving.value = false
    }
}

/**
 * 新增平台行
 */
const handleAddPlatformRow = () => {
    platformRows.value.push({
        platformTitle: '',
        displayName: '',
        isEnabled: true,
        sort: (platformRows.value.length + 1) * 10,
        cacheTtlSeconds: 600,
        limitCount: 10,
        requestTimeoutMs: 12000
    })
}

/**
 * 删除平台行
 */
const handleDeletePlatformRow = async (row: PlatformRow, index: number) => {
    if (row.id) {
        await feedback.confirm(`确定删除平台配置：${row.displayName || row.platformTitle}？`)
        await uiedDailyHotPlatformConfigDel({ id: row.id })
        feedback.msgSuccess('删除成功')
        await loadPlatformConfigs()
        return
    }
    platformRows.value.splice(index, 1)
}

/**
 * 保存平台配置
 */
const handleSavePlatformRows = async () => {
    const payload = platformRows.value
        .map((row) => ({
            id: row.id,
            platformTitle: String(row.platformTitle || '').trim(),
            displayName: String(row.displayName || '').trim() || String(row.platformTitle || '').trim(),
            isEnabled: row.isEnabled !== false,
            sort: toInt(row.sort, 10, 1, 100000),
            cacheTtlSeconds: toInt(row.cacheTtlSeconds, 600, 30, 86400),
            limitCount: toInt(row.limitCount, 10, 1, 30),
            requestTimeoutMs: toInt(row.requestTimeoutMs, 12000, 1000, 30000)
        }))
        .filter((row) => row.platformTitle)

    if (!payload.length) {
        feedback.msgError('请至少配置一个平台')
        return
    }

    platformSaving.value = true
    try {
        await uiedDailyHotPlatformConfigSave({ list: payload })
        feedback.msgSuccess('平台配置保存成功')
        await Promise.all([ loadPlatformConfigs(), loadSchema() ])
    } finally {
        platformSaving.value = false
    }
}

onMounted(() => {
    loadPageData()
})
</script>

<style scoped>
.uied-dailyhot-page {
    display: flex;
    flex-direction: column;
}

.schema-view {
    margin: 0;
    padding: 12px;
    background: #f7f8fa;
    border-radius: 8px;
    max-height: 420px;
    overflow: auto;
    font-size: 12px;
    line-height: 1.6;
}
</style>
