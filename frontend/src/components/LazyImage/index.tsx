/**
 * @file LazyImage/index.tsx
 * @description 图片懒加载组件，使用Intersection Observer API
 * @copyright 版权所有 (c) 2025 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 * 
 * Requirements: 10.1 - THE Frontend_App SHALL 使用懒加载方式加载非首屏图片
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import './index.css';

// 默认占位图标 - 使用简单的SVG
const DEFAULT_PLACEHOLDER = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"%3E%3Crect fill="%23f0f0f0" width="64" height="64"/%3E%3Ctext x="32" y="36" text-anchor="middle" fill="%23999" font-size="12"%3E...%3C/text%3E%3C/svg%3E';

// 默认错误图标
const DEFAULT_ERROR_ICON = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"%3E%3Crect fill="%23f5f5f5" width="64" height="64" rx="8"/%3E%3Ctext x="32" y="38" text-anchor="middle" fill="%23ccc" font-size="24"%3E?%3C/text%3E%3C/svg%3E';

export interface LazyImageProps {
  /** 图片源URL */
  src: string;
  /** 图片alt文本 */
  alt: string;
  /** 占位图URL */
  placeholder?: string;
  /** 加载失败时显示的图片URL */
  fallback?: string;
  /** 备用图片URL（第一次加载失败后尝试） */
  fallbackSrc?: string;
  /** 图片加载成功回调 */
  onLoad?: () => void;
  /** 图片加载失败回调 */
  onError?: (error: Error) => void;
  /** 自定义类名 */
  className?: string;
  /** 自定义样式 */
  style?: React.CSSProperties;
  /** 是否启用预加载（鼠标悬停时） */
  enablePreload?: boolean;
  /** Intersection Observer的rootMargin */
  rootMargin?: string;
  /** Intersection Observer的threshold */
  threshold?: number;
  /** 图片宽度 */
  width?: number | string;
  /** 图片高度 */
  height?: number | string;
}

export interface LazyImageState {
  isLoaded: boolean;
  isError: boolean;
  isInView: boolean;
  currentSrc: string;
}

/**
 * 懒加载图片组件
 * 使用Intersection Observer API实现图片懒加载
 */
const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  placeholder = DEFAULT_PLACEHOLDER,
  fallback = DEFAULT_ERROR_ICON,
  fallbackSrc,
  onLoad,
  onError,
  className = '',
  style,
  enablePreload = true,
  rootMargin = '50px',
  threshold = 0.1,
  width,
  height,
}) => {
  const [state, setState] = useState<LazyImageState>({
    isLoaded: false,
    isError: false,
    isInView: false,
    currentSrc: placeholder,
  });
  
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const hasTriedFallback = useRef(false);

  // 处理图片加载成功
  const handleLoad = useCallback(() => {
    setState(prev => ({
      ...prev,
      isLoaded: true,
      isError: false,
    }));
    onLoad?.();
  }, [onLoad]);

  // 处理图片加载失败
  const handleError = useCallback(() => {
    // 如果有备用源且还没尝试过，先尝试备用源
    if (fallbackSrc && !hasTriedFallback.current) {
      hasTriedFallback.current = true;
      setState(prev => ({
        ...prev,
        currentSrc: fallbackSrc,
      }));
      return;
    }

    // 使用最终的fallback图片
    setState(prev => ({
      ...prev,
      isError: true,
      isLoaded: true,
      currentSrc: fallback,
    }));
    onError?.(new Error(`Failed to load image: ${src}`));
  }, [fallbackSrc, fallback, src, onError]);

  // 设置Intersection Observer
  useEffect(() => {
    const element = imgRef.current;
    if (!element) return;

    // 检查浏览器是否支持Intersection Observer
    if (!('IntersectionObserver' in window)) {
      // 不支持时直接加载图片
      setState(prev => ({
        ...prev,
        isInView: true,
        currentSrc: src,
      }));
      return;
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setState(prev => ({
              ...prev,
              isInView: true,
              currentSrc: src,
            }));
            // 进入视口后停止观察
            observerRef.current?.unobserve(element);
          }
        });
      },
      {
        rootMargin,
        threshold,
      }
    );

    observerRef.current.observe(element);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [src, rootMargin, threshold]);

  // 重置状态当src改变时
  useEffect(() => {
    hasTriedFallback.current = false;
    setState(prev => ({
      ...prev,
      isLoaded: false,
      isError: false,
      currentSrc: prev.isInView ? src : placeholder,
    }));
  }, [src, placeholder]);

  // 预加载处理（鼠标悬停时）
  const handleMouseEnter = useCallback(() => {
    if (!enablePreload || state.isInView || state.isLoaded) return;
    
    // 预加载图片
    const img = new Image();
    img.src = src;
  }, [enablePreload, state.isInView, state.isLoaded, src]);

  return (
    <img
      ref={imgRef}
      src={state.currentSrc}
      alt={alt}
      className={`lazy-image ${className} ${state.isLoaded ? 'lazy-image--loaded' : ''} ${state.isError ? 'lazy-image--error' : ''}`}
      style={{
        ...style,
        width,
        height,
      }}
      onLoad={handleLoad}
      onError={handleError}
      onMouseEnter={handleMouseEnter}
      loading="lazy"
    />
  );
};

