/**
 * @copyright Tomda (https://www.tomda.top)
 * @copyright UIED技术团队 (https://fsuied.com)
 * @author UIED技术团队
 * @createDate 2026.2.12
 * 
 * @file usePublicSettings.ts
 * @description 前端公开设置 Hooks - 对接后台站点设置
 */

import { useState, useEffect } from 'react';
import publicSettingService, {
  PublicSettings,
  SiteInfo,
  AppearanceConfig,
  HomepageConfig,
  PageGlobalConfig,
  CardStyleConfig,
  SidebarConfig,
  SearchConfig,
  ExitModalConfig,
  DetailPageConfig,
  DEFAULT_SITE_INFO,
  DEFAULT_APPEARANCE,
  DEFAULT_HOMEPAGE,
  DEFAULT_PAGE_GLOBAL,
  DEFAULT_CARD_STYLE,
  DEFAULT_SIDEBAR,
  DEFAULT_SEARCH,
  DEFAULT_EXIT_MODAL,
  DEFAULT_DETAIL_PAGE,
  DEFAULT_ARTICLE_SETTING,
  DEFAULT_ARTICLE_TOPICS,
} from '../services/publicSettingService';
import { debugLog } from '../utils/debugHelper';

// ==================== 通用 Hook 类型 ====================

interface UseSettingResult<T> {
  data: T;
  loading: boolean;
  error: Error | null;
  refresh: () => void;
}

// ==================== 所有公开设置 Hook ====================

/**
 * 获取所有公开设置
 * 一次性获取所有配置，适合需要多个配置的场景
 */
