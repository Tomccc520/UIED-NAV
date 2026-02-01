/**
 * @file SystemSettings.tsx
 * @description 系统设置 - 基本设置、数据管理、账户安全
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 2.0.0
 */

import { useEffect, useState } from 'react';
import { 
  Card, 
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
  Typography,
  Collapse
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
  SafetyOutlined,
  GlobalOutlined,
  PictureOutlined,
  SafetyCertificateOutlined
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
  const [activeSection, setActiveSection] = useState<string>('basic');
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
      const siteRes = await api.get('/site-info');
      form.setFieldsValue(siteRes.data);
      setLogoUrl(siteRes.data.logo || '');
      setFaviconUrl(siteRes.data.favicon || '');

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

  const handlePasswordChange = async (values: { oldPassword: string; newPassword: string; confirmPassword: string }) => {
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
  };

  if (fetching) {
    return <div style={{ textAlign: 'center', padding: 50 }}>加载中...</div>;
  }

  const configSections = [
    { key: 'basic', label: '基本信息', icon: <GlobalOutlined />, desc: '网站名称和SEO' },
    { key: 'resource', label: '资源设置', icon: <PictureOutlined />, desc: 'Logo和Favicon' },
    { key: 'icp', label: '备案信息', icon: <SafetyCertificateOutlined />, desc: 'ICP备案和版权' },
    { key: 'data', label: '数据管理', icon: <DatabaseOutlined />, desc: '数据统计和同步' },
    { key: 'security', label: '账户安全', icon: <LockOutlined />, desc: '密码修改' },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}>
          <SettingOutlined style={{ marginRight: 8 }} />
          系统设置
        </Title>
        <Text type="secondary">管理网站基本信息、数据和账户安全</Text>
      </div>

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
              <Form form={form} layout="vertical" onFinish={handleSubmit}>
                <Collapse ghost defaultActiveKey={['name', 'seo']} items={[
                  {
                    key: 'name',
                    label: '网站名称',
                    children: (
                      <>
                        <Form.Item name="siteName" label="网站名称" rules={[{ required: true, message: '请输入网站名称' }]}>
                          <Input placeholder="UIED设计导航" />
                        </Form.Item>
                        <Form.Item name="siteTitle" label="网站标题（SEO）" rules={[{ required: true, message: '请输入网站标题' }]} extra="显示在浏览器标签页，建议包含关键词">
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
                        <Form.Item name="description" label="网站描述" rules={[{ required: true, message: '请输入网站描述' }]} extra="用于SEO，建议120-150字">
                          <TextArea rows={3} placeholder="UIED设计导航汇集优质设计工具与资源..." />
                        </Form.Item>
                        <Form.Item name="keywords" label="关键词" rules={[{ required: true, message: '请输入关键词' }]} extra="多个关键词用英文逗号分隔">
                          <Input placeholder="设计导航,UI设计,UX设计,设计工具" />
                        </Form.Item>
                      </>
                    ),
                  },
                ]} />
                <Divider />
                <Form.Item>
                  <Space>
                    <Button type="primary" htmlType="submit" loading={loading} icon={<SaveOutlined />}>保存配置</Button>
                    <Button icon={<ReloadOutlined />} onClick={fetchData}>重置</Button>
                  </Space>
                </Form.Item>
              </Form>
            </Card>
          )}

          {/* 资源设置 */}
          {activeSection === 'resource' && (
            <Card title="资源设置" extra={<Text type="secondary">Logo和Favicon图片</Text>}>
              <Form form={form} layout="vertical" onFinish={handleSubmit}>
                <Collapse ghost defaultActiveKey={['logo', 'favicon']} items={[
                  {
                    key: 'logo',
                    label: 'Logo',
                    children: (
                      <div style={{ padding: 16, border: '1px dashed #d9d9d9', borderRadius: 8, backgroundColor: '#fafafa', textAlign: 'center', marginBottom: 16 }}>
                        {logoUrl ? (
                          <div>
                            <Image src={logoUrl} alt="Logo" style={{ maxWidth: 200, maxHeight: 100, marginBottom: 12 }} />
                            <div>
                              <Space>
                                <Upload {...uploadProps('logo')}><Button icon={<UploadOutlined />}>重新上传</Button></Upload>
                                <Button danger icon={<DeleteOutlined />} onClick={() => { setLogoUrl(''); form.setFieldValue('logo', ''); }}>清除</Button>
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
                            <Upload {...uploadProps('logo')}><Button type="primary" icon={<UploadOutlined />}>选择文件</Button></Upload>
                          </div>
                        )}
                        <Form.Item name="logo" hidden><Input /></Form.Item>
                      </div>
                    ),
                  },
                  {
                    key: 'favicon',
                    label: 'Favicon',
                    children: (
                      <div style={{ padding: 16, border: '1px dashed #d9d9d9', borderRadius: 8, backgroundColor: '#fafafa', textAlign: 'center', marginBottom: 16 }}>
                        {faviconUrl ? (
                          <div>
                            <Image src={faviconUrl} alt="Favicon" style={{ maxWidth: 64, maxHeight: 64, marginBottom: 12 }} />
                            <div>
                              <Space>
                                <Upload {...uploadProps('favicon')}><Button icon={<UploadOutlined />}>重新上传</Button></Upload>
                                <Button danger icon={<DeleteOutlined />} onClick={() => { setFaviconUrl(''); form.setFieldValue('favicon', ''); }}>清除</Button>
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
                            <Upload {...uploadProps('favicon')}><Button type="primary" icon={<UploadOutlined />}>选择文件</Button></Upload>
                          </div>
                        )}
                        <Form.Item name="favicon" hidden><Input /></Form.Item>
                      </div>
                    ),
                  },
                ]} />
                <Divider />
                <Form.Item>
                  <Space>
                    <Button type="primary" htmlType="submit" loading={loading} icon={<SaveOutlined />}>保存配置</Button>
                    <Button icon={<ReloadOutlined />} onClick={fetchData}>重置</Button>
                  </Space>
                </Form.Item>
              </Form>
            </Card>
          )}

          {/* 备案信息 */}
          {activeSection === 'icp' && (
            <Card title="备案信息" extra={<Text type="secondary">ICP备案和版权信息</Text>}>
              <Form form={form} layout="vertical" onFinish={handleSubmit}>
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
                    <Button type="primary" htmlType="submit" loading={loading} icon={<SaveOutlined />}>保存配置</Button>
                    <Button icon={<ReloadOutlined />} onClick={fetchData}>重置</Button>
                  </Space>
                </Form.Item>
              </Form>
            </Card>
          )}

          {/* 数据管理 */}
          {activeSection === 'data' && (
            <Card title="数据管理" extra={<Text type="secondary">数据统计和系统状态</Text>}>
              <Alert
                message="数据同步说明"
                description="前端页面支持从API获取数据。当API可用时，页面会自动使用数据库中的数据；当API不可用时，会回退到静态数据文件。"
                type="info"
                showIcon
                style={{ marginBottom: 24 }}
              />
              
              <Row gutter={16} style={{ marginBottom: 24 }}>
                <Col span={6}>
                  <Card size="small">
                    <Statistic 
                      title="API状态" 
                      value={apiStatus === 'online' ? '在线' : apiStatus === 'offline' ? '离线' : '检查中'}
                      valueStyle={{ color: apiStatus === 'online' ? '#52c41a' : apiStatus === 'offline' ? '#ff4d4f' : '#faad14' }}
                      prefix={<CloudServerOutlined />}
                    />
                  </Card>
                </Col>
                <Col span={6}>
                  <Card size="small">
                    <Statistic title="页面" value={stats.pages} suffix="个" prefix={<DatabaseOutlined />} />
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
              </Row>

              <Divider>快捷操作</Divider>
              <Space wrap>
                <Button onClick={() => window.open('/', '_blank')}>访问前端</Button>
                <Button onClick={() => window.open('/api/pages', '_blank')}>查看API</Button>
                <Button icon={<ReloadOutlined />} onClick={() => { fetchData(); checkApiStatus(); }}>刷新状态</Button>
              </Space>
            </Card>
          )}

          {/* 账户安全 */}
          {activeSection === 'security' && (
            <Card title="账户安全" extra={<Text type="secondary">密码修改和安全设置</Text>}>
              <Alert
                message="安全提醒"
                description="请定期修改密码，使用强密码（包含大小写字母、数字和特殊字符），不要使用简单密码如 123456、admin 等。"
                type="warning"
                showIcon
                style={{ marginBottom: 24 }}
              />

              <Collapse ghost defaultActiveKey={['password', 'tips']} items={[
                {
                  key: 'password',
                  label: '修改密码',
                  children: (
                    <Form form={passwordForm} layout="vertical" onFinish={handlePasswordChange} style={{ maxWidth: 400 }}>
                      <Form.Item name="oldPassword" label="当前密码" rules={[{ required: true, message: '请输入当前密码' }]}>
                        <Input.Password prefix={<LockOutlined />} placeholder="请输入当前密码" />
                      </Form.Item>
                      <Form.Item name="newPassword" label="新密码" rules={[{ required: true, message: '请输入新密码' }, { min: 6, message: '密码长度至少6位' }]}>
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
                        <Button type="primary" htmlType="submit" loading={passwordLoading} icon={<SafetyOutlined />}>修改密码</Button>
                      </Form.Item>
                    </Form>
                  ),
                },
                {
                  key: 'tips',
                  label: '安全建议',
                  children: (
                    <ul style={{ paddingLeft: 20, margin: 0, color: '#666' }}>
                      <li>密码长度建议 8 位以上</li>
                      <li>包含大小写字母、数字和特殊字符</li>
                      <li>不要使用与其他网站相同的密码</li>
                      <li>定期更换密码（建议每 3 个月）</li>
                      <li>不要在公共电脑上保存登录状态</li>
                    </ul>
                  ),
                },
              ]} />
            </Card>
          )}
        </Col>
      </Row>
    </div>
  );
}
