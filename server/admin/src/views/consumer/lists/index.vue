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
                        placeholder="用户编号/昵称/账号/手机"
                        clearable
                        @keyup.enter="resetPage"
                        @clear="resetPage"
                    />
                </el-form-item>
                <el-form-item label="注册时间">
                    <daterange-picker
                        v-model:startTime="queryParams.startTime"
                        v-model:endTime="queryParams.endTime"
                    />
                </el-form-item>
                <el-form-item label="注册来源">
                    <el-select
                        class="w-[240px]"
                        v-model="queryParams.channel"
                        clearable
                        filterable
                        @change="handleSearchFieldChange"
                    >
                        <el-option label="全部来源" value="" />
                        <el-option
                            v-for="(item, key) in ClientMap"
                            :key="key"
                            :label="item"
                            :value="key"
                        />
                    </el-select>
                </el-form-item>
                <el-form-item label="状态">
                    <el-select
                        class="w-[180px]"
                        v-model="queryParams.status"
                        clearable
                        @change="handleSearchFieldChange"
                    >
                        <el-option label="全部状态" value="" />
                        <el-option label="正常" :value="0" />
                        <el-option label="禁用" :value="1" />
                    </el-select>
                </el-form-item>
                <el-form-item label="用户类型">
                    <el-select
                        class="w-[180px]"
                        v-model="queryParams.userType"
                        clearable
                        @change="handleSearchFieldChange"
                    >
                        <el-option label="全部类型" value="" />
                        <el-option label="普通用户" :value="0" />
                        <el-option label="作者" :value="1" />
                        <el-option label="管理员" :value="2" />
                    </el-select>
                </el-form-item>
                <el-form-item label="用户等级">
                    <el-select
                        class="w-[220px]"
                        v-model="queryParams.vipLevel"
                        clearable
                        filterable
                        @change="handleSearchFieldChange"
                    >
                        <el-option label="全部等级" value="" />
                        <el-option
                            v-for="item in userLevelOptions"
                            :key="item.id"
                            :label="`${item.name}${item.levelValue !== '' ? ` (Lv${item.levelValue})` : ''}`"
                            :value="item.levelValue"
                        />
                    </el-select>
                </el-form-item>
                <el-form-item label="用户分组">
                    <el-select
                        class="w-[220px]"
                        v-model="queryParams.groupId"
                        clearable
                        filterable
                        @change="handleSearchFieldChange"
                    >
                        <el-option label="全部分组" value="" />
                        <el-option
                            v-for="item in userGroupOptions"
                            :key="item.id"
                            :label="item.name"
                            :value="item.id"
                        />
                    </el-select>
                </el-form-item>
                <el-form-item label="用户标签">
                    <el-select
                        class="w-[220px]"
                        v-model="queryParams.tagId"
                        clearable
                        filterable
                        @change="handleSearchFieldChange"
                    >
                        <el-option label="全部标签" value="" />
                        <el-option
                            v-for="item in userTagOptions"
                            :key="item.id"
                            :label="item.name"
                            :value="item.id"
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
                        <el-button v-perms="['user:detail']" type="primary" link @click="handleOpenDetail(row.id)">
                            详情
                        </el-button>
                    </template>
                </el-table-column>
            </el-table>
            <div class="flex justify-end mt-4">
                <pagination v-model="pager" @change="getLists" />
            </div>
        </el-card>

        <el-drawer
            v-model="detailVisible"
            title="用户详情"
            direction="rtl"
            size="560px"
            :destroy-on-close="true"
        >
            <template v-if="detailLoading">
                <div class="flex items-center justify-center h-full">
                    <el-icon class="is-loading"><Loading /></el-icon>
                    <span class="ml-2">正在加载详情...</span>
                </div>
            </template>
            <template v-else>
                <el-descriptions :column="1" border>
                    <el-descriptions-item label="用户编号">{{ detailData.sn || '-' }}</el-descriptions-item>
                    <el-descriptions-item label="头像">
                        <el-avatar :src="detailData.avatar" :size="56" />
                    </el-descriptions-item>
                    <el-descriptions-item label="昵称">{{ detailData.nickname || '-' }}</el-descriptions-item>
                    <el-descriptions-item label="账号">{{ detailData.username || '-' }}</el-descriptions-item>
                    <el-descriptions-item label="手机号码">{{ detailData.mobileMask || '-' }}</el-descriptions-item>
                    <el-descriptions-item label="用户类型">{{ detailData.userTypeName || '-' }}</el-descriptions-item>
                    <el-descriptions-item label="用户等级">{{ detailData.levelName || '-' }}</el-descriptions-item>
                    <el-descriptions-item label="用户分组">{{ detailData.groupName || '-' }}</el-descriptions-item>
                    <el-descriptions-item label="用户标签">
                        {{
                            Array.isArray(detailData.tags) && detailData.tags.length
                                ? detailData.tags.join('、')
                                : '-'
                        }}
                    </el-descriptions-item>
                    <el-descriptions-item label="注册来源">{{ detailData.channelName || '-' }}</el-descriptions-item>
                    <el-descriptions-item label="注册时间">{{ detailData.createTime || '-' }}</el-descriptions-item>
                    <el-descriptions-item label="最近登录时间">{{ detailData.lastLoginTime || '-' }}</el-descriptions-item>
                    <el-descriptions-item label="最后登录IP">{{ detailData.ip || '-' }}</el-descriptions-item>
                </el-descriptions>
                <div class="mt-4 text-right">
                    <el-button type="primary" link @click="handleOpenDetailPage">
                        前往完整详情页
                    </el-button>
                </div>
            </template>
        </el-drawer>
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
import {
    getUserDetail,
    getUserGroupList,
    getUserLevelList,
    getUserList,
    getUserTagList,
    seedUserTestUsers
} from '@/api/consumer'
import { ClientMap } from '@/enums/appEnums'
import feedback from '@/utils/feedback'
import { Loading } from '@element-plus/icons-vue'
const queryParams = reactive({
    keyword: '',
    channel: '',
    status: '',
    userType: '',
    vipLevel: '',
    groupId: '',
    tagId: '',
    startTime: '',
    endTime: '',
    autoSeed: 1
})
const userLevelOptions = ref<any[]>([])
const userGroupOptions = ref<any[]>([])
const userTagOptions = ref<any[]>([])
const seedLoading = ref(false)
const detailVisible = ref(false)
const detailLoading = ref(false)
const currentDetailId = ref<number>(0)
const detailData = reactive<any>({
    avatar: '',
    channelName: '',
    createTime: '',
    groupName: '',
    ip: '',
    lastLoginTime: '',
    levelName: '',
    mobileMask: '',
    nickname: '',
    sn: '',
    tags: [],
    userTypeName: '',
    username: ''
})

