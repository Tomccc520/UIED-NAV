<template>
    <div ref="editorWrapRef" class="border border-br flex flex-col" :style="styles">
        <toolbar
            class="border-b border-br"
            :editor="editorRef"
            :defaultConfig="mergedToolbarConfig"
            :mode="mode"
        />
        <w-editor
            class="overflow-y-auto flex-1"
            v-model="valueHtml"
            :defaultConfig="editorConfig"
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
    </div>
</template>
<script setup lang="ts">
import '@wangeditor/editor/dist/css/style.css' // 引入 css
import { Editor as WEditor, Toolbar } from '@wangeditor/editor-for-vue'
import type { IEditorConfig, IToolbarConfig, IDomEditor } from '@wangeditor/editor'
import { Boot } from '@wangeditor/editor'
import MaterialPicker from '@/components/material/picker.vue'
import { addUnit } from '@/utils/util'
import type { CSSProperties } from 'vue'

const props = withDefaults(
    defineProps<{
        modelValue?: string
        mode?: 'default' | 'simple'
        height?: string | number
        width?: string | number
        toolbarConfig?: Partial<IToolbarConfig>
    }>(),
    {
        modelValue: '',
        mode: 'default',
        height: '100%',
        width: 'auto',
        toolbarConfig: () => ({})
    }
)

const emit = defineEmits<{
    (event: 'update:modelValue', value: string): void
}>()

// 编辑器实例，必须用 shallowRef
const editorRef = shallowRef()
const editorWrapRef = ref<HTMLElement | null>(null)
const materialPickerRef = shallowRef<InstanceType<typeof MaterialPicker>>()
const fileType = ref('')
const isFirefoxBrowser =
    typeof window !== 'undefined' && /firefox/i.test(window.navigator.userAgent || '')
const localHtml = ref('')
const isComposing = ref(false)
let editableDomEl: HTMLElement | null = null

let insertFn: any

// 注册 AI 悬浮菜单按钮（只注册一次）
let aiMenuRegistered = false
/**
 * 注册 AI 悬浮菜单（Firefox 下关闭，避免 Slate + hoverbar 在中文输入法下出现 DOM 同步异常）
 */
function registerAiHoverMenu() {
    if (isFirefoxBrowser) return
    if (aiMenuRegistered) return
    aiMenuRegistered = true

    class AiHoverMenu {
        title = 'AI'
        tag = 'button'
        iconSvg =
            '<svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>'

        isActive() {
            return false
        }
        getValue() {
            return ''
        }
        isDisabled(editor: IDomEditor) {
            return !editor.getSelectionText()
        }

        exec(editor: IDomEditor) {
            const selectedText = editor.getSelectionText()
            if (!selectedText) return

            // 触发自定义事件，由外部处理 AI 逻辑
            const event = new CustomEvent('wangeditor-ai-hover', {
                detail: { text: selectedText, editor }
            })
            window.dispatchEvent(event)
        }
    }

    const aiMenuConf = {
        key: 'aiHoverMenu',
        factory() {
            return new AiHoverMenu()
        }
    }

    try {
        Boot.registerMenu(aiMenuConf)
    } catch (e) {
        // 已注册则忽略
    }
}

registerAiHoverMenu()

// 合并 toolbar 配置，将 AI 按钮加入 hoverbar
const mergedToolbarConfig = computed<Partial<IToolbarConfig>>(() => {
    return {
        ...props.toolbarConfig
    }
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
    },
    // Firefox + 中文输入法场景下，悬浮菜单更新容易触发 Slate DOM 点位异常，这里做兼容降级
    hoverbarKeys: isFirefoxBrowser
        ? {}
        : {
              // 选中文本时的悬浮菜单
              text: {
                  menuKeys: [
                      'headerSelect',
                      'bold',
                      'italic',
                      'underline',
                      'through',
                      'color',
                      'bgColor',
                      'insertLink',
                      'aiHoverMenu'
                  ]
              }
          }
}

const styles = computed<CSSProperties>(() => ({
    height: addUnit(props.height),
    width: addUnit(props.width)
}))

/**
 * 规范化编辑器 HTML 值，避免空字符串在部分浏览器下触发 Slate 组合输入异常
 */
const normalizeEditorHtml = (value: unknown) => {
    const html = typeof value === 'string' ? value : ''
    return html.trim() ? html : '<p><br></p>'
}

/**
 * 绑定编辑区组合输入事件，避免 Firefox 中文输入过程中被父级同步打断
 */
const bindCompositionListeners = () => {
    if (typeof window === 'undefined') return
    const root = editorWrapRef.value
    if (!root) return

    const nextEditable = root.querySelector('[data-slate-editor="true"]') as HTMLElement | null
    if (!nextEditable || nextEditable === editableDomEl) return

    if (editableDomEl) {
        editableDomEl.removeEventListener('compositionstart', handleCompositionStart)
        editableDomEl.removeEventListener('compositionend', handleCompositionEnd)
    }

    editableDomEl = nextEditable
    editableDomEl.addEventListener('compositionstart', handleCompositionStart)
    editableDomEl.addEventListener('compositionend', handleCompositionEnd)
}

/**
 * 组合输入开始时标记状态，延迟外部值回灌
 */
const handleCompositionStart = () => {
    isComposing.value = true
}

/**
 * 组合输入结束后恢复外部同步，确保编辑器内容稳定回写
 */
const handleCompositionEnd = () => {
    window.setTimeout(() => {
        isComposing.value = false
        const current = props.modelValue
        const normalized = normalizeEditorHtml(current)
        if (normalized !== localHtml.value) {
            localHtml.value = normalized
        }
    }, 0)
}

const valueHtml = computed({
    get() {
        return localHtml.value
    },
    set(value) {
        localHtml.value = normalizeEditorHtml(value)
    }
})

watch(
    () => props.modelValue,
    (value) => {
        const normalized = normalizeEditorHtml(value)
        if (isComposing.value) return
        if (normalized === localHtml.value) return
        localHtml.value = normalized
    },
    { immediate: true }
)

watch(
    localHtml,
    (value) => {
        if (value === normalizeEditorHtml(props.modelValue)) return
        emit('update:modelValue', value)
    },
    { flush: 'post' }
)

const selectChange = (fileUrl: string[]) => {
    fileUrl.forEach((url) => {
        insertFn(url)
    })
}

// 组件销毁时，也及时销毁编辑器
onBeforeUnmount(() => {
    if (editableDomEl) {
        editableDomEl.removeEventListener('compositionstart', handleCompositionStart)
        editableDomEl.removeEventListener('compositionend', handleCompositionEnd)
        editableDomEl = null
    }
    const editor = editorRef.value
    if (editor == null) return
    editor.destroy()
})

const handleCreated = (editor: any) => {
    editorRef.value = editor // 记录 editor 实例，重要！
    nextTick(() => {
        bindCompositionListeners()
    })
}
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
/* AI 悬浮按钮样式 */
.w-e-hover-bar {
    .w-e-menu-tooltip-v5[data-tooltip='AI'] {
        button {
            color: #7c3aed;
            font-weight: bold;
        }
    }
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
</style>
