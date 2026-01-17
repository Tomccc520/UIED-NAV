/**
 * @file Dashboard.tsx
 * @description 管理后台组件
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

import { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Typography, Space, Tag, List, Avatar, Progress } from 'antd';
import { 
  AppstoreOutlined, 
  GlobalOutlined, 
  MenuOutlined, 
  RiseOutlined,
  FireOutlined,
  StarOutlined,
  FileOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import api, { categoryApi, websiteApi, navMenuApi, friendLinkApi } from '../services/api';

const { Title, Text } = Typography;

interface Website {
  id: string;
  name: string;
  description: string;
  isHot: boolean;
  isFeatured: boolean;
  isNew: boolean;
  category?: { name: string };
}

interface Page {
  id: string;
  name: string;
  slug: string;
  pageCategories?: { categoryId: string }[];
}

export default function Dashboard() {
  const [stats, setStats] = useState({
    categories: 0,
    websites: 0,
    navMenus: 0,
    friendLinks: 0,
    pages: 0,
    hotWebsites: 0,
    featuredWebsites: 0,
  });
  const [recentWebsites, setRecentWebsites] = useState<Website[]>([]);
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [categories, websites, navMenus, friendLinks, pagesRes] = await Promise.all([
          categoryApi.getAll(),
          websiteApi.getAll(),
          navMenuApi.getFlat(),
          friendLinkApi.getAll(),
          api.get('/pages'),
        ]);
        
        const allWebsites = websites.data;
        const hotCount = allWebsites.filter((w: Website) => w.isHot).length;
        const featuredCount = allWebsites.filter((w: Website) => w.isFeatured).length;
        
        setStats({
          categories: categories.data.length,
          websites: allWebsites.length,
          navMenus: navMenus.data.length,
          friendLinks: friendLinks.data.length,
          pages: pagesRes.data.length,
          hotWebsites: hotCount,
          featuredWebsites: featuredCount,
        });
        setRecentWebsites(allWebsites.slice(0, 5));
        setPages(pagesRes.data);
      } catch (error) {
        console.error('获取统计数据失败:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}>仪表盘</Title>
        <Text type="secondary">欢迎使用 UIED 设计导航管理系统</Text>
      </div>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={8} lg={4}>
          <Card size="small" bordered>
            <Statistic
              title="页面"
              value={stats.pages}
              prefix={<FileOutlined style={{ color: '#722ed1' }} />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <Card size="small" bordered>
            <Statistic
              title="分类"
              value={stats.categories}
              prefix={<AppstoreOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <Card size="small" bordered>
            <Statistic
              title="网站"
              value={stats.websites}
              prefix={<GlobalOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <Card size="small" bordered>
            <Statistic
              title="菜单"
              value={stats.navMenus}
              prefix={<MenuOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <Card size="small" bordered>
            <Statistic
              title="热门"
              value={stats.hotWebsites}
              prefix={<FireOutlined style={{ color: '#ff4d4f' }} />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <Card size="small" bordered>
            <Statistic
              title="推荐"
              value={stats.featuredWebsites}
              prefix={<StarOutlined style={{ color: '#eb2f96' }} />}
              valueStyle={{ color: '#eb2f96' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        {/* 最近添加的网站 */}
        <Col xs={24} lg={14}>
          <Card
            title={<Space><RiseOutlined style={{ color: '#1890ff' }} /><span>最近添加</span></Space>}
            size="small"
            bordered
          >
            <List
              loading={loading}
              dataSource={recentWebsites}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar style={{ backgroundColor: '#f0f5ff', color: '#1890ff' }}>{item.name.charAt(0)}</Avatar>}
                    title={
                      <Space size={4}>
                        <span>{item.name}</span>
                        {item.isHot && <Tag color="red">热</Tag>}
                        {item.isFeatured && <Tag color="orange">荐</Tag>}
                        {item.isNew && <Tag color="blue">新</Tag>}
                      </Space>
                    }
                    description={<Text type="secondary" ellipsis style={{ maxWidth: 280 }}>{item.description}</Text>}
                  />
                  <Tag>{item.category?.name || '未分类'}</Tag>
                </List.Item>
              )}
            />
          </Card>
        </Col>

        {/* 右侧 */}
        <Col xs={24} lg={10}>
          {/* 页面列表 */}
          <Card
            title={<Space><FileOutlined style={{ color: '#722ed1' }} /><span>页面概览</span></Space>}
            size="small"
            bordered
            style={{ marginBottom: 16 }}
          >
            <List
              loading={loading}
              dataSource={pages.slice(0, 4)}
              renderItem={(page) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar style={{ backgroundColor: '#f9f0ff', color: '#722ed1' }}>{page.name.charAt(0)}</Avatar>}
                    title={page.name}
                    description={`/${page.slug}`}
                  />
                  <Tag color="purple">{page.pageCategories?.length || 0} 分类</Tag>
                </List.Item>
              )}
            />
          </Card>

          {/* 网站分布 */}
          <Card
            title={<Space><BarChartOutlined style={{ color: '#52c41a' }} /><span>网站分布</span></Space>}
            size="small"
            bordered
          >
            <Space direction="vertical" style={{ width: '100%' }} size={12}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text>热门网站</Text>
                  <Text strong>{stats.hotWebsites}</Text>
                </div>
                <Progress 
                  percent={stats.websites ? Math.round(stats.hotWebsites / stats.websites * 100) : 0} 
                  strokeColor="#ff4d4f"
                  size="small"
                  showInfo={false}
                />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text>推荐网站</Text>
                  <Text strong>{stats.featuredWebsites}</Text>
                </div>
                <Progress 
                  percent={stats.websites ? Math.round(stats.featuredWebsites / stats.websites * 100) : 0} 
                  strokeColor="#faad14"
                  size="small"
                  showInfo={false}
                />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text>普通网站</Text>
                  <Text strong>{stats.websites - stats.hotWebsites - stats.featuredWebsites}</Text>
                </div>
                <Progress 
                  percent={stats.websites ? Math.round((stats.websites - stats.hotWebsites - stats.featuredWebsites) / stats.websites * 100) : 0} 
                  strokeColor="#1890ff"
                  size="small"
                  showInfo={false}
                />
              </div>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
