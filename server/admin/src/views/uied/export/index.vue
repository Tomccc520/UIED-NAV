<!--
 * @file views/uied/export/index.vue
 * @description 数据导出页面
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
-->
<template>
    <div class="export">
        <el-card class="!border-none" shadow="never">
            <h3 class="text-lg font-medium mb-4">数据导出</h3>
            <el-row :gutter="20">
                <el-col :span="8">
                    <el-card shadow="hover">
                        <div class="text-center">
                            <el-icon :size="48" class="text-blue-500 mb-4"><Document /></el-icon>
                            <h4 class="text-base font-medium mb-2">导出网站数据</h4>
                            <p class="text-gray-500 text-sm mb-4">导出所有网站信息为 JSON 格式</p>
                            <el-button
                                type="primary"
                                :loading="exporting.websites"
                                @click="exportData('websites')"
                            >
                                导出网站
                            </el-button>
                        </div>
                    </el-card>
                </el-col>
                <el-col :span="8">
                    <el-card shadow="hover">
                        <div class="text-center">
                            <el-icon :size="48" class="text-green-500 mb-4"><Folder /></el-icon>
                            <h4 class="text-base font-medium mb-2">导出分类数据</h4>
                            <p class="text-gray-500 text-sm mb-4">导出所有分类信息为 JSON 格式</p>
                            <el-button
                                type="success"
                                :loading="exporting.categories"
                                @click="exportData('categories')"
                            >
                                导出分类
                            </el-button>
                        </div>
                    </el-card>
                </el-col>
                <el-col :span="8">
                    <el-card shadow="hover">
                        <div class="text-center">
                            <el-icon :size="48" class="text-orange-500 mb-4"><Files /></el-icon>
                            <h4 class="text-base font-medium mb-2">导出全部数据</h4>
                            <p class="text-gray-500 text-sm mb-4">导出所有数据为完整备份</p>
                            <el-button
                                type="warning"
                                :loading="exporting.all"
                                @click="exportData('all')"
                            >
                                导出全部
                            </el-button>
                        </div>
                    </el-card>
                </el-col>
            </el-row>
        </el-card>

        <el-card class="!border-none mt-4" shadow="never">
            <h3 class="text-lg font-medium mb-4">数据统计</h3>
            <el-row :gutter="20">
                <el-col :span="6">
                    <el-statistic title="网站总数" :value="stats.websites" />
                </el-col>
                <el-col :span="6">
                    <el-statistic title="分类总数" :value="stats.categories" />
                </el-col>
                <el-col :span="6">
                    <el-statistic title="页面总数" :value="stats.pages" />
                </el-col>
                <el-col :span="6">
                    <el-statistic title="热门推荐" :value="stats.hotRecommendations" />
                </el-col>
            </el-row>
        </el-card>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { Document, Folder, Files } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'

const exporting = reactive({ websites: false, categories: false, all: false })
const stats = reactive({ websites: 0, categories: 0, pages: 0, hotRecommendations: 0 })

const exportData = async (type: string) => {
    exporting[type as keyof typeof exporting] = true
    try {
        const res = await request.get(
            { url: `/uied/export/${type}` },
            { isTransformResponse: false, isReturnDefaultResponse: true }
        )
        const blob = new Blob([(res as any).data], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `uied_${type}_${Date.now()}.json`
        a.click()
        URL.revokeObjectURL(url)
        ElMessage.success('导出成功')
    } catch (e) {
        ElMessage.error('导出失败')
    } finally {
        exporting[type as keyof typeof exporting] = false
    }
}

const loadStats = async () => {
    try {
        const [w, c, p, h] = await Promise.all([
            request.get({ url: '/uied/website/list', params: { pageSize: 1 } }),
            request.get({ url: '/uied/category/list', params: { pageSize: 1 } }),
            request.get({ url: '/uied/page/list', params: { pageSize: 1 } }),
            request.get({ url: '/uied/hotRecommendation/list', params: { pageSize: 1 } })
        ])
        // request 工具在 code=200 时直接返回 data 字段
        stats.websites = (w as any)?.count || 0
        stats.categories = (c as any)?.count || 0
        stats.pages = (p as any)?.count || 0
        stats.hotRecommendations = (h as any)?.count || 0
    } catch (e) {
        console.error(e)
    }
}

onMounted(loadStats)
</script>
