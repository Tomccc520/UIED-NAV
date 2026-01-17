/**
 * @file SiteSettings.tsx
 * @description 管理后台组件
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

import { useEffect, useState } from 'react';
import { Form, Input, Button, Card, message, Space, Upload, Typography, Image } from 'antd';
import { SaveOutlined, UploadOutlined, DeleteOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import api from '../services/api';

const { TextArea } = Input;
const { Title } = Typography;

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
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [faviconUrl, setFaviconUrl] = useState<string>('');

  useEffect(() => {
    fetchSiteInfo();
  }, []);

  const fetchSiteInfo = async () => {
    try {
      const response = await api.get('/site-info');
      const data = response.data;
      form.setFieldsValue(data);
      setLogoUrl(data.logo || '');
      setFaviconUrl(data.favicon || '');
    } catch (error) {
      message.error('获取站点信息失败');
    } finally {
      setFetching(false);
    }
  };

  // 处理图片上传
  const handleUpload = async (file: File, type: 'logo' | 'favicon') => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/upload/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const uploadedUrl = response.data.url;
      // 使用相对路径，让浏览器自动使用当前域名
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
      return false; // 阻止默认上传行为
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
    setLoading(true);
    try {
      await api.put('/site-info', values);
      message.success('保存成功');
    } catch (error) {
      message.error('保存失败');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return <div>加载中...</div>;
  }

  return (
    <div>
      <Title level={4} style={{ marginBottom: 24 }}>
        站点设置
      </Title>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        autoComplete="off"
      >
        <Card title="基本信息" style={{ marginBottom: 16 }}>
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

          <Form.Item
            name="description"
            label="网站描述"
            rules={[{ required: true, message: '请输入网站描述' }]}
            extra="用于SEO，建议120-150字"
          >
            <TextArea
              rows={3}
              placeholder="UIED设计导航汇集优质设计工具与资源..."
            />
          </Form.Item>

          <Form.Item
            name="keywords"
            label="关键词"
            rules={[{ required: true, message: '请输入关键词' }]}
            extra="多个关键词用英文逗号分隔"
          >
            <Input placeholder="设计导航,UI设计,UX设计,设计工具" />
          </Form.Item>
        </Card>

        <Card title="资源设置" style={{ marginBottom: 16 }}>
          <Form.Item label="Logo">
            <Space direction="vertical" style={{ width: '100%' }}>
              <div style={{ 
                padding: '16px', 
                border: '1px dashed #d9d9d9', 
                borderRadius: '8px',
                backgroundColor: '#fafafa',
                textAlign: 'center'
              }}>
                {logoUrl ? (
                  <div>
                    <Image
                      src={logoUrl}
                      alt="Logo"
                      style={{ maxWidth: 200, maxHeight: 100, marginBottom: 12 }}
                    />
                    <div>
                      <Space>
                        <Upload {...uploadProps('logo')}>
                          <Button icon={<UploadOutlined />}>重新上传</Button>
                        </Upload>
                        <Button
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => {
                            setLogoUrl('');
                            form.setFieldValue('logo', '');
                          }}
                        >
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
                      <div style={{ fontSize: 12, marginTop: 4 }}>
                        支持 PNG、SVG、JPG 格式，建议尺寸 200x60 像素
                      </div>
                    </div>
                    <Upload {...uploadProps('logo')}>
                      <Button type="primary" icon={<UploadOutlined />}>
                        选择文件
                      </Button>
                    </Upload>
                  </div>
                )}
              </div>
            </Space>
          </Form.Item>

          <Form.Item name="logo" hidden>
            <Input />
          </Form.Item>

          <Form.Item label="Favicon">
            <Space direction="vertical" style={{ width: '100%' }}>
              <div style={{ 
                padding: '16px', 
                border: '1px dashed #d9d9d9', 
                borderRadius: '8px',
                backgroundColor: '#fafafa',
                textAlign: 'center'
              }}>
                {faviconUrl ? (
                  <div>
                    <Image
                      src={faviconUrl}
                      alt="Favicon"
                      style={{ maxWidth: 64, maxHeight: 64, marginBottom: 12 }}
                    />
                    <div>
                      <Space>
                        <Upload {...uploadProps('favicon')}>
                          <Button icon={<UploadOutlined />}>重新上传</Button>
                        </Upload>
                        <Button
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => {
                            setFaviconUrl('');
                            form.setFieldValue('favicon', '');
                          }}
                        >
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
                      <div style={{ fontSize: 12, marginTop: 4 }}>
                        支持 ICO、PNG 格式，建议尺寸 32x32 或 64x64 像素
                      </div>
                    </div>
                    <Upload {...uploadProps('favicon')}>
                      <Button type="primary" icon={<UploadOutlined />}>
                        选择文件
                      </Button>
                    </Upload>
                  </div>
                )}
              </div>
            </Space>
          </Form.Item>

          <Form.Item name="favicon" hidden>
            <Input />
          </Form.Item>
        </Card>

        <Card title="备案信息" style={{ marginBottom: 16 }}>
          <Form.Item name="icp" label="备案号">
            <Input placeholder="粤ICP备2022056875号" />
          </Form.Item>

          <Form.Item name="icpLink" label="备案链接">
            <Input placeholder="https://beian.miit.gov.cn" />
          </Form.Item>

          <Form.Item name="copyright" label="版权信息">
            <Input placeholder="© 2025 UIED设计导航 · 佛山市南海区迅捷腾达电子商务服务中心" />
          </Form.Item>
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
    </div>
  );
}
