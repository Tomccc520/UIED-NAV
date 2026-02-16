<!--
 * @file views/uied/footer/index.vue
 * @description UIED 页脚设置管理
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
-->
<template>
    <div class="footer-setting">
        <el-card class="!border-none" shadow="never">
            <el-tabs v-model="activeTab">
                <!-- 页脚分组 -->
                <el-tab-pane label="页脚分组" name="groups">
                    <div class="mb-4">
                        <el-button type="primary" @click="handleAddGroup">
                            <template #icon><icon name="el-icon-Plus" /></template>
                            添加分组
                        </el-button>
                    </div>
                    <el-table size="large" v-loading="groupPager.loading" :data="groupPager.lists">
                        <el-table-column label="ID" prop="id" width="80" />
                        <el-table-column label="分组名称" prop="name" min-width="150" />
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
                                <el-button type="primary" link @click="handleEditGroup(row)"
                                    >编辑</el-button
                                >
                                <el-button type="danger" link @click="handleDeleteGroup(row.id)"
                                    >删除</el-button
                                >
                            </template>
                        </el-table-column>
                    </el-table>
                </el-tab-pane>

                <!-- 页脚链接 -->
                <el-tab-pane label="页脚链接" name="links">
                    <div class="mb-4 flex gap-4">
                        <el-button type="primary" @click="handleAddLink">
                            <template #icon><icon name="el-icon-Plus" /></template>
                            添加链接
                        </el-button>
                        <el-select
                            v-model="linkGroupFilter"
                            placeholder="筛选分组"
                            clearable
                            @change="getLinkLists"
                        >
                            <el-option
                                v-for="g in groupOptions"
                                :key="g.id"
                                :label="g.name"
                                :value="g.id"
                            />
                        </el-select>
                    </div>
                    <el-table size="large" v-loading="linkPager.loading" :data="linkPager.lists">
                        <el-table-column label="ID" prop="id" width="80" />
                        <el-table-column label="所属分组" prop="groupName" width="120" />
                        <el-table-column label="链接名称" prop="name" min-width="150" />
                        <el-table-column
                            label="链接地址"
                            prop="url"
                            min-width="200"
                            show-overflow-tooltip
                        />
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
                                <el-button type="primary" link @click="handleEditLink(row)"
                                    >编辑</el-button
                                >
                                <el-button type="danger" link @click="handleDeleteLink(row.id)"
                                    >删除</el-button
                                >
                            </template>
                        </el-table-column>
                    </el-table>
                    <div class="flex justify-end mt-4">
                        <pagination v-model="linkPager" @change="getLinkLists" />
                    </div>
                </el-tab-pane>
            </el-tabs>
        </el-card>

        <!-- 分组编辑弹窗 -->
        <el-dialog
            v-model="showGroupEdit"
            :title="groupData.id ? '编辑分组' : '添加分组'"
            width="400px"
        >
            <el-form ref="groupFormRef" :model="groupData" :rules="groupRules" label-width="80px">
                <el-form-item label="分组名称" prop="name">
                    <el-input v-model="groupData.name" placeholder="请输入分组名称" />
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
                <el-button type="primary" :loading="groupLoading" @click="handleSubmitGroup"
                    >确定</el-button
                >
            </template>
        </el-dialog>

        <!-- 链接编辑弹窗 -->
        <el-dialog
            v-model="showLinkEdit"
            :title="linkData.id ? '编辑链接' : '添加链接'"
            width="500px"
        >
            <el-form ref="linkFormRef" :model="linkData" :rules="linkRules" label-width="80px">
                <el-form-item label="所属分组" prop="groupId">
                    <el-select
                        v-model="linkData.groupId"
                        placeholder="请选择分组"
                        style="width: 100%"
                    >
                        <el-option
                            v-for="g in groupOptions"
                            :key="g.id"
                            :label="g.name"
                            :value="g.id"
                        />
                    </el-select>
                </el-form-item>
                <el-form-item label="链接名称" prop="name">
                    <el-input v-model="linkData.name" placeholder="请输入链接名称" />
                </el-form-item>
                <el-form-item label="链接地址" prop="url">
                    <el-input v-model="linkData.url" placeholder="请输入链接地址" />
                </el-form-item>
                <el-form-item label="图标">
                    <el-input v-model="linkData.icon" placeholder="图标类名" />
                </el-form-item>
                <el-form-item label="排序">
                    <el-input-number v-model="linkData.sortOrder" :min="0" />
                </el-form-item>
                <el-form-item label="新窗口">
                    <el-switch v-model="linkData.openInNewTab" />
                </el-form-item>
                <el-form-item label="状态">
                    <el-switch v-model="linkData.isActive" />
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button @click="showLinkEdit = false">取消</el-button>
                <el-button type="primary" :loading="linkLoading" @click="handleSubmitLink"
                    >确定</el-button
                >
            </template>
        </el-dialog>
    </div>
