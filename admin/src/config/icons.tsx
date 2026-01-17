/**
 * @file icons.tsx
 * @description 管理后台组件
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

/**
 * 图标库配置
 * 使用 @untitled-ui/icons-react 图标库
 * 保存的 key 值需要与前端 DesignIcons 的 key 对应
 */

import React from 'react';
import * as UntitledIcons from '@untitled-ui/icons-react';

interface IconProps {
  size?: number;
  color?: string;
}

export interface IconItem {
  key: string;           // 保存到数据库的值，需要与前端iconMap的key对应
  name: string;          // 显示名称
  category: string;      // 分类
  icon: React.FC<IconProps>;  // 图标组件
}

// 图标分类
export const iconCategories = [
  { key: 'design', name: '设计相关' },
  { key: 'media', name: '媒体相关' },
  { key: 'tech', name: '技术相关' },
  { key: 'business', name: '商业相关' },
  { key: 'ecommerce', name: '电商相关' },
  { key: 'interior', name: '室内设计' },
  { key: 'general', name: '通用图标' },
];

// 创建图标包装器，统一 props 接口
const createIcon = (IconComponent: React.ComponentType<any>): React.FC<IconProps> => {
  return ({ size = 24, color = 'currentColor' }) => (
    <IconComponent width={size} height={size} stroke={color} />
  );
};

