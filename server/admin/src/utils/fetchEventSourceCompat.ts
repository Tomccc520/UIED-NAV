export interface FetchEventSourceMessage {
    data: string
}

export interface FetchEventSourceOptions {
    method?: string
    signal?: AbortSignal
    headers?: HeadersInit
    body?: BodyInit | null
    onopen?: (response: Response) => void | Promise<void>
    onmessage?: (event: FetchEventSourceMessage) => void
    onerror?: (error: unknown) => void
}

/**
 * 轻量 fetch-event-source 兼容实现
 */
export async function fetchEventSource(url: string, options: FetchEventSourceOptions = {}) {
    try {
        const response = await fetch(url, {
            method: options.method || 'GET',
            signal: options.signal,
            headers: options.headers,
            body: options.body
        })

        if (options.onopen) {
            await options.onopen(response)
        }

        const text = await response.text()
        const lines = text.split(/\r?\n/)
        for (const lineRaw of lines) {
            const line = String(lineRaw || '').trim()
            if (!line.startsWith('data:')) continue
            const data = line.slice(5).trim()
            if (!data) continue
            options.onmessage?.({ data })
        }
    } catch (error) {
        if (options.onerror) {
            options.onerror(error)
            return
        }
        throw error
    }
}
