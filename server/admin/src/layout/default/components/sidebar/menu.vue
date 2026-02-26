<template>
    <div
        class="menu flex-1 min-h-0"
        :class="themeClass"
        :style="isCollapsed ? '' : `--aside-width: ${width}px`"
    >
        <div v-if="!isCollapsed" class="menu-search-bar">
            <el-input
                v-model.trim="menuKeyword"
                clearable
                size="small"
                placeholder="搜索功能菜单..."
            />
        </div>
        <el-scrollbar>
            <div v-if="menuKeyword && displayRoutes.length === 0" class="menu-search-empty">
                未找到匹配功能，请换个关键词试试
            </div>
            <el-menu
                v-bind="config"
                :default-active="activeMenu"
                :collapse="isCollapsed"
                mode="vertical"
                :unique-opened="uniqueOpened"
                @select="$emit('select')"
            >
                <menu-item
                    v-for="route in displayRoutes"
                    :key="route.path"
                    :route="route"
                    :route-path="route.path"
                    :popper-class="themeClass"
                />
            </el-menu>
        </el-scrollbar>
    </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import MenuItem from './menu-item.vue'
import type { RouteRecordRaw } from 'vue-router'

const props = defineProps({
    routes: {
        type: Object as PropType<RouteRecordRaw[]>
    },
    config: {
        type: Object
    },
    isCollapsed: {
        type: Boolean,
        default: false
    },
    uniqueOpened: {
        type: Boolean,
        default: false
    },
    theme: {
        type: String
    },
    width: {
        type: Number,
        default: 200
    }
})

defineEmits(['select'])

const route = useRoute()
const menuKeyword = ref('')
const activeMenu = computed<string>(() => route.meta?.activeMenu || route.path)
const themeClass = computed(() => `theme-${props.theme}`)

/**
 * 判断单个菜单节点是否命中关键词（标题或路径）
 * @param item 菜单路由节点
 * @param keyword 搜索关键词（已转小写）
 */
const isMenuNodeMatched = (item: RouteRecordRaw, keyword: string) => {
    const title = String(item?.meta?.title || '').toLowerCase()
    const path = String(item?.path || '').toLowerCase()
    return title.includes(keyword) || path.includes(keyword)
}

/**
 * 递归过滤菜单树：父节点命中或子节点命中时保留
 * @param list 原菜单列表
 * @param keyword 搜索关键词
 */
const filterMenuTree = (list: RouteRecordRaw[] = [], keyword: string): RouteRecordRaw[] => {
    if (!keyword) return list
    const lowerKeyword = keyword.toLowerCase()
    return list.reduce<RouteRecordRaw[]>((acc, item) => {
        if (!item || item.meta?.hidden) return acc
        const children = Array.isArray(item.children) ? item.children : []
        const filteredChildren = filterMenuTree(children as RouteRecordRaw[], lowerKeyword)
        const selfMatched = isMenuNodeMatched(item, lowerKeyword)
        if (!selfMatched && filteredChildren.length === 0) return acc
        acc.push({
            ...item,
            children: filteredChildren
        } as RouteRecordRaw)
        return acc
    }, [])
}

/**
 * 展示菜单（未搜索时显示全部，搜索时显示过滤后的树）
 */
const displayRoutes = computed<RouteRecordRaw[]>(() => {
    const routeList = (props.routes || []) as RouteRecordRaw[]
    const keyword = String(menuKeyword.value || '').trim()
    return filterMenuTree(routeList, keyword)
})
</script>

<style lang="scss" scoped>
.menu {
    .menu-search-bar {
        padding: 10px 10px 8px;
        border-bottom: 1px solid rgba(0, 0, 0, 0.04);
        background: rgba(255, 255, 255, 0.9);
        :deep(.el-input__wrapper) {
            border-radius: 10px;
        }
    }
    .menu-search-empty {
        margin: 10px 10px 0;
        padding: 10px 12px;
        border-radius: 10px;
        font-size: 12px;
        color: #909399;
        background: rgba(245, 247, 250, 0.9);
        border: 1px dashed rgba(0, 0, 0, 0.06);
    }
    &.theme-dark {
        .menu-search-bar {
            border-bottom-color: rgba(255, 255, 255, 0.08);
            background: rgba(17, 24, 39, 0.75);
        }
        .menu-search-empty {
            color: #cbd5e1;
            background: rgba(30, 41, 59, 0.75);
            border-color: rgba(255, 255, 255, 0.08);
        }
        .el-menu {
            :deep(.el-menu-item) {
                &.is-active {
                    @apply bg-primary border-primary;
                }
            }
        }
        :deep(.el-menu--collapse) {
            .el-sub-menu.is-active .el-sub-menu__title {
                @apply bg-primary #{!important};
            }
        }
    }
    &.theme-light {
        :deep(.el-menu) {
            .el-menu-item {
                border-color: transparent;
                &.is-active {
                    @apply bg-primary-light-9 border-r-2 border-primary;
                }
            }
            .el-menu-item:hover,
            .el-sub-menu__title:hover {
                color: var(--el-color-primary);
            }
        }
    }
    .el-menu {
        border-right: none;
        &:not(.el-menu--collapse) {
            width: var(--aside-width);
        }
    }
}
</style>
