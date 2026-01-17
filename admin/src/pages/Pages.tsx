/**
 * @file Pages.tsx
 * @description 管理后台组件
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

import { useEffect, useState, useMemo, useCallback } from 'react';
import {
  Card,
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
  Select,
  Tabs,
  Empty,
  Tooltip,
  Badge,
  Checkbox,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  AppstoreOutlined,
  ExportOutlined,
  SearchOutlined,
  HolderOutlined,
  CopyOutlined,
  CloseOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import api from '../services/api';
import { getIconByKey } from '../config/icons';

interface Page {
  id: string;
  name: string;
  slug: string;
  type: string;
  icon?: string;
  description?: string;
  order: number;
  visible: boolean;
  heroTitle?: string;
  heroSubtitle?: string;
  heroHighlightText?: string;
  hotSearchTags?: string;
  heroDisplayMode?: string; // search | iconScroll
  heroScrollWebsites?: string; // JSON数组，网站ID列表
  searchPlaceholder?: string;
  searchEnabled: boolean;
  showHotRecommendations: boolean;
  showCategories: boolean;
  pageCategories?: PageCategory[];
}

interface PageCategory {
  id: string;
  categoryId: string;
  order: number;
  visible: boolean;
  category: {
    id: string;
    name: string;
    slug: string;
  };
}

interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  color?: string;
  parentId?: string | null;
  order: number;
  children?: Category[];
  _count?: {
    websites: number;
  };
}

// 已选分类项（带排序信息）
interface SelectedCategory {
  id: string;
  categoryId: string;
  order: number;
  category: Category;
}

// 网站类型
interface Website {
  id: string;
  name: string;
  url: string;
  iconUrl?: string;
  description?: string;
  category?: {
    id: string;
    name: string;
  };
}

// WordPress 组件配置类型
interface WordPressWidget {
  id: string;
  name: string;
  pageSlug: string;
  position: string;
  componentType: string;
  title?: string;
  limit: number;
  showMoreLink?: string;
  categoryIds?: string;
  tagIds?: string;
  order: number;
  visible: boolean;
}

// WordPress 分类类型
interface WordPressCategory {
  id: string;
  wpCategoryId: number;
  wpCategoryName: string;
  displayName: string;
  slug: string;
  visible: boolean;
}

// WordPress 标签类型
interface WordPressTag {
  id: string;
  wpTagId: number;
  wpTagName: string;
  displayName: string;
  slug: string;
  visible: boolean;
}

// 导入 availableIcons 用于图标选择器
import { availableIcons } from '../config/icons';

// 使用 SVG 图标的选项
const iconOptions = availableIcons.map(icon => {
  const IconComponent = icon.icon;
  return {
    value: icon.key,
    label: (
      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <IconComponent size={16} color="#666" />
        {icon.name}
      </span>
    ),
  };
});

export default function Pages() {
  const [pages, setPages] = useState<Page[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<Page | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<SelectedCategory[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [copyFromPageId, setCopyFromPageId] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [websites, setWebsites] = useState<Website[]>([]);
  const [selectedCategoryForWebsites, setSelectedCategoryForWebsites] = useState<string>(''); // 网站选择器的分类筛选
  const [websiteCategorySearch, setWebsiteCategorySearch] = useState<string>(''); // 网站分类搜索关键词
  const [selectedWebsiteIds, setSelectedWebsiteIds] = useState<string[]>([]);
  const [form] = Form.useForm();
  
  // WordPress 组件配置相关状态
  const [wpWidgetModalOpen, setWpWidgetModalOpen] = useState(false);
  const [wpWidgets, setWpWidgets] = useState<WordPressWidget[]>([]);
  const [wpCategories, setWpCategories] = useState<WordPressCategory[]>([]);
  const [wpTags, setWpTags] = useState<WordPressTag[]>([]);
  const [editingWidget, setEditingWidget] = useState<WordPressWidget | null>(null);
  const [wpWidgetForm] = Form.useForm();

  const fetchPages = async () => {
    setLoading(true);
    try {
      const res = await api.get('/pages');
      setPages(res.data);
    } catch (error) {
      message.error('获取页面数据失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      // 获取树形结构的分类（包含网站数量）
      const res = await api.get('/categories');
      setCategories(res.data);
    } catch (error) {
      message.error('获取分类数据失败');
    }
  };

  const fetchWebsites = async () => {
    try {
      // 获取所有网站（增加 limit 以确保获取全部数据）
      const res = await api.get('/websites', { params: { limit: 5000 } });
      setWebsites(res.data.websites || res.data || []);
    } catch (error) {
      message.error('获取网站数据失败');
    }
  };

  // 获取 WordPress 组件配置
  const fetchWpWidgets = async (pageSlug?: string) => {
    try {
      const params = pageSlug ? { pageSlug } : {};
      const res = await api.get('/wordpress/widgets', { params });
      setWpWidgets(res.data || []);
    } catch (error) {
      console.error('获取WordPress组件配置失败:', error);
    }
  };

  // 获取 WordPress 分类
  const fetchWpCategories = async () => {
    try {
      const res = await api.get('/wordpress/categories');
      setWpCategories(res.data || []);
    } catch (error) {
      console.error('获取WordPress分类失败:', error);
    }
  };

  // 获取 WordPress 标签
  const fetchWpTags = async () => {
    try {
      const res = await api.get('/wordpress/tags');
      setWpTags(res.data || []);
    } catch (error) {
      console.error('获取WordPress标签失败:', error);
    }
  };

  // 获取所有主分类ID（用于过滤）
  const mainCategoryIds = useMemo(() => {
    return new Set(categories.map((cat: any) => cat.id));
  }, [categories]);

  // 过滤后的可选分类（排除已选的，支持搜索）
  const availableCategories = useMemo(() => {
    const selectedIds = new Set(selectedCategories.map(sc => sc.categoryId));
    return categories.filter((cat: Category) => {
      // 排除已选的
      if (selectedIds.has(cat.id)) return false;
      // 搜索过滤
      if (searchKeyword) {
        const keyword = searchKeyword.toLowerCase();
        return cat.name.toLowerCase().includes(keyword) || 
               cat.slug.toLowerCase().includes(keyword);
      }
      return true;
    });
  }, [categories, selectedCategories, searchKeyword]);

  // 添加分类到已选列表
  const handleAddCategory = useCallback((category: Category) => {
    const newSelected: SelectedCategory = {
      id: `temp-${Date.now()}`,
      categoryId: category.id,
      order: selectedCategories.length,
      category: category,
    };
    setSelectedCategories(prev => [...prev, newSelected]);
  }, [selectedCategories.length]);

  // 从已选列表移除分类
  const handleRemoveCategory = useCallback((categoryId: string) => {
    setSelectedCategories(prev => 
      prev.filter(sc => sc.categoryId !== categoryId)
        .map((sc, index) => ({ ...sc, order: index }))
    );
  }, []);

  // 拖拽排序处理
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    
    const newList = [...selectedCategories];
    const draggedItem = newList[draggedIndex];
    newList.splice(draggedIndex, 1);
    newList.splice(index, 0, draggedItem);
    
    // 更新order
    const updatedList = newList.map((item, idx) => ({ ...item, order: idx }));
    setSelectedCategories(updatedList);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  // 从其他页面复制分类配置
  const handleCopyFromPage = async (pageId: string) => {
    try {
      const res = await api.get(`/pages/${pageId}`);
      const pageCategories = res.data.pageCategories || [];
      
      // 转换为SelectedCategory格式
      const copiedCategories: SelectedCategory[] = pageCategories
        .filter((pc: any) => mainCategoryIds.has(pc.categoryId))
        .map((pc: any, index: number) => {
          const cat = categories.find(c => c.id === pc.categoryId);
          return {
            id: `temp-${Date.now()}-${index}`,
            categoryId: pc.categoryId,
            order: index,
            category: cat || pc.category,
          };
        });
      
      setSelectedCategories(copiedCategories);
      setCopyFromPageId(null);
      message.success(`已复制 ${copiedCategories.length} 个分类配置`);
    } catch (error) {
      message.error('复制失败');
    }
  };

  // 计算分类的网站总数（包含子分类）
  const getCategoryWebsiteCount = (category: Category): number => {
    let count = category._count?.websites || 0;
    if (category.children) {
      for (const child of category.children) {
        count += child._count?.websites || 0;
      }
    }
    return count;
  };

  useEffect(() => {
    fetchPages();
    fetchCategories();
    fetchWebsites();
    fetchWpWidgets();
    fetchWpCategories();
    fetchWpTags();
  }, []);

  const handleAdd = () => {
    setEditingId(null);
    form.resetFields();
    form.setFieldsValue({
      order: 0,
      visible: true,
      searchEnabled: true,
      showHotRecommendations: true,
      showCategories: true,
      showSidebar: true,
      heroBgType: 'default',
      heroDisplayMode: 'iconScroll',
    });
    setSelectedWebsiteIds([]);
    setModalOpen(true);
  };

  const handleEdit = (record: Page) => {
    setEditingId(record.id);
    form.setFieldsValue({
      ...record,
      heroDisplayMode: 'iconScroll',
    });
    // 解析已选网站ID
    try {
      const ids = record.heroScrollWebsites ? JSON.parse(record.heroScrollWebsites) : [];
      setSelectedWebsiteIds(ids);
    } catch {
      setSelectedWebsiteIds([]);
    }
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/pages/${id}`);
      message.success('删除成功');
      fetchPages();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      // 保存滚动图标墙的网站ID
      values.heroDisplayMode = 'iconScroll';
      values.heroScrollWebsites = JSON.stringify(selectedWebsiteIds);
      console.log('[Pages] Saving iconScroll mode with websites:', selectedWebsiteIds);
      console.log('[Pages] Submitting values:', values);
      if (editingId) {
        await api.put(`/pages/${editingId}`, values);
        message.success('更新成功');
      } else {
        await api.post('/pages', values);
        message.success('创建成功');
      }
      setModalOpen(false);
      fetchPages();
    } catch (error) {
      console.error('[Pages] Submit error:', error);
      message.error('操作失败');
    }
  };

  const handleManageCategories = async (page: Page) => {
    setCurrentPage(page);
    setSearchKeyword('');
    // 重新获取最新的页面数据，包含分类信息
    try {
      const res = await api.get(`/pages/${page.id}`);
      const pageCategories = res.data.pageCategories || [];
      
      // 转换为SelectedCategory格式，按order排序
      const selected: SelectedCategory[] = pageCategories
        .filter((pc: any) => mainCategoryIds.has(pc.categoryId))
        .sort((a: any, b: any) => a.order - b.order)
        .map((pc: any) => {
          const cat = categories.find(c => c.id === pc.categoryId);
          return {
            id: pc.id,
            categoryId: pc.categoryId,
            order: pc.order,
            category: cat || pc.category,
          };
        });
      
      setSelectedCategories(selected);
      setCategoryModalOpen(true);
    } catch (error) {
      message.error('获取页面分类失败');
    }
  };

  const handleSaveCategories = async () => {
    if (!currentPage) return;

    try {
      // 获取当前页面的分类ID列表
      const res = await api.get(`/pages/${currentPage.id}`);
      const currentCategoryIds = res.data.pageCategories?.map((pc: any) => pc.categoryId) || [];
      
      // 新的分类ID列表（按顺序）
      const newCategoryIds = selectedCategories.map(sc => sc.categoryId);

      // 找出需要删除的分类
      const toRemove = currentCategoryIds.filter(
        (id: string) => !newCategoryIds.includes(id)
      );

      // 删除不再需要的分类
      for (const categoryId of toRemove) {
        await api.delete(`/pages/${currentPage.id}/categories/${categoryId}`);
      }

      // 添加或更新分类（带排序）
      for (let i = 0; i < selectedCategories.length; i++) {
        const sc = selectedCategories[i];
        if (currentCategoryIds.includes(sc.categoryId)) {
          // 更新排序
          await api.put(`/pages/${currentPage.id}/categories/${sc.categoryId}`, {
            order: i,
            visible: true,
          });
        } else {
          // 添加新分类
          await api.post(`/pages/${currentPage.id}/categories`, {
            categoryId: sc.categoryId,
            order: i,
            visible: true,
          });
        }
      }

      message.success('分类配置保存成功');
      setCategoryModalOpen(false);
      fetchPages();
    } catch (error) {
      message.error('保存失败');
    }
  };

  // WordPress 组件管理
  const handleManageWpWidgets = async (page: Page) => {
    setCurrentPage(page);
    await fetchWpWidgets(page.slug);
    setWpWidgetModalOpen(true);
  };

  const handleAddWpWidget = () => {
    setEditingWidget(null);
    wpWidgetForm.resetFields();
    wpWidgetForm.setFieldsValue({
      pageSlug: currentPage?.slug,
      visible: true,
      order: 0,
      limit: 6,
      position: 'main',
      componentType: 'article-grid',
      name: `${currentPage?.name || '页面'}文章组件`,
    });
  };

  const handleEditWpWidget = (widget: WordPressWidget) => {
    setEditingWidget(widget);
    wpWidgetForm.setFieldsValue({
      ...widget,
      categoryIds: widget.categoryIds ? widget.categoryIds.split(',') : [],
      tagIds: widget.tagIds ? widget.tagIds.split(',') : [],
    });
  };

  const handleSaveWpWidget = async () => {
    try {
      const values = await wpWidgetForm.validateFields();
      // 处理分类ID - 转换为逗号分隔的字符串
      const categoryIds = Array.isArray(values.categoryIds) 
        ? values.categoryIds.join(',') 
        : (values.categoryIds || '');
      
      // 处理标签ID - 转换为逗号分隔的字符串
      const tagIds = Array.isArray(values.tagIds) 
        ? values.tagIds.join(',') 
        : (values.tagIds || '');
      
      const submitData = {
        ...values,
        categoryIds,
        tagIds,
        pageSlug: currentPage?.slug,
      };
      
      if (editingWidget) {
        await api.put(`/wordpress/widgets/${editingWidget.id}`, submitData);
        message.success('更新成功');
      } else {
        await api.post('/wordpress/widgets', submitData);
        message.success('创建成功');
      }
      
      wpWidgetForm.resetFields();
      setEditingWidget(null);
      fetchWpWidgets(currentPage?.slug);
    } catch (error: any) {
      message.error('保存失败: ' + (error.message || '未知错误'));
    }
  };

  const handleDeleteWpWidget = async (id: string) => {
    try {
      await api.delete(`/wordpress/widgets/${id}`);
      message.success('删除成功');
      fetchWpWidgets(currentPage?.slug);
    } catch (error: any) {
      message.error('删除失败: ' + (error.message || '未知错误'));
    }
  };

  const columns = [
    { title: '名称', dataIndex: 'name', key: 'name' },
    { title: 'URL路径', dataIndex: 'slug', key: 'slug' },
    { title: '类型', dataIndex: 'type', key: 'type' },
    { 
      title: '图标', 
      dataIndex: 'icon', 
      key: 'icon',
      width: 80,
      render: (icon: string) => {
        if (!icon) return '-';
        const iconConfig = getIconByKey(icon);
        if (iconConfig) {
          const IconComponent = iconConfig.icon;
          return (
            <Tooltip title={iconConfig.name}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <IconComponent size={18} color="#666" />
              </span>
            </Tooltip>
          );
        }
        return icon;
      }
    },
    {
      title: '分类数',
      key: 'categoryCount',
      render: (_: any, record: Page) =>
        record.pageCategories?.length || 0,
    },
    {
      title: '显示',
      dataIndex: 'visible',
      key: 'visible',
      render: (visible: boolean) => (
        <Tag color={visible ? 'green' : 'red'}>
          {visible ? '显示' : '隐藏'}
        </Tag>
      ),
    },
    { title: '排序', dataIndex: 'order', key: 'order' },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Page) => (
        <Space>
          <Button
            size="small"
            icon={<ExportOutlined />}
            onClick={() => {
              // 固定页面使用原路径，动态页面使用 /p/ 前缀
              const fixedPages = ['uiux', 'ai', 'design', '3d', 'ecommerce', 'interior', 'font', 'home'];
              let frontendUrl: string;
              if (record.slug === 'uiux') {
                frontendUrl = 'http://localhost:3000/';
              } else if (fixedPages.includes(record.slug)) {
                frontendUrl = `http://localhost:3000/${record.slug}`;
              } else {
                frontendUrl = `http://localhost:3000/p/${record.slug}`;
              }
              window.open(frontendUrl, '_blank');
            }}
          >
            预览
          </Button>
          <Button
            size="small"
            icon={<AppstoreOutlined />}
            onClick={() => handleManageCategories(record)}
          >
            分类
          </Button>
          <Button
            size="small"
            icon={<FileTextOutlined />}
            onClick={() => handleManageWpWidgets(record)}
          >
            文章
          </Button>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
          <Popconfirm
            title="确定删除？"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}
      >
        <h2>页面管理</h2>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAdd}
        >
          添加页面
        </Button>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={pages}
          rowKey="id"
          loading={loading}
          pagination={false}
        />
      </Card>

      {/* 页面编辑弹窗 */}
      <Modal
        title={editingId ? '编辑页面' : '添加页面'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        width={700}
      >
        <Form form={form} layout="vertical">
          <Tabs
            items={[
              {
                key: 'basic',
                label: '基本信息',
                children: (
                  <>
                    <Form.Item
                      name="name"
                      label="页面名称"
                      rules={[{ required: true }]}
                    >
                      <Input placeholder="如：UI导航" />
                    </Form.Item>

                    <Form.Item
                      name="slug"
                      label="URL路径"
                      rules={[{ required: true }]}
                      extra="用于URL，如 uiux, ai, design"
                    >
                      <Input placeholder="uiux" />
                    </Form.Item>

                    <Form.Item
                      name="type"
                      label="页面类型"
                      rules={[{ required: true }]}
                      extra="用于前端识别，通常与slug相同"
                    >
                      <Input placeholder="uiux" />
                    </Form.Item>

                    <Form.Item name="icon" label="图标">
                      <Select
                        options={iconOptions}
                        placeholder="选择图标"
                      />
                    </Form.Item>

                    <Form.Item name="description" label="描述">
                      <Input.TextArea rows={2} />
                    </Form.Item>

                    <Space size="large">
                      <Form.Item name="order" label="排序">
                        <InputNumber style={{ width: 120 }} />
                      </Form.Item>
                      <Form.Item
                        name="visible"
                        label="显示"
                        valuePropName="checked"
                      >
                        <Switch />
                      </Form.Item>
                    </Space>
                  </>
                ),
              },
              {
                key: 'hero',
                label: 'Hero配置',
                children: (
                  <>
                    {/* 滚动图标墙网站选择 */}
                    {(() => {
                      // 构建分类ID到主分类名称的映射
                      const categoryIdToMainName: Record<string, string> = {};
                      categories.forEach((mainCat: Category) => {
                        // 主分类自己
                        categoryIdToMainName[mainCat.id] = mainCat.name;
                        // 子分类映射到主分类名称
                        if (mainCat.children) {
                          mainCat.children.forEach((subCat: Category) => {
                            categoryIdToMainName[subCat.id] = mainCat.name;
                          });
                        }
                      });
                      
                      // 按主分类分组网站
                      const websitesByCategory: Record<string, Website[]> = {};
                      const categoryNames: string[] = [];
                      websites.forEach((w: any) => {
                        // 使用主分类名称分组
                        const catName = w.category?.id 
                          ? (categoryIdToMainName[w.category.id] || w.category?.name || '未分类')
                          : '未分类';
                        if (!websitesByCategory[catName]) {
                          websitesByCategory[catName] = [];
                          categoryNames.push(catName);
                        }
                        websitesByCategory[catName].push(w);
                      });
                      
                      // 过滤分类名称（支持搜索）
                      const filteredCategoryNames = websiteCategorySearch 
                        ? categoryNames.filter(name => 
                            name.toLowerCase().includes(websiteCategorySearch.toLowerCase())
                          )
                        : categoryNames;
                      
                      // 当前分类下的网站
                      const currentCategoryWebsites = selectedCategoryForWebsites 
                        ? websitesByCategory[selectedCategoryForWebsites] || []
                        : [];
                      
                      return (
                        <Form.Item
                          label="选择展示的网站"
                          extra={`已选择 ${selectedWebsiteIds.length} 个网站（建议选择18-36个，将分3排滚动展示）`}
                        >
                          <div style={{ border: '1px solid #d9d9d9', borderRadius: 6, padding: 12 }}>
                            {/* 第一步：选择分类 */}
                            <div style={{ marginBottom: 12 }}>
                              <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>
                                第一步：选择分类
                              </div>
                              <Select
                                placeholder="搜索或选择一个分类..."
                                value={selectedCategoryForWebsites || undefined}
                                onChange={(value) => {
                                  setSelectedCategoryForWebsites(value);
                                  setWebsiteCategorySearch('');
                                }}
                                style={{ width: '100%' }}
                                allowClear
                                showSearch
                                filterOption={false}
                                onSearch={(value) => setWebsiteCategorySearch(value)}
                                notFoundContent={websiteCategorySearch ? '没有匹配的分类' : null}
                              >
                                {filteredCategoryNames.map(catName => (
                                  <Select.Option key={catName} value={catName}>
                                    {catName} ({websitesByCategory[catName].length} 个网站)
                                  </Select.Option>
                                ))}
                              </Select>
                            </div>
                            
                            {/* 第二步：选择网站 */}
                            {selectedCategoryForWebsites && currentCategoryWebsites.length > 0 && (
                              <div style={{ marginBottom: 12 }}>
                                <div style={{ fontSize: 12, color: '#666', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span>第二步：选择网站（{currentCategoryWebsites.length} 个可选）</span>
                                  <Space size={4}>
                                    <Button 
                                      size="small" 
                                      type="link"
                                      onClick={() => {
                                        const allIds = currentCategoryWebsites.map(w => w.id);
                                        const allSelected = allIds.every(id => selectedWebsiteIds.includes(id));
                                        if (allSelected) {
                                          setSelectedWebsiteIds(prev => prev.filter(id => !allIds.includes(id)));
                                        } else {
                                          setSelectedWebsiteIds(prev => [...new Set([...prev, ...allIds])]);
                                        }
                                      }}
                                    >
                                      {currentCategoryWebsites.every(w => selectedWebsiteIds.includes(w.id)) ? '取消全选' : '全选该分类'}
                                    </Button>
                                  </Space>
                                </div>
                                <div style={{ maxHeight: 200, overflow: 'auto', border: '1px solid #f0f0f0', borderRadius: 4, padding: 8 }}>
                                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                                    {currentCategoryWebsites.map((website: Website) => {
                                      const isChecked = selectedWebsiteIds.includes(website.id);
                                      return (
                                        <Checkbox 
                                          key={website.id} 
                                          checked={isChecked}
                                          onChange={(e) => {
                                            if (e.target.checked) {
                                              setSelectedWebsiteIds(prev => [...prev, website.id]);
                                            } else {
                                              setSelectedWebsiteIds(prev => prev.filter(id => id !== website.id));
                                            }
                                          }}
                                          style={{ marginLeft: 0 }}
                                        >
                                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            {website.iconUrl ? (
                                              <img 
                                                src={website.iconUrl} 
                                                alt="" 
                                                style={{ width: 16, height: 16, borderRadius: 3 }}
                                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                              />
                                            ) : (
                                              <div style={{ width: 16, height: 16, borderRadius: 3, background: '#ddd' }} />
                                            )}
                                            <span style={{ fontSize: 12 }}>{website.name}</span>
                                          </div>
                                        </Checkbox>
                                      );
                                    })}
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            {/* 已选网站预览 */}
                            {selectedWebsiteIds.length > 0 && (
                              <div style={{ padding: 8, background: '#f5f5f5', borderRadius: 4 }}>
                                <div style={{ fontSize: 12, color: '#666', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span>已选择 {selectedWebsiteIds.length} 个网站</span>
                                  <Button size="small" type="link" danger onClick={() => setSelectedWebsiteIds([])}>
                                    清空
                                  </Button>
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, maxHeight: 80, overflow: 'auto' }}>
                                  {selectedWebsiteIds.map(id => {
                                    const website = websites.find((w: Website) => w.id === id);
                                    if (!website) return null;
                                    return (
                                      <Tag
                                        key={id}
                                        closable
                                        onClose={() => setSelectedWebsiteIds(prev => prev.filter(i => i !== id))}
                                        style={{ display: 'flex', alignItems: 'center', gap: 4, margin: 0 }}
                                      >
                                        {website.iconUrl && (
                                          <img 
                                            src={website.iconUrl} 
                                            alt="" 
                                            style={{ width: 12, height: 12, borderRadius: 2 }}
                                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                          />
                                        )}
                                        {website.name}
                                      </Tag>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        </Form.Item>
                      );
                    })()}

                    <Form.Item
                      name="heroTitle"
                      label="页面主标题"
                      extra="显示在页面顶部的大标题，如：发现强大的AI工具"
                    >
                      <Input placeholder="发现强大的AI工具" />
                    </Form.Item>

                    <Form.Item
                      name="heroHighlightText"
                      label="高亮文本"
                      extra="主标题中需要高亮显示的文字，如：AI工具（会自动从主标题中匹配并高亮）"
                    >
                      <Input placeholder="AI工具" />
                    </Form.Item>

                    <Form.Item
                      name="heroSubtitle"
                      label="页面副标题"
                      extra="显示在主标题下方的描述文字"
                    >
                      <Input.TextArea 
                        rows={2} 
                        placeholder="聚合国内外AI精选内容，探索AI技术前沿与应用" 
                      />
                    </Form.Item>

                    <Form.Item
                      name="hotSearchTags"
                      label="热门搜索标签"
                      extra="多个标签用英文逗号分隔，如：Figma,蓝湖,Sketch"
                    >
                      <Input.TextArea 
                        rows={2} 
                        placeholder="Figma,蓝湖,Sketch,Axure,UIED" 
                      />
                    </Form.Item>

                    <Form.Item
                      name="heroBgType"
                      label="背景类型"
                      extra="选择Hero区域的背景样式"
                    >
                      <Select
                        placeholder="选择背景类型"
                        options={[
                          { value: 'default', label: '默认（使用系统默认背景）' },
                          { value: 'color', label: '纯色背景' },
                          { value: 'gradient', label: '渐变背景' },
                          { value: 'image', label: '图片背景' },
                        ]}
                      />
                    </Form.Item>

                    <Form.Item
                      name="heroBgValue"
                      label="背景值"
                      extra="纯色填颜色值如 #f5f5f5，渐变填CSS渐变如 linear-gradient(135deg, #667eea 0%, #764ba2 100%)，图片填图片URL"
                    >
                      <Input.TextArea 
                        rows={2} 
                        placeholder="如：#f5f5f5 或 linear-gradient(135deg, #667eea 0%, #764ba2 100%) 或 图片URL" 
                      />
                    </Form.Item>
                  </>
                ),
              },
              {
                key: 'search',
                label: '搜索配置',
                children: (
                  <>
                    <Form.Item
                      name="searchPlaceholder"
                      label="搜索框占位符"
                    >
                      <Input placeholder="搜索工具..." />
                    </Form.Item>

                    <Form.Item
                      name="searchEnabled"
                      label="启用搜索"
                      valuePropName="checked"
                    >
                      <Switch />
                    </Form.Item>
                  </>
                ),
              },
              {
                key: 'display',
                label: '显示配置',
                children: (
                  <>
                    <Form.Item
                      name="showHotRecommendations"
                      label="显示热门推荐"
                      valuePropName="checked"
                    >
                      <Switch />
                    </Form.Item>

                    <Form.Item
                      name="showCategories"
                      label="显示分类"
                      valuePropName="checked"
                    >
                      <Switch />
                    </Form.Item>

                    <Form.Item
                      name="showSidebar"
                      label="显示侧边栏"
                      valuePropName="checked"
                      extra="关闭后页面将不显示左侧分类导航栏"
                    >
                      <Switch />
                    </Form.Item>

                    <Form.Item
                      name="themeColor"
                      label="主题色"
                      extra="页面主题色，如 #0066ff"
                    >
                      <Input placeholder="#0066ff" />
                    </Form.Item>
                  </>
                ),
              },
            ]}
          />
        </Form>
      </Modal>

      {/* 分类管理弹窗 - WordPress风格双栏布局 */}
      <Modal
        title={`管理分类 - ${currentPage?.name}`}
        open={categoryModalOpen}
        onOk={handleSaveCategories}
        onCancel={() => setCategoryModalOpen(false)}
        width={900}
        okText="保存配置"
        cancelText="取消"
      >
        {/* 顶部操作栏 */}
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space>
            <Button 
              size="small"
              icon={<CopyOutlined />}
              onClick={() => setCopyFromPageId('show')}
            >
              从其他页面复制
            </Button>
            <Button 
              size="small" 
              onClick={() => {
                const allCategories: SelectedCategory[] = categories.map((cat, index) => ({
                  id: `temp-${Date.now()}-${index}`,
                  categoryId: cat.id,
                  order: index,
                  category: cat,
                }));
                setSelectedCategories(allCategories);
              }}
            >
              全选
            </Button>
            <Button size="small" onClick={() => setSelectedCategories([])}>
              清空
            </Button>
          </Space>
          <span style={{ color: '#999', fontSize: 12 }}>
            已选择 {selectedCategories.length} 个分类
          </span>
        </div>

        {/* 从其他页面复制的选择器 */}
        {copyFromPageId === 'show' && (
          <div style={{ marginBottom: 16, padding: 12, background: '#f5f5f5', borderRadius: 6 }}>
            <div style={{ marginBottom: 8, fontWeight: 500 }}>选择要复制的页面：</div>
            <Space wrap>
              {pages.filter(p => p.id !== currentPage?.id).map(page => (
                <Button 
                  key={page.id} 
                  size="small"
                  onClick={() => handleCopyFromPage(page.id)}
                >
                  {page.name} ({page.pageCategories?.length || 0}个分类)
                </Button>
              ))}
              <Button size="small" onClick={() => setCopyFromPageId(null)}>取消</Button>
            </Space>
          </div>
        )}

        {/* 双栏布局 */}
        <div style={{ display: 'flex', gap: 16, height: 450 }}>
          {/* 左侧：可选分类列表 */}
          <div style={{ flex: 1, border: '1px solid #d9d9d9', borderRadius: 6, display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '8px 12px', borderBottom: '1px solid #d9d9d9', background: '#fafafa' }}>
              <div style={{ fontWeight: 500, marginBottom: 8 }}>可选分类</div>
              <Input
                placeholder="搜索分类..."
                prefix={<SearchOutlined style={{ color: '#999' }} />}
                value={searchKeyword}
                onChange={e => setSearchKeyword(e.target.value)}
                allowClear
                size="small"
              />
            </div>
            <div style={{ flex: 1, overflow: 'auto', padding: 8 }}>
              {availableCategories.length > 0 ? (
                availableCategories.map((cat: Category) => {
                  const websiteCount = getCategoryWebsiteCount(cat);
                  const childCount = cat.children?.length || 0;
                  
                  return (
                    <div
                      key={cat.id}
                      onClick={() => handleAddCategory(cat)}
                      style={{
                        padding: '10px 12px',
                        marginBottom: 4,
                        borderRadius: 4,
                        cursor: 'pointer',
                        border: '1px solid #e8e8e8',
                        background: '#fff',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = '#e6f7ff';
                        e.currentTarget.style.borderColor = '#1890ff';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = '#fff';
                        e.currentTarget.style.borderColor = '#e8e8e8';
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <span style={{ fontWeight: 500 }}>{cat.name}</span>
                          {cat.color && (
                            <span 
                              style={{ 
                                display: 'inline-block',
                                width: 12, 
                                height: 12, 
                                borderRadius: 2,
                                background: cat.color,
                                marginLeft: 8,
                                verticalAlign: 'middle'
                              }} 
                            />
                          )}
                        </div>
                        <Space size={4}>
                          <Badge count={websiteCount} style={{ backgroundColor: '#52c41a' }} overflowCount={999} />
                          <PlusOutlined style={{ color: '#1890ff' }} />
                        </Space>
                      </div>
                      {childCount > 0 && (
                        <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                          含 {childCount} 个子分类: {cat.children?.slice(0, 3).map(c => c.name).join('、')}
                          {childCount > 3 && '...'}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <Empty description={searchKeyword ? '没有匹配的分类' : '所有分类已添加'} />
              )}
            </div>
          </div>

          {/* 右侧：已选分类列表（支持拖拽排序） */}
          <div style={{ flex: 1, border: '1px solid #d9d9d9', borderRadius: 6, display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '8px 12px', borderBottom: '1px solid #d9d9d9', background: '#fafafa' }}>
              <div style={{ fontWeight: 500 }}>已选分类（拖拽排序）</div>
              <div style={{ fontSize: 12, color: '#999' }}>拖动调整显示顺序，顺序将影响前端侧边栏显示</div>
            </div>
            <div style={{ flex: 1, overflow: 'auto', padding: 8 }}>
              {selectedCategories.length > 0 ? (
                selectedCategories.map((sc, index) => {
                  const cat = sc.category;
                  const websiteCount = getCategoryWebsiteCount(cat);
                  const childCount = cat.children?.length || 0;
                  
                  return (
                    <div
                      key={sc.categoryId}
                      draggable
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragEnd={handleDragEnd}
                      style={{
                        padding: '10px 12px',
                        marginBottom: 4,
                        borderRadius: 4,
                        border: '1px solid #d9d9d9',
                        background: draggedIndex === index ? '#e6f7ff' : '#fff',
                        cursor: 'move',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      <HolderOutlined style={{ color: '#999', cursor: 'grab' }} />
                      <span style={{ 
                        width: 24, 
                        height: 24, 
                        borderRadius: 4, 
                        background: '#f0f0f0', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        fontSize: 12,
                        color: '#666'
                      }}>
                        {index + 1}
                      </span>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontWeight: 500 }}>{cat.name}</span>
                          {cat.color && (
                            <span 
                              style={{ 
                                display: 'inline-block',
                                width: 12, 
                                height: 12, 
                                borderRadius: 2,
                                background: cat.color,
                              }} 
                            />
                          )}
                          <Badge count={websiteCount} style={{ backgroundColor: '#52c41a' }} overflowCount={999} />
                        </div>
                        {childCount > 0 && (
                          <div style={{ fontSize: 11, color: '#999' }}>
                            {childCount} 个子分类
                          </div>
                        )}
                      </div>
                      <Tooltip title="移除">
                        <CloseOutlined 
                          style={{ color: '#ff4d4f', cursor: 'pointer' }}
                          onClick={() => handleRemoveCategory(sc.categoryId)}
                        />
                      </Tooltip>
                    </div>
                  );
                })
              ) : (
                <Empty description="点击左侧分类添加" />
              )}
            </div>
          </div>
        </div>

        <div style={{ marginTop: 12, padding: 8, background: '#fffbe6', borderRadius: 4, fontSize: 12, color: '#ad8b00' }}>
          💡 提示：选择主分类后，其下的所有子分类会自动包含。侧边栏只显示主分类，子分类在内容区域以标签形式展示。
        </div>
      </Modal>

      {/* WordPress 组件管理弹窗 */}
      <Modal
        title={`WordPress 文章配置 - ${currentPage?.name}`}
        open={wpWidgetModalOpen}
        onCancel={() => {
          setWpWidgetModalOpen(false);
          setEditingWidget(null);
          wpWidgetForm.resetFields();
        }}
        footer={null}
        width={900}
      >
        <div style={{ display: 'flex', gap: 16 }}>
          {/* 左侧：组件列表 */}
          <div style={{ flex: 1, border: '1px solid #d9d9d9', borderRadius: 6 }}>
            <div style={{ padding: '8px 12px', borderBottom: '1px solid #d9d9d9', background: '#fafafa', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 500 }}>已配置的文章组件</span>
              <Button size="small" type="primary" icon={<PlusOutlined />} onClick={handleAddWpWidget}>
                添加
              </Button>
            </div>
            <div style={{ maxHeight: 400, overflow: 'auto', padding: 8 }}>
              {wpWidgets.length > 0 ? (
                wpWidgets.map(widget => (
                  <div
                    key={widget.id}
                    style={{
                      padding: '10px 12px',
                      marginBottom: 8,
                      borderRadius: 4,
                      border: '1px solid #e8e8e8',
                      background: editingWidget?.id === widget.id ? '#e6f7ff' : '#fff',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 500 }}>{widget.name}</div>
                        <div style={{ fontSize: 12, color: '#999' }}>
                          {widget.componentType} · 显示 {widget.limit} 篇
                          {widget.categoryIds && ` · 分类: ${widget.categoryIds}`}
                        </div>
                      </div>
                      <Space>
                        <Tag color={widget.visible ? 'green' : 'default'}>
                          {widget.visible ? '显示' : '隐藏'}
                        </Tag>
                        <Button size="small" icon={<EditOutlined />} onClick={() => handleEditWpWidget(widget)} />
                        <Popconfirm title="确定删除？" onConfirm={() => handleDeleteWpWidget(widget.id)}>
                          <Button size="small" danger icon={<DeleteOutlined />} />
                        </Popconfirm>
                      </Space>
                    </div>
                  </div>
                ))
              ) : (
                <Empty description="暂无文章组件配置，点击添加按钮创建" />
              )}
            </div>
          </div>

          {/* 右侧：编辑表单 */}
          <div style={{ flex: 1, border: '1px solid #d9d9d9', borderRadius: 6 }}>
            <div style={{ padding: '8px 12px', borderBottom: '1px solid #d9d9d9', background: '#fafafa' }}>
              <span style={{ fontWeight: 500 }}>{editingWidget ? '编辑组件' : '添加组件'}</span>
            </div>
            <div style={{ padding: 12 }}>
              <Form form={wpWidgetForm} layout="vertical" size="small" onFinish={handleSaveWpWidget}>
                <Form.Item
                  name="name"
                  label="组件名称"
                  rules={[{ required: true, message: '请输入组件名称' }]}
                >
                  <Input placeholder="如：设计文章区块" />
                </Form.Item>
                <Form.Item name="title" label="显示标题">
                  <Input placeholder="组件显示的标题" />
                </Form.Item>
                <Form.Item name="limit" label="显示数量">
                  <InputNumber min={1} max={50} style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item name="categoryIds" label="关联分类">
                  <Select
                    mode="multiple"
                    allowClear
                    placeholder="选择要显示的分类"
                    optionFilterProp="children"
                  >
                    {wpCategories.map(cat => (
                      <Select.Option key={cat.id} value={cat.wpCategoryId.toString()}>
                        {cat.displayName} (ID: {cat.wpCategoryId})
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
                <Form.Item name="tagIds" label="关联标签">
                  <Select
                    mode="multiple"
                    allowClear
                    placeholder="选择要显示的标签"
                    optionFilterProp="children"
                  >
                    {wpTags.map(tag => (
                      <Select.Option key={tag.id} value={tag.wpTagId.toString()}>
                        {tag.displayName} (ID: {tag.wpTagId})
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
                <Form.Item name="showMoreLink" label="查看更多链接">
                  <Input placeholder="点击查看更多跳转的链接" />
                </Form.Item>
                <Form.Item name="visible" label="显示" valuePropName="checked">
                  <Switch />
                </Form.Item>
                <Form.Item>
                  <Space>
                    <Button type="primary" htmlType="submit">
                      保存
                    </Button>
                    <Button onClick={() => {
                      setEditingWidget(null);
                      wpWidgetForm.resetFields();
                    }}>
                      取消
                    </Button>
                  </Space>
                </Form.Item>
              </Form>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 12, padding: 8, background: '#e6f7ff', borderRadius: 4, fontSize: 12, color: '#1890ff' }}>
          💡 提示：配置 WordPress 文章组件后，前端页面将显示对应分类的文章。请确保已在「WordPress 配置」中导入分类数据。
        </div>
      </Modal>
    </div>
  );
}
