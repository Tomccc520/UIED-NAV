/**
 * @copyright Tomda (https://www.tomda.top)
 * @copyright UIED技术团队 (https://fsuied.com)
 * @author UIED技术团队
 * @createDate 2026-02-25
 */
/**
 * @file DailyHotFixedEntry.tsx
 * @description 每日热榜固定入口（全局悬浮入口）
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { getDailyHotDisplayConfig } from '../../services/dailyHotService';
import { DailyHotDisplayConfig } from '../../types/dailyHot';
import './DailyHotFixedEntry.css';

interface DailyHotFixedEntryView {
  label: string;
  href: string;
  target: '_self' | '_blank';
  rel?: string;
}

/**
 * 每日热榜固定入口组件
 * 根据后台每日热榜展示配置决定是否在全站右下角显示悬浮入口。
 */
const DailyHotFixedEntry: React.FC = () => {
  const location = useLocation();
  const [config, setConfig] = useState<DailyHotDisplayConfig | null>(null);
  const [viewportWidth, setViewportWidth] = useState<number>(() => {
    if (typeof window === 'undefined') return 1024;
    return window.innerWidth;
  });

  /**
   * 判断当前是否移动端视口
   */
  const isMobileViewport = useMemo(() => viewportWidth <= 768, [viewportWidth]);

  /**
   * 拉取每日热榜公开展示配置
   */
  const fetchDisplayConfig = useCallback(async () => {
    const nextConfig = await getDailyHotDisplayConfig();
    setConfig(nextConfig);
  }, []);

  /**
   * 监听视口变化，保证 PC/移动端显示开关切换时立即生效
   */
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const handleResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', handleResize, { passive: true });
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  /**
   * 组件挂载时读取配置
   */
  useEffect(() => {
    fetchDisplayConfig();
  }, [fetchDisplayConfig]);

  /**
   * 生成固定入口展示文案与链接信息
   */
  const entryView = useMemo<DailyHotFixedEntryView>(() => {
    const fallback: DailyHotFixedEntryView = {
      label: '全网热榜',
      href: '/p/daily-hot',
      target: '_self',
    };

    if (!config) return fallback;

    const label = String(config.displayLabel || '').trim() || fallback.label;
    const href = String(config.displayPath || '').trim() || fallback.href;
    const isNewTab = config.displayOpenInNewTab === true;

    return {
      label,
      href,
      target: isNewTab ? '_blank' : '_self',
      rel: isNewTab ? 'noopener noreferrer' : undefined,
    };
  }, [config]);

  /**
   * 判断当前路径是否已经是热榜目标页（避免重复入口占位）
   */
  const isCurrentTargetPage = useMemo(() => {
    const href = entryView.href || '';
    if (!href || /^https?:\/\//i.test(href)) return false;
    const targetPath = href.split('?')[0] || href;
    return targetPath === location.pathname;
  }, [entryView.href, location.pathname]);

  /**
   * 根据后台配置与当前终端决定固定入口是否显示
   */
  const shouldShow = useMemo(() => {
    if (!config) return false;
    if (config.enabled === false) return false;
    if (!Array.isArray(config.displayPlacements)) return false;
    if (!config.displayPlacements.includes('fixed_link')) return false;
    if (isMobileViewport && config.displayMobile === false) return false;
    if (!isMobileViewport && config.displayDesktop === false) return false;
    if (isCurrentTargetPage) return false;
    return true;
  }, [config, isCurrentTargetPage, isMobileViewport]);

  if (!shouldShow) {
    return null;
  }

  return (
    <a
      className="daily-hot-fixed-entry"
      href={entryView.href}
      target={entryView.target}
      rel={entryView.rel}
      aria-label={entryView.label}
      title={entryView.label}
    >
      <span className="daily-hot-fixed-entry__icon" aria-hidden="true">🔥</span>
      <span className="daily-hot-fixed-entry__label">{entryView.label}</span>
    </a>
  );
};

export default DailyHotFixedEntry;
