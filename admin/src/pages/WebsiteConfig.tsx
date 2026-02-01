/**
 * @file WebsiteConfig.tsx
 * @description 网站配置管理 - 跳转提醒、页面全局配置、详情页侧边栏
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

import { useEffect, useState } from 'react';
import { Card, Form, Input, Switch, Button, message, Space, Typography, Alert, Divider, InputNumber, Select, ColorPicker, Row, Col, Collapse, Tooltip, Radio, Tag, Modal, Statistic } from 'antd';
import { SaveOutlined, ReloadOutlined, QuestionCircleOutlined, ExportOutlined, LayoutOutlined, AppstoreOutlined, SettingOutlined, LinkOutlined, ThunderboltOutlined } from '@ant-design/icons';
import api from '../services/api';

const { TextArea } = Input;
const { Title, Text, Paragraph } = Typography;

// 固定链接结构类型
type PermalinkStructure = 'plain' | 'id' | 'name' | 'custom';

interface PermalinkConfig {
  structure: PermalinkStructure;
  customPattern?: string;
}

interface ExitModalConfig {
  enabled: boolean;
  title: string;
  description: string;
  confirmText: string;
  cancelText: string;
  showReport: boolean;
  reportText: string;
  autoRedirect: boolean;
  autoRedirectSeconds: number;
  openInNewWindow: boolean;
  showAd: boolean;
  adCode: string;
  adPosition: 'top' | 'bottom';
  pageOverrides?: {
    [pageSlug: string]: {
      enabled?: boolean;
      title?: string;
      description?: string;
    };
  };
}

interface PageGlobalConfig {
  defaultLayout: 'grid' | 'list';
  gridColumns: number;
  showSidebar: boolean;
  sidebarPosition: 'left' | 'right';
  cardStyle: 'default' | 'compact' | 'detailed';
  showCardTags: boolean;
  showCardDescription: boolean;
  maxDescriptionLines: number;
  defaultPageSize: number;
  showPagination: boolean;
  showSearch: boolean;
  searchPlaceholder: string;
  defaultThemeColor: string;
  enableDarkMode: boolean;
  websiteClickMode: 'detail' | 'direct';
  detailPageNewWindow: boolean;
}

interface DetailSidebarConfig {
  enabled: boolean;
  showRelated: boolean;
  relatedTitle: string;
  relatedCount: number;
  relatedMode: 'auto' | 'manual';
  manualWebsiteIds: string[];
  showTags: boolean;
  tagsTitle: string;
  showCategory: boolean;
  categoryTitle: string;
  visitBtnText: string;
}

// 详情页全局设置
interface DetailPageConfig {
  // 版权信息
  copyrightEnabled: boolean;
  copyrightText: string;
  copyrightLink: string;
  // 免责声明
  disclaimerEnabled: boolean;
  disclaimerText: string;
  // 底部提示
  footerTipEnabled: boolean;
  footerTipText: string;
  // 分享设置
  shareEnabled: boolean;
  shareText: string;
  // 举报设置
  reportEnabled: boolean;
  reportText: string;
  reportEmail: string;
}

const defaultExitModalConfig: ExitModalConfig = {
  enabled: false,
  title: '即将离开本站',
  description: '您即将访问第三方网站，请注意保护个人信息安全。',
  confirmText: '继续访问',
  cancelText: '返回',
  showReport: true,
  reportText: '举报此链接',
  autoRedirect: false,
  autoRedirectSeconds: 5,
  openInNewWindow: true,
  showAd: false,
  adCode: '',
  adPosition: 'bottom',
};

const defaultPageGlobalConfig: PageGlobalConfig = {
  defaultLayout: 'grid',
  gridColumns: 4,
  showSidebar: true,
  sidebarPosition: 'left',
  cardStyle: 'default',
  showCardTags: true,
  showCardDescription: true,
  maxDescriptionLines: 2,
  defaultPageSize: 20,
  showPagination: true,
  showSearch: true,
  searchPlaceholder: '搜索工具...',
  defaultThemeColor: '#2563EB',
  enableDarkMode: false,
  websiteClickMode: 'detail',
  detailPageNewWindow: false,
};

const defaultDetailSidebarConfig: DetailSidebarConfig = {
  enabled: true,
  showRelated: true,
  relatedTitle: '你可能还喜欢',
  relatedCount: 6,
  relatedMode: 'auto',
  manualWebsiteIds: [],
  showTags: true,
  tagsTitle: '深入探索',
  showCategory: true,
  categoryTitle: '相关分类',
  visitBtnText: '访问网站',
};

const defaultDetailPageConfig: DetailPageConfig = {
  copyrightEnabled: true,
  copyrightText: '本站收录的网站资源均来自互联网，仅供学习和研究使用。',
  copyrightLink: '',
  disclaimerEnabled: true,
  disclaimerText: '免责声明：本站不对所收录网站的内容、安全性、合法性负责，访问时请注意甄别。',
  footerTipEnabled: true,
  footerTipText: '如果您发现本页面收录的网站存在问题，欢迎向我们反馈。',
  shareEnabled: true,
  shareText: '分享给朋友',
  reportEnabled: true,
  reportText: '举报问题',
  reportEmail: '',
};

export default function WebsiteConfig() {
  const [activeSection, setActiveSection] = useState<string>('redirect');
  const [exitModalForm] = Form.useForm();
  const [pageGlobalForm] = Form.useForm();
  const [sidebarForm] = Form.useForm();
  const [permalinkForm] = Form.useForm();
  const [detailPageForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [websites, setWebsites] = useState<Array<{ id: string; name: string }>>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  
  // 固定链接相关状态
  const [permalinkStructure, setPermalinkStructure] = useState<PermalinkStructure>('plain');
  const [customPattern, setCustomPattern] = useState('');
  const [slugStats, setSlugStats] = useState({ total: 0, withSlug: 0, withoutSlug: 0 });
  const [generating, setGenerating] = useState(false);
  const [generateModalVisible, setGenerateModalVisible] = useState(false);

  // 示例数据
  const exampleWebsite = { id: 'cmk13m4gx007t', slug: 'dribbble', name: 'Dribbble' };

  useEffect(() => {
    fetchAllConfig();
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

  const fetchAllConfig = async () => {
    setLoading(true);
    try {
      // 并行获取所有配置
      const [exitRes, pageRes, sidebarRes, permalinkRes, detailPageRes] = await Promise.allSettled([
        api.get('/admin/settings/settings/exitModalConfig'),
        api.get('/admin/settings/settings/pageGlobalConfig'),
        api.get('/admin/settings/settings/detailSidebarConfig'),
        api.get('/admin/settings/permalink'),
        api.get('/admin/settings/settings/detailPageConfig'),
      ]);

      if (exitRes.status === 'fulfilled') {
        const config = exitRes.value.data.value || defaultExitModalConfig;
        const pageOverridesList = config.pageOverrides 
          ? Object.entries(config.pageOverrides).map(([pageSlug, cfg]) => ({
              pageSlug,
              ...(cfg as { enabled?: boolean; title?: string; description?: string })
            }))
          : [];
        exitModalForm.setFieldsValue({ ...config, pageOverridesList });
      } else {
        exitModalForm.setFieldsValue(defaultExitModalConfig);
      }

      if (pageRes.status === 'fulfilled') {
        pageGlobalForm.setFieldsValue(pageRes.value.data.value || defaultPageGlobalConfig);
      } else {
        pageGlobalForm.setFieldsValue(defaultPageGlobalConfig);
      }

      if (sidebarRes.status === 'fulfilled') {
        sidebarForm.setFieldsValue(sidebarRes.value.data.value || defaultDetailSidebarConfig);
      } else {
        sidebarForm.setFieldsValue(defaultDetailSidebarConfig);
      }

      if (permalinkRes.status === 'fulfilled') {
        const data = permalinkRes.value.data.data || { structure: 'plain', customPattern: '' };
        setPermalinkStructure(data.structure || 'plain');
        setCustomPattern(data.customPattern || '');
        permalinkForm.setFieldsValue(data);
      } else {
        permalinkForm.setFieldsValue({ structure: 'plain', customPattern: '' });
      }

      if (detailPageRes.status === 'fulfilled') {
        detailPageForm.setFieldsValue(detailPageRes.value.data.value || defaultDetailPageConfig);
      } else {
        detailPageForm.setFieldsValue(defaultDetailPageConfig);
      }
    } catch (error) {
      console.error('获取配置失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveExitModal = async (values: ExitModalConfig & { pageOverridesList?: Array<{ pageSlug: string; enabled?: boolean; title?: string; description?: string }> }) => {
    setSaving(true);
    try {
      const pageOverrides: ExitModalConfig['pageOverrides'] = {};
      if (values.pageOverridesList?.length) {
        values.pageOverridesList.forEach(item => {
          if (item.pageSlug) {
            pageOverrides[item.pageSlug] = {
              enabled: item.enabled,
              title: item.title,
              description: item.description
            };
          }
        });
      }
      
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { pageOverridesList, ...restValues } = values;
      const configToSave = { 
        ...defaultExitModalConfig, 
        ...restValues,
        pageOverrides: Object.keys(pageOverrides).length > 0 ? pageOverrides : undefined
      };
      
      await api.put('/admin/settings/settings/exitModalConfig', { value: configToSave });
      await api.put('/admin/settings/settings/exitModalEnabled', { value: configToSave.enabled });
      message.success('跳转提醒配置保存成功');
    } catch (error) {
      console.error('保存失败:', error);
      message.error('保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleSavePageGlobal = async (values: PageGlobalConfig) => {
    setSaving(true);
    try {
      const processedValues = {
        ...defaultPageGlobalConfig,
        ...values,
        defaultThemeColor: typeof values.defaultThemeColor === 'object' 
          ? (values.defaultThemeColor as { toHexString?: () => string }).toHexString?.() || '#2563EB'
          : values.defaultThemeColor,
      };
      await api.put('/admin/settings/settings/pageGlobalConfig', { value: processedValues });
      message.success('页面配置保存成功');
    } catch (error) {
      console.error('保存失败:', error);
      message.error('保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSidebar = async (values: DetailSidebarConfig) => {
    setSaving(true);
    try {
      await api.put('/admin/settings/settings/detailSidebarConfig', { value: values });
      message.success('侧边栏配置保存成功');
    } catch (error) {
      console.error('保存失败:', error);
      message.error('保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDetailPage = async (values: DetailPageConfig) => {
    setSaving(true);
    try {
      await api.put('/admin/settings/settings/detailPageConfig', { value: values });
      message.success('详情页配置保存成功');
    } catch (error) {
      console.error('保存失败:', error);
      message.error('保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleSavePermalink = async (values: PermalinkConfig) => {
    setSaving(true);
    try {
      await api.put('/admin/settings/permalink', values);
      message.success('固定链接设置已保存');
    } catch (error) {
      console.error('保存失败:', error);
      message.error('保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleBatchGenerate = async (dryRun: boolean = false) => {
    setGenerating(true);
    try {
      const res = await api.post('/websites/batch-generate-slugs', { dryRun });
      if (res.data.success) {
        message.success(res.data.message);
        fetchSlugStats();
      }
    } catch (error) {
      console.error('批量生成失败:', error);
      message.error('批量生成固定链接失败');
    } finally {
      setGenerating(false);
      setGenerateModalVisible(false);
    }
  };

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

  const handleSearchWebsites = async (keyword: string) => {
    if (!keyword) {
      setWebsites([]);
      return;
    }
    setSearchLoading(true);
    try {
      const res = await api.get('/websites', { params: { search: keyword, pageSize: 20 } });
      const data = res.data.data || res.data || [];
      setWebsites(data.map((w: any) => ({ id: w.id, name: w.name })));
    } catch {
      setWebsites([]);
    } finally {
      setSearchLoading(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 50 }}>加载中...</div>;
  }

  // 配置区块数据
  const configSections = [
    { key: 'redirect', label: '跳转提醒', icon: <ExportOutlined />, desc: '外链跳转安全提醒' },
    { key: 'layout', label: '页面布局', icon: <LayoutOutlined />, desc: '列表页布局配置' },
    { key: 'sidebar', label: '详情页侧边栏', icon: <AppstoreOutlined />, desc: '详情页右侧内容' },
    { key: 'detailPage', label: '详情页设置', icon: <SettingOutlined />, desc: '版权信息等全局配置' },
    { key: 'permalink', label: '固定链接', icon: <LinkOutlined />, desc: 'URL结构配置' },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}>
          <SettingOutlined style={{ marginRight: 8 }} />
          网站配置
        </Title>
        <Text type="secondary">管理前端页面的显示和交互行为</Text>
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
          {/* 跳转提醒配置 */}
          {activeSection === 'redirect' && (
            <Card title="跳转提醒配置" extra={<Text type="secondary">控制外链跳转时的安全提醒</Text>}>
              <Form form={exitModalForm} layout="vertical" onFinish={handleSaveExitModal} initialValues={defaultExitModalConfig}>
                <Alert
                  message="当用户点击外部链接时，会显示安全提醒弹窗，可自定义弹窗内容和行为。"
                  type="info"
                  showIcon
                  style={{ marginBottom: 24 }}
                />

                <Row gutter={24}>
                  <Col span={12}>
                    <Form.Item name="enabled" label="启用跳转提醒" valuePropName="checked">
                      <Switch checkedChildren="开启" unCheckedChildren="关闭" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item 
                      name="openInNewWindow" 
                      label={
                        <Space>
                          新窗口打开
                          <Tooltip title="开启后，点击确认按钮会在新窗口打开目标网站">
                            <QuestionCircleOutlined style={{ color: '#999' }} />
                          </Tooltip>
                        </Space>
                      } 
                      valuePropName="checked"
                    >
                      <Switch checkedChildren="开启" unCheckedChildren="关闭" />
                    </Form.Item>
                  </Col>
                </Row>

                <Collapse 
                  ghost 
                  defaultActiveKey={['text']}
                  items={[
                    {
                      key: 'text',
                      label: '弹窗文案',
                      children: (
                        <>
                          <Row gutter={16}>
                            <Col span={12}>
                              <Form.Item name="title" label="弹窗标题" rules={[{ required: true }]}>
                                <Input placeholder="即将离开本站" />
                              </Form.Item>
                            </Col>
                            <Col span={12}>
                              <Form.Item name="confirmText" label="确认按钮" rules={[{ required: true }]}>
                                <Input placeholder="继续访问" />
                              </Form.Item>
                            </Col>
                          </Row>
                          <Form.Item name="description" label="提示描述" rules={[{ required: true }]}>
                            <TextArea rows={2} placeholder="您即将访问第三方网站..." />
                          </Form.Item>
                          <Row gutter={16}>
                            <Col span={12}>
                              <Form.Item name="cancelText" label="取消按钮">
                                <Input placeholder="返回" />
                              </Form.Item>
                            </Col>
                            <Col span={12}>
                              <Form.Item name="reportText" label="举报按钮">
                                <Input placeholder="举报此链接" />
                              </Form.Item>
                            </Col>
                          </Row>
                          <Form.Item name="showReport" label="显示举报按钮" valuePropName="checked">
                            <Switch size="small" />
                          </Form.Item>
                        </>
                      ),
                    },
                    {
                      key: 'auto',
                      label: '自动跳转',
                      children: (
                        <Row gutter={16}>
                          <Col span={12}>
                            <Form.Item name="autoRedirect" label="启用自动跳转" valuePropName="checked">
                              <Switch size="small" />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item name="autoRedirectSeconds" label="倒计时秒数">
                              <InputNumber min={1} max={30} addonAfter="秒" style={{ width: '100%' }} />
                            </Form.Item>
                          </Col>
                        </Row>
                      ),
                    },
                    {
                      key: 'ad',
                      label: '弹窗广告',
                      children: (
                        <>
                          <Row gutter={16}>
                            <Col span={12}>
                              <Form.Item name="showAd" label="显示广告" valuePropName="checked">
                                <Switch size="small" />
                              </Form.Item>
                            </Col>
                            <Col span={12}>
                              <Form.Item name="adPosition" label="广告位置">
                                <Select options={[
                                  { value: 'top', label: '弹窗顶部' },
                                  { value: 'bottom', label: '弹窗底部' },
                                ]} />
                              </Form.Item>
                            </Col>
                          </Row>
                          <Form.Item name="adCode" label="广告代码">
                            <TextArea rows={3} placeholder="<!-- 广告代码 -->" style={{ fontFamily: 'monospace' }} />
                          </Form.Item>
                        </>
                      ),
                    },
                    {
                      key: 'page',
                      label: '页面级配置',
                      children: (
                        <>
                          <Paragraph type="secondary" style={{ marginBottom: 16 }}>
                            为特定页面单独设置跳转提醒。页面标识：ai, uiux, design, 3d, font 等。
                          </Paragraph>
                          <Form.List name="pageOverridesList">
                            {(fields, { add, remove }) => (
                              <>
                                {fields.map(({ key, name, ...restField }) => (
                                  <Row key={key} gutter={8} style={{ marginBottom: 8 }}>
                                    <Col span={6}>
                                      <Form.Item {...restField} name={[name, 'pageSlug']} noStyle>
                                        <Input placeholder="页面标识" />
                                      </Form.Item>
                                    </Col>
                                    <Col span={4}>
                                      <Form.Item {...restField} name={[name, 'enabled']} valuePropName="checked" noStyle>
                                        <Switch checkedChildren="启用" unCheckedChildren="禁用" />
                                      </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                      <Form.Item {...restField} name={[name, 'title']} noStyle>
                                        <Input placeholder="自定义标题（可选）" />
                                      </Form.Item>
                                    </Col>
                                    <Col span={2}>
                                      <Button type="link" danger onClick={() => remove(name)}>删除</Button>
                                    </Col>
                                  </Row>
                                ))}
                                <Button type="dashed" onClick={() => add({ enabled: true })} block>
                                  + 添加页面配置
                                </Button>
                              </>
                            )}
                          </Form.List>
                        </>
                      ),
                    },
                  ]}
                />

                <Divider />
                <Form.Item>
                  <Space>
                    <Button type="primary" htmlType="submit" loading={saving} icon={<SaveOutlined />}>保存配置</Button>
                    <Button icon={<ReloadOutlined />} onClick={fetchAllConfig}>重置</Button>
                  </Space>
                </Form.Item>
              </Form>
            </Card>
          )}

          {/* 页面布局配置 */}
          {activeSection === 'layout' && (
            <Card title="页面布局配置" extra={<Text type="secondary">配置列表页的默认布局和样式</Text>}>
              <Form form={pageGlobalForm} layout="vertical" onFinish={handleSavePageGlobal} initialValues={defaultPageGlobalConfig}>
                <Collapse 
                  ghost 
                  defaultActiveKey={['click', 'layout']}
                  items={[
                    {
                      key: 'click',
                      label: '网址点击行为',
                      children: (
                        <>
                          <Form.Item 
                            name="websiteClickMode" 
                            label="点击网站卡片时"
                            extra="设置用户点击网站卡片时的跳转方式"
                          >
                            <Select 
                              style={{ width: '100%' }}
                              options={[
                                { value: 'detail', label: '跳转到详情页（推荐，支持评分、评论等功能）' },
                                { value: 'direct', label: '直接跳转外部网站（通过弹窗确认）' },
                              ]}
                            />
                          </Form.Item>
                          <Form.Item 
                            name="detailPageNewWindow" 
                            label="详情页新窗口打开" 
                            valuePropName="checked"
                            extra="开启后，点击网站卡片会在新窗口打开详情页"
                          >
                            <Switch />
                          </Form.Item>
                        </>
                      ),
                    },
                    {
                      key: 'layout',
                      label: '布局设置',
                      children: (
                        <>
                          <Row gutter={16}>
                            <Col span={8}>
                              <Form.Item name="defaultLayout" label="默认布局">
                                <Select options={[
                                  { value: 'grid', label: '网格布局' },
                                  { value: 'list', label: '列表布局' },
                                ]} />
                              </Form.Item>
                            </Col>
                            <Col span={8}>
                              <Form.Item name="gridColumns" label="网格列数">
                                <InputNumber min={2} max={6} style={{ width: '100%' }} />
                              </Form.Item>
                            </Col>
                            <Col span={8}>
                              <Form.Item name="sidebarPosition" label="侧边栏位置">
                                <Select options={[
                                  { value: 'left', label: '左侧' },
                                  { value: 'right', label: '右侧' },
                                ]} />
                              </Form.Item>
                            </Col>
                          </Row>
                          <Form.Item name="showSidebar" label="显示侧边栏" valuePropName="checked">
                            <Switch />
                          </Form.Item>
                        </>
                      ),
                    },
                    {
                      key: 'card',
                      label: '卡片样式',
                      children: (
                        <>
                          <Row gutter={16}>
                            <Col span={8}>
                              <Form.Item name="cardStyle" label="卡片样式">
                                <Select options={[
                                  { value: 'default', label: '默认样式' },
                                  { value: 'compact', label: '紧凑样式' },
                                  { value: 'detailed', label: '详细样式' },
                                ]} />
                              </Form.Item>
                            </Col>
                            <Col span={8}>
                              <Form.Item name="maxDescriptionLines" label="描述行数">
                                <InputNumber min={1} max={5} style={{ width: '100%' }} />
                              </Form.Item>
                            </Col>
                          </Row>
                          <Row gutter={16}>
                            <Col span={8}>
                              <Form.Item name="showCardTags" label="显示标签" valuePropName="checked">
                                <Switch />
                              </Form.Item>
                            </Col>
                            <Col span={8}>
                              <Form.Item name="showCardDescription" label="显示描述" valuePropName="checked">
                                <Switch />
                              </Form.Item>
                            </Col>
                          </Row>
                        </>
                      ),
                    },
                    {
                      key: 'pagination',
                      label: '分页和搜索',
                      children: (
                        <>
                          <Row gutter={16}>
                            <Col span={8}>
                              <Form.Item name="defaultPageSize" label="每页数量">
                                <Select options={[
                                  { value: 10, label: '10' },
                                  { value: 20, label: '20' },
                                  { value: 30, label: '30' },
                                  { value: 50, label: '50' },
                                ]} />
                              </Form.Item>
                            </Col>
                            <Col span={8}>
                              <Form.Item name="showPagination" label="显示分页" valuePropName="checked">
                                <Switch />
                              </Form.Item>
                            </Col>
                            <Col span={8}>
                              <Form.Item name="showSearch" label="显示搜索" valuePropName="checked">
                                <Switch />
                              </Form.Item>
                            </Col>
                          </Row>
                          <Form.Item name="searchPlaceholder" label="搜索占位文字">
                            <Input placeholder="搜索工具..." style={{ maxWidth: 300 }} />
                          </Form.Item>
                        </>
                      ),
                    },
                    {
                      key: 'theme',
                      label: '主题设置',
                      children: (
                        <Row gutter={16}>
                          <Col span={12}>
                            <Form.Item name="defaultThemeColor" label="主题色">
                              <ColorPicker showText />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item name="enableDarkMode" label="深色模式" valuePropName="checked">
                              <Switch />
                            </Form.Item>
                          </Col>
                        </Row>
                      ),
                    },
                  ]}
                />

                <Divider />
                <Form.Item>
                  <Space>
                    <Button type="primary" htmlType="submit" loading={saving} icon={<SaveOutlined />}>保存配置</Button>
                    <Button icon={<ReloadOutlined />} onClick={fetchAllConfig}>重置</Button>
                  </Space>
                </Form.Item>
              </Form>
            </Card>
          )}

          {/* 详情页侧边栏配置 */}
          {activeSection === 'sidebar' && (
            <Card title="详情页侧边栏配置" extra={<Text type="secondary">配置网站详情页右侧内容</Text>}>
              <Form form={sidebarForm} layout="vertical" onFinish={handleSaveSidebar} initialValues={defaultDetailSidebarConfig}>
                <Form.Item name="enabled" label="启用侧边栏" valuePropName="checked">
                  <Switch checkedChildren="开启" unCheckedChildren="关闭" />
                </Form.Item>

                <Collapse 
                  ghost 
                  defaultActiveKey={['related', 'button']}
                  items={[
                    {
                      key: 'button',
                      label: '访问按钮',
                      children: (
                        <Form.Item 
                          name="visitBtnText" 
                          label="按钮文字"
                          extra="详情页访问按钮的默认文字，单个网站可在编辑时单独设置"
                        >
                          <Input placeholder="访问网站" style={{ maxWidth: 200 }} />
                        </Form.Item>
                      ),
                    },
                    {
                      key: 'related',
                      label: '相关推荐',
                      children: (
                        <>
                          <Form.Item name="showRelated" label="显示相关推荐" valuePropName="checked">
                            <Switch />
                          </Form.Item>
                          <Row gutter={16}>
                            <Col span={12}>
                              <Form.Item name="relatedTitle" label="标题">
                                <Input placeholder="你可能还喜欢" />
                              </Form.Item>
                            </Col>
                            <Col span={12}>
                              <Form.Item name="relatedCount" label="推荐数量">
                                <InputNumber min={1} max={12} style={{ width: '100%' }} />
                              </Form.Item>
                            </Col>
                          </Row>
                          <Form.Item name="relatedMode" label="推荐模式">
                            <Select 
                              style={{ width: '100%' }}
                              options={[
                                { value: 'auto', label: '自动推荐（智能匹配同分类网站）' },
                                { value: 'manual', label: '手动配置（指定网站）' },
                              ]}
                            />
                          </Form.Item>
                          <Form.Item 
                            noStyle 
                            shouldUpdate={(prev, curr) => prev.relatedMode !== curr.relatedMode}
                          >
                            {({ getFieldValue }) => 
                              getFieldValue('relatedMode') === 'manual' && (
                                <Form.Item name="manualWebsiteIds" label="选择推荐网站">
                                  <Select
                                    mode="multiple"
                                    placeholder="搜索网站名称..."
                                    filterOption={false}
                                    onSearch={handleSearchWebsites}
                                    loading={searchLoading}
                                    options={websites.map(w => ({ value: w.id, label: w.name }))}
                                  />
                                </Form.Item>
                              )
                            }
                          </Form.Item>
                        </>
                      ),
                    },
                    {
                      key: 'tags',
                      label: '标签云',
                      children: (
                        <>
                          <Form.Item name="showTags" label="显示标签云" valuePropName="checked">
                            <Switch />
                          </Form.Item>
                          <Form.Item name="tagsTitle" label="标题">
                            <Input placeholder="深入探索" style={{ maxWidth: 200 }} />
                          </Form.Item>
                        </>
                      ),
                    },
                    {
                      key: 'category',
                      label: '分类导航',
                      children: (
                        <>
                          <Form.Item name="showCategory" label="显示分类导航" valuePropName="checked">
                            <Switch />
                          </Form.Item>
                          <Form.Item name="categoryTitle" label="标题">
                            <Input placeholder="相关分类" style={{ maxWidth: 200 }} />
                          </Form.Item>
                        </>
                      ),
                    },
                  ]}
                />

                <Divider />
                <Form.Item>
                  <Space>
                    <Button type="primary" htmlType="submit" loading={saving} icon={<SaveOutlined />}>保存配置</Button>
                    <Button icon={<ReloadOutlined />} onClick={fetchAllConfig}>重置</Button>
                  </Space>
                </Form.Item>
              </Form>
            </Card>
          )}

          {/* 详情页设置 */}
          {activeSection === 'detailPage' && (
            <Card title="详情页设置" extra={<Text type="secondary">配置所有详情页的通用内容</Text>}>
              <Form form={detailPageForm} layout="vertical" onFinish={handleSaveDetailPage} initialValues={defaultDetailPageConfig}>
                <Alert
                  message="这些设置会应用到所有网站详情页"
                  description="版权信息、免责声明等内容会显示在每个网站详情页的底部。"
                  type="info"
                  showIcon
                  style={{ marginBottom: 24 }}
                />

                <Collapse 
                  ghost 
                  defaultActiveKey={['copyright', 'disclaimer']}
                  items={[
                    {
                      key: 'copyright',
                      label: '版权信息',
                      children: (
                        <>
                          <Form.Item name="copyrightEnabled" label="显示版权信息" valuePropName="checked">
                            <Switch checkedChildren="显示" unCheckedChildren="隐藏" />
                          </Form.Item>
                          <Form.Item name="copyrightText" label="版权文字">
                            <TextArea 
                              rows={2} 
                              placeholder="本站收录的网站资源均来自互联网，仅供学习和研究使用。" 
                            />
                          </Form.Item>
                          <Form.Item name="copyrightLink" label="版权链接" extra="点击版权信息时跳转的链接（可选）">
                            <Input placeholder="https://example.com/copyright" />
                          </Form.Item>
                        </>
                      ),
                    },
                    {
                      key: 'disclaimer',
                      label: '免责声明',
                      children: (
                        <>
                          <Form.Item name="disclaimerEnabled" label="显示免责声明" valuePropName="checked">
                            <Switch checkedChildren="显示" unCheckedChildren="隐藏" />
                          </Form.Item>
                          <Form.Item name="disclaimerText" label="免责声明内容">
                            <TextArea 
                              rows={3} 
                              placeholder="免责声明：本站不对所收录网站的内容、安全性、合法性负责，访问时请注意甄别。" 
                            />
                          </Form.Item>
                        </>
                      ),
                    },
                    {
                      key: 'footer',
                      label: '底部提示',
                      children: (
                        <>
                          <Form.Item name="footerTipEnabled" label="显示底部提示" valuePropName="checked">
                            <Switch checkedChildren="显示" unCheckedChildren="隐藏" />
                          </Form.Item>
                          <Form.Item name="footerTipText" label="提示内容">
                            <TextArea 
                              rows={2} 
                              placeholder="如果您发现本页面收录的网站存在问题，欢迎向我们反馈。" 
                            />
                          </Form.Item>
                        </>
                      ),
                    },
                    {
                      key: 'share',
                      label: '分享设置',
                      children: (
                        <>
                          <Form.Item name="shareEnabled" label="显示分享按钮" valuePropName="checked">
                            <Switch checkedChildren="显示" unCheckedChildren="隐藏" />
                          </Form.Item>
                          <Form.Item name="shareText" label="分享按钮文字">
                            <Input placeholder="分享给朋友" style={{ maxWidth: 200 }} />
                          </Form.Item>
                        </>
                      ),
                    },
                    {
                      key: 'report',
                      label: '举报设置',
                      children: (
                        <>
                          <Form.Item name="reportEnabled" label="显示举报按钮" valuePropName="checked">
                            <Switch checkedChildren="显示" unCheckedChildren="隐藏" />
                          </Form.Item>
                          <Row gutter={16}>
                            <Col span={12}>
                              <Form.Item name="reportText" label="举报按钮文字">
                                <Input placeholder="举报问题" />
                              </Form.Item>
                            </Col>
                            <Col span={12}>
                              <Form.Item name="reportEmail" label="举报邮箱" extra="用户点击举报时发送邮件的地址">
                                <Input placeholder="report@example.com" />
                              </Form.Item>
                            </Col>
                          </Row>
                        </>
                      ),
                    },
                  ]}
                />

                <Divider />
                <Form.Item>
                  <Space>
                    <Button type="primary" htmlType="submit" loading={saving} icon={<SaveOutlined />}>保存配置</Button>
                    <Button icon={<ReloadOutlined />} onClick={fetchAllConfig}>重置</Button>
                  </Space>
                </Form.Item>
              </Form>
            </Card>
          )}

          {/* 固定链接配置 */}
          {activeSection === 'permalink' && (
            <Card title="固定链接设置" extra={<Text type="secondary">自定义网站详情页的 URL 结构</Text>}>
              <Form form={permalinkForm} layout="vertical" onFinish={handleSavePermalink}>
                <Alert
                  message="固定链接设置"
                  description="选择网站详情页的 URL 格式。使用固定链接（slug）可以让 URL 更简洁、更利于 SEO。"
                  type="info"
                  showIcon
                  style={{ marginBottom: 24 }}
                />

                <Collapse 
                  ghost 
                  defaultActiveKey={['structure', 'batch']}
                  items={[
                    {
                      key: 'structure',
                      label: 'URL 结构',
                      children: (
                        <>
                          <Form.Item name="structure">
                            <Radio.Group 
                              onChange={(e) => setPermalinkStructure(e.target.value)}
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

                          {permalinkStructure === 'custom' && (
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
                              {getPreviewUrl(permalinkStructure, customPattern)}
                            </Text>
                          </div>
                        </>
                      ),
                    },
                    {
                      key: 'batch',
                      label: '批量生成固定链接',
                      children: (
                        <>
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
                        </>
                      ),
                    },
                    {
                      key: 'help',
                      label: '说明',
                      children: (
                        <>
                          <Text strong>关于固定链接（Slug）：</Text>
                          <ul style={{ paddingLeft: 20, color: '#666', marginTop: 8 }}>
                            <li>固定链接是网站的唯一标识符，用于生成 SEO 友好的 URL</li>
                            <li>建议使用英文小写字母、数字和连字符（如：dribbble、figma-design）</li>
                            <li>如果网站没有设置固定链接，将自动使用 ID</li>
                            <li>可以在「网站管理」→「编辑网站」→「基本信息」中设置每个网站的固定链接</li>
                          </ul>
                        </>
                      ),
                    },
                  ]}
                />

                <Divider />
                <Form.Item>
                  <Space>
                    <Button type="primary" htmlType="submit" loading={saving} icon={<SaveOutlined />}>保存设置</Button>
                    <Button icon={<ReloadOutlined />} onClick={fetchAllConfig}>重置</Button>
                  </Space>
                </Form.Item>
              </Form>
            </Card>
          )}
        </Col>
      </Row>

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
