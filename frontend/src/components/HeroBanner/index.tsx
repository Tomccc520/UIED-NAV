/**
 * @file HeroBanner/index.tsx
 * @description 首页横幅组件 - 包含滚动图标背景，支持旧版本接口兼容，集成AI搜索
 * @copyright 版权所有 (c) 2025 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 2.1.0 - 添加AI搜索按钮
 */

import React, { useState, useEffect } from 'react';
import { useAISearch } from '../../hooks/useAISearch';
import api from '../../services/api';
import { unwrapApiResponse } from '../../utils/apiResponse';
import './index.css';
import './index.mobile.css'; // 引入独立的移动端样式

// 旧版本接口兼容
interface HeroBannerProps {
  title?: string;
  subtitle?: string;
  totalCount?: number;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  hotTags?: string[];
  onTagClick?: (tag: string) => void;
  searchPlaceholder?: string;
  searchPageType?: string;
  // 新增：页面特定配置
  pageType?: 'home' | 'ai' | 'uiux' | 'design' | 'search' | 'threed' | 'ecommerce' | 'interior' | 'font';
  customTitle?: string;
  customDescription?: string;
  showStats?: boolean;
  // 新增：从API获取的热门搜索标签（字符串或数组）
  apiHotSearchTags?: string | string[];
  // 新增：动态热门标签（按点击量排序）
  dynamicHotTags?: string[];
  // 新增：背景配置
  heroBgType?: string;  // default, color, gradient, image
  heroBgValue?: string; // 背景值
  // 新增：高亮文本配置
  highlightText?: string; // 高亮显示的文本
  // 新增：显示模式配置
  heroDisplayMode?: string; // search, iconScroll
  heroScrollWebsites?: { id: string; name: string; iconUrl?: string; url: string }[]; // 滚动图标的网站列表
}



/**
 * 首页横幅组件 - 兼容旧版本接口
 */
