<!--
 * @copyright Tomda (https://www.tomda.top)
 * @copyright UIED技术团队 (https://fsuied.com)
 * @author UIED技术团队
 * @createDate 2026-02-26
-->
<template>
    <div class="uied-rankboard-page">
        <el-card class="!border-none mb-4" shadow="never">
            <div class="ops-page-header">
                <div>
                    <div class="ops-page-title">榜单系统配置中心</div>
                    <div class="ops-page-desc">
                        面向运营使用：先配置前台展示入口，再配置榜单内容与排序，预览区用于回归确认。
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    <el-button :loading="loading" @click="handleReloadAll">刷新</el-button>
                    <el-button type="primary" :loading="savingAll" @click="handleSaveAll">
                        保存全部
                    </el-button>
                </div>
            </div>
            <el-tabs v-model="activePageTab" class="ops-page-tabs">
                <el-tab-pane label="运营配置" name="ops" />
                <el-tab-pane label="榜单配置" name="boards" />
                <el-tab-pane label="前台预览" name="preview" />
                <el-tab-pane label="开发调试" name="dev" />
            </el-tabs>
        </el-card>

        <el-card v-show="activePageTab === 'ops'" class="!border-none mb-4" shadow="never">
            <template #header>
                <div class="flex items-center justify-between">
                    <span class="font-medium">榜单系统前台显示配置</span>
                    <el-button type="primary" :loading="savingModule" @click="handleSaveModuleConfig">
                        保存前台显示配置
                    </el-button>
                </div>
            </template>
            <el-form label-width="160px" :model="moduleForm" v-loading="loading">
                <el-row :gutter="16">
                    <el-col :span="8">
                        <el-form-item label="启用榜单系统入口">
                            <el-switch v-model="moduleForm.enabled" />
                        </el-form-item>
                    </el-col>
                    <el-col :span="8">
                        <el-form-item label="默认指标">
                            <el-select v-model="moduleForm.defaultMetric" class="!w-full">
                                <el-option
                                    v-for="item in metricOptions"
                                    :key="item.value"
                                    :label="item.label"
                                    :value="item.value"
                                />
                            </el-select>
                        </el-form-item>
                    </el-col>
                    <el-col :span="8">
                        <el-form-item label="默认周期">
                            <el-select v-model="moduleForm.defaultPeriod" class="!w-full">
                                <el-option
                                    v-for="item in periodOptions"
                                    :key="item.value"
                                    :label="item.label"
                                    :value="item.value"
                                />
                            </el-select>
                        </el-form-item>
                    </el-col>
                    <el-col :span="24">
                        <el-form-item label="前台显示位置">
                            <div class="w-full">
                                <el-checkbox-group v-model="moduleForm.displayPlacements" class="placement-group">
                                    <el-checkbox-button
                                        v-for="item in displayPlacementOptions"
                                        :key="item.value"
                                        :label="item.value"
                                    >
                                        {{ item.label }}
                                    </el-checkbox-button>
                                </el-checkbox-group>
                                <div class="form-tip mt-2">勾选后可用于前端导航快捷入口、首页榜单区块等位置。</div>
                            </div>
                        </el-form-item>
                    </el-col>
                    <el-col :span="8">
                        <el-form-item label="入口名称">
                            <el-input v-model="moduleForm.displayLabel" placeholder="榜单系统" />
                        </el-form-item>
                    </el-col>
                    <el-col :span="10">
                        <el-form-item label="入口路径">
                            <el-input v-model="moduleForm.displayPath" placeholder="/p/rankings" />
                        </el-form-item>
                    </el-col>
                    <el-col :span="6">
                        <el-form-item label="入口排序">
                            <el-input-number v-model="moduleForm.displaySort" :min="1" :max="9999" class="!w-full" />
                        </el-form-item>
                    </el-col>
                    <el-col :span="8">
                        <el-form-item label="桌面端显示">
                            <el-switch v-model="moduleForm.displayDesktop" />
                        </el-form-item>
                    </el-col>
                    <el-col :span="8">
                        <el-form-item label="移动端显示">
                            <el-switch v-model="moduleForm.displayMobile" />
                        </el-form-item>
                    </el-col>
                    <el-col :span="8">
                        <el-form-item label="新窗口打开">
                            <el-switch v-model="moduleForm.displayOpenInNewTab" />
                        </el-form-item>
                    </el-col>
                    <el-col :span="8">
                        <el-form-item label="前台最多展示榜单数">
                            <el-input-number v-model="moduleForm.maxVisibleBoards" :min="1" :max="30" class="!w-full" />
                        </el-form-item>
                    </el-col>
                    <el-col :span="16">
                        <el-form-item label="前台预览">
                            <div class="preview-inline">
                                <span>{{ moduleForm.displayLabel || '榜单系统' }}</span>
                                <span class="preview-inline__sep">·</span>
                                <code>{{ normalizedDisplayPath }}</code>
                                <span class="preview-inline__sep">·</span>
                                <span>{{ moduleForm.displayPlacements.length || 0 }} 个位置</span>
                            </div>
                        </el-form-item>
                    </el-col>
                </el-row>
            </el-form>
        </el-card>

        <el-card v-show="activePageTab === 'boards'" class="!border-none mb-4" shadow="never">
            <template #header>
                <div class="flex items-center justify-between gap-3">
                    <div class="flex items-center gap-3">
                        <span class="font-medium">榜单配置（运营视图）</span>
                        <el-input
                            v-model="boardKeyword"
                            placeholder="搜索榜单名称 / 键 / 算法"
                            clearable
                            style="width: 280px"
                            @input="handleBoardKeywordChange"
                        />
                    </div>
                    <div class="flex gap-2">
                        <el-button @click="handleEnableMetricPreset">启用指标周期榜预设</el-button>
                        <el-button type="primary" :loading="savingBoards" @click="handleSaveBoards">
                            保存榜单配置
                        </el-button>
                    </div>
                </div>
            </template>

            <div class="mb-3 flex flex-wrap gap-2">
                <el-tag
                    v-for="item in metricOptions"
                    :key="item.value"
                    :type="boardMetricFilter === item.value ? '' : 'info'"
                    class="cursor-pointer"
                    @click="boardMetricFilter = (boardMetricFilter === item.value ? '' : item.value)"
                >
                    {{ item.label }}
                </el-tag>
                <el-tag
                    v-for="item in periodOptions"
                    :key="`period-${item.value}`"
                    :type="boardPeriodFilter === item.value ? '' : 'info'"
                    class="cursor-pointer"
                    @click="boardPeriodFilter = (boardPeriodFilter === item.value ? '' : item.value)"
                >
                    {{ item.label }}
                </el-tag>
            </div>

            <el-table :data="filteredBoardRows" v-loading="loading" size="small">
                <el-table-column prop="boardKey" label="榜单键" min-width="150" />
                <el-table-column label="榜单名称" min-width="140">
                    <template #default="{ row }">
                        <el-input v-model="row.boardName" placeholder="榜单名称" />
                    </template>
                </el-table-column>
                <el-table-column label="描述" min-width="220">
                    <template #default="{ row }">
                        <el-input v-model="row.description" placeholder="榜单描述" />
                    </template>
                </el-table-column>
                <el-table-column label="指标" width="90">
                    <template #default="{ row }">
                        <el-tag size="small" :type="getMetricTagType(row.extra.metric)">
                            {{ getMetricLabel(row.extra.metric) }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="周期" width="90">
                    <template #default="{ row }">
                        <el-tag size="small" type="info">
                            {{ getPeriodLabel(row.extra.period) }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column prop="algorithm" label="算法" min-width="140" />
                <el-table-column label="启用" width="80">
                    <template #default="{ row }">
                        <el-switch v-model="row.isEnabled" />
                    </template>
                </el-table-column>
                <el-table-column label="前台显示" width="90">
                    <template #default="{ row }">
                        <el-switch v-model="row.extra.showOnRankingsPage" />
                    </template>
                </el-table-column>
                <el-table-column label="显示位置" min-width="190">
                    <template #default="{ row }">
                        <el-select
                            v-model="row.extra.displayPlacements"
                            multiple
                            collapse-tags
                            collapse-tags-tooltip
                            placeholder="选择位置"
                            style="width: 100%"
                        >
                            <el-option
                                v-for="item in displayPlacementOptions"
                                :key="item.value"
                                :label="item.label"
                                :value="item.value"
                            />
                        </el-select>
                    </template>
                </el-table-column>
                <el-table-column label="排序" width="100">
                    <template #default="{ row }">
                        <el-input-number v-model="row.sort" :min="1" :max="100000" class="!w-full" />
                    </template>
                </el-table-column>
                <el-table-column label="默认条数" width="110">
                    <template #default="{ row }">
                        <el-input-number v-model="row.limitCount" :min="1" :max="100" class="!w-full" />
                    </template>
                </el-table-column>
                <el-table-column label="预览" width="90" fixed="right">
                    <template #default="{ row }">
                        <el-button link type="primary" @click="handlePreviewBoard(row.boardKey)">
                            预览
                        </el-button>
                    </template>
                </el-table-column>
            </el-table>
        </el-card>

        <el-card v-show="activePageTab === 'preview'" class="!border-none mb-4" shadow="never">
            <template #header>
                <div class="flex items-center justify-between">
                    <span class="font-medium">前台预览：{{ previewTitle || '全部榜单' }}</span>
                    <div class="flex items-center gap-2">
                        <el-button @click="handleLoadAllBoards">查看全部榜单</el-button>
                        <el-button type="primary" @click="activePageTab = 'boards'">返回调整榜单</el-button>
                    </div>
                </div>
            </template>
            <template v-if="previewBoards.length > 0">
                <div v-for="board in previewBoards" :key="board.boardKey || board.key" class="preview-board-block">
                    <div class="preview-board-block__head">
                        <div>
                            <div class="preview-board-block__title">
                                {{ board.boardName || board.title || board.boardKey || board.key }}
                            </div>
                            <div class="preview-board-block__meta">
                                <span v-if="board.metric">{{ getMetricLabel(board.metric) }}</span>
                                <span v-if="board.period">{{ getPeriodLabel(board.period) }}</span>
                                <span>共 {{ board.total || (board.items || []).length }} 条</span>
                            </div>
                        </div>
                        <div class="preview-board-block__desc">{{ board.description || '按后台配置规则生成' }}</div>
                    </div>
                    <el-table :data="board.items || []" size="small" border>
                        <el-table-column prop="name" label="站点" min-width="180" />
                        <el-table-column prop="category" label="分类" min-width="120" />
                        <el-table-column prop="clickCount" label="点击" width="90" />
                        <el-table-column prop="score" label="分值" width="110" />
                        <el-table-column prop="url" label="链接" min-width="260" show-overflow-tooltip />
                    </el-table>
                </div>
            </template>
            <el-empty v-else description="暂无预览数据" />
        </el-card>

        <el-card v-show="activePageTab === 'dev'" class="!border-none" shadow="never">
            <template #header>
                <div class="flex items-center justify-between">
                    <span class="font-medium">开发调试（字段草案）</span>
                    <el-button @click="loadSchema">刷新草案</el-button>
                </div>
            </template>
            <el-alert
                title="该区域用于开发/联调查看字段草案，运营日常可忽略。"
                type="warning"
                :closable="false"
                class="mb-4"
            />
            <pre class="schema-view">{{ schemaText }}</pre>
        </el-card>
    </div>
</template>

<script lang="ts" setup name="uiedRankBoardIndex">
/**
 * @copyright Tomda (https://www.tomda.top)
 * @copyright UIED技术团队 (https://fsuied.com)
 * @author UIED技术团队
 * @createDate 2026-02-26
 */
import { computed, onMounted, reactive, ref } from 'vue'
import feedback from '@/utils/feedback'
import {
    uiedRankBoardConfigList,
    uiedRankBoardConfigSave,
    uiedRankBoardList,
    uiedRankBoardPreview,
    uiedRankBoardSchema
} from '@/api/uied'

interface OptionItem {
    value: string
    label: string
}

interface RankBoardRowExtra {
    metric: string
    period: string
    boardGroup: string
    displayPlacements: string[]
    showOnRankingsPage: boolean
}

interface RankBoardConfigRow {
    id?: number
    boardKey: string
    boardName: string
    description: string
    algorithm: string
    isEnabled: boolean
    sort: number
    limitCount: number
    extra: RankBoardRowExtra
}

interface RankBoardModuleForm {
    enabled: boolean
    displayPlacements: string[]
    displayLabel: string
    displayPath: string
    displaySort: number
    displayDesktop: boolean
    displayMobile: boolean
    displayOpenInNewTab: boolean
    defaultMetric: string
    defaultPeriod: string
    maxVisibleBoards: number
}

const loading = ref(false)
const savingAll = ref(false)
const savingBoards = ref(false)
const savingModule = ref(false)
const schemaLoading = ref(false)
const activePageTab = ref<'ops' | 'boards' | 'preview' | 'dev'>('ops')
const previewTitle = ref('')
const previewBoards = ref<any[]>([])
const configRows = ref<RankBoardConfigRow[]>([])
const schemaData = ref<Record<string, any>>({})
const boardKeyword = ref('')
const boardMetricFilter = ref('')
const boardPeriodFilter = ref('')
const displayPlacementOptions = ref<OptionItem[]>([])
const metricOptions = ref<OptionItem[]>([
    { value: 'visit', label: '访问量' },
    { value: 'favorite', label: '收藏量' },
    { value: 'like', label: '点赞量' },
    { value: 'curated', label: '运营榜单' }
])
const periodOptions = ref<OptionItem[]>([
    { value: 'day', label: '每日' },
    { value: 'week', label: '每周' },
    { value: 'month', label: '每月' },
    { value: 'all', label: '全部' }
])

const moduleForm = reactive<RankBoardModuleForm>({
    enabled: true,
    displayPlacements: [ 'nav_quick_entry', 'home_block' ],
    displayLabel: '榜单系统',
    displayPath: '/p/rankings',
    displaySort: 88,
    displayDesktop: true,
    displayMobile: true,
    displayOpenInNewTab: false,
    defaultMetric: 'visit',
    defaultPeriod: 'day',
    maxVisibleBoards: 12
})

/**
 * 规范化数字区间
 */
const toInt = (value: any, fallback: number, min: number, max: number) => {
    const parsed = Number.parseInt(String(value ?? ''), 10)
    if (!Number.isInteger(parsed)) return fallback
    return Math.min(max, Math.max(min, parsed))
}

/**
 * 规范化字符串数组
 */
const toStringList = (value: any) => {
    if (Array.isArray(value)) {
        return value.map((item) => String(item || '').trim()).filter(Boolean)
    }
    const text = String(value || '').trim()
    if (!text) return []
    return text
        .split(/[，,\n|]+/)
        .map((item) => item.trim())
        .filter(Boolean)
}

/**
 * 规范化榜单扩展字段
 */
const normalizeRowExtra = (source: any): RankBoardRowExtra => {
    const extra = source && typeof source === 'object' ? source : {}
    return {
        metric: String(extra.metric || '').trim() || 'curated',
        period: String(extra.period || '').trim() || 'all',
        boardGroup: String(extra.boardGroup || '').trim() || 'operations',
        displayPlacements: toStringList(extra.displayPlacements || [ 'rankings_page' ]),
        showOnRankingsPage: extra.showOnRankingsPage !== false
    }
}

/**
 * 榜单配置表筛选结果
 */
const filteredBoardRows = computed(() => {
    const keyword = String(boardKeyword.value || '').trim().toLowerCase()
    return configRows.value.filter((row) => {
        if (boardMetricFilter.value && row.extra.metric !== boardMetricFilter.value) return false
        if (boardPeriodFilter.value && row.extra.period !== boardPeriodFilter.value) return false
        if (!keyword) return true
        return [ row.boardKey, row.boardName, row.description, row.algorithm ]
            .some((text) => String(text || '').toLowerCase().includes(keyword))
    })
})

/**
 * 前台入口路径预览
 */
const normalizedDisplayPath = computed(() => {
    const path = String(moduleForm.displayPath || '').trim()
    if (!path) return '/p/rankings'
    return path.startsWith('/') ? path : `/${path}`
})

/**
 * 字段草案文本展示
 */
const schemaText = computed(() => {
    try {
        return JSON.stringify(schemaData.value || {}, null, 2)
    } catch (error) {
        return '{}'
    }
})

/**
 * 获取指标文案
 */
const getMetricLabel = (metric: string) => {
    return metricOptions.value.find((item) => item.value === metric)?.label || (metric || '未分类')
}

/**
 * 获取周期文案
 */
const getPeriodLabel = (period: string) => {
    return periodOptions.value.find((item) => item.value === period)?.label || (period || '全部')
}

/**
 * 获取指标标签色
 */
const getMetricTagType = (metric: string) => {
    if (metric === 'visit') return 'success'
    if (metric === 'favorite') return 'warning'
    if (metric === 'like') return 'danger'
    return 'info'
}

/**
 * 回填榜单系统前台入口配置
 */
const patchModuleForm = (source: any) => {
    const value = source && typeof source === 'object' ? source : {}
    moduleForm.enabled = value.enabled !== false
    moduleForm.displayPlacements = toStringList(value.displayPlacements || [ 'nav_quick_entry', 'home_block' ])
    moduleForm.displayLabel = String(value.displayLabel || '榜单系统')
    moduleForm.displayPath = String(value.displayPath || '/p/rankings')
    moduleForm.displaySort = toInt(value.displaySort, 88, 1, 9999)
    moduleForm.displayDesktop = value.displayDesktop !== false
    moduleForm.displayMobile = value.displayMobile !== false
    moduleForm.displayOpenInNewTab = value.displayOpenInNewTab === true
    moduleForm.defaultMetric = String(value.defaultMetric || 'visit')
    moduleForm.defaultPeriod = String(value.defaultPeriod || 'day')
    moduleForm.maxVisibleBoards = toInt(value.maxVisibleBoards, 12, 1, 30)
}

/**
 * 加载榜单配置与前台入口配置
 */
const loadConfigs = async () => {
    loading.value = true
    try {
        const data = await uiedRankBoardConfigList({ includeDisabled: 1 })
        const rows = Array.isArray(data?.list) ? data.list : []
        configRows.value = rows.map((item: any) => ({
            id: item.id,
            boardKey: String(item.boardKey || item.key || ''),
            boardName: String(item.boardName || item.title || ''),
            description: String(item.description || ''),
            algorithm: String(item.algorithm || ''),
            isEnabled: item.isEnabled !== false,
            sort: toInt(item.sort, 10, 1, 100000),
            limitCount: toInt(item.limitCount, 20, 1, 100),
            extra: normalizeRowExtra(item.extra)
        }))
        patchModuleForm(data?.moduleConfig || {})
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
        const data = await uiedRankBoardSchema()
        schemaData.value = data || {}
        const placementRows = Array.isArray(data?.draft?.displayPlacementOptions) ? data.draft.displayPlacementOptions : []
        if (placementRows.length > 0) {
            displayPlacementOptions.value = placementRows.map((item: any) => ({
                value: String(item.value || ''),
                label: String(item.label || item.value || '')
            })).filter((item: OptionItem) => item.value)
        }
        const metrics = Array.isArray(data?.draft?.metricOptions) ? data.draft.metricOptions : []
        if (metrics.length > 0) {
            metricOptions.value = metrics.map((item: any) => ({
                value: String(item.value || ''),
                label: String(item.label || item.value || '')
            })).filter((item: OptionItem) => item.value)
        }
        const periods = Array.isArray(data?.draft?.periodOptions) ? data.draft.periodOptions : []
        if (periods.length > 0) {
            periodOptions.value = periods.map((item: any) => ({
                value: String(item.value || ''),
                label: String(item.label || item.value || '')
            })).filter((item: OptionItem) => item.value)
        }
        if (data?.moduleConfig) {
            patchModuleForm(data.moduleConfig)
        }
    } finally {
        schemaLoading.value = false
    }
}

/**
 * 保存榜单配置
 */
const handleSaveBoards = async () => {
    const payload = configRows.value.map((row) => ({
        id: row.id,
        boardKey: String(row.boardKey || '').trim(),
        boardName: String(row.boardName || '').trim() || String(row.boardKey || '').trim(),
        description: String(row.description || '').trim(),
        algorithm: String(row.algorithm || '').trim(),
        isEnabled: row.isEnabled !== false,
        sort: toInt(row.sort, 10, 1, 100000),
        limitCount: toInt(row.limitCount, 20, 1, 100),
        extra: {
            ...normalizeRowExtra(row.extra),
            displayPlacements: toStringList(row.extra.displayPlacements || [ 'rankings_page' ])
        }
    }))

    savingBoards.value = true
    try {
        await uiedRankBoardConfigSave({ list: payload })
        feedback.msgSuccess('榜单配置保存成功')
        await loadConfigs()
        await handleLoadAllBoards()
    } finally {
        savingBoards.value = false
    }
}

/**
 * 保存榜单系统前台入口配置
 */
const handleSaveModuleConfig = async () => {
    savingModule.value = true
    try {
        const res = await uiedRankBoardConfigSave({
            moduleConfig: {
                ...moduleForm,
                displayPlacements: toStringList(moduleForm.displayPlacements),
                displayPath: normalizedDisplayPath.value
            }
        })
        patchModuleForm(res?.moduleConfig || {})
        feedback.msgSuccess('前台显示配置保存成功')
    } finally {
        savingModule.value = false
    }
}

/**
 * 保存全部配置（运营入口 + 榜单列表）
 */
const handleSaveAll = async () => {
    savingAll.value = true
    try {
        const payload = configRows.value.map((row) => ({
            id: row.id,
            boardKey: String(row.boardKey || '').trim(),
            boardName: String(row.boardName || '').trim() || String(row.boardKey || '').trim(),
            description: String(row.description || '').trim(),
            algorithm: String(row.algorithm || '').trim(),
            isEnabled: row.isEnabled !== false,
            sort: toInt(row.sort, 10, 1, 100000),
            limitCount: toInt(row.limitCount, 20, 1, 100),
            extra: normalizeRowExtra(row.extra)
        }))
        const res = await uiedRankBoardConfigSave({
            list: payload,
            moduleConfig: {
                ...moduleForm,
                displayPlacements: toStringList(moduleForm.displayPlacements),
                displayPath: normalizedDisplayPath.value
            }
        })
        patchModuleForm(res?.moduleConfig || {})
        feedback.msgSuccess('榜单系统配置保存成功')
        await loadConfigs()
        await handleLoadAllBoards()
    } finally {
        savingAll.value = false
    }
}

/**
 * 预览单个榜单
 */
const handlePreviewBoard = async (boardKey: string) => {
    if (!boardKey) return
    const res = await uiedRankBoardPreview({ boardKey })
    previewTitle.value = boardKey
    previewBoards.value = [ {
        key: boardKey,
        boardKey,
        boardName: boardKey,
        metric: configRows.value.find((item) => item.boardKey === boardKey)?.extra.metric || '',
        period: configRows.value.find((item) => item.boardKey === boardKey)?.extra.period || '',
        total: Number(res?.total || 0),
        items: Array.isArray(res?.items) ? res.items : []
    } ]
    activePageTab.value = 'preview'
}

/**
 * 加载全部榜单预览
 */
const handleLoadAllBoards = async () => {
    const data = await uiedRankBoardList()
    previewTitle.value = '全部榜单'
    const boards = Array.isArray(data?.boards) ? data.boards : []
    previewBoards.value = boards.map((board: any) => ({
        ...board,
        key: board.key || board.boardKey,
        title: board.title || board.boardName
    }))
}

/**
 * 一键启用“指标周期榜”预设（访问/收藏/点赞 日周月）
 */
const handleEnableMetricPreset = () => {
    const targetKeys = new Set([
        'daily_visits', 'weekly_visits', 'monthly_visits',
        'daily_favorites', 'weekly_favorites', 'monthly_favorites',
        'daily_likes', 'weekly_likes', 'monthly_likes'
    ])
    configRows.value = configRows.value.map((row) => ({
        ...row,
        isEnabled: targetKeys.has(row.boardKey) ? true : row.isEnabled,
        extra: {
            ...row.extra,
            showOnRankingsPage: targetKeys.has(row.boardKey) ? true : row.extra.showOnRankingsPage
        }
    }))
    feedback.msgSuccess('已启用指标周期榜预设（请记得保存）')
}

/**
 * 榜单搜索关键词变化（保留函数便于后续埋点/节流）
 */
const handleBoardKeywordChange = () => {
    // 预留：后续可加节流与搜索记录
}

/**
 * 刷新全部数据
 */
const handleReloadAll = async () => {
    await Promise.all([ loadSchema(), loadConfigs() ])
    await handleLoadAllBoards()
}

onMounted(async () => {
    await handleReloadAll()
})
</script>

<style scoped>
.uied-rankboard-page {
    display: flex;
    flex-direction: column;
}

.ops-page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
}

.ops-page-title {
    font-size: 18px;
    font-weight: 600;
    color: var(--el-text-color-primary);
}

.ops-page-desc {
    margin-top: 6px;
    font-size: 13px;
    color: var(--el-text-color-secondary);
    line-height: 1.6;
}

.ops-page-tabs {
    margin-top: 14px;
}

.placement-group {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.form-tip {
    display: inline-block;
    font-size: 12px;
    color: var(--el-text-color-secondary);
}

.preview-inline {
    min-height: 36px;
    width: 100%;
    padding: 0 12px;
    border-radius: 10px;
    border: 1px solid var(--el-border-color-lighter);
    background: var(--el-fill-color-extra-light);
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
}

.preview-inline code {
    padding: 2px 6px;
    border-radius: 6px;
    background: rgba(0, 0, 0, 0.04);
    font-size: 12px;
}

.preview-inline__sep {
    color: var(--el-text-color-placeholder);
}

.preview-board-block {
    margin-bottom: 18px;
}

.preview-board-block:last-child {
    margin-bottom: 0;
}

.preview-board-block__head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 10px;
}

.preview-board-block__title {
    font-size: 15px;
    font-weight: 600;
    color: var(--el-text-color-primary);
}

.preview-board-block__meta {
    margin-top: 4px;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
}

.preview-board-block__desc {
    max-width: 420px;
    font-size: 12px;
    line-height: 1.6;
    color: var(--el-text-color-secondary);
    text-align: right;
}

.schema-view {
    margin: 0;
    white-space: pre-wrap;
    word-break: break-word;
    padding: 12px;
    border-radius: 10px;
    background: var(--el-fill-color-extra-light);
    border: 1px solid var(--el-border-color-lighter);
    font-size: 12px;
    line-height: 1.6;
}

@media (max-width: 1024px) {
    .ops-page-header {
        flex-direction: column;
        align-items: flex-start;
    }

    .preview-board-block__head {
        flex-direction: column;
    }

    .preview-board-block__desc {
        max-width: 100%;
        text-align: left;
    }
}
</style>
