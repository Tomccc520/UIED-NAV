/**
 * @file FaviconApiSettings.tsx
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
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Switch,
  Space,
  message,
  Popconfirm,
  Tag,
  Typography,
  Alert,
  Tooltip,
  Image,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  ApiOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { faviconApiService } from '../services/api';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

interface FaviconApi {
  id: string;
  name: string;
  urlTemplate: string;
  description?: string;
  order: number;
  enabled: boolean;
}

export default function FaviconApiSettings() {
  const [apis, setApis] = useState<FaviconApi[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [testUrl, setTestUrl] = useState('https://www.google.com');
  const [testResults, setTestResults] = useState<any[]>([]);
  const [form] = Form.useForm();

  const fetchApis = async () => {
    setLoading(true);
    try {
      const res = await faviconApiService.getAll();
      setApis(res.data);
    } catch (error) {
      message.error('获取配置失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApis();
  }, []);

  const handleAdd = () => {
    setEditingId(null);
    form.resetFields();
    form.setFieldsValue({ order: apis.length, enabled: true });
    setModalOpen(true);
  };

  const handleEdit = (record: FaviconApi) => {
    setEditingId(record.id);
    form.setFieldsValue(record);
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await faviconApiService.delete(id);
      message.success('删除成功');
      fetchApis();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingId) {
        await faviconApiService.update(editingId, values);
        message.success('更新成功');
      } else {
        await faviconApiService.create(values);
        message.success('创建成功');
      }
      setModalOpen(false);
      fetchApis();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleToggleEnabled = async (record: FaviconApi) => {
    try {
      await faviconApiService.update(record.id, { enabled: !record.enabled });
      message.success(record.enabled ? '已禁用' : '已启用');
      fetchApis();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleTestApis = async () => {
    if (!testUrl) {
      message.warning('请输入测试URL');
      return;
    }
    try {
      const res = await faviconApiService.fetchFavicon(testUrl);
      setTestResults(res.data.allApis || []);
      message.success('测试完成');
    } catch (error) {
      message.error('测试失败');
    }
  };

  const columns = [
    {
      title: '优先级',
      dataIndex: 'order',
      key: 'order',
      width: 80,
      render: (order: number) => <Tag>{order}</Tag>,
    },
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      width: 150,
      render: (name: string) => (
        <Space>
          <ApiOutlined />
          <span style={{ fontWeight: 500 }}>{name}</span>
        </Space>
      ),
    },
    {
      title: 'URL模板',
      dataIndex: 'urlTemplate',
      key: 'urlTemplate',
      ellipsis: true,
      render: (url: string) => (
        <Tooltip title={url}>
          <Text code style={{ fontSize: 12 }}>{url}</Text>
        </Tooltip>
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      width: 200,
      ellipsis: true,
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      key: 'enabled',
      width: 100,
      render: (enabled: boolean, record: FaviconApi) => (
        <Switch
          checked={enabled}
          onChange={() => handleToggleEnabled(record)}
          checkedChildren={<CheckCircleOutlined />}
          unCheckedChildren={<CloseCircleOutlined />}
        />
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: any, record: FaviconApi) => (
        <Space size={4}>
          <Tooltip title="编辑">
            <Button size="small" type="text" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          </Tooltip>
          <Popconfirm title="确定删除？" onConfirm={() => handleDelete(record.id)}>
            <Tooltip title="删除">
              <Button size="small" type="text" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>
          <ApiOutlined style={{ marginRight: 8 }} />
          Favicon API 配置
        </Title>
        <Paragraph type="secondary" style={{ marginTop: 8, marginBottom: 0 }}>
          配置获取网站图标的API服务，支持多个备选API，按优先级顺序使用
        </Paragraph>
      </div>

      <Alert
        message="使用说明"
        description={
          <div>
            <p>URL模板中可使用以下占位符：</p>
            <ul style={{ margin: '8px 0', paddingLeft: 20 }}>
              <li><Text code>{'{domain}'}</Text> - 网站域名，如 google.com</li>
              <li><Text code>{'{url}'}</Text> - 完整URL（已编码）</li>
            </ul>
            <p>常用API示例：</p>
            <ul style={{ margin: '8px 0', paddingLeft: 20 }}>
              <li>Google: <Text code copyable>https://t3.gstatic.cn/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&size=128&url={'{domain}'}</Text></li>
              <li>DuckDuckGo: <Text code copyable>https://icons.duckduckgo.com/ip3/{'{domain}'}.ico</Text></li>
              <li>Favicon.io: <Text code copyable>https://favicon.io/favicon/{'{domain}'}</Text></li>
            </ul>
          </div>
        }
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      {/* 测试区域 */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Space style={{ width: '100%' }}>
          <Input
            placeholder="输入网站URL进行测试"
            value={testUrl}
            onChange={e => setTestUrl(e.target.value)}
            style={{ width: 300 }}
          />
          <Button icon={<EyeOutlined />} onClick={handleTestApis}>
            测试所有API
          </Button>
        </Space>
        {testResults.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <Text strong>测试结果：</Text>
            <div style={{ display: 'flex', gap: 16, marginTop: 8, flexWrap: 'wrap' }}>
              {testResults.map((result, index) => (
                <Card key={index} size="small" style={{ width: 200 }}>
                  <div style={{ textAlign: 'center' }}>
                    <Image
                      src={result.url}
                      alt={result.name}
                      style={{ width: 64, height: 64 }}
                      fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
                    />
                    <div style={{ marginTop: 8 }}>
                      <Text type="secondary" style={{ fontSize: 12 }}>{result.name}</Text>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </Card>

      <Card
        title="API列表"
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={fetchApis}>刷新</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>添加API</Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={apis}
          rowKey="id"
          loading={loading}
          pagination={false}
          locale={{ emptyText: '暂无配置，请添加Favicon API' }}
        />
      </Card>

      <Modal
        title={editingId ? '编辑API配置' : '添加API配置'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        width={600}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="name"
            label="API名称"
            rules={[{ required: true, message: '请输入API名称' }]}
          >
            <Input placeholder="如：Google Favicon" />
          </Form.Item>

          <Form.Item
            name="urlTemplate"
            label="URL模板"
            rules={[{ required: true, message: '请输入URL模板' }]}
            extra="使用 {domain} 作为域名占位符"
          >
            <TextArea
              rows={2}
              placeholder="https://t3.gstatic.cn/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&size=128&url={domain}"
            />
          </Form.Item>

          <Form.Item name="description" label="描述">
            <Input placeholder="API描述（可选）" />
          </Form.Item>

          <Space size="large">
            <Form.Item name="order" label="优先级" style={{ marginBottom: 0 }}>
              <InputNumber min={0} placeholder="0" style={{ width: 100 }} />
            </Form.Item>
            <Form.Item name="enabled" label="启用" valuePropName="checked" style={{ marginBottom: 0 }}>
              <Switch />
            </Form.Item>
          </Space>
        </Form>
      </Modal>
    </div>
  );
}
