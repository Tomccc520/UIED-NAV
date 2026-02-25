<!--
/**
 * @copyright Tomda (https://www.tomda.top)
 * @copyright UIED技术团队 (https://fsuied.com)
 * @author UIED技术团队
 * @createDate 2026.1.27
 */
-->
<template>
    <div
        class="border border-br flex flex-col"
        :style="styles"
        :class="{ 'editor-auto-height': isAutoHeight }"
    >
        <toolbar
            class="border-b border-br"
            :editor="editorRef"
            :defaultConfig="toolbarDefaultConfig"
            :mode="mode"
        />
        <w-editor
            class="editor-content"
            :class="{ 'flex-1': !isAutoHeight }"
            v-model="valueHtml"
            :defaultConfig="editorDefaultConfig"
            :mode="mode"
            @onCreated="handleCreated"
        />
        <material-picker
            ref="materialPickerRef"
            :type="fileType"
            :limit="-1"
            hidden-upload
            @change="selectChange"
        />

        <teleport to="body">
            <div
                v-show="aiDialogVisible"
                class="editor-ai-float"
                :style="aiFloatStyles"
                @mousedown.stop
            >
                <div class="editor-ai-float__header" @mousedown.prevent="handleAiFloatDragStart">
                    <div class="editor-ai-float__title">
                        <span class="editor-ai-float__title-icon">AI</span>
                        <span>AI一下</span>
                    </div>
                    <el-button link type="primary" @mousedown.stop @click="handleAiDialogClosed">
                        关闭
                    </el-button>
                </div>

                <div class="editor-ai-float__body">
                    <el-form label-position="top">
                        <el-form-item label="选中文案">
                            <el-input
                                v-model="aiDialogSelectionText"
                                type="textarea"
                                :autosize="{ minRows: 4, maxRows: 14 }"
                                maxlength="4000"
                                show-word-limit
                                placeholder="请先在编辑器中选中要处理的文案"
                            />
                        </el-form-item>

                        <el-form-item label="AI操作">
                            <el-radio-group v-model="aiDialogTask" size="small">
                                <el-radio-button label="polish">润色</el-radio-button>
                                <el-radio-button label="expand">扩写</el-radio-button>
                                <el-radio-button label="title">生成标题</el-radio-button>
                            </el-radio-group>
                        </el-form-item>

                        <el-form-item label="补充要求（可选）">
                            <el-input
                                v-model="aiDialogPrompt"
                                type="textarea"
                                :autosize="{ minRows: 2, maxRows: 8 }"
                                maxlength="500"
                                show-word-limit
                                placeholder="例如：语气更专业、突出核心收益、控制在120字以内"
                            />
                        </el-form-item>

                        <div class="editor-ai-dialog__actions">
                            <el-button
                                type="primary"
                                :loading="aiDialogLoading"
                                @mousedown.prevent
                                @click="handleAiDialogGenerate"
                            >
                                生成文案
                            </el-button>
                            <span class="editor-ai-dialog__tips">
                                结果为纯文本，可直接插入或替换当前选中内容
                            </span>
                        </div>

                        <el-form-item label="AI结果">
                            <el-input
                                v-model="aiDialogResult"
                                type="textarea"
                                :autosize="{ minRows: 8, maxRows: 18 }"
                                maxlength="12000"
                                show-word-limit
                                placeholder="点击“生成文案”后在这里查看结果"
                            />
                        </el-form-item>
                    </el-form>

                    <div class="editor-ai-float__footer">
                        <el-space wrap>
                            <el-button @mousedown.prevent @click="handleAiDialogClosed"
                                >取消</el-button
                            >
                            <el-button
                                type="primary"
                                plain
                                @mousedown.prevent
                                @click="handleAiDialogInsert"
                            >
                                插入文案
                            </el-button>
                            <el-button
                                type="primary"
                                @mousedown.prevent
                                @click="handleAiDialogReplaceSelection"
                            >
                                替换当前选中
                            </el-button>
                        </el-space>
                    </div>
                </div>
            </div>
        </teleport>
    </div>
</template>
<script setup lang="ts">
import '@wangeditor/editor/dist/css/style.css' // 引入 css
import { fetchEventSource } from '@microsoft/fetch-event-source'
import { Boot } from '@wangeditor/editor'
import { Editor as WEditor, Toolbar } from '@wangeditor/editor-for-vue'
import type { IEditorConfig, IToolbarConfig } from '@wangeditor/editor'
import MaterialPicker from '@/components/material/picker.vue'
import appConfig from '@/config'
import { addUnit } from '@/utils/util'
import type { CSSProperties } from 'vue'
import feedback from '@/utils/feedback'
import { aiEditorGenerate } from '@/api/ai/editor'
import useUserStore from '@/stores/modules/user'

type AiToolbarTask = 'polish' | 'expand' | 'title'

