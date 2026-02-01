/**
 * @file Websites.tsx
 * @description 管理后台组件
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

import { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Switch,
  Space,
  Tag,
  message,
  Popconfirm,
  Card,
  Row,
  Col,
  TreeSelect,
  Tooltip,
  Upload,
  Image,
  Tabs,
  Select,
} from 'antd';
import type { UploadProps } from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
  LinkOutlined,
  FilterOutlined,
  UploadOutlined,
  GlobalOutlined,
  RobotOutlined,
  PushpinOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import NovelEditor from '../components/NovelEditor';
import AIContentModal from '../components/AIContentModal';
import api, { websiteApi, categoryApi, faviconApiService, type PaginationInfo } from '../services/api';

interface Website {
  id: string;
  name: string;
  slug?: string;
  description: string;
  url: string;
  iconUrl?: string;
  categoryId: string;
  category?: { id: string; name: string; slug: string; parentId?: string };
  isNew: boolean;
  isFeatured: boolean;
  isHot: boolean;
  isPinned: boolean;
  tags: string;
  order: number;
  // SEO 字段
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  // 详情页内容字段
  detailContent?: string;
  screenshots?: string;
  visitBtnText?: string;
  createdAt?: string;
  updatedAt?: string;
  // 网站标签
  websiteTags?: WebsiteTag[];
}

interface WebsiteTag {
  id: string;
  name: string;
  slug: string;
  color?: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  parentId?: string;
  color: string;
  children?: Category[];
  _count?: { websites: number };
}

export default function Websites() {
  const [websites, setWebsites] = useState<Website[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [flatCategories, setFlatCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [iconUrl, setIconUrl] = useState<string>('');
  const [iconUrlInput, setIconUrlInput] = useState<string>(''); // 新增：图标URL输入
  const [fetchingIcon, setFetchingIcon] = useState(false);
  const [fetchingSeo, setFetchingSeo] = useState(false); // 新增：SEO抓取状态
  const [generatingAi, setGeneratingAi] = useState(false);
  const [screenshots, setScreenshots] = useState<string[]>([]); // 截图列表
  const [detailContent, setDetailContent] = useState<string>(''); // 详情内容
  const [aiModalOpen, setAiModalOpen] = useState(false); // AI 弹窗状态
  const [websiteTags, setWebsiteTags] = useState<WebsiteTag[]>([]); // 所有可用标签
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]); // 当前选中的标签ID
  const [form] = Form.useForm();
  
  // 分页状态
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    pageSize: 20,
    totalPages: 0,
    hasMore: false,
  });
  
  // 排序状态
  const [sortField, setSortField] = useState<string>('order');
  const [sortOrder, setSortOrder] = useState<string>('ascend');

  // 获取分类数据
  const fetchCategories = async () => {
    try {
      const categoriesRes = await categoryApi.getAll();
      const allCategories = categoriesRes.data;
      setFlatCategories(allCategories);
      const tree = buildCategoryTree(allCategories);
      setCategories(tree);
    } catch (error) {
      message.error('获取分类失败');
    }
  };

  // 获取所有网站标签
  const fetchWebsiteTags = async () => {
    try {
      const res = await api.get('/website-tags');
      const tags = res.data.data || res.data || [];
      setWebsiteTags(tags);
    } catch (error) {
      console.error('获取标签失败:', error);
    }
  };

  // 获取网站的标签
  const fetchWebsiteTagIds = async (websiteId: string) => {
    try {
      const res = await api.get(`/website-tags/website/${websiteId}/tags`);
      const tags = res.data.data || [];
      setSelectedTagIds(tags.map((t: WebsiteTag) => t.id));
    } catch (error) {
      console.error('获取网站标签失败:', error);
      setSelectedTagIds([]);
    }
  };

  // 保存网站标签
  const saveWebsiteTags = async (websiteId: string, tagIds: string[]) => {
    try {
      await api.post(`/website-tags/website/${websiteId}/tags`, { tagIds });
    } catch (error) {
      console.error('保存标签失败:', error);
    }
  };

  // 获取网站数据（支持分页和筛选）
  const fetchWebsites = async (page = 1, pageSize = 20, field?: string, order?: string) => {
    setLoading(true);
    try {
      // 构建查询参数
      const params: any = { page, pageSize };
      
      // 如果选择了分类，获取该分类及其所有子分类的ID
      if (selectedCategory) {
        const categoryIds = new Set<string>([selectedCategory]);
        const findChildren = (parentId: string) => {
          flatCategories.forEach(cat => {
            if (cat.parentId === parentId) {
              categoryIds.add(cat.id);
              findChildren(cat.id);
            }
          });
        };
        findChildren(selectedCategory);
        // 后端目前只支持单个分类筛选，这里传递选中的分类
        params.category = selectedCategory;
      }
      
      if (searchText) {
        params.search = searchText;
      }
      
      // 添加排序参数
      if (field) {
        params.sortField = field;
        params.sortOrder = order;
      } else if (sortField) {
        params.sortField = sortField;
        params.sortOrder = sortOrder;
      }
      
      const response = await websiteApi.getPaginated(params);
      
      // 检查响应格式（分页或非分页）
      if (response.data.pagination) {
        setWebsites(response.data.data);
        setPagination(response.data.pagination);
      } else {
        // 向后兼容：非分页响应
        const dataArray = response.data as unknown as Website[];
        setWebsites(dataArray);
        setPagination({
          total: dataArray.length,
          page: 1,
          pageSize: dataArray.length,
          totalPages: 1,
          hasMore: false,
        });
      }
    } catch (error) {
      message.error('获取网站数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 构建分类树
  const buildCategoryTree = (items: Category[]): Category[] => {
    const map = new Map<string, Category>();
    const roots: Category[] = [];

    items.forEach((item) => {
      map.set(item.id, { ...item, children: [] });
    });

    items.forEach((item) => {
      const node = map.get(item.id)!;
      if (item.parentId) {
        const parent = map.get(item.parentId);
        if (parent) {
          parent.children!.push(node);
        } else {
          roots.push(node);
        }
      } else {
        roots.push(node);
      }
    });

    return roots;
  };

  // 转换为TreeSelect数据格式
  const convertToTreeSelectData = (items: Category[]): any[] => {
    return items.map((item) => ({
      value: item.id,
      title: item.name, // 使用纯字符串，方便搜索
      label: (
        <span>
          {item.name}
          {item._count?.websites ? (
            <Tag color="blue" style={{ marginLeft: 8, fontSize: 11 }}>
              {item._count.websites}
            </Tag>
          ) : null}
        </span>
      ),
      children:
        item.children && item.children.length > 0
          ? convertToTreeSelectData(item.children)
          : undefined,
    }));
  };

  useEffect(() => {
    fetchCategories();
    fetchWebsiteTags();
  }, []);

  // 当分类加载完成后，获取网站数据
  useEffect(() => {
    if (flatCategories.length > 0 || !selectedCategory) {
      fetchWebsites(1, pagination.pageSize);
    }
  }, [selectedCategory, searchText, flatCategories.length]);

  // 处理分页和排序变化
  const handleTableChange = (paginationConfig: any, _filters: any, sorter: any) => {
    // 处理排序
    if (sorter && sorter.field) {
      setSortField(sorter.field);
      setSortOrder(sorter.order || 'ascend');
      fetchWebsites(paginationConfig.current, paginationConfig.pageSize, sorter.field, sorter.order);
    } else {
      fetchWebsites(paginationConfig.current, paginationConfig.pageSize);
    }
  };

  const handleAdd = () => {
    setEditingId(null);
    setIconUrl('');
    setIconUrlInput(''); // 清空图标URL输入
    setScreenshots([]); // 清空截图
    setDetailContent(''); // 清空详情内容
    setSelectedTagIds([]); // 清空选中的标签
    form.resetFields();
    form.setFieldsValue({ 
      order: 0, 
      isNew: false, 
      isFeatured: false, 
      isHot: false, 
      isPinned: false,
      tags: '',
      categoryId: selectedCategory || undefined,
      visitBtnText: '访问网站',
    });
    setModalOpen(true);
  };

  const handleEdit = (record: Website) => {
    setEditingId(record.id);
    setIconUrl(record.iconUrl || '');
    setIconUrlInput(record.iconUrl || ''); // 设置图标URL输入
    // 解析截图列表
    try {
      const screenshotList = record.screenshots ? JSON.parse(record.screenshots) : [];
      setScreenshots(Array.isArray(screenshotList) ? screenshotList : []);
    } catch {
      setScreenshots([]);
    }
    // 设置详情内容
    setDetailContent(record.detailContent || '');
    // 获取网站标签
    fetchWebsiteTagIds(record.id);
    form.setFieldsValue({
      ...record,
      tags: record.tags || '',
      visitBtnText: record.visitBtnText || '访问网站',
    });
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await websiteApi.delete(id);
      message.success('删除成功');
      // 刷新当前页数据
      fetchWebsites(pagination.page, pagination.pageSize);
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      // 确保tags是字符串
      const data = {
        ...values,
        iconUrl: iconUrl || null,
        tags: typeof values.tags === 'string' ? values.tags : JSON.stringify(values.tags || []),
        screenshots: JSON.stringify(screenshots),
        detailContent: detailContent || '', // 使用状态中的详情内容
        slug: values.slug?.trim() || null,
      };
      
      console.log('提交数据:', data);
      
      let websiteId = editingId;
      if (editingId) {
        await websiteApi.update(editingId, data);
        message.success('更新成功');
      } else {
        const res = await websiteApi.create(data);
        websiteId = res.data.id || res.data.data?.id;
        message.success('创建成功');
      }
      
      // 保存网站标签
      if (websiteId && selectedTagIds.length > 0) {
        await saveWebsiteTags(websiteId, selectedTagIds);
      } else if (websiteId && selectedTagIds.length === 0 && editingId) {
        // 如果编辑时清空了标签，也要更新
        await saveWebsiteTags(websiteId, []);
      }
      
      setModalOpen(false);
      // 刷新当前页数据
      fetchWebsites(pagination.page, pagination.pageSize);
    } catch (error: any) {
      console.error('操作失败:', error);
      console.error('错误响应:', error.response?.data);
      const errorMsg = error.response?.data?.error || error.message || '操作失败';
      message.error(`操作失败: ${errorMsg}`);
    }
  };

  // 上传图标
  const handleUploadIcon = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    try {
      const response = await api.post('/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      // 使用相对路径，让浏览器自动使用当前域名
      const uploadedUrl = response.data.url.startsWith('http') 
        ? response.data.url 
        : `${window.location.origin}${response.data.url}`;
      setIconUrl(uploadedUrl);
      message.success('图标上传成功');
    } catch (error) {
      message.error('上传失败');
    }
    return false;
  };

  // 自动获取favicon
  const handleFetchFavicon = async () => {
    const url = form.getFieldValue('url');
    if (!url) {
      message.warning('请先输入网站URL');
      return;
    }
    setFetchingIcon(true);
    try {
      const res = await faviconApiService.fetchFavicon(url);
      setIconUrl(res.data.faviconUrl);
      message.success(`已获取图标 (来源: ${res.data.source})`);
    } catch (error) {
      message.error('获取图标失败');
    } finally {
      setFetchingIcon(false);
    }
  };

  // AI 生成网站信息
  const handleAiGenerate = async () => {
    const url = form.getFieldValue('url');
    if (!url) {
      message.warning('请先输入网站URL');
      return;
    }
    setGeneratingAi(true);
    try {
      // 直接调用 AI API
      const res = await api.post('/ai-config/generate-website-info', { url });
      const { name, description, tags } = res.data;
      
      // 填充表单
      if (name) form.setFieldValue('name', name);
      if (description) form.setFieldValue('description', description);
      if (tags) form.setFieldValue('tags', tags);
      
      message.success('AI 生成成功');
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'AI 生成失败';
      message.error(errorMsg);
    } finally {
      setGeneratingAi(false);
    }
  };

  // SEO 抓取网站信息
  const handleSeoFetch = async () => {
    const url = form.getFieldValue('url');
    if (!url) {
      message.warning('请先输入网站URL');
      return;
    }
    setFetchingSeo(true);
    try {
      const res = await api.post('/seo-scraper/fetch', { url });
      const { title, description, keywords } = res.data.data;
      
      // 填充表单
      if (title && !form.getFieldValue('name')) {
        form.setFieldValue('name', title);
      }
      if (description && !form.getFieldValue('description')) {
        form.setFieldValue('description', description);
      }
      if (keywords && !form.getFieldValue('tags')) {
        form.setFieldValue('tags', keywords);
      }
      
      message.success('SEO 信息获取成功');
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'SEO 信息获取失败';
      message.error(errorMsg);
    } finally {
      setFetchingSeo(false);
    }
  };

  // 快捷切换置顶状态
  const handleTogglePin = async (record: Website) => {
    try {
      await websiteApi.update(record.id, { isPinned: !record.isPinned });
      message.success(record.isPinned ? '已取消置顶' : '已置顶');
      fetchWebsites(pagination.page, pagination.pageSize);
    } catch (error) {
      message.error('操作失败');
    }
  };

  // 查看网站详情页（前端）
  const handleViewDetail = (record: Website) => {
    // 在新窗口打开前端详情页，优先使用 slug
    const frontendUrl = import.meta.env.VITE_FRONTEND_URL || 'http://localhost:3000';
    const identifier = record.slug || record.id;
    window.open(`${frontendUrl}/website/${identifier}`, '_blank');
  };

  const uploadProps: UploadProps = {
    beforeUpload: handleUploadIcon,
    showUploadList: false,
    accept: 'image/*',
  };

  // 获取分类名称（包含父分类）
  const getCategoryPath = (categoryId: string): string => {
    const category = flatCategories.find(c => c.id === categoryId);
    if (!category) return '-';
    
    if (category.parentId) {
      const parent = flatCategories.find(c => c.id === category.parentId);
      if (parent) {
        return `${parent.name} / ${category.name}`;
      }
    }
    return category.name;
  };

  const columns = [
    { 
      title: '名称', 
      dataIndex: 'name', 
      key: 'name', 
      width: 200,
      render: (name: string, record: Website) => (
        <Space>
          {record.iconUrl ? (
            <img 
              src={record.iconUrl} 
              alt="" 
              style={{ width: 24, height: 24, borderRadius: 4, objectFit: 'contain' }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          ) : (
            <GlobalOutlined style={{ fontSize: 20, color: '#999' }} />
          )}
          <span style={{ fontWeight: 500 }}>{name}</span>
          <Tooltip title="访问网站">
            <a href={record.url} target="_blank" rel="noopener noreferrer">
              <LinkOutlined />
            </a>
          </Tooltip>
        </Space>
      ),
    },
    { 
      title: '描述', 
      dataIndex: 'description', 
      key: 'description',
      width: 280,
      ellipsis: true,
    },
    { 
      title: '分类', 
      key: 'category', 
      width: 180,
      render: (_: any, record: Website) => (
        <Tag color="blue">{getCategoryPath(record.categoryId)}</Tag>
      ),
    },
    {
      title: '状态',
      key: 'status',
      width: 180,
      render: (_: any, record: Website) => (
        <Space size={4}>
          {record.isPinned && <Tag color="purple">置顶</Tag>}
          {record.isHot && <Tag color="red">热门</Tag>}
          {record.isNew && <Tag color="green">新增</Tag>}
          {record.isFeatured && <Tag color="orange">推荐</Tag>}
          {!record.isHot && !record.isNew && !record.isFeatured && !record.isPinned && <Tag>普通</Tag>}
        </Space>
      ),
    },
    { title: '排序', dataIndex: 'order', key: 'order', width: 70 },
    {
      title: '添加时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      sorter: true,
      render: (date: string) => date ? new Date(date).toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }) : '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 160,
      render: (_: any, record: Website) => (
        <Space size={4}>
          <Tooltip title="查看详情">
            <Button size="small" type="text" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)} />
          </Tooltip>
          <Tooltip title={record.isPinned ? '取消置顶' : '置顶'}>
            <Button 
              size="small" 
              type="text" 
              icon={<PushpinOutlined style={{ color: record.isPinned ? '#722ed1' : undefined }} />} 
              onClick={() => handleTogglePin(record)} 
            />
          </Tooltip>
          <Tooltip title="编辑">
            <Button size="small" type="text" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          </Tooltip>
          <Popconfirm title="确定删除？" onConfirm={() => handleDelete(record.id)}>
            <Tooltip title="删除">
              <Button size="small" type="text" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>网站管理</h2>
        <p style={{ color: '#666', fontSize: 14, marginTop: 8 }}>
          管理所有网站资源，可按分类筛选和搜索
        </p>
      </div>

      {/* 筛选栏 */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col flex="200px">
            <TreeSelect
              style={{ width: '100%' }}
              placeholder="按分类筛选"
              allowClear
              treeDefaultExpandAll
              value={selectedCategory}
              onChange={setSelectedCategory}
              treeData={convertToTreeSelectData(categories)}
              suffixIcon={<FilterOutlined />}
              showSearch
              treeNodeFilterProp="title"
            />
          </Col>
          <Col flex="300px">
            <Input
              placeholder="搜索网站名称、描述、URL"
              allowClear
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
            />
          </Col>
          <Col flex="auto">
            <Space>
              <Button icon={<ReloadOutlined />} onClick={() => fetchWebsites(pagination.page, pagination.pageSize)}>
                刷新
              </Button>
              <span style={{ color: '#666', fontSize: 13 }}>
                共 <strong>{pagination.total}</strong> 个网站
                {selectedCategory && ` (已筛选)`}
              </span>
            </Space>
          </Col>
          <Col>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              添加网站
            </Button>
          </Col>
        </Row>
      </Card>

      <Card>
        <Table
          columns={columns}
          dataSource={websites}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1000 }}
          onChange={handleTableChange}
          pagination={{
            current: pagination.page,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
            pageSizeOptions: ['10', '20', '50', '100'],
          }}
        />
      </Card>

      <Modal
        title={editingId ? '编辑网站' : '添加网站'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => {
          setModalOpen(false);
          setAiModalOpen(false);
        }}
        width={800}
      >
        <Form form={form} layout="vertical">
          <Tabs
            defaultActiveKey="basic"
            items={[
              {
                key: 'basic',
                label: '基本信息',
                children: (
                  <>
                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item 
                          name="name" 
                          label="网站名称" 
                          rules={[{ required: true, message: '请输入网站名称' }]}
                        >
                          <Input placeholder="如：Dribbble" />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item 
                          name="categoryId" 
                          label="所属分类" 
                          rules={[{ required: true, message: '请选择分类' }]}
                        >
                          <TreeSelect
                            placeholder="选择分类"
                            treeDefaultExpandAll
                            treeData={convertToTreeSelectData(categories)}
                            showSearch
                            treeNodeFilterProp="title"
                          />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Form.Item 
                      name="url" 
                      label="网站URL" 
                      rules={[
                        { required: true, message: '请输入网站URL' },
                        { type: 'url', message: '请输入有效的URL' }
                      ]}
                    >
                      <Input 
                        placeholder="https://dribbble.com" 
                        addonAfter={
                          <Space size={4}>
                            <Button 
                              type="link" 
                              size="small" 
                              icon={<GlobalOutlined />}
                              loading={fetchingSeo}
                              onClick={handleSeoFetch}
                              style={{ padding: 0, height: 'auto' }}
                              title="从网页抓取SEO信息"
                            >
                              SEO
                            </Button>
                            <Button 
                              type="link" 
                              size="small" 
                              icon={<RobotOutlined />}
                              loading={generatingAi}
                              onClick={handleAiGenerate}
                              style={{ padding: 0, height: 'auto' }}
                              title="AI智能生成"
                            >
                              AI
                            </Button>
                          </Space>
                        }
                      />
                    </Form.Item>

                    <Form.Item 
                      name="slug" 
                      label="固定链接"
                      extra={
                        <span>
                          用于 SEO 友好的 URL，如 dribbble，访问地址将变为 /website/dribbble。
                          <Button 
                            type="link" 
                            size="small" 
                            style={{ padding: '0 4px' }}
                            onClick={async () => {
                              const name = form.getFieldValue('name');
                              const url = form.getFieldValue('url');
                              if (name) {
                                try {
                                  // 调用后端 API 生成拼音 slug
                                  const response = await api.post('/websites/generate-slug', {
                                    name,
                                    url,
                                    excludeId: editingId
                                  });
                                  if (response.data.success) {
                                    form.setFieldValue('slug', response.data.data.slug);
                                    message.success('已生成固定链接');
                                  }
                                } catch (error) {
                                  console.error('生成 slug 失败:', error);
                                  // 降级：简单处理
                                  const slug = name
                                    .toLowerCase()
                                    .replace(/[^a-z0-9]+/g, '-')
                                    .replace(/^-|-$/g, '');
                                  form.setFieldValue('slug', slug);
                                }
                              }
                            }}
                          >
                            自动生成
                          </Button>
                        </span>
                      }
                    >
                      <Input 
                        placeholder="dribbble（留空则使用ID）" 
                        addonBefore="/website/"
                      />
                    </Form.Item>

                    <Form.Item label="网站图标">
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 16,
                        padding: 16,
                        border: '1px dashed #d9d9d9',
                        borderRadius: 8,
                        background: '#fafafa'
                      }}>
                        {iconUrl ? (
                          <Image
                            src={iconUrl}
                            alt="网站图标"
                            style={{ width: 64, height: 64, objectFit: 'contain' }}
                            fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
                          />
                        ) : (
                          <div style={{ 
                            width: 64, 
                            height: 64, 
                            background: '#f0f0f0', 
                            borderRadius: 8,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <GlobalOutlined style={{ fontSize: 24, color: '#999' }} />
                          </div>
                        )}
                        <div style={{ flex: 1 }}>
                          <Space direction="vertical" size="small" style={{ width: '100%' }}>
                            <Space>
                              <Upload {...uploadProps}>
                                <Button size="small" icon={<UploadOutlined />}>上传图标</Button>
                              </Upload>
                              <Button 
                                size="small" 
                                icon={<GlobalOutlined />} 
                                onClick={handleFetchFavicon}
                                loading={fetchingIcon}
                              >
                                自动获取
                              </Button>
                              {iconUrl && (
                                <Button 
                                  size="small" 
                                  danger 
                                  onClick={() => setIconUrl('')}
                                >
                                  清除
                                </Button>
                              )}
                            </Space>
                            <Input
                              size="small"
                              placeholder="或输入图标URL"
                              value={iconUrlInput}
                              onChange={(e) => setIconUrlInput(e.target.value)}
                              onPressEnter={() => {
                                if (iconUrlInput) {
                                  setIconUrl(iconUrlInput);
                                  message.success('图标URL已设置');
                                }
                              }}
                              addonAfter={
                                <Button 
                                  type="link" 
                                  size="small"
                                  onClick={() => {
                                    if (iconUrlInput) {
                                      setIconUrl(iconUrlInput);
                                      message.success('图标URL已设置');
                                    }
                                  }}
                                  style={{ padding: 0, height: 'auto' }}
                                >
                                  确定
                                </Button>
                              }
                            />
                          </Space>
                        </div>
                      </div>
                    </Form.Item>

                    <Form.Item 
                      name="description" 
                      label="网站描述" 
                      rules={[{ required: true, message: '请输入网站描述' }]}
                    >
                      <Input.TextArea rows={3} placeholder="简要描述这个网站的功能和特点" />
                    </Form.Item>

                    <Form.Item 
                      name="tags" 
                      label="标签（文本）"
                      extra="多个标签用逗号分隔，如：设计,灵感,UI（旧版标签方式）"
                    >
                      <Input placeholder="设计,灵感,UI" />
                    </Form.Item>

                    <Form.Item 
                      label="网站标签"
                      extra="从标签库中选择标签，可在「标签管理」中添加新标签"
                    >
                      <Select
                        mode="multiple"
                        placeholder="选择标签..."
                        value={selectedTagIds}
                        onChange={setSelectedTagIds}
                        style={{ width: '100%' }}
                        optionFilterProp="label"
                        options={websiteTags.map(tag => ({
                          value: tag.id,
                          label: tag.name,
                        }))}
                        tagRender={(props) => {
                          const tag = websiteTags.find(t => t.id === props.value);
                          return (
                            <Tag
                              color={tag?.color || '#1890ff'}
                              closable={props.closable}
                              onClose={props.onClose}
                              style={{ marginRight: 3 }}
                            >
                              {props.label}
                            </Tag>
                          );
                        }}
                      />
                    </Form.Item>

                    <Row gutter={16}>
                      <Col span={6}>
                        <Form.Item name="isPinned" label="置顶" valuePropName="checked">
                          <Switch />
                        </Form.Item>
                      </Col>
                      <Col span={6}>
                        <Form.Item name="isHot" label="热门" valuePropName="checked">
                          <Switch />
                        </Form.Item>
                      </Col>
                      <Col span={6}>
                        <Form.Item name="isNew" label="新增" valuePropName="checked">
                          <Switch />
                        </Form.Item>
                      </Col>
                      <Col span={6}>
                        <Form.Item name="isFeatured" label="推荐" valuePropName="checked">
                          <Switch />
                        </Form.Item>
                      </Col>
                    </Row>
                    <Row gutter={16}>
                      <Col span={6}>
                        <Form.Item name="order" label="排序">
                          <InputNumber style={{ width: '100%' }} min={0} />
                        </Form.Item>
                      </Col>
                    </Row>
                  </>
                ),
              },
              {
                key: 'detail',
                label: (
                  <span>
                    详情页内容
                    <Tag color="purple" style={{ marginLeft: 6, fontSize: 10 }}>Pro</Tag>
                  </span>
                ),
                children: (
                  <>
                    <Form.Item 
                      name="visitBtnText" 
                      label="访问按钮文字"
                      extra="自定义访问按钮的显示文字"
                    >
                      <Input placeholder="访问网站" maxLength={20} />
                    </Form.Item>

                    <Form.Item label="产品截图">
                      <div style={{ 
                        display: 'flex', 
                        flexWrap: 'wrap', 
                        gap: 8,
                        marginBottom: 8
                      }}>
                        {screenshots.map((url, index) => (
                          <div key={index} style={{ position: 'relative' }}>
                            <Image
                              src={url}
                              alt={`截图 ${index + 1}`}
                              style={{ width: 120, height: 80, objectFit: 'cover', borderRadius: 4 }}
                              fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
                            />
                            <Button
                              type="text"
                              danger
                              size="small"
                              style={{ 
                                position: 'absolute', 
                                top: -8, 
                                right: -8,
                                background: '#fff',
                                borderRadius: '50%',
                                padding: 0,
                                width: 20,
                                height: 20,
                                lineHeight: '20px',
                              }}
                              onClick={() => {
                                const newScreenshots = [...screenshots];
                                newScreenshots.splice(index, 1);
                                setScreenshots(newScreenshots);
                              }}
                            >
                              ×
                            </Button>
                          </div>
                        ))}
                        {screenshots.length < 6 && (
                          <Upload
                            showUploadList={false}
                            accept="image/*"
                            beforeUpload={async (file) => {
                              const formData = new FormData();
                              formData.append('file', file);
                              try {
                                const response = await api.post('/upload/image', formData, {
                                  headers: { 'Content-Type': 'multipart/form-data' },
                                });
                                const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
                                const serverUrl = apiBaseUrl.replace(/\/api\/?$/, '');
                                const uploadedUrl = response.data.url.startsWith('http') 
                                  ? response.data.url 
                                  : `${serverUrl}${response.data.url}`;
                                setScreenshots([...screenshots, uploadedUrl]);
                                message.success('截图上传成功');
                              } catch (error) {
                                message.error('上传失败');
                              }
                              return false;
                            }}
                          >
                            <div style={{ 
                              width: 120, 
                              height: 80, 
                              border: '1px dashed #d9d9d9',
                              borderRadius: 4,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              background: '#fafafa',
                            }}>
                              <PlusOutlined style={{ fontSize: 20, color: '#999' }} />
                            </div>
                          </Upload>
                        )}
                      </div>
                      <span style={{ fontSize: 12, color: '#999' }}>
                        最多上传 6 张截图，建议尺寸 1200x800
                      </span>
                    </Form.Item>

                    <Form.Item 
                      label={
                        <Space>
                          <span>详情内容</span>
                          <Button 
                            size="small" 
                            icon={<RobotOutlined />}
                            onClick={() => setAiModalOpen(true)}
                          >
                            AI 助手
                          </Button>
                        </Space>
                      }
                      extra="支持富文本编辑，用于详情页的详细介绍"
                    >
                      <NovelEditor
                        value={detailContent}
                        onChange={(html) => setDetailContent(html)}
                        placeholder="输入网站的详细介绍..."
                        minHeight={200}
                        maxHeight={400}
                      />
                    </Form.Item>
                  </>
                ),
              },
              {
                key: 'seo',
                label: (
                  <span>
                    SEO 设置
                    <Tag color="purple" style={{ marginLeft: 6, fontSize: 10 }}>Pro</Tag>
                  </span>
                ),
                children: (
                  <>
                    <Form.Item 
                      name="seoTitle" 
                      label="SEO 标题"
                      extra="用于详情页的 title 标签，建议 60 字符以内"
                    >
                      <Input placeholder="留空则使用网站名称" maxLength={60} showCount />
                    </Form.Item>
                    <Form.Item 
                      name="seoDescription" 
                      label="SEO 描述"
                      extra="用于详情页的 meta description，建议 160 字符以内"
                    >
                      <Input.TextArea rows={3} placeholder="留空则使用网站描述" maxLength={160} showCount />
                    </Form.Item>
                    <Form.Item 
                      name="seoKeywords" 
                      label="SEO 关键词"
                      extra="多个关键词用逗号分隔"
                    >
                      <Input placeholder="如：设计工具,UI设计,灵感" />
                    </Form.Item>
                  </>
                ),
              },
            ]}
          />
        </Form>
      </Modal>

      {/* AI 内容助手弹窗 */}
      <AIContentModal
        open={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        onInsert={(content) => setDetailContent(content)}
        initialContent={detailContent}
        mode="replace"
      />
    </div>
  );
}
