<!--
 * @copyright Tomda (https://www.tomda.top)
 * @copyright UIED技术团队 (https://fsuied.com)
 * @author UIED技术团队
 * @createDate 2026.2.20
-->
<template>
    <div class="uied-feature-page">
        <el-card class="!border-none" shadow="never">
            <template #header>
                <div class="flex items-center justify-between">
                    <span class="font-medium">功能开关</span>
                    <el-button type="primary" :loading="featureSaving" @click="handleSaveFeature">
                        保存功能开关
                    </el-button>
                </div>
            </template>
            <el-alert
                title="说明：关闭后会强制禁用对应功能；开启不会突破许可证等级。"
                type="info"
                :closable="false"
                class="mb-4"
            />
            <el-table :data="featureRows" v-loading="featureLoading" size="large">
                <el-table-column prop="name" label="功能名称" min-width="180" />
                <el-table-column prop="key" label="功能键" min-width="200" />
                <el-table-column prop="minEdition" label="最低版本" width="120" />
                <el-table-column label="当前状态" width="120">
                    <template #default="{ row }">
                        <el-tag :type="row.enabled ? 'success' : 'info'">
                            {{ row.enabled ? '启用' : '关闭' }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="强制关闭" width="140">
                    <template #default="{ row }">
                        <el-switch v-model="featureForceOff[row.key]" />
                    </template>
                </el-table-column>
            </el-table>
        </el-card>
    </div>
</template>

<script lang="ts" setup name="uiedFeatureToggle">
/**
 * @copyright Tomda (https://www.tomda.top)
 * @copyright UIED技术团队 (https://fsuied.com)
 * @author UIED技术团队
 * @createDate 2026.2.20
 */
import { onMounted, reactive, ref } from 'vue'
import feedback from '@/utils/feedback'
import { uiedFeatureList, uiedSaveFeature } from '@/api/uied'

interface FeatureRow {
    key: string
    name: string
    minEdition: string
    enabled: boolean
}

const featureSaving = ref(false)
const featureLoading = ref(false)
const featureRows = ref<FeatureRow[]>([])
const featureForceOff = reactive<Record<string, boolean>>({})

/**
 * 加载功能开关列表
 */
const loadFeatureList = async () => {
    featureLoading.value = true
    try {
        const data = await uiedFeatureList()
        const rows = Array.isArray(data?.rows) ? data.rows : []
        featureRows.value = rows.map((item: any) => ({
            key: item.key,
            name: item.name,
            minEdition: item.minEdition,
            enabled: item.enabled !== false
        }))
        Object.keys(featureForceOff).forEach((key) => {
            delete featureForceOff[key]
        })
        rows.forEach((item: any) => {
            featureForceOff[item.key] = item.source === 'override_off'
        })
    } finally {
        featureLoading.value = false
    }
}

/**
 * 保存功能开关
 */
const handleSaveFeature = async () => {
    featureSaving.value = true
    try {
        const overrides: Record<string, boolean> = {}
        featureRows.value.forEach((row) => {
            if (featureForceOff[row.key]) {
                overrides[row.key] = false
            }
        })
        await uiedSaveFeature({ overrides })
        feedback.msgSuccess('功能开关保存成功')
        await loadFeatureList()
    } finally {
        featureSaving.value = false
    }
}

onMounted(() => {
    loadFeatureList()
})
</script>
