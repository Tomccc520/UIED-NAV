/**
 * @file Submissions.tsx
 * @description 管理后台组件
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

import { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Space,
  Tag,
  message,
  Popconfirm,
  Card,
  Row,
  Col,
  TreeSelect,
  Tooltip,
  Image,
  Badge,
  Tabs,
  Upload,
} from 'antd';
import type { UploadProps } from 'antd';
import {
  CheckOutlined,
  CloseOutlined,
  DeleteOutlined,
  EyeOutlined,
  EditOutlined,
  GlobalOutlined,
  LinkOutlined,
  RobotOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import api, { categoryApi, faviconApiService } from '../services/api';

interface Submission {
  id: string;
  name: string;
  description: string;
  url: string;
  iconUrl?: string;
  categoryId?: string;
  tags?: string;
  submitterName?: string;
  submitterEmail?: string;
  submitterIp?: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectReason?: string;
  reviewedAt?: string;
  createdAt: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  parentId?: string;
  children?: Category[];
}

export default function Submissions() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');
  const [detailModal, setDetailModal] = useState(false);
  const [rejectModal, setRejectModal] = useState(false);
  const [approveModal, setApproveModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [currentSubmission, setCurrentSubmission] = useState<Submission | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [iconUrl, setIconUrl] = useState('');
  const [fetchingIcon, setFetchingIcon] = useState(false);
  const [generatingAi, setGeneratingAi] = useState(false);
  const [form] = Form.useForm();
  const [approveForm] = Form.useForm();
  const [editForm] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [submissionsRes, categoriesRes, countRes] = await Promise.all([
        api.get('/submissions', { params: { status: activeTab === 'all' ? undefined : activeTab } }),
        categoryApi.getAll(),
        api.get('/submissions/pending-count'),
      ]);
      setSubmissions(submissionsRes.data.items || []);
      setCategories(buildCategoryTree(categoriesRes.data));
      setPendingCount(countRes.data.count || 0);
    } catch (error) {
      message.error('获取数据失败');
    } finally {
      setLoading(false);
    }
  };

  const buildCategoryTree = (items: Category[]): Category[] => {
    const map = new Map<string, Category>();
    const roots: Category[] = [];
    items.forEach((item) => map.set(item.id, { ...item, children: [] }));
    items.forEach((item) => {
      const node = map.get(item.id)!;
      if (item.parentId) {
        const parent = map.get(item.parentId);
        if (parent) parent.children!.push(node);
        else roots.push(node);
      } else {
        roots.push(node);
      }
    });
    return roots;
  };

  const convertToTreeSelectData = (items: Category[]): any[] => {
    return items.map((item) => ({
      value: item.id,
      title: item.name,
      label: item.name,
      children: item.children?.length ? convertToTreeSelectData(item.children) : undefined,
    }));
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const handleApprove = async () => {
    if (!currentSubmission) return;
    try {
      const values = await approveForm.validateFields();
      await api.post(`/submissions/${currentSubmission.id}/approve`, {
        categoryId: values.categoryId || currentSubmission.categoryId,
      });
      message.success('审核通过，网站已添加');
      setApproveModal(false);
      fetchData();
    } catch (error: any) {
      message.error(error.response?.data?.error || '操作失败');
    }
  };

  const handleReject = async () => {
    if (!currentSubmission) return;
    try {
      const values = await form.validateFields();
      await api.post(`/submissions/${currentSubmission.id}/reject`, {
        reason: values.reason,
      });
      message.success('已拒绝');
      setRejectModal(false);
      fetchData();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/submissions/${id}`);
      message.success('删除成功');
      fetchData();
    } catch (error) {
      message.error('删除失败');
    }
  };

  // 编辑提交
  const handleEdit = async () => {
    if (!currentSubmission) return;
    try {
      const values = await editForm.validateFields();
      await api.put(`/submissions/${currentSubmission.id}`, {
        ...values,
        iconUrl: iconUrl || currentSubmission.iconUrl,
      });
      message.success('更新成功');
      setEditModal(false);
      fetchData();
    } catch (error: any) {
      message.error(error.response?.data?.error || '更新失败');
    }
  };

  // 自动获取favicon
  const handleFetchFavicon = async () => {
    const url = editForm.getFieldValue('url');
    if (!url) {
      message.warning('请先输入网站URL');
      return;
    }
    setFetchingIcon(true);
    try {
      const res = await faviconApiService.fetchFavicon(url);
      setIconUrl(res.data.faviconUrl);
      message.success(`已获取图标 (来源: ${res.data.source})`);
    } catch (error) {
      message.error('获取图标失败');
    } finally {
      setFetchingIcon(false);
    }
  };

  // AI 生成网站信息
  const handleAiGenerate = async () => {
    const url = editForm.getFieldValue('url');
    if (!url) {
      message.warning('请先输入网站URL');
      return;
    }
    setGeneratingAi(true);
    try {
      const res = await api.post('/ai-config/generate-website-info', { url });
      const { name, description, tags } = res.data;
      if (name) editForm.setFieldValue('name', name);
      if (description) editForm.setFieldValue('description', description);
      if (tags) editForm.setFieldValue('tags', tags);
      message.success('AI 生成成功');
    } catch (error: any) {
      message.error(error.response?.data?.error || 'AI 生成失败');
    } finally {
      setGeneratingAi(false);
    }
  };

  // 上传图标
  const handleUploadIcon = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    try {
      const response = await api.post('/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      // 使用相对路径，让浏览器自动使用当前域名
      const uploadedUrl = response.data.url.startsWith('http') 
        ? response.data.url 
        : `${window.location.origin}${response.data.url}`;
      setIconUrl(uploadedUrl);
      message.success('图标上传成功');
    } catch (error) {
      message.error('上传失败');
    }
    return false;
  };

  const uploadProps: UploadProps = {
    beforeUpload: handleUploadIcon,
    showUploadList: false,
    accept: 'image/*',
  };

  const showApproveModal = (record: Submission) => {
    setCurrentSubmission(record);
    approveForm.setFieldsValue({ categoryId: record.categoryId });
    setApproveModal(true);
  };

  const showRejectModal = (record: Submission) => {
    setCurrentSubmission(record);
    form.resetFields();
    setRejectModal(true);
  };

  const showDetail = (record: Submission) => {
    setCurrentSubmission(record);
    setDetailModal(true);
  };

  const showEditModal = (record: Submission) => {
    setCurrentSubmission(record);
    setIconUrl(record.iconUrl || '');
    editForm.setFieldsValue({
      name: record.name,
      description: record.description,
      url: record.url,
      tags: record.tags,
      categoryId: record.categoryId,
    });
    setEditModal(true);
  };

  const getStatusTag = (status: string) => {
    switch (status) {
      case 'pending':
        return <Tag color="processing">待审核</Tag>;
      case 'approved':
        return <Tag color="success">已通过</Tag>;
      case 'rejected':
        return <Tag color="error">已拒绝</Tag>;
      default:
        return <Tag>{status}</Tag>;
    }
  };

  const columns = [
    {
      title: '网站',
      key: 'website',
      width: 280,
      render: (_: any, record: Submission) => (
        <Space>
          {record.iconUrl ? (
            <img src={record.iconUrl} alt="" style={{ width: 32, height: 32, borderRadius: 4 }} />
          ) : (
            <GlobalOutlined style={{ fontSize: 24, color: '#999' }} />
          )}
          <div>
            <div style={{ fontWeight: 500 }}>{record.name}</div>
            <a href={record.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: '#666' }}>
              {record.url.length > 40 ? record.url.slice(0, 40) + '...' : record.url}
              <LinkOutlined style={{ marginLeft: 4 }} />
            </a>
          </div>
        </Space>
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
      title: '提交者',
      key: 'submitter',
      width: 150,
      render: (_: any, record: Submission) => (
        <div>
          <div>{record.submitterName || '匿名'}</div>
          {record.submitterEmail && (
            <div style={{ fontSize: 12, color: '#666' }}>{record.submitterEmail}</div>
          )}
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => getStatusTag(status),
    },
    {
      title: '提交时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (date: string) => new Date(date).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_: any, record: Submission) => (
        <Space size={4}>
          <Tooltip title="查看详情">
            <Button size="small" type="text" icon={<EyeOutlined />} onClick={() => showDetail(record)} />
          </Tooltip>
          <Tooltip title="编辑">
            <Button size="small" type="text" icon={<EditOutlined />} onClick={() => showEditModal(record)} />
          </Tooltip>
          {record.status === 'pending' && (
            <>
              <Tooltip title="通过">
                <Button size="small" type="text" style={{ color: '#52c41a' }} icon={<CheckOutlined />} onClick={() => showApproveModal(record)} />
              </Tooltip>
              <Tooltip title="拒绝">
                <Button size="small" type="text" danger icon={<CloseOutlined />} onClick={() => showRejectModal(record)} />
              </Tooltip>
            </>
          )}
          <Popconfirm title="确定删除？" onConfirm={() => handleDelete(record.id)}>
            <Tooltip title="删除">
              <Button size="small" type="text" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const tabItems = [
    { key: 'pending', label: <Badge count={pendingCount} offset={[10, 0]}>待审核</Badge> },
    { key: 'approved', label: '已通过' },
    { key: 'rejected', label: '已拒绝' },
    { key: 'all', label: '全部' },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>网站提交审核</h2>
        <p style={{ color: '#666', fontSize: 14, marginTop: 8 }}>审核用户提交的网站，通过后自动添加到网站库</p>
      </div>

      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
        <Table columns={columns} dataSource={submissions} rowKey="id" loading={loading} pagination={{ showSizeChanger: true, showTotal: (total) => `共 ${total} 条` }} />
      </Card>

      {/* 详情弹窗 */}
      <Modal title="提交详情" open={detailModal} onCancel={() => setDetailModal(false)} footer={null} width={600}>
        {currentSubmission && (
          <div>
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <Space align="start">
                  {currentSubmission.iconUrl ? (
                    <Image src={currentSubmission.iconUrl} width={64} height={64} style={{ borderRadius: 8 }} />
                  ) : (
                    <div style={{ width: 64, height: 64, background: '#f0f0f0', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <GlobalOutlined style={{ fontSize: 32, color: '#999' }} />
                    </div>
                  )}
                  <div>
                    <h3 style={{ margin: 0 }}>{currentSubmission.name}</h3>
                    <a href={currentSubmission.url} target="_blank" rel="noopener noreferrer">{currentSubmission.url}</a>
                  </div>
                </Space>
              </Col>
              <Col span={24}>
                <div style={{ background: '#fafafa', padding: 12, borderRadius: 8 }}>
                  <strong>描述：</strong>
                  <p style={{ margin: '8px 0 0' }}>{currentSubmission.description || '无'}</p>
                </div>
              </Col>
              <Col span={12}><strong>标签：</strong> {currentSubmission.tags || '无'}</Col>
              <Col span={12}><strong>状态：</strong> {getStatusTag(currentSubmission.status)}</Col>
              <Col span={12}><strong>提交者：</strong> {currentSubmission.submitterName || '匿名'}</Col>
              <Col span={12}><strong>邮箱：</strong> {currentSubmission.submitterEmail || '无'}</Col>
              <Col span={12}><strong>IP：</strong> {currentSubmission.submitterIp || '未知'}</Col>
              <Col span={12}><strong>提交时间：</strong> {new Date(currentSubmission.createdAt).toLocaleString('zh-CN')}</Col>
              {currentSubmission.rejectReason && (
                <Col span={24}>
                  <div style={{ background: '#fff2f0', padding: 12, borderRadius: 8, border: '1px solid #ffccc7' }}>
                    <strong>拒绝原因：</strong> {currentSubmission.rejectReason}
                  </div>
                </Col>
              )}
            </Row>
          </div>
        )}
      </Modal>

      {/* 编辑弹窗 */}
      <Modal title="编辑提交" open={editModal} onOk={handleEdit} onCancel={() => setEditModal(false)} width={700}>
        <Form form={editForm} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="name" label="网站名称" rules={[{ required: true, message: '请输入网站名称' }]}>
                <Input placeholder="如：Dribbble" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="categoryId" label="所属分类">
                <TreeSelect 
                  placeholder="选择分类" 
                  treeDefaultExpandAll 
                  treeData={convertToTreeSelectData(categories)} 
                  allowClear 
                  showSearch
                  treeNodeFilterProp="label"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="url" label="网站URL" rules={[{ required: true, message: '请输入网站URL' }]}>
            <Input 
              placeholder="https://example.com" 
              suffix={
                <Space>
                  <Tooltip title="AI 生成信息">
                    <Button type="link" size="small" icon={<RobotOutlined />} loading={generatingAi} onClick={handleAiGenerate} style={{ padding: 0 }}>
                      AI生成
                    </Button>
                  </Tooltip>
                </Space>
              }
            />
          </Form.Item>

          <Form.Item label="网站图标">
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 16, border: '1px dashed #d9d9d9', borderRadius: 8, background: '#fafafa' }}>
              {iconUrl ? (
                <Image src={iconUrl} alt="网站图标" style={{ width: 64, height: 64, objectFit: 'contain' }} />
              ) : (
                <div style={{ width: 64, height: 64, background: '#f0f0f0', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <GlobalOutlined style={{ fontSize: 24, color: '#999' }} />
                </div>
              )}
              <div style={{ flex: 1 }}>
                <Space>
                  <Upload {...uploadProps}>
                    <Button size="small" icon={<UploadOutlined />}>上传图标</Button>
                  </Upload>
                  <Button size="small" icon={<GlobalOutlined />} onClick={handleFetchFavicon} loading={fetchingIcon}>
                    自动获取
                  </Button>
                  {iconUrl && <Button size="small" danger onClick={() => setIconUrl('')}>清除</Button>}
                </Space>
              </div>
            </div>
          </Form.Item>

          <Form.Item name="description" label="网站描述">
            <Input.TextArea rows={3} placeholder="简要描述这个网站的功能和特点" />
          </Form.Item>

          <Form.Item name="tags" label="标签" extra="多个标签用逗号分隔">
            <Input placeholder="设计,灵感,UI" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 通过弹窗 */}
      <Modal title="审核通过" open={approveModal} onOk={handleApprove} onCancel={() => setApproveModal(false)}>
        <Form form={approveForm} layout="vertical">
          <Form.Item name="categoryId" label="选择分类" rules={[{ required: true, message: '请选择分类' }]}>
            <TreeSelect 
              placeholder="选择分类" 
              treeDefaultExpandAll 
              treeData={convertToTreeSelectData(categories)} 
              showSearch
              treeNodeFilterProp="label"
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 拒绝弹窗 */}
      <Modal title="拒绝提交" open={rejectModal} onOk={handleReject} onCancel={() => setRejectModal(false)}>
        <Form form={form} layout="vertical">
          <Form.Item name="reason" label="拒绝原因">
            <Input.TextArea rows={3} placeholder="请输入拒绝原因（可选）" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
