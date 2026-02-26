<!--
/**
 * @copyright Tomda (https://www.tomda.top)
 * @copyright UIED技术团队 (https://fsuied.com)
 * @author UIED技术团队
 * @createDate 2026-02-16
 */
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
                <el-tab-pane label="详情页" name="detail" lazy>
                    <div class="detail-config-grid">
                        <section class="detail-config-card">
                            <div class="detail-config-card__title">详情页基础设置</div>
                            <el-form :model="editData" label-width="100px">
                                <el-form-item label="访问按钮">
                                    <el-input
                                        v-model="editData.visitBtnText"
                                        placeholder="默认：访问网站"
                                        style="max-width: 400px"
                                    />
                                </el-form-item>
                            </el-form>
                        </section>

                        <section class="detail-config-card">
                            <div class="detail-config-card__title">缩略图预览</div>
                            <el-form :model="editData" label-width="100px">
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
                                        <div class="detail-thumbnail-toolbar">
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
                                                {{ isEdit ? '截图获取（刷新缓存）' : '截图获取' }}
                                            </el-button>
                                        </div>
                                        <div class="detail-thumbnail-preview mt-2">
                                            <template v-if="editData.thumbnail">
                                                <div class="detail-thumbnail-preview__toolbar">
                                                    <span class="dot"></span>
                                                    <span class="dot"></span>
                                                    <span class="dot"></span>
                                                    <span class="detail-thumbnail-preview__url">
                                                        {{ editData.url || 'https://example.com' }}
                                                    </span>
                                                </div>
                                                <el-image
                                                    :src="editData.thumbnail"
                                                    class="detail-thumbnail-preview__image"
                                                    fit="contain"
                                                    :preview-src-list="[editData.thumbnail]"
                                                />
                                            </template>
                                            <div v-else class="detail-thumbnail-preview__empty">
                                                暂无缩略图，建议使用「截图获取」或从素材中心选择
                                            </div>
                                        </div>
                                    </div>
                                </el-form-item>
                            </el-form>
                        </section>
                    </div>

                    <el-divider content-position="left">详情内容（AI 辅助编辑）</el-divider>
                    <!-- AI 编辑器布局：左编辑器 + 右AI助手 -->
                    <div class="ai-editor-layout">
                        <div class="ai-editor-layout__main">
                            <div class="ai-editor-layout__mode-bar">
                                <div class="ai-editor-layout__mode-left">
                                    <el-tag v-if="isFirefoxBrowser" size="small" type="warning">
                                        Firefox 输入兼容优化已启用
                                    </el-tag>
                                    <span class="ai-editor-layout__mode-tip">
                                        {{
                                            isFirefoxBrowser
                                                ? '已对 Firefox 做组合输入兼容优化；如仍异常请把控制台报错发我继续定位'
                                                : '可视化编辑器 + AI 助手联动编辑'
                                        }}
                                    </span>
                                </div>
                                <div class="ai-editor-layout__mode-actions">
                                    <el-button link type="primary" @click="goToAiConfigPage">
                                        AI配置
                                    </el-button>
                                </div>
                            </div>

                            <div v-if="detailEditorCompatMode" class="ai-editor-layout__compat">
                                <el-input
                                    v-model="editData.detailContent"
                                    type="textarea"
                                    :rows="22"
                                    resize="none"
                                    placeholder="兼容模式：直接编辑 HTML 内容（可粘贴 AI 输出或手工调整）"
                                    class="ai-editor-layout__compat-textarea"
                                />
                                <div class="ai-editor-layout__compat-tip">
                                    当前已进入 HTML 兜底输入模式（仅在富文本异常时使用）。
                                </div>
                            </div>
                            <editor
                                v-else-if="detailEditorReady"
                                v-model="editData.detailContent"
                                :height="560"
                                mode="default"
                            />
                            <div v-else class="ai-editor-layout__placeholder">
                                {{
                                    '切换到“详情页”后初始化编辑器...'
                                }}
                            </div>

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
                                                <div
                                                    class="ai-chat__message-markdown"
                                                    v-html="renderChatMessageContent(item)"
                                                />
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
                                    <div v-if="hasDraft" class="ai-chat__draft-preview">
                                        <div class="ai-chat__draft-preview-title">Markdown 预览</div>
                                        <div
                                            class="ai-chat__draft-preview-body"
                                            v-html="renderAiMarkdown(aiDraftText)"
                                        />
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
    uiedAiChat,
    uiedSeoScraperFetch
} from '@/api/uied'
import configs from '@/config'
import { getToken } from '@/utils/auth'
import feedback from '@/utils/feedback'
import type { FormInstance, FormRules } from 'element-plus'
import { QuestionFilled, FolderOpened } from '@element-plus/icons-vue'
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

