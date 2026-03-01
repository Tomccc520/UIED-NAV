/**
 * @file SEO/index.tsx
 * @description SEO组件 - 动态设置页面SEO信息
 * @copyright 版权所有 (c) 2025 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

import React, { useEffect } from 'react';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
  noindex?: boolean;
}

const SEO: React.FC<SEOProps> = ({
  title = 'UIED设计导航',
  description = 'UIED设计导航是专业的设计师导航网站，精选优质UI/UX设计工具、平面设计资源、AI设计工具，为设计师提供一站式设计资源导航服务。',
  keywords = '设计导航,UI设计工具,UX设计,平面设计,AI设计,设计资源,设计师工具,Figma,Sketch,设计灵感,UIED',
  image = 'https://hao.uied.cn/og-image.jpg',
  url = 'https://hao.uied.cn',
  type = 'website',
  noindex = false
}) => {
  const fullTitle = title === 'UIED设计导航' ? title : `${title} - UIED设计导航`;

  useEffect(() => {
    // 更新页面标题
    document.title = fullTitle;

    // 更新或创建meta标签的通用函数
    const updateMetaTag = (name: string, content: string, property = false) => {
      const selector = property ? `meta[property="${name}"]` : `meta[name="${name}"]`;
      let meta = document.querySelector(selector) as HTMLMetaElement;
      
      if (!meta) {
        meta = document.createElement('meta');
        if (property) {
          meta.setAttribute('property', name);
        } else {
          meta.setAttribute('name', name);
        }
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    // 更新基本SEO标签
    updateMetaTag('description', description);
    updateMetaTag('keywords', keywords);
    updateMetaTag('robots', noindex ? 'noindex,nofollow' : 'index,follow');

    // 更新Open Graph标签
    updateMetaTag('og:type', type, true);
    updateMetaTag('og:title', fullTitle, true);
    updateMetaTag('og:description', description, true);
    updateMetaTag('og:image', image, true);
    updateMetaTag('og:url', url, true);
    updateMetaTag('og:site_name', 'UIED设计导航', true);

    // 更新Twitter标签
    updateMetaTag('twitter:card', 'summary_large_image', true);
    updateMetaTag('twitter:title', fullTitle, true);
    updateMetaTag('twitter:description', description, true);
    updateMetaTag('twitter:image', image, true);

    // 更新canonical链接
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', url);

  }, [fullTitle, description, keywords, image, url, type, noindex]);

  return null; // 该组件不渲染任何内容
};

export default SEO; 