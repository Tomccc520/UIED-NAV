<!--
 * @file views/uied/socialMedia/index.vue
 * @description UIED 社交媒体管理
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
-->
<template>
    <div class="social-media-setting">
        <el-card class="!border-none" shadow="never">
            <el-tabs v-model="activeTab">
                <!-- 社交媒体分组 -->
                <el-tab-pane label="分组管理" name="groups">
                    <div class="mb-4">
                        <el-button type="primary" @click="handleAddGroup">
                            <template #icon><icon name="el-icon-Plus" /></template>
                            添加分组
                        </el-button>
                    </div>
                    <el-table size="large" v-loading="groupPager.loading" :data="groupPager.lists">
                        <el-table-column label="ID" prop="id" width="80" />
                        <el-table-column label="分组名称" prop="name" min-width="150" />
                        <el-table-column label="显示位置" prop="position" width="120" />
                        <el-table-column label="排序" prop="sortOrder" width="80" />
                        <el-table-column label="状态" width="80">
                            <template #default="{ row }">
                                <el-tag :type="row.isActive ? 'success' : 'info'" size="small">
                                    {{ row.isActive ? '显示' : '隐藏' }}
                                </el-tag>
                            </template>
                        </el-table-column>
                        <el-table-column label="操作" width="120" fixed="right">
                            <template #default="{ row }">
                                <el-button type="primary" link @click="handleEditGroup(row)">编辑</el-button>
                                <el-button type="danger" link @click="handleDeleteGroup(row.id)">删除</el-button>
                            </template>
                        </el-table-column>
                    </el-table>
                </el-tab-pane>

                <!-- 社交媒体项目 -->
                <el-tab-pane label="社交媒体" name="items">
                    <div class="mb-4 flex gap-4">
                        <el-button type="primary" @click="handleAddItem">
                            <template #icon><icon name="el-icon-Plus" /></template>
                            添加社交媒体
                        </el-button>
                        <el-select v-model="itemGroupFilter" placeholder="筛选分组" clearable @change="getItemLists">
                            <el-option v-for="g in groupOptions" :key="g.id" :label="g.name" :value="g.id" />
                        </el-select>
                    </div>
                    <el-table size="large" v-loading="itemPager.loading" :data="itemPager.lists">
                        <el-table-column label="ID" prop="id" width="80" />
                        <el-table-column label="所属分组" prop="groupName" width="120" />
                        <el-table-column label="平台" prop="platform" width="100" />
                        <el-table-column label="名称" prop="name" min-width="120" />
                        <el-table-column label="链接" prop="url" min-width="200" show-overflow-tooltip />
                        <el-table-column label="图标" prop="icon" width="100" />
                        <el-table-column label="排序" prop="sortOrder" width="80" />
                        <el-table-column label="状态" width="80">
                            <template #default="{ row }">
                                <el-tag :type="row.isActive ? 'success' : 'info'" size="small">
                                    {{ row.isActive ? '显示' : '隐藏' }}
                                </el-tag>
                            </template>
                        </el-table-column>
                        <el-table-column label="操作" width="120" fixed="right">
                            <template #default="{ row }">
                                <el-button type="primary" link @click="handleEditItem(row)">编辑</el-button>
                                <el-button type="danger" link @click="handleDeleteItem(row.id)">删除</el-button>
                            </template>
                        </el-table-column>
                    </el-table>
                    <div class="flex justify-end mt-4">
                        <pagination v-model="itemPager" @change="getItemLists" />
                    </div>
                </el-tab-pane>
            </el-tabs>
        </el-card>

        <!-- 分组编辑弹窗 -->
        <el-dialog v-model="showGroupEdit" :title="groupData.id ? '编辑分组' : '添加分组'" width="400px">
            <el-form ref="groupFormRef" :model="groupData" :rules="groupRules" label-width="80px">
                <el-form-item label="分组名称" prop="name">
                    <el-input v-model="groupData.name" placeholder="请输入分组名称" />
                </el-form-item>
                <el-form-item label="显示位置">
                    <el-select v-model="groupData.position" style="width: 100%">
                        <el-option label="页脚" value="footer" />
                        <el-option label="侧边栏" value="sidebar" />
                        <el-option label="头部" value="header" />
                    </el-select>
                </el-form-item>
                <el-form-item label="排序">
                    <el-input-number v-model="groupData.sortOrder" :min="0" />
                </el-form-item>
                <el-form-item label="状态">
                    <el-switch v-model="groupData.isActive" />
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button @click="showGroupEdit = false">取消</el-button>
                <el-button type="primary" :loading="groupLoading" @click="handleSubmitGroup">确定</el-button>
            </template>
        </el-dialog>

        <!-- 项目编辑弹窗 -->
        <el-dialog v-model="showItemEdit" :title="itemData.id ? '编辑社交媒体' : '添加社交媒体'" width="500px">
            <el-form ref="itemFormRef" :model="itemData" :rules="itemRules" label-width="80px">
                <el-form-item label="所属分组" prop="groupId">
                    <el-select v-model="itemData.groupId" placeholder="请选择分组" style="width: 100%">
                        <el-option v-for="g in groupOptions" :key="g.id" :label="g.name" :value="g.id" />
                    </el-select>
                </el-form-item>
                <el-form-item label="平台">
                    <el-select v-model="itemData.platform" placeholder="选择平台" style="width: 100%" allow-create filterable>
                        <el-option label="微信" value="wechat" />
                        <el-option label="微博" value="weibo" />
                        <el-option label="抖音" value="douyin" />
                        <el-option label="小红书" value="xiaohongshu" />
                        <el-option label="B站" value="bilibili" />
                        <el-option label="GitHub" value="github" />
                        <el-option label="Twitter" value="twitter" />
                    </el-select>
                </el-form-item>
                <el-form-item label="名称" prop="name">
                    <el-input v-model="itemData.name" placeholder="请输入名称" />
                </el-form-item>
                <el-form-item label="链接">
                    <el-input v-model="itemData.url" placeholder="请输入链接" />
                </el-form-item>
                <el-form-item label="图标">
                    <el-input v-model="itemData.icon" placeholder="图标类名或URL" />
                </el-form-item>
                <el-form-item label="二维码">
                    <el-input v-model="itemData.qrCode" placeholder="二维码图片URL" />
                </el-form-item>
                <el-form-item label="排序">
                    <el-input-number v-model="itemData.sortOrder" :min="0" />
                </el-form-item>
                <el-form-item label="状态">
                    <el-switch v-model="itemData.isActive" />
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button @click="showItemEdit = false">取消</el-button>
                <el-button type="primary" :loading="itemLoading" @click="handleSubmitItem">确定</el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script lang="ts" setup name="uiedSocialMedia">
