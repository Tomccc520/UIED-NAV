/**
 * @file WebsiteConfig.tsx
 * @description 网站配置管理 - 跳转提醒、页面全局配置
 */

import { useEffect, useState } from 'react';
import { Card, Form, Input, Switch, Button, message, Space, Tabs, Typography, Alert, Divider, InputNumber, Select, ColorPicker } from 'antd';
import { SaveOutlined, ReloadOutlined, LinkOutlined, NotificationOutlined, LayoutOutlined } from '@ant-design/icons';
import api from '../services/api';

const { TextArea } = Input;
const { Title, Text } = Typography;

interface ExitModalConfig {
  enabled: boolean;
  title: string;
  description: string;
  confirmText: string;
  cancelText: string;
  showReport: boolean;
  reportText: string;
  // 自动跳转配置
  autoRedirect: boolean;
  autoRedirectSeconds: number;
  // 弹窗广告配置
  showAd: boolean;
  adCode: string;
  adPosition: 'top' | 'bottom';
  // 热门推荐跳转弹窗
  hotRecommendationsEnabled: boolean;
  // 页面级配置 - 可以为特定页面单独设置
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
}

const defaultExitModalConfig: ExitModalConfig = {
  enabled: true,
  title: '即将离开本站',
  description: '您即将访问第三方网站，请注意保护个人信息安全。',
  confirmText: '继续访问',
  cancelText: '返回',
  showReport: true,
  reportText: '举报此链接',
  autoRedirect: false,
  autoRedirectSeconds: 5,
  showAd: false,
  adCode: '',
  adPosition: 'bottom',
  hotRecommendationsEnabled: true,
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
};

