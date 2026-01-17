/**
 * @file Account.tsx
 * @description 管理后台组件
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

import { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  message,
  Typography,
  Space,
  Divider,
  Avatar,
  Descriptions,
  Tag,
  Alert,
} from 'antd';
import {
  UserOutlined,
  LockOutlined,
  MailOutlined,
  SafetyOutlined,
  CrownOutlined,
} from '@ant-design/icons';
import api, { authApi } from '../services/api';

const { Title, Text } = Typography;

interface UserProfile {
  id: string;
  username: string;
  email: string | null;
  nickname: string | null;
  avatar: string | null;
  role: string;
  roleName: string;
  lastLoginAt: string | null;
  createdAt: string;
}

const roleColors: Record<string, string> = {
  super_admin: 'gold',
  admin: 'blue',
  editor: 'green',
};

const roleIcons: Record<string, React.ReactNode> = {
  super_admin: <CrownOutlined />,
  admin: <SafetyOutlined />,
  editor: <UserOutlined />,
};

export default function Account() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users/profile/me');
      setProfile(res.data);
      profileForm.setFieldsValue({
        nickname: res.data.nickname,
        email: res.data.email,
      });
    } catch (error: any) {
      message.error(error.response?.data?.message || '获取用户信息失败');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (values: any) => {
    setProfileLoading(true);
    try {
      await api.put('/users/profile/me', values);
      message.success('资料更新成功');
      fetchProfile();
      // 更新本地存储的用户信息
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        user.nickname = values.nickname;
        user.email = values.email;
        localStorage.setItem('user', JSON.stringify(user));
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '更新失败');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async (values: any) => {
    setPasswordLoading(true);
    try {
      await authApi.changePassword({
        oldPassword: values.oldPassword,
        newPassword: values.newPassword,
      });
      message.success('密码修改成功，即将跳转到登录页面...');
      passwordForm.resetFields();
      // 密码修改后自动登出，要求重新登录
      setTimeout(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }, 1500);
    } catch (error: any) {
      message.error(error.response?.data?.message || '密码修改失败');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}>
          <UserOutlined style={{ marginRight: 8 }} />
          账户设置
        </Title>
        <Text type="secondary">管理您的个人信息和账户安全</Text>
      </div>

      <div style={{ display: 'grid', gap: 24, gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))' }}>
        {/* 个人信息卡片 */}
        <Card title="个人信息" loading={loading}>
          {profile && (
            <>
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <Avatar size={80} icon={<UserOutlined />} src={profile.avatar} />
                <div style={{ marginTop: 12 }}>
                  <Text strong style={{ fontSize: 18 }}>
                    {profile.nickname || profile.username}
                  </Text>
                </div>
                <div style={{ marginTop: 8 }}>
                  <Tag color={roleColors[profile.role]} icon={roleIcons[profile.role]}>
                    {profile.roleName}
                  </Tag>
                </div>
              </div>

              <Descriptions column={1} size="small">
                <Descriptions.Item label="用户名">
                  <Text code>@{profile.username}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="邮箱">
                  {profile.email || <Text type="secondary">未设置</Text>}
                </Descriptions.Item>
                <Descriptions.Item label="最后登录">
                  {profile.lastLoginAt
                    ? new Date(profile.lastLoginAt).toLocaleString()
                    : <Text type="secondary">从未登录</Text>}
                </Descriptions.Item>
                <Descriptions.Item label="注册时间">
                  {new Date(profile.createdAt).toLocaleDateString()}
                </Descriptions.Item>
              </Descriptions>

              <Divider />

              <Form
                form={profileForm}
                layout="vertical"
                onFinish={handleUpdateProfile}
              >
                <Form.Item name="nickname" label="昵称">
                  <Input
                    prefix={<UserOutlined style={{ color: '#bfbfbf' }} />}
                    placeholder="请输入昵称"
                  />
                </Form.Item>
                <Form.Item
                  name="email"
                  label="邮箱"
                  rules={[{ type: 'email', message: '请输入有效的邮箱地址' }]}
                >
                  <Input
                    prefix={<MailOutlined style={{ color: '#bfbfbf' }} />}
                    placeholder="请输入邮箱"
                  />
                </Form.Item>
                <Form.Item>
                  <Button type="primary" htmlType="submit" loading={profileLoading}>
                    保存修改
                  </Button>
                </Form.Item>
              </Form>
            </>
          )}
        </Card>

        {/* 修改密码卡片 */}
        <Card
          title={
            <Space>
              <LockOutlined />
              修改密码
            </Space>
          }
        >
          <Alert
            message="密码安全提示"
            description="建议使用包含大小写字母、数字和特殊字符的强密码，长度至少8位。"
            type="info"
            showIcon
            style={{ marginBottom: 24 }}
          />

          <Form
            form={passwordForm}
            layout="vertical"
            onFinish={handleChangePassword}
          >
            <Form.Item
              name="oldPassword"
              label="当前密码"
              rules={[{ required: true, message: '请输入当前密码' }]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: '#bfbfbf' }} />}
                placeholder="请输入当前密码"
              />
            </Form.Item>

            <Form.Item
              name="newPassword"
              label="新密码"
              rules={[
                { required: true, message: '请输入新密码' },
                { min: 6, message: '密码长度至少6位' },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: '#bfbfbf' }} />}
                placeholder="请输入新密码（至少6位）"
              />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              label="确认新密码"
              dependencies={['newPassword']}
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
              <Input.Password
                prefix={<LockOutlined style={{ color: '#bfbfbf' }} />}
                placeholder="请再次输入新密码"
              />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" loading={passwordLoading}>
                修改密码
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </div>
    </div>
  );
}
