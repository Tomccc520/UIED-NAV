<!--
 * @file views/uied/setting/detailPage.vue
 * @description 网站详情页配置 - 控制详情页各区块的显示和内容
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.1.0
-->
<template>
    <div class="detail-page-setting">
        <el-card class="!border-none" shadow="never">
            <div class="setting-header">
                <h2 class="setting-title">网站详情页配置</h2>
                <p class="setting-desc">
                    配置前端「网站详情页」的各项功能和显示内容。修改后保存即可实时生效，无需重启服务。
                </p>
            </div>

            <el-form :model="config" label-width="160px" style="max-width: 700px">
                <!-- 区块显示控制 -->
                <el-divider content-position="left">区块显示控制</el-divider>
                <p class="section-desc">
                    控制详情页中各个功能区块是否显示。关闭后对应区块将在前端隐藏，不影响已有数据。
                </p>

                <el-form-item label="产品截图">
                    <el-switch v-model="config.screenshotsEnabled" />
                    <span class="form-tip"
                        >开启后，详情页将展示该网站的产品截图（需在网站编辑中上传截图）</span
                    >
                </el-form-item>

                <el-form-item label="评分功能">
                    <el-switch v-model="config.ratingsEnabled" />
                    <span class="form-tip"
                        >开启后，用户可以对网站进行 1-5 星评分，评分结果将展示在详情页</span
                    >
                </el-form-item>

                <el-form-item label="评论功能">
                    <el-switch v-model="config.commentsEnabled" />
                    <span class="form-tip"
                        >开启后，用户可以在详情页发表评论。评论需在「评论管理」中审核</span
                    >
                </el-form-item>

                <el-form-item label="分享按钮">
                    <el-switch v-model="config.sharingEnabled" />
                    <span class="form-tip"
                        >开启后，详情页底部将显示社交分享按钮（微信、微博、QQ 等）</span
                    >
                </el-form-item>

                <el-form-item label="收藏按钮">
                    <el-switch v-model="config.favoritesEnabled" />
                    <span class="form-tip">开启后，用户可以收藏网站到个人收藏夹（需用户登录）</span>
                </el-form-item>

                <el-form-item label="相关推荐">
                    <el-switch v-model="config.relatedEnabled" />
                    <span class="form-tip">开启后，详情页底部将自动展示同分类下的相关网站推荐</span>
                </el-form-item>

                <el-form-item label="标签显示">
                    <el-switch v-model="config.tagsEnabled" />
                    <span class="form-tip"
                        >开启后，详情页将展示该网站关联的标签，方便用户了解网站特征</span
                    >
                </el-form-item>

                <!-- 直达按钮 -->
                <el-divider content-position="left">直达按钮</el-divider>
                <p class="section-desc">
                    控制详情页头部区域的「直达网站」箭头按钮。点击后将在新窗口打开目标网站。
                </p>

                <el-form-item label="显示直达箭头">
                    <el-switch v-model="config.visitArrowEnabled" />
                    <span class="form-tip"
                        >开启后，网站名称右侧将显示一个箭头图标，点击可直接跳转到目标网站</span
                    >
                </el-form-item>

                <el-form-item label="箭头提示文字">
                    <el-input
                        v-model="config.visitArrowText"
                        placeholder="鼠标悬停时显示的提示文字"
                        :disabled="!config.visitArrowEnabled"
                    />
                    <span class="form-tip"
                        >鼠标悬停在箭头上时显示的提示文字，默认为「直达网站」</span
                    >
                </el-form-item>

                <!-- 版权信息 -->
                <el-divider content-position="left">版权信息</el-divider>
                <p class="section-desc">在详情页底部展示版权声明，可用于标注内容来源或版权归属。</p>

                <el-form-item label="启用版权信息">
                    <el-switch v-model="config.copyrightEnabled" />
                    <span class="form-tip">开启后，详情页底部将显示版权声明文字</span>
                </el-form-item>

                <el-form-item label="版权文字">
                    <el-input
                        v-model="config.copyrightText"
                        placeholder="例如：版权归原作者所有"
                        :disabled="!config.copyrightEnabled"
                    />
                    <span class="form-tip">显示在详情页底部的版权声明内容</span>
                </el-form-item>

                <el-form-item label="版权链接">
                    <el-input
                        v-model="config.copyrightLink"
                        placeholder="例如：https://example.com（可选，留空则不可点击）"
                        :disabled="!config.copyrightEnabled"
                    />
                    <span class="form-tip"
                        >点击版权文字后跳转的链接地址，留空则版权文字不可点击</span
                    >
                </el-form-item>

                <!-- 免责声明 -->
                <el-divider content-position="left">免责声明</el-divider>
                <p class="section-desc">在详情页底部展示免责声明，建议开启以规避法律风险。</p>

                <el-form-item label="启用免责声明">
                    <el-switch v-model="config.disclaimerEnabled" />
                    <span class="form-tip">开启后，详情页底部将显示免责声明文字</span>
                </el-form-item>

                <el-form-item label="免责声明文字">
                    <el-input
                        v-model="config.disclaimerText"
                        type="textarea"
                        :rows="3"
                        placeholder="例如：本站仅收录和推荐，不对第三方网站内容负责。"
                        :disabled="!config.disclaimerEnabled"
                    />
                    <span class="form-tip">免责声明的具体内容，建议说明本站与收录网站的关系</span>
                </el-form-item>

                <!-- 举报功能 -->
                <el-divider content-position="left">举报功能</el-divider>
                <p class="section-desc">允许用户举报问题网站，举报信息将发送到指定邮箱。</p>

                <el-form-item label="启用举报功能">
                    <el-switch v-model="config.reportEnabled" />
                    <span class="form-tip">开启后，详情页底部将显示举报按钮</span>
                </el-form-item>

                <el-form-item label="举报提示文字">
                    <el-input
                        v-model="config.reportText"
                        placeholder="例如：如发现违规内容，请发送邮件举报"
                        :disabled="!config.reportEnabled"
                    />
                    <span class="form-tip">举报按钮上显示的文字</span>
                </el-form-item>

                <el-form-item label="举报邮箱">
                    <el-input
                        v-model="config.reportEmail"
                        placeholder="例如：report@example.com"
                        :disabled="!config.reportEnabled"
                    />
                    <span class="form-tip"
                        >接收举报邮件的邮箱地址，用户点击举报后将自动打开邮件客户端</span
                    >
                </el-form-item>

                <!-- 访问按钮 -->
                <el-divider content-position="left">访问按钮</el-divider>
                <p class="section-desc">
                    详情页正文下方的大号访问按钮，点击后跳转到目标网站。直达箭头和访问按钮均受此配置控制。
                </p>

                <el-form-item label="新窗口打开">
                    <el-switch v-model="config.visitBtnNewWindow" />
                    <span class="form-tip"
                        >开启后，点击「访问网站」按钮和直达箭头时将在浏览器新标签页中打开目标网站；关闭则在当前页面跳转</span
                    >
                </el-form-item>

                <el-form-item label="按钮文字">
                    <el-input
                        v-model="config.visitBtnText"
                        placeholder="例如：访问网站、立即体验、前往官网"
                    />
                    <span class="form-tip">访问按钮上显示的文字，默认为「访问网站」</span>
                </el-form-item>

                <!-- 保存按钮 -->
                <el-form-item>
                    <el-button type="primary" :loading="saving" @click="handleSave"
                        >保存配置</el-button
                    >
                </el-form-item>
            </el-form>
        </el-card>
    </div>
