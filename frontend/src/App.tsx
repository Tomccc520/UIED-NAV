/**
 * @file App.tsx
 * @description 前端用户界面组件
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, useParams } from 'react-router-dom';

// Context
import { SiteProvider } from './contexts/SiteContext';
import { UserProvider } from './contexts/UserContext';

// 页面组件
import HomePage from './pages/Home';
import CategoryPage from './pages/Category';
import TagPage from './pages/Tag';
import SitePage from './pages/Site';
import SearchPage from './pages/Search';
import ProfilePage from './pages/Profile';
import SubmitPage from './pages/Submit';
import ChangelogPage from './pages/Changelog';
import DailyHotPage from './pages/DailyHot';
import RankingsPage from './pages/Rankings';
import WebsiteComparePage from './pages/WebsiteCompare';
import NotFoundPage from './pages/NotFound';
import WebsiteDetail from './pages/WebsiteDetail';
import Layout from './components/layout/Layout';
import DynamicPage from './components/DynamicPage';
import { FIXED_DYNAMIC_ROUTES } from './config/navModel';

// @pro-feature-start: articles
import { ArticleList, ArticleDetail } from './pages/Articles';
// @pro-feature-end: articles
import './App.css';

// 动态页面路由组件
const DynamicPageRoute: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  return <DynamicPage slug={slug || ''} />;
};

/**
 * 固定导航 slug 的动态页面路由组件。
 */
const FixedDynamicPageRoute: React.FC<{ slug: string }> = ({ slug }) => {
  return <DynamicPage slug={slug} />;
};

function App() {
  return (
    <SiteProvider>
      <UserProvider>
        <Router>
        <Layout>
          <Routes>
            {/* 固定页面路由 - 统一走动态页模型 */}
            {FIXED_DYNAMIC_ROUTES.map((routeItem) => (
              <Route
                key={`fixed-dynamic-${routeItem.path}-${routeItem.slug}`}
                path={routeItem.path}
                element={<FixedDynamicPageRoute slug={routeItem.slug} />}
              />
            ))}
            <Route path="/home" element={<HomePage />} />
            <Route path="/category" element={<CategoryPage />} />
            <Route path="/category/:slug" element={<CategoryPage />} />
            <Route path="/tag" element={<TagPage />} />
            <Route path="/tag/:slug" element={<TagPage />} />
            <Route path="/site/:id" element={<SitePage />} />
            <Route path="/website/:idOrSlug" element={<WebsiteDetail />} />
            <Route path="/vs/:leftIdOrSlug/:rightIdOrSlug" element={<WebsiteComparePage />} />
            <Route path="/vs/:pair" element={<WebsiteComparePage />} />
            
            {/* @pro-feature-start: articles */}
            <Route path="/articles" element={<ArticleList />} />
            <Route path="/article/:slug" element={<ArticleDetail />} />
            <Route path="/articles/:slug" element={<ArticleDetail />} />
            {/* @pro-feature-end: articles */}
            
            <Route path="/search" element={<SearchPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/submit" element={<SubmitPage />} />
            <Route path="/changelog" element={<ChangelogPage />} />
            {/* 每日热榜专用路由：避免落入动态页 /p/:slug 后请求 pages/daily-hot/full 导致 404 */}
            <Route path="/p/daily-hot" element={<DailyHotPage />} />
            <Route path="/daily-hot" element={<DailyHotPage />} />
            <Route path="/p/rankings" element={<RankingsPage />} />
            <Route path="/rankings" element={<RankingsPage />} />
            
            {/* 动态页面路由 - 后台新建的页面通过 /p/xxx 访问 */}
            <Route path="/p/:slug" element={<DynamicPageRoute />} />
            
            {/* 404页面 - 必须放在最后 */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Layout>
      </Router>
      </UserProvider>
    </SiteProvider>
  );
}

export default App;
