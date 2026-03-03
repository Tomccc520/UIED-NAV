<!--
 * @copyright Tomda (https://www.tomda.top)
 * @copyright UIED技术团队 (https://fsuied.com)
 * @author UIED技术团队
 * @createDate 2026.2.20
-->
<template>
    <div class="uied-article-config-page">
        <el-card class="!border-none" shadow="never">
            <template #header>
                <div class="flex items-center justify-between">
                    <span class="font-medium">文章公开配置</span>
                    <el-button type="primary" :loading="savingConfig" @click="handleSaveConfig">
                        保存文章配置
                    </el-button>
                </div>
            </template>
            <el-form :model="articleConfig" label-width="140px" class="max-w-[820px]">
                <el-form-item label="文章模块启用">
                    <el-switch v-model="articleConfig.enabled" />
                </el-form-item>
                <el-form-item label="首页文章区启用">
                    <el-switch v-model="articleConfig.homeSectionEnabled" />
                </el-form-item>
                <el-form-item label="首页标题">
                    <el-input v-model="articleConfig.homeSectionTitle" />
                </el-form-item>
                <el-form-item label="首页副标题">
                    <el-input v-model="articleConfig.homeSectionSubtitle" />
                </el-form-item>
                <el-form-item label="首页显示数量">
                    <el-input-number v-model="articleConfig.homeSectionLimit" :min="1" :max="50" />
                </el-form-item>
                <el-form-item label="列表页标题">
                    <el-input v-model="articleConfig.listPageTitle" />
                </el-form-item>
                <el-form-item label="列表页描述">
                    <el-input
                        v-model="articleConfig.listPageDescription"
                        type="textarea"
                        :rows="3"
                    />
                </el-form-item>
                <el-form-item label="列表页封面图">
                    <el-input
                        v-model="articleConfig.listPageCoverImage"
                        placeholder="https://..."
                    />
                </el-form-item>
                <el-divider content-position="left">详情页布局</el-divider>
                <el-form-item label="详情页宽度模式">
                    <el-select v-model="articleConfig.detailLayoutWidthMode" style="width: 260px">
                        <el-option label="标准（居中阅读）" value="contained" />
                        <el-option label="宽版（信息更密）" value="wide" />
                        <el-option label="全宽（屏幕自适应）" value="fluid" />
                    </el-select>
                </el-form-item>
                <el-form-item label="正文最大宽度">
                    <el-input-number
                        v-model="articleConfig.detailContentMaxWidth"
                        :min="680"
                        :max="1600"
                        :step="20"
                    />
                    <span class="ml-2 text-xs text-[#909399]">px</span>
                </el-form-item>
                <el-form-item label="标题区对齐">
                    <el-radio-group v-model="articleConfig.detailHeaderAlign">
                        <el-radio-button label="center">居中</el-radio-button>
                        <el-radio-button label="left">左对齐</el-radio-button>
                    </el-radio-group>
                </el-form-item>
                <el-divider content-position="left">详情页侧栏配置</el-divider>
                <el-form-item label="启用详情侧栏">
                    <el-switch v-model="articleConfig.detailSidebarEnabled" />
                </el-form-item>
                <el-form-item label="侧栏吸顶">
                    <el-switch
                        v-model="articleConfig.detailSidebarSticky"
                        :disabled="!articleConfig.detailSidebarEnabled"
                    />
                </el-form-item>
                <el-form-item label="吸顶偏移">
                    <el-input-number
                        v-model="articleConfig.detailSidebarTopOffset"
                        :min="0"
                        :max="240"
                        :disabled="
                            !articleConfig.detailSidebarEnabled ||
                            !articleConfig.detailSidebarSticky
                        "
                    />
                    <span class="ml-2 text-xs text-[#909399]">px</span>
                </el-form-item>
                <el-form-item label="侧栏链接新窗口打开">
                    <el-switch
                        v-model="articleConfig.detailSidebarLinksNewWindow"
                        :disabled="!articleConfig.detailSidebarEnabled"
                    />
                    <span class="ml-2 text-xs text-[#909399]"
                        >开启后侧栏内文章/网址/标签链接将新开窗口</span
                    >
                </el-form-item>
                <el-form-item label="最新文章标题">
                    <el-input
                        v-model="articleConfig.detailSidebarLatestArticlesTitle"
                        :disabled="!articleConfig.detailSidebarEnabled"
                    />
                </el-form-item>
                <el-form-item label="最新文章数量">
                    <el-input-number
                        v-model="articleConfig.detailSidebarLatestArticlesCount"
                        :min="1"
                        :max="20"
                        :disabled="!articleConfig.detailSidebarEnabled"
                    />
                </el-form-item>
                <el-form-item label="热门网址标题">
                    <el-input
                        v-model="articleConfig.detailSidebarHotWebsitesTitle"
                        :disabled="!articleConfig.detailSidebarEnabled"
                    />
                </el-form-item>
                <el-form-item label="热门网址数量">
                    <el-input-number
                        v-model="articleConfig.detailSidebarHotWebsitesCount"
                        :min="1"
                        :max="20"
                        :disabled="!articleConfig.detailSidebarEnabled"
                    />
                </el-form-item>
                <el-form-item label="标签模块标题">
                    <el-input
                        v-model="articleConfig.detailSidebarTagsTitle"
                        :disabled="!articleConfig.detailSidebarEnabled"
                    />
                </el-form-item>
                <div class="config-table-wrap">
                    <el-table
                        :data="articleConfig.detailSidebarModules"
                        row-key="key"
                        border
                        size="small"
                        style="width: 100%"
                    >
                        <el-table-column label="排序" width="68" align="center">
                            <template #default="{ $index }">
                                <span>{{ $index + 1 }}</span>
                            </template>
                        </el-table-column>
                        <el-table-column label="模块名称" prop="name" min-width="140" />
                        <el-table-column label="模块标识" prop="key" min-width="140" />
                        <el-table-column label="启用" width="88" align="center">
                            <template #default="{ row }">
                                <el-switch
                                    v-model="row.enabled"
                                    :disabled="!articleConfig.detailSidebarEnabled"
                                />
                            </template>
                        </el-table-column>
                        <el-table-column label="操作" width="120" align="center">
                            <template #default="{ $index }">
                                <div class="sort-actions">
                                    <el-button
                                        type="primary"
                                        link
                                        :disabled="
                                            $index === 0 || !articleConfig.detailSidebarEnabled
                                        "
                                        @click="moveSidebarModuleUp($index)"
                                    >
                                        上移
                                    </el-button>
                                    <el-button
                                        type="primary"
                                        link
                                        :disabled="
                                            $index ===
                                                articleConfig.detailSidebarModules.length - 1 ||
                                            !articleConfig.detailSidebarEnabled
                                        "
                                        @click="moveSidebarModuleDown($index)"
                                    >
                                        下移
                                    </el-button>
                                </div>
                            </template>
                        </el-table-column>
                    </el-table>
                </div>
                <el-form-item label="评论启用">
                    <el-switch v-model="articleConfig.commentsEnabled" />
                </el-form-item>
                <el-form-item label="专题配置启用">
                    <el-switch v-model="articleConfig.topicsEnabled" />
                </el-form-item>
            </el-form>
        </el-card>

        <el-card class="!border-none mt-4" shadow="never">
            <template #header>
                <div class="flex items-center justify-between">
                    <span class="font-medium">文章专题配置（JSON）</span>
                    <el-button type="primary" :loading="savingTopics" @click="handleSaveTopics">
                        保存专题配置
                    </el-button>
                </div>
            </template>
            <el-alert
                title="键名建议使用分类或标签 slug；值字段支持 id/type/title/description/coverImage/icon/themeColor。"
                type="info"
                :closable="false"
                class="mb-3"
            />
            <el-input
                v-model="topicsJson"
                type="textarea"
                :rows="18"
                placeholder="请输入 JSON"
                class="font-mono"
            />
        </el-card>
    </div>
</template>

<script lang="ts" setup name="uiedArticleConfig">
/**
 * @copyright Tomda (https://www.tomda.top)
 * @copyright UIED技术团队 (https://fsuied.com)
 * @author UIED技术团队
 * @createDate 2026.2.20
 */
import { onMounted, reactive, ref } from 'vue'
import feedback from '@/utils/feedback'
import {
    uiedArticleConfig,
    uiedArticleTopicsConfig,
    uiedSaveArticleConfig,
    uiedSaveArticleTopicsConfig
} from '@/api/uied'

interface ArticleSidebarModuleItem {
    key: string
    name: string
    enabled: boolean
    sort: number
}

const DEFAULT_ARTICLE_SIDEBAR_MODULES: ArticleSidebarModuleItem[] = [
    { key: 'latest_articles', name: '最新文章', enabled: true, sort: 1 },
    { key: 'hot_websites', name: '热门网址', enabled: true, sort: 2 },
    { key: 'article_tags', name: '文章标签', enabled: true, sort: 3 }
]

const savingConfig = ref(false)
const savingTopics = ref(false)
const topicsJson = ref('{}')

const articleConfig = reactive({
    enabled: true,
    homeSectionEnabled: true,
    homeSectionTitle: '设计文章',
    homeSectionSubtitle: '汇聚优质设计文章，分享前沿设计趋势与实战经验',
    homeSectionLimit: 12,
    listPageTitle: '设计专栏',
    listPageDescription: '汇聚优质设计文章，分享前沿设计趋势、实战技巧与行业洞察',
    listPageCoverImage: '',
    detailLayoutWidthMode: 'contained',
    detailContentMaxWidth: 880,
    detailHeaderAlign: 'center',
    detailSidebarEnabled: true,
    detailSidebarSticky: true,
    detailSidebarTopOffset: 16,
    detailSidebarLinksNewWindow: false,
    detailSidebarLatestArticlesTitle: '最新文章',
    detailSidebarLatestArticlesCount: 6,
    detailSidebarHotWebsitesTitle: '热门网址',
    detailSidebarHotWebsitesCount: 6,
    detailSidebarTagsTitle: '文章标签',
    detailSidebarModules: DEFAULT_ARTICLE_SIDEBAR_MODULES.map((item) => ({ ...item })),
    commentsEnabled: true,
    topicsEnabled: true
})

/**
 * 规范化侧栏模块排序字段，避免保存后排序紊乱。
 */
const normalizeSidebarModuleSort = (
    list: ArticleSidebarModuleItem[]
): ArticleSidebarModuleItem[] => {
    return list.map((item, index) => ({
        ...item,
        sort: index + 1
    }))
}

/**
 * 合并默认侧栏模块，确保旧配置升级后仍可看到新增模块。
 */
const mergeSidebarModulesWithDefaults = (list: unknown): ArticleSidebarModuleItem[] => {
    const currentList = Array.isArray(list) ? (list as ArticleSidebarModuleItem[]) : []
    const defaultMap = new Map(DEFAULT_ARTICLE_SIDEBAR_MODULES.map((item) => [item.key, item]))
    const existed = new Set<string>()
    const merged = currentList
        .filter((item) => String(item?.key || '').trim())
        .map((item) => {
            const key = String(item.key || '').trim()
            existed.add(key)
            const defaultItem = defaultMap.get(key)
            return {
                key,
                name: String(item.name || defaultItem?.name || key),
                enabled: item.enabled !== false,
                sort: Number(item.sort || 0) || 0
            }
        })
    DEFAULT_ARTICLE_SIDEBAR_MODULES.forEach((item) => {
        if (!existed.has(item.key)) {
            merged.push({ ...item })
        }
    })
    return normalizeSidebarModuleSort(merged)
}

/**
 * 上移侧栏模块。
 */
const moveSidebarModuleUp = (index: number) => {
    if (index <= 0) return
    const list = articleConfig.detailSidebarModules
    const temp = list[index]
    list[index] = list[index - 1]
    list[index - 1] = temp
    articleConfig.detailSidebarModules = normalizeSidebarModuleSort(list)
}

/**
 * 下移侧栏模块。
 */
const moveSidebarModuleDown = (index: number) => {
    const list = articleConfig.detailSidebarModules
    if (index < 0 || index >= list.length - 1) return
    const temp = list[index]
    list[index] = list[index + 1]
    list[index + 1] = temp
    articleConfig.detailSidebarModules = normalizeSidebarModuleSort(list)
}

/**
 * 加载文章配置
 */
const loadArticleConfig = async () => {
    const data = await uiedArticleConfig()
    Object.assign(articleConfig, {
        ...articleConfig,
        ...(data || {})
    })
    articleConfig.detailSidebarModules = mergeSidebarModulesWithDefaults(
        articleConfig.detailSidebarModules
    )
}

/**
 * 加载文章专题配置
 */
const loadTopicsConfig = async () => {
    const data = await uiedArticleTopicsConfig()
    topicsJson.value = JSON.stringify(data || {}, null, 2)
}

/**
 * 保存文章配置
 */
const handleSaveConfig = async () => {
    savingConfig.value = true
    try {
        articleConfig.detailSidebarModules = normalizeSidebarModuleSort(
            mergeSidebarModulesWithDefaults(articleConfig.detailSidebarModules)
        )
        await uiedSaveArticleConfig({ ...articleConfig })
        feedback.msgSuccess('文章配置保存成功')
        await loadArticleConfig()
    } finally {
        savingConfig.value = false
    }
}

/**
 * 保存文章专题配置
 */
const handleSaveTopics = async () => {
    savingTopics.value = true
    try {
        const parsed = JSON.parse(topicsJson.value || '{}')
        await uiedSaveArticleTopicsConfig(parsed)
        feedback.msgSuccess('文章专题配置保存成功')
        await loadTopicsConfig()
    } catch (error: any) {
        feedback.msgError(`JSON 格式错误：${error?.message || '请检查内容'}`)
    } finally {
        savingTopics.value = false
    }
}

/**
 * 页面初始化
 */
const initializePage = async () => {
    await Promise.all([loadArticleConfig(), loadTopicsConfig()])
}

onMounted(() => {
    initializePage()
})
</script>

<style scoped>
.config-table-wrap {
    margin-bottom: 12px;
}

.sort-actions {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
}
</style>
