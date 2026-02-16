<!--
/**
 * @copyright Tomda (https://www.tomda.top)
 * @copyright UIED技术团队 (https://fsuied.com)
 * @author UIED技术团队
 * @createDate 2026-02-16
 */
-->
<template>
    <div class="article-edit">
        <el-card class="!border-none" shadow="never">
            <el-page-header content="文章编辑" @back="$router.back()" />
        </el-card>
        <el-card class="mt-4 !border-none" shadow="never">
            <el-form
                ref="formRef"
                class="ls-form"
                :model="formData"
                label-width="85px"
                :rules="rules"
            >
                <div class="xl:flex">
                    <div>
                        <el-form-item label="文章标题" prop="title">
                            <div class="w-80">
                                <el-input
                                    v-model="formData.title"
                                    placeholder="请输入文章标题"
                                    type="textarea"
                                    :autosize="{ minRows: 3, maxRows: 3 }"
                                    maxlength="64"
                                    show-word-limit
                                    clearable
                                />
                            </div>
                        </el-form-item>
                        <el-form-item label="文章栏目" prop="cid">
                            <el-select
                                class="w-80"
                                v-model="formData.cid"
                                placeholder="请选择文章栏目"
                                clearable
                            >
                                <el-option
                                    v-for="item in optionsData.articleCate"
                                    :key="item.id"
                                    :label="item.name"
                                    :value="item.id"
                                />
                            </el-select>
                        </el-form-item>
                        <el-form-item label="文章简介" prop="intro">
                            <div class="w-80">
                                <el-input
                                    v-model="formData.intro"
                                    placeholder="请输入文章简介"
                                    type="textarea"
                                    :autosize="{ minRows: 3, maxRows: 6 }"
                                    :maxlength="200"
                                    show-word-limit
                                    clearable
                                />
                            </div>
                        </el-form-item>
                        <el-form-item label="摘要" prop="summary">
                            <div class="w-80">
                                <el-input
                                    type="textarea"
                                    :autosize="{ minRows: 6, maxRows: 6 }"
                                    v-model="formData.summary"
                                    maxlength="200"
                                    show-word-limit
                                    clearable
                                />
                            </div>
                        </el-form-item>
                        <el-form-item label="AI助手">
                            <div class="w-80">
                                <el-input
                                    v-model="aiPrompt"
                                    type="textarea"
                                    :autosize="{ minRows: 3, maxRows: 6 }"
                                    placeholder="可选：输入额外要求，例如“偏专业语气，突出场景价值”"
                                    clearable
                                />
                                <div class="mt-2 flex gap-2">
                                    <el-button
                                        type="primary"
                                        size="small"
                                        :loading="aiLoading"
                                        @click="handleAiGenerate('replace')"
                                    >
                                        生成正文
                                    </el-button>
                                    <el-button
                                        type="success"
                                        size="small"
                                        :loading="aiLoading"
                                        @click="handleAiGenerate('append')"
                                    >
                                        续写正文
                                    </el-button>
                                    <el-button
                                        type="warning"
                                        size="small"
                                        :loading="aiLoading"
                                        @click="handleAiGenerate('polish')"
                                    >
                                        润色正文
                                    </el-button>
                                </div>
                                <div class="form-tips">
                                    会结合标题、简介、摘要与当前正文生成内容。
                                </div>
                            </div>
                        </el-form-item>
                        <el-form-item label="文章封面" prop="image">
                            <div>
                                <div>
                                    <material-picker v-model="formData.image" :limit="1" />
                                </div>
                                <div class="form-tips">建议尺寸：240*180px</div>
                            </div>
                        </el-form-item>
                        <el-form-item label="作者" prop="author">
                            <div class="w-80">
                                <el-input v-model="formData.author" placeholder="请输入作者名称" />
                            </div>
                        </el-form-item>
                        <el-form-item label="排序" prop="sort">
                            <div>
                                <el-input-number v-model="formData.sort" :min="0" :max="9999" />
                                <div class="form-tips">默认为0， 数值越大越排前</div>
                            </div>
                        </el-form-item>
                        <el-form-item label="初始浏览量" prop="visit">
                            <div>
                                <el-input-number v-model="formData.visit" />
                            </div>
                        </el-form-item>
                        <el-form-item label="文章状态" required prop="isShow">
                            <el-radio-group v-model="formData.isShow">
                                <el-radio :label="1">显示</el-radio>
                                <el-radio :label="0">隐藏</el-radio>
                            </el-radio-group>
                        </el-form-item>
                    </div>
                    <div class="xl:ml-20">
                        <el-form-item label="文章内容" required prop="content">
                            <editor v-model="formData.content" :height="667" :width="375" />
                        </el-form-item>
                    </div>
                </div>
            </el-form>
        </el-card>
        <footer-btns>
            <el-button type="primary" @click="handleSave">保存</el-button>
        </footer-btns>
    </div>
</template>

