<!--
/**
 * @copyright Tomda (https://www.tomda.top)
 * @copyright UIED技术团队 (https://fsuied.com)
 * @author UIED技术团队
 * @createDate 2026.2.8
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
                <div class="article-edit__stack">
                    <div class="article-edit__settings article-edit__settings--top">
                        <div class="article-edit__panel-title-wrap">
                            <div class="article-edit__panel-title">发布设置（基础）</div>
                            <div class="article-edit__draft-actions">
                                <el-button size="small" @click="saveLocalDraft">暂存草稿</el-button>
                                <el-button
                                    size="small"
                                    type="primary"
                                    :disabled="!localDraftExists"
                                    @click="restoreLocalDraft"
                                >
                                    恢复草稿
                                </el-button>
                                <el-button
                                    size="small"
                                    type="danger"
                                    plain
                                    :disabled="!localDraftExists"
                                    @click="clearLocalDraft"
                                >
                                    清空草稿
                                </el-button>
                            </div>
                        </div>
                        <div class="article-edit__draft-tip">{{ localDraftTip }}</div>
                        <el-row :gutter="16">
                            <el-col :md="8" :xs="24">
                                <el-form-item label="文章栏目" prop="cid">
                                    <el-select
                                        class="article-edit__field"
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
                            </el-col>
                            <el-col :md="8" :xs="24">
                                <el-form-item label="作者" prop="author">
                                    <div class="article-edit__field">
                                        <div class="article-edit__author-picker">
                                            <el-select
                                                v-model="formData.author"
                                                class="article-edit__author-input"
                                                filterable
                                                remote
                                                clearable
                                                default-first-option
                                                :reserve-keyword="false"
                                                :loading="authorOptionsLoading"
                                                placeholder="请输入用户ID或名称后从下拉选择"
                                                :remote-method="fetchAuthorOptions"
                                                @visible-change="handleAuthorSelectVisibleChange"
                                            >
                                                <el-option
                                                    v-for="item in authorOptions"
                                                    :key="item.value"
                                                    :label="item.label"
                                                    :value="item.value"
                                                >
                                                    <div class="article-edit__author-option">
                                                        <span>{{ item.label }}</span>
                                                        <el-tag size="small" type="info">{{
                                                            item.userTypeName
                                                        }}</el-tag>
                                                    </div>
                                                </el-option>
                                            </el-select>
                                            <el-select
                                                v-model="authorUserTypeFilter"
                                                class="article-edit__author-filter"
                                                placeholder="筛选身份"
                                                @change="handleAuthorTypeChange"
                                            >
                                                <el-option label="全部身份" value="" />
                                                <el-option label="普通用户" :value="0" />
                                                <el-option label="作者" :value="1" />
                                                <el-option label="编辑" :value="2" />
                                            </el-select>
                                        </div>
                                        <div class="form-tips">必须从后台用户列表中选择作者</div>
                                    </div>
                                </el-form-item>
                            </el-col>
                            <el-col :md="8" :xs="24">
                                <el-form-item label="状态">
                                    <el-tag v-if="Number(formData.isShow) === 1" type="success"
                                        >已发布</el-tag
                                    >
                                    <el-tag v-else type="info">待发布</el-tag>
                                </el-form-item>
                            </el-col>
                        </el-row>
                        <el-row :gutter="16">
                            <el-col :md="12" :xs="24">
                                <el-form-item label="文章标签">
                                    <el-select
                                        v-model="formData.tagIds"
                                        class="article-edit__field"
                                        multiple
                                        clearable
                                        filterable
                                        collapse-tags
                                        collapse-tags-tooltip
                                        placeholder="可选择多个标签"
                                    >
                                        <el-option
                                            v-for="item in optionsData.articleTag"
                                            :key="item.id"
                                            :label="item.name"
                                            :value="item.id"
                                        />
                                    </el-select>
                                </el-form-item>
                            </el-col>
                            <el-col :md="12" :xs="24">
                                <el-form-item label="所属专题">
                                    <el-select
                                        v-model="formData.topicId"
                                        class="article-edit__field"
                                        clearable
                                        filterable
                                        placeholder="可选一个专题"
                                    >
                                        <el-option label="不设置专题" :value="0" />
                                        <el-option
                                            v-for="item in optionsData.articleTopic"
                                            :key="item.id"
                                            :label="item.name"
                                            :value="item.id"
                                        />
                                    </el-select>
                                </el-form-item>
                            </el-col>
                        </el-row>
                        <el-form-item label="文章封面" prop="image">
                            <div class="article-edit__field">
                                <material-picker v-model="formData.image" :limit="1" />
                                <div class="form-tips">建议尺寸：240*180px</div>
                            </div>
                        </el-form-item>
                    </div>
                    <div class="article-edit__editor">
                        <div class="article-edit__panel-title-wrap">
                            <div class="article-edit__panel-title">正文编辑区</div>
                            <div class="article-edit__draft-actions">
                                <el-button
                                    size="small"
                                    :loading="importWechatLoading"
                                    @click="handleImportWechatArticle"
                                >
                                    公众号导入
                                </el-button>
                                <el-button
                                    size="small"
                                    :loading="transferImagesLoading"
                                    @click="handleTransferEditorImages"
                                >
                                    一键转存正文图片
                                </el-button>
                            </div>
                        </div>
                        <el-form-item label="文章标题" prop="title">
                            <div class="article-edit__title-box">
                                <el-input
                                    v-model="formData.title"
                                    placeholder="请输入文章标题"
                                    type="textarea"
                                    :autosize="{ minRows: 2, maxRows: 3 }"
                                    maxlength="64"
                                    show-word-limit
                                    clearable
                                />
                                <div class="article-edit__field-actions">
                                    <el-button
                                        type="primary"
                                        link
                                        size="small"
                                        :loading="fieldAiLoading.title"
                                        @click="handleAiField('title')"
                                    >
                                        AI优化标题
                                    </el-button>
                                </div>
                            </div>
                        </el-form-item>
                        <div class="article-edit__meta">
                            <el-tag size="small" type="info"
                                >标题 {{ String(formData.title || '').trim().length }} 字</el-tag
                            >
                            <el-tag size="small" type="success"
                                >正文约 {{ contentWordCount }} 字</el-tag
                            >
                        </div>
                        <el-form-item label="文章内容" required prop="content" class="mt-3">
                            <div class="article-edit__editor-box">
                                <ai-editor
                                    v-model="formData.content"
                                    scene="article"
                                    height="auto"
                                    :title="formData.title"
                                    :context="{
                                        cid: formData.cid,
                                        cateName: selectedCateName,
                                        intro: formData.intro,
                                        summary: formData.summary,
                                        author: selectedAuthorName
                                    }"
                                />
                            </div>
                        </el-form-item>
                    </div>
                    <div class="article-edit__settings article-edit__settings--bottom">
                        <div class="article-edit__panel-title">发布设置（补充）</div>
                        <el-form-item label="文章简介" prop="intro">
                            <div class="article-edit__field">
                                <el-input
                                    v-model="formData.intro"
                                    placeholder="请输入文章简介"
                                    type="textarea"
                                    :autosize="{ minRows: 3, maxRows: 5 }"
                                    :maxlength="200"
                                    show-word-limit
                                    clearable
                                />
                                <div class="article-edit__field-actions">
                                    <el-button
                                        type="primary"
                                        link
                                        size="small"
                                        :loading="fieldAiLoading.intro"
                                        @click="handleAiField('intro')"
                                    >
                                        AI优化简介
                                    </el-button>
                                </div>
                            </div>
                        </el-form-item>
                        <el-form-item label="摘要" prop="summary">
                            <div class="article-edit__field">
                                <el-input
                                    type="textarea"
                                    :autosize="{ minRows: 5, maxRows: 6 }"
                                    v-model="formData.summary"
                                    maxlength="200"
                                    show-word-limit
                                    clearable
                                />
                            </div>
                        </el-form-item>
                        <el-row :gutter="16">
                            <el-col :md="12" :xs="24">
                                <el-form-item label="排序" prop="sort">
                                    <div class="article-edit__field">
                                        <el-input-number
                                            v-model="formData.sort"
                                            :min="0"
                                            :max="9999"
                                        />
                                        <div class="form-tips">默认为0，数值越大越排前</div>
                                    </div>
                                </el-form-item>
                            </el-col>
                            <el-col :md="12" :xs="24">
                                <el-form-item label="初始浏览量" prop="visit">
                                    <div class="article-edit__field">
                                        <el-input-number v-model="formData.visit" />
                                    </div>
                                </el-form-item>
                            </el-col>
                        </el-row>
                    </div>
                </div>
            </el-form>
        </el-card>
        <footer-btns>
            <el-button @click="handlePreview">预览</el-button>
            <el-button type="warning" @click="handleSaveDraft">保存为草稿</el-button>
            <el-button type="primary" @click="handlePublish">发表</el-button>
        </footer-btns>

        <el-dialog v-model="previewVisible" title="文章预览" width="980px" top="6vh">
            <div class="article-preview">
                <h1 class="article-preview__title">{{ formData.title || '未命名文章' }}</h1>
                <div class="article-preview__meta">
                    <span>作者：{{ selectedAuthorText }}</span>
                    <span>栏目：{{ selectedCateName || '-' }}</span>
                </div>
                <div class="article-preview__content" v-html="previewHtml"></div>
            </div>
        </el-dialog>

        <el-dialog
            v-model="actionProgress.visible"
            :title="actionProgress.title"
            width="440px"
            top="20vh"
            :close-on-click-modal="false"
            :show-close="false"
        >
            <div class="article-progress">
                <div class="article-progress__message">{{ actionProgress.message }}</div>
                <el-progress
                    :percentage="actionProgress.percentage"
                    :indeterminate="actionProgress.indeterminate"
                    :status="actionProgress.status"
                    :stroke-width="16"
                />
            </div>
        </el-dialog>
    </div>
</template>

<script lang="ts" setup name="articleListsEdit">
import type { FormInstance } from 'element-plus'
import feedback from '@/utils/feedback'
import { useDictOptions } from '@/hooks/useDictOptions'
import { getAuthorUserOptions } from '@/api/consumer'
import {
    articleAdd,
    articleCateAll,
    articleDetail,
    articleEdit,
    articleImportWechat,
    articleTagAll,
    articleTopicAll
} from '@/api/article'
import { aiEditorGenerate } from '@/api/ai/editor'
import useMultipleTabs from '@/hooks/useMultipleTabs'
import AiEditor from '@/components/ai-editor/index.vue'
import { transferEditorContentImages, transferRemoteImages } from '@/api/file'

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
    summary: '',
    tagIds: [] as number[],
    topicId: 0
})

const { removeTab } = useMultipleTabs()
const formRef = shallowRef<FormInstance>()
const rules = reactive({
    title: [{ required: true, message: '请输入文章标题', trigger: 'blur' }],
    cid: [{ required: true, message: '请选择文章栏目', trigger: 'blur' }],
    intro: [{ required: true, message: '请输入文章简介', trigger: 'blur' }],
    author: [{ required: true, message: '请选择作者（后台用户）', trigger: 'change' }]
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
    formData.tagIds = Array.isArray(formData.tagIds)
        ? formData.tagIds.map((id: any) => Number(id))
        : []
    formData.topicId = Number(formData.topicId || 0)
    const authorUserId = Number(data?.authorUser?.userId || 0)
    if (authorUserId > 0) {
        formData.author = String(authorUserId)
        const exists = authorOptions.value.some((item) => item.value === String(authorUserId))
        if (!exists) {
            authorOptions.value.unshift({
                value: String(authorUserId),
                label: `${String(data?.authorUser?.nickname || data?.author || `用户${authorUserId}`)}（ID:${authorUserId}）`,
                nickname: String(data?.authorUser?.nickname || ''),
                username: '',
                realName: '',
                userType: Number(data?.authorUser?.userType || 0),
                userTypeName: '作者'
            })
        }
    } else {
        formData.author = ''
    }
}

const { optionsData } = useDictOptions<{
    articleCate: any[]
    articleTag: any[]
    articleTopic: any[]
}>({
    articleCate: {
        api: articleCateAll
    },
    articleTag: {
        api: articleTagAll
    },
    articleTopic: {
        api: articleTopicAll
    }
})

/**
 * 根据当前栏目ID匹配栏目名称
 */