export const usePublicSettings = (): UseSettingResult<PublicSettings> => {
  const [data, setData] = useState<PublicSettings>({
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
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const settings = await publicSettingService.getPublicSettings();
      setData(settings);
      setError(null);
    } catch (err) {
      setError(err as Error);
      debugLog.error('获取公开设置失败:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return { data, loading, error, refresh: fetchSettings };
};

// ==================== 站点信息 Hook ====================

/**
 * 获取站点信息
 * 包含网站名称、Logo、SEO 等基本信息
 */
export const usePublicSiteInfo = (): UseSettingResult<SiteInfo> => {
  const [data, setData] = useState<SiteInfo>(DEFAULT_SITE_INFO);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const siteInfo = await publicSettingService.getSiteInfo();
      setData(siteInfo);
      setError(null);
    } catch (err) {
      setError(err as Error);
      debugLog.error('获取站点信息失败:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return { data, loading, error, refresh: fetchData };
};

// ==================== 外观配置 Hook ====================

/**
 * 获取外观配置
 * 包含主题色、字体、圆角等视觉样式配置
 */
export const useAppearanceConfig = (): UseSettingResult<AppearanceConfig> => {
  const [data, setData] = useState<AppearanceConfig>(DEFAULT_APPEARANCE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const config = await publicSettingService.getAppearanceConfig();
      setData(config);
      setError(null);
      
      // 应用外观配置到页面
      applyAppearanceConfig(config);
    } catch (err) {
      setError(err as Error);
      debugLog.error('获取外观配置失败:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return { data, loading, error, refresh: fetchData };
};

/**
 * 应用外观配置到页面
 */
const applyAppearanceConfig = (config: AppearanceConfig) => {
  const root = document.documentElement;
  
  // 设置 CSS 变量
  root.style.setProperty('--primary-color', config.primaryColor);
  root.style.setProperty('--background-color', config.backgroundColor);
  root.style.setProperty('--card-background-color', config.cardBackgroundColor);
  root.style.setProperty('--text-primary-color', config.textPrimaryColor);
  root.style.setProperty('--font-family', config.fontFamily);
  root.style.setProperty('--base-font-size', `${config.baseFontSize}px`);
  root.style.setProperty('--border-radius', `${config.borderRadius}px`);
  root.style.setProperty('--content-max-width', config.contentMaxWidth > 0 ? `${config.contentMaxWidth}px` : '100%');
  
  // 注入自定义 CSS
  if (config.customCss) {
    let styleElement = document.getElementById('custom-css');
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = 'custom-css';
      document.head.appendChild(styleElement);
    }
    styleElement.textContent = config.customCss;
  }
};

// ==================== 首页配置 Hook ====================

/**
 * 获取首页配置
 * 包含横幅、推荐卡片、热门推荐等首页区块配置
 */
export const useHomepageConfig = (): UseSettingResult<HomepageConfig> => {
  const [data, setData] = useState<HomepageConfig>(DEFAULT_HOMEPAGE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const config = await publicSettingService.getHomepageConfig();
      setData(config);
      setError(null);
    } catch (err) {
      setError(err as Error);
      debugLog.error('获取首页配置失败:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return { data, loading, error, refresh: fetchData };
};

// ==================== 页面配置 Hook ====================

/**
 * 获取页面配置
 * 包含点击行为、直达箭头、窗口打开方式等全局配置
 */
export const usePageGlobalConfig = (): UseSettingResult<PageGlobalConfig> => {
  const [data, setData] = useState<PageGlobalConfig>(DEFAULT_PAGE_GLOBAL);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const config = await publicSettingService.getPageGlobalConfig();
      setData(config);
      setError(null);
    } catch (err) {
      setError(err as Error);
      debugLog.error('获取页面配置失败:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return { data, loading, error, refresh: fetchData };
};

// ==================== 卡片样式配置 Hook ====================

/**
 * 获取卡片样式配置
 * 包含布局、信息显示、悬浮效果等卡片样式配置
 */
export const useCardStyleConfig = (): UseSettingResult<CardStyleConfig> => {
  const [data, setData] = useState<CardStyleConfig>(DEFAULT_CARD_STYLE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const config = await publicSettingService.getCardStyleConfig();
      setData(config);
      setError(null);
    } catch (err) {
      setError(err as Error);
      debugLog.error('获取卡片样式配置失败:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return { data, loading, error, refresh: fetchData };
};

// ==================== 侧边栏配置 Hook ====================

/**
 * 获取侧边栏配置
 * 包含显示、位置、宽度、内容等侧边栏配置
 */
export const useSidebarConfig = (): UseSettingResult<SidebarConfig> => {
  const [data, setData] = useState<SidebarConfig>(DEFAULT_SIDEBAR);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const config = await publicSettingService.getSidebarConfig();
      setData(config);
      setError(null);
    } catch (err) {
      setError(err as Error);
      debugLog.error('获取侧边栏配置失败:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return { data, loading, error, refresh: fetchData };
};

// ==================== 搜索配置 Hook ====================

/**
 * 获取搜索配置
 * 包含占位文字、防抖延迟、AI 搜索等搜索功能配置
 */
export const useSearchConfig = (): UseSettingResult<SearchConfig> => {
  const [data, setData] = useState<SearchConfig>(DEFAULT_SEARCH);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const config = await publicSettingService.getSearchConfig();
      setData(config);
      setError(null);
    } catch (err) {
      setError(err as Error);
      debugLog.error('获取搜索配置失败:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return { data, loading, error, refresh: fetchData };
};

// ==================== 跳转提醒配置 Hook ====================

/**
 * 获取跳转提醒配置
 * 包含弹窗标题、描述、自动跳转等跳转提醒配置
 */
export const useExitModalConfig = (): UseSettingResult<ExitModalConfig> => {
  const [data, setData] = useState<ExitModalConfig>(DEFAULT_EXIT_MODAL);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const config = await publicSettingService.getExitModalConfig();
      setData(config);
      setError(null);
    } catch (err) {
      setError(err as Error);
      debugLog.error('获取跳转提醒配置失败:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return { data, loading, error, refresh: fetchData };
};

// ==================== 详情页配置 Hook ====================

/**
 * 获取详情页配置
 * 包含区块显示、直达按钮、版权信息等详情页配置
 */
export const useDetailPageConfig = (): UseSettingResult<DetailPageConfig> => {
  const [data, setData] = useState<DetailPageConfig>(DEFAULT_DETAIL_PAGE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const config = await publicSettingService.getDetailPageConfig();
      setData(config);
      setError(null);
    } catch (err) {
      setError(err as Error);
      debugLog.error('获取详情页配置失败:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return { data, loading, error, refresh: fetchData };
};
