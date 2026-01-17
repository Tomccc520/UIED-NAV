/**
 * @file Categories.tsx
 * @description 管理后台组件
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

import { useEffect, useState, useMemo } from 'react';
import {
  Card,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  ColorPicker,
  Space,
  message,
  Popconfirm,
  Switch,
  Tag,
  Tooltip,
  Empty,
  Spin,
  Table,
  Typography,
  Row,
  Col,
  Statistic,
  Select,
} from 'antd';
import type { TableProps } from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  FolderOutlined,
  ReloadOutlined,
  AppstoreOutlined,
  SearchOutlined,
  FilterOutlined,
  ClearOutlined,
} from '@ant-design/icons';
import { categoryApi, type PaginationInfo } from '../services/api';
import IconPicker from '../components/IconPicker';
import { getIconByKey } from '../config/icons';

// 图标渲染组件 - 使用前端相同的 SVG 图标
const CategoryIcon: React.FC<{ iconKey: string; size?: number; color?: string }> = ({ 
  iconKey, 
  size = 18,
  color = '#fff'
}) => {
  const iconInfo = getIconByKey(iconKey);
  
  if (iconInfo) {
    const IconComponent = iconInfo.icon;
    return <IconComponent size={size} color={color} />;
  }
  
  // 如果找不到图标，显示默认图标
  return <FolderOutlined style={{ fontSize: size, color }} />;
};

const { Title, Text } = Typography;

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
  description?: string;
  parentId?: string;
  order: number;
  visible: boolean;
  children?: Category[];
  _count?: { websites: number };
}

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [flatCategories, setFlatCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [parentId, setParentId] = useState<string | null>(null);
  const [form] = Form.useForm();
  
  // 分页状态
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    pageSize: 10,
    totalPages: 0,
    hasMore: false,
  });

  // 搜索和筛选状态
  const [searchText, setSearchText] = useState('');
  const [visibilityFilter, setVisibilityFilter] = useState<string>('all');
  const [websiteFilter, setWebsiteFilter] = useState<string>('all');

  // 获取分类数据（支持分页）
  const fetchCategories = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      // 获取分页的树形结构 - 添加时间戳避免缓存
      const timestamp = Date.now();
      const treeRes = await categoryApi.getTreePaginated({ page, pageSize, _t: timestamp } as any);
      
      // 检查响应格式（分页或非分页）
      if (treeRes.data.pagination) {
        setCategories(treeRes.data.data);
        setPagination(treeRes.data.pagination);
      } else {
        // 向后兼容：非分页响应
        const dataArray = treeRes.data as unknown as Category[];
        setCategories(dataArray);
        setPagination({
          total: dataArray.length,
          page: 1,
          pageSize: dataArray.length,
          totalPages: 1,
          hasMore: false,
        });
      }
      
      // 获取扁平列表用于统计
      const flatRes = await categoryApi.getAll();
      setFlatCategories(flatRes.data);
    } catch (error) {
      message.error('获取分类失败');
    } finally {
      setLoading(false);
    }
  };

  // 处理分页变化
  const handleTableChange = (paginationConfig: any) => {
    fetchCategories(paginationConfig.current, paginationConfig.pageSize);
  };

  useEffect(() => {
    fetchCategories(pagination.page, pagination.pageSize);
  }, []);

  // 添加主分类
  const handleAddMain = () => {
    setEditingId(null);
    setParentId(null);
    form.resetFields();
    form.setFieldsValue({ order: 0, color: '#1890ff', visible: true, icon: 'Folder' });
    setModalOpen(true);
  };

  // 添加子分类
  const handleAddChild = (pId: string) => {
    setEditingId(null);
    setParentId(pId);
    form.resetFields();
    const parent = categories.find(c => c.id === pId);
    form.setFieldsValue({ 
      order: parent?.children?.length || 0, 
      color: parent?.color || '#1890ff', 
      visible: true,
      icon: 'Folder'
    });
    setModalOpen(true);
  };

  // 编辑分类
  const handleEdit = (record: Category) => {
    setEditingId(record.id);
    setParentId(record.parentId || null);
    // 不要在表单中设置 parentId，因为表单没有这个字段
    const { parentId: _pid, ...formValues } = record;
    form.setFieldsValue(formValues);
    setModalOpen(true);
  };

  // 删除分类
  const handleDelete = async (id: string) => {
    try {
      await categoryApi.delete(id);
      message.success('删除成功');
      fetchCategories(pagination.page, pagination.pageSize);
    } catch (error) {
      message.error('删除失败');
    }
  };

  // 提交表单
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const color = typeof values.color === 'string' ? values.color : values.color.toHexString();
      // 从表单值中排除 parentId，使用组件状态中的 parentId
      const { parentId: _formParentId, ...restValues } = values;
      const data = { ...restValues, color, parentId: parentId || null };
      
      console.log('提交数据:', data);

      if (editingId) {
        await categoryApi.update(editingId, data);
        message.success('更新成功');
      } else {
        await categoryApi.create(data);
        message.success('创建成功');
      }
      setModalOpen(false);
      fetchCategories(pagination.page, pagination.pageSize);
    } catch (error: any) {
      console.error('操作失败:', error);
      console.error('错误响应:', error.response?.data);
      // 显示更详细的错误信息
      const errorMsg = error.response?.data?.error || error.message || '操作失败';
      message.error(`操作失败: ${errorMsg}`);
    }
  };

  // 计算统计数据
  const totalWebsites = flatCategories.reduce((sum, cat) => sum + (cat._count?.websites || 0), 0);
  const mainCategoriesCount = flatCategories.filter(c => !c.parentId).length;
  const subCategoriesCount = flatCategories.filter(c => c.parentId).length;

  // 是否有筛选条件
  const hasFilters = searchText || visibilityFilter !== 'all' || websiteFilter !== 'all';

  // 筛选后的分类数据
  // 当有筛选条件时，从所有数据(flatCategories)中搜索并重建树形结构
  // 当没有筛选条件时，使用分页数据(categories)
  const filteredCategories = useMemo(() => {
    if (!hasFilters) {
      // 没有筛选条件，直接返回分页数据
      return categories;
    }
    
    // 有筛选条件，从所有数据中搜索
    // 先获取所有主分类
    const mainCats = flatCategories.filter(c => !c.parentId);
    // 获取所有子分类
    const subCats = flatCategories.filter(c => c.parentId);
    
    // 重建树形结构
    const treeData = mainCats.map(main => ({
      ...main,
      children: subCats.filter(sub => sub.parentId === main.id)
    }));
    
    // 应用筛选条件
    return treeData.filter(category => {
      // 搜索过滤 - 主分类或子分类匹配
      const mainMatch = !searchText || 
        category.name.toLowerCase().includes(searchText.toLowerCase()) ||
        category.slug.toLowerCase().includes(searchText.toLowerCase());
      
      const childMatch = category.children?.some(child => 
        child.name.toLowerCase().includes(searchText.toLowerCase()) ||
        child.slug.toLowerCase().includes(searchText.toLowerCase())
      );
      
      const matchSearch = mainMatch || childMatch;
      
      // 可见性过滤
      const matchVisibility = visibilityFilter === 'all' || 
        (visibilityFilter === 'visible' && category.visible) ||
        (visibilityFilter === 'hidden' && !category.visible);
      
      // 网站数过滤
      const categoryWebsiteCount = (category._count?.websites || 0) + 
        (category.children?.reduce((sum, child) => sum + (child._count?.websites || 0), 0) || 0);
      const matchWebsite = websiteFilter === 'all' ||
        (websiteFilter === 'hasWebsites' && categoryWebsiteCount > 0) ||
        (websiteFilter === 'noWebsites' && categoryWebsiteCount === 0);
      
      return matchSearch && matchVisibility && matchWebsite;
    });
  }, [categories, flatCategories, searchText, visibilityFilter, websiteFilter, hasFilters]);

  // 清除筛选
  const clearFilters = () => {
    setSearchText('');
    setVisibilityFilter('all');
    setWebsiteFilter('all');
  };

  // 主分类表格列
  const columns: TableProps<Category>['columns'] = [
    {
      title: '分类名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      render: (name: string, record: Category) => (
        <Space>
          <div style={{ 
            width: 32, 
            height: 32, 
            borderRadius: 6, 
            background: record.color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
          }}>
            <CategoryIcon iconKey={record.icon} size={18} color="#fff" />
          </div>
          <div>
            <div style={{ fontWeight: 500 }}>{name}</div>
            <Text type="secondary" style={{ fontSize: 12 }}>{record.slug}</Text>
          </div>
        </Space>
      ),
    },
    {
      title: '子分类',
      key: 'children',
      width: 100,
      align: 'center',
      render: (_: any, record: Category) => (
        <Tag>{record.children?.length || 0} 个</Tag>
      ),
    },
    {
      title: '网站数',
      key: 'websites',
      width: 100,
      align: 'center',
      render: (_: any, record: Category) => {
        let count = record._count?.websites || 0;
        if (record.children) {
          record.children.forEach(child => {
            count += child._count?.websites || 0;
          });
        }
        return <Tag color="blue">{count}</Tag>;
      },
    },
    {
      title: '状态',
      dataIndex: 'visible',
      key: 'visible',
      width: 80,
      align: 'center',
      render: (visible: boolean) => (
        <Tag color={visible ? 'success' : 'default'}>
          {visible ? '显示' : '隐藏'}
        </Tag>
      ),
    },
    {
      title: '排序',
      dataIndex: 'order',
      key: 'order',
      width: 80,
      align: 'center',
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: any, record: Category) => (
        <Space>
          <Button 
            type="link" 
            size="small" 
            icon={<PlusOutlined />}
            onClick={() => handleAddChild(record.id)}
          >
            添加子分类
          </Button>
          <Tooltip title="编辑">
            <Button 
              type="text" 
              size="small" 
              icon={<EditOutlined />} 
              onClick={() => handleEdit(record)} 
            />
          </Tooltip>
          <Popconfirm 
            title="确定删除？" 
            description="删除后所有子分类也会被删除"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button type="text" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 子分类表格列
  const subColumns: TableProps<Category>['columns'] = [
    {
      title: '子分类名称',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: Category) => (
        <Space>
          <div style={{ 
            width: 8, 
            height: 8, 
            borderRadius: '50%', 
            background: record.color,
          }} />
          <span>{name}</span>
          {!record.visible && <Tag color="red">隐藏</Tag>}
        </Space>
      ),
    },
    {
      title: 'URL标识',
      dataIndex: 'slug',
      key: 'slug',
      width: 180,
      render: (slug: string) => <Text code>{slug}</Text>,
    },
    {
      title: '网站数',
      key: 'websites',
      width: 80,
      align: 'center',
      render: (_: any, record: Category) => record._count?.websites || 0,
    },
    {
      title: '排序',
      dataIndex: 'order',
      key: 'order',
      width: 60,
      align: 'center',
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      align: 'center',
      render: (_: any, record: Category) => (
        <Space size="small">
          <Tooltip title="编辑">
            <Button 
              type="text" 
              size="small" 
              icon={<EditOutlined />} 
              onClick={() => handleEdit(record)} 
            />
          </Tooltip>
          <Popconfirm 
            title="确定删除此子分类？" 
            onConfirm={() => handleDelete(record.id)}
          >
            <Button type="text" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 展开行渲染
  const expandedRowRender = (record: Category) => {
    if (!record.children || record.children.length === 0) {
      return (
        <Empty 
          description="暂无子分类" 
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          style={{ margin: '16px 0' }}
        >
          <Button 
            type="primary" 
            size="small" 
            icon={<PlusOutlined />}
            onClick={() => handleAddChild(record.id)}
          >
            添加子分类
          </Button>
        </Empty>
      );
    }
    
    return (
      <Table
        columns={subColumns}
        dataSource={record.children}
        rowKey="id"
        size="small"
        pagination={false}
        style={{ margin: '-8px -8px -8px 0' }}
      />
    );
  };

  return (
    <div>
      {/* 页面标题和统计 */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col flex="auto">
            <Title level={4} style={{ margin: 0 }}>
              <AppstoreOutlined style={{ marginRight: 8 }} />
              分类管理
            </Title>
          </Col>
          <Col>
            <Space size="large">
              <Statistic title="主分类" value={mainCategoriesCount} />
              <Statistic title="子分类" value={subCategoriesCount} />
              <Statistic title="网站总数" value={totalWebsites} />
            </Space>
          </Col>
          <Col>
            <Space>
              <Button icon={<ReloadOutlined />} onClick={() => fetchCategories(pagination.page, pagination.pageSize)}>
                刷新
              </Button>
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAddMain}>
                添加主分类
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 搜索和筛选 */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col flex="auto">
            <Space wrap>
              <Input
                placeholder="搜索分类名称或标识..."
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ width: 240 }}
                allowClear
              />
              <Select
                value={visibilityFilter}
                onChange={setVisibilityFilter}
                style={{ width: 120 }}
                options={[
                  { value: 'all', label: '全部状态' },
                  { value: 'visible', label: '显示中' },
                  { value: 'hidden', label: '已隐藏' },
                ]}
              />
              <Select
                value={websiteFilter}
                onChange={setWebsiteFilter}
                style={{ width: 140 }}
                options={[
                  { value: 'all', label: '全部分类' },
                  { value: 'hasWebsites', label: '有网站' },
                  { value: 'noWebsites', label: '无网站' },
                ]}
              />
              {hasFilters && (
                <Button 
                  icon={<ClearOutlined />} 
                  onClick={clearFilters}
                >
                  清除筛选
                </Button>
              )}
            </Space>
          </Col>
          <Col>
            {hasFilters && (
              <Tag color="blue">
                <FilterOutlined /> 筛选结果: {filteredCategories.length} 个主分类
              </Tag>
            )}
          </Col>
        </Row>
      </Card>

      {/* 分类表格 */}
      <Card>
        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={filteredCategories}
            rowKey="id"
            expandable={{
              expandedRowRender,
              expandRowByClick: true,
              childrenColumnName: 'subCategories', // 禁用默认的children树形展示
            }}
            onChange={handleTableChange}
            pagination={hasFilters ? false : {
              current: pagination.page,
              pageSize: pagination.pageSize,
              total: pagination.total,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 个主分类`,
              pageSizeOptions: ['5', '10', '20', '50'],
            }}
            locale={{ emptyText: <Empty description={hasFilters ? "没有匹配的分类" : "暂无分类"} /> }}
          />
        </Spin>
      </Card>

      {/* 编辑/添加弹窗 */}
      <Modal
        title={editingId ? '编辑分类' : parentId ? '添加子分类' : '添加主分类'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        width={500}
        okText="保存"
        cancelText="取消"
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          {parentId && (
            <Form.Item label="所属主分类">
              <Input 
                value={categories.find(c => c.id === parentId)?.name || ''} 
                disabled 
                prefix={<FolderOutlined />}
              />
            </Form.Item>
          )}

          <Form.Item 
            name="name" 
            label="分类名称" 
            rules={[{ required: true, message: '请输入分类名称' }]}
          >
            <Input placeholder="如：设计灵感" />
          </Form.Item>

          <Form.Item 
            name="slug" 
            label="URL标识" 
            rules={[{ required: true, message: '请输入URL标识' }]}
            extra="用于URL，建议使用英文小写和连字符"
          >
            <Input placeholder="如：design-inspiration" />
          </Form.Item>

          <Form.Item name="description" label="描述">
            <Input.TextArea rows={2} placeholder="分类描述（可选）" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item 
                name="icon" 
                label="图标" 
                rules={[{ required: true, message: '请选择图标' }]}
              >
                <IconPicker />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item 
                name="color" 
                label="颜色" 
                rules={[{ required: true, message: '请选择颜色' }]}
              >
                <ColorPicker showText />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="order" label="排序">
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="visible" label="显示" valuePropName="checked">
                <Switch checkedChildren="显示" unCheckedChildren="隐藏" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
}
