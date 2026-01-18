# UIED 导航系统 - 安装指南

> 完整的安装和部署指南

---

## 📋 环境要求

- **Node.js**: >= 18.0.0
- **npm**: >= 9.0.0
- **操作系统**: Linux / macOS / Windows

---

## 🚀 快速安装（5 分钟）

### 1. 克隆项目

```bash
# GitHub
git clone https://github.com/Tomccc520/UIED-NAV.git
cd UIED-NAV

# 或者使用 Gitee（国内更快）
git clone https://gitee.com/tomdac/uied-nav.git
cd uied-nav
```

### 2. 安装依赖

```bash
# 安装后端依赖
cd backend
npm install

# 安装前端依赖
cd ../frontend
npm install

# 安装管理后台依赖
cd ../admin
npm install
```

### 3. 配置环境变量

#### 后端配置

```bash
cd backend
cp .env.example .env
```

编辑 `backend/.env` 文件：

```env
# 数据库配置（默认使用 SQLite）
DATABASE_URL="file:./prisma/dev.db"

# JWT 密钥（请修改为随机字符串）
JWT_SECRET="your-secret-key-change-this-in-production"

# 服务器端口
PORT=3001

# CORS 允许的源
CORS_ORIGIN="http://localhost:3000,http://localhost:5173"

# Node 环境
NODE_ENV="development"
```

#### 前端配置

```bash
cd ../frontend
cp .env.example .env
```

编辑 `frontend/.env` 文件：

```env
# API 地址
REACT_APP_API_URL=http://localhost:3001/api
```

#### 管理后台配置

```bash
cd ../admin
cp .env.example .env
```

编辑 `admin/.env` 文件：

```env
# API 地址
VITE_API_URL=http://localhost:3001/api
```

### 4. 初始化数据库

```bash
cd backend

# 生成 Prisma Client
npx prisma generate

# 运行数据库迁移（创建表结构）
npx prisma migrate deploy

# 填充初始数据
node src/utils/seedAdmin.js        # 创建管理员账号
node src/utils/seedSettings.js     # 创建系统设置
node src/utils/seedFaviconApis.js  # 创建 Favicon API 配置
```

**默认管理员账号**：
- 用户名: `UIED`
- 密码: `UIED123456`

⚠️ **重要**：首次登录后请立即修改密码！

### 5. 启动服务

#### 方式一：分别启动（推荐开发环境）

```bash
# 终端 1：启动后端
cd backend
npm run dev

# 终端 2：启动前端
cd frontend
npm start

# 终端 3：启动管理后台
cd admin
npm run dev
```

#### 方式二：使用启动脚本

```bash
# 在项目根目录
chmod +x start.sh
./start.sh
```

### 6. 访问系统

| 服务 | 地址 | 说明 |
|------|------|------|
| 前端 | http://localhost:3000 | 用户访问的网站 |
| 管理后台 | http://localhost:5173 | 内容管理系统 |
| 后端 API | http://localhost:3001/api | RESTful API |

---

## 🗄️ 数据库说明

### SQLite（默认）

项目默认使用 SQLite 数据库，无需额外安装数据库服务。

**数据库文件位置**：`backend/prisma/dev.db`

**优点**：
- ✅ 零配置，开箱即用
- ✅ 轻量级，适合中小型项目
- ✅ 单文件，易于备份

**缺点**：
- ❌ 不支持高并发
- ❌ 不适合大型项目

### 切换到 MySQL/PostgreSQL（可选）

如果需要更强大的数据库，可以切换到 MySQL 或 PostgreSQL。

#### 1. 修改 `backend/prisma/schema.prisma`

```prisma
datasource db {
  provider = "mysql"  // 或 "postgresql"
  url      = env("DATABASE_URL")
}
```

#### 2. 修改 `backend/.env`

