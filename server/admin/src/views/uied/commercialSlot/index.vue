<!--
 * @copyright Tomda (https://www.tomda.top)
 * @copyright UIED技术团队 (https://fsuied.com)
 * @author UIED技术团队
 * @createDate 2026-02-23
-->
<template>
    <div class="uied-commercial-slot-page">
        <template v-if="!featureDeniedState.denied">
            <el-alert
                title="商业位体系：置顶位 / 分类广告位 / 专题赞助位（按天/周售卖）"
                type="info"
                :closable="false"
                class="mb-4"
            />

            <el-tabs v-model="activeTab">
                <el-tab-pane label="广告位配置" name="slots">
                    <el-card class="!border-none" shadow="never">
                        <template #header>
                            <div class="flex items-center justify-between">
                                <span class="font-medium">广告位配置</span>
                                <div class="flex items-center gap-2">
                                    <el-button @click="loadSlots">刷新</el-button>
                                    <el-button type="primary" @click="openSlotDialog()"
                                        >新增广告位</el-button
                                    >
                                </div>
                            </div>
                        </template>
                        <el-table :data="slotRows" v-loading="slotLoading" size="small">
                            <el-table-column prop="id" label="ID" width="80" />
                            <el-table-column prop="slotName" label="广告位名称" min-width="160" />
                            <el-table-column prop="slotKey" label="广告位键" min-width="160" />
                            <el-table-column prop="slotType" label="类型" width="120" />
                            <el-table-column prop="scopeType" label="范围" width="120" />
                            <el-table-column prop="scopeValue" label="范围值" min-width="120" />
                            <el-table-column prop="saleUnit" label="售卖单位" width="110" />
                            <el-table-column prop="unitPrice" label="单价" width="100" />
                            <el-table-column prop="maxPositions" label="位数" width="90" />
                            <el-table-column prop="sort" label="排序" width="90" />
                            <el-table-column label="状态" width="90">
                                <template #default="{ row }">
                                    <el-tag :type="row.isEnabled ? 'success' : 'info'">{{
                                        row.isEnabled ? '启用' : '禁用'
                                    }}</el-tag>
                                </template>
                            </el-table-column>
                            <el-table-column label="操作" width="160" fixed="right">
                                <template #default="{ row }">
                                    <el-button link type="primary" @click="openSlotDialog(row)"
                                        >编辑</el-button
                                    >
                                    <el-button link type="danger" @click="handleDelSlot(row)"
                                        >删除</el-button
                                    >
                                </template>
                            </el-table-column>
                        </el-table>
                    </el-card>
                </el-tab-pane>

                <el-tab-pane label="投放记录" name="bookings">
                    <el-card class="!border-none" shadow="never">
                        <template #header>
                            <div class="flex items-center justify-between">
                                <span class="font-medium">投放记录（售卖/排期）</span>
                                <div class="flex items-center gap-2">
                                    <el-select
                                        v-model="bookingQuery.slotKey"
                                        clearable
                                        placeholder="筛选广告位"
                                        style="width: 180px"
                                    >
                                        <el-option
                                            v-for="slot in slotRows"
                                            :key="slot.id"
                                            :label="slot.slotName"
                                            :value="slot.slotKey"
                                        />
                                    </el-select>
                                    <el-select
                                        v-model="bookingQuery.status"
                                        clearable
                                        placeholder="状态"
                                        style="width: 140px"
                                    >
                                        <el-option
                                            v-for="item in schemaDraft.bookingStatusOptions || []"
                                            :key="item.value"
                                            :label="item.label"
                                            :value="item.value"
                                        />
                                    </el-select>
                                    <el-button @click="loadBookings">查询</el-button>
                                    <el-button type="primary" @click="openBookingDialog()"
                                        >新增投放</el-button
                                    >
                                </div>
                            </div>
                        </template>
                        <el-table :data="bookingRows" v-loading="bookingLoading" size="small">
                            <el-table-column prop="id" label="ID" width="80" />
                            <el-table-column prop="slotName" label="广告位" min-width="140" />
                            <el-table-column prop="sponsorTitle" label="投放标题" min-width="180" />
                            <el-table-column prop="sponsorName" label="客户" width="120" />
                            <el-table-column prop="status" label="状态" width="110" />
                            <el-table-column prop="saleUnit" label="单位" width="80" />
                            <el-table-column prop="totalPrice" label="金额" width="100" />
                            <el-table-column prop="startTime" label="开始时间戳" width="140" />
                            <el-table-column prop="endTime" label="结束时间戳" width="140" />
                            <el-table-column label="显示" width="80">
                                <template #default="{ row }">
                                    <el-tag :type="row.isShow ? 'success' : 'info'">{{
                                        row.isShow ? '显示' : '隐藏'
                                    }}</el-tag>
                                </template>
                            </el-table-column>
                            <el-table-column label="操作" width="160" fixed="right">
                                <template #default="{ row }">
                                    <el-button link type="primary" @click="openBookingDialog(row)"
                                        >编辑</el-button
                                    >
                                    <el-button link type="danger" @click="handleDelBooking(row)"
                                        >删除</el-button
                                    >
                                </template>
                            </el-table-column>
                        </el-table>
                        <div class="mt-4 flex justify-end">
                            <el-pagination
                                background
                                layout="total, prev, pager, next"
                                :total="bookingPager.total"
                                :page-size="bookingPager.pageSize"
                                :current-page="bookingPager.pageNo"
                                @current-change="handleBookingPageChange"
                            />
                        </div>
                    </el-card>
                </el-tab-pane>

                <el-tab-pane label="字段草案" name="schema">
                    <el-card class="!border-none" shadow="never">
                        <template #header>
                            <div class="flex items-center justify-between">
                                <span class="font-medium">字段草案（前后端对接）</span>
                                <el-button @click="loadSchema">刷新草案</el-button>
                            </div>
                        </template>
                        <pre class="schema-view">{{ schemaText }}</pre>
                    </el-card>
                </el-tab-pane>
            </el-tabs>

            <el-dialog
                v-model="slotDialog.visible"
                :title="slotDialog.form.id ? '编辑广告位' : '新增广告位'"
                width="760px"
            >
                <el-form :model="slotDialog.form" label-width="110px">
                    <el-form-item label="广告位名称">
                        <el-input v-model="slotDialog.form.slotName" />
                    </el-form-item>
                    <el-form-item label="广告位键">
                        <el-input
                            v-model="slotDialog.form.slotKey"
                            placeholder="例如 home-top-pinned"
                        />
                    </el-form-item>
                    <el-form-item label="广告位类型">
                        <el-select v-model="slotDialog.form.slotType" style="width: 100%">
                            <el-option
                                v-for="item in schemaDraft.slotTypeOptions || []"
                                :key="item.value"
                                :label="item.label"
                                :value="item.value"
                            />
                        </el-select>
                    </el-form-item>
                    <el-form-item label="作用范围">
                        <el-select v-model="slotDialog.form.scopeType" style="width: 100%">
                            <el-option
                                v-for="item in schemaDraft.scopeTypeOptions || []"
                                :key="item.value"
                                :label="item.label"
                                :value="item.value"
                            />
                        </el-select>
                    </el-form-item>
                    <el-form-item label="范围值">
                        <el-input
                            v-model="slotDialog.form.scopeValue"
                            placeholder="home / all / 分类slug / 专题slug"
                        />
                    </el-form-item>
                    <el-form-item label="售卖单位">
                        <el-select v-model="slotDialog.form.saleUnit" style="width: 100%">
                            <el-option
                                v-for="item in schemaDraft.saleUnitOptions || []"
                                :key="item.value"
                                :label="item.label"
                                :value="item.value"
                            />
                        </el-select>
                    </el-form-item>
                    <el-form-item label="单价">
                        <el-input-number
                            v-model="slotDialog.form.unitPrice"
                            :min="0"
                            :max="99999999"
                            :precision="2"
                        />
                    </el-form-item>
                    <el-form-item label="最大位数">
                        <el-input-number
                            v-model="slotDialog.form.maxPositions"
                            :min="1"
                            :max="20"
                        />
                    </el-form-item>
                    <el-form-item label="排序">
                        <el-input-number v-model="slotDialog.form.sort" :min="0" :max="100000" />
                    </el-form-item>
                    <el-form-item label="启用">
                        <el-switch v-model="slotDialog.form.isEnabled" />
                    </el-form-item>
                    <el-form-item label="说明">
                        <el-input v-model="slotDialog.form.description" type="textarea" :rows="3" />
                    </el-form-item>
                </el-form>
                <template #footer>
                    <el-button @click="slotDialog.visible = false">取消</el-button>
                    <el-button type="primary" :loading="slotDialog.saving" @click="handleSaveSlot"
                        >保存</el-button
                    >
                </template>
            </el-dialog>

            <el-dialog
                v-model="bookingDialog.visible"
                :title="bookingDialog.form.id ? '编辑投放' : '新增投放'"
                width="820px"
            >
                <el-form :model="bookingDialog.form" label-width="110px">
                    <el-form-item label="广告位">
                        <el-select v-model="bookingDialog.form.slotId" style="width: 100%">
                            <el-option
                                v-for="slot in slotRows"
                                :key="slot.id"
                                :label="`${slot.slotName}（${slot.slotKey}）`"
                                :value="slot.id"
                            />
                        </el-select>
                    </el-form-item>
                    <el-form-item label="投放标题">
                        <el-input v-model="bookingDialog.form.sponsorTitle" />
                    </el-form-item>
                    <el-form-item label="客户名称">
                        <el-input v-model="bookingDialog.form.sponsorName" />
                    </el-form-item>
                    <el-form-item label="跳转链接">
                        <el-input v-model="bookingDialog.form.targetUrl" />
                    </el-form-item>
                    <el-form-item label="图片地址">
                        <el-input v-model="bookingDialog.form.imageUrl" />
                    </el-form-item>
                    <el-form-item label="展示文案">
                        <el-input
                            v-model="bookingDialog.form.textContent"
                            type="textarea"
                            :rows="2"
                        />
                    </el-form-item>
                    <el-form-item label="角标">
                        <el-input v-model="bookingDialog.form.badgeText" />
                    </el-form-item>
                    <el-form-item label="位序">
                        <el-input-number
                            v-model="bookingDialog.form.positionIndex"
                            :min="1"
                            :max="20"
                        />
                    </el-form-item>
                    <el-form-item label="售卖单位">
                        <el-select v-model="bookingDialog.form.saleUnit" style="width: 100%">
                            <el-option
                                v-for="item in schemaDraft.saleUnitOptions || []"
                                :key="item.value"
                                :label="item.label"
                                :value="item.value"
                            />
                        </el-select>
                    </el-form-item>
                    <el-form-item label="单价">
                        <el-input-number
                            v-model="bookingDialog.form.unitPrice"
                            :min="0"
                            :max="99999999"
                            :precision="2"
                        />
                    </el-form-item>
                    <el-form-item label="总价">
                        <el-input-number
                            v-model="bookingDialog.form.totalPrice"
                            :min="0"
                            :max="99999999"
                            :precision="2"
                        />
                    </el-form-item>
                    <el-form-item label="开始时间戳">
                        <el-input-number
                            v-model="bookingDialog.form.startTime"
                            :min="0"
                            :max="9999999999"
                            class="!w-full"
                        />
                    </el-form-item>
                    <el-form-item label="结束时间戳">
                        <el-input-number
                            v-model="bookingDialog.form.endTime"
                            :min="0"
                            :max="9999999999"
                            class="!w-full"
                        />
                    </el-form-item>
                    <el-form-item label="状态">
                        <el-select v-model="bookingDialog.form.status" style="width: 100%">
                            <el-option
                                v-for="item in schemaDraft.bookingStatusOptions || []"
                                :key="item.value"
                                :label="item.label"
                                :value="item.value"
                            />
                        </el-select>
                    </el-form-item>
                    <el-form-item label="显示">
                        <el-switch v-model="bookingDialog.form.isShow" />
                    </el-form-item>
                    <el-form-item label="联系人">
                        <el-input v-model="bookingDialog.form.contactName" />
                    </el-form-item>
                    <el-form-item label="联系电话">
                        <el-input v-model="bookingDialog.form.contactPhone" />
                    </el-form-item>
                    <el-form-item label="备注">
                        <el-input v-model="bookingDialog.form.note" type="textarea" :rows="2" />
                    </el-form-item>
                </el-form>
                <template #footer>
                    <el-button @click="bookingDialog.visible = false">取消</el-button>
                    <el-button
                        type="primary"
                        :loading="bookingDialog.saving"
                        @click="handleSaveBooking"
                        >保存</el-button
                    >
                </template>
            </el-dialog>
        </template>

        <el-card v-else class="!border-none" shadow="never">
            <el-result icon="warning" title="当前版本未授权该功能">
                <template #sub-title>
                    <div class="text-center leading-6">
                        <div>
                            功能键：{{ featureDeniedState.featureKey || 'operations_blocks' }}
                        </div>
                        <div>
                            当前版本：{{
                                String(featureDeniedState.edition || 'free').toUpperCase()
                            }}
                        </div>
                        <div>请到「许可证中心 / 功能开关」升级或开启后再使用。</div>
                    </div>
                </template>
            </el-result>
        </el-card>
    </div>
</template>

<script lang="ts" setup name="uiedCommercialSlotIndex">
/**
 * @copyright Tomda (https://www.tomda.top)
 * @copyright UIED技术团队 (https://fsuied.com)
 * @author UIED技术团队
 * @createDate 2026-02-23
 */
import { computed, onMounted, reactive, ref } from 'vue'
import feedback from '@/utils/feedback'
import {
    uiedCommercialBookingDel,
    uiedCommercialBookingList,
    uiedCommercialBookingSave,
    uiedCommercialSlotDel,
    uiedCommercialSlotList,
    uiedCommercialSlotSave,
    uiedCommercialSlotSchema
} from '@/api/uied'

const activeTab = ref('slots')
const slotLoading = ref(false)
const bookingLoading = ref(false)
const slotRows = ref<any[]>([])
const bookingRows = ref<any[]>([])
const featureDeniedState = reactive({
    denied: false,
    featureKey: '',
    edition: 'free'
})
const schemaDraft = reactive<any>({
    slotTypeOptions: [],
    scopeTypeOptions: [],
    saleUnitOptions: [],
    bookingStatusOptions: []
})

const bookingQuery = reactive({
    pageNo: 1,
    pageSize: 20,
    slotKey: '',
    status: ''
})

const bookingPager = reactive({
    pageNo: 1,
    pageSize: 20,
    total: 0
})

const slotDialog = reactive<any>({
    visible: false,
    saving: false,
    form: {
        id: 0,
        slotName: '',
        slotKey: '',
        slotType: 'top',
        scopeType: 'global',
        scopeValue: '',
        description: '',
        saleUnit: 'day',
        unitPrice: 0,
        maxPositions: 1,
        sort: 10,
        isEnabled: true
    }
})

const bookingDialog = reactive<any>({
    visible: false,
    saving: false,
    form: {
        id: 0,
        slotId: undefined as number | undefined,
        sponsorName: '',
        sponsorTitle: '',
        targetUrl: '',
        imageUrl: '',
        textContent: '',
        badgeText: '',
        positionIndex: 1,
        saleUnit: 'day',
        unitPrice: 0,
        totalPrice: 0,
        startTime: 0,
        endTime: 0,
        status: 'active',
        isShow: true,
        contactName: '',
        contactPhone: '',
        note: ''
    }
})

/**
 * 字段草案文本
 */
const schemaText = computed(() => JSON.stringify(schemaDraft, null, 2))

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
        edition:
            String(body?.data?.edition || 'free')
                .trim()
                .toLowerCase() || 'free'
    }
}