interface ChatStreamContextItem {
    role: 'user' | 'assistant'
    content: string
}

const route = useRoute()
const router = useRouter()

// 页面状态
const pageLoading = ref(false)
const submitLoading = ref(false)
const activeTab = ref('basic')
const detailEditorReady = ref(false)
const isFirefoxBrowser =
    typeof window !== 'undefined' && /firefox/i.test(window.navigator.userAgent || '')
const detailEditorCompatMode = ref(false)
const editFormRef = ref<FormInstance>()
const isEdit = computed(() => !!route.query.id)

/**
 * 打开 AI 配置页（兼容旧路径与新版分组路径）
 */
const goToAiConfigPage = () => {
    const targetPath = '/system-setting/base-config/aiConfig'
    const resolved = router.resolve(targetPath)
    if (resolved?.matched?.length) {
        router.push(targetPath)
        return
    }
    router.push('/uied/aiConfig')
}

/**
 * 仅在详情页签激活后初始化富文本编辑器，避免隐藏容器下编辑器无法输入
 */
const ensureDetailEditorReady = () => {
    if (activeTab.value !== 'detail' || detailEditorReady.value) return
    detailEditorReady.value = true
    nextTick(() => {
        window.dispatchEvent(new Event('resize'))
    })
}

watch(
    activeTab,
    (tab) => {
        if (tab === 'detail') ensureDetailEditorReady()
    },
    { immediate: true }
)

watch(
    detailEditorCompatMode,
    (enabled) => {
        if (!enabled && activeTab.value === 'detail') {
            ensureDetailEditorReady()
        }
    },
    { immediate: false }
)

// 分类列表
const categoryList = ref<any[]>([])
/**
 * 获取分类选项
 */
