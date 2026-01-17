/**
 * @file pageIcons.ts
 * @description 管理后台组件
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

/**
 * 页面图标配置
 * 用于头部导航切换的图标
 */

export interface PageIconItem {
  key: string;
  name: string;
  emoji: string;
}

// 页面可用图标 - 与前端 DesignIcons 对应
export const pageIcons: PageIconItem[] = [
  { key: 'Figma', name: 'Figma/UI', emoji: '🎨' },
  { key: 'AI', name: 'AI人工智能', emoji: '🤖' },
  { key: 'Design', name: '平面设计', emoji: '🖼️' },
  { key: '3D', name: '3D设计', emoji: '🎲' },
  { key: 'Ecommerce', name: '电商', emoji: '🛒' },
  { key: 'Font', name: '字体', emoji: '🔤' },
  { key: 'Tool', name: '工具', emoji: '🔧' },
  { key: 'Video', name: '视频', emoji: '🎥' },
  { key: 'Photo', name: '摄影', emoji: '📷' },
  { key: 'Code', name: '代码', emoji: '💻' },
  { key: 'Image', name: '图片', emoji: '🖼️' },
  { key: 'Tutorial', name: '教程', emoji: '📚' },
  { key: 'UI', name: 'UI设计', emoji: '📱' },
  { key: 'Inspiration', name: '灵感', emoji: '💡' },
  { key: 'Material', name: '素材', emoji: '📦' },
  { key: 'Color', name: '配色', emoji: '🎨' },
  { key: 'Audio', name: '音频', emoji: '🎵' },
  { key: 'Web', name: '网页', emoji: '🌐' },
  { key: 'Mobile', name: '移动端', emoji: '📱' },
  { key: 'Animation', name: '动画', emoji: '🎬' },
  { key: 'Community', name: '社区', emoji: '👥' },
  { key: 'Specs', name: '规范', emoji: '📐' },
  { key: 'Data', name: '数据', emoji: '📊' },
  { key: 'Blog', name: '博客', emoji: '📝' },
  { key: 'Template', name: '模板', emoji: '📄' },
  { key: 'Graphic', name: '图形', emoji: '🎨' },
  { key: 'Icons', name: '图标', emoji: '⭐' },
  { key: 'Kit', name: '套件', emoji: '🧰' },
  { key: 'Prototype', name: '原型', emoji: '🔲' },
  { key: 'Brand', name: '品牌', emoji: '🏷️' },
  { key: 'Plugin', name: '插件', emoji: '🔌' },
  { key: 'Developer', name: '开发', emoji: '👨‍💻' },
  { key: 'Learn', name: '学习', emoji: '🎓' },
  { key: 'Art', name: '艺术', emoji: '🎭' },
  { key: 'Print', name: '印刷', emoji: '🖨️' },
  { key: 'Analytics', name: '分析', emoji: '📈' },
];

export const getPageIconByKey = (key: string): PageIconItem | undefined => {
  return pageIcons.find(icon => icon.key === key);
};
