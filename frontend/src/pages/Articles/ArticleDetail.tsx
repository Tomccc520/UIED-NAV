/**
 * @file pages/Articles/ArticleDetail.tsx
 * @description 文章详情页组件 - 沉浸式阅读设计
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 */

import React, { useEffect, useState } from 'react';
import { AxiosError } from 'axios';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getArticleDetail, recordArticleView } from '../../services/articleService';
import { ArticleDetail as ArticleDetailType } from '../../types/article';
import SEO from '../../components/SEO';
import { useLicense, FEATURES } from '../../hooks/useLicense';
import { usePublicSettings } from '../../hooks/usePublicSettings';
import ArticleComments from './ArticleComments';
import './ArticleDetail.css';

const formatDate = (value: string | number | null): string => {
  if (!value) return '';
  const date = typeof value === 'number' ? new Date(value) : new Date(value);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

/**
 * 规范化文章详情宽度模式，兼容后台配置异常值
 */
const normalizeArticleDetailLayoutWidthMode = (mode: unknown): 'contained' | 'wide' | 'fluid' => {
  const value = String(mode || '').trim();
  if (value === 'wide' || value === 'fluid') return value;
  return 'contained';
};

/**
 * 规范化文章详情标题区对齐方式
 */
const normalizeArticleDetailHeaderAlign = (align: unknown): 'center' | 'left' => {
  return String(align || '').trim() === 'left' ? 'left' : 'center';
};

/**
 * 规范化文章正文最大宽度，避免配置异常导致页面溢出
 */
const normalizeArticleDetailMaxWidth = (value: unknown): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 880;
  return Math.max(680, Math.min(1600, parsed));
};

const ArticleDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { hasFeature } = useLicense();
  const { data: publicSettings } = usePublicSettings();
  
  const [article, setArticle] = useState<ArticleDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [readingProgress, setReadingProgress] = useState(0);

  useEffect(() => {
    const fetchArticle = async () => {
      if (!slug) return;
      try {
        setLoading(true);
        const data = await getArticleDetail(slug);
        setArticle(data);
      } catch (err) {
        const axiosError = err as AxiosError;
        if (axiosError.response?.status === 404) {
          setError('文章不存在或已被删除');
        } else {
          setError('加载文章失败，请检查网络');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchArticle();
  }, [slug]);

  // 记录阅读量
  useEffect(() => {
    if (!article?.id) return;
    const key = `viewed_article_${article.id}`;
    if (sessionStorage.getItem(key)) return;
    
    const timer = setTimeout(() => {
      recordArticleView(article.id).catch(() => {});
      sessionStorage.setItem(key, '1');
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [article?.id]);

  /**
   * 监听滚动进度，提供阅读进度条反馈
   */
  useEffect(() => {
    const handleScroll = () => {
      const doc = document.documentElement;
      const scrollTop = window.scrollY || doc.scrollTop || 0;
      const maxScroll = Math.max(doc.scrollHeight - window.innerHeight, 1);
      const progress = Math.max(0, Math.min(100, (scrollTop / maxScroll) * 100));
      setReadingProgress(progress);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  /**
   * 复制文章当前链接，方便转发分享
   */
  const handleCopyArticleLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      window.alert('文章链接已复制');
    } catch (copyError) {
      window.alert('复制失败，请手动复制地址栏链接');
    }
  };

  if (loading) return <div className="detail-loading"><div className="spinner" /></div>;
  
  if (error || !article) {
    return (
      <div className="detail-error">
        <h2>{error || '文章不存在'}</h2>
        <button onClick={() => navigate('/articles')} className="back-btn">返回文章列表</button>
      </div>
    );
  }

  const articleSetting = publicSettings?.article;
  const detailLayoutWidthMode = normalizeArticleDetailLayoutWidthMode(articleSetting?.detailLayoutWidthMode);
  const detailHeaderAlign = normalizeArticleDetailHeaderAlign(articleSetting?.detailHeaderAlign);
  const detailMaxWidth = normalizeArticleDetailMaxWidth(articleSetting?.detailContentMaxWidth);

  return (
    <article
      className={`article-detail-page article-detail-page--layout-${detailLayoutWidthMode} article-detail-page--header-${detailHeaderAlign}`}
      style={{ '--article-detail-max-width': `${detailMaxWidth}px` } as React.CSSProperties}
    >
      <div className="detail-reading-progress" aria-hidden="true">
        <div
          className="detail-reading-progress__bar"
          style={{ width: `${readingProgress}%` }}
        />
      </div>
      <SEO
        title={article.seoTitle || article.title}
        description={article.seoDescription || article.excerpt}
        keywords={article.tags.map(t => t.name).join(',')}
        image={article.coverImage}
        type="article"
      />

      {/* 沉浸式头部背景 */}
      <div className="detail-hero-bg"></div>

      <div className="detail-container">
        {/* 导航面包屑 */}
        <nav className="detail-nav">
          <Link to="/articles">文章列表</Link>
          <span className="separator">/</span>
          <span className="current">{article.category}</span>
        </nav>

        {/* 文章头部信息 */}
        <header className="detail-header">
          <div className="detail-meta-tags">
            <span className="category-badge">{article.category}</span>
            <time className="publish-date">{formatDate(article.publishedAt)}</time>
          </div>
          
          <h1 className="detail-title">{article.title}</h1>
          
          <div className="detail-author-bar">
            <div className="author-info">
              <div className="author-avatar">
                {article.author.charAt(0).toUpperCase()}
              </div>
              <div className="author-text">
                <span className="author-name">{article.author}</span>
                <span className="read-count">{article.viewCount} 次阅读</span>
              </div>
            </div>
          </div>

          <div className="detail-header-actions">
            <button type="button" className="detail-header-action" onClick={() => navigate('/articles')}>
              返回列表
            </button>
            <button type="button" className="detail-header-action detail-header-action--primary" onClick={handleCopyArticleLink}>
              复制链接
            </button>
          </div>
        </header>

        {/* 封面图 */}
        {article.coverImage && (
          <figure className="detail-cover">
            <img src={article.coverImage} alt={article.title} />
          </figure>
        )}

        {/* 正文区域 */}
        <div className="detail-content-wrapper">
          <div 
            className="detail-content typography"
            dangerouslySetInnerHTML={{ __html: article.content }} // 注意：实际项目中建议使用 renderMarkdown 或 DOMPurify
          />
        </div>

        {/* 底部标签 */}
        {article.tags.length > 0 && (
          <div className="detail-tags">
            {article.tags.map(tag => (
              <Link key={tag.id} to={`/articles?tag=${tag.slug}`} className="tag-chip">
                # {tag.name}
              </Link>
            ))}
          </div>
        )}

        <hr className="detail-divider" />

        {/* 评论区 */}
        {hasFeature(FEATURES.ARTICLE_COMMENTS) && (
          <section className="detail-comments">
            <h3>评论互动</h3>
            <ArticleComments articleId={String(article.id)} />
          </section>
        )}
      </div>
    </article>
  );
};

export default ArticleDetail;
