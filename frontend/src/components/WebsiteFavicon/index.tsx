/**
 * @file WebsiteFavicon/index.tsx
 * @description 统一的网站 Favicon 图标组件 - 支持后台配置的多级降级
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../services/api';
import { getBackendBaseUrl } from '../../utils/urlUtils';
import { unwrapApiList } from '../../utils/apiResponse';
import './index.css';

/** Favicon API 配置项 */
interface FaviconApiItem {
  id: number;
  name: string;
  urlTemplate: string;
  description?: string;
}

/** 组件属性 */
interface WebsiteFaviconProps {
  /** 网站 URL（用于从 Favicon API 获取图标） */
  websiteUrl?: string;
  /** 自定义图标 URL（优先使用） */
  iconUrl?: string;
  /** 网站名称（用于生成首字母图标） */
  name?: string;
  /** 图标尺寸 */
  size?: number;
  /** 自定义 className */
  className?: string;
  /** alt 文本 */
  alt?: string;
}

// ==================== 全局缓存（内存 + localStorage 持久化） ====================

const CACHE_KEY = 'uied_favicon_apis';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 小时缓存有效期

/** 后台 Favicon API 列表缓存 */
let cachedFaviconApis: FaviconApiItem[] | null = null;
let faviconApisPromise: Promise<FaviconApiItem[]> | null = null;

/**
 * 从 localStorage 读取缓存
 */
const loadFromStorage = (): FaviconApiItem[] | null => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { data, timestamp } = JSON.parse(raw);
    // 检查缓存是否过期
    if (Date.now() - timestamp > CACHE_TTL) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    return data as FaviconApiItem[];
  } catch {
    return null;
  }
};

/**
 * 写入 localStorage 缓存
 */
const saveToStorage = (data: FaviconApiItem[]) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
  } catch { /* localStorage 满了或不可用，忽略 */ }
};

// 启动时先从 localStorage 恢复缓存
if (!cachedFaviconApis) {
  cachedFaviconApis = loadFromStorage();
}

/**
 * 获取后台配置的 Favicon API 列表（内存 + localStorage 双层缓存）
 */
const fetchFaviconApis = async (): Promise<FaviconApiItem[]> => {
  // 内存缓存命中
  if (cachedFaviconApis) return cachedFaviconApis;

  // 防止并发请求
  if (faviconApisPromise) return faviconApisPromise;

  faviconApisPromise = api.get('/settings/favicon-apis')
    .then(res => {
      const apis = unwrapApiList<FaviconApiItem>(res.data);
      cachedFaviconApis = apis;
      saveToStorage(apis); // 持久化到 localStorage
      return apis;
    })
    .catch(() => {
      // 网络失败时尝试从 localStorage 恢复
      const stored = loadFromStorage();
      if (stored && stored.length > 0) {
        cachedFaviconApis = stored;
        return stored;
      }
      cachedFaviconApis = [];
      return [];
    })
    .finally(() => {
      faviconApisPromise = null;
    });

  return faviconApisPromise;
};

// ==================== 工具函数 ====================

/**
 * 获取完整的图片 URL（处理相对路径和错误端口）
 */
const getFullImageUrl = (url: string): string => {
  if (!url) return '';
  
  const backendBase = getBackendBaseUrl();
  
  if (url.startsWith('/uploads/')) return `${backendBase}${url}`;
  if (url.includes('localhost:5173/uploads/') || url.includes('localhost:3000/uploads/')) {
    const uploadPath = url.match(/\/uploads\/.+$/)?.[0];
    if (uploadPath) return `${backendBase}${uploadPath}`;
  }
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
  return `${backendBase}${url.startsWith('/') ? '' : '/'}${url}`;
};

/**
 * 从 URL 提取域名
 */
const getDomain = (url: string): string => {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
};

/**
 * 根据后台 Favicon API 模板生成图标 URL
 */
const buildFaviconUrl = (urlTemplate: string, websiteUrl: string): string => {
  try {
    const domain = getDomain(websiteUrl);
    return urlTemplate
      .replace(/\{domain\}/g, domain)
      .replace(/\{url\}/g, encodeURIComponent(websiteUrl));
  } catch {
    return '';
  }
};

