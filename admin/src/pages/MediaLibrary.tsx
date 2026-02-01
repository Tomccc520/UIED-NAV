/**
 * @file pages/MediaLibrary.tsx
 * @description 媒体库管理页面 - Pro 功能
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Card, Button, Upload, Modal, Input, Select, Space, Spin, App,
  Image, Checkbox, Empty, Pagination, Tooltip, Tag, Popconfirm, theme,
  Row, Col, Statistic, Dropdown, Divider
} from 'antd';
import {
  UploadOutlined, DeleteOutlined, FolderOutlined, FolderAddOutlined,
  CopyOutlined, EditOutlined, ReloadOutlined, DownloadOutlined,
  PictureOutlined, VideoCameraOutlined, FileOutlined, MoreOutlined,
  CloudUploadOutlined, EyeOutlined
} from '@ant-design/icons';
import type { UploadProps, MenuProps } from 'antd';
import api from '../services/api';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface MediaItem {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  width?: number;
  height?: number;
  alt?: string;
  folder: string;
  uploadedBy?: string;
  createdAt: string;
}

interface Folder {
  name: string;
  count: number;
}

interface MediaStats {
  totalFiles: number;
  totalSize: number;
  byType: { type: string; count: number }[];
}

const MediaLibrary: React.FC = () => {
  const { token } = theme.useToken();
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [stats, setStats] = useState<MediaStats | null>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 24, total: 0 });
  
  // 筛选条件
  const [currentFolder, setCurrentFolder] = useState<string>('');
  const [searchText, setSearchText] = useState('');
  const [mimeTypeFilter, setMimeTypeFilter] = useState<string>('');
  
  // 弹窗状态
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewItem, setPreviewItem] = useState<MediaItem | null>(null);
  const [editVisible, setEditVisible] = useState(false);
  const [editItem, setEditItem] = useState<MediaItem | null>(null);
  const [editAlt, setEditAlt] = useState('');
  const [editFolder, setEditFolder] = useState('');
  const [newFolderVisible, setNewFolderVisible] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  // 获取媒体列表
  const fetchMedia = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {
        page: pagination.page.toString(),
        pageSize: pagination.pageSize.toString(),
      };
      if (currentFolder) params.folder = currentFolder;
      if (searchText) params.search = searchText;
      if (mimeTypeFilter) params.mimeType = mimeTypeFilter;
      
      const res = await api.get('/media', { params });
      if (res.data.success) {
        setMediaList(res.data.data);
        setPagination(prev => ({ ...prev, total: res.data.pagination.total }));
      }
    } catch (error) {
      message.error('获取媒体列表失败');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.pageSize, currentFolder, searchText, mimeTypeFilter, message]);

  // 获取文件夹列表
  const fetchFolders = async () => {
    try {
      const res = await api.get('/media/folders/list');
      if (res.data.success) {
        setFolders(res.data.data);
      }
    } catch (error) {
      console.error('获取文件夹列表失败:', error);
    }
  };

  // 获取统计信息
  const fetchStats = async () => {
    try {
      const res = await api.get('/media/stats/overview');
      if (res.data.success) {
        setStats(res.data.data);
      }
    } catch (error) {
      console.error('获取统计信息失败:', error);
    }
  };

  useEffect(() => {
    fetchMedia();
    fetchFolders();
    fetchStats();
  }, [fetchMedia]);

  // 上传配置
  const uploadProps: UploadProps = {
    name: 'file',
    action: `${API_BASE}/media/upload`,
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
    data: { folder: currentFolder || 'default' },
    multiple: true,
    showUploadList: false,
    beforeUpload: (file) => {
      const isLt10M = file.size / 1024 / 1024 < 10;
      if (!isLt10M) {
        message.error('文件大小不能超过 10MB');
        return false;
      }
      return true;
    },
    onChange: (info) => {
      if (info.file.status === 'done') {
        message.success(`${info.file.name} 上传成功`);
        fetchMedia();
        fetchFolders();
        fetchStats();
      } else if (info.file.status === 'error') {
        message.error(`${info.file.name} 上传失败`);
      }
    },
  };

  // 删除单个文件
  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/media/${id}`);
      message.success('删除成功');
      fetchMedia();
      fetchFolders();
      fetchStats();
    } catch (error) {
      message.error('删除失败');
    }
  };

  // 批量删除
  const handleBatchDelete = async () => {
    if (selectedItems.length === 0) {
      message.warning('请先选择要删除的文件');
      return;
    }
    try {
      await api.post('/media/batch-delete', { ids: selectedItems });
      message.success(`成功删除 ${selectedItems.length} 个文件`);
      setSelectedItems([]);
      fetchMedia();
      fetchFolders();
      fetchStats();
    } catch (error) {
      message.error('批量删除失败');
    }
  };

  // 复制链接
  const copyUrl = (url: string) => {
    // 构建完整的后端 URL
    const backendBase = API_BASE.replace('/api', '');
    const fullUrl = url.startsWith('http') ? url : `${backendBase}${url}`;
    navigator.clipboard.writeText(fullUrl);
    message.success('链接已复制');
  };

  // 下载文件
  const downloadFile = (item: MediaItem) => {
    const backendBase = API_BASE.replace('/api', '');
    const url = item.url.startsWith('http') ? item.url : `${backendBase}${item.url}`;
    const link = document.createElement('a');
    link.href = url;
    link.download = item.originalName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 更新媒体信息
  const handleUpdate = async () => {
    if (!editItem) return;
    try {
      await api.put(`/media/${editItem.id}`, {
        alt: editAlt,
        folder: editFolder,
      });
      message.success('更新成功');
      setEditVisible(false);
      fetchMedia();
      fetchFolders();
    } catch (error) {
      message.error('更新失败');
    }
  };

  // 创建新文件夹
  const handleCreateFolder = () => {
    if (!newFolderName.trim()) {
      message.warning('请输入文件夹名称');
      return;
    }
    // 文件夹会在上传时自动创建
    setCurrentFolder(newFolderName.trim());
    setNewFolderVisible(false);
    setNewFolderName('');
    message.success('文件夹已创建，上传文件时将自动使用');
  };

  // 格式化文件大小
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1024 / 1024).toFixed(1) + ' MB';
  };

  // 获取文件类型标签颜色
  const getTypeColor = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return 'blue';
    if (mimeType.startsWith('video/')) return 'purple';
    if (mimeType === 'application/pdf') return 'red';
    return 'default';
  };

  // 获取文件类型图标
  const getTypeIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <PictureOutlined />;
    if (mimeType.startsWith('video/')) return <VideoCameraOutlined />;
    return <FileOutlined />;
  };

  // 构建完整的媒体 URL
  const getMediaUrl = (url: string) => {
    const backendBase = API_BASE.replace('/api', '');
    return url.startsWith('http') ? url : `${backendBase}${url}`;
  };

  // 选择/取消选择
  const toggleSelect = (id: string) => {
    setSelectedItems(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  // 全选/取消全选
  const toggleSelectAll = () => {
    if (selectedItems.length === mediaList.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(mediaList.map(m => m.id));
    }
  };

  // 更多操作菜单
  const getMoreMenuItems = (item: MediaItem): MenuProps['items'] => [
    {
      key: 'preview',
      icon: <EyeOutlined />,
      label: '预览',
      onClick: () => {
        setPreviewItem(item);
        setPreviewVisible(true);
      },
    },
    {
      key: 'copy',
      icon: <CopyOutlined />,
      label: '复制链接',
      onClick: () => copyUrl(item.url),
    },
    {
      key: 'download',
      icon: <DownloadOutlined />,
      label: '下载',
      onClick: () => downloadFile(item),
    },
    {
      key: 'edit',
      icon: <EditOutlined />,
      label: '编辑',
      onClick: () => {
        setEditItem(item);
        setEditAlt(item.alt || '');
        setEditFolder(item.folder);
        setEditVisible(true);
      },
    },
    { type: 'divider' },
    {
      key: 'delete',
      icon: <DeleteOutlined />,
      label: '删除',
      danger: true,
      onClick: () => handleDelete(item.id),
    },
  ];

  return (
    <div style={{ padding: token.padding }}>
      {/* 统计信息 */}
      {stats && (
        <Row gutter={16} style={{ marginBottom: token.margin }}>
          <Col span={6}>
            <Card size="small">
              <Statistic 
                title="文件总数" 
                value={stats.totalFiles} 
                prefix={<FileOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic 
                title="总大小" 
                value={formatSize(stats.totalSize)}
                prefix={<CloudUploadOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic 
                title="图片数量" 
                value={stats.byType.find(t => t.type.startsWith('image/'))?.count || 0}
                prefix={<PictureOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic 
                title="文件夹数" 
                value={folders.length}
                prefix={<FolderOutlined />}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* 顶部操作栏 */}
      <Card style={{ marginBottom: token.margin }}>
        <Space wrap style={{ width: '100%', justifyContent: 'space-between' }}>
          <Space wrap>
            <Upload {...uploadProps}>
              <Button type="primary" icon={<UploadOutlined />}>上传文件</Button>
            </Upload>
            
            <Button icon={<FolderAddOutlined />} onClick={() => setNewFolderVisible(true)}>
              新建文件夹
            </Button>
            
            <Divider type="vertical" />
            
            <Select
              style={{ width: 150 }}
              placeholder="选择文件夹"
              allowClear
              value={currentFolder || undefined}
              onChange={setCurrentFolder}
            >
              {folders.map(f => (
                <Select.Option key={f.name} value={f.name}>
                  <FolderOutlined /> {f.name} ({f.count})
                </Select.Option>
              ))}
            </Select>
            
            <Select
              style={{ width: 120 }}
              placeholder="文件类型"
              allowClear
              value={mimeTypeFilter || undefined}
              onChange={setMimeTypeFilter}
            >
              <Select.Option value="image"><PictureOutlined /> 图片</Select.Option>
              <Select.Option value="video"><VideoCameraOutlined /> 视频</Select.Option>
              <Select.Option value="application/pdf"><FileOutlined /> PDF</Select.Option>
            </Select>
            
            <Input.Search
              placeholder="搜索文件名"
              style={{ width: 200 }}
              onSearch={setSearchText}
              allowClear
            />
            
            <Button icon={<ReloadOutlined />} onClick={() => { fetchMedia(); fetchStats(); }}>刷新</Button>
          </Space>
          
          <Space>
            {selectedItems.length > 0 && (
              <>
                <span>已选 {selectedItems.length} 项</span>
                <Popconfirm
                  title="确定删除选中的文件吗？"
                  onConfirm={handleBatchDelete}
                >
                  <Button danger icon={<DeleteOutlined />}>批量删除</Button>
                </Popconfirm>
              </>
            )}
          </Space>
        </Space>
      </Card>

      {/* 媒体网格 */}
      <Card>
        {mediaList.length > 0 && (
          <div style={{ marginBottom: token.margin }}>
            <Checkbox
              checked={selectedItems.length === mediaList.length && mediaList.length > 0}
              indeterminate={selectedItems.length > 0 && selectedItems.length < mediaList.length}
              onChange={toggleSelectAll}
            >
              全选
            </Checkbox>
          </div>
        )}
        
        <Spin spinning={loading}>
          {mediaList.length === 0 ? (
            <Empty description="暂无媒体文件" />
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: token.margin,
            }}>
              {mediaList.map(item => (
                <div
                  key={item.id}
                  style={{
                    border: `1px solid ${selectedItems.includes(item.id) ? token.colorPrimary : token.colorBorder}`,
                    borderRadius: token.borderRadius,
                    overflow: 'hidden',
                    position: 'relative',
                    background: token.colorBgContainer,
                  }}
                >
                  {/* 选择框 */}
                  <Checkbox
                    checked={selectedItems.includes(item.id)}
                    onChange={() => toggleSelect(item.id)}
                    style={{ position: 'absolute', top: 8, left: 8, zIndex: 1 }}
                  />
                  
                  {/* 预览区域 */}
                  <div
                    style={{
                      height: 140,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: token.colorBgLayout,
                      cursor: 'pointer',
                    }}
                    onClick={() => {
                      setPreviewItem(item);
                      setPreviewVisible(true);
                    }}
                  >
                    {item.mimeType.startsWith('image/') ? (
                      <Image
                        src={getMediaUrl(item.url)}
                        alt={item.alt || item.originalName}
                        style={{ maxHeight: 140, maxWidth: '100%', objectFit: 'contain' }}
                        preview={false}
                      />
                    ) : (
                      <div style={{ textAlign: 'center', color: token.colorTextSecondary }}>
                        <div style={{ fontSize: 32 }}>{getTypeIcon(item.mimeType)}</div>
                        <div>{item.mimeType.split('/')[1]?.toUpperCase()}</div>
                      </div>
                    )}
                  </div>
                  
                  {/* 信息区域 */}
                  <div style={{ padding: 8 }}>
                    <Tooltip title={item.originalName}>
                      <div style={{
                        fontSize: 12,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {item.originalName}
                      </div>
                    </Tooltip>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginTop: 4,
                    }}>
                      <Tag color={getTypeColor(item.mimeType)} style={{ margin: 0 }}>
                        {formatSize(item.size)}
                      </Tag>
                      <Dropdown menu={{ items: getMoreMenuItems(item) }} trigger={['click']}>
                        <Button type="text" size="small" icon={<MoreOutlined />} />
                      </Dropdown>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Spin>
        
        {/* 分页 */}
        {pagination.total > pagination.pageSize && (
          <div style={{ marginTop: token.margin, textAlign: 'center' }}>
            <Pagination
              current={pagination.page}
              pageSize={pagination.pageSize}
              total={pagination.total}
              onChange={(page) => setPagination(prev => ({ ...prev, page }))}
              showSizeChanger
              onShowSizeChange={(_, size) => setPagination(prev => ({ ...prev, pageSize: size, page: 1 }))}
            />
          </div>
        )}
      </Card>

      {/* 预览弹窗 */}
      <Modal
        open={previewVisible}
        title={previewItem?.originalName}
        footer={null}
        onCancel={() => setPreviewVisible(false)}
        width={800}
      >
        {previewItem && (
          <div style={{ textAlign: 'center' }}>
            {previewItem.mimeType.startsWith('image/') ? (
              <Image
                src={getMediaUrl(previewItem.url)}
                alt={previewItem.alt || previewItem.originalName}
                style={{ maxWidth: '100%' }}
              />
            ) : previewItem.mimeType.startsWith('video/') ? (
              <video 
                src={getMediaUrl(previewItem.url)} 
                controls 
                style={{ maxWidth: '100%' }} 
              />
            ) : (
              <div>
                <p>无法预览此文件类型</p>
                <Button type="primary" onClick={() => downloadFile(previewItem)}>
                  下载文件
                </Button>
              </div>
            )}
            <Divider />
            <div style={{ textAlign: 'left' }}>
              <Row gutter={[16, 8]}>
                <Col span={12}><strong>文件名：</strong>{previewItem.originalName}</Col>
                <Col span={12}><strong>大小：</strong>{formatSize(previewItem.size)}</Col>
                <Col span={12}><strong>类型：</strong>{previewItem.mimeType}</Col>
                <Col span={12}><strong>文件夹：</strong>{previewItem.folder}</Col>
                <Col span={24}><strong>上传时间：</strong>{new Date(previewItem.createdAt).toLocaleString()}</Col>
              </Row>
              <div style={{ marginTop: 16 }}>
                <Space>
                  <Button icon={<CopyOutlined />} onClick={() => copyUrl(previewItem.url)}>
                    复制链接
                  </Button>
                  <Button icon={<DownloadOutlined />} onClick={() => downloadFile(previewItem)}>
                    下载
                  </Button>
                </Space>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* 编辑弹窗 */}
      <Modal
        open={editVisible}
        title="编辑媒体信息"
        onOk={handleUpdate}
        onCancel={() => setEditVisible(false)}
      >
        <div style={{ marginBottom: 16 }}>
          <label>替代文本 (Alt)</label>
          <Input
            value={editAlt}
            onChange={e => setEditAlt(e.target.value)}
            placeholder="图片描述，用于 SEO 和无障碍访问"
          />
        </div>
        <div>
          <label>文件夹</label>
          <Input
            value={editFolder}
            onChange={e => setEditFolder(e.target.value)}
            placeholder="文件夹名称"
          />
        </div>
      </Modal>

      {/* 新建文件夹弹窗 */}
      <Modal
        open={newFolderVisible}
        title="新建文件夹"
        onOk={handleCreateFolder}
        onCancel={() => { setNewFolderVisible(false); setNewFolderName(''); }}
      >
        <Input
          value={newFolderName}
          onChange={e => setNewFolderName(e.target.value)}
          placeholder="输入文件夹名称"
          onPressEnter={handleCreateFolder}
        />
      </Modal>
    </div>
  );
};

export default MediaLibrary;
