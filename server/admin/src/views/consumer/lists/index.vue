<template>
    <div>
        <el-alert
            type="info"
            :closable="false"
            show-icon
            class="mb-4"
            title="这里是站点终端用户列表（用于前台登录/会员等级），不是系统管理员列表。"
        />
        <el-card class="!border-none" shadow="never">
            <el-form ref="formRef" class="mb-[-16px]" :model="queryParams" :inline="true">
                <el-form-item label="用户信息">
                    <el-input
                        class="w-[280px]"
                        v-model="queryParams.keyword"
                        placeholder="用户编号/昵称/手机号码"
                        clearable
                        @keyup.enter="resetPage"
                    />
                </el-form-item>
                <el-form-item label="注册时间">
                    <daterange-picker
                        v-model:startTime="queryParams.startTime"
                        v-model:endTime="queryParams.endTime"
                    />
                </el-form-item>
                <el-form-item label="注册来源">
                    <el-select class="w-[280px]" v-model="queryParams.channel">
                        <el-option
                            v-for="(item, key) in ClientMap"
                            :key="key"
                            :label="item"
                            :value="key"
                        />
                    </el-select>
                </el-form-item>
                <el-form-item>
                    <el-button type="primary" @click="resetPage">查询</el-button>
                    <el-button @click="resetParams">重置</el-button>
                    <el-button
                        v-perms="['user:seed:testUsers']"
                        :loading="seedLoading"
                        @click="handleSeedTestUsers"
                    >
                        初始化测试用户
                    </el-button>
                </el-form-item>
            </el-form>
        </el-card>
        <el-card class="!border-none mt-4" shadow="never">
            <el-table size="large" v-loading="pager.loading" :data="pager.lists">
                <el-table-column label="用户编号" prop="sn" min-width="120" />
                <el-table-column label="头像" min-width="100">
                    <template #default="{ row }">
                        <el-avatar :src="row.avatar" :size="50" />
                    </template>
                </el-table-column>
                <el-table-column label="昵称" prop="nickname" min-width="100" />
                <el-table-column label="账号" prop="username" min-width="120" />
                <el-table-column label="手机号码" prop="mobileMask" min-width="120" />
                <el-table-column label="用户类型" prop="userTypeName" min-width="110" />
                <el-table-column label="用户等级" prop="levelName" min-width="110" />
                <el-table-column label="性别" prop="sexName" min-width="100" />
                <el-table-column label="注册来源" min-width="100">
                    <template #default="{ row }">
                        {{ row.channelName || getChannelLabel(row.channel) }}
                    </template>
                </el-table-column>
                <el-table-column label="注册时间" prop="createTime" min-width="120" />
                <el-table-column label="操作" width="120" fixed="right">
                    <template #default="{ row }">
                        <el-button v-perms="['user:detail']" type="primary" link>
                            <router-link
                                :to="{
                                    path: getUserDetailRoutePath(),
                                    query: {
                                        id: row.id
                                    }
                                }"
                            >
                                详情
                            </router-link>
                        </el-button>
                    </template>
                </el-table-column>
            </el-table>
            <div class="flex justify-end mt-4">
                <pagination v-model="pager" @change="getLists" />
            </div>
        </el-card>
    </div>
</template>
<script lang="ts" setup name="consumerLists">
/**
 * @copyright Tomda (https://www.tomda.top)
 * @copyright UIED技术团队 (https://fsuied.com)
 * @author UIED技术团队
 * @createDate 2026-02-20
 */
import { usePaging } from '@/hooks/usePaging'
import { getRoutePath } from '@/router'
import { getUserList, seedUserTestUsers } from '@/api/consumer'
import { ClientMap } from '@/enums/appEnums'
import feedback from '@/utils/feedback'
const queryParams = reactive({
    keyword: '',
    channel: '',
    startTime: '',
    endTime: '',
    autoSeed: 1
})
const seedLoading = ref(false)

const { pager, getLists, resetPage, resetParams } = usePaging({
    fetchFun: getUserList,
    params: queryParams
})

/**
 * 初始化测试用户并刷新列表
 */
const handleSeedTestUsers = async () => {
    seedLoading.value = true
    try {
        const res = await seedUserTestUsers()
        const rows = Array.isArray(res?.lists) ? res.lists : []
        const createdCount = rows.filter((item: any) => item?.action === 'created').length
        const updatedCount = rows.filter((item: any) => item?.action === 'updated').length
        feedback.msgSuccess(`初始化完成：新增 ${createdCount} 条，更新 ${updatedCount} 条`)
        await getLists()
    } finally {
        seedLoading.value = false
    }
}

/**
 * 获取注册来源文案
 */
const getChannelLabel = (channel: any) => {
    const key = Number(channel) as keyof typeof ClientMap
    return ClientMap[key] || channel || '-'
}

/**
 * 获取用户详情路由（兼容旧菜单路由异常）
 */
const getUserDetailRoutePath = () => {
    const routePath = getRoutePath('user:detail') || ''
    if (routePath.endsWith('/consumer/detail')) {
        return routePath.replace('/consumer/detail', '/detail')
    }
    return routePath || '/user-center/detail'
}
onActivated(() => {
    getLists().catch(() => {})
})
</script>