// 可用图标列表 - key 与前端 DesignIcons 对应
export const availableIcons: IconItem[] = [
  // ============ 设计相关 ============
  { key: 'inspiration', name: '灵感', category: 'design', icon: createIcon(UntitledIcons.Lightbulb02) },
  { key: 'ui', name: 'UI设计', category: 'design', icon: createIcon(UntitledIcons.Palette) },
  { key: 'graphic', name: '平面设计', category: 'design', icon: createIcon(UntitledIcons.PenTool02) },
  { key: 'template', name: '模板', category: 'design', icon: createIcon(UntitledIcons.LayoutAlt01) },
  { key: 'material', name: '素材', category: 'design', icon: createIcon(UntitledIcons.Package) },
  { key: 'icons', name: '图标库', category: 'design', icon: createIcon(UntitledIcons.Star01) },
  { key: 'color', name: '配色', category: 'design', icon: createIcon(UntitledIcons.Droplets02) },
  { key: 'font', name: '字体', category: 'design', icon: createIcon(UntitledIcons.Type01) },
  { key: 'brand', name: '品牌', category: 'design', icon: createIcon(UntitledIcons.Award01) },
  { key: 'prototype', name: '原型', category: 'design', icon: createIcon(UntitledIcons.LayersThree01) },
  { key: 'kit', name: 'UI套件', category: 'design', icon: createIcon(UntitledIcons.Grid01) },
  { key: 'animation', name: '动效', category: 'design', icon: createIcon(UntitledIcons.PlayCircle) },
  { key: '3d', name: '3D设计', category: 'design', icon: createIcon(UntitledIcons.Cube01) },
  { key: 'print', name: '印刷', category: 'design', icon: createIcon(UntitledIcons.Printer) },
  { key: 'art', name: '艺术', category: 'design', icon: createIcon(UntitledIcons.Brush01) },
  { key: 'figma', name: 'Figma', category: 'design', icon: createIcon(UntitledIcons.Figma) },
  { key: 'illustration', name: '插画', category: 'design', icon: createIcon(UntitledIcons.Edit05) },
  { key: 'components', name: '组件', category: 'design', icon: createIcon(UntitledIcons.Grid01) },
  { key: 'mockup', name: '样机', category: 'design', icon: createIcon(UntitledIcons.Monitor01) },
  { key: 'palette', name: '调色板', category: 'design', icon: createIcon(UntitledIcons.Palette) },
  
  // ============ 媒体相关 ============
  { key: 'image', name: '图片', category: 'media', icon: createIcon(UntitledIcons.Image01) },
  { key: 'photo', name: '摄影', category: 'media', icon: createIcon(UntitledIcons.Camera01) },
  { key: 'video', name: '视频', category: 'media', icon: createIcon(UntitledIcons.VideoRecorder) },
  { key: 'audio', name: '音频', category: 'media', icon: createIcon(UntitledIcons.MusicNote01) },
  { key: 'camera', name: '相机', category: 'media', icon: createIcon(UntitledIcons.Camera01) },
  
  // ============ 技术相关 ============
  { key: 'ai', name: 'AI工具', category: 'tech', icon: createIcon(UntitledIcons.CpuChip01) },
  { key: 'code', name: '代码', category: 'tech', icon: createIcon(UntitledIcons.Code01) },
  { key: 'developer', name: '开发者', category: 'tech', icon: createIcon(UntitledIcons.Terminal) },
  { key: 'web', name: '网页', category: 'tech', icon: createIcon(UntitledIcons.Globe01) },
  { key: 'mobile', name: '移动端', category: 'tech', icon: createIcon(UntitledIcons.Phone01) },
  { key: 'plugin', name: '插件', category: 'tech', icon: createIcon(UntitledIcons.PuzzlePiece01) },
  { key: 'data', name: '数据', category: 'tech', icon: createIcon(UntitledIcons.Database01) },
  { key: 'analytics', name: '分析', category: 'tech', icon: createIcon(UntitledIcons.BarChart01) },
  { key: 'visualization', name: '可视化', category: 'tech', icon: createIcon(UntitledIcons.PieChart01) },
  { key: 'gameui', name: '游戏UI', category: 'tech', icon: createIcon(UntitledIcons.Cube02) },
  { key: 'metaverse', name: '元宇宙', category: 'tech', icon: createIcon(UntitledIcons.Globe02) },
  { key: 'digital', name: '数字孪生', category: 'tech', icon: createIcon(UntitledIcons.Monitor02) },
  { key: 'system', name: '设计系统', category: 'tech', icon: createIcon(UntitledIcons.Settings01) },
  
  // ============ 商业相关 ============
  { key: 'ecommerce', name: '电商', category: 'business', icon: createIcon(UntitledIcons.ShoppingCart01) },
  { key: 'store', name: '店铺', category: 'business', icon: createIcon(UntitledIcons.Building01) },
  { key: 'marketing', name: '营销', category: 'business', icon: createIcon(UntitledIcons.Announcement01) },
  { key: 'platform', name: '平台', category: 'business', icon: createIcon(UntitledIcons.Server01) },
  { key: 'livestreaming', name: '直播', category: 'business', icon: createIcon(UntitledIcons.Recording01) },
  { key: 'banner', name: '横幅', category: 'business', icon: createIcon(UntitledIcons.Flag01) },
  { key: 'package', name: '包装', category: 'business', icon: createIcon(UntitledIcons.Package) },
  
  // ============ 电商相关 ============
  { key: 'layout', name: '布局', category: 'ecommerce', icon: createIcon(UntitledIcons.LayoutGrid01) },
  { key: 'specs', name: '规范', category: 'ecommerce', icon: createIcon(UntitledIcons.File01) },
  
  // ============ 室内设计 ============
  { key: 'cad', name: 'CAD', category: 'interior', icon: createIcon(UntitledIcons.Ruler) },
  { key: 'furniture', name: '家具', category: 'interior', icon: createIcon(UntitledIcons.Home01) },
  { key: 'texture', name: '材质', category: 'interior', icon: createIcon(UntitledIcons.LayersTwo01) },
  { key: 'lighting', name: '灯光', category: 'interior', icon: createIcon(UntitledIcons.Lightbulb01) },
  { key: 'project', name: '项目', category: 'interior', icon: createIcon(UntitledIcons.Folder) },
  { key: 'vr', name: 'VR漫游', category: 'interior', icon: createIcon(UntitledIcons.Globe02) },
  
  // ============ 通用图标 ============
  { key: 'tools', name: '工具', category: 'general', icon: createIcon(UntitledIcons.Tool01) },
  { key: 'tutorial', name: '教程', category: 'general', icon: createIcon(UntitledIcons.BookOpen01) },
  { key: 'learn', name: '学习', category: 'general', icon: createIcon(UntitledIcons.GraduationHat01) },
  { key: 'blog', name: '博客', category: 'general', icon: createIcon(UntitledIcons.Edit01) },
  { key: 'community', name: '社区', category: 'general', icon: createIcon(UntitledIcons.Users01) },
  { key: 'book', name: '书籍', category: 'general', icon: createIcon(UntitledIcons.BookClosed) },
  { key: 'education', name: '教育', category: 'general', icon: createIcon(UntitledIcons.GraduationHat02) },
  { key: 'resource', name: '资源', category: 'general', icon: createIcon(UntitledIcons.FolderPlus) },
  { key: 'carui', name: '车载UI', category: 'general', icon: createIcon(UntitledIcons.Car01) },
  { key: 'designteam', name: '设计团队', category: 'general', icon: createIcon(UntitledIcons.Users02) },
  { key: 'othercontent', name: '其他', category: 'general', icon: createIcon(UntitledIcons.Tag01) },
];

// 根据 key 获取图标
export const getIconByKey = (key: string): IconItem | undefined => {
  return availableIcons.find(icon => icon.key === key || icon.key === key.toLowerCase());
};

// 根据分类获取图标
export const getIconsByCategory = (category: string): IconItem[] => {
  return availableIcons.filter(icon => icon.category === category);
};
