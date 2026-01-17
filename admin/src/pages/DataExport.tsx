/**
 * @file DataExport.tsx
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
  Button,
  Table,
  message,
  Spin,
  Tag,
  Select,
  DatePicker,
  Form,
  Popconfirm,
  Tabs,
} from 'antd';
import {
  DownloadOutlined,
  DeleteOutlined,
  FileExcelOutlined,
  FileTextOutlined,
  DatabaseOutlined,
  ReloadOutlined,
  CloudDownloadOutlined,
  SaveOutlined,
  CloudUploadOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import api, { categoryApi } from '../services/api';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

interface ExportFile {
  filename: string;
  type: string;
  format: string;
  size: number;
  createdAt: string;
}

interface Category {
  id: string;
  name: string;
}

export default function DataExport() {
  const [files, setFiles] = useState<ExportFile[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [filesRes, categoriesRes] = await Promise.all([
        api.get('/export/list'),
        categoryApi.getAll(),
      ]);
      setFiles(filesRes.data);
      setCategories(categoriesRes.data);
    } catch (error) {
      console.error('获取数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (type: string, format: string) => {
    setExporting(true);
    try {
      const values = form.getFieldsValue();
      const params: Record<string, string> = {};
      
      if (values.categoryId) params.categoryId = values.categoryId;
      if (values.status) params.status = values.status;
      if (values.dateRange?.[0]) params.startDate = values.dateRange[0].format('YYYY-MM-DD');
      if (values.dateRange?.[1]) params.endDate = values.dateRange[1].format('YYYY-MM-DD');

      const endpoint = `/${type}/${format}`;
      const res = await api.post(`/export${endpoint}`, params);
      
      message.success(`导出成功，共 ${res.data.count} 条数据`);
      fetchData();
    } catch (error) {
      message.error('导出失败');
    } finally {
      setExporting(false);
    }
  };

  const handleBackup = async () => {
    setExporting(true);
    try {
      await api.post('/export/backup');
      message.success('备份创建成功');
      fetchData();
    } catch (error) {
      message.error('备份失败');
    } finally {
      setExporting(false);
    }
  };

  const handleConfigBackup = async () => {
    setExporting(true);
    try {
      const res = await api.post('/export/config/full');
      message.success(`配置备份成功，包含 ${Object.values(res.data.counts).reduce((a: number, b: unknown) => a + (b as number), 0)} 条数据`);
      fetchData();
    } catch (error) {
      message.error('配置备份失败');
    } finally {
      setExporting(false);
    }
  };

  const handleConfigRestore = async (filename: string) => {
    setExporting(true);
    try {
      const res = await api.post(`/export/config/restore/${filename}`);
      const restoredCount = Object.values(res.data.restored).reduce((a: number, b: unknown) => a + (b as number), 0);
      if (res.data.errors?.length > 0) {
        message.warning(`恢复完成，成功 ${restoredCount} 条，有 ${res.data.errors.length} 个错误`);
      } else {
        message.success(`配置恢复成功，共恢复 ${restoredCount} 条数据`);
      }
    } catch (error) {
      message.error('配置恢复失败');
    } finally {
      setExporting(false);
    }
  };

  const handleDownload = async (filename: string) => {
    try {
      // 使用 axios 下载，自动带上 token
      const response = await api.get(`/export/download/${filename}`, {
        responseType: 'blob',
      });
      
      // 创建下载链接
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      message.error('下载失败');
    }
  };

  const handleDelete = async (filename: string) => {
    try {
      await api.delete(`/export/${filename}`);
      message.success('删除成功');
      fetchData();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getTypeTag = (type: string) => {
    const config: Record<string, { color: string; text: string }> = {
      websites: { color: 'blue', text: '网站' },
      categories: { color: 'green', text: '分类' },
      backup: { color: 'purple', text: '数据库备份' },
      settings_backup: { color: 'gold', text: '设置备份' },
      full_backup: { color: 'gold', text: '设置备份' },
    };
    const c = config[type] || { color: 'default', text: type };
    return <Tag color={c.color}>{c.text}</Tag>;
  };

  const getFormatTag = (format: string) => {
    const config: Record<string, { color: string; icon: React.ReactNode }> = {
      csv: { color: 'green', icon: <FileExcelOutlined /> },
      json: { color: 'orange', icon: <FileTextOutlined /> },
      zip: { color: 'purple', icon: <DatabaseOutlined /> },
    };
    const c = config[format] || { color: 'default', icon: null };
    return <Tag color={c.color} icon={c.icon}>{format.toUpperCase()}</Tag>;
  };

  const columns = [
    {
      title: '文件名',
      dataIndex: 'filename',
      key: 'filename',
      render: (name: string) => <Text code>{name}</Text>,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: string) => getTypeTag(type),
    },
    {
      title: '格式',
      dataIndex: 'format',
      key: 'format',
      width: 100,
      render: (format: string) => getFormatTag(format),
    },
    {
      title: '大小',
      dataIndex: 'size',
      key: 'size',
      width: 100,
      render: (size: number) => formatFileSize(size),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (date: string) => new Date(date).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: unknown, record: ExportFile) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<DownloadOutlined />}
            onClick={() => handleDownload(record.filename)}
          >
            下载
          </Button>
          {(record.type === 'full_backup' || record.type === 'settings_backup') && (
            <Popconfirm
              title="确定从此备份恢复？"
              description="这将覆盖当前所有配置数据！"
              onConfirm={() => handleConfigRestore(record.filename)}
              okText="确定恢复"
              cancelText="取消"
              okButtonProps={{ danger: true }}
            >
              <Button type="link" size="small" icon={<CloudUploadOutlined />}>
                恢复
              </Button>
            </Popconfirm>
          )}
          <Popconfirm
            title="确定删除此文件？"
            onConfirm={() => handleDelete(record.filename)}
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      {/* 页面标题 */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>
            <CloudDownloadOutlined style={{ marginRight: 8 }} />
            数据导出与备份
          </Title>
          <Text type="secondary">导出网站和分类数据，创建数据库备份</Text>
        </div>
        <Button icon={<ReloadOutlined />} onClick={fetchData}>
          刷新
        </Button>
      </div>

      <Tabs
        items={[
          {
            key: 'export',
            label: '数据导出',
            children: (
              <Row gutter={[16, 16]}>
                {/* 筛选条件 */}
                <Col span={24}>
                  <Card title="筛选条件" size="small">
                    <Form form={form} layout="inline">
                      <Form.Item name="categoryId" label="分类">
                        <Select
                          allowClear
                          placeholder="全部分类"
                          style={{ width: 150 }}
                          options={categories.map(c => ({ label: c.name, value: c.id }))}
                        />
                      </Form.Item>
                      <Form.Item name="status" label="状态">
                        <Select
                          allowClear
                          placeholder="全部状态"
                          style={{ width: 120 }}
                          options={[
                            { label: '正常', value: 'active' },
                            { label: '失效', value: 'failed' },
                            { label: '未检测', value: 'unchecked' },
                          ]}
                        />
                      </Form.Item>
                      <Form.Item name="dateRange" label="时间范围">
                        <RangePicker />
                      </Form.Item>
                    </Form>
                  </Card>
                </Col>

                {/* 导出按钮 */}
                <Col xs={24} md={12}>
                  <Card
                    title={<><FileExcelOutlined style={{ color: '#52c41a' }} /> 网站数据</>}
                    size="small"
                  >
                    <Space>
                      <Button
                        icon={<DownloadOutlined />}
                        onClick={() => handleExport('websites', 'csv')}
                        loading={exporting}
                      >
                        导出 CSV
                      </Button>
                      <Button
                        icon={<DownloadOutlined />}
                        onClick={() => handleExport('websites', 'json')}
                        loading={exporting}
                      >
                        导出 JSON
                      </Button>
                    </Space>
                  </Card>
                </Col>

                <Col xs={24} md={12}>
                  <Card
                    title={<><FileTextOutlined style={{ color: '#1890ff' }} /> 分类数据</>}
                    size="small"
                  >
                    <Space>
                      <Button
                        icon={<DownloadOutlined />}
                        onClick={() => handleExport('categories', 'csv')}
                        loading={exporting}
                      >
                        导出 CSV
                      </Button>
                      <Button
                        icon={<DownloadOutlined />}
                        onClick={() => handleExport('categories', 'json')}
                        loading={exporting}
                      >
                        导出 JSON
                      </Button>
                    </Space>
                  </Card>
                </Col>
              </Row>
            ),
          },
          {
            key: 'backup',
            label: '数据库备份',
            children: (
              <Card>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Text>创建完整的数据库备份文件（SQLite），可用于数据恢复。</Text>
                  <Button
                    type="primary"
                    icon={<SaveOutlined />}
                    onClick={handleBackup}
                    loading={exporting}
                    size="large"
                  >
                    创建备份
                  </Button>
                </Space>
              </Card>
            ),
          },
          {
            key: 'config',
            label: (
              <span>
                <SettingOutlined /> 设置备份与恢复
              </span>
            ),
            children: (
              <Row gutter={[16, 16]}>
                <Col span={24}>
                  <Card title="后台设置备份" size="small">
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <Text>
                        导出后台设置配置（页面、Banner、热门推荐、导航菜单、页脚链接、社交媒体、站点信息、AI配置、WordPress配置等），
                        生成 JSON 文件，可用于设置恢复。
                      </Text>
                      <Text type="secondary">
                        <strong>注意：</strong>此备份不包含分类和网站数据，这些数据请通过数据库备份管理。
                      </Text>
                      <Button
                        type="primary"
                        icon={<SaveOutlined />}
                        onClick={handleConfigBackup}
                        loading={exporting}
                        size="large"
                      >
                        创建设置备份
                      </Button>
                    </Space>
                  </Card>
                </Col>
                <Col span={24}>
                  <Card title="恢复说明" size="small">
                    <Space direction="vertical">
                      <Text>1. 在下方"导出文件列表"中找到类型为"设置备份"的备份文件</Text>
                      <Text>2. 点击"恢复"按钮，确认后将从备份恢复后台设置</Text>
                      <Text type="warning">⚠️ 恢复操作会覆盖当前后台设置，请谨慎操作！</Text>
                      <Text type="secondary">💡 分类和网站数据不会被恢复，请使用数据库备份功能</Text>
                    </Space>
                  </Card>
                </Col>
              </Row>
            ),
          },
        ]}
      />

      {/* 文件列表 */}
      <Card title="导出文件列表" size="small" style={{ marginTop: 16 }}>
        <Table
          columns={columns}
          dataSource={files}
          rowKey="filename"
          pagination={{ pageSize: 10 }}
          size="small"
          locale={{ emptyText: '暂无导出文件' }}
        />
      </Card>
    </div>
  );
}
