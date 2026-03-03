<template>
    <div class="login flex flex-col">
        <div class="flex-1 flex items-center justify-center">
            <div class="login-card flex rounded-md">
                <div class="flex-1 h-full hidden md:inline-block">
                    <image-contain :src="config.webBackdrop" :width="400" height="100%" />
                </div>
                <div
                    class="login-form bg-body flex flex-col justify-center px-10 py-10 md:w-[400px] w-[375px] flex-none mx-auto"
                >
                    <div class="text-center text-3xl font-medium mb-8">{{ config.webName }}</div>
                    <el-form ref="formRef" :model="formData" size="large" :rules="rules">
                        <el-form-item prop="account">
                            <el-input
                                v-model.trim="formData.account"
                                placeholder="请输入账号"
                                @keyup.enter="handleEnter"
                            >
                                <template #prepend>
                                    <icon name="el-icon-User" />
                                </template>
                            </el-input>
                        </el-form-item>
                        <el-form-item prop="password">
                            <el-input
                                ref="passwordRef"
                                v-model="formData.password"
                                show-password
                                placeholder="请输入密码"
                                @keyup.enter="handleLogin"
                            >
                                <template #prepend>
                                    <icon name="el-icon-Lock" />
                                </template>
                            </el-input>
                        </el-form-item>
                        <el-form-item v-if="captchaVisible" prop="captchaAnswer">
                            <el-input
                                v-model.trim="formData.captchaAnswer"
                                :placeholder="captchaPlaceholder"
                                @keyup.enter="handleLogin"
                            >
                                <template #prepend>
                                    <icon name="el-icon-Key" />
                                </template>
                                <template #append>
                                    <el-button text :disabled="captchaLoading" @click="handleRefreshCaptchaClick">
                                        {{ captchaLoading ? '刷新中' : '换一题' }}
                                    </el-button>
                                </template>
                            </el-input>
                        </el-form-item>
                    </el-form>
                    <div v-if="captchaVisible" class="mb-4 text-xs text-info">
                        {{ captchaHintText }}
                    </div>
                    <div class="mb-5">
                        <el-checkbox v-model="remAccount" label="记住账号"></el-checkbox>
                    </div>
                    <el-button type="primary" size="large" :loading="isLock" @click="lockLogin">
                        登录
                    </el-button>
                </div>
            </div>
        </div>
        <layout-footer />
    </div>
</template>

<script lang="ts" setup>
/**
 * @copyright Tomda (https://www.tomda.top)
 * @copyright UIED技术团队 (https://fsuied.com)
 * @author UIED技术团队
 * @createDate 2026-03-03
 */
import { computed, onMounted, reactive, ref, shallowRef } from 'vue'
import type { FormInstance, FormRules, InputInstance } from 'element-plus'
import LayoutFooter from '@/layout/components/footer.vue'
import useAppStore from '@/stores/modules/app'
import useUserStore from '@/stores/modules/user'
import cache from '@/utils/cache'
import { ACCOUNT_KEY } from '@/enums/cacheEnums'
import { PageEnum } from '@/enums/pageEnum'
import { useLockFn } from '@/hooks/useLockFn'
import { getLoginCaptcha } from '@/api/user'
const passwordRef = shallowRef<InputInstance>()
const formRef = shallowRef<FormInstance>()
const appStore = useAppStore()
const userStore = useUserStore()
const route = useRoute()
const router = useRouter()
const remAccount = ref(false)
const config = computed(() => appStore.config)
const captchaVisible = ref(false)
const captchaLoading = ref(false)
const captchaHintText = ref('已启用登录保护，请先完成验证码再登录。')
const captchaQuestion = ref('')
const formData = reactive({
    account: '',
    password: '',
    captchaId: '',
    captchaAnswer: ''
})
const rules = reactive<FormRules>({
    account: [
        {
            required: true,
            message: '请输入账号',
            trigger: ['blur']
        }
    ],
    password: [
        {
            required: true,
            message: '请输入密码',
            trigger: ['blur']
        }
    ],
    captchaAnswer: [
        {
            validator: (_rule, value, callback) => {
                if (!captchaVisible.value) {
                    callback()
                    return
                }
                if (!String(value || '').trim()) {
                    callback(new Error('请输入验证码结果'))
                    return
                }
                callback()
            },
            trigger: ['blur', 'change']
        }
    ]
})
const captchaPlaceholder = computed(() => {
    if (!captchaQuestion.value) return '请输入验证码结果'
    return `请计算：${captchaQuestion.value}`
})
// 回车按键监听
const handleEnter = () => {
    if (!formData.password) {
        return passwordRef.value?.focus()
    }
    handleLogin()
}

/**
 * 刷新登录验证码题目
 */
const refreshCaptcha = async (keepHint = false) => {
    const account = String(formData.account || '').trim()
    if (!account) {
        captchaHintText.value = '请先输入账号后再获取验证码。'
        return
    }
    captchaLoading.value = true
    try {
        const data = await getLoginCaptcha({ username: account })
        captchaVisible.value = true
        formData.captchaId = String(data?.captchaId || '')
        formData.captchaAnswer = ''
        captchaQuestion.value = String(data?.question || '')
        const expireSeconds = Number(data?.expireSeconds || 0) || 300
        if (!keepHint) {
            captchaHintText.value = `验证码有效期 ${expireSeconds} 秒，请在有效期内完成登录。`
        }
    } finally {
        captchaLoading.value = false
    }
}

/**
 * 手动刷新验证码按钮事件
 */
const handleRefreshCaptchaClick = () => {
    return refreshCaptcha()
}

/**
 * 处理登录失败后的风控状态（验证码/锁定时长）
 */
const handleLoginErrorState = async (error: any) => {
    const errorData = error?.data || {}
    const needCaptcha = Boolean(errorData?.needCaptcha || errorData?.captchaRequired || errorData?.locked)
    const lockSeconds = Number(errorData?.lockSeconds || 0) || 0
    if (needCaptcha) {
        captchaVisible.value = true
        if (lockSeconds > 0) {
            captchaHintText.value = `登录失败次数过多，请 ${lockSeconds} 秒后再试。`
        } else {
            captchaHintText.value = '账号已进入保护模式，请先完成验证码。'
        }
        await refreshCaptcha(lockSeconds > 0)
        return
    }
}

/**
 * 登录处理
 */
const handleLogin = async () => {
    await formRef.value?.validate()
    // 记住账号，缓存
    cache.set(ACCOUNT_KEY, {
        remember: remAccount.value,
        account: remAccount.value ? formData.account : ''
    })
    try {
        await userStore.login(formData)
        const {
            query: { redirect }
        } = route
        const path = typeof redirect === 'string' ? redirect : PageEnum.INDEX
        router.push(path)
    } catch (error) {
        await handleLoginErrorState(error)
        return
    }
}
const { isLock, lockFn: lockLogin } = useLockFn(handleLogin)

onMounted(() => {
    const value = cache.get(ACCOUNT_KEY)
    if (value?.remember) {
        remAccount.value = value.remember
        formData.account = value.account
    }
})
</script>

<style lang="scss" scoped>
.login {
    background-image: url('./images/login_bg.png');
    @apply min-h-screen bg-no-repeat bg-center bg-cover;
    .login-card {
        height: 400px;
    }
}
</style>