const AI_TOOLBAR_MENU_KEYS = ['aiSelectionDialogMenu']
const AI_TOOLBAR_REGISTER_FLAG = '__aiToolbarMenusRegistered'
const AI_TOOLBAR_HANDLER_FLAG = '__aiToolbarSelectionHandler'
const AI_TOOLBAR_ICON_SVG =
    '<svg viewBox="0 0 1024 1024"><path d="M512 64l67.2 211.2L800 342.4l-176 134.4L691.2 704 512 576 332.8 704 400 476.8 224 342.4l220.8-67.2L512 64zm-320 576h128v128H192V640zm512 128h128v128H704V768z"/></svg>'
const AI_FLOAT_WIDTH = 560
const AI_FLOAT_MARGIN = 16
const AI_STREAM_DONE_FLAG = '[DONE]'
const PASTE_IMAGE_MAX_FILES = 12

/**
 * 构建 AI 工具栏菜单配置
 */
const createAiToolbarMenu = (key: string, title: string) => {
    return {
        key,
        factory() {
            return {
                title,
                iconSvg: AI_TOOLBAR_ICON_SVG,
                tag: 'button',
                getValue() {
                    return ''
                },
                isActive() {
                    return false
                },
                isDisabled(editor: any) {
                    return !String(editor?.getSelectionText?.() || '').trim()
                },
                exec(editor: any) {
                    const globalWindow = window as any
                    const handler = globalWindow[AI_TOOLBAR_HANDLER_FLAG]
                    if (typeof handler === 'function') {
                        handler(editor)
                    }
                }
            }
        }
    }
}

/**
 * 注册 AI 工具栏菜单
 */
const ensureAiToolbarMenusRegistered = () => {
    const globalWindow = window as any
    if (globalWindow[AI_TOOLBAR_REGISTER_FLAG]) return
    Boot.registerMenu(createAiToolbarMenu('aiSelectionDialogMenu', 'AI一下') as any)
    globalWindow[AI_TOOLBAR_REGISTER_FLAG] = true
}

const props = withDefaults(
    defineProps<{
        modelValue?: string
        mode?: 'default' | 'simple'
        height?: string | number
        minHeight?: string | number
        width?: string | number
        toolbarConfig?: Partial<IToolbarConfig>
        enableAiTools?: boolean
        aiScene?: string
        aiTitle?: string
        aiVersion?: string
        aiDate?: string
        aiContext?: Record<string, any>
    }>(),
    {
        modelValue: '',
        mode: 'default',
        height: '100%',
        // 当 height=auto 时用于兜底最小高度，避免空内容塌陷
        minHeight: 560,
        width: 'auto',
        toolbarConfig: () => ({}),
        enableAiTools: false,
        aiScene: 'general',
        aiTitle: '',
        aiVersion: '',
        aiDate: '',
        aiContext: () => ({})
    }
)

const emit = defineEmits<{
    (event: 'update:modelValue', value: string): void
}>()

const userStore = useUserStore()
const editorRef = shallowRef()
const materialPickerRef = shallowRef<InstanceType<typeof MaterialPicker>>()
const fileType = ref('')

let insertFn: any
const aiToolbarLoading = ref(false)
const aiDialogVisible = ref(false)
const aiDialogLoading = ref(false)
const aiDialogStreamController = shallowRef<AbortController | null>(null)
const aiDialogTask = ref<AiToolbarTask>('polish')
const aiDialogPrompt = ref('')
const aiDialogSelectionText = ref('')
const aiDialogResult = ref('')
const aiDialogEditorRef = shallowRef<any>(null)
const aiDialogSelectionRange = shallowRef<any>(null)
const aiDialogReplaceRange = shallowRef<any>(null)
const aiFloatPosition = reactive({
    top: 120,
    left: 24
})
const aiFloatDragging = ref(false)
const aiFloatDragOffset = reactive({
    x: 0,
    y: 0
})
const aiSelectionSyncing = ref(false)

const toolbarDefaultConfig = computed<Partial<IToolbarConfig>>(() => {
    return { ...(props.toolbarConfig || {}) }
})

const editorConfig: Partial<IEditorConfig> = {
    MENU_CONF: {
        uploadImage: {
            customBrowseAndUpload(insert: any) {
                fileType.value = 'image'
                materialPickerRef.value?.showPopup(-1)
                insertFn = insert
            }
        },
        uploadVideo: {
            customBrowseAndUpload(insert: any) {
                fileType.value = 'video'
                materialPickerRef.value?.showPopup(-1)
                insertFn = insert
            }
        }
    }
}

const editorDefaultConfig = computed<Partial<IEditorConfig>>(() => {
    const config: Partial<IEditorConfig> = {
        ...editorConfig,
        customPaste: handleEditorCustomPaste as any,
        MENU_CONF: {
            ...(editorConfig.MENU_CONF || {})
        }
    }
    if (!props.enableAiTools || props.mode === 'simple') {
        return config
    }
    const baseHoverbar = ((Boot.editorConfig as any)?.hoverbarKeys || {}) as Record<string, any>
    const textMenuKeys = Array.isArray(baseHoverbar?.text?.menuKeys)
        ? baseHoverbar.text.menuKeys
        : []
    config.hoverbarKeys = {
        ...baseHoverbar,
        text: {
            ...(baseHoverbar?.text || {}),
            menuKeys: Array.from(new Set([...textMenuKeys, ...AI_TOOLBAR_MENU_KEYS]))
        }
    }
    return config
})

