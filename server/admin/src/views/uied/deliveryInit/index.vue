<!--
 * @copyright Tomda (https://www.tomda.top)
 * @copyright UIED技术团队 (https://fsuied.com)
 * @author UIED技术团队
 * @createDate 2026.2.20
-->
<template>
    <div class="uied-delivery-init-page">
        <el-card class="!border-none" shadow="never">
            <template #header>
                <div class="flex items-center justify-between">
                    <span class="font-medium">交付初始化向导</span>
                    <div class="flex gap-2">
                        <el-button :loading="previewLoading" @click="handlePreview">刷新预览</el-button>
                        <el-button type="primary" :loading="executeLoading" @click="handleExecute">
                            执行初始化
                        </el-button>
                    </div>
                </div>
            </template>
            <el-alert
                title="说明：用于售卖版交付时一键导入站点配置、分类标签、示例数据与许可证。建议先预览再执行。"
                type="info"
                :closable="false"
                class="mb-4"
            />
            <el-form :model="formData" label-width="150px" class="max-w-[980px]">
                <el-form-item label="初始化模板">
                    <el-input v-model="formData.profile" placeholder="默认 commercial_default" />
                </el-form-item>
                <el-form-item label="版本等级">
                    <el-select v-model="formData.edition" class="w-[220px]">
                        <el-option label="Free" value="free" />
                        <el-option label="Pro" value="pro" />
                        <el-option label="Enterprise" value="enterprise" />
                    </el-select>
                </el-form-item>
                <el-form-item label="品牌名称">
                    <el-input v-model="formData.brandName" placeholder="站点品牌名称" />
                </el-form-item>
                <el-form-item label="品牌域名">
                    <el-input v-model="formData.brandDomain" placeholder="https://example.com" />
                </el-form-item>
                <el-form-item label="客户名称">
                    <el-input v-model="formData.customerName" placeholder="可选" />
                </el-form-item>
                <el-form-item label="公司名称">
                    <el-input v-model="formData.companyName" placeholder="可选" />
                </el-form-item>
                <el-form-item label="联系邮箱">
                    <el-input v-model="formData.contactEmail" placeholder="可选" />
                </el-form-item>
                <el-form-item label="授权域名上限">
                    <el-input-number v-model="formData.domainLimit" :min="1" :max="9999" />
                </el-form-item>
                <el-form-item label="授权域名白名单">
                    <el-input
                        v-model="domainWhitelistText"
                        type="textarea"
                        :rows="2"
                        placeholder="支持逗号或换行分隔，例如：demo.tomda.top, nav.fsuied.com"
                    />
                </el-form-item>
            </el-form>
        </el-card>

        <el-card class="!border-none mt-4" shadow="never">
            <template #header>
                <div class="font-medium">导入模块</div>
            </template>
            <el-form :model="formData" label-width="180px" class="max-w-[980px]">
                <el-form-item label="站点配置">
                    <el-switch v-model="formData.includeSiteSettings" />
                </el-form-item>
                <el-form-item label="网站分类">
                    <el-switch v-model="formData.includeWebsiteCategories" />
                </el-form-item>
                <el-form-item label="网站标签">
                    <el-switch v-model="formData.includeWebsiteTags" />
                </el-form-item>
                <el-form-item label="示例网站">
                    <el-switch v-model="formData.includeSampleWebsites" />
                </el-form-item>
                <el-form-item label="文章分类">
                    <el-switch v-model="formData.includeArticleCategories" />
                </el-form-item>
                <el-form-item label="文章标签">
                    <el-switch v-model="formData.includeArticleTags" />
                </el-form-item>
                <el-form-item label="示例文章">
                    <el-switch v-model="formData.includeSampleArticles" />
                </el-form-item>
                <el-form-item label="写入许可证">
                    <el-switch v-model="formData.applyLicense" />
                </el-form-item>
                <el-form-item label="初始化测试用户">
                    <el-switch v-model="formData.seedUsers" />
                </el-form-item>
                <el-form-item label="清空功能开关覆盖">
                    <el-switch v-model="formData.resetFeatureOverrides" />
                </el-form-item>
                <el-form-item label="功能开关覆盖(JSON)">
                    <el-input
                        v-model="featureOverridesText"
                        :disabled="formData.resetFeatureOverrides"
                        type="textarea"
                        :rows="6"
                        placeholder='{"ai_chat": false, "advanced_stats": true}'
                        class="font-mono"
                    />
                </el-form-item>
            </el-form>
        </el-card>

        <el-card class="!border-none mt-4" shadow="never">
            <template #header>
                <div class="font-medium">预览结果</div>
            </template>
            <template v-if="previewData">
                <el-descriptions :column="2" border>
                    <el-descriptions-item label="模板">{{ previewData.profile || '-' }}</el-descriptions-item>
                    <el-descriptions-item label="版本">{{ String(previewData.edition || '-').toUpperCase() }}</el-descriptions-item>
                    <el-descriptions-item label="网站分类数量">{{ previewData?.counts?.websiteCategories ?? 0 }}</el-descriptions-item>
                    <el-descriptions-item label="网站标签数量">{{ previewData?.counts?.websiteTags ?? 0 }}</el-descriptions-item>
                    <el-descriptions-item label="示例网站数量">{{ previewData?.counts?.sampleWebsites ?? 0 }}</el-descriptions-item>
                    <el-descriptions-item label="示例文章数量">{{ previewData?.counts?.sampleArticles ?? 0 }}</el-descriptions-item>
                </el-descriptions>
                <el-alert
                    class="mt-3"
                    type="success"
                    :closable="false"
                    :title="`启用模块：${renderEnabledModules(previewData?.modules || {}).join(' / ') || '无'}`"
                />
            </template>
            <el-empty v-else description="点击“刷新预览”生成导入预览" />
        </el-card>

        <el-card class="!border-none mt-4" shadow="never">
            <template #header>
                <div class="font-medium">执行结果</div>
            </template>
            <template v-if="executeResult">
                <el-descriptions :column="2" border>
                    <el-descriptions-item label="模板">{{ executeResult.profile || '-' }}</el-descriptions-item>
                    <el-descriptions-item label="版本">{{ String(executeResult.edition || '-').toUpperCase() }}</el-descriptions-item>
                    <el-descriptions-item label="站点配置">
                        {{ executeResult?.summary?.siteSettings?.saved ? '已写入' : '未写入' }}
                    </el-descriptions-item>
                    <el-descriptions-item label="许可证">
                        {{ executeResult?.summary?.license?.applied ? '已写入' : '未写入' }}
                    </el-descriptions-item>
                    <el-descriptions-item label="网站分类">
                        新增 {{ executeResult?.summary?.websiteCategories?.created ?? 0 }} / 更新
                        {{ executeResult?.summary?.websiteCategories?.updated ?? 0 }}
                    </el-descriptions-item>
                    <el-descriptions-item label="网站标签">
                        新增 {{ executeResult?.summary?.websiteTags?.created ?? 0 }} / 更新
                        {{ executeResult?.summary?.websiteTags?.updated ?? 0 }}
                    </el-descriptions-item>
                    <el-descriptions-item label="示例网站">
                        新增 {{ executeResult?.summary?.sampleWebsites?.created ?? 0 }} / 更新
                        {{ executeResult?.summary?.sampleWebsites?.updated ?? 0 }}
                    </el-descriptions-item>
                    <el-descriptions-item label="示例文章">
                        新增 {{ executeResult?.summary?.sampleArticles?.created ?? 0 }} / 更新
                        {{ executeResult?.summary?.sampleArticles?.updated ?? 0 }}
                    </el-descriptions-item>
                    <el-descriptions-item label="测试用户初始化">
                        {{ executeResult?.summary?.users?.seeded ? `已执行（${executeResult?.summary?.users?.total ?? 0}）` : '未执行' }}
                    </el-descriptions-item>
                </el-descriptions>
            </template>
            <el-empty v-else description="尚未执行初始化" />
        </el-card>
    </div>
</template>

<script lang="ts" setup name="uiedDeliveryInit">
/**
 * @copyright Tomda (https://www.tomda.top)
 * @copyright UIED技术团队 (https://fsuied.com)
 * @author UIED技术团队
 * @createDate 2026.2.20
 */
import { onMounted, reactive, ref } from 'vue'
import feedback from '@/utils/feedback'
import { uiedDeliveryInitExecute, uiedDeliveryInitPreview } from '@/api/uied'

const previewLoading = ref(false)
const executeLoading = ref(false)
const domainWhitelistText = ref('')
const featureOverridesText = ref('{}')
const previewData = ref<any>(null)
const executeResult = ref<any>(null)

const formData = reactive({
    profile: 'commercial_default',
    edition: 'pro',
    brandName: 'UIED 商业导航系统',
    brandDomain: '',
    customerName: '',
    companyName: '',
    contactEmail: '',
    domainLimit: 1,
    includeSiteSettings: true,
    includeWebsiteCategories: true,
    includeWebsiteTags: true,
    includeSampleWebsites: true,
    includeArticleCategories: true,
    includeArticleTags: true,
    includeSampleArticles: true,
    applyLicense: true,
    resetFeatureOverrides: true,
    seedUsers: true
})

/**
 * 解析域名白名单文本输入
 */
const parseDomainWhitelist = () => {
    return domainWhitelistText.value
        .split(/[\n,]/g)
        .map((item) => item.trim())
        .filter(Boolean)
}

/**
 * 解析功能开关覆盖配置
 */
const parseFeatureOverrides = () => {
    const rawText = String(featureOverridesText.value || '').trim() || '{}'
    const parsed = JSON.parse(rawText)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error('功能开关覆盖必须是 JSON 对象')
    }
    return parsed
}

/**
 * 构建接口请求参数
 */
const buildPayload = () => {
    const payload: any = {
        profile: formData.profile,
        edition: formData.edition,
        brandName: formData.brandName,
        brandDomain: formData.brandDomain,
        customerName: formData.customerName,
        companyName: formData.companyName,
        contactEmail: formData.contactEmail,
        domainLimit: formData.domainLimit,
        domainWhitelist: parseDomainWhitelist(),
        includeSiteSettings: formData.includeSiteSettings,
        includeWebsiteCategories: formData.includeWebsiteCategories,
        includeWebsiteTags: formData.includeWebsiteTags,
        includeSampleWebsites: formData.includeSampleWebsites,
        includeArticleCategories: formData.includeArticleCategories,
        includeArticleTags: formData.includeArticleTags,
        includeSampleArticles: formData.includeSampleArticles,
        applyLicense: formData.applyLicense,
        resetFeatureOverrides: formData.resetFeatureOverrides,
        seedUsers: formData.seedUsers
    }
    if (!formData.resetFeatureOverrides) {
        payload.featureOverrides = parseFeatureOverrides()
    }
    return payload
}

/**
 * 渲染启用模块名称
 */
const renderEnabledModules = (modules: Record<string, boolean>) => {
    const labels: Record<string, string> = {
        siteSettings: '站点配置',
        websiteCategories: '网站分类',
        websiteTags: '网站标签',
        sampleWebsites: '示例网站',
        articleCategories: '文章分类',
        articleTags: '文章标签',
        sampleArticles: '示例文章',
        license: '许可证',
        seedUsers: '测试用户'
    }
    return Object.keys(labels).filter((key) => modules?.[key]).map((key) => labels[key])
}

/**
 * 拉取初始化预览结果
 */
const handlePreview = async () => {
    previewLoading.value = true
    try {
        const data = await uiedDeliveryInitPreview(buildPayload())
        previewData.value = data || null
    } catch (error: any) {
        feedback.msgError(error?.message || '预览失败')
    } finally {
        previewLoading.value = false
    }
}

/**
 * 执行交付初始化
 */
const handleExecute = async () => {
    try {
        await feedback.confirm('该操作会写入配置与示例数据，确定继续执行？')
    } catch (_error) {
        return
    }
    executeLoading.value = true
    try {
        const data = await uiedDeliveryInitExecute(buildPayload())
        executeResult.value = data || null
        feedback.msgSuccess('交付初始化执行成功')
        await handlePreview()
    } catch (error: any) {
        feedback.msgError(error?.message || '交付初始化执行失败')
    } finally {
        executeLoading.value = false
    }
}

/**
 * 页面初始化
 */
const initializePage = async () => {
    await handlePreview()
}

onMounted(() => {
    initializePage()
})
</script>
