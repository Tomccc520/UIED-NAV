<!--
/**
 * @copyright Tomda (https://www.tomda.top)
 * @copyright UIED技术团队 (https://fsuied.com)
 * @author UIED技术团队
 * @createDate 2026-02-16
 */
-->
<template>
    <div class="statistics-container">
        <!-- 概览卡片 -->
        <el-row :gutter="16" class="mb-4">
            <el-col :span="6">
                <el-card shadow="never">
                    <el-statistic title="网站总数" :value="overview.website?.total || 0">
                        <template #prefix>
                            <el-icon><LinkIcon /></el-icon>
                        </template>
                    </el-statistic>
                </el-card>
            </el-col>
            <el-col :span="6">
                <el-card shadow="never">
                    <el-statistic title="总点击量" :value="overview.website?.totalClicks || 0">
                        <template #prefix>
                            <el-icon><ViewIcon /></el-icon>
                        </template>
                    </el-statistic>
                </el-card>
            </el-col>
            <el-col :span="6">
                <el-card shadow="never">
                    <el-statistic title="分类总数" :value="overview.category?.total || 0">
                        <template #prefix>
                            <el-icon><FolderIcon /></el-icon>
                        </template>
                    </el-statistic>
                </el-card>
            </el-col>
            <el-col :span="6">
                <el-card shadow="never">
                    <el-statistic title="文章总数" :value="overview.article?.total || 0">
                        <template #prefix>
                            <el-icon><DocumentIcon /></el-icon>
                        </template>
                    </el-statistic>
                </el-card>
            </el-col>
        </el-row>

        <!-- 网站状态统计 -->
        <el-row :gutter="16" class="mb-4">
            <el-col :span="6">
                <el-card shadow="never">
                    <el-statistic
                        title="热门网站"
                        :value="overview.website?.hotCount || 0"
                        value-style="color: #f56c6c"
                    />
                </el-card>
            </el-col>
            <el-col :span="6">
                <el-card shadow="never">
                    <el-statistic
                        title="推荐网站"
                        :value="overview.website?.featuredCount || 0"
                        value-style="color: #e6a23c"
                    />
                </el-card>
            </el-col>
            <el-col :span="6">
                <el-card shadow="never">
                    <el-statistic
                        title="新网站"
                        :value="overview.website?.newCount || 0"
                        value-style="color: #67c23a"
                    />
                </el-card>
            </el-col>
            <el-col :span="6">
                <el-card shadow="never">
                    <el-statistic
                        title="点击率"
                        :value="overview.website?.clickRate || 0"
                        suffix="%"
                    />
                </el-card>
            </el-col>
        </el-row>

        <!-- 标签页 -->
        <el-tabs v-model="activeTab">
            <!-- 热门排行 -->
            <el-tab-pane label="热门排行" name="ranking">
                <el-row :gutter="16">
                    <el-col :span="14">
                        <el-card shadow="never">
                            <template #header>
                                <div class="flex justify-between items-center">
                                    <span>热门网站 TOP 20</span>
                                    <el-tag type="warning">按点击量排序</el-tag>
                                </div>
                            </template>
                            <el-table
                                :data="clickStats.topWebsites"
                                v-loading="loading"
                                max-height="500"
                            >
                                <el-table-column label="排名" width="60">
                                    <template #default="{ $index }">
                                        <el-tag :type="getRankType($index)">{{
                                            $index + 1
                                        }}</el-tag>
                                    </template>
                                </el-table-column>
                                <el-table-column
                                    prop="name"
                                    label="网站名称"
                                    min-width="150"
                                    show-overflow-tooltip
                                />
                                <el-table-column prop="category" label="分类" width="100">
                                    <template #default="{ row }">
                                        <el-tag size="small">{{ row.category || '未分类' }}</el-tag>
                                    </template>
                                </el-table-column>
                                <el-table-column
                                    prop="clickCount"
                                    label="点击量"
                                    width="100"
                                    sortable
                                >
                                    <template #default="{ row }">
                                        <span style="color: #409eff; font-weight: bold">{{
                                            row.clickCount?.toLocaleString()
                                        }}</span>
                                    </template>
                                </el-table-column>
                                <el-table-column label="操作" width="80">
                                    <template #default="{ row }">
                                        <el-link :href="row.url" target="_blank" type="primary"
                                            >访问</el-link
                                        >
                                    </template>
                                </el-table-column>
                            </el-table>
                        </el-card>
                    </el-col>
                    <el-col :span="10">
                        <el-card shadow="never">
                            <template #header>分类点击统计</template>
                            <el-table
                                :data="clickStats.categoryStats?.slice(0, 15)"
                                v-loading="loading"
                                max-height="500"
                            >
                                <el-table-column
                                    prop="name"
                                    label="分类"
                                    min-width="120"
                                    show-overflow-tooltip
                                />
                                <el-table-column
                                    prop="websiteCount"
                                    label="网站数"
                                    width="80"
                                    sortable
                                />
                                <el-table-column
                                    prop="clickCount"
                                    label="总点击"
                                    width="100"
                                    sortable
                                >
                                    <template #default="{ row }">
                                        <span style="color: #67c23a">{{
                                            row.clickCount?.toLocaleString()
                                        }}</span>
                                    </template>
                                </el-table-column>
                            </el-table>
                        </el-card>
                    </el-col>
                </el-row>
            </el-tab-pane>

            <!-- 最近动态 -->
            <el-tab-pane label="最近动态" name="recent">
                <el-card shadow="never">
                    <template #header>最近添加的网站</template>
                    <el-table :data="recentWebsites" v-loading="recentLoading">
                        <el-table-column prop="name" label="网站名称" min-width="150">
                            <template #default="{ row }">
                                <div class="flex items-center gap-2">
                                    <span>{{ row.name }}</span>
                                    <el-tag v-if="row.isHot" type="danger" size="small"
                                        >热门</el-tag
                                    >
                                    <el-tag v-if="row.isFeatured" type="warning" size="small"
                                        >推荐</el-tag
                                    >
                                    <el-tag v-if="row.isNew" type="success" size="small">新</el-tag>
                                </div>
                            </template>
                        </el-table-column>
                        <el-table-column prop="category" label="分类" width="120">
                            <template #default="{ row }">
                                <el-tag size="small">{{ row.category?.name || '未分类' }}</el-tag>
                            </template>
                        </el-table-column>
                        <el-table-column prop="clickCount" label="点击量" width="100" />
                        <el-table-column prop="createdAt" label="添加时间" width="170">
                            <template #default="{ row }">
                                {{ formatTime(row.createdAt) }}
                            </template>
                        </el-table-column>
                        <el-table-column label="操作" width="80">
                            <template #default="{ row }">
                                <el-link :href="row.url" target="_blank" type="primary"
                                    >访问</el-link
                                >
                            </template>
                        </el-table-column>
                    </el-table>
                </el-card>
            </el-tab-pane>

            <!-- 搜索统计 -->
            <el-tab-pane label="搜索统计" name="search">
                <el-row :gutter="16" class="mb-4">
                    <el-col :span="6">
                        <el-card shadow="never">
                            <el-statistic
                                title="总搜索次数"
                                :value="searchStats.totalSearches || 0"
                            />
                        </el-card>
                    </el-col>
                    <el-col :span="6">
                        <el-card shadow="never">
                            <el-statistic title="AI搜索次数" :value="searchStats.aiSearches || 0" />
                        </el-card>
                    </el-col>
                    <el-col :span="6">
                        <el-card shadow="never">
                            <el-statistic
                                title="AI搜索占比"
                                :value="searchStats.aiRatio || 0"
                                suffix="%"
                            />
                        </el-card>
                    </el-col>
                    <el-col :span="6">
                        <el-card shadow="never">
                            <el-statistic
                                title="热门搜索词"
                                :value="searchStats.topSearches?.length || 0"
                            />
                        </el-card>
                    </el-col>
                </el-row>

                <el-card shadow="never">
                    <template #header>热门搜索词 TOP 20</template>
                    <el-table :data="searchStats.topSearches" v-loading="searchLoading">
                        <el-table-column label="排名" width="60">
                            <template #default="{ $index }">
                                <el-tag :type="getRankType($index)">{{ $index + 1 }}</el-tag>
                            </template>
                        </el-table-column>
                        <el-table-column prop="query" label="搜索词" min-width="200" />
                        <el-table-column prop="count" label="搜索次数" width="120">
                            <template #default="{ row }">
                                <span style="color: #409eff; font-weight: bold">{{
                                    Number(row.count).toLocaleString()
                                }}</span>
                            </template>
                        </el-table-column>
                    </el-table>
                    <el-empty v-if="!searchStats.topSearches?.length" description="暂无搜索数据" />
                </el-card>
            </el-tab-pane>
        </el-tabs>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
    Link as LinkIcon,
    View as ViewIcon,
    Folder as FolderIcon,
    Document as DocumentIcon
} from '@element-plus/icons-vue'
import request from '@/utils/request'
import feedback from '@/utils/feedback'