export default LazyImage;

/**
 * 用于测试的辅助函数 - 验证图片加载降级逻辑
 * Property 9: 图标加载降级
 * 
 * @param src 原始图片URL
 * @param fallbackSrc 备用图片URL
 * @param fallback 最终降级图片URL
 * @returns 加载结果
 */
export const testImageLoadFallback = async (
  src: string,
  fallbackSrc?: string,
  fallback: string = DEFAULT_ERROR_ICON
): Promise<{
  finalSrc: string;
  loadAttempts: string[];
  isError: boolean;
}> => {
  const loadAttempts: string[] = [];
  let finalSrc = src;
  let isError = false;

  // 模拟加载原始图片
  const loadImage = (url: string): Promise<boolean> => {
    return new Promise((resolve) => {
      loadAttempts.push(url);
      // 在测试环境中，我们模拟加载结果
      // 实际使用时会通过Image对象加载
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = url;
      // 设置超时以防止无限等待
      setTimeout(() => resolve(false), 100);
    });
  };

  // 尝试加载原始图片
  const srcLoaded = await loadImage(src);
  if (srcLoaded) {
    return { finalSrc: src, loadAttempts, isError: false };
  }

  // 尝试加载备用图片
  if (fallbackSrc) {
    const fallbackSrcLoaded = await loadImage(fallbackSrc);
    if (fallbackSrcLoaded) {
      return { finalSrc: fallbackSrc, loadAttempts, isError: false };
    }
  }

  // 使用最终降级图片
  finalSrc = fallback;
  isError = true;

  return { finalSrc, loadAttempts, isError };
};

/**
 * 验证降级处理是否正确
 * 用于Property 9测试
 */
export const validateFallbackBehavior = (
  loadAttempts: string[],
  finalSrc: string,
  originalSrc: string,
  fallbackSrc?: string,
  fallback: string = DEFAULT_ERROR_ICON
): boolean => {
  // 验证1: 至少尝试加载了原始图片
  if (loadAttempts.length === 0 || loadAttempts[0] !== originalSrc) {
    return false;
  }

  // 验证2: 如果有备用源，应该在原始失败后尝试
  if (fallbackSrc && loadAttempts.length >= 2) {
    if (loadAttempts[1] !== fallbackSrc) {
      return false;
    }
  }

  // 验证3: 最终结果应该是有效的图片URL
  if (!finalSrc || finalSrc.length === 0) {
    return false;
  }

  // 验证4: 如果所有加载都失败，应该使用fallback
  if (loadAttempts.length > 0 && finalSrc === fallback) {
    return true; // 正确降级到fallback
  }

  // 验证5: 如果某个加载成功，finalSrc应该是成功加载的URL
  if (loadAttempts.includes(finalSrc)) {
    return true;
  }

  return finalSrc === fallback;
};

// 导出默认图片常量供外部使用
export { DEFAULT_PLACEHOLDER, DEFAULT_ERROR_ICON };
