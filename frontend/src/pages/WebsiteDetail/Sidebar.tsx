/**
 * @file pages/WebsiteDetail/Sidebar.tsx
 * @description 网址详情页侧边栏组件
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

import React, { useEffect, useState } from 'react';
import { AxiosError } from 'axios';
import { Link } from 'react-router-dom';
import WebsiteFavicon from '../../components/WebsiteFavicon';
import api from '../../services/api';
import { unwrapApiResponse } from '../../utils/apiResponse';
import { debugLog } from '../../utils/debugHelper';

/**
 * 侧边栏模块配置接口
 */
interface SidebarModule {
  key: string;
  name: string;
  enabled: boolean;
  sort: number;
}

/**
 * 判断某个侧边栏模块是否启用（优先读取后台排序开关）
 */
const isSidebarModuleEnabled = (modules: SidebarModule[] | undefined, moduleKey: string): boolean => {
  if (!Array.isArray(modules) || modules.length === 0) return true;
  return modules.some(module => module.key === moduleKey && module.enabled);
};

/**
 * 侧边栏配置接口
 */
interface SidebarConfig {
  enabled: boolean;
  showRelated: boolean;
  relatedTitle: string;
  relatedCount: number;
  relatedMode: 'same_category' | 'same_tags' | 'hot' | 'manual';
  manualWebsiteIds: string | string[];
  showHotWebsites?: boolean;
  hotWebsitesTitle?: string;
  hotWebsitesCount?: number;
  showArticles?: boolean;
  articlesTitle?: string;
  articlesCount?: number;
  showTags: boolean;
  tagsTitle: string;
  tagSource: 'website' | 'category' | 'manual';
  manualTags?: string | string[];
  showCategory: boolean;
  categoryTitle: string;
  sidebarLinksNewWindow?: boolean;
  sidebarAdEnabled?: boolean;
  sidebarAdSlotKey?: string;
  sidebarModules?: SidebarModule[];
}

interface RelatedWebsite {
  id: string;
  name: string;
  slug?: string;
  description: string;
  url?: string;
  iconUrl?: string;
  category?: {
    name: string;
  };
}

interface WebsiteTag {
  id: string;
  name: string;
  slug: string;
  color?: string;
}

interface HotWebsiteItem {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  url?: string;
  iconUrl?: string;
}

interface SidebarArticleItem {
  id: string;
  title: string;
  slug?: string;
  excerpt?: string;
  publishedAt?: string | number | null;
}

interface SidebarProps {
  websiteId: string;
  relatedWebsites: RelatedWebsite[];
  tags: string[];
  websiteTags?: WebsiteTag[];
  detailPageConfig?: Partial<SidebarConfig> | null;
  category?: {
    id?: string;
    name?: string;
    slug?: string;
    parent?: {
      id?: string;
      name?: string;
      slug?: string;
    } | null;
  };
  loading?: boolean;
}

interface CommercialPlacementItem {
  id: number;
  sponsorName?: string;
  sponsorTitle?: string;
  targetUrl?: string;
  imageUrl?: string;
  textContent?: string;
  badgeText?: string;
}

/**
 * 将后台配置中的字符串/数组统一转换为字符串列表
 */
const parseStringList = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.map(item => String(item || '').trim()).filter(Boolean);
  }
  return String(value || '')
    .split(/[\n,]/)
    .map(item => item.trim())
    .filter(Boolean);
};

/**
 * 格式化文章发布日期（侧边栏轻量展示）
 */
const formatSidebarArticleDate = (value: unknown): string => {
  if (value === null || value === undefined || value === '') return '';
  const asNumber = Number(value);
  if (Number.isFinite(asNumber) && asNumber > 0) {
    const timestamp = asNumber > 1e12 ? asNumber : asNumber * 1000;
    return new Date(timestamp).toLocaleDateString('zh-CN');
  }
  const parsed = new Date(String(value));
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toLocaleDateString('zh-CN');
};

/**
 * 侧边栏组件
 */
