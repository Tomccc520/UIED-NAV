/**
 * @file pages/Comments.tsx
 * @description 评论管理页面（Pro 功能）
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

// @pro-feature-start: comments
import React, { useState, useEffect, useCallback } from 'react';
import {
  Table,
  Button,
  Modal,
  Space,
  Tag,
  Popconfirm,
  Card,
  Row,
  Col,
  Select,
  Tabs,
  Typography,
  theme,
  App,
} from 'antd';
import {
  CheckOutlined,
  CloseOutlined,
  DeleteOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const { Text, Paragraph } = Typography;

interface Comment {
  id: number;
  text: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  user?: {
    id: number;
    username: string;
    email: string;
  };
  website?: {
    id: number;
    title: string;
  };
  article?: {
    id: number;
    title: string;
    slug: string;
  };
}

type CommentType = 'website' | 'article';

const Comments: React.FC = () => {
  const { message } = App.useApp();
  const { token: themeToken } = theme.useToken();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [commentType, setCommentType] = useState<CommentType>('website');
  const [filterStatus, setFilterStatus] = useState<string | undefined>(undefined);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });
  const [previewComment, setPreviewComment] = useState<Comment | null>(null);

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  });

  // 获取评论列表
  const fetchComments = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = {
        type: commentType,
        page: pagination.current,
        limit: pagination.pageSize,
      };
      if (filterStatus) params.status = filterStatus;

      const res = await axios.get(`${API_BASE}/admin/comments`, {
        params,
        headers: getAuthHeaders(),
      });

      if (res.data.success) {
        setComments(res.data.data);
        setPagination(prev => ({
          ...prev,
          total: res.data.pagination?.total || res.data.data.length,
        }));
      }
    } catch (error) {
      message.error('获取评论列表失败');
    } finally {
      setLoading(false);
    }
  }, [commentType, filterStatus, pagination.current, pagination.pageSize, message]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  // 审核评论
  const handleApprove = async (id: number) => {
    try {
      await axios.put(
        `${API_BASE}/admin/comments/${id}/approve`,
        { type: commentType },
        { headers: getAuthHeaders() }
      );
      message.success('评论已批准');
      fetchComments();
    } catch (error) {
      message.error('操作失败');
    }
  };

  // 拒绝评论
  const handleReject = async (id: number) => {
    try {
      await axios.put(
        `${API_BASE}/admin/comments/${id}/reject`,
        { type: commentType },
        { headers: getAuthHeaders() }
      );
      message.success('评论已拒绝');
      fetchComments();
    } catch (error) {
      message.error('操作失败');
    }
  };

  // 删除评论
  const handleDelete = async (id: number) => {
    try {
      await axios.delete(`${API_BASE}/admin/comments/${id}`, {
        params: { type: commentType },
        headers: getAuthHeaders(),
      });
      message.success('评论已删除');
      fetchComments();
    } catch (error) {
      message.error('删除失败');
    }
  };

  // 批量审核
  const handleBatchApprove = async (ids: number[]) => {
    try {
      await Promise.all(
        ids.map(id =>
          axios.put(
            `${API_BASE}/admin/comments/${id}/approve`,
            { type: commentType },
            { headers: getAuthHeaders() }
          )
        )
      );
      message.success(`已批准 ${ids.length} 条评论`);
      fetchComments();
    } catch (error) {
      message.error('批量操作失败');
    }
  };

  // 状态标签颜色
  const getStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      pending: { color: 'orange', text: '待审核' },
      approved: { color: 'green', text: '已批准' },
      rejected: { color: 'red', text: '已拒绝' },
    };
    const { color, text } = statusMap[status] || { color: 'default', text: status };
    return <Tag color={color}>{text}</Tag>;
  };

  // 表格列配置
  const columns: ColumnsType<Comment> = [
    {
      title: '评论内容',
      dataIndex: 'text',
      key: 'text',
      width: 300,
      ellipsis: true,
      render: (text: string, record) => (
        <div>
          <Paragraph
            ellipsis={{ rows: 2 }}
            style={{ marginBottom: 4, cursor: 'pointer' }}
            onClick={() => setPreviewComment(record)}
          >
            {text}
          </Paragraph>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {commentType === 'website' && record.website && (
              <>网站: {record.website.title}</>
            )}
            {commentType === 'article' && record.article && (
              <>文章: {record.article.title}</>
            )}
          </Text>
        </div>
      ),
    },
    {
      title: '用户',
      dataIndex: 'user',
      key: 'user',
      width: 150,
      render: (user: Comment['user']) => (
        <div>
          <div>{user?.username || '匿名用户'}</div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {user?.email || '-'}
          </Text>
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
      title: '评论时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (date: string) => new Date(date).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => setPreviewComment(record)}
          />
          {record.status !== 'approved' && (
            <Button
              type="text"
              icon={<CheckOutlined />}
              style={{ color: '#52c41a' }}
              onClick={() => handleApprove(record.id)}
            />
          )}
          {record.status !== 'rejected' && (
            <Button
              type="text"
              icon={<CloseOutlined />}
              style={{ color: '#faad14' }}
              onClick={() => handleReject(record.id)}
            />
          )}
          <Popconfirm
            title="确定删除这条评论吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 选中行
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: React.Key[]) => setSelectedRowKeys(keys),
  };

  return (
    <div style={{ padding: themeToken.padding }}>
      <Card>
        <Tabs
          activeKey={commentType}
          onChange={key => {
            setCommentType(key as CommentType);
            setPagination(prev => ({ ...prev, current: 1 }));
            setSelectedRowKeys([]);
          }}
          items={[
            { key: 'website', label: '网站评论' },
            { key: 'article', label: '文章评论' },
          ]}
        />

        <Row gutter={16} style={{ marginBottom: 16 }} align="middle">
          <Col flex="auto">
            <Space>
              <Select
                placeholder="状态筛选"
                value={filterStatus}
                onChange={value => {
                  setFilterStatus(value);
                  setPagination(prev => ({ ...prev, current: 1 }));
                }}
                style={{ width: 120 }}
                allowClear
              >
                <Select.Option value="pending">待审核</Select.Option>
                <Select.Option value="approved">已批准</Select.Option>
                <Select.Option value="rejected">已拒绝</Select.Option>
              </Select>
              {selectedRowKeys.length > 0 && (
                <Button
                  type="primary"
                  icon={<CheckOutlined />}
                  onClick={() => handleBatchApprove(selectedRowKeys as number[])}
                >
                  批量批准 ({selectedRowKeys.length})
                </Button>
              )}
            </Space>
          </Col>
          <Col>
            <Text type="secondary">
              共 {pagination.total} 条评论
            </Text>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={comments}
          loading={loading}
          rowKey="id"
          rowSelection={rowSelection}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            onChange: (page, pageSize) => {
              setPagination(prev => ({ ...prev, current: page, pageSize }));
            },
          }}
          scroll={{ x: 900 }}
        />
      </Card>

      {/* 评论预览弹窗 */}
      <Modal
        title="评论详情"
        open={!!previewComment}
        onCancel={() => setPreviewComment(null)}
        footer={
          previewComment && (
            <Space>
              {previewComment.status !== 'approved' && (
                <Button
                  type="primary"
                  icon={<CheckOutlined />}
                  onClick={() => {
                    handleApprove(previewComment.id);
                    setPreviewComment(null);
                  }}
                >
                  批准
                </Button>
              )}
              {previewComment.status !== 'rejected' && (
                <Button
                  icon={<CloseOutlined />}
                  onClick={() => {
                    handleReject(previewComment.id);
                    setPreviewComment(null);
                  }}
                >
                  拒绝
                </Button>
              )}
              <Button onClick={() => setPreviewComment(null)}>关闭</Button>
            </Space>
          )
        }
        width={600}
      >
        {previewComment && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <Text strong>评论内容：</Text>
              <Paragraph style={{ marginTop: 8, whiteSpace: 'pre-wrap' }}>
                {previewComment.text}
              </Paragraph>
            </div>
            <Row gutter={16}>
              <Col span={12}>
                <Text strong>用户：</Text>
                <div>{previewComment.user?.username || '匿名用户'}</div>
                <Text type="secondary">{previewComment.user?.email || '-'}</Text>
              </Col>
              <Col span={12}>
                <Text strong>状态：</Text>
                <div>{getStatusTag(previewComment.status)}</div>
              </Col>
            </Row>
            <div style={{ marginTop: 16 }}>
              <Text strong>
                {commentType === 'website' ? '评论网站：' : '评论文章：'}
              </Text>
              <div>
                {commentType === 'website'
                  ? previewComment.website?.title
                  : previewComment.article?.title}
              </div>
            </div>
            <div style={{ marginTop: 16 }}>
              <Text strong>评论时间：</Text>
              <div>{new Date(previewComment.createdAt).toLocaleString('zh-CN')}</div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Comments;
// @pro-feature-end: comments
