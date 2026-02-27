import { computed, reactive, toRaw } from 'vue'

// 分页钩子函数
interface Options {
    page?: number
    size?: number
    fetchFun: (_arg: any) => Promise<any>
    params?: Record<any, any>
    firstLoading?: boolean
}

export function usePaging(options: Options) {
    const { page = 1, size = 15, fetchFun, params = {}, firstLoading = false } = options
    // 记录分页初始参数
    const paramsInit: Record<any, any> = Object.assign({}, toRaw(params))
    // 分页数据
    const pager = reactive({
        page,
        size,
        loading: firstLoading,
        count: 0,
        lists: [] as any[]
    })

    /**
     * 兼容历史页面直接解构 lists/loading 的写法
     */
    const lists = computed(() => pager.lists)
    const loading = computed(() => pager.loading)
    // 请求分页接口
    const getLists = () => {
        pager.loading = true
        return fetchFun({
            pageNo: pager.page,
            pageSize: pager.size,
            ...params
        })
            .then((res: any) => {
                pager.count = res?.count
                pager.lists = res?.lists
                return Promise.resolve(res)
            })
            .catch((err: any) => {
                /**
                 * 重复请求被取消属于正常行为（如切页/切换路由触发并发请求）
                 * 这里吞掉取消异常，避免控制台出现 Uncaught (in promise)
                 */
                if (err?.code === 'ERR_CANCELED') {
                    return Promise.resolve({
                        count: pager.count,
                        lists: pager.lists
                    })
                }
                return Promise.reject(err)
            })
            .finally(() => {
                pager.loading = false
            })
    }
    // 重置为第一页
    const resetPage = () => {
        pager.page = 1
        getLists()
    }
    // 重置参数
    const resetParams = () => {
        Object.keys(paramsInit).forEach((item) => {
            params[item] = paramsInit[item]
        })
        getLists()
    }
    return {
        pager,
        lists,
        loading,
        getLists,
        resetParams,
        resetPage
    }
}
