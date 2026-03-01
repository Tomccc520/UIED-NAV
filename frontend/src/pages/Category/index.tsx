/**
 * @file Category/index.tsx
 * @description 分类页面 - 展示所有分类列表或单个分类下的网站
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import ToolCard from '../../components/ToolCard';
import SEO from '../../components/SEO';
import { useFrontendConfig } from '../../hooks/useFrontendConfig';
import { usePermalinkConfig, generateWebsiteUrl } from '../../hooks/usePermalinkConfig';
import { getArrowConfigByWebsiteClickMode } from '../../utils/clickMode';
import { unwrapApiResponse, unwrapApiList } from '../../utils/apiResponse';
import './index.css';
import '../../styles/common.css';

// 分类数据接口
interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
  description: string;
  websiteCount: number;
  children: {
    id: string;
    name: string;
    slug: string;
    icon: string;
    color: string;
    description: string;
    websiteCount: number;
  }[];
}

// 网站数据接口
interface WebsiteItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  url: string;
  iconUrl: string;
  isHot: boolean;
  isFeatured: boolean;
  isNew: boolean;
  tags: string[];
}

// 分类详情数据
interface CategoryDetail {
  category: {
    id: string;
    name: string;
    slug: string;
    icon: string;
    color: string;
    description: string;
    seoTitle: string;
    seoDescription: string;
    seoKeywords: string;
    parent: { id: string; name: string; slug: string } | null;
    subCategories: { id: string; name: string; slug: string }[];
  };
  websites: WebsiteItem[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * 分类页面组件
 */
const CategoryPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();

  // 如果有 slug 参数，显示分类详情；否则显示分类列表
  if (slug) {
    return <CategoryDetailView slug={slug} />;
  }
  return <CategoryListView />;
};

/**
 * 分类列表视图 - 展示所有分类
 */
