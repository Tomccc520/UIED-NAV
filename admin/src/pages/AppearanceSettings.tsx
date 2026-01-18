/**
 * @file pages/AppearanceSettings.tsx
 * @description 外观设置页面 - 主题模式和颜色配置（支持实时预览）
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Radio,
  ColorPicker,
  Button,
  Space,
  Typography,
  Divider,
  message,
  Row,
  Col,
  ConfigProvider,
  theme as antTheme
} from 'antd';
import {
  BulbOutlined,
  BgColorsOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  InfoCircleOutlined,
  WarningOutlined,
  ReloadOutlined,
  EyeOutlined
} from '@ant-design/icons';
import type { Color } from 'antd/es/color-picker';
import { useTheme } from '../contexts/ThemeContext';

const { Title, Text, Paragraph } = Typography;

interface AppearanceConfig {
  themeMode: 'light' | 'dark' | 'auto';
  primaryColor: string;
  successColor: string;
  warningColor: string;
  errorColor: string;
  infoColor: string;
}

const defaultConfig: AppearanceConfig = {
  themeMode: 'light',
  primaryColor: '#3B82F6',
  successColor: '#10B981',
  warningColor: '#F59E0B',
  errorColor: '#EF4444',
  infoColor: '#3B82F6'
};

const AppearanceSettings: React.FC = () => {
  const [form] = Form.useForm();
  const [config, setConfig] = useState<AppearanceConfig>(defaultConfig);
  const [previewMode, setPreviewMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const { mode, setThemeMode } = useTheme();

  // 加载保存的配置
  useEffect(() => {
    const savedConfig = localStorage.getItem('appearanceConfig');
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        setConfig(parsed);
        form.setFieldsValue(parsed);
      } catch (error) {
        console.error('加载配置失败:', error);
      }
    }
  }, [form]);

  // 处理表单值变化 - 实时预览
  const handleValuesChange = (changedValues: Partial<AppearanceConfig>, allValues: AppearanceConfig) => {
    setConfig(allValues);
    
    // 如果是主题模式变化，立即应用
    if (changedValues.themeMode && previewMode) {
      setThemeMode(changedValues.themeMode);
    }
  };

  // 切换预览模式
  const togglePreview = () => {
    setPreviewMode(!previewMode);
    if (!previewMode) {
      message.info('预览模式已开启，配置变更将实时显示');
    } else {
      message.info('预览模式已关闭');
    }
  };

  // 保存配置
  const handleSave = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();
      
      // 保存到 localStorage
      localStorage.setItem('appearanceConfig', JSON.stringify(values));
      
      // 应用主题模式
      setThemeMode(values.themeMode);
      
      // TODO: 调用 API 保存配置到数据库
      // await api.post('/appearance/save', values);
      
      message.success('外观配置已保存');
      setPreviewMode(false);
    } catch (error) {
      console.error('保存配置失败:', error);
      message.error('保存失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 取消预览
  const handleCancel = () => {
    // 恢复到保存的配置
    const savedConfig = localStorage.getItem('appearanceConfig');
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        setConfig(parsed);
        form.setFieldsValue(parsed);
        setThemeMode(parsed.themeMode);
      } catch (error) {
        console.error('恢复配置失败:', error);
      }
    } else {
      form.setFieldsValue(defaultConfig);
      setConfig(defaultConfig);
      setThemeMode(defaultConfig.themeMode);
    }
    setPreviewMode(false);
    message.info('已取消预览');
  };

  // 重置配置
  const handleReset = () => {
    form.setFieldsValue(defaultConfig);
    setConfig(defaultConfig);
    setThemeMode(defaultConfig.themeMode);
    localStorage.removeItem('appearanceConfig');
    message.info('已重置为默认配置');
  };

  // 生成预览主题
  const getPreviewTheme = () => {
    if (!previewMode) return undefined;
    
    return {
      token: {
        colorPrimary: config.primaryColor,
        colorSuccess: config.successColor,
        colorWarning: config.warningColor,
        colorError: config.errorColor,
        colorInfo: config.infoColor,
      }
    };
  };

  const content = (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>外观设置</Title>
        <Paragraph type="secondary">
          自定义管理后台的主题模式和颜色配置，打造个性化的工作环境
        </Paragraph>
      </div>

      <Form
        form={form}
        layout="vertical"
        initialValues={defaultConfig}
        onValuesChange={handleValuesChange}
      >
        {/* 主题模式配置 */}
        <Card
          title={
            <Space>
              <BulbOutlined />
              <span>主题模式</span>
            </Space>
          }
          style={{ marginBottom: '24px' }}
        >
          <Form.Item
            name="themeMode"
            label="选择主题模式"
            extra="自动模式将跟随系统设置"
          >
            <Radio.Group>
              <Radio.Button value="light">
                <Space>
                  <BulbOutlined />
                  亮色模式
                </Space>
              </Radio.Button>
              <Radio.Button value="dark">
                <Space>
                  <BulbOutlined />
                  暗色模式
                </Space>
              </Radio.Button>
              <Radio.Button value="auto">
                <Space>
                  <BulbOutlined />
                  自动切换
                </Space>
              </Radio.Button>
            </Radio.Group>
          </Form.Item>
        </Card>

        {/* 颜色配置 */}
        <Card
          title={
            <Space>
              <BgColorsOutlined />
              <span>颜色配置</span>
            </Space>
          }
          style={{ marginBottom: '24px' }}
        >
          <Paragraph type="secondary" style={{ marginBottom: '24px' }}>
            自定义系统颜色，所有组件将自动应用新的颜色方案
          </Paragraph>

          <Row gutter={[24, 24]}>
            <Col xs={24} sm={12} lg={8}>
              <Form.Item
                name="primaryColor"
                label={
                  <Space>
                    <BgColorsOutlined style={{ color: config.primaryColor }} />
                    <span>主色</span>
                  </Space>
                }
                extra="用于主要按钮、链接等"
              >
                <ColorPicker
                  showText
                  format="hex"
                  style={{ width: '100%' }}
                  onChange={(color: Color) => {
                    form.setFieldValue('primaryColor', color.toHexString());
                  }}
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} lg={8}>
              <Form.Item
                name="successColor"
                label={
                  <Space>
                    <CheckCircleOutlined style={{ color: config.successColor }} />
                    <span>成功色</span>
                  </Space>
                }
                extra="用于成功提示、确认按钮等"
              >
                <ColorPicker
                  showText
                  format="hex"
                  style={{ width: '100%' }}
                  onChange={(color: Color) => {
                    form.setFieldValue('successColor', color.toHexString());
                  }}
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} lg={8}>
              <Form.Item
                name="warningColor"
                label={
                  <Space>
                    <WarningOutlined style={{ color: config.warningColor }} />
                    <span>警告色</span>
                  </Space>
                }
                extra="用于警告提示、注意事项等"
              >
                <ColorPicker
                  showText
                  format="hex"
                  style={{ width: '100%' }}
                  onChange={(color: Color) => {
                    form.setFieldValue('warningColor', color.toHexString());
                  }}
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} lg={8}>
              <Form.Item
                name="errorColor"
                label={
                  <Space>
                    <CloseCircleOutlined style={{ color: config.errorColor }} />
                    <span>错误色</span>
                  </Space>
                }
                extra="用于错误提示、删除按钮等"
              >
                <ColorPicker
                  showText
                  format="hex"
                  style={{ width: '100%' }}
                  onChange={(color: Color) => {
                    form.setFieldValue('errorColor', color.toHexString());
                  }}
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} lg={8}>
              <Form.Item
                name="infoColor"
                label={
                  <Space>
                    <InfoCircleOutlined style={{ color: config.infoColor }} />
                    <span>信息色</span>
                  </Space>
                }
                extra="用于信息提示、帮助文本等"
              >
                <ColorPicker
                  showText
                  format="hex"
                  style={{ width: '100%' }}
                  onChange={(color: Color) => {
                    form.setFieldValue('infoColor', color.toHexString());
                  }}
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* 操作按钮 */}
        <Card>
          <Space size="middle">
            <Button
              type={previewMode ? 'default' : 'dashed'}
              icon={<EyeOutlined />}
              onClick={togglePreview}
            >
              {previewMode ? '关闭预览' : '开启预览'}
            </Button>
            {previewMode && (
              <>
                <Button
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  onClick={handleSave}
                  loading={loading}
                >
                  应用配置
                </Button>
                <Button
                  icon={<CloseCircleOutlined />}
                  onClick={handleCancel}
                >
                  取消
                </Button>
              </>
            )}
            {!previewMode && (
              <>
                <Button
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  onClick={handleSave}
                  loading={loading}
                >
                  保存配置
                </Button>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={handleReset}
                >
                  重置为默认
                </Button>
              </>
            )}
          </Space>
        </Card>
      </Form>
    </div>
  );

  // 如果开启预览模式，使用 ConfigProvider 包裹
  if (previewMode && getPreviewTheme()) {
    return (
      <ConfigProvider theme={getPreviewTheme()}>
        {content}
      </ConfigProvider>
    );
  }

  return content;
};

export default AppearanceSettings;
