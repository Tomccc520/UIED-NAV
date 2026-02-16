<!--
 * @file views/uied/website/edit.vue
 * @description UIED 网站编辑页面 - 独立页面模式，AI 辅助编辑器
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 2.0.0
-->
<template>
    <div class="website-edit" v-loading="pageLoading">
        <el-card class="!border-none" shadow="never">
            <template #header>
                <div class="flex items-center justify-between">
                    <span class="text-lg font-medium">{{ isEdit ? '编辑网站' : '添加网站' }}</span>
                    <el-button @click="handleBack">
                        <icon name="el-icon-ArrowLeft" />
                        返回列表
                    </el-button>
                </div>
            </template>

            <el-tabs v-model="activeTab" class="website-edit-tabs">
                <!-- 基础信息 -->
                <el-tab-pane label="基础信息" name="basic">
                    <el-form
                        ref="editFormRef"
                        :model="editData"
                        :rules="editRules"
                        label-width="100px"
                        style="max-width: 800px"
                    >
                        <el-form-item label="网站名称" prop="name">
                            <el-input v-model="editData.name" placeholder="请输入网站名称" />
                        </el-form-item>
                        <el-form-item label="固定链接">
                            <el-input
                                v-model="editData.slug"
                                placeholder="留空自动生成，用于详情页URL"
                            >
                                <template #prepend>/website/</template>
                            </el-input>
                        </el-form-item>
                        <el-form-item label="网站URL" prop="url">
                            <el-input v-model="editData.url" placeholder="请输入网站URL" />
                        </el-form-item>
                        <el-form-item label="所属分类" prop="categoryId">
                            <el-select
                                v-model="editData.categoryId"
                                placeholder="请选择分类"
                                style="width: 100%"
                            >
                                <el-option
                                    v-for="item in categoryList"
                                    :key="item.id"
                                    :label="item.name"
                                    :value="item.id"
                                />
                            </el-select>
                        </el-form-item>
                        <el-form-item label="网站描述">
                            <el-input
                                v-model="editData.description"
                                type="textarea"
                                :rows="3"
                                placeholder="请输入网站描述"
                            />
                        </el-form-item>
                        <el-form-item label="图标URL">
                            <div class="flex gap-2" style="width: 100%">
                                <el-input
                                    v-model="editData.iconUrl"
                                    placeholder="请输入图标URL"
                                    clearable
                                />
                                <el-button :loading="fetchingIcon" @click="handleFetchIcon"
                                    >获取图标</el-button
                                >
                            </div>
                        </el-form-item>
                        <el-form-item label="标签">
                            <el-select
                                v-model="editData.tags"
                                multiple
                                filterable
                                allow-create
                                default-first-option
                                placeholder="输入标签后回车添加"
                                style="width: 100%"
                            />
                        </el-form-item>
                        <el-row :gutter="16">
                            <el-col :span="8">
                                <el-form-item label="排序">
                                    <el-input-number
                                        v-model="editData.sortOrder"
                                        :min="0"
                                        :max="9999"
                                        style="width: 100%"
                                    />
                                </el-form-item>
                            </el-col>
                            <el-col :span="8">
                                <el-form-item label="状态">
                                    <el-switch
                                        v-model="editData.isActive"
                                        :active-value="1"
                                        :inactive-value="0"
                                    />
                                </el-form-item>
                            </el-col>
                            <el-col :span="8">
                                <el-form-item label="置顶">
                                    <el-switch
                                        v-model="editData.isPinned"
                                        :active-value="1"
                                        :inactive-value="0"
                                    />
                                </el-form-item>
                            </el-col>
                        </el-row>
                    </el-form>
                </el-tab-pane>

                <!-- 详情页内容 -->
                <el-tab-pane label="详情页" name="detail">
                    <el-form :model="editData" label-width="100px">
                        <el-form-item label="访问按钮">
                            <el-input
                                v-model="editData.visitBtnText"
                                placeholder="默认：访问网站"
                                style="max-width: 400px"
                            />
                        </el-form-item>
                    </el-form>

                    <el-divider content-position="left">缩略图</el-divider>
                    <el-form :model="editData" label-width="100px" style="max-width: 900px">
                        <el-form-item>
                            <template #label>
                                <span>缩略图</span>
                                <el-tooltip
                                    content="网站预览缩略图，支持从素材中心选择或输入URL"
                                    placement="top"
                                >
                                    <el-icon style="margin-left: 4px; cursor: help; color: #909399"
                                        ><QuestionFilled
                                    /></el-icon>
                                </el-tooltip>
                            </template>
                            <div style="width: 100%">
                                <div class="flex gap-2 mb-2">
                                    <el-input
                                        v-model="editData.thumbnail"
                                        placeholder="输入缩略图URL或从素材中心选择"
                                        clearable
                                    />
                                    <el-button @click="openThumbnailPicker">
                                        <el-icon class="mr-1"><FolderOpened /></el-icon>
                                        素材中心
                                    </el-button>
                                    <el-button
                                        @click="handleCaptureThumbnail"
                                        :loading="capturingThumbnail"
                                    >
                                        截图获取
                                    </el-button>
                                </div>
                                <div v-if="editData.thumbnail" class="mt-2">
                                    <el-image
                                        :src="editData.thumbnail"
                                        style="
                                            max-width: 320px;
                                            max-height: 200px;
                                            border-radius: 4px;
                                            border: 1px solid #eee;
                                        "
                                        fit="contain"
                                        :preview-src-list="[editData.thumbnail]"
                                    />
                                </div>
                            </div>
                        </el-form-item>
                    </el-form>

                    <el-divider content-position="left">详情内容（AI 辅助编辑）</el-divider>
                    <!-- AI 编辑器布局：左编辑器 + 右AI助手 -->
                    <div class="ai-editor-layout">
                        <div class="ai-editor-layout__main">
                            <editor v-model="editData.detailContent" :height="560" mode="default" />
                        </div>
                        <aside class="ai-editor-layout__sidebar">
                            <div class="ai-chat">
                                <div class="ai-chat__header">
                                    <div>
                                        <div class="ai-chat__title">AI 写作助手</div>
                                        <div class="ai-chat__sub-title">
                                            对话式创作，输出可直接落稿
                                        </div>
                                    </div>
                                    <el-tag size="small" type="success">对话模式</el-tag>
                                </div>
                                <div class="ai-chat__shortcut">
                                    <el-button
                                        type="primary"
                                        plain
                                        size="small"
                                        :loading="aiGenerating"
                                        @click="handleAiGenerate('replace')"
                                    >
                                        生成正文
                                    </el-button>
                                    <el-button
                                        type="success"
                                        plain
                                        size="small"
                                        :loading="aiGenerating"
                                        @click="handleAiGenerate('append')"
                                    >
                                        续写正文
                                    </el-button>
                                    <el-button
                                        type="warning"
                                        size="small"
                                        :loading="aiGenerating"
                                        @click="handleAiGenerate('polish')"
                                    >
                                        润色正文
                                    </el-button>
                                </div>
                                <div class="ai-chat__messages" ref="chatMessagesRef">
                                    <template v-if="chatMessages.length">
                                        <div
                                            v-for="item in chatMessages"
                                            :key="item.id"
                                            class="ai-chat__message"
                                            :class="
                                                item.role === 'user'
                                                    ? 'ai-chat__message--user'
                                                    : 'ai-chat__message--assistant'
                                            "
                                        >
                                            <div class="ai-chat__message-role">
                                                {{ item.role === 'user' ? '我' : 'AI' }}
                                            </div>
                                            <div class="ai-chat__message-content">
                                                <span>{{ item.content }}</span>
                                                <span v-if="item.streaming" class="ai-chat__cursor"
                                                    >|</span
                                                >
                                            </div>
                                        </div>
                                    </template>
                                    <div v-else class="ai-chat__empty">
                                        输入指令开始对话，例如：帮我写一段产品介绍。
                                    </div>
                                </div>
                                <div class="ai-chat__composer">
                                    <el-input
                                        v-model="chatPrompt"
                                        type="textarea"
                                        :autosize="{ minRows: 2, maxRows: 5 }"
                                        resize="none"
                                        :disabled="aiGenerating"
                                        placeholder="输入你的写作诉求（Shift+Enter 换行）"
                                        @keydown="handleComposerKeydown"
                                    />
                                    <div class="ai-chat__composer-actions">
                                        <el-button
                                            type="primary"
                                            size="small"
                                            :loading="aiGenerating"
                                            @click="handleSendChatPrompt"
                                        >
                                            发送
                                        </el-button>
                                        <el-button
                                            size="small"
                                            :disabled="!chatMessages.length || aiGenerating"
                                            @click="clearChatMessages"
                                        >
                                            清空
                                        </el-button>
                                    </div>
                                </div>
                                <div class="ai-chat__apply-bar">
                                    <div class="ai-chat__apply-title">
                                        最近输出：{{ lastGenerateModeLabel }}
                                        <el-tag v-if="aiGenerating" size="small" type="warning"
                                            >生成中</el-tag
                                        >
                                    </div>
                                    <el-space wrap>
                                        <el-button
                                            size="small"
                                            type="primary"
                                            :disabled="!hasDraft || aiGenerating"
                                            @click="applyAiDraft('replace')"
                                        >
                                            替换全文
                                        </el-button>
                                        <el-button
                                            size="small"
                                            type="success"
                                            :disabled="!hasDraft || aiGenerating"
                                            @click="applyAiDraft('append')"
                                        >
                                            追加全文
                                        </el-button>
                                        <el-button
                                            size="small"
                                            :disabled="!hasDraft || aiGenerating"
                                            @click="copyAiDraft"
                                        >
                                            复制输出
                                        </el-button>
                                        <el-button
                                            size="small"
                                            :disabled="!hasDraft || aiGenerating"
                                            @click="clearAiDraft"
                                        >
                                            清空
                                        </el-button>
                                    </el-space>
                                </div>
                            </div>
                        </aside>
                    </div>

                    <el-divider content-position="left">产品截图</el-divider>
                    <el-form :model="editData" label-width="100px" style="max-width: 900px">
                        <el-form-item>
                            <template #label>
                                <span>产品截图</span>
                                <el-tooltip
                                    content="从素材中心选择产品截图，将在详情页展示为图片画廊"
                                    placement="top"
                                >
                                    <el-icon style="margin-left: 4px; cursor: help; color: #909399"
                                        ><QuestionFilled
                                    /></el-icon>
                                </el-tooltip>
                            </template>
                            <div style="width: 100%">
                                <material-picker
                                    v-model="screenshotList"
                                    type="image"
                                    :limit="20"
                                    size="120px"
                                />
                            </div>
                        </el-form-item>
                    </el-form>
                </el-tab-pane>

                <!-- SEO 设置 -->
                <el-tab-pane label="SEO" name="seo">
                    <el-form :model="editData" label-width="100px" style="max-width: 800px">
                        <el-form-item label="SEO 标题">
                            <el-input
                                v-model="editData.seoTitle"
                                placeholder="留空使用网站名称"
                                maxlength="100"
                                show-word-limit
                            />
                        </el-form-item>
                        <el-form-item label="SEO 描述">
                            <el-input
                                v-model="editData.seoDescription"
                                type="textarea"
                                :rows="3"
                                placeholder="留空使用网站描述"
                                maxlength="300"
                                show-word-limit
                            />
                        </el-form-item>
                        <el-form-item label="SEO 关键词">
                            <el-input
                                v-model="editData.seoKeywords"
                                placeholder="多个关键词用逗号分隔"
                                maxlength="200"
                                show-word-limit
                            />
                        </el-form-item>
                    </el-form>
                </el-tab-pane>
            </el-tabs>
        </el-card>

        <!-- 底部操作栏 -->
        <div class="website-edit-footer">
            <el-button @click="handleBack">取消</el-button>
            <el-button type="primary" :loading="submitLoading" @click="handleSubmit"
                >保存</el-button
            >
        </div>

        <!-- 缩略图素材选择器（隐藏触发器模式） -->
        <material-picker
            ref="thumbnailPickerRef"
            type="image"
            :limit="1"
            hidden-upload
            @change="handleThumbnailSelect"
        />
    </div>
