/**
 * @file AdminLayout.tsx
 * @description 管理后台布局组件 - 包含侧边栏、顶部导航和首页按钮
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, theme, Avatar, Dropdown, Space, message, Button } from 'antd';
import {
  DashboardOutlined,
  AppstoreOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
  BarChartOutlined,
  TeamOutlined,
  HomeOutlined,
  GithubOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons';
import { authApi } from '../services/api';
import Breadcrumb from '../components/Breadcrumb';

const { Header, Sider, Content } = Layout;

const menuItems = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: '仪表盘' },
  {
    key: 'content',
    icon: <AppstoreOutlined />,
    label: '内容管理',
    children: [
      { key: '/pages', label: '页面管理' },
      { key: '/categories', label: '分类管理' },
      { key: '/websites', label: '网站管理' },
      { key: '/hot-recommendations', label: '热门推荐' },
      { key: '/banners', label: '广告位管理' },
      { key: '/submissions', label: '提交审核' },
      { key: '/batch-import', label: '批量导入' },
    ],
  },
  {
    key: 'data',
    icon: <BarChartOutlined />,
    label: '数据分析',
    children: [
      { key: '/statistics', label: '数据统计' },
      { key: '/monitor', label: '网站监控' },
      { key: '/data-export', label: '数据导出' },
    ],
  },
  {
    key: 'settings',
    icon: <SettingOutlined />,
    label: '系统设置',
    children: [
      { key: '/system', label: '基本设置' },
      { key: '/website-config', label: '网站配置' },
      { key: '/seo', label: 'SEO 管理' },
      { key: '/nav-menus', label: '导航菜单' },
      { key: '/footer', label: '页脚设置' },
      { key: '/friend-links', label: '友情链接' },
      { key: '/social-media-groups', label: '关注交流' },
      { key: '/favicon-api', label: 'Favicon API' },
      { key: '/ai-settings', label: 'AI 助手' },
      { key: '/wordpress', label: 'WordPress' },
    ],
  },
  {
    key: 'system',
    icon: <TeamOutlined />,
    label: '系统管理',
    children: [
      { key: '/users', label: '用户管理' },
      { key: '/logs', label: '操作日志' },
    ],
  },
];

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [username, setUsername] = useState('管理员');
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = theme.useToken();

  useEffect(() => {
    // 获取用户信息
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      setUsername(user.username);
    }
  }, []);

  const handleMenuClick = ({ key }: { key: string }) => {
    if (key.startsWith('/')) {
      navigate(key);
    }
  };

  const handleUserMenuClick = async ({ key }: { key: string }) => {
    if (key === 'profile') {
      navigate('/account');
    } else if (key === 'logout') {
      try {
        await authApi.logout();
      } catch (e) {
        // 忽略错误
      }
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      message.success('已退出登录');
      navigate('/login');
    }
  };

  const userMenuItems = [
    { key: 'profile', icon: <UserOutlined />, label: '账户设置' },
    { type: 'divider' as const },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      danger: true,
    },
  ];

  // 获取当前选中的菜单项
  const getSelectedKeys = () => {
    const path = location.pathname;
    return [path];
  };

  // 获取展开的子菜单
  const getOpenKeys = () => {
    const path = location.pathname;
    if (['/pages', '/categories', '/websites', '/hot-recommendations', '/banners', '/submissions', '/batch-import'].includes(path)) return ['content'];
    if (['/system', '/nav-menus', '/footer', '/friend-links', '/social-media-groups', '/favicon-api', '/ai-settings', '/wordpress'].includes(path))
      return ['settings'];
    return [];
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* 跳过导航链接 - 无障碍性 */}
      <a href="#main-content" className="skip-to-content">
        跳转到主内容
      </a>
      
      <Sider
        trigger={null}
        collapsed={collapsed}
        theme="light"
        width={240}
        style={{
          boxShadow: '2px 0 8px rgba(0,0,0,0.06)',
          zIndex: 10,
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          overflow: 'hidden',
        }}
      >
        {/* Logo 区域 */}
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 16px',
            borderBottom: '1px solid #f0f0f0',
            flexShrink: 0,
          }}
        >
          {!collapsed && (
            <img src="/admin/logo.svg" alt="UIED" style={{ height: 32 }} />
          )}
          {collapsed && (
            <img src="/admin/logo.svg" alt="UIED" style={{ height: 28 }} />
          )}
        </div>

        <Menu
          mode="inline"
          selectedKeys={getSelectedKeys()}
          defaultOpenKeys={getOpenKeys()}
          items={menuItems}
          onClick={handleMenuClick}
          style={{
            borderRight: 0,
            padding: '8px 0',
            fontSize: 14,
            flex: 1,
            overflowY: 'auto',
            minHeight: 0,
          }}
        />

        {/* 底部区域：版权信息（固定） */}
        <div style={{ flexShrink: 0 }}>
          <div
            style={{
              padding: collapsed ? '12px 0' : '12px 20px',
              borderTop: '1px solid #f0f0f0',
              background: '#fff',
              textAlign: 'center',
              fontSize: 12,
              color: '#8c8c8c',
              lineHeight: 1.8,
            }}
          >
            {!collapsed && (
              <>
                <div style={{ marginBottom: 6, display: 'flex', justifyContent: 'center', gap: 16 }}>
                  <a
                    href="https://github.com/Tomccc520/UIED-NAV"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ 
                      color: '#595959', 
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      transition: 'color 0.2s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = token.colorPrimary}
                    onMouseLeave={(e) => e.currentTarget.style.color = '#595959'}
                    title="GitHub 开源项目"
                  >
                    <GithubOutlined style={{ fontSize: 16 }} />
                    <span>GitHub</span>
                  </a>
                  <a
                    href="https://gitee.com/tomdac/uied-nav"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ 
                      color: '#595959', 
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      transition: 'color 0.2s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#C71D23'}
                    onMouseLeave={(e) => e.currentTarget.style.color = '#595959'}
                    title="Gitee 开源项目"
                  >
                    <svg viewBox="0 0 1024 1024" width="16" height="16" fill="currentColor" style={{ verticalAlign: 'middle' }}>
                      <path d="M512 1024C229.222 1024 0 794.778 0 512S229.222 0 512 0s512 229.222 512 512-229.222 512-512 512z m259.149-568.883h-290.74a25.293 25.293 0 0 0-25.292 25.293l-0.026 63.206c0 13.952 11.315 25.293 25.267 25.293h177.024c13.978 0 25.293 11.315 25.293 25.267v12.646a75.853 75.853 0 0 1-75.853 75.853h-240.23a25.293 25.293 0 0 1-25.267-25.293V417.203a75.853 75.853 0 0 1 75.827-75.853h353.946a25.293 25.293 0 0 0 25.267-25.292l0.077-63.207a25.293 25.293 0 0 0-25.268-25.293H417.152a189.62 189.62 0 0 0-189.62 189.645V771.15c0 13.977 11.316 25.293 25.294 25.293h372.94a170.65 170.65 0 0 0 170.65-170.65V480.384a25.293 25.293 0 0 0-25.293-25.267z"/>
                    </svg>
                    <span>Gitee</span>
                  </a>
                </div>
                <div style={{ color: '#8c8c8c', fontSize: 11 }}>
                  © 2026{' '}
                  <a
                    href="https://fsuied.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ 
                      color: '#8c8c8c', 
                      textDecoration: 'none',
                      transition: 'color 0.2s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = token.colorPrimary}
                    onMouseLeave={(e) => e.currentTarget.style.color = '#8c8c8c'}
                  >
                    UIED 技术团队
                  </a>
                </div>
              </>
            )}
            {collapsed && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
                <a
                  href="https://github.com/Tomccc520/UIED-NAV"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#595959', lineHeight: 1 }}
                  onMouseEnter={(e) => e.currentTarget.style.color = token.colorPrimary}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#595959'}
                  title="GitHub 开源项目"
                >
                  <GithubOutlined style={{ fontSize: 16 }} />
                </a>
                <a
                  href="https://gitee.com/tomdac/uied-nav"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#595959', lineHeight: 1 }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#C71D23'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#595959'}
                  title="Gitee 开源项目"
                >
                  <svg viewBox="0 0 1024 1024" width="16" height="16" fill="currentColor">
                    <path d="M512 1024C229.222 1024 0 794.778 0 512S229.222 0 512 0s512 229.222 512 512-229.222 512-512 512z m259.149-568.883h-290.74a25.293 25.293 0 0 0-25.292 25.293l-0.026 63.206c0 13.952 11.315 25.293 25.267 25.293h177.024c13.978 0 25.293 11.315 25.293 25.267v12.646a75.853 75.853 0 0 1-75.853 75.853h-240.23a25.293 25.293 0 0 1-25.267-25.293V417.203a75.853 75.853 0 0 1 75.827-75.853h353.946a25.293 25.293 0 0 0 25.267-25.292l0.077-63.207a25.293 25.293 0 0 0-25.268-25.293H417.152a189.62 189.62 0 0 0-189.62 189.645V771.15c0 13.977 11.316 25.293 25.294 25.293h372.94a170.65 170.65 0 0 0 170.65-170.65V480.384a25.293 25.293 0 0 0-25.293-25.267z"/>
                  </svg>
                </a>
              </div>
            )}
          </div>
        </div>
      </Sider>

      <Layout>
        <Header
          style={{
            padding: '0 32px',
            background: token.colorBgContainer,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
            zIndex: 9,
            height: 64,
            lineHeight: '64px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            {/* 折叠按钮 */}
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{
                fontSize: 16,
                width: 32,
                height: 32,
              }}
              aria-label={collapsed ? '展开侧边栏' : '折叠侧边栏'}
            />
            
            <h3
              style={{
                margin: 0,
                fontSize: 18,
                fontWeight: 600,
                color: token.colorTextHeading,
                letterSpacing: '-0.02em',
              }}
            >
              UIED 设计导航管理系统
            </h3>
          </div>

          <Space size={20}>
            <Button
              type="default"
              icon={<HomeOutlined />}
              onClick={() => window.open('https://hao.uied.cn', '_blank')}
              style={{
                borderRadius: 6,
                fontWeight: 500,
              }}
              aria-label="访问前台首页"
            >
              访问首页
            </Button>
            <div style={{ width: 1, height: 20, background: token.colorBorderSecondary }} />
            <span style={{ 
              color: token.colorTextSecondary, 
              fontSize: 14,
              fontWeight: 400,
            }}>
              欢迎回来，{username}
            </span>
            <Dropdown
              menu={{ items: userMenuItems, onClick: handleUserMenuClick }}
              placement="bottomRight"
            >
              <div
                role="button"
                tabIndex={0}
                aria-label="用户菜单"
                style={{ cursor: 'pointer', display: 'inline-block' }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.currentTarget.click();
                  }
                }}
              >
                <Avatar
                  style={{
                    backgroundColor: token.colorPrimary,
                    cursor: 'pointer',
                  }}
                  icon={<UserOutlined />}
                />
              </div>
            </Dropdown>
          </Space>
        </Header>

        <Content
          id="main-content"
          style={{
            margin: 24,
            marginTop: 24,
          }}
        >
          {/* 面包屑导航 */}
          <div style={{ marginBottom: 16 }}>
            <Breadcrumb />
          </div>
          
          <div
            style={{
              padding: 24,
              background: '#fff',
              borderRadius: token.borderRadiusLG,
              minHeight: 'calc(100vh - 200px)',
              boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
            }}
          >
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}
