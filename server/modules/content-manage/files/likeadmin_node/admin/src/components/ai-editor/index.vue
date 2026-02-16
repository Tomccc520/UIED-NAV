<!--
/**
 * @copyright Tomda (https://www.tomda.top)
 * @copyright UIED技术团队 (https://fsuied.com)
 * @author UIED技术团队
 * @createDate 2026.2.8
 */
-->
<template>
    <div class="ai-editor-layout">
        <div class="ai-editor-layout__main">
            <editor
                v-model="editorValue"
                :height="height"
                mode="default"
                :enable-ai-tools="true"
                :ai-scene="String(props.scene || 'general')"
                :ai-title="String(props.title || '')"
                :ai-version="String(props.version || '')"
                :ai-date="String(props.date || '')"
                :ai-context="props.context || {}"
            />
        </div>
        <aside class="ai-editor-layout__sidebar">
            <div class="ai-chat">
                <div class="ai-chat__header">
                    <div class="ai-chat__title-wrap">
                        <div class="ai-chat__title">文章 AI 助手</div>
                        <div class="ai-chat__sub-title">对话式创作，输出纯文本可直接落稿</div>
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
                    <el-button
                        size="small"
                        plain
                        :loading="aiGenerating"
                        @click="handleGenerateTitle"
                    >
                        生成标题建议
                    </el-button>
                </div>
                <div class="ai-chat__prompt-block">
                    <div class="ai-chat__prompt-title">常用提示词</div>
                    <div class="ai-chat__prompt-list">
                        <el-tag
                            v-for="item in quickPrompts"
                            :key="item"
                            class="ai-chat__prompt-item"
                            effect="plain"
                            @click="useQuickPrompt(item)"
                        >
                            {{ item }}
                        </el-tag>
                    </div>
                </div>

                <el-row v-if="isUpdateLogScene" :gutter="8" class="ai-chat__update-tools">
                    <el-col :span="24">
                        <el-form-item label="日志风格" class="mb-1" label-width="72px">
                            <el-radio-group v-model="updateLogOptions.style" size="small">
                                <el-radio-button label="standard">标准</el-radio-button>
                                <el-radio-button label="technical">技术</el-radio-button>
                                <el-radio-button label="operation">运营</el-radio-button>
                            </el-radio-group>
                        </el-form-item>
                    </el-col>
                    <el-col :span="24">
                        <div class="ai-chat__update-switches">
                            <el-switch
                                v-model="updateLogOptions.includeAdvice"
                                inline-prompt
                                active-text="升级建议"
                                inactive-text="无建议"
                            />
                            <el-switch
                                v-model="updateLogOptions.includeCompatibility"
                                inline-prompt
                                active-text="兼容说明"
                                inactive-text="无兼容"
                            />
                            <el-button
                                size="small"
                                :disabled="aiGenerating"
                                @click="insertUpdateLogTemplate"
                            >
                                插入更新日志模板
                            </el-button>
                        </div>
                    </el-col>
                </el-row>

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
                                <span v-if="item.streaming" class="ai-chat__cursor">|</span>
                            </div>
                        </div>
                    </template>
                    <div v-else class="ai-chat__empty">
                        输入指令后开始对话，例如：把正文改成更适合公众号发布。
                    </div>
                </div>

                <div class="ai-chat__composer">
                    <el-input
                        v-model="chatPrompt"
                        type="textarea"
                        :autosize="{ minRows: 3, maxRows: 6 }"
                        resize="none"
                        :disabled="aiGenerating"
                        :placeholder="chatPlaceholder"
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
                            清空对话
                        </el-button>
                    </div>
                </div>

                <div class="ai-chat__apply-bar">
                    <div class="ai-chat__apply-title">
                        最近输出：{{ lastGenerateModeLabel }}
                        <el-tag v-if="aiGenerating" size="small" type="warning">生成中</el-tag>
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
                            @mousedown.prevent
                            @click="applyAiDraftToSelection"
                        >
                            替换选中
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
                            清空输出
                        </el-button>
                    </el-space>
                </div>
            </div>
        </aside>
    </div>
