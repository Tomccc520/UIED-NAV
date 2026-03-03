<!--
/**
 * @copyright Tomda (https://www.tomda.top)
 * @copyright UIED技术团队 (https://fsuied.com)
 * @author UIED技术团队
 * @createDate 2026-03-02
 */
-->
<template>
    <div class="setting-backup-page">
        <el-card class="!border-none" shadow="never">
            <div class="setting-backup-header">
                <div>
                    <h2 class="setting-backup-title">设置备份</h2>
                    <p class="setting-backup-desc">
                        导出/导入后台配置快照，适用于环境迁移、灰度回滚与运维备份。
                    </p>
                </div>
                <div class="setting-backup-actions">
                    <el-button
                        type="primary"
                        :loading="exportLoading"
                        @click="handleExportSettingBackup"
                    >
                        导出备份
                    </el-button>
                    <el-button :loading="importLoading" @click="handleTriggerImportSettingBackup">
                        导入备份
                    </el-button>
                </div>
                <input
                    ref="settingBackupInputRef"
                    class="setting-backup-input"
                    type="file"
                    accept=".json,application/json"
                    @change="handleSettingBackupFileChange"
                />
            </div>
        </el-card>

        <el-card class="!border-none mt-4" shadow="never">
            <el-alert
                type="warning"
                show-icon
                :closable="false"
                title="导入会覆盖备份中的同名配置（含站点信息与登录配置），建议先导出现网备份再执行导入。"
            />

            <div class="setting-backup-meta">
                <div class="setting-backup-meta__row">
                    <span class="label">最近导出：</span>
                    <span>{{ lastExportAtText }}</span>
                </div>
                <div class="setting-backup-meta__row">
                    <span class="label">最近导入：</span>
                    <span>{{ lastImportAtText }}</span>
                </div>
                <div class="setting-backup-meta__row" v-if="lastImportSummary">
                    <span class="label">最近导入结果：</span>
                    <span>{{ lastImportSummary }}</span>
                </div>
            </div>
        </el-card>
    </div>
</template>

<script setup lang="ts" name="settingBackup">
/**
 * @copyright Tomda (https://www.tomda.top)
 * @copyright UIED技术团队 (https://fsuied.com)
 * @author UIED技术团队
 * @createDate 2026-03-02
 */
import { uiedSettingBackupExport, uiedSettingBackupImport } from '@/api/uied'
import feedback from '@/utils/feedback'

const exportLoading = ref(false)
const importLoading = ref(false)
const settingBackupInputRef = ref<HTMLInputElement | null>(null)
const lastExportAt = ref<number | null>(null)
const lastImportAt = ref<number | null>(null)
const lastImportSummary = ref('')

const lastExportAtText = computed(() =>
    lastExportAt.value ? new Date(lastExportAt.value).toLocaleString() : '暂无'
)
const lastImportAtText = computed(() =>
    lastImportAt.value ? new Date(lastImportAt.value).toLocaleString() : '暂无'
)

/**
 * 生成设置备份文件名
 */
const buildSettingBackupFilename = () => {
    const now = new Date()
    const pad = (value: number) => String(value).padStart(2, '0')
    const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(
        now.getHours()
    )}${pad(now.getMinutes())}${pad(now.getSeconds())}`
    return `uied_setting_backup_${stamp}.json`
}

/**
 * 下载 JSON 文本文件
 */
const downloadJsonFile = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'application/json;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
}

/**
 * 判断是否为用户取消类错误
 */
const isUserCancelError = (error: any) => {
    const text = String(error?.message || error || '')
    return /cancel|取消|close/i.test(text)
}

/**
 * 导出后台设置备份
 */
const handleExportSettingBackup = async () => {
    exportLoading.value = true
    try {
        const backup = await uiedSettingBackupExport()
        const content = JSON.stringify(backup || {}, null, 2)
        downloadJsonFile(buildSettingBackupFilename(), content)
        lastExportAt.value = Date.now()
        feedback.msgSuccess('设置备份导出成功')
    } catch (error) {
        console.error('导出设置备份失败:', error)
        feedback.msgError('导出设置备份失败')
    } finally {
        exportLoading.value = false
    }
}

/**
 * 触发本地备份文件选择
 */
const handleTriggerImportSettingBackup = () => {
    if (importLoading.value) return
    settingBackupInputRef.value?.click()
}

/**
 * 解析本地 JSON 备份文件
 */
const parseBackupFile = async (file: File) => {
    const raw = await file.text()
    if (!raw.trim()) throw new Error('备份文件为空')
    let parsed: any = null
    try {
        parsed = JSON.parse(raw)
    } catch (error) {
        throw new Error('备份文件不是有效 JSON')
    }
    if (!parsed || typeof parsed !== 'object') {
        throw new Error('备份文件格式错误')
    }
    return parsed
}

/**
 * 处理备份文件导入
 */
const handleSettingBackupFileChange = async (event: Event) => {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    input.value = ''
    if (!file) return

    try {
        const payload = await parseBackupFile(file)
        await feedback.confirm('导入后将覆盖备份中同名配置（含站点信息/登录配置），是否继续导入？')
        importLoading.value = true
        const result: any = await uiedSettingBackupImport({
            payload,
            applySiteInfo: true,
            applyAuthConfig: true
        })
        const count = Number(result?.importedSettingsCount || 0)
        lastImportAt.value = Date.now()
        lastImportSummary.value = `导入配置 ${count} 项`
        feedback.msgSuccess(`导入成功：配置${count}项`)
    } catch (error) {
        if (!isUserCancelError(error)) {
            console.error('导入设置备份失败:', error)
            const message = error instanceof Error ? error.message : ''
            feedback.msgError(message || '导入设置备份失败')
        }
    } finally {
        importLoading.value = false
    }
}
</script>

<style lang="scss" scoped>
.setting-backup-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
}

.setting-backup-title {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: #303133;
}

.setting-backup-desc {
    margin: 8px 0 0;
    font-size: 13px;
    line-height: 1.6;
    color: #606266;
}

.setting-backup-actions {
    display: flex;
    align-items: center;
    gap: 8px;
}

.setting-backup-meta {
    margin-top: 14px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    font-size: 13px;
    color: #606266;
}

.setting-backup-meta__row .label {
    color: #909399;
    margin-right: 6px;
}

.setting-backup-input {
    display: none;
}

@media (max-width: 900px) {
    .setting-backup-header {
        flex-direction: column;
        align-items: stretch;
    }
}
</style>