const HeroBanner: React.FC<HeroBannerProps> = ({
  title,
  subtitle,
  totalCount,
  searchValue,
  onSearchChange,
  hotTags,
  onTagClick,
  searchPlaceholder = "搜索网站名称...",
  searchPageType = '',
  pageType = 'home',
  customTitle,
  customDescription,
  showStats = true,
  apiHotSearchTags,
  dynamicHotTags,
  heroBgType,
  heroBgValue,
  highlightText,
  heroDisplayMode = 'search',
  heroScrollWebsites = [],
}) => {
  // 如果没有传入props，使用默认的新版本样式
  const isNewVersion = !title && !subtitle;

  // 网站收录数量统计
  const [websiteCount, setWebsiteCount] = useState(0);
  const [pageTitle, setPageTitle] = useState('');
  const [pageDescription, setPageDescription] = useState('');
  
  // AI 搜索状态（用于显示加载状态）
  const { loading: aiLoading } = useAISearch();
  
  // 根据页面类型从API获取数量和设置内容
  useEffect(() => {
    const fetchStats = async () => {
      try {
        let title = '';
        let description = '';
        
        // 设置页面标题和描述
        switch (pageType) {
          case 'ai':
            title = customTitle || '发现强大的AI工具';
            description = customDescription || '聚合国内外AI精选内容，探索AI技术前沿与应用';
            break;
          case 'uiux':
            title = customTitle || '发现专业UI/UX工具';
            description = customDescription || '精选UI/UX设计师必备工具与资源，提升设计效率与创意灵感';
            break;
          case 'design':
            title = customTitle || '发现优质设计资源';
            description = customDescription || '汇聚全球优质设计网站与资源，为设计师提供无限创意灵感';
            break;
          case 'threed':
            title = customTitle || '发现专业3D工具';
            description = customDescription || '精选3D建模、渲染、动画等专业工具，助力三维设计创作';
            break;
          case 'ecommerce':
            title = customTitle || '发现电商设计工具';
            description = customDescription || '专业电商设计工具与资源，助力电商视觉营销与品牌建设';
            break;
          case 'interior':
            title = customTitle || '发现室内设计工具';
            description = customDescription || '专业室内设计软件与资源，打造理想空间设计方案';
            break;
          case 'font':
            title = customTitle || '发现优质字体资源';
            description = customDescription || '精选字体资源、字体工具与字体设计软件，助力字体设计创作';
            break;
          case 'search':
            title = customTitle || '全站搜索';
            description = customDescription || '搜索全站工具与资源，快速找到您需要的内容';
            break;
          default:
            title = customTitle || '发现全世界最前沿的AI产品';
            description = customDescription || '为UI/UX设计师精心收集的AI工具导航，助力设计创新与效率提升';
        }
        
        setPageTitle(title);
        setPageDescription(description);
        
        // 从API获取网站总数
        const slug = pageType === 'threed' ? '3d' : pageType;
        if (slug && slug !== 'home' && slug !== 'search') {
          try {
            const response = await api.get(`/pages/${slug}/stats`);
            const stats = unwrapApiResponse<{ totalWebsites?: number }>(response.data, {});
            if (stats.totalWebsites) {
              setWebsiteCount(stats.totalWebsites);
              return;
            }
          } catch (e) {
            // 单页面统计失败，尝试获取全站统计
          }
        }
        
        // 获取全站统计
        try {
          const response = await api.get('/websites', { params: { pageSize: 1 } });
          const payload = unwrapApiResponse<{ pagination?: { total?: number }; websites?: unknown[] }>(
            response.data,
            {}
          );
          const total = Number(payload?.pagination?.total || 0);
          if (total > 0) {
            setWebsiteCount(total);
          } else {
            setWebsiteCount(2000); // 默认值
          }
        } catch (e) {
          setWebsiteCount(2000); // 默认值
        }
      } catch (error) {
        console.error('获取统计数据失败:', error);
        setWebsiteCount(2000);
        setPageTitle(customTitle || '发现优质工具');
        setPageDescription(customDescription || '精选优质工具与资源导航');
      }
    };
    
    fetchStats();
  }, [pageType, customTitle, customDescription]);

  // 处理subtitle中的数字替换，支持HTML内容
  const processedSubtitle = subtitle ? subtitle.replace(
    /{count}/g, 
    totalCount ? totalCount.toLocaleString() : '0'
  ) : '';

  /**
   * 处理搜索
   */
  const handleSearch = (keyword: string) => {
    if (!keyword.trim()) return;
    
    // 新版本默认跳转到搜索页面
    if (isNewVersion) {
      window.location.href = `/search?q=${encodeURIComponent(keyword.trim())}`;
      return;
    }
    
    // 旧版本使用回调
    if (onSearchChange) {
      onSearchChange(keyword);
    }
  };

  /**
   * 处理回车键搜索
   */
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      const target = e.target as HTMLInputElement;
      handleSearch(target.value);
    }
  };

  /**
   * 处理热门标签点击
   */
  const handleTagClick = (tag: string) => {
    if (isNewVersion) {
      window.location.href = `/search?q=${encodeURIComponent(tag)}`;
      return;
    }
    
    if (onSearchChange) {
      onSearchChange(tag);
    }
    if (onTagClick) {
      onTagClick(tag);
    }
  };

  // 根据页面类型设置不同的热门搜索标签
  const getHotTags = () => {
    switch (pageType) {
      case 'ai':
        return [
          "即梦AI", "通义千问", "智谱清言", "文心一格", 
          "讯飞星火", "豆包", "月之暗面", "6pen Art", "意间AI"
        ];
      case 'uiux':
        return [
          "Figma", "蓝湖", "Figma插件", "Sketch", 
          "Axure", "UIED", "稿定设计"
        ];
      case 'design':
        return [
          "站酷", "平面灵感", "花瓣网", "UIED", "海报", 
          "设计灵感", "古田路9号", "堆糖"
        ];
      case 'threed':
        return [
          "3ds Max", "Maya", "Blender", "SketchUp", "KeyShot", 
          "V-Ray", "Corona", "Lumion", "Enscape"
        ];
      case 'ecommerce':
        return [
          "淘宝美工", "电商设计", "产品摄影", "详情页", "主图设计", 
          "店铺装修", "营销素材", "包装设计", "千牛设计"
        ];
      case 'interior':
        return [
          "SketchUp", "3ds Max", "AutoCAD", "V-Ray", "Lumion", 
          "Enscape", "室内设计", "家装设计", "效果图"
        ];
      case 'font':
        return [
          "中文字体", "英文字体", "免费商用字体", 
          "思源字体", "苹方"
        ];
      case 'search':
        return [
          "AI工具", "设计资源", "UI组件", "图标库", "字体", 
          "配色", "原型工具", "代码生成", "设计系统"
        ];
      default: // home
        return [
          "文心一言", "文心一格", "即时设计", "飞书", "智谱清言", 
          "6pen Art", "创客贴", "美图秀秀", "MasterGo"
        ];
    }
  };

  // 处理热门标签 - 支持字符串和数组两种格式
  const parseApiHotSearchTags = () => {
    if (!apiHotSearchTags) return null;
    // 如果是数组，直接返回
    if (Array.isArray(apiHotSearchTags)) {
      return apiHotSearchTags.filter(t => t);
    }
    // 如果是字符串，按逗号分割
    if (typeof apiHotSearchTags === 'string') {
      return apiHotSearchTags.split(',').map(t => t.trim()).filter(t => t);
    }
    return null;
  };

  // 热门标签优先级：
  // 1. 传入的 hotTags（旧版本兼容）
  // 2. 动态热门标签（按点击量排序，如果有的话）
  // 3. API 配置的热门标签（后台配置）
  // 4. 默认的静态标签
  const currentHotTags = hotTags || 
    (dynamicHotTags && dynamicHotTags.length > 0 ? dynamicHotTags : null) ||
    parseApiHotSearchTags() || 
    getHotTags();

  // 根据页面类型添加主题类名
  const getThemeClass = () => {
    switch (pageType) {
      case 'ai':
        return 'ai-theme';
      case 'uiux':
        return 'uiux-theme';
      case 'threed':
        return 'threed-theme';
      case 'ecommerce':
        return 'ecommerce-theme';
      case 'interior':
        return 'interior-theme';
      case 'design':
        return 'design-theme';
      default:
        return '';
    }
  };

  // 计算背景样式
  const getBackgroundStyle = (): React.CSSProperties => {
    // 如果指定了图片背景
    if (heroBgType === 'image' && heroBgValue) {
      return {
        backgroundImage: `url(${heroBgValue})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      };
    }
    
    // 如果指定了纯色背景
    if (heroBgType === 'color' && heroBgValue) {
      return { background: heroBgValue };
    }
    
    // 如果指定了渐变背景
    if (heroBgType === 'gradient' && heroBgValue) {
      return { background: heroBgValue };
    }
    
    // 默认使用 /bg.jpg 作为背景图片
    return {
      backgroundImage: 'url(/bg.jpg)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
    };
  };

  return (
    <div 
      className={`hero-banner ${isNewVersion ? 'hero-banner-new' : 'hero-banner-legacy'} ${getThemeClass()}`}
      style={getBackgroundStyle()}
    >
      {/* 滚动图标墙 - 放在最上方 */}
      {heroDisplayMode === 'iconScroll' && heroScrollWebsites.length > 0 && (
        <div className="hero-icon-scroll">
          {[0, 1].map(rowIndex => {
            // 将网站分成2排
            const rowWebsites = heroScrollWebsites.filter((_, i) => i % 2 === rowIndex);
            // 复制多份用于无缝滚动
            const duplicatedWebsites = [...rowWebsites, ...rowWebsites, ...rowWebsites];
            
            return (
              <div 
                key={rowIndex} 
                className={`icon-scroll-row row-${rowIndex}`}
              >
                {duplicatedWebsites.map((website, index) => {
                  // 如果没有 iconUrl，使用 favicon API 生成
                  const iconSrc = website.iconUrl || 
                    `https://t3.gstatic.cn/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&size=128&url=${encodeURIComponent(website.url)}`;
                  
                  return (
                    <a
                      key={`${website.id}-${index}`}
                      href={website.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="icon-scroll-item"
                      title={website.name}
                    >
                      <img 
                        src={iconSrc} 
                        alt={website.name}
                        onError={(e) => {
                          // 图标加载失败时显示首字母占位符
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const placeholder = target.nextElementSibling as HTMLElement;
                          if (placeholder) placeholder.style.display = 'flex';
                        }}
                      />
                      <div className="icon-placeholder">
                        {website.name.charAt(0)}
                      </div>
                    </a>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      {/* 主要内容 */}
      <div className="hero-content">
        {isNewVersion ? (
          // 新版本样式
          <div className="hero-text">
            <h1 className="hero-title">
              {highlightText ? (
                // 如果有自定义高亮文本，使用customTitle并高亮指定文本
                <>
                  {customTitle?.split(highlightText)[0]}
                  <span className="highlight-text">{highlightText}</span>
                  {customTitle?.split(highlightText)[1] || ''}
                </>
              ) : pageType === 'ai' ? (
                <>
                  发现强大的<span className="highlight-text">AI工具</span>
                </>
              ) : pageType === 'uiux' ? (
                <>
                  发现专业<span className="highlight-text">UI/UX工具</span>
                </>
              ) : pageType === 'threed' ? (
                <>
                  发现顶级<span className="highlight-text">3D设计工具</span>
                </>
              ) : pageType === 'ecommerce' ? (
                <>
                  发现优质<span className="highlight-text">电商设计工具</span>
                </>
              ) : pageType === 'interior' ? (
                <>
                  发现专业<span className="highlight-text">室内设计工具</span>
                </>
              ) : pageType === 'design' ? (
                <>
                  发现精选<span className="highlight-text">平面设计资源</span>
                </>
              ) : pageTitle.includes('AI产品') ? (
                <>
                  发现全世界最前沿的
                  <span className="highlight-text">AI产品</span>
                </>
              ) : (
                pageTitle
              )}
            </h1>
            <p className="hero-description">
              {pageDescription}
            </p>
            
            {/* 网站收录数量统计 */}
            {showStats && (
              <div className="website-stats">
                <span className="stats-text">当前已收录</span>
                <span className="stats-number">{websiteCount.toLocaleString()}+</span>
                <span className="stats-text">个优质{pageType === 'ai' ? 'AI工具' : pageType === 'uiux' ? 'UI/UX工具' : pageType === 'design' ? '设计资源' : pageType === 'threed' ? '3D工具' : pageType === 'ecommerce' ? '电商设计工具' : pageType === 'interior' ? '室内设计工具' : '网站'}</span>
              </div>
            )}
            
            {/* 搜索框 */}
            <div className="hero-search-modern">
              <div className="search-container">
                <div className="search-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"/>
                    <path d="m21 21-4.35-4.35"/>
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder={searchPlaceholder}
                  onKeyPress={handleKeyPress}
                  className="search-input"
                  id="hero-search-input"
                />
                {/* AI 搜索按钮 */}
                <button 
                  type="button"
                  className={`ai-search-btn ${aiLoading ? 'loading' : ''}`}
                  disabled={aiLoading}
                  onClick={() => {
                    const input = document.getElementById('hero-search-input') as HTMLInputElement;
                    const query = input?.value?.trim() || '';
                    if (query) {
                      window.location.href = `/search?q=${encodeURIComponent(query)}&ai=1`;
                    }
                  }}
                >
                  <svg height="18" width="18" fill="currentColor" viewBox="0 0 24 24" className="sparkle">
                    <path d="M10,21.236,6.755,14.745.264,11.5,6.755,8.255,10,1.764l3.245,6.491L19.736,11.5l-6.491,3.245ZM18,21l1.5,3L21,21l3-1.5L21,18l-1.5-3L18,18l-3,1.5ZM19.333,4.667,20.5,7l1.167-2.333L24,3.5,21.667,2.333,20.5,0,19.333,2.333,17,3.5Z"></path>
                  </svg>
                  <span className="text">{aiLoading ? '搜索中...' : 'AI 搜索'}</span>
                </button>
              </div>
            </div>

            {/* 热门搜索标签 */}
            <div className="hot-tags-modern">
              <span className="tags-label">热门搜索：</span>
              <div className="tags-list">
                {currentHotTags.slice(0, 6).map((tag, index) => (
                  <button
                    key={index}
                    className="tag-btn"
                    onClick={() => handleTagClick(tag)}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          // 旧版本兼容样式
          <div className="hero-legacy-content">
            <h1 
              className="hero-title"
              dangerouslySetInnerHTML={{ __html: title || '' }}
            />
            <p 
              className="hero-subtitle"
              dangerouslySetInnerHTML={{ __html: processedSubtitle }}
            />
            
            {/* 搜索框 */}
            {onSearchChange && (
              <div className="hero-search">
                <div className="hero-search-input">
                  <div className="search-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="8"/>
                      <path d="m21 21-4.35-4.35"/>
                    </svg>
                  </div>
                  <input
                    placeholder={searchPlaceholder}
                    value={searchValue || ''}
                    onChange={(e) => onSearchChange(e.target.value)}
                    onKeyPress={handleKeyPress}
                  />
                  <button 
                    className="search-button"
                    onClick={() => handleSearch(searchValue || '')}
                  >
                    搜索
                  </button>
                </div>
              </div>
            )}

            {/* 热门搜索标签 */}
            {hotTags && hotTags.length > 0 && (
              <div className="hot-search-tags">
                <span className="tag-label">热门搜索：</span>
                {hotTags.map((tag, index) => (
                  <button
                    key={index}
                    className="tag-item"
                    onClick={() => handleTagClick(tag)}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default HeroBanner; 