</template>

<script lang="ts" setup>
import { fetchEventSource } from '@microsoft/fetch-event-source'
import { aiEditorGenerate } from '@/api/ai/editor'
import feedback from '@/utils/feedback'
import useUserStore from '@/stores/modules/user'

type AiGenerateMode = 'replace' | 'append' | 'polish'

type ChatRole = 'user' | 'assistant'

interface AiEditorBridge {
    getSelectionText?: () => string
    replaceSelectionText?: (value: string) => boolean
}

interface ChatMessage {
    id: number
    role: ChatRole
    content: string
    streaming?: boolean
}

const props = withDefaults(
    defineProps<{
        modelValue?: string
        scene?: 'general' | 'update_log' | 'article' | 'product' | 'rewrite' | string
        height?: number | string
        title?: string
        version?: string
        date?: string
        context?: Record<string, any>
    }>(),
    {
        modelValue: '',
        scene: 'general',
        height: 560,
        title: '',
        version: '',
        date: '',
        context: () => ({})
    }
)

const emit = defineEmits<{
    (event: 'update:modelValue', value: string): void
    (event: 'generated', value: string): void
}>()

const userStore = useUserStore()
const aiGenerating = ref(false)
const aiDraftRawText = ref('')
const streamController = ref<AbortController | null>(null)
const lastGenerateMode = ref<AiGenerateMode>('replace')
const chatPrompt = ref('')
const chatSeq = ref(0)
const chatMessages = ref<ChatMessage[]>([])
const chatMessagesRef = ref<HTMLDivElement | null>(null)
const updateLogOptions = reactive({
    style: 'standard',
    includeAdvice: true,
    includeCompatibility: true
})

const editorValue = computed({
    get() {
        return String(props.modelValue || '')
    },
    set(value: string) {
        emit('update:modelValue', value)
    }
})

const isUpdateLogScene = computed(() => String(props.scene || '').trim() === 'update_log')
const hasDraft = computed(() => Boolean(String(aiDraftRawText.value || '').trim()))
const aiTone = computed(() => (isUpdateLogScene.value ? '运营公告' : '专业、简洁'))
const aiAudience = computed(() => (isUpdateLogScene.value ? '已购客户与技术负责人' : '公众号读者'))
const chatPlaceholder = computed(() => {
    if (isUpdateLogScene.value) {
        return '输入本次版本诉求，例如：按新增/优化/修复生成版本说明（Shift+Enter 换行）'
    }
    return '输入你的文章处理诉求，例如：把第二段改得更有说服力（Shift+Enter 换行）'
})
const quickPrompts = computed<string[]>(() => {
    if (isUpdateLogScene.value) {
        return [
            '按新增/优化/修复三段式输出本次版本说明',
            '基于当前内容补充升级建议与兼容性说明',
            '把更新日志改成更易懂的运营公告口吻',
            '提炼本次版本对客户的核心价值，控制在120字'
        ]
    }
    return [
        '请基于当前正文生成一版更有转化力的内容',
        '请把这篇文章改成公众号风格，段落更短更易读',
        '请补充一个结尾行动引导，语气专业简洁',
        '请提炼3个标题建议，每个不超过24字'
    ]
})
const lastGenerateModeLabel = computed(() => {
    const map: Record<AiGenerateMode, string> = {
        replace: '生成',
        append: '续写',
        polish: '润色'
    }
    return map[lastGenerateMode.value] || '生成'
})

/**
 * 获取编辑器桥接对象
 */
const getEditorBridge = () => {
    const globalWindow = window as any
    return (globalWindow.__aiAssistantEditor || null) as AiEditorBridge | null
}

/**
 * 滚动对话区到底部
 */
const scrollChatToBottom = () => {
    nextTick(() => {
        if (!chatMessagesRef.value) return
        chatMessagesRef.value.scrollTop = chatMessagesRef.value.scrollHeight
    })
}

