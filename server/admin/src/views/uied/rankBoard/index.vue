<!--
 * @copyright Tomda (https://www.tomda.top)
 * @copyright UIED技术团队 (https://fsuied.com)
 * @author UIED技术团队
 * @createDate 2026-02-21
-->
<template>
    <div class="uied-rankboard-page">
        <el-card class="!border-none mb-4" shadow="never">
            <template #header>
                <div class="flex items-center justify-between">
                    <span class="font-medium">榜单系统配置</span>
                    <el-button type="primary" :loading="saving" @click="handleSaveConfigs">
                        保存配置
                    </el-button>
                </div>
            </template>
            <el-alert
                title="支持四类榜单：今日热门、7日飙升、新站榜、编辑精选（可运营）"
                type="info"
                :closable="false"
                class="mb-4"
            />
            <el-table :data="configRows" v-loading="loading" size="small">
                <el-table-column prop="boardKey" label="榜单键" min-width="140" />
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
                <el-table-column prop="algorithm" label="算法" min-width="140" />
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
                <el-table-column label="默认条数" width="120">
                    <template #default="{ row }">
                        <el-input-number v-model="row.limitCount" :min="1" :max="100" class="!w-full" />
                    </template>
                </el-table-column>
                <el-table-column label="预览" width="100" fixed="right">
                    <template #default="{ row }">
                        <el-button link type="primary" @click="handlePreviewBoard(row.boardKey)">
                            预览
                        </el-button>
                    </template>
                </el-table-column>
            </el-table>
        </el-card>

        <el-card class="!border-none" shadow="never">
            <template #header>
                <div class="flex items-center justify-between">
                    <span class="font-medium">榜单预览：{{ previewTitle || '未选择' }}</span>
                    <el-button @click="handleLoadAllBoards">查看全部榜单</el-button>
                </div>
            </template>
            <template v-if="previewBoards.length > 0">
                <div v-for="board in previewBoards" :key="board.boardKey" class="mb-6">
                    <div class="mb-2 font-medium">
                        {{ board.boardName }}（{{ board.total }}）
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
    </div>
</template>

<script lang="ts" setup name="uiedRankBoardIndex">
/**
 * @copyright Tomda (https://www.tomda.top)
 * @copyright UIED技术团队 (https://fsuied.com)
 * @author UIED技术团队
 * @createDate 2026-02-21
 */
import { onMounted, ref } from 'vue'
import feedback from '@/utils/feedback'
import {
    uiedRankBoardConfigList,
    uiedRankBoardConfigSave,
    uiedRankBoardList,
    uiedRankBoardPreview
} from '@/api/uied'

interface RankBoardConfigRow {
    id?: number
    boardKey: string
    boardName: string
    description: string
    algorithm: string
    isEnabled: boolean
    sort: number
    limitCount: number
}

const loading = ref(false)
const saving = ref(false)
const previewTitle = ref('')
const previewBoards = ref<any[]>([])
const configRows = ref<RankBoardConfigRow[]>([])

/**
 * 规范化为区间整数
 */
const toInt = (value: any, fallback: number, min: number, max: number) => {
    const parsed = Number.parseInt(String(value ?? ''), 10)
    if (!Number.isInteger(parsed)) return fallback
    return Math.min(max, Math.max(min, parsed))
}

/**
 * 加载榜单配置
 */
const loadConfigs = async () => {
    loading.value = true
    try {
        const data = await uiedRankBoardConfigList({ includeDisabled: 1 })
        const rows = Array.isArray(data?.list) ? data.list : []
        configRows.value = rows.map((item: any) => ({
            id: item.id,
            boardKey: String(item.boardKey || ''),
            boardName: String(item.boardName || ''),
            description: String(item.description || ''),
            algorithm: String(item.algorithm || ''),
            isEnabled: item.isEnabled !== false,
            sort: toInt(item.sort, 10, 1, 100000),
            limitCount: toInt(item.limitCount, 20, 1, 100)
        }))
    } finally {
        loading.value = false
    }
}

/**
 * 保存榜单配置
 */
const handleSaveConfigs = async () => {
    const payload = configRows.value.map((row) => ({
        id: row.id,
        boardKey: String(row.boardKey || '').trim(),
        boardName: String(row.boardName || '').trim() || String(row.boardKey || '').trim(),
        description: String(row.description || '').trim(),
        algorithm: String(row.algorithm || '').trim(),
        isEnabled: row.isEnabled !== false,
        sort: toInt(row.sort, 10, 1, 100000),
        limitCount: toInt(row.limitCount, 20, 1, 100)
    }))

    saving.value = true
    try {
        await uiedRankBoardConfigSave({ list: payload })
        feedback.msgSuccess('榜单配置保存成功')
        await loadConfigs()
    } finally {
        saving.value = false
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
        boardKey,
        boardName: boardKey,
        total: Number(res?.total || 0),
        items: Array.isArray(res?.items) ? res.items : []
    } ]
}

/**
 * 读取全部榜单预览
 */
const handleLoadAllBoards = async () => {
    const data = await uiedRankBoardList()
    previewTitle.value = '全部榜单'
    previewBoards.value = Array.isArray(data?.boards) ? data.boards : []
}

onMounted(async () => {
    await loadConfigs()
    await handleLoadAllBoards()
})
</script>

<style scoped>
.uied-rankboard-page {
    display: flex;
    flex-direction: column;
}
</style>
