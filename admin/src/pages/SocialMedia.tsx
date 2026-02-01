/**
 * @file SocialMedia.tsx
 * @description 关注交流管理 - 社交媒体和二维码配置
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 2.0.0
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
  Row,
  Col,
  Typography,
  Empty,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UploadOutlined,
  WechatOutlined,
  WeiboOutlined,
  TeamOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import type { UploadProps } from 'antd';
import api from '../services/api';

const { Title, Text } = Typography;

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
  { value: 'wechat_group', label: '微信交流群', icon: <WechatOutlined style={{ color: '#07c160' }} /> },
  { value: 'wechat_official', label: '微信公众号', icon: <WechatOutlined style={{ color: '#07c160' }} /> },
  { value: 'weibo', label: '微博', icon: <WeiboOutlined style={{ color: '#e6162d' }} /> },
  { value: 'douyin', label: '抖音', icon: <span style={{ color: '#000' }}>🎵</span> },
  { value: 'xiaohongshu', label: '小红书', icon: <span style={{ color: '#fe2c55' }}>📕</span> },
  { value: 'bilibili', label: 'B站', icon: <span style={{ color: '#00a1d6' }}>📺</span> },
  { value: 'other', label: '其他', icon: <TeamOutlined /> },
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
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const uploadedUrl = response.data.url;
      const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const serverUrl = apiBaseUrl.replace(/\/api\/?$/, '');
      const fullUrl = uploadedUrl.startsWith('http') ? uploadedUrl : `${serverUrl}${uploadedUrl}`;

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

  const getTypeInfo = (type: string) => {
    return socialMediaTypes.find(t => t.value === type) || { label: type, icon: <TeamOutlined /> };
  };

  const columns = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: SocialMedia) => {
        const typeInfo = getTypeInfo(record.type);
        return (
          <Space>
            {typeInfo.icon}
            <span style={{ fontWeight: 500 }}>{name}</span>
          </Space>
        );
      },
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => {
        const typeInfo = getTypeInfo(type);
        return <Tag>{typeInfo.label}</Tag>;
      },
    },
    {
      title: '二维码',
      dataIndex: 'qrCodeUrl',
      key: 'qrCodeUrl',
      render: (url: string) => url ? <Image src={url} width={50} height={50} style={{ borderRadius: 4 }} /> : <Text type="secondary">-</Text>,
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (desc: string) => desc || <Text type="secondary">-</Text>,
    },
    {
      title: '状态',
      dataIndex: 'visible',
      key: 'visible',
      render: (visible: boolean) => (
        <Tag color={visible ? 'green' : 'default'}>{visible ? '显示' : '隐藏'}</Tag>
      ),
    },
    {
      title: '排序',
      dataIndex: 'order',
      key: 'order',
      width: 80,
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: unknown, record: SocialMedia) => (
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
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}>
          <SettingOutlined style={{ marginRight: 8 }} />
          关注交流管理
        </Title>
        <Text type="secondary">管理社交媒体账号和交流群二维码</Text>
      </div>

      <Row gutter={24}>
        {/* 左侧说明 */}
        <Col span={6}>
          <Card size="small" style={{ position: 'sticky', top: 16 }}>
            <div style={{ marginBottom: 16 }}>
              <Text strong>功能说明</Text>
            </div>
            <div style={{ color: '#666', fontSize: 13, lineHeight: 1.8 }}>
              <p>在这里添加您的社交媒体账号和交流群，用户可以通过扫描二维码关注您。</p>
              <p>支持的类型：</p>
              <ul style={{ paddingLeft: 16, margin: '8px 0' }}>
                {socialMediaTypes.map(t => (
                  <li key={t.value}>
                    <Space size={4}>{t.icon}{t.label}</Space>
                  </li>
                ))}
              </ul>
            </div>
          </Card>
        </Col>

        {/* 右侧列表 */}
        <Col span={18}>
          <Card 
            title="社交媒体列表" 
            extra={
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                添加
              </Button>
            }
          >
            {data.length === 0 && !loading ? (
              <Empty description="暂无社交媒体，点击上方按钮添加" />
            ) : (
              <Table
                columns={columns}
                dataSource={data}
                rowKey="id"
                loading={loading}
                pagination={false}
                size="middle"
              />
            )}
          </Card>
        </Col>
      </Row>

      {/* 编辑弹窗 */}
      <Modal
        title={editingId ? '编辑社交媒体' : '添加社交媒体'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        width={560}
        okText="保存"
        cancelText="取消"
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="name" label="名称" rules={[{ required: true, message: '请输入名称' }]}>
                <Input placeholder="如：交流群、公众号" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="type" label="类型" rules={[{ required: true, message: '请选择类型' }]}>
                <Select 
                  options={socialMediaTypes.map(t => ({ 
                    value: t.value, 
                    label: <Space>{t.icon}{t.label}</Space> 
                  }))} 
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="二维码图片">
            <div style={{ 
              padding: 16, 
              border: '1px dashed #d9d9d9', 
              borderRadius: 8,
              backgroundColor: '#fafafa',
              textAlign: 'center'
            }}>
              {qrCodeUrl ? (
                <div>
                  <Image src={qrCodeUrl} alt="二维码" style={{ maxWidth: 150, maxHeight: 150, marginBottom: 12 }} />
                  <div>
                    <Space>
                      <Upload {...uploadProps}>
                        <Button size="small" icon={<UploadOutlined />}>重新上传</Button>
                      </Upload>
                      <Button size="small" danger icon={<DeleteOutlined />} onClick={() => { setQrCodeUrl(''); form.setFieldValue('qrCodeUrl', ''); }}>
                        清除
                      </Button>
                    </Space>
                  </div>
                </div>
              ) : (
                <Upload {...uploadProps}>
                  <div style={{ cursor: 'pointer' }}>
                    <UploadOutlined style={{ fontSize: 24, color: '#999' }} />
                    <div style={{ marginTop: 8, color: '#666' }}>点击上传二维码</div>
                  </div>
                </Upload>
              )}
            </div>
          </Form.Item>
          <Form.Item name="qrCodeUrl" hidden><Input /></Form.Item>

          <Form.Item name="link" label="链接地址" extra="可选，如果有网页链接">
            <Input placeholder="https://..." />
          </Form.Item>

          <Form.Item name="description" label="描述" extra="显示在二维码下方的提示文字">
            <Input.TextArea rows={2} placeholder="扫码加入交流群" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="order" label="排序">
                <InputNumber style={{ width: '100%' }} placeholder="数字越小越靠前" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="visible" label="显示" valuePropName="checked">
                <Switch checkedChildren="显示" unCheckedChildren="隐藏" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
}
