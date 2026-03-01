/**
 * @file Submit/index.tsx
 * @description 网站提交页面 - 用户提交网站到导航站
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { AxiosError } from 'axios';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { unwrapApiList, unwrapApiResponse } from '../../utils/apiResponse';
import { debugLog } from '../../utils/debugHelper';
import SEO from '../../components/SEO';
import './index.css';

const STORAGE_KEY = 'submit_form_draft';

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

interface DraftData extends SubmitFormData {
  iconUrl: string;
  savedAt: number;
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

// SVG 图标组件
const Icons = {
  Submit: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="12" y1="18" x2="12" y2="12" />
      <line x1="9" y1="15" x2="15" y2="15" />
    </svg>
  ),
  AI: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z" />
      <circle cx="7.5" cy="14.5" r="1.5" fill="currentColor" />
      <circle cx="16.5" cy="14.5" r="1.5" fill="currentColor" />
    </svg>
  ),
  Rocket: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
      <path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
      <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
    </svg>
  ),
  Success: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  Error: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  ),
  Globe: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  ),
  Info: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  ),
  ArrowLeft: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  ),
  Plus: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  Refresh: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
  ),
  X: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  Home: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  Search: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  ChevronDown: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  ),
  Check: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
};

// 可搜索的分类选择器组件
interface CategorySelectProps {
  categories: Category[];
  value: string;
  onChange: (value: string) => void;
}

const CategorySelect: React.FC<CategorySelectProps> = ({ categories, value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 构建分类树结构（只包含有子分类的父分类）
  const categoryTree = useMemo(() => {
    const parentCategories = categories.filter(c => !c.parentId);
    return parentCategories
      .map(parent => ({
        ...parent,
        children: categories.filter(c => c.parentId === parent.id)
      }))
      .filter(parent => parent.children.length > 0); // 只显示有子分类的父分类
  }, [categories]);

  // 过滤分类（只搜索子分类）
  const filteredTree = useMemo(() => {
    if (!searchTerm) return categoryTree;
    const term = searchTerm.toLowerCase();
    return categoryTree
      .map(parent => ({
        ...parent,
        children: parent.children.filter(child => 
          child.name.toLowerCase().includes(term)
        )
      }))
      .filter(parent => parent.children.length > 0);
  }, [categoryTree, searchTerm]);

  // 获取选中的分类名称（只会是子分类）
  const selectedCategory = useMemo(() => {
    const cat = categories.find(c => c.id === value);
    if (!cat || !cat.parentId) return null;
    const parent = categories.find(c => c.id === cat.parentId);
    return { name: cat.name, parentName: parent?.name };
  }, [categories, value]);

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 打开时聚焦搜索框
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const handleSelect = (categoryId: string) => {
    onChange(categoryId);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className="category-select" ref={containerRef}>
      <button
        type="button"
        className={`category-select-trigger ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        {selectedCategory ? (
          <span className="selected-value">
            <span className="parent-name">{selectedCategory.parentName} / </span>
            {selectedCategory.name}
          </span>
        ) : (
          <span className="placeholder">请选择分类</span>
        )}
        <Icons.ChevronDown />
      </button>

      {isOpen && (
        <div className="category-select-dropdown">
          <div className="category-search">
            <Icons.Search />
            <input
              ref={inputRef}
              type="text"
              placeholder="搜索分类..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
            {searchTerm && (
              <button 
                type="button" 
                className="clear-search"
                onClick={(e) => {
                  e.stopPropagation();
                  setSearchTerm('');
                  inputRef.current?.focus();
                }}
              >
                <Icons.X />
              </button>
            )}
          </div>
          
          <div className="category-list">
            {/* 不选择分类选项 */}
            <div
              className={`category-item clear-option ${!value ? 'selected' : ''}`}
              onClick={() => handleSelect('')}
            >
              <span className="category-name">不选择分类</span>
              {!value && <Icons.Check />}
            </div>

            {filteredTree.length === 0 ? (
              <div className="no-results">没有找到匹配的分类</div>
            ) : (
              filteredTree.map(parent => (
                <div key={parent.id} className="category-group">
                  {/* 父分类作为分组标题，不可点击 */}
                  <div className="category-group-header">
                    {parent.name}
                  </div>
                  {/* 子分类可选择 */}
                  {parent.children.map(child => (
                    <div
                      key={child.id}
                      className={`category-item ${value === child.id ? 'selected' : ''}`}
                      onClick={() => handleSelect(child.id)}
                    >
                      <span className="category-name">{child.name}</span>
                      {value === child.id && <Icons.Check />}
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const SubmitPage: React.FC = () => {
  const navigate = useNavigate();
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
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [urlCheckResult, setUrlCheckResult] = useState<{
    checking: boolean;
    exists: boolean;
    type?: 'website' | 'pending';
    message?: string;
    website?: { name: string; url: string };
  }>({ checking: false, exists: false });

  // 从 localStorage 加载草稿
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const draft: DraftData = JSON.parse(saved);
        // 检查草稿是否在7天内
        const sevenDays = 7 * 24 * 60 * 60 * 1000;
        if (Date.now() - draft.savedAt < sevenDays) {
          setFormData({
            name: draft.name || '',
            description: draft.description || '',
            url: draft.url || '',
            categoryId: draft.categoryId || '',
            tags: draft.tags || '',
            submitterName: draft.submitterName || '',
            submitterEmail: draft.submitterEmail || '',
          });
          setIconUrl(draft.iconUrl || '');
        } else {
          // 草稿过期，清除
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch (e) {
      debugLog.error('加载草稿失败:', e);
    }
    setDraftLoaded(true);
  }, []);

  // 保存草稿到 localStorage（防抖）
  const saveDraft = useCallback(() => {
    const draft: DraftData = {
      ...formData,
      iconUrl,
      savedAt: Date.now(),
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    } catch (e) {
      debugLog.error('保存草稿失败:', e);
    }
  }, [formData, iconUrl]);

  // 表单数据变化时保存草稿
  useEffect(() => {
    if (!draftLoaded) return;
    const timer = setTimeout(saveDraft, 500);
    return () => clearTimeout(timer);
  }, [formData, iconUrl, draftLoaded, saveDraft]);

  // 清除草稿
  const clearDraft = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      debugLog.error('清除草稿失败:', e);
    }
  };

  // 检查 URL 是否已存在（防抖）
  const checkUrlExists = useCallback(async (url: string) => {
    if (!url || !url.startsWith('http')) {
      setUrlCheckResult({ checking: false, exists: false });
      return;
    }
    
    setUrlCheckResult(prev => ({ ...prev, checking: true }));
    
    try {
      const res = await api.get('/submissions/check-url', { params: { url } });
      const data = unwrapApiResponse<{
        exists?: boolean;
        type?: 'website' | 'pending';
        message?: string;
        website?: { id?: string; name?: string; url?: string };
      }>(res.data, {});
      const normalizedWebsite = data.website
        ? {
            name: String(data.website.name || ''),
            url: String(data.website.url || ''),
          }
        : undefined;
      setUrlCheckResult({
        checking: false,
        exists: Boolean(data.exists),
        type: data.type,
        message: data.message,
        website: normalizedWebsite,
      });
    } catch (error) {
      debugLog.error('检查URL失败:', error);
      setUrlCheckResult({ checking: false, exists: false });
    }
  }, []);

  // URL 变化时检查是否存在
  useEffect(() => {
    if (!draftLoaded) return;
    const timer = setTimeout(() => {
      checkUrlExists(formData.url);
    }, 800);
    return () => clearTimeout(timer);
  }, [formData.url, draftLoaded, checkUrlExists]);

  useEffect(() => {
    fetchCategories();
  }, []);

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
    // URL 变化时重置检查结果
    if (name === 'url') {
      setUrlCheckResult({ checking: false, exists: false });
    }
  };

  const handleCategoryChange = (categoryId: string) => {
    setFormData(prev => ({ ...prev, categoryId }));
  };

  const handleFetchIcon = async () => {
    if (!formData.url) return;
    setFetchingIcon(true);
    try {
      const res = await api.get('/favicon-api/fetch', { params: { url: formData.url } });
      const data = unwrapApiResponse<IconFetchPayload>(res.data, {});
      setIconUrl(data.faviconUrl || '');
    } catch (error) {
      debugLog.error('获取图标失败:', error);
    } finally {
      setFetchingIcon(false);
    }
  };

  const handleAiGenerate = async () => {
    if (!formData.url) return;
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
      if (!iconUrl) {
        handleFetchIcon();
      }
    } catch (error: unknown) {
      debugLog.error('AI 生成失败:', error as AxiosError<{ error?: string }>);
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
      // 提交成功后清除草稿
      clearDraft();
      setSubmitResult({ success: true, message: '提交成功！我们会尽快审核您的网站。', id: data.id });
    } catch (error: unknown) {
      const axiosError = error as AxiosError<{ error?: string }>;
      setSubmitResult({ success: false, message: axiosError.response?.data?.error || '提交失败，请稍后重试' });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
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
    clearDraft();
  };

  return (
    <div className="submit-page">
      <SEO 
        title="提交网站 - UIED设计导航"
        description="向UIED设计导航提交优质设计工具和资源网站，分享给更多设计师。"
        keywords="提交网站,收录网站,设计工具,设计资源"
      />

      <div className="submit-container">
        {/* 页面标题 */}
        <div className="submit-header">
          <div className="header-icon">
            <Icons.Submit />
          </div>
          <h1>提交网站</h1>
          <p>分享优质的设计工具和资源，让更多设计师受益</p>
        </div>

        {submitResult ? (
          /* 提交结果 */
          <div className={`submit-result-card ${submitResult.success ? 'success' : 'error'}`}>
            <div className="result-icon">
              {submitResult.success ? <Icons.Success /> : <Icons.Error />}
            </div>
            <h2>{submitResult.success ? '提交成功' : '提交失败'}</h2>
            <p>{submitResult.message}</p>
            {submitResult.id && (
              <p className="result-id">提交编号: {submitResult.id}</p>
            )}
            <div className="result-actions">
              {submitResult.success ? (
                <>
                  <button className="btn-secondary" onClick={handleReset}>
                    <Icons.Plus />
                    <span>继续提交</span>
                  </button>
                  <button className="btn-primary" onClick={() => navigate('/')}>
                    <Icons.Home />
                    <span>返回首页</span>
                  </button>
                </>
              ) : (
                <button className="btn-primary" onClick={() => setSubmitResult(null)}>
                  <Icons.Refresh />
                  <span>重新填写</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          /* 提交表单 */
          <form className="submit-form" onSubmit={handleSubmit}>
            {/* 第一步：输入URL */}
            <div className="form-section">
              <div className="section-title">
                <span className="step-number">1</span>
                <h3>网站地址</h3>
              </div>
              <div className="form-group">
                <label htmlFor="url">网站URL <span className="required">*</span></label>
                <div className="input-with-button">
                  <input
                    type="url"
                    id="url"
                    name="url"
                    value={formData.url}
                    onChange={handleChange}
                    placeholder="https://example.com"
                    className={urlCheckResult.exists ? 'has-error' : ''}
                    required
                  />
                  <button 
                    type="button" 
                    className="btn-ai"
                    onClick={handleAiGenerate} 
                    disabled={generatingAi || !formData.url || urlCheckResult.exists}
                  >
                    {generatingAi ? (
                      <span className="loading-text">分析中</span>
                    ) : (
                      <>
                        <Icons.AI />
                        <span>AI智能填写</span>
                      </>
                    )}
                  </button>
                </div>
                {urlCheckResult.checking ? (
                  <p className="form-hint checking">
                    <span className="checking-dot"></span>
                    正在检查网址...
                  </p>
                ) : urlCheckResult.exists ? (
                  <div className="url-exists-warning">
                    <Icons.Info />
                    <span>
                      {urlCheckResult.message}
                      {urlCheckResult.website && (
                        <>：<strong>{urlCheckResult.website.name}</strong></>
                      )}
                    </span>
                  </div>
                ) : formData.url && formData.url.startsWith('http') ? (
                  <p className="form-hint success">
                    <Icons.Check />
                    该网址可以提交
                  </p>
                ) : (
                  <p className="form-hint">输入网站地址后，可使用AI智能填写网站信息</p>
                )}
              </div>
            </div>

            {/* 第二步：网站信息 */}
            <div className="form-section">
              <div className="section-title">
                <span className="step-number">2</span>
                <h3>网站信息</h3>
              </div>
              
              {/* 图标预览 */}
              <div className="form-group icon-group">
                <label>网站图标</label>
                <div className="icon-preview">
                  {iconUrl ? (
                    <img src={iconUrl} alt="网站图标" className="icon-img" />
                  ) : (
                    <div className="icon-placeholder">
                      <Icons.Globe />
                    </div>
                  )}
                  <div className="icon-actions">
                    <button 
                      type="button" 
                      className="btn-text"
                      onClick={handleFetchIcon} 
                      disabled={fetchingIcon || !formData.url}
                    >
                      <Icons.Refresh />
                      <span>{fetchingIcon ? '获取中...' : '获取图标'}</span>
                    </button>
                    {iconUrl && (
                      <button type="button" className="btn-text danger" onClick={() => setIconUrl('')}>
                        <Icons.X />
                        <span>清除</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="name">网站名称 <span className="required">*</span></label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="如：Dribbble"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>所属分类</label>
                  <CategorySelect
                    categories={categories}
                    value={formData.categoryId}
                    onChange={handleCategoryChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="description">网站描述</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="简要描述这个网站的功能和特点（50-200字为佳）"
                  rows={4}
                />
              </div>

              <div className="form-group">
                <label htmlFor="tags">标签</label>
                <input
                  type="text"
                  id="tags"
                  name="tags"
                  value={formData.tags}
                  onChange={handleChange}
                  placeholder="多个标签用逗号分隔，如：设计, 灵感, UI"
                />
                <p className="form-hint">添加标签有助于用户更快找到这个网站</p>
              </div>
            </div>

            {/* 第三步：提交者信息 */}
            <div className="form-section">
              <div className="section-title">
                <span className="step-number">3</span>
                <h3>您的信息（可选）</h3>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="submitterName">您的称呼</label>
                  <input
                    type="text"
                    id="submitterName"
                    name="submitterName"
                    value={formData.submitterName}
                    onChange={handleChange}
                    placeholder="可选"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="submitterEmail">您的邮箱</label>
                  <input
                    type="email"
                    id="submitterEmail"
                    name="submitterEmail"
                    value={formData.submitterEmail}
                    onChange={handleChange}
                    placeholder="可选，方便我们联系您"
                  />
                </div>
              </div>
            </div>

            {/* 提交按钮 */}
            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>
                <Icons.ArrowLeft />
                <span>取消</span>
              </button>
              <button type="submit" className="btn-primary" disabled={loading || urlCheckResult.exists}>
                {loading ? (
                  <span className="loading-text">提交中</span>
                ) : (
                  <>
                    <Icons.Rocket />
                    <span>提交网站</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* 提交须知 */}
        <div className="submit-tips">
          <div className="tips-header">
            <Icons.Info />
            <h4>提交须知</h4>
          </div>
          <ul>
            <li>请确保提交的网站内容合法、健康</li>
            <li>网站应与设计、开发、创意相关</li>
            <li>我们会在1-3个工作日内完成审核</li>
            <li>审核通过后，网站将展示在相应分类中</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SubmitPage;
