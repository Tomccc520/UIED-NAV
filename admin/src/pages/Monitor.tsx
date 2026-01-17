/**
 * @file Monitor.tsx
 * @description 管理后台组件
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

import { useEffect, useState } from 'react';
import {
  Card,
  Row,
  Col,
  Typography,
  Space,
  Tag,
  Table,
  Button,
  Statistic,
  Progress,
  Modal,
  Form,
  InputNumber,
  Switch,
  message,
  Spin,
  Tooltip,
  Popconfirm,
} from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  QuestionCircleOutlined,
  ReloadOutlined,
  SettingOutlined,
  GlobalOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  SyncOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import api from '../services/api';

const { Title, Text } = Typography;

interface Statistics {
  total: number;
  active: number;
  failed: number;
  unchecked: number;
  lastCheckAt: string | null;
  activeRate: string;
}

interface FailedWebsite {
  id: string;
  name: string;
  url: string;
  status: string;
  statusMessage: string | null;
  lastCheckedAt: string | null;
  failedCount: number;
  category: { id: string; name: string } | null;
}

interface MonitorConfig {
  id: string;
  checkInterval: number;
  timeout: number;
  maxRetries: number;
  enabled: boolean;
}

interface MonitorLog {
  id: string;
  status: string;
  httpStatus: number | null;
  responseTime: number | null;
  errorMessage: string | null;
  checkedAt: string;
}

export default function Monitor() {
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [failedWebsites, setFailedWebsites] = useState<FailedWebsite[]>([]);
  const [config, setConfig] = useState<MonitorConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [checkingId, setCheckingId] = useState<string | null>(null);
  const [configModalVisible, setConfigModalVisible] = useState(false);
  const [logsModalVisible, setLogsModalVisible] = useState(false);
  const [selectedWebsite, setSelectedWebsite] = useState<FailedWebsite | null>(null);
  const [logs, setLogs] = useState<MonitorLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, failedRes, configRes] = await Promise.all([
        api.get('/monitor/statistics'),
        api.get('/monitor/failed-websites'),
        api.get('/monitor/config'),
      ]);
      setStatistics(statsRes.data);
      setFailedWebsites(failedRes.data.items || []);
      setConfig(configRes.data);
    } catch (error) {
      console.error('获取监控数据失败:', error);
      message.error('获取监控数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckAll = async () => {
    setChecking(true);
    message.loading({ content: '正在检测所有网站，请稍候...', key: 'checkAll', duration: 0 });
    try {
      const res = await api.post('/monitor/check-all', { batchSize: 10, delayMs: 1000 });
      message.success({
        content: `检测完成：成功 ${res.data.success}，失败 ${res.data.failed}`,
        key: 'checkAll',
      });
      fetchData();
    } catch (error) {
      message.error({ content: '检测失败', key: 'checkAll' });
    } finally {
      setChecking(false);
    }
  };

  const handleCheckSingle = async (id: string) => {
    setCheckingId(id);
    try {
      const res = await api.post(`/monitor/check/${id}`);
      if (res.data.success) {
        message.success(`${res.data.websiteName} 检测正常`);
      } else {
        message.warning(`${res.data.websiteName} 检测失败: ${res.data.error || res.data.status}`);
      }
      fetchData();
    } catch (error) {
      message.error('检测失败');
    } finally {
      setCheckingId(null);
    }
  };

  const handleResetStatus = async (id: string) => {
    try {
      await api.post(`/monitor/reset/${id}`);
      message.success('状态已重置');
      fetchData();
    } catch (error) {
      message.error('重置失败');
    }
  };

  const handleUpdateConfig = async (values: Partial<MonitorConfig>) => {
    try {
      await api.put('/monitor/config', values);
      message.success('配置已更新');
      setConfigModalVisible(false);
      fetchData();
    } catch (error) {
      message.error('更新配置失败');
    }
  };

  const handleViewLogs = async (website: FailedWebsite) => {
    setSelectedWebsite(website);
    setLogsModalVisible(true);
    setLogsLoading(true);
    try {
      const res = await api.get(`/monitor/logs/${website.id}`);
      setLogs(res.data.items || []);
    } catch (error) {
      message.error('获取日志失败');
    } finally {
      setLogsLoading(false);
    }
  };

  const columns = [
    {
      title: '网站名称',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: FailedWebsite) => (
        <Space>
          <Text strong>{name}</Text>
          <a href={record.url} target="_blank" rel="noopener noreferrer">
            <GlobalOutlined style={{ color: '#1890ff' }} />
          </a>
        </Space>
      ),
    },
    {
      title: '分类',
      dataIndex: ['category', 'name'],
      key: 'category',
      width: 120,
      render: (name: string) => <Tag>{name || '未分类'}</Tag>,
    },
    {
      title: '错误信息',
      dataIndex: 'statusMessage',
      key: 'statusMessage',
      width: 200,
      render: (msg: string) => (
        <Text type="danger" ellipsis style={{ maxWidth: 180 }}>
          {msg || '未知错误'}
        </Text>
      ),
    },
    {
      title: '失败次数',
      dataIndex: 'failedCount',
      key: 'failedCount',
      width: 100,
      render: (count: number) => (
        <Tag color={count >= 3 ? 'red' : 'orange'}>{count} 次</Tag>
      ),
    },
    {
      title: '最后检测',
      dataIndex: 'lastCheckedAt',
      key: 'lastCheckedAt',
      width: 160,
      render: (date: string) =>
        date ? new Date(date).toLocaleString('zh-CN') : '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: unknown, record: FailedWebsite) => (
        <Space size="small">
          <Tooltip title="重新检测">
            <Button
              type="link"
              size="small"
              icon={<SyncOutlined spin={checkingId === record.id} />}
              onClick={() => handleCheckSingle(record.id)}
              loading={checkingId === record.id}
            />
          </Tooltip>
          <Tooltip title="查看日志">
            <Button
              type="link"
              size="small"
              icon={<ClockCircleOutlined />}
              onClick={() => handleViewLogs(record)}
            />
          </Tooltip>
          <Popconfirm
            title="确定重置状态？"
            description="将清除失败记录，状态变为未检测"
            onConfirm={() => handleResetStatus(record.id)}
          >
            <Tooltip title="重置状态">
              <Button type="link" size="small" icon={<DeleteOutlined />} danger />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const logColumns = [
    {
      title: '检测时间',
      dataIndex: 'checkedAt',
      key: 'checkedAt',
      render: (date: string) => new Date(date).toLocaleString('zh-CN'),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'success' ? 'green' : 'red'}>
          {status === 'success' ? '成功' : '失败'}
        </Tag>
      ),
    },
    {
      title: 'HTTP状态',
      dataIndex: 'httpStatus',
      key: 'httpStatus',
      render: (status: number) => status || '-',
    },
    {
      title: '响应时间',
      dataIndex: 'responseTime',
      key: 'responseTime',
      render: (time: number) => (time ? `${time}ms` : '-'),
    },
    {
      title: '错误信息',
      dataIndex: 'errorMessage',
      key: 'errorMessage',
      render: (msg: string) => msg || '-',
    },
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <Spin size="large" />
      </div>
    );
  }

  const activeRate = statistics ? parseFloat(statistics.activeRate) : 0;

  return (
    <div>
      {/* 页面标题 */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>
            <CheckCircleOutlined style={{ marginRight: 8 }} />
            网站状态监控
          </Title>
          <Text type="secondary">自动检测网站可用性，发现失效链接</Text>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchData}>
            刷新
          </Button>
          <Button icon={<SettingOutlined />} onClick={() => {
            form.setFieldsValue(config);
            setConfigModalVisible(true);
          }}>
            配置
          </Button>
          <Button
            type="primary"
            icon={<SyncOutlined spin={checking} />}
            onClick={handleCheckAll}
            loading={checking}
          >
            检测全部
          </Button>
        </Space>
      </div>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card size="small" bordered>
            <Statistic
              title="网站总数"
              value={statistics?.total || 0}
              prefix={<GlobalOutlined style={{ color: '#1890ff' }} />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" bordered>
            <Statistic
              title="正常"
              value={statistics?.active || 0}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" bordered>
            <Statistic
              title="失效"
              value={statistics?.failed || 0}
              prefix={<CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" bordered>
            <Statistic
              title="未检测"
              value={statistics?.unchecked || 0}
              prefix={<QuestionCircleOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 健康度进度条 */}
      <Card size="small" style={{ marginBottom: 24 }}>
        <Row align="middle" gutter={16}>
          <Col flex="auto">
            <Text strong>网站健康度</Text>
            <Progress
              percent={activeRate}
              status={activeRate >= 90 ? 'success' : activeRate >= 70 ? 'normal' : 'exception'}
              strokeColor={activeRate >= 90 ? '#52c41a' : activeRate >= 70 ? '#1890ff' : '#ff4d4f'}
              style={{ marginTop: 8 }}
            />
          </Col>
          <Col>
            <Space direction="vertical" size={0} style={{ textAlign: 'right' }}>
              <Text type="secondary">最后检测时间</Text>
              <Text>
                {statistics?.lastCheckAt
                  ? new Date(statistics.lastCheckAt).toLocaleString('zh-CN')
                  : '从未检测'}
              </Text>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 失效网站列表 */}
      <Card
        title={
          <Space>
            <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
            <span>失效网站列表</span>
            <Tag color="red">{failedWebsites.length}</Tag>
          </Space>
        }
        size="small"
      >
        <Table
          columns={columns}
          dataSource={failedWebsites}
          rowKey="id"
          pagination={{ pageSize: 10, showSizeChanger: true }}
          size="small"
          locale={{ emptyText: '暂无失效网站，太棒了！' }}
        />
      </Card>

      {/* 配置弹窗 */}
      <Modal
        title="监控配置"
        open={configModalVisible}
        onCancel={() => setConfigModalVisible(false)}
        onOk={() => form.submit()}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleUpdateConfig}
          initialValues={config || {}}
        >
          <Form.Item
            name="enabled"
            label="启用监控"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
          <Form.Item
            name="checkInterval"
            label="检测间隔（秒）"
            help="默认 86400 秒（24小时）"
          >
            <InputNumber min={3600} max={604800} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="timeout"
            label="请求超时（毫秒）"
            help="默认 10000 毫秒（10秒）"
          >
            <InputNumber min={1000} max={60000} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="maxRetries"
            label="最大重试次数"
            help="连续失败多少次后标记为失效"
          >
            <InputNumber min={1} max={10} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      {/* 日志弹窗 */}
      <Modal
        title={`监控日志 - ${selectedWebsite?.name || ''}`}
        open={logsModalVisible}
        onCancel={() => setLogsModalVisible(false)}
        footer={null}
        width={700}
      >
        <Table
          columns={logColumns}
          dataSource={logs}
          rowKey="id"
          loading={logsLoading}
          pagination={{ pageSize: 10 }}
          size="small"
        />
      </Modal>
    </div>
  );
}