const selectedCateName = computed(() => {
    const cid = Number(formData.cid || 0)
    if (!cid) return ''
    const list = Array.isArray(optionsData.articleCate) ? optionsData.articleCate : []
    const cate = list.find((item: any) => Number(item.id) === cid)
    return cate?.name || ''
})

/**
 * 当前选中作者展示文本
 */
const selectedAuthorText = computed(() => {
    const value = String(formData.author || '').trim()
    if (!value) return '-'
    const item = authorOptions.value.find((option) => String(option.value) === value)
    return item?.label || `ID:${value}`
})

/**
 * 当前选中作者名称（给 AI 上下文/保存展示）
 */
const selectedAuthorName = computed(() => {
    const value = String(formData.author || '').trim()
    if (!value) return ''
    const item = authorOptions.value.find((option) => String(option.value) === value)
    if (!item) return `用户${value}`
    return item.nickname || item.username || item.realName || `用户${value}`
})

/**
 * 统计正文纯文本字数
 */
const contentWordCount = computed(() => {
    const text = String(formData.content || '')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, '')
        .trim()
    return text.length
})

const importWechatLoading = ref(false)
const transferImagesLoading = ref(false)
const actionProgress = reactive({
    visible: false,
    title: '处理中',
    message: '请稍候...',
    percentage: 0,
    indeterminate: true,
    status: '' as '' | 'success' | 'exception' | 'warning'
})
const localDraftExists = ref(false)
const localDraftTime = ref('')
const fieldAiLoading = reactive({
    title: false,
    intro: false
})
const draftStorageKey = computed(() => {
    const id = String(route.query.id || 'new')
    return `article_edit_draft_${id}`
})
const localDraftTip = computed(() => {
    if (!localDraftExists.value) return '暂无草稿，可在右上角“暂存草稿”保存当前编辑进度。'
    return `草稿已保存：${localDraftTime.value || '-'}`
})