</template>

<script lang="ts" setup name="uiedFooter">
import {
    uiedFooterGroupList,
    uiedFooterGroupAdd,
    uiedFooterGroupEdit,
    uiedFooterGroupDelete,
    uiedFooterLinkList,
    uiedFooterLinkAdd,
    uiedFooterLinkEdit,
    uiedFooterLinkDelete
} from '@/api/uied'
import { usePaging } from '@/hooks/usePaging'
import feedback from '@/utils/feedback'
import type { FormInstance, FormRules } from 'element-plus'

const activeTab = ref('groups')
const groupOptions = ref<any[]>([])
const linkGroupFilter = ref<number | undefined>()
const linkQueryParams = reactive({
    groupId: '' as number | ''
})

// 分组
const { pager: groupPager, getLists: getGroupLists } = usePaging({ fetchFun: uiedFooterGroupList })
const showGroupEdit = ref(false)
const groupLoading = ref(false)
const groupFormRef = ref<FormInstance>()
const groupData = reactive({ id: 0, name: '', sortOrder: 0, isActive: true })
const groupRules: FormRules = {
    name: [{ required: true, message: '请输入分组名称', trigger: 'blur' }]
}

// 链接
const { pager: linkPager, getLists: getLinkListsBase } = usePaging({
    fetchFun: uiedFooterLinkList,
    params: linkQueryParams
})
/**
 * 获取链接列表（按分组筛选）
 */
const getLinkLists = () => {
    linkQueryParams.groupId = linkGroupFilter.value ?? ''
    return getLinkListsBase()
}
const showLinkEdit = ref(false)
const linkLoading = ref(false)
const linkFormRef = ref<FormInstance>()
const linkData = reactive({
    id: 0,
    groupId: undefined as number | undefined,
    name: '',
    url: '',
    icon: '',
    sortOrder: 0,
    openInNewTab: false,
    isActive: true
})
const linkRules: FormRules = {
    groupId: [{ required: true, message: '请选择分组', trigger: 'change' }],
    name: [{ required: true, message: '请输入链接名称', trigger: 'blur' }],
    url: [{ required: true, message: '请输入链接地址', trigger: 'blur' }]
}

const loadGroupOptions = async () => {
    const res = await uiedFooterGroupList({ pageSize: 100 })
    groupOptions.value = res?.lists || []
}

// 分组操作
const handleAddGroup = () => {
    Object.assign(groupData, { id: 0, name: '', sortOrder: 0, isActive: true })
    showGroupEdit.value = true
}
const handleEditGroup = (row: any) => {
    Object.assign(groupData, row)
    showGroupEdit.value = true
}
const handleSubmitGroup = async () => {
    await groupFormRef.value?.validate()
    groupLoading.value = true
    try {
        if (groupData.id) {
            await uiedFooterGroupEdit(groupData)
            feedback.msgSuccess('编辑成功')
        } else {
            await uiedFooterGroupAdd(groupData)
            feedback.msgSuccess('添加成功')
        }
        showGroupEdit.value = false
        getGroupLists()
        loadGroupOptions()
    } finally {
        groupLoading.value = false
    }
}
const handleDeleteGroup = async (id: number) => {
    await feedback.confirm('确定要删除该分组吗？分组下的链接也会被删除')
    await uiedFooterGroupDelete({ id })
    feedback.msgSuccess('删除成功')
    getGroupLists()
    loadGroupOptions()
}

// 链接操作
const handleAddLink = () => {
    Object.assign(linkData, {
        id: 0,
        groupId: undefined,
        name: '',
        url: '',
        icon: '',
        sortOrder: 0,
        openInNewTab: false,
        isActive: true
    })
    showLinkEdit.value = true
}
const handleEditLink = (row: any) => {
    Object.assign(linkData, row)
    showLinkEdit.value = true
}
const handleSubmitLink = async () => {
    await linkFormRef.value?.validate()
    linkLoading.value = true
    try {
        if (linkData.id) {
            await uiedFooterLinkEdit(linkData)
            feedback.msgSuccess('编辑成功')
        } else {
            await uiedFooterLinkAdd(linkData)
            feedback.msgSuccess('添加成功')
        }
        showLinkEdit.value = false
        getLinkLists()
    } finally {
        linkLoading.value = false
    }
}
const handleDeleteLink = async (id: number) => {
    await feedback.confirm('确定要删除该链接吗？')
    await uiedFooterLinkDelete({ id })
    feedback.msgSuccess('删除成功')
    getLinkLists()
}

getGroupLists()
getLinkLists()
loadGroupOptions()
</script>
