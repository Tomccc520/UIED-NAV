/**
 * @file pages/Articles/ArticleCard.tsx
 * @description 文章卡片组件 - 2026 设计改版
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { ArticleListItem } from '../../types/article';
import './ArticleCard.css';

interface ArticleCardProps {
  article: ArticleListItem;
}

const formatDate = (dateValue: string | number | null): string => {
  if (!dateValue) return '';
  const date = typeof dateValue === 'number' ? new Date(dateValue) : new Date(dateValue);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const ArticleCard: React.FC<ArticleCardProps> = ({ article }) => {
  return (
    <Link to={`/article/${article.slug}`} className="article-card">
      <div className="card-cover-wrapper">
        {article.coverImage ? (
          <img 
            src={article.coverImage} 
            alt={article.title}
            className="card-cover-img"
            loading="lazy"
          />
        ) : (
          <div className="card-cover-placeholder">
            <span>{article.title.charAt(0)}</span>
          </div>
        )}
        <span className="card-category-badge">{article.category}</span>
        
        {/* 悬停遮罩 */}
        <div className="card-hover-overlay">
          <span>阅读全文</span>
        </div>
      </div>

      <div className="card-content">
        <div className="card-meta-top">
          <span className="card-date">{formatDate(article.publishedAt)}</span>
          {article.tags && article.tags.length > 0 && (
            <span className="card-main-tag">#{article.tags[0].name}</span>
          )}
        </div>

        <h3 className="card-title" title={article.title}>
          {article.title}
        </h3>
        
        <p className="card-excerpt">
          {article.excerpt || '暂无摘要'}
        </p>

        <div className="card-footer">
          <div className="card-author">
            <div className="author-avatar-mini">
              {article.author.charAt(0).toUpperCase()}
            </div>
            <span className="author-name">{article.author}</span>
          </div>
          
          <div className="card-stats">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            <span>{article.viewCount}</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ArticleCard;
