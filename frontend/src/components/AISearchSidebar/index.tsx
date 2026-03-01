/**
 * @file AISearchSidebar/index.tsx
 * @description AI 搜索侧边栏组件 - 简洁对话式搜索
 * @version 1.1.0
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import api from '../../services/api';
import { unwrapApiResponse } from '../../utils/apiResponse';
import './index.css';

// SVG 图标组件
const SearchIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/>
    <path d="m21 21-4.35-4.35"/>
  </svg>
);

const CloseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
  </svg>
);

const RobotIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="10" x="3" y="11" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" x2="8" y1="16" y2="16"/><line x1="16" x2="16" y1="16" y2="16"/>
  </svg>
);

const UserIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/>
  </svg>
);

const SparkleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
  </svg>
);

const ThinkingIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <path d="M12 16v-4"/>
    <path d="M12 8h.01"/>
  </svg>
);

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  websites?: SearchResult[];
  reasoning?: string; // AI 思考过程
}

interface SearchResult {
  id: string;
  name: string;
  description: string;
  url: string;
  iconUrl?: string;
}

interface AiSearchApiResult {
  id?: string | number;
  name?: string;
  description?: string;
  url?: string;
  iconUrl?: string;
}

interface AISearchSidebarProps {
  visible: boolean;
  onClose: () => void;
  onWebsiteClick?: (website: SearchResult) => void;
}

const AISearchSidebar: React.FC<AISearchSidebarProps> = ({ visible, onClose, onWebsiteClick }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [expandedReasoning, setExpandedReasoning] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 切换思考过程展开/收起
  const toggleReasoning = useCallback((messageId: string) => {
    setExpandedReasoning(prev => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
      } else {
        newSet.add(messageId);
      }
      return newSet;
    });
  }, []);

  // 滚动到底部
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // 聚焦输入框
  useEffect(() => {
    if (visible) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [visible]);

  // 发送消息并获取AI响应
  const handleSend = useCallback(async (content?: string) => {
    const query = content || inputValue;
    if (!query.trim() || loading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      content: query.trim(),
      role: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setLoading(true);

    try {
      const response = await api.post('/ai-search', {
        query: query.trim(),
        limit: 10,
      });
      const payload = unwrapApiResponse<{
        results?: AiSearchApiResult[];
        mode?: 'ai' | 'keyword';
        reason?: string;
        reasoning?: string;
      }>(response.data, {});
      const results = (payload.results || []) as AiSearchApiResult[];
      const mode = payload.mode || 'keyword';
      const reason = payload.reason || '';
      const reasoning = payload.reasoning || ''; // AI 思考过程

      let aiContent = '';
      if (results.length > 0) {
        aiContent = mode === 'ai' 
          ? `AI 智能推荐找到 ${results.length} 个相关资源${reason ? `\n${reason}` : ''}`
          : `关键词匹配找到 ${results.length} 个相关资源`;
      } else {
        aiContent = '抱歉，没有找到相关资源。试试其他关键词？';
      }

      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        content: aiContent,
        role: 'assistant',
        timestamp: new Date(),
        reasoning: reasoning, // 保存思考过程
        websites: results.map((item, index) => ({
          id: String(item.id ?? `result-${index}`),
          name: item.name || '未命名资源',
          description: item.description || '',
          url: item.url || '#',
          iconUrl: item.iconUrl,
        })),
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('AI搜索失败:', error);
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        content: 'AI 搜索暂时不可用，请稍后重试',
        role: 'assistant',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  }, [inputValue, loading]);

  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // 渲染网站卡片
  const renderWebsiteCard = (website: SearchResult) => (
    <div
      key={website.id}
      className="ai-sidebar-website-card"
      onClick={() => onWebsiteClick?.(website)}
    >
      <div className="ai-sidebar-website-icon">
        {website.iconUrl ? (
          <img 
            src={website.iconUrl} 
            alt={website.name} 
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const fallback = target.nextElementSibling as HTMLElement;
              if (fallback) fallback.style.display = 'flex';
            }} 
          />
        ) : null}
        <span className="icon-fallback" style={{ display: website.iconUrl ? 'none' : 'flex' }}>
          {website.name.charAt(0).toUpperCase()}
        </span>
      </div>
      <div className="ai-sidebar-website-info">
        <div className="ai-sidebar-website-name">{website.name}</div>
        <div className="ai-sidebar-website-desc">{website.description}</div>
      </div>
    </div>
  );

  if (!visible) return null;

  return (
    <div className="ai-search-sidebar">
      {/* 头部 */}
      <div className="ai-sidebar-header">
        <div className="ai-sidebar-title">
          <SparkleIcon />
          <span>AI 智能搜索</span>
        </div>
        <button className="ai-sidebar-close" onClick={onClose} aria-label="关闭">
          <CloseIcon />
        </button>
      </div>

      {/* 消息列表 */}
      <div className="ai-sidebar-messages">
        {messages.length === 0 ? (
          <div className="ai-sidebar-empty">
            <div className="ai-sidebar-empty-icon">
              <SearchIcon />
            </div>
            <p>输入关键词，AI 帮你找资源</p>
            <div className="ai-sidebar-suggestions">
              {['AI绘画工具', 'UI设计资源', '免费图标库'].map(tag => (
                <button key={tag} onClick={() => handleSend(tag)}>{tag}</button>
              ))}
            </div>
          </div>
        ) : (
          messages.map(message => (
            <div key={message.id} className={`ai-sidebar-bubble ${message.role}`}>
              <div className="ai-sidebar-avatar">
                {message.role === 'user' ? <UserIcon /> : <RobotIcon />}
              </div>
              <div className="ai-sidebar-bubble-content">
                {/* AI 思考过程 */}
                {message.role === 'assistant' && message.reasoning && (
                  <div className="ai-sidebar-reasoning">
                    <button 
                      className="ai-sidebar-reasoning-toggle"
                      onClick={() => toggleReasoning(message.id)}
                    >
                      <ThinkingIcon />
                      <span>思考过程</span>
                      <span className={`toggle-arrow ${expandedReasoning.has(message.id) ? 'expanded' : ''}`}>▼</span>
                    </button>
                    {expandedReasoning.has(message.id) && (
                      <div className="ai-sidebar-reasoning-content">
                        {message.reasoning}
                      </div>
                    )}
                  </div>
                )}
                <div className="ai-sidebar-message-text">{message.content}</div>
                {message.websites && message.websites.length > 0 && (
                  <div className="ai-sidebar-websites">
                    {message.websites.map(renderWebsiteCard)}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        {loading && (
          <div className="ai-sidebar-bubble assistant">
            <div className="ai-sidebar-avatar">
              <RobotIcon />
            </div>
            <div className="ai-sidebar-bubble-content">
              <div className="ai-sidebar-loading">
                <span></span><span></span><span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 输入框 */}
      <div className="ai-sidebar-input">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="描述你想找的资源..."
          disabled={loading}
        />
        <button 
          className="ai-sidebar-send"
          onClick={() => handleSend()}
          disabled={loading || !inputValue.trim()}
          aria-label="搜索"
        >
          <SearchIcon />
        </button>
      </div>
    </div>
  );
};

export default AISearchSidebar;
