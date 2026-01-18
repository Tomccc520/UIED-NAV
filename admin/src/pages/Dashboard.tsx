/**
 * @file Dashboard.tsx
 * @description 管理后台仪表盘 - 优化版
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

import { useEffect, useState } from 'react';
import { Card, Row, Col, Typography, Space, Tag, theme } from 'antd';
import { 
  AppstoreOutlined, 
  GlobalOutlined, 
  FileOutlined,
  RiseOutlined,
  PlusOutlined,
  EditOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api, { categoryApi, websiteApi } from '../services/api';

const { Title, Text, Paragraph } = Typography;

interface Stats {
  categories: number;
  websites: number;
  pages: number;
  submissions: number;
}

interface QuickAction {
  title: string;
  description: string;
  icon: React.ReactNode;
  path: string;
  color: string;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { token } = theme.useToken();
  const [stats, setStats] = useState<Stats>({
    categories: 0,
    websites: 0,
    pages: 0,
    submissions: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [categories, websites, pagesRes, submissionsRes] = await Promise.all([
          categoryApi.getAll(),
          websiteApi.getAll(),
          api.get('/pages'),
          api.get('/submissions').catch(() => ({ data: [] })),
        ]);
        
        setStats({
          categories: categories.data.length,
          websites: websites.data.length,
          pages: pagesRes.data.length,
          submissions: Array.isArray(submissionsRes.data) ? submissionsRes.data.filter((s: any) => s.status === 'pending').length : 0,
        });
      } catch (error) {
        console.error('获取统计数据失败:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const quickActions: QuickAction[] = [
    {
      title: '添加网站',
      description: '快速添加新的网站资源',
      icon: <PlusOutlined />,
      path: '/websites',
      color: '#52c41a',
    },
    {
      title: '管理分类',
      description: '组织和管理网站分类',
      icon: <AppstoreOutlined />,
      path: '/categories',
      color: '#1890ff',
    },
    {
      title: '编辑页面',
      description: '配置和编辑页面内容',
      icon: <EditOutlined />,
      path: '/pages',
      color: '#722ed1',
    },
    {
      title: '审核提交',
      description: '处理用户提交的网站',
      icon: <CheckCircleOutlined />,
      path: '/submissions',
      color: '#fa8c16',
    },
  ];

  return (
    <div>
      {/* 欢迎区域 */}
      <Card 
        style={{ 
          marginBottom: 24,
          background: `linear-gradient(135deg, ${token.colorPrimary} 0%, ${token.colorPrimaryHover} 100%)`,
          border: 'none',
        }}
      >
        <Space direction="vertical" size={4} style={{ display: 'flex' }}>
          <Title level={3} style={{ margin: 0, color: '#fff' }}>
            👋 欢迎回来！
          </Title>
          <Paragraph style={{ margin: 0, color: 'rgba(255, 255, 255, 0.85)', fontSize: 14 }}>
            UIED 设计导航管理系统 - 让内容管理更简单
          </Paragraph>
        </Space>
      </Card>

      {/* 核心统计 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={12} md={6}>
          <Card 
            size="small" 
            hoverable
            onClick={() => navigate('/pages')}
            style={{ cursor: 'pointer', borderColor: token.colorBorder, boxShadow: 'none' }}
          >
            <div style={{ marginBottom: 8 }}>
              <Text type="secondary" style={{ fontSize: 14 }}>页面总数</Text>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <FileOutlined style={{ color: '#722ed1', fontSize: 24 }} />
              <span style={{ color: '#722ed1', fontSize: 32, fontWeight: 600 }}>
                {loading ? '-' : stats.pages}
              </span>
            </div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              <EyeOutlined /> 点击查看详情
            </Text>
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card 
            size="small" 
            hoverable
            onClick={() => navigate('/categories')}
            style={{ cursor: 'pointer', borderColor: token.colorBorder, boxShadow: 'none' }}
          >
            <div style={{ marginBottom: 8 }}>
              <Text type="secondary" style={{ fontSize: 14 }}>分类总数</Text>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <AppstoreOutlined style={{ color: '#1890ff', fontSize: 24 }} />
              <span style={{ color: '#1890ff', fontSize: 32, fontWeight: 600 }}>
                {loading ? '-' : stats.categories}
              </span>
            </div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              <EyeOutlined /> 点击查看详情
            </Text>
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card 
            size="small" 
            hoverable
            onClick={() => navigate('/websites')}
            style={{ cursor: 'pointer', borderColor: token.colorBorder, boxShadow: 'none' }}
          >
            <div style={{ marginBottom: 8 }}>
              <Text type="secondary" style={{ fontSize: 14 }}>网站总数</Text>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <GlobalOutlined style={{ color: '#52c41a', fontSize: 24 }} />
              <span style={{ color: '#52c41a', fontSize: 32, fontWeight: 600 }}>
                {loading ? '-' : stats.websites}
              </span>
            </div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              <EyeOutlined /> 点击查看详情
            </Text>
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card 
            size="small" 
            hoverable
            onClick={() => navigate('/submissions')}
            style={{ cursor: 'pointer', borderColor: token.colorBorder, boxShadow: 'none' }}
          >
            <div style={{ marginBottom: 8 }}>
              <Text type="secondary" style={{ fontSize: 14 }}>待审核</Text>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <ClockCircleOutlined style={{ color: '#fa8c16', fontSize: 24 }} />
              <span style={{ color: '#fa8c16', fontSize: 32, fontWeight: 600 }}>
                {loading ? '-' : stats.submissions}
              </span>
            </div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {stats.submissions > 0 ? (
                <><CheckCircleOutlined /> 需要处理</>
              ) : (
                <><CheckCircleOutlined /> 暂无待审核</>
              )}
            </Text>
          </Card>
        </Col>
      </Row>

      {/* 快捷操作 */}
      <Card 
        title={
          <Space style={{ display: 'flex', alignItems: 'center' }}>
            <RiseOutlined style={{ color: token.colorPrimary }} />
            <span>快捷操作</span>
          </Space>
        }
        size="small"
        style={{ borderColor: token.colorBorder, boxShadow: 'none' }}
      >
        <Row gutter={[16, 16]}>
          {quickActions.map((action) => (
            <Col xs={24} sm={12} md={6} key={action.path}>
              <Card
                size="small"
                hoverable
                onClick={() => navigate(action.path)}
                style={{ 
                  cursor: 'pointer',
                  borderColor: action.color,
                  transition: 'all 0.3s',
                  padding: 16,
                  boxShadow: 'none',
                }}
              >
                <Space direction="vertical" size={8} style={{ width: '100%', display: 'flex' }}>
                  <div style={{ 
                    width: 40, 
                    height: 40, 
                    borderRadius: 8,
                    background: `${action.color}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 20,
                    color: action.color,
                  }}>
                    {action.icon}
                  </div>
                  <div>
                    <Text strong style={{ fontSize: 15 }}>{action.title}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {action.description}
                    </Text>
                  </div>
                </Space>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      {/* 系统状态 */}
      <Card 
        title="系统状态"
        size="small"
        style={{ marginTop: 16, borderColor: token.colorBorder, boxShadow: 'none' }}
      >
        <Row gutter={[16, 16]}>
          <Col span={8}>
            <Space direction="vertical" size={4} style={{ display: 'flex' }}>
              <Text type="secondary">系统版本</Text>
              <Text strong>v1.0.0</Text>
            </Space>
          </Col>
          <Col span={8}>
            <Space direction="vertical" size={4} style={{ display: 'flex' }}>
              <Text type="secondary">运行状态</Text>
              <Tag color="success">正常运行</Tag>
            </Space>
          </Col>
          <Col span={8}>
            <Space direction="vertical" size={4} style={{ display: 'flex' }}>
              <Text type="secondary">数据库</Text>
              <Tag color="processing">SQLite</Tag>
            </Space>
          </Col>
        </Row>
      </Card>
    </div>
  );
}
