<!--
/**
 * @copyright Tomda (https://www.tomda.top)
 * @copyright UIED技术团队 (https://fsuied.com)
 * @author UIED技术团队
 * @createDate 2026.3.2
 */
-->
<template>
    <div class="admin-search">
        <!-- 搜索框 -->
        <el-input
            v-model="keyword"
            placeholder="搜索网站、分类、页面、文章..."
            prefix-icon="Search"
            clearable
            @input="handleSearch"
            @keyup.enter="handleGlobalSearch"
            class="search-input"
        >
            <template #append>
                <el-button icon="Search" @click="handleGlobalSearch">搜索</el-button>
            </template>
        </el-input>

        <!-- 快速搜索建议 -->
        <div v-if="showSuggestions && suggestions.length > 0" class="suggestions-dropdown">
            <div
                v-for="item in suggestions"
                :key="`${item.type}-${item.id}`"
                class="suggestion-item"
                @click="handleSuggestionClick(item)"
            >
                <el-icon class="suggestion-icon">
                    <component :is="getTypeIcon(item.type)" />
                </el-icon>
                <div class="suggestion-content">
                    <div class="suggestion-title">{{ item.title }}</div>
                    <div v-if="item.subtitle" class="suggestion-subtitle">{{ item.subtitle }}</div>
                </div>
                <el-tag :type="getTypeColor(item.type)" size="small">{{
                    getTypeName(item.type)
                }}</el-tag>
            </div>
        </div>

        <!-- 搜索历史 -->
        <div v-if="showHistory && history.length > 0" class="history-dropdown">
            <div class="history-header">
                <span>搜索历史</span>
                <el-button type="text" size="small" @click="handleClearHistory">清空</el-button>
            </div>
            <div
                v-for="(item, index) in history"
                :key="index"
                class="history-item"
                @click="handleHistoryClick(item)"
            >
                <el-icon><Clock /></el-icon>
                <span>{{ item }}</span>
            </div>
        </div>

        <!-- 全局搜索结果对话框 -->
        <el-dialog v-model="showResults" title="搜索结果" width="80%" :close-on-click-modal="false">
            <el-tabs v-model="activeTab" @tab-change="handleTabChange">
                <el-tab-pane label="全部" name="all">
                    <div class="search-results">
                        <!-- 网站 -->
                        <div v-if="results.websites.length > 0" class="result-section">
                            <h3>网站 ({{ results.websites.length }})</h3>
                            <el-table :data="results.websites" style="width: 100%">
                                <el-table-column prop="name" label="名称" width="200" />
                                <el-table-column prop="url" label="URL" />
                                <el-table-column
                                    prop="description"
                                    label="描述"
                                    show-overflow-tooltip
                                />
                                <el-table-column label="操作" width="150">
                                    <template #default="{ row }">
                                        <el-button
                                            type="primary"
                                            size="small"
                                            @click="handleEdit('website', row.id)"
                                        >
                                            编辑
                                        </el-button>
                                    </template>
                                </el-table-column>
                            </el-table>
                        </div>

                        <!-- 分类 -->
                        <div v-if="results.categories.length > 0" class="result-section">
                            <h3>分类 ({{ results.categories.length }})</h3>
                            <el-table :data="results.categories" style="width: 100%">
                                <el-table-column prop="name" label="名称" width="200" />
                                <el-table-column prop="description" label="描述" />
                                <el-table-column label="操作" width="150">
                                    <template #default="{ row }">
                                        <el-button
                                            type="primary"
                                            size="small"
                                            @click="handleEdit('category', row.id)"
                                        >
                                            编辑
                                        </el-button>
                                    </template>
                                </el-table-column>
                            </el-table>
                        </div>

                        <!-- 页面 -->
                        <div v-if="results.pages.length > 0" class="result-section">
                            <h3>页面 ({{ results.pages.length }})</h3>
                            <el-table :data="results.pages" style="width: 100%">
                                <el-table-column prop="name" label="名称" width="200" />
                                <el-table-column prop="slug" label="Slug" width="150" />
                                <el-table-column prop="description" label="描述" />
                                <el-table-column label="操作" width="150">
                                    <template #default="{ row }">
                                        <el-button
                                            type="primary"
                                            size="small"
                                            @click="handleEdit('page', row.id)"
                                        >
                                            编辑
                                        </el-button>
                                    </template>
                                </el-table-column>
                            </el-table>
                        </div>

                        <!-- 文章 -->
                        <div v-if="results.articles.length > 0" class="result-section">
                            <h3>文章 ({{ results.articles.length }})</h3>
                            <el-table :data="results.articles" style="width: 100%">
                                <el-table-column prop="title" label="标题" width="300" />
                                <el-table-column
                                    prop="excerpt"
                                    label="摘要"
                                    show-overflow-tooltip
                                />
                                <el-table-column label="操作" width="150">
                                    <template #default="{ row }">
                                        <el-button
                                            type="primary"
                                            size="small"
                                            @click="handleEdit('article', row.id)"
                                        >
                                            编辑
                                        </el-button>
                                    </template>
                                </el-table-column>
                            </el-table>
                        </div>

                        <!-- 无结果 -->
                        <el-empty v-if="results.total === 0" description="未找到相关内容" />
                    </div>
                </el-tab-pane>

                <el-tab-pane :label="`网站 (${results.websites.length})`" name="website">
                    <div class="search-results">
                        <el-table
                            v-if="results.websites.length > 0"
                            :data="results.websites"
                            style="width: 100%"
                        >
                            <el-table-column prop="name" label="名称" width="220" />
                            <el-table-column prop="url" label="URL" />
                            <el-table-column
                                prop="description"
                                label="描述"
                                show-overflow-tooltip
                            />
                            <el-table-column label="操作" width="150">
                                <template #default="{ row }">
                                    <el-button
                                        type="primary"
                                        size="small"
                                        @click="handleEdit('website', row.id)"
                                    >
                                        编辑
                                    </el-button>
                                </template>
                            </el-table-column>
                        </el-table>
                        <el-empty v-else description="暂无网站搜索结果" />
                    </div>
                </el-tab-pane>

                <el-tab-pane :label="`分类 (${results.categories.length})`" name="category">
                    <div class="search-results">
                        <el-table
                            v-if="results.categories.length > 0"
                            :data="results.categories"
                            style="width: 100%"
                        >
                            <el-table-column prop="name" label="名称" width="220" />
                            <el-table-column
                                prop="description"
                                label="描述"
                                show-overflow-tooltip
                            />
                            <el-table-column label="操作" width="150">
                                <template #default="{ row }">
                                    <el-button
                                        type="primary"
                                        size="small"
                                        @click="handleEdit('category', row.id)"
                                    >
                                        编辑
                                    </el-button>
                                </template>
                            </el-table-column>
                        </el-table>
                        <el-empty v-else description="暂无分类搜索结果" />
                    </div>
                </el-tab-pane>

                <el-tab-pane :label="`页面 (${results.pages.length})`" name="page">
                    <div class="search-results">
                        <el-table
                            v-if="results.pages.length > 0"
                            :data="results.pages"
                            style="width: 100%"
                        >
                            <el-table-column prop="name" label="名称" width="220" />
                            <el-table-column prop="slug" label="Slug" width="200" />
                            <el-table-column
                                prop="description"
                                label="描述"
                                show-overflow-tooltip
                            />
                            <el-table-column label="操作" width="150">
                                <template #default="{ row }">
                                    <el-button
                                        type="primary"
                                        size="small"
                                        @click="handleEdit('page', row.id)"
                                    >
                                        编辑
                                    </el-button>
                                </template>
                            </el-table-column>
                        </el-table>
                        <el-empty v-else description="暂无页面搜索结果" />
                    </div>
                </el-tab-pane>

                <el-tab-pane :label="`文章 (${results.articles.length})`" name="article">
                    <div class="search-results">
                        <el-table
                            v-if="results.articles.length > 0"
                            :data="results.articles"
                            style="width: 100%"
                        >
                            <el-table-column
                                prop="title"
                                label="标题"
                                min-width="280"
                                show-overflow-tooltip
                            />
                            <el-table-column prop="excerpt" label="摘要" show-overflow-tooltip />
                            <el-table-column label="操作" width="150">
                                <template #default="{ row }">
                                    <el-button
                                        type="primary"
                                        size="small"
                                        @click="handleEdit('article', row.id)"
                                    >
                                        编辑
                                    </el-button>
                                </template>
                            </el-table-column>
                        </el-table>
                        <el-empty v-else description="暂无文章搜索结果" />
                    </div>
                </el-tab-pane>
            </el-tabs>
        </el-dialog>
    </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'