const { pager, getLists, resetPage, resetParams } = usePaging({
    fetchFun: getUserList,
    params: queryParams
})

/**
 * 统一处理筛选项变化，提升搜索操作效率
 */
const handleSearchFieldChange = () => {
    resetPage()
}

/**
 * 规范化下拉选项数组，兼容接口返回包裹结构
 */
const normalizeOptionList = (payload: any) => {
    if (Array.isArray(payload)) return payload
    if (Array.isArray(payload?.lists)) return payload.lists
    if (Array.isArray(payload?.list)) return payload.list
    if (Array.isArray(payload?.data)) return payload.data
    if (Array.isArray(payload?.data?.lists)) return payload.data.lists
    if (Array.isArray(payload?.data?.list)) return payload.data.list
    return []
}

/**
 * 加载用户等级/分组/标签筛选项
 */
const loadSearchOptions = async () => {
    try {
        const [levels, groups, tags] = await Promise.all([
            getUserLevelList(),
            getUserGroupList(),
            getUserTagList()
        ])
        userLevelOptions.value = normalizeOptionList(levels).map((item: any) => ({
            id: Number(item?.id || 0),
            name: String(item?.name || ''),
            levelValue: item?.levelValue ?? item?.level_value ?? ''
        }))
        userGroupOptions.value = normalizeOptionList(groups).map((item: any) => ({
            id: Number(item?.id || 0),
            name: String(item?.name || '')
        }))
        userTagOptions.value = normalizeOptionList(tags).map((item: any) => ({
            id: Number(item?.id || 0),
            name: String(item?.name || '')
        }))
    } catch (error) {
        // 下拉选项失败不阻断列表加载
        console.warn('[consumer.list] 加载筛选项失败', error)
    }
}

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

/**
 * 打开侧拉详情并加载用户详情数据
 */
const handleOpenDetail = async (userId: number) => {
    const id = Number(userId || 0)
    if (!id) return
    currentDetailId.value = id
    detailVisible.value = true
    detailLoading.value = true
    try {
        const data = await getUserDetail({ id })
        Object.keys(detailData).forEach((key) => {
            detailData[key] = data?.[key]
        })
    } finally {
        detailLoading.value = false
    }
}

/**
 * 跳转到完整详情页（保留原有详情编辑能力）
 */
const handleOpenDetailPage = () => {
    if (!currentDetailId.value) return
    const path = getUserDetailRoutePath()
    window.open(`${path}?id=${currentDetailId.value}`, '_blank')
}

onActivated(() => {
    getLists().catch(() => {})
    loadSearchOptions().catch(() => {})
})
</script>
