/**
 * @copyright Tomda (https://www.tomda.top)
 * @copyright UIED技术团队 (https://fsuied.com)
 * @author UIED技术团队
 * @createDate 2026.2.12
 * 
 * @file publicSettingService.ts
 * @description 前端公开设置服务 - 对接后台站点设置
 */

import api from './api';
import { unwrapApiResponse } from '../utils/apiResponse';
import {
  normalizeWebsiteClickMode,
  normalizeHotRecommendationClickMode,
} from '../utils/clickMode';
import { debugLog } from '../utils/debugHelper';
import { DEFAULT_NAV_SWITCH_ITEMS } from '../config/navModel';
import { DEFAULT_ARTICLE_CONFIG as DEFAULT_ARTICLE_UI_CONFIG, ARTICLE_TOPICS } from '../config/articleConfig';

// ==================== 类型定义 ====================

// 站点信息
export interface SiteInfo {
  siteName: string;
  siteTitle: string;
  siteDescription: string;
  siteKeywords: string;
  logo: string;
  favicon: string;
  icp: string;
  copyright: string;
  contactEmail: string;
  analyticsCode: string;
}

// 外观配置
export interface AppearanceConfig {
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

// 首页配置
export interface HomepageConfig {
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

// 页面配置
export interface PageGlobalConfig {
  websiteClickMode: 'detail' | 'direct';
  showDirectArrow: boolean;
  detailPageNewWindow: boolean;
  directArrowNewWindow: boolean;
  pageSize: number;
  hotRecommendationClickMode: 'detail' | 'direct';
}

// 卡片样式配置
export interface CardStyleConfig {
  defaultLayout: 'grid' | 'list';
  gridColumns: number;
  showDescription: boolean;
  maxDescriptionLines: number;
  showTags: boolean;
  showFavicon: boolean;
  showUrl: boolean;
  hoverEffect: 'translateUp' | 'borderOnly' | 'shadow' | 'none';
}

// 侧边栏配置
export interface SidebarConfig {
  enabled: boolean;
  position: 'left' | 'right';
  width: number;
  showCategories: boolean;
  showCategoryCount: boolean;
  expandSubCategories: boolean;
  sticky: boolean;
}

// 搜索配置
export interface SearchConfig {
  placeholder: string;
  debounceDelay: number;
  aiSearchEnabled: boolean;
  aiSearchBtnText: string;
  highlightKeyword: boolean;
  resultsPerPage: number;
}

// 跳转提醒配置
export interface ExitModalConfig {
  enabled: boolean;
  title: string;
  description: string;
  autoRedirect: boolean;
  countdown: number;
  logo?: string;
  showAgreementLinks?: boolean;
  userAgreementText?: string;
  userAgreementUrl?: string;
  copyrightAgreementText?: string;
  copyrightAgreementUrl?: string;
}

// 详情页配置
export interface DetailPageConfig {
  pageStylePreset?: 'showcase' | 'compact' | 'enterprise';
  layoutWidthMode?: 'contained' | 'wide' | 'fluid';
  spacingDensity?: 'compact' | 'comfortable';
  labelVisualStyle?: 'soft' | 'outline';
  dataPanelEnabled?: boolean;
  dataPanelTitle?: string;
  heroAccentGlassEnabled?: boolean;
  enabled?: boolean;
  showRelated?: boolean;
  relatedTitle?: string;
  relatedCount?: number;
  relatedMode?: 'same_category' | 'same_tags' | 'hot' | 'manual';
  manualWebsiteIds?: string | string[];
  showTags?: boolean;
  tagsTitle?: string;
  tagSource?: 'website' | 'category' | 'manual';
  manualTags?: string | string[];
  showCategory?: boolean;
  categoryTitle?: string;
  sidebarAdEnabled?: boolean;
  sidebarAdSlotKey?: string;
  detailTopAdEnabled?: boolean;
  detailTopAdSlotKey?: string;
  detailInlineAdEnabled?: boolean;
  detailInlineAdSlotKey?: string;
  detailBottomAdEnabled?: boolean;
  detailBottomAdSlotKey?: string;
  seoFaqEnabled?: boolean;
  seoFaqTitle?: string;
  seoFaqLines?: string;
  seoLongTailEnabled?: boolean;
  seoLongTailTitle?: string;
  seoLongTailKeywords?: string | string[];
  seoSchemaEnabled?: boolean;
  screenshotsEnabled: boolean;
  thumbnailLayoutStyle?: 'device' | 'split' | 'carousel';
  thumbnailSplitSideCount?: number;
  thumbnailCarouselThumbCount?: number;
  previewSnapshotEnabled?: boolean;
  previewSnapshotTimeoutMs?: number;
  previewSnapshotCacheTtlSeconds?: number;
  previewSnapshotAllowFallbackMshots?: boolean;
  ratingsEnabled: boolean;
  commentsEnabled: boolean;
  sharingEnabled: boolean;
  favoritesEnabled: boolean;
  relatedEnabled: boolean;
  tagsEnabled: boolean;
  visitArrowEnabled: boolean;
  visitArrowText: string;
  copyrightEnabled: boolean;
  copyrightText: string;
  copyrightLink: string;
  disclaimerEnabled: boolean;
  disclaimerText: string;
  reportEnabled: boolean;
  reportText: string;
  reportEmail: string;
  visitBtnText: string;
  visitBtnNewWindow: boolean;
}

// 文章配置
export interface ArticleConfig {
  enabled: boolean;
  homeSectionEnabled: boolean;
  homeSectionTitle: string;
  homeSectionSubtitle: string;
  homeSectionLimit: number;
  listPageTitle: string;
  listPageDescription: string;
  listPageCoverImage: string;
  detailLayoutWidthMode: 'contained' | 'wide' | 'fluid';
  detailContentMaxWidth: number;
  detailHeaderAlign: 'left' | 'center';
  commentsEnabled: boolean;
  topicsEnabled: boolean;
}

// 文章专题配置
export interface ArticleTopicConfig {
  id: string;
  type: 'category' | 'tag';
  title: string;
  description: string;
  coverImage?: string;
  icon?: string;
  themeColor?: string;
}

export type ArticleTopicsConfig = Record<string, ArticleTopicConfig>;

// 公开设置（所有配置的集合）
export interface PublicSettings {
  siteInfo: SiteInfo;
  appearance: AppearanceConfig;
  homepage: HomepageConfig;
  pageGlobal: PageGlobalConfig;
  cardStyle: CardStyleConfig;
  sidebar: SidebarConfig;
  search: SearchConfig;
  exitModal: ExitModalConfig;
  detailPage: DetailPageConfig;
  article: ArticleConfig;
  articleTopics: ArticleTopicsConfig;
}

interface PublicSettingsPayload {
  siteInfo?: SiteInfo;
  appearance?: AppearanceConfig;
  homepage?: HomepageConfig;
  pageGlobal?: PageGlobalConfig;
  cardStyle?: CardStyleConfig;
  sidebar?: SidebarConfig;
  search?: SearchConfig;
  exitModal?: ExitModalConfig;
  detailPage?: DetailPageConfig;
  article?: ArticleConfig;
  articleTopics?: ArticleTopicsConfig;
  popup?: ExitModalConfig;
}

export interface FrontendConfigPayload {
  exitModalEnabled?: boolean;
  exitModalConfig?: ExitModalConfig;
  popupConfig?: ExitModalConfig;
  pageGlobalConfig?: PageGlobalConfig;
  appearanceConfig?: AppearanceConfig;
  homepageConfig?: HomepageConfig;
  cardStyleConfig?: CardStyleConfig;
  sidebarConfig?: SidebarConfig;
  searchConfig?: SearchConfig;
}

// ==================== 默认配置 ====================

export const DEFAULT_SITE_INFO: SiteInfo = {
  siteName: 'UIED 导航',
  siteTitle: '设计师导航 - 精选设计资源',
  siteDescription: '为设计师精选的优质设计资源导航网站',
  siteKeywords: '设计,UI,导航,资源',
  logo: '/logo-3.svg',
  favicon: '/favicon.ico',
  icp: '',
  copyright: '© 2026 UIED. All Rights Reserved.',
  contactEmail: '',
  analyticsCode: '',
};

export const DEFAULT_APPEARANCE: AppearanceConfig = {
  primaryColor: '#0066ff',
  backgroundColor: '#f6f8fb',
  cardBackgroundColor: '#ffffff',
  textPrimaryColor: '#333333',
  fontFamily: 'Lexend, -apple-system, sans-serif',
  baseFontSize: 16,
  borderRadius: 12,
  contentMaxWidth: 1200,
  customCss: '',
};

export const DEFAULT_HOMEPAGE: HomepageConfig = {
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

export const DEFAULT_PAGE_GLOBAL: PageGlobalConfig = {
  websiteClickMode: 'detail',
  showDirectArrow: false,
  detailPageNewWindow: false,
  directArrowNewWindow: true,
  pageSize: 20,
  hotRecommendationClickMode: 'detail',
};

export const DEFAULT_CARD_STYLE: CardStyleConfig = {
  defaultLayout: 'grid',
  gridColumns: 4,
  showDescription: true,
  maxDescriptionLines: 2,
  showTags: true,
  showFavicon: true,
  showUrl: false,
  hoverEffect: 'translateUp',
};

export const DEFAULT_SIDEBAR: SidebarConfig = {
  enabled: true,
  position: 'left',
  width: 240,
  showCategories: true,
  showCategoryCount: true,
  expandSubCategories: false,
  sticky: true,
};

export const DEFAULT_SEARCH: SearchConfig = {
  placeholder: '搜索网站名称...',
  debounceDelay: 300,
  aiSearchEnabled: true,
  aiSearchBtnText: 'AI 搜索',
  highlightKeyword: true,
  resultsPerPage: 20,
};

export const DEFAULT_EXIT_MODAL: ExitModalConfig = {
  enabled: true,
  title: '即将离开本站',
  description: '您即将访问外部网站，请注意安全',
  autoRedirect: true,
  countdown: 5,
  logo: '',
  showAgreementLinks: false,
  userAgreementText: '',
  userAgreementUrl: '',
  copyrightAgreementText: '',
  copyrightAgreementUrl: '',
};

export const DEFAULT_DETAIL_PAGE: DetailPageConfig = {
  pageStylePreset: 'showcase',
  layoutWidthMode: 'contained',
  spacingDensity: 'compact',
  labelVisualStyle: 'soft',
  dataPanelEnabled: true,
  dataPanelTitle: '站点访问数据',
  heroAccentGlassEnabled: true,
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
  detailTopAdEnabled: false,
  detailTopAdSlotKey: 'detail_top',
  detailInlineAdEnabled: false,
  detailInlineAdSlotKey: 'detail_inline',
  detailBottomAdEnabled: false,
  detailBottomAdSlotKey: 'detail_bottom',
  seoFaqEnabled: false,
  seoFaqTitle: '常见问题',
  seoFaqLines: '',
  seoLongTailEnabled: false,
  seoLongTailTitle: '相关搜索',
  seoLongTailKeywords: '',
  seoSchemaEnabled: true,
  screenshotsEnabled: true,
  thumbnailLayoutStyle: 'device',
  thumbnailSplitSideCount: 2,
  thumbnailCarouselThumbCount: 6,
  previewSnapshotEnabled: true,
  previewSnapshotTimeoutMs: 12000,
  previewSnapshotCacheTtlSeconds: 21600,
  previewSnapshotAllowFallbackMshots: true,
  ratingsEnabled: true,
  commentsEnabled: true,
  sharingEnabled: true,
  favoritesEnabled: true,
  relatedEnabled: true,
  tagsEnabled: true,
  visitArrowEnabled: true,
  visitArrowText: '直达网站',
  copyrightEnabled: true,
  copyrightText: '版权归原作者所有',
  copyrightLink: '',
  disclaimerEnabled: true,
  disclaimerText: '本站仅收录和推荐，不对第三方网站内容负责。',
  reportEnabled: true,
  reportText: '如发现违规内容，请发送邮件举报',
  reportEmail: '',
  visitBtnText: '访问网站',
  visitBtnNewWindow: true,
};

export const DEFAULT_ARTICLE_SETTING: ArticleConfig = {
  enabled: true,
  homeSectionEnabled: true,
  homeSectionTitle: '设计文章',
  homeSectionSubtitle: '汇聚优质设计文章，分享前沿设计趋势与实战经验',
  homeSectionLimit: 12,
  listPageTitle: DEFAULT_ARTICLE_UI_CONFIG.title,
  listPageDescription: DEFAULT_ARTICLE_UI_CONFIG.description,
  listPageCoverImage: DEFAULT_ARTICLE_UI_CONFIG.coverImage || '',
  detailLayoutWidthMode: 'contained',
  detailContentMaxWidth: 880,
  detailHeaderAlign: 'center',
  commentsEnabled: true,
  topicsEnabled: true,
};

export const DEFAULT_ARTICLE_TOPICS: ArticleTopicsConfig = ARTICLE_TOPICS;

// ==================== API 服务 ====================

export const publicSettingService = {
  /**
   * 统一解包后端响应
   * 兼容 `{ code, data, message }` 与直接返回数据两种结构
   */
  unwrapResponseData: <T>(payload: unknown, fallback: T): T => {
    return unwrapApiResponse<T>(payload, fallback);
  },

  /**
   * 规范化分类区域点击模式
   * 兼容历史值：directExternal -> direct
   */
  normalizeWebsiteClickMode: (mode: unknown): 'detail' | 'direct' => {
    return normalizeWebsiteClickMode(mode);
  },

  /**
   * 规范化热门推荐点击模式
   * 兼容历史值：modal -> detail
   */
  normalizeHotRecommendationClickMode: (mode: unknown): 'detail' | 'direct' => {
    return normalizeHotRecommendationClickMode(mode);
  },

  /**
   * 规范化页面全局配置，确保分类区域与热门推荐配置语义一致且独立
   */
  normalizePageGlobalConfig: (config: unknown): PageGlobalConfig => {
    const mergedConfig = { ...DEFAULT_PAGE_GLOBAL, ...((config as Partial<PageGlobalConfig>) || {}) };
    return {
      ...mergedConfig,
      websiteClickMode: publicSettingService.normalizeWebsiteClickMode(mergedConfig.websiteClickMode),
      hotRecommendationClickMode: publicSettingService.normalizeHotRecommendationClickMode(mergedConfig.hotRecommendationClickMode),
    };
  },

  /**
   * 规范化首页配置，确保轮播/推荐区和导航切换配置结构稳定
   */
  normalizeHomepageConfig: (config: unknown): HomepageConfig => {
    const merged = { ...DEFAULT_HOMEPAGE, ...((config as Partial<HomepageConfig>) || {}) };
    const normalizedItems = Array.isArray(merged.navSwitchItems)
      ? merged.navSwitchItems
      : DEFAULT_HOMEPAGE.navSwitchItems;
    return {
      ...merged,
      homeCarouselEnabled: merged.homeCarouselEnabled !== false,
      homeRecommendationEnabled: merged.homeRecommendationEnabled !== false,
      homeCarouselSort: Number.isFinite(Number(merged.homeCarouselSort)) ? Number(merged.homeCarouselSort) : DEFAULT_HOMEPAGE.homeCarouselSort,
      homeRecommendationSort: Number.isFinite(Number(merged.homeRecommendationSort)) ? Number(merged.homeRecommendationSort) : DEFAULT_HOMEPAGE.homeRecommendationSort,
      navSwitchItems: normalizedItems
        .map((item, index) => ({
          slug: String(item?.slug || DEFAULT_HOMEPAGE.navSwitchItems[index % DEFAULT_HOMEPAGE.navSwitchItems.length].slug),
          name: String(item?.name || DEFAULT_HOMEPAGE.navSwitchItems[index % DEFAULT_HOMEPAGE.navSwitchItems.length].name),
          icon: String(item?.icon || DEFAULT_HOMEPAGE.navSwitchItems[index % DEFAULT_HOMEPAGE.navSwitchItems.length].icon),
          visible: item?.visible !== false,
          sort: Number.isFinite(Number(item?.sort)) ? Number(item.sort) : (index + 1) * 10,
        }))
        .sort((a, b) => a.sort - b.sort),
    };
  },

  /**
   * 规范化文章配置，保证字段完整可用
   */
  normalizeArticleConfig: (config: unknown): ArticleConfig => {
    const merged = { ...DEFAULT_ARTICLE_SETTING, ...((config as Partial<ArticleConfig>) || {}) };
    const detailLayoutWidthMode = [ 'contained', 'wide', 'fluid' ].includes(String(merged.detailLayoutWidthMode || '').trim())
      ? (String(merged.detailLayoutWidthMode || '').trim() as 'contained' | 'wide' | 'fluid')
      : DEFAULT_ARTICLE_SETTING.detailLayoutWidthMode;
    const detailHeaderAlign = [ 'left', 'center' ].includes(String(merged.detailHeaderAlign || '').trim())
      ? (String(merged.detailHeaderAlign || '').trim() as 'left' | 'center')
      : DEFAULT_ARTICLE_SETTING.detailHeaderAlign;
    return {
      ...merged,
      enabled: merged.enabled !== false,
      homeSectionEnabled: merged.homeSectionEnabled !== false,
      homeSectionLimit: Number.isFinite(Number(merged.homeSectionLimit))
        ? Number(merged.homeSectionLimit)
        : DEFAULT_ARTICLE_SETTING.homeSectionLimit,
      listPageTitle: String(merged.listPageTitle || DEFAULT_ARTICLE_SETTING.listPageTitle),
      listPageDescription: String(merged.listPageDescription || DEFAULT_ARTICLE_SETTING.listPageDescription),
      listPageCoverImage: String(merged.listPageCoverImage || DEFAULT_ARTICLE_SETTING.listPageCoverImage),
      detailLayoutWidthMode,
      detailContentMaxWidth: Number.isFinite(Number(merged.detailContentMaxWidth))
        ? Math.max(680, Math.min(1600, Number(merged.detailContentMaxWidth)))
        : DEFAULT_ARTICLE_SETTING.detailContentMaxWidth,
      detailHeaderAlign,
      homeSectionTitle: String(merged.homeSectionTitle || DEFAULT_ARTICLE_SETTING.homeSectionTitle),
      homeSectionSubtitle: String(merged.homeSectionSubtitle || DEFAULT_ARTICLE_SETTING.homeSectionSubtitle),
      commentsEnabled: merged.commentsEnabled !== false,
      topicsEnabled: merged.topicsEnabled !== false,
    };
  },

  /**
   * 规范化文章专题配置，兼容未配置时的默认配置
   */
  normalizeArticleTopicsConfig: (config: unknown): ArticleTopicsConfig => {
    if (!config || typeof config !== 'object') {
      return DEFAULT_ARTICLE_TOPICS;
    }
    const merged = { ...DEFAULT_ARTICLE_TOPICS, ...(config as ArticleTopicsConfig) };
    return Object.keys(merged).reduce<ArticleTopicsConfig>((result, key) => {
      const current = merged[key];
      if (!current || typeof current !== 'object') {
        return result;
      }
      result[key] = {
        id: String(current.id || key),
        type: current.type === 'tag' ? 'tag' : 'category',
        title: String(current.title || ''),
        description: String(current.description || ''),
        coverImage: current.coverImage ? String(current.coverImage) : undefined,
        icon: current.icon ? String(current.icon) : undefined,
        themeColor: current.themeColor ? String(current.themeColor) : undefined,
      };
      return result;
    }, {} as ArticleTopicsConfig);
  },

  getFrontendConfig: async (): Promise<FrontendConfigPayload> => {
    try {
      const response = await api.get('/settings/frontend-config');
      const data = publicSettingService.unwrapResponseData<FrontendConfigPayload>(response.data, {});
      return {
        exitModalEnabled: typeof data.exitModalEnabled === 'boolean' ? data.exitModalEnabled : undefined,
        exitModalConfig: data.exitModalConfig || data.popupConfig,
        pageGlobalConfig: data.pageGlobalConfig,
        appearanceConfig: data.appearanceConfig,
        homepageConfig: data.homepageConfig,
        cardStyleConfig: data.cardStyleConfig,
        sidebarConfig: data.sidebarConfig,
        searchConfig: data.searchConfig,
      };
    } catch (error) {
      debugLog.error('获取前端配置失败，回退公开设置:', error);
      return {};
    }
  },

  /**
   * 获取所有公开设置
   */
  getPublicSettings: async (): Promise<PublicSettings> => {
    try {
      const response = await api.get('/settings/public');
      const data = publicSettingService.unwrapResponseData<PublicSettingsPayload>(response.data, {});
      const exitModalConfig = data.exitModal || data.popup;
      return {
        siteInfo: data.siteInfo || DEFAULT_SITE_INFO,
        appearance: data.appearance || DEFAULT_APPEARANCE,
        homepage: publicSettingService.normalizeHomepageConfig(data.homepage),
        pageGlobal: publicSettingService.normalizePageGlobalConfig(data.pageGlobal),
        cardStyle: data.cardStyle || DEFAULT_CARD_STYLE,
        sidebar: data.sidebar || DEFAULT_SIDEBAR,
        search: data.search || DEFAULT_SEARCH,
        exitModal: exitModalConfig || DEFAULT_EXIT_MODAL,
        detailPage: data.detailPage || DEFAULT_DETAIL_PAGE,
        article: publicSettingService.normalizeArticleConfig(data.article),
        articleTopics: publicSettingService.normalizeArticleTopicsConfig(data.articleTopics),
      };
    } catch (error) {
      debugLog.error('获取公开设置失败，使用默认配置:', error);
      // 返回默认配置
      return {
        siteInfo: DEFAULT_SITE_INFO,
        appearance: DEFAULT_APPEARANCE,
        homepage: DEFAULT_HOMEPAGE,
        pageGlobal: DEFAULT_PAGE_GLOBAL,
        cardStyle: DEFAULT_CARD_STYLE,
        sidebar: DEFAULT_SIDEBAR,
        search: DEFAULT_SEARCH,
        exitModal: DEFAULT_EXIT_MODAL,
        detailPage: DEFAULT_DETAIL_PAGE,
        article: DEFAULT_ARTICLE_SETTING,
        articleTopics: DEFAULT_ARTICLE_TOPICS,
      };
    }
  },

  /**
   * 获取站点信息
   */
  getSiteInfo: async (): Promise<SiteInfo> => {
    try {
      const settings = await publicSettingService.getPublicSettings();
      return settings.siteInfo || DEFAULT_SITE_INFO;
    } catch (error) {
      debugLog.error('获取站点信息失败，使用默认配置:', error);
      return DEFAULT_SITE_INFO;
    }
  },

  /**
   * 获取外观配置
   */
  getAppearanceConfig: async (): Promise<AppearanceConfig> => {
    try {
      const settings = await publicSettingService.getPublicSettings();
      return settings.appearance || DEFAULT_APPEARANCE;
    } catch (error) {
      debugLog.error('获取外观配置失败，使用默认配置:', error);
      return DEFAULT_APPEARANCE;
    }
  },

  /**
   * 获取首页配置
   */
  getHomepageConfig: async (): Promise<HomepageConfig> => {
    try {
      const settings = await publicSettingService.getPublicSettings();
      return publicSettingService.normalizeHomepageConfig(settings.homepage || DEFAULT_HOMEPAGE);
    } catch (error) {
      debugLog.error('获取首页配置失败，使用默认配置:', error);
      return DEFAULT_HOMEPAGE;
    }
  },

  /**
   * 获取页面配置
   */
  getPageGlobalConfig: async (): Promise<PageGlobalConfig> => {
    try {
      const settings = await publicSettingService.getPublicSettings();
      return publicSettingService.normalizePageGlobalConfig(settings.pageGlobal || DEFAULT_PAGE_GLOBAL);
    } catch (error) {
      debugLog.error('获取页面配置失败，使用默认配置:', error);
      return DEFAULT_PAGE_GLOBAL;
    }
  },

  /**
   * 获取卡片样式配置
   */
  getCardStyleConfig: async (): Promise<CardStyleConfig> => {
    try {
      const settings = await publicSettingService.getPublicSettings();
      return settings.cardStyle || DEFAULT_CARD_STYLE;
    } catch (error) {
      debugLog.error('获取卡片样式配置失败，使用默认配置:', error);
      return DEFAULT_CARD_STYLE;
    }
  },

  /**
   * 获取侧边栏配置
   */
  getSidebarConfig: async (): Promise<SidebarConfig> => {
    try {
      const settings = await publicSettingService.getPublicSettings();
      return settings.sidebar || DEFAULT_SIDEBAR;
    } catch (error) {
      debugLog.error('获取侧边栏配置失败，使用默认配置:', error);
      return DEFAULT_SIDEBAR;
    }
  },

  /**
   * 获取搜索配置
   */
  getSearchConfig: async (): Promise<SearchConfig> => {
    try {
      const settings = await publicSettingService.getPublicSettings();
      return settings.search || DEFAULT_SEARCH;
    } catch (error) {
      debugLog.error('获取搜索配置失败，使用默认配置:', error);
      return DEFAULT_SEARCH;
    }
  },

  /**
   * 获取跳转提醒配置
   */
  getExitModalConfig: async (): Promise<ExitModalConfig> => {
    try {
      const settings = await publicSettingService.getPublicSettings();
      return settings.exitModal || DEFAULT_EXIT_MODAL;
    } catch (error) {
      debugLog.error('获取跳转提醒配置失败，使用默认配置:', error);
      return DEFAULT_EXIT_MODAL;
    }
  },

  /**
   * 获取详情页配置
   */
  getDetailPageConfig: async (): Promise<DetailPageConfig> => {
    try {
      const response = await api.get('/settings/detailPageConfig');
      const config = publicSettingService.unwrapResponseData<DetailPageConfig>(
        response.data,
        DEFAULT_DETAIL_PAGE
      );
      return { ...DEFAULT_DETAIL_PAGE, ...(config || {}) };
    } catch (error) {
      debugLog.error('获取详情页配置失败，使用默认配置:', error);
      return DEFAULT_DETAIL_PAGE;
    }
  },
};

export default publicSettingService;
