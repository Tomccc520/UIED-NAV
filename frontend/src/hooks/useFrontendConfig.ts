/**
 * @file useFrontendConfig.ts
 * @description 前端功能配置 Hook - 获取后台配置的功能开关
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 2.0.0
 */

import { useState, useEffect, useCallback } from 'react';
import publicSettingService from '../services/publicSettingService';
import {
  normalizeWebsiteClickMode,
  normalizeHotRecommendationClickMode,
} from '../utils/clickMode';
import { DEFAULT_NAV_SWITCH_ITEMS } from '../config/navModel';

// ==================== 接口定义 ====================

interface PageOverrideConfig {
  enabled?: boolean;
  title?: string;
  description?: string;
}

interface ExitModalConfig {
  enabled: boolean;
  title: string;
  description: string;
  confirmText: string;
  cancelText: string;
  showReport: boolean;
  reportText: string;
  autoRedirect?: boolean;
  autoRedirectSeconds?: number;
  openInNewWindow?: boolean;
  showAd?: boolean;
  adCode?: string;
  adPosition?: 'top' | 'bottom';
  logo?: string;
  showAgreementLinks?: boolean;
  userAgreementText?: string;
  userAgreementUrl?: string;
  copyrightAgreementText?: string;
  copyrightAgreementUrl?: string;
  hotRecommendationsEnabled?: boolean;
  pageOverrides?: { [pageSlug: string]: PageOverrideConfig };
}

interface PageGlobalConfig {
  defaultLayout: 'grid' | 'list';
  gridColumns: number;
  showSidebar: boolean;
  sidebarPosition: 'left' | 'right';
  cardStyle: 'default' | 'compact' | 'detailed';
  showCardTags: boolean;
  showCardDescription: boolean;
  maxDescriptionLines: number;
  defaultPageSize: number;
  showPagination: boolean;
  showSearch: boolean;
  searchPlaceholder: string;
  defaultThemeColor: string;
  enableDarkMode: boolean;
  websiteClickMode: 'detail' | 'direct';
  detailPageNewWindow?: boolean;
  showDirectArrow?: boolean;
  directArrowNewWindow?: boolean;
  hotRecommendationClickMode?: 'detail' | 'direct'; // 热门推荐独立配置
}

/** 外观配置 */
interface AppearanceConfig {
  primaryColor: string;
  backgroundColor: string;
  cardBackgroundColor: string;
  textPrimaryColor: string;
  fontFamily: string;
  baseFontSize: number;
  borderRadius: number;
  contentMaxWidth: number;
  customCss: string;
}

/** 首页配置 */
interface HomepageConfig {
  heroBannerEnabled: boolean;
  heroBgType: 'default' | 'color' | 'gradient' | 'image';
  heroBgValue: string;
  heroDisplayMode: 'search' | 'iconScroll';
  heroShowStats: boolean;
  heroShowHotTags: boolean;
  bannerCardsEnabled: boolean;
  hotRecommendationsEnabled: boolean;
  hotRecommendationsTitle: string;
  topAdEnabled: boolean;
  topAdCode: string;
  homeCarouselEnabled: boolean;
  homeCarouselSort: number;
  homeRecommendationEnabled: boolean;
  homeRecommendationSort: number;
  navSwitchItems: Array<{
    slug: string;
    name: string;
    icon: string;
    visible: boolean;
    sort: number;
  }>;
}

/** 卡片样式配置 */
interface CardStyleConfig {
  defaultLayout: 'grid' | 'list';
  gridColumns: number;
  showDescription: boolean;
  maxDescriptionLines: number;
  showTags: boolean;
  showFavicon: boolean;
  showUrl: boolean;
  hoverEffect: 'translateUp' | 'borderOnly' | 'shadow' | 'none';
}

/** 侧边栏配置 */
interface SidebarConfig {
  enabled: boolean;
  position: 'left' | 'right';
  width: number;
  showCategories: boolean;
  showCategoryCount: boolean;
  expandSubCategories: boolean;
  sticky: boolean;
}

/** 搜索配置 */
interface SearchConfig {
  placeholder: string;
  debounceDelay: number;
  aiSearchEnabled: boolean;
  aiSearchBtnText: string;
  highlightKeyword: boolean;
  resultsPerPage: number;
}

