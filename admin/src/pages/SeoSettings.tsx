/**
 * @file SeoSettings.tsx
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
  Statistic,
  message,
  Spin,
  Tag,
  Descriptions,
  Modal,
  Input,
} from 'antd';
import {
  FileTextOutlined,
  RobotOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  CopyOutlined,
  EyeOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import api from '../services/api';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

interface SeoStatus {
  sitemap: {
    exists: boolean;
    size?: number;
    modifiedAt?: string;
    urlCount?: number;
  };
  robots: {
    exists: boolean;
    size?: number;
    modifiedAt?: string;
  };
  baseUrl: string;
}

export default function SeoSettings() {
  const [status, setStatus] = useState<SeoStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewContent, setPreviewContent] = useState('');
  const [previewType, setPreviewType] = useState<'sitemap' | 'robots'>('sitemap');

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await api.get('/seo/status');
      setStatus(res.data);
    } catch (error) {
      console.error('获取 SEO 状态失败:', error);
      message.error('获取 SEO 状态失败');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSitemap = async () => {
    setGenerating(true);
    try {
      const res = await api.post('/seo/generate-sitemap');
      message.success(`Sitemap 生成成功，包含 ${res.data.urlCount} 个 URL`);
      fetchStatus();
    } catch (error) {
      message.error('生成 Sitemap 失败');
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateRobots = async () => {
    setGenerating(true);
    try {
      await api.post('/seo/generate-robots');
      message.success('robots.txt 生成成功');
      fetchStatus();
    } catch (error) {
      message.error('生成 robots.txt 失败');
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateAll = async () => {
    setGenerating(true);
    try {
      const res = await api.post('/seo/generate-all');
      message.success(`SEO 文件生成成功，Sitemap 包含 ${res.data.sitemap.urlCount} 个 URL`);
      fetchStatus();
    } catch (error) {
      message.error('生成 SEO 文件失败');
    } finally {
      setGenerating(false);
    }
  };

  const handlePreview = async (type: 'sitemap' | 'robots') => {
    try {
      const endpoint = type === 'sitemap' ? '/seo/sitemap-preview' : '/seo/robots-preview';
      const res = await api.get(endpoint, { responseType: 'text' });
      setPreviewContent(res.data);
      setPreviewType(type);
      setPreviewVisible(true);
    } catch (error) {
      message.error(`预览 ${type === 'sitemap' ? 'Sitemap' : 'robots.txt'} 失败`);
    }
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    message.success('链接已复制');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('zh-CN');
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <Spin size="large" />
      </div>
    );
  }

  const sitemapUrl = `${status?.baseUrl}/sitemap.xml`;
  const robotsUrl = `${status?.baseUrl}/robots.txt`;

  return (
    <div>
      {/* 页面标题 */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>
            <FileTextOutlined style={{ marginRight: 8 }} />
            SEO 管理
          </Title>
          <Text type="secondary">管理 Sitemap 和 robots.txt，提升搜索引擎收录</Text>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchStatus}>
            刷新
          </Button>
          <Button
            type="primary"
            icon={<SyncOutlined spin={generating} />}
            onClick={handleGenerateAll}
            loading={generating}
          >
            生成全部
          </Button>
        </Space>
      </div>

      {/* 基础信息 */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Descriptions column={2}>
          <Descriptions.Item label="网站地址">
            <Text copyable>{status?.baseUrl}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="说明">
            <Text type="secondary">生成的文件将自动部署到网站根目录</Text>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Row gutter={[16, 16]}>
        {/* Sitemap 卡片 */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <FileTextOutlined style={{ color: '#1890ff' }} />
                <span>Sitemap</span>
                {status?.sitemap.exists ? (
                  <Tag color="success" icon={<CheckCircleOutlined />}>已生成</Tag>
                ) : (
                  <Tag color="warning" icon={<CloseCircleOutlined />}>未生成</Tag>
                )}
              </Space>
            }
            extra={
              <Space>
                {status?.sitemap.exists && (
                  <Button
                    type="link"
                    size="small"
                    icon={<EyeOutlined />}
                    onClick={() => handlePreview('sitemap')}
                  >
                    预览
                  </Button>
                )}
                <Button
                  type="primary"
                  size="small"
                  onClick={handleGenerateSitemap}
                  loading={generating}
                >
                  生成
                </Button>
              </Space>
            }
          >
            {status?.sitemap.exists ? (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Row gutter={16}>
                  <Col span={8}>
                    <Statistic
                      title="URL 数量"
                      value={status.sitemap.urlCount || 0}
                      valueStyle={{ color: '#1890ff' }}
                    />
                  </Col>
                  <Col span={8}>
                    <Statistic
                      title="文件大小"
                      value={formatFileSize(status.sitemap.size || 0)}
                    />
                  </Col>
                  <Col span={8}>
                    <Statistic
                      title="更新时间"
                      value={status.sitemap.modifiedAt ? formatDate(status.sitemap.modifiedAt) : '-'}
                      valueStyle={{ fontSize: 14 }}
                    />
                  </Col>
                </Row>
                <div style={{ marginTop: 16 }}>
                  <Text type="secondary">访问地址：</Text>
                  <Space>
                    <a href={sitemapUrl} target="_blank" rel="noopener noreferrer">
                      {sitemapUrl}
                    </a>
                    <Button
                      type="text"
                      size="small"
                      icon={<CopyOutlined />}
                      onClick={() => handleCopyUrl(sitemapUrl)}
                    />
                  </Space>
                </div>
              </Space>
            ) : (
              <div style={{ textAlign: 'center', padding: 20 }}>
                <Text type="secondary">尚未生成 Sitemap，点击"生成"按钮创建</Text>
              </div>
            )}
          </Card>
        </Col>

        {/* robots.txt 卡片 */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <RobotOutlined style={{ color: '#52c41a' }} />
                <span>robots.txt</span>
                {status?.robots.exists ? (
                  <Tag color="success" icon={<CheckCircleOutlined />}>已生成</Tag>
                ) : (
                  <Tag color="warning" icon={<CloseCircleOutlined />}>未生成</Tag>
                )}
              </Space>
            }
            extra={
              <Space>
                {status?.robots.exists && (
                  <Button
                    type="link"
                    size="small"
                    icon={<EyeOutlined />}
                    onClick={() => handlePreview('robots')}
                  >
                    预览
                  </Button>
                )}
                <Button
                  type="primary"
                  size="small"
                  onClick={handleGenerateRobots}
                  loading={generating}
                >
                  生成
                </Button>
              </Space>
            }
          >
            {status?.robots.exists ? (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Row gutter={16}>
                  <Col span={12}>
                    <Statistic
                      title="文件大小"
                      value={formatFileSize(status.robots.size || 0)}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title="更新时间"
                      value={status.robots.modifiedAt ? formatDate(status.robots.modifiedAt) : '-'}
                      valueStyle={{ fontSize: 14 }}
                    />
                  </Col>
                </Row>
                <div style={{ marginTop: 16 }}>
                  <Text type="secondary">访问地址：</Text>
                  <Space>
                    <a href={robotsUrl} target="_blank" rel="noopener noreferrer">
                      {robotsUrl}
                    </a>
                    <Button
                      type="text"
                      size="small"
                      icon={<CopyOutlined />}
                      onClick={() => handleCopyUrl(robotsUrl)}
                    />
                  </Space>
                </div>
              </Space>
            ) : (
              <div style={{ textAlign: 'center', padding: 20 }}>
                <Text type="secondary">尚未生成 robots.txt，点击"生成"按钮创建</Text>
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* 使用说明 */}
      <Card title="使用说明" size="small" style={{ marginTop: 16 }}>
        <Paragraph>
          <ol>
            <li>
              <Text strong>Sitemap：</Text>
              <Text>包含网站所有页面的 URL 列表，帮助搜索引擎更好地发现和索引您的网站内容。</Text>
            </li>
            <li>
              <Text strong>robots.txt：</Text>
              <Text>告诉搜索引擎爬虫哪些页面可以抓取，哪些页面应该忽略。</Text>
            </li>
            <li>
              <Text strong>提交到搜索引擎：</Text>
              <Text>
                生成后，建议将 Sitemap 提交到{' '}
                <a href="https://search.google.com/search-console" target="_blank" rel="noopener noreferrer">
                  Google Search Console
                </a>
                {' '}和{' '}
                <a href="https://ziyuan.baidu.com/" target="_blank" rel="noopener noreferrer">
                  百度站长平台
                </a>
                。
              </Text>
            </li>
            <li>
              <Text strong>定期更新：</Text>
              <Text>当网站内容有较大变化时，建议重新生成 Sitemap。</Text>
            </li>
          </ol>
        </Paragraph>
      </Card>

      {/* 预览弹窗 */}
      <Modal
        title={previewType === 'sitemap' ? 'Sitemap 预览' : 'robots.txt 预览'}
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        footer={[
          <Button key="copy" icon={<CopyOutlined />} onClick={() => {
            navigator.clipboard.writeText(previewContent);
            message.success('内容已复制');
          }}>
            复制
          </Button>,
          <Button key="close" onClick={() => setPreviewVisible(false)}>
            关闭
          </Button>,
        ]}
        width={800}
      >
        <TextArea
          value={previewContent}
          readOnly
          autoSize={{ minRows: 10, maxRows: 20 }}
          style={{ fontFamily: 'monospace', fontSize: 12 }}
        />
      </Modal>
    </div>
  );
}
