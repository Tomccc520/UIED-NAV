/**
 * @file NavMenus.tsx
 * @description 管理后台组件
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

import { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, Select, Switch, Space, Tag, message, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { navMenuApi } from '../services/api';

interface NavMenu {
  id: string;
  text: string;
  link: string | null;
  external: boolean;
  label: string | null;
  labelType: string | null;
  icon: string | null;
  parentId: string | null;
  order: number;
  visible: boolean;
  children?: NavMenu[];
}

export default function NavMenus() {
  const [menus, setMenus] = useState<NavMenu[]>([]);
  const [flatMenus, setFlatMenus] = useState<NavMenu[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form] = Form.useForm();

  const fetchMenus = async () => {
    setLoading(true);
    try {
      const [treeRes, flatRes] = await Promise.all([
        navMenuApi.getAll(),
        navMenuApi.getFlat(),
      ]);
      setMenus(treeRes.data);
      setFlatMenus(flatRes.data);
    } catch (error) {
      message.error('获取菜单失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenus();
  }, []);

  const handleAdd = () => {
    setEditingId(null);
    form.resetFields();
    form.setFieldsValue({ order: 0, external: false, visible: true });
    setModalOpen(true);
  };

  const handleEdit = (record: NavMenu) => {
    setEditingId(record.id);
    form.setFieldsValue(record);
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await navMenuApi.delete(id);
      message.success('删除成功');
      fetchMenus();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingId) {
        await navMenuApi.update(editingId, values);
        message.success('更新成功');
      } else {
        await navMenuApi.create(values);
        message.success('创建成功');
      }
      setModalOpen(false);
      fetchMenus();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const columns = [
    { title: '菜单名称', dataIndex: 'text', key: 'text' },
    { 
      title: '链接', 
      dataIndex: 'link', 
      key: 'link',
      ellipsis: true,
      render: (link: string) => link || '-'
    },
    {
      title: '标签',
      key: 'label',
      render: (_: any, record: NavMenu) => (
        record.label ? (
          <Tag color={record.labelType === 'shop' ? 'green' : 'blue'}>
            {record.label}
          </Tag>
        ) : '-'
      ),
    },
    {
      title: '外部链接',
      dataIndex: 'external',
      key: 'external',
      render: (external: boolean) => external ? '是' : '否',
    },
    {
      title: '显示',
      dataIndex: 'visible',
      key: 'visible',
      render: (visible: boolean) => (
        <Tag color={visible ? 'green' : 'red'}>{visible ? '显示' : '隐藏'}</Tag>
      ),
    },
    { title: '排序', dataIndex: 'order', key: 'order' },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: NavMenu) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Popconfirm title="确定删除？" onConfirm={() => handleDelete(record.id)}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 获取顶级菜单（用于选择父菜单）
  const topMenus = flatMenus.filter(m => !m.parentId);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2>导航菜单管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          添加菜单
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={menus}
        rowKey="id"
        loading={loading}
        expandable={{
          childrenColumnName: 'children',
        }}
      />

      <Modal
        title={editingId ? '编辑菜单' : '添加菜单'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        width={500}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="text" label="菜单名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="link" label="链接">
            <Input placeholder="留空表示有子菜单" />
          </Form.Item>
          <Form.Item name="parentId" label="父菜单">
            <Select allowClear placeholder="选择父菜单（留空为顶级菜单）">
              {topMenus.map(menu => (
                <Select.Option key={menu.id} value={menu.id}>{menu.text}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Space size="large">
            <Form.Item name="external" label="外部链接" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item name="visible" label="显示" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Space>
          <Form.Item name="label" label="标签文字">
            <Input placeholder="如: New, Hot" />
          </Form.Item>
          <Form.Item name="labelType" label="标签类型">
            <Select allowClear>
              <Select.Option value="info">信息 (蓝色)</Select.Option>
              <Select.Option value="shop">商店 (绿色)</Select.Option>
              <Select.Option value="warning">警告 (黄色)</Select.Option>
              <Select.Option value="success">成功 (绿色)</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="order" label="排序">
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
