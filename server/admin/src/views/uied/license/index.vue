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
import { uiedLicenseInfo, uiedSaveLicenseInfo } from '@/api/uied'

const router = useRouter()
const licenseSaving = ref(false)

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
 * 页面初始化加载
 */
const initializePage = async () => {
    await loadLicenseInfo()
}

onMounted(() => {
    initializePage()
})
</script>
