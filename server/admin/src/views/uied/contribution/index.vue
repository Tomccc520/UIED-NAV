<!--
 * @copyright Tomda (https://www.tomda.top)
 * @copyright UIED技术团队 (https://fsuied.com)
 * @author UIED技术团队
 * @createDate 2026-02-21
-->
<template>
    <div class="uied-contribution-page">
        <template v-if="!featureDeniedState.denied">
        <el-alert
            title="投稿激励闭环：投稿积分、等级、勋章、优质投稿推荐位"
            type="info"
            :closable="false"
            class="mb-4"
        />

        <el-tabs v-model="activeTab">
            <el-tab-pane label="积分设置" name="settings">
                <el-card class="!border-none mb-4" shadow="never">
                    <template #header>
                        <div class="flex items-center justify-between">
                            <span class="font-medium">积分规则</span>
                            <el-button type="primary" :loading="savingSettings" @click="handleSaveSettings">
                                保存设置
                            </el-button>
                        </div>
                    </template>
                    <el-form :model="settingsForm" label-width="170px" class="settings-form">
                        <el-form-item label="启用投稿激励">
                            <el-switch v-model="settingsForm.enabled" />
                        </el-form-item>
                        <el-form-item label="投稿提交积分">
                            <el-input-number v-model="settingsForm.submitPoints" :min="0" :max="1000" />
                        </el-form-item>
                        <el-form-item label="审核通过积分">
                            <el-input-number v-model="settingsForm.publishPoints" :min="0" :max="2000" />
                        </el-form-item>
                        <el-form-item label="推荐位奖励积分">
                            <el-input-number v-model="settingsForm.featuredPoints" :min="0" :max="5000" />
                        </el-form-item>
                        <el-form-item label="每日投稿积分上限">
                            <el-input-number v-model="settingsForm.dailySubmitLimit" :min="1" :max="1000" />
                        </el-form-item>
                        <el-form-item label="每日审核通过积分上限">
                            <el-input-number v-model="settingsForm.dailyPublishLimit" :min="1" :max="1000" />
                        </el-form-item>
                        <el-form-item label="自动授予勋章">
                            <el-switch v-model="settingsForm.autoGrantBadge" />
                        </el-form-item>
                    </el-form>
                </el-card>

                <el-card class="!border-none" shadow="never">
                    <template #header>
                        <div class="flex items-center justify-between">
                            <span class="font-medium">投稿排行榜预览</span>
                            <el-button @click="loadLeaderboard">刷新</el-button>
                        </div>
                    </template>
                    <el-table :data="leaderboardRows" size="small">
                        <el-table-column prop="rank" label="排名" width="80" />
                        <el-table-column prop="nickname" label="昵称" min-width="140" />
                        <el-table-column prop="levelName" label="等级" width="120" />
                        <el-table-column prop="totalPoints" label="总积分" width="120" />
                        <el-table-column prop="publishCount" label="通过数" width="110" />
                        <el-table-column prop="featuredCount" label="推荐数" width="110" />
                        <el-table-column prop="badgeCount" label="勋章数" width="100" />
                    </el-table>
                </el-card>
            </el-tab-pane>

            <el-tab-pane label="勋章管理" name="badges">
                <el-card class="!border-none" shadow="never">
                    <template #header>
                        <div class="flex items-center justify-between">
                            <span class="font-medium">勋章规则</span>
                            <el-button type="primary" @click="handleAddBadge">新增勋章</el-button>
                        </div>
                    </template>
                    <el-table :data="badgeRows" size="small">
                        <el-table-column label="勋章键" min-width="150">
                            <template #default="{ row }">
                                <el-input v-model="row.badgeKey" placeholder="badge-key" />
                            </template>
                        </el-table-column>
                        <el-table-column label="勋章名称" min-width="140">
                            <template #default="{ row }">
                                <el-input v-model="row.badgeName" placeholder="勋章名称" />
                            </template>
                        </el-table-column>
                        <el-table-column label="图标" width="120">
                            <template #default="{ row }">
                                <el-input v-model="row.icon" placeholder="Medal" />
                            </template>
                        </el-table-column>
                        <el-table-column label="颜色" width="130">
                            <template #default="{ row }">
                                <el-input v-model="row.color" placeholder="#409EFF" />
                            </template>
                        </el-table-column>
                        <el-table-column label="所需积分" width="120">
                            <template #default="{ row }">
                                <el-input-number v-model="row.requirePoints" :min="0" :max="1000000" class="!w-full" />
                            </template>
                        </el-table-column>
                        <el-table-column label="所需通过数" width="120">
                            <template #default="{ row }">
                                <el-input-number v-model="row.requirePublishCount" :min="0" :max="100000" class="!w-full" />
                            </template>
                        </el-table-column>
                        <el-table-column label="启用" width="90">
                            <template #default="{ row }">
                                <el-switch v-model="row.isEnabled" />
                            </template>
                        </el-table-column>
                        <el-table-column label="排序" width="110">
                            <template #default="{ row }">
                                <el-input-number v-model="row.sort" :min="1" :max="100000" class="!w-full" />
                            </template>
                        </el-table-column>
                        <el-table-column label="操作" width="150" fixed="right">
                            <template #default="{ row }">
                                <el-button link type="primary" @click="handleSaveBadge(row)">保存</el-button>
                                <el-button link type="danger" @click="handleDeleteBadge(row)">删除</el-button>
                            </template>
                        </el-table-column>
                    </el-table>
                </el-card>
            </el-tab-pane>

            <el-tab-pane label="推荐位" name="featured">
                <el-card class="!border-none" shadow="never">
                    <template #header>
                        <div class="flex items-center justify-between">
                            <span class="font-medium">优质投稿推荐位</span>
                            <el-button type="primary" @click="openFeaturedDialog()">新增推荐位</el-button>
                        </div>
                    </template>
                    <el-table :data="featuredRows" size="small">
                        <el-table-column prop="id" label="ID" width="90" />
                        <el-table-column prop="title" label="标题" min-width="200" />
                        <el-table-column prop="articleId" label="文章ID" width="100" />
                        <el-table-column prop="sort" label="排序" width="90" />
                        <el-table-column label="显示" width="90">
                            <template #default="{ row }">
                                <el-tag :type="row.isShow ? 'success' : 'info'">{{ row.isShow ? '显示' : '隐藏' }}</el-tag>
                            </template>
                        </el-table-column>
                        <el-table-column prop="targetUrl" label="跳转链接" min-width="240" show-overflow-tooltip />
                        <el-table-column label="操作" width="150" fixed="right">
                            <template #default="{ row }">
                                <el-button link type="primary" @click="openFeaturedDialog(row)">编辑</el-button>
                                <el-button link type="danger" @click="handleDeleteFeatured(row)">删除</el-button>
                            </template>
                        </el-table-column>
                    </el-table>
                </el-card>
            </el-tab-pane>

            <el-tab-pane label="用户激励数据" name="users">
                <el-card class="!border-none" shadow="never">
                    <template #header>
                            <div class="flex items-center justify-between">
                                <span class="font-medium">用户积分与等级</span>
                                <div class="flex items-center gap-2 flex-wrap justify-end">
                                    <el-input
                                        v-model="userQuery.keyword"
                                        placeholder="昵称/账号"
                                        clearable
                                        style="width: 220px"
                                        @keyup.enter="loadUsers"
                                        @clear="handleUserSearchChange"
                                    />
                                    <el-input
                                        v-model="userQuery.levelName"
                                        placeholder="等级名称（如 普通/VIP）"
                                        clearable
                                        style="width: 200px"
                                        @keyup.enter="loadUsers"
                                        @clear="handleUserSearchChange"
                                    />
                                    <el-input-number
                                        v-model="userQuery.minPoints"
                                        :min="0"
                                        :max="99999999"
                                        placeholder="最低积分"
                                        style="width: 150px"
                                        @change="handleUserSearchChange"
                                    />
                                    <span class="text-xs text-[#909399]">-</span>
                                    <el-input-number
                                        v-model="userQuery.maxPoints"
                                        :min="0"
                                        :max="99999999"
                                        placeholder="最高积分"
                                        style="width: 150px"
                                        @change="handleUserSearchChange"
                                    />
                                    <el-button type="primary" @click="loadUsers">查询</el-button>
                                    <el-button @click="resetUserSearch">重置</el-button>
                                </div>
                            </div>
                    </template>
                    <el-table :data="userRows" v-loading="userLoading" size="small">
                        <el-table-column prop="id" label="用户ID" width="90" />
                        <el-table-column prop="nickname" label="昵称" min-width="140" />
                        <el-table-column prop="username" label="账号" min-width="140" />
                        <el-table-column prop="levelName" label="等级" width="120" />
                        <el-table-column prop="totalPoints" label="总积分" width="120" />
                        <el-table-column prop="submitCount" label="投稿数" width="110" />
                        <el-table-column prop="publishCount" label="通过数" width="110" />
                        <el-table-column prop="featuredCount" label="推荐数" width="110" />
                        <el-table-column prop="badgeCount" label="勋章数" width="100" />
                        <el-table-column label="操作" width="100" fixed="right">
                            <template #default="{ row }">
                                <el-button link type="primary" @click="openUserDetail(row)">详情</el-button>
                            </template>
                        </el-table-column>
                    </el-table>
                    <div class="mt-4 flex justify-end">
                        <el-pagination
                            background
                            layout="total, prev, pager, next"
                            :total="userPagination.total"
                            :page-size="userPagination.pageSize"
                            :current-page="userPagination.pageNo"
                            @current-change="handleUserPageChange"
                        />
                    </div>
                </el-card>
            </el-tab-pane>

            <el-tab-pane label="积分日志" name="logs">
                <el-card class="!border-none" shadow="never">
                    <template #header>
                            <div class="flex items-center justify-between">
                                <span class="font-medium">积分变更日志</span>
                                <div class="flex items-center gap-2 flex-wrap justify-end">
                                    <el-input
                                        v-model="logQuery.eventType"
                                        placeholder="事件类型（可选）"
                                        clearable
                                        style="width: 200px"
                                        @keyup.enter="loadLogs"
                                        @clear="handleLogSearchChange"
                                    />
                                    <el-input
                                        v-model="logQuery.keyword"
                                        placeholder="昵称/账号"
                                        clearable
                                        style="width: 180px"
                                        @keyup.enter="loadLogs"
                                        @clear="handleLogSearchChange"
                                    />
                                    <el-input-number
                                        v-model="logQuery.userId"
                                        :min="0"
                                        :max="99999999"
                                        placeholder="用户ID"
                                        style="width: 150px"
                                        @change="handleLogSearchChange"
                                    />
                                    <el-button type="primary" @click="loadLogs">查询</el-button>
                                    <el-button @click="resetLogSearch">重置</el-button>
                                </div>
                            </div>
                    </template>
                    <el-table :data="logRows" size="small">
                        <el-table-column prop="id" label="ID" width="90" />
                        <el-table-column prop="eventType" label="事件" min-width="180" />
                        <el-table-column prop="userId" label="用户ID" width="100" />
                        <el-table-column prop="nickname" label="昵称" min-width="120" />
                        <el-table-column prop="pointsChange" label="积分变更" width="110" />
                        <el-table-column prop="balanceAfter" label="变更后积分" width="120" />
                        <el-table-column prop="remark" label="备注" min-width="200" show-overflow-tooltip />
                        <el-table-column prop="createTime" label="时间戳" width="140" />
                    </el-table>
                </el-card>
            </el-tab-pane>

            <el-tab-pane label="字段草案" name="schema">
                <el-card class="!border-none" shadow="never">
                    <template #header>
                        <div class="flex items-center justify-between">
                            <span class="font-medium">后台字段草案（前后端对接）</span>
                            <el-button @click="loadSchema">刷新草案</el-button>
                        </div>
                    </template>
                    <pre class="schema-view">{{ schemaText }}</pre>
                </el-card>
            </el-tab-pane>
        </el-tabs>

        <el-dialog v-model="featuredDialog.visible" :title="featuredDialog.form.id ? '编辑推荐位' : '新增推荐位'" width="720px">
            <el-form :model="featuredDialog.form" label-width="120px">
                <el-form-item label="推荐标题">
                    <el-input v-model="featuredDialog.form.title" placeholder="推荐标题" />
                </el-form-item>
                <el-form-item label="文章ID">
                    <el-input-number v-model="featuredDialog.form.articleId" :min="0" :max="99999999" class="!w-full" />
                </el-form-item>
                <el-form-item label="封面图">
                    <el-input v-model="featuredDialog.form.coverImage" placeholder="图片 URL" />
                </el-form-item>
                <el-form-item label="摘要">
                    <el-input v-model="featuredDialog.form.summary" type="textarea" :rows="3" />
                </el-form-item>
                <el-form-item label="跳转链接">
                    <el-input v-model="featuredDialog.form.targetUrl" placeholder="/article/123" />
                </el-form-item>
                <el-form-item label="排序">
                    <el-input-number v-model="featuredDialog.form.sort" :min="0" :max="100000" />
                </el-form-item>
                <el-form-item label="是否显示">
                    <el-switch v-model="featuredDialog.form.isShow" />
                </el-form-item>
                <el-form-item label="开始时间戳">
                    <el-input-number v-model="featuredDialog.form.startTime" :min="0" :max="9999999999" class="!w-full" />
                </el-form-item>
                <el-form-item label="结束时间戳">
                    <el-input-number v-model="featuredDialog.form.endTime" :min="0" :max="9999999999" class="!w-full" />
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button @click="featuredDialog.visible = false">取消</el-button>
                <el-button type="primary" :loading="featuredDialog.saving" @click="handleSaveFeatured">保存</el-button>
            </template>
        </el-dialog>

        <el-drawer v-model="userDrawer.visible" size="720px" :title="`用户投稿激励详情 #${userDrawer.userId || '-'}`">
            <template v-if="userDrawer.data">
                <el-descriptions :column="2" border class="mb-4">
                    <el-descriptions-item label="昵称">{{ userDrawer.data.user?.nickname || '-' }}</el-descriptions-item>
                    <el-descriptions-item label="账号">{{ userDrawer.data.user?.username || '-' }}</el-descriptions-item>
                    <el-descriptions-item label="等级">{{ userDrawer.data.contribution?.levelName || '-' }}</el-descriptions-item>
                    <el-descriptions-item label="总积分">{{ userDrawer.data.contribution?.totalPoints || 0 }}</el-descriptions-item>
                    <el-descriptions-item label="投稿数">{{ userDrawer.data.contribution?.submitCount || 0 }}</el-descriptions-item>
                    <el-descriptions-item label="通过数">{{ userDrawer.data.contribution?.publishCount || 0 }}</el-descriptions-item>
                    <el-descriptions-item label="推荐数">{{ userDrawer.data.contribution?.featuredCount || 0 }}</el-descriptions-item>
                    <el-descriptions-item label="勋章数">{{ userDrawer.data.contribution?.badgeCount || 0 }}</el-descriptions-item>
                </el-descriptions>

                <el-card class="!border-none mb-4" shadow="never">
                    <template #header>
                        <span class="font-medium">勋章</span>
                    </template>
                    <div class="flex flex-wrap gap-2">
                        <el-tag
                            v-for="badge in userDrawer.data.badges || []"
                            :key="badge.badgeId"
                            :style="{ borderColor: badge.color || '#409EFF', color: badge.color || '#409EFF' }"
                            effect="plain"
                        >
                            {{ badge.badgeName }}
                        </el-tag>
                        <el-empty v-if="(userDrawer.data.badges || []).length === 0" description="暂无勋章" :image-size="80" />
                    </div>
                </el-card>

                <el-card class="!border-none" shadow="never">
                    <template #header>
                        <span class="font-medium">最近积分日志</span>
                    </template>
                    <el-table :data="userDrawer.data.logs || []" size="small">
                        <el-table-column prop="eventType" label="事件" min-width="160" />
                        <el-table-column prop="pointsChange" label="积分变更" width="110" />
                        <el-table-column prop="balanceAfter" label="变更后积分" width="120" />
                        <el-table-column prop="remark" label="备注" min-width="180" show-overflow-tooltip />
                        <el-table-column prop="createTime" label="时间戳" width="140" />
                    </el-table>
                </el-card>
            </template>
        </el-drawer>
        </template>

        <el-card v-else class="!border-none" shadow="never">
            <el-result icon="warning" title="当前版本未授权该功能">
                <template #sub-title>
                    <div class="text-center leading-6">
                        <div>功能键：{{ featureDeniedState.featureKey || 'user_center' }}</div>
                        <div>当前版本：{{ String(featureDeniedState.edition || 'free').toUpperCase() }}</div>
                        <div>请到「许可证中心 / 功能开关」升级或开启后再使用。</div>
                    </div>
                </template>
            </el-result>
        </el-card>
    </div>
</template>

<script lang="ts" setup name="uiedContributionIndex">
/**
 * @copyright Tomda (https://www.tomda.top)
 * @copyright UIED技术团队 (https://fsuied.com)
 * @author UIED技术团队
 * @createDate 2026-02-21
 */
import { computed, onMounted, reactive, ref } from 'vue'
import feedback from '@/utils/feedback'
import {
    uiedContributionBadgeDel,
    uiedContributionBadgeList,
    uiedContributionBadgeSave,
    uiedContributionFeaturedDel,
    uiedContributionFeaturedList,
    uiedContributionFeaturedSave,
    uiedContributionLeaderboard,
    uiedContributionLogList,
    uiedContributionSchema,
    uiedContributionSettingsGet,
    uiedContributionSettingsSave,
    uiedContributionUserDetail,
    uiedContributionUserList
} from '@/api/uied'

interface BadgeRow {
    id?: number
    badgeKey: string
    badgeName: string
    icon: string
    color: string
    description: string
    requirePoints: number
    requirePublishCount: number
    isEnabled: boolean
    sort: number
}

interface FeaturedRow {
    id?: number
    title: string
    articleId: number
    coverImage: string
    summary: string
    targetUrl: string
    sort: number
    isShow: boolean
    startTime: number
    endTime: number
}

const activeTab = ref('settings')
const featureDeniedState = reactive({
    denied: false,
    featureKey: '',
    edition: 'free'
})
const savingSettings = ref(false)
const userLoading = ref(false)
const leaderboardRows = ref<any[]>([])
const badgeRows = ref<BadgeRow[]>([])
const featuredRows = ref<FeaturedRow[]>([])
const userRows = ref<any[]>([])
const logRows = ref<any[]>([])
const schemaData = ref<any>({})

const settingsForm = reactive({
    enabled: true,
    submitPoints: 2,
    publishPoints: 10,
    featuredPoints: 20,
    dailySubmitLimit: 30,
    dailyPublishLimit: 50,
    autoGrantBadge: true
})

const userQuery = reactive({
    pageNo: 1,
    pageSize: 20,
    keyword: '',
    levelName: '',
    minPoints: undefined as number | undefined,
    maxPoints: undefined as number | undefined
})

const userPagination = reactive({
    pageNo: 1,
    pageSize: 20,
    total: 0
})

const logQuery = reactive({
    pageNo: 1,
    pageSize: 20,
    eventType: '',
    keyword: '',
    userId: undefined as number | undefined
})

const featuredDialog = reactive({
    visible: false,
    saving: false,
    form: {
        id: undefined as number | undefined,
        title: '',
        articleId: 0,
        coverImage: '',
        summary: '',
        targetUrl: '',
        sort: 10,
        isShow: true,
        startTime: 0,
        endTime: 0
    }
})

const userDrawer = reactive({
    visible: false,
    userId: 0,
    data: null as any
})

/**
 * 规范化整数值
 */
const toInt = (value: any, fallback: number, min: number, max: number) => {
    const parsed = Number.parseInt(String(value ?? ''), 10)
    if (!Number.isInteger(parsed)) return fallback
    return Math.max(min, Math.min(max, parsed))
}

/**
 * 格式化字段草案文本
 */
const schemaText = computed(() => JSON.stringify(schemaData.value || {}, null, 2))

/**
 * 解析商业版功能未授权错误
 */
const parseCommercialFeatureDenied = (error: any) => {
    const status = Number(error?.response?.status || 0)
    const body = error?.response?.data || {}
    if (status !== 403 || Number(body?.code || 0) !== 403) return null
    const featureKey = String(body?.data?.featureKey || '').trim()
    if (!featureKey) return null
    return {
        featureKey,
        edition: String(body?.data?.edition || 'free').trim().toLowerCase() || 'free'
    }
}

/**
 * 设置页面未授权状态（用于降级展示）
 */
const setFeatureDeniedState = (payload: any) => {
    featureDeniedState.denied = true
    featureDeniedState.featureKey = String(payload?.featureKey || 'user_center')
    featureDeniedState.edition = String(payload?.edition || 'free')
}

/**
 * 拉取积分设置
 */
const loadSettings = async () => {
    const data = await uiedContributionSettingsGet()
    settingsForm.enabled = data?.enabled !== false
    settingsForm.submitPoints = toInt(data?.submitPoints, 2, 0, 1000)
    settingsForm.publishPoints = toInt(data?.publishPoints, 10, 0, 2000)
    settingsForm.featuredPoints = toInt(data?.featuredPoints, 20, 0, 5000)
    settingsForm.dailySubmitLimit = toInt(data?.dailySubmitLimit, 30, 1, 1000)
    settingsForm.dailyPublishLimit = toInt(data?.dailyPublishLimit, 50, 1, 1000)
    settingsForm.autoGrantBadge = data?.autoGrantBadge !== false
}

/**
 * 保存积分设置
 */
const handleSaveSettings = async () => {
    savingSettings.value = true
    try {
        await uiedContributionSettingsSave({
            enabled: settingsForm.enabled,
            submitPoints: settingsForm.submitPoints,
            publishPoints: settingsForm.publishPoints,
            featuredPoints: settingsForm.featuredPoints,
            dailySubmitLimit: settingsForm.dailySubmitLimit,
            dailyPublishLimit: settingsForm.dailyPublishLimit,
            autoGrantBadge: settingsForm.autoGrantBadge
        })
        feedback.msgSuccess('积分设置保存成功')
        await loadSettings()
    } finally {
        savingSettings.value = false
    }
}

/**
 * 拉取勋章列表
 */
const loadBadges = async () => {
    const data = await uiedContributionBadgeList({ includeDisabled: 1 })
    const list = Array.isArray(data?.list) ? data.list : []
    badgeRows.value = list.map((item: any) => ({
        id: item.id,
        badgeKey: String(item.badgeKey || ''),
        badgeName: String(item.badgeName || ''),
        icon: String(item.icon || 'Medal'),
        color: String(item.color || '#409EFF'),
        description: String(item.description || ''),
        requirePoints: toInt(item.requirePoints, 0, 0, 1000000),
        requirePublishCount: toInt(item.requirePublishCount, 0, 0, 100000),
        isEnabled: item.isEnabled !== false,
        sort: toInt(item.sort, 10, 1, 100000)
    }))
}

/**
 * 新增空勋章行
 */
const handleAddBadge = () => {
    badgeRows.value.unshift({
        badgeKey: '',
        badgeName: '',
        icon: 'Medal',
        color: '#409EFF',
        description: '',
        requirePoints: 0,
        requirePublishCount: 0,
        isEnabled: true,
        sort: 10
    })
}

/**
 * 保存勋章行
 */
const handleSaveBadge = async (row: BadgeRow) => {
    if (!String(row.badgeName || '').trim()) {
        feedback.msgError('请填写勋章名称')
        return
    }
    if (!String(row.badgeKey || '').trim()) {
        feedback.msgError('请填写勋章键')
        return
    }
    await uiedContributionBadgeSave({
        id: row.id,
        badgeKey: String(row.badgeKey || '').trim(),
        badgeName: String(row.badgeName || '').trim(),
        icon: String(row.icon || '').trim(),
        color: String(row.color || '').trim(),
        description: String(row.description || '').trim(),
        requirePoints: toInt(row.requirePoints, 0, 0, 1000000),
        requirePublishCount: toInt(row.requirePublishCount, 0, 0, 100000),
        isEnabled: row.isEnabled !== false,
        sort: toInt(row.sort, 10, 1, 100000)
    })
    feedback.msgSuccess('勋章保存成功')
    await loadBadges()
}

/**
 * 删除勋章
 */
const handleDeleteBadge = async (row: BadgeRow) => {
    if (!row.id) {
        badgeRows.value = badgeRows.value.filter((item) => item !== row)
        return
    }
    await feedback.confirm(`确定删除勋章【${row.badgeName || row.badgeKey}】吗？`)
    await uiedContributionBadgeDel({ id: row.id })
    feedback.msgSuccess('删除成功')
    await loadBadges()
}

/**
 * 拉取推荐位列表
 */
const loadFeatured = async () => {
    const data = await uiedContributionFeaturedList({ pageNo: 1, pageSize: 100 })
    const list = Array.isArray(data?.lists) ? data.lists : []
    featuredRows.value = list.map((item: any) => ({
        id: item.id,
        title: String(item.title || ''),
        articleId: toInt(item.articleId, 0, 0, 99999999),
        coverImage: String(item.coverImage || ''),
        summary: String(item.summary || ''),
        targetUrl: String(item.targetUrl || ''),
        sort: toInt(item.sort, 0, 0, 100000),
        isShow: item.isShow !== false,
        startTime: toInt(item.startTime, 0, 0, 9999999999),
        endTime: toInt(item.endTime, 0, 0, 9999999999)
    }))
}

/**
 * 打开推荐位编辑弹窗
 */
const openFeaturedDialog = (row?: FeaturedRow) => {
    featuredDialog.form = {
        id: row?.id,
        title: String(row?.title || ''),
        articleId: toInt(row?.articleId, 0, 0, 99999999),
        coverImage: String(row?.coverImage || ''),
        summary: String(row?.summary || ''),
        targetUrl: String(row?.targetUrl || ''),
        sort: toInt(row?.sort, 10, 0, 100000),
        isShow: row?.isShow !== false,
        startTime: toInt(row?.startTime, 0, 0, 9999999999),
        endTime: toInt(row?.endTime, 0, 0, 9999999999)
    }
    featuredDialog.visible = true
}

/**
 * 保存推荐位
 */
const handleSaveFeatured = async () => {
    if (!String(featuredDialog.form.title || '').trim()) {
        feedback.msgError('请填写推荐标题')
        return
    }
    featuredDialog.saving = true
    try {
        await uiedContributionFeaturedSave({
            id: featuredDialog.form.id,
            title: String(featuredDialog.form.title || '').trim(),
            articleId: toInt(featuredDialog.form.articleId, 0, 0, 99999999),
            coverImage: String(featuredDialog.form.coverImage || '').trim(),
            summary: String(featuredDialog.form.summary || '').trim(),
            targetUrl: String(featuredDialog.form.targetUrl || '').trim(),
            sort: toInt(featuredDialog.form.sort, 10, 0, 100000),
            isShow: featuredDialog.form.isShow !== false,
            startTime: toInt(featuredDialog.form.startTime, 0, 0, 9999999999),
            endTime: toInt(featuredDialog.form.endTime, 0, 0, 9999999999)
        })
        feedback.msgSuccess('推荐位保存成功')
        featuredDialog.visible = false
        await loadFeatured()
    } finally {
        featuredDialog.saving = false
    }
}

/**
 * 删除推荐位
 */
const handleDeleteFeatured = async (row: FeaturedRow) => {
    if (!row.id) return
    await feedback.confirm(`确定删除推荐位【${row.title}】吗？`)
    await uiedContributionFeaturedDel({ id: row.id })
    feedback.msgSuccess('删除成功')
    await loadFeatured()
}

/**
 * 拉取用户激励列表
 */
const loadUsers = async () => {
    userLoading.value = true
    try {
        const data = await uiedContributionUserList({
            pageNo: userQuery.pageNo,
            pageSize: userQuery.pageSize,
            keyword: String(userQuery.keyword || '').trim(),
            levelName: String(userQuery.levelName || '').trim(),
            minPoints: userQuery.minPoints,
            maxPoints: userQuery.maxPoints
        })
        userRows.value = Array.isArray(data?.lists) ? data.lists : []
        userPagination.pageNo = toInt(data?.pageNo, userQuery.pageNo, 1, 9999)
        userPagination.pageSize = toInt(data?.pageSize, userQuery.pageSize, 1, 100)
        userPagination.total = toInt(data?.total, 0, 0, 99999999)
    } finally {
        userLoading.value = false
    }
}

/**
 * 用户激励列表筛选变更后回到第一页
 */
const handleUserSearchChange = async () => {
    userQuery.pageNo = 1
    await loadUsers()
}

/**
 * 重置用户激励列表筛选项
 */
const resetUserSearch = async () => {
    userQuery.keyword = ''
    userQuery.levelName = ''
    userQuery.minPoints = undefined
    userQuery.maxPoints = undefined
    await handleUserSearchChange()
}

/**
 * 用户分页切换
 */
const handleUserPageChange = async (pageNo: number) => {
    userQuery.pageNo = pageNo
    await loadUsers()
}

/**
 * 打开用户激励详情
 */
const openUserDetail = async (row: any) => {
    const userId = Number(row?.id || 0)
    if (!userId) return
    const data = await uiedContributionUserDetail({ userId })
    userDrawer.userId = userId
    userDrawer.data = data || null
    userDrawer.visible = true
}

/**
 * 拉取积分日志
 */
const loadLogs = async () => {
    const data = await uiedContributionLogList({
        pageNo: logQuery.pageNo,
        pageSize: logQuery.pageSize,
        eventType: String(logQuery.eventType || '').trim(),
        keyword: String(logQuery.keyword || '').trim(),
        userId: logQuery.userId
    })
    logRows.value = Array.isArray(data?.lists) ? data.lists : []
}

/**
 * 积分日志筛选变更后回到第一页
 */
const handleLogSearchChange = async () => {
    logQuery.pageNo = 1
    await loadLogs()
}

/**
 * 重置积分日志筛选项
 */
const resetLogSearch = async () => {
    logQuery.eventType = ''
    logQuery.keyword = ''
    logQuery.userId = undefined
    await handleLogSearchChange()
}

/**
 * 拉取排行榜
 */
const loadLeaderboard = async () => {
    const data = await uiedContributionLeaderboard({ limit: 20 })
    leaderboardRows.value = Array.isArray(data?.list) ? data.list : []
}

/**
 * 拉取字段草案
 */
const loadSchema = async () => {
    const data = await uiedContributionSchema()
    schemaData.value = data || {}
}

/**
 * 初始化页面数据
 */
const initPageData = async () => {
    featureDeniedState.denied = false
    featureDeniedState.featureKey = ''
    featureDeniedState.edition = 'free'
    try {
        await Promise.all([
            loadSettings(),
            loadBadges(),
            loadFeatured(),
            loadUsers(),
            loadLogs(),
            loadLeaderboard(),
            loadSchema()
        ])
    } catch (error: any) {
        const denied = parseCommercialFeatureDenied(error)
        if (denied) {
            setFeatureDeniedState(denied)
            return
        }
        throw error
    }
}

onMounted(async () => {
    await initPageData().catch(() => undefined)
})
</script>

<style scoped>
.uied-contribution-page {
    display: flex;
    flex-direction: column;
}

.settings-form :deep(.el-input-number) {
    width: 220px;
}

.schema-view {
    margin: 0;
    padding: 12px;
    background: #f7f8fa;
    border-radius: 8px;
    max-height: 420px;
    overflow: auto;
    font-size: 12px;
    line-height: 1.6;
}
</style>
