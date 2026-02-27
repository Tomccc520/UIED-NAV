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
            <el-alert
                title="功能开关已拆分到独立菜单「系统设置 / 功能开关」，这里仅维护许可证信息。"
                type="info"
                :closable="false"
                class="mb-4"
            />
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
            <div class="mt-2">
                <el-button type="primary" plain @click="goFeaturePage">前往功能开关</el-button>
            </div>
        </el-card>

        <el-card class="!border-none mt-4" shadow="never">
            <template #header>
                <div class="flex items-center justify-between">
                    <span class="font-medium">商业版模式开关</span>
                    <el-button
                        v-perms="['uied:commercial:mode:save']"
                        type="primary"
                        :loading="modeSaving"
                        @click="handleSaveMode"
                    >
                        保存商业模式
                    </el-button>
                </div>
            </template>
            <el-form :model="modeForm" label-width="180px" class="max-w-[760px]">
                <el-form-item label="严格商业版模式">
                    <el-switch v-model="modeForm.strictLegacyRoutes" />
                    <span class="ml-3 text-xs text-tx-secondary">
                        开启后关闭旧兼容路由，仅允许 /api 正式路由访问
                    </span>
                </el-form-item>
                <el-form-item label="强制许可证签名校验">
                    <el-switch v-model="modeForm.enforceLicenseSignature" />
                    <span class="ml-3 text-xs text-tx-secondary">
                        开启后若 license 签名异常将自动降级为 Free 能力
                    </span>
                </el-form-item>
            </el-form>
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
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import feedback from '@/utils/feedback'
import {
    uiedCommercialModeGet,
    uiedCommercialModeSave,
    uiedLicenseInfo,
    uiedSaveLicenseInfo
} from '@/api/uied'

const router = useRouter()
const licenseSaving = ref(false)
const modeSaving = ref(false)

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
const modeForm = reactive({
    strictLegacyRoutes: false,
    enforceLicenseSignature: false
})

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
 * 读取商业版模式配置
 */
const loadCommercialMode = async () => {
    const data = await uiedCommercialModeGet()
    modeForm.strictLegacyRoutes = data?.strictLegacyRoutes === true
    modeForm.enforceLicenseSignature = data?.enforceLicenseSignature === true
}

/**
 * 跳转到功能开关页面
 */
const goFeaturePage = () => {
    router.push('/uied/feature-toggle')
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
 * 保存商业版模式配置
 */
const handleSaveMode = async () => {
    modeSaving.value = true
    try {
        await uiedCommercialModeSave({
            strictLegacyRoutes: modeForm.strictLegacyRoutes,
            enforceLicenseSignature: modeForm.enforceLicenseSignature
        })
        feedback.msgSuccess('商业模式保存成功')
        await loadCommercialMode()
    } finally {
        modeSaving.value = false
    }
}

/**
 * 页面初始化加载
 */
const initializePage = async () => {
    await Promise.all([loadLicenseInfo(), loadCommercialMode()])
}

onMounted(() => {
    initializePage()
})
</script>