```env
# MySQL
DATABASE_URL="mysql://username:password@localhost:3306/uied_nav"

# PostgreSQL
DATABASE_URL="postgresql://username:password@localhost:5432/uied_nav"
```

#### 3. 重新生成和迁移

```bash
cd backend
npx prisma generate
npx prisma migrate deploy
```

---

## 📦 数据初始化详解

### 必需的初始化脚本

#### 1. 创建管理员账号

```bash
node src/utils/seedAdmin.js
```

创建默认管理员账号（UIED / UIED123456）

#### 2. 创建系统设置

```bash
node src/utils/seedSettings.js
```

创建系统基础配置（站点名称、描述等）

#### 3. 创建 Favicon API 配置

```bash
node src/utils/seedFaviconApis.js
```

配置 Favicon 获取服务

### 可选的初始化脚本

#### 4. 创建示例页面

```bash
node src/utils/seedPages.js
```

创建示例页面（首页、关于等）

#### 5. 创建热门推荐

```bash
node src/utils/seedHotRecommendations.js
```

创建热门推荐配置

#### 6. 创建社交媒体配置

```bash
node src/utils/seedSocialMedia.js
```

创建社交媒体链接配置

---

## 🔧 常见问题

### 1. 端口被占用

如果端口 3000、3001 或 5173 被占用，可以修改：

**后端端口**：修改 `backend/.env` 中的 `PORT`

**前端端口**：修改 `frontend/package.json` 中的 start 脚本：
```json
"start": "PORT=3002 react-scripts start"
```

**管理后台端口**：修改 `admin/vite.config.ts`：
```typescript
export default defineConfig({
  server: {
    port: 5174
  }
})
```

### 2. 数据库迁移失败

```bash
cd backend

# 重置数据库
rm prisma/dev.db
npx prisma migrate deploy

# 重新填充数据
node src/utils/seedAdmin.js
node src/utils/seedSettings.js
node src/utils/seedFaviconApis.js
```

### 3. 依赖安装失败

```bash
# 清理缓存
npm cache clean --force

# 删除 node_modules
rm -rf node_modules package-lock.json

# 重新安装
npm install
```

### 4. 前端无法连接后端

检查：
1. 后端是否正常启动（http://localhost:3001/api）
2. 前端 `.env` 中的 `REACT_APP_API_URL` 是否正确
3. 后端 `.env` 中的 `CORS_ORIGIN` 是否包含前端地址

---

## 🚀 生产环境部署

### 1. 构建前端

```bash
cd frontend
npm run build
# 构建产物在 build/ 目录
```

### 2. 构建管理后台

```bash
cd admin
npm run build
# 构建产物在 dist/ 目录
```

### 3. 配置生产环境变量

```bash
cd backend
cp .env.production.example .env.production
```

编辑 `.env.production`：

```env
DATABASE_URL="file:./prisma/prod.db"
JWT_SECRET="your-production-secret-key"
PORT=3001
NODE_ENV="production"
CORS_ORIGIN="https://yourdomain.com"
```

### 4. 启动生产环境

```bash
cd backend
NODE_ENV=production npm start
```

### 5. 使用 Nginx 反向代理

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # 前端
    location / {
        root /path/to/frontend/build;
        try_files $uri /index.html;
    }

    # 管理后台
    location /admin {
        root /path/to/admin/dist;
        try_files $uri /index.html;
    }

    # 后端 API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## 📚 更多文档

- [开发指南](https://github.com/Tomccc520/UIED-NAV)
- [API 文档](https://github.com/Tomccc520/UIED-NAV)
- [常见问题](https://github.com/Tomccc520/UIED-NAV/issues)

---

## 💬 获取帮助

- **GitHub Issues**: https://github.com/Tomccc520/UIED-NAV/issues
- **Gitee Issues**: https://gitee.com/tomdac/uied-nav/issues
- **官网**: https://fsuied.com

---

**© 2026 UIED技术团队. All Rights Reserved.**
