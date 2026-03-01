/**
 * @file Grid.tsx
 * @description 前端用户界面组件
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

import React from 'react';
import './Grid.css';

interface RowProps {
  children: React.ReactNode;
  gutter?: [number, number];
  className?: string;
  style?: React.CSSProperties;
}

interface ColProps {
  children: React.ReactNode;
  xs?: number;
  sm?: number;
  md?: number;
  lg?: number;
  xl?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const Row: React.FC<RowProps> = ({
  children,
  gutter = [0, 0],
  className = '',
  style,
  ...props
}) => {
  const [horizontalGutter, verticalGutter] = gutter;
  
  const rowStyle = {
    ...style,
    '--row-horizontal-gutter': `${horizontalGutter / 2}px`,
    '--row-vertical-gutter': `${verticalGutter / 2}px`,
  } as React.CSSProperties;

  return (
    <div
      className={`custom-row ${className}`}
      style={rowStyle}
      {...props}
    >
      {children}
    </div>
  );
};

export const Col: React.FC<ColProps> = ({
  children,
  xs = 24,
  sm,
  md,
  lg,
  xl,
  className = '',
  style,
  ...props
}) => {
  const colClass = `
    custom-col
    custom-col-xs-${xs}
    ${sm ? `custom-col-sm-${sm}` : ''}
    ${md ? `custom-col-md-${md}` : ''}
    ${lg ? `custom-col-lg-${lg}` : ''}
    ${xl ? `custom-col-xl-${xl}` : ''}
    ${className}
  `.trim();

  return (
    <div
      className={colClass}
      style={style}
      {...props}
    >
      {children}
    </div>
  );
}; 