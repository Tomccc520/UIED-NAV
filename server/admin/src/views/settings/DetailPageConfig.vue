<!--
/**
 * @copyright Tomda (https://www.tomda.top)
 * @copyright UIED技术团队 (https://fsuied.com)
 * @author UIED技术团队
 * @createDate 2026.3.2
 */
-->
<template>
    <div class="detail-page-config">
        <el-tabs v-model="activeTab" type="border-card">
            <!-- 分享渠道配置 -->
            <el-tab-pane label="分享渠道" name="share">
                <el-card>
                    <template #header>
                        <div class="card-header">
                            <span>分享渠道配置</span>
                            <el-button
                                type="primary"
                                size="small"
                                @click="handleSaveShare"
                                :loading="loading"
                            >
                                保存配置
                            </el-button>
                        </div>
                    </template>

                    <el-alert
                        title="提示"
                        type="info"
                        :closable="false"
                        show-icon
                        style="margin-bottom: 20px"
                    >
                        拖拽可调整分享渠道的显示顺序
                    </el-alert>

                    <el-table :data="shareChannels" row-key="key" border style="width: 100%">
                        <el-table-column label="排序" width="60" align="center">
                            <template #default="{ $index }">
                                <span>{{ $index + 1 }}</span>
                            </template>
                        </el-table-column>

                        <el-table-column label="渠道名称" prop="name" width="150" />

                        <el-table-column label="图标" width="100" align="center">
                            <template #default="{ row }">
                                <el-icon :size="20">
                                    <component :is="getIconComponent(row.icon)" />
                                </el-icon>
                            </template>
                        </el-table-column>

                        <el-table-column label="渠道标识" prop="key" width="150" />

                        <el-table-column label="是否启用" width="120" align="center">
                            <template #default="{ row }">
                                <el-switch v-model="row.enabled" />
                            </template>
                        </el-table-column>

                        <el-table-column label="操作" width="150" align="center">
                            <template #default="{ row, $index }">
                                <el-button
                                    type="text"
                                    size="small"
                                    :disabled="$index === 0"
                                    @click="moveUp($index, shareChannels)"
                                >
                                    上移
                                </el-button>
                                <el-button
                                    type="text"
                                    size="small"
                                    :disabled="$index === shareChannels.length - 1"
                                    @click="moveDown($index, shareChannels)"
                                >
                                    下移
                                </el-button>
                            </template>
                        </el-table-column>
                    </el-table>
                </el-card>
            </el-tab-pane>

            <!-- 侧边栏配置 -->
            <el-tab-pane label="侧边栏模块" name="sidebar">
                <el-card>
                    <template #header>
                        <div class="card-header">
                            <span>侧边栏模块配置</span>
                            <el-button
                                type="primary"
                                size="small"
                                @click="handleSaveSidebar"
                                :loading="loading"
                            >
                                保存配置
                            </el-button>
                        </div>
                    </template>

                    <el-alert
                        title="提示"
                        type="info"
                        :closable="false"
                        show-icon
                        style="margin-bottom: 20px"
                    >
                        拖拽可调整侧边栏模块的显示顺序
                    </el-alert>

                    <el-table :data="sidebarModules" row-key="key" border style="width: 100%">
                        <el-table-column label="排序" width="60" align="center">
                            <template #default="{ $index }">
                                <span>{{ $index + 1 }}</span>
                            </template>
                        </el-table-column>

                        <el-table-column label="模块名称" prop="name" width="150" />

                        <el-table-column label="模块标识" prop="key" width="150" />

                        <el-table-column label="说明" prop="description">
                            <template #default="{ row }">
                                <span>{{ getModuleDescription(row.key) }}</span>
                            </template>
                        </el-table-column>

                        <el-table-column label="是否启用" width="120" align="center">
                            <template #default="{ row }">
                                <el-switch v-model="row.enabled" />
                            </template>
                        </el-table-column>

                        <el-table-column label="操作" width="150" align="center">
                            <template #default="{ row, $index }">
                                <el-button
                                    type="text"
                                    size="small"
                                    :disabled="$index === 0"
                                    @click="moveUp($index, sidebarModules)"
                                >
                                    上移
                                </el-button>
                                <el-button
                                    type="text"
                                    size="small"
                                    :disabled="$index === sidebarModules.length - 1"
                                    @click="moveDown($index, sidebarModules)"
                                >
                                    下移
                                </el-button>
                            </template>
                        </el-table-column>
                    </el-table>
                </el-card>
            </el-tab-pane>
        </el-tabs>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'

const activeTab = ref('share')
const loading = ref(false)