</template>

<script lang="ts" setup name="uiedWebsiteEdit">
import {
    uiedWebsiteAdd,
    uiedWebsiteEdit,
    uiedWebsiteDetail,
    uiedCategoryAll,
    uiedAiGenerateDetailContent,
    uiedAiChat,
    uiedSeoScraperFetch
} from '@/api/uied'
import feedback from '@/utils/feedback'
import type { FormInstance, FormRules } from 'element-plus'
import { QuestionFilled, MagicStick, FolderOpened } from '@element-plus/icons-vue'
import editor from '@/components/editor/index.vue'
import MaterialPicker from '@/components/material/picker.vue'

type AiGenerateMode = 'replace' | 'append' | 'polish'
type ChatRole = 'user' | 'assistant'
interface ChatMessage {
    id: number
    role: ChatRole
    content: string
    streaming?: boolean
}

const route = useRoute()
const router = useRouter()

// 页面状态
const pageLoading = ref(false)
const submitLoading = ref(false)
const activeTab = ref('basic')
const editFormRef = ref<FormInstance>()
const isEdit = computed(() => !!route.query.id)

// 分类列表
const categoryList = ref<any[]>([])
const getCategoryList = async () => {
    try {
        const res = await uiedCategoryAll()
        categoryList.value = res || []
    } catch (error) {
        console.error('获取分类列表失败:', error)
    }
}

