<!--
/**
 * @copyright Tomda (https://www.tomda.top)
 * @copyright UIED技术团队 (https://fsuied.com)
 * @author UIED技术团队
 * @createDate 2026.3.2
 */
-->
<template>
    <div class="header-search">
        <el-popover
            v-model:visible="showPopover"
            placement="bottom-end"
            :width="500"
            trigger="click"
        >
            <template #reference>
                <el-input
                    v-model="keyword"
                    placeholder="搜索菜单和功能..."
                    :prefix-icon="Search"
                    clearable
                    @input="handleInput"
                    @focus="handleFocus"
                    @keyup.enter="handleSearch"
                    class="search-input"
                    size="default"
                />
            </template>

            <!-- 搜索建议 -->
            <div v-if="suggestions.length > 0" class="search-suggestions">
                <div
                    v-for="item in suggestions"
                    :key="item.path"
                    class="suggestion-item"
                    @click="handleSuggestionClick(item)"
                >
                    <el-icon class="item-icon">
                        <component :is="item.icon || Menu" />
                    </el-icon>
                    <div class="item-content">
                        <div class="item-title">{{ item.title }}</div>
                        <div class="item-subtitle">{{ item.description }}</div>
                    </div>
                    <el-icon class="item-arrow"><ArrowRight /></el-icon>
                </div>
            </div>

            <!-- 搜索历史 -->
            <div v-else-if="history.length > 0" class="search-history">
                <div class="history-header">
                    <span>最近搜索</span>
                    <el-button type="text" size="small" @click="handleClearHistory">
                        清空
                    </el-button>
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

            <!-- 空状态 -->
            <div v-else class="empty-state">
                <el-empty description="输入关键词搜索菜单和功能" :image-size="80" />
            </div>
        </el-popover>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Search, Clock, ArrowRight, Menu } from '@element-plus/icons-vue'

const router = useRouter()

const keyword = ref('')
const showPopover = ref(false)
const history = ref([])

/**
 * 动态收集当前可访问路由，避免硬编码路径失效导致“搜索跳转 404”
 */
const menuItems = computed(() => {
    const routeList = router.getRoutes()
    const routeMap = new Map()

    routeList.forEach((route) => {
        const path = String(route.path || '').trim()
        const title = String(route.meta?.title || '').trim()
        const hidden = Boolean(route.meta?.hidden)

        if (!path || !title) return
        if (!path.startsWith('/')) return
        if (path.includes('/:') || path.includes('(.*)')) return
        // 隐藏路由默认不进入搜索，保留少量后台配置入口
        if (hidden && !path.startsWith('/settings/')) return
        if (routeMap.has(path)) return

        routeMap.set(path, {
            title,
            path,
            description: String(route.meta?.activeMenu || path || '').trim(),
            icon: route.meta?.icon || Menu
        })
    })

    return Array.from(routeMap.values())
})

// 搜索建议
const suggestions = computed(() => {
    if (!keyword.value || keyword.value.length < 1) {
        return []
    }

    const kw = keyword.value.toLowerCase()
    return menuItems.value
        .filter(
            (item) =>
                item.title.toLowerCase().includes(kw) ||
                item.description.toLowerCase().includes(kw) ||
                item.path.toLowerCase().includes(kw)
        )
        .slice(0, 10)
})

// 监听输入
const handleInput = () => {
    showPopover.value = true
}

// 获取焦点
const handleFocus = () => {
    showPopover.value = true
    if (!keyword.value) {
        loadHistory()
    }
}

// 执行搜索
const handleSearch = () => {
    if (suggestions.value.length > 0) {
        handleSuggestionClick(suggestions.value[0])
    }
}

// 点击建议项
const handleSuggestionClick = (item) => {
    showPopover.value = false
    saveHistory(item.title)
    if (router.currentRoute.value.path === item.path) return
    router.push(item.path).catch(() => {})
}

// 点击历史记录
const handleHistoryClick = (item) => {
    keyword.value = item
    showPopover.value = true
}

// 加载搜索历史
const loadHistory = () => {
    try {
        const saved = localStorage.getItem('admin_search_history')
        if (saved) {
            history.value = JSON.parse(saved)
        }
    } catch (error) {
        console.error('加载搜索历史失败:', error)
    }
}

// 保存搜索历史
const saveHistory = (keyword) => {
    try {
        // 移除重复项
        history.value = history.value.filter((item) => item !== keyword)
        // 添加到开头
        history.value.unshift(keyword)
        // 只保留最近5条
        history.value = history.value.slice(0, 5)
        // 保存到localStorage
        localStorage.setItem('admin_search_history', JSON.stringify(history.value))
    } catch (error) {
        console.error('保存搜索历史失败:', error)
    }
}

// 清空搜索历史
const handleClearHistory = () => {
    history.value = []
    localStorage.removeItem('admin_search_history')
    showPopover.value = false
}
</script>

<style scoped>
.header-search {
    width: 240px;
}

.search-input {
    width: 100%;
}

.search-input :deep(.el-input__wrapper) {
    background-color: rgba(0, 0, 0, 0.05);
    box-shadow: none;
    transition: all 0.3s;
}

.search-input :deep(.el-input__wrapper:hover) {
    background-color: rgba(0, 0, 0, 0.08);
}

.search-input :deep(.el-input__wrapper.is-focus) {
    background-color: #fff;
    box-shadow: 0 0 0 1px var(--el-color-primary) inset;
}

.search-suggestions,
.search-history {
    max-height: 400px;
    overflow-y: auto;
}

.suggestion-item,
.history-item {
    display: flex;
    align-items: center;
    padding: 10px 12px;
    cursor: pointer;
    transition: background-color 0.2s;
    border-radius: 4px;
    margin-bottom: 4px;
}

.suggestion-item:hover,
.history-item:hover {
    background-color: #f5f7fa;
}

.item-icon {
    margin-right: 10px;
    font-size: 18px;
    color: #909399;
}

.item-content {
    flex: 1;
    margin-right: 10px;
    min-width: 0;
}

.item-title {
    font-size: 14px;
    color: #303133;
    margin-bottom: 2px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.item-subtitle {
    font-size: 12px;
    color: #909399;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.item-arrow {
    font-size: 14px;
    color: #c0c4cc;
}

.history-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    margin-bottom: 4px;
    font-size: 13px;
    color: #606266;
    font-weight: 500;
}

.history-item {
    gap: 8px;
    font-size: 14px;
    color: #606266;
}

.empty-state {
    padding: 20px;
    text-align: center;
}
</style>
