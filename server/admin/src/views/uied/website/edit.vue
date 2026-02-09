<!--
 * @file views/uied/website/edit.vue
 * @description UIED 网站编辑页面 - 独立页面模式，对接素材中心
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
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
                    <el-form ref="editFormRef" :model="editData" :rules="editRules" label-width="100px" style="max-width: 800px;">
                        <el-form-item label="网站名称" prop="name">
                            <el-input v-model="editData.name" placeholder="请输入网站名称" />
                        </el-form-item>
                        <el-form-item label="固定链接">
                            <el-input v-model="editData.slug" placeholder="留空自动生成，用于详情页URL">
                                <template #prepend>/website/</template>
                            </el-input>
                        </el-form-item>
                        <el-form-item label="网站URL" prop="url">
                            <el-input v-model="editData.url" placeholder="请输入网站URL" />
                        </el-form-item>
                        <el-form-item label="所属分类" prop="categoryId">
                            <el-select v-model="editData.categoryId" placeholder="请选择分类" style="width: 100%">
                                <el-option v-for="item in categoryList" :key="item.id" :label="item.name" :value="item.id" />
                            </el-select>
                        </el-form-item>
                        <el-form-item label="网站描述">
                            <el-input v-model="editData.description" type="textarea" :rows="3" placeholder="请输入网站描述" />
                        </el-form-item>
                        <el-form-item label="图标URL">
                            <el-input v-model="editData.iconUrl" placeholder="请输入图标URL" />
                        </el-form-item>
                        <el-form-item label="标签">
                            <el-select v-model="editData.tags" multiple filterable allow-create default-first-option placeholder="输入标签后回车添加" style="width: 100%" />
                        </el-form-item>
                        <el-row :gutter="16">
                            <el-col :span="8">
                                <el-form-item label="排序">
                                    <el-input-number v-model="editData.sortOrder" :min="0" :max="9999" style="width: 100%" />
                                </el-form-item>
                            </el-col>
                            <el-col :span="8">
                                <el-form-item label="状态">
                                    <el-switch v-model="editData.isActive" :active-value="1" :inactive-value="0" />
                                </el-form-item>
                            </el-col>
                            <el-col :span="8">
                                <el-form-item label="置顶">
                                    <el-switch v-model="editData.isPinned" :active-value="1" :inactive-value="0" />
                                </el-form-item>
                            </el-col>
                        </el-row>
                    </el-form>
                </el-tab-pane>

                <!-- 详情页内容 -->
                <el-tab-pane label="详情页" name="detail">
                    <el-form :model="editData" label-width="100px" style="max-width: 900px;">
                        <el-form-item label="访问按钮">
                            <el-input v-model="editData.visitBtnText" placeholder="默认：访问网站" />
                        </el-form-item>

                        <el-divider content-position="left">缩略图</el-divider>
                        <el-form-item>
                            <template #label>
                                <span>缩略图</span>
                                <el-tooltip content="网站预览缩略图，支持从素材中心选择或输入URL" placement="top">
                                    <el-icon style="margin-left: 4px; cursor: help; color: #909399;"><QuestionFilled /></el-icon>
                                </el-tooltip>
                            </template>
                            <div style="width: 100%">
                                <div class="flex gap-2 mb-2">
                                    <el-input v-model="editData.thumbnail" placeholder="输入缩略图URL或从素材中心选择" clearable />
                                    <el-button @click="openThumbnailPicker">
                                        <el-icon class="mr-1"><FolderOpened /></el-icon>
                                        素材中心
                                    </el-button>
                                    <el-button @click="handleCaptureThumbnail" :loading="capturingThumbnail">
                                        截图获取
                                    </el-button>
                                </div>
                                <div v-if="editData.thumbnail" class="mt-2">
                                    <el-image :src="editData.thumbnail" style="max-width: 320px; max-height: 200px; border-radius: 4px; border: 1px solid #eee;" fit="contain" :preview-src-list="[editData.thumbnail]" />
                                </div>
                            </div>
                        </el-form-item>

                        <el-divider content-position="left">详情内容</el-divider>
                        <el-form-item label="详情内容">
                            <div style="width: 100%">
                                <div class="mb-2 flex justify-end">
                                    <el-button type="primary" size="small" :loading="aiGenerating" @click="handleAiGenerateContent">
                                        <el-icon class="mr-1"><MagicStick /></el-icon>
                                        AI 生成内容
                                    </el-button>
                                </div>
                                <editor v-model="editData.detailContent" :height="500" mode="default" />
                            </div>
                        </el-form-item>

                        <el-divider content-position="left">产品截图</el-divider>
                        <el-form-item>
                            <template #label>
                                <span>产品截图</span>
                                <el-tooltip content="从素材中心选择产品截图，将在详情页展示为图片画廊" placement="top">
                                    <el-icon style="margin-left: 4px; cursor: help; color: #909399;"><QuestionFilled /></el-icon>
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
                    <el-form :model="editData" label-width="100px" style="max-width: 800px;">
                        <el-form-item label="SEO 标题">
                            <el-input v-model="editData.seoTitle" placeholder="留空使用网站名称" maxlength="100" show-word-limit />
                        </el-form-item>
                        <el-form-item label="SEO 描述">
                            <el-input v-model="editData.seoDescription" type="textarea" :rows="3" placeholder="留空使用网站描述" maxlength="300" show-word-limit />
                        </el-form-item>
                        <el-form-item label="SEO 关键词">
                            <el-input v-model="editData.seoKeywords" placeholder="多个关键词用逗号分隔" maxlength="200" show-word-limit />
                        </el-form-item>
                    </el-form>
                </el-tab-pane>
            </el-tabs>
        </el-card>

        <!-- 底部操作栏 -->
        <div class="website-edit-footer">
            <el-button @click="handleBack">取消</el-button>
            <el-button type="primary" :loading="submitLoading" @click="handleSubmit">保存</el-button>
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
import { uiedWebsiteAdd, uiedWebsiteEdit, uiedWebsiteDetail, uiedCategoryAll, uiedAiGenerateDetailContent, uiedAiChat } from '@/api/uied'
import feedback from '@/utils/feedback'
import type { FormInstance, FormRules } from 'element-plus'
import { QuestionFilled, MagicStick, FolderOpened } from '@element-plus/icons-vue'
import editor from '@/components/editor/index.vue'
import MaterialPicker from '@/components/material/picker.vue'