interface FrontendConfig {
  exitModalEnabled: boolean;
  exitModalConfig: ExitModalConfig;
  pageGlobalConfig: PageGlobalConfig;
  appearanceConfig: AppearanceConfig;
  homepageConfig: HomepageConfig;
  cardStyleConfig: CardStyleConfig;
  sidebarConfig: SidebarConfig;
  searchConfig: SearchConfig;
}

interface FrontendConfigData {
  exitModalEnabled?: boolean;
  exitModalConfig?: Partial<ExitModalConfig>;
  pageGlobalConfig?: Partial<PageGlobalConfig>;
  appearanceConfig?: Partial<AppearanceConfig>;
  homepageConfig?: Partial<HomepageConfig>;
  cardStyleConfig?: Partial<CardStyleConfig>;
  sidebarConfig?: Partial<SidebarConfig>;
  searchConfig?: Partial<SearchConfig>;
}

// ==================== 默认值 ====================

const defaultExitModalConfig: ExitModalConfig = {
  enabled: false,
  title: '即将离开本站',
  description: '您即将访问第三方网站，请注意保护个人信息安全。',
  confirmText: '继续访问',
  cancelText: '返回',
  showReport: true,
  reportText: '举报此链接',
  autoRedirect: false,
  autoRedirectSeconds: 5,
  openInNewWindow: true,
  showAd: false,
  adCode: '',
  adPosition: 'bottom',
  logo: '',
  showAgreementLinks: false,
  userAgreementText: '',
  userAgreementUrl: '',
  copyrightAgreementText: '',
  copyrightAgreementUrl: '',
  hotRecommendationsEnabled: true,
};

const defaultPageGlobalConfig: PageGlobalConfig = {
  defaultLayout: 'grid',
  gridColumns: 4,
  showSidebar: true,
  sidebarPosition: 'left',
  cardStyle: 'default',
  showCardTags: true,
  showCardDescription: true,
  maxDescriptionLines: 2,
  defaultPageSize: 20,
  showPagination: true,
  showSearch: true,
  searchPlaceholder: '搜索工具...',
  defaultThemeColor: '#2563EB',
  enableDarkMode: false,
  websiteClickMode: 'detail',
  detailPageNewWindow: false,
  showDirectArrow: false,
  directArrowNewWindow: true,
  hotRecommendationClickMode: 'detail', // 热门推荐默认跳转详情页
};

const defaultAppearanceConfig: AppearanceConfig = {
  primaryColor: '#0066ff',
  backgroundColor: '#f6f8fb',
  cardBackgroundColor: '#ffffff',
  textPrimaryColor: '#333333',
  fontFamily: '',
  baseFontSize: 16,
  borderRadius: 12,
  contentMaxWidth: 1200,
  customCss: '',
};

const defaultHomepageConfig: HomepageConfig = {
  heroBannerEnabled: true,
  heroBgType: 'default',
  heroBgValue: '',
  heroDisplayMode: 'search',
  heroShowStats: true,
  heroShowHotTags: true,
  bannerCardsEnabled: true,
  hotRecommendationsEnabled: true,
  hotRecommendationsTitle: '热门推荐',
  topAdEnabled: false,
  topAdCode: '',
  homeCarouselEnabled: true,
  homeCarouselSort: 10,
  homeRecommendationEnabled: true,
  homeRecommendationSort: 20,
  navSwitchItems: [...DEFAULT_NAV_SWITCH_ITEMS],
};

const defaultCardStyleConfig: CardStyleConfig = {
  defaultLayout: 'grid',
  gridColumns: 4,
  showDescription: true,
  maxDescriptionLines: 2,
  showTags: true,
  showFavicon: true,
  showUrl: false,
  hoverEffect: 'translateUp',
};

const defaultSidebarConfig: SidebarConfig = {
  enabled: true,
  position: 'left',
  width: 240,
  showCategories: true,
  showCategoryCount: true,
  expandSubCategories: false,
  sticky: true,
};

const defaultSearchConfig: SearchConfig = {
  placeholder: '搜索网站名称...',
  debounceDelay: 300,
  aiSearchEnabled: true,
  aiSearchBtnText: 'AI 搜索',
  highlightKeyword: true,
  resultsPerPage: 20,
};

const defaultConfig: FrontendConfig = {
  exitModalEnabled: true,
  exitModalConfig: defaultExitModalConfig,
  pageGlobalConfig: defaultPageGlobalConfig,
  appearanceConfig: defaultAppearanceConfig,
  homepageConfig: defaultHomepageConfig,
  cardStyleConfig: defaultCardStyleConfig,
  sidebarConfig: defaultSidebarConfig,
  searchConfig: defaultSearchConfig,
};