/**
 * 编辑器容器样式（auto 高度时提供 minHeight，避免空内容塌陷）
 */
const styles = computed<CSSProperties>(() => ({
    height: addUnit(props.height),
    width: addUnit(props.width),
    ...(isAutoHeight.value ? { minHeight: addUnit(props.minHeight) } : {})
}))
const isAutoHeight = computed(() => String(props.height).toLowerCase() === 'auto')

const aiFloatStyles = computed<CSSProperties>(() => ({
    top: `${aiFloatPosition.top}px`,
    left: `${aiFloatPosition.left}px`,
    width: `${AI_FLOAT_WIDTH}px`,
    zIndex: 2100
}))

const valueHtml = computed({
    get() {
        return props.modelValue
    },
    set(value) {
        emit('update:modelValue', value)
    }
})

/**
 * 停止 AI 流式请求
 */
const stopAiDialogStream = () => {
    if (!aiDialogStreamController.value) return
    aiDialogStreamController.value.abort()
    aiDialogStreamController.value = null
}

/**
 * 解析编辑器流式请求地址
 */
const resolveEditorStreamUrl = () => {
    const rawBase = String(import.meta.env.VITE_APP_BASE_URL || '')
        .trim()
        .replace(/^['"]|['"]$/g, '')
    const base = /^https?:\/\//i.test(rawBase) ? rawBase : window.location.origin
    return new URL('/api/ai/chat/completions/editor', base).toString()
}

/**
 * 发起 AI 流式请求并持续写入结果
 */
const requestAiDialogStream = async (
    payload: Record<string, any>,
    onChunk: (chunk: string) => void
) => {
    const token = String(userStore.token || '')
    const url = resolveEditorStreamUrl()
    aiDialogStreamController.value = new AbortController()
    let chunkCount = 0

    await fetchEventSource(url, {
        method: 'POST',
        signal: aiDialogStreamController.value.signal,
        headers: {
            'Content-Type': 'application/json',
            Accept: 'text/event-stream',
            token
        },
        body: JSON.stringify({
            ...payload,
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
            if (!event.data || event.data === AI_STREAM_DONE_FLAG) return
            try {
                const payloadData = JSON.parse(event.data)
                const delta = payloadData?.choices?.[0]?.delta || {}
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
                const chunk = normalizeChunk(contentRaw) || normalizeChunk(reasoningRaw)
                if (!chunk) return
                chunkCount += 1
                onChunk(chunk)
            } catch (error) {
                console.warn('[editor] stream chunk parse failed:', error)
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
 * 解析图片上传接口地址
 */
const resolveUploadImageUrl = () => {
    const rawBase = String(import.meta.env.VITE_APP_BASE_URL || '')
        .trim()
        .replace(/^['"]|['"]$/g, '')
    const base = /^https?:\/\//i.test(rawBase) ? rawBase : window.location.origin
    return new URL('/api/common/upload/image', base).toString()
}

/**
 * 将网络或剪贴板图片上传到素材库
 */
const uploadImageToMaterial = async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('cid', '0')
    const response = await fetch(resolveUploadImageUrl(), {
        method: 'POST',
        headers: {
            token: String(userStore.token || ''),
            version: String(appConfig.version || '')
        },
        body: formData
    })
    if (!response.ok) {
        throw new Error(`图片上传失败(${response.status})`)
    }
    const result = await response.json()
    const code = Number(result?.code || 0)
    if (code !== 200) {
        throw new Error(String(result?.msg || '图片上传失败'))
    }
    return String(result?.data?.path || '')
}

/**
 * 标准化粘贴图片地址
 */
const normalizePastedImageSrc = (value: string) => {
    const src = String(value || '').trim()
    if (!src) return ''
    if (/^\/\//.test(src)) {
        return `https:${src}`
    }
    return src
}

/**
 * 读取剪贴板中的图片文件
 */
const getClipboardImageFiles = (event: ClipboardEvent) => {
    const items = Array.from(event?.clipboardData?.items || [])
    return items
        .filter((item) => item.kind === 'file' && String(item.type || '').startsWith('image/'))
        .map((item) => item.getAsFile())
        .filter((item): item is File => Boolean(item))
        .slice(0, PASTE_IMAGE_MAX_FILES)
}

/**
 * 上传剪贴板图片并返回可访问地址
 */
const uploadClipboardImageFiles = async (files: File[]) => {
    const urls: string[] = []
    for (let index = 0; index < files.length; index += 1) {
        const file = files[index]
        if (!file) continue
        const url = await uploadImageToMaterial(file)
        if (url) {
            urls.push(url)
        }
    }
    return urls
}

/**
 * 处理公众号等来源粘贴 HTML 的图片节点
 */
const normalizePastedHtmlWithImages = (html: string) => {
    const parser = new DOMParser()
    const documentNode = parser.parseFromString(String(html || ''), 'text/html')
    const imageNodes = Array.from(documentNode.querySelectorAll('img'))
    imageNodes.forEach((node) => {
        const rawSrc =
            node.getAttribute('data-src') ||
            node.getAttribute('data-original') ||
            node.getAttribute('data-actualsrc') ||
            node.getAttribute('src') ||
            ''
        const source = normalizePastedImageSrc(rawSrc)
        if (!source) {
            node.remove()
            return
        }
        node.setAttribute('src', source)
        node.removeAttribute('srcset')
        node.removeAttribute('data-src')
        node.removeAttribute('data-original')
        node.removeAttribute('data-actualsrc')
    })
    return String(documentNode.body?.innerHTML || '').trim()
}

/**
 * 在编辑器光标处插入 HTML
 */
const insertHtmlAtCursor = (editor: any, html: string) => {
    const value = String(html || '').trim()
    if (!value) return false
    if (editor?.insertHtml) {
        editor.insertHtml(value)
        return true
    }
    if (editor?.dangerouslyInsertHtml) {
        editor.dangerouslyInsertHtml(value)
        return true
    }
    return false
}

/**
 * 在编辑器光标处插入多张图片
 */
const insertImageUrlsAtCursor = (editor: any, imageUrls: string[]) => {
    const validUrls = imageUrls.filter(Boolean)
    if (!validUrls.length) return false
    const imageHtml = validUrls
        .map((url) => `<p><img src="${String(url).replace(/"/g, '&quot;')}" /></p>`)
        .join('')
    return insertHtmlAtCursor(editor, imageHtml)
}

/**
 * 自定义粘贴逻辑：保留公众号图片并支持粘贴图片自动入库
 */
const handleEditorCustomPaste = (editor: any, event: ClipboardEvent, callback: any) => {
    const clipboardData = event?.clipboardData
    if (!clipboardData) {
        callback(true)
        return
    }
    const html = String(clipboardData.getData('text/html') || '')
    const plainText = String(clipboardData.getData('text/plain') || '')
    const imageFiles = getClipboardImageFiles(event)
    const hasImageInHtml = /<img[\s\S]*?>/i.test(html)
    const shouldHandle = hasImageInHtml || imageFiles.length > 0
    if (!shouldHandle) {
        callback(true)
        return
    }
    callback(false)
    event.preventDefault?.()
    ;(async () => {
        try {
            let hasInserted = false
            if (hasImageInHtml) {
                const normalizedHtml = normalizePastedHtmlWithImages(html)
                if (normalizedHtml) {
                    hasInserted = insertHtmlAtCursor(editor, normalizedHtml)
                }
            }
            if (imageFiles.length > 0) {
                const urls = await uploadClipboardImageFiles(imageFiles)
                if (urls.length > 0) {
                    hasInserted = insertImageUrlsAtCursor(editor, urls) || hasInserted
                    feedback.msgSuccess(`已上传并插入 ${urls.length} 张图片`)
                }
            }
            if (!hasInserted && plainText.trim()) {
                editor?.insertText?.(plainText)
            }
        } catch (error: any) {
            console.warn('[editor] custom paste failed:', error)
            const fallbackText = plainText.trim()
            if (fallbackText) {
                editor?.insertText?.(fallbackText)
            }
            feedback.msgWarning('检测到图片粘贴异常，请尝试先上传素材库后再插入')
        }
    })()
}

/**
 * 清理 AI 返回文本
 */
const normalizeAiText = (value: string) => {
    return String(value || '')
        .replace(/\r\n/g, '\n')
        .replace(/```[\w-]*\n?/g, '')
        .replace(/```/g, '')
        .trim()
}

/**
 * 处理 AI 标题文本
 */
const normalizeTitleText = (value: string) => {
    return String(value || '')
        .replace(/<[^>]+>/g, '')
        .replace(/[“”"']/g, '')
        .split(/[\n。]+/)[0]
        .trim()
}

/**
 * 限制浮窗在可视区域内
 */
const clampAiFloatPosition = (left: number, top: number) => {
    const viewportWidth = window.innerWidth || 1280
    const viewportHeight = window.innerHeight || 720
    const maxLeft = Math.max(AI_FLOAT_MARGIN, viewportWidth - AI_FLOAT_WIDTH - AI_FLOAT_MARGIN)
    const maxTop = Math.max(AI_FLOAT_MARGIN, viewportHeight - 180)
    return {
        left: Math.min(Math.max(left, AI_FLOAT_MARGIN), maxLeft),
        top: Math.min(Math.max(top, AI_FLOAT_MARGIN), maxTop)
    }
}

/**
 * 设置浮窗坐标
 */
const setAiFloatPosition = (left: number, top: number) => {
    const nextPos = clampAiFloatPosition(left, top)
    aiFloatPosition.left = nextPos.left
    aiFloatPosition.top = nextPos.top
}

/**
 * 根据选区计算浮窗初始位置
 */
const locateAiFloatBySelection = () => {
    try {
        const selection = window.getSelection?.()
        if (selection && selection.rangeCount > 0) {
            const rect = selection.getRangeAt(0).getBoundingClientRect()
            setAiFloatPosition(rect.right + 16, rect.top + 8)
            return
        }
    } catch (error) {
        console.warn('[editor] locate float by selection failed:', error)
    }
    const fallbackLeft = (window.innerWidth || 1280) - AI_FLOAT_WIDTH - 24
    setAiFloatPosition(fallbackLeft, 120)
}

/**
 * 获取编辑器可编辑容器节点
 */
const getEditorContainerElement = (editor: any): HTMLElement | null => {
    const container = editor?.getEditableContainer?.()
    if (!container) return null
    if (container instanceof HTMLElement) return container
    if (container?.[0] instanceof HTMLElement) return container[0]
    if (typeof container?.get === 'function') {
        const el = container.get(0)
        if (el instanceof HTMLElement) return el
    }
    return null
}

/**
 * 判断当前浏览器选区是否位于编辑器内
 */
const isSelectionInsideEditor = (editor: any) => {
    const root = getEditorContainerElement(editor)
    if (!root) return false
    const selection = window.getSelection?.()
    const anchorNode = selection?.anchorNode || null
    const focusNode = selection?.focusNode || null
    if (!anchorNode && !focusNode) return false
    if (anchorNode && root.contains(anchorNode)) return true
    if (focusNode && root.contains(focusNode)) return true
    return false
}

/**
 * 同步编辑器当前选区快照（支持二次选中与光标定位）
 */
const syncSelectionSnapshotFromEditor = (editor: any, allowCollapsed = false) => {
    if (!editor) return false
    if (!isSelectionInsideEditor(editor) && !editor?.isFocused?.()) {
        return false
    }
    const range = cloneSelectionRange(editor.selection)
    if (!range) return false
    const selectedText = String(editor?.getSelectionText?.() || '')
    const hasSelectedText = Boolean(selectedText.trim())
    if (!allowCollapsed && !hasSelectedText) {
        return false
    }
    aiDialogSelectionRange.value = range
    if (hasSelectedText) {
        aiDialogReplaceRange.value = range
        aiDialogSelectionText.value = selectedText
    }
    return true
}

/**
 * 构建 AI 附加要求
 */
const buildAiExtraRequirements = (task: AiToolbarTask, customPrompt: string) => {
    const requirementMap: Record<AiToolbarTask, string> = {
        polish: '请仅润色选中文案，保持原意，直接输出可替换文本。请只输出纯文本，不要 Markdown 代码块。',
        expand: '请在原意基础上扩写选中文案，增强细节，直接输出可替换文本。请只输出纯文本，不要 Markdown 代码块。',
        title: '请基于选中文案生成1个中文标题，不超过24字，不要解释。请只输出纯文本，不要 Markdown 代码块。'
    }
    const prompt = String(customPrompt || '').trim()
    if (!prompt) return requirementMap[task]
    return `${requirementMap[task]} ${prompt}`
}

/**
 * 深拷贝当前选区，避免后续引用变化
 */
const cloneSelectionRange = (range: any) => {
    if (!range) return null
    try {
        return JSON.parse(JSON.stringify(range))
    } catch (error) {
        console.warn('[editor] clone selection range failed:', error)
        return null
    }
}

/**
 * 判断选区是否折叠（无有效选中内容）
 */
const isRangeCollapsed = (range: any) => {
    if (!range?.anchor || !range?.focus) return true
    const anchorPath = Array.isArray(range.anchor.path) ? range.anchor.path : null
    const focusPath = Array.isArray(range.focus.path) ? range.focus.path : null
    if (!anchorPath || !focusPath) return true
    const samePath = JSON.stringify(anchorPath) === JSON.stringify(focusPath)
    const sameOffset = Number(range.anchor.offset || 0) === Number(range.focus.offset || 0)
    return samePath && sameOffset
}

/**
 * 打开“AI一下”浮窗
 */
const openAiDialog = (editor: any) => {
    if (aiToolbarLoading.value || aiDialogLoading.value) return
    const selectedText = String(editor?.getSelectionText?.() || '').trim()
    if (!selectedText) {
        feedback.msgWarning('请先在编辑器内选中文案')
        return
    }
    aiDialogEditorRef.value = editor
    aiDialogSelectionRange.value = cloneSelectionRange(editor?.selection)
    aiDialogReplaceRange.value = cloneSelectionRange(editor?.selection)
    aiDialogSelectionText.value = selectedText
    aiDialogTask.value = 'polish'
    aiDialogPrompt.value = ''
    aiDialogResult.value = ''
    locateAiFloatBySelection()
    aiDialogVisible.value = true
    aiSelectionSyncing.value = true
}

/**
 * 触发 AI 文案生成
 */
const handleAiDialogGenerate = async () => {
    if (aiToolbarLoading.value || aiDialogLoading.value) return
    const selectedText = String(aiDialogSelectionText.value || '').trim()
    if (!selectedText) {
        feedback.msgWarning('请填写或粘贴需要处理的文案')
        return
    }
    aiToolbarLoading.value = true
    aiDialogLoading.value = true
    aiDialogResult.value = ''
    const requestPayload = {
        scene: String(props.aiScene || 'general'),
        mode: aiDialogTask.value === 'polish' ? 'polish' : 'replace',
        outputFormat: 'text',
        title: String(props.aiTitle || '').trim(),
        version: String(props.aiVersion || '').trim(),
        date: String(props.aiDate || '').trim(),
        tone: '专业、简洁',
        audience: '业务用户',
        extraRequirements: buildAiExtraRequirements(aiDialogTask.value, aiDialogPrompt.value),
        changePoints: [],
        content: selectedText,
        context: props.aiContext || {}
    }
    try {
        let streamedDraft = ''
        try {
            const chunkCount = await requestAiDialogStream(requestPayload, (chunk: string) => {
                streamedDraft += chunk
                aiDialogResult.value = streamedDraft
            })
            if (chunkCount > 0) {
                let streamResult = normalizeAiText(streamedDraft)
                if (aiDialogTask.value === 'title') {
                    streamResult = normalizeTitleText(streamResult)
                }
                if (!streamResult) {
                    feedback.msgWarning('AI 未返回可用内容，请重试')
                    return
                }
                aiDialogResult.value = streamResult
                if (chunkCount <= 1) {
                    console.warn('[editor] ai dialog stream returned single chunk')
                }
                feedback.msgSuccess('AI 文案已流式生成，可直接插入或替换当前选中内容')
                return
            }
        } catch (streamError: any) {
            if (String(streamError?.name || '') !== 'AbortError') {
                console.warn(
                    '[editor] ai dialog stream failed, fallback to non-stream:',
                    streamError
                )
                feedback.msgWarning('当前环境流式未生效，已自动降级为普通输出')
            }
        } finally {
            aiDialogStreamController.value = null
        }

        const data = await aiEditorGenerate(requestPayload)
        let result = normalizeAiText(String(data?.draft || ''))
        if (aiDialogTask.value === 'title') {
            result = normalizeTitleText(result)
        }
        if (!result) {
            feedback.msgWarning('AI 未返回可用内容，请重试')
            return
        }
        aiDialogResult.value = result
        feedback.msgSuccess('AI 文案已生成，可直接插入或替换当前选中内容')
    } catch (error: any) {
        if (String(error?.name || '') !== 'AbortError') {
            feedback.msgError(error?.message || 'AI 处理失败，请稍后重试')
        }
    } finally {
        stopAiDialogStream()
        aiToolbarLoading.value = false
        aiDialogLoading.value = false
    }
}

/**
 * 将结果写入编辑器
 */
const insertAiResultToEditor = (editor: any, result: string) => {
    if (editor?.insertText) {
        editor.insertText(result)
        return true
    }
    if (editor?.insertHtml) {
        editor.insertHtml(result)
        return true
    }
    if (editor?.dangerouslyInsertHtml) {
        editor.dangerouslyInsertHtml(result)
        return true
    }
    return false
}

/**
 * 恢复浮窗打开前的选区
 */
const restoreAiSelectionRange = (editor: any, mode: 'cursor' | 'replace' = 'cursor') => {
    const sourceRange =
        mode === 'replace' ? aiDialogReplaceRange.value : aiDialogSelectionRange.value
    const range = cloneSelectionRange(sourceRange)
    if (!range) {
        if (mode === 'replace') {
            return false
        }
        if (typeof editor?.restoreSelection === 'function') {
            editor.restoreSelection()
            editor.focus?.()
            return true
        }
        return false
    }
    try {
        if (typeof editor?.select === 'function') {
            editor.select(range)
            editor.focus?.()
            return true
        }
        if (editor && 'selection' in editor) {
            editor.selection = range
            editor.focus?.()
            return true
        }
        return false
    } catch (error) {
        console.warn('[editor] restore selection range failed:', error)
        return false
    }
}

/**
 * 更新选区快照（浏览器选区变更监听）
 */
const handleAiSelectionChange = () => {
    if (!aiDialogVisible.value || !aiSelectionSyncing.value) return
    const editor = aiDialogEditorRef.value
    if (!editor) return
    syncSelectionSnapshotFromEditor(editor, true)
}

/**
 * 替换选中内容（强校验，避免追加到底部）
 */
const replaceSelectionWithResult = (editor: any, result: string) => {
    const restored = restoreAiSelectionRange(editor, 'replace')
    if (!restored) {
        feedback.msgWarning('未恢复到原选区，请重新选中后再点“AI一下”')
        return false
    }
    const currentRange = cloneSelectionRange(editor?.selection)
    if (isRangeCollapsed(currentRange)) {
        feedback.msgWarning('当前没有有效选区，已阻止追加到底部')
        return false
    }
    if (typeof editor?.deleteFragment === 'function') {
        editor.deleteFragment()
    }
    if (!insertAiResultToEditor(editor, result)) {
        feedback.msgWarning('替换失败，请重试')
        return false
    }
    return true
}

/**
 * 注销浮窗拖拽监听
 */
const removeAiFloatDragEvents = () => {
    document.removeEventListener('mousemove', handleAiFloatDragging)
    document.removeEventListener('mouseup', handleAiFloatDragEnd)
}

/**
 * 浮窗拖拽开始
 */
const handleAiFloatDragStart = (event: MouseEvent) => {
    if (!aiDialogVisible.value) return
    aiFloatDragging.value = true
    aiFloatDragOffset.x = event.clientX - aiFloatPosition.left
    aiFloatDragOffset.y = event.clientY - aiFloatPosition.top
    document.addEventListener('mousemove', handleAiFloatDragging)
    document.addEventListener('mouseup', handleAiFloatDragEnd)
}

/**
 * 浮窗拖拽中
 */
const handleAiFloatDragging = (event: MouseEvent) => {
    if (!aiFloatDragging.value) return
    const left = event.clientX - aiFloatDragOffset.x
    const top = event.clientY - aiFloatDragOffset.y
    setAiFloatPosition(left, top)
}

/**
 * 浮窗拖拽结束
 */
const handleAiFloatDragEnd = () => {
    aiFloatDragging.value = false
    removeAiFloatDragEvents()
}

/**
 * 执行插入文案
 */
const handleAiDialogInsert = () => {
    const result = normalizeAiText(String(aiDialogResult.value || ''))
    if (!result) {
        feedback.msgWarning('请先生成 AI 结果')
        return
    }
    const editor = aiDialogEditorRef.value
    if (!editor) {
        feedback.msgWarning('编辑器实例不可用，请关闭后重试')
        return
    }
    syncSelectionSnapshotFromEditor(editor, true)
    const restored = restoreAiSelectionRange(editor)
    if (!restored) {
        feedback.msgWarning('未捕获到光标位置，请先在编辑器内点击定位')
        return
    }
    if (!insertAiResultToEditor(editor, result)) {
        feedback.msgWarning('插入失败，请重试')
        return
    }
    feedback.msgSuccess('AI 文案已插入编辑器')
}

/**
 * 执行替换选中文案
 */
const handleAiDialogReplaceSelection = () => {
    const result = normalizeAiText(String(aiDialogResult.value || ''))
    if (!result) {
        feedback.msgWarning('请先生成 AI 结果')
        return
    }
    const editor = aiDialogEditorRef.value
    if (!editor) {
        feedback.msgWarning('编辑器实例不可用，请关闭后重试')
        return
    }
    syncSelectionSnapshotFromEditor(editor, false)
    if (!replaceSelectionWithResult(editor, result)) {
        return
    }
    feedback.msgSuccess('已替换当前选中文案')
}

/**
 * 处理 AI hover 菜单点击
 */
const handleAiToolbarSelection = (editor: any) => {
    openAiDialog(editor)
}

/**
 * 清理 AI 浮窗状态
 */
const handleAiDialogClosed = () => {
    stopAiDialogStream()
    aiDialogVisible.value = false
    aiFloatDragging.value = false
    aiSelectionSyncing.value = false
    aiDialogTask.value = 'polish'
    aiDialogPrompt.value = ''
    aiDialogResult.value = ''
    aiDialogSelectionText.value = ''
    aiDialogEditorRef.value = null
    aiDialogSelectionRange.value = null
    aiDialogReplaceRange.value = null
    removeAiFloatDragEvents()
}

/**
 * 处理素材库选择结果
 */
const selectChange = (fileUrl: string[]) => {
    const fileUrls = Array.isArray(fileUrl) ? fileUrl : [fileUrl]
    fileUrls.filter(Boolean).forEach((url) => {
        if (fileType.value === 'video') {
            // uploadVideo 的 customBrowseAndUpload 回调签名为 (src, poster)
            insertFn(url, '')
            return
        }
        insertFn(url)
    })
}

/**
 * 注册选区监听
 */
const registerSelectionChangeListener = () => {
    document.addEventListener('selectionchange', handleAiSelectionChange)
}

/**
 * 注销选区监听
 */
const unregisterSelectionChangeListener = () => {
    document.removeEventListener('selectionchange', handleAiSelectionChange)
}

watch(
    () => aiDialogVisible.value,
    (visible) => {
        if (visible) {
            registerSelectionChangeListener()
            return
        }
        unregisterSelectionChangeListener()
    }
)

onBeforeUnmount(() => {
    stopAiDialogStream()
    unregisterSelectionChangeListener()
    removeAiFloatDragEvents()
    const editor = editorRef.value
    if (editor == null) return
    try {
        editor.destroy()
    } catch (error) {
        // 编辑器销毁偶发抛错时兜底，避免影响页面其它逻辑
        console.warn('[editor] destroy failed:', error)
    } finally {
        editorRef.value = null
    }
})

/**
 * 编辑器创建完成后挂载桥接能力
 */
const handleCreated = (editor: any) => {
    editorRef.value = editor
    const globalWindow = window as any
    globalWindow[AI_TOOLBAR_HANDLER_FLAG] = handleAiToolbarSelection
    const bridge = {
        getHtml: () => editor.getHtml?.() || '',
        getText: () => editor.getText?.() || '',
        getSelectionText: () => {
            if (editor.getSelectionText) {
                return String(editor.getSelectionText() || '')
            }
            return String(window.getSelection?.()?.toString() || '')
        },
        focus: () => {
            if (editor.focus) {
                editor.focus()
            }
        },
        setHtml: (value: string) => editor.setHtml?.(value),
        insertHtml: (value: string) => {
            if (editor.insertHtml) {
                editor.insertHtml(value)
                return
            }
            if (editor.dangerouslyInsertHtml) {
                editor.dangerouslyInsertHtml(value)
                return
            }
            if (editor.insertText) {
                editor.insertText(value)
            }
        },
        insertText: (value: string) => {
            if (editor.insertText) {
                editor.insertText(value)
                return
            }
            if (editor.insertHtml) {
                editor.insertHtml(value)
                return
            }
            if (editor.dangerouslyInsertHtml) {
                editor.dangerouslyInsertHtml(value)
            }
        },
        replaceSelectionHtml: (value: string) => {
            const html = String(value || '').trim()
            if (!html) return false
            if (!syncSelectionSnapshotFromEditor(editor, false)) {
                feedback.msgWarning('请先在正文中选中要替换的文案')
                return false
            }
            const restored = restoreAiSelectionRange(editor, 'replace')
            if (!restored || isRangeCollapsed(editor?.selection)) {
                feedback.msgWarning('请先在正文中选中要替换的文案')
                return false
            }
            if (typeof editor?.deleteFragment === 'function') {
                editor.deleteFragment()
            }
            if (editor.insertHtml) {
                editor.insertHtml(html)
                return true
            }
            if (editor.dangerouslyInsertHtml) {
                editor.dangerouslyInsertHtml(html)
                return true
            }
            if (editor.insertText) {
                editor.insertText(html)
                return true
            }
            return false
        },
        replaceSelectionText: (value: string) => {
            const text = String(value || '')
            if (!text.trim()) return false
            syncSelectionSnapshotFromEditor(editor, false)
            if (!replaceSelectionWithResult(editor, text)) {
                return false
            }
            return true
        }
    }
    globalWindow.__aiAssistantEditor = bridge
    if (editor.on) {
        editor.on('focus', () => {
            globalWindow.__aiAssistantEditor = bridge
        })
    }
}

onMounted(() => {
    if (!props.enableAiTools) return
    ensureAiToolbarMenusRegistered()
})
</script>

<style lang="scss">
.w-e-full-screen-container {
    z-index: 999;
}
.w-e-text-container [data-slate-editor] ul {
    list-style: disc;
}
.w-e-text-container [data-slate-editor] ol {
    list-style: decimal;
}
h1 {
    font-size: 2em;
}
h2 {
    font-size: 1.5em;
}
h3 {
    font-size: 1.17em;
}
h4 {
    font-size: 1em;
}
h5 {
    font-size: 0.83em;
}
h1,
h2,
h3,
h4,
h5 {
    font-weight: bold;
}
.editor-ai-dialog__actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
}
.editor-ai-dialog__tips {
    font-size: 12px;
    color: #909399;
}
.editor-ai-float {
    position: fixed;
    border: 1px solid #dcdfe6;
    border-radius: 10px;
    background: #fff;
    box-shadow: 0 10px 30px rgb(0 0 0 / 16%);
}
.editor-ai-float__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 14px;
    border-bottom: 1px solid #ebeef5;
    cursor: move;
    user-select: none;
}
.editor-ai-float__title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
    color: #303133;
}
.editor-ai-float__title-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 20px;
    height: 20px;
    border-radius: 999px;
    background: #ecf5ff;
    color: #409eff;
    font-size: 11px;
    line-height: 1;
    padding: 0 6px;
}
.editor-ai-float__body {
    padding: 12px 14px 14px;
}
.editor-ai-float__footer {
    display: flex;
    justify-content: flex-end;
    margin-top: 8px;
}

.editor-auto-height {
    height: auto !important;
}

.editor-auto-height .editor-content {
    flex: none;
}

.editor-auto-height .w-e-text-container,
.editor-auto-height .w-e-scroll {
    height: auto !important;
    overflow: visible !important;
}
</style>