const route = useRoute()
const router = useRouter()

// 页面状态
const pageLoading = ref(false)
const submitLoading = ref(false)
const activeTab = ref('basic')
const editFormRef = ref<FormInstance>()

// 是否编辑模式
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

// 截图列表（素材中心管理）
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
    seoKeywords: '',
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
        editData.isActive = (data.isActive || data.status !== 'disabled') ? 1 : 0
        editData.isPinned = data.isPinned ? 1 : 0
        editData.detailContent = data.detailContent || data.detail_content || ''
        editData.visitBtnText = data.visitBtnText || data.visit_btn_text || ''
        editData.thumbnail = data.thumbnail || ''
        editData.seoTitle = data.seoTitle || data.seo_title || ''
        editData.seoDescription = data.seoDescription || data.seo_description || ''
        editData.seoKeywords = data.seoKeywords || data.seo_keywords || ''
        // 截图
        const screenshots = data.screenshots || []
        screenshotList.value = Array.isArray(screenshots) ? [...screenshots] : []
    } catch (error) {
        console.error('获取网站详情失败:', error)
        feedback.msgError('获取网站详情失败')
    } finally {
        pageLoading.value = false
    }
}

// 缩略图素材选择器
const thumbnailPickerRef = ref<InstanceType<typeof MaterialPicker>>()
const openThumbnailPicker = () => {
    thumbnailPickerRef.value?.showPopup(-1)
}
const handleThumbnailSelect = (urls: string | string[]) => {
    const url = Array.isArray(urls) ? urls[0] : urls
    if (url) editData.thumbnail = url
}

// 截图获取缩略图
const capturingThumbnail = ref(false)
const handleCaptureThumbnail = async () => {
    if (!editData.url) {
        feedback.msgWarning('请先填写网站URL')
        return
    }
    capturingThumbnail.value = true
    try {
        editData.thumbnail = `https://image.thum.io/get/width/1280/crop/800/${editData.url}`
        feedback.msgSuccess('缩略图URL已生成，请检查预览效果')
    } catch (error) {
        feedback.msgError('获取缩略图失败')
    } finally {
        capturingThumbnail.value = false
    }
}

// AI 生成详情内容
const aiGenerating = ref(false)
const handleAiGenerateContent = async () => {
    if (!editData.id) {
        feedback.msgWarning('请先保存网站基础信息后再使用 AI 生成')
        return
    }
    aiGenerating.value = true
    try {
        const res = await uiedAiGenerateDetailContent({ websiteId: editData.id })
        if (res?.content) {
            editData.detailContent = res.content
            feedback.msgSuccess('AI 内容生成成功')
        }
    } catch (error: any) {
        feedback.msgError(error?.msg || error?.message || 'AI 生成失败，请检查 AI 配置')
    } finally {
        aiGenerating.value = false
    }
}

// 提交保存
const handleSubmit = async () => {
    await editFormRef.value?.validate()
    submitLoading.value = true
    try {
        const screenshots = screenshotList.value.filter((url: string) => url && url.trim() !== '')
        const submitData = {
            ...editData,
            screenshots,
            thumbnail: editData.thumbnail || null,
            order: editData.sortOrder,
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

// 返回列表
const handleBack = () => {
    router.back()
}

// AI 悬浮菜单事件处理（选中文本后点击 AI 按钮）
const aiRewriting = ref(false)
const handleAiHover = async (e: Event) => {
    const { text, editor } = (e as CustomEvent).detail
    if (!text || aiRewriting.value) return

    aiRewriting.value = true
    try {
        const res = await uiedAiChat({
            message: `请优化改写以下文本，保持原意但使其更加专业流畅，直接返回改写后的文本，不要加任何解释：\n\n${text}`,
            context: '网站详情内容编辑'
        })
        const newText = res?.reply || res?.content || res?.data?.reply
        if (newText && editor) {
            editor.insertText(newText)
            feedback.msgSuccess('AI 改写完成')
        }
    } catch (error: any) {
        feedback.msgError(error?.msg || 'AI 改写失败，请检查 AI 配置')
    } finally {
        aiRewriting.value = false
    }
}

onMounted(async () => {
    await getCategoryList()
    if (route.query.id) {
        await loadDetail(route.query.id as string)
    }
    // 监听编辑器 AI 悬浮按钮事件
    window.addEventListener('wangeditor-ai-hover', handleAiHover)
})

onBeforeUnmount(() => {
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
</style>
