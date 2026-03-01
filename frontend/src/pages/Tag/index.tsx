/**
 * @file Tag/index.tsx
 * @description 标签页面 - 展示所有标签云或单个标签下的网站
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

// 标签数据接口
interface TagItem {
  id: string;
  name: string;
  slug: string;
  color: string;
  description: string;
  websiteCount: number;
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

// 标签详情数据
interface TagDetail {
  tag: {
    id: string;
    name: string;
    slug: string;
    color: string;
    description: string;
    seoTitle: string;
    seoDescription: string;
    seoKeywords: string;
  };
  websites: WebsiteItem[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * 标签页面组件
 */
const TagPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();

  if (slug) {
    return <TagDetailView slug={slug} />;
  }
  return <TagListView />;
};

/**
 * 标签列表视图 - 标签云展示
 */
const TagListView: React.FC = () => {
  const [tags, setTags] = useState<TagItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const res = await api.get('/tags');
        const data = unwrapApiList<TagItem>(res.data);
        setTags(data);
      } catch (error) {
        console.error('获取标签列表失败:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTags();
  }, []);

  // 根据网站数量计算标签大小
  const getTagSize = (count: number): string => {
    const maxCount = Math.max(...tags.map(t => t.websiteCount), 1);
    const ratio = count / maxCount;
    if (ratio > 0.6) return 'tag-large';
    if (ratio > 0.3) return 'tag-medium';
    return '';
  };

  if (loading) {
    return (
      <div className="tag-page">
        <SEO title="所有标签" description="浏览所有标签" />
        <div className="tag-loading"><p>加载中...</p></div>
      </div>
    );
  }

  return (
    <div className="tag-page">
      <SEO
        title="所有标签"
        description="浏览所有标签，按标签发现优质设计工具和资源。"
        keywords="标签,设计工具,设计资源,导航"
      />

      <div className="tag-list-container">
        <div className="tag-list-header">
          <h1 className="tag-list-title">所有标签</h1>
          <p className="tag-list-desc">
            共 {tags.length} 个标签，点击标签查看相关网站
          </p>
        </div>

        <div className="tag-cloud">
          {tags.map(tag => (
            <Link
              key={tag.id}
              to={`/tag/${tag.slug || tag.id}`}
              className={`tag-cloud-item ${getTagSize(tag.websiteCount)}`}
            >
              {tag.name}
              <span className="tag-count">{tag.websiteCount}</span>
            </Link>
          ))}
        </div>

        {tags.length === 0 && (
          <div className="tag-empty"><p>暂无标签</p></div>
        )}
      </div>
    </div>
  );
};

/**
 * 标签详情视图 - 展示某个标签下的网站
 */
const TagDetailView: React.FC<{ slug: string }> = ({ slug }) => {
  const navigate = useNavigate();
  const [detail, setDetail] = useState<TagDetail | null>(null);
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

  // 获取标签详情
  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/tags/${slug}`, { params: { page, pageSize } });
        const data = unwrapApiResponse<TagDetail | null>(res.data, null);
        setDetail(data);
      } catch (error) {
        console.error('获取标签详情失败:', error);
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
      <div className="tag-page">
        <div className="tag-loading"><p>加载中...</p></div>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="tag-page">
        <div className="tag-empty"><p>标签不存在</p></div>
      </div>
    );
  }

  const tag = detail.tag;

  return (
    <div className="tag-page">
      <SEO
        title={`${tag.seoTitle || tag.name} - 标签`}
        description={tag.seoDescription || tag.description || `标签「${tag.name}」下的优质设计资源和工具`}
        keywords={tag.seoKeywords || `${tag.name},设计工具,设计资源`}
      />

      {/* 面包屑 */}
      <nav className="tag-breadcrumb">
        <Link to="/">首页</Link>
        <span className="breadcrumb-separator">/</span>
        <Link to="/tag">所有标签</Link>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-current">{tag.name}</span>
      </nav>

      {/* 标签头部 */}
      <div className="tag-detail-header">
        <div className="tag-header-top">
          <span className="tag-badge" style={tag.color ? { background: `${tag.color}15`, color: tag.color } : undefined}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
              <line x1="7" y1="7" x2="7.01" y2="7" />
            </svg>
          </span>
          <div className="tag-header-info">
            <h1 className="tag-detail-title">{tag.seoTitle || tag.name}</h1>
            {(tag.seoDescription || tag.description) && (
              <p className="tag-detail-desc">{tag.seoDescription || tag.description}</p>
            )}
            <div className="tag-detail-meta">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
              共 {detail.total} 个网站
            </div>
          </div>
        </div>
      </div>

      {/* 网站列表 */}
      <div className="tag-websites-container">
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
          <div className="tag-empty">
            <p>该标签下暂无网站</p>
          </div>
        )}

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="tag-pagination">
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

export default TagPage;
