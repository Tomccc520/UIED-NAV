/**
 * @file PageLayout.tsx
 * @description 前端用户界面组件
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

import React from 'react';
import '../../styles/global.css';

interface PageLayoutProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  showHeader?: boolean;
  className?: string;
  headerActions?: React.ReactNode;
  fullWidth?: boolean;
}

/**
 * 通用页面布局组件
 * 提供统一的页面结构和自适应设计
 */
const PageLayout: React.FC<PageLayoutProps> = ({
  title,
  subtitle,
  children,
  showHeader = true,
  className = '',
  headerActions,
  fullWidth = false
}) => {
  return (
    <div className={`page-container ${className}`}>
      {/* 页面头部 */}
      {showHeader && (
        <header className="page-header">
          <div className="page-header-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div>
                <h1 className="page-title">{title}</h1>
                {subtitle && <p className="page-subtitle">{subtitle}</p>}
              </div>
              {headerActions && (
                <div className="page-header-actions">
                  {headerActions}
                </div>
              )}
            </div>
          </div>
        </header>
      )}

      {/* 页面内容 */}
      <main className={fullWidth ? '' : 'content-container'}>
        {children}
      </main>
    </div>
  );
};

export default PageLayout; 