/**
 * 生成基于名称首字母的 SVG 图标
 */
const generateLetterIcon = (name: string): string => {
  const safeName = name || '?';
  const initial = safeName.charAt(0).toUpperCase();
  const hue = safeName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 360;
  const bgColor = `hsl(${hue}, 60%, 90%)`;
  const textColor = `hsl(${hue}, 60%, 40%)`;
  return `data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"%3E%3Crect fill="${encodeURIComponent(bgColor)}" width="64" height="64" rx="8"/%3E%3Ctext x="32" y="42" text-anchor="middle" fill="${encodeURIComponent(textColor)}" font-size="28" font-weight="bold"%3E${encodeURIComponent(initial)}%3C/text%3E%3C/svg%3E`;
};

// ==================== 组件 ====================

const WebsiteFavicon: React.FC<WebsiteFaviconProps> = ({
  websiteUrl,
  iconUrl,
  name = '',
  size = 32,
  className = '',
  alt,
}) => {
  const [faviconApis, setFaviconApis] = useState<FaviconApiItem[]>(cachedFaviconApis || []);
  const [currentSrc, setCurrentSrc] = useState<string>('');
  const [fallbackIndex, setFallbackIndex] = useState(0);
  const [useLetter, setUseLetter] = useState(false);
  const mountedRef = useRef(true);

  // 加载后台 Favicon API 配置
  useEffect(() => {
    if (!cachedFaviconApis) {
      fetchFaviconApis().then(apis => {
        if (mountedRef.current) setFaviconApis(apis);
      });
    }
    return () => { mountedRef.current = false; };
  }, []);

  // 计算初始图标 URL
  useEffect(() => {
    setFallbackIndex(0);
    setUseLetter(false);

    if (iconUrl) {
      const fullUrl = getFullImageUrl(iconUrl);
      if (fullUrl) {
        setCurrentSrc(fullUrl);
        return;
      }
    }

    // 没有自定义图标，尝试第一个 Favicon API
    if (websiteUrl && faviconApis.length > 0) {
      const url = buildFaviconUrl(faviconApis[0].urlTemplate, websiteUrl);
      if (url) {
        setCurrentSrc(url);
        setFallbackIndex(1);
        return;
      }
    }

    // 没有任何可用来源，显示首字母
    setUseLetter(true);
    setCurrentSrc(generateLetterIcon(name));
  }, [iconUrl, websiteUrl, name, faviconApis]);

  // 图标加载失败 - 多级降级
  const handleError = useCallback(() => {
    // 尝试后台配置的 Favicon API
    if (websiteUrl && fallbackIndex < faviconApis.length) {
      const nextUrl = buildFaviconUrl(faviconApis[fallbackIndex].urlTemplate, websiteUrl);
      if (nextUrl) {
        setCurrentSrc(nextUrl);
        setFallbackIndex(prev => prev + 1);
        return;
      }
    }

    // 所有 API 都失败，显示首字母图标
    if (!useLetter) {
      setUseLetter(true);
      setCurrentSrc(generateLetterIcon(name));
    }
  }, [websiteUrl, faviconApis, fallbackIndex, name, useLetter]);

  const altText = alt || `${name || '网站'} 图标`;

  // 首字母图标模式 - 直接渲染 div
  if (useLetter && currentSrc.startsWith('data:')) {
    const safeName = name || '?';
    const initial = safeName.charAt(0).toUpperCase();
    const hue = safeName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 360;

    return (
      <div
        className={`website-favicon website-favicon-letter ${className}`}
        style={{
          width: size,
          height: size,
          backgroundColor: `hsl(${hue}, 60%, 90%)`,
          color: `hsl(${hue}, 60%, 40%)`,
          fontSize: size * 0.44,
        }}
        title={altText}
      >
        {initial}
      </div>
    );
  }

  return (
    <img
      src={currentSrc}
      alt={altText}
      className={`website-favicon ${className}`}
      style={{ width: size, height: size }}
      onError={handleError}
      loading="lazy"
    />
  );
};

export default WebsiteFavicon;
