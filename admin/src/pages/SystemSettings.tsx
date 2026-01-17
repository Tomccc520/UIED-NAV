/**
 * @file SystemSettings.tsx
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
  Tabs, 
  Form, 
  Input, 
  Button, 
  message, 
  Space, 
  Upload, 
  Image,
  Statistic,
  Row,
  Col,
  Alert,
  Divider,
  Typography
} from 'antd';
import { 
  SaveOutlined, 
  UploadOutlined, 
  DeleteOutlined,
  ReloadOutlined,
  DatabaseOutlined,
  CloudServerOutlined,
  SettingOutlined,
  LockOutlined,
  SafetyOutlined
} from '@ant-design/icons';
import type { UploadProps } from 'antd';
import api, { authApi } from '../services/api';

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

interface SystemStats {
  pages: number;
  categories: number;
  websites: number;
  socialMedia: number;
}

export default function SystemSettings() {
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [faviconUrl, setFaviconUrl] = useState<string>('');
  const [stats, setStats] = useState<SystemStats>({ pages: 0, categories: 0, websites: 0, socialMedia: 0 });
  const [apiStatus, setApiStatus] = useState<'online' | 'offline' | 'checking'>('checking');

  useEffect(() => {
    fetchData();
    checkApiStatus();
  }, []);

  const fetchData = async () => {
    try {
      // 获取站点信息
      const siteRes = await api.get('/site-info');
      form.setFieldsValue(siteRes.data);
      setLogoUrl(siteRes.data.logo || '');
      setFaviconUrl(siteRes.data.favicon || '');

      // 获取统计数据
      const [pagesRes, categoriesRes, websitesRes, socialRes] = await Promise.all([
        api.get('/pages'),
        api.get('/categories?flat=true'),
        api.get('/websites'),
        api.get('/social-media')
      ]);

      setStats({
        pages: pagesRes.data.length,
        categories: categoriesRes.data.length,
        websites: websitesRes.data.length,
        socialMedia: socialRes.data.length
      });
    } catch (error) {
      message.error('获取数据失败');
    } finally {
      setFetching(false);
    }
  };

  const checkApiStatus = async () => {
    setApiStatus('checking');
    try {
      await api.get('/site-info');
      setApiStatus('online');
    } catch {
      setApiStatus('offline');
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
    } catch (error) {
      message.error('上传失败');
    }
    return false;
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
    return <div style={{ textAlign: 'center', padding: 50 }}>加载中...</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={4} style={{ margin: 0 }}>
          <SettingOutlined style={{ marginRight: 8 }} />
          系统设置
        </Title>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => { fetchData(); checkApiStatus(); }}>
            刷新
          </Button>
        </Space>
      </div>

      {/* 系统状态 */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={24}>
          <Col span={6}>
            <Statistic 
              title="API状态" 
              value={apiStatus === 'online' ? '在线' : apiStatus === 'offline' ? '离线' : '检查中'}
              valueStyle={{ color: apiStatus === 'online' ? '#52c41a' : apiStatus === 'offline' ? '#ff4d4f' : '#faad14' }}
              prefix={<CloudServerOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic title="页面数" value={stats.pages} prefix={<DatabaseOutlined />} />
          </Col>
          <Col span={6}>
            <Statistic title="分类数" value={stats.categories} />
          </Col>
          <Col span={6}>
            <Statistic title="网站数" value={stats.websites} />
          </Col>
        </Row>
      </Card>

      <Tabs
        items={[
          {
            key: 'basic',
            label: '基本设置',
            children: (
              <Form form={form} layout="vertical" onFinish={handleSubmit}>
                <Card title="网站信息" style={{ marginBottom: 16 }}>
                  <Row gutter={24}>
                    <Col span={12}>
                      <Form.Item name="siteName" label="网站名称" rules={[{ required: true }]}>
                        <Input placeholder="UIED设计导航" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="siteTitle" label="网站标题（SEO）" rules={[{ required: true }]}>
                        <Input placeholder="UIED设计导航 - 设计师的工具导航平台" />
                      </Form.Item>
                    </Col>
                  </Row>
                  
                  <Form.Item name="description" label="网站描述" rules={[{ required: true }]}>
                    <TextArea rows={3} placeholder="网站描述，用于SEO" />
                  </Form.Item>

                  <Form.Item name="keywords" label="关键词" rules={[{ required: true }]}>
                    <Input placeholder="多个关键词用英文逗号分隔" />
                  </Form.Item>
                </Card>

                <Card title="资源设置" style={{ marginBottom: 16 }}>
                  <Row gutter={24}>
                    <Col span={12}>
                      <Form.Item label="Logo">
                        <div style={{ padding: 16, border: '1px dashed #d9d9d9', borderRadius: 8, textAlign: 'center' }}>
                          {logoUrl ? (
                            <div>
                              <Image src={logoUrl} alt="Logo" style={{ maxWidth: 200, maxHeight: 80, marginBottom: 12 }} />
                              <div>
                                <Space>
                                  <Upload {...uploadProps('logo')}>
                                    <Button size="small" icon={<UploadOutlined />}>更换</Button>
                                  </Upload>
                                  <Button size="small" danger icon={<DeleteOutlined />} onClick={() => { setLogoUrl(''); form.setFieldValue('logo', ''); }}>
                                    清除
                                  </Button>
                                </Space>
                              </div>
                            </div>
                          ) : (
                            <Upload {...uploadProps('logo')}>
                              <Button icon={<UploadOutlined />}>上传Logo</Button>
                            </Upload>
                          )}
                        </div>
                        <Form.Item name="logo" hidden><Input /></Form.Item>
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item label="Favicon">
                        <div style={{ padding: 16, border: '1px dashed #d9d9d9', borderRadius: 8, textAlign: 'center' }}>
                          {faviconUrl ? (
                            <div>
                              <Image src={faviconUrl} alt="Favicon" style={{ maxWidth: 64, maxHeight: 64, marginBottom: 12 }} />
                              <div>
                                <Space>
                                  <Upload {...uploadProps('favicon')}>
                                    <Button size="small" icon={<UploadOutlined />}>更换</Button>
                                  </Upload>
                                  <Button size="small" danger icon={<DeleteOutlined />} onClick={() => { setFaviconUrl(''); form.setFieldValue('favicon', ''); }}>
                                    清除
                                  </Button>
                                </Space>
                              </div>
                            </div>
                          ) : (
                            <Upload {...uploadProps('favicon')}>
                              <Button icon={<UploadOutlined />}>上传Favicon</Button>
                            </Upload>
                          )}
                        </div>
                        <Form.Item name="favicon" hidden><Input /></Form.Item>
                      </Form.Item>
                    </Col>
                  </Row>
                </Card>

                <Card title="备案信息" style={{ marginBottom: 16 }}>
                  <Row gutter={24}>
                    <Col span={12}>
                      <Form.Item name="icp" label="备案号">
                        <Input placeholder="粤ICP备2022056875号" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="icpLink" label="备案链接">
                        <Input placeholder="https://beian.miit.gov.cn" />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Form.Item name="copyright" label="版权信息">
                    <Input placeholder="© 2025 UIED设计导航" />
                  </Form.Item>
                </Card>

                <Form.Item>
                  <Space>
                    <Button type="primary" htmlType="submit" loading={loading} icon={<SaveOutlined />}>
                      保存设置
                    </Button>
                    <Button onClick={() => form.resetFields()}>重置</Button>
                  </Space>
                </Form.Item>
              </Form>
            ),
          },
          {
            key: 'data',
            label: '数据管理',
            children: (
              <Card>
                <Alert
                  message="数据同步说明"
                  description="前端页面支持从API获取数据。当API可用时，页面会自动使用数据库中的数据；当API不可用时，会回退到静态数据文件。"
                  type="info"
                  showIcon
                  style={{ marginBottom: 24 }}
                />
                
                <Divider>数据统计</Divider>
                <Row gutter={24}>
                  <Col span={6}>
                    <Card size="small">
                      <Statistic title="页面" value={stats.pages} suffix="个" />
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card size="small">
                      <Statistic title="分类" value={stats.categories} suffix="个" />
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card size="small">
                      <Statistic title="网站" value={stats.websites} suffix="个" />
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card size="small">
                      <Statistic title="社交媒体" value={stats.socialMedia} suffix="个" />
                    </Card>
                  </Col>
                </Row>

                <Divider>快捷操作</Divider>
                <Space wrap>
                  <Button onClick={() => window.open('/', '_blank')}>
                    访问前端
                  </Button>
                  <Button onClick={() => window.open('/api/pages', '_blank')}>
                    查看API
                  </Button>
                </Space>
              </Card>
            ),
          },
          {
            key: 'security',
            label: '账户安全',
            children: (
              <Card>
                <Alert
                  message="安全提醒"
                  description="请定期修改密码，使用强密码（包含大小写字母、数字和特殊字符），不要使用简单密码如 123456、admin 等。"
                  type="warning"
                  showIcon
                  style={{ marginBottom: 24 }}
                />

                <Card title={<><LockOutlined /> 修改密码</>} style={{ maxWidth: 500 }}>
                  <Form
                    form={passwordForm}
                    layout="vertical"
                    onFinish={async (values) => {
                      if (values.newPassword !== values.confirmPassword) {
                        message.error('两次输入的新密码不一致');
                        return;
                      }
                      if (values.newPassword.length < 6) {
                        message.error('新密码长度至少6位');
                        return;
                      }
                      setPasswordLoading(true);
                      try {
                        await authApi.changePassword({
                          oldPassword: values.oldPassword,
                          newPassword: values.newPassword,
                        });
                        message.success('密码修改成功');
                        passwordForm.resetFields();
                      } catch (error: any) {
                        message.error(error.response?.data?.error || error.response?.data?.message || '密码修改失败');
                      } finally {
                        setPasswordLoading(false);
                      }
                    }}
                  >
                    <Form.Item
                      name="oldPassword"
                      label="当前密码"
                      rules={[{ required: true, message: '请输入当前密码' }]}
                    >
                      <Input.Password prefix={<LockOutlined />} placeholder="请输入当前密码" />
                    </Form.Item>

                    <Form.Item
                      name="newPassword"
                      label="新密码"
                      rules={[
                        { required: true, message: '请输入新密码' },
                        { min: 6, message: '密码长度至少6位' },
                      ]}
                    >
                      <Input.Password prefix={<LockOutlined />} placeholder="请输入新密码（至少6位）" />
                    </Form.Item>

                    <Form.Item
                      name="confirmPassword"
                      label="确认新密码"
                      rules={[
                        { required: true, message: '请确认新密码' },
                        ({ getFieldValue }) => ({
                          validator(_, value) {
                            if (!value || getFieldValue('newPassword') === value) {
                              return Promise.resolve();
                            }
                            return Promise.reject(new Error('两次输入的密码不一致'));
                          },
                        }),
                      ]}
                    >
                      <Input.Password prefix={<LockOutlined />} placeholder="请再次输入新密码" />
                    </Form.Item>

                    <Form.Item>
                      <Button type="primary" htmlType="submit" loading={passwordLoading} icon={<SafetyOutlined />}>
                        修改密码
                      </Button>
                    </Form.Item>
                  </Form>
                </Card>

                <Divider />

                <Card title={<><SafetyOutlined /> 安全建议</>} size="small">
                  <ul style={{ paddingLeft: 20, margin: 0 }}>
                    <li><Text>密码长度建议 8 位以上</Text></li>
                    <li><Text>包含大小写字母、数字和特殊字符</Text></li>
                    <li><Text>不要使用与其他网站相同的密码</Text></li>
                    <li><Text>定期更换密码（建议每 3 个月）</Text></li>
                    <li><Text>不要在公共电脑上保存登录状态</Text></li>
                  </ul>
                </Card>
              </Card>
            ),
          },
        ]}
      />
    </div>
  );
}
