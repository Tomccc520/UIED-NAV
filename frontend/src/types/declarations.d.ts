/**
 * @file declarations.d.ts
 * @description 类型声明文件
 * @copyright 版权所有 (c) 2024 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

// PNG 文件声明
declare module '*.png' {
  const src: string;
  export default src;
}

// 声明lodash/throttle模块
declare module 'lodash/throttle' {
  const throttle: (func: Function, wait: number) => Function;
  export default throttle;
}

// 声明wordpress-api模块
declare module '../services/wordpress-api' {
  type WordPressParams = Record<string, unknown>;
  type WordPressPost = Record<string, unknown>;

  const wordPressApi: {
    getLatestPosts: (params?: WordPressParams) => Promise<WordPressPost[]>;
    getCategoryPosts: (params?: WordPressParams) => Promise<WordPressPost[]>;
    getTagPosts: (params?: WordPressParams) => Promise<WordPressPost[]>;
    searchPosts: (params?: WordPressParams) => Promise<WordPressPost[]>;
    clearCache: (type: string) => void;
  };
  export default wordPressApi;
}

// 声明 Swiper React 模块（兼容 CRA + TypeScript 4.x 对 package exports 的类型解析问题）
declare module 'swiper/react' {
  import * as React from 'react';

  export const Swiper: React.ComponentType<Record<string, any>>;
  export const SwiperSlide: React.ComponentType<Record<string, any>>;
}

// 声明 Swiper 模块集合（按需补充常用模块）
declare module 'swiper/modules' {
  export const Navigation: any;
  export const Pagination: any;
  export const Autoplay: any;
  export const Thumbs: any;
}

// 声明 Swiper 样式模块
declare module 'swiper/css';
declare module 'swiper/css/navigation';
