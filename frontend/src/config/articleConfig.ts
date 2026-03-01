/**
 * @file config/articleConfig.ts
 * @description 文章系统前端配置 - 用于增强分类/专题的视觉表现
 * @copyright Tomda
 */

export interface TopicConfig {
  id: string; // 对应 category 或 tag 的 slug
  type: 'category' | 'tag';
  title: string;
  description: string;
  coverImage?: string; // 顶部背景图
  icon?: string; // 分类图标
  themeColor?: string; // 主题色
}

// 默认配置
export const DEFAULT_ARTICLE_CONFIG = {
  title: '设计专栏',
  description: '汇聚优质设计文章，分享前沿设计趋势、实战技巧与行业洞察',
  coverImage: 'https://img.uied.cn/wp-content/uploads/2024/02/article-bg-default.jpg'
};

// 专题/分类配置表
// 可以根据实际业务需求在这里配置特定的分类或标签的视觉信息
export const ARTICLE_TOPICS: Record<string, TopicConfig> = {
  // 分类配置
  'ui-design': {
    id: 'ui-design',
    type: 'category',
    title: 'UI 设计',
    description: '探索用户界面设计的艺术与科学，分享最新的 UI 趋势、组件库和设计系统实践。',
    themeColor: '#3b82f6',
    coverImage: 'https://img.uied.cn/wp-content/uploads/2024/02/ui-design-bg.jpg',
    icon: '🎨'
  },
  'ux-design': {
    id: 'ux-design',
    type: 'category',
    title: '用户体验',
    description: '深入了解用户行为，掌握用户研究方法，打造极致的用户体验。',
    themeColor: '#10b981',
    coverImage: 'https://img.uied.cn/wp-content/uploads/2024/02/ux-design-bg.jpg',
    icon: '🧠'
  },
  'frontend': {
    id: 'frontend',
    type: 'category',
    title: '前端开发',
    description: '连接设计与代码，分享 React, Vue, CSS 等前端技术与设计工程化实践。',
    themeColor: '#6366f1',
    coverImage: 'https://img.uied.cn/wp-content/uploads/2024/02/frontend-bg.jpg',
    icon: '💻'
  },
  
  // 标签/专题配置
  'ai-tools': {
    id: 'ai-tools',
    type: 'tag',
    title: 'AI 设计工具',
    description: '精选 AI 设计工具评测与教程，助力设计师拥抱 AIGC 时代。',
    themeColor: '#8b5cf6',
    coverImage: 'https://img.uied.cn/wp-content/uploads/2024/02/ai-tools-bg.jpg',
    icon: '🤖'
  },
  'career': {
    id: 'career',
    type: 'tag',
    title: '职场成长',
    description: '设计师职场进阶指南，包含面试技巧、作品集制作与职业规划。',
    themeColor: '#f59e0b',
    coverImage: 'https://img.uied.cn/wp-content/uploads/2024/02/career-bg.jpg',
    icon: '📈'
  }
};

/**
 * 获取当前页面的专题配置
 */
export const getTopicConfig = (category?: string, tag?: string): TopicConfig | null => {
  // 优先匹配 tag（专题通常是特定的 tag）
  if (tag && ARTICLE_TOPICS[tag]) {
    return ARTICLE_TOPICS[tag];
  }
  
  // 其次匹配 category
  if (category && ARTICLE_TOPICS[category]) {
    return ARTICLE_TOPICS[category];
  }
  
  return null;
};
