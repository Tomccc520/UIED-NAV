<!--
 * @file views/uied/setting/index.vue
 * @description UIED 站点设置管理
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
-->
<template>
    <div class="site-setting">
        <el-card class="!border-none" shadow="never">
            <el-tabs v-model="activeTab">
                <!-- 站点信息 -->
                <el-tab-pane label="站点信息" name="siteInfo">
                    <el-form ref="siteInfoFormRef" :model="siteInfoData" label-width="120px" style="max-width: 600px">
                        <el-form-item label="站点名称">
                            <el-input v-model="siteInfoData.siteName" placeholder="请输入站点名称" />
                        </el-form-item>
                        <el-form-item label="站点标题">
                            <el-input v-model="siteInfoData.siteTitle" placeholder="请输入站点标题" />
                        </el-form-item>
                        <el-form-item label="站点描述">
                            <el-input v-model="siteInfoData.siteDescription" type="textarea" :rows="3" placeholder="请输入站点描述" />
                        </el-form-item>
                        <el-form-item label="站点关键词">
                            <el-input v-model="siteInfoData.siteKeywords" placeholder="多个关键词用逗号分隔" />
                        </el-form-item>
                        <el-form-item label="Logo">
                            <el-input v-model="siteInfoData.logo" placeholder="Logo URL" />
                        </el-form-item>
                        <el-form-item label="Favicon">
                            <el-input v-model="siteInfoData.favicon" placeholder="Favicon URL" />
                        </el-form-item>
                        <el-form-item label="ICP备案号">
                            <el-input v-model="siteInfoData.icp" placeholder="请输入ICP备案号" />
                        </el-form-item>
                        <el-form-item label="版权信息">
                            <el-input v-model="siteInfoData.copyright" placeholder="请输入版权信息" />
                        </el-form-item>
                        <el-form-item label="联系邮箱">
                            <el-input v-model="siteInfoData.contactEmail" placeholder="请输入联系邮箱" />
                        </el-form-item>
                        <el-form-item label="统计代码">
                            <el-input v-model="siteInfoData.analyticsCode" type="textarea" :rows="4" placeholder="请输入统计代码" />
                        </el-form-item>
                        <el-form-item>
                            <el-button type="primary" :loading="siteInfoLoading" @click="handleSaveSiteInfo">保存</el-button>
                        </el-form-item>
                    </el-form>
                </el-tab-pane>

                <!-- 页面配置 -->
                <el-tab-pane label="页面配置" name="pageConfig">
                    <el-form ref="pageConfigFormRef" :model="pageConfigData" label-width="120px" style="max-width: 600px">
                        <el-form-item label="网站点击行为">
                            <el-select v-model="pageConfigData.websiteClickMode" style="width: 100%">
                                <el-option label="跳转详情页" value="detail" />
                                <el-option label="弹窗确认后跳转" value="direct" />
                            </el-select>
                            <div class="text-gray-400 text-xs mt-1">设置用户点击网站卡片时的行为</div>
                        </el-form-item>
                        <el-form-item label="每页显示数量">
                            <el-input-number v-model="pageConfigData.pageSize" :min="10" :max="100" />
                        </el-form-item>
                        <el-form-item>
                            <el-button type="primary" :loading="pageConfigLoading" @click="handleSavePageConfig">保存</el-button>
                        </el-form-item>
                    </el-form>
                </el-tab-pane>

                <!-- 跳转提醒 -->
                <el-tab-pane label="跳转提醒" name="exitModal">
                    <el-form ref="exitModalFormRef" :model="exitModalData" label-width="120px" style="max-width: 600px">
                        <el-form-item label="启用弹窗">
                            <el-switch v-model="exitModalData.enabled" />
                        </el-form-item>
                        <el-form-item label="弹窗标题">
                            <el-input v-model="exitModalData.title" placeholder="即将离开本站" />
                        </el-form-item>
                        <el-form-item label="弹窗描述">
                            <el-input v-model="exitModalData.description" type="textarea" :rows="2" placeholder="您即将访问外部网站，请注意安全" />
                        </el-form-item>
                        <el-form-item label="自动跳转">
                            <el-switch v-model="exitModalData.autoRedirect" />
                            <span class="text-gray-400 text-xs ml-2">倒计时结束后自动跳转</span>
                        </el-form-item>
                        <el-form-item label="倒计时(秒)">
                            <el-input-number v-model="exitModalData.countdown" :min="1" :max="30" />
                        </el-form-item>
                        <el-form-item>
                            <el-button type="primary" :loading="exitModalLoading" @click="handleSaveExitModal">保存</el-button>
                        </el-form-item>
                    </el-form>
                </el-tab-pane>
            </el-tabs>
        </el-card>
    </div>
</template>

<script lang="ts" setup name="uiedSetting">
import { uiedSiteInfo, uiedSaveSiteInfo, uiedSettingGet, uiedSettingSave } from '@/api/uied'
import feedback from '@/utils/feedback'

const activeTab = ref('siteInfo')

// 站点信息
const siteInfoLoading = ref(false)
const siteInfoData = reactive({
    siteName: '',
    siteTitle: '',
    siteDescription: '',
    siteKeywords: '',
    logo: '',
    favicon: '',
    icp: '',
    copyright: '',
    contactEmail: '',
    analyticsCode: '',
})

// 页面配置
const pageConfigLoading = ref(false)
const pageConfigData = reactive({
    websiteClickMode: 'detail',
    pageSize: 20,
})

// 跳转提醒配置
const exitModalLoading = ref(false)
const exitModalData = reactive({
    enabled: true,
    title: '即将离开本站',
    description: '您即将访问外部网站，请注意安全',
    autoRedirect: true,
    countdown: 5,
})

// 加载站点信息
const loadSiteInfo = async () => {
    try {
        const res = await uiedSiteInfo()
        if (res) {
            Object.assign(siteInfoData, res)
        }
    } catch (e) {
        console.error('加载站点信息失败', e)
    }
}

// 保存站点信息
const handleSaveSiteInfo = async () => {
    siteInfoLoading.value = true
    try {
        await uiedSaveSiteInfo(siteInfoData)
        feedback.msgSuccess('保存成功')
    } finally {
        siteInfoLoading.value = false
    }
}

// 加载页面配置
const loadPageConfig = async () => {
    try {
        const res = await uiedSettingGet({ key: 'pageGlobalConfig' })
        if (res) {
            Object.assign(pageConfigData, res)
        }
    } catch (e) {
        console.error('加载页面配置失败', e)
    }
}

// 保存页面配置
const handleSavePageConfig = async () => {
    pageConfigLoading.value = true
    try {
        await uiedSettingSave({ pageGlobalConfig: pageConfigData })
        feedback.msgSuccess('保存成功')
    } finally {
        pageConfigLoading.value = false
    }
}

// 加载跳转提醒配置
const loadExitModal = async () => {
    try {
        const res = await uiedSettingGet({ key: 'exitModalConfig' })
        if (res) {
            Object.assign(exitModalData, res)
        }
    } catch (e) {
        console.error('加载跳转提醒配置失败', e)
    }
}

// 保存跳转提醒配置
const handleSaveExitModal = async () => {
    exitModalLoading.value = true
    try {
        await uiedSettingSave({ exitModalConfig: exitModalData })
        feedback.msgSuccess('保存成功')
    } finally {
        exitModalLoading.value = false
    }
}

// 初始化
onMounted(() => {
    loadSiteInfo()
    loadPageConfig()
    loadExitModal()
})
</script>
