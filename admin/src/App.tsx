/**
 * @file App.tsx
 * @description 管理后台组件
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, App as AntApp } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import AdminLayout from './layouts/AdminLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Categories from './pages/Categories';
import Websites from './pages/Websites';
import NavMenus from './pages/NavMenus';
import FooterSettings from './pages/FooterSettings';
import FriendLinks from './pages/FriendLinks';
import SiteSettings from './pages/SiteSettings';
import SocialMedia from './pages/SocialMedia';
import SocialMediaGroups from './pages/SocialMediaGroups';
import Pages from './pages/Pages';
import HotRecommendations from './pages/HotRecommendations';
import SystemSettings from './pages/SystemSettings';
import Banners from './pages/Banners';
import FaviconApiSettings from './pages/FaviconApiSettings';
import Statistics from './pages/Statistics';
import AiSettings from './pages/AiSettings';
import WordPressSettings from './pages/WordPressSettings';
import Submissions from './pages/Submissions';
import BatchImport from './pages/BatchImport';
import OperationLogs from './pages/OperationLogs';
import Monitor from './pages/Monitor';
import SeoSettings from './pages/SeoSettings';
import DataExport from './pages/DataExport';
import Users from './pages/Users';
import Account from './pages/Account';
import WebsiteConfig from './pages/WebsiteConfig';

// 路由守卫组件
function PrivateRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function App() {
  return (
    <ConfigProvider locale={zhCN}>
      <AntApp>
        <BrowserRouter basename="/admin">
          <Routes>
            {/* 登录页 */}
            <Route path="/login" element={<Login />} />

            {/* 需要登录的页面 */}
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <AdminLayout />
                </PrivateRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="statistics" element={<Statistics />} />
              <Route path="pages" element={<Pages />} />
              <Route path="hot-recommendations" element={<HotRecommendations />} />
              <Route path="banners" element={<Banners />} />
              <Route path="website-config" element={<WebsiteConfig />} />
              <Route path="categories" element={<Categories />} />
              <Route path="websites" element={<Websites />} />
              <Route path="nav-menus" element={<NavMenus />} />
              <Route path="footer" element={<FooterSettings />} />
              <Route path="friend-links" element={<FriendLinks />} />
              <Route path="social-media" element={<SocialMedia />} />
              <Route path="social-media-groups" element={<SocialMediaGroups />} />
              <Route path="site-settings" element={<SiteSettings />} />
              <Route path="favicon-api" element={<FaviconApiSettings />} />
              <Route path="ai-settings" element={<AiSettings />} />
              <Route path="system" element={<SystemSettings />} />
              <Route path="wordpress" element={<WordPressSettings />} />
              <Route path="submissions" element={<Submissions />} />
              <Route path="batch-import" element={<BatchImport />} />
              <Route path="logs" element={<OperationLogs />} />
              <Route path="monitor" element={<Monitor />} />
              <Route path="seo" element={<SeoSettings />} />
              <Route path="data-export" element={<DataExport />} />
              <Route path="users" element={<Users />} />
              <Route path="account" element={<Account />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AntApp>
    </ConfigProvider>
  );
}

export default App;