// ==================== 缓存 ====================

let cachedConfig: FrontendConfig | null = null;
let configPromise: Promise<FrontendConfig> | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 60000; // 60秒

/** 清除配置缓存 */
export const clearConfigCache = () => {
  cachedConfig = null;
  configPromise = null;
  cacheTimestamp = 0;
};

// ==================== 构建配置 ====================

/**
 * 规范化页面全局配置，确保分类区域与热门推荐配置语义一致且独立
 */
const normalizePageGlobalConfig = (config: unknown): PageGlobalConfig => {
  const mergedConfig = { ...defaultPageGlobalConfig, ...((config as Partial<PageGlobalConfig>) || {}) };
  return {
    ...mergedConfig,
    websiteClickMode: normalizeWebsiteClickMode(mergedConfig.websiteClickMode),
    hotRecommendationClickMode: normalizeHotRecommendationClickMode(mergedConfig.hotRecommendationClickMode),
  };
};

/**
 * 规范化首页配置，确保轮播/推荐区和导航切换项结构稳定
 */
const normalizeHomepageConfig = (config: unknown): HomepageConfig => {
  const mergedConfig = { ...defaultHomepageConfig, ...((config as Partial<HomepageConfig>) || {}) };
  const items = Array.isArray(mergedConfig.navSwitchItems)
    ? mergedConfig.navSwitchItems
    : defaultHomepageConfig.navSwitchItems;
  return {
    ...mergedConfig,
    homeCarouselEnabled: mergedConfig.homeCarouselEnabled !== false,
    homeRecommendationEnabled: mergedConfig.homeRecommendationEnabled !== false,
    homeCarouselSort: Number.isFinite(Number(mergedConfig.homeCarouselSort))
      ? Number(mergedConfig.homeCarouselSort)
      : defaultHomepageConfig.homeCarouselSort,
    homeRecommendationSort: Number.isFinite(Number(mergedConfig.homeRecommendationSort))
      ? Number(mergedConfig.homeRecommendationSort)
      : defaultHomepageConfig.homeRecommendationSort,
    navSwitchItems: items
      .map((item, index) => ({
        slug: String(item?.slug || defaultHomepageConfig.navSwitchItems[index % defaultHomepageConfig.navSwitchItems.length].slug),
        name: String(item?.name || defaultHomepageConfig.navSwitchItems[index % defaultHomepageConfig.navSwitchItems.length].name),
        icon: String(item?.icon || defaultHomepageConfig.navSwitchItems[index % defaultHomepageConfig.navSwitchItems.length].icon),
        visible: item?.visible !== false,
        sort: Number.isFinite(Number(item?.sort)) ? Number(item.sort) : (index + 1) * 10,
      }))
      .sort((a, b) => a.sort - b.sort),
  };
};

const buildConfig = (data: FrontendConfigData): FrontendConfig => ({
  exitModalEnabled: data.exitModalEnabled ?? true,
  exitModalConfig: { ...defaultExitModalConfig, ...(data.exitModalConfig || {}) },
  pageGlobalConfig: normalizePageGlobalConfig(data.pageGlobalConfig),
  appearanceConfig: { ...defaultAppearanceConfig, ...(data.appearanceConfig || {}) },
  homepageConfig: normalizeHomepageConfig(data.homepageConfig),
  cardStyleConfig: { ...defaultCardStyleConfig, ...(data.cardStyleConfig || {}) },
  sidebarConfig: { ...defaultSidebarConfig, ...(data.sidebarConfig || {}) },
  searchConfig: { ...defaultSearchConfig, ...(data.searchConfig || {}) },
});

// ==================== Hook ====================

