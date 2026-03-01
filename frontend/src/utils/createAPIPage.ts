/**
 * @file createAPIPage.ts
 * @description 页面API对接工具函数
 * 提供通用的API数据服务创建和页面配置
 */

import { NavMenuType } from '../types';

// 页面配置映射
export const PAGE_CONFIG: Record<string, {
  slug: string;
  navType: NavMenuType;
  searchPageType: string;
}> = {
  uiux: {
    slug: 'uiux',
    navType: NavMenuType.UIUX,
    searchPageType: 'uiux'
  },
  ai: {
    slug: 'ai',
    navType: NavMenuType.AI,
    searchPageType: 'ai'
  },
  '3d': {
    slug: '3d',
    navType: NavMenuType.THREE_D,
    searchPageType: '3d'
  },
  ecommerce: {
    slug: 'ecommerce',
    navType: NavMenuType.ECOMMERCE,
    searchPageType: 'ecommerce'
  },
  interior: {
    slug: 'interior',
    navType: NavMenuType.INTERIOR,
    searchPageType: 'interior'
  },
  font: {
    slug: 'font',
    navType: NavMenuType.FONT,
    searchPageType: 'font'
  },
  design: {
    slug: 'design',
    navType: NavMenuType.DESIGN,
    searchPageType: 'design'
  }
};

// 环境变量控制数据源
export const DATA_SOURCE = process.env.REACT_APP_DATA_SOURCE || 'auto';

// 判断是否使用API
export const shouldUseAPI = () => DATA_SOURCE === 'api' || DATA_SOURCE === 'auto';
