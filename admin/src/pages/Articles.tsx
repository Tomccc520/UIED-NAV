/**
 * @file pages/Articles.tsx
 * @description 文章管理页面（Pro 功能）- 支持富文本编辑和 AI 功能
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 2.0.0
 */

// @pro-feature-start: articles
import React, { useState, useEffect, useCallback } from 'react';
import {
  Table,
  Button,
  Drawer,
  Form,
  Input,
  Select,
  Space,
  Tag,
  Popconfirm,
  Card,
  Row,
  Col,
  Switch,
  Upload,
  theme,
  App,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  SearchOutlined,
  UploadOutlined,
  RobotOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { UploadFile } from 'antd/es/upload/interface';
import axios from 'axios';
import NovelEditor from '../components/NovelEditor';
import AIContentModal from '../components/AIContentModal';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const { TextArea } = Input;

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  coverImage: string | null;
  status: 'draft' | 'published' | 'deleted';
  viewCount: number;
  category: string | null;
  tags?: { id: string; name: string; slug: string }[];
  seoTitle: string | null;
  seoDescription: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  commentsCount?: number;
}

interface Tag {
  id: string;
  name: string;
  slug: string;
}

const Articles: React.FC = () => {
  const { token: themeToken } = theme.useToken();
  const { message } = App.useApp();
  const [articles, setArticles] = useState<Article[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [form] = Form.useForm();
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState<string | undefined>(undefined);
  const [filterCategory, setFilterCategory] = useState<string | undefined>(undefined);
  const [coverFileList, setCoverFileList] = useState<UploadFile[]>([]);
  const [editorContent, setEditorContent] = useState('');
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  });

  // 获取文章列表 - 使用管理后台专用接口
  const fetchArticles = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = {
        page: pagination.current,
        pageSize: pagination.pageSize,
      };
      if (searchText) params.search = searchText;
      if (filterStatus) params.status = filterStatus;
      if (filterCategory) params.category = filterCategory;

      const res = await axios.get(`${API_BASE}/articles/admin/list`, {
        params,
        headers: getAuthHeaders(),
      });

      if (res.data.success) {
        setArticles(res.data.data);
        setPagination(prev => ({
          ...prev,
          total: res.data.total || res.data.data.length,
        }));
        
        // 提取所有分类
        const cats = [...new Set(res.data.data.map((a: Article) => a.category).filter(Boolean))] as string[];
        setCategories(cats);
      }
    } catch (error) {
      message.error('获取文章列表失败');
      console.error('获取文章列表失败:', error);
    } finally {
      setLoading(false);
    }
  }, [pagination.current, pagination.pageSize, searchText, filterStatus, filterCategory, message]);

  // 获取标签列表
  const fetchTags = async () => {
    try {
      const res = await axios.get(`${API_BASE}/articles/tags`, {
        headers: getAuthHeaders(),
      });
      if (res.data.success) {
        setAllTags(res.data.data);
      }
    } catch (error) {
      console.error('获取标签失败:', error);
    }
  };

  useEffect(() => {
    fetchArticles();
    fetchTags();
  }, [fetchArticles]);

  // 生成 slug
  const generateSlug = (title: string): string => {
    return title
      .toLowerCase()
      .replace(/[^\w\u4e00-\u9fa5]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 100);
  };

  // 打开新建/编辑抽屉
  const openDrawer = (article?: Article) => {
    setEditingArticle(article || null);
    if (article) {
      form.setFieldsValue({
        ...article,
        tags: article.tags?.map(t => t.name) || [],
        isPublished: article.status === 'published',
      });
      setEditorContent(article.content || '');
      if (article.coverImage) {
        setCoverFileList([
          {
            uid: '-1',
            name: 'cover.jpg',
            status: 'done',
            url: article.coverImage,
          },
        ]);
      } else {
        setCoverFileList([]);
      }
    } else {
      form.resetFields();
      setEditorContent('');
      setCoverFileList([]);
    }
    setDrawerVisible(true);
  };

  // 关闭抽屉
  const closeDrawer = () => {
    setDrawerVisible(false);
    setEditingArticle(null);
    setAiModalOpen(false);
    form.resetFields();
    setEditorContent('');
    setCoverFileList([]);
  };

  // 保存文章
  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const isPublished = values.isPublished;
      
      const articleData = {
        title: values.title,
        slug: values.slug || generateSlug(values.title),
        excerpt: values.excerpt || null,
        content: editorContent,
        coverImage: coverFileList[0]?.url || coverFileList[0]?.response?.url || null,
        status: isPublished ? 'published' : 'draft',
        category: values.category || '未分类',
        tags: values.tags || [],
        seoTitle: values.seoTitle || null,
        seoDescription: values.seoDescription || null,
      };

      if (editingArticle) {
        await axios.put(`${API_BASE}/articles/${editingArticle.id}`, articleData, {
          headers: getAuthHeaders(),
        });
        message.success('文章更新成功');
      } else {
        await axios.post(`${API_BASE}/articles`, articleData, {
          headers: getAuthHeaders(),
        });
        message.success('文章创建成功');
      }

      closeDrawer();
      fetchArticles();
      fetchTags();
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        message.error(error.response.data.message);
      } else {
        message.error('保存失败');
      }
    }
  };

  // 删除文章
  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`${API_BASE}/articles/${id}`, {
        headers: getAuthHeaders(),
      });
      message.success('文章删除成功');
      fetchArticles();
    } catch (error) {
      message.error('删除失败');
    }
  };

  // 表格列配置
  const columns: ColumnsType<Article> = [
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      width: 280,
      ellipsis: true,
      render: (text, record) => (
        <a href={`/article/${record.slug}`} target="_blank" rel="noopener noreferrer">
          {text}
        </a>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (status: string) => (
        <Tag color={status === 'published' ? 'green' : status === 'deleted' ? 'red' : 'orange'}>
          {status === 'published' ? '已发布' : status === 'deleted' ? '已删除' : '草稿'}
        </Tag>
      ),
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 100,
      render: (category: string | null) => category || '-',
    },
    {
      title: '标签',
      dataIndex: 'tags',
      key: 'tags',
      width: 180,
      render: (tags: Tag[]) => (
        <Space wrap size={[0, 4]}>
          {tags?.slice(0, 3).map(tag => (
            <Tag key={tag.id}>{tag.name}</Tag>
          ))}
          {tags?.length > 3 && <Tag>+{tags.length - 3}</Tag>}
        </Space>
      ),
    },
    {
      title: '浏览',
      dataIndex: 'viewCount',
      key: 'viewCount',
      width: 70,
      align: 'center',
    },
    {
      title: '评论',
      dataIndex: 'commentsCount',
      key: 'commentsCount',
      width: 70,
      align: 'center',
      render: (count: number) => count || 0,
    },
    {
      title: '发布时间',
      dataIndex: 'publishedAt',
      key: 'publishedAt',
      width: 160,
      render: (date: string | null) =>
        date ? new Date(date).toLocaleString('zh-CN') : '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 140,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            size="small"
            icon={<EyeOutlined />}
            href={`/article/${record.slug}`}
            target="_blank"
          />
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            onClick={() => openDrawer(record)}
          />
          <Popconfirm
            title="确定删除这篇文章吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="text" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 图片上传配置
  const uploadProps = {
    name: 'file',
    action: `${API_BASE}/upload/image`,
    headers: getAuthHeaders(),
    listType: 'picture-card' as const,
    fileList: coverFileList,
    maxCount: 1,
    accept: 'image/jpeg,image/png,image/webp',
    beforeUpload: (file: File) => {
      const isImage = ['image/jpeg', 'image/png', 'image/webp'].includes(file.type);
      if (!isImage) {
        message.error('只能上传 JPG/PNG/WebP 格式的图片');
        return false;
      }
      const isLt2M = file.size / 1024 / 1024 < 2;
      if (!isLt2M) {
        message.error('图片大小不能超过 2MB');
        return false;
      }
      return true;
    },
    onChange: (info: { fileList: UploadFile[] }) => {
      let newFileList = [...info.fileList];
      newFileList = newFileList.map(file => {
        if (file.response) {
          file.url = file.response.url;
        }
        return file;
      });
      setCoverFileList(newFileList);
    },
  };

  return (
    <div style={{ padding: themeToken.padding }}>
      {/* 搜索和筛选 */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col flex="auto">
            <Space wrap>
              <Input
                placeholder="搜索文章标题"
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                onPressEnter={() => {
                  setPagination(prev => ({ ...prev, current: 1 }));
                  fetchArticles();
                }}
                style={{ width: 200 }}
                allowClear
              />
              <Select
                placeholder="状态筛选"
                value={filterStatus}
                onChange={value => {
                  setFilterStatus(value);
                  setPagination(prev => ({ ...prev, current: 1 }));
                }}
                style={{ width: 120 }}
                allowClear
              >
                <Select.Option value="published">已发布</Select.Option>
                <Select.Option value="draft">草稿</Select.Option>
              </Select>
              <Select
                placeholder="分类筛选"
                value={filterCategory}
                onChange={value => {
                  setFilterCategory(value);
                  setPagination(prev => ({ ...prev, current: 1 }));
                }}
                style={{ width: 150 }}
                allowClear
                showSearch
              >
                {categories.map(cat => (
                  <Select.Option key={cat} value={cat}>
                    {cat}
                  </Select.Option>
                ))}
              </Select>
            </Space>
          </Col>
          <Col>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => openDrawer()}>
              新建文章
            </Button>
          </Col>
        </Row>
      </Card>

      {/* 文章列表 */}
      <Card>
        <Table
          columns={columns}
          dataSource={articles}
          loading={loading}
          rowKey="id"
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: total => `共 ${total} 篇文章`,
            onChange: (page, pageSize) => {
              setPagination(prev => ({ ...prev, current: page, pageSize }));
            },
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* 新建/编辑抽屉 */}
      <Drawer
        title={editingArticle ? '编辑文章' : '新建文章'}
        open={drawerVisible}
        onClose={closeDrawer}
        width={900}
        extra={
          <Space>
            <Button onClick={closeDrawer}>取消</Button>
            <Button type="primary" onClick={handleSave}>
              保存
            </Button>
          </Space>
        }
      >
          <Form form={form} layout="vertical">
            <Row gutter={16}>
              <Col span={16}>
                <Form.Item
                  name="title"
                  label="文章标题"
                  rules={[{ required: true, message: '请输入文章标题' }]}
                >
                  <Input
                    placeholder="请输入文章标题"
                    onChange={e => {
                      if (!editingArticle && !form.getFieldValue('slug')) {
                        form.setFieldValue('slug', generateSlug(e.target.value));
                      }
                    }}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="slug" label="URL Slug">
                  <Input placeholder="自动生成或手动输入" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item name="excerpt" label="文章摘要">
              <TextArea rows={2} placeholder="简短描述文章内容（可选）" maxLength={300} showCount />
            </Form.Item>

            <Form.Item
              label={
                <Space>
                  <span>文章内容</span>
                  <Button 
                    size="small" 
                    icon={<RobotOutlined />}
                    onClick={() => setAiModalOpen(true)}
                  >
                    AI 助手
                  </Button>
                </Space>
              }
              required
            >
              <NovelEditor
                value={editorContent}
                onChange={(html) => setEditorContent(html)}
                placeholder="开始编写文章内容..."
                minHeight={300}
                maxHeight={500}
              />
            </Form.Item>

            <Row gutter={16}>
              <Col span={8}>
                <Form.Item 
                  name="category" 
                  label="分类"
                  getValueFromEvent={(value) => Array.isArray(value) ? value[0] : value}
                >
                  <Select 
                    placeholder="选择或输入分类" 
                    allowClear 
                    showSearch
                  >
                    {categories.map(cat => (
                      <Select.Option key={cat} value={cat}>
                        {cat}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={16}>
                <Form.Item
                  name="tags"
                  label="标签"
                  extra="最多 10 个标签，可输入新标签"
                >
                  <Select
                    mode="tags"
                    placeholder="选择或输入标签"
                    maxCount={10}
                    tokenSeparators={[',']}
                  >
                    {allTags.map(tag => (
                      <Select.Option key={tag.id} value={tag.name}>
                        {tag.name}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Form.Item label="封面图片">
              <Upload {...uploadProps}>
                {coverFileList.length === 0 && (
                  <div>
                    <UploadOutlined />
                    <div style={{ marginTop: 8 }}>上传封面</div>
                  </div>
                )}
              </Upload>
            </Form.Item>

            <Card title="SEO 设置" size="small" style={{ marginBottom: 16 }}>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="seoTitle"
                    label="SEO 标题"
                    extra="建议不超过 60 个字符"
                  >
                    <Input placeholder="留空则使用文章标题" maxLength={60} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="seoDescription"
                    label="SEO 描述"
                    extra="建议不超过 160 个字符"
                  >
                    <TextArea rows={2} placeholder="留空则使用文章摘要" maxLength={160} />
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            <Form.Item name="isPublished" label="发布状态" valuePropName="checked">
              <Switch checkedChildren="已发布" unCheckedChildren="草稿" />
            </Form.Item>
          </Form>
      </Drawer>

      {/* AI 内容助手弹窗 */}
      <AIContentModal
        open={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        onInsert={(content) => setEditorContent(content)}
        initialContent={editorContent}
        mode="replace"
      />
    </div>
  );
};

export default Articles;
// @pro-feature-end: articles