/** 获取前端功能配置 */
export const useFrontendConfig = () => {
  const [config, setConfig] = useState<FrontendConfig>(cachedConfig || defaultConfig);
  const [loading, setLoading] = useState(!cachedConfig);

  const fetchConfig = useCallback(async (forceRefresh = false) => {
    const now = Date.now();
    const cacheValid = cachedConfig && (now - cacheTimestamp) < CACHE_TTL;

    if (!forceRefresh && cacheValid) {
      setConfig(cachedConfig!);
      setLoading(false);
      return;
    }

    if (configPromise) {
      const result = await configPromise;
      setConfig(result);
      setLoading(false);
      return;
    }

    setLoading(true);
    configPromise = (async () => {
      try {
        const frontendConfig = await publicSettingService.getFrontendConfig();
        const hasFrontendConfig = Boolean(
          frontendConfig.exitModalConfig ||
          frontendConfig.pageGlobalConfig ||
          frontendConfig.appearanceConfig ||
          frontendConfig.homepageConfig ||
          frontendConfig.cardStyleConfig ||
          frontendConfig.sidebarConfig ||
          frontendConfig.searchConfig ||
          typeof frontendConfig.exitModalEnabled === 'boolean'
        );

        if (hasFrontendConfig) {
          const newConfig = buildConfig({
            exitModalEnabled: frontendConfig.exitModalEnabled,
            exitModalConfig: frontendConfig.exitModalConfig,
            pageGlobalConfig: frontendConfig.pageGlobalConfig,
            appearanceConfig: frontendConfig.appearanceConfig,
            homepageConfig: frontendConfig.homepageConfig,
            cardStyleConfig: frontendConfig.cardStyleConfig,
            sidebarConfig: frontendConfig.sidebarConfig,
            searchConfig: frontendConfig.searchConfig,
          });
          cachedConfig = newConfig;
          cacheTimestamp = Date.now();
          return newConfig;
        }

        const settings = await publicSettingService.getPublicSettings();
        const newConfig = buildConfig({
          pageGlobalConfig: settings.pageGlobal,
          appearanceConfig: settings.appearance,
          homepageConfig: settings.homepage,
          cardStyleConfig: settings.cardStyle,
          sidebarConfig: settings.sidebar,
          searchConfig: settings.search,
          exitModalConfig: settings.exitModal,
        });
        cachedConfig = newConfig;
        cacheTimestamp = Date.now();
        return newConfig;
      } catch (err) {
        console.error('加载前端配置失败，使用默认配置:', err);
        cachedConfig = defaultConfig;
        cacheTimestamp = Date.now();
        return defaultConfig;
      } finally {
        configPromise = null;
      }
    })();

    const result = await configPromise;
    setConfig(result);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  return { config, loading, refetch: () => fetchConfig(true) };
};

/** 直接获取配置（非 Hook 版本） */
export const getFrontendConfig = async (forceRefresh = false): Promise<FrontendConfig> => {
  const now = Date.now();
  const cacheValid = cachedConfig && (now - cacheTimestamp) < CACHE_TTL;

  if (!forceRefresh && cacheValid) {
    return cachedConfig!;
  }

  try {
    const frontendConfig = await publicSettingService.getFrontendConfig();
    const hasFrontendConfig = Boolean(
      frontendConfig.exitModalConfig ||
      frontendConfig.pageGlobalConfig ||
      frontendConfig.appearanceConfig ||
      frontendConfig.homepageConfig ||
      frontendConfig.cardStyleConfig ||
      frontendConfig.sidebarConfig ||
      frontendConfig.searchConfig ||
      typeof frontendConfig.exitModalEnabled === 'boolean'
    );

    if (hasFrontendConfig) {
      cachedConfig = buildConfig({
        exitModalEnabled: frontendConfig.exitModalEnabled,
        exitModalConfig: frontendConfig.exitModalConfig,
        pageGlobalConfig: frontendConfig.pageGlobalConfig,
        appearanceConfig: frontendConfig.appearanceConfig,
        homepageConfig: frontendConfig.homepageConfig,
        cardStyleConfig: frontendConfig.cardStyleConfig,
        sidebarConfig: frontendConfig.sidebarConfig,
        searchConfig: frontendConfig.searchConfig,
      });
      cacheTimestamp = Date.now();
      return cachedConfig;
    }

    const settings = await publicSettingService.getPublicSettings();
    cachedConfig = buildConfig({
      pageGlobalConfig: settings.pageGlobal,
      appearanceConfig: settings.appearance,
      homepageConfig: settings.homepage,
      cardStyleConfig: settings.cardStyle,
      sidebarConfig: settings.sidebar,
      searchConfig: settings.search,
      exitModalConfig: settings.exitModal,
    });
    cacheTimestamp = Date.now();
    return cachedConfig;
  } catch {
    return defaultConfig;
  }
};

// ==================== 类型导出 ====================

export type {
  FrontendConfig,
  ExitModalConfig,
  PageGlobalConfig,
  AppearanceConfig,
  HomepageConfig,
  CardStyleConfig,
  SidebarConfig,
  SearchConfig,
};

export default useFrontendConfig;