/**
 * 创建并追加一条对话消息
 */
const appendChatMessage = (role: ChatRole, content: string, streaming = false) => {
    const text = String(content || '').trim()
    if (!text && !streaming) return null
    chatSeq.value += 1
    const message: ChatMessage = {
        id: chatSeq.value,
        role,
        content: text,
        streaming
    }
    chatMessages.value.push(message)
    const reactiveMessage = chatMessages.value[chatMessages.value.length - 1] || null
    scrollChatToBottom()
    return reactiveMessage
}

/**
 * 停止流式输出定时器
 */
const stopStream = () => {
    if (streamController.value) {
        streamController.value.abort()
        streamController.value = null
    }
    chatMessages.value.forEach((item) => {
        if (item.streaming) {
            item.streaming = false
        }
    })
}

/**
 * 解析流式请求地址
 */
const resolveEditorStreamUrl = () => {
    const rawBase = String(import.meta.env.VITE_APP_BASE_URL || '')
        .trim()
        .replace(/^['"]|['"]$/g, '')
    const base = /^https?:\/\//i.test(rawBase) ? rawBase : window.location.origin
    return new URL('/api/ai/chat/completions/editor', base).toString()
}

/**
 * 发起编辑器流式请求并持续写入回复
 */
const requestEditorStream = async (
    params: Record<string, any>,
    onChunk: (chunk: string) => void
) => {
    const token = userStore.token || ''
    const url = resolveEditorStreamUrl()
    streamController.value = new AbortController()
    let chunkCount = 0

    await fetchEventSource(url, {
        method: 'POST',
        signal: streamController.value.signal,
        headers: {
            'Content-Type': 'application/json',
            Accept: 'text/event-stream',
            token
        },
        body: JSON.stringify({
            ...params,
            stream: true
        }),
        async onopen(response) {
            const contentType = String(response.headers.get('content-type') || '')
            if (response.ok && contentType.includes('text/event-stream')) {
                return
            }
            if (contentType.includes('application/json')) {
                const err = await response.json()
                throw new Error(err?.message || err?.msg || '请求失败')
            }
            throw new Error('流式连接失败')
        },
        onmessage(event) {
            if (!event.data || event.data === '[DONE]') return
            try {
                const payload = JSON.parse(event.data)
                const delta = payload?.choices?.[0]?.delta || {}
                const contentRaw = delta?.content
                const reasoningRaw = delta?.reasoning_content
                const normalizeChunk = (value: any) => {
                    if (!value) return ''
                    if (typeof value === 'string') return value
                    if (Array.isArray(value)) {
                        return value
                            .map((item) => {
                                if (typeof item === 'string') return item
                                if (typeof item?.text === 'string') return item.text
                                return ''
                            })
                            .join('')
                    }
                    if (typeof value?.text === 'string') return value.text
                    return ''
                }
                const content = normalizeChunk(contentRaw)
                const reasoning = normalizeChunk(reasoningRaw)
                const chunkText = content || reasoning
                if (chunkText) {
                    chunkCount += 1
                    onChunk(chunkText)
                }
            } catch (error) {
                console.warn('editor stream parse error:', error)
            }
        },
        onerror(error) {
            if (error instanceof Error) {
                throw error
            }
            throw new Error('流式请求失败')
        }
    })
    return chunkCount
}

/**
 * 清空对话
 */
const clearChatMessages = () => {
    stopStream()
    chatMessages.value = []
}

/**
 * 使用常用提示词快速填充输入框
 */
const useQuickPrompt = (prompt: string) => {
    chatPrompt.value = String(prompt || '').trim()
}

/**
 * 纯文本转 HTML（用于写回富文本编辑器）
 */
const plainTextToHtml = (value: string) => {
    const text = String(value || '').trim()
    if (!text) return ''
    const escapeMap: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }
    const escapeHtml = (input: string) => input.replace(/[&<>"']/g, (char) => escapeMap[char])
    return text
        .split(/\n{2,}/)
        .map((block) => `<p>${escapeHtml(block).replace(/\n/g, '<br/>')}</p>`)
        .join('')
}

/**
 * 将富文本转纯文本
 */
const toPlainText = (value: string) => {
    return String(value || '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
}

/**
 * 清理 AI 草稿中的 Markdown 代码围栏
 */
const normalizeAiDraft = (value: string) => {
    return String(value || '')
        .replace(/\r\n/g, '\n')
        .replace(/```[\w-]*\n?/g, '')
        .replace(/```/g, '')
        .trim()
}

/**
 * 从文本中解析要点列表
 */
const parsePointsFromText = (value: string) => {
    const raw = toPlainText(value)
    if (!raw) return []
    return raw
        .split(/[\n。；;]+/)
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, 20)
}

/**
 * 构建 AI 额外要求
 */
const buildExtraRequirements = (mode: AiGenerateMode, prompt = '') => {
    const modeMap: Record<AiGenerateMode, string> = {
        replace: '请输出完整文章正文，结构清晰，直接可发布。',
        append: '请基于现有正文续写，逻辑连贯，避免重复。',
        polish: '请在不改变原意前提下润色全文，增强可读性。'
    }
    const requirementParts = [modeMap[mode], '请只输出纯文本，不要 Markdown 代码块。']
    if (isUpdateLogScene.value) {
        const styleMap: Record<string, string> = {
            standard: '标准发布公告风格',
            technical: '技术变更说明风格',
            operation: '运营沟通风格'
        }
        requirementParts.push(
            `文案风格请采用：${styleMap[updateLogOptions.style] || styleMap.standard}。`
        )
        if (updateLogOptions.includeAdvice) {
            requirementParts.push('请补充升级建议。')
        }
        if (updateLogOptions.includeCompatibility) {
            requirementParts.push('请补充兼容性说明。')
        }
    }
    const userPrompt = String(prompt || '').trim()
    if (userPrompt) {
        requirementParts.push(`用户要求：${userPrompt}`)
    }
    return requirementParts.join(' ')
}

/**
 * 请求 AI 并生成草稿
 */
const requestAiDraft = async (
    mode: AiGenerateMode,
    prompt = '',
    assistantMessage?: ChatMessage | null
) => {
    const content = String(editorValue.value || '').trim()
    const requestPayload = {
        scene: String(props.scene || 'article'),
        mode,
        outputFormat: 'text',
        title: String(props.title || '').trim(),
        version: String(props.version || '').trim(),
        date: String(props.date || '').trim(),
        tone: aiTone.value,
        audience: aiAudience.value,
        extraRequirements: buildExtraRequirements(mode, prompt),
        changePoints: parsePointsFromText(content),
        content,
        context: props.context || {}
    }
    let streamDraft = ''
    if (assistantMessage) {
        assistantMessage.content = ''
        assistantMessage.streaming = true
    }
    try {
        const chunkCount = await requestEditorStream(requestPayload, (chunk: string) => {
            streamDraft += chunk
            if (assistantMessage) {
                assistantMessage.content += chunk
                scrollChatToBottom()
            }
        })
        streamDraft = normalizeAiDraft(streamDraft)
        if (streamDraft) {
            if (chunkCount <= 1) {
                console.warn('editor stream returned single chunk, possible proxy buffering')
            }
            aiDraftRawText.value = streamDraft
            lastGenerateMode.value = mode
            if (assistantMessage) {
                assistantMessage.streaming = false
            }
            return streamDraft
        }
    } catch (error: any) {
        if (String(error?.name || '') !== 'AbortError') {
            console.warn('editor stream failed, fallback to non-stream:', error)
            feedback.msgWarning('当前环境流式未生效，已自动降级为普通输出')
        }
    } finally {
        streamController.value = null
    }

    const data = await aiEditorGenerate(requestPayload)
    const draft = normalizeAiDraft(String(data?.draft || ''))
    if (!draft) {
        if (assistantMessage) {
            assistantMessage.streaming = false
        }
        feedback.msgWarning('AI 未返回可用结果，请调整后重试')
        return ''
    }
    aiDraftRawText.value = draft
    lastGenerateMode.value = mode
    if (assistantMessage) {
        assistantMessage.content = draft
        assistantMessage.streaming = false
    }
    return draft
}

/**
 * 快捷生成/续写/润色
 */
const handleAiGenerate = async (mode: AiGenerateMode) => {
    const labelMap: Record<AiGenerateMode, string> = {
        replace: '请生成一版完整正文',
        append: '请对当前正文进行续写',
        polish: '请润色当前正文'
    }
    appendChatMessage('user', labelMap[mode])
    const assistantMessage = appendChatMessage('assistant', '', true)
    aiGenerating.value = true
    try {
        const draft = await requestAiDraft(mode, '', assistantMessage)
        if (!draft) return
        feedback.msgSuccess('AI 已返回结果')
    } catch (error: any) {
        feedback.msgError(error?.message || 'AI 处理失败，请稍后重试')
    } finally {
        aiGenerating.value = false
    }
}

/**
 * 根据对话内容推断处理模式
 */
const resolveModeFromPrompt = (prompt: string): AiGenerateMode => {
    const text = String(prompt || '').trim()
    if (/续写|扩写|延展/.test(text)) return 'append'
    if (/润色|优化|改写/.test(text)) return 'polish'
    return 'replace'
}

/**
 * 发送自定义对话指令
 */
const handleSendChatPrompt = async () => {
    const prompt = String(chatPrompt.value || '').trim()
    if (!prompt) {
        feedback.msgWarning('请输入你的处理诉求')
        return
    }
    const mode = resolveModeFromPrompt(prompt)
    appendChatMessage('user', prompt)
    const assistantMessage = appendChatMessage('assistant', '', true)
    chatPrompt.value = ''
    aiGenerating.value = true
    try {
        const draft = await requestAiDraft(mode, prompt, assistantMessage)
        if (!draft) return
        feedback.msgSuccess('AI 已返回结果')
    } catch (error: any) {
        feedback.msgError(error?.message || 'AI 处理失败，请稍后重试')
    } finally {
        aiGenerating.value = false
    }
}

/**
 * 处理输入区快捷发送
 */
const handleComposerKeydown = (event: KeyboardEvent) => {
    if (event.key !== 'Enter') return
    if (event.shiftKey) return
    event.preventDefault()
    handleSendChatPrompt()
}

/**
 * 生成标题建议
 */
const handleGenerateTitle = async () => {
    appendChatMessage('user', '请基于正文给我 3 个标题建议')
    const assistantMessage = appendChatMessage('assistant', '', true)
    aiGenerating.value = true
    try {
        const draft = await requestAiDraft(
            'replace',
            '请生成 3 个中文标题建议，每个标题单独一行，不超过 24 字。',
            assistantMessage
        )
        if (!draft) return
        feedback.msgSuccess('标题建议已生成')
    } catch (error: any) {
        feedback.msgError(error?.message || 'AI 处理失败，请稍后重试')
    } finally {
        aiGenerating.value = false
    }
}

/**
 * 应用 AI 草稿到全文
 */
const applyAiDraft = (mode: 'replace' | 'append' = 'replace') => {
    const draft = String(aiDraftRawText.value || '').trim()
    if (!draft) {
        feedback.msgWarning('当前没有可插入的 AI 草稿')
        return
    }
    const html = plainTextToHtml(draft)
    const current = String(editorValue.value || '')
    if (mode === 'append' && current.trim()) {
        editorValue.value = `${current}<p><br/></p>${html}`
    } else {
        editorValue.value = html
    }
    emit('generated', editorValue.value)
    feedback.msgSuccess(mode === 'append' ? '已追加到正文' : '已替换正文')
}

/**
 * 使用 AI 草稿替换当前选中文案
 */
const applyAiDraftToSelection = () => {
    const draft = String(aiDraftRawText.value || '').trim()
    if (!draft) {
        feedback.msgWarning('当前没有可替换的 AI 草稿')
        return
    }
    const bridge = getEditorBridge()
    if (!bridge?.replaceSelectionText) {
        feedback.msgWarning('当前编辑器不支持选中替换，请重试')
        return
    }
    const replaced = bridge.replaceSelectionText(draft)
    if (!replaced) {
        return
    }
    feedback.msgSuccess('已替换选中文案')
}

/**
 * 复制 AI 草稿
 */
const copyAiDraft = async () => {
    const draft = String(aiDraftRawText.value || '').trim()
    if (!draft) {
        feedback.msgWarning('当前没有可复制的 AI 草稿')
        return
    }
    try {
        if (navigator?.clipboard?.writeText) {
            await navigator.clipboard.writeText(draft)
        } else {
            const textarea = document.createElement('textarea')
            textarea.value = draft
            textarea.style.position = 'fixed'
            textarea.style.left = '-9999px'
            document.body.appendChild(textarea)
            textarea.select()
            document.execCommand('copy')
            document.body.removeChild(textarea)
        }
        feedback.msgSuccess('AI 草稿已复制')
    } catch (error) {
        feedback.msgError('复制失败，请手动复制')
    }
}

/**
 * 清空 AI 草稿
 */
const clearAiDraft = () => {
    aiDraftRawText.value = ''
}

/**
 * 插入更新日志结构模板
 */
const insertUpdateLogTemplate = () => {
    const title = String(props.title || '').trim() || '版本更新日志'
    const version = String(props.version || '').trim() || '-'
    const date = String(props.date || '').trim() || '-'
    const templateText = [
        `${title}`,
        `版本：${version}`,
        `日期：${date}`,
        '',
        '版本概览',
        '请填写本次版本核心价值与改动范围。',
        '',
        '重点更新',
        '- 新增：',
        '- 优化：',
        '- 修复：',
        updateLogOptions.includeCompatibility ? '兼容性说明：' : '',
        updateLogOptions.includeAdvice ? '升级建议：' : ''
    ]
        .filter(Boolean)
        .join('\n')
    editorValue.value = plainTextToHtml(templateText)
    feedback.msgSuccess('更新日志模板已插入')
}

/**
 * 组件销毁前清理定时器
 */
onBeforeUnmount(() => {
    stopStream()
})
</script>

<style scoped>
.ai-editor-layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 460px;
    gap: 12px;
    align-items: start;
}

.ai-editor-layout__main {
    min-width: 0;
}

.ai-editor-layout__sidebar {
    min-width: 0;
    position: relative;
    align-self: start;
}

.ai-chat {
    border: 1px solid var(--el-border-color);
    border-radius: 12px;
    background: #fff;
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    position: sticky;
    top: 72px;
    height: calc(100vh - 90px);
    min-height: 640px;
    max-height: calc(100vh - 90px);
    overflow: hidden;
}

.ai-chat__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
}

.ai-chat__title-wrap {
    display: flex;
    flex-direction: column;
    gap: 2px;
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

.ai-chat__prompt-block {
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 10px;
    padding: 8px 10px;
    background: #fcfdff;
}

.ai-chat__prompt-title {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    margin-bottom: 6px;
}

.ai-chat__prompt-list {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
}

.ai-chat__prompt-item {
    cursor: pointer;
    user-select: none;
}

.ai-chat__update-tools {
    margin-bottom: 0;
}

.ai-chat__update-switches {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 2px;
}

.ai-chat__messages {
    border: 1px solid var(--el-border-color-light);
    border-radius: 10px;
    padding: 10px;
    min-height: 360px;
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

@media (max-width: 1200px) {
    .ai-editor-layout {
        grid-template-columns: 1fr;
    }

    .ai-editor-layout__sidebar {
        position: static;
    }

    .ai-chat {
        position: static;
        height: auto;
        min-height: 560px;
    }
}
</style>
