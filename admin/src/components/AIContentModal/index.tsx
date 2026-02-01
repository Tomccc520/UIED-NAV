/**
 * @file components/AIContentModal/index.tsx
 * @description AI 内容编辑助手 - 使用 Ant Design X 对话组件，支持流式输出
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 3.0.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Drawer, Button, Space, Select, Tag, App, Flex } from 'antd';
import {
  RobotOutlined,
  CloseOutlined,
  EditOutlined,
  ExpandOutlined,
  CompressOutlined,
  TranslationOutlined,
  FileTextOutlined,
  CopyOutlined,
  CheckOutlined,
  DeleteOutlined,
  SettingOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Bubble, Sender } from '@ant-design/x';
import { XMarkdown } from '@ant-design/x-markdown';
import api from '../../services/api';
import './index.css';

interface AIContentModalProps {
  open: boolean;
  onClose: () => void;
  onInsert: (content: string) => void;
  initialContent?: string;
  mode?: 'replace' | 'append';
}

interface AIConfig {
  id: string;
  name: string;
  provider: string;
  model: string;
  enabled: boolean;
  isDefault: boolean;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  status: 'pending' | 'streaming' | 'done' | 'error';
}

interface QuickAction {
  key: string;
  label: string;
  icon: React.ReactNode;
  prompt: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  { key: 'polish', label: '润色', icon: <EditOutlined />, prompt: '请帮我润色以下内容，使其更加流畅专业：\n\n' },
  { key: 'continue', label: '续写', icon: <FileTextOutlined />, prompt: '请帮我续写以下内容：\n\n' },
  { key: 'expand', label: '扩写', icon: <ExpandOutlined />, prompt: '请帮我扩写以下内容，增加更多细节：\n\n' },
  { key: 'summarize', label: '总结', icon: <CompressOutlined />, prompt: '请帮我总结以下内容的要点：\n\n' },
  { key: 'translate', label: '翻译', icon: <TranslationOutlined />, prompt: '请帮我翻译以下内容（中英互译）：\n\n' },
];

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

/**
 * AI 内容编辑助手
 * 使用 Ant Design X 对话组件，支持流式输出
 */