/**
 * 设置页面未授权状态（用于降级展示）
 */
const setFeatureDeniedState = (payload: any) => {
    featureDeniedState.denied = true
    featureDeniedState.featureKey = String(payload?.featureKey || 'operations_blocks')
    featureDeniedState.edition = String(payload?.edition || 'free')
}

/**
 * 重置广告位弹窗表单
 */
const resetSlotForm = () => {
    slotDialog.form = {
        id: 0,
        slotName: '',
        slotKey: '',
        slotType: 'top',
        scopeType: 'global',
        scopeValue: '',
        description: '',
        saleUnit: 'day',
        unitPrice: 0,
        maxPositions: 1,
        sort: 10,
        isEnabled: true
    }
}

/**
 * 重置投放弹窗表单
 */
const resetBookingForm = () => {
    bookingDialog.form = {
        id: 0,
        slotId: undefined,
        sponsorName: '',
        sponsorTitle: '',
        targetUrl: '',
        imageUrl: '',
        textContent: '',
        badgeText: '',
        positionIndex: 1,
        saleUnit: 'day',
        unitPrice: 0,
        totalPrice: 0,
        startTime: 0,
        endTime: 0,
        status: 'active',
        isShow: true,
        contactName: '',
        contactPhone: '',
        note: ''
    }
}

