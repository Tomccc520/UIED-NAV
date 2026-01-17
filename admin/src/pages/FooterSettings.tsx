/**
 * @file FooterSettings.tsx
 * @description 管理后台组件
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

import { useEffect, useState } from 'react';
import { Card, Table, Button, Modal, Form, Input, InputNumber, Switch, Space, Tag, message, Popconfirm, Collapse } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { footerApi } from '../services/api';

interface FooterLink {
  id: string;
  text: string;
  url: string;
  external: boolean;
  groupId: string;
  order: number;
  visible: boolean;
}

interface FooterGroup {
  id: string;
  title: string;
  order: number;
  visible: boolean;
  links: FooterLink[];
}

export default function FooterSettings() {
  const [groups, setGroups] = useState<FooterGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null);
  const [groupForm] = Form.useForm();
  const [linkForm] = Form.useForm();

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const res = await footerApi.getGroups();
      setGroups(res.data);
    } catch (error) {
      message.error('获取页脚数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  // 分组操作
  const handleAddGroup = () => {
    setEditingGroupId(null);
    groupForm.resetFields();
    groupForm.setFieldsValue({ order: 0, visible: true });
    setGroupModalOpen(true);
  };

  const handleEditGroup = (group: FooterGroup) => {
    setEditingGroupId(group.id);
    groupForm.setFieldsValue(group);
    setGroupModalOpen(true);
  };

  const handleDeleteGroup = async (id: string) => {
    try {
      await footerApi.deleteGroup(id);
      message.success('删除成功');
      fetchGroups();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleSubmitGroup = async () => {
    try {
      const values = await groupForm.validateFields();
      if (editingGroupId) {
        await footerApi.updateGroup(editingGroupId, values);
        message.success('更新成功');
      } else {
        await footerApi.createGroup(values);
        message.success('创建成功');
      }
      setGroupModalOpen(false);
      fetchGroups();
    } catch (error) {
      message.error('操作失败');
    }
  };

  // 链接操作
  const handleAddLink = (groupId: string) => {
    setEditingLinkId(null);
    linkForm.resetFields();
    linkForm.setFieldsValue({ order: 0, external: true, visible: true, groupId });
    setLinkModalOpen(true);
  };

  const handleEditLink = (link: FooterLink) => {
    setEditingLinkId(link.id);
    linkForm.setFieldsValue(link);
    setLinkModalOpen(true);
  };

  const handleDeleteLink = async (id: string) => {
    try {
      await footerApi.deleteLink(id);
      message.success('删除成功');
      fetchGroups();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleSubmitLink = async () => {
    try {
      const values = await linkForm.validateFields();
      if (editingLinkId) {
        await footerApi.updateLink(editingLinkId, values);
        message.success('更新成功');
      } else {
        await footerApi.createLink(values);
        message.success('创建成功');
      }
      setLinkModalOpen(false);
      fetchGroups();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const linkColumns = [
    { title: '链接文字', dataIndex: 'text', key: 'text' },
    { title: 'URL', dataIndex: 'url', key: 'url', ellipsis: true },
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
      render: (_: any, record: FooterLink) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => handleEditLink(record)} />
          <Popconfirm title="确定删除？" onConfirm={() => handleDeleteLink(record.id)}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>页脚设置</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAddGroup}>
          添加分组
        </Button>
      </div>

      <Card loading={loading}>
        {groups.length > 0 ? (
          <Collapse defaultActiveKey={groups.map(g => g.id)}>
            {groups.map(group => (
              <Collapse.Panel
                key={group.id}
                header={
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <span>
                      {group.title}
                      {!group.visible && <Tag color="red" style={{ marginLeft: 8 }}>隐藏</Tag>}
                    </span>
                    <Space onClick={e => e.stopPropagation()}>
                      <Button size="small" onClick={() => handleAddLink(group.id)}>添加链接</Button>
                      <Button size="small" icon={<EditOutlined />} onClick={() => handleEditGroup(group)} />
                      <Popconfirm title="确定删除？" onConfirm={() => handleDeleteGroup(group.id)}>
                        <Button size="small" danger icon={<DeleteOutlined />} />
                      </Popconfirm>
                    </Space>
                  </div>
                }
              >
                <Table
                  columns={linkColumns}
                  dataSource={group.links}
                  rowKey="id"
                  size="small"
                  pagination={false}
                />
              </Collapse.Panel>
            ))}
          </Collapse>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
            暂无页脚分组，点击上方按钮添加
          </div>
        )}
      </Card>

      {/* 分组编辑弹窗 */}
      <Modal
        title={editingGroupId ? '编辑分组' : '添加分组'}
        open={groupModalOpen}
        onOk={handleSubmitGroup}
        onCancel={() => setGroupModalOpen(false)}
      >
        <Form form={groupForm} layout="vertical">
          <Form.Item name="title" label="分组标题" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="order" label="排序">
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="visible" label="显示" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>

      {/* 链接编辑弹窗 */}
      <Modal
        title={editingLinkId ? '编辑链接' : '添加链接'}
        open={linkModalOpen}
        onOk={handleSubmitLink}
        onCancel={() => setLinkModalOpen(false)}
      >
        <Form form={linkForm} layout="vertical">
          <Form.Item name="groupId" hidden>
            <Input />
          </Form.Item>
          <Form.Item name="text" label="链接文字" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="url" label="URL" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Space size="large">
            <Form.Item name="external" label="外部链接" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item name="visible" label="显示" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Space>
          <Form.Item name="order" label="排序">
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
