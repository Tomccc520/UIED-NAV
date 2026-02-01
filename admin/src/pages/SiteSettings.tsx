/**
 * @file SiteSettings.tsx
 * @description 站点基本设置 - 网站信息、Logo、备案等
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 2.0.0
 */

import { useEffect, useState } from 'react';
import { Form, Input, Button, Card, message, Space, Upload, Typography, Image, Row, Col, Collapse, Divider } from 'antd';
import { SaveOutlined, ReloadOutlined, UploadOutlined, DeleteOutlined, GlobalOutlined, PictureOutlined, SafetyCertificateOutlined, SettingOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import api from '../services/api';

const { TextArea } = Input;
const { Title, Text } = Typography;

interface SiteInfo {
  id?: string;
  siteName: string;
  siteTitle: string;
  description: string;
  keywords: string;
  logo?: string;
  favicon?: string;
  icp?: string;
  icpLink?: string;
  copyright?: string;
}

export default function SiteSettings() {
  const [activeSection, setActiveSection] = useState<string>('basic');
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [faviconUrl, setFaviconUrl] = useState<string>('');

  useEffect(() => {
    fetchSiteInfo();
  }, []);

  const fetchSiteInfo = async () => {
    setLoading(true);
    try {
      const response = await api.get('/site-info');
      const data = response.data;
      form.setFieldsValue(data);
      setLogoUrl(data.logo || '');
      setFaviconUrl(data.favicon || '');
    } catch (error) {
      message.error('获取站点信息失败');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (file: File, type: 'logo' | 'favicon') => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const uploadedUrl = response.data.url;
      const fullUrl = uploadedUrl.startsWith('http') 
        ? uploadedUrl 
        : `${window.location.origin}${uploadedUrl}`;
      
      if (type === 'logo') {
        setLogoUrl(fullUrl);
        form.setFieldValue('logo', fullUrl);
      } else {
        setFaviconUrl(fullUrl);
        form.setFieldValue('favicon', fullUrl);
      }
      
      message.success('上传成功');
      return false;
    } catch (error) {
      message.error('上传失败');
      return false;
    }
  };

  const uploadProps = (type: 'logo' | 'favicon'): UploadProps => ({
    beforeUpload: (file) => {
      handleUpload(file, type);
      return false;
    },
    showUploadList: false,
    accept: 'image/*',
  });

  const handleSubmit = async (values: SiteInfo) => {
    setSaving(true);
    try {
      await api.put('/site-info', values);
      message.success('保存成功');
    } catch (error) {
      message.error('保存失败');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 50 }}>加载中...</div>;
  }

  const configSections = [
    { key: 'basic', label: '基本信息', icon: <GlobalOutlined />, desc: '网站名称和SEO' },
    { key: 'resource', label: '资源设置', icon: <PictureOutlined />, desc: 'Logo和Favicon' },
    { key: 'icp', label: '备案信息', icon: <SafetyCertificateOutlined />, desc: 'ICP备案和版权' },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}>
          <SettingOutlined style={{ marginRight: 8 }} />
          站点设置
        </Title>
        <Text type="secondary">管理网站基本信息、Logo和备案</Text>
      </div>

      <Form form={form} layout="vertical" onFinish={handleSubmit} autoComplete="off">
        <Row gutter={24}>
          {/* 左侧导航 */}
          <Col span={6}>
            <Card size="small" style={{ position: 'sticky', top: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {configSections.map(section => (
                  <div
                    key={section.key}
                    onClick={() => setActiveSection(section.key)}
                    style={{
                      padding: '12px 16px',
                      borderRadius: 8,
                      cursor: 'pointer',
                      background: activeSection === section.key ? '#e6f4ff' : 'transparent',
                      border: activeSection === section.key ? '1px solid #91caff' : '1px solid transparent',
                      transition: 'all 0.2s',
                    }}
                  >
                    <Space>
                      <span style={{ color: activeSection === section.key ? '#1677ff' : '#666' }}>
                        {section.icon}
                      </span>
                      <div>
                        <div style={{ fontWeight: 500, color: activeSection === section.key ? '#1677ff' : '#333' }}>
                          {section.label}
                        </div>
                        <div style={{ fontSize: 12, color: '#999' }}>{section.desc}</div>
                      </div>
                    </Space>
                  </div>
                ))}
              </div>
            </Card>
          </Col>

          {/* 右侧内容 */}
          <Col span={18}>
            {/* 基本信息 */}
            {activeSection === 'basic' && (
              <Card title="基本信息" extra={<Text type="secondary">网站名称和SEO设置</Text>}>
                <Collapse ghost defaultActiveKey={['name', 'seo']} items={[
                  {
                    key: 'name',
                    label: '网站名称',
                    children: (
                      <>
                        <Form.Item
                          name="siteName"
                          label="网站名称"
                          rules={[{ required: true, message: '请输入网站名称' }]}
                        >
                          <Input placeholder="UIED设计导航" />
                        </Form.Item>
                        <Form.Item
                          name="siteTitle"
                          label="网站标题（SEO）"
                          rules={[{ required: true, message: '请输入网站标题' }]}
                          extra="显示在浏览器标签页，建议包含关键词"
                        >
                          <Input placeholder="UIED设计导航 - 设计师的工具导航平台" />
                        </Form.Item>
                      </>
                    ),
                  },
                  {
                    key: 'seo',
                    label: 'SEO设置',
                    children: (
                      <>
                        <Form.Item
                          name="description"
                          label="网站描述"
                          rules={[{ required: true, message: '请输入网站描述' }]}
                          extra="用于SEO，建议120-150字"
                        >
                          <TextArea rows={3} placeholder="UIED设计导航汇集优质设计工具与资源..." />
                        </Form.Item>
                        <Form.Item
                          name="keywords"
                          label="关键词"
                          rules={[{ required: true, message: '请输入关键词' }]}
                          extra="多个关键词用英文逗号分隔"
                        >
                          <Input placeholder="设计导航,UI设计,UX设计,设计工具" />
                        </Form.Item>
                      </>
                    ),
                  },
                ]} />
                <Divider />
                <Form.Item>
                  <Space>
                    <Button type="primary" htmlType="submit" loading={saving} icon={<SaveOutlined />}>保存配置</Button>
                    <Button icon={<ReloadOutlined />} onClick={fetchSiteInfo}>重置</Button>
                  </Space>
                </Form.Item>
              </Card>
            )}

            {/* 资源设置 */}
            {activeSection === 'resource' && (
              <Card title="资源设置" extra={<Text type="secondary">Logo和Favicon图片</Text>}>
                <Collapse ghost defaultActiveKey={['logo', 'favicon']} items={[
                  {
                    key: 'logo',
                    label: 'Logo',
                    children: (
                      <>
                        <div style={{ 
                          padding: 16, 
                          border: '1px dashed #d9d9d9', 
                          borderRadius: 8,
                          backgroundColor: '#fafafa',
                          textAlign: 'center',
                          marginBottom: 16
                        }}>
                          {logoUrl ? (
                            <div>
                              <Image src={logoUrl} alt="Logo" style={{ maxWidth: 200, maxHeight: 100, marginBottom: 12 }} />
                              <div>
                                <Space>
                                  <Upload {...uploadProps('logo')}>
                                    <Button icon={<UploadOutlined />}>重新上传</Button>
                                  </Upload>
                                  <Button danger icon={<DeleteOutlined />} onClick={() => { setLogoUrl(''); form.setFieldValue('logo', ''); }}>
                                    清除
                                  </Button>
                                </Space>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <div style={{ marginBottom: 12, color: '#999' }}>
                                <UploadOutlined style={{ fontSize: 32 }} />
                                <div style={{ marginTop: 8 }}>点击上传 Logo</div>
                                <div style={{ fontSize: 12, marginTop: 4 }}>支持 PNG、SVG、JPG 格式，建议尺寸 200x60 像素</div>
                              </div>
                              <Upload {...uploadProps('logo')}>
                                <Button type="primary" icon={<UploadOutlined />}>选择文件</Button>
                              </Upload>
                            </div>
                          )}
                        </div>
                        <Form.Item name="logo" hidden><Input /></Form.Item>
                      </>
                    ),
                  },
                  {
                    key: 'favicon',
                    label: 'Favicon',
                    children: (
                      <>
                        <div style={{ 
                          padding: 16, 
                          border: '1px dashed #d9d9d9', 
                          borderRadius: 8,
                          backgroundColor: '#fafafa',
                          textAlign: 'center',
                          marginBottom: 16
                        }}>
                          {faviconUrl ? (
                            <div>
                              <Image src={faviconUrl} alt="Favicon" style={{ maxWidth: 64, maxHeight: 64, marginBottom: 12 }} />
                              <div>
                                <Space>
                                  <Upload {...uploadProps('favicon')}>
                                    <Button icon={<UploadOutlined />}>重新上传</Button>
                                  </Upload>
                                  <Button danger icon={<DeleteOutlined />} onClick={() => { setFaviconUrl(''); form.setFieldValue('favicon', ''); }}>
                                    清除
                                  </Button>
                                </Space>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <div style={{ marginBottom: 12, color: '#999' }}>
                                <UploadOutlined style={{ fontSize: 32 }} />
                                <div style={{ marginTop: 8 }}>点击上传 Favicon</div>
                                <div style={{ fontSize: 12, marginTop: 4 }}>支持 ICO、PNG 格式，建议尺寸 32x32 或 64x64 像素</div>
                              </div>
                              <Upload {...uploadProps('favicon')}>
                                <Button type="primary" icon={<UploadOutlined />}>选择文件</Button>
                              </Upload>
                            </div>
                          )}
                        </div>
                        <Form.Item name="favicon" hidden><Input /></Form.Item>
                      </>
                    ),
                  },
                ]} />
                <Divider />
                <Form.Item>
                  <Space>
                    <Button type="primary" htmlType="submit" loading={saving} icon={<SaveOutlined />}>保存配置</Button>
                    <Button icon={<ReloadOutlined />} onClick={fetchSiteInfo}>重置</Button>
                  </Space>
                </Form.Item>
              </Card>
            )}

            {/* 备案信息 */}
            {activeSection === 'icp' && (
              <Card title="备案信息" extra={<Text type="secondary">ICP备案和版权信息</Text>}>
                <Form.Item name="icp" label="备案号">
                  <Input placeholder="粤ICP备2022056875号" />
                </Form.Item>
                <Form.Item name="icpLink" label="备案链接">
                  <Input placeholder="https://beian.miit.gov.cn" />
                </Form.Item>
                <Form.Item name="copyright" label="版权信息">
                  <Input placeholder="© 2025 UIED设计导航 · 佛山市南海区迅捷腾达电子商务服务中心" />
                </Form.Item>
                <Divider />
                <Form.Item>
                  <Space>
                    <Button type="primary" htmlType="submit" loading={saving} icon={<SaveOutlined />}>保存配置</Button>
                    <Button icon={<ReloadOutlined />} onClick={fetchSiteInfo}>重置</Button>
                  </Space>
                </Form.Item>
              </Card>
            )}
          </Col>
        </Row>
      </Form>
    </div>
  );
}