/**
 * 打开操作进度弹层
 */
const startActionProgress = (title: string, message = '请稍候...') => {
    actionProgress.visible = true
    actionProgress.title = title
    actionProgress.message = message
    actionProgress.percentage = 8
    actionProgress.indeterminate = true
    actionProgress.status = ''
}

/**
 * 更新操作进度
 */
const updateActionProgress = (
    percentage: number,
    message?: string,
    indeterminate = true,
    status: '' | 'success' | 'exception' | 'warning' = ''
) => {
    actionProgress.percentage = Math.max(0, Math.min(100, Number(percentage || 0)))
    if (typeof message === 'string' && message) {
        actionProgress.message = message
    }
    actionProgress.indeterminate = indeterminate
    actionProgress.status = status
}

/**
 * 结束操作进度弹层
 */
const finishActionProgress = (
    status: '' | 'success' | 'exception' | 'warning',
    message: string,
    closeDelay = 900
) => {
    updateActionProgress(100, message, false, status)
    window.setTimeout(() => {
        actionProgress.visible = false
    }, closeDelay)
}

/**
 * 获取可持久化的表单数据
 */
const getPersistFormData = () => {
    return {
        title: formData.title,
        image: formData.image,
        cid: formData.cid,
        intro: formData.intro,
        author: formData.author,
        content: formData.content,
        visit: formData.visit,
        sort: formData.sort,
        isShow: formData.isShow,
        summary: formData.summary,
        tagIds: formData.tagIds,
        topicId: formData.topicId
    }
}