const router = useRouter()

const keyword = ref('')
const showSuggestions = ref(false)
const showHistory = ref(false)
const suggestions = ref([])
const history = ref([])
const showResults = ref(false)
const activeTab = ref('all')
const results = ref({
    websites: [],
    categories: [],
    pages: [],
    articles: [],
    users: [],
    total: 0
})

let searchTimer = null

// 监听关键词变化
watch(keyword, (newVal) => {
    if (newVal && newVal.length >= 2) {
        showHistory.value = false
        // 防抖处理
        clearTimeout(searchTimer)
        searchTimer = setTimeout(() => {
            handleQuickSearch()
        }, 300)
    } else {
        showSuggestions.value = false
        if (!newVal) {
            showHistory.value = true
            loadHistory()
        }
    }
})

// 快速搜索
const handleQuickSearch = async () => {
    try {
        const res = await request.get({
            url: '/uied/search/quick',
            params: { keyword: keyword.value }
        })
        suggestions.value = Array.isArray(res?.suggestions) ? res.suggestions : []
        showSuggestions.value = suggestions.value.length > 0
    } catch (error) {
        console.error('快速搜索失败:', error)
    }
}

// 全局搜索
const handleGlobalSearch = async () => {
    if (!keyword.value || keyword.value.trim().length === 0) {
        ElMessage.warning('请输入搜索关键词')
        return
    }

    showSuggestions.value = false
    showHistory.value = false

    try {
        const res = await request.get({
            url: '/uied/search/global',
            params: {
                keyword: keyword.value,
                type: activeTab.value === 'all' ? 'all' : activeTab.value
            }
        })
        results.value = res || {
            websites: [],
            categories: [],
            pages: [],
            articles: [],
            users: [],
            total: 0
        }
        showResults.value = true
    } catch (error) {
        console.error('全局搜索失败:', error)
        ElMessage.error('搜索失败')
    }
}

