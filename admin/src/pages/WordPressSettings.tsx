/**
 * @file WordPressSettings.tsx
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
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  InputNumber,
  Switch,
  message,
  Popconfirm,
  Tabs,
  Tag,
  Select,
  Alert,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  LinkOutlined,
  ImportOutlined,
} from '@ant-design/icons';
import api from '../services/api';

interface WordPressConfig {
  id: string;
  name: string;
  apiUrl: string;
  enabled: boolean;
  isDefault: boolean;
  cacheTime: number;
  createdAt: string;
}

interface WordPressCategory {
  id: string;
  configId?: string;
  wpCategoryId: number;
  wpCategoryName: string;
  displayName: string;
  slug: string;
  description?: string;
  order: number;
  visible: boolean;
  pageSlug?: string;
  createdAt: string;
}

interface WordPressTag {
  id: string;
  configId?: string;
  wpTagId: number;
  wpTagName: string;
  displayName: string;
  slug: string;
  description?: string;
  order: number;
  visible: boolean;
  pageSlug?: string;
  createdAt: string;
}

export default function WordPressSettings() {
  const [configs, setConfigs] = useState<WordPressConfig[]>([]);
  const [categories, setCategories] = useState<WordPressCategory[]>([]);
  const [tags, setTags] = useState<WordPressTag[]>([]);
  const [loading, setLoading] = useState(false);
  const [configModalVisible, setConfigModalVisible] = useState(false);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [tagModalVisible, setTagModalVisible] = useState(false);
  const [editingConfig, setEditingConfig] = useState<WordPressConfig | null>(null);
  const [editingCategory, setEditingCategory] = useState<WordPressCategory | null>(null);
  const [editingTag, setEditingTag] = useState<WordPressTag | null>(null);
  const [configForm] = Form.useForm();
  const [categoryForm] = Form.useForm();
  const [tagForm] = Form.useForm();
  const [importing, setImporting] = useState(false);

  // 默认 WordPress 分类数据（全局分类，不关联页面）
  const defaultCategories = [
    { wpCategoryId: 334, wpCategoryName: 'UI', displayName: 'UI', slug: 'ui', order: 1 },
    { wpCategoryId: 337, wpCategoryName: 'UX', displayName: 'UX', slug: 'ux', order: 2 },
    { wpCategoryId: 336, wpCategoryName: '产品', displayName: '产品', slug: 'product', order: 3 },
    { wpCategoryId: 335, wpCategoryName: '平面', displayName: '平面', slug: 'graphic', order: 4 },
    { wpCategoryId: 1031, wpCategoryName: '三维', displayName: '三维', slug: '3d', order: 5 },
    { wpCategoryId: 307, wpCategoryName: '设计干货', displayName: '设计干货', slug: 'tips', order: 6 },
    { wpCategoryId: 1861, wpCategoryName: '设计灵感', displayName: '设计灵感', slug: 'inspiration', order: 7 },
    { wpCategoryId: 319, wpCategoryName: '字体', displayName: '字体', slug: 'font', order: 8 },
    { wpCategoryId: 417, wpCategoryName: 'AIGC', displayName: 'AIGC', slug: 'aigc', order: 9 },
  ];

  // 默认 WordPress 标签数据（暂时为空，后续自行添加）
  const defaultTags: any[] = [];

  // 导入默认分类（全局分类，不关联页面）
  const handleImportDefaultCategories = async () => {
    setImporting(true);
    try {
      // 先从API获取最新的分类列表
      const res = await api.get('/wordpress/categories');
      const latestCategories = res.data || [];
      
      let successCount = 0;
      let skipCount = 0;
      
      for (const cat of defaultCategories) {
        // 检查是否已存在（按 wpCategoryId 检查）- 使用最新的API数据
        const exists = latestCategories.find((c: WordPressCategory) => c.wpCategoryId === cat.wpCategoryId);
        if (exists) {
          skipCount++;
          continue;
        }
        
        await api.post('/wordpress/categories', {
          ...cat,
          visible: true,
        });
        successCount++;
      }
      
      message.success(`导入完成：新增 ${successCount} 个，跳过 ${skipCount} 个已存在的分类`);
      fetchCategories();
    } catch (error: any) {
      message.error('导入失败: ' + error.message);
    } finally {
      setImporting(false);
    }
  };

  // 导入默认标签
  const handleImportDefaultTags = async () => {
    setImporting(true);
    try {
      // 先从API获取最新的标签列表
      const res = await api.get('/wordpress/tags');
      const latestTags = res.data || [];
      
      let successCount = 0;
      let skipCount = 0;
      
      for (const tag of defaultTags) {
        // 检查是否已存在 - 使用最新的API数据
        const exists = latestTags.find((t: WordPressTag) => t.slug === tag.slug);
        if (exists) {
          skipCount++;
          continue;
        }
        
        await api.post('/wordpress/tags', {
          ...tag,
          visible: true,
        });
        successCount++;
      }
      
      message.success(`导入完成：新增 ${successCount} 个，跳过 ${skipCount} 个已存在的标签`);
      fetchTags();
    } catch (error: any) {
      message.error('导入失败: ' + error.message);
    } finally {
      setImporting(false);
    }
  };

  // 导入默认配置
  const handleImportDefaultConfig = async () => {
    setImporting(true);
    try {
      // 先从API获取最新的配置列表，而不是依赖本地状态
      const res = await api.get('/wordpress/configs');
      const latestConfigs = res.data || [];
      
      // 检查是否已存在
      const exists = latestConfigs.find((c: WordPressConfig) => c.apiUrl.includes('uied.cn'));
      if (exists) {
        message.info('默认配置已存在');
        setImporting(false);
        return;
      }
      
      await api.post('/wordpress/configs', {
        name: 'UIED 博客',
        apiUrl: 'https://www.uied.cn/wp-json/wp/v2',
        enabled: true,
        isDefault: true,
        cacheTime: 7200,
      });
      
      message.success('默认配置导入成功');
      fetchConfigs();
    } catch (error: any) {
      message.error('导入失败: ' + error.message);
    } finally {
      setImporting(false);
    }
  };

  // 获取配置列表
  const fetchConfigs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/wordpress/configs');
      setConfigs(res.data);
    } catch (error: any) {
      message.error('获取配置失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 获取分类列表
  const fetchCategories = async () => {
    try {
      const res = await api.get('/wordpress/categories');
      setCategories(res.data);
    } catch (error: any) {
      message.error('获取分类失败: ' + error.message);
    }
  };

  // 获取标签列表
  const fetchTags = async () => {
    try {
      const res = await api.get('/wordpress/tags');
      setTags(res.data);
    } catch (error: any) {
      message.error('获取标签失败: ' + error.message);
    }
  };

  useEffect(() => {
    fetchConfigs();
    fetchCategories();
    fetchTags();
  }, []);

  // 保存配置
  const handleSaveConfig = async (values: any) => {
    try {
      if (editingConfig) {
        await api.put(`/wordpress/configs/${editingConfig.id}`, values);
        message.success('更新成功');
      } else {
        await api.post('/wordpress/configs', values);
        message.success('创建成功');
      }
      setConfigModalVisible(false);
      configForm.resetFields();
      setEditingConfig(null);
      fetchConfigs();
    } catch (error: any) {
      message.error('保存失败: ' + error.message);
    }
  };

  // 删除配置
  const handleDeleteConfig = async (id: string) => {
    try {
      await api.delete(`/wordpress/configs/${id}`);
      message.success('删除成功');
      fetchConfigs();
    } catch (error: any) {
      message.error('删除失败: ' + error.message);
    }
  };

  // 保存分类
  const handleSaveCategory = async (values: any) => {
    try {
      if (editingCategory) {
        await api.put(`/wordpress/categories/${editingCategory.id}`, values);
        message.success('更新成功');
      } else {
        await api.post('/wordpress/categories', values);
        message.success('创建成功');
      }
      setCategoryModalVisible(false);
      categoryForm.resetFields();
      setEditingCategory(null);
      fetchCategories();
    } catch (error: any) {
      message.error('保存失败: ' + error.message);
    }
  };

  // 删除分类
  const handleDeleteCategory = async (id: string) => {
    try {
      await api.delete(`/wordpress/categories/${id}`);
      message.success('删除成功');
      fetchCategories();
    } catch (error: any) {
      message.error('删除失败: ' + error.message);
    }
  };

  // 保存标签
  const handleSaveTag = async (values: any) => {
    try {
      if (editingTag) {
        await api.put(`/wordpress/tags/${editingTag.id}`, values);
        message.success('更新成功');
      } else {
        await api.post('/wordpress/tags', values);
        message.success('创建成功');
      }
      setTagModalVisible(false);
      tagForm.resetFields();
      setEditingTag(null);
      fetchTags();
    } catch (error: any) {
      message.error('保存失败: ' + error.message);
    }
  };

  // 删除标签
  const handleDeleteTag = async (id: string) => {
    try {
      await api.delete(`/wordpress/tags/${id}`);
      message.success('删除成功');
      fetchTags();
    } catch (error: any) {
      message.error('删除失败: ' + error.message);
    }
  };

  // 配置表格列
  const configColumns = [
    { title: '名称', dataIndex: 'name', key: 'name' },
    {
      title: 'API 地址',
      dataIndex: 'apiUrl',
      key: 'apiUrl',
      render: (url: string) => (
        <a href={url} target="_blank" rel="noopener noreferrer">
          <LinkOutlined /> {url}
        </a>
      ),
    },
    {
      title: '缓存时间',
      dataIndex: 'cacheTime',
      key: 'cacheTime',
      render: (time: number) => `${time} 秒`,
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      key: 'enabled',
      render: (enabled: boolean, record: WordPressConfig) => (
        <Space>
          <Tag color={enabled ? 'green' : 'default'}>{enabled ? '启用' : '禁用'}</Tag>
          {record.isDefault && <Tag color="blue">默认</Tag>}
        </Space>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: WordPressConfig) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => {
              setEditingConfig(record);
              configForm.setFieldsValue(record);
              setConfigModalVisible(true);
            }}
          >
            编辑
          </Button>
          <Popconfirm title="确定删除？" onConfirm={() => handleDeleteConfig(record.id)}>
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 分类表格列
  const categoryColumns = [
    { title: '显示名称', dataIndex: 'displayName', key: 'displayName' },
    { title: 'WP 分类名', dataIndex: 'wpCategoryName', key: 'wpCategoryName' },
    { title: 'WP 分类ID', dataIndex: 'wpCategoryId', key: 'wpCategoryId' },
    { title: 'Slug', dataIndex: 'slug', key: 'slug' },
    { title: '排序', dataIndex: 'order', key: 'order' },
    {
      title: '状态',
      dataIndex: 'visible',
      key: 'visible',
      render: (visible: boolean) => (
        <Tag color={visible ? 'green' : 'default'}>{visible ? '显示' : '隐藏'}</Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: WordPressCategory) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => {
              setEditingCategory(record);
              categoryForm.setFieldsValue(record);
              setCategoryModalVisible(true);
            }}
          >
            编辑
          </Button>
          <Popconfirm title="确定删除？" onConfirm={() => handleDeleteCategory(record.id)}>
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 标签表格列
  const tagColumns = [
    { title: '显示名称', dataIndex: 'displayName', key: 'displayName' },
    { title: 'WP 标签名', dataIndex: 'wpTagName', key: 'wpTagName' },
    { title: 'WP 标签ID', dataIndex: 'wpTagId', key: 'wpTagId' },
    { title: 'Slug', dataIndex: 'slug', key: 'slug' },
    { title: '排序', dataIndex: 'order', key: 'order' },
    {
      title: '状态',
      dataIndex: 'visible',
      key: 'visible',
      render: (visible: boolean) => (
        <Tag color={visible ? 'green' : 'default'}>{visible ? '显示' : '隐藏'}</Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: WordPressTag) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => {
              setEditingTag(record);
              tagForm.setFieldsValue(record);
              setTagModalVisible(true);
            }}
          >
            编辑
          </Button>
          <Popconfirm title="确定删除？" onConfirm={() => handleDeleteTag(record.id)}>
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Tabs
        defaultActiveKey="configs"
        items={[
          {
            key: 'configs',
            label: 'WordPress 配置',
            children: (
              <Card
                title="WordPress API 配置"
                extra={
                  <Space>
                    <Button 
                      icon={<ImportOutlined />} 
                      onClick={handleImportDefaultConfig}
                      loading={importing}
                    >
                      导入默认配置
                    </Button>
                    <Button icon={<ReloadOutlined />} onClick={fetchConfigs}>
                      刷新
                    </Button>
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={() => {
                        setEditingConfig(null);
                        configForm.resetFields();
                        configForm.setFieldsValue({ enabled: true, cacheTime: 7200 });
                        setConfigModalVisible(true);
                      }}
                    >
                      添加配置
                    </Button>
                  </Space>
                }
              >
                {configs.length === 0 && (
                  <Alert
                    message="暂无配置"
                    description="点击「导入默认配置」可快速添加 UIED 博客的 WordPress API 配置"
                    type="info"
                    showIcon
                    style={{ marginBottom: 16 }}
                  />
                )}
                <Table
                  columns={configColumns}
                  dataSource={configs}
                  rowKey="id"
                  loading={loading}
                  pagination={false}
                />
              </Card>
            ),
          },
          {
            key: 'categories',
            label: '分类配置',
            children: (
              <Card
                title="WordPress 分类配置"
                extra={
                  <Space>
                    <Button 
                      icon={<ImportOutlined />} 
                      onClick={handleImportDefaultCategories}
                      loading={importing}
                    >
                      导入默认分类
                    </Button>
                    <Button icon={<ReloadOutlined />} onClick={fetchCategories}>
                      刷新
                    </Button>
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={() => {
                        setEditingCategory(null);
                        categoryForm.resetFields();
                        categoryForm.setFieldsValue({ visible: true, order: 0 });
                        setCategoryModalVisible(true);
                      }}
                    >
                      添加分类
                    </Button>
                  </Space>
                }
              >
                {categories.length === 0 && (
                  <Alert
                    message="暂无分类配置"
                    description="点击「导入默认分类」可快速添加 UI、UX、产品、平面等设计文章分类"
                    type="info"
                    showIcon
                    style={{ marginBottom: 16 }}
                  />
                )}
                <Table
                  columns={categoryColumns}
                  dataSource={categories}
                  rowKey="id"
                  pagination={{ pageSize: 10 }}
                />
              </Card>
            ),
          },
          {
            key: 'tags',
            label: '标签配置',
            children: (
              <Card
                title="WordPress 标签配置"
                extra={
                  <Space>
                    <Button 
                      icon={<ImportOutlined />} 
                      onClick={handleImportDefaultTags}
                      loading={importing}
                    >
                      导入默认标签
                    </Button>
                    <Button icon={<ReloadOutlined />} onClick={fetchTags}>
                      刷新
                    </Button>
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={() => {
                        setEditingTag(null);
                        tagForm.resetFields();
                        tagForm.setFieldsValue({ visible: true, order: 0 });
                        setTagModalVisible(true);
                      }}
                    >
                      添加标签
                    </Button>
                  </Space>
                }
              >
                {tags.length === 0 && (
                  <Alert
                    message="暂无标签配置"
                    description="点击「导入默认标签」可快速添加 Figma、Sketch、Photoshop 等设计工具标签"
                    type="info"
                    showIcon
                    style={{ marginBottom: 16 }}
                  />
                )}
                <Table
                  columns={tagColumns}
                  dataSource={tags}
                  rowKey="id"
                  pagination={{ pageSize: 10 }}
                />
              </Card>
            ),
          },
        ]}
      />

      {/* 配置编辑弹窗 */}
      <Modal
        title={editingConfig ? '编辑配置' : '添加配置'}
        open={configModalVisible}
        onCancel={() => {
          setConfigModalVisible(false);
          setEditingConfig(null);
        }}
        footer={null}
      >
        <Form form={configForm} layout="vertical" onFinish={handleSaveConfig}>
          <Form.Item name="name" label="配置名称" rules={[{ required: true, message: '请输入名称' }]}>
            <Input placeholder="如：UIED 博客" />
          </Form.Item>
          <Form.Item
            name="apiUrl"
            label="API 地址"
            rules={[{ required: true, message: '请输入 API 地址' }]}
          >
            <Input placeholder="如：https://www.uied.cn/wp-json/wp/v2" />
          </Form.Item>
          <Form.Item name="cacheTime" label="缓存时间（秒）">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="enabled" label="启用" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="isDefault" label="设为默认" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                保存
              </Button>
              <Button onClick={() => setConfigModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 分类编辑弹窗 */}
      <Modal
        title={editingCategory ? '编辑分类' : '添加分类'}
        open={categoryModalVisible}
        onCancel={() => {
          setCategoryModalVisible(false);
          setEditingCategory(null);
        }}
        footer={null}
        width={600}
      >
        <Form form={categoryForm} layout="vertical" onFinish={handleSaveCategory}>
          <Form.Item
            name="wpCategoryId"
            label="WordPress 分类 ID"
            rules={[{ required: true, message: '请输入分类 ID' }]}
          >
            <InputNumber min={1} style={{ width: '100%' }} placeholder="WordPress 中的分类 ID" />
          </Form.Item>
          <Form.Item
            name="wpCategoryName"
            label="WordPress 分类名称"
            rules={[{ required: true, message: '请输入分类名称' }]}
          >
            <Input placeholder="WordPress 中的分类名称" />
          </Form.Item>
          <Form.Item
            name="displayName"
            label="显示名称"
            rules={[{ required: true, message: '请输入显示名称' }]}
          >
            <Input placeholder="前端显示的名称" />
          </Form.Item>
          <Form.Item
            name="slug"
            label="Slug"
            rules={[{ required: true, message: '请输入 slug' }]}
          >
            <Input placeholder="唯一标识，如：design-articles" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={2} placeholder="分类描述（可选）" />
          </Form.Item>
          <Form.Item name="order" label="排序">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="visible" label="显示" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="configId" label="关联配置">
            <Select allowClear placeholder="选择关联的 WordPress 配置（可选）">
              {configs.map((config) => (
                <Select.Option key={config.id} value={config.id}>
                  {config.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                保存
              </Button>
              <Button onClick={() => setCategoryModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 标签编辑弹窗 */}
      <Modal
        title={editingTag ? '编辑标签' : '添加标签'}
        open={tagModalVisible}
        onCancel={() => {
          setTagModalVisible(false);
          setEditingTag(null);
        }}
        footer={null}
        width={600}
      >
        <Form form={tagForm} layout="vertical" onFinish={handleSaveTag}>
          <Form.Item
            name="wpTagId"
            label="WordPress 标签 ID"
            rules={[{ required: true, message: '请输入标签 ID' }]}
          >
            <InputNumber min={1} style={{ width: '100%' }} placeholder="WordPress 中的标签 ID" />
          </Form.Item>
          <Form.Item
            name="wpTagName"
            label="WordPress 标签名称"
            rules={[{ required: true, message: '请输入标签名称' }]}
          >
            <Input placeholder="WordPress 中的标签名称" />
          </Form.Item>
          <Form.Item
            name="displayName"
            label="显示名称"
            rules={[{ required: true, message: '请输入显示名称' }]}
          >
            <Input placeholder="前端显示的名称" />
          </Form.Item>
          <Form.Item
            name="slug"
            label="Slug"
            rules={[{ required: true, message: '请输入 slug' }]}
          >
            <Input placeholder="唯一标识，如：figma" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={2} placeholder="标签描述（可选）" />
          </Form.Item>
          <Form.Item name="order" label="排序">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="visible" label="显示" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="configId" label="关联配置">
            <Select allowClear placeholder="选择关联的 WordPress 配置（可选）">
              {configs.map((config) => (
                <Select.Option key={config.id} value={config.id}>
                  {config.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                保存
              </Button>
              <Button onClick={() => setTagModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

    </div>
  );
}
