/**
 * @file useStreamChat.ts
 * @description 流式聊天 Hook - 支持 SSE 流式响应
 */

import { useState, useRef, useCallback } from 'react';

export interface Message {
  key: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  status?: 'sending' | 'streaming' | 'done' | 'error';
}

export interface UseStreamChatOptions {
  apiUrl?: string;
  systemContext?: string;
  onError?: (error: Error) => void;
}

export interface UseStreamChatReturn {
  messages: Message[];
  isStreaming: boolean;
  sendMessage: (content: string) => Promise<void>;
  cancelStream: () => void;
  clearMessages: () => void;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export function useStreamChat(options: UseStreamChatOptions = {}): UseStreamChatReturn {
  const { 
    apiUrl = `${API_BASE_URL}/ai-config/chat/stream`,
    systemContext,
    onError 
  } = options;

  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const messageIdRef = useRef(0);

  // 生成消息 ID
  const generateMessageId = useCallback(() => {
    messageIdRef.current += 1;
    return `msg_${Date.now()}_${messageIdRef.current}`;
  }, []);

  // 取消流式传输
  const cancelStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  // 清空消息
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  // 发送消息
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isStreaming) return;

    const userMessage = content.trim();
    const userMsgId = generateMessageId();
    const assistantMsgId = generateMessageId();

    // 添加用户消息
    const userMsg: Message = {
      key: userMsgId,
      role: 'user',
      content: userMessage,
      timestamp: Date.now(),
      status: 'done',
    };

    // 添加 AI 消息占位符
    const assistantMsg: Message = {
      key: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      status: 'sending',
    };

    setMessages(prev => [...prev, userMsg, assistantMsg]);
    setIsStreaming(true);

    // 创建 AbortController
    abortControllerRef.current = new AbortController();

    try {
      // 构建上下文
      const context = messages.map(m => ({
        role: m.role,
        content: m.content,
      }));

      let finalMessage = userMessage;
      if (systemContext) {
        finalMessage = `[上下文: ${systemContext}]\n\n${userMessage}`;
      }

      // 获取 token
      const token = localStorage.getItem('token');

      // 发起流式请求
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          message: finalMessage,
          context,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      // 检查是否是 SSE 响应
      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('text/event-stream')) {
        // 非流式响应，直接解析 JSON
        const data = await response.json();
        setMessages(prev => prev.map(msg => 
          msg.key === assistantMsgId 
            ? { ...msg, content: data.reply || data.error || '无响应', status: 'done' as const }
            : msg
        ));
        setIsStreaming(false);
        return;
      }

      // 处理 SSE 流式响应
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('无法读取响应流');
      }

      const decoder = new TextDecoder();
      let buffer = '';
      let accumulatedContent = '';

      // 更新状态为 streaming
      setMessages(prev => prev.map(msg => 
        msg.key === assistantMsgId 
          ? { ...msg, status: 'streaming' as const }
          : msg
      ));

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmedLine = line.trim();
          
          if (!trimmedLine) continue;
          
          if (trimmedLine.startsWith('event:')) {
            // 处理事件类型
            continue;
          }
          
          if (trimmedLine.startsWith('data:')) {
            const dataStr = trimmedLine.slice(5).trim();
            
            if (dataStr === '[DONE]') {
              continue;
            }

            try {
              const data = JSON.parse(dataStr);
              
              if (data.error) {
                throw new Error(data.error);
              }

              if (data.content) {
                accumulatedContent += data.content;
                
                // 更新消息内容
                setMessages(prev => prev.map(msg => 
                  msg.key === assistantMsgId 
                    ? { ...msg, content: accumulatedContent }
                    : msg
                ));
              }

              if (data.done) {
                // 流式传输完成
                setMessages(prev => prev.map(msg => 
                  msg.key === assistantMsgId 
                    ? { ...msg, status: 'done' as const }
                    : msg
                ));
              }
            } catch (parseError) {
              // 忽略解析错误，继续处理
              console.warn('SSE 数据解析警告:', parseError);
            }
          }
        }
      }

      // 确保最终状态为 done
      setMessages(prev => prev.map(msg => 
        msg.key === assistantMsgId 
          ? { ...msg, status: 'done' as const }
          : msg
      ));

    } catch (error: any) {
      if (error.name === 'AbortError') {
        // 用户取消，保留已接收的内容
        setMessages(prev => prev.map(msg => 
          msg.key === assistantMsgId 
            ? { ...msg, status: 'done' as const }
            : msg
        ));
      } else {
        console.error('流式对话失败:', error);
        onError?.(error);
        
        // 更新为错误状态
        setMessages(prev => prev.map(msg => 
          msg.key === assistantMsgId 
            ? { 
                ...msg, 
                content: msg.content || '抱歉，AI 服务暂时不可用，请稍后再试。',
                status: 'error' as const 
              }
            : msg
        ));
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  }, [apiUrl, systemContext, messages, isStreaming, generateMessageId, onError]);

  return {
    messages,
    isStreaming,
    sendMessage,
    cancelStream,
    clearMessages,
  };
}

export default useStreamChat;
