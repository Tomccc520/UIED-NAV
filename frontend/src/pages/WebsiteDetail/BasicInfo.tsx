/**
 * @file pages/WebsiteDetail/BasicInfo.tsx
 * @description 网站基础信息展示组件
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

import React, { useState } from 'react';
import { getFullImageUrl, processContentImageUrls } from '../../utils/urlUtils';

/**
 * 获取默认图标
 */
const getDefaultIcon = (): string => {
  return '/logo.svg';
};

/**
 * 处理图标加载错误
 */
const handleIconError = (e: React.SyntheticEvent<HTMLImageElement>) => {
  const target = e.currentTarget;
  // 防止无限循环
  if (!target.dataset.fallbackApplied) {
    target.dataset.fallbackApplied = 'true';
    target.src = getDefaultIcon();
  }
};

/**
 * 网站基础信息类型
 */
interface Website {
  id: string;
  name: string;
  description: string;
  url: string;
  iconUrl?: string;
  category: {
    id: string;
    name: string;
    parent?: {
      id: string;
      name: string;
    };
  };
  tags: string[];
  createdAt: string;
  updatedAt: string;
  // 详情页内容字段
  detailContent?: string;
  screenshots?: string | string[];
  visitBtnText?: string;
}

// 详情页全局配置类型
interface DetailPageConfig {
  copyrightEnabled?: boolean;
  copyrightText?: string;
  copyrightLink?: string;
  disclaimerEnabled?: boolean;
  disclaimerText?: string;
  footerTipEnabled?: boolean;
  footerTipText?: string;
  shareEnabled?: boolean;
  shareText?: string;
  reportEnabled?: boolean;
  reportText?: string;
  reportEmail?: string;
}

interface BasicInfoProps {
  website: Website;
  detailPageConfig?: DetailPageConfig;
}

/**
 * 网站基础信息组件
 * 显示网站的标题、描述、图标、分类、标签、截图、详情内容等
 */
