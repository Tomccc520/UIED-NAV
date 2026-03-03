<template>
    <div>
        <el-card class="!border-none" shadow="never">
            <el-page-header content="用户详情" @back="$router.back()" />
        </el-card>
        <el-card class="mt-4 !border-none" header="基本资料" shadow="never">
            <el-form ref="formRef" class="ls-form" :model="formData" label-width="120px">
                <div class="bg-page py-5 pl-20 mb-10">
                    <div class="mb-3 text-tx-regular">用户头像</div>
                    <div class="flex items-center gap-4">
                        <el-avatar :src="formData.avatar" :size="58" />
                        <material-picker v-model="avatarEditValue" :limit="1" />
                        <el-button type="primary" v-perms="['user:edit']" @click="handleAvatarSave">
                            保存头像
                        </el-button>
                    </div>
                </div>
                <el-form-item label="用户编号："> {{ formData.sn }} </el-form-item>
                <el-form-item label="用户昵称：">
                    {{ formData.nickname }}
                </el-form-item>
                <el-form-item label="用户类型："> {{ formData.userTypeName || '-' }} </el-form-item>
                <el-form-item label="用户等级："> {{ formData.levelName || '-' }} </el-form-item>
                <el-form-item label="用户分组："> {{ formData.groupName || '-' }} </el-form-item>
                <el-form-item label="账号：">
                    {{ formData.username }}
                    <popover-input
                        class="ml-[10px]"
                        :limit="32"
                        @confirm="handleEdit($event, 'username')"
                    >
                        <el-button type="primary" link v-perms="['user:edit']">
                            <icon name="el-icon-EditPen" />
                        </el-button>
                    </popover-input>
                </el-form-item>
                <el-form-item label="真实姓名：">
                    {{ formData.realName || '-' }}
                    <popover-input
                        class="ml-[10px]"
                        :limit="32"
                        @confirm="handleEdit($event, 'realName')"
                    >
                        <el-button type="primary" link v-perms="['user:edit']">
                            <icon name="el-icon-EditPen" />
                        </el-button>
                    </popover-input>
                </el-form-item>
                <el-form-item label="性别：">
                    {{ formData.sexName || '未知' }}
                    <popover-input
                        class="ml-[10px]"
                        type="select"
                        :options="[
                            {
                                label: '未知',
                                value: 0
                            },
                            {
                                label: '男',
                                value: 1
                            },
                            {
                                label: '女',
                                value: 2
                            }
                        ]"
                        @confirm="handleEdit($event, 'sex')"
                    >
                        <el-button type="primary" link v-perms="['user:edit']">
                            <icon name="el-icon-EditPen" />
                        </el-button>
                    </popover-input>
                </el-form-item>
                <el-form-item label="联系电话：">
                    {{ formData.mobileMask || '-' }}
                    <popover-input
                        class="ml-[10px]"
                        type="number"
                        @confirm="handleEdit($event, 'mobile')"
                    >
                        <el-button type="primary" link v-perms="['user:edit']">
                            <icon name="el-icon-EditPen" />
                        </el-button>
                    </popover-input>
                </el-form-item>
                <el-form-item label="用户标签：">
                    {{
                        Array.isArray(formData.tags) && formData.tags.length
                            ? formData.tags.join('、')
                            : '-'
                    }}
                </el-form-item>
                <el-form-item label="注册来源："> {{ formData.channelName || '-' }} </el-form-item>
                <el-form-item label="注册时间："> {{ formData.createTime }} </el-form-item>
                <el-form-item label="最近登录时间："> {{ formData.lastLoginTime }} </el-form-item>
                <el-form-item label="最后登录IP："> {{ formData.ip || '-' }} </el-form-item>
            </el-form>
        </el-card>
    </div>
</template>

<script lang="ts" setup name="consumerDetail">
/**
 * @copyright Tomda (https://www.tomda.top)
 * @copyright UIED技术团队 (https://fsuied.com)
 * @author UIED技术团队
 * @createDate 2026-02-20
 */
import type { FormInstance } from 'element-plus'
import { getUserDetail, userEdit } from '@/api/consumer'
import feedback from '@/utils/feedback'
import { isEmpty } from '@/utils/util'

const route = useRoute()
const formData = reactive({
    avatar: '',
    channel: '',
    channelName: '',
    createTime: '',
    groupName: '',
    ip: '',
    lastLoginIp: '',
    lastLoginTime: '',
    levelName: '',
    mobile: '',
    mobileMask: '',
    nickname: '',
    realName: '',
    sex: 0,
    sexName: '',
    sn: '',
    tags: [] as string[],
    userTypeName: '',
    username: ''
})
const avatarEditValue = ref('')

const formRef = shallowRef<FormInstance>()

/**
 * 获取用户详情并回填页面
 */
const getDetails = async () => {
    const data = await getUserDetail({
        id: route.query.id
    })
    Object.keys(formData).forEach((key) => {
        //@ts-ignore
        formData[key] = data[key]
    })
    avatarEditValue.value = String(data?.avatar || '')
}

/**
 * 处理字段内联编辑
 */
const handleEdit = async (value: string, field: string) => {
    if (isEmpty(value)) return
    await userEdit({
        id: route.query.id,
        field,
        value
    })
    feedback.msgSuccess('编辑成功')
    getDetails()
}

/**
 * 保存用户头像
 */
const handleAvatarSave = async () => {
    await userEdit({
        id: route.query.id,
        field: 'avatar',
        value: avatarEditValue.value || ''
    })
    feedback.msgSuccess('头像更新成功')
    getDetails()
}

getDetails()
</script>
