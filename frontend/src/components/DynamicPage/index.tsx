/**
 * @file DynamicPage/index.tsx
 * @description 动态页面组件 - 从API获取数据并渲染页面
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { usePageData } from '../../hooks/usePageData';
import { Website, SubCategory } from '../../services/pageService';
import { recordWebsiteClick } from '../../services/api';
import CategorySidebar, { type NavItem, type SidebarConfig } from '../CategorySidebar';
import HeroBanner from '../HeroBanner';
import HotRecommendations from '../HotRecommendations';
import ToolCard from '../ToolCard';
import DesignArticleGrid from '../DesignArticleGrid';
import AdBanner from '../AdBanner';
import SEO from '../SEO';
import { DesignIcons, IconTool } from '../UI';
import { useFrontendConfig } from '../../hooks/useFrontendConfig';
import { usePermalinkConfig, generateWebsiteUrl } from '../../hooks/usePermalinkConfig';
import { getArrowConfigByWebsiteClickMode } from '../../utils/clickMode';
import { unwrapApiResponse } from '../../utils/apiResponse';
import { useNavigate } from 'react-router-dom';
import { 
  CategorySidebarSkeleton, 
  ToolGridSkeleton,
  HeroBannerSkeleton 
} from '../Skeleton';
import { NavMenuType } from '../../types';
import '../../styles/common.css';

type HeroPageType = 'home' | 'ai' | 'uiux' | 'design' | 'search' | 'threed' | 'ecommerce' | 'interior' | 'font';
type IconComponent = React.ElementType;
type WebsiteWithExtra = Website & { slug?: string; oldId?: string };

interface DirectVisitTarget {
  id: string;
  url: string;
  slug?: string;
}

/**
 * 将页面标识统一映射为 HeroBanner 支持的 pageType。
 */
const resolveHeroPageType = (input: string | NavMenuType | undefined): HeroPageType => {
  const value = String(input || '').toLowerCase();
  if (value === NavMenuType.AI) return 'ai';
  if (value === NavMenuType.UIUX) return 'uiux';
  if (value === NavMenuType.DESIGN) return 'design';
  if (value === NavMenuType.ECOMMERCE) return 'ecommerce';
  if (value === NavMenuType.INTERIOR) return 'interior';
  if (value === NavMenuType.FONT) return 'font';
  if (value === NavMenuType.THREE_D || value === 'threed') return 'threed';
  return 'home';
};

// 图标映射 - key 与后台 admin/src/config/icons.tsx 中的 availableIcons 对应
const iconMap: Record<string, IconComponent> = {
  // ============ 设计相关 ============
  'inspiration': DesignIcons.Inspiration,
  'ui': DesignIcons.UI,
  'graphic': DesignIcons.Graphic,
  'template': DesignIcons.Template,
  'material': DesignIcons.Material,
  'icons': DesignIcons.Icons,
  'color': DesignIcons.Color,
  'font': DesignIcons.Font,
  'brand': DesignIcons.Brand,
  'prototype': DesignIcons.Prototype,
  'kit': DesignIcons.Kit,
  'animation': DesignIcons.Animation,
  '3d': DesignIcons['3D'],
  'print': DesignIcons.Print,
  'art': DesignIcons.Art,
  'figma': DesignIcons.Figma,
  'illustration': DesignIcons.Illustration,
  'components': DesignIcons.Components,
  'mockup': DesignIcons.Mockup,
  'palette': DesignIcons.Palette,
  
  // ============ 媒体相关 ============
  'image': DesignIcons.Image,
  'photo': DesignIcons.Photo,
  'video': DesignIcons.Video,
  'audio': DesignIcons.Audio,
  'camera': DesignIcons.Camera,
  
  // ============ 技术相关 ============
  'ai': DesignIcons.AI,
  'code': DesignIcons.Code,
  'developer': DesignIcons.Developer,
  'web': DesignIcons.Web,
  'mobile': DesignIcons.Mobile,
  'plugin': DesignIcons.Plugin,
  'data': DesignIcons.Data,
  'analytics': DesignIcons.Analytics,
  'visualization': DesignIcons.Visualization,
  'gameui': DesignIcons.gameui,
  'metaverse': DesignIcons.metaverse,
  'digital': DesignIcons.Digital,
  'system': DesignIcons.System,
  
  // ============ 商业相关 ============
  'ecommerce': DesignIcons.Ecommerce,
  'store': DesignIcons.Store,
  'marketing': DesignIcons.Marketing,
  'platform': DesignIcons.Platform,
  'livestreaming': DesignIcons.LiveStreaming,
  'banner': DesignIcons.Banner,
  'package': DesignIcons.Package,
  
  // ============ 电商相关 ============
  'layout': DesignIcons.Layout,
  'specs': DesignIcons.Specs,
  
  // ============ 室内设计 ============
  'cad': DesignIcons.CAD,
  'furniture': DesignIcons.Furniture,
  'texture': DesignIcons.Texture,
  'lighting': DesignIcons.Lighting,
  'project': DesignIcons.Project,
  'vr': DesignIcons.VR,
  
  // ============ 通用图标 ============
  'tools': DesignIcons.Tools,
  'tutorial': DesignIcons.Tutorial,
  'learn': DesignIcons.Learn,
  'blog': DesignIcons.Blog,
  'community': DesignIcons.Community,
  'book': DesignIcons.Book,
  'education': DesignIcons.Education,
  'resource': DesignIcons.Resource,
  'carui': DesignIcons.CarUI,
  'designteam': DesignIcons.DesignTeam,
  'othercontent': DesignIcons.othercontent,
  
  // ============ 兼容性映射（Heroicons/其他风格名称） ============
  'academic-cap': DesignIcons.Education,
  'briefcase': DesignIcons.Tools,
  'globe-alt': DesignIcons.Web,
  'shopping-cart': DesignIcons.Ecommerce,
  'music': DesignIcons.Audio,
  'Flag01': DesignIcons.Tools,  // Untitled UI 图标名称兼容
  'tool': IconTool,
  
  // 默认图标
  'default': IconTool
};

