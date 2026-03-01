/**
 * @file Modal.tsx
 * @description 模态框组件 - 用于显示各种弹窗内容
 * @copyright 版权所有 (c) 2025 UIED技术团队
 * @version 1.0.0
 */

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import './Modal.css';

// 模态框属性接口
interface ModalProps {
  /** 是否显示模态框 */
  visible: boolean;
  /** 关闭回调函数 */
  onClose: () => void;
  /** 模态框标题 */
  title?: string;
  /** 子组件内容 */
  children: React.ReactNode;
  /** 模态框宽度 */
  width?: number | string;
  /** 是否显示关闭按钮 */
  closable?: boolean;
  /** 点击遮罩层是否关闭 */
  maskClosable?: boolean;
  /** 自定义CSS类名 */
  className?: string;
  /** 层级 */
  zIndex?: number;
}

/**
 * 模态框组件
 * @param props 组件属性
 * @returns JSX元素
 */
const Modal: React.FC<ModalProps> = ({
  visible,
  onClose,
  title,
  children,
  width = 520,
  closable = true,
  maskClosable = true,
  className = '',
  zIndex = 9999
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // ESC键关闭模态框
  useEffect(() => {
    if (!visible) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && closable) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    // 防止页面滚动
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [visible, closable, onClose]);

  // 处理遮罩层点击
  const handleMaskClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    // 允许点击 mask 或 wrapper 关闭
    if ((target === e.currentTarget || target.classList.contains('modal-wrapper')) && maskClosable) {
      onClose();
    }
  };

  if (!mounted || !visible) {
    return null;
  }

  return createPortal(
    <div 
      className={`modal-mask ${className}`}
      style={{ zIndex }}
      onClick={handleMaskClick}
    >
      <div className="modal-wrapper">
        <div 
          className="modal-container"
          style={{ width }}
        >
          {/* 模态框头部 */}
          {(title || closable) && (
            <div className="modal-header">
              {title && <h3 className="modal-title">{title}</h3>}
              {closable && (
                <button 
                  className="modal-close-btn"
                  onClick={onClose}
                  aria-label="关闭"
                >
                  ×
                </button>
              )}
            </div>
          )}

          {/* 模态框内容 */}
          <div className="modal-content">
            {children}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default Modal; 