// 截图列表
const screenshotList = ref<string[]>([])

// 表单数据
const editData = reactive({
    id: 0,
    name: '',
    slug: '',
    url: '',
    categoryId: '' as string | number,
    description: '',
    iconUrl: '',
    tags: [] as string[],
    sortOrder: 0,
    isActive: 1,
    isPinned: 0,
    detailContent: '',
    visitBtnText: '',
    thumbnail: '',
    seoTitle: '',
    seoDescription: '',
    seoKeywords: ''
})

const editRules: FormRules = {
    name: [{ required: true, message: '请输入网站名称', trigger: 'blur' }],
    url: [{ required: true, message: '请输入网站URL', trigger: 'blur' }],
    categoryId: [{ required: true, message: '请选择分类', trigger: 'change' }]
}

// 加载网站详情
const loadDetail = async (id: string | number) => {
    pageLoading.value = true
    try {
        const data = await uiedWebsiteDetail({ id })
        if (!data) return
        editData.id = data.id
        editData.name = data.name || ''
        editData.slug = data.slug || ''
        editData.url = data.url || ''
        editData.categoryId = data.categoryId || data.category_id || null
        editData.description = data.description || ''
        editData.iconUrl = data.iconUrl || data.icon_url || ''
        editData.tags = Array.isArray(data.tags) ? data.tags : []
        editData.sortOrder = data.order || data.sortOrder || data.sort || 0
        editData.isActive = data.isActive || data.status !== 'disabled' ? 1 : 0
        editData.isPinned = data.isPinned ? 1 : 0
        editData.detailContent = data.detailContent || data.detail_content || ''
        editData.visitBtnText = data.visitBtnText || data.visit_btn_text || ''
        editData.thumbnail = data.thumbnail || ''
        editData.seoTitle = data.seoTitle || data.seo_title || ''
        editData.seoDescription = data.seoDescription || data.seo_description || ''
        editData.seoKeywords = data.seoKeywords || data.seo_keywords || ''
        const screenshots = data.screenshots || []
        screenshotList.value = Array.isArray(screenshots) ? [...screenshots] : []
    } catch (error) {
        console.error('获取网站详情失败:', error)
        feedback.msgError('获取网站详情失败')
    } finally {
        pageLoading.value = false
    }
}

