# UIED API 后端服务

基于 Express + Prisma + SQLite 的后端 API 服务。

## 快速开始

### 1. 安装依赖
```bash
cd backend
npm install
```

### 2. 初始化数据库
```bash
npm run prisma:generate
npm run prisma:migrate
```

### 3. 填充初始数据
```bash
npm run prisma:seed
```

### 4. 启动开发服务器
```bash
npm run dev
```

服务将运行在 `http://localhost:3001

## API 接口文档

### 健康检查
- `GET /api/health` - 检查服务状态

### 分类接口
- `GET /api/categories` - 获取所有分类
- `GET /api/categories/:id` - 获取单个分类
- `GET /api/categories/slug/:slug` - 通过slug获取分类

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
- `PUT /api/admin/websites/reorder` - 批量更新网站顺序

## 数据库管理

### 查看数据库
```bash
npm run prisma:studio
```

### 创建迁移
```bash
npm run prisma:migrate
```

## 项目结构

```
backend/
├── prisma/
│   ├── schema.prisma    # 数据库模型定义
│   └── dev.db          # SQLite数据库文件
├── src/
│   ├── routes/         # 路由定义
│   │   ├── categoryRoutes.js
│   │   ├── websiteRoutes.js
│   │   └── adminRoutes.js
│   ├── utils/
│   │   └── seed.js     # 数据填充脚本
│   └── index.js        # 入口文件
├── public/             # 管理后台静态文件
│   ├── admin.html
│   └── admin.js
├── .env                # 环境变量
└── package.json
```

## 环境变量

```env
DATABASE_URL="file:./dev.db"
PORT=3001
NODE_ENV=development
```

## 技术栈

- **Express** - Web框架
- **Prisma** - ORM数据库工具
- **SQLite** - 轻量级数据库
- **express-validator** - 数据验证