<script lang="ts" setup name="articleListsEdit">
import type { FormInstance } from 'element-plus'
import feedback from '@/utils/feedback'
import { useDictOptions } from '@/hooks/useDictOptions'
import { articleCateAll, articleDetail, articleEdit, articleAdd } from '@/api/article'
import { uiedAiChat } from '@/api/uied'
import useMultipleTabs from '@/hooks/useMultipleTabs'

type AiGenerateMode = 'replace' | 'append' | 'polish'

const route = useRoute()
const router = useRouter()
const formData = reactive({
    id: '',
    title: '',
    image: '',
    cid: '',
    intro: '',
    author: '',
    content: '',
    visit: 0,
    sort: 0,
    isShow: 1,
    summary: ''
})

const { removeTab } = useMultipleTabs()
const formRef = shallowRef<FormInstance>()
const aiLoading = ref(false)
const aiPrompt = ref('')
const rules = reactive({
    title: [{ required: true, message: '请输入文章标题', trigger: 'blur' }],
    cid: [{ required: true, message: '请选择文章栏目', trigger: 'blur' }]
})

/**
 * 获取文章详情并回填表单
 */
const getDetails = async () => {
    const data = await articleDetail({
        id: route.query.id
    })
    Object.keys(formData).forEach((key) => {
        //@ts-ignore
        formData[key] = data[key]
    })
}

const { optionsData } = useDictOptions<{
    articleCate: any[]
}>({
    articleCate: {
        api: articleCateAll
    }
})

/**
 * 将富文本转纯文本，便于拼接 AI 提示词
 */
const toPlainText = (html: string) =>
    (html || '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()

/**
 * 将 AI 返回的纯文本转换为编辑器可识别的 HTML
 */
const plainTextToHtml = (text: string) => {
    if (!text.trim()) return ''
    const escape = (input: string) =>
        input.replace(
            /[&<>"']/g,
            (char) =>
                ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char] ||
                char)
        )
    return text
        .split(/\n{2,}/)
        .map((block) => `<p>${escape(block).replace(/\n/g, '<br/>')}</p>`)
        .join('')
}

/**
 * 清理 AI 响应中的 Markdown 围栏，避免污染正文
 */
const normalizeAiReply = (text: string) =>
    (text || '')
        .replace(/\r\n/g, '\n')
        .replace(/```[\w-]*\n?/g, '')
        .replace(/```/g, '')
        .trim()

/**
 * 构建文章 AI 提示词
 */
const buildArticleAiPrompt = (mode: AiGenerateMode, userPrompt = '') => {
    const title = formData.title || '未命名文章'
    const intro = formData.intro || ''
    const summary = formData.summary || ''
    const currentText = toPlainText(formData.content || '')

    const modeInstructions: Record<AiGenerateMode, string> = {
        replace: '请生成一篇完整正文，结构清晰，适合文章详情页展示。',
        append: '请基于当前正文继续续写，保持逻辑连贯并避免重复。',
        polish: '请在不改变原意前提下润色正文，增强可读性和专业感。'
    }

    let prompt = `文章标题：${title}\n`
    if (intro) prompt += `文章简介：${intro}\n`
    if (summary) prompt += `摘要：${summary}\n`
    if (currentText && mode !== 'replace') prompt += `\n当前正文：\n${currentText}\n`
    prompt += `\n${modeInstructions[mode]}\n请只输出纯文本，不要 Markdown 代码块。`
    if (userPrompt.trim()) prompt += `\n额外要求：${userPrompt.trim()}`
    return prompt
}

/**
 * 调用 AI 生成/续写/润色文章正文
 */
const handleAiGenerate = async (mode: AiGenerateMode) => {
    aiLoading.value = true
    try {
        const message = buildArticleAiPrompt(mode, aiPrompt.value)
        const result = await uiedAiChat({ message, context: '文章内容编辑' })
        const reply = result?.reply || result?.content || result?.data?.reply || ''
        const draft = normalizeAiReply(reply)
        if (!draft) {
            feedback.msgWarning('AI 未返回可用结果，请调整后重试')
            return
        }

        const html = plainTextToHtml(draft)
        if (mode === 'append' && (formData.content || '').trim()) {
            formData.content = `${formData.content}<p><br/></p>${html}`
        } else {
            formData.content = html
        }
        feedback.msgSuccess(mode === 'append' ? 'AI 续写已追加到正文' : 'AI 内容已应用到正文')
    } catch (error: any) {
        feedback.msgError(error?.msg || error?.message || 'AI 处理失败')
    } finally {
        aiLoading.value = false
    }
}

/**
 * 保存文章
 */
const handleSave = async () => {
    await formRef.value?.validate()
    if (route.query.id) {
        await articleEdit(formData)
    } else {
        await articleAdd(formData)
    }
    feedback.msgSuccess('操作成功')
    removeTab()
    router.back()
}

route.query.id && getDetails()
</script>
