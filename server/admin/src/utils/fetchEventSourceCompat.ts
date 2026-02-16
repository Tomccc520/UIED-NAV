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
 * 解析 SSE 事件块并触发 onmessage 回调
 */
const emitSseEventData = (
    rawEvent: string,
    onmessage?: (event: FetchEventSourceMessage) => void
) => {
    const lines = String(rawEvent || '').split(/\r?\n/)
    for (const lineRaw of lines) {
        const line = String(lineRaw || '').trim()
        if (!line.startsWith('data:')) continue
        const data = line.slice(5).trim()
        if (!data) continue
        onmessage?.({ data })
    }
}

/**
 * 处理 SSE 缓冲区，按事件边界持续输出
 */
const consumeSseBuffer = (buffer: string, onmessage?: (event: FetchEventSourceMessage) => void) => {
    let remaining = String(buffer || '')
    let markerMatch = remaining.match(/\r?\n\r?\n/)
    while (markerMatch) {
        const markerIndex = Number(markerMatch.index || 0)
        const markerSize = String(markerMatch[0] || '').length || 2
        const rawEvent = remaining.slice(0, markerIndex)
        emitSseEventData(rawEvent, onmessage)
        remaining = remaining.slice(markerIndex + markerSize)
        markerMatch = remaining.match(/\r?\n\r?\n/)
    }
    return remaining
}

/**
 * 轻量 fetch-event-source 兼容实现（支持流式逐段回调）
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

        const body = response.body
        if (!body || typeof body.getReader !== 'function') {
            const text = await response.text()
            consumeSseBuffer(text, options.onmessage)
            return
        }

        const reader = body.getReader()
        const decoder = new TextDecoder('utf-8')
        let buffer = ''
        let reading = true

        while (reading) {
            const { done, value } = await reader.read()
            if (done) {
                reading = false
                continue
            }
            buffer += decoder.decode(value, { stream: true })
            buffer = consumeSseBuffer(buffer, options.onmessage)
        }

        // 处理尾部残留缓冲，避免最后一个事件未被 \n\n 正常结束时丢失
        buffer += decoder.decode()
        if (buffer.trim()) {
            emitSseEventData(buffer, options.onmessage)
        }
    } catch (error) {
        if (options.onerror) {
            options.onerror(error)
            return
        }
        throw error
    }
}
