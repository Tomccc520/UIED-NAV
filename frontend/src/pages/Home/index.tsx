/**
 * @copyright Tomda (https://www.tomda.top)
 * @copyright UIED技术团队 (https://fsuied.com)
 * @author UIED技术团队
 * @createDate 2026-02-25
 */
/**
 * @file Home/index.tsx
 * @description 首页组件 - 参考AIBase设计，包含轮播图和最新AI资讯
 * @copyright 版权所有 (c) 2025 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Banner from '../../components/Banner';
import AdBanner from '../../components/AdBanner';
import DesignArticleGrid from '../../components/DesignArticleGrid';
import { RankingListSkeleton } from '../../components/Skeleton';
import { getRankings, getRankingsAggregate } from '../../services/rankingService';
import { getDailyHotDisplayConfig } from '../../services/dailyHotService';
import { RankingBoardData, RankingPublicConfig } from '../../types/ranking';
import { DailyHotDisplayConfig } from '../../types/dailyHot';
import { useBanners } from '../../hooks/useBanners';
import { useFrontendConfig } from '../../hooks/useFrontendConfig';
import './index.css';
import './mobile.css';

// 简单的火焰图标组件
const FireIcon: React.FC<{ size?: number; className?: string }> = ({ size = 16, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M8.5 12.5L11 10L13.5 12.5L16 10V18C16 19.1046 15.1046 20 14 20H10C8.89543 20 8 19.1046 8 18V10L8.5 12.5Z" 
          fill="currentColor" opacity="0.8"/>
    <path d="M12 2C12 2 16 6 16 10C16 12.2091 14.2091 14 12 14C9.79086 14 8 12.2091 8 10C8 6 12 2 12 2Z" 
          fill="currentColor"/>
  </svg>
);

// 简单的眼睛图标组件
const EyeIcon: React.FC<{ size?: number; className?: string }> = ({ size = 16, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" 
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

interface CarouselSlide {
  id: string | number;
  title: string;
  subtitle: string;
  image: string;
  link: string;
  bannerId?: string;
}

// 轮播图默认数据（当后台未配置广告时使用）
const defaultCarouselData: CarouselSlide[] = [
  {
    id: 1,
    title: '纳米AI超级搜索智能体炸裂升级！',
    subtitle: '一键生成PPT、视频、口播稿，医学科研也能秒搜',
    image: '/carousel1.jpg',
    link: '/ai'
  },
  {
    id: 2,
    title: '加速发展:Gartner 预测生成 AI 应用',
    subtitle: '将实现50% 的交付时间缩减',
    image: '/carousel2.jpg',
    link: '/ai'
  },
  {
    id: 3,
    title: 'Match Group新研究:AI伴侣受青睐',
    subtitle: '60%认为不构成出轨',
    image: '/carousel3.jpg',
    link: '/ai'
  },
  {
    id: 4,
    title: '博世联手阿里云，AI 智能座舱技术',
    subtitle: '迈入新纪元！',
    image: '/carousel4.jpg',
    link: '/ai'
  }
];

// 榜单项目接口
interface RankingItem {
  id: string;
  name: string;
  description: string;
  url: string;
  iconUrl: string;
  viewCount: number;
  score: number;
  isNew: boolean;
  isHot: boolean;
  isFeatured: boolean;
}

/**
 * 首页组件
 * @returns 首页JSX元素
 */
