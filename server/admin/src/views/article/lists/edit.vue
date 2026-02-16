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
                label-width="90px"
                :rules="rules"
            >
                <div class="article-edit__grid">
                    <section class="article-edit__main">
                        <el-card shadow="never" class="article-edit__panel">
                            <template #header>
                                <div class="article-edit__panel-head">
                                    <span class="font-medium">正文编辑</span>
                                    <div class="article-edit__actions">
                                        <el-button size="small" @click="saveLocalDraft"
                                            >暂存草稿</el-button
                                        >
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
                            </template>
                            <div class="article-edit__draft-tip">{{ localDraftTip }}</div>
                            <el-form-item
                                label="文章标题"
                                prop="title"
                                class="article-edit__full-item"
                            >
                                <el-input
                                    v-model="formData.title"
                                    placeholder="请输入文章标题"
                                    type="textarea"
                                    :autosize="{ minRows: 2, maxRows: 4 }"
                                    maxlength="64"
                                    show-word-limit
                                    clearable
                                />
                            </el-form-item>
                            <el-row :gutter="16">
                                <el-col :span="12">
                                    <el-form-item label="文章栏目" prop="cid">
                                        <el-select
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
                                <el-col :span="12">
                                    <el-form-item label="作者" prop="author">
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
                                                placeholder="输入用户ID或名称后选择作者"
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
                                                placeholder="身份筛选"
                                                @change="handleAuthorTypeChange"
                                            >
                                                <el-option label="全部" value="" />
                                                <el-option label="普通用户" :value="0" />
                                                <el-option label="作者" :value="1" />
                                                <el-option label="编辑" :value="2" />
                                            </el-select>
                                        </div>
                                        <div class="form-tips">必须从后台用户里选择作者</div>
                                    </el-form-item>
                                </el-col>
                            </el-row>
                            <el-form-item
                                label="文章简介"
                                prop="intro"
                                class="article-edit__full-item"
                            >
                                <el-input
                                    v-model="formData.intro"
                                    placeholder="请输入文章简介"
                                    type="textarea"
                                    :autosize="{ minRows: 2, maxRows: 4 }"
                                    :maxlength="200"
                                    show-word-limit
                                    clearable
                                />
                            </el-form-item>
                            <el-form-item
                                label="摘要"
                                prop="summary"
                                class="article-edit__full-item"
                            >
                                <el-input
                                    type="textarea"
                                    :autosize="{ minRows: 2, maxRows: 5 }"
                                    v-model="formData.summary"
                                    maxlength="200"
                                    show-word-limit
                                    clearable
                                />
                            </el-form-item>
                            <el-form-item
                                label="文章内容"
                                required
                                prop="content"
                                class="article-edit__full-item"
                            >
                                <editor v-model="formData.content" :height="700" width="100%" />
                                <div class="form-tips">
                                    支持选中文本后使用编辑器悬浮 AI 按钮改写。
                                </div>
                            </el-form-item>
                        </el-card>

                        <el-card shadow="never" class="article-edit__panel mt-4">
                            <template #header>
                                <span class="font-medium">其他设置</span>
                            </template>
                            <el-row :gutter="16">
                                <el-col :span="12">
                                    <el-form-item label="文章标签" class="article-edit__full-item">
                                        <el-select
                                            v-model="formData.tagIds"
                                            multiple
                                            clearable
                                            filterable
                                            collapse-tags
                                            collapse-tags-tooltip
                                            placeholder="可选多个标签"
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
                                <el-col :span="12">
                                    <el-form-item label="所属专题" class="article-edit__full-item">
                                        <el-select
                                            v-model="formData.topicId"
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
                            <el-form-item
                                label="文章封面"
                                prop="image"
                                class="article-edit__full-item"
                            >
                                <material-picker v-model="formData.image" :limit="1" />
                                <div class="form-tips">建议尺寸：240*180px</div>
                            </el-form-item>
                            <el-row :gutter="16">
                                <el-col :span="8">
                                    <el-form-item label="排序" prop="sort">
                                        <el-input-number
                                            v-model="formData.sort"
                                            :min="0"
                                            :max="9999"
                                        />
                                    </el-form-item>
                                </el-col>
                                <el-col :span="8">
                                    <el-form-item label="浏览量" prop="visit">
                                        <el-input-number v-model="formData.visit" :min="0" />
                                    </el-form-item>
                                </el-col>
                                <el-col :span="8">
                                    <el-form-item label="状态" required prop="isShow">
                                        <el-radio-group v-model="formData.isShow">
                                            <el-radio :label="1">显示</el-radio>
                                            <el-radio :label="0">隐藏</el-radio>
                                        </el-radio-group>
                                    </el-form-item>
                                </el-col>
                            </el-row>
                        </el-card>
                    </section>

                    <aside class="article-edit__aside">
                        <el-card shadow="never" class="article-edit__ai-card">
                            <template #header>
                                <span class="font-medium">AI 助手</span>
                            </template>
                            <el-input
                                v-model="aiPrompt"
                                type="textarea"
                                :autosize="{ minRows: 3, maxRows: 6 }"
                                placeholder="输入你的要求，例如：偏行业分析风格、分 3 段输出"
                                clearable
                            />
                            <div class="mt-3 flex flex-wrap gap-2">
                                <el-button
                                    type="primary"
                                    :loading="aiLoading"
                                    @click="handleAiGenerate('replace')"
                                >
                                    生成正文草稿
                                </el-button>
                                <el-button
                                    type="success"
                                    :loading="aiLoading"
                                    @click="handleAiGenerate('append')"
                                >
                                    续写草稿
                                </el-button>
                                <el-button
                                    type="warning"
                                    :loading="aiLoading"
                                    @click="handleAiGenerate('polish')"
                                >
                                    润色草稿
                                </el-button>
                            </div>
                            <el-divider />
                            <el-input
                                v-model="aiDraftText"
                                type="textarea"
                                :autosize="{ minRows: 10, maxRows: 18 }"
                                placeholder="AI 生成草稿会显示在这里"
                            />
                            <div class="mt-3 flex flex-wrap gap-2">
                                <el-button
                                    type="primary"
                                    :disabled="!aiDraftText"
                                    @click="applyAiDraft('replace')"
                                >
                                    替换正文
                                </el-button>
                                <el-button
                                    type="success"
                                    :disabled="!aiDraftText"
                                    @click="applyAiDraft('append')"
                                >
                                    追加正文
                                </el-button>
                                <el-button :disabled="!aiDraftText" @click="copyAiDraft"
                                    >复制草稿</el-button
                                >
                                <el-button :disabled="!aiDraftText" @click="clearAiDraft"
                                    >清空草稿</el-button
                                >
                            </div>
                        </el-card>
                    </aside>
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
import {
    articleCateAll,
    articleDetail,
    articleEdit,
    articleAdd,
    articleImportWechat,
    articleTagAll,
    articleTopicAll
} from '@/api/article'
import { getAuthorUserOptions } from '@/api/consumer'
import { transferEditorContentImages, transferRemoteImages } from '@/api/file'
import { uiedAiChat } from '@/api/uied'
import useMultipleTabs from '@/hooks/useMultipleTabs'

