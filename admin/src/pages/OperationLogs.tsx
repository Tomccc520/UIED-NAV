/**
 * @file OperationLogs.tsx
 * @description 管理后台组件
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

import { useEffect, useState } from 'react';
import { Card, Table, Tag, Space, Typography, Input, Select, DatePicker, Button, Row, Col, Statistic, Tooltip, message, Popconfirm } from 'antd';
import { 
  HistoryOutlined, 
  SearchOutlined, 
  ReloadOutlined,
  UserOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  DeleteOutlined,
  LoginOutlined,
  LogoutOutlined,
  PlusOutlined,
  EditOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import api from '../services/api';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

interface LogItem {
  id: string;
  adminId: string;
  adminName: string;
  action: string;
  module: string;
  targetId?: string;
  targetName?: string;
  detail?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
  status: string;
  errorMsg?: string;
  createdAt: string;
}

interface LogStats {
  todayCount: number;
  totalCount: number;
  actionStats: { action: string; count: number }[];
  moduleStats: { module: string; count: number }[];
}

// 操作类型映射
const actionMap: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  create: { label: '创建', color: 'green', icon: <PlusOutlined /> },
  update: { label: '更新', color: 'blue', icon: <EditOutlined /> },
  delete: { label: '删除', color: 'red', icon: <DeleteOutlined /> },
  login: { label: '登录', color: 'cyan', icon: <LoginOutlined /> },
  logout: { label: '登出', color: 'default', icon: <LogoutOutlined /> },
  approve: { label: '审核通过', color: 'green', icon: <CheckCircleOutlined /> },
  reject: { label: '审核拒绝', color: 'orange', icon: <CloseCircleOutlined /> },
  import: { label: '导入', color: 'purple', icon: <FileTextOutlined /> },
  upload: { label: '上传', color: 'geekblue', icon: <FileTextOutlined /> },
};

// 模块映射
const moduleMap: Record<string, string> = {
  auth: '认证',
  website: '网站',
  category: '分类',
  page: '页面',
  banner: 'Banner',
  hot_recommendation: '热门推荐',
  nav_menu: '导航菜单',
  footer: '页脚',
  friend_link: '友情链接',
  social_media: '社交媒体',
  site_info: '站点信息',
  settings: '设置',
  submission: '网站提交',
  ai_config: 'AI配置',
  wordpress: 'WordPress',
  favicon_api: 'Favicon API',
  upload: '文件上传',
};

export default function OperationLogs() {
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [stats, setStats] = useState<LogStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });
  
  // 筛选条件
  const [filters, setFilters] = useState({
    adminName: '',
    action: '',
    module: '',
    dateRange: null as [dayjs.Dayjs, dayjs.Dayjs] | null,
  });

  useEffect(() => {
    fetchLogs();
    fetchStats();
  }, []);

  const fetchLogs = async (page = 1, pageSize = 20) => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, pageSize };
      if (filters.adminName) params.adminName = filters.adminName;
      if (filters.action) params.action = filters.action;
      if (filters.module) params.module = filters.module;
      if (filters.dateRange) {
        params.startDate = filters.dateRange[0].format('YYYY-MM-DD');
        params.endDate = filters.dateRange[1].format('YYYY-MM-DD');
      }

      const res = await api.get('/logs', { params });
      setLogs(res.data.items);
      setPagination({
        current: res.data.page,
        pageSize: res.data.pageSize,
        total: res.data.total,
      });
    } catch (error) {
      console.error('获取日志失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await api.get('/logs/stats');
      setStats(res.data);
    } catch (error) {
      console.error('获取统计失败:', error);
    }
  };

  const handleSearch = () => {
    fetchLogs(1, pagination.pageSize);
  };

  const handleReset = () => {
    setFilters({ adminName: '', action: '', module: '', dateRange: null });
    fetchLogs(1, pagination.pageSize);
  };

  const handleCleanup = async () => {
    try {
      const res = await api.post('/logs/cleanup', { days: 90 });
      message.success(res.data.message);
      fetchLogs();
      fetchStats();
    } catch (error) {
      message.error('清理失败');
    }
  };

  const columns: ColumnsType<LogItem> = [
    {
      title: '时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (time: string) => dayjs(time).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '操作员',
      dataIndex: 'adminName',
      key: 'adminName',
      width: 100,
      render: (name: string) => (
        <Space>
          <UserOutlined />
          <span>{name}</span>
        </Space>
      ),
    },
    {
      title: '操作',
      dataIndex: 'action',
      key: 'action',
      width: 100,
      render: (action: string) => {
        const config = actionMap[action] || { label: action, color: 'default', icon: null };
        return (
          <Tag color={config.color} icon={config.icon}>
            {config.label}
          </Tag>
        );
      },
    },
    {
      title: '模块',
      dataIndex: 'module',
      key: 'module',
      width: 100,
      render: (module: string) => <Tag>{moduleMap[module] || module}</Tag>,
    },
    {
      title: '操作对象',
      dataIndex: 'targetName',
      key: 'targetName',
      width: 150,
      ellipsis: true,
      render: (name: string, record: LogItem) => name || record.targetId || '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: string, record: LogItem) => (
        <Tooltip title={record.errorMsg}>
          <Tag color={status === 'success' ? 'success' : 'error'}>
            {status === 'success' ? '成功' : '失败'}
          </Tag>
        </Tooltip>
      ),
    },
    {
      title: 'IP地址',
      dataIndex: 'ip',
      key: 'ip',
      width: 120,
      render: (ip: string) => <Text type="secondary">{ip || '-'}</Text>,
    },
    {
      title: '详情',
      dataIndex: 'detail',
      key: 'detail',
      ellipsis: true,
      render: (detail: Record<string, unknown>) => {
        if (!detail) return '-';
        const str = JSON.stringify(detail);
        return (
          <Tooltip title={<pre style={{ maxWidth: 400, overflow: 'auto' }}>{JSON.stringify(detail, null, 2)}</pre>}>
            <Text type="secondary" style={{ maxWidth: 200 }} ellipsis>
              {str.length > 50 ? str.substring(0, 50) + '...' : str}
            </Text>
          </Tooltip>
        );
      },
    },
  ];

  return (
    <div>
      {/* 页面标题 */}
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}>
          <HistoryOutlined style={{ marginRight: 8 }} />
          操作日志
        </Title>
        <Text type="secondary">查看系统操作记录，用于安全审计</Text>
      </div>

      {/* 统计卡片 */}
      {stats && (
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col xs={12} sm={6}>
            <Card size="small">
              <Statistic title="今日操作" value={stats.todayCount} prefix={<HistoryOutlined />} />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small">
              <Statistic title="总操作数" value={stats.totalCount} prefix={<FileTextOutlined />} />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small">
              <Statistic 
                title="最多操作" 
                value={stats.actionStats[0]?.action ? actionMap[stats.actionStats[0].action]?.label || stats.actionStats[0].action : '-'} 
                suffix={stats.actionStats[0]?.count ? `(${stats.actionStats[0].count})` : ''}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small">
              <Statistic 
                title="最活跃模块" 
                value={stats.moduleStats[0]?.module ? moduleMap[stats.moduleStats[0].module] || stats.moduleStats[0].module : '-'}
                suffix={stats.moduleStats[0]?.count ? `(${stats.moduleStats[0].count})` : ''}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* 筛选条件 */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={6}>
            <Input
              placeholder="操作员"
              prefix={<UserOutlined />}
              value={filters.adminName}
              onChange={(e) => setFilters({ ...filters, adminName: e.target.value })}
              allowClear
            />
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Select
              placeholder="操作类型"
              value={filters.action || undefined}
              onChange={(v) => setFilters({ ...filters, action: v })}
              allowClear
              style={{ width: '100%' }}
            >
              {Object.entries(actionMap).map(([key, { label }]) => (
                <Select.Option key={key} value={key}>{label}</Select.Option>
              ))}
            </Select>
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Select
              placeholder="模块"
              value={filters.module || undefined}
              onChange={(v) => setFilters({ ...filters, module: v })}
              allowClear
              style={{ width: '100%' }}
            >
              {Object.entries(moduleMap).map(([key, label]) => (
                <Select.Option key={key} value={key}>{label}</Select.Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <RangePicker
              value={filters.dateRange}
              onChange={(dates) => setFilters({ ...filters, dateRange: dates as [dayjs.Dayjs, dayjs.Dayjs] | null })}
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Space>
              <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
                搜索
              </Button>
              <Button icon={<ReloadOutlined />} onClick={handleReset}>
                重置
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 日志表格 */}
      <Card 
        size="small"
        extra={
          <Popconfirm
            title="清理日志"
            description="确定要清理90天前的日志吗？此操作不可恢复。"
            onConfirm={handleCleanup}
            okText="确定"
            cancelText="取消"
          >
            <Button size="small" danger icon={<DeleteOutlined />}>
              清理旧日志
            </Button>
          </Popconfirm>
        }
      >
        <Table
          columns={columns}
          dataSource={logs}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (page, pageSize) => fetchLogs(page, pageSize),
          }}
          size="small"
          scroll={{ x: 1000 }}
        />
      </Card>
    </div>
  );
}
