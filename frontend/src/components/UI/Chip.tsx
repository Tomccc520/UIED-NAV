/**
 * @file Chip.tsx
 * @description 前端用户界面组件
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

import React from 'react';
import './Chip.css';

interface ChipProps {
  children: React.ReactNode;
  size?: 'small' | 'medium' | 'large';
  variant?: 'info' | 'warning' | 'error' | 'success' | 'default';
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

const Chip: React.FC<ChipProps> = ({
  children,
  size = 'medium',
  variant = 'default',
  className = '',
  style,
  onClick,
  ...props
}) => {
  const chipClass = `
    custom-chip 
    custom-chip--${size} 
    custom-chip--${variant}
    ${onClick ? 'custom-chip--clickable' : ''}
    ${className}
  `.trim();

  return (
    <span
      className={chipClass}
      style={style}
      onClick={onClick}
      {...props}
    >
      {children}
    </span>
  );
};

export default Chip; 