const Home: React.FC = () => {
  const [articles, setArticles] = useState<RankingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [dailyHotDisplayConfig, setDailyHotDisplayConfig] = useState<DailyHotDisplayConfig | null>(null);
  const [rankingsDisplayConfig, setRankingsDisplayConfig] = useState<RankingPublicConfig | null>(null);
  const { config: frontendConfig } = useFrontendConfig();
  const { banners: homeBanners, recordClick: recordBannerClick } = useBanners({
    position: 'home',
    limit: 4,
  });
  const homepageConfig = frontendConfig.homepageConfig;
  const carouselEnabled = homepageConfig.homeCarouselEnabled !== false;
  const recommendationEnabled = homepageConfig.homeRecommendationEnabled !== false;
  const recommendationContentEnabled = homepageConfig.hotRecommendationsEnabled !== false;

  /**
   * 判断当前是否为移动端视口（仅用于展示层开关判定）
   */
  const isMobileViewport = (): boolean => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(max-width: 768px)').matches;
  };

  /**
   * 判断每日热榜入口是否允许在当前终端显示
   */
  const canShowDailyHotByDevice = useCallback((config: DailyHotDisplayConfig | null): boolean => {
    if (!config) return true;
    const mobile = isMobileViewport();
    return mobile ? config.displayMobile !== false : config.displayDesktop !== false;
  }, []);

  /**
   * 判断榜单系统入口是否允许在当前终端显示
   */
  const canShowRankingsByDevice = useCallback((config: RankingPublicConfig | null): boolean => {
    if (!config) return true;
    const mobile = isMobileViewport();
    return mobile ? config.displayMobile !== false : config.displayDesktop !== false;
  }, []);

  /**
   * 读取每日热榜公开展示配置（首页快捷入口/跳转链接）
   */
  const fetchDailyHotDisplayConfig = useCallback(async () => {
    const config = await getDailyHotDisplayConfig();
    setDailyHotDisplayConfig(config);
  }, []);

  /**
   * 读取榜单系统前台公开显示配置（用于导航快捷入口）
   */
  const fetchRankingsDisplayConfig = useCallback(async () => {
    try {
      const aggregate = await getRankingsAggregate(1);
      setRankingsDisplayConfig(aggregate.publicConfig || null);
    } catch (error) {
      console.warn('获取榜单系统公开配置失败，回退默认展示:', error);
      setRankingsDisplayConfig(null);
    }
  }, []);

  /**
   * 将后台榜单数据转换为首页推荐区结构
   */
  const mapRankingData = useCallback((data: RankingBoardData[]): RankingItem[] => {
    // 优先展示 "editor_pick" 或 "today_hot"
    const targetKey = 'editor_pick';
    const fallbackKey = 'today_hot';
    
    const board = data.find(b => b.key === targetKey) || 
                  data.find(b => b.key === fallbackKey) || 
                  data[0];

    if (!board || !board.items) return [];

    return board.items.map((item, index) => ({
      id: String(item.id),
      name: item.name,
      description: item.description,
      url: item.url,
      iconUrl: item.iconUrl || '',
      viewCount: item.viewCount || 0,
      score: item.score || 0,
      isNew: item.isNew,
      isHot: item.isHot,
      isFeatured: index < 3,
    }));
  }, []);

  /**
   * 将后台 Banner 转为首页轮播数据
   */
  const carouselData = useMemo<CarouselSlide[]>(() => {
    if (!homeBanners || homeBanners.length === 0) {
      return defaultCarouselData;
    }
    return homeBanners.map((banner, index) => ({
      id: banner.id || `banner-${index}`,
      title: banner.title || `推荐内容 ${index + 1}`,
      subtitle: banner.description || '精选推荐内容',
      image: banner.imageUrl || '',
      link: banner.linkUrl || '/ai',
      bannerId: banner.id,
    }));
  }, [homeBanners]);

  /**
   * 计算首页顶部模块展示顺序。
   */
  const topModules = useMemo<Array<'carousel' | 'recommendation'>>(() => {
    const modules = [
      { key: 'carousel' as const, enabled: carouselEnabled, sort: Number(homepageConfig.homeCarouselSort || 10) },
      { key: 'recommendation' as const, enabled: recommendationEnabled, sort: Number(homepageConfig.homeRecommendationSort || 20) },
    ];
    return modules
      .filter((module) => module.enabled)
      .sort((a, b) => a.sort - b.sort)
      .map((module) => module.key);
  }, [
    carouselEnabled,
    recommendationEnabled,
    homepageConfig.homeCarouselSort,
    homepageConfig.homeRecommendationSort,
  ]);

  /**
   * 获取最新榜单数据
   */
  const fetchRankings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await getRankings();
      const mappedItems = mapRankingData(data);
      
      if (mappedItems.length > 0) {
        setArticles(mappedItems);
      } else {
        setError('暂无推荐数据');
        setArticles([]);
      }
    } catch (err) {
      console.error('获取榜单数据失败:', err);
      setError('获取数据失败，请稍后重试');
      setArticles([]);
    } finally {
      setLoading(false);
    }
  }, [mapRankingData]);

  /**
   * 处理文章点击
   */
  const handleArticleClick = (item: RankingItem) => {
    if (item.url) {
      window.open(item.url, '_blank', 'noopener,noreferrer');
    }
  };

  /**
   * 处理轮播图点击
   */
  const handleSlideClick = (slide: CarouselSlide) => {
    if (slide.bannerId) {
      recordBannerClick(slide.bannerId).catch(() => {});
    }
    if (slide.link) {
      window.open(slide.link, '_blank', 'noopener,noreferrer');
    }
  };

  /**
   * 重试获取数据
   */
  const handleRetry = () => {
    fetchRankings();
  };

  // 推荐区开启时才请求内容
  useEffect(() => {
    if (!recommendationEnabled || !recommendationContentEnabled) {
      setLoading(false);
      setError(null);
      setArticles([]);
      return;
    }
    fetchRankings();
  }, [fetchRankings, recommendationEnabled, recommendationContentEnabled]);

  // 读取每日热榜前台展示配置（失败时服务层会回退默认值）
  useEffect(() => {
    fetchDailyHotDisplayConfig();
  }, [fetchDailyHotDisplayConfig]);

  // 读取榜单系统前台入口配置（失败时使用默认值）
  useEffect(() => {
    fetchRankingsDisplayConfig();
  }, [fetchRankingsDisplayConfig]);

  // 当轮播数据源变化时，保证当前索引不越界
  useEffect(() => {
    if (currentSlide >= carouselData.length) {
      setCurrentSlide(0);
    }
  }, [carouselData.length, currentSlide]);

  // 轮播图自动切换
  useEffect(() => {
    if (!carouselEnabled || carouselData.length === 0) {
      return undefined;
    }
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselData.length);
    }, 4000);

    return () => clearInterval(timer);
  }, [carouselData.length, carouselEnabled]);

  /**
   * 首页“全网热榜”快捷入口是否显示
   */
  const showDailyHotQuickEntry = useMemo(() => {
    if (!dailyHotDisplayConfig || dailyHotDisplayConfig.enabled === false) return false;
    if (!canShowDailyHotByDevice(dailyHotDisplayConfig)) return false;
    return Array.isArray(dailyHotDisplayConfig.displayPlacements)
      && dailyHotDisplayConfig.displayPlacements.includes('nav_quick_entry');
  }, [canShowDailyHotByDevice, dailyHotDisplayConfig]);

  /**
   * 首页推荐区右上角“热榜入口”是否显示
   */
  const showDailyHotRankingLink = useMemo(() => {
    if (!dailyHotDisplayConfig) return true;
    if (dailyHotDisplayConfig.enabled === false) return false;
    return canShowDailyHotByDevice(dailyHotDisplayConfig);
  }, [canShowDailyHotByDevice, dailyHotDisplayConfig]);

  /**
   * 获取首页内使用的每日热榜入口文案与链接配置
   */
  const dailyHotEntryView = useMemo(() => {
    const fallback = {
      label: '全网热榜',
      href: '/p/daily-hot',
      target: '_self' as '_self' | '_blank',
      rel: undefined as string | undefined,
    };
    if (!dailyHotDisplayConfig || dailyHotDisplayConfig.enabled === false) return fallback;

    const href = String(dailyHotDisplayConfig.displayPath || fallback.href).trim() || fallback.href;
    const label = String(dailyHotDisplayConfig.displayLabel || fallback.label).trim() || fallback.label;
    const newTab = dailyHotDisplayConfig.displayOpenInNewTab === true;
    return {
      label,
      href,
      target: newTab ? '_blank' as const : '_self' as const,
      rel: newTab ? 'noopener noreferrer' : undefined,
    };
  }, [dailyHotDisplayConfig]);

  /**
   * 首页“榜单系统”快捷入口是否显示
   */
  const showRankingsQuickEntry = useMemo(() => {
    if (!rankingsDisplayConfig || rankingsDisplayConfig.enabled === false) return false;
    if (!canShowRankingsByDevice(rankingsDisplayConfig)) return false;
    return Array.isArray(rankingsDisplayConfig.displayPlacements)
      && rankingsDisplayConfig.displayPlacements.includes('nav_quick_entry');
  }, [canShowRankingsByDevice, rankingsDisplayConfig]);

  /**
   * 获取首页内使用的榜单系统入口文案与链接配置
   */
  const rankingsEntryView = useMemo(() => {
    const fallback = {
      label: '榜单系统',
      href: '/p/rankings',
      target: '_self' as '_self' | '_blank',
      rel: undefined as string | undefined,
    };
    if (!rankingsDisplayConfig || rankingsDisplayConfig.enabled === false) return fallback;
    const href = String(rankingsDisplayConfig.displayPath || fallback.href).trim() || fallback.href;
    const label = String(rankingsDisplayConfig.displayLabel || fallback.label).trim() || fallback.label;
    const newTab = rankingsDisplayConfig.displayOpenInNewTab === true;
    return {
      label,
      href,
      target: newTab ? '_blank' as const : '_self' as const,
      rel: newTab ? 'noopener noreferrer' : undefined,
    };
  }, [rankingsDisplayConfig]);

  // 渲染排行榜项目（参考AntRankingPage设计）
  const renderRankingItem = (item: RankingItem, index: number) => {
    return (
      <div 
        key={item.id} 
        className="ranking-item"
        onClick={() => handleArticleClick(item)}
      >
        <div className={`rank-number-container rank-number-${index < 3 ? index + 1 : 'other'}`}>
          <span className="rank-number">{index + 1}</span>
        </div>
        
        <div className="ranking-item-content">
          <div className="ranking-item-title">
            {item.name}
            {item.isNew && <span className="new-tag">新</span>}
            {item.isHot && <span className="hot-tag">热</span>}
          </div>
          
          <div className="ranking-item-meta">
            <span className="ranking-item-views">
              <EyeIcon size={12} />
              {item.viewCount || 0}
            </span>
            <span className="ranking-item-score">
              <FireIcon size={12} />
              {Math.floor(item.score || 0)}°
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="home-container">
      {(showDailyHotQuickEntry || showRankingsQuickEntry) && (
        <div className="home-quick-entry">
          {showDailyHotQuickEntry && (
            <a
              className="home-quick-entry-link"
              href={dailyHotEntryView.href}
              target={dailyHotEntryView.target}
              rel={dailyHotEntryView.rel}
            >
              {dailyHotEntryView.label}
            </a>
          )}
          {showRankingsQuickEntry && (
            <a
              className="home-quick-entry-link home-quick-entry-link--rankings"
              href={rankingsEntryView.href}
              target={rankingsEntryView.target}
              rel={rankingsEntryView.rel}
            >
              {rankingsEntryView.label}
            </a>
          )}
        </div>
      )}
      {/* 顶部区域：按后台排序渲染轮播和推荐模块 */}
      {topModules.length > 0 && (
        <div className="home-top-section">
          {topModules.map((moduleKey) => {
            if (moduleKey === 'carousel') {
              return (
                <div className="home-carousel-section" key="carousel">
                  <div className="carousel-container">
                    <div className="carousel-wrapper">
                      {carouselData.map((slide, index) => (
                        <div
                          key={slide.id}
                          className={`carousel-slide ${index === currentSlide ? 'active' : ''}`}
                          onClick={() => handleSlideClick(slide)}
                        >
                          <div className="slide-content">
                            <h3 className="slide-title">{slide.title}</h3>
                            <p className="slide-subtitle">{slide.subtitle}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* 轮播指示器 */}
                    <div className="carousel-indicators">
                      {carouselData.map((_, index) => (
                        <button
                          key={index}
                          className={`indicator ${index === currentSlide ? 'active' : ''}`}
                          onClick={() => setCurrentSlide(index)}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div className="home-ranking-section" key="recommendation">
                <div className="ranking-header">
                  <h2 className="ranking-title">
                    {homepageConfig.hotRecommendationsTitle || '最新文章'}
                  </h2>
                  {showDailyHotRankingLink && (
                    <a
                      className="ranking-link"
                      href={dailyHotEntryView.href}
                      target={dailyHotEntryView.target}
                      rel={dailyHotEntryView.rel}
                    >
                      {dailyHotEntryView.label}
                    </a>
                  )}
                </div>

                <div className="ranking-content">
                  {!recommendationContentEnabled ? (
                    <div className="ranking-error">
                      <div className="error-message">推荐内容已在后台关闭</div>
                    </div>
                  ) : loading ? (
                    <RankingListSkeleton count={10} />
                  ) : error ? (
                    <div className="ranking-error">
                      <div className="error-icon">⚠️</div>
                      <div className="error-message">{error}</div>
                      <button className="retry-button" onClick={handleRetry}>
                        重新加载
                      </button>
                    </div>
                  ) : (
                    <div className="ranking-list">
                      {articles.map((article, index) => renderRankingItem(article, index))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 中间：Banner区域 */}
      <div className="home-banner-section">
        <AdBanner pageSlug="home" position="top" className="home-banner-section__ad" />
        <Banner useBackend={false} />
      </div>

      {/* 下方：设计文章网格 */}
      <div className="home-design-section">
        <DesignArticleGrid 
          title="热门设计文章"
          limit={6}
          useMock={false}
          enableSubCategories={true}
          defaultSubCategory="UI"
          showMoreButton={true}
          moreButtonLink="/uiux"
          pageSlug="home"
          position="main"
        />
      </div>

    </div>
  );
};

export default Home; 