const Sidebar: React.FC<SidebarProps> = ({
  websiteId,
  relatedWebsites,
  tags,
  websiteTags,
  detailPageConfig,
  category,
  loading,
}) => {
  const [config, setConfig] = useState<SidebarConfig>({
    enabled: true,
    showRelated: true,
    relatedTitle: '你可能还喜欢',
    relatedCount: 6,
    relatedMode: 'same_category',
    manualWebsiteIds: '',
    showHotWebsites: true,
    hotWebsitesTitle: '热门网址',
    hotWebsitesCount: 6,
    showArticles: true,
    articlesTitle: '推荐文章',
    articlesCount: 5,
    showTags: true,
    tagsTitle: '深入探索',
    tagSource: 'website',
    manualTags: '',
    showCategory: true,
    categoryTitle: '相关分类',
    sidebarLinksNewWindow: false,
    sidebarAdEnabled: false,
    sidebarAdSlotKey: 'website_detail_sidebar',
  });
  const [dynamicRelated, setDynamicRelated] = useState<RelatedWebsite[]>([]);
  const [dynamicRelatedLoading, setDynamicRelatedLoading] = useState(false);
  const [hotWebsites, setHotWebsites] = useState<HotWebsiteItem[]>([]);
  const [hotWebsitesLoading, setHotWebsitesLoading] = useState(false);
  const [articleItems, setArticleItems] = useState<SidebarArticleItem[]>([]);
  const [articleItemsLoading, setArticleItemsLoading] = useState(false);
  const [sidebarPlacement, setSidebarPlacement] = useState<CommercialPlacementItem | null>(null);
  const sidebarPlacementImageUrl = String(sidebarPlacement?.imageUrl || '').trim();
  const sidebarPlacementTargetUrl = String(sidebarPlacement?.targetUrl || '').trim();

  /**
   * 优先使用详情页已加载配置，避免重复请求。
   * 仅在未传入配置时，回退兼容旧接口 /public/detail-sidebar-config。
   */
  useEffect(() => {
    if (detailPageConfig && Object.keys(detailPageConfig).length > 0) {
      setConfig(prev => ({ ...prev, ...detailPageConfig }));
      return;
    }
    const fetchConfig = async () => {
      try {
        const res = await api.get('/public/detail-sidebar-config');
        const data = unwrapApiResponse<Partial<SidebarConfig>>(res.data, {});
        setConfig(prev => ({ ...prev, ...data }));
      } catch (error) {
        debugLog.error('获取侧边栏配置失败:', error);
      }
    };
    fetchConfig();
  }, [detailPageConfig]);

  /**
   * 根据侧边栏高级配置获取相关推荐（同分类/同标签/热门/手动）
   */
  useEffect(() => {
    const fetchDynamicRelated = async () => {
      if (!config.enabled || !config.showRelated) {
        setDynamicRelated([]);
        return;
      }
      if (!websiteId) return;
      if (config.relatedMode === 'same_category') {
        setDynamicRelated([]);
        return;
      }
      try {
        setDynamicRelatedLoading(true);
        const params: Record<string, string | number> = {
          limit: config.relatedCount || 6,
          mode: config.relatedMode || 'same_category',
        };
        if (config.relatedMode === 'manual') {
          params.manualIds = parseStringList(config.manualWebsiteIds).join(',');
        }
        const res = await api.get(`/websites/${websiteId}/related`, { params });
        const data = unwrapApiResponse<RelatedWebsite[]>(res.data, []);
        setDynamicRelated(Array.isArray(data) ? data : []);
      } catch (error) {
        debugLog.warn('获取侧边栏高级推荐失败，回退默认相关推荐:', error);
        setDynamicRelated([]);
      } finally {
        setDynamicRelatedLoading(false);
      }
    };
    fetchDynamicRelated();
  }, [
    websiteId,
    config.enabled,
    config.showRelated,
    config.relatedMode,
    config.manualWebsiteIds,
    config.relatedCount,
  ]);

  /**
   * 获取热门网址模块数据（详情页侧栏）。
   */
  useEffect(() => {
    const fetchHotWebsites = async () => {
      if (
        !config.enabled
        || !config.showHotWebsites
        || !isSidebarModuleEnabled(config.sidebarModules, 'hot_websites')
      ) {
        setHotWebsites([]);
        return;
      }
      try {
        setHotWebsitesLoading(true);
        const limit = Number(config.hotWebsitesCount || 6);
        const res = await api.get('/websites/hot/list', { params: { limit } });
        const payload = unwrapApiResponse<any>(res.data, []);
        const list = Array.isArray(payload)
          ? payload
          : (Array.isArray(payload?.websites) ? payload.websites : []);
        setHotWebsites(
          list
            .filter((item: any) => item && (item.id || item.slug))
            .map((item: any) => ({
              id: String(item.id || ''),
              name: String(item.name || ''),
              slug: String(item.slug || ''),
              description: String(item.description || ''),
              url: String(item.url || ''),
              iconUrl: String(item.iconUrl || item.icon_url || ''),
            }))
            .filter((item: HotWebsiteItem) => item.id || item.slug)
        );
      } catch (error) {
        debugLog.warn('获取热门网址失败（侧栏）:', error);
        setHotWebsites([]);
      } finally {
        setHotWebsitesLoading(false);
      }
    };
    fetchHotWebsites();
  }, [
    config.enabled,
    config.showHotWebsites,
    config.hotWebsitesCount,
    config.sidebarModules,
  ]);

  /**
   * 获取文章模块数据（详情页侧栏）。
   */
  useEffect(() => {
    const fetchArticleItems = async () => {
      if (
        !config.enabled
        || !config.showArticles
        || !isSidebarModuleEnabled(config.sidebarModules, 'articles')
      ) {
        setArticleItems([]);
        return;
      }
      try {
        setArticleItemsLoading(true);
        const pageSize = Number(config.articlesCount || 5);
        const res = await api.get('/articles', { params: { page: 1, pageSize } });
        const payload = unwrapApiResponse<any>(res.data, { lists: [] });
        const list = Array.isArray(payload?.lists)
          ? payload.lists
          : (Array.isArray(payload) ? payload : []);
        setArticleItems(
          list
            .filter((item: any) => item && (item.id || item.slug))
            .map((item: any) => ({
              id: String(item.id || ''),
              title: String(item.title || ''),
              slug: String(item.slug || item.id || ''),
              excerpt: String(item.excerpt || item.summary || ''),
              publishedAt: item.publishedAt || item.published_at || item.createTime || null,
            }))
            .filter((item: SidebarArticleItem) => item.title && (item.slug || item.id))
        );
      } catch (error) {
        debugLog.warn('获取侧栏文章失败:', error);
        setArticleItems([]);
      } finally {
        setArticleItemsLoading(false);
      }
    };
    fetchArticleItems();
  }, [
    config.enabled,
    config.showArticles,
    config.articlesCount,
    config.sidebarModules,
  ]);

  /**
   * 获取侧边栏广告位（商业位体系），失败不阻断页面主流程
   */
  useEffect(() => {
    const fetchSidebarPlacement = async () => {
      if (!config.enabled || !config.sidebarAdEnabled) {
        setSidebarPlacement(null);
        return;
      }
      const slotKey = String(config.sidebarAdSlotKey || 'website_detail_sidebar').trim();
      if (!slotKey) {
        setSidebarPlacement(null);
        return;
      }
      try {
        const res = await api.get('/commercial/placements', {
          params: { slotKey, limit: 1 },
        });
        const payload = unwrapApiResponse<{ list?: CommercialPlacementItem[] } | CommercialPlacementItem[]>(
          res.data,
          { list: [] }
        );
        const list = Array.isArray(payload) ? payload : (Array.isArray(payload?.list) ? payload.list : []);
        setSidebarPlacement(list[0] || null);
      } catch (error) {
        /**
         * 商业位接口 403 代表当前版本未授权，按非关键功能静默处理。
         */
        const status = Number((error as AxiosError)?.response?.status || 0);
        if (status !== 403) {
          debugLog.warn('获取侧边栏广告位失败（非关键）:', error);
        }
        setSidebarPlacement(null);
      }
    };
    fetchSidebarPlacement();
  }, [config.enabled, config.sidebarAdEnabled, config.sidebarAdSlotKey]);

  // 如果侧边栏被禁用，不渲染
  if (!config.enabled) {
    return null;
  }

  // 限制显示的相关网站数量
  const baseRelated = (config.relatedMode === 'same_category' ? relatedWebsites : dynamicRelated) || [];
  const displayedRelated = baseRelated.slice(0, config.relatedCount);

  /**
   * 生成分类标签列表（用于“标签来源=分类标签”）
   */
  const categoryTags: WebsiteTag[] = (() => {
    const result: WebsiteTag[] = [];
    if (category?.parent?.name) {
      result.push({
        id: `category-parent-${category.parent.id || category.parent.slug || category.parent.name}`,
        name: category.parent.name,
        slug: String(category.parent.slug || category.parent.id || category.parent.name),
      });
    }
    if (category?.name) {
      result.push({
        id: `category-current-${category.id || category.slug || category.name}`,
        name: category.name,
        slug: String(category.slug || category.id || category.name),
      });
    }
    return result;
  })();

  /**
   * 合并标签来源：网站标签 / 分类标签 / 人工标签
   */
  const displayTags: WebsiteTag[] = (() => {
    if (config.tagSource === 'category') {
      return categoryTags;
    }
    if (config.tagSource === 'manual') {
      return parseStringList(config.manualTags).map((tag, index) => ({
        id: `manual-${index}-${tag}`,
        name: tag,
        slug: tag,
      }));
    }
    if (websiteTags && websiteTags.length > 0) {
      return websiteTags;
    }
    return tags.map((tag, index) => ({ id: `legacy-${index}`, name: tag, slug: tag, color: undefined }));
  })();

  const relatedSectionLoading = loading || dynamicRelatedLoading;
  const sidebarLinkTarget = config.sidebarLinksNewWindow ? '_blank' : undefined;
  const sidebarLinkRel = config.sidebarLinksNewWindow ? 'noopener noreferrer' : undefined;

  /**
   * 渲染单个侧边栏模块
   */
  const renderModule = (moduleKey: string) => {
    switch (moduleKey) {
      case 'category':
        // 分类区块
        if (config.showCategory && (category?.name || category?.parent?.name)) {
          return (
            <div key="category" className="sidebar-section">
              <h3 className="sidebar-title">{config.categoryTitle || '相关分类'}</h3>
              <div className="sidebar-tags">
                {category?.parent?.name && (
                  <Link
                    to={`/category/${category.parent.slug || category.parent.id}`}
                    className="sidebar-tag"
                    target={sidebarLinkTarget}
                    rel={sidebarLinkRel}
                  >
                    # {category.parent.name}
                  </Link>
                )}
                {category?.name && (
                  <Link
                    to={`/category/${category.slug || category.id}`}
                    className="sidebar-tag"
                    target={sidebarLinkTarget}
                    rel={sidebarLinkRel}
                  >
                    # {category.name}
                  </Link>
                )}
              </div>
            </div>
          );
        }
        return null;

      case 'related':
        // 相关推荐
        if (config.showRelated) {
          return (
            <div key="related" className="sidebar-section">
              <h3 className="sidebar-title">{config.relatedTitle}</h3>
              {relatedSectionLoading ? (
                <div className="sidebar-loading">加载中...</div>
              ) : displayedRelated.length > 0 ? (
                <div className="sidebar-related-list">
                  {displayedRelated.map((site) => (
                    <Link
                      key={site.id}
                      to={`/website/${site.slug || site.id}`}
                      className="sidebar-related-item"
                      target={sidebarLinkTarget}
                      rel={sidebarLinkRel}
                    >
                      <div className="sidebar-related-icon">
                        <WebsiteFavicon
                          websiteUrl={site.url}
                          iconUrl={site.iconUrl}
                          name={site.name}
                          size={32}
                        />
                      </div>
                      <div className="sidebar-related-info">
                        <div className="sidebar-related-name">{site.name}</div>
                        <div className="sidebar-related-desc">{site.description}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="sidebar-empty">暂无相关推荐</div>
              )}
            </div>
          );
        }
        return null;

      case 'tags':
        // 标签云
        if (config.showTags && displayTags.length > 0) {
          return (
            <div key="tags" className="sidebar-section">
              <h3 className="sidebar-title">{config.tagsTitle}</h3>
              <div className="sidebar-tags">
                {displayTags.map((tag) => (
                  <Link
                    key={tag.id}
                    to={`/search?q=${encodeURIComponent(tag.name)}`}
                    className="sidebar-tag"
                    style={tag.color ? { borderColor: tag.color, color: tag.color } : undefined}
                    target={sidebarLinkTarget}
                    rel={sidebarLinkRel}
                  >
                    @ {tag.name}
                  </Link>
                ))}
              </div>
            </div>
          );
        }
        return null;

      case 'hot_websites':
        // 热门网址
        if (config.showHotWebsites) {
          return (
            <div key="hot_websites" className="sidebar-section">
              <h3 className="sidebar-title">{config.hotWebsitesTitle || '热门网址'}</h3>
              {hotWebsitesLoading ? (
                <div className="sidebar-loading">加载中...</div>
              ) : hotWebsites.length > 0 ? (
                <div className="sidebar-related-list">
                  {hotWebsites.slice(0, Number(config.hotWebsitesCount || 6)).map((site) => (
                    <Link
                      key={`hot-${site.id || site.slug}`}
                      to={`/website/${site.slug || site.id}`}
                      className="sidebar-related-item"
                      target={sidebarLinkTarget}
                      rel={sidebarLinkRel}
                    >
                      <div className="sidebar-related-icon">
                        <WebsiteFavicon
                          websiteUrl={site.url}
                          iconUrl={site.iconUrl}
                          name={site.name}
                          size={32}
                        />
                      </div>
                      <div className="sidebar-related-info">
                        <div className="sidebar-related-name">{site.name}</div>
                        {site.description && (
                          <div className="sidebar-related-desc sidebar-related-desc--single-line">
                            {site.description}
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="sidebar-empty">暂无热门网址</div>
              )}
            </div>
          );
        }
        return null;

      case 'articles':
        // 推荐文章
        if (config.showArticles) {
          return (
            <div key="articles" className="sidebar-section sidebar-section--articles">
              <h3 className="sidebar-title">{config.articlesTitle || '推荐文章'}</h3>
              {articleItemsLoading ? (
                <div className="sidebar-loading">加载中...</div>
              ) : articleItems.length > 0 ? (
                <div className="sidebar-article-list">
                  {articleItems.slice(0, Number(config.articlesCount || 5)).map((article) => (
                    <Link
                      key={`article-${article.id || article.slug}`}
                      to={`/article/${article.slug || article.id}`}
                      className="sidebar-article-item"
                      target={sidebarLinkTarget}
                      rel={sidebarLinkRel}
                    >
                      <div className="sidebar-article-title">{article.title}</div>
                      {article.excerpt && (
                        <div className="sidebar-article-excerpt">{article.excerpt}</div>
                      )}
                      <div className="sidebar-article-meta">
                        {formatSidebarArticleDate(article.publishedAt) || '最新发布'}
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="sidebar-empty">暂无文章推荐</div>
              )}
            </div>
          );
        }
        return null;

      case 'ad':
        // 侧边栏广告位
        if (config.sidebarAdEnabled && sidebarPlacement) {
          return (
            <div key="ad" className="sidebar-section sidebar-section--ad">
              <a
                href={sidebarPlacementTargetUrl || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="sidebar-ad-card"
              >
                {sidebarPlacement.badgeText && (
                  <span className="sidebar-ad-badge">{sidebarPlacement.badgeText}</span>
                )}
                {sidebarPlacementImageUrl && (
                  <div className="sidebar-ad-cover">
                    <img src={sidebarPlacementImageUrl} alt={sidebarPlacement.sponsorTitle || '广告位'} />
                  </div>
                )}
                <div className="sidebar-ad-body">
                  <div className="sidebar-ad-title">
                    {sidebarPlacement.sponsorTitle || sidebarPlacement.sponsorName || '推荐内容'}
                  </div>
                  {sidebarPlacement.textContent && (
                    <div className="sidebar-ad-desc">{sidebarPlacement.textContent}</div>
                  )}
                </div>
              </a>
            </div>
          );
        }
        return null;

      default:
        return null;
    }
  };

  // 获取启用的模块并按顺序排序
  const enabledModules = config.sidebarModules
    ? config.sidebarModules
        .filter(module => module.enabled)
        .sort((a, b) => a.sort - b.sort)
    : [
        // 默认顺序（如果没有配置）
        { key: 'category', name: '分类', enabled: true, sort: 1 },
        { key: 'related', name: '相关推荐', enabled: true, sort: 2 },
        { key: 'hot_websites', name: '热门网址', enabled: true, sort: 3 },
        { key: 'articles', name: '推荐文章', enabled: true, sort: 4 },
        { key: 'tags', name: '标签', enabled: true, sort: 5 },
        { key: 'ad', name: '广告', enabled: true, sort: 6 },
      ];

  return (
    <aside className="website-detail-sidebar">
      {enabledModules.map(module => renderModule(module.key))}
    </aside>
  );
};

export default Sidebar;
