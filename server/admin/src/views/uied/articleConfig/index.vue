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
                    <el-input v-model="articleConfig.listPageDescription" type="textarea" :rows="3" />
                </el-form-item>
                <el-form-item label="列表页封面图">
                    <el-input v-model="articleConfig.listPageCoverImage" placeholder="https://..." />
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
    commentsEnabled: true,
    topicsEnabled: true
})

/**
 * 加载文章配置
 */
const loadArticleConfig = async () => {
    const data = await uiedArticleConfig()
    Object.assign(articleConfig, {
        ...articleConfig,
        ...(data || {})
    })
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
