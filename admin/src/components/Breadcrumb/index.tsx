/**
 * @file components/Breadcrumb/index.tsx
 * @description 面包屑导航组件 - 基于路由自动生成
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

import React from 'react';
import { Breadcrumb as AntBreadcrumb } from 'antd';
import { Link, useLocation } from 'react-router-dom';
import { HomeOutlined } from '@ant-design/icons';

// 路由名称映射
const routeNameMap: Record<string, string> = {
  '/dashboard': '仪表盘',
  '/statistics': '数据统计',
  '/monitor': '网站监控',
  '/seo': 'SEO 管理',
  '/data-export': '数据导出',
  '/pages': '页面管理',
  '/hot-recommendations': '热门推荐',
  '/banners': '广告位管理',
  '/website-config': '网站配置',
  '/categories': '分类管理',
  '/websites': '网站管理',
  '/submissions': '提交审核',
  '/batch-import': '批量导入',
  '/system': '基本设置',
  '/nav-menus': '导航菜单',
  '/footer': '页脚设置',
  '/friend-links': '友情链接',
  '/social-media-groups': '关注交流',
  '/favicon-api': 'Favicon API',
  '/ai-settings': 'AI 助手',
  '/wordpress': 'WordPress',
  '/logs': '操作日志',
  '/users': '用户管理',
  '/account': '账户设置',
};

interface BreadcrumbProps {
  customItems?: Array<{
    title: string;
    path?: string;
  }>;
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ customItems }) => {
  const location = useLocation();
  
  // 如果提供了自定义面包屑，使用自定义的
  if (customItems && customItems.length > 0) {
    const items = [
      {
        title: (
          <Link to="/dashboard">
            <HomeOutlined />
          </Link>
        ),
      },
      ...customItems.map(item => ({
        title: item.path ? <Link to={item.path}>{item.title}</Link> : item.title,
      })),
    ];
    
    return <AntBreadcrumb items={items} />;
  }
  
  // 自动生成面包屑
  const pathSnippets = location.pathname.split('/').filter(i => i);
  
  // 如果在首页，不显示面包屑
  if (pathSnippets.length === 0 || location.pathname === '/dashboard') {
    return null;
  }
  
  const breadcrumbItems = [
    {
      title: (
        <Link to="/dashboard">
          <HomeOutlined />
        </Link>
      ),
    },
  ];
  
  // 构建面包屑路径
  pathSnippets.forEach((snippet, index) => {
    const url = `/${pathSnippets.slice(0, index + 1).join('/')}`;
    const isLast = index === pathSnippets.length - 1;
    const title = routeNameMap[url] || snippet;
    
    breadcrumbItems.push({
      title: isLast ? title : <Link to={url}>{title}</Link>,
    });
  });
  
  return <AntBreadcrumb items={breadcrumbItems} />;
};

export default Breadcrumb;
