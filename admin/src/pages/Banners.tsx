/**
 * @file Banners.tsx
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
  Tag,
  message,
  Popconfirm,
  Select,
  DatePicker,
  Image,
  Tooltip,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  LinkOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import api from '../services/api';

interface Banner {
  id: string;
  title: string;
  description?: string;
  imageUrl: string;
  linkUrl?: string;
  linkTarget: string;
  pageSlug?: string;
  position: string;
  order: number;
  visible: boolean;
  startDate?: string;
  endDate?: string;
  clickCount: number;
  createdAt: string;
  contentType?: string; // 'image' | 'html'
  htmlContent?: string; // HTML 代码内容
}

interface Page {
  id: string;
  name: string;
  slug: string;
}

const positionOptions = [
  { value: 'top', label: '顶部横幅' },
  { value: 'sidebar', label: '侧边栏' },
  { value: 'bottom', label: '底部横幅' },
  { value: 'popup', label: '弹窗广告' },
];

const linkTargetOptions = [
  { value: '_blank', label: '新窗口打开' },
  { value: '_self', label: '当前窗口打开' },
];

const contentTypeOptions = [
  { value: 'image', label: '图片广告' },
  { value: 'html', label: 'HTML 代码' },
];

export default function Banners() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form] = Form.useForm();
  const [contentType, setContentType] = useState<string>('image');

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const res = await api.get('/banners');
      setBanners(res.data);
    } catch (error) {
      message.error('获取广告位数据失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchPages = async () => {
    try {
      const res = await api.get('/pages');
      setPages(res.data);
    } catch (error) {
      console.error('获取页面列表失败');
    }
  };

  useEffect(() => {
    fetchBanners();
    fetchPages();
  }, []);

  const handleAdd = () => {
    setEditingId(null);
    form.resetFields();
    form.setFieldsValue({
      order: 0,
      visible: true,
      position: ['top'], // 默认选中顶部横幅
      linkTarget: '_blank',
      contentType: 'image',
    });
    setContentType('image');
    setModalOpen(true);
  };

  const handleEdit = (record: Banner) => {
    setEditingId(record.id);
    const type = record.contentType || 'image';
    setContentType(type);
    form.setFieldsValue({
      ...record,
      contentType: type,
      // 将逗号分隔字符串转为数组
      position: record.position ? record.position.split(',').map(p => p.trim()) : [],
      startDate: record.startDate ? dayjs(record.startDate) : undefined,
      endDate: record.endDate ? dayjs(record.endDate) : undefined,
    });
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/banners/${id}`);
      message.success('删除成功');
      fetchBanners();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const data = {
        ...values,
        // 将位置数组转为逗号分隔字符串
        position: Array.isArray(values.position) ? values.position.join(',') : values.position,
        startDate: values.startDate?.toISOString(),
        endDate: values.endDate?.toISOString(),
      };

      if (editingId) {
        await api.put(`/banners/${editingId}`, data);
        message.success('更新成功');
      } else {
        await api.post('/banners', data);
        message.success('创建成功');
      }
      setModalOpen(false);
      fetchBanners();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleToggleVisible = async (id: string, visible: boolean) => {
    try {
      await api.put(`/banners/${id}`, { visible });
      message.success(visible ? '已显示' : '已隐藏');
      fetchBanners();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const columns: ColumnsType<Banner> = [
    {
      title: '预览',
      dataIndex: 'imageUrl',
      key: 'imageUrl',
      width: 120,
      render: (url: string, record: Banner) => {
        if (record.contentType === 'html') {
          return <Tag color="purple">HTML</Tag>;
        }
        return <Image src={url} width={100} height={60} style={{ objectFit: 'cover', borderRadius: 4 }} />;
      },
    },
    { title: '标题', dataIndex: 'title', key: 'title', width: 150 },
    {
      title: '类型',
      dataIndex: 'contentType',
      key: 'contentType',
      width: 80,
      render: (type: string) => {
        const option = contentTypeOptions.find(o => o.value === (type || 'image'));
        return <Tag color={type === 'html' ? 'purple' : 'blue'}>{option?.label || '图片'}</Tag>;
      },
    },
    {
      title: '位置',
      dataIndex: 'position',
      key: 'position',
      width: 150,
      render: (pos: string) => {
        // 支持多个位置（逗号分隔）
        const positions = pos ? pos.split(',') : [];
        return (
          <Space size={[0, 4]} wrap>
            {positions.map(p => {
              const option = positionOptions.find(o => o.value === p.trim());
              return <Tag key={p}>{option?.label || p}</Tag>;
            })}
          </Space>
        );
      },
    },
    {
      title: '页面',
      dataIndex: 'pageSlug',
      key: 'pageSlug',
      width: 100,
      render: (slug: string) => {
        if (!slug) return <Tag color="blue">全局</Tag>;
        const page = pages.find(p => p.slug === slug);
        return <Tag>{page?.name || slug}</Tag>;
      },
    },
    {
      title: '链接',
      dataIndex: 'linkUrl',
      key: 'linkUrl',
      width: 80,
      render: (url: string) => url ? (
        <Tooltip title={url}>
          <a href={url} target="_blank" rel="noopener noreferrer"><LinkOutlined /></a>
        </Tooltip>
      ) : '-',
    },
    {
      title: '点击',
      dataIndex: 'clickCount',
      key: 'clickCount',
      width: 80,
      render: (count: number) => count.toLocaleString(),
    },
    {
      title: '状态',
      dataIndex: 'visible',
      key: 'visible',
      width: 80,
      render: (visible: boolean, record: Banner) => (
        <Switch checked={visible} onChange={(v) => handleToggleVisible(record.id, v)} size="small" />
      ),
    },
    { title: '排序', dataIndex: 'order', key: 'order', width: 60 },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: any, record: Banner) => (
        <Space>
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
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h2 style={{ margin: 0 }}>广告位管理</h2>
          <p style={{ color: '#666', fontSize: 14, marginTop: 8 }}>管理首页和各页面的广告横幅</p>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>添加广告位</Button>
      </div>

      <Card>
        <Table columns={columns} dataSource={banners} rowKey="id" loading={loading} pagination={false} />
      </Card>

      <Modal
        title={editingId ? '编辑广告位' : '添加广告位'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        width={700}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="title" label="标题" rules={[{ required: true, message: '请输入标题' }]}>
            <Input placeholder="广告标题" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={2} placeholder="广告描述（可选）" />
          </Form.Item>
          
          <Form.Item name="contentType" label="内容类型" rules={[{ required: true }]}>
            <Select 
              options={contentTypeOptions} 
              onChange={(value) => setContentType(value)}
            />
          </Form.Item>

          {contentType === 'image' ? (
            <>
              <Form.Item 
                name="imageUrl" 
                label="图片URL" 
                rules={[{ required: contentType === 'image', message: '请输入图片URL' }]}
              >
                <Input placeholder="https://example.com/banner.jpg" />
              </Form.Item>
              <Form.Item name="linkUrl" label="跳转链接">
                <Input placeholder="点击后跳转的链接（可选）" />
              </Form.Item>
              <Form.Item name="linkTarget" label="打开方式">
                <Select options={linkTargetOptions} style={{ width: '100%' }} />
              </Form.Item>
            </>
          ) : (
            <Form.Item 
              name="htmlContent" 
              label="HTML 代码" 
              rules={[{ required: contentType === 'html', message: '请输入 HTML 代码' }]}
              extra="支持完整的 HTML、CSS 和 JavaScript 代码，包括样式和脚本"
            >
              <Input.TextArea 
                rows={12} 
                placeholder="粘贴完整的 HTML 代码，包括 <style> 和 <script> 标签"
                style={{ fontFamily: 'monospace', fontSize: '12px' }}
              />
            </Form.Item>
          )}

          <Form.Item name="position" label="展示位置" rules={[{ required: true }]}>
            <Select 
              mode="multiple"
              options={positionOptions} 
              placeholder="可选择多个展示位置"
            />
          </Form.Item>

          <Form.Item name="pageSlug" label="所属页面">
            <Select
              allowClear
              placeholder="留空表示全局显示"
              options={[
                { value: null, label: '全局（所有页面）' },
                ...pages.map(p => ({ value: p.slug, label: p.name })),
              ]}
            />
          </Form.Item>
          <Space size="large" style={{ width: '100%' }}>
            <Form.Item name="startDate" label="开始时间">
              <DatePicker showTime placeholder="留空表示立即开始" />
            </Form.Item>
            <Form.Item name="endDate" label="结束时间">
              <DatePicker showTime placeholder="留空表示永不结束" />
            </Form.Item>
          </Space>
          <Space size="large">
            <Form.Item name="order" label="排序">
              <InputNumber style={{ width: 100 }} min={0} />
            </Form.Item>
            <Form.Item name="visible" label="显示" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Space>
        </Form>
      </Modal>
    </div>
  );
}
