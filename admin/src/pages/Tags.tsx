/**
 * @file Tags.tsx
 * @description 标签管理页面
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

import { useEffect, useState } from 'react';
import {
  Card,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Space,
  message,
  Popconfirm,
  Tag,
  Table,
  Typography,
  Row,
  Col,
  Statistic,
  ColorPicker,
  App,
} from 'antd';
import type { TableProps } from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  TagsOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import api from '../services/api';

const { Title, Text } = Typography;

interface WebsiteTag {
  id: string;
  name: string;
  slug: string;
  color?: string;
  description?: string;
  order: number;
  _count?: { websites: number };
  createdAt: string;
}

export default function Tags() {
  const { message: messageApi } = App.useApp();
  const [tags, setTags] = useState<WebsiteTag[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [form] = Form.useForm();

  // 获取标签数据
  const fetchTags = async () => {
    setLoading(true);
    try {
      const response = await api.get('/website-tags');
      setTags(response.data.data || response.data || []);
    } catch (error) {
      messageApi.error('获取标签失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTags();
  }, []);

  // 添加标签
  const handleAdd = () => {
    setEditingId(null);
    form.resetFields();
    form.setFieldsValue({ order: 0, color: '#1890ff' });
    setModalOpen(true);
  };

  // 编辑标签
  const handleEdit = (record: WebsiteTag) => {
    setEditingId(record.id);
    form.setFieldsValue(record);
    setModalOpen(true);
  };

  // 删除标签
  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/website-tags/${id}`);
      messageApi.success('删除成功');
      fetchTags();
    } catch (error) {
      messageApi.error('删除失败');
    }
  };

  // 提交表单
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const color = typeof values.color === 'string' ? values.color : values.color?.toHexString?.() || '#1890ff';
      const data = { ...values, color };

      if (editingId) {
        await api.put(`/website-tags/${editingId}`, data);
        messageApi.success('更新成功');
      } else {
        await api.post('/website-tags', data);
        messageApi.success('创建成功');
      }
      setModalOpen(false);
      fetchTags();
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || error.message || '操作失败';
      messageApi.error(`操作失败: ${errorMsg}`);
    }
  };

  // 自动生成 slug
  const generateSlug = () => {
    const name = form.getFieldValue('name');
    if (name) {
      const slug = name
        .toLowerCase()
        .replace(/[\s]+/g, '-')
        .replace(/[^a-z0-9\u4e00-\u9fa5-]/g, '')
        .replace(/^-|-$/g, '');
      form.setFieldValue('slug', slug);
    }
  };

  // 筛选后的标签
  const filteredTags = tags.filter(tag => 
    !searchText || 
    tag.name.toLowerCase().includes(searchText.toLowerCase()) ||
    tag.slug.toLowerCase().includes(searchText.toLowerCase())
  );

  // 统计
  const totalWebsites = tags.reduce((sum, tag) => sum + (tag._count?.websites || 0), 0);

  const columns: TableProps<WebsiteTag>['columns'] = [
    {
      title: '标签名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      render: (name: string, record: WebsiteTag) => (
        <Space>
          <Tag color={record.color || '#1890ff'}>{name}</Tag>
        </Space>
      ),
    },
    {
      title: 'URL标识',
      dataIndex: 'slug',
      key: 'slug',
      width: 180,
      render: (slug: string) => <Text code>{slug}</Text>,
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '网站数',
      key: 'websites',
      width: 100,
      align: 'center',
      render: (_: any, record: WebsiteTag) => (
        <Tag color="blue">{record._count?.websites || 0}</Tag>
      ),
    },
    {
      title: '排序',
      dataIndex: 'order',
      key: 'order',
      width: 80,
      align: 'center',
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: any, record: WebsiteTag) => (
        <Space>
          <Button 
            type="text" 
            size="small" 
            icon={<EditOutlined />} 
            onClick={() => handleEdit(record)} 
          />
          <Popconfirm 
            title="确定删除此标签？" 
            description="删除后关联的网站将移除此标签"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button type="text" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      {/* 页面标题和统计 */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col flex="auto">
            <Title level={4} style={{ margin: 0 }}>
              <TagsOutlined style={{ marginRight: 8 }} />
              标签管理
            </Title>
            <Text type="secondary">管理网站标签，用于网站分类和筛选</Text>
          </Col>
          <Col>
            <Space size="large">
              <Statistic title="标签总数" value={tags.length} />
              <Statistic title="关联网站" value={totalWebsites} />
            </Space>
          </Col>
          <Col>
            <Space>
              <Button icon={<ReloadOutlined />} onClick={fetchTags}>
                刷新
              </Button>
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                添加标签
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 搜索 */}
      <Card style={{ marginBottom: 16 }}>
        <Input
          placeholder="搜索标签名称或标识..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 300 }}
          allowClear
        />
      </Card>

      {/* 标签表格 */}
      <Card>
        <Table
          columns={columns}
          dataSource={filteredTags}
          rowKey="id"
          loading={loading}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 个标签`,
          }}
        />
      </Card>

      {/* 编辑/添加弹窗 */}
      <Modal
        title={editingId ? '编辑标签' : '添加标签'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        width={500}
        okText="保存"
        cancelText="取消"
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item 
            name="name" 
            label="标签名称" 
            rules={[{ required: true, message: '请输入标签名称' }]}
          >
            <Input 
              placeholder="如：设计灵感" 
              onBlur={generateSlug}
            />
          </Form.Item>

          <Form.Item 
            name="slug" 
            label="URL标识" 
            rules={[{ required: true, message: '请输入URL标识' }]}
            extra="用于URL，建议使用英文小写和连字符"
          >
            <Input placeholder="如：design-inspiration" />
          </Form.Item>

          <Form.Item name="description" label="描述">
            <Input.TextArea rows={2} placeholder="标签描述（可选）" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="color" label="颜色">
                <ColorPicker showText />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="order" label="排序">
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
}
