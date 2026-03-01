/**
 * @file WebsiteSubmit/index.tsx
 * @description 网站提交组件 - 用户提交网站到导航站
 */

import React, { useState, useEffect } from 'react';
import { AxiosError } from 'axios';
import api from '../../services/api';
import { unwrapApiList, unwrapApiResponse } from '../../utils/apiResponse';
import { debugLog } from '../../utils/debugHelper';
import './index.css';

interface Category {
  id: string;
  name: string;
  slug: string;
  parentId?: string;
}

interface SubmitFormData {
  name: string;
  description: string;
  url: string;
  categoryId: string;
  tags: string;
  submitterName: string;
  submitterEmail: string;
}

interface WebsiteSubmitProps {
  isOpen: boolean;
  onClose: () => void;
}

interface IconFetchPayload {
  faviconUrl?: string;
}

interface AiGeneratePayload {
  name?: string;
  description?: string;
  tags?: string;
}

interface SubmissionPayload {
  id?: string;
}

const WebsiteSubmit: React.FC<WebsiteSubmitProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState<SubmitFormData>({
    name: '',
    description: '',
    url: '',
    categoryId: '',
    tags: '',
    submitterName: '',
    submitterEmail: '',
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingIcon, setFetchingIcon] = useState(false);
  const [generatingAi, setGeneratingAi] = useState(false);
  const [iconUrl, setIconUrl] = useState<string>('');
  const [submitResult, setSubmitResult] = useState<{ success: boolean; message: string; id?: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
      setFormData({
        name: '',
        description: '',
        url: '',
        categoryId: '',
        tags: '',
        submitterName: '',
        submitterEmail: '',
      });
      setIconUrl('');
      setSubmitResult(null);
    }
  }, [isOpen]);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories?flat=true');
      setCategories(unwrapApiList<Category>(res.data));
    } catch (error) {
      debugLog.error('获取分类失败:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFetchIcon = async () => {
    if (!formData.url) {
      alert('请先输入网站URL');
      return;
    }
    setFetchingIcon(true);
    try {
      const res = await api.get('/favicon-api/fetch', { params: { url: formData.url } });
      const data = unwrapApiResponse<IconFetchPayload>(res.data, {});
      setIconUrl(data.faviconUrl || '');
    } catch (error) {
      debugLog.error('获取图标失败:', error);
      alert('获取图标失败');
    } finally {
      setFetchingIcon(false);
    }
  };

  // AI 一键生成网站信息
  const handleAiGenerate = async () => {
    if (!formData.url) {
      alert('请先输入网站URL');
      return;
    }
    setGeneratingAi(true);
    try {
      const res = await api.post('/ai-config/generate-website-info', { url: formData.url });
      const data = unwrapApiResponse<AiGeneratePayload>(res.data, {});
      const { name, description, tags } = data;
      setFormData(prev => ({
        ...prev,
        name: name || prev.name,
        description: description || prev.description,
        tags: tags || prev.tags,
      }));
      // 同时获取图标
      if (!iconUrl) {
        handleFetchIcon();
      }
    } catch (error: unknown) {
      const axiosError = error as AxiosError<{ error?: string }>;
      debugLog.error('AI 生成失败:', error);
      alert(axiosError.response?.data?.error || 'AI 生成失败，请手动填写');
    } finally {
      setGeneratingAi(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.url) {
      setSubmitResult({ success: false, message: '请填写网站名称和URL' });
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/submissions', {
        ...formData,
        iconUrl: iconUrl || undefined,
      });
      const data = unwrapApiResponse<SubmissionPayload>(res.data, {});
      setSubmitResult({ success: true, message: '提交成功！我们会尽快审核您的网站。', id: data.id });
    } catch (error: unknown) {
      const axiosError = error as AxiosError<{ error?: string }>;
      setSubmitResult({ success: false, message: axiosError.response?.data?.error || '提交失败，请稍后重试' });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSubmitResult(null);
    onClose();
  };

  if (!isOpen) return null;

  // 构建分类选项
  const buildCategoryOptions = () => {
    const parentCategories = categories.filter(c => !c.parentId);
    const options: React.ReactNode[] = [];
    
    parentCategories.forEach(parent => {
      options.push(
        <option key={parent.id} value={parent.id}>{parent.name}</option>
      );
      const children = categories.filter(c => c.parentId === parent.id);
      children.forEach(child => {
        options.push(
          <option key={child.id} value={child.id}>　└ {child.name}</option>
        );
      });
    });
    
    return options;
  };

  return (
    <div className="website-submit-overlay" onClick={handleClose}>
      <div className="website-submit-modal" onClick={e => e.stopPropagation()}>
        <div className="website-submit-header">
          <h2>📝 提交网站</h2>
          <button className="close-btn" onClick={handleClose}>×</button>
        </div>

        {submitResult ? (
          <div className={`submit-result ${submitResult.success ? 'success' : 'error'}`}>
            <div className="result-icon">{submitResult.success ? '✓' : '✕'}</div>
            <p className="result-message">{submitResult.message}</p>
            {submitResult.id && (
              <p className="result-id">提交ID: {submitResult.id}</p>
            )}
            <button className="result-btn" onClick={handleClose}>
              {submitResult.success ? '完成' : '关闭'}
            </button>
          </div>
        ) : (
          <form className="website-submit-form" onSubmit={handleSubmit}>
            {/* URL 输入和 AI 生成 */}
            <div className="form-group">
              <label>网站URL <span className="required">*</span></label>
              <div className="url-input-group">
                <input
                  type="url"
                  name="url"
                  value={formData.url}
                  onChange={handleChange}
                  placeholder="https://example.com"
                  required
                />
                <button 
                  type="button" 
                  className="ai-generate-btn" 
                  onClick={handleAiGenerate} 
                  disabled={generatingAi || !formData.url}
                  title="AI 一键填写网站信息"
                >
                  {generatingAi ? (
                    <span className="loading-spinner">⏳</span>
                  ) : (
                    <>🤖 AI填写</>
                  )}
                </button>
              </div>
              {generatingAi && (
                <p className="ai-loading-tip">AI 正在分析网站，请稍候...</p>
              )}
            </div>

            {/* 图标预览 */}
            <div className="form-group">
              <label>网站图标</label>
              <div className="icon-preview-row">
                {iconUrl ? (
                  <img src={iconUrl} alt="网站图标" className="icon-preview-img" />
                ) : (
                  <div className="icon-placeholder">🌐</div>
                )}
                <button 
                  type="button" 
                  className="fetch-icon-btn" 
                  onClick={handleFetchIcon} 
                  disabled={fetchingIcon || !formData.url}
                >
                  {fetchingIcon ? '获取中...' : '获取图标'}
                </button>
                {iconUrl && (
                  <button type="button" className="clear-icon-btn" onClick={() => setIconUrl('')}>
                    清除
                  </button>
                )}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>网站名称 <span className="required">*</span></label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="如：Dribbble"
                  required
                />
              </div>
              <div className="form-group">
                <label>网站分类</label>
                <select name="categoryId" value={formData.categoryId} onChange={handleChange}>
                  <option value="">请选择分类</option>
                  {buildCategoryOptions()}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>网站描述</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="简要描述这个网站的功能和特点"
                rows={3}
              />
            </div>

            <div className="form-group">
              <label>标签</label>
              <input
                type="text"
                name="tags"
                value={formData.tags}
                onChange={handleChange}
                placeholder="多个标签用逗号分隔，如：设计,灵感,UI"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>您的称呼</label>
                <input
                  type="text"
                  name="submitterName"
                  value={formData.submitterName}
                  onChange={handleChange}
                  placeholder="可选"
                />
              </div>
              <div className="form-group">
                <label>您的邮箱</label>
                <input
                  type="email"
                  name="submitterEmail"
                  value={formData.submitterEmail}
                  onChange={handleChange}
                  placeholder="用于接收审核结果通知"
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="button" className="cancel-btn" onClick={handleClose}>取消</button>
              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? '提交中...' : '🚀 提交网站'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default WebsiteSubmit;
