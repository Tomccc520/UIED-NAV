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
                    <el-alert type="info" :closable="false" style="margin-bottom: 20px">
                        <template #title>配置网站的基本信息，包括名称、SEO、备案等。修改后保存即可生效。</template>
                    </el-alert>
                    <el-form ref="siteInfoFormRef" :model="siteInfoData" label-width="120px" style="max-width: 600px">
                        <el-form-item>
                            <template #label>
                                <span>站点名称</span>
                                <el-tooltip content="显示在浏览器标签页和页面顶部的网站名称" placement="top">
                                    <el-icon style="margin-left: 4px; cursor: help; color: #909399;"><QuestionFilled /></el-icon>
                                </el-tooltip>
                            </template>
                            <el-input v-model="siteInfoData.siteName" placeholder="请输入站点名称" />
                        </el-form-item>
                        <el-form-item>
                            <template #label>
                                <span>站点标题</span>
                                <el-tooltip content="用于SEO的页面标题，显示在搜索引擎结果中，建议30字以内" placement="top">
                                    <el-icon style="margin-left: 4px; cursor: help; color: #909399;"><QuestionFilled /></el-icon>
                                </el-tooltip>
                            </template>
                            <el-input v-model="siteInfoData.siteTitle" placeholder="请输入站点标题" />
                        </el-form-item>
                        <el-form-item>
                            <template #label>
                                <span>站点描述</span>
                                <el-tooltip content="用于SEO的页面描述，显示在搜索引擎结果中，建议120字以内" placement="top">
                                    <el-icon style="margin-left: 4px; cursor: help; color: #909399;"><QuestionFilled /></el-icon>
                                </el-tooltip>
                            </template>
                            <el-input v-model="siteInfoData.siteDescription" type="textarea" :rows="3" placeholder="请输入站点描述" />
                        </el-form-item>
                        <el-form-item>
                            <template #label>
                                <span>站点关键词</span>
                                <el-tooltip content="用于SEO的关键词，多个关键词用英文逗号分隔" placement="top">
                                    <el-icon style="margin-left: 4px; cursor: help; color: #909399;"><QuestionFilled /></el-icon>
                                </el-tooltip>
                            </template>
                            <el-input v-model="siteInfoData.siteKeywords" placeholder="多个关键词用逗号分隔" />
                        </el-form-item>
                        <el-form-item>
                            <template #label>
                                <span>Logo</span>
                                <el-tooltip content="网站Logo图片地址，支持PNG/SVG格式，建议尺寸200x50" placement="top">
                                    <el-icon style="margin-left: 4px; cursor: help; color: #909399;"><QuestionFilled /></el-icon>
                                </el-tooltip>
                            </template>
                            <el-input v-model="siteInfoData.logo" placeholder="Logo URL" />
                        </el-form-item>
                        <el-form-item>
                            <template #label>
                                <span>Favicon</span>
                                <el-tooltip content="浏览器标签页上的小图标，支持ICO/PNG格式，建议32x32" placement="top">
                                    <el-icon style="margin-left: 4px; cursor: help; color: #909399;"><QuestionFilled /></el-icon>
                                </el-tooltip>
                            </template>
                            <el-input v-model="siteInfoData.favicon" placeholder="Favicon URL" />
                        </el-form-item>
                        <el-form-item>
                            <template #label>
                                <span>ICP备案号</span>
                                <el-tooltip content="网站ICP备案号，显示在页面底部，如：京ICP备XXXXXXXX号" placement="top">
                                    <el-icon style="margin-left: 4px; cursor: help; color: #909399;"><QuestionFilled /></el-icon>
                                </el-tooltip>
                            </template>
                            <el-input v-model="siteInfoData.icp" placeholder="请输入ICP备案号" />
                        </el-form-item>
                        <el-form-item>
                            <template #label>
                                <span>版权信息</span>
                                <el-tooltip content="显示在页面底部的版权声明文字" placement="top">
                                    <el-icon style="margin-left: 4px; cursor: help; color: #909399;"><QuestionFilled /></el-icon>
                                </el-tooltip>
                            </template>
                            <el-input v-model="siteInfoData.copyright" placeholder="请输入版权信息" />
                        </el-form-item>
                        <el-form-item>
                            <template #label>
                                <span>联系邮箱</span>
                                <el-tooltip content="用于接收用户反馈和举报的邮箱地址" placement="top">
                                    <el-icon style="margin-left: 4px; cursor: help; color: #909399;"><QuestionFilled /></el-icon>
                                </el-tooltip>
                            </template>
                            <el-input v-model="siteInfoData.contactEmail" placeholder="请输入联系邮箱" />
                        </el-form-item>
                        <el-form-item>
                            <template #label>
                                <span>统计代码</span>
                                <el-tooltip content="第三方统计代码（如百度统计、Google Analytics），将插入到页面底部" placement="top">
                                    <el-icon style="margin-left: 4px; cursor: help; color: #909399;"><QuestionFilled /></el-icon>
                                </el-tooltip>
                            </template>
                            <el-input v-model="siteInfoData.analyticsCode" type="textarea" :rows="4" placeholder="请输入统计代码" />
                        </el-form-item>
                        <el-form-item>
                            <el-button type="primary" :loading="siteInfoLoading" @click="handleSaveSiteInfo">保存</el-button>
                        </el-form-item>
                    </el-form>
                </el-tab-pane>

                <!-- 页面配置 -->
                <el-tab-pane label="页面配置" name="pageConfig">
                    <el-alert type="info" :closable="false" style="margin-bottom: 20px">
                        <template #title>控制前端网站卡片的点击行为、直达箭头、窗口打开方式等全局页面交互配置。</template>
                    </el-alert>
                    <el-form ref="pageConfigFormRef" :model="pageConfigData" label-width="140px" style="max-width: 650px">
                        <el-divider content-position="left">点击行为</el-divider>

                        <el-form-item>
                            <template #label>
                                <span>网站点击行为</span>
                                <el-tooltip placement="top">
                                    <template #content>
                                        设置用户点击网站卡片时的行为：<br/>
                                        「跳转详情页」- 进入网站介绍页面<br/>
                                        「弹窗确认后跳转」- 弹窗提示后跳转外部网站<br/>
                                        「直达网站」- 直接打开外部网站
                                    </template>
                                    <el-icon style="margin-left: 4px; cursor: help; color: #909399;"><QuestionFilled /></el-icon>
                                </el-tooltip>
                            </template>
                            <el-select v-model="pageConfigData.websiteClickMode" style="width: 100%">
                                <el-option label="跳转详情页" value="detail" />
                                <el-option label="弹窗确认后跳转" value="direct" />
                                <el-option label="直达网站" value="directExternal" />
                            </el-select>
                        </el-form-item>

                        <el-divider content-position="left">直达箭头</el-divider>

                        <el-form-item>
                            <template #label>
                                <span>卡片直达箭头</span>
                                <el-tooltip placement="top">
                                    <template #content>
                                        开启后，网站卡片右侧显示快捷按钮（鼠标移入时出现）。<br/>
                                        点击行为为「详情页/弹窗」时，箭头为"直达网站"。<br/>
                                        点击行为为「直达网站」时，箭头为"查看详情"。
                                    </template>
                                    <el-icon style="margin-left: 4px; cursor: help; color: #909399;"><QuestionFilled /></el-icon>
                                </el-tooltip>
                            </template>
                            <el-switch v-model="pageConfigData.showDirectArrow" />
                        </el-form-item>

                        <el-form-item>
                            <template #label>
                                <span>箭头新窗口打开</span>
                                <el-tooltip content="开启后，点击直达箭头时在浏览器新标签页中打开目标页面" placement="top">
                                    <el-icon style="margin-left: 4px; cursor: help; color: #909399;"><QuestionFilled /></el-icon>
                                </el-tooltip>
                            </template>
                            <el-switch v-model="pageConfigData.directArrowNewWindow" />
                        </el-form-item>

                        <el-divider content-position="left">窗口行为</el-divider>

                        <el-form-item>
                            <template #label>
                                <span>详情页新窗口</span>
                                <el-tooltip content="开启后，点击卡片进入详情页时在新标签页打开。仅在点击行为为「跳转详情页」时生效" placement="top">
                                    <el-icon style="margin-left: 4px; cursor: help; color: #909399;"><QuestionFilled /></el-icon>
                                </el-tooltip>
                            </template>
                            <el-switch v-model="pageConfigData.detailPageNewWindow" />
                        </el-form-item>

                        <el-divider content-position="left">分页</el-divider>

                        <el-form-item>
                            <template #label>
                                <span>每页显示数量</span>
                                <el-tooltip content="每页显示的网站数量，建议20-50之间，数值过大可能影响加载速度" placement="top">
                                    <el-icon style="margin-left: 4px; cursor: help; color: #909399;"><QuestionFilled /></el-icon>
                                </el-tooltip>
                            </template>
                            <el-input-number v-model="pageConfigData.pageSize" :min="10" :max="100" />
                        </el-form-item>

                        <el-form-item>
                            <el-button type="primary" :loading="pageConfigLoading" @click="handleSavePageConfig">保存</el-button>
                        </el-form-item>
                    </el-form>
                </el-tab-pane>

                <!-- 跳转提醒 -->
                <el-tab-pane label="跳转提醒" name="exitModal">
                    <el-alert type="info" :closable="false" style="margin-bottom: 20px">
                        <template #title>配置用户点击外部链接时的跳转确认弹窗。仅在点击行为为「弹窗确认后跳转」时生效。</template>
                    </el-alert>
                    <el-form ref="exitModalFormRef" :model="exitModalData" label-width="120px" style="max-width: 600px">
                        <el-form-item>
                            <template #label>
                                <span>启用弹窗</span>
                                <el-tooltip content="开启后，用户点击外部链接时会弹出确认提示窗口" placement="top">
                                    <el-icon style="margin-left: 4px; cursor: help; color: #909399;"><QuestionFilled /></el-icon>
                                </el-tooltip>
                            </template>
                            <el-switch v-model="exitModalData.enabled" />
                        </el-form-item>
                        <el-form-item>
                            <template #label>
                                <span>弹窗标题</span>
                                <el-tooltip content="弹窗顶部显示的标题文字" placement="top">
                                    <el-icon style="margin-left: 4px; cursor: help; color: #909399;"><QuestionFilled /></el-icon>
                                </el-tooltip>
                            </template>
                            <el-input v-model="exitModalData.title" placeholder="即将离开本站" />
                        </el-form-item>
                        <el-form-item>
                            <template #label>
                                <span>弹窗描述</span>
                                <el-tooltip content="弹窗中显示的提示说明文字" placement="top">
                                    <el-icon style="margin-left: 4px; cursor: help; color: #909399;"><QuestionFilled /></el-icon>
                                </el-tooltip>
                            </template>
                            <el-input v-model="exitModalData.description" type="textarea" :rows="2" placeholder="您即将访问外部网站，请注意安全" />
                        </el-form-item>
                        <el-form-item>
                            <template #label>
                                <span>自动跳转</span>
                                <el-tooltip content="开启后，倒计时结束将自动跳转到目标网站，无需用户手动点击" placement="top">
                                    <el-icon style="margin-left: 4px; cursor: help; color: #909399;"><QuestionFilled /></el-icon>
                                </el-tooltip>
                            </template>
                            <el-switch v-model="exitModalData.autoRedirect" />
                        </el-form-item>
                        <el-form-item>
                            <template #label>
                                <span>倒计时(秒)</span>
                                <el-tooltip content="自动跳转前的等待秒数，建议3-10秒" placement="top">
                                    <el-icon style="margin-left: 4px; cursor: help; color: #909399;"><QuestionFilled /></el-icon>
                                </el-tooltip>
                            </template>
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
import { QuestionFilled } from '@element-plus/icons-vue'
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
    showDirectArrow: false,
    detailPageNewWindow: false,
    directArrowNewWindow: true,
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
