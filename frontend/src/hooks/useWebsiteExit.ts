/**
 * @file useWebsiteExit.ts
 * @description 网站跳转确认弹窗管理Hook
 * @copyright 版权所有 (c) 2025 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.3.0 - 支持后台配置开关、自定义文案和广告
 */

import { useState, useCallback, useEffect } from 'react';
import { getFrontendConfig } from './useFrontendConfig';
import { debugLog } from '../utils/debugHelper';

// 网站信息接口
interface WebsiteInfo {
  name: string;
  url: string;
  description?: string;
}

// 页面级配置接口
interface PageOverrideConfig {
  enabled?: boolean;
  title?: string;
  description?: string;
}

// 弹窗配置接口
interface ExitModalConfig {
  enabled: boolean;
  title: string;
  description: string;
  confirmText: string;
  cancelText: string;
  showReport: boolean;
  reportText: string;
  // 自动跳转配置
  autoRedirect?: boolean;
  autoRedirectSeconds?: number;
  // 新窗口打开配置
  openInNewWindow?: boolean;
  // 广告配置
  showAd?: boolean;
  adCode?: string;
  adPosition?: 'top' | 'bottom';
  logo?: string;
  showAgreementLinks?: boolean;
  userAgreementText?: string;
  userAgreementUrl?: string;
  copyrightAgreementText?: string;
  copyrightAgreementUrl?: string;
  // 页面级配置
  pageOverrides?: {
    [pageSlug: string]: PageOverrideConfig;
  };
}

// 默认配置 - 默认关闭弹窗，点击网站卡片跳转详情页
const defaultModalConfig: ExitModalConfig = {
  enabled: false,  // 默认关闭，点击跳转详情页
  title: '即将离开本站',
  description: '您即将访问第三方网站，请注意保护个人信息安全。',
  confirmText: '继续访问',
  cancelText: '返回',
  showReport: true,
  reportText: '举报此链接',
  autoRedirect: false,
  autoRedirectSeconds: 5,
  openInNewWindow: true,  // 默认新窗口打开
  showAd: false,
  adCode: '',
  adPosition: 'bottom',
  logo: '',
  showAgreementLinks: false,
  userAgreementText: '',
  userAgreementUrl: '',
  copyrightAgreementText: '',
  copyrightAgreementUrl: '',
};

// 缓存配置
let cachedModalConfig: ExitModalConfig | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 5000; // 5 秒缓存（减少缓存时间以便配置更快生效）

/**
 * 网站跳转确认Hook
 * @param pageSlug 当前页面标识，用于获取页面级配置
 * @returns Hook返回值
 */
export const useWebsiteExit = (pageSlug?: string) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentWebsite, setCurrentWebsite] = useState<WebsiteInfo | null>(null);
  const [modalConfig, setModalConfig] = useState<ExitModalConfig>(cachedModalConfig || defaultModalConfig);
  const [configLoaded, setConfigLoaded] = useState(false);

  // 加载配置
  useEffect(() => {
    const loadConfig = async () => {
      const now = Date.now();
      const cacheValid = cachedModalConfig && (now - cacheTimestamp) < CACHE_TTL;
      
      if (cacheValid) {
        setModalConfig(cachedModalConfig!);
        setConfigLoaded(true);
        return;
      }
      
      try {
        const config = await getFrontendConfig(true); // 强制刷新
        const newConfig = config.exitModalConfig || defaultModalConfig;
        cachedModalConfig = newConfig;
        cacheTimestamp = Date.now();
        setModalConfig(newConfig);
        setConfigLoaded(true);
        debugLog.dev('[useWebsiteExit] 配置已加载:', newConfig.enabled);
      } catch (error) {
        debugLog.error('加载跳转弹窗配置失败:', error);
        setConfigLoaded(true);
      }
    };
    
    loadConfig();
  }, []);

  // 获取当前页面的有效配置（合并全局配置和页面级配置）
  const getEffectiveConfig = useCallback((): ExitModalConfig => {
    if (!pageSlug || !modalConfig.pageOverrides || !modalConfig.pageOverrides[pageSlug]) {
      return modalConfig;
    }
    
    const pageConfig = modalConfig.pageOverrides[pageSlug];
    return {
      ...modalConfig,
      enabled: pageConfig.enabled !== undefined ? pageConfig.enabled : modalConfig.enabled,
      title: pageConfig.title || modalConfig.title,
      description: pageConfig.description || modalConfig.description,
    };
  }, [modalConfig, pageSlug]);

  // 显示弹窗
  const showExitModal = useCallback((website: WebsiteInfo) => {
    // 注意：这里不再处理 enabled=false 的情况
    // enabled=false 的逻辑由 useNavigation.ts 的 handleWebsiteClick 处理
    // 这个函数只在 enabled=true 时被调用，用于显示弹窗
    
    setCurrentWebsite(website);
    setIsModalVisible(true);
  }, []);

  // 隐藏弹窗
  const hideExitModal = useCallback(() => {
    setIsModalVisible(false);
    setCurrentWebsite(null);
  }, []);

  // 确认访问
  const confirmVisit = useCallback(() => {
    if (currentWebsite) {
      const effectiveConfig = getEffectiveConfig();
      // 调试日志
      if (process.env.NODE_ENV === 'development') {
        debugLog.dev('[confirmVisit] 配置:', { 
          openInNewWindow: effectiveConfig.openInNewWindow,
          url: currentWebsite.url 
        });
      }
      if (effectiveConfig.openInNewWindow !== false) {
        // 默认或配置为 true 时，新窗口打开
        window.open(currentWebsite.url, '_blank', 'noopener,noreferrer');
      } else {
        // 配置为 false 时，当前窗口跳转
        window.location.href = currentWebsite.url;
      }
    }
    hideExitModal();
  }, [currentWebsite, hideExitModal, getEffectiveConfig]);

  // 举报网站
  const reportWebsite = useCallback((url: string, reason: string) => {
    alert(`举报已提交: ${reason}`);
  }, []);

  // 获取当前有效的配置（用于渲染弹窗）
  const effectiveModalConfig = getEffectiveConfig();

  return {
    isModalVisible,
    currentWebsite,
    showExitModal,
    hideExitModal,
    confirmVisit,
    reportWebsite,
    configLoaded,
    modalConfig: effectiveModalConfig
  };
}; 
