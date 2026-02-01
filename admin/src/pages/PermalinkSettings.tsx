/**
 * @file PermalinkSettings.tsx
 * @description 固定链接设置页面 - 类似 WordPress 的固定链接配置
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

import { useEffect, useState } from 'react';
import { Form, Radio, Button, Card, message, Space, Typography, Input, Alert, Tag, Modal, Statistic, Row, Col } from 'antd';
import { SaveOutlined, InfoCircleOutlined, ThunderboltOutlined } from '@ant-design/icons';
import api from '../services/api';
import { showErrorModal } from '../utils/errorHelper';

const { Title, Text, Paragraph } = Typography;

// 固定链接结构类型
type PermalinkStructure = 'plain' | 'id' | 'name' | 'custom';

interface PermalinkConfig {
  structure: PermalinkStructure;
  customPattern?: string;
}

// 示例数据
const exampleWebsite = {
  id: 'cmk13m4gx007t',
  slug: 'dribbble',
  name: 'Dribbble',
};

export default function PermalinkSettings() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [structure, setStructure] = useState<PermalinkStructure>('plain');
  const [customPattern, setCustomPattern] = useState('');
  
  // 批量生成相关状态
  const [slugStats, setSlugStats] = useState({ total: 0, withSlug: 0, withoutSlug: 0 });
  const [generating, setGenerating] = useState(false);
  const [generateModalVisible, setGenerateModalVisible] = useState(false);

  useEffect(() => {
    fetchSettings();
    fetchSlugStats();
  }, []);

  const fetchSlugStats = async () => {
    try {
      const res = await api.get('/websites/slug-stats');
      if (res.data.success) {
        setSlugStats(res.data.data);
      }
    } catch (error) {
      console.error('获取 slug 统计失败:', error);
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await api.get('/admin/settings/permalink');
      const data = response.data.data || {};
      setStructure(data.structure || 'plain');
      setCustomPattern(data.customPattern || '');
      form.setFieldsValue({
        structure: data.structure || 'plain',
        customPattern: data.customPattern || '',
      });
    } catch (error) {
      // 如果没有设置，使用默认值
      form.setFieldsValue({
        structure: 'plain',
        customPattern: '',
      });
    } finally {
      setFetching(false);
    }
  };

  // 生成预览 URL
  const getPreviewUrl = (struct: PermalinkStructure, pattern?: string): string => {
    const baseUrl = 'https://hao.uied.cn';
    switch (struct) {
      case 'plain':
        return `${baseUrl}/website/${exampleWebsite.id}`;
      case 'id':
        return `${baseUrl}/website/${exampleWebsite.id}.html`;
      case 'name':
        return `${baseUrl}/website/${exampleWebsite.slug}`;
      case 'custom':
        if (pattern) {
          return `${baseUrl}/website/${pattern
            .replace('%id%', exampleWebsite.id)
            .replace('%slug%', exampleWebsite.slug)
            .replace('%name%', exampleWebsite.slug)}`;
        }
        return `${baseUrl}/website/${exampleWebsite.id}`;
      default:
        return `${baseUrl}/website/${exampleWebsite.id}`;
    }
  };

  const handleSubmit = async (values: PermalinkConfig) => {
    setLoading(true);
    try {
      await api.put('/admin/settings/permalink', values);
      message.success('固定链接设置已保存');
    } catch (error: any) {
      console.error('保存失败:', error);
      showErrorModal(error, '保存固定链接设置失败');
    } finally {
      setLoading(false);
    }
  };

  // 批量生成固定链接
  const handleBatchGenerate = async (dryRun: boolean = false) => {
    setGenerating(true);
    try {
      const res = await api.post('/websites/batch-generate-slugs', { dryRun });
      if (res.data.success) {
        message.success(res.data.message);
        fetchSlugStats(); // 刷新统计
      }
    } catch (error: any) {
      console.error('批量生成失败:', error);
      showErrorModal(error, '批量生成固定链接失败');
    } finally {
      setGenerating(false);
      setGenerateModalVisible(false);
    }
  };

  if (fetching) {
    return <div>加载中...</div>;
  }

  return (
    <div>
      <Title level={4} style={{ marginBottom: 8 }}>
        固定链接设置
      </Title>
      <Paragraph type="secondary" style={{ marginBottom: 24 }}>
        自定义网站详情页的 URL 结构，优化 SEO 和用户体验
      </Paragraph>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        autoComplete="off"
      >
        <Card title="URL 结构" style={{ marginBottom: 16 }}>
          <Alert
            message="固定链接设置"
            description="选择网站详情页的 URL 格式。使用固定链接（slug）可以让 URL 更简洁、更利于 SEO。"
            type="info"
            showIcon
            icon={<InfoCircleOutlined />}
            style={{ marginBottom: 24 }}
          />

          <Form.Item name="structure">
            <Radio.Group 
              onChange={(e) => setStructure(e.target.value)}
              style={{ width: '100%' }}
            >
              <Space direction="vertical" style={{ width: '100%' }}>
                <Radio value="plain" style={{ width: '100%', padding: '12px 0' }}>
                  <div>
                    <Text strong>朴素</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 13 }}>
                      {getPreviewUrl('plain')}
                    </Text>
                  </div>
                </Radio>

                <Radio value="id" style={{ width: '100%', padding: '12px 0' }}>
                  <div>
                    <Text strong>ID + .html</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 13 }}>
                      {getPreviewUrl('id')}
                    </Text>
                  </div>
                </Radio>

                <Radio value="name" style={{ width: '100%', padding: '12px 0' }}>
                  <div>
                    <Text strong>网站名称（推荐）</Text>
                    <Tag color="green" style={{ marginLeft: 8 }}>SEO 友好</Tag>
                    <br />
                    <Text type="secondary" style={{ fontSize: 13 }}>
                      {getPreviewUrl('name')}
                    </Text>
                    <br />
                    <Text type="warning" style={{ fontSize: 12 }}>
                      需要为每个网站设置固定链接（slug）
                    </Text>
                  </div>
                </Radio>

                <Radio value="custom" style={{ width: '100%', padding: '12px 0' }}>
                  <div>
                    <Text strong>自定义结构</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 13 }}>
                      {getPreviewUrl('custom', customPattern)}
                    </Text>
                  </div>
                </Radio>
              </Space>
            </Radio.Group>
          </Form.Item>

          {structure === 'custom' && (
            <Form.Item 
              name="customPattern" 
              label="自定义格式"
              extra={
                <div style={{ marginTop: 8 }}>
                  <Text type="secondary">可用标签：</Text>
                  <Space style={{ marginTop: 4 }}>
                    <Tag>%id%</Tag>
                    <Tag>%slug%</Tag>
                    <Tag>%name%</Tag>
                  </Space>
                </div>
              }
            >
              <Input 
                placeholder="%slug%.html" 
                onChange={(e) => setCustomPattern(e.target.value)}
                addonBefore="/website/"
              />
            </Form.Item>
          )}

          <div style={{ 
            padding: 16, 
            background: '#f5f5f5', 
            borderRadius: 8,
            marginTop: 16 
          }}>
            <Text strong>预览：</Text>
            <br />
            <Text code style={{ fontSize: 14 }}>
              {getPreviewUrl(structure, customPattern)}
            </Text>
          </div>
        </Card>

        <Card title="说明" style={{ marginBottom: 16 }}>
          <Paragraph>
            <Text strong>关于固定链接（Slug）：</Text>
          </Paragraph>
          <ul style={{ paddingLeft: 20, color: '#666' }}>
            <li>固定链接是网站的唯一标识符，用于生成 SEO 友好的 URL</li>
            <li>建议使用英文小写字母、数字和连字符（如：dribbble、figma-design）</li>
            <li>如果网站没有设置固定链接，将自动使用 ID</li>
            <li>可以在「网站管理」→「编辑网站」→「基本信息」中设置每个网站的固定链接</li>
          </ul>
        </Card>

        {/* 批量生成固定链接 */}
        <Card title="批量生成固定链接" style={{ marginBottom: 16 }}>
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={8}>
              <Statistic title="网站总数" value={slugStats.total} />
            </Col>
            <Col span={8}>
              <Statistic title="已有固定链接" value={slugStats.withSlug} valueStyle={{ color: '#3f8600' }} />
            </Col>
            <Col span={8}>
              <Statistic title="待生成" value={slugStats.withoutSlug} valueStyle={{ color: slugStats.withoutSlug > 0 ? '#cf1322' : '#3f8600' }} />
            </Col>
          </Row>
          
          {slugStats.withoutSlug > 0 && (
            <Alert
              message={`有 ${slugStats.withoutSlug} 个网站尚未设置固定链接`}
              description="点击下方按钮可以批量自动生成固定链接，生成后可以使用「网站名称」URL 结构。"
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}
          
          <Space>
            <Button
              type="primary"
              icon={<ThunderboltOutlined />}
              onClick={() => setGenerateModalVisible(true)}
              disabled={slugStats.withoutSlug === 0}
            >
              批量生成固定链接
            </Button>
            <Button onClick={fetchSlugStats}>刷新统计</Button>
          </Space>
        </Card>

        <Form.Item>
          <Space>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              icon={<SaveOutlined />}
            >
              保存设置
            </Button>
            <Button onClick={() => form.resetFields()}>重置</Button>
          </Space>
        </Form.Item>
      </Form>

      {/* 批量生成弹窗 */}
      <Modal
        title="批量生成固定链接"
        open={generateModalVisible}
        onCancel={() => setGenerateModalVisible(false)}
        footer={null}
      >
        <Alert
          message="自动生成固定链接"
          description="将为所有没有固定链接的网站自动生成。优先从域名提取（如 dribbble.com → dribbble），如果是中文名称则转换为拼音。已有固定链接的网站不会被覆盖。"
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
        
        <Space direction="vertical" style={{ width: '100%' }}>
          <Button
            block
            type="primary"
            size="large"
            loading={generating}
            onClick={() => handleBatchGenerate(false)}
          >
            开始生成
          </Button>
          
          <Button
            block
            size="large"
            loading={generating}
            onClick={() => handleBatchGenerate(true)}
          >
            预览模式（不实际修改）
          </Button>
        </Space>
      </Modal>
    </div>
  );
}