type AiGenerateMode = 'replace' | 'append' | 'polish'
type AuthorOptionItem = {
    value: string
    label: string
    nickname: string
    username: string
    realName: string
    userType: number
    userTypeName: string
}

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
const aiLoading = ref(false)
const aiRewriting = ref(false)
const aiPrompt = ref('')
const aiDraftText = ref('')
const importWechatLoading = ref(false)
const transferImagesLoading = ref(false)
const localDraftExists = ref(false)
const localDraftTime = ref('')
const authorOptionsLoading = ref(false)
const authorUserTypeFilter = ref<number | ''>('')
const authorOptions = ref<AuthorOptionItem[]>([])
const authorKeyword = ref('')
const rules = reactive({
    title: [{ required: true, message: '请输入文章标题', trigger: 'blur' }],
    cid: [{ required: true, message: '请选择文章栏目', trigger: 'blur' }],
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
        ? formData.tagIds.map((id: any) => Number(id)).filter((id: number) => id > 0)
        : []
    formData.topicId = Number(formData.topicId || 0)
    const authorUserId = Number(data?.authorUser?.userId || 0)
    if (authorUserId > 0) {
        formData.author = String(authorUserId)
        const exists = authorOptions.value.some((item) => item.value === String(authorUserId))
        if (!exists) {
            authorOptions.value.unshift({
                value: String(authorUserId),
                label: `${String(
                    data?.authorUser?.nickname || data?.author || `用户${authorUserId}`
                )}（ID:${authorUserId}）`,
                nickname: String(data?.authorUser?.nickname || ''),
                username: '',
                realName: '',
                userType: Number(data?.authorUser?.userType || 0),
                userTypeName: '作者'
            })
        }
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

const draftStorageKey = computed(() => {
    const id = String(route.query.id || 'new')
    return `article_edit_draft_${id}`
})

const localDraftTip = computed(() => {
    if (!localDraftExists.value) return '暂无本地草稿，可点击“暂存草稿”保存编辑进度。'
    return `已存在草稿：${localDraftTime.value || '-'}`
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
 * 当前选中作者名称（用于提示词增强）
 */
const selectedAuthorName = computed(() => {
    const value = String(formData.author || '').trim()
    if (!value) return ''
    const item = authorOptions.value.find((option) => String(option.value) === value)
    if (!item) return `用户${value}`
    return item.nickname || item.username || item.realName || `用户${value}`
})

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
 * 获取可持久化的草稿数据
 */
const getPersistFormData = () => ({
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
})

/**
 * 格式化草稿时间
 */
const formatDraftTime = (timestamp: number) => {
    const date = new Date(timestamp)
    const pad = (num: number) => String(num).padStart(2, '0')
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(
        date.getHours()
    )}:${pad(date.getMinutes())}`
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
 * 暂存草稿到本地
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
 * 从本地恢复草稿
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
 * 从输入文本中提取公众号链接
 */
const extractWechatArticleUrl = (raw: string) => {
    const text = String(raw || '').trim()
    if (!text) return ''
    const markdownMatch = text.match(/\[[^\]]*\]\((https?:\/\/[^)\s]+)\)/i)
    if (markdownMatch?.[1]) {
        return String(markdownMatch[1] || '').trim()
    }
    const directMatch = text.match(/https?:\/\/[^\s]+/i)
    if (!directMatch?.[0]) return text
    return String(directMatch[0] || '')
        .trim()
        .replace(/[)\],;]+$/g, '')
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
 * 判断是否为本地素材地址
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
 * 判断封面是否需要转存
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
    try {
        const data: any = await articleImportWechat({ url: inputUrl })
        const importedContent = String(data?.content || '').trim()
        if (!importedContent) {
            feedback.msgWarning('导入结果为空，请确认公众号链接是否可访问')
            return
        }
        const importedTitle = String(data?.title || '').trim()
        const importedIntro = String(data?.intro || '').trim()
        const importedAuthor = String(data?.author || '').trim()
        const importedImage =
            String(data?.image || '').trim() || extractFirstImageUrlFromHtml(importedContent)
        if (importedTitle) formData.title = importedTitle
        if (importedIntro) formData.intro = importedIntro
        formData.content = importedContent
        if (!String(formData.image || '').trim() && importedImage) {
            formData.image = importedImage
        }
        if (!String(formData.summary || '').trim() && formData.intro) {
            formData.summary = String(formData.intro || '')
                .trim()
                .slice(0, 200)
        }
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
        feedback.msgSuccess('公众号文章导入成功')
    } catch (error: any) {
        feedback.msgError(error?.message || '公众号导入失败')
    } finally {
        importWechatLoading.value = false
    }
}

/**
 * 一键转存正文外链图片（含封面兜底转存）
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
    try {
        const data: any = await transferEditorContentImages({
            contentHtml: html,
            cid: 0
        })
        const nextHtml = String(data?.contentHtml || '')
        const count = Number(data?.count || 0)
        const total = Number(data?.total || 0)
        const failed = Array.isArray(data?.failed) ? data.failed : []

        if (nextHtml) {
            formData.content = nextHtml
        }

        const coverUrl = String(formData.image || '').trim()
        let coverTransferred = false
        let coverTransferError = ''
        if (isTransferableCoverUrl(coverUrl)) {
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

        if (total === 0 && !coverTransferred && !coverTransferError) {
            feedback.msgSuccess('未检测到可转存的外链图片（含封面）')
            return
        }
        if (total === 0 && coverTransferred) {
            feedback.msgSuccess('正文未检测到外链图片，封面图已转存到素材库')
            return
        }
        if (total === 0 && coverTransferError) {
            feedback.msgWarning(`正文未检测到外链图片，${coverTransferError}`)
            return
        }
        if (count > 0 && failed.length === 0) {
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
            feedback.msgWarning(`已转存正文 ${count}/${total} 张，失败 ${failed.length} 张`)
            return
        }
        if (failed.length > 0) {
            feedback.msgWarning('未转存成功（可能外链限制或图片不可访问）')
            return
        }
        if (coverTransferred) {
            feedback.msgSuccess('正文转存未命中，封面图已转存')
            return
        }
        feedback.msgWarning(coverTransferError || '未转存成功（可能外链限制或图片不可访问）')
    } catch (error: any) {
        feedback.msgError(error?.message || '正文图片转存失败')
    } finally {
        transferImagesLoading.value = false
    }
}

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
 * 统一解析 AI 响应文本
 */
const parseAiReply = (result: any) => {
    const reply = result?.reply || result?.content || result?.data?.reply || ''
    return normalizeAiReply(reply)
}

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
    if (selectedCateName.value) prompt += `文章栏目：${selectedCateName.value}\n`
    if (selectedAuthorName.value) prompt += `作者：${selectedAuthorName.value}\n`
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
        const draft = parseAiReply(result)
        if (!draft) {
            feedback.msgWarning('AI 未返回可用结果，请调整后重试')
            return
        }
        aiDraftText.value = draft
        feedback.msgSuccess('AI 草稿已生成，可在右侧选择替换或追加')
    } catch (error: any) {
        feedback.msgError(error?.msg || error?.message || 'AI 处理失败')
    } finally {
        aiLoading.value = false
    }
}

/**
 * 将 AI 草稿应用到正文
 */
const applyAiDraft = (mode: 'replace' | 'append') => {
    const draft = aiDraftText.value.trim()
    if (!draft) {
        feedback.msgWarning('暂无可用草稿')
        return
    }
    const html = plainTextToHtml(draft)
    if (mode === 'append' && (formData.content || '').trim()) {
        formData.content = `${formData.content}<p><br/></p>${html}`
        feedback.msgSuccess('已追加到正文')
        return
    }
    formData.content = html
    feedback.msgSuccess('已替换正文')
}

/**
 * 复制 AI 草稿
 */
const copyAiDraft = async () => {
    const draft = aiDraftText.value.trim()
    if (!draft) return
    try {
        await navigator.clipboard.writeText(draft)
        feedback.msgSuccess('草稿已复制')
    } catch (error: any) {
        feedback.msgError(error?.message || '复制失败')
    }
}

/**
 * 清空 AI 草稿
 */
const clearAiDraft = () => {
    aiDraftText.value = ''
}

/**
 * 处理编辑器选中文本的 AI 改写事件
 */
const handleAiHover = async (event: Event) => {
    const detail = (event as CustomEvent).detail || {}
    const selectedText: string = detail.text
    const editor = detail.editor
    if (!selectedText || aiRewriting.value) return

    aiRewriting.value = true
    try {
        const result = await uiedAiChat({
            message: `请优化改写以下文本，保持原意但使其更专业流畅，直接返回改写后的纯文本：\n\n${selectedText}`,
            context: '文章内容编辑'
        })
        const newText = parseAiReply(result)
        if (!newText) {
            feedback.msgWarning('AI 未返回可用改写内容')
            return
        }
        if (editor && typeof editor.insertText === 'function') {
            editor.insertText(newText)
            feedback.msgSuccess('AI 改写完成')
        }
    } catch (error: any) {
        feedback.msgError(error?.msg || error?.message || 'AI 改写失败')
    } finally {
        aiRewriting.value = false
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
    localStorage.removeItem(draftStorageKey.value)
    refreshLocalDraftState()
    feedback.msgSuccess('操作成功')
    removeTab()
    router.back()
}

/**
 * 绑定编辑器 AI 悬浮菜单事件
 */
onMounted(() => {
    window.addEventListener('wangeditor-ai-hover', handleAiHover as EventListener)
    refreshLocalDraftState()
    fetchAuthorOptions('')
})

/**
 * 解绑编辑器 AI 悬浮菜单事件
 */
onBeforeUnmount(() => {
    window.removeEventListener('wangeditor-ai-hover', handleAiHover as EventListener)
})

route.query.id && getDetails()
</script>

<style lang="scss" scoped>
.article-edit {
    &__grid {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 360px;
        gap: 20px;
        align-items: flex-start;
    }

    &__main {
        min-width: 0px;
    }

    &__panel {
        :deep(.el-card__body) {
            padding-bottom: 8px;
        }
    }

    &__panel-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
    }

    &__actions {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
    }

    &__draft-tip {
        font-size: 12px;
        color: var(--el-text-color-secondary);
        margin-bottom: 10px;
    }

    &__full-item {
        :deep(.el-form-item__content) {
            width: 100%;
        }
    }

    &__aside {
        position: sticky;
        top: 76px;
    }

    &__ai-card {
        :deep(.el-card__body) {
            padding-top: 12px;
        }
    }

    &__author-picker {
        display: flex;
        gap: 8px;
        width: 100%;
    }

    &__author-input {
        flex: 1;
    }

    &__author-filter {
        width: 110px;
        flex-shrink: 0;
    }

    &__author-option {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
    }
}

@media (max-width: 1200px) {
    .article-edit {
        &__grid {
            grid-template-columns: minmax(0, 1fr);
        }

        &__aside {
            position: static;
        }

        &__panel-head {
            flex-direction: column;
            align-items: flex-start;
        }
    }
}
</style>
