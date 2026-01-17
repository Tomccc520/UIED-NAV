/**
 * @file AiSettings.tsx
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
  Table,
  Button,
  Modal,
  Form,
  Input,
  Switch,
  Space,
  Tag,
  message,
  Popconfirm,
  Alert,
  Typography,
  Divider,
  Select,
  Tabs,
  Spin,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  RobotOutlined,
  ApiOutlined,
  SearchOutlined,
  MessageOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import api from '../services/api';

const { Text } = Typography;
const { TextArea } = Input;

interface AiConfig {
  id: string;
  name: string;
  provider: string;
  apiUrl: string;
  apiKey: string;
  model: string;
  enabled: boolean;
  isDefault: boolean;
  createdAt: string;
}

// SiliconFlow 常用模型列表
const COMMON_MODELS = [
  { value: 'Qwen/Qwen2.5-7B-Instruct', label: 'Qwen2.5-7B-Instruct (推荐)' },
  { value: 'Qwen/Qwen2.5-14B-Instruct', label: 'Qwen2.5-14B-Instruct' },
  { value: 'Qwen/Qwen2.5-32B-Instruct', label: 'Qwen2.5-32B-Instruct' },
  { value: 'Qwen/Qwen2.5-72B-Instruct', label: 'Qwen2.5-72B-Instruct' },
  { value: 'Qwen/QwQ-32B', label: 'QwQ-32B (推理模型)' },
  { value: 'deepseek-ai/DeepSeek-V3', label: 'DeepSeek-V3' },
  { value: 'deepseek-ai/DeepSeek-R1', label: 'DeepSeek-R1 (推理模型)' },
  { value: 'THUDM/glm-4-9b-chat', label: 'GLM-4-9B-Chat' },
  { value: 'Pro/Qwen/Qwen2.5-7B-Instruct', label: 'Pro/Qwen2.5-7B (高速)' },
  { value: 'Pro/deepseek-ai/DeepSeek-V3', label: 'Pro/DeepSeek-V3 (高速)' },
];

export default function AiSettings() {
  const [configs, setConfigs] = useState<AiConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);
  const [form] = Form.useForm();
  
  // AI 功能测试状态
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchMode, setSearchMode] = useState('');
  
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<{role: string; content: string}[]>([]);
  const [chatLoading, setChatLoading] = useState(false);

  const fetchConfigs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/ai-config');
      setConfigs(res.data);
    } catch (error) {
      message.error('获取配置失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  const handleAdd = () => {
    setEditingId(null);
    form.resetFields();
    form.setFieldsValue({
      provider: 'siliconflow',
      apiUrl: 'https://api.siliconflow.cn/v1/chat/completions',
      model: 'Qwen/Qwen2.5-7B-Instruct',
      enabled: true,
      isDefault: configs.length === 0,
    });
    setModalOpen(true);
  };

  const handleEdit = (record: AiConfig) => {
    setEditingId(record.id);
    form.setFieldsValue({
      ...record,
      apiKey: '',
    });
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/ai-config/${id}`);
      message.success('删除成功');
      fetchConfigs();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      if (editingId) {
        const data = values.apiKey ? values : { ...values, apiKey: undefined };
        await api.put(`/ai-config/${editingId}`, data);
        message.success('更新成功');
      } else {
        await api.post('/ai-config', values);
        message.success('创建成功');
      }
      setModalOpen(false);
      fetchConfigs();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleToggleEnabled = async (id: string, enabled: boolean) => {
    try {
      await api.put(`/ai-config/${id}`, { enabled });
      message.success(enabled ? '已启用' : '已禁用');
      fetchConfigs();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await api.put(`/ai-config/${id}`, { isDefault: true });
      message.success('已设为默认');
      fetchConfigs();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      const res = await api.post('/ai-config/generate-website-info', {
        url: 'https://www.figma.com',
      });
      message.success('测试成功！AI 返回: ' + res.data.name);
    } catch (error: any) {
      message.error('测试失败: ' + (error.response?.data?.error || error.message));
    } finally {
      setTesting(false);
    }
  };

  // AI 智能搜索
  const handleSmartSearch = async () => {
    if (!searchQuery.trim()) {
      message.warning('请输入搜索内容');
      return;
    }
    
    setSearchLoading(true);
    try {
      const res = await api.post('/ai-config/smart-search', {
        query: searchQuery,
        limit: 10,
      });
      setSearchResults(res.data.results || []);
      setSearchMode(res.data.mode || '');
      if (res.data.results?.length === 0) {
        message.info(res.data.message || '未找到相关工具');
      } else {
        message.success(res.data.message || `找到 ${res.data.results.length} 个相关工具`);
      }
    } catch (error: any) {
      message.error('搜索失败: ' + (error.response?.data?.error || error.message));
    } finally {
      setSearchLoading(false);
    }
  };

  // AI 对话
  const handleChat = async () => {
    if (!chatMessage.trim()) {
      message.warning('请输入消息');
      return;
    }
    
    const userMessage = chatMessage;
    setChatMessage('');
    setChatHistory(prev => [...prev, { role: 'user', content: userMessage }]);
    setChatLoading(true);
    
    try {
      const res = await api.post('/ai-config/chat', {
        message: userMessage,
        context: chatHistory.slice(-6),
      });
      setChatHistory(prev => [...prev, { role: 'assistant', content: res.data.reply }]);
    } catch (error: any) {
      message.error('对话失败: ' + (error.response?.data?.error || error.message));
      setChatHistory(prev => [...prev, { role: 'assistant', content: '抱歉，AI 服务暂时不可用。' }]);
    } finally {
      setChatLoading(false);
    }
  };

  const columns = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: AiConfig) => (
        <Space>
          <RobotOutlined style={{ color: record.enabled ? '#52c41a' : '#999' }} />
          <span style={{ fontWeight: 500 }}>{name}</span>
          {record.isDefault && <Tag color="blue">默认</Tag>}
        </Space>
      ),
    },
    {
      title: '提供商',
      dataIndex: 'provider',
      key: 'provider',
      render: (provider: string) => <Tag>{provider}</Tag>,
    },
    {
      title: '模型',
      dataIndex: 'model',
      key: 'model',
      ellipsis: true,
    },
    {
      title: 'API Key',
      dataIndex: 'apiKey',
      key: 'apiKey',
      render: (key: string) => <Text code style={{ fontSize: 12 }}>{key}</Text>,
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      key: 'enabled',
      render: (enabled: boolean, record: AiConfig) => (
        <Switch
          checked={enabled}
          onChange={(checked) => handleToggleEnabled(record.id, checked)}
          checkedChildren="启用"
          unCheckedChildren="禁用"
        />
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: AiConfig) => (
        <Space>
          {!record.isDefault && record.enabled && (
            <Button size="small" onClick={() => handleSetDefault(record.id)}>
              设为默认
            </Button>
          )}
          <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Popconfirm title="确定删除？" onConfirm={() => handleDelete(record.id)}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>
          <RobotOutlined style={{ marginRight: 8 }} />
          AI 助手配置
        </h2>
        <p style={{ color: '#666', fontSize: 14, marginTop: 8 }}>
          配置 AI 服务，用于智能搜索、对话助手和自动生成内容
        </p>
      </div>

      <Tabs
        defaultActiveKey="config"
        items={[
          {
            key: 'config',
            label: 'API 配置',
            children: (
              <>
                <Alert
                  message="使用说明"
                  description={
                    <div>
                      <p>AI 助手支持智能搜索、对话问答和自动生成网站信息等功能。</p>
                      <p>推荐使用 <a href="https://siliconflow.cn" target="_blank" rel="noopener noreferrer">SiliconFlow</a> 的 API，支持多种开源模型，部分模型免费使用。</p>
                    </div>
                  }
                  type="info"
                  showIcon
                  style={{ marginBottom: 16 }}
                />
                <Card>
                  <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
                    <Button 
                      icon={<ApiOutlined />} 
                      onClick={handleTest}
                      loading={testing}
                      disabled={configs.filter(c => c.enabled).length === 0}
                    >
                      测试连接
                    </Button>
                    <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                      添加配置
                    </Button>
                  </div>
                  <Table columns={columns} dataSource={configs} rowKey="id" loading={loading} pagination={false} />
                </Card>
              </>
            ),
          },
          {
            key: 'search',
            label: <span><SearchOutlined /> AI 智能搜索</span>,
            children: (
              <Card title="AI 智能搜索测试">
                <Alert
                  message="功能说明"
                  description="输入自然语言描述你的需求，AI 会从数据库中智能匹配相关工具。例如：'我需要一个免费的在线图片压缩工具'"
                  type="info"
                  showIcon
                  style={{ marginBottom: 16 }}
                />
                <Space.Compact style={{ width: '100%', marginBottom: 16 }}>
                  <Input
                    placeholder="描述你需要的工具，如：免费的在线设计工具"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onPressEnter={handleSmartSearch}
                    style={{ flex: 1 }}
                  />
                  <Button type="primary" icon={<SearchOutlined />} onClick={handleSmartSearch} loading={searchLoading}>
                    AI 搜索
                  </Button>
                </Space.Compact>
                {searchMode && (
                  <Tag color={searchMode === 'ai' ? 'green' : 'orange'} style={{ marginBottom: 16 }}>
                    {searchMode === 'ai' ? 'AI 智能匹配' : '关键词匹配'}
                  </Tag>
                )}
                {searchResults.length > 0 && (
                  <Table
                    dataSource={searchResults}
                    rowKey="id"
                    columns={[
                      { title: '名称', dataIndex: 'name', key: 'name' },
                      { title: '描述', dataIndex: 'description', key: 'description', ellipsis: true },
                      { title: '链接', dataIndex: 'url', key: 'url', render: (url: string) => <a href={url} target="_blank" rel="noopener noreferrer">访问</a> },
                    ]}
                    pagination={false}
                    size="small"
                  />
                )}
              </Card>
            ),
          },
          {
            key: 'chat',
            label: <span><MessageOutlined /> AI 对话助手</span>,
            children: (
              <Card title="AI 对话助手测试">
                <Alert
                  message="功能说明"
                  description="与 AI 助手对话，获取设计相关问题的解答、工具推荐和最佳实践建议。"
                  type="info"
                  showIcon
                  style={{ marginBottom: 16 }}
                />
                <div style={{ height: 300, overflowY: 'auto', border: '1px solid #d9d9d9', borderRadius: 8, padding: 16, marginBottom: 16, background: '#fafafa' }}>
                  {chatHistory.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#999', paddingTop: 100 }}>开始与 AI 助手对话吧！</div>
                  ) : (
                    chatHistory.map((msg, index) => (
                      <div key={index} style={{ marginBottom: 12, textAlign: msg.role === 'user' ? 'right' : 'left' }}>
                        <div style={{
                          display: 'inline-block',
                          maxWidth: '80%',
                          padding: '8px 12px',
                          borderRadius: 8,
                          background: msg.role === 'user' ? '#1890ff' : '#fff',
                          color: msg.role === 'user' ? '#fff' : '#333',
                          border: msg.role === 'user' ? 'none' : '1px solid #d9d9d9',
                          whiteSpace: 'pre-wrap',
                        }}>
                          {msg.content}
                        </div>
                      </div>
                    ))
                  )}
                  {chatLoading && <div style={{ textAlign: 'left' }}><Spin size="small" /> AI 正在思考...</div>}
                </div>
                <Space.Compact style={{ width: '100%' }}>
                  <TextArea
                    placeholder="输入你的问题，如：推荐一些好用的UI设计工具"
                    value={chatMessage}
                    onChange={e => setChatMessage(e.target.value)}
                    onPressEnter={e => { if (!e.shiftKey) { e.preventDefault(); handleChat(); } }}
                    autoSize={{ minRows: 1, maxRows: 3 }}
                    style={{ flex: 1 }}
                  />
                  <Button type="primary" icon={<MessageOutlined />} onClick={handleChat} loading={chatLoading}>发送</Button>
                  <Button icon={<ReloadOutlined />} onClick={() => setChatHistory([])} title="清空对话" />
                </Space.Compact>
              </Card>
            ),
          },
        ]}
      />

      <Modal
        title={editingId ? '编辑 AI 配置' : '添加 AI 配置'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="配置名称" rules={[{ required: true, message: '请输入配置名称' }]}>
            <Input placeholder="如：SiliconFlow" />
          </Form.Item>
          <Form.Item name="provider" label="提供商" rules={[{ required: true, message: '请选择提供商' }]}>
            <Select placeholder="选择提供商">
              <Select.Option value="siliconflow">SiliconFlow</Select.Option>
              <Select.Option value="openai">OpenAI</Select.Option>
              <Select.Option value="deepseek">DeepSeek</Select.Option>
              <Select.Option value="other">其他</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="apiUrl" label="API 地址" rules={[{ required: true, message: '请输入 API 地址' }]} extra="SiliconFlow: https://api.siliconflow.cn/v1/chat/completions">
            <Input placeholder="https://api.siliconflow.cn/v1/chat/completions" />
          </Form.Item>
          <Form.Item name="apiKey" label="API Key" rules={[{ required: !editingId, message: '请输入 API Key' }]} extra={editingId ? '留空则不修改原有密钥' : ''}>
            <Input.Password placeholder="sk-..." />
          </Form.Item>
          <Form.Item name="model" label="模型" rules={[{ required: true, message: '请选择或输入模型名称' }]} extra="可从下拉列表选择常用模型，或手动输入模型名称">
            <Select showSearch placeholder="选择或输入模型" optionFilterProp="label" options={COMMON_MODELS} dropdownRender={menu => (
              <>{menu}<Divider style={{ margin: '8px 0' }} /><div style={{ padding: '0 8px 8px', color: '#999', fontSize: 12 }}>可直接输入其他模型名称</div></>
            )} />
          </Form.Item>
          <Divider />
          <Space size="large">
            <Form.Item name="enabled" label="启用" valuePropName="checked"><Switch /></Form.Item>
            <Form.Item name="isDefault" label="设为默认" valuePropName="checked"><Switch /></Form.Item>
          </Space>
        </Form>
      </Modal>
    </div>
  );
}
