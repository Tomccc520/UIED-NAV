/**
 * @file SocialMedia.tsx
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
  Upload,
  Image,
  Select,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import type { UploadProps } from 'antd';
import api from '../services/api';

interface SocialMedia {
  id: string;
  name: string;
  type: string;
  qrCodeUrl?: string;
  link?: string;
  description?: string;
  order: number;
  visible: boolean;
}

const socialMediaTypes = [
  { value: 'wechat_group', label: '微信交流群' },
  { value: 'wechat_official', label: '微信公众号' },
  { value: 'weibo', label: '微博' },
  { value: 'douyin', label: '抖音' },
  { value: 'xiaohongshu', label: '小红书' },
  { value: 'bilibili', label: 'B站' },
  { value: 'other', label: '其他' },
];

export default function SocialMedia() {
  const [data, setData] = useState<SocialMedia[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [form] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/social-media');
      setData(res.data);
    } catch (error) {
      message.error('获取数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAdd = () => {
    setEditingId(null);
    setQrCodeUrl('');
    form.resetFields();
    form.setFieldsValue({ order: 0, visible: true, type: 'wechat_group' });
    setModalOpen(true);
  };

  const handleEdit = (record: SocialMedia) => {
    setEditingId(record.id);
    setQrCodeUrl(record.qrCodeUrl || '');
    form.setFieldsValue(record);
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/social-media/${id}`);
      message.success('删除成功');
      fetchData();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingId) {
        await api.put(`/social-media/${editingId}`, values);
        message.success('更新成功');
      } else {
        await api.post('/social-media', values);
        message.success('创建成功');
      }
      setModalOpen(false);
      fetchData();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/upload/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const uploadedUrl = response.data.url;
      // 使用 API 基础地址构建完整 URL
      const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      // 从 API URL 中提取服务器地址（去掉 /api 后缀）
      const serverUrl = apiBaseUrl.replace(/\/api\/?$/, '');
      const fullUrl = uploadedUrl.startsWith('http') 
        ? uploadedUrl 
        : `${serverUrl}${uploadedUrl}`;

      setQrCodeUrl(fullUrl);
      form.setFieldValue('qrCodeUrl', fullUrl);

      message.success('上传成功');
      return false;
    } catch (error) {
      message.error('上传失败');
      return false;
    }
  };

  const uploadProps: UploadProps = {
    beforeUpload: (file) => {
      handleUpload(file);
      return false;
    },
    showUploadList: false,
    accept: 'image/*',
  };

  const columns = [
    { title: '名称', dataIndex: 'name', key: 'name' },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => {
        const typeObj = socialMediaTypes.find((t) => t.value === type);
        return typeObj?.label || type;
      },
    },
    {
      title: '二维码',
      dataIndex: 'qrCodeUrl',
      key: 'qrCodeUrl',
      render: (url: string) =>
        url ? <Image src={url} width={50} height={50} /> : '-',
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '显示',
      dataIndex: 'visible',
      key: 'visible',
      render: (visible: boolean) => (
        <Tag color={visible ? 'green' : 'red'}>
          {visible ? '显示' : '隐藏'}
        </Tag>
      ),
    },
    { title: '排序', dataIndex: 'order', key: 'order' },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: SocialMedia) => (
        <Space>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
          <Popconfirm
            title="确定删除？"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}
      >
        <h2>关注交流设置</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          添加社交媒体
        </Button>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={false}
        />
      </Card>

      <Modal
        title={editingId ? '编辑社交媒体' : '添加社交媒体'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="名称"
            rules={[{ required: true }]}
          >
            <Input placeholder="如：交流群、公众号" />
          </Form.Item>

          <Form.Item
            name="type"
            label="类型"
            rules={[{ required: true }]}
          >
            <Select options={socialMediaTypes} />
          </Form.Item>

          <Form.Item label="二维码图片">
            <Space direction="vertical" style={{ width: '100%' }}>
              {qrCodeUrl && (
                <Image
                  src={qrCodeUrl}
                  alt="二维码"
                  style={{ maxWidth: 150, maxHeight: 150 }}
                />
              )}
              <Space>
                <Upload {...uploadProps}>
                  <Button icon={<UploadOutlined />}>上传二维码</Button>
                </Upload>
                {qrCodeUrl && (
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => {
                      setQrCodeUrl('');
                      form.setFieldValue('qrCodeUrl', '');
                    }}
                  >
                    清除
                  </Button>
                )}
              </Space>
            </Space>
          </Form.Item>

          <Form.Item name="qrCodeUrl" hidden>
            <Input />
          </Form.Item>

          <Form.Item name="link" label="链接地址">
            <Input placeholder="可选，如果有网页链接" />
          </Form.Item>

          <Form.Item name="description" label="描述">
            <Input.TextArea
              rows={2}
              placeholder="显示在二维码下方的提示文字"
            />
          </Form.Item>

          <Space size="large">
            <Form.Item name="order" label="排序">
              <InputNumber style={{ width: 120 }} />
            </Form.Item>
            <Form.Item
              name="visible"
              label="显示"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </Space>
        </Form>
      </Modal>
    </div>
  );
}