const AIContentModal: React.FC<AIContentModalProps> = ({
  open,
  onClose,
  onInsert,
  initialContent = '',
  mode = 'replace',
}) => {
  const { message } = App.useApp();
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // 模型相关状态
  const [aiConfigs, setAiConfigs] = useState<AIConfig[]>([]);
  const [selectedConfigId, setSelectedConfigId] = useState<string>('');
  const [loadingConfigs, setLoadingConfigs] = useState(false);
  
  // 引用
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const messageIdRef = useRef(0);

  // 生成消息 ID
  const generateId = useCallback(() => {
    messageIdRef.current += 1;
    return `msg_${Date.now()}_${messageIdRef.current}`;
  }, []);

  // 获取 AI 配置列表
  const fetchAiConfigs = async () => {
    setLoadingConfigs(true);
    try {
      const res = await api.get('/ai-config');
      const configs = res.data.filter((c: AIConfig) => c.enabled);
      setAiConfigs(configs);
      const defaultConfig = configs.find((c: AIConfig) => c.isDefault) || configs[0];
      if (defaultConfig) {
        setSelectedConfigId(defaultConfig.id);
      }
    } catch (error) {
      console.error('获取 AI 配置失败:', error);
    } finally {
      setLoadingConfigs(false);
    }
  };

  // 当面板打开时获取配置
  useEffect(() => {
    if (open) {
      fetchAiConfigs();
    }
  }, [open]);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 发送消息并处理流式响应
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isStreaming) return;

    const userMsgId = generateId();
    const assistantMsgId = generateId();

    // 添加用户消息
    const userMsg: ChatMessage = {
      id: userMsgId,
      role: 'user',
      content: content.trim(),
      status: 'done',
    };

    // 添加 AI 消息占位
    const assistantMsg: ChatMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      status: 'pending',
    };

    setMessages(prev => [...prev, userMsg, assistantMsg]);
    setIsStreaming(true);
    setInputValue('');

    // 创建 AbortController
    abortControllerRef.current = new AbortController();

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/ai-config/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          message: content.trim(),
          configId: selectedConfigId || undefined,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `请求失败: ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      
      // 非流式响应
      if (!contentType?.includes('text/event-stream')) {
        const data = await response.json();
        setMessages(prev => prev.map(msg => 
          msg.id === assistantMsgId 
            ? { ...msg, content: data.reply || '无响应', status: 'done' as const }
            : msg
        ));
        setIsStreaming(false);
        return;
      }

      // 更新状态为 streaming
      setMessages(prev => prev.map(msg => 
        msg.id === assistantMsgId 
          ? { ...msg, status: 'streaming' as const }
          : msg
      ));

      // 流式响应处理
      const reader = response.body?.getReader();
      if (!reader) throw new Error('无法读取响应流');

      const decoder = new TextDecoder();
      let buffer = '';
      let accumulatedContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine || trimmedLine.startsWith('event:')) continue;
          
          if (trimmedLine.startsWith('data:')) {
            const dataStr = trimmedLine.slice(5).trim();
            if (dataStr === '[DONE]') continue;

            try {
              const data = JSON.parse(dataStr);
              if (data.error) throw new Error(data.error);
              
              if (data.content) {
                accumulatedContent += data.content;
                setMessages(prev => prev.map(msg => 
                  msg.id === assistantMsgId 
                    ? { ...msg, content: accumulatedContent }
                    : msg
                ));
              }
            } catch {
              // 忽略解析错误
            }
          }
        }
      }

      // 完成
      setMessages(prev => prev.map(msg => 
        msg.id === assistantMsgId 
          ? { ...msg, status: 'done' as const }
          : msg
      ));
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') {
        setMessages(prev => prev.map(msg => 
          msg.id === assistantMsgId 
            ? { ...msg, status: 'done' as const }
            : msg
        ));
      } else {
        console.error('流式对话失败:', error);
        setMessages(prev => prev.map(msg => 
          msg.id === assistantMsgId 
            ? { ...msg, content: '抱歉，AI 服务暂时不可用，请稍后再试。', status: 'error' as const }
            : msg
        ));
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  }, [isStreaming, selectedConfigId, generateId]);

  // 快捷操作
  const handleQuickAction = (action: QuickAction) => {
    if (!initialContent.trim()) {
      message.warning('请先在编辑器中输入内容');
      return;
    }
    sendMessage(action.prompt + initialContent);
  };

  // 复制内容
  const handleCopy = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    message.success('已复制');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // 插入到编辑器
  const handleInsertContent = (content: string) => {
    if (mode === 'append') {
      onInsert(initialContent + '\n\n' + content);
    } else {
      onInsert(content);
    }
    message.success('已插入编辑器');
  };

  // 清空对话
  const handleClear = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setMessages([]);
    setIsStreaming(false);
  };

  // 获取当前选中的配置
  const selectedConfig = aiConfigs.find(c => c.id === selectedConfigId);

  return (
    <Drawer
      title={
        <Flex align="center" gap={8}>
          <RobotOutlined style={{ color: '#1677ff', fontSize: 18 }} />
          <span>AI 助手</span>
          {selectedConfig && (
            <Tag color="blue" style={{ marginLeft: 8, fontSize: 11 }}>
              {selectedConfig.name}
            </Tag>
          )}
        </Flex>
      }
      placement="right"
      width={440}
      onClose={onClose}
      open={open}
      mask={false}
      styles={{
        body: { padding: 0, display: 'flex', flexDirection: 'column', height: '100%' },
        header: { borderBottom: '1px solid #f0f0f0', padding: '12px 16px' },
      }}
      extra={
        <Space size={4}>
          <Button 
            type="text" 
            size="small" 
            icon={<DeleteOutlined />} 
            onClick={handleClear}
            title="清空对话"
          />
          <Button 
            type="text" 
            size="small" 
            icon={<CloseOutlined />} 
            onClick={onClose} 
          />
        </Space>
      }
      closeIcon={null}
    >
      {/* 模型选择 */}
      <div style={{ padding: '8px 16px', borderBottom: '1px solid #f0f0f0', background: '#fafafa' }}>
        <Flex align="center" gap={8}>
          <SettingOutlined style={{ color: '#8c8c8c', fontSize: 12 }} />
          <Select
            size="small"
            value={selectedConfigId}
            onChange={setSelectedConfigId}
            loading={loadingConfigs}
            style={{ flex: 1 }}
            placeholder="选择模型"
            variant="borderless"
            options={aiConfigs.map(c => ({
              value: c.id,
              label: `${c.name} (${c.model})`,
            }))}
          />
        </Flex>
      </div>

      {/* 快捷操作 */}
      {initialContent && (
        <div style={{ padding: '8px 16px', borderBottom: '1px solid #f0f0f0' }}>
          <Flex gap={6} wrap="wrap">
            {QUICK_ACTIONS.map(action => (
              <Button
                key={action.key}
                size="small"
                icon={action.icon}
                onClick={() => handleQuickAction(action)}
                disabled={isStreaming}
                style={{ borderRadius: 16 }}
              >
                {action.label}
              </Button>
            ))}
          </Flex>
        </div>
      )}

      {/* 对话区域 */}
      <div className="ai-chat-messages" style={{ flex: 1, overflow: 'auto', padding: 16 }}>
        {messages.length === 0 ? (
          <Flex 
            vertical 
            align="center" 
            justify="center" 
            style={{ height: '100%', color: '#8c8c8c' }}
          >
            <RobotOutlined style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }} />
            <div style={{ fontSize: 14 }}>有什么可以帮你的？</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>
              {initialContent ? '点击上方快捷操作或直接输入' : '直接输入问题开始对话'}
            </div>
          </Flex>
        ) : (
          <Flex vertical gap={16}>
            {messages.map((msg) => (
              <div key={msg.id} className={`ai-chat-message ai-chat-message-${msg.role}`}>
                <Bubble
                  content={msg.role === 'assistant' ? (
                    <XMarkdown>{msg.content || (msg.status === 'pending' ? '思考中...' : '')}</XMarkdown>
                  ) : msg.content}
                  loading={msg.status === 'pending' || msg.status === 'streaming'}
                  placement={msg.role === 'user' ? 'end' : 'start'}
                  avatar={
                    msg.role === 'assistant' 
                      ? <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#1677ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}><RobotOutlined /></div>
                      : <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#87d068', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}><UserOutlined /></div>
                  }
                  styles={{
                    content: msg.role === 'user' ? {
                      background: '#1677ff',
                      color: '#fff',
                      borderRadius: 12,
                    } : {
                      background: '#f5f5f5',
                      borderRadius: 12,
                    },
                  }}
                />
                {/* AI 回复的操作按钮 */}
                {msg.role === 'assistant' && msg.status === 'done' && msg.content && (
                  <Flex gap={4} style={{ marginTop: 4, marginLeft: 40 }}>
                    <Button
                      type="text"
                      size="small"
                      icon={copiedId === msg.id ? <CheckOutlined style={{ color: '#52c41a' }} /> : <CopyOutlined />}
                      onClick={() => handleCopy(msg.content, msg.id)}
                      style={{ fontSize: 12, color: '#8c8c8c' }}
                    >
                      复制
                    </Button>
                    <Button
                      type="text"
                      size="small"
                      icon={<EditOutlined />}
                      onClick={() => handleInsertContent(msg.content)}
                      style={{ fontSize: 12, color: '#8c8c8c' }}
                    >
                      插入编辑器
                    </Button>
                  </Flex>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </Flex>
        )}
      </div>

      {/* 输入区域 */}
      <div style={{ padding: 16, borderTop: '1px solid #f0f0f0' }}>
        <Sender
          value={inputValue}
          onChange={setInputValue}
          onSubmit={sendMessage}
          placeholder="输入消息，按 Enter 发送..."
          loading={isStreaming}
        />
      </div>
    </Drawer>
  );
};

export default AIContentModal;