import { uiedSocialMediaGroupList, uiedSocialMediaGroupAdd, uiedSocialMediaGroupEdit, uiedSocialMediaGroupDelete,
    uiedSocialMediaItemList, uiedSocialMediaItemAdd, uiedSocialMediaItemEdit, uiedSocialMediaItemDelete } from '@/api/uied'
import { usePaging } from '@/hooks/usePaging'
import feedback from '@/utils/feedback'
import type { FormInstance, FormRules } from 'element-plus'

const activeTab = ref('groups')
const groupOptions = ref<any[]>([])
const itemGroupFilter = ref<number | undefined>()

// 分组
const { pager: groupPager, getLists: getGroupLists } = usePaging({ fetchFun: uiedSocialMediaGroupList })
const showGroupEdit = ref(false)
const groupLoading = ref(false)
const groupFormRef = ref<FormInstance>()
const groupData = reactive({ id: 0, name: '', position: 'footer', sortOrder: 0, isActive: true })
const groupRules: FormRules = { name: [{ required: true, message: '请输入分组名称', trigger: 'blur' }] }

// 项目
const { pager: itemPager, getLists: getItemListsBase } = usePaging({ fetchFun: uiedSocialMediaItemList })
const getItemLists = () => getItemListsBase({ groupId: itemGroupFilter.value })
const showItemEdit = ref(false)
const itemLoading = ref(false)
const itemFormRef = ref<FormInstance>()
const itemData = reactive({ id: 0, groupId: undefined as number | undefined, platform: '', name: '', url: '', icon: '', qrCode: '', sortOrder: 0, isActive: true })
const itemRules: FormRules = {
    groupId: [{ required: true, message: '请选择分组', trigger: 'change' }],
    name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
}

const loadGroupOptions = async () => {
    const res = await uiedSocialMediaGroupList({ pageSize: 100 })
    groupOptions.value = res?.lists || []
}

// 分组操作
const handleAddGroup = () => { Object.assign(groupData, { id: 0, name: '', position: 'footer', sortOrder: 0, isActive: true }); showGroupEdit.value = true }
const handleEditGroup = (row: any) => { Object.assign(groupData, row); showGroupEdit.value = true }
const handleSubmitGroup = async () => {
    await groupFormRef.value?.validate()
    groupLoading.value = true
    try {
        if (groupData.id) { await uiedSocialMediaGroupEdit(groupData); feedback.msgSuccess('编辑成功') }
        else { await uiedSocialMediaGroupAdd(groupData); feedback.msgSuccess('添加成功') }
        showGroupEdit.value = false
        getGroupLists()
        loadGroupOptions()
    } finally { groupLoading.value = false }
}
const handleDeleteGroup = async (id: number) => {
    await feedback.confirm('确定要删除该分组吗？分组下的项目也会被删除')
    await uiedSocialMediaGroupDelete({ id })
    feedback.msgSuccess('删除成功')
    getGroupLists()
    loadGroupOptions()
}

// 项目操作
const handleAddItem = () => { Object.assign(itemData, { id: 0, groupId: undefined, platform: '', name: '', url: '', icon: '', qrCode: '', sortOrder: 0, isActive: true }); showItemEdit.value = true }
const handleEditItem = (row: any) => { Object.assign(itemData, row); showItemEdit.value = true }
const handleSubmitItem = async () => {
    await itemFormRef.value?.validate()
    itemLoading.value = true
    try {
        if (itemData.id) { await uiedSocialMediaItemEdit(itemData); feedback.msgSuccess('编辑成功') }
        else { await uiedSocialMediaItemAdd(itemData); feedback.msgSuccess('添加成功') }
        showItemEdit.value = false
        getItemLists()
    } finally { itemLoading.value = false }
}
const handleDeleteItem = async (id: number) => {
    await feedback.confirm('确定要删除该项目吗？')
    await uiedSocialMediaItemDelete({ id })
    feedback.msgSuccess('删除成功')
    getItemLists()
}

getGroupLists()
getItemLists()
loadGroupOptions()
</script>
