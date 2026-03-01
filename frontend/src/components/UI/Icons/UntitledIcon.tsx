/**
 * @file UntitledIcon.tsx
 * @description 前端用户界面组件
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

/**
 * 图标渲染组件
 * 将后台配置的图标 key 映射到前端的 DesignIcons
 */

import React from 'react';
import DesignIcons from './index';

interface DynamicIconProps {
  name: string;
  size?: number;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
}

type DesignIconKey = keyof typeof DesignIcons;
type IconComponentType = React.ComponentType<{
  className?: string;
  style?: React.CSSProperties;
}>;

// 后台图标 key 到前端 DesignIcons 的映射
// key 与 admin/src/config/icons.tsx 中的 availableIcons 对应
const iconKeyMapping: Record<string, keyof typeof DesignIcons | null> = {
  // ============ 设计相关 ============
  'inspiration': 'Inspiration',
  'ui': 'UI',
  'graphic': 'Graphic',
  'template': 'Template',
  'material': 'Material',
  'icons': 'Icons',
  'color': 'Color',
  'font': 'Font',
  'brand': 'Brand',
  'prototype': 'Prototype',
  'kit': 'Kit',
  'animation': 'Animation',
  '3d': '3D',
  'print': 'Print',
  'art': 'Art',
  'figma': 'Figma',
  'illustration': 'Illustration',
  'components': 'Components',
  'mockup': 'Mockup',
  'palette': 'Palette',
  
  // ============ 媒体相关 ============
  'image': 'Image',
  'photo': 'Photo',
  'video': 'Video',
  'audio': 'Audio',
  'camera': 'Camera',
  
  // ============ 技术相关 ============
  'ai': 'AI',
  'code': 'Code',
  'developer': 'Developer',
  'web': 'Web',
  'mobile': 'Mobile',
  'plugin': 'Plugin',
  'data': 'Data',
  'analytics': 'Analytics',
  'visualization': 'visualization',
  'gameui': 'gameui',
  'metaverse': 'metaverse',
  'digital': 'Digital',
  'system': 'System',
  
  // ============ 商业相关 ============
  'ecommerce': 'Ecommerce',
  'store': 'Store',
  'marketing': 'Marketing',
  'platform': 'Platform',
  'livestreaming': 'LiveStreaming',
  'banner': 'Banner',
  'package': 'Package',
  
  // ============ 电商相关 ============
  'layout': 'Layout',
  'specs': 'Specs',
  
  // ============ 室内设计 ============
  'cad': 'CAD',
  'furniture': 'Furniture',
  'texture': 'Texture',
  'lighting': 'Lighting',
  'project': 'Project',
  'vr': 'VR',
  
  // ============ 通用图标 ============
  'tools': 'Tools',
  'tutorial': 'Tutorial',
  'learn': 'Learn',
  'blog': 'Blog',
  'community': 'Community',
  'book': 'Book',
  'education': 'Education',
  'resource': 'Resource',
  'carui': 'CarUI',
  'designteam': 'DesignTeam',
  'othercontent': 'othercontent',
  
  // 默认
  'default': null,
};

/**
 * 判断图标 key 是否存在于图标库中。
 */
const isDesignIconKey = (key: string): key is DesignIconKey => {
  return key in DesignIcons;
};

/**
 * 根据图标 key 获取组件。
 */
const getIconComponentByKey = (key: string): IconComponentType | null => {
  if (!key) return null;
  if (!isDesignIconKey(key)) return null;
  return DesignIcons[key] as IconComponentType;
};

/**
 * 动态图标组件
 * 根据后台配置的图标 key 渲染对应的前端图标
 */
export const UntitledIcon: React.FC<DynamicIconProps> = ({
  name,
  size = 24,
  color = 'currentColor',
  className,
  style,
}) => {
  // 查找映射的图标
  const mappedKey = iconKeyMapping[name] || iconKeyMapping[name.toLowerCase()];
  
  // 获取图标组件
  let IconComponent: IconComponentType | null = null;
  if (mappedKey) {
    IconComponent = getIconComponentByKey(mappedKey);
  }
  if (!IconComponent) {
    IconComponent = getIconComponentByKey(name);
  }
  if (!IconComponent) {
    IconComponent = getIconComponentByKey(name.toLowerCase());
  }
  
  if (IconComponent) {
    return (
      <IconComponent
        className={className}
        style={{
          width: size,
          height: size,
          color,
          ...style,
        }}
      />
    );
  }
  
  // 使用默认图标
  const DefaultIcon = DesignIcons.Tool;
  return (
    <DefaultIcon
      className={className}
      style={{
        width: size,
        height: size,
        color,
        ...style,
      }}
    />
  );
};

/**
 * 检查图标 key 是否有效
 */
export const isValidIconKey = (iconKey: string): boolean => {
  return !!(
    iconKeyMapping[iconKey] ||
    iconKeyMapping[iconKey.toLowerCase()] ||
    isDesignIconKey(iconKey) ||
    isDesignIconKey(iconKey.toLowerCase())
  );
};

export default UntitledIcon;