const getCategoryList = async () => {
    try {
        const res = await uiedCategoryAll()
        categoryList.value = res || []
    } catch (error: any) {
        feedback.msgError(error?.msg || error?.message || '获取分类列表失败')
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
/**
 * 加载网站详情
 */
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
        const activeValue =
            data.isActive !== undefined && data.isActive !== null
                ? Number(data.isActive)
                : data.status !== 'disabled'
                ? 1
                : 0
        editData.isActive = activeValue === 1 ? 1 : 0
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

/**
 * 解析当前编辑网站 ID（仅编辑态可用）
 */
const getEditingWebsiteId = () => {
    const rawId = route.query.id
    const parsed = Number.parseInt(String(Array.isArray(rawId) ? rawId[0] : rawId || ''), 10)
    return Number.isInteger(parsed) && parsed > 0 ? parsed : 0
}

/**
 * 后台手动刷新预览截图（编辑态优先走后端 Playwright 缓存刷新，新增态回退 thum.io）
 */
const handleCaptureThumbnail = async () => {
    if (!editData.url) {
        feedback.msgWarning('请先填写网站URL')
        return
    }
    capturingThumbnail.value = true
    try {
        const websiteId = getEditingWebsiteId()
        if (websiteId > 0) {
            const response = await fetch(
                `/api/websites/${websiteId}/preview-snapshot?refresh=1`,
                {
                    method: 'GET',
                    credentials: 'same-origin',
                    headers: { Accept: 'application/json' }
                }
            )
            if (response.ok) {
                const payload = await response.json()
                const previewUrl = String(payload?.url || '').trim()
                if (previewUrl) {
                    editData.thumbnail = previewUrl
                    if (payload?.source === 'playwright_cache') {
                        feedback.msgSuccess('本地截图缓存已刷新')
                    } else if (payload?.source === 'mshots_fallback') {
                        feedback.msgWarning('本地截图失败，已回退到 mShots 截图')
                    } else {
                        feedback.msgSuccess('缩略图已更新')
                    }
                    return
                }
            }
            feedback.msgWarning('本地截图未生成，已改用 API 截图兜底')
        }

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

/**
 * 解析 AI 助手错误提示，给出可执行的排查方向
 */
const resolveAiAssistantErrorMessage = (error: any) => {
    const status = Number(error?.response?.status || error?.status || 0)
    const responseCode = Number(error?.response?.data?.code || 0)
    const bodyMessage = String(error?.response?.data?.msg || error?.response?.data?.message || '').trim()
    const rawMessage = String(error?.msg || error?.message || bodyMessage || '').trim()

    // 商业版 403 已由请求拦截器统一提示，页面层不重复弹窗
    if (status === 403 && responseCode === 403) {
        return ''
    }
    if (status === 403) {
        return '当前版本未授权或无权限访问 AI 写作助手，请检查账号权限与许可证配置'
    }
    if (/token参数为空|token empty|token invalid/i.test(rawMessage)) {
        return '登录状态已失效，请重新登录后台后再使用 AI 写作助手'
    }
    if (/没有可用的 AI 配置/.test(rawMessage)) {
        return '未检测到可用 AI 配置，请先到「系统设置 -> AI配置」启用至少一套配置'
    }
    if (/API Key/i.test(rawMessage)) {
        return 'AI 配置缺少 API Key，请先到「系统设置 -> AI配置」补全并启用配置'
    }
    if (/SSL 证书校验失败|certificate/i.test(rawMessage)) {
        return 'AI 服务证书校验失败，请检查 AI 接口地址或服务器证书链配置'
    }
    return rawMessage || 'AI 处理失败，请稍后重试'
}

/**
 * 转义 HTML，避免 AI 文本直接注入 DOM
 */
const escapeHtmlText = (text: string) =>
    String(text || '').replace(
        /[&<>"']/g,
        (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] || c)
    )

/**
 * 渲染 Markdown 行内语法（加粗、斜体、行内代码、链接）
 */
const renderInlineMarkdown = (text: string) => {
    let html = escapeHtmlText(text || '')
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>')
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    html = html.replace(/__([^_]+)__/g, '<strong>$1</strong>')
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>')
    html = html.replace(/_([^_]+)_/g, '<em>$1</em>')
    html = html.replace(
        /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
        '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
    )
    return html
}

/**
 * 将 Markdown 文本转换为安全 HTML（轻量实现，覆盖 AI 助手常见输出）
 */
const renderAiMarkdown = (text: string) => {
    const source = String(text || '').replace(/\r\n/g, '\n').trim()
    if (!source) return ''

    const codeBlocks: string[] = []
    let normalized = source.replace(/```([\w-]*)\n?([\s\S]*?)```/g, (_, lang = '', code = '') => {
        const idx = codeBlocks.length
        const safeLang = escapeHtmlText(String(lang || '').trim())
        const safeCode = escapeHtmlText(String(code || '').replace(/\n$/, ''))
        codeBlocks.push(
            `<pre class="ai-md-pre"><code class="ai-md-code" data-lang="${safeLang}">${safeCode}</code></pre>`
        )
        return `__AI_CODE_BLOCK_${idx}__`
    })

    const lines = normalized.split('\n')
    const blocks: string[] = []
    let i = 0
    while (i < lines.length) {
        const rawLine = lines[i]
        const line = rawLine.trim()
        if (!line) {
            i += 1
            continue
        }

        const headingMatch = line.match(/^(#{1,6})\s+(.*)$/)
        if (headingMatch) {
            const level = Math.min(6, headingMatch[1].length)
            blocks.push(`<h${level}>${renderInlineMarkdown(headingMatch[2])}</h${level}>`)
            i += 1
            continue
        }

        if (/^>\s?/.test(line)) {
            const quoteLines: string[] = []
            while (i < lines.length && /^>\s?/.test(lines[i].trim())) {
                quoteLines.push(lines[i].trim().replace(/^>\s?/, ''))
                i += 1
            }
            blocks.push(`<blockquote>${quoteLines.map(item => renderInlineMarkdown(item)).join('<br/>')}</blockquote>`)
            continue
        }

        if (/^[-*]\s+/.test(line)) {
            const items: string[] = []
            while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
                items.push(lines[i].trim().replace(/^[-*]\s+/, ''))
                i += 1
            }
            blocks.push(`<ul>${items.map(item => `<li>${renderInlineMarkdown(item)}</li>`).join('')}</ul>`)
            continue
        }

        if (/^\d+\.\s+/.test(line)) {
            const items: string[] = []
            while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
                items.push(lines[i].trim().replace(/^\d+\.\s+/, ''))
                i += 1
            }
            blocks.push(`<ol>${items.map(item => `<li>${renderInlineMarkdown(item)}</li>`).join('')}</ol>`)
            continue
        }

        const paragraphLines: string[] = []
        while (i < lines.length && lines[i].trim()) {
            paragraphLines.push(lines[i])
            i += 1
        }
        blocks.push(`<p>${paragraphLines.map(item => renderInlineMarkdown(item)).join('<br/>')}</p>`)
    }

    let html = blocks.join('')
    html = html.replace(/__AI_CODE_BLOCK_(\d+)__/g, (_, idx) => codeBlocks[Number(idx)] || '')
    return html
}

/**
 * 将 AI 草稿（Markdown/纯文本）转换为编辑器 HTML
 */
const markdownTextToHtml = (text: string) => {
    const rendered = renderAiMarkdown(text)
    return rendered || `<p>${escapeHtmlText(text || '').replace(/\n/g, '<br/>')}</p>`
}

// 富文本转纯文本
const toPlainText = (html: string) =>
    (html || '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()

// 规范化 AI 草稿文本（保留 Markdown 语法）
const normalizeDraft = (text: string) =>
    (text || '')
        .replace(/\r\n/g, '\n')
        .trim()

/**
 * 渲染聊天消息内容（AI 消息支持 Markdown，用户消息按纯文本）
 */
const renderChatMessageContent = (item: ChatMessage) => {
    const content = String(item?.content || '')
    if (item.role === 'assistant') {
        return renderAiMarkdown(content)
    }
    return escapeHtmlText(content).replace(/\n/g, '<br/>')
}

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
    prompt += `\n${modeInstructions[mode]}\n请使用 Markdown 输出内容（可使用标题、列表、加粗），不要输出解释性前缀。`
    if (userPrompt) prompt += `\n用户额外要求：${userPrompt}`
    return prompt
}

/**
 * 收集最近对话上下文，传给 AI 对话接口提升连续性
 */
const buildAiChatContext = (): ChatStreamContextItem[] =>
    chatMessages.value
        .filter((item) => item.role === 'user' || item.role === 'assistant')
        .map((item) => ({
            role: item.role,
            content: String(item.content || '').trim()
        }))
        .filter((item) => item.content)
        .slice(-6)

/**
 * 通过 SSE 接口获取 AI 回复（优先使用真实流式输出）
 */
const requestAiDraftBySse = async (mode: AiGenerateMode, userPrompt = '') => {
    const message = buildPrompt(mode, userPrompt)
    const token = getToken()
    const baseUrl = String(configs.baseUrl || '').replace(/\/$/, '')
    const streamUrl = `${baseUrl}/api/ai/chat/completions/editor`

    const headers: Record<string, string> = {
        'Content-Type': 'application/json'
    }
    if (token) headers.token = String(token)

    const response = await fetch(streamUrl, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({
            message,
            context: buildAiChatContext()
        })
    })

    if (!response.ok || !response.body) {
        const text = await response.text().catch(() => '')
        throw new Error(text || `AI 流式请求失败（HTTP ${response.status}）`)
    }

    stopStream()
    const assistantMsg = appendChatMessage('assistant', '', true)
    const reader = response.body.getReader()
    const decoder = new TextDecoder('utf-8')
    let buffer = ''
    let mergedText = ''
    let hasChunk = false

    try {
        while (true) {
            const { done, value } = await reader.read()
            buffer += decoder.decode(value || new Uint8Array(), { stream: !done })

            let splitIndex = buffer.indexOf('\n\n')
            while (splitIndex !== -1) {
                const packet = buffer.slice(0, splitIndex)
                buffer = buffer.slice(splitIndex + 2)

                const dataLine = packet
                    .split('\n')
                    .map((line) => line.trim())
                    .filter((line) => line.startsWith('data:'))
                    .map((line) => line.replace(/^data:\s?/, ''))
                    .join('')

                if (dataLine) {
                    if (dataLine === '[DONE]') {
                        assistantMsg.streaming = false
                        const draft = normalizeDraft(mergedText)
                        if (draft) {
                            aiDraftText.value = draft
                            lastGenerateMode.value = mode
                            assistantMsg.content = draft
                        }
                        return draft
                    }
                    try {
                        const payload = JSON.parse(dataLine)
                        const delta = String(
                            payload?.choices?.[0]?.delta?.content ||
                                payload?.content ||
                                payload?.reply ||
                                ''
                        )
                        if (delta) {
                            hasChunk = true
                            mergedText += delta
                            assistantMsg.content = normalizeDraft(mergedText)
                            aiDraftText.value = normalizeDraft(mergedText)
                            lastGenerateMode.value = mode
                            scrollChatToBottom()
                        }
                    } catch (parseError) {
                        console.warn('[uied.website.ai] SSE 片段解析失败', dataLine, parseError)
                    }
                }
                splitIndex = buffer.indexOf('\n\n')
            }

            if (done) break
        }
    } catch (error) {
        assistantMsg.streaming = false
        if (hasChunk) {
            const draft = normalizeDraft(mergedText)
            if (draft) {
                aiDraftText.value = draft
                lastGenerateMode.value = mode
                assistantMsg.content = draft
                return draft
            }
        }
        throw error
    } finally {
        assistantMsg.streaming = false
        reader.releaseLock?.()
    }

    const draft = normalizeDraft(mergedText)
    if (!draft) {
        throw new Error('AI 未返回可用结果，请检查流式接口配置')
    }
    aiDraftText.value = draft
    lastGenerateMode.value = mode
    assistantMsg.content = draft
    return draft
}

/**
 * 请求 AI（优先 SSE 流式，失败后回退普通对话接口）
 */
const requestAiDraft = async (mode: AiGenerateMode, userPrompt = '') => {
    try {
        return await requestAiDraftBySse(mode, userPrompt)
    } catch (sseError) {
        console.warn('[uied.website.ai] SSE 失败，回退普通接口', sseError)
    }

    const message = buildPrompt(mode, userPrompt)
    const res = await uiedAiChat({
        message,
        context: buildAiChatContext()
    })
    const reply =
        res?.reply ||
        res?.content ||
        res?.reasoningContent ||
        res?.reasoning_content ||
        res?.data?.reply ||
        res?.data?.reasoningContent ||
        ''
    const draft = normalizeDraft(reply)
    if (!draft) {
        console.warn('[uied.website.ai] 空响应', res)
        feedback.msgWarning('AI 未返回可用结果，请调整模型配置后重试')
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
        const errorMessage = resolveAiAssistantErrorMessage(error)
        errorMessage && feedback.msgError(errorMessage)
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
        const errorMessage = resolveAiAssistantErrorMessage(error)
        errorMessage && feedback.msgError(errorMessage)
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
    const html = markdownTextToHtml(draft)
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
        const newText =
            res?.reply ||
            res?.content ||
            res?.reasoningContent ||
            res?.reasoning_content ||
            res?.data?.reply ||
            res?.data?.reasoningContent
        if (newText && ed) {
            ed.insertText(newText)
            feedback.msgSuccess('AI 改写完成')
        }
    } catch (error: any) {
        const errorMessage = resolveAiAssistantErrorMessage(error)
        errorMessage && feedback.msgError(errorMessage)
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

.detail-config-grid {
    display: grid;
    grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
    gap: 12px;
    margin-bottom: 6px;
}
.detail-config-card {
    border: 1px solid var(--el-border-color-light);
    border-radius: 12px;
    padding: 12px;
    background: #fff;
}
.detail-config-card__title {
    font-size: 13px;
    font-weight: 600;
    color: #303133;
    margin-bottom: 10px;
}
.detail-thumbnail-toolbar {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto auto;
    gap: 8px;
}
.detail-thumbnail-preview {
    border: 1px solid var(--el-border-color-light);
    border-radius: 12px;
    background: #fff;
    overflow: hidden;
    min-height: 220px;
}
.detail-thumbnail-preview__toolbar {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 10px;
    border-bottom: 1px solid var(--el-border-color-lighter);
    background: #fafafa;
}
.detail-thumbnail-preview__toolbar .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #d0d7de;
}
.detail-thumbnail-preview__url {
    margin-left: 6px;
    font-size: 12px;
    color: #606266;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
.detail-thumbnail-preview__image {
    width: 100%;
    height: 200px;
    display: block;
}
.detail-thumbnail-preview__empty {
    min-height: 220px;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 12px;
    color: #909399;
    font-size: 13px;
}

/* AI 编辑器布局 */
.ai-editor-layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(340px, 400px);
    gap: 12px;
    align-items: start;
}
.ai-editor-layout__main {
    min-width: 0;
}
.ai-editor-layout__sidebar {
    position: sticky;
    top: 12px;
}
.ai-editor-layout__mode-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    margin-bottom: 10px;
    padding: 10px 12px;
    border: 1px solid var(--el-border-color-light);
    border-radius: 10px;
    background: #fff;
}
.ai-editor-layout__mode-left {
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
}
.ai-editor-layout__mode-tip {
    color: var(--el-text-color-secondary);
    font-size: 12px;
    line-height: 1.4;
}
.ai-editor-layout__mode-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
}
.ai-editor-layout__mode-label {
    color: var(--el-text-color-secondary);
    font-size: 12px;
}
.ai-editor-layout__compat {
    border: 1px solid var(--el-border-color);
    border-radius: 10px;
    background: #fff;
    padding: 12px;
}
.ai-editor-layout__compat :deep(.el-textarea__inner) {
    min-height: 560px !important;
    font-family: Menlo, Monaco, Consolas, 'Courier New', monospace;
    line-height: 1.6;
}
.ai-editor-layout__compat-tip {
    margin-top: 8px;
    color: var(--el-text-color-secondary);
    font-size: 12px;
    line-height: 1.5;
}
.ai-chat {
    border: 1px solid var(--el-border-color-light);
    border-radius: 10px;
    background: #fff;
    padding: 12px;
}
.ai-editor-layout__placeholder {
    height: 560px;
    border: 1px dashed var(--el-border-color);
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--el-text-color-secondary);
    background: #fff;
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
    font-size: 13px;
    line-height: 1.65;
    padding: 10px 12px;
    border-radius: 10px;
}
.ai-chat__message-markdown {
    word-break: break-word;
}
.ai-chat__message-markdown :deep(p) {
    margin: 0 0 8px;
}
.ai-chat__message-markdown :deep(p:last-child) {
    margin-bottom: 0;
}
.ai-chat__message-markdown :deep(h1),
.ai-chat__message-markdown :deep(h2),
.ai-chat__message-markdown :deep(h3),
.ai-chat__message-markdown :deep(h4) {
    margin: 6px 0 8px;
    font-weight: 600;
    line-height: 1.4;
}
.ai-chat__message-markdown :deep(h1) {
    font-size: 16px;
}
.ai-chat__message-markdown :deep(h2) {
    font-size: 15px;
}
.ai-chat__message-markdown :deep(h3),
.ai-chat__message-markdown :deep(h4) {
    font-size: 14px;
}
.ai-chat__message-markdown :deep(ul),
.ai-chat__message-markdown :deep(ol) {
    margin: 6px 0 8px 18px;
    padding: 0;
}
.ai-chat__message-markdown :deep(li) {
    margin: 2px 0;
}
.ai-chat__message-markdown :deep(blockquote) {
    margin: 6px 0;
    padding: 6px 10px;
    border-left: 3px solid #d0d7de;
    background: rgba(255, 255, 255, 0.5);
    border-radius: 6px;
}
.ai-chat__message-markdown :deep(code) {
    padding: 1px 5px;
    border-radius: 4px;
    background: rgba(15, 23, 42, 0.08);
    font-family: Menlo, Monaco, Consolas, 'Courier New', monospace;
    font-size: 12px;
}
.ai-chat__message-markdown :deep(.ai-md-pre) {
    margin: 8px 0;
    padding: 10px;
    border-radius: 8px;
    background: #0f172a;
    color: #e2e8f0;
    overflow-x: auto;
}
.ai-chat__message-markdown :deep(.ai-md-pre code) {
    padding: 0;
    background: transparent;
    color: inherit;
    font-size: 12px;
    line-height: 1.55;
}
.ai-chat__message-markdown :deep(a) {
    color: #2563eb;
    text-decoration: underline;
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
.ai-chat__draft-preview {
    margin-bottom: 10px;
    border: 1px solid var(--el-border-color-light);
    border-radius: 10px;
    background: #fafafa;
    overflow: hidden;
}
.ai-chat__draft-preview-title {
    padding: 8px 10px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
    border-bottom: 1px solid var(--el-border-color-lighter);
    background: #fff;
}
.ai-chat__draft-preview-body {
    max-height: 160px;
    overflow-y: auto;
    padding: 10px;
    font-size: 12px;
    line-height: 1.65;
}

@media (max-width: 1280px) {
    .detail-config-grid {
        grid-template-columns: minmax(0, 1fr);
    }
    .detail-thumbnail-toolbar {
        grid-template-columns: minmax(0, 1fr);
    }
    .ai-editor-layout {
        grid-template-columns: minmax(0, 1fr);
    }
    .ai-editor-layout__sidebar {
        position: static;
    }
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
    .ai-editor-layout__mode-bar {
        flex-direction: column;
        align-items: flex-start;
    }
    .ai-editor-layout__mode-actions {
        width: 100%;
        justify-content: flex-start;
        flex-wrap: wrap;
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
