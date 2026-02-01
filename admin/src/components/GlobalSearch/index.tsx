/**
 * @file GlobalSearch/index.tsx
 * @description 全局搜索组件 - 支持搜索配置项和页面
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Input, Modal, List, Typography, Tag, Empty, theme } from 'antd';
import { SearchOutlined, SettingOutlined, AppstoreOutlined, FileTextOutlined, LinkOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Text } = Typography;

interface SearchItem {
  key: string;
  title: string;
  description: string;
  path: string;
  type: 'page' | 'setting' | 'content';
  icon: React.ReactNode;
  keywords: string[];
}

// 可搜索的配置项和页面
const searchableItems: SearchItem[] = [
  // 页面
  { key: 'dashboard', title: '仪表盘', description: '系统概览和统计数据', path: '/dashboard', type: 'page', icon: <AppstoreOutlined />, keywords: ['首页', '概览', '统计', 'dashboard'] },
  { key: 'pages', title: '页面管理', description: '管理网站页面', path: '/pages', type: 'page', icon: <FileTextOutlined />, keywords: ['页面', 'page', '导航页'] },
  { key: 'categories', title: '分类管理', description: '管理网站分类', path: '/categories', type: 'page', icon: <AppstoreOutlined />, keywords: ['分类', 'category', '目录'] },
  { key: 'websites', title: '网站管理', description: '管理收录的网站', path: '/websites', type: 'page', icon: <LinkOutlined />, keywords: ['网站', 'website', '网址', '链接'] },
  { key: 'articles', title: '文章管理', description: '管理博客文章', path: '/articles', type: 'page', icon: <FileTextOutlined />, keywords: ['文章', 'article', '博客', 'blog'] },
  { key: 'hot', title: '热门推荐', description: '管理热门推荐网站', path: '/hot-recommendations', type: 'page', icon: <AppstoreOutlined />, keywords: ['热门', '推荐', 'hot', 'recommendation'] },
  { key: 'banners', title: '广告位管理', description: '管理广告横幅', path: '/banners', type: 'page', icon: <AppstoreOutlined />, keywords: ['广告', 'banner', '横幅'] },
  { key: 'submissions', title: '提交审核', description: '审核用户提交的网站', path: '/submissions', type: 'page', icon: <FileTextOutlined />, keywords: ['提交', '审核', 'submission'] },
  { key: 'comments', title: '评论管理', description: '管理用户评论', path: '/comments', type: 'page', icon: <FileTextOutlined />, keywords: ['评论', 'comment'] },
  { key: 'batch-import', title: '批量导入', description: '批量导入网站数据', path: '/batch-import', type: 'page', icon: <AppstoreOutlined />, keywords: ['导入', 'import', '批量'] },
  { key: 'media', title: '媒体库', description: '管理上传的媒体文件', path: '/media', type: 'page', icon: <AppstoreOutlined />, keywords: ['媒体', 'media', '图片', '文件'] },
  
  // 数据分析
  { key: 'statistics', title: '数据统计', description: '查看访问统计数据', path: '/statistics', type: 'page', icon: <AppstoreOutlined />, keywords: ['统计', 'statistics', '数据', '分析'] },
  { key: 'monitor', title: '网站监控', description: '监控网站可用性', path: '/monitor', type: 'page', icon: <AppstoreOutlined />, keywords: ['监控', 'monitor', '可用性'] },
  { key: 'data-export', title: '数据导出', description: '导出网站数据', path: '/data-export', type: 'page', icon: <AppstoreOutlined />, keywords: ['导出', 'export', '备份'] },
  
  // 系统设置
  { key: 'system', title: '基本设置', description: '网站基本信息设置', path: '/system', type: 'setting', icon: <SettingOutlined />, keywords: ['基本', '设置', 'system', '站点信息'] },
  { key: 'website-config', title: '网站配置', description: '网站功能配置', path: '/website-config', type: 'setting', icon: <SettingOutlined />, keywords: ['配置', 'config', '功能'] },
  { key: 'permalink', title: '固定链接', description: 'URL 固定链接设置', path: '/permalink', type: 'setting', icon: <SettingOutlined />, keywords: ['固定链接', 'permalink', 'url', 'slug'] },
  { key: 'seo', title: 'SEO 管理', description: '搜索引擎优化设置', path: '/seo', type: 'setting', icon: <SettingOutlined />, keywords: ['seo', '搜索引擎', '优化', 'meta'] },
  { key: 'nav-menus', title: '导航菜单', description: '管理导航菜单', path: '/nav-menus', type: 'setting', icon: <SettingOutlined />, keywords: ['导航', '菜单', 'nav', 'menu'] },
  { key: 'footer', title: '页脚设置', description: '管理页脚链接', path: '/footer', type: 'setting', icon: <SettingOutlined />, keywords: ['页脚', 'footer', '底部'] },
  { key: 'friend-links', title: '友情链接', description: '管理友情链接', path: '/friend-links', type: 'setting', icon: <SettingOutlined />, keywords: ['友情链接', 'friend', '友链'] },
  { key: 'social-media', title: '关注交流', description: '社交媒体和联系方式', path: '/social-media-groups', type: 'setting', icon: <SettingOutlined />, keywords: ['社交', '关注', '交流', 'social', '微信', '公众号'] },
  { key: 'favicon-api', title: 'Favicon API', description: 'Favicon 获取接口配置', path: '/favicon-api', type: 'setting', icon: <SettingOutlined />, keywords: ['favicon', '图标', 'api'] },
  { key: 'ai-settings', title: 'AI 助手', description: 'AI 功能配置', path: '/ai-settings', type: 'setting', icon: <SettingOutlined />, keywords: ['ai', '人工智能', '助手', 'openai'] },
  { key: 'wordpress', title: 'WordPress', description: 'WordPress 集成配置', path: '/wordpress', type: 'setting', icon: <SettingOutlined />, keywords: ['wordpress', 'wp', '博客'] },
  
  // 系统管理
  { key: 'users', title: '用户管理', description: '管理系统用户', path: '/users', type: 'page', icon: <AppstoreOutlined />, keywords: ['用户', 'user', '管理员'] },
  { key: 'logs', title: '操作日志', description: '查看操作日志', path: '/logs', type: 'page', icon: <FileTextOutlined />, keywords: ['日志', 'log', '操作记录'] },
  { key: 'account', title: '账户设置', description: '个人账户设置', path: '/account', type: 'setting', icon: <SettingOutlined />, keywords: ['账户', 'account', '密码', '个人'] },
];

interface GlobalSearchProps {
  visible: boolean;
  onClose: () => void;
}

export default function GlobalSearch({ visible, onClose }: GlobalSearchProps) {
  const [searchValue, setSearchValue] = useState('');
  const [results, setResults] = useState<SearchItem[]>([]);
  const navigate = useNavigate();
  const { token } = theme.useToken();
  const inputRef = useRef<any>(null);

  // 搜索逻辑
  const handleSearch = useCallback((value: string) => {
    setSearchValue(value);
    if (!value.trim()) {
      setResults([]);
      return;
    }

    const searchTerm = value.toLowerCase();
    const filtered = searchableItems.filter(item => {
      return (
        item.title.toLowerCase().includes(searchTerm) ||
        item.description.toLowerCase().includes(searchTerm) ||
        item.keywords.some(k => k.toLowerCase().includes(searchTerm))
      );
    });
    setResults(filtered);
  }, []);

  // 选择结果
  const handleSelect = (item: SearchItem) => {
    navigate(item.path);
    onClose();
    setSearchValue('');
    setResults([]);
  };

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (!visible) {
          // 触发打开
        }
      }
      if (e.key === 'Escape' && visible) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [visible, onClose]);

  // 打开时聚焦输入框
  useEffect(() => {
    if (visible && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [visible]);

  // 关闭时清空
  useEffect(() => {
    if (!visible) {
      setSearchValue('');
      setResults([]);
    }
  }, [visible]);

  const getTypeTag = (type: string) => {
    switch (type) {
      case 'page':
        return <Tag color="blue">页面</Tag>;
      case 'setting':
        return <Tag color="green">设置</Tag>;
      case 'content':
        return <Tag color="orange">内容</Tag>;
      default:
        return null;
    }
  };

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={null}
      closable={false}
      width={560}
      style={{ top: 100 }}
      styles={{ body: { padding: 0 } }}
    >
      <div style={{ padding: '12px 16px', borderBottom: `1px solid ${token.colorBorderSecondary}` }}>
        <Input
          ref={inputRef}
          placeholder="搜索页面、设置项..."
          prefix={<SearchOutlined style={{ color: token.colorTextSecondary }} />}
          suffix={
            <Text type="secondary" style={{ fontSize: 12 }}>
              ESC 关闭
            </Text>
          }
          value={searchValue}
          onChange={(e) => handleSearch(e.target.value)}
          variant="borderless"
          size="large"
          style={{ fontSize: 16 }}
        />
      </div>
      
      <div style={{ maxHeight: 400, overflow: 'auto' }}>
        {searchValue && results.length === 0 ? (
          <Empty 
            description="没有找到相关结果" 
            style={{ padding: '40px 0' }}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : results.length > 0 ? (
          <List
            dataSource={results}
            renderItem={(item) => (
              <List.Item
                onClick={() => handleSelect(item)}
                style={{ 
                  padding: '12px 16px', 
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = token.colorBgTextHover}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <List.Item.Meta
                  avatar={<span style={{ fontSize: 18, color: token.colorPrimary }}>{item.icon}</span>}
                  title={
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {item.title}
                      {getTypeTag(item.type)}
                    </span>
                  }
                  description={<Text type="secondary">{item.description}</Text>}
                />
              </List.Item>
            )}
          />
        ) : !searchValue ? (
          <div style={{ padding: '20px 16px', color: token.colorTextSecondary }}>
            <Text type="secondary">输入关键词搜索页面或设置项</Text>
            <div style={{ marginTop: 12 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                提示：可以搜索 "SEO"、"导航"、"用户" 等关键词
              </Text>
            </div>
          </div>
        ) : null}
      </div>
    </Modal>
  );
}
