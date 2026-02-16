import { uiedAiChat } from '@/api/uied'

export interface AiEditorGenerateParams {
    scene?: string
    mode?: string
    outputFormat?: string
    title?: string
    version?: string
    date?: string
    tone?: string
    audience?: string
    extraRequirements?: string
    changePoints?: string[]
    content?: string
    context?: Record<string, unknown>
}

/**
 * 构建编辑器 AI 的非流式降级提示词
 */
const buildEditorPrompt = (params: AiEditorGenerateParams) => {
    const parts: string[] = []
    const scene = String(params.scene || 'article').trim()
    const mode = String(params.mode || 'replace').trim()
    const title = String(params.title || '').trim()
    const version = String(params.version || '').trim()
    const date = String(params.date || '').trim()
    const tone = String(params.tone || '').trim()
    const audience = String(params.audience || '').trim()
    const extraRequirements = String(params.extraRequirements || '').trim()
    const content = String(params.content || '').trim()
    const points = Array.isArray(params.changePoints)
        ? params.changePoints.map((item) => String(item || '').trim()).filter(Boolean)
        : []

    parts.push(`场景：${scene}`)
    parts.push(`模式：${mode}`)
    if (title) parts.push(`标题：${title}`)
    if (version) parts.push(`版本：${version}`)
    if (date) parts.push(`日期：${date}`)
    if (tone) parts.push(`语气：${tone}`)
    if (audience) parts.push(`受众：${audience}`)
    if (points.length) parts.push(`要点：${points.join('；')}`)
    if (extraRequirements) parts.push(`额外要求：${extraRequirements}`)
    if (content) parts.push(`正文内容：\n${content}`)
    parts.push('请输出纯文本结果，不要使用 Markdown 代码块。')

    return parts.join('\n')
}

/**
 * 编辑器 AI 降级生成接口（非流式）
 */
export async function aiEditorGenerate(params: AiEditorGenerateParams) {
    const data = await uiedAiChat({
        message: buildEditorPrompt(params),
        context: []
    })
    return {
        draft: String(data?.reply || '')
    }
}