// ==================== 缩略图 ====================
const thumbnailPickerRef = ref<InstanceType<typeof MaterialPicker>>()
const openThumbnailPicker = () => {
    thumbnailPickerRef.value?.showPopup(-1)
}
const handleThumbnailSelect = (urls: string | string[]) => {
    const url = Array.isArray(urls) ? urls[0] : urls
    if (url) editData.thumbnail = url
}
const capturingThumbnail = ref(false)
const handleCaptureThumbnail = async () => {
    if (!editData.url) {
        feedback.msgWarning('请先填写网站URL')
        return
    }
    capturingThumbnail.value = true
    try {
        editData.thumbnail = `https://image.thum.io/get/width/1280/crop/800/${editData.url}`
        feedback.msgSuccess('缩略图URL已生成')
    } finally {
        capturingThumbnail.value = false
    }
}

// ==================== 获取图标 ====================
const fetchingIcon = ref(false)
const handleFetchIcon = async () => {
    if (!editData.url) {
        feedback.msgWarning('请先填写网站URL')
        return
    }
    fetchingIcon.value = true
    try {
        const res = await uiedSeoScraperFetch({ url: editData.url })
        const favicon = res?.favicon || res?.data?.favicon
        if (favicon) {
            editData.iconUrl = favicon
            feedback.msgSuccess('图标获取成功')
        } else {
            feedback.msgWarning('未能获取到图标')
        }
    } catch (error: any) {
        feedback.msgError(error?.msg || error?.message || '获取图标失败')
    } finally {
        fetchingIcon.value = false
    }
}

