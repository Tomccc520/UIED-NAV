/**
 * @file Card.tsx
 * @description 卡片组件 - 用于展示内容的容器
 * @copyright 版权所有 (c) 2025 UIED技术团队
 * @version 1.0.0
 */

import React from 'react';
import './Card.css';

// 卡片属性接口
interface CardProps {
  /** 子组件内容 */
  children: React.ReactNode;
  /** 是否可悬停 */
  hoverable?: boolean;
  /** 自定义CSS类名 */
  className?: string;
  /** 点击事件回调 */
  onClick?: (e: React.MouseEvent) => void;
}

/**
 * 卡片组件
 * @param props 组件属性
 * @returns JSX元素
 */
const Card: React.FC<CardProps> = ({
  children,
  hoverable = false,
  className = '',
  onClick
}) => {
  return (
    <div
      className={`card ${hoverable ? 'hoverable' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export default Card; 