/**
 * 加载广告位配置列表
 */
const loadSlots = async () => {
    slotLoading.value = true
    try {
        const data = await uiedCommercialSlotList({ includeDisabled: 1 })
        slotRows.value = Array.isArray(data?.list) ? data.list : []
    } finally {
        slotLoading.value = false
    }
}

/**
 * 加载投放记录列表
 */
const loadBookings = async () => {
    bookingLoading.value = true
    try {
        const data = await uiedCommercialBookingList({
            pageNo: bookingQuery.pageNo,
            pageSize: bookingQuery.pageSize,
            slotKey: bookingQuery.slotKey,
            status: bookingQuery.status
        })
        bookingRows.value = Array.isArray(data?.lists) ? data.lists : []
        bookingPager.pageNo = Number(data?.pageNo || bookingQuery.pageNo)
        bookingPager.pageSize = Number(data?.pageSize || bookingQuery.pageSize)
        bookingPager.total = Number(data?.total || 0)
    } finally {
        bookingLoading.value = false
    }
}

/**
 * 加载字段草案
 */
const loadSchema = async () => {
    const data = await uiedCommercialSlotSchema()
    Object.assign(schemaDraft, data?.draft || {})
}

/**
 * 打开广告位弹窗
 */
const openSlotDialog = (row?: any) => {
    resetSlotForm()
    if (row) {
        slotDialog.form = {
            id: Number(row.id || 0),
            slotName: String(row.slotName || ''),
            slotKey: String(row.slotKey || ''),
            slotType: String(row.slotType || 'top'),
            scopeType: String(row.scopeType || 'global'),
            scopeValue: String(row.scopeValue || ''),
            description: String(row.description || ''),
            saleUnit: String(row.saleUnit || 'day'),
            unitPrice: Number(row.unitPrice || 0),
            maxPositions: Number(row.maxPositions || 1),
            sort: Number(row.sort || 10),
            isEnabled: row.isEnabled !== false
        }
    }
    slotDialog.visible = true
}

