<!--
/**
 * @copyright Tomda (https://www.tomda.top)
 * @copyright UIED技术团队 (https://fsuied.com)
 * @author UIED技术团队
 * @createDate 2026.2.11
 */
-->
<template>
    <div class="edit-popup">
        <popup
            ref="popupRef"
            :title="popupTitle"
            :async="true"
            width="620px"
            @confirm="handleSubmit"
            @close="handleClose"
        >
            <el-form ref="formRef" :model="formData" label-width="84px" :rules="formRules">
                <el-form-item label="专题名称" prop="name">
                    <el-input
                        v-model="formData.name"
                        placeholder="请输入专题名称"
                        clearable
                        @blur="fillSlugFromName"
                    />
                </el-form-item>
                <el-form-item label="Slug" prop="slug">
                    <el-input
                        v-model="formData.slug"
                        placeholder="请输入英文别名，如 weekly-update"
                        clearable
                    />
                    <div class="form-tips">仅支持英文/数字/中划线，用于 SEO 与路径复用</div>
                </el-form-item>
                <el-form-item label="专题封面" prop="image">
                    <material-picker v-model="formData.image" :limit="1" />
                </el-form-item>
                <el-form-item label="专题简介" prop="intro">
                    <el-input
                        v-model="formData.intro"
                        type="textarea"
                        :autosize="{ minRows: 3, maxRows: 5 }"
                        maxlength="255"
                        show-word-limit
                        clearable
                    />
                </el-form-item>
                <el-form-item label="排序" prop="sort">
                    <div>
                        <el-input-number v-model="formData.sort" :min="0" :max="9999" />
                        <div class="form-tips">默认为9999（顶置），数值越大越排前</div>
                    </div>
                </el-form-item>
                <el-form-item label="状态" prop="isShow">
                    <el-switch v-model="formData.isShow" :active-value="1" :inactive-value="0" />
                </el-form-item>
            </el-form>
        </popup>
    </div>
</template>
<script lang="ts" setup>
import type { FormInstance } from 'element-plus'
import { articleTopicAdd, articleTopicDetail, articleTopicEdit } from '@/api/article'
import Popup from '@/components/popup/index.vue'
import feedback from '@/utils/feedback'
const emit = defineEmits(['success', 'close'])
const formRef = shallowRef<FormInstance>()
const popupRef = shallowRef<InstanceType<typeof Popup>>()
const mode = ref('add')
const popupTitle = computed(() => {
    return mode.value == 'edit' ? '编辑专题' : '新增专题'
})
const formData = reactive({
    id: '',
    name: '',
    slug: '',
    intro: '',
    image: '',
    sort: 9999,
    isShow: 1
})

const formRules = {
    name: [
        {
            required: true,
            message: '请输入专题名称',
            trigger: ['blur']
        }
    ],
    slug: [
        {
            required: true,
            message: '请输入 slug',
            trigger: ['blur']
        },
        {
            pattern: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
            message: 'slug 仅支持英文、数字与中划线',
            trigger: ['blur']
        }
    ]
}

/**
 * 将文本转换为 slug
 */
const toSlug = (value: string) => {
    return String(value || '')
        .trim()
        .toLowerCase()
        .replace(/[\s_]+/g, '-')
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '')
}

/**
 * 名称失焦时自动补全 slug（仅在未填写时）
 */
const fillSlugFromName = () => {
    if (String(formData.slug || '').trim()) return
    formData.slug = toSlug(formData.name)
}

/**
 * 重置专题表单
 */
const resetFormData = () => {
    formData.id = ''
    formData.name = ''
    formData.slug = ''
    formData.intro = ''
    formData.image = ''
    formData.sort = 9999
    formData.isShow = 1
    formRef.value?.clearValidate()
}

/**
 * 提交专题表单
 */
const handleSubmit = async () => {
    try {
        formData.slug = toSlug(formData.slug)
        await formRef.value?.validate()
    } catch (error) {
        return
    }
    mode.value == 'edit' ? await articleTopicEdit(formData) : await articleTopicAdd(formData)
    feedback.msgSuccess('操作成功')
    popupRef.value?.close()
    emit('success')
}

/**
 * 打开专题弹窗
 */
const open = (type = 'add') => {
    mode.value = type
    if (type === 'add') {
        resetFormData()
    }
    popupRef.value?.open()
}

const setFormData = (data: Record<any, any>) => {
    for (const key in formData) {
        if (data[key] != null && data[key] != undefined) {
            //@ts-ignore
            formData[key] = data[key]
        }
    }
    formData.sort = Number(formData.sort || 9999)
    formData.isShow = Number(formData.isShow || 0) === 1 ? 1 : 0
}

const getDetail = async (row: Record<string, any>) => {
    const data = await articleTopicDetail({
        id: row.id
    })
    setFormData(data)
}

const handleClose = () => {
    resetFormData()
    emit('close')
}

defineExpose({
    open,
    setFormData,
    getDetail
})
</script>
