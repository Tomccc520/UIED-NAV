# 前后端集成指南

## 概述

前端使用 React + TypeScript，后端使用 Express + Prisma + SQLite。
前后端通过 RESTful API 进行通信。

## 环境配置

### 1. 配置后端 API 地址

在 `frontend/.env` 文件中配置：

```env
REACT_APP_API_URL=http://localhost:3001/api
```

### 2. 启动服务

**后端：**
```bash
cd backend
npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

**前端：**
```bash
cd frontend
npm install
npm start
```

## 使用示例

### 1. 使用 Hook 获取数据

```tsx
import { useCategories } from './hooks/useCategories';
import { useWebsites } from './hooks/useWebsites';

function MyComponent() {
  const { categories, loading: categoriesLoading } = useCategories();
  const { websites, loading: websitesLoading } = useWebsites({ 
    category: 'ai-tools',
    featured: true 
  });

  if (categoriesLoading || websitesLoading) {
    return <div>加载中...</div>;
  }

  return (
    <div>
      <h2>分类列表</h2>
      {categories.map(cat => (
        <div key={cat.id}>{cat.name}</div>
      ))}

      <h2>网站列表</h2>
      {websites.map(site => (
        <div key={site.id}>
          <h3>{site.name}</h3>
          <p>{site.description}</p>
        </div>
      ))}
    </div>
  );
}
```

### 2. 直接使用 Service

```tsx
import { websiteService } from './services/websiteService';
import { categoryService } from './services/categoryService';

async function loadData() {
  try {
    // 获取所有分类
    const categories = await categoryService.getAll();
    
    // 获取推荐网站
    const featured = await websiteService.getFeatured();
    
    // 搜索网站
    const results = await websiteService.search('figma');
    
    // 按分类获取网站
    const aiTools = await websiteService.getAll({ 
      category: 'ai-tools' 
    });
    
    console.log({ categories, featured, results, aiTools });
  } catch (error) {
    console.error('加载失败:', error);
  }
}
```

### 3. 获取热门和推荐网站

```tsx
import { useFeaturedWebsites, useHotWebsites } from './hooks/useWebsites';

function HomePage() {
  const { websites: featured } = useFeaturedWebsites();
  const { websites: hot } = useHotWebsites();

  return (
    <div>
      <section>
        <h2>推荐网站</h2>
        {featured.map(site => (
          <div key={site.id}>{site.name}</div>
        ))}
      </section>

      <section>
        <h2>热门网站</h2>
        {hot.map(site => (
          <div key={site.id}>{site.name}</div>
        ))}
      </section>
    </div>
  );
}
```

## 数据迁移

### 从静态数据迁移到 API

**之前（静态数据）：**
```tsx
import { categories, allWebsites } from './data/websiteDatabase';

function MyComponent() {
  return (
    <div>
      {categories.map(cat => <div key={cat.id}>{cat.name}</div>)}
    </div>
  );
}
```

**之后（API 数据）：**
```tsx
import { useCategories } from './hooks/useCategories';
import { useWebsites } from './hooks/useWebsites';

function MyComponent() {
  const { categories, loading } = useCategories();
  const { websites } = useWebsites();

  if (loading) return <div>加载中...</div>;

  return (
    <div>
      {categories.map(cat => <div key={cat.id}>{cat.name}</div>)}
    </div>
  );
}
```

## API 接口列表

### 分类接口
- `GET /api/categories` - 获取所有分类
- `GET /api/categories/:id` - 获取单个分类
- `GET /api/categories/slug/:slug` - 通过 slug 获取分类

### 网站接口
- `GET /api/websites` - 获取所有网站
  - 查询参数: `category`, `featured`, `hot`, `new`, `search`
- `GET /api/websites/:id` - 获取单个网站
- `GET /api/websites/featured/list` - 获取推荐网站
- `GET /api/websites/hot/list` - 获取热门网站

### 管理接口
- `POST /api/admin/categories` - 创建分类
- `PUT /api/admin/categories/:id` - 更新分类
- `DELETE /api/admin/categories/:id` - 删除分类
- `POST /api/admin/websites` - 创建网站
- `PUT /api/admin/websites/:id` - 更新网站
- `DELETE /api/admin/websites/:id` - 删除网站

## 管理后台

访问 `http://localhost:3001/admin/admin.html` 可以：
- 管理分类
- 添加/编辑/删除网站
- 设置网站状态（热门、推荐、新增）
- 调整显示顺序

## 注意事项

1. **CORS 配置**：后端已配置 CORS，允许前端跨域访问
2. **错误处理**：所有 Hook 都包含 error 状态，记得处理错误情况
3. **加载状态**：使用 loading 状态显示加载指示器
4. **数据类型**：使用 TypeScript 类型确保类型安全
5. **环境变量**：不要提交 `.env` 文件到 Git

## 开发建议

1. 先启动后端服务，确保 API 可用
2. 使用 Prisma Studio 查看和管理数据库：`npm run prisma:studio`
3. 查看后端日志排查 API 问题
4. 使用浏览器开发工具的 Network 面板查看 API 请求
