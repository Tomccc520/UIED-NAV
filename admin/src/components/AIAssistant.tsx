/**
 * @file AIAssistant.tsx
 * @description AI 助手组件 - 使用 @ant-design/x 官方组件
 * 集成 Welcome、Bubble.List、Prompts、Sender、Actions 等组件
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button, Space, message, theme, Select, Avatar, Tooltip } from 'antd';
import type { GetProp } from 'antd';
import { 
  CloseOutlined, 
  RobotOutlined, 
  UserOutlined,
  StopOutlined,
  BulbOutlined,
  EditOutlined,
  CompassOutlined,
  CopyOutlined,
  LikeOutlined,
  DislikeOutlined,
  ReloadOutlined,
  DeleteOutlined,
  DownOutlined,
} from '@ant-design/icons';
import { Bubble, Welcome, Prompts, Sender } from '@ant-design/x';
import type { PromptsProps, BubbleProps } from '@ant-design/x';
import { XMarkdown } from '@ant-design/x-markdown';
import { useStreamChat, type Message } from '../hooks/useStreamChat';

interface QuickPrompt {
  label: string;
  prompt: string;
  icon?: React.ReactNode;
  description?: string;
}

interface ModelOption {
  label: string;
  value: string;
  description?: string;
}

interface AIAssistantProps {
  title?: string;
  placeholder?: string;
  systemContext?: string;
  visible?: boolean;
  onClose?: () => void;
  floating?: boolean;
  style?: React.CSSProperties;
  enableStreaming?: boolean;
  quickPrompts?: QuickPrompt[];
  models?: ModelOption[];
  defaultModel?: string;
  onModelChange?: (model: string) => void;
}

// 默认模型列表
const defaultModels: ModelOption[] = [
  { label: 'DeepSeek V3', value: 'deepseek-ai/DeepSeek-V3', description: '最新版本' },
  { label: 'DeepSeek Chat', value: 'deepseek-ai/DeepSeek-Chat', description: '对话优化' },
  { label: 'Qwen 2.5', value: 'Qwen/Qwen2.5-72B-Instruct', description: '通义千问' },
];

// 默认快捷提问
const defaultQuickPrompts: QuickPrompt[] = [
  { 
    label: '推荐设计工具', 
    prompt: '请推荐一些好用的 UI 设计工具', 
    icon: <BulbOutlined />,
    description: '获取设计工具推荐',
  },
  { 
    label: '设计规范指南', 
    prompt: '如何制定一套完整的设计规范？', 
    icon: <EditOutlined />,
    description: '学习设计规范制定',
  },
  { 
    label: '提高工作效率', 
    prompt: '有哪些方法可以提高设计工作效率？', 
    icon: <CompassOutlined />,
    description: '提升工作效率技巧',
  },
];

export default function AIAssistant({
  title = 'AI 助手',
  placeholder = '输入您的问题...',
  systemContext,
  visible = true,
  onClose,
  floating = false,
  style,
  enableStreaming = true,
  quickPrompts = defaultQuickPrompts,
  models = defaultModels,
  defaultModel = 'deepseek-ai/DeepSeek-V3',
  onModelChange,
}: AIAssistantProps) {
  const [selectedModel, setSelectedModel] = useState(defaultModel);
  const containerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { token } = theme.useToken();
  
  const { 
    messages, 
    isStreaming, 
    sendMessage, 
    cancelStream,
    clearMessages 
  } = useStreamChat({
    systemContext,
    onError: (error) => {
      message.error(error.message || 'AI 服务暂时不可用');
    },
  });

  // 平滑滚动到底部
  const scrollToBottom = useCallback((smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: smooth ? 'smooth' : 'auto',
        block: 'end',
      });
    }
  }, []);

  // 消息更新时滚动到底部
  useEffect(() => {
    scrollToBottom(true);
  }, [messages, scrollToBottom]);

  // 处理发送消息
  const handleSend = async (value: string) => {
    if (!value.trim() || isStreaming) return;
    await sendMessage(value);
  };

  // 处理快捷提问点击
  const handlePromptClick: GetProp<PromptsProps, 'onItemClick'> = (info) => {
    if (isStreaming) return;
    const prompt = quickPrompts.find(p => p.label === info.data.label);
    if (prompt) {
      sendMessage(prompt.prompt);
    }
  };

  // 处理模型切换
  const handleModelChange = (value: string) => {
    setSelectedModel(value);
    onModelChange?.(value);
  };

  // 复制消息内容
  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    message.success('已复制到剪贴板');
  };

  // 重新生成
  const handleRegenerate = (msgKey: string) => {
    // 找到对应的用户消息并重新发送
    const msgIndex = messages.findIndex(m => m.key === msgKey);
    if (msgIndex > 0) {
      const userMsg = messages[msgIndex - 1];
      if (userMsg.role === 'user') {
        sendMessage(userMsg.content);
      }
    }
  };

  if (!visible) return null;

  const containerStyle: React.CSSProperties = floating
    ? {
        position: 'fixed',
        bottom: 24,
        right: 24,
        width: 440,
        height: 640,
        zIndex: 1000,
        boxShadow: token.boxShadowSecondary,
        borderRadius: token.borderRadiusLG,
        background: token.colorBgContainer,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        ...style,
      }
    : {
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: token.colorBgContainer,
        borderRadius: token.borderRadiusLG,
        border: `1px solid ${token.colorBorderSecondary}`,
        overflow: 'hidden',
        ...style,
      };

  // 消息操作按钮 - Actions
  const renderActions = (msg: Message): BubbleProps['footer'] => {
    if (msg.role === 'user' || msg.status === 'streaming' || msg.status === 'sending') {
      return null;
    }
    
    return (
      <Space size={4} style={{ marginTop: 8 }}>
        <Tooltip title="复制">
          <Button 
            type="text" 
            size="small" 
            icon={<CopyOutlined />}
            onClick={() => handleCopy(msg.content)}
            style={{ color: token.colorTextSecondary }}
          />
        </Tooltip>
        <Tooltip title="有帮助">
          <Button 
            type="text" 
            size="small" 
            icon={<LikeOutlined />}
            style={{ color: token.colorTextSecondary }}
          />
        </Tooltip>
        <Tooltip title="没帮助">
          <Button 
            type="text" 
            size="small" 
            icon={<DislikeOutlined />}
            style={{ color: token.colorTextSecondary }}
          />
        </Tooltip>
        <Tooltip title="重新生成">
          <Button 
            type="text" 
            size="small" 
            icon={<ReloadOutlined />}
            onClick={() => handleRegenerate(msg.key)}
            style={{ color: token.colorTextSecondary }}
          />
        </Tooltip>
      </Space>
    );
  };

  // 转换消息为 Bubble.List 格式
  const bubbleItems = messages.map((msg: Message) => ({
    key: msg.key,
    role: msg.role,
    placement: msg.role === 'user' ? 'end' as const : 'start' as const,
    loading: msg.status === 'sending' || (msg.status === 'streaming' && !msg.content),
    typing: msg.status === 'streaming' && !!msg.content ? true : undefined,
    avatar: msg.role === 'user' ? (
      <Avatar 
        size={32} 
        icon={<UserOutlined />} 
        style={{ background: token.colorPrimary }}
      />
    ) : (
      <Avatar 
        size={32} 
        icon={<RobotOutlined />} 
        style={{ background: token.colorSuccess }}
      />
    ),
    content: msg.role === 'user' ? msg.content : (
      <XMarkdown>{msg.content || ''}</XMarkdown>
    ),
    footer: renderActions(msg),
    styles: {
      content: msg.role === 'user' ? {
        background: token.colorPrimary,
        color: '#fff',
        borderRadius: `${token.borderRadiusLG}px ${token.borderRadiusLG}px 4px ${token.borderRadiusLG}px`,
      } : {
        background: token.colorBgContainer,
        color: token.colorText,
        borderRadius: `${token.borderRadiusLG}px ${token.borderRadiusLG}px ${token.borderRadiusLG}px 4px`,
        border: `1px solid ${token.colorBorderSecondary}`,
      },
    },
  }));

  // Prompts 组件的数据格式
  const promptItems: GetProp<PromptsProps, 'items'> = quickPrompts.map((item, index) => ({
    key: String(index),
    label: item.label,
    description: item.description,
    icon: item.icon,
  }));

  return (
    <div style={containerStyle} className="ai-assistant-container">
      {/* 头部 */}
      <div style={{ 
        padding: '12px 16px', 
        borderBottom: `1px solid ${token.colorBorderSecondary}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: token.colorBgContainer,
        flexShrink: 0,
      }}>
        <Space>
          <Avatar 
            size={28} 
            icon={<RobotOutlined />} 
            style={{ background: token.colorPrimary }}
          />
          <span style={{ fontWeight: 600, color: token.colorText }}>{title}</span>
        </Space>
        <Space size={8}>
          {/* 模型选择下拉框 */}
          <Select
            value={selectedModel}
            onChange={handleModelChange}
            size="small"
            style={{ width: 140 }}
            suffixIcon={<DownOutlined style={{ fontSize: 10 }} />}
            options={models.map(m => ({
              label: m.label,
              value: m.value,
            }))}
          />
          {messages.length > 0 && (
            <Tooltip title="清空对话">
              <Button 
                type="text" 
                size="small"
                icon={<DeleteOutlined />}
                onClick={clearMessages}
                style={{ color: token.colorTextSecondary }}
              />
            </Tooltip>
          )}
          {onClose && (
            <Button 
              type="text" 
              icon={<CloseOutlined />} 
              onClick={onClose} 
              size="small"
              style={{ color: token.colorTextSecondary }}
            />
          )}
        </Space>
      </div>

      {/* 消息列表区域 */}
      <div 
        ref={containerRef}
        style={{ 
          flex: 1, 
          overflow: 'auto', 
          padding: 16,
          background: token.colorBgLayout,
          scrollBehavior: 'smooth',
        }}
      >
        {messages.length === 0 ? (
          /* 欢迎界面 */
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            padding: '24px 0',
          }}>
            <Welcome
              icon={
                <Avatar 
                  size={64} 
                  icon={<RobotOutlined style={{ fontSize: 32 }} />} 
                  style={{ background: token.colorPrimary }}
                />
              }
              title="你好！我是 AI 助手"
              description="可以帮你解答设计问题、推荐工具、生成内容等"
              style={{ marginBottom: 24 }}
            />
            
            {/* 快捷提问 */}
            <div style={{ width: '100%' }}>
              <div style={{ 
                fontSize: 13, 
                color: token.colorTextSecondary, 
                marginBottom: 12,
                paddingLeft: 4,
              }}>
                试试这些问题
              </div>
              <Prompts
                items={promptItems}
                onItemClick={handlePromptClick}
                vertical
                styles={{
                  item: {
                    background: token.colorBgContainer,
                    borderRadius: token.borderRadius,
                    border: `1px solid ${token.colorBorderSecondary}`,
                    padding: '12px 16px',
                  },
                }}
              />
            </div>
          </div>
        ) : (
          /* 消息列表 */
          <>
            <Bubble.List
              items={bubbleItems}
            />
            <div ref={messagesEndRef} style={{ height: 1 }} />
          </>
        )}
      </div>

      {/* 输入区域 */}
      <div style={{ 
        padding: 16, 
        borderTop: `1px solid ${token.colorBorderSecondary}`,
        background: token.colorBgContainer,
        flexShrink: 0,
      }}>
        {isStreaming ? (
          <Button 
            type="primary" 
            danger
            icon={<StopOutlined />}
            onClick={cancelStream}
            block
          >
            停止生成
          </Button>
        ) : (
          <Sender
            onSubmit={handleSend}
            placeholder={placeholder}
            loading={isStreaming}
            submitType="enter"
          />
        )}
        <div style={{ 
          marginTop: 8, 
          fontSize: 12, 
          color: token.colorTextQuaternary,
          textAlign: 'center',
        }}>
          {enableStreaming && (
            <span style={{ 
              background: token.colorSuccessBg,
              color: token.colorSuccess,
              padding: '2px 8px',
              borderRadius: token.borderRadiusSM,
              marginRight: 8,
              fontSize: 11,
            }}>
              流式输出
            </span>
          )}
          Enter 发送 · Shift + Enter 换行
        </div>
      </div>

      {/* 样式 */}
      <style>{`
        .ai-assistant-container ::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .ai-assistant-container ::-webkit-scrollbar-track {
          background: transparent;
        }
        .ai-assistant-container ::-webkit-scrollbar-thumb {
          background: ${token.colorBorderSecondary};
          border-radius: 3px;
        }
        .ai-assistant-container ::-webkit-scrollbar-thumb:hover {
          background: ${token.colorBorder};
        }
        
        .ai-assistant-container .ant-prompts-item {
          transition: all 0.2s ease;
        }
        .ai-assistant-container .ant-prompts-item:hover {
          border-color: ${token.colorPrimary} !important;
          transform: translateX(4px);
        }
        
        .ai-assistant-container .ant-bubble-list {
          gap: 16px;
        }
        
        /* Markdown 样式 */
        .ai-assistant-container .ant-bubble-content pre {
          background: ${token.colorFillTertiary};
          padding: 12px;
          border-radius: ${token.borderRadius}px;
          overflow-x: auto;
          margin: 8px 0;
        }
        .ai-assistant-container .ant-bubble-content code {
          background: ${token.colorFillSecondary};
          padding: 2px 6px;
          border-radius: ${token.borderRadiusSM}px;
          font-size: 13px;
        }
        .ai-assistant-container .ant-bubble-content pre code {
          background: transparent;
          padding: 0;
        }
        .ai-assistant-container .ant-bubble-content ul,
        .ai-assistant-container .ant-bubble-content ol {
          margin: 8px 0;
          padding-left: 20px;
        }
        .ai-assistant-container .ant-bubble-content li {
          margin: 4px 0;
        }
        .ai-assistant-container .ant-bubble-content h1,
        .ai-assistant-container .ant-bubble-content h2,
        .ai-assistant-container .ant-bubble-content h3 {
          margin: 12px 0 8px;
          font-weight: 600;
        }
        .ai-assistant-container .ant-bubble-content blockquote {
          border-left: 3px solid ${token.colorBorder};
          margin: 8px 0;
          padding-left: 12px;
          color: ${token.colorTextSecondary};
        }
        .ai-assistant-container .ant-bubble-content table {
          border-collapse: collapse;
          margin: 8px 0;
          width: 100%;
        }
        .ai-assistant-container .ant-bubble-content th,
        .ai-assistant-container .ant-bubble-content td {
          border: 1px solid ${token.colorBorderSecondary};
          padding: 8px;
          text-align: left;
        }
        .ai-assistant-container .ant-bubble-content th {
          background: ${token.colorFillTertiary};
        }
        .ai-assistant-container .ant-bubble-content a {
          color: ${token.colorPrimary};
        }
      `}</style>
    </div>
  );
}