// ==================== AI 对话助手 ====================
const aiGenerating = ref(false)
const aiDraftText = ref('')
const lastGenerateMode = ref<AiGenerateMode>('replace')
const chatPrompt = ref('')
const chatSeq = ref(0)
const chatMessages = ref<ChatMessage[]>([])
const chatMessagesRef = ref<HTMLDivElement | null>(null)
const streamTimer = ref<number | null>(null)

const hasDraft = computed(() => Boolean(aiDraftText.value.trim()))
const lastGenerateModeLabel = computed(() => {
    const map: Record<AiGenerateMode, string> = { replace: '生成', append: '续写', polish: '润色' }
    return map[lastGenerateMode.value] || '生成'
})

// 滚动到底部
const scrollChatToBottom = () => {
    nextTick(() => {
        if (chatMessagesRef.value)
            chatMessagesRef.value.scrollTop = chatMessagesRef.value.scrollHeight
    })
}

// 追加消息
const appendChatMessage = (role: ChatRole, content: string, streaming = false) => {
    chatSeq.value++
    const msg: ChatMessage = { id: chatSeq.value, role, content: content.trim(), streaming }
    chatMessages.value.push(msg)
    scrollChatToBottom()
    return msg
}

// 停止流式输出
const stopStream = () => {
    if (streamTimer.value !== null) {
        window.clearInterval(streamTimer.value)
        streamTimer.value = null
    }
    chatMessages.value.forEach((m) => {
        if (m.streaming) m.streaming = false
    })
}

// 流式输出效果
const startStreamReply = (fullText: string) => {
    stopStream()
    const text = fullText.trim()
    const msg = appendChatMessage('assistant', '', true)
    if (!text) {
        msg.streaming = false
        return Promise.resolve()
    }
    const total = text.length
    const chunkSize = Math.max(1, Math.ceil(total / 100))
    let cursor = 0
    return new Promise<void>((resolve) => {
        streamTimer.value = window.setInterval(() => {
            cursor = Math.min(total, cursor + chunkSize)
            msg.content = text.slice(0, cursor)
            scrollChatToBottom()
            if (cursor >= total) {
                msg.streaming = false
                stopStream()
                resolve()
            }
        }, 20)
    })
}

const clearChatMessages = () => {
    stopStream()
    chatMessages.value = []
}
const clearAiDraft = () => {
    aiDraftText.value = ''
}

// 纯文本转 HTML
const plainTextToHtml = (text: string) => {
    if (!text.trim()) return ''
    const escape = (s: string) =>
        s.replace(
            /[&<>"']/g,
            (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] || c)
        )
    return text
        .split(/\n{2,}/)
        .map((b) => `<p>${escape(b).replace(/\n/g, '<br/>')}</p>`)
        .join('')
}

