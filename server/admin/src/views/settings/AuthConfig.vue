<!--
/**
 * @copyright Tomda (https://www.tomda.top)
 * @copyright UIED技术团队 (https://fsuied.com)
 * @author UIED技术团队
 * @createDate 2026.3.2
 */
-->
<template>
    <div class="auth-config-container">
        <el-card class="box-card">
            <template #header>
                <div class="card-header">
                    <span>注册/登录配置</span>
                </div>
            </template>

            <el-form :model="form" label-width="140px">
                <!-- 注册开关 -->
                <el-form-item label="允许用户注册">
                    <el-switch
                        v-model="form.enable_register"
                        :active-value="1"
                        :inactive-value="0"
                        active-text="开启"
                        inactive-text="关闭"
                    />
                    <div class="form-tip">关闭后，用户将无法注册新账号</div>
                </el-form-item>

                <el-form-item label="注册关闭提示" v-if="form.enable_register === 0">
                    <el-input
                        v-model="form.register_close_message"
                        type="textarea"
                        :rows="2"
                        placeholder="请输入注册关闭时的提示信息"
                        maxlength="255"
                        show-word-limit
                    />
                </el-form-item>

                <el-divider />

                <!-- 登录开关 -->
                <el-form-item label="允许用户登录">
                    <el-switch
                        v-model="form.enable_login"
                        :active-value="1"
                        :inactive-value="0"
                        active-text="开启"
                        inactive-text="关闭"
                    />
                    <div class="form-tip">关闭后，用户将无法登录（维护模式）</div>
                </el-form-item>

                <el-form-item label="登录关闭提示" v-if="form.enable_login === 0">
                    <el-input
                        v-model="form.login_close_message"
                        type="textarea"
                        :rows="2"
                        placeholder="请输入登录关闭时的提示信息"
                        maxlength="255"
                        show-word-limit
                    />
                </el-form-item>

                <el-form-item>
                    <el-button type="primary" @click="handleSave" :loading="loading">
                        保存配置
                    </el-button>
                    <el-button @click="handleReset">重置</el-button>
                </el-form-item>
            </el-form>
        </el-card>

        <!-- 使用说明 -->
        <el-card class="box-card mt-4">
            <template #header>
                <div class="card-header">
                    <span>使用说明</span>
                </div>
            </template>

            <el-alert title="注意事项" type="warning" :closable="false" show-icon>
                <ul>
                    <li>关闭注册后，新用户将无法注册账号</li>
                    <li>关闭登录后，所有用户（包括已登录用户）将无法登录</li>
                    <li>管理员登录不受此开关影响</li>
                    <li>建议在系统维护时临时关闭登录功能</li>
                    <li>配置修改后立即生效，无需重启服务</li>
                </ul>
            </el-alert>
        </el-card>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'

const form = ref({
    enable_register: 1,
    enable_login: 1,
    register_close_message: '注册功能暂时关闭，请稍后再试',
    login_close_message: '系统维护中，暂时无法登录'
})

const loading = ref(false)
const originalForm = ref({})

// 获取配置
const getAuthConfig = () => {
    return request({
        url: '/uied/setting/auth-config',
        method: 'get'
    })
}

// 更新配置
const updateAuthConfig = (data) => {
    return request({
        url: '/uied/setting/auth-config/update',
        method: 'post',
        data
    })
}

// 加载配置
const loadConfig = async () => {
    try {
        const res = await getAuthConfig()
        if (res.code === 200 && res.data) {
            form.value = {
                enable_register: res.data.enable_register ?? 1,
                enable_login: res.data.enable_login ?? 1,
                register_close_message:
                    res.data.register_close_message || '注册功能暂时关闭，请稍后再试',
                login_close_message: res.data.login_close_message || '系统维护中，暂时无法登录'
            }
            originalForm.value = { ...form.value }
        }
    } catch (error) {
        console.error('加载配置失败:', error)
        ElMessage.error('加载配置失败')
    }
}

// 保存配置
const handleSave = async () => {
    loading.value = true
    try {
        const res = await updateAuthConfig(form.value)
        if (res.code === 200) {
            ElMessage.success('保存成功')
            originalForm.value = { ...form.value }
        } else {
            ElMessage.error(res.message || '保存失败')
        }
    } catch (error) {
        console.error('保存失败:', error)
        ElMessage.error('保存失败')
    } finally {
        loading.value = false
    }
}

// 重置
const handleReset = () => {
    form.value = { ...originalForm.value }
}

onMounted(() => {
    loadConfig()
})
</script>

<style scoped>
.auth-config-container {
    padding: 20px;
}

.form-tip {
    font-size: 12px;
    color: #999;
    margin-top: 5px;
}

.mt-4 {
    margin-top: 20px;
}

ul {
    margin: 0;
    padding-left: 20px;
}

li {
    margin: 5px 0;
    line-height: 1.6;
}
</style>
