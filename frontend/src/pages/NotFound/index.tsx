/**
 * @file index.tsx
 * @description 404页面组件 - 简洁的页面未找到提示
 * @copyright 版权所有 (c) 2025 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SEO from '../../components/SEO';
import './index.css';

/**
 * 404页面组件
 * @returns 404页面UI组件
 */
const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    // 倒计时逻辑
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      // 倒计时结束，跳转到首页
      navigate('/');
    }
  }, [countdown, navigate]);

  return (
    <>
      <SEO 
        title="页面未找到"
        description="抱歉，您访问的页面不存在。UIED NAV是专业的设计工具导航网站，为设计师提供最新的设计工具和资源。"
        keywords="404,页面未找到,设计工具,UI设计,UX设计,设计资源"
        url="https://fsuied.com/404"
        noindex={true}
      />
      
      <div className="not-found-container">
        <div className="not-found-content">
          {/* 404数字 */}
          <div className="not-found-icon">
            <div className="number-404">
              <span className="number">4</span>
              <span className="number">0</span>
              <span className="number">4</span>
            </div>
            <p className="error-subtitle">页面未找到</p>
          </div>

          {/* 错误信息 */}
          <div className="not-found-message">
            <h1>抱歉，页面不存在</h1>
            <p>您访问的页面可能已被移动、删除或输入了错误的网址。</p>
            <p className="auto-redirect">
              页面将在 <span className="countdown">{countdown}</span> 秒后自动跳转到首页
            </p>
          </div>

          {/* 操作按钮 */}
          <div className="not-found-actions">
            <Link to="/" className="btn btn-primary">
              返回首页
            </Link>
            <button 
              onClick={() => window.history.back()} 
              className="btn btn-secondary"
            >
              返回上页
            </button>
          </div>

          {/* 推荐链接 */}
          <div className="not-found-links">
            <h3>您可能在寻找：</h3>
            <div className="link-grid">
              <Link to="/ai" className="category-link">
                <span className="link-icon">🤖</span>
                <span className="link-text">AI工具</span>
              </Link>
              <Link to="/uiux" className="category-link">
                <span className="link-icon">🎨</span>
                <span className="link-text">UI/UX设计</span>
              </Link>
              <Link to="/design" className="category-link">
                <span className="link-icon">✨</span>
                <span className="link-text">设计工具</span>
              </Link>
              <Link to="/font" className="category-link">
                <span className="link-icon">🔤</span>
                <span className="link-text">字体资源</span>
              </Link>
              <Link to="/3d" className="category-link">
                <span className="link-icon">🎯</span>
                <span className="link-text">3D工具</span>
              </Link>
              <Link to="/interior" className="category-link">
                <span className="link-icon">🏠</span>
                <span className="link-text">室内设计</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default NotFoundPage; 