// 富文本转纯文本
const toPlainText = (html: string) =>
    (html || '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()

// 清理 Markdown 围栏
const normalizeDraft = (text: string) =>
    (text || '')
        .replace(/\r\n/g, '\n')
        .replace(/```[\w-]*\n?/g, '')
        .replace(/```/g, '')
        .trim()

// 构建 AI 提示
const buildPrompt = (mode: AiGenerateMode, userPrompt = '') => {
    const currentText = toPlainText(editData.detailContent)
    const websiteName = editData.name || '未命名网站'
    const websiteUrl = editData.url || ''
    const websiteDesc = editData.description || ''

    const modeInstructions: Record<AiGenerateMode, string> = {
        replace: '请为这个网站生成一段完整的详情介绍，结构清晰，适合展示在网站详情页。',
        append: '请基于现有内容续写，逻辑连贯，避免重复已有内容。',
        polish: '请在不改变原意前提下润色全文，增强可读性和专业感。'
    }

    let prompt = `网站名称：${websiteName}\n网站地址：${websiteUrl}\n`
    if (websiteDesc) prompt += `网站描述：${websiteDesc}\n`
    if (currentText && mode !== 'replace') prompt += `\n当前正文内容：\n${currentText}\n`
    prompt += `\n${modeInstructions[mode]}\n请只输出纯文本，不要 Markdown 代码块。`
    if (userPrompt) prompt += `\n用户额外要求：${userPrompt}`
    return prompt
}

// 请求 AI
const requestAiDraft = async (mode: AiGenerateMode, userPrompt = '') => {
    const message = buildPrompt(mode, userPrompt)
    const res = await uiedAiChat({ message, context: '网站详情内容编辑' })
    const reply = res?.reply || res?.content || res?.data?.reply || ''
    const draft = normalizeDraft(reply)
    if (!draft) {
        feedback.msgWarning('AI 未返回可用结果，请调整后重试')
        return ''
    }
    aiDraftText.value = draft
    lastGenerateMode.value = mode
    await startStreamReply(draft)
    return draft
}

// 快捷生成
const handleAiGenerate = async (mode: AiGenerateMode) => {
    const labels: Record<AiGenerateMode, string> = {
        replace: '请生成完整正文',
        append: '请续写正文',
        polish: '请润色正文'
    }
    appendChatMessage('user', labels[mode])
    aiGenerating.value = true
    try {
        const draft = await requestAiDraft(mode)
        if (draft) feedback.msgSuccess('AI 已返回结果')
    } catch (error: any) {
        feedback.msgError(error?.msg || error?.message || 'AI 处理失败')
    } finally {
        aiGenerating.value = false
    }
}

// 发送自定义指令
const handleSendChatPrompt = async () => {
    const prompt = chatPrompt.value.trim()
    if (!prompt) {
        feedback.msgWarning('请输入处理诉求')
        return
    }
    const mode: AiGenerateMode = /续写|扩写/.test(prompt)
        ? 'append'
        : /润色|优化|改写/.test(prompt)
        ? 'polish'
        : 'replace'
    appendChatMessage('user', prompt)
    chatPrompt.value = ''
    aiGenerating.value = true
    try {
        const draft = await requestAiDraft(mode, prompt)
        if (draft) feedback.msgSuccess('AI 已返回结果')
    } catch (error: any) {
        feedback.msgError(error?.msg || error?.message || 'AI 处理失败')
    } finally {
        aiGenerating.value = false
    }
}

// 键盘快捷发送
const handleComposerKeydown = (event: Event | KeyboardEvent) => {
    const keyboardEvent = event as KeyboardEvent
    if (keyboardEvent.key === 'Enter' && !keyboardEvent.shiftKey) {
        keyboardEvent.preventDefault()
        handleSendChatPrompt()
    }
}

// 应用 AI 草稿
const applyAiDraft = (mode: 'replace' | 'append') => {
    const draft = aiDraftText.value.trim()
    if (!draft) {
        feedback.msgWarning('没有可用的 AI 草稿')
        return
    }
    const html = plainTextToHtml(draft)
    if (mode === 'append' && editData.detailContent.trim()) {
        editData.detailContent = `${editData.detailContent}<p><br/></p>${html}`
    } else {
        editData.detailContent = html
    }
    feedback.msgSuccess(mode === 'append' ? '已追加到正文' : '已替换正文')
}

// 复制草稿
const copyAiDraft = async () => {
    const draft = aiDraftText.value.trim()
    if (!draft) return
    try {
        await navigator.clipboard.writeText(draft)
        feedback.msgSuccess('已复制到剪贴板')
    } catch {
        feedback.msgError('复制失败')
    }
}

// ==================== 提交保存 ====================
const handleSubmit = async () => {
    await editFormRef.value?.validate()
    submitLoading.value = true
    try {
        const screenshots = screenshotList.value.filter((url: string) => url?.trim())
        const submitData = {
            ...editData,
            screenshots,
            thumbnail: editData.thumbnail || null,
            order: editData.sortOrder
        }
        if (editData.id) {
            await uiedWebsiteEdit(submitData)
            feedback.msgSuccess('编辑成功')
        } else {
            await uiedWebsiteAdd(submitData)
            feedback.msgSuccess('添加成功')
        }
        handleBack()
    } catch (error: any) {
        feedback.msgError(error?.msg || error?.message || '保存失败')
    } finally {
        submitLoading.value = false
    }
}

const handleBack = () => {
    router.back()
}

// AI 悬浮菜单事件（编辑器选中文本 → AI 改写）
const aiRewriting = ref(false)
const handleAiHover = async (e: Event) => {
    const { text, editor: ed } = (e as CustomEvent).detail
    if (!text || aiRewriting.value) return
    aiRewriting.value = true
    try {
        const res = await uiedAiChat({
            message: `请优化改写以下文本，保持原意但使其更加专业流畅，直接返回改写后的文本：\n\n${text}`,
            context: '网站详情内容编辑'
        })
        const newText = res?.reply || res?.content || res?.data?.reply
        if (newText && ed) {
            ed.insertText(newText)
            feedback.msgSuccess('AI 改写完成')
        }
    } catch (error: any) {
        feedback.msgError(error?.msg || 'AI 改写失败')
    } finally {
        aiRewriting.value = false
    }
}

onMounted(async () => {
    await getCategoryList()
    if (route.query.id) await loadDetail(route.query.id as string)
    window.addEventListener('wangeditor-ai-hover', handleAiHover)
})

onBeforeUnmount(() => {
    stopStream()
    window.removeEventListener('wangeditor-ai-hover', handleAiHover)
})
</script>

<style scoped>
.website-edit-footer {
    position: sticky;
    bottom: 0;
    background: #fff;
    padding: 12px 24px;
    border-top: 1px solid #ebeef5;
    text-align: right;
    z-index: 10;
    margin: 0 -20px -20px;
}

/* AI 编辑器布局 */
.ai-editor-layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 420px;
    gap: 12px;
    align-items: start;
}
.ai-editor-layout__main {
    min-width: 0;
}
.ai-editor-layout__sidebar {
    min-width: 0;
    position: sticky;
    top: 10px;
}

