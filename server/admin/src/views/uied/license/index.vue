<!--
 * @copyright Tomda (https://www.tomda.top)
 * @copyright UIED技术团队 (https://fsuied.com)
 * @author UIED技术团队
 * @createDate 2026.2.20
-->
<template>
    <div class="uied-license-page">
        <el-card class="!border-none" shadow="never">
            <template #header>
                <div class="flex items-center justify-between">
                    <span class="font-medium">许可证中心</span>
                    <el-button type="primary" :loading="licenseSaving" @click="handleSaveLicense">
                        保存许可证
                    </el-button>
                </div>
            </template>
            <el-form :model="licenseForm" label-width="120px" class="max-w-[760px]">
                <el-form-item label="版本等级">
                    <el-select v-model="licenseForm.edition" class="w-[220px]">
                        <el-option label="Free" value="free" />
                        <el-option label="Pro" value="pro" />
                        <el-option label="Enterprise" value="enterprise" />
                    </el-select>
                </el-form-item>
                <el-form-item label="许可证状态">
                    <el-select v-model="licenseForm.status" class="w-[220px]">
                        <el-option label="激活" value="active" />
                        <el-option label="禁用" value="disabled" />
                    </el-select>
                </el-form-item>
                <el-form-item label="许可证密钥">
                    <el-input v-model="licenseForm.licenseKey" placeholder="请输入许可证密钥" />
                </el-form-item>
                <el-form-item label="客户名称">
                    <el-input v-model="licenseForm.customerName" placeholder="请输入客户名称" />
                </el-form-item>
                <el-form-item label="公司名称">
                    <el-input v-model="licenseForm.companyName" placeholder="请输入公司名称" />
                </el-form-item>
                <el-form-item label="联系邮箱">
                    <el-input v-model="licenseForm.contactEmail" placeholder="请输入联系邮箱" />
                </el-form-item>
                <el-form-item label="域名绑定上限">
                    <el-input-number v-model="licenseForm.domainLimit" :min="1" :max="9999" />
                </el-form-item>
                <el-form-item label="签发时间(秒)">
                    <el-input-number v-model="licenseForm.issuedAt" :min="0" :step="86400" />
                </el-form-item>
                <el-form-item label="到期时间(秒)">
                    <el-input-number v-model="licenseForm.expiresAt" :min="0" :step="86400" />
                </el-form-item>
                <el-form-item label="备注">
                    <el-input
                        v-model="licenseForm.note"
                        type="textarea"
                        :rows="3"
                        placeholder="可填写授权备注"
                    />
                </el-form-item>
            </el-form>
        </el-card>

        <el-card class="!border-none mt-4" shadow="never">
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

<script lang="ts" setup name="uiedLicenseCenter">
/**
 * @copyright Tomda (https://www.tomda.top)
 * @copyright UIED技术团队 (https://fsuied.com)
 * @author UIED技术团队
 * @createDate 2026.2.20
 */
import { onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import feedback from '@/utils/feedback'
import { uiedFeatureList, uiedLicenseInfo, uiedSaveFeature, uiedSaveLicenseInfo } from '@/api/uied'

interface FeatureRow {
    key: string
    name: string
    minEdition: string
    enabled: boolean
}

const route = useRoute()
const licenseSaving = ref(false)
const featureSaving = ref(false)
const featureLoading = ref(false)

const licenseForm = reactive({
    edition: 'free',
    status: 'active',
    licenseKey: '',
    customerName: '',
    companyName: '',
    contactEmail: '',
    domainLimit: 1,
    issuedAt: 0,
    expiresAt: 0,
    note: ''
})

const featureRows = ref<FeatureRow[]>([])
const featureForceOff = reactive<Record<string, boolean>>({})

/**
 * 读取许可证信息
 */
const loadLicenseInfo = async () => {
    const data = await uiedLicenseInfo()
    licenseForm.edition = data?.edition || 'free'
    licenseForm.status = data?.status || 'active'
    licenseForm.licenseKey = data?.licenseKey || ''
    licenseForm.customerName = data?.customerName || ''
    licenseForm.companyName = data?.companyName || ''
    licenseForm.contactEmail = data?.contactEmail || ''
    licenseForm.domainLimit = Number(data?.domainLimit || 1)
    licenseForm.issuedAt = Number(data?.issuedAt || 0)
    licenseForm.expiresAt = Number(data?.expiresAt || 0)
    licenseForm.note = data?.note || ''
}

/**
 * 读取功能开关列表
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
 * 保存许可证信息
 */
const handleSaveLicense = async () => {
    licenseSaving.value = true
    try {
        await uiedSaveLicenseInfo({ ...licenseForm })
        feedback.msgSuccess('许可证保存成功')
        await loadLicenseInfo()
    } finally {
        licenseSaving.value = false
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

/**
 * 页面初始化加载
 */
const initializePage = async () => {
    await Promise.all([loadLicenseInfo(), loadFeatureList()])
}

watch(
    () => route.query.tab,
    async () => {
        // 当前页支持通过 query 进入功能开关页签，保持数据实时
        await loadFeatureList()
    }
)

onMounted(() => {
    initializePage()
})
</script>
