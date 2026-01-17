/**
 * @file HotRecommendations.tsx
 * @description 热门推荐管理页面 - 支持批量删除和网址管理
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
  Tag,
  message,
  Popconfirm,
  Select,
  DatePicker,
  Statistic,
  Row,
  Col,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  FireOutlined,
  StarOutlined,
  DollarOutlined,
  SearchOutlined,
  ImportOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import api, { websiteApi } from '../services/api';

interface HotRecommendation {
  id: string;
  name: string;
  description: string;
  url: string;
  iconUrl?: string;
  pageSlug?: string;
  position: string;
  order: number;
  visible: boolean;
  startDate?: string;
  endDate?: string;
  clickCount: number;
  createdAt: string;
}

interface Page {
  id: string;
  name: string;
  slug: string;
}

interface Website {
  id: string;
  name: string;
  description: string;
  url: string;
  iconUrl?: string;
}

const positionOptions = [
  { value: 'hot', label: '热门推荐', icon: <FireOutlined style={{ color: '#ff4d4f' }} /> },
  { value: 'featured', label: '精选推荐', icon: <StarOutlined style={{ color: '#faad14' }} /> },
  { value: 'ad', label: 'UIED系列', icon: <DollarOutlined style={{ color: '#52c41a' }} /> },
];

export default function HotRecommendations() {
  const [items, setItems] = useState<HotRecommendation[]>([]);
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterPosition, setFilterPosition] = useState<string | undefined>();
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [form] = Form.useForm();
  
  // 网站选择相关状态
  const [websiteModalOpen, setWebsiteModalOpen] = useState(false);
  const [websites, setWebsites] = useState<Website[]>([]);
  const [websiteLoading, setWebsiteLoading] = useState(false);
  const [websiteSearch, setWebsiteSearch] = useState('');
  const [selectedWebsites, setSelectedWebsites] = useState<Website[]>([]);
  const [importPosition, setImportPosition] = useState<string>('hot');

  const fetchItems = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (filterPosition) params.position = filterPosition;
      const res = await api.get('/hot-recommendations', { params });
      setItems(res.data);
    } catch (error) {
      message.error('获取数据失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchPages = async () => {
    try {
      const res = await api.get('/pages');
      setPages(res.data);
    } catch (error) {
      console.error('获取页面失败');
    }
  };

  useEffect(() => {
    fetchItems();
    fetchPages();
  }, [filterPosition]);

  // 搜索网站
  const fetchWebsites = async (search: string) => {
    setWebsiteLoading(true);
    try {
      const res = await websiteApi.getPaginated({ search, pageSize: 50 });
      setWebsites(res.data.data || []);
    } catch (error) {
      message.error('获取网站列表失败');
    } finally {
      setWebsiteLoading(false);
    }
  };

  // 打开网站选择弹窗
  const handleOpenWebsiteModal = () => {
    setSelectedWebsites([]);
    setWebsiteSearch('');
    setWebsites([]);
    setWebsiteModalOpen(true);
  };

  // 从网站导入到热门推荐
  const handleImportWebsites = async () => {
    if (selectedWebsites.length === 0) {
      message.warning('请选择要导入的网站');
      return;
    }

    try {
      let successCount = 0;
      for (const website of selectedWebsites) {
        try {
          await api.post('/hot-recommendations', {
            name: website.name,
            description: website.description,
            url: website.url,
            iconUrl: website.iconUrl,
            position: importPosition,
            order: 0,
            visible: true,
          });
          successCount++;
        } catch (err) {
          console.error('导入失败:', website.name, err);
        }
      }
      message.success(`成功导入 ${successCount} 个网站`);
      setWebsiteModalOpen(false);
      fetchItems();
    } catch (error) {
      message.error('导入失败');
    }
  };

  const handleAdd = () => {
    setEditingId(null);
    form.resetFields();
    form.setFieldsValue({
      position: 'hot',
      order: 0,
      visible: true,
    });
    setModalOpen(true);
  };

  const handleEdit = (record: HotRecommendation) => {
    setEditingId(record.id);
    form.setFieldsValue({
      ...record,
      startDate: record.startDate ? dayjs(record.startDate) : undefined,
      endDate: record.endDate ? dayjs(record.endDate) : undefined,
    });
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/hot-recommendations/${id}`);
      message.success('删除成功');
      fetchItems();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleBatchDelete = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要删除的项');
      return;
    }

    try {
      await Promise.all(selectedRowKeys.map(id => api.delete(`/hot-recommendations/${id}`)));
      message.success(`成功删除 ${selectedRowKeys.length} 项`);
      setSelectedRowKeys([]);
      fetchItems();
    } catch (error) {
      message.error('批量删除失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const data = {
        ...values,
        startDate: values.startDate?.toISOString(),
        endDate: values.endDate?.toISOString(),
      };

      if (editingId) {
        await api.put(`/hot-recommendations/${editingId}`, data);
        message.success('更新成功');
      } else {
        await api.post('/hot-recommendations', data);
        message.success('创建成功');
      }
      setModalOpen(false);
      fetchItems();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleToggleVisible = async (id: string, visible: boolean) => {
    try {
      await api.put(`/hot-recommendations/${id}`, { visible });
      message.success(visible ? '已显示' : '已隐藏');
      fetchItems();
    } catch (error) {
      message.error('操作失败');
    }
  };

  // 统计数据
  const stats = {
    total: items.length,
    hot: items.filter(i => i.position === 'hot').length,
    featured: items.filter(i => i.position === 'featured').length,
    ad: items.filter(i => i.position === 'ad').length,
    totalClicks: items.reduce((sum, i) => sum + i.clickCount, 0),
  };

  const columns = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: HotRecommendation) => (
        <Space>
          {record.iconUrl && <img src={record.iconUrl} alt="" style={{ width: 20, height: 20, borderRadius: 4 }} />}
          <a href={record.url} target="_blank" rel="noopener noreferrer">{text}</a>
        </Space>
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      width: 200,
    },
    {
      title: '位置',
      dataIndex: 'position',
      key: 'position',
      render: (position: string) => {
        const opt = positionOptions.find(o => o.value === position);
        return opt ? <Tag icon={opt.icon}>{opt.label}</Tag> : position;
      },
    },
    {
      title: '所属页面',
      dataIndex: 'pageSlug',
      key: 'pageSlug',
      render: (slug: string) => {
        if (!slug) return <Tag>全局</Tag>;
        const page = pages.find(p => p.slug === slug);
        return <Tag color="blue">{page?.name || slug}</Tag>;
      },
    },
    {
      title: '点击量',
      dataIndex: 'clickCount',
      key: 'clickCount',
      sorter: (a: HotRecommendation, b: HotRecommendation) => a.clickCount - b.clickCount,
    },
    {
      title: '状态',
      dataIndex: 'visible',
      key: 'visible',
      render: (visible: boolean, record: HotRecommendation) => (
        <Switch
          checked={visible}
          onChange={(checked) => handleToggleVisible(record.id, checked)}
          checkedChildren="显示"
          unCheckedChildren="隐藏"
        />
      ),
    },
    {
      title: '排序',
      dataIndex: 'order',
      key: 'order',
      sorter: (a: HotRecommendation, b: HotRecommendation) => a.order - b.order,
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: HotRecommendation) => (
        <Space>
          <Button size="small" icon={<EyeOutlined />} onClick={() => window.open(record.url, '_blank')} />
          <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Popconfirm title="确定删除？" onConfirm={() => handleDelete(record.id)}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>热门推荐管理</h2>
        <p style={{ color: '#666', fontSize: 14, marginTop: 8 }}>
          管理首页和各页面的热门推荐、精选推荐和UIED系列
        </p>
      </div>

      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card size="small">
            <Statistic title="总数" value={stats.total} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="热门推荐" value={stats.hot} prefix={<FireOutlined style={{ color: '#ff4d4f' }} />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="精选推荐" value={stats.featured} prefix={<StarOutlined style={{ color: '#faad14' }} />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="总点击量" value={stats.totalClicks} />
          </Card>
        </Col>
      </Row>

      <Card>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
          <Space>
            <Select
              placeholder="筛选位置"
              allowClear
              style={{ width: 150 }}
              value={filterPosition}
              onChange={setFilterPosition}
              options={positionOptions}
            />
            {selectedRowKeys.length > 0 && (
              <Popconfirm
                title={`确定删除选中的 ${selectedRowKeys.length} 项？`}
                onConfirm={handleBatchDelete}
                okText="确定"
                cancelText="取消"
              >
                <Button danger icon={<DeleteOutlined />}>
                  批量删除 ({selectedRowKeys.length})
                </Button>
              </Popconfirm>
            )}
          </Space>
          <Space>
            <Button icon={<ImportOutlined />} onClick={handleOpenWebsiteModal}>
              从网站导入
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              添加推荐
            </Button>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={items}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          rowSelection={{
            selectedRowKeys,
            onChange: (keys) => setSelectedRowKeys(keys as string[]),
          }}
        />
      </Card>

      <Modal
        title={editingId ? '编辑推荐' : '添加推荐'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="名称" rules={[{ required: true, message: '请输入名称' }]}>
            <Input placeholder="网站/工具名称" />
          </Form.Item>

          <Form.Item name="description" label="描述" rules={[{ required: true, message: '请输入描述' }]}>
            <Input.TextArea rows={2} placeholder="简短描述" />
          </Form.Item>

          <Form.Item name="url" label="链接" rules={[{ required: true, message: '请输入链接' }]}>
            <Input placeholder="https://..." />
          </Form.Item>

          <Form.Item name="iconUrl" label="图标URL">
            <Input placeholder="图标图片地址（可选）" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="position" label="位置" rules={[{ required: true }]}>
                <Select options={positionOptions} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="pageSlug" label="所属页面">
                <Select
                  placeholder="全局（所有页面）"
                  allowClear
                  options={[
                    { value: '', label: '全局（所有页面）' },
                    ...pages.map(p => ({ value: p.slug, label: p.name })),
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="startDate" label="开始时间">
                <DatePicker showTime style={{ width: '100%' }} placeholder="立即开始" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="endDate" label="结束时间">
                <DatePicker showTime style={{ width: '100%' }} placeholder="永不结束" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="order" label="排序">
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="visible" label="显示" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* 从网站导入弹窗 */}
      <Modal
        title="从网站管理导入"
        open={websiteModalOpen}
        onOk={handleImportWebsites}
        onCancel={() => setWebsiteModalOpen(false)}
        width={700}
        okText={`导入 ${selectedWebsites.length} 个网站`}
        okButtonProps={{ disabled: selectedWebsites.length === 0 }}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Row gutter={16}>
            <Col span={16}>
              <Input.Search
                placeholder="搜索网站名称..."
                value={websiteSearch}
                onChange={(e) => setWebsiteSearch(e.target.value)}
                onSearch={fetchWebsites}
                enterButton={<SearchOutlined />}
              />
            </Col>
            <Col span={8}>
              <Select
                style={{ width: '100%' }}
                value={importPosition}
                onChange={setImportPosition}
                options={positionOptions}
                placeholder="导入到位置"
              />
            </Col>
          </Row>

          <Table
            size="small"
            loading={websiteLoading}
            dataSource={websites}
            rowKey="id"
            pagination={{ pageSize: 5 }}
            rowSelection={{
              selectedRowKeys: selectedWebsites.map(w => w.id),
              onChange: (_, rows) => setSelectedWebsites(rows as Website[]),
            }}
            columns={[
              {
                title: '网站',
                dataIndex: 'name',
                render: (name: string, record: Website) => (
                  <Space>
                    {record.iconUrl && (
                      <img src={record.iconUrl} alt="" style={{ width: 20, height: 20, borderRadius: 4 }} />
                    )}
                    <span>{name}</span>
                  </Space>
                ),
              },
              {
                title: '描述',
                dataIndex: 'description',
                ellipsis: true,
              },
              {
                title: '链接',
                dataIndex: 'url',
                ellipsis: true,
                width: 150,
                render: (url: string) => (
                  <a href={url} target="_blank" rel="noopener noreferrer">{url}</a>
                ),
              },
            ]}
            locale={{ emptyText: '请输入关键词搜索网站' }}
          />

          {selectedWebsites.length > 0 && (
            <div style={{ color: '#666' }}>
              已选择 {selectedWebsites.length} 个网站，将导入到「{positionOptions.find(p => p.value === importPosition)?.label}」
            </div>
          )}
        </Space>
      </Modal>
    </div>
  );
}
