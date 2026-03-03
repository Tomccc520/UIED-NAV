import { fileURLToPath, URL } from 'url'

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import { createStyleImportPlugin, ElementPlusResolve } from 'vite-plugin-style-import'
import { createSvgIconsPlugin } from 'vite-plugin-svg-icons'
import vueSetupExtend from 'vite-plugin-vue-setup-extend'
// https://vitejs.dev/config/
/**
 * @copyright Tomda (https://www.tomda.top)
 * @copyright UIED技术团队 (https://fsuied.com)
 * @author UIED技术团队
 * @createDate 2026-02-25
 */

/**
 * 创建 Vite 配置（补齐本地 API 代理与 Vue 编译期特性标记）
 * @param mode 运行模式
 */
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '')
    const apiTarget = env.VITE_PROXY_TARGET || 'http://127.0.0.1:8002'
    const appBasePath = normalizeBasePath(env.VITE_APP_BASE_PATH || '/')

    return {
        base: appBasePath,
        server: {
            host: '0.0.0.0',
            proxy: {
                '/api': {
                    target: apiTarget,
                    changeOrigin: true
                }
            }
        },
        define: {
            __VUE_OPTIONS_API__: true,
            __VUE_PROD_DEVTOOLS__: false,
            __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false
        },
        plugins: [
            vue(),
            vueJsx(),
            AutoImport({
                imports: ['vue', 'vue-router'],
                resolvers: [ElementPlusResolver()],
                eslintrc: {
                    enabled: true
                }
            }),
            Components({
                directoryAsNamespace: true,
                resolvers: [ElementPlusResolver()]
            }),
            createStyleImportPlugin({
                resolves: [ElementPlusResolve()]
            }),
            createSvgIconsPlugin({
                // 配置路劲在你的src里的svg存放文件
                iconDirs: [fileURLToPath(new URL('./src/assets/icons', import.meta.url))],
                symbolId: 'local-icon-[dir]-[name]'
            }),
            vueSetupExtend()
        ],
        resolve: {
            alias: {
                '@': fileURLToPath(new URL('./src', import.meta.url))
            }
        },
        build: {
            rollupOptions: {
                manualChunks(id) {
                    if (id.includes('node_modules')) {
                        return id.toString().split('node_modules/')[1].split('/')[0].toString()
                    }
                }
            }
        }
    }
})

/**
 * 规范化后台基础路径，确保以 "/" 开头并以 "/" 结尾
 * @param basePath 原始基础路径
 */
function normalizeBasePath(basePath: string): string {
    const value = String(basePath || '/').trim()
    if (!value || value === '/') return '/'
    let normalized = value.startsWith('/') ? value : `/${value}`
    if (!normalized.endsWith('/')) normalized = `${normalized}/`
    return normalized
}
