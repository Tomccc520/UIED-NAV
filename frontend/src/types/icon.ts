/**
 * @copyright Tomda (https://www.tomda.top)
 * @copyright UIED技术团队 (https://fsuied.com)
 * @author UIED技术团队
 * @createDate 2026.2.14
 *
 * @file icon.ts
 * @description 前端图标组件通用类型定义
 */

import React from 'react';

/**
 * 通用图标组件类型。
 * 约定支持 size/color/className/style 四类可选属性。
 */
export type IconComponent = React.ComponentType<{
  size?: number;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
}>;

