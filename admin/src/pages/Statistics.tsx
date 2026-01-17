/**
 * @file Statistics.tsx
 * @description 管理后台组件
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

import { useEffect, useState } from 'react';
import { Card, Row, Col, Typography, Space, Tag, Table, Empty, Spin, Statistic, Button, Drawer, List, Avatar, Tabs, Descriptions, Divider } from 'antd';
import { 
  BarChartOutlined, 
  FireOutlined,
  GlobalOutlined,
  TrophyOutlined,
  EyeOutlined,
  RobotOutlined,
  AppstoreOutlined,
  RiseOutlined,
  FallOutlined,
  ClockCircleOutlined,
  ReloadOutlined,
  StarOutlined,
  PercentageOutlined,
  DatabaseOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { Pie, Column, Line } from '@ant-design/charts';
import api, { categoryApi, websiteApi } from '../services/api';
import AIAssistant from '../components/AIAssistant';

const { Title, Text } = Typography;

interface TopWebsite {
  id: string;
  name: string;
  url: string;
  clickCount: number;
  category?: string;
}

interface CategoryStat {
  id: string;
  name: string;
  clickCount: number;
  websiteCount: number;
}

interface StatsData {
  topWebsites: TopWebsite[];
  totalClicks: number;
  categoryStats: CategoryStat[];
}

interface Website {
  id: string;
  name: string;
  url: string;
  description?: string;
  isHot: boolean;
  isFeatured: boolean;
  isNew: boolean;
  clickCount: number;
  createdAt: string;
  category?: { id: string; name: string };
}

interface Category {
  id: string;
  name: string;
  slug: string;
  parentId?: string;
  _count?: { websites: number };
}

interface SearchStats {
  topSearches: Array<{ query: string; count: number }>;
  totalSearches: number;
  aiSearches: number;
  aiRatio: string;
  dailyTrend: Array<{ date: string; count: number }>;
}

export default function Statistics() {
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAI, setShowAI] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  
  // 额外统计数据
  const [allWebsites, setAllWebsites] = useState<Website[]>([]);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [recentWebsites, setRecentWebsites] = useState<Website[]>([]);
  
  // 搜索统计数据
  const [searchStats, setSearchStats] = useState<SearchStats | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    fetchStats();
    fetchAdditionalData();
    fetchSearchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await api.get('/websites/stats/clicks');
      setData(res.data);
    } catch (error) {
      console.error('获取统计数据失败:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchSearchStats = async () => {
    setSearchLoading(true);
    try {
      const res = await api.get('/search-stats', { params: { days: 30 } });
      setSearchStats(res.data);
    } catch (error) {
      console.error('获取搜索统计失败:', error);
    } finally {
      setSearchLoading(false);
    }
  };

  const fetchAdditionalData = async () => {
    try {
      const [websitesRes, categoriesRes] = await Promise.all([
        websiteApi.getAll(),
        categoryApi.getAll(),
      ]);
      
      const websites = websitesRes.data;
      setAllWebsites(websites);
      setAllCategories(categoriesRes.data);
      
      // 按创建时间排序获取最近添加的网站
      const sorted = [...websites].sort((a: Website, b: Website) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setRecentWebsites(sorted.slice(0, 10));
    } catch (error) {
      console.error('获取额外数据失败:', error);
    }
  };

  // 计算统计数据
  const hotCount = allWebsites.filter(w => w.isHot).length;
  const featuredCount = allWebsites.filter(w => w.isFeatured).length;
  const newCount = allWebsites.filter(w => w.isNew).length;
  const mainCategories = allCategories.filter(c => !c.parentId);
  const subCategories = allCategories.filter(c => c.parentId);
  const totalClicks = data?.totalClicks || 0;
  const avgClicks = allWebsites.length > 0 
    ? Math.round(allWebsites.reduce((sum, w) => sum + (w.clickCount || 0), 0) / allWebsites.length)
    : 0;
  const hasClicksCount = allWebsites.filter(w => w.clickCount && w.clickCount > 0).length;
  const noClicksCount = allWebsites.length - hasClicksCount;
  const clickRate = allWebsites.length > 0 ? Math.round(hasClicksCount / allWebsites.length * 100) : 0;

  // 网站类型分布数据（饼图）- 使用 SaaS Dashboard 配色
  const websiteTypeData = [
    { type: '热门网站', value: hotCount, color: '#EF4444' },
    { type: '推荐网站', value: featuredCount, color: '#F97316' },
    { type: '新网站', value: newCount, color: '#10B981' },
    { type: '普通网站', value: Math.max(0, allWebsites.length - hotCount - featuredCount - newCount), color: '#3B82F6' },
  ].filter(item => item.value > 0);

  // 分类网站分布数据（柱状图）
  const categoryDistributionData = mainCategories
    .map(cat => {
      const directCount = cat._count?.websites || 0;
      const childrenCount = subCategories
        .filter(sub => sub.parentId === cat.id)
        .reduce((sum, sub) => sum + (sub._count?.websites || 0), 0);
      return {
        category: cat.name,
        count: directCount + childrenCount,
      };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // 饼图配置 - 现代化配色
  const pieConfig = {
    data: websiteTypeData,
    angleField: 'value',
    colorField: 'type',
    radius: 0.8,
    innerRadius: 0.6,
    color: ['#EF4444', '#F97316', '#10B981', '#3B82F6'],
    label: {
      text: (d: { value: number }) => `${d.value}`,
      style: { fontWeight: 'bold', fontSize: 12, fill: '#1E293B' },
    },
    legend: {
      color: {
        position: 'bottom' as const,
      },
    },
  };

  // 柱状图配置 - 使用渐变蓝色
  const columnConfig = {
    data: categoryDistributionData,
    xField: 'category',
    yField: 'count',
    color: '#3B82F6',
    label: {
      text: (d: { count: number }) => d.count.toString(),
      textBaseline: 'bottom' as const,
      style: { fill: '#1E293B' },
    },
    style: {
      radiusTopLeft: 6,
      radiusTopRight: 6,
      fill: 'l(270) 0:#60A5FA 1:#3B82F6',
    },
  };

  // 热门网站表格列 - 使用现代配色
  const topWebsiteColumns = [
    {
      title: '排名',
      key: 'rank',
      width: 60,
      render: (_: unknown, __: unknown, index: number) => {
        const colors = ['#F97316', '#94A3B8', '#D97706'];
        return (
          <Tag color={index < 3 ? colors[index] : 'default'} style={{ margin: 0, fontWeight: 600 }}>
            {index + 1}
          </Tag>
        );
      },
    },
    {
      title: '网站名称',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: TopWebsite) => (
        <Space>
          <span style={{ fontWeight: 500, color: '#1E293B' }}>{name}</span>
          <a href={record.url} target="_blank" rel="noopener noreferrer">
            <GlobalOutlined style={{ color: '#3B82F6' }} />
          </a>
        </Space>
      ),
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 100,
      render: (cat: string) => <Tag color="blue">{cat || '未分类'}</Tag>,
    },
    {
      title: '点击量',
      dataIndex: 'clickCount',
      key: 'clickCount',
      width: 100,
      sorter: (a: TopWebsite, b: TopWebsite) => a.clickCount - b.clickCount,
      render: (count: number) => (
        <Text strong style={{ color: '#3B82F6' }}>{count.toLocaleString()}</Text>
      ),
    },
  ];

  // 分类统计表格列 - 现代配色
  const categoryStatsColumns = [
    {
      title: '分类名称',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => <Text strong style={{ color: '#1E293B' }}>{name}</Text>,
    },
    {
      title: '网站数',
      dataIndex: 'websiteCount',
      key: 'websiteCount',
      width: 80,
      sorter: (a: CategoryStat, b: CategoryStat) => a.websiteCount - b.websiteCount,
      render: (count: number) => <Tag color="blue">{count}</Tag>,
    },
    {
      title: '总点击',
      dataIndex: 'clickCount',
      key: 'clickCount',
      width: 100,
      sorter: (a: CategoryStat, b: CategoryStat) => a.clickCount - b.clickCount,
      render: (count: number) => <Text strong style={{ color: '#10B981' }}>{count.toLocaleString()}</Text>,
    },
    {
      title: '平均点击',
      key: 'avgClick',
      width: 80,
      render: (_: unknown, record: CategoryStat) => {
        const avg = record.websiteCount > 0 ? Math.round(record.clickCount / record.websiteCount) : 0;
        return <Text style={{ color: '#64748B' }}>{avg}</Text>;
      },
    },
    {
      title: '占比',
      key: 'percent',
      width: 80,
      render: (_: unknown, record: CategoryStat) => {
        const percent = totalClicks > 0 ? Math.round(record.clickCount / totalClicks * 100) : 0;
        return <Text style={{ color: '#64748B' }}>{percent}%</Text>;
      },
    },
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      {/* 页面标题 */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>
            <BarChartOutlined style={{ marginRight: 8 }} />
            数据统计
          </Title>
          <Text type="secondary">网站数据分析与可视化</Text>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => { fetchStats(); fetchAdditionalData(); fetchSearchStats(); }}>
            刷新
          </Button>
          <Button type="primary" icon={<RobotOutlined />} onClick={() => setShowAI(true)}>
            AI 助手
          </Button>
        </Space>
      </div>

      {/* 数据概览卡片 - 现代化配色 */}
      <Card size="small" style={{ marginBottom: 16, borderRadius: 12, border: '1px solid #E2E8F0' }}>
        <Descriptions title="数据概览" column={{ xs: 2, sm: 3, md: 4, lg: 6 }} size="small">
          <Descriptions.Item label={<><DatabaseOutlined style={{ color: '#3B82F6' }} /> 网站总数</>}>
            <Text strong style={{ fontSize: 18, color: '#3B82F6' }}>{allWebsites.length}</Text>
          </Descriptions.Item>
          <Descriptions.Item label={<><EyeOutlined style={{ color: '#10B981' }} /> 总点击量</>}>
            <Text strong style={{ fontSize: 18, color: '#10B981' }}>{totalClicks.toLocaleString()}</Text>
          </Descriptions.Item>
          <Descriptions.Item label={<><RiseOutlined style={{ color: '#6366F1' }} /> 平均点击</>}>
            <Text strong style={{ fontSize: 18, color: '#6366F1' }}>{avgClicks}</Text>
          </Descriptions.Item>
          <Descriptions.Item label={<><PercentageOutlined style={{ color: '#14B8A6' }} /> 点击率</>}>
            <Text strong style={{ fontSize: 18, color: '#14B8A6' }}>{clickRate}%</Text>
          </Descriptions.Item>
          <Descriptions.Item label={<><AppstoreOutlined style={{ color: '#8B5CF6' }} /> 主分类</>}>
            <Text strong style={{ fontSize: 18, color: '#8B5CF6' }}>{mainCategories.length}</Text>
          </Descriptions.Item>
          <Descriptions.Item label={<><AppstoreOutlined style={{ color: '#A855F7' }} /> 子分类</>}>
            <Text strong style={{ fontSize: 18, color: '#A855F7' }}>{subCategories.length}</Text>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* 网站状态统计 - 现代化配色 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={6}>
          <Card size="small" style={{ borderRadius: 12, border: '1px solid #E2E8F0' }}>
            <Statistic
              title={<span style={{ color: '#64748B' }}>热门网站</span>}
              value={hotCount}
              prefix={<FireOutlined style={{ color: '#EF4444' }} />}
              valueStyle={{ color: '#EF4444', fontWeight: 600 }}
              suffix={<Text style={{ fontSize: 12, color: '#94A3B8' }}>/ {allWebsites.length}</Text>}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" style={{ borderRadius: 12, border: '1px solid #E2E8F0' }}>
            <Statistic
              title={<span style={{ color: '#64748B' }}>推荐网站</span>}
              value={featuredCount}
              prefix={<StarOutlined style={{ color: '#F97316' }} />}
              valueStyle={{ color: '#F97316', fontWeight: 600 }}
              suffix={<Text style={{ fontSize: 12, color: '#94A3B8' }}>/ {allWebsites.length}</Text>}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" style={{ borderRadius: 12, border: '1px solid #E2E8F0' }}>
            <Statistic
              title={<span style={{ color: '#64748B' }}>新网站</span>}
              value={newCount}
              prefix={<RiseOutlined style={{ color: '#10B981' }} />}
              valueStyle={{ color: '#10B981', fontWeight: 600 }}
              suffix={<Text style={{ fontSize: 12, color: '#94A3B8' }}>/ {allWebsites.length}</Text>}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" style={{ borderRadius: 12, border: '1px solid #E2E8F0' }}>
            <Statistic
              title={<span style={{ color: '#64748B' }}>无点击网站</span>}
              value={noClicksCount}
              prefix={<FallOutlined style={{ color: '#94A3B8' }} />}
              valueStyle={{ color: '#94A3B8', fontWeight: 600 }}
              suffix={<Text style={{ fontSize: 12, color: '#94A3B8' }}>/ {allWebsites.length}</Text>}
            />
          </Card>
        </Col>
      </Row>

      {/* 标签页切换 */}
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'overview',
            label: '图表概览',
            children: (
              <Row gutter={[16, 16]}>
                {/* 网站类型分布饼图 */}
                <Col xs={24} lg={10}>
                  <Card
                    title={<Space><BarChartOutlined style={{ color: '#6366F1' }} /><span style={{ color: '#1E293B' }}>网站类型分布</span></Space>}
                    size="small"
                    style={{ borderRadius: 12, border: '1px solid #E2E8F0' }}
                  >
                    {websiteTypeData.length > 0 ? (
                      <div style={{ height: 300 }}>
                        <Pie {...pieConfig} />
                      </div>
                    ) : (
                      <Empty description="暂无数据" style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }} />
                    )}
                  </Card>
                </Col>

                {/* 分类网站分布柱状图 */}
                <Col xs={24} lg={14}>
                  <Card
                    title={<Space><AppstoreOutlined style={{ color: '#3B82F6' }} /><span style={{ color: '#1E293B' }}>分类网站分布 TOP10</span></Space>}
                    size="small"
                    style={{ borderRadius: 12, border: '1px solid #E2E8F0' }}
                  >
                    {categoryDistributionData.length > 0 ? (
                      <div style={{ height: 300 }}>
                        <Column {...columnConfig} />
                      </div>
                    ) : (
                      <Empty description="暂无数据" style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }} />
                    )}
                  </Card>
                </Col>
              </Row>
            ),
          },
          {
            key: 'ranking',
            label: '排行榜',
            children: (
              <Row gutter={[16, 16]}>
                {/* 热门网站排行 */}
                <Col xs={24} lg={14}>
                  <Card
                    title={<Space><TrophyOutlined style={{ color: '#F97316' }} /><span style={{ color: '#1E293B' }}>热门网站排行</span></Space>}
                    extra={<Tag color="orange">TOP 20</Tag>}
                    size="small"
                    style={{ borderRadius: 12, border: '1px solid #E2E8F0' }}
                  >
                    {data?.topWebsites && data.topWebsites.length > 0 ? (
                      <Table
                        columns={topWebsiteColumns}
                        dataSource={data.topWebsites}
                        rowKey="id"
                        pagination={{ pageSize: 10, showSizeChanger: true }}
                        size="small"
                      />
                    ) : (
                      <Empty description="暂无点击数据" />
                    )}
                  </Card>
                </Col>

                {/* 分类点击统计 */}
                <Col xs={24} lg={10}>
                  <Card
                    title={<Space><BarChartOutlined style={{ color: '#10B981' }} /><span style={{ color: '#1E293B' }}>分类点击统计</span></Space>}
                    size="small"
                    style={{ borderRadius: 12, border: '1px solid #E2E8F0' }}
                  >
                    {data?.categoryStats && data.categoryStats.length > 0 ? (
                      <Table
                        columns={categoryStatsColumns}
                        dataSource={data.categoryStats}
                        rowKey="id"
                        pagination={{ pageSize: 10, showSizeChanger: true }}
                        size="small"
                      />
                    ) : (
                      <Empty description="暂无分类数据" />
                    )}
                  </Card>
                </Col>
              </Row>
            ),
          },
          {
            key: 'recent',
            label: '最近动态',
            children: (
              <Card
                title={<Space><ClockCircleOutlined style={{ color: '#3B82F6' }} /><span style={{ color: '#1E293B' }}>最近添加的网站</span></Space>}
                size="small"
                style={{ borderRadius: 12, border: '1px solid #E2E8F0' }}
              >
                <List
                  dataSource={recentWebsites}
                  renderItem={(item) => (
                    <List.Item
                      actions={[
                        <Tag key="category" color="blue">{item.category?.name || '未分类'}</Tag>,
                        <Text key="clicks" style={{ color: '#64748B' }}>{item.clickCount || 0} 次点击</Text>,
                      ]}
                    >
                      <List.Item.Meta
                        avatar={
                          <Avatar style={{ backgroundColor: '#EFF6FF', color: '#3B82F6' }}>
                            {item.name.charAt(0)}
                          </Avatar>
                        }
                        title={
                          <Space>
                            <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ color: '#1E293B' }}>{item.name}</a>
                            {item.isHot && <Tag color="red">热门</Tag>}
                            {item.isFeatured && <Tag color="orange">推荐</Tag>}
                            {item.isNew && <Tag color="green">新</Tag>}
                          </Space>
                        }
                        description={
                          <Space>
                            <Text style={{ color: '#64748B' }}>{item.description?.slice(0, 50)}...</Text>
                            <Divider type="vertical" />
                            <Text style={{ color: '#94A3B8' }}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                          </Space>
                        }
                      />
                    </List.Item>
                  )}
                />
              </Card>
            ),
          },
          {
            key: 'search',
            label: '搜索统计',
            children: (
              <Row gutter={[16, 16]}>
                {/* 搜索概览 */}
                <Col span={24}>
                  <Row gutter={[16, 16]}>
                    <Col xs={12} sm={6}>
                      <Card size="small" style={{ borderRadius: 12, border: '1px solid #E2E8F0' }}>
                        <Statistic
                          title={<span style={{ color: '#64748B' }}>总搜索次数</span>}
                          value={searchStats?.totalSearches || 0}
                          prefix={<SearchOutlined style={{ color: '#3B82F6' }} />}
                          valueStyle={{ color: '#3B82F6', fontWeight: 600 }}
                          loading={searchLoading}
                        />
                      </Card>
                    </Col>
                    <Col xs={12} sm={6}>
                      <Card size="small" style={{ borderRadius: 12, border: '1px solid #E2E8F0' }}>
                        <Statistic
                          title={<span style={{ color: '#64748B' }}>AI搜索次数</span>}
                          value={searchStats?.aiSearches || 0}
                          prefix={<RobotOutlined style={{ color: '#6366F1' }} />}
                          valueStyle={{ color: '#6366F1', fontWeight: 600 }}
                          loading={searchLoading}
                        />
                      </Card>
                    </Col>
                    <Col xs={12} sm={6}>
                      <Card size="small" style={{ borderRadius: 12, border: '1px solid #E2E8F0' }}>
                        <Statistic
                          title={<span style={{ color: '#64748B' }}>AI搜索占比</span>}
                          value={searchStats?.aiRatio || 0}
                          suffix="%"
                          prefix={<PercentageOutlined style={{ color: '#10B981' }} />}
                          valueStyle={{ color: '#10B981', fontWeight: 600 }}
                          loading={searchLoading}
                        />
                      </Card>
                    </Col>
                    <Col xs={12} sm={6}>
                      <Card size="small" style={{ borderRadius: 12, border: '1px solid #E2E8F0' }}>
                        <Statistic
                          title={<span style={{ color: '#64748B' }}>热门搜索词</span>}
                          value={searchStats?.topSearches?.length || 0}
                          prefix={<FireOutlined style={{ color: '#EF4444' }} />}
                          valueStyle={{ color: '#EF4444', fontWeight: 600 }}
                          loading={searchLoading}
                        />
                      </Card>
                    </Col>
                  </Row>
                </Col>
                
                {/* 搜索趋势图 */}
                <Col xs={24} lg={14}>
                  <Card
                    title={<Space><BarChartOutlined style={{ color: '#3B82F6' }} /><span style={{ color: '#1E293B' }}>搜索趋势（近30天）</span></Space>}
                    size="small"
                    style={{ borderRadius: 12, border: '1px solid #E2E8F0' }}
                  >
                    {searchStats?.dailyTrend && searchStats.dailyTrend.length > 0 ? (
                      <div style={{ height: 300 }}>
                        <Line
                          data={searchStats.dailyTrend.map(d => ({ 
                            date: new Date(d.date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }), 
                            count: Number(d.count) 
                          }))}
                          xField="date"
                          yField="count"
                          smooth
                          point={{ size: 4, shape: 'circle', style: { fill: '#3B82F6' } }}
                          color="#3B82F6"
                          areaStyle={{ fill: 'l(270) 0:rgba(59,130,246,0.25) 1:rgba(59,130,246,0.01)' }}
                          line={{ style: { lineWidth: 2.5, stroke: '#3B82F6' } }}
                        />
                      </div>
                    ) : (
                      <Empty description="暂无搜索数据" style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }} />
                    )}
                  </Card>
                </Col>
                
                {/* 热门搜索词 */}
                <Col xs={24} lg={10}>
                  <Card
                    title={<Space><TrophyOutlined style={{ color: '#F97316' }} /><span style={{ color: '#1E293B' }}>热门搜索词 TOP20</span></Space>}
                    size="small"
                    style={{ borderRadius: 12, border: '1px solid #E2E8F0' }}
                  >
                    {searchStats?.topSearches && searchStats.topSearches.length > 0 ? (
                      <Table
                        columns={[
                          {
                            title: '排名',
                            key: 'rank',
                            width: 60,
                            render: (_: unknown, __: unknown, index: number) => {
                              const colors = ['#F97316', '#94A3B8', '#D97706'];
                              return (
                                <Tag color={index < 3 ? colors[index] : 'default'} style={{ margin: 0, fontWeight: 600 }}>
                                  {index + 1}
                                </Tag>
                              );
                            },
                          },
                          {
                            title: '搜索词',
                            dataIndex: 'query',
                            key: 'query',
                            render: (query: string) => <Text strong style={{ color: '#1E293B' }}>{query}</Text>,
                          },
                          {
                            title: '搜索次数',
                            dataIndex: 'count',
                            key: 'count',
                            width: 100,
                            render: (count: number) => (
                              <Text style={{ color: '#3B82F6', fontWeight: 600 }}>{Number(count).toLocaleString()}</Text>
                            ),
                          },
                        ]}
                        dataSource={searchStats.topSearches}
                        rowKey="query"
                        pagination={{ pageSize: 10 }}
                        size="small"
                      />
                    ) : (
                      <Empty description="暂无搜索数据" />
                    )}
                  </Card>
                </Col>
              </Row>
            ),
          },
        ]}
      />

      {/* AI 助手抽屉 */}
      <Drawer
        title={null}
        placement="right"
        width={400}
        onClose={() => setShowAI(false)}
        open={showAI}
        styles={{ body: { padding: 0, height: '100%' }, header: { display: 'none' } }}
      >
        <AIAssistant
          title="数据分析助手"
          placeholder="询问数据分析相关问题..."
          systemContext={`当前数据统计：网站总数 ${allWebsites.length}，总点击量 ${totalClicks}，平均点击 ${avgClicks}，点击率 ${clickRate}%，热门网站 ${hotCount}，推荐网站 ${featuredCount}，新网站 ${newCount}，无点击网站 ${noClicksCount}，主分类 ${mainCategories.length}，子分类 ${subCategories.length}`}
          onClose={() => setShowAI(false)}
          style={{ height: '100%', border: 'none' }}
        />
      </Drawer>
    </div>
  );
}