</template>

<script setup lang="ts">
/**
 * @file views/uied/setting/detailPage.vue
 * @description 网站详情页配置 - 控制详情页各区块的显示和内容
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.1.0
 */
import { ref, reactive, onMounted } from 'vue'
import { uiedSettingGet, uiedSettingSave } from '@/api/uied'
import feedback from '@/utils/feedback'

// 默认配置
const defaultConfig = {
    // 区块显示控制
    screenshotsEnabled: true,
    ratingsEnabled: true,
    commentsEnabled: true,
    sharingEnabled: true,
    favoritesEnabled: true,
    relatedEnabled: true,
    tagsEnabled: true,
    // 直达按钮
    visitArrowEnabled: true,
    visitArrowText: '直达网站',
    // 版权信息
    copyrightEnabled: true,
    copyrightText: '版权归原作者所有',
    copyrightLink: '',
    // 免责声明
    disclaimerEnabled: true,
    disclaimerText: '本站仅收录和推荐，不对第三方网站内容负责。',
    // 举报功能
    reportEnabled: true,
    reportText: '如发现违规内容，请发送邮件举报',
    reportEmail: '',
    // 访问按钮
    visitBtnText: '访问网站',
    visitBtnNewWindow: true
}

const saving = ref(false)
const config = reactive({ ...defaultConfig })

// 加载配置
const loadConfig = async () => {
    try {
        const res = await uiedSettingGet({ key: 'detailPageConfig' })
        if (res) {
            Object.assign(config, res)
        }
    } catch (e) {
        console.error('加载详情页配置失败:', e)
    }
}

// 保存配置
const handleSave = async () => {
    saving.value = true
    try {
        await uiedSettingSave({ detailPageConfig: config })
        feedback.msgSuccess('保存成功')
    } catch (e) {
        console.error('保存详情页配置失败:', e)
        feedback.msgError('保存失败')
    } finally {
        saving.value = false
    }
}

onMounted(() => {
    loadConfig()
})
</script>

<style scoped>
.form-tip {
    color: #909399;
    font-size: 12px;
    margin-left: 12px;
    line-height: 1.5;
}
.section-desc {
    color: #909399;
    font-size: 13px;
    margin: -8px 0 16px 0;
    padding-left: 2px;
    line-height: 1.6;
}

/* 设置页面头部样式 */
.setting-header {
    margin-bottom: 24px;
    padding-bottom: 16px;
    border-bottom: 1px solid #e4e7ed;
}
.setting-title {
    font-size: 18px;
    font-weight: 600;
    color: #303133;
    margin: 0 0 8px 0;
}
.setting-desc {
    font-size: 14px;
    color: #606266;
    margin: 0;
    line-height: 1.6;
}

/* 优化：问号提示图标样式 */
.label-tip-icon {
    margin-left: 6px;
    cursor: help;
    color: #c0c4cc;
    font-size: 15px;
    vertical-align: -2px;
    transition: all 0.2s ease;
    opacity: 0.7;
}
.label-tip-icon:hover {
    color: #409eff;
    opacity: 1;
    transform: scale(1.1);
}
</style>