interface DynamicPageProps {
  slug: string;
  pageType?: NavMenuType;
}

/**
 * 动态页面组件
 */
const DynamicPage: React.FC<DynamicPageProps> = ({ slug, pageType }) => {
  // 使用 usePageData hook 获取数据
  const {
    pageConfig,
    categories,
    loading,
    error,
    getWebsitesByCategory,
    getWebsitesBySubCategory,
    getSubCategories,
    dynamicHotTags,
  } = usePageData({ slug });

  // 状态
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [searchResults, setSearchResults] = useState<Website[]>([]);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [heroScrollWebsites, setHeroScrollWebsites] = useState<{ id: string; name: string; iconUrl?: string; url: string }[]>([]);
  
  // 获取前端配置（跳转弹窗自定义文案）
  const { config: frontendConfig } = useFrontendConfig();
  const { config: permalinkConfig } = usePermalinkConfig();
  const detailNavigate = useNavigate();
  const showDirectArrow = frontendConfig?.pageGlobalConfig?.showDirectArrow ?? false;
  const websiteClickMode = frontendConfig?.pageGlobalConfig?.websiteClickMode ?? 'detail';
  const directArrowNewWindow = frontendConfig?.pageGlobalConfig?.directArrowNewWindow ?? true;
  const detailPageNewWindow = frontendConfig?.pageGlobalConfig?.detailPageNewWindow ?? false;
  const { isDirectMode, arrowLabel, arrowIsExternal } = getArrowConfigByWebsiteClickMode(websiteClickMode);

  // 直达箭头点击回调 - 与 useNavigation.ts 逻辑保持一致
  const handleDirectVisit = useCallback((tool: DirectVisitTarget, _event: React.MouseEvent) => {
    if (isDirectMode) {
      // 分类区域设置为直达时，箭头进入详情页
      const detailUrl = generateWebsiteUrl(permalinkConfig, { 
        id: tool.id, 
        slug: tool.slug 
      });
      if (detailPageNewWindow) {
        window.open(detailUrl, '_blank');
      } else {
        detailNavigate(detailUrl);
        window.scrollTo(0, 0);
      }
    } else {
      // 其他模式下，箭头直达外部网址
      const url = tool?.url;
      if (url) {
        if (directArrowNewWindow) {
          window.open(url, '_blank', 'noopener,noreferrer');
        } else {
          window.location.href = url;
        }
      }
    }
  }, [isDirectMode, directArrowNewWindow, detailPageNewWindow, permalinkConfig, detailNavigate]);

  // 获取滚动图标墙的网站数据
  useEffect(() => {
    if (pageConfig?.heroDisplayMode === 'iconScroll' && pageConfig?.heroScrollWebsites) {
      try {
        const websiteIds = JSON.parse(pageConfig.heroScrollWebsites);
        if (Array.isArray(websiteIds) && websiteIds.length > 0) {
          // 从API获取网站详情
          import('../../services/api').then(({ default: api }) => {
            api.get('/websites', { params: { ids: websiteIds.join(','), limit: 100 } })
              .then(res => {
                const rawData = unwrapApiResponse<WebsiteWithExtra[] | { websites?: WebsiteWithExtra[] }>(res.data, []);
                const websites = Array.isArray(rawData) ? rawData : (rawData.websites || []);
                // 按照配置的顺序排序，使用字符串比较确保类型匹配
                const sortedWebsites = websiteIds
                  .map((id: string | number) => websites.find((w) => String(w.id) === String(id) || String(w.oldId || '') === String(id)))
                  .filter((w): w is WebsiteWithExtra => Boolean(w && w.id && w.name && w.url))
                  .map((w) => ({
                    id: w.id,
                    name: w.name,
                    iconUrl: w.iconUrl,
                    url: w.url
                  }));
                setHeroScrollWebsites(sortedWebsites);
              })
              .catch(err => {
                console.error('获取滚动网站数据失败:', err);
              });
          });
        }
      } catch (e) {
        console.error('解析滚动网站ID失败:', e);
      }
    }
  }, [pageConfig?.heroDisplayMode, pageConfig?.heroScrollWebsites]);

  // 设置默认激活分类 - 只在首次加载且没有激活分类时设置
  useEffect(() => {
    if (categories.length > 0 && !activeCategory) {
      setActiveCategory(categories[0].id);
    }
  }, [categories, activeCategory]);

  // 导航项 - 包含子分类信息
  const navItems: NavItem[] = useMemo(() => {
    return categories.map(cat => ({
      id: cat.id,
      name: cat.name,
      count: getWebsitesByCategory(cat.id).length,
      icon: iconMap[cat.icon] || iconMap.default,
      color: cat.color,
      subcategories: cat.subCategories?.map(sub => ({
        id: sub.id,
        name: sub.name,
        count: getWebsitesBySubCategory(sub.id).length,
      })) || [],
    }));
  }, [categories, getWebsitesByCategory, getWebsitesBySubCategory]);

  // 处理导航点击
  const handleNavItemClick = useCallback((itemId: string) => {
    setActiveCategory(itemId);
    const element = document.getElementById(`category-${itemId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  // 退出搜索模式
  const handleExitSearchMode = useCallback(() => {
    setIsSearchMode(false);
    setSearchResults([]);
  }, []);

  // 处理网站点击
  const handleWebsiteClick = useCallback((website: Website) => {
    // 记录点击数据
    recordWebsiteClick(website.id);
    if (isDirectMode) {
      window.open(website.url, '_blank', 'noopener,noreferrer');
      return;
    }
    const websiteSlug = (website as WebsiteWithExtra).slug;
    const detailUrl = generateWebsiteUrl(permalinkConfig, {
      id: website.id,
      slug: websiteSlug,
    });
    if (detailPageNewWindow) {
      window.open(detailUrl, '_blank');
    } else {
      detailNavigate(detailUrl);
      window.scrollTo(0, 0);
    }
  }, [isDirectMode, permalinkConfig, detailPageNewWindow, detailNavigate]);

  // 侧边栏配置
  const sidebarConfig: SidebarConfig = {
    title: pageConfig?.name || '导航',
    type: pageType || NavMenuType.UIUX
  };
  const heroPageType = useMemo<HeroPageType>(() => {
    return resolveHeroPageType(pageType || slug);
  }, [pageType, slug]);

  // 生成主题色相关的CSS变量 - 必须在早期返回之前调用
  const themeStyle = useMemo(() => {
    if (!pageConfig?.themeColor) return undefined;
    
    const color = pageConfig.themeColor;
    // 生成浅色版本（用于背景等）
    const lightColor = `${color}15`; // 15% 透明度
    const lighterColor = `${color}08`; // 8% 透明度
    
    return {
      '--primary-color': color,
      '--primary-light': lightColor,
      '--primary-lighter': lighterColor,
      '--primary-dark': color,
      '--primary-hover': color,
      '--primary-active': color,
      // 兼容其他可能使用的变量名
      '--theme-color': color,
      '--accent-color': color,
    } as React.CSSProperties;
  }, [pageConfig?.themeColor]);

  // 加载状态 - 使用骨架屏
  if (loading) {
    return (
      <div className="home-page dynamic-page">
        {/* 骨架屏 Hero Banner */}
        <HeroBannerSkeleton />
        
        <div className="main-layout">
          {/* 骨架屏侧边栏 */}
          <CategorySidebarSkeleton count={10} />
          
          {/* 骨架屏内容区域 */}
          <main className="tools-main">
            {/* 骨架屏热门推荐 */}
            <section className="content-section">
              <div className="section-header-simple">
                <div className="skeleton" style={{ width: 150, height: 28, borderRadius: 4 }} />
              </div>
              <ToolGridSkeleton count={8} />
            </section>
            
            {/* 骨架屏分类内容 */}
            <section className="content-section">
              <div className="section-header-simple">
                <div className="skeleton" style={{ width: 120, height: 24, borderRadius: 4 }} />
              </div>
              <ToolGridSkeleton count={12} />
            </section>
          </main>
        </div>
      </div>
    );
  }

  // 错误状态
  if (error) {
    return (
      <div className="error-container" style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column'
      }}>
        <h2>加载失败</h2>
        <p>{error.message}</p>
        <button onClick={() => window.location.reload()}>重试</button>
      </div>
    );
  }

  return (
    <div 
      className="home-page dynamic-page"
      style={themeStyle}
    >
      {/* SEO优化 */}
      <SEO 
        title={pageConfig?.name || '导航'}
        description={pageConfig?.description || ''}
        keywords={pageConfig?.name || ''}
        url={`https://hao.uied.cn/${slug}`}
      />
      
      {/* 头部Hero区域 */}
      <HeroBanner 
        pageType={heroPageType}
        showStats={true}
        customTitle={pageConfig?.heroTitle}
        customDescription={pageConfig?.heroSubtitle}
        apiHotSearchTags={pageConfig?.hotSearchTags}
        dynamicHotTags={dynamicHotTags}
        searchPlaceholder={pageConfig?.searchPlaceholder}
        heroBgType={pageConfig?.heroBgType}
        heroBgValue={pageConfig?.heroBgValue}
        highlightText={pageConfig?.heroHighlightText}
        heroDisplayMode={pageConfig?.heroDisplayMode}
        heroScrollWebsites={heroScrollWebsites}
      />

      <div className={`main-layout ${pageConfig?.showSidebar === false ? 'no-sidebar' : ''}`}>
        {/* 侧边栏 - 根据配置显示或隐藏 */}
        {pageConfig?.showSidebar !== false && (
          <CategorySidebar
            config={sidebarConfig}
            navItems={navItems}
            activeItem={activeCategory}
            onItemClick={handleNavItemClick}
            isSearchMode={isSearchMode}
            searchResultsCount={searchResults.length}
            onExitSearchMode={handleExitSearchMode}
            isSticky={true}
            badgeText={pageConfig?.slug?.toUpperCase() || slug.toUpperCase()}
          />
        )}

        {/* 右侧内容区域 */}
        <main className="tools-main">
          {/* 热门推荐 - 使用 HotRecommendations 组件，与其他页面保持一致 */}
          {pageConfig?.showHotRecommendations && !isSearchMode && (
            <HotRecommendations 
              limit={12}
              title="热门推荐"
              showMoreButton={false}
              enableSubCategories={true}
              useApi={true}
              pageSlug={slug}
              onWebsiteClick={(tool) => handleWebsiteClick({
                id: tool.id,
                name: tool.name,
                description: tool.description,
                url: tool.url,
                iconUrl: tool.iconUrl,
                tags: tool.tags,
                isNew: tool.isNew || false,
                isHot: tool.isHot || false,
                isFeatured: tool.isFeatured || false
              })}
            />
          )}

          {/* WordPress 文章组件 - 根据后台配置显示 */}
          {!isSearchMode && (
            <DesignArticleGrid 
              pageSlug={slug}
              position="main"
              title="设计文章"
              limit={6}
              showMoreButton={true}
              enableSubCategories={true}
            />
          )}

          {/* 广告位 - 放在设计文章下方 */}
          {!isSearchMode && (
            <AdBanner
              pageSlug={slug}
              position="top"
              limit={1}
              commercialSlotKey="category-inline-ad"
              commercialSlotType="category_ad"
              commercialScopeType="category"
              commercialScopeValue={slug}
            />
          )}

          {/* 搜索结果 */}
          {isSearchMode && (
            <section id="search-results" className="content-section">
              <div className="section-header-simple">
                <h2>搜索结果</h2>
                <span className="resource-count">共找到 {searchResults.length} 个相关工具</span>
              </div>
              
              {searchResults.length > 0 ? (
                <div className="tools-grid">
                  {searchResults.map(website => (
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
              ) : (
                <div className="empty-result">
                  <p>没有找到相关结果，请尝试其他关键词</p>
                </div>
              )}
            </section>
          )}

          {/* 分类内容 */}
          {!isSearchMode && categories.map(category => {
            const subCategories = getSubCategories(category.id);
            const categoryWebsites = getWebsitesByCategory(category.id);
            
            // 检查子分类是否有网站
            const subCategoriesWithWebsites = subCategories.filter(
              sub => getWebsitesBySubCategory(sub.id).length > 0
            );
            const hasSubCategoryWebsites = subCategoriesWithWebsites.length > 0;
            
            return (
              <section 
                key={category.id} 
                id={`category-${category.id}`} 
                className="content-section"
              >
                <div className="section-header-simple">
                  <h2>{category.name}</h2>
                  <span className="resource-count">共 {categoryWebsites.length} 个</span>
                </div>
                
                {/* 子分类标签 - 只有当子分类有网站时才显示 */}
                {subCategories.length > 0 && hasSubCategoryWebsites && (
                  <SubCategoryTabs
                    subCategories={subCategories}
                    getWebsitesBySubCategory={getWebsitesBySubCategory}
                    onWebsiteClick={handleWebsiteClick}
                    showDirectArrow={showDirectArrow}
                    onDirectVisit={handleDirectVisit}
                    arrowLabel={arrowLabel}
                    arrowIsExternal={arrowIsExternal}
                    directArrowNewWindow={directArrowNewWindow}
                  />
                )}
                
                {/* 如果没有子分类，或者子分类都没有网站，直接显示所有网站 */}
                {(subCategories.length === 0 || !hasSubCategoryWebsites) && categoryWebsites.length > 0 && (
                  <div className="tools-grid">
                    {categoryWebsites.map(website => (
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
                )}
              </section>
            );
          })}
        </main>
      </div>
    </div>
  );
};

// 子分类标签组件
interface SubCategoryTabsProps {
  subCategories: SubCategory[];
  getWebsitesBySubCategory: (id: string) => Website[];
  onWebsiteClick: (website: Website) => void;
  showDirectArrow?: boolean;
  onDirectVisit?: (tool: DirectVisitTarget, e: React.MouseEvent) => void;
  arrowLabel?: string;
  arrowIsExternal?: boolean;
  directArrowNewWindow?: boolean;
}

const SubCategoryTabs: React.FC<SubCategoryTabsProps> = ({
  subCategories,
  getWebsitesBySubCategory,
  onWebsiteClick,
  showDirectArrow = false,
  onDirectVisit,
  arrowLabel = '直达网站',
  arrowIsExternal = true,
  directArrowNewWindow = true,
}) => {
  // 当前选中的子分类，默认选中 'all'
  const [activeSubCategory, setActiveSubCategory] = useState<string>('all');
  // 分页状态
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 12; // 每页显示12个
  
  // 获取所有子分类的网站
  const allWebsites = useMemo(() => {
    const websites: Website[] = [];
    subCategories.forEach(sub => {
      websites.push(...getWebsitesBySubCategory(sub.id));
    });
    return websites;
  }, [subCategories, getWebsitesBySubCategory]);
  
  // 当前显示的网站（未分页）
  const filteredWebsites = useMemo(() => {
    if (activeSubCategory === 'all') {
      return allWebsites;
    }
    return getWebsitesBySubCategory(activeSubCategory);
  }, [activeSubCategory, allWebsites, getWebsitesBySubCategory]);
  
  // 分页计算
  const paginationData = useMemo(() => {
    const totalItems = filteredWebsites.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const currentPageItems = filteredWebsites.slice(startIndex, endIndex);
    
    return {
      totalItems,
      totalPages,
      currentPageItems,
      hasNextPage: currentPage < totalPages,
      hasPrevPage: currentPage > 1
    };
  }, [filteredWebsites, currentPage, pageSize]);
  
  // 过滤出有网站的子分类
  const validSubCategories = useMemo(() => {
    return subCategories.filter(sub => getWebsitesBySubCategory(sub.id).length > 0);
  }, [subCategories, getWebsitesBySubCategory]);
  
  // 切换子分类时重置分页
  const handleSubCategoryChange = (subCatId: string) => {
    setActiveSubCategory(subCatId);
    setCurrentPage(1);
  };
  
  if (allWebsites.length === 0) {
    return null;
  }
  
  return (
    <div className="subcategory-section">
      {/* 子分类标签栏 - 可横向滚动 */}
      <div className="subcategory-tabs-wrapper" style={{
        marginBottom: '16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '16px',
      }}>
        <div style={{
          flex: 1,
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}>
          <div className="subcategory-tabs" style={{
            display: 'flex',
            gap: '8px',
            paddingBottom: '8px',
            minWidth: 'max-content',
          }}>
            {/* 全部标签 */}
            <button
              className={`subcategory-tab ${activeSubCategory === 'all' ? 'active' : ''}`}
              onClick={() => handleSubCategoryChange('all')}
              style={{
                padding: '6px 16px',
                borderRadius: '16px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 500,
                whiteSpace: 'nowrap',
                transition: 'all 0.2s',
                background: activeSubCategory === 'all' ? 'var(--primary-color, #1890ff)' : '#f5f5f5',
                color: activeSubCategory === 'all' ? '#fff' : '#666',
              }}
            >
              全部 ({allWebsites.length})
            </button>
            
            {/* 子分类标签 */}
            {validSubCategories.map(subCat => {
              const count = getWebsitesBySubCategory(subCat.id).length;
              const isActive = activeSubCategory === subCat.id;
              
              return (
                <button
                  key={subCat.id}
                  className={`subcategory-tab ${isActive ? 'active' : ''}`}
                  onClick={() => handleSubCategoryChange(subCat.id)}
                  style={{
                    padding: '6px 16px',
                    borderRadius: '16px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 500,
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s',
                    background: isActive ? 'var(--primary-color, #1890ff)' : '#f5f5f5',
                    color: isActive ? '#fff' : '#666',
                  }}
                >
                  {subCat.name} ({count})
                </button>
              );
            })}
          </div>
        </div>
        
        {/* 分页控制 */}
        {paginationData.totalPages > 1 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexShrink: 0,
          }}>
            <button
              onClick={() => paginationData.hasPrevPage && setCurrentPage(currentPage - 1)}
              disabled={!paginationData.hasPrevPage}
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                border: '1px solid #e8e8e8',
                background: paginationData.hasPrevPage ? '#fff' : '#f5f5f5',
                cursor: paginationData.hasPrevPage ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: paginationData.hasPrevPage ? '#333' : '#ccc',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <span style={{ fontSize: '13px', color: '#666', minWidth: '50px', textAlign: 'center' }}>
              {currentPage} / {paginationData.totalPages}
            </span>
            <button
              onClick={() => paginationData.hasNextPage && setCurrentPage(currentPage + 1)}
              disabled={!paginationData.hasNextPage}
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                border: '1px solid #e8e8e8',
                background: paginationData.hasNextPage ? '#fff' : '#f5f5f5',
                cursor: paginationData.hasNextPage ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: paginationData.hasNextPage ? '#333' : '#ccc',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        )}
      </div>
      
      {/* 网站列表 */}
      <div className="tools-grid">
        {paginationData.currentPageItems.map(website => (
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
            }}
            onClick={() => onWebsiteClick(website)}
            showDirectArrow={showDirectArrow}
            onDirectVisit={onDirectVisit}
            arrowLabel={arrowLabel}
            arrowIsExternal={arrowIsExternal}
            directArrowNewWindow={directArrowNewWindow}
          />
        ))}
      </div>
    </div>
  );
};

export default DynamicPage;
