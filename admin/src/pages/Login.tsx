/**
 * @file Login.tsx
 * @description 管理后台组件
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

import { useState } from 'react';
import { Form, Input, Button, Card, message, Typography, Space, Alert } from 'antd';
import { UserOutlined, LockOutlined, SafetyOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const { Title, Text } = Typography;

interface LoginForm {
  username: string;
  password: string;
}

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (values: LoginForm) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/auth/login', values);
      const { token, user } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      message.success(`欢迎回来，${user.nickname || user.username}！`);
      navigate('/dashboard');
    } catch (error: any) {
      console.error('登录错误:', error);
      const errorMsg = error.response?.data?.message || error.response?.data?.error || error.message || '登录失败，请检查网络连接';
      setError(errorMsg);
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f0f2f5',
      }}
    >
      <Card
        style={{
          width: 400,
          borderRadius: 8,
        }}
      >
        {/* Logo 和标题 */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div
            style={{
              display: 'inline-block',
              padding: 12,
              background: '#1890ff',
              borderRadius: 8,
              marginBottom: 16,
            }}
          >
            <img
              src="/logo.svg"
              alt="UIED"
              style={{ height: 40, display: 'block' }}
            />
          </div>
          <Title level={3} style={{ margin: '0 0 8px 0' }}>
            UIED 管理后台
          </Title>
          <Text type="secondary">设计导航内容管理系统</Text>
        </div>

        {/* 错误提示 */}
        {error && (
          <Alert
            message={error}
            type="error"
            showIcon
            closable
            onClose={() => setError(null)}
            style={{ marginBottom: 16 }}
          />
        )}

        {/* 登录表单 */}
        <Form name="login" onFinish={handleLogin} size="large">
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input
              prefix={<UserOutlined style={{ color: '#bfbfbf' }} />}
              placeholder="用户名"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#bfbfbf' }} />}
              placeholder="密码"
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              登录
            </Button>
          </Form.Item>
        </Form>

        {/* 安全提示 */}
        <div
          style={{
            padding: 12,
            background: '#f6f8fa',
            borderRadius: 6,
            border: '1px solid #e1e4e8',
          }}
        >
          <Space direction="vertical" size={4} style={{ width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <SafetyOutlined style={{ color: '#1890ff' }} />
              <Text strong style={{ fontSize: 13 }}>
                安全提示
              </Text>
            </div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              请使用管理员账号登录，如忘记密码请联系系统管理员
            </Text>
          </Space>
        </div>
      </Card>
    </div>
  );
}
