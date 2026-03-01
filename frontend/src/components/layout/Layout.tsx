/**
 * @file Layout.tsx
 * @description 布局组件，提供页面的基础框架结构
 * @copyright 版权所有 (c) 2024 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.3.0
 */

import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import DailyHotFixedEntry from './DailyHotFixedEntry';
import './Layout.css';

interface LayoutProps {
  children: React.ReactNode;
}

/**
 * 布局组件
 * 提供统一的页面框架，包含导航栏、主内容区域和页脚
 * 
 * @version 1.3.0
 * @author UIED技术团队 (https://fsuied.com)
 */
const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="layout">
      {/* 顶部导航栏 */}
      <Navbar />
      
      {/* 主内容区域 */}
      <main className="layout-main">
        <div className="content-wrapper">
          {children}
        </div>
      </main>
      
      {/* 页脚 */}
      <Footer />

      {/* 每日热榜固定入口（受后台显示位置配置控制） */}
      <DailyHotFixedEntry />
    </div>
  );
};

export default Layout; 
