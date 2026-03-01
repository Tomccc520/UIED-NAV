/**
 * @file index.ts
 * @description 前端用户界面组件
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

// 布局组件统一导出文件
import PageLayout from './PageLayout';
import Layout from './Layout';
import Navbar from './Navbar';
import Footer from './Footer';

// 导出所有布局组件
export {
  PageLayout,
  Layout,
  Navbar,
  Footer
};

// 默认导出 PageLayout（最常用的组件）
export default PageLayout; 