type RankTagType = '' | 'success' | 'warning' | 'danger' | 'info'

const activeTab = ref('ranking')
const loading = ref(false)
const recentLoading = ref(false)
const searchLoading = ref(false)

// 数据
const overview = ref<any>({})
const clickStats = ref<any>({})
const recentWebsites = ref<any[]>([])
const searchStats = ref<any>({})

/**
 * 获取概览统计
 */
const getOverview = async () => {
    try {
        const res = await request.get({ url: '/uied/statistics/overview' })
        if (res) {
            overview.value = res
        }
    } catch (error: any) {
        feedback.msgError(error?.msg || error?.message || '获取概览数据失败')
    }
}

/**
 * 获取点击统计
 */
const getClickStats = async () => {
    loading.value = true
    try {
        const res = await request.get({ url: '/uied/statistics/clicks' })
        if (res) {
            clickStats.value = res
        }
    } catch (error: any) {
        feedback.msgError(error?.msg || error?.message || '获取点击统计失败')
    } finally {
        loading.value = false
    }
}

/**
 * 获取最近网站
 */
const getRecentWebsites = async () => {
    recentLoading.value = true
    try {
        const res = await request.get({ url: '/uied/statistics/recent', params: { limit: 20 } })
        if (res) {
            recentWebsites.value = res
        }
    } catch (error: any) {
        feedback.msgError(error?.msg || error?.message || '获取最近网站失败')
    } finally {
        recentLoading.value = false
    }
}

/**
 * 获取搜索统计
 */
const getSearchStats = async () => {
    searchLoading.value = true
    try {
        const res = await request.get({ url: '/uied/statistics/search', params: { days: 30 } })
        if (res) {
            searchStats.value = res
        }
    } catch (error: any) {
        feedback.msgError(error?.msg || error?.message || '获取搜索统计失败')
    } finally {
        searchLoading.value = false
    }
}

/**
 * 获取排名标签颜色
 */
const getRankType = (index: number): RankTagType => {
    if (index === 0) return 'danger'
    if (index === 1) return 'warning'
    if (index === 2) return 'success'
    return 'info'
}

/**
 * 格式化时间（兼容秒/毫秒时间戳）
 */
const formatTime = (timestamp: number) => {
    if (!timestamp) return '-'
    const ts = Number(timestamp || 0)
    const date = new Date(ts < 1000000000000 ? ts * 1000 : ts)
    return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    })
}

onMounted(() => {
    getOverview()
    getClickStats()
    getRecentWebsites()
    getSearchStats()
})
</script>

<style scoped>
.statistics-container {
    padding: 16px;
}
</style>