// 点击建议项
const handleSuggestionClick = (item) => {
    showSuggestions.value = false
    if (item.route) {
        router.push(item.route)
    }
}

// 点击历史记录
const handleHistoryClick = (item) => {
    keyword.value = item
    showHistory.value = false
    handleGlobalSearch()
}

// 加载搜索历史
const loadHistory = async () => {
    try {
        const res = await request.get({
            url: '/uied/search/history',
            params: { limit: 10 }
        })
        history.value = Array.isArray(res) ? res : []
    } catch (error) {
        console.error('加载搜索历史失败:', error)
    }
}

// 清空搜索历史
const handleClearHistory = async () => {
    try {
        await request.post({
            url: '/uied/search/history/clear'
        })
        history.value = []
        showHistory.value = false
        ElMessage.success('已清空搜索历史')
    } catch (error) {
        console.error('清空搜索历史失败:', error)
        ElMessage.error('清空失败')
    }
}

// 切换标签
const handleTabChange = (tab) => {
    if (tab !== 'all') {
        handleGlobalSearch()
    }
}

// 编辑
const handleEdit = (type, id) => {
    const routes = {
        website: `/uied/website/edit?id=${id}`,
        category: '/uied/category',
        page: '/uied/page',
        article: '/uied/article'
    }

    if (routes[type]) {
        router.push(routes[type])
        showResults.value = false
    }
}

// 获取类型图标
const getTypeIcon = (type) => {
    const icons = {
        website: 'Link',
        category: 'Folder',
        page: 'Document',
        article: 'Reading',
        user: 'User'
    }
    return icons[type] || 'Document'
}

// 获取类型颜色
const getTypeColor = (type) => {
    const colors = {
        website: 'primary',
        category: 'success',
        page: 'warning',
        article: 'info',
        user: 'danger'
    }
    return colors[type] || ''
}

// 获取类型名称
const getTypeName = (type) => {
    const names = {
        website: '网站',
        category: '分类',
        page: '页面',
        article: '文章',
        user: '用户'
    }
    return names[type] || type
}

onMounted(() => {
    loadHistory()
})
</script>

<style scoped>
.admin-search {
    position: relative;
    width: 100%;
    max-width: 600px;
}

.search-input {
    width: 100%;
}

.suggestions-dropdown,
.history-dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    margin-top: 8px;
    background: white;
    border: 1px solid #dcdfe6;
    border-radius: 4px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
    max-height: 400px;
    overflow-y: auto;
    z-index: 1000;
}

.suggestion-item,
.history-item {
    display: flex;
    align-items: center;
    padding: 12px 16px;
    cursor: pointer;
    transition: background-color 0.2s;
}

.suggestion-item:hover,
.history-item:hover {
    background-color: #f5f7fa;
}

.suggestion-icon {
    margin-right: 12px;
    font-size: 20px;
    color: #909399;
}

.suggestion-content {
    flex: 1;
    margin-right: 12px;
}

.suggestion-title {
    font-size: 14px;
    color: #303133;
    margin-bottom: 4px;
}

.suggestion-subtitle {
    font-size: 12px;
    color: #909399;
}

.history-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    border-bottom: 1px solid #ebeef5;
    font-size: 14px;
    color: #606266;
}

.history-item {
    gap: 8px;
    font-size: 14px;
    color: #606266;
}

.result-section {
    margin-bottom: 24px;
}

.result-section h3 {
    margin: 0 0 16px 0;
    font-size: 16px;
    color: #303133;
}

.search-results {
    padding: 20px;
}
</style>
