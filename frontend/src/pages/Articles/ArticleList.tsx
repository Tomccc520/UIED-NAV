/**
 * @file pages/Articles/ArticleList.tsx
 * @description 文章列表页组件 - 2026 设计改版 (支持专题/分类页)
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 */
/**
 * @copyright Tomda (https://www.tomda.top)
 * @copyright UIED技术团队 (https://fsuied.com)
 * @author UIED技术团队
 * @createDate 2026.1.27
 */

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  getArticles, 
  getArticleCategories, 
  getArticleTags 
} from '../../services/articleService';
import { ArticleListItem, TagMeta, CategoryMeta } from '../../types/article';
import { getTopicConfig, DEFAULT_ARTICLE_CONFIG } from '../../config/articleConfig';
import { usePublicSettings } from '../../hooks/usePublicSettings';
import SEO from '../../components/SEO';
import ArticleCard from './ArticleCard';
import './ArticleList.css';

interface ArticleListProps {
  pageTitle?: string;
}

const ArticleList: React.FC<ArticleListProps> = () => {
  const { data: publicSettings } = usePublicSettings();
  const [searchParams, setSearchParams] = useSearchParams();
  const [articles, setArticles] = useState<ArticleListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 分页状态
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 12,
    total: 0,
    totalPages: 1
  });

  const [categories, setCategories] = useState<CategoryMeta[]>([]);
  const [tags, setTags] = useState<TagMeta[]>([]);

  // 从 URL 获取参数
  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  const currentCategory = searchParams.get('category') || '';
  const currentTag = searchParams.get('tag') || '';

  // 获取当前页面的视觉配置 (专题/分类信息)
  const topicConfig = useMemo(() => {
    const topics = publicSettings.articleTopics || {};
    if (currentTag && topics[currentTag]) {
      return topics[currentTag];
    }
    if (currentCategory && topics[currentCategory]) {
      return topics[currentCategory];
    }
    return getTopicConfig(currentCategory, currentTag);
  }, [currentCategory, currentTag, publicSettings.articleTopics]);

  // 页面标题和描述
  const listTitle = publicSettings.article?.listPageTitle || DEFAULT_ARTICLE_CONFIG.title;
  const listDescription = publicSettings.article?.listPageDescription || DEFAULT_ARTICLE_CONFIG.description;
  const pageTitle = topicConfig?.title || (currentCategory || (currentTag ? `#${currentTag}` : listTitle));
  const pageDescription = topicConfig?.description || listDescription;
  const themeColor = topicConfig?.themeColor || '#3b82f6';
  const activeFilterSummary = useMemo(() => {
    const summary: Array<{ key: string; label: string }> = [];
    if (currentCategory) {
      summary.push({ key: 'category', label: `分类：${currentCategory}` });
    }
    if (currentTag) {
      summary.push({ key: 'tag', label: `标签：#${currentTag}` });
    }
    return summary;
  }, [currentCategory, currentTag]);

  /**
   * 获取文章数据
   */
  const fetchArticlesData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });

      const response = await getArticles({
        page: currentPage,
        pageSize: 12,
        category: currentCategory || undefined,
        tag: currentTag || undefined
      });

      setArticles(response.data);
      setPagination({
        page: response.pagination.page,
        pageSize: response.pagination.pageSize,
        total: response.pagination.total,
        totalPages: response.pagination.totalPages
      });

    } catch (err) {
      console.error('获取文章列表失败:', err);
      setError('获取文章列表失败，请稍后重试');
      setArticles([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, currentCategory, currentTag]);

  /**
   * 获取元数据
   */
  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const [cats, ts] = await Promise.all([
          getArticleCategories(),
          getArticleTags()
        ]);
        setCategories(cats);
        setTags(ts);
      } catch (e) {
        console.error('获取元数据失败', e);
      }
    };
    fetchMeta();
  }, []);

  useEffect(() => {
    fetchArticlesData();
  }, [fetchArticlesData]);

  /**
   * 路由跳转助手
   */
  const updateParams = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    
    if (key !== 'page') {
      newParams.set('page', '1');
      if (key === 'category') newParams.delete('tag');
    }
    setSearchParams(newParams);
  };

  return (
    <div className="article-list-page" style={{ '--theme-color': themeColor } as React.CSSProperties}>
      <SEO 
        title={`${pageTitle} - UIED 设计导航`}
        description={pageDescription}
      />

      {/* 动态头部区域 */}
      <header className={`article-header-section ${topicConfig ? 'is-topic' : ''}`}>
        <div className="article-header-bg">
          {/* 装饰性背景元素 */}
          <div className="header-orb orb-1"></div>
          <div className="header-orb orb-2"></div>
        </div>
        
        <div className="article-header-content">
          {topicConfig?.icon && (
            <div className="topic-icon">{topicConfig.icon}</div>
          )}
          
          <h1 className="article-page-title">
            {currentTag && !topicConfig && <span className="hash-symbol">#</span>}
            {pageTitle}
          </h1>
          
          <p className="article-page-desc">
            {pageDescription}
          </p>

          {/* 如果是专题页，显示"返回全部" */}
          {(currentCategory || currentTag) && (
            <button 
              className="reset-filter-btn"
              onClick={() => {
                setSearchParams(new URLSearchParams());
              }}
            >
              ← 查看全部文章
            </button>
          )}
        </div>
      </header>

      <main className="article-main-container">
        {/* 筛选区域 - 仅在非专题模式下显示，或者作为二级导航 */}
        <section className="article-filters">
          {/* 分类筛选 */}
          {categories.length > 0 && (
            <div className="filter-row">
              <span className="filter-label">分类</span>
              <div className="filter-options">
                <button 
                  className={`filter-chip ${!currentCategory ? 'active' : ''}`}
                  onClick={() => updateParams('category', '')}
                >
                  全部
                </button>
                {categories.map(cat => (
                  <button
                    key={cat}
                    className={`filter-chip ${currentCategory === cat ? 'active' : ''}`}
                    onClick={() => updateParams('category', cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 标签筛选 */}
          {tags.length > 0 && (
            <div className="filter-row">
              <span className="filter-label">热门标签</span>
              <div className="filter-options">
                {tags.slice(0, 15).map(tag => (
                  <button
                    key={tag.id}
                    className={`filter-tag ${currentTag === tag.slug ? 'active' : ''}`}
                    onClick={() => updateParams('tag', currentTag === tag.slug ? '' : tag.slug)}
                  >
                    #{tag.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* 内容区域 */}
        <section className="article-content-area">
          <div className="article-result-toolbar">
            <div className="article-result-toolbar__meta">
              <span className="article-result-toolbar__count">共 {pagination.total} 篇</span>
              {pagination.totalPages > 1 && (
                <span className="article-result-toolbar__page">第 {pagination.page}/{pagination.totalPages} 页</span>
              )}
            </div>
            {activeFilterSummary.length > 0 && (
              <div className="article-result-toolbar__filters">
                {activeFilterSummary.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    className="article-result-toolbar__chip"
                    onClick={() => updateParams(item.key, '')}
                    title="点击移除筛选"
                  >
                    {item.label}
                    <span>×</span>
                  </button>
                ))}
                <button
                  type="button"
                  className="article-result-toolbar__reset"
                  onClick={() => setSearchParams(new URLSearchParams())}
                >
                  清空筛选
                </button>
              </div>
            )}
          </div>

          {loading ? (
            <div className="article-loading">
              <div className="spinner"></div>
              <p>正在加载精彩内容...</p>
            </div>
          ) : error ? (
            <div className="article-error">
              <div className="error-icon">⚠️</div>
              <p>{error}</p>
              <button onClick={fetchArticlesData} className="retry-btn">重试</button>
            </div>
          ) : articles.length === 0 ? (
            <div className="article-empty">
              <div className="empty-icon">📭</div>
              <p>暂无相关文章，换个筛选条件试试？</p>
              {(currentCategory || currentTag) && (
                <button 
                  className="reset-btn"
                  onClick={() => setSearchParams(new URLSearchParams())}
                >
                  查看所有文章
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="article-grid">
                {articles.map(article => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>

              {/* 分页器 */}
              {pagination.totalPages > 1 && (
                <div className="article-pagination">
                  <button 
                    disabled={pagination.page <= 1}
                    onClick={() => updateParams('page', String(pagination.page - 1))}
                    className="page-btn prev"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M15 18l-6-6 6-6" />
                    </svg>
                    上一页
                  </button>
                  
                  <div className="page-info">
                    <span className="current">{pagination.page}</span>
                    <span className="separator">/</span>
                    <span className="total">{pagination.totalPages}</span>
                  </div>

                  <button 
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => updateParams('page', String(pagination.page + 1))}
                    className="page-btn next"
                  >
                    下一页
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </main>
    </div>
  );
};

export default ArticleList;