// 分享渠道配置
const shareChannels = ref([
    { key: 'wechat', name: '微信', enabled: true, icon: 'wechat', sort: 1 },
    { key: 'weibo', name: '微博', enabled: true, icon: 'weibo', sort: 2 },
    { key: 'qq', name: 'QQ', enabled: true, icon: 'qq', sort: 3 },
    { key: 'qzone', name: 'QQ空间', enabled: true, icon: 'qzone', sort: 4 },
    { key: 'twitter', name: 'Twitter', enabled: true, icon: 'twitter', sort: 5 },
    { key: 'facebook', name: 'Facebook', enabled: true, icon: 'facebook', sort: 6 },
    { key: 'linkedin', name: 'LinkedIn', enabled: false, icon: 'linkedin', sort: 7 },
    { key: 'copylink', name: '复制链接', enabled: true, icon: 'link', sort: 8 }
])

// 侧边栏模块配置
const sidebarModules = ref([
    { key: 'info', name: '网站信息', enabled: true, sort: 1 },
    { key: 'tags', name: '标签', enabled: true, sort: 2 },
    { key: 'category', name: '分类', enabled: true, sort: 3 },
    { key: 'related', name: '相关推荐', enabled: true, sort: 4 },
    { key: 'qrcode', name: '二维码', enabled: true, sort: 5 },
    { key: 'ad', name: '广告位', enabled: false, sort: 6 }
])

// 获取图标组件
const getIconComponent = (icon) => {
    const iconMap = {
        wechat: 'ChatDotRound',
        weibo: 'Share',
        qq: 'ChatDotSquare',
        qzone: 'ChatSquare',
        twitter: 'Share',
        facebook: 'Share',
        linkedin: 'Share',
        link: 'Link'
    }
    return iconMap[icon] || 'Share'
}

// 获取模块说明
const getModuleDescription = (key) => {
    const descriptions = {
        info: '显示网站基本信息（名称、描述、URL等）',
        tags: '显示网站相关标签',
        category: '显示网站所属分类',
        related: '显示相关推荐网站',
        qrcode: '显示网站二维码',
        ad: '显示广告位'
    }
    return descriptions[key] || ''
}

// 上移
const moveUp = (index, list) => {
    if (index > 0) {
        const temp = list[index]
        list[index] = list[index - 1]
        list[index - 1] = temp
        updateSort(list)
    }
}

// 下移
const moveDown = (index, list) => {
    if (index < list.length - 1) {
        const temp = list[index]
        list[index] = list[index + 1]
        list[index + 1] = temp
        updateSort(list)
    }
}

// 更新排序
const updateSort = (list) => {
    list.forEach((item, index) => {
        item.sort = index + 1
    })
}

/**
 * 加载详情页分享/侧栏配置
 */
const loadConfig = async () => {
    try {
        const res = await request.get({
            url: '/uied/setting/get',
            params: { key: 'detailPageConfig' }
        })

        const config = res && typeof res === 'object' ? res : {}
        if (Array.isArray(config.shareChannels)) {
            shareChannels.value = config.shareChannels
        }
        if (Array.isArray(config.sidebarModules)) {
            sidebarModules.value = config.sidebarModules
        }
    } catch (error) {
        console.error('加载配置失败:', error)
    }
}

/**
 * 保存分享渠道配置
 */
const handleSaveShare = async () => {
    loading.value = true
    try {
        // 先获取完整配置
        const currentConfig = await request.get({
            url: '/uied/setting/get',
            params: { key: 'detailPageConfig' }
        })

        // 更新分享渠道配置
        await request.post({
            url: '/uied/setting/save',
            data: {
                detailPageConfig: {
                    ...currentConfig,
                    shareChannels: shareChannels.value
                }
            }
        })

        ElMessage.success('保存成功')
    } catch (error) {
        console.error('保存失败:', error)
        ElMessage.error('保存失败')
    } finally {
        loading.value = false
    }
}

/**
 * 保存侧边栏模块配置
 */
const handleSaveSidebar = async () => {
    loading.value = true
    try {
        // 先获取完整配置
        const currentConfig = await request.get({
            url: '/uied/setting/get',
            params: { key: 'detailPageConfig' }
        })

        // 更新侧边栏配置
        await request.post({
            url: '/uied/setting/save',
            data: {
                detailPageConfig: {
                    ...currentConfig,
                    sidebarModules: sidebarModules.value
                }
            }
        })

        ElMessage.success('保存成功')
    } catch (error) {
        console.error('保存失败:', error)
        ElMessage.error('保存失败')
    } finally {
        loading.value = false
    }
}

onMounted(() => {
    loadConfig()
})
</script>

<style scoped>
.detail-page-config {
    padding: 20px;
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

:deep(.el-tabs--border-card) {
    box-shadow: none;
    border: 1px solid #dcdfe6;
}
</style>