export default function WebsiteConfig() {
  const [exitModalForm] = Form.useForm();
  const [pageGlobalForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      // 获取跳转提醒配置
      try {
        const exitRes = await api.get('/admin/settings/settings/exitModalConfig');
        const exitConfig = exitRes.data.value || defaultExitModalConfig;
        // 将 pageOverrides 对象转换为 pageOverridesList 数组供表单使用
        const pageOverridesList = exitConfig.pageOverrides 
          ? Object.entries(exitConfig.pageOverrides).map(([pageSlug, config]) => ({
              pageSlug,
              ...(config as { enabled?: boolean; title?: string; description?: string })
            }))
          : [];
        exitModalForm.setFieldsValue({ ...exitConfig, pageOverridesList });
      } catch {
        exitModalForm.setFieldsValue(defaultExitModalConfig);
      }

      // 获取页面全局配置
      try {
        const pageRes = await api.get('/admin/settings/settings/pageGlobalConfig');
        pageGlobalForm.setFieldsValue(pageRes.data.value || defaultPageGlobalConfig);
      } catch {
        pageGlobalForm.setFieldsValue(defaultPageGlobalConfig);
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
      // 将 pageOverridesList 数组转换为 pageOverrides 对象
      const pageOverrides: ExitModalConfig['pageOverrides'] = {};
      if (values.pageOverridesList && values.pageOverridesList.length > 0) {
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
      message.success('页面全局配置保存成功');
    } catch (error) {
      console.error('保存失败:', error);
      message.error('保存失败');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 50 }}>加载中...</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}>
          <LinkOutlined style={{ marginRight: 8 }} />
          网站配置
        </Title>
        <Text type="secondary">管理跳转提醒、页面全局配置等网站功能</Text>
      </div>

      <Tabs
        items={[
          {
            key: 'exitModal',
            label: <span><NotificationOutlined /> 跳转提醒</span>,
            children: (
              <Card>
                <Alert
                  message="跳转提醒说明"
                  description="当用户点击外部链接时，会显示安全提醒弹窗。您可以自定义弹窗的文案内容和广告。"
                  type="info"
                  showIcon
                  style={{ marginBottom: 24 }}
                />

                <Form form={exitModalForm} layout="vertical" onFinish={handleSaveExitModal} initialValues={defaultExitModalConfig}>
                  <Form.Item name="enabled" label="全局启用跳转提醒" valuePropName="checked" extra="控制所有页面的跳转提醒功能">
                    <Switch checkedChildren="开启" unCheckedChildren="关闭" />
                  </Form.Item>

                  <Form.Item name="hotRecommendationsEnabled" label="热门推荐跳转提醒" valuePropName="checked" extra="单独控制热门推荐区域的跳转提醒">
                    <Switch checkedChildren="开启" unCheckedChildren="关闭" />
                  </Form.Item>

                  <Divider>弹窗文案配置</Divider>

                  <Form.Item name="title" label="弹窗标题" rules={[{ required: true, message: '请输入弹窗标题' }]}>
                    <Input placeholder="即将离开本站" />
                  </Form.Item>

                  <Form.Item name="description" label="提示描述" rules={[{ required: true, message: '请输入提示描述' }]}>
                    <TextArea rows={3} placeholder="您即将访问第三方网站，请注意保护个人信息安全。" />
                  </Form.Item>

                  <Form.Item name="confirmText" label="确认按钮文字" rules={[{ required: true, message: '请输入确认按钮文字' }]}>
                    <Input placeholder="继续访问" style={{ maxWidth: 200 }} />
                  </Form.Item>

                  <Form.Item name="cancelText" label="取消按钮文字" rules={[{ required: true, message: '请输入取消按钮文字' }]}>
                    <Input placeholder="返回" style={{ maxWidth: 200 }} />
                  </Form.Item>

                  <Divider>自动跳转配置</Divider>

                  <Form.Item name="autoRedirect" label="启用自动跳转" valuePropName="checked" extra="开启后弹窗会在倒计时结束后自动跳转到目标网站">
                    <Switch checkedChildren="开启" unCheckedChildren="关闭" />
                  </Form.Item>

                  <Form.Item name="autoRedirectSeconds" label="自动跳转秒数" extra="倒计时秒数，建议 3-10 秒">
                    <InputNumber min={1} max={30} style={{ width: 120 }} addonAfter="秒" />
                  </Form.Item>

                  <Divider>举报功能</Divider>

                  <Form.Item name="showReport" label="显示举报按钮" valuePropName="checked">
                    <Switch checkedChildren="显示" unCheckedChildren="隐藏" />
                  </Form.Item>

                  <Form.Item name="reportText" label="举报按钮文字">
                    <Input placeholder="举报此链接" style={{ maxWidth: 200 }} />
                  </Form.Item>

                  <Divider>弹窗广告配置</Divider>

                  <Form.Item name="showAd" label="显示广告" valuePropName="checked" extra="在跳转提醒弹窗中显示广告">
                    <Switch checkedChildren="显示" unCheckedChildren="隐藏" />
                  </Form.Item>

                  <Form.Item name="adPosition" label="广告位置">
                    <Select style={{ width: 150 }}>
                      <Select.Option value="top">弹窗顶部</Select.Option>
                      <Select.Option value="bottom">弹窗底部</Select.Option>
                    </Select>
                  </Form.Item>

                  <Form.Item name="adCode" label="广告代码" extra="此广告代码仅用于跳转提醒弹窗内显示，与广告位管理中的横幅广告是独立的功能">
                    <TextArea rows={4} placeholder="<!-- 在此粘贴广告代码 -->" style={{ fontFamily: 'monospace' }} />
                  </Form.Item>

                  <Divider>页面级配置</Divider>
                  
                  <Alert
                    message="页面级配置说明"
                    description="可以为特定页面单独设置跳转提醒。留空则使用全局配置。页面标识：ai, uiux, design, 3d, font, ecommerce, interior 等。"
                    type="info"
                    showIcon
                    style={{ marginBottom: 16 }}
                  />

                  <Form.List name="pageOverridesList">
                    {(fields, { add, remove }) => (
                      <>
                        {fields.map(({ key, name, ...restField }) => (
                          <Space key={key} style={{ display: 'flex', marginBottom: 8, alignItems: 'flex-start' }} align="baseline">
                            <Form.Item {...restField} name={[name, 'pageSlug']} rules={[{ required: true, message: '请输入页面标识' }]}>
                              <Input placeholder="页面标识 (如: ai)" style={{ width: 120 }} />
                            </Form.Item>
                            <Form.Item {...restField} name={[name, 'enabled']} valuePropName="checked">
                              <Switch checkedChildren="启用" unCheckedChildren="禁用" />
                            </Form.Item>
                            <Form.Item {...restField} name={[name, 'title']}>
                              <Input placeholder="自定义标题（可选）" style={{ width: 180 }} />
                            </Form.Item>
                            <Button type="link" danger onClick={() => remove(name)}>删除</Button>
                          </Space>
                        ))}
                        <Form.Item>
                          <Button type="dashed" onClick={() => add({ enabled: true })} block style={{ maxWidth: 400 }}>
                            + 添加页面配置
                          </Button>
                        </Form.Item>
                      </>
                    )}
                  </Form.List>

                  <Form.Item>
                    <Space>
                      <Button type="primary" htmlType="submit" loading={saving} icon={<SaveOutlined />}>保存配置</Button>
                      <Button icon={<ReloadOutlined />} onClick={fetchConfig}>重置</Button>
                    </Space>
                  </Form.Item>
                </Form>
              </Card>
            ),
          },
          {
            key: 'pageGlobal',
            label: <span><LayoutOutlined /> 页面全局配置</span>,
            children: (
              <Card>
                <Alert
                  message="页面全局配置说明"
                  description="配置前端页面的默认布局、卡片样式、分页等全局设置。"
                  type="info"
                  showIcon
                  style={{ marginBottom: 24 }}
                />

                <Form form={pageGlobalForm} layout="vertical" onFinish={handleSavePageGlobal} initialValues={defaultPageGlobalConfig}>
                  <Divider>布局配置</Divider>

                  <Form.Item name="defaultLayout" label="默认布局方式">
                    <Select><Select.Option value="grid">网格布局</Select.Option><Select.Option value="list">列表布局</Select.Option></Select>
                  </Form.Item>

                  <Form.Item name="gridColumns" label="网格列数（桌面端）" extra="移动端会自动适配为单列">
                    <InputNumber min={2} max={6} style={{ width: 120 }} />
                  </Form.Item>

                  <Form.Item name="showSidebar" label="显示侧边栏" valuePropName="checked">
                    <Switch checkedChildren="显示" unCheckedChildren="隐藏" />
                  </Form.Item>

                  <Form.Item name="sidebarPosition" label="侧边栏位置">
                    <Select style={{ width: 120 }}><Select.Option value="left">左侧</Select.Option><Select.Option value="right">右侧</Select.Option></Select>
                  </Form.Item>

                  <Divider>卡片配置</Divider>

                  <Form.Item name="cardStyle" label="卡片样式">
                    <Select><Select.Option value="default">默认样式</Select.Option><Select.Option value="compact">紧凑样式</Select.Option><Select.Option value="detailed">详细样式</Select.Option></Select>
                  </Form.Item>

                  <Form.Item name="showCardTags" label="显示卡片标签" valuePropName="checked">
                    <Switch checkedChildren="显示" unCheckedChildren="隐藏" />
                  </Form.Item>

                  <Form.Item name="showCardDescription" label="显示卡片描述" valuePropName="checked">
                    <Switch checkedChildren="显示" unCheckedChildren="隐藏" />
                  </Form.Item>

                  <Form.Item name="maxDescriptionLines" label="描述最大行数">
                    <InputNumber min={1} max={5} style={{ width: 120 }} />
                  </Form.Item>

                  <Divider>分页配置</Divider>

                  <Form.Item name="defaultPageSize" label="每页显示数量">
                    <Select style={{ width: 120 }}><Select.Option value={10}>10</Select.Option><Select.Option value={20}>20</Select.Option><Select.Option value={30}>30</Select.Option><Select.Option value={50}>50</Select.Option></Select>
                  </Form.Item>

                  <Form.Item name="showPagination" label="显示分页" valuePropName="checked">
                    <Switch checkedChildren="显示" unCheckedChildren="隐藏" />
                  </Form.Item>

                  <Divider>搜索配置</Divider>

                  <Form.Item name="showSearch" label="显示搜索框" valuePropName="checked">
                    <Switch checkedChildren="显示" unCheckedChildren="隐藏" />
                  </Form.Item>

                  <Form.Item name="searchPlaceholder" label="搜索框占位文字">
                    <Input placeholder="搜索工具..." style={{ maxWidth: 300 }} />
                  </Form.Item>

                  <Divider>主题配置</Divider>

                  <Form.Item name="defaultThemeColor" label="默认主题色">
                    <ColorPicker showText />
                  </Form.Item>

                  <Form.Item name="enableDarkMode" label="启用深色模式" valuePropName="checked" extra="允许用户切换深色模式">
                    <Switch checkedChildren="启用" unCheckedChildren="禁用" />
                  </Form.Item>

                  <Form.Item>
                    <Space>
                      <Button type="primary" htmlType="submit" loading={saving} icon={<SaveOutlined />}>保存配置</Button>
                      <Button icon={<ReloadOutlined />} onClick={fetchConfig}>重置</Button>
                    </Space>
                  </Form.Item>
                </Form>
              </Card>
            ),
          },
        ]}
      />
    </div>
  );
}