const CategoryListView: React.FC = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/categories');
        const data = unwrapApiList<CategoryItem>(res.data);
        setCategories(data);
      } catch (error) {
        console.error('获取分类列表失败:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  // 生成分类图标背景色
  const getIconBg = (color: string) => {
    if (color) return { background: `${color}15`, color };
    return { background: '#f0f5ff', color: '#2563eb' };
  };

  if (loading) {
    return (
      <div className="category-page">
        <SEO title="所有分类" description="浏览所有设计资源分类" />
        <div className="category-loading">
          <p>加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="category-page">
      <SEO
        title="所有分类"
        description="浏览所有设计资源分类，发现优质工具和资源。"
        keywords="分类,设计工具,设计资源,导航"
      />

      <div className="category-list-container">
        <div className="category-list-header">
          <h1 className="category-list-title">所有分类</h1>
          <p className="category-list-desc">
            共 {categories.length} 个分类，浏览并发现你需要的设计工具和资源
          </p>
        </div>

        <div className="category-grid">
          {categories.map(cat => {
            const iconStyle = getIconBg(cat.color);
            return (
              <div
                key={cat.id}
                className="category-card"
                onClick={() => navigate(`/category/${cat.slug || cat.id}`)}
              >
                <div className="category-card-header">
                  <div className="category-card-icon" style={iconStyle}>
                    {cat.icon || cat.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="category-card-name">{cat.name}</h3>
                    <div className="category-card-count">{cat.websiteCount} 个网站</div>
                  </div>
                </div>
                {cat.description && (
                  <p className="category-card-desc">{cat.description}</p>
                )}
                {cat.children && cat.children.length > 0 && (
                  <div className="category-card-children">
                    {cat.children.slice(0, 5).map(child => (
                      <span key={child.id} className="category-child-tag">
                        {child.name}
                      </span>
                    ))}
                    {cat.children.length > 5 && (
                      <span className="category-child-tag">+{cat.children.length - 5}</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

/**
 * 分类详情视图 - 展示某个分类下的网站
 */
const CategoryDetailView: React.FC<{ slug: string }> = ({ slug }) => {
  const navigate = useNavigate();
  const [detail, setDetail] = useState<CategoryDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 24;

  // 获取前端配置
  const { config: frontendConfig } = useFrontendConfig();
  const { config: permalinkConfig } = usePermalinkConfig();
  const showDirectArrow = frontendConfig?.pageGlobalConfig?.showDirectArrow ?? false;
  const websiteClickMode = frontendConfig?.pageGlobalConfig?.websiteClickMode ?? 'detail';
  const directArrowNewWindow = frontendConfig?.pageGlobalConfig?.directArrowNewWindow ?? true;
  const detailPageNewWindow = frontendConfig?.pageGlobalConfig?.detailPageNewWindow ?? false;
  const { isDirectMode, arrowLabel, arrowIsExternal } = getArrowConfigByWebsiteClickMode(websiteClickMode);

  // 获取分类详情
  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/categories/${slug}`, { params: { page, pageSize } });
        const data = unwrapApiResponse<CategoryDetail | null>(res.data, null);
        setDetail(data);
      } catch (error) {
        console.error('获取分类详情失败:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
    window.scrollTo(0, 0);
  }, [slug, page]);

  // 处理网站点击
  const handleWebsiteClick = useCallback((website: WebsiteItem) => {
    if (isDirectMode) {
      window.open(website.url, '_blank', 'noopener,noreferrer');
    } else {
      const detailUrl = generateWebsiteUrl(permalinkConfig, { id: website.id, slug: website.slug });
      if (detailPageNewWindow) {
        window.open(detailUrl, '_blank');
      } else {
        navigate(detailUrl);
      }
    }
  }, [isDirectMode, permalinkConfig, navigate, detailPageNewWindow]);

  // 直达箭头点击
  const handleDirectVisit = useCallback((tool: { id: string; slug?: string; url: string }, e: React.MouseEvent) => {
    if (isDirectMode) {
      const detailUrl = generateWebsiteUrl(permalinkConfig, { id: tool.id, slug: tool.slug });
      if (detailPageNewWindow) {
        window.open(detailUrl, '_blank');
      } else {
        navigate(detailUrl);
        window.scrollTo(0, 0);
      }
    } else {
      if (directArrowNewWindow) {
        window.open(tool.url, '_blank', 'noopener,noreferrer');
      } else {
        window.location.href = tool.url;
      }
    }
  }, [isDirectMode, directArrowNewWindow, detailPageNewWindow, permalinkConfig, navigate]);

  const totalPages = detail ? Math.ceil(detail.total / pageSize) : 0;

  if (loading && !detail) {
    return (
      <div className="category-page">
        <div className="category-loading"><p>加载中...</p></div>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="category-page">
        <div className="category-empty"><p>分类不存在</p></div>
      </div>
    );
  }

  const cat = detail.category;

  return (
    <div className="category-page">
      <SEO
        title={`${cat.seoTitle || cat.name} - 分类`}
        description={cat.seoDescription || cat.description || `${cat.name}分类下的优质设计资源和工具`}
        keywords={cat.seoKeywords || `${cat.name},设计工具,设计资源`}
      />

      {/* 面包屑 */}
      <nav className="category-breadcrumb">
        <Link to="/">首页</Link>
        <span className="breadcrumb-separator">/</span>
        <Link to="/category">所有分类</Link>
        <span className="breadcrumb-separator">/</span>
        {cat.parent && (
          <>
            <Link to={`/category/${cat.parent.slug || cat.parent.id}`}>{cat.parent.name}</Link>
            <span className="breadcrumb-separator">/</span>
          </>
        )}
        <span className="breadcrumb-current">{cat.name}</span>
      </nav>

      {/* 分类头部 */}
      <div className="category-detail-header">
        <div className="category-header-top">
          <div className="category-header-icon" style={cat.color ? { background: `${cat.color}15`, color: cat.color } : undefined}>
            {cat.icon || cat.name.charAt(0)}
          </div>
          <div className="category-header-info">
            <h1 className="category-detail-title">{cat.seoTitle || cat.name}</h1>
            {(cat.seoDescription || cat.description) && (
              <p className="category-detail-desc">{cat.seoDescription || cat.description}</p>
            )}
            <div className="category-detail-meta">
              <span className="meta-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                共 {detail.total} 个网站
              </span>
              {cat.subCategories.length > 0 && (
                <span className="meta-item">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                  {cat.subCategories.length} 个子分类
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 子分类标签 */}
        {cat.subCategories.length > 0 && (
          <div className="category-sub-tabs">
            <span
              className="category-sub-tab active"
              style={{ pointerEvents: 'none' }}
            >
              全部
            </span>
            {cat.subCategories.map(sub => (
              <Link
                key={sub.id}
                to={`/category/${sub.slug || sub.id}`}
                className="category-sub-tab"
              >
                {sub.name}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* 网站列表 */}
      <div className="category-websites-container">
        <div className="tools-grid">
          {detail.websites.map(website => (
            <ToolCard
              key={website.id}
              tool={{
                id: website.id,
                name: website.name,
                description: website.description,
                url: website.url,
                iconUrl: website.iconUrl,
                isHot: website.isHot,
                isFeatured: website.isFeatured,
                isNew: website.isNew,
                category: '',
                tags: website.tags || [],
                slug: website.slug,
              }}
              onClick={() => handleWebsiteClick(website)}
              showDirectArrow={showDirectArrow}
              onDirectVisit={handleDirectVisit}
              arrowLabel={arrowLabel}
              arrowIsExternal={arrowIsExternal}
              directArrowNewWindow={directArrowNewWindow}
            />
          ))}
        </div>

        {detail.websites.length === 0 && (
          <div className="category-empty">
            <p>该分类下暂无网站</p>
          </div>
        )}

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="category-pagination">
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
            >
              上一页
            </button>
            <span className="page-info">{page} / {totalPages}</span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
            >
              下一页
            </button>
          </div>
        )}
      </div>

    </div>
  );
};

export default CategoryPage;