/**
 * 保存广告位配置
 */
const handleSaveSlot = async () => {
    if (!String(slotDialog.form.slotName || '').trim()) {
        feedback.msgError('请填写广告位名称')
        return
    }
    if (!String(slotDialog.form.slotKey || '').trim()) {
        feedback.msgError('请填写广告位键')
        return
    }
    slotDialog.saving = true
    try {
        await uiedCommercialSlotSave({ ...slotDialog.form })
        feedback.msgSuccess('广告位保存成功')
        slotDialog.visible = false
        await loadSlots()
    } finally {
        slotDialog.saving = false
    }
}

/**
 * 删除广告位配置
 */
const handleDelSlot = async (row: any) => {
    await feedback.confirm(`确定删除广告位【${row.slotName}】吗？`)
    await uiedCommercialSlotDel({ id: row.id })
    feedback.msgSuccess('删除成功')
    await loadSlots()
}

/**
 * 打开投放弹窗
 */
const openBookingDialog = (row?: any) => {
    resetBookingForm()
    if (row) {
        bookingDialog.form = {
            id: Number(row.id || 0),
            slotId: Number(row.slotId || 0) || undefined,
            sponsorName: String(row.sponsorName || ''),
            sponsorTitle: String(row.sponsorTitle || ''),
            targetUrl: String(row.targetUrl || ''),
            imageUrl: String(row.imageUrl || ''),
            textContent: String(row.textContent || ''),
            badgeText: String(row.badgeText || ''),
            positionIndex: Number(row.positionIndex || 1),
            saleUnit: String(row.saleUnit || 'day'),
            unitPrice: Number(row.unitPrice || 0),
            totalPrice: Number(row.totalPrice || 0),
            startTime: Number(row.startTime || 0),
            endTime: Number(row.endTime || 0),
            status: String(row.status || 'active'),
            isShow: row.isShow !== false,
            contactName: String(row.contactName || ''),
            contactPhone: String(row.contactPhone || ''),
            note: String(row.note || '')
        }
    }
    bookingDialog.visible = true
}

