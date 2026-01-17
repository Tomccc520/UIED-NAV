/**
 * @file BatchImport.tsx
 * @description 管理后台组件
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

import { useState } from 'react';
import {
  Card,
  Button,
  Input,
  Space,
  Table,
  message,
  Alert,
  Progress,
  Tag,
  Tooltip,
  Modal,
  Form,
  TreeSelect,
} from 'antd';
import {
  RobotOutlined,
  ImportOutlined,
  CheckOutlined,
  CloseOutlined,
  GlobalOutlined,
} from '@ant-design/icons';
import api, { categoryApi } from '../services/api';
import { useEffect } from 'react';

interface ParsedWebsite {
  key: string;
  url: string;
  name: string;
  description: string;
  tags: string;
  iconUrl: string;
  status: 'pending' | 'parsing' | 'success' | 'error';
  error?: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  parentId?: string;
  children?: Category[];
}

export default function BatchImport() {
  const [urls, setUrls] = useState('');
  const [parsedWebsites, setParsedWebsites] = useState<ParsedWebsite[]>([]);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [editModal, setEditModal] = useState(false);
  const [editingWebsite, setEditingWebsite] = useState<ParsedWebsite | null>(null);
  const [editForm] = Form.useForm();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await categoryApi.getAll();
      setCategories(buildCategoryTree(res.data));
    } catch (error) {
      console.error('获取分类失败:', error);
    }
  };

  const buildCategoryTree = (items: Category[]): Category[] => {
    const map = new Map<string, Category>();
    const roots: Category[] = [];
    items.forEach((item) => map.set(item.id, { ...item, children: [] }));
    items.forEach((item) => {
      const node = map.get(item.id)!;
      if (item.parentId) {
        const parent = map.get(item.parentId);
        if (parent) parent.children!.push(node);
        else roots.push(node);
      } else {
        roots.push(node);
      }
    });
    return roots;
  };

  const convertToTreeSelectData = (items: Category[]): any[] => {
    return items.map((item) => ({
      value: item.id,
      title: item.name,
      label: item.name,
      children: item.children?.length ? convertToTreeSelectData(item.children) : undefined,
    }));
  };

  // 解析 URL 列表
  const handleParseUrls = async () => {
    const urlList = urls
      .split('\n')
      .map(u => u.trim())
      .filter(u => u && (u.startsWith('http://') || u.startsWith('https://')));

    if (urlList.length === 0) {
      message.warning('请输入有效的网站URL（每行一个）');
      return;
    }

    // 初始化解析列表
    const initialList: ParsedWebsite[] = urlList.map((url, index) => ({
      key: `${index}-${Date.now()}`,
      url,
      name: '',
      description: '',
      tags: '',
      iconUrl: '',
      status: 'pending',
    }));

    setParsedWebsites(initialList);
    setParsing(true);
    setProgress(0);

    // 逐个解析
    for (let i = 0; i < initialList.length; i++) {
      const website = initialList[i];
      
      // 更新状态为解析中
      setParsedWebsites(prev => prev.map(w => 
        w.key === website.key ? { ...w, status: 'parsing' } : w
      ));

      try {
        // 调用 AI 生成网站信息
        const res = await api.post('/ai-config/generate-website-info', { url: website.url });
        const { name, description, tags } = res.data;

        // 获取图标
        let iconUrl = '';
        try {
          const iconRes = await api.get('/favicon-api/fetch', { params: { url: website.url } });
          iconUrl = iconRes.data.faviconUrl || '';
        } catch {
          // 图标获取失败不影响整体流程
        }

        // 更新解析结果
        setParsedWebsites(prev => prev.map(w => 
          w.key === website.key 
            ? { ...w, name, description, tags, iconUrl, status: 'success' }
            : w
        ));
      } catch (error: any) {
        // 解析失败
        setParsedWebsites(prev => prev.map(w => 
          w.key === website.key 
            ? { ...w, status: 'error', error: error.response?.data?.error || '解析失败' }
            : w
        ));
      }

      // 更新进度
      setProgress(Math.round(((i + 1) / initialList.length) * 100));
      
      // 添加延迟避免请求过快
      if (i < initialList.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    setParsing(false);
    message.success('解析完成');
  };

  // 批量导入到数据库
  const handleImport = async () => {
    if (!selectedCategory) {
      message.warning('请选择导入分类');
      return;
    }

    const successWebsites = parsedWebsites.filter(w => w.status === 'success' && w.name);
    if (successWebsites.length === 0) {
      message.warning('没有可导入的网站');
      return;
    }

    setImporting(true);
    let successCount = 0;
    let failCount = 0;

    for (const website of successWebsites) {
      try {
        await api.post('/websites', {
          name: website.name,
          description: website.description,
          url: website.url,
          iconUrl: website.iconUrl || null,
          categoryId: selectedCategory,
          tags: website.tags,
          isNew: true,
        });
        successCount++;
      } catch (error: any) {
        failCount++;
        console.error('导入失败:', website.url, error);
      }
    }

    setImporting(false);
    message.success(`导入完成：成功 ${successCount} 个，失败 ${failCount} 个`);
    
    if (successCount > 0) {
      // 清空已导入的
      setParsedWebsites([]);
      setUrls('');
    }
  };

  // 删除单个
  const handleDelete = (key: string) => {
    setParsedWebsites(prev => prev.filter(w => w.key !== key));
  };

  // 编辑单个
  const handleEdit = (website: ParsedWebsite) => {
    setEditingWebsite(website);
    editForm.setFieldsValue({
      name: website.name,
      description: website.description,
      tags: website.tags,
    });
    setEditModal(true);
  };

  // 保存编辑
  const handleSaveEdit = async () => {
    if (!editingWebsite) return;
    const values = await editForm.validateFields();
    setParsedWebsites(prev => prev.map(w => 
      w.key === editingWebsite.key 
        ? { ...w, ...values, status: 'success' }
        : w
    ));
    setEditModal(false);
    message.success('已更新');
  };

  // 重新解析单个
  const handleRetry = async (website: ParsedWebsite) => {
    setParsedWebsites(prev => prev.map(w => 
      w.key === website.key ? { ...w, status: 'parsing' } : w
    ));

    try {
      const res = await api.post('/ai-config/generate-website-info', { url: website.url });
      const { name, description, tags } = res.data;

      let iconUrl = '';
      try {
        const iconRes = await api.get('/favicon-api/fetch', { params: { url: website.url } });
        iconUrl = iconRes.data.faviconUrl || '';
      } catch {}

      setParsedWebsites(prev => prev.map(w => 
        w.key === website.key 
          ? { ...w, name, description, tags, iconUrl, status: 'success' }
          : w
      ));
      message.success('重新解析成功');
    } catch (error: any) {
      setParsedWebsites(prev => prev.map(w => 
        w.key === website.key 
          ? { ...w, status: 'error', error: error.response?.data?.error || '解析失败' }
          : w
      ));
      message.error('解析失败');
    }
  };

  const columns = [
    {
      title: '网站',
      key: 'website',
      width: 300,
      render: (_: any, record: ParsedWebsite) => (
        <Space>
          {record.iconUrl ? (
            <img src={record.iconUrl} alt="" style={{ width: 24, height: 24, borderRadius: 4 }} />
          ) : (
            <GlobalOutlined style={{ fontSize: 20, color: '#999' }} />
          )}
          <div>
            <div style={{ fontWeight: 500 }}>{record.name || '待解析'}</div>
            <a href={record.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: '#666' }}>
              {record.url.length > 40 ? record.url.slice(0, 40) + '...' : record.url}
            </a>
          </div>
        </Space>
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      width: 250,
      ellipsis: true,
    },
    {
      title: '标签',
      dataIndex: 'tags',
      key: 'tags',
      width: 150,
      ellipsis: true,
    },
    {
      title: '状态',
      key: 'status',
      width: 100,
      render: (_: any, record: ParsedWebsite) => {
        switch (record.status) {
          case 'pending':
            return <Tag>待解析</Tag>;
          case 'parsing':
            return <Tag color="processing">解析中</Tag>;
          case 'success':
            return <Tag color="success" icon={<CheckOutlined />}>成功</Tag>;
          case 'error':
            return (
              <Tooltip title={record.error}>
                <Tag color="error" icon={<CloseOutlined />}>失败</Tag>
              </Tooltip>
            );
          default:
            return null;
        }
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: any, record: ParsedWebsite) => (
        <Space size={4}>
          {record.status === 'error' && (
            <Button size="small" type="link" onClick={() => handleRetry(record)}>
              重试
            </Button>
          )}
          {record.status === 'success' && (
            <Button size="small" type="link" onClick={() => handleEdit(record)}>
              编辑
            </Button>
          )}
          <Button size="small" type="link" danger onClick={() => handleDelete(record.key)}>
            删除
          </Button>
        </Space>
      ),
    },
  ];

  const successCount = parsedWebsites.filter(w => w.status === 'success').length;

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>批量导入网站</h2>
        <p style={{ color: '#666', fontSize: 14, marginTop: 8 }}>
          通过 AI 助手批量解析网站信息，快速导入到网站库
        </p>
      </div>

      <Card title="第一步：输入网站URL" style={{ marginBottom: 16 }}>
        <Alert
          message="使用说明"
          description="每行输入一个网站URL，AI 会自动解析网站名称、描述和标签。支持从其他导航站复制URL列表。"
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
        <Input.TextArea
          value={urls}
          onChange={e => setUrls(e.target.value)}
          placeholder={`https://dribbble.com\nhttps://behance.net\nhttps://figma.com`}
          rows={6}
          disabled={parsing}
        />
        <div style={{ marginTop: 16 }}>
          <Button
            type="primary"
            icon={<RobotOutlined />}
            onClick={handleParseUrls}
            loading={parsing}
            disabled={!urls.trim()}
          >
            AI 解析网站信息
          </Button>
        </div>
        {parsing && (
          <Progress percent={progress} style={{ marginTop: 16 }} />
        )}
      </Card>

      {parsedWebsites.length > 0 && (
        <Card 
          title={`第二步：确认并导入 (${successCount}/${parsedWebsites.length} 个可导入)`}
          extra={
            <Space>
              <TreeSelect
                style={{ width: 200 }}
                placeholder="选择导入分类"
                treeDefaultExpandAll
                treeData={convertToTreeSelectData(categories)}
                value={selectedCategory}
                onChange={setSelectedCategory}
                showSearch
                treeNodeFilterProp="label"
              />
              <Button
                type="primary"
                icon={<ImportOutlined />}
                onClick={handleImport}
                loading={importing}
                disabled={successCount === 0 || !selectedCategory}
              >
                导入到网站库
              </Button>
            </Space>
          }
        >
          <Table
            columns={columns}
            dataSource={parsedWebsites}
            rowKey="key"
            pagination={false}
            scroll={{ y: 400 }}
          />
        </Card>
      )}

      {/* 编辑弹窗 */}
      <Modal
        title="编辑网站信息"
        open={editModal}
        onOk={handleSaveEdit}
        onCancel={() => setEditModal(false)}
      >
        <Form form={editForm} layout="vertical">
          <Form.Item name="name" label="网站名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="网站描述">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="tags" label="标签">
            <Input placeholder="多个标签用逗号分隔" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
