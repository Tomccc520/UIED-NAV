/**
 * @file SocialMediaGroups.tsx
 * @description 关注交流分组管理 - 配置分组图标和内容
 * 
 * 设计说明：
 * - 顶部显示所有分组的图标预览（模拟前端效果）
 * - 每个分组可设置：名称、图标（SVG/emoji）、展示类型
 * - 分组下可添加多个内容项
 */

import { useEffect, useState } from 'react';
import {
  Card, Button, Modal, Form, Input, InputNumber, Switch, Space, Tag, message, 
  Popconfirm, Upload, Image, Select, List, Typography, Row, Col, Divider, Tooltip
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, UploadOutlined, 
  LinkOutlined, QrcodeOutlined, AppstoreOutlined, SettingOutlined
} from '@ant-design/icons';
import type { UploadProps } from 'antd';
import api from '../services/api';

const { TextArea } = Input;
const { Text, Title } = Typography;

interface SocialMediaItem {
  id: string;
  groupId: string;
  name: string;
  type: string;
  icon?: string;
  link?: string;
  qrCodeUrl?: string;
  description?: string;
  extraInfo?: string;
  order: number;
  visible: boolean;
}

interface SocialMediaGroup {
  id: string;
  name: string;
  icon?: string;
  displayType: string;
  order: number;
  visible: boolean;
  items: SocialMediaItem[];
}

// 项目类型选项
const itemTypes = [
  { value: 'weibo', label: '微博' },
  { value: 'bilibili', label: 'B站' },
  { value: 'xiaohongshu', label: '小红书' },
  { value: 'douyin', label: '抖音' },
  { value: 'wechat_official', label: '微信公众号' },
  { value: 'wechat_group', label: '微信群' },
  { value: 'wechat_mini', label: '微信小程序' },
  { value: 'qq_group', label: 'QQ群' },
  { value: 'other', label: '其他' },
];

// 展示类型配置
const displayTypeConfig: Record<string, { label: string; icon: React.ReactNode; color: string; description: string }> = {
  links: {
    label: '链接列表',
    icon: <LinkOutlined />,
    color: '#1890ff',
    description: '显示为可点击的链接列表',
  },
  qrcode: {
    label: '二维码',
    icon: <QrcodeOutlined />,
    color: '#52c41a',
    description: '显示二维码图片',
  },
  mixed: {
    label: '混合模式',
    icon: <AppstoreOutlined />,
    color: '#722ed1',
    description: '同时显示链接和二维码',
  },
};

// 预设图标选项 - 使用文本标识，前端会映射为对应图标
const presetIcons = [
  { value: 'link', label: '链接' },
  { value: 'qrcode', label: '二维码' },
  { value: 'wechat', label: '微信' },
  { value: 'weibo', label: '微博' },
  { value: 'group', label: '群组' },
  { value: 'phone', label: '手机' },
  { value: 'message', label: '消息' },
  { value: 'star', label: '收藏' },
  { value: 'social', label: '社交媒体' },
  { value: 'community', label: '官方社群' },
  { value: 'official', label: '公众号' },
];

