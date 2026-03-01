/**
 * @file AIAssistant/index.tsx
 * @description AI 助手组件 - 前端浮动对话框
 */

import React, { useState, useRef, useEffect } from 'react';
import { AxiosError } from 'axios';
import api from '../../services/api';
import { unwrapApiResponse } from '../../utils/apiResponse';
import './index.css';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AIAssistantProps {
  visible?: boolean;
  onClose?: () => void;
  placeholder?: string;
}

const AIAssistant: React.FC<AIAssistantProps> = ({
  visible = true,
  onClose,
  placeholder = '输入您的问题...',
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 发送消息
  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const context = messages.map(m => ({
        role: m.role,
        content: m.content,
      }));

      const res = await api.post('/ai-config/chat', {
        message: userMessage,
        context,
      });
      const data = unwrapApiResponse<{ reply?: string }>(res.data, {});
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply || '未获取到回复内容' }]);
    } catch (error: unknown) {
      console.error('AI 对话失败:', error);
      const axiosError = error as AxiosError<{ error?: string }>;
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: axiosError.response?.data?.error || '抱歉，AI 服务暂时不可用，请稍后再试。' 
      }]);
    } finally {
      setLoading(false);
    }
  };

  // 处理回车发送
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!visible) return null;

  return (
    <div className="ai-assistant-container">
      {/* 头部 */}
      <div className="ai-assistant-header">
        <div className="ai-assistant-title">
          <svg className="ai-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M10,21.236,6.755,14.745.264,11.5,6.755,8.255,10,1.764l3.245,6.491L19.736,11.5l-6.491,3.245ZM18,21l1.5,3L21,21l3-1.5L21,18l-1.5-3L18,18l-3,1.5ZM19.333,4.667,20.5,7l1.167-2.333L24,3.5,21.667,2.333,20.5,0,19.333,2.333,17,3.5Z"/>
          </svg>
          <span>AI 助手</span>
        </div>
        {onClose && (
          <button className="ai-assistant-close" onClick={onClose}>
            ×
          </button>
        )}
      </div>

      {/* 消息列表 */}
      <div className="ai-assistant-messages">
        {messages.length === 0 ? (
          <div className="ai-assistant-empty">
            <svg className="ai-icon-large" viewBox="0 0 24 24" fill="currentColor">
              <path d="M10,21.236,6.755,14.745.264,11.5,6.755,8.255,10,1.764l3.245,6.491L19.736,11.5l-6.491,3.245ZM18,21l1.5,3L21,21l3-1.5L21,18l-1.5-3L18,18l-3,1.5ZM19.333,4.667,20.5,7l1.167-2.333L24,3.5,21.667,2.333,20.5,0,19.333,2.333,17,3.5Z"/>
            </svg>
            <p>你好！我是 AI 助手</p>
            <p className="ai-assistant-hint">可以帮你解答设计相关问题、推荐工具等</p>
          </div>
        ) : (
          messages.map((msg, index) => (
            <div 
              key={index} 
              className={`ai-message ${msg.role === 'user' ? 'user' : 'assistant'}`}
            >
              <div className="ai-message-content">
                {msg.content}
              </div>
            </div>
          ))
        )}
        {loading && (
          <div className="ai-message assistant">
            <div className="ai-message-content loading">
              <span className="dot"></span>
              <span className="dot"></span>
              <span className="dot"></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 输入区域 */}
      <div className="ai-assistant-input">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          disabled={loading}
        />
        <button 
          onClick={handleSend}
          disabled={!input.trim() || loading}
          className="ai-send-btn"
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default AIAssistant;