/* AI 对话面板 */
.ai-chat {
    border: 1px solid var(--el-border-color);
    border-radius: 12px;
    background: #fff;
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    height: 560px;
}
.ai-chat__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
}
.ai-chat__title {
    font-size: 15px;
    font-weight: 600;
}
.ai-chat__sub-title {
    font-size: 12px;
    color: var(--el-text-color-secondary);
}
.ai-chat__shortcut {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}
.ai-chat__messages {
    border: 1px solid var(--el-border-color-light);
    border-radius: 10px;
    padding: 10px;
    flex: 1;
    overflow-y: auto;
    background: #fafafa;
}
.ai-chat__message {
    margin-bottom: 8px;
}
.ai-chat__message:last-child {
    margin-bottom: 0;
}
.ai-chat__message-role {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    margin-bottom: 2px;
}
.ai-chat__message-content {
    white-space: pre-wrap;
    word-break: break-word;
    font-size: 13px;
    line-height: 1.65;
    padding: 10px 12px;
    border-radius: 10px;
}
.ai-chat__message--user .ai-chat__message-content {
    background: #e9f3ff;
}
.ai-chat__message--assistant .ai-chat__message-content {
    background: #f4f6f8;
}
.ai-chat__cursor {
    display: inline-block;
    margin-left: 2px;
    animation: ai-cursor-blink 1s infinite;
}
.ai-chat__empty {
    font-size: 13px;
    color: var(--el-text-color-secondary);
    line-height: 1.7;
    padding: 8px 2px;
}
.ai-chat__composer {
    border: 1px solid var(--el-border-color-light);
    border-radius: 10px;
    padding: 8px;
    background: #fff;
}
.ai-chat__composer-actions {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
    margin-top: 8px;
}
.ai-chat__apply-bar {
    border-top: 1px dashed var(--el-border-color-light);
    padding-top: 10px;
}
.ai-chat__apply-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
    margin-bottom: 8px;
}

@keyframes ai-cursor-blink {
    0%,
    45% {
        opacity: 1;
    }
    46%,
    100% {
        opacity: 0;
    }
}

@media (max-width: 1400px) {
    .ai-editor-layout {
        grid-template-columns: 1fr;
    }
    .ai-editor-layout__sidebar {
        position: static;
    }
    .ai-chat {
        height: auto;
        min-height: 400px;
    }
}
</style>