/**
 * 保存投放记录
 */
const handleSaveBooking = async () => {
    if (!bookingDialog.form.slotId) {
        feedback.msgError('请选择广告位')
        return
    }
    if (!String(bookingDialog.form.sponsorTitle || '').trim()) {
        feedback.msgError('请填写投放标题')
        return
    }
    if (!String(bookingDialog.form.targetUrl || '').trim()) {
        feedback.msgError('请填写跳转链接')
        return
    }
    bookingDialog.saving = true
    try {
        await uiedCommercialBookingSave({ ...bookingDialog.form })
        feedback.msgSuccess('投放记录保存成功')
        bookingDialog.visible = false
        await loadBookings()
    } finally {
        bookingDialog.saving = false
    }
}

/**
 * 删除投放记录
 */
const handleDelBooking = async (row: any) => {
    await feedback.confirm(`确定删除投放【${row.sponsorTitle}】吗？`)
    await uiedCommercialBookingDel({ id: row.id })
    feedback.msgSuccess('删除成功')
    await loadBookings()
}

/**
 * 投放记录分页切换
 */
const handleBookingPageChange = async (pageNo: number) => {
    bookingQuery.pageNo = pageNo
    await loadBookings()
}

/**
 * 页面初始化
 */
const initPage = async () => {
    featureDeniedState.denied = false
    featureDeniedState.featureKey = ''
    featureDeniedState.edition = 'free'
    try {
        await Promise.all([loadSchema(), loadSlots()])
        await loadBookings()
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
    await initPage().catch(() => undefined)
})
</script>

<style scoped>
.uied-commercial-slot-page {
    display: flex;
    flex-direction: column;
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