/**
 * 格式化草稿保存时间
 */
const formatDraftTime = (timestamp: number) => {
    const d = new Date(timestamp)
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
        d.getHours()
    )}:${pad(d.getMinutes())}`
}

/**
 * 刷新本地草稿状态
 */
const refreshLocalDraftState = () => {
    localDraftExists.value = false
    localDraftTime.value = ''
    try {
        const raw = localStorage.getItem(draftStorageKey.value)
        if (!raw) return
        const payload = JSON.parse(raw)
        if (!payload?.formData) return
        localDraftExists.value = true
        localDraftTime.value = formatDraftTime(Number(payload?.updatedAt || Date.now()))
    } catch (error) {
        localDraftExists.value = false
        localDraftTime.value = ''
    }
}

/**
 * 暂存草稿到本地存储
 */
const saveLocalDraft = () => {
    const payload = {
        updatedAt: Date.now(),
        formData: getPersistFormData()
    }
    localStorage.setItem(draftStorageKey.value, JSON.stringify(payload))
    refreshLocalDraftState()
    feedback.msgSuccess('草稿已暂存到本地')
}

/**
 * 从本地存储恢复草稿
 */
const restoreLocalDraft = async () => {
    try {
        const raw = localStorage.getItem(draftStorageKey.value)
        if (!raw) {
            feedback.msgWarning('未找到可恢复草稿')
            return
        }
        const payload = JSON.parse(raw)
        if (!payload?.formData) {
            feedback.msgWarning('草稿数据无效')
            return
        }
        const hasCurrentContent = Boolean(
            String(formData.title || '').trim() || String(formData.content || '').trim()
        )
        if (hasCurrentContent) {
            await feedback.confirm('恢复草稿会覆盖当前编辑内容，是否继续？')
        }
        const keys = Object.keys(getPersistFormData())
        keys.forEach((key) => {
            //@ts-ignore
            formData[key] = payload.formData[key]
        })
        formData.tagIds = Array.isArray(formData.tagIds)
            ? formData.tagIds.map((id: any) => Number(id)).filter((id: number) => id > 0)
            : []
        formData.topicId = Number(formData.topicId || 0)
        refreshLocalDraftState()
        feedback.msgSuccess('草稿已恢复')
    } catch (error) {
        feedback.msgError('恢复草稿失败')
    }
}

/**
 * 清空本地草稿
 */
const clearLocalDraft = async () => {
    try {
        await feedback.confirm('确认清空当前文章草稿？')
    } catch (error) {
        return
    }
    localStorage.removeItem(draftStorageKey.value)
    refreshLocalDraftState()
    feedback.msgSuccess('草稿已清空')
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
 * 清理 AI 返回文本
 */
const normalizeAiText = (value: string) => {
    return String(value || '')
        .replace(/\r\n/g, '\n')
        .replace(/```[\w-]*\n?/g, '')
        .replace(/```/g, '')
        .replace(/\s+/g, ' ')
        .trim()
}

/**
 * 构建字段 AI 输入文本
 */
const buildFieldSource = (field: 'title' | 'intro') => {
    if (field === 'title') {
        return String(formData.title || formData.summary || formData.intro || '').trim()
    }
    return String(
        formData.intro || formData.summary || toPlainText(formData.content).slice(0, 240)
    ).trim()
}

/**
 * 构建字段 AI 额外要求
 */
const buildFieldRequirement = (field: 'title' | 'intro') => {
    if (field === 'title') {
        return '请输出 1 个中文文章标题，不超过 24 字，不要解释，不要引号。'
    }
    return '请输出 80~120 字的文章简介，语气专业、简洁，可直接展示。'
}

/**
 * AI 处理标题/简介字段
 */
const handleAiField = async (field: 'title' | 'intro') => {
    const source = buildFieldSource(field)
    if (!source) {
        feedback.msgWarning(field === 'title' ? '请先输入标题或摘要' : '请先输入简介或正文')
        return
    }
    fieldAiLoading[field] = true
    try {
        const data = await aiEditorGenerate({
            scene: 'article',
            mode: 'replace',
            outputFormat: 'text',
            title: String(formData.title || '').trim(),
            tone: '专业、简洁',
            audience: '公众号读者',
            extraRequirements: buildFieldRequirement(field),
            changePoints: [],
            content: source,
            context: {
                cid: formData.cid,
                cateName: selectedCateName.value
            }
        })
        const result = normalizeAiText(String(data?.draft || ''))
        if (!result) {
            feedback.msgWarning('AI 未返回可用文本，请稍后重试')
            return
        }
        if (field === 'title') {
            formData.title = result.slice(0, 64)
        } else {
            formData.intro = result.slice(0, 200)
        }
        feedback.msgSuccess(field === 'title' ? '标题已优化' : '简介已优化')
    } catch (error: any) {
        feedback.msgError(error?.message || 'AI 处理失败')
    } finally {
        fieldAiLoading[field] = false
    }
}

const previewVisible = ref(false)

/**
 * 公众号导入结果结构
 */
type WechatImportPayload = {
    title?: string
    intro?: string
    author?: string
    image?: string
    content?: string
    sourceUrl?: string
}

type AuthorOptionItem = {
    value: string
    label: string
    nickname: string
    username: string
    realName: string
    userType: number
    userTypeName: string
}

const authorOptionsLoading = ref(false)
const authorUserTypeFilter = ref<number | ''>('')
const authorOptions = ref<AuthorOptionItem[]>([])
const authorKeyword = ref('')

/**
 * 拉取作者下拉选项（支持关键词与身份筛选）
 */
const fetchAuthorOptions = async (keyword = '') => {
    authorKeyword.value = String(keyword || '')
    authorOptionsLoading.value = true
    try {
        const params: any = {
            keyword: authorKeyword.value,
            pageSize: 30
        }
        if (authorUserTypeFilter.value !== '') {
            params.userType = authorUserTypeFilter.value
        }
        const data = await getAuthorUserOptions(params)
        authorOptions.value = Array.isArray(data)
            ? data.map((item: any) => ({
                  value: String(item?.value || item?.id || ''),
                  label: String(item?.label || ''),
                  nickname: String(item?.nickname || ''),
                  username: String(item?.username || ''),
                  realName: String(item?.realName || ''),
                  userType: Number(item?.userType || 0),
                  userTypeName: String(item?.userTypeName || '普通用户')
              }))
            : []
    } catch (error) {
        authorOptions.value = []
    } finally {
        authorOptionsLoading.value = false
    }
}

/**
 * 作者下拉打开时加载数据
 */
const handleAuthorSelectVisibleChange = (visible: boolean) => {
    if (!visible) return
    fetchAuthorOptions(authorKeyword.value)
}

/**
 * 切换作者身份筛选
 */
const handleAuthorTypeChange = () => {
    fetchAuthorOptions(authorKeyword.value)
}

/**
 * 从输入文本中提取公众号链接
 */
const extractWechatArticleUrl = (raw: string) => {
    const text = String(raw || '').trim()
    if (!text) return ''
    const markdownMatch = text.match(/\[[^\]]*\]\((https?:\/\/[^)\s]+)\)/i)
    if (markdownMatch?.[1]) {
        const markdownUrl = String(markdownMatch[1] || '').trim()
        return markdownUrl
    }
    const directMatch = text.match(/https?:\/\/[^\s]+/i)
    if (!directMatch?.[0]) return text
    const directUrl = String(directMatch[0] || '')
        .trim()
        .replace(/[)\],;]+$/g, '')
    return directUrl
}

/**
 * 从 HTML 中提取第一张图片地址
 */
const extractFirstImageUrlFromHtml = (html: string) => {
    const source = String(html || '')
    const match = source.match(/<img\b[^>]*>/i)
    if (!match) return ''
    const tag = match[0]
    const readAttr = (name: string) => {
        const re = new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i')
        const found = tag.match(re)
        return String(found?.[1] || found?.[2] || found?.[3] || '')
            .replace(/&amp;/g, '&')
            .trim()
    }
    const src = readAttr('src') || readAttr('data-src') || readAttr('data-original')
    if (!src) return ''
    if (/^\/\//.test(src)) return `https:${src}`
    return src
}

/**
 * 判断是否为本地素材库地址
 */
const isLocalMaterialUrl = (url: string) => {
    const text = String(url || '').trim()
    if (!text) return true
    if (text.startsWith('/public/uploads/')) return true
    if (text.startsWith('/api/uploads/')) return true
    if (/^https?:\/\//i.test(text) && text.includes('/public/uploads/')) return true
    if (/^https?:\/\//i.test(text) && text.includes('/api/uploads/')) return true
    return false
}

/**
 * 判断是否为可转存的封面外链
 */
const isTransferableCoverUrl = (url: string) => {
    const text = String(url || '').trim()
    if (!/^https?:\/\//i.test(text)) return false
    if (isLocalMaterialUrl(text)) return false
    return true
}

/**
 * 通过公众号链接导入文章内容
 */
const handleImportWechatArticle = async () => {
    let inputUrl = ''
    try {
        const promptRes: any = await feedback.prompt('请输入公众号文章链接', '公众号导入', {
            inputPlaceholder: 'https://mp.weixin.qq.com/s?...',
            inputPattern: /https?:\/\/.+/i,
            inputErrorMessage: '请输入包含公众号链接的文本'
        })
        inputUrl = extractWechatArticleUrl(String(promptRes?.value || ''))
    } catch (error) {
        return
    }
    if (!inputUrl) return

    const hasCurrentContent = Boolean(
        String(formData.title || '').trim() ||
            String(formData.intro || '').trim() ||
            String(formData.content || '').trim()
    )
    if (hasCurrentContent) {
        try {
            await feedback.confirm('导入将覆盖当前标题/简介/正文，是否继续？')
        } catch (error) {
            return
        }
    }

    importWechatLoading.value = true
    startActionProgress('公众号导入', '正在抓取公众号正文...')
    try {
        updateActionProgress(30, '已发起抓取请求，正在解析正文...')
        const data = (await articleImportWechat({ url: inputUrl })) as WechatImportPayload
        const importedContent = String(data?.content || '').trim()
        if (!importedContent) {
            finishActionProgress('warning', '导入结果为空，请检查链接可访问性')
            feedback.msgWarning('导入结果为空，请确认公众号链接是否可访问')
            return
        }
        updateActionProgress(72, '正在回填标题、简介和正文...')
        const importedTitle = String(data?.title || '').trim()
        const importedIntro = String(data?.intro || '').trim()
        const importedAuthor = String(data?.author || '').trim()
        const importedImage =
            String(data?.image || '').trim() || extractFirstImageUrlFromHtml(importedContent)
        if (importedTitle) {
            formData.title = importedTitle
        }
        if (importedIntro) {
            formData.intro = importedIntro
        }
        formData.content = importedContent
        if (importedAuthor) {
            await fetchAuthorOptions(importedAuthor)
            const matched = authorOptions.value.find((item) => {
                const keyword = String(importedAuthor || '').trim()
                if (!keyword) return false
                return [item.nickname, item.username, item.realName].some(
                    (field) => String(field || '').trim() === keyword
                )
            })
            if (matched?.value) {
                formData.author = String(matched.value)
            } else {
                formData.author = ''
                feedback.msgWarning('导入作者未匹配到后台用户，请手动选择作者')
            }
        }
        if (!String(formData.image || '').trim()) {
            formData.image = importedImage
        }
        if (!String(formData.summary || '').trim() && formData.intro) {
            formData.summary = String(formData.intro || '')
                .trim()
                .slice(0, 200)
        }
        finishActionProgress('success', '公众号正文已导入，可按需转存图片')
        feedback.msgSuccess('公众号文章导入成功（未自动转存图片），可按需点击“一键转存正文图片”')
    } catch (error: any) {
        finishActionProgress('exception', '导入失败，请稍后重试')
        if (error?.message) {
            feedback.msgError(error.message)
        }
    } finally {
        importWechatLoading.value = false
    }
}

/**
 * 一键转存正文里的外链图片到素材库（手动触发，不做静默抓图）
 */
const handleTransferEditorImages = async () => {
    const html = String(formData.content || '').trim()
    if (!html) {
        feedback.msgWarning('正文为空，无需转存图片')
        return
    }
    try {
        await feedback.confirm('将正文中的外链图片转存到素材库并替换为本地地址，是否继续？')
    } catch (error) {
        return
    }
    transferImagesLoading.value = true
    startActionProgress('一键转存正文图片', '正在分析正文中的外链图片...')
    try {
        updateActionProgress(24, '正在提取图片链接并准备转存...')
        const data: any = await transferEditorContentImages({
            contentHtml: html,
            cid: 0
        })
        const nextHtml = String(data?.contentHtml || '')
        const count = Number(data?.count || 0)
        const total = Number(data?.total || 0)
        const failed = Array.isArray(data?.failed) ? data.failed : []
        let coverTransferred = false
        let coverTransferError = ''

        const coverUrl = String(formData.image || '').trim()
        if (isTransferableCoverUrl(coverUrl)) {
            updateActionProgress(58, '正在转存封面图...')
            try {
                const coverRes: any = await transferRemoteImages({
                    urls: [coverUrl],
                    cid: 0
                })
                const coverMap = Array.isArray(coverRes?.maps) ? coverRes.maps[0] : null
                const nextCover = String(coverMap?.to || '').trim()
                if (nextCover) {
                    formData.image = nextCover
                    coverTransferred = true
                } else {
                    coverTransferError = '封面图未转存成功'
                }
            } catch (error: any) {
                coverTransferError = error?.message || '封面图转存失败'
            }
        }

        if (nextHtml) {
            formData.content = nextHtml
        }
        if (total === 0 && !coverTransferred && !coverTransferError) {
            finishActionProgress('warning', '未检测到可转存的外链图片（含封面）')
            feedback.msgSuccess('未检测到可转存的外链图片（含封面）')
            return
        }
        if (total === 0 && coverTransferred) {
            finishActionProgress('success', '正文无外链图，封面图已转存')
            feedback.msgSuccess('正文未检测到外链图片，封面图已转存到素材库')
            return
        }
        if (total === 0 && coverTransferError) {
            finishActionProgress('warning', '正文无外链图，封面图转存失败')
            feedback.msgWarning(`正文未检测到外链图片，${coverTransferError}`)
            return
        }
        if (count > 0 && failed.length === 0) {
            finishActionProgress('success', `转存完成：正文 ${count}/${total}`)
            if (coverTransferred) {
                feedback.msgSuccess(`正文已转存 ${count}/${total} 张，封面图已转存`)
                return
            }
            if (coverTransferError) {
                feedback.msgWarning(`正文已转存 ${count}/${total} 张，${coverTransferError}`)
                return
            }
            feedback.msgSuccess(`已转存 ${count}/${total} 张图片到素材库`)
            return
        }
        if (count > 0 && failed.length > 0) {
            finishActionProgress(
                'warning',
                `部分完成：正文 ${count}/${total}，失败 ${failed.length}`
            )
            const coverPart = coverTransferred
                ? '，封面图已转存'
                : coverTransferError
                ? `，${coverTransferError}`
                : ''
            feedback.msgWarning(
                `已转存正文 ${count}/${total} 张，失败 ${failed.length} 张${coverPart}`
            )
            // 展示失败明细，便于排查具体原因
            const detail = failed
                .slice(0, 8)
                .map((item: any, index: number) => {
                    const url = String(item?.url || '').trim()
                    const reason = String(item?.reason || '').trim()
                    return `${index + 1}. ${reason || '转存失败'}\n${url}`
                })
                .join('\n\n')
            if (detail) {
                feedback.alert(`部分图片转存失败（仅展示前 8 条）：\n\n${detail}`)
            }
            return
        }
        if (failed.length > 0) {
            finishActionProgress('warning', '转存失败，请查看明细')
            const detail = failed
                .slice(0, 8)
                .map((item: any, index: number) => {
                    const url = String(item?.url || '').trim()
                    const reason = String(item?.reason || '').trim()
                    return `${index + 1}. ${reason || '转存失败'}\n${url}`
                })
                .join('\n\n')
            feedback.alert(
                `未转存成功（可能外链限制或图片不可访问）。\n\n失败明细（前 8 条）：\n\n${detail}`
            )
            return
        }
        if (coverTransferred) {
            finishActionProgress('success', '正文转存未命中，封面图已转存')
            feedback.msgSuccess('正文转存未命中，封面图已转存到素材库')
            return
        }
        finishActionProgress('warning', '未转存成功，请检查外链可访问性')
        feedback.msgWarning(coverTransferError || '未转存成功（可能外链限制或图片不可访问）')
    } catch (error: any) {
        finishActionProgress('exception', '转存失败，请稍后重试')
        feedback.msgError(error?.message || '正文图片转存失败')
    } finally {
        transferImagesLoading.value = false
    }
}

/**
 * 构建预览 HTML（直接复用富文本内容）
 */
const previewHtml = computed(() => {
    return String(formData.content || '').trim() || '<p style="color:#909399;">暂无正文内容</p>'
})

/**
 * 打开文章预览弹窗
 */
const handlePreview = () => {
    previewVisible.value = true
}

/**
 * 检查发布前的关键字段缺失项
 */
const getPublishMissingFields = () => {
    const missing: string[] = []
    if (!String(formData.title || '').trim()) {
        missing.push('文章标题')
    }
    if (!String(formData.cid || '').trim()) {
        missing.push('文章分类')
    }
    if (!String(formData.intro || '').trim()) {
        missing.push('文章简介')
    }
    if (!String(formData.author || '').trim()) {
        missing.push('作者')
    }
    return missing
}

/**
 * 保存为草稿（不强制校验完整表单，尽量保留运营编辑进度）
 */
const handleSaveDraft = async () => {
    if (!String(formData.author || '').trim()) {
        feedback.msgWarning('请选择作者（后台用户）后再保存草稿')
        return
    }
    // 草稿状态：0
    formData.isShow = 0
    // 后端字段约束兜底：无标题时给默认名
    if (!String(formData.title || '').trim()) {
        formData.title = '未命名草稿'
    }
    // 栏目允许为空时，兜底为 0
    if (!String(formData.cid || '').trim()) {
        formData.cid = 0 as any
    }
    try {
        if (route.query.id) {
            await articleEdit(formData)
        } else {
            const res: any = await articleAdd(formData)
            const newId = Number(res?.id || 0)
            if (newId) {
                formData.id = String(newId)
                await router.replace({ query: { ...route.query, id: newId } })
            }
        }
        feedback.msgSuccess('已保存为草稿，状态：待发布')
        // 草稿保存后，刷新本地草稿提示（避免误以为没保存）
        refreshLocalDraftState()
    } catch (error: any) {
        feedback.msgError(error?.message || '保存草稿失败')
    }
}

/**
 * 发表文章（强校验必填字段）
 */
const handlePublish = async () => {
    // 发布状态：1
    formData.isShow = 1
    const missing = getPublishMissingFields()
    if (missing.length > 0) {
        feedback.alertWarning(`发布前请完善：${missing.join('、')}`)
        return
    }
    try {
        await formRef.value?.validate()
    } catch (error) {
        return
    }
    try {
        if (route.query.id) {
            await articleEdit(formData)
        } else {
            const res: any = await articleAdd(formData)
            const newId = Number(res?.id || 0)
            if (newId) {
                formData.id = String(newId)
                await router.replace({ query: { ...route.query, id: newId } })
            }
        }
        // 发表成功后清理本地草稿，避免“已发布但仍显示草稿”造成困惑
        localStorage.removeItem(draftStorageKey.value)
        refreshLocalDraftState()
        feedback.msgSuccess('发表成功，状态：已发布')
        try {
            await feedback.confirm('是否打开前台查看？')
            const frontendUrl = import.meta.env.VITE_FRONTEND_URL || 'http://localhost:3000'
            const id = Number(route.query.id || formData.id || 0)
            if (id) {
                window.open(`${frontendUrl}/news/${id}`, '_blank')
            }
        } catch (error) {
            // 用户取消无需处理
        }
        removeTab()
        router.back()
    } catch (error: any) {
        feedback.msgError(error?.message || '发表失败')
    }
}

route.query.id && getDetails()
onMounted(() => {
    refreshLocalDraftState()
    fetchAuthorOptions('')
})
</script>

<style scoped>
.article-edit__stack {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.article-preview__title {
    font-size: 24px;
    font-weight: 700;
    margin: 0 0 10px;
}
.article-preview__meta {
    display: flex;
    gap: 16px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
    padding-bottom: 12px;
    margin-bottom: 12px;
    border-bottom: 1px solid var(--el-border-color-lighter);
}
.article-preview__content :deep(img) {
    max-width: 100%;
    height: auto;
}

.article-progress {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.article-progress__message {
    font-size: 13px;
    color: var(--el-text-color-regular);
}

.article-edit__editor,
.article-edit__settings {
    border: 1px solid var(--el-border-color-light);
    border-radius: 10px;
    padding: 16px;
    background: #fff;
}

.article-edit__panel-title {
    font-size: 14px;
    font-weight: 600;
}

.article-edit__panel-title-wrap {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
}

.article-edit__draft-actions {
    display: flex;
    align-items: center;
    gap: 8px;
}

.article-edit__draft-tip {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    margin-bottom: 12px;
}

.article-edit__title-box,
.article-edit__editor-box,
.article-edit__field {
    width: 100%;
}

.article-edit__field-actions {
    display: flex;
    justify-content: flex-end;
    margin-top: 4px;
}

.article-edit__author-picker {
    display: flex;
    gap: 8px;
}

.article-edit__author-input {
    flex: 1;
}

.article-edit__author-filter {
    width: 120px;
    flex-shrink: 0;
}

.article-edit__author-option {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
}

.article-edit__meta {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 2px 0 6px 85px;
}

@media (max-width: 1280px) {
    .article-edit__meta {
        margin-left: 0;
    }
}

@media (max-width: 768px) {
    .article-edit__panel-title-wrap {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
    }

    .article-edit__draft-actions {
        flex-wrap: wrap;
    }
}
</style>
