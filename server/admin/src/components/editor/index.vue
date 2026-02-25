<template>
    <div class="border border-br flex flex-col" :style="styles">
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
const materialPickerRef = shallowRef<InstanceType<typeof MaterialPicker>>()
const fileType = ref('')
const isFirefoxBrowser =
    typeof window !== 'undefined' && /firefox/i.test(window.navigator.userAgent || '')

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
const valueHtml = computed({
    get() {
        // WangEditor/Slate 在空字符串 + Firefox 中文输入法场景下稳定性较差，统一返回最小合法段落
        const html = typeof props.modelValue === 'string' ? props.modelValue : ''
        return html.trim() ? html : '<p><br></p>'
    },
    set(value) {
        emit('update:modelValue', value)
    }
})

const selectChange = (fileUrl: string[]) => {
    fileUrl.forEach((url) => {
        insertFn(url)
    })
}

// 组件销毁时，也及时销毁编辑器
onBeforeUnmount(() => {
    const editor = editorRef.value
    if (editor == null) return
    editor.destroy()
})

const handleCreated = (editor: any) => {
    editorRef.value = editor // 记录 editor 实例，重要！
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