const BasicInfo: React.FC<BasicInfoProps> = ({ website, detailPageConfig }) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // 解析截图列表（处理 JSON 字符串或数组）
  const screenshots: string[] = (() => {
    if (!website.screenshots) return [];
    if (Array.isArray(website.screenshots)) return website.screenshots;
    if (typeof website.screenshots === 'string') {
      try {
        const parsed = JSON.parse(website.screenshots);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  })();

  /**
   * 格式化日期
   */
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  /**
   * 处理访问网站
   */
  const handleVisit = () => {
    window.open(website.url, '_blank', 'noopener,noreferrer');
  };

  /**
   * 打开图片灯箱
   */
  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  /**
   * 简单的 Markdown 渲染（支持基础语法）
   * 同时修复 HTML 中的图片 URL
   */
  const renderMarkdown = (content: string): string => {
    if (!content) return '';
    
    // 使用统一的工具函数处理图片路径
    let processed = processContentImageUrls(content);
    
    return processed
      // 标题
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      // 粗体和斜体
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      // 列表
      .replace(/^- (.*$)/gim, '<li>$1</li>')
      // 链接
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
      // 换行
      .replace(/\n/g, '<br />');
  };

  return (
    <div className="website-basic-info">
      {/* 网站头部 */}
      <div className="website-header">
        {/* 网站图标 */}
        <div className="website-icon">
          <img
            src={getFullImageUrl(website.iconUrl || '') || getDefaultIcon()}
            alt={`${website.name} 图标`}
            onError={handleIconError}
          />
        </div>

        {/* 网站标题和分类 */}
        <div className="website-title-section">
          <h1 className="website-title">{website.name}</h1>
          
          {/* 分类标签 */}
          <div className="website-categories">
            {website.category.parent && (
              <>
                <span className="category-tag parent-category">
                  {website.category.parent.name}
                </span>
                <span className="category-separator">/</span>
              </>
            )}
            <span className="category-tag">
              {website.category.name}
            </span>
          </div>
        </div>

        {/* 访问按钮 */}
        <button onClick={handleVisit} className="btn-visit">
          {website.visitBtnText || '访问网站'} →
        </button>
      </div>

      {/* 网站描述 */}
      <div className="website-description">
        <p>{website.description}</p>
      </div>

      {/* 产品截图 */}
      {screenshots.length > 0 && (
        <div className="website-screenshots">
          <h3 className="section-title">产品截图</h3>
          <div className="screenshots-grid">
            {screenshots.map((url, index) => (
              <div 
                key={index} 
                className="screenshot-item"
                onClick={() => openLightbox(index)}
              >
                <img
                  src={getFullImageUrl(url)}
                  alt={`${website.name} 截图 ${index + 1}`}
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 详情内容 */}
      {website.detailContent && (
        <div className="website-detail-content">
          <h3 className="section-title">详细介绍</h3>
          <div 
            className="detail-content-body"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(website.detailContent) }}
          />
        </div>
      )}

      {/* 网站标签 */}
      {website.tags && website.tags.length > 0 && (
        <div className="website-tags">
          <span className="tags-label">标签：</span>
          <div className="tags-list">
            {website.tags.map((tag, index) => (
              <span key={index} className="tag">
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 网站元信息 */}
      <div className="website-meta">
        <div className="meta-item">
          <span className="meta-label">收录时间：</span>
          <span className="meta-value">{formatDate(website.createdAt)}</span>
        </div>
        
        {website.updatedAt !== website.createdAt && (
          <div className="meta-item">
            <span className="meta-label">更新时间：</span>
            <span className="meta-value">{formatDate(website.updatedAt)}</span>
          </div>
        )}
      </div>

      {/* 图片灯箱 */}
      {lightboxOpen && screenshots.length > 0 && (
        <div className="lightbox-overlay" onClick={() => setLightboxOpen(false)}>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button className="lightbox-close" onClick={() => setLightboxOpen(false)}>×</button>
            <img src={getFullImageUrl(screenshots[lightboxIndex])} alt={`截图 ${lightboxIndex + 1}`} />
            {screenshots.length > 1 && (
              <div className="lightbox-nav">
                <button 
                  className="lightbox-prev"
                  onClick={() => setLightboxIndex((lightboxIndex - 1 + screenshots.length) % screenshots.length)}
                >
                  ‹
                </button>
                <span className="lightbox-counter">{lightboxIndex + 1} / {screenshots.length}</span>
                <button 
                  className="lightbox-next"
                  onClick={() => setLightboxIndex((lightboxIndex + 1) % screenshots.length)}
                >
                  ›
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 版权信息和免责声明 */}
      {detailPageConfig && (detailPageConfig.disclaimerEnabled || detailPageConfig.copyrightEnabled || detailPageConfig.footerTipEnabled || detailPageConfig.reportEnabled) && (
        <div className="website-footer-info">
          {/* 免责声明 */}
          {detailPageConfig.disclaimerEnabled && detailPageConfig.disclaimerText && (
            <div className="disclaimer-section">
              <p className="disclaimer-text">{detailPageConfig.disclaimerText}</p>
            </div>
          )}

          {/* 版权信息 */}
          {detailPageConfig.copyrightEnabled && detailPageConfig.copyrightText && (
            <div className="copyright-section">
              {detailPageConfig.copyrightLink ? (
                <a 
                  href={detailPageConfig.copyrightLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="copyright-link"
                >
                  {detailPageConfig.copyrightText}
                </a>
              ) : (
                <p className="copyright-text">{detailPageConfig.copyrightText}</p>
              )}
            </div>
          )}

          {/* 底部提示 */}
          {detailPageConfig.footerTipEnabled && detailPageConfig.footerTipText && (
            <div className="footer-tip-section">
              <p className="footer-tip-text">{detailPageConfig.footerTipText}</p>
            </div>
          )}

          {/* 举报按钮 */}
          {detailPageConfig.reportEnabled && (
            <div className="report-section">
              <a 
                href={detailPageConfig.reportEmail ? `mailto:${detailPageConfig.reportEmail}?subject=举报网站：${website.name}&body=网站URL：${website.url}` : '#'}
                className="btn-report"
              >
                {detailPageConfig.reportText || '举报问题'}
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BasicInfo;