export default function SocialMediaGroups() {
  const [groups, setGroups] = useState<SocialMediaGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  
  // 分组弹窗
  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<SocialMediaGroup | null>(null);
  const [groupForm] = Form.useForm();
  
  // 项目弹窗
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SocialMediaItem | null>(null);
  const [currentGroupId, setCurrentGroupId] = useState<string>('');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [itemForm] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/social-media/groups/all');
      setGroups(res.data);
      if (res.data.length > 0 && !selectedGroupId) {
        setSelectedGroupId(res.data[0].id);
      }
    } catch (error) {
      message.error('获取数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // ========== 分组操作 ==========
  const handleAddGroup = () => {
    setEditingGroup(null);
    groupForm.resetFields();
    groupForm.setFieldsValue({ order: groups.length, visible: true, displayType: 'links', icon: 'link' });
    setGroupModalOpen(true);
  };

  const handleEditGroup = (group: SocialMediaGroup, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingGroup(group);
    groupForm.setFieldsValue(group);
    setGroupModalOpen(true);
  };

  const handleDeleteGroup = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      await api.delete(`/social-media/groups/${id}`);
      message.success('删除成功');
      if (selectedGroupId === id) {
        setSelectedGroupId(groups.find(g => g.id !== id)?.id || null);
      }
      fetchData();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleGroupSubmit = async () => {
    try {
      const values = await groupForm.validateFields();
      if (editingGroup) {
        await api.put(`/social-media/groups/${editingGroup.id}`, values);
        message.success('更新成功');
      } else {
        await api.post('/social-media/groups', values);
        message.success('创建成功');
      }
      setGroupModalOpen(false);
      fetchData();
    } catch (error) {
      message.error('操作失败');
    }
  };

  // ========== 项目操作 ==========
  const handleAddItem = (groupId: string) => {
    setEditingItem(null);
    setCurrentGroupId(groupId);
    setQrCodeUrl('');
    itemForm.resetFields();
    const group = groups.find(g => g.id === groupId);
    const itemCount = group?.items?.length || 0;
    itemForm.setFieldsValue({ groupId, order: itemCount, visible: true, type: 'other' });
    setItemModalOpen(true);
  };

  const handleEditItem = (item: SocialMediaItem) => {
    setEditingItem(item);
    setCurrentGroupId(item.groupId);
    setQrCodeUrl(item.qrCodeUrl || '');
    itemForm.setFieldsValue(item);
    setItemModalOpen(true);
  };

  const handleDeleteItem = async (id: string) => {
    try {
      await api.delete(`/social-media/items/${id}`);
      message.success('删除成功');
      fetchData();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleItemSubmit = async () => {
    try {
      const values = await itemForm.validateFields();
      const data = { ...values, qrCodeUrl: qrCodeUrl || values.qrCodeUrl };
      if (editingItem) {
        await api.put(`/social-media/items/${editingItem.id}`, data);
        message.success('更新成功');
      } else {
        await api.post('/social-media/items', data);
        message.success('创建成功');
      }
      setItemModalOpen(false);
      fetchData();
    } catch (error) {
      message.error('操作失败');
    }
  };

  // ========== 图片上传 ==========
  const handleUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    try {
      const response = await api.post('/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const uploadedUrl = response.data.url;
      const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const serverUrl = apiBaseUrl.replace(/\/api\/?$/, '');
      const fullUrl = uploadedUrl.startsWith('http') ? uploadedUrl : `${serverUrl}${uploadedUrl}`;
      setQrCodeUrl(fullUrl);
      itemForm.setFieldValue('qrCodeUrl', fullUrl);
      message.success('上传成功');
    } catch (error) {
      message.error('上传失败');
    }
    return false;
  };

  const uploadProps: UploadProps = {
    beforeUpload: (file) => { handleUpload(file); return false; },
    showUploadList: false,
    accept: 'image/*',
  };

  // 获取当前分组的展示类型
  const getCurrentGroupType = () => {
    const group = groups.find(g => g.id === currentGroupId);
    return group?.displayType || 'links';
  };

  // 获取当前选中的分组
  const selectedGroup = groups.find(g => g.id === selectedGroupId);

  return (
    <div>
      {/* 页面标题 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>关注交流管理</Title>
          <Text type="secondary">配置页脚"关注交流"区域，鼠标移入图标显示对应内容</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAddGroup}>
          添加分组
        </Button>
      </div>

      {/* 分组图标预览区 - 模拟前端效果 */}
      <Card 
        title="分组图标预览（点击选择分组进行编辑）" 
        style={{ marginBottom: 24, boxShadow: 'none', border: '1px solid #e5e7eb' }}
        extra={<Text type="secondary">前端效果：鼠标移入图标显示对应内容</Text>}
      >
        {groups.length > 0 ? (
          <div style={{ 
            display: 'flex', 
            gap: 0, 
            background: '#fff', 
            borderRadius: 12, 
            border: '1px solid #e5e7eb',
            overflow: 'hidden',
            width: 'fit-content'
          }}>
            {groups.map((group, index) => {
              const config = displayTypeConfig[group.displayType];
              const isSelected = selectedGroupId === group.id;
              return (
                <Tooltip 
                  key={group.id} 
                  title={
                    <div>
                      <div><strong>{group.name}</strong></div>
                      <div>类型: {config?.label}</div>
                      <div>内容: {group.items?.length || 0} 项</div>
                    </div>
                  }
                >
                  <div
                    onClick={() => setSelectedGroupId(group.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '12px 20px',
                      cursor: 'pointer',
                      borderRight: index < groups.length - 1 ? '1px solid #e5e7eb' : 'none',
                      background: isSelected ? 'rgba(0, 102, 255, 0.08)' : 'transparent',
                      transition: 'all 0.2s',
                      opacity: group.visible ? 1 : 0.5,
                    }}
                  >
                    <span style={{ fontSize: 14, fontWeight: 500 }}>{group.icon || 'link'}</span>
                    <span style={{ 
                      fontWeight: 500, 
                      color: isSelected ? '#0066ff' : '#333',
                      whiteSpace: 'nowrap'
                    }}>
                      {group.name}
                    </span>
                    {!group.visible && <Tag color="default" style={{ marginLeft: 4 }}>隐藏</Tag>}
                  </div>
                </Tooltip>
              );
            })}
            {/* 添加分组按钮 */}
            <div
              onClick={handleAddGroup}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '12px 16px',
                cursor: 'pointer',
                color: '#999',
                transition: 'all 0.2s',
              }}
            >
              <PlusOutlined />
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🔗</div>
            <div>暂无分组，点击右上角"添加分组"创建</div>
          </div>
        )}
      </Card>

      {/* 选中分组的详情和内容管理 */}
      {selectedGroup && (
        <Card
          style={{ boxShadow: 'none', border: '1px solid #e5e7eb' }}
          title={
            <Space>
              <span style={{ fontSize: 18, fontWeight: 500 }}>{selectedGroup.icon || 'link'}</span>
              <span>{selectedGroup.name}</span>
              <Tag color={displayTypeConfig[selectedGroup.displayType]?.color}>
                {displayTypeConfig[selectedGroup.displayType]?.label}
              </Tag>
              {!selectedGroup.visible && <Tag color="default">已隐藏</Tag>}
            </Space>
          }
          extra={
            <Space>
              <Button icon={<SettingOutlined />} onClick={() => handleEditGroup(selectedGroup)}>
                编辑分组
              </Button>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => handleAddItem(selectedGroup.id)}>
                添加内容
              </Button>
              <Popconfirm 
                title="确定删除此分组？" 
                description="删除后其下所有内容也会被删除"
                onConfirm={() => handleDeleteGroup(selectedGroup.id)}
              >
                <Button danger icon={<DeleteOutlined />} />
              </Popconfirm>
            </Space>
          }
        >
          {/* 分组信息 */}
          <div style={{ 
            display: 'flex', 
            gap: 24, 
            padding: 16, 
            background: '#fafafa', 
            borderRadius: 8,
            marginBottom: 16 
          }}>
            <div>
              <Text type="secondary">触发图标</Text>
              <div style={{ fontSize: 16, marginTop: 4, fontWeight: 500 }}>{selectedGroup.icon || 'link'}</div>
            </div>
            <div>
              <Text type="secondary">展示类型</Text>
              <div style={{ marginTop: 4 }}>
                <Tag color={displayTypeConfig[selectedGroup.displayType]?.color} style={{ fontSize: 14, padding: '4px 12px' }}>
                  {displayTypeConfig[selectedGroup.displayType]?.icon}
                  <span style={{ marginLeft: 6 }}>{displayTypeConfig[selectedGroup.displayType]?.label}</span>
                </Tag>
              </div>
            </div>
            <div>
              <Text type="secondary">排序</Text>
              <div style={{ marginTop: 4, fontWeight: 500 }}>{selectedGroup.order}</div>
            </div>
            <div>
              <Text type="secondary">内容数量</Text>
              <div style={{ marginTop: 4, fontWeight: 500 }}>{selectedGroup.items?.length || 0} 项</div>
            </div>
          </div>

          {/* 内容列表 */}
          <Divider>内容列表</Divider>
          {selectedGroup.items && selectedGroup.items.length > 0 ? (
            <List
              grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 4 }}
              dataSource={selectedGroup.items}
              renderItem={item => (
                <List.Item>
                  <Card
                    size="small"
                    style={{ 
                      opacity: item.visible ? 1 : 0.5, 
                      boxShadow: 'none', 
                      border: '1px solid #e5e7eb',
                      transition: 'border-color 0.2s, transform 0.2s'
                    }}
                    cover={item.qrCodeUrl ? (
                      <div style={{ padding: 12, textAlign: 'center', background: '#fafafa' }}>
                        <Image src={item.qrCodeUrl} width={80} height={80} style={{ objectFit: 'contain' }} />
                      </div>
                    ) : null}
                    actions={[
                      <EditOutlined key="edit" onClick={() => handleEditItem(item)} />,
                      <Popconfirm key="delete" title="确定删除？" onConfirm={() => handleDeleteItem(item.id)}>
                        <DeleteOutlined style={{ color: '#ff4d4f' }} />
                      </Popconfirm>
                    ]}
                  >
                    <Card.Meta
                      title={
                        <Space>
                          <span>{item.name}</span>
                          {!item.visible && <Tag color="default">隐藏</Tag>}
                        </Space>
                      }
                      description={
                        <div>
                          <Tag>{itemTypes.find(t => t.value === item.type)?.label}</Tag>
                          {item.description && <div style={{ marginTop: 4, fontSize: 12, color: '#999' }}>{item.description}</div>}
                          {item.link && <div style={{ marginTop: 4, fontSize: 12, color: '#1890ff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.link}</div>}
                        </div>
                      }
                    />
                  </Card>
                </List.Item>
              )}
            />
          ) : (
            <div style={{ textAlign: 'center', padding: 40, color: '#999', background: '#fafafa', borderRadius: 8 }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📝</div>
              <div>暂无内容</div>
              <Button type="link" icon={<PlusOutlined />} onClick={() => handleAddItem(selectedGroup.id)}>
                添加第一个内容
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* 无分组时的提示 */}
      {!loading && groups.length === 0 && (
        <Card style={{ boxShadow: 'none', border: '1px solid #e5e7eb' }}>
          <div style={{ textAlign: 'center', padding: 60 }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🔗</div>
            <Title level={5} type="secondary">暂无分组</Title>
            <Text type="secondary">创建分组后，可以在每个分组下添加社交媒体链接或二维码</Text>
            <div style={{ marginTop: 24 }}>
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAddGroup}>
                添加第一个分组
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* 分组编辑弹窗 */}
      <Modal 
        title={editingGroup ? '编辑分组' : '添加分组'} 
        open={groupModalOpen} 
        onOk={handleGroupSubmit} 
        onCancel={() => setGroupModalOpen(false)}
        width={520}
      >
        <Form form={groupForm} layout="vertical">
          <Row gutter={16}>
            <Col span={16}>
              <Form.Item name="name" label="分组名称" rules={[{ required: true, message: '请输入分组名称' }]}>
                <Input placeholder="如：社媒账号、官方社群、公众号" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="icon" label="触发图标" rules={[{ required: true, message: '请选择图标' }]}>
                <Select placeholder="选择图标">
                  {presetIcons.map(icon => (
                    <Select.Option key={icon.value} value={icon.value}>
                      {icon.label}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item name="displayType" label="展示类型" rules={[{ required: true }]} extra="决定鼠标移入时显示的内容样式">
            <Select>
              {Object.entries(displayTypeConfig).map(([key, config]) => (
                <Select.Option key={key} value={key}>
                  <Space>
                    <span style={{ color: config.color }}>{config.icon}</span>
                    <span>{config.label}</span>
                    <Text type="secondary" style={{ fontSize: 12 }}>- {config.description}</Text>
                  </Space>
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="order" label="排序" extra="数字越小越靠前">
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="visible" label="是否显示" valuePropName="checked">
                <Switch checkedChildren="显示" unCheckedChildren="隐藏" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* 项目编辑弹窗 */}
      <Modal 
        title={editingItem ? '编辑内容' : '添加内容'} 
        open={itemModalOpen} 
        onOk={handleItemSubmit} 
        onCancel={() => setItemModalOpen(false)} 
        width={600}
      >
        <Form form={itemForm} layout="vertical">
          <Form.Item name="groupId" hidden><Input /></Form.Item>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="name" label="名称" rules={[{ required: true, message: '请输入名称' }]}>
                <Input placeholder="如：微信公众号、设计交流群" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="type" label="类型" rules={[{ required: true }]}>
                <Select options={itemTypes} placeholder="选择类型" />
              </Form.Item>
            </Col>
          </Row>
          
          {/* 链接 - 链接列表和混合模式需要 */}
          {(getCurrentGroupType() === 'links' || getCurrentGroupType() === 'mixed') && (
            <Form.Item name="link" label="链接地址">
              <Input placeholder="https://..." />
            </Form.Item>
          )}
          
          {/* 二维码 - 二维码和混合模式需要 */}
          {(getCurrentGroupType() === 'qrcode' || getCurrentGroupType() === 'mixed') && (
            <Form.Item label="二维码图片">
              <Space direction="vertical" style={{ width: '100%' }}>
                {qrCodeUrl && (
                  <div style={{ padding: 12, background: '#fafafa', borderRadius: 8, textAlign: 'center' }}>
                    <Image src={qrCodeUrl} alt="二维码" style={{ maxWidth: 150, maxHeight: 150 }} />
                  </div>
                )}
                <Space>
                  <Upload {...uploadProps}>
                    <Button icon={<UploadOutlined />}>上传二维码</Button>
                  </Upload>
                  {qrCodeUrl && (
                    <Button 
                      danger 
                      icon={<DeleteOutlined />} 
                      onClick={() => { setQrCodeUrl(''); itemForm.setFieldValue('qrCodeUrl', ''); }}
                    >
                      清除
                    </Button>
                  )}
                </Space>
              </Space>
            </Form.Item>
          )}
          <Form.Item name="qrCodeUrl" hidden><Input /></Form.Item>
          
          <Form.Item name="description" label="描述" extra="显示在名称下方的说明文字">
            <TextArea rows={2} placeholder="简短描述" />
          </Form.Item>
          
          {/* 额外信息 - 混合模式可能需要 */}
          {getCurrentGroupType() === 'mixed' && (
            <Form.Item 
              name="extraInfo" 
              label="群列表（JSON）" 
              extra="用于显示多个群号，格式：{&quot;groups&quot;: [&quot;群1&quot;, &quot;群2&quot;]}"
            >
              <TextArea rows={3} placeholder='{"groups": ["设计交流1群", "设计交流2群"]}' />
            </Form.Item>
          )}
          
          <Divider />
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="order" label="排序">
                <InputNumber style={{ width: '100%' }} placeholder="数字越小越靠前" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="visible" label="是否显示" valuePropName="checked">
                <Switch checkedChildren="显示" unCheckedChildren="隐藏" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
}
