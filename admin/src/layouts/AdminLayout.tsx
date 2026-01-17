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
  GlobalOutlined,
  MenuOutlined,
  FileTextOutlined,
  LinkOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
  FireOutlined,
  PictureOutlined,
  ApiOutlined,
  BarChartOutlined,
  RobotOutlined,
  ReadOutlined,
  AuditOutlined,
  CloudUploadOutlined,
  HistoryOutlined,
  MonitorOutlined,
  SearchOutlined,
  DownloadOutlined,
  TeamOutlined,
  HomeOutlined,
} from '@ant-design/icons';
import { authApi } from '../services/api';

const { Header, Sider, Content } = Layout;

const menuItems = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: '仪表盘' },
  { key: '/statistics', icon: <BarChartOutlined />, label: '数据统计' },
  { key: '/monitor', icon: <MonitorOutlined />, label: '网站监控' },
  { key: '/seo', icon: <SearchOutlined />, label: 'SEO 管理' },
  { key: '/data-export', icon: <DownloadOutlined />, label: '数据导出' },
  {
    key: 'content',
    icon: <AppstoreOutlined />,
    label: '内容管理',
    children: [
      { key: '/pages', icon: <FileTextOutlined />, label: '页面管理' },
      { key: '/hot-recommendations', icon: <FireOutlined />, label: '热门推荐' },
      { key: '/banners', icon: <PictureOutlined />, label: '广告位管理' },
      { key: '/website-config', icon: <LinkOutlined />, label: '网站配置' },
      { key: '/categories', icon: <AppstoreOutlined />, label: '分类管理' },
      { key: '/websites', icon: <GlobalOutlined />, label: '网站管理' },
      { key: '/submissions', icon: <AuditOutlined />, label: '提交审核' },
      { key: '/batch-import', icon: <CloudUploadOutlined />, label: '批量导入' },
    ],
  },
  {
    key: 'settings',
    icon: <SettingOutlined />,
    label: '站点设置',
    children: [
      { key: '/system', icon: <SettingOutlined />, label: '基本设置' },
      { key: '/nav-menus', icon: <MenuOutlined />, label: '导航菜单' },
      { key: '/footer', icon: <FileTextOutlined />, label: '页脚设置' },
      { key: '/friend-links', icon: <LinkOutlined />, label: '友情链接' },
      { key: '/social-media-groups', icon: <GlobalOutlined />, label: '关注交流' },
      { key: '/favicon-api', icon: <ApiOutlined />, label: 'Favicon API' },
      { key: '/ai-settings', icon: <RobotOutlined />, label: 'AI 助手' },
      { key: '/wordpress', icon: <ReadOutlined />, label: 'WordPress' },
    ],
  },
  { key: '/logs', icon: <HistoryOutlined />, label: '操作日志' },
  { key: '/users', icon: <TeamOutlined />, label: '用户管理' },
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
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        theme="light"
        width={240}
        style={{
          boxShadow: '2px 0 8px rgba(0,0,0,0.06)',
          zIndex: 10,
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
          }}
        >
          {!collapsed && (
            <img src="/admin/logo.svg" alt="UIED" style={{ height: 40 }} />
          )}
          {collapsed && (
            <img src="/admin/logo.svg" alt="UIED" style={{ height: 32 }} />
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
          }}
        />
      </Sider>

      <Layout>
        <Header
          style={{
            padding: '0 24px',
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
            zIndex: 9,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <h3
              style={{
                margin: 0,
                fontSize: 18,
                fontWeight: 600,
                color: token.colorTextHeading,
              }}
            >
              UIED 设计导航管理系统
            </h3>
          </div>

          <Space size={16}>
            <Button
              type="default"
              icon={<HomeOutlined />}
              onClick={() => window.open('https://hao.uied.cn', '_blank')}
            >
              访问首页
            </Button>
            <span style={{ color: token.colorTextSecondary, fontSize: 13 }}>
              欢迎回来，{username}
            </span>
            <Dropdown
              menu={{ items: userMenuItems, onClick: handleUserMenuClick }}
              placement="bottomRight"
            >
              <Avatar
                style={{
                  backgroundColor: token.colorPrimary,
                  cursor: 'pointer',
                }}
                icon={<UserOutlined />}
              />
            </Dropdown>
          </Space>
        </Header>

        <Content
          style={{
            margin: 24,
            marginTop: 24,
          }}
        >
          <div
            style={{
              padding: 24,
              background: '#fff',
              borderRadius: token.borderRadiusLG,
              minHeight: 'calc(100vh - 160px)',
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
