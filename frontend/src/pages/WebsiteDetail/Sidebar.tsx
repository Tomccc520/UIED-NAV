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
 * 侧边栏配置接口
 */
interface SidebarConfig {
  enabled: boolean;
  showRelated: boolean;
  relatedTitle: string;
  relatedCount: number;
  relatedMode: 'same_category' | 'same_tags' | 'hot' | 'manual';
  manualWebsiteIds: string | string[];
  showTags: boolean;
  tagsTitle: string;
  tagSource: 'website' | 'category' | 'manual';
  manualTags?: string | string[];
  showCategory: boolean;
  categoryTitle: string;
  sidebarAdEnabled?: boolean;
  sidebarAdSlotKey?: string;
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

interface SidebarProps {
  websiteId: string;
  relatedWebsites: RelatedWebsite[];
  tags: string[];
  websiteTags?: WebsiteTag[];
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
 * 侧边栏组件
 */
const Sidebar: React.FC<SidebarProps> = ({ websiteId, relatedWebsites, tags, websiteTags, category, loading }) => {
  const [config, setConfig] = useState<SidebarConfig>({
    enabled: true,
    showRelated: true,
    relatedTitle: '你可能还喜欢',
    relatedCount: 6,
    relatedMode: 'same_category',
    manualWebsiteIds: '',
    showTags: true,
    tagsTitle: '深入探索',
    tagSource: 'website',
    manualTags: '',
    showCategory: true,
    categoryTitle: '相关分类',
    sidebarAdEnabled: false,
    sidebarAdSlotKey: 'website_detail_sidebar',
  });
  const [dynamicRelated, setDynamicRelated] = useState<RelatedWebsite[]>([]);
  const [dynamicRelatedLoading, setDynamicRelatedLoading] = useState(false);
  const [sidebarPlacement, setSidebarPlacement] = useState<CommercialPlacementItem | null>(null);
  const sidebarPlacementImageUrl = String(sidebarPlacement?.imageUrl || '').trim();
  const sidebarPlacementTargetUrl = String(sidebarPlacement?.targetUrl || '').trim();

  // 获取侧边栏配置
  useEffect(() => {
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
  }, []);

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

  return (
    <aside className="website-detail-sidebar">
      {/* 分类区块 */}
      {config.showCategory && (category?.name || category?.parent?.name) && (
        <div className="sidebar-section">
          <h3 className="sidebar-title">{config.categoryTitle || '相关分类'}</h3>
          <div className="sidebar-tags">
            {category?.parent?.name && (
              <Link
                to={`/category/${category.parent.slug || category.parent.id}`}
                className="sidebar-tag"
              >
                # {category.parent.name}
              </Link>
            )}
            {category?.name && (
              <Link
                to={`/category/${category.slug || category.id}`}
                className="sidebar-tag"
              >
                # {category.name}
              </Link>
            )}
          </div>
        </div>
      )}

      {/* 相关推荐 */}
      {config.showRelated && (
        <div className="sidebar-section">
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
      )}

      {/* 标签云 */}
      {config.showTags && displayTags.length > 0 && (
        <div className="sidebar-section">
          <h3 className="sidebar-title">{config.tagsTitle}</h3>
          <div className="sidebar-tags">
            {displayTags.map((tag) => (
              <Link
                key={tag.id}
                to={`/search?q=${encodeURIComponent(tag.name)}`}
                className="sidebar-tag"
                style={tag.color ? { borderColor: tag.color, color: tag.color } : undefined}
              >
                @ {tag.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* 侧边栏广告位（商业位体系） */}
      {config.sidebarAdEnabled && sidebarPlacement && (
        <div className="sidebar-section sidebar-section--ad">
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
      )}
    </aside>
  );
};

export default Sidebar;
