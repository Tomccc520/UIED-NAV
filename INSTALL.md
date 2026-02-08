# UIED 导航系统 - 安装指南

> 完整的安装和部署指南

---

## 📋 环境要求

- **Node.js**: >= 16.0.0
- **npm**: >= 8.0.0
- **Docker**: 用于运行 MySQL 数据库
- **操作系统**: Linux / macOS / Windows

---

## 🚀 快速安装

### 1. 克隆项目

```bash
# GitHub
git clone https://github.com/Tomccc520/UIED-NAV.git
cd UIED-NAV

# 或者使用 Gitee（国内更快）
git clone https://gitee.com/tomdac/uied-nav.git
cd uied-nav
```

### 2. 启动 MySQL 数据库

```bash
# 使用 Docker 启动 MySQL
docker-compose -f docker/docker-compose.mysql.yml up -d

# 验证 MySQL 是否启动成功
docker ps | grep uied_mysql
```

### 3. 安装依赖

```bash
# 安装后端依赖
cd server/server
npm install

# 安装管理后台依赖
cd ../admin
npm install

# 安装前端依赖
cd ../../frontend
npm install
```

### 4. 配置环境变量

#### 前端配置

```bash
cd frontend
cp .env.example .env
```

编辑 `frontend/.env` 文件：

```env
# API 地址
REACT_APP_API_URL=http://localhost:8002/api
PORT=3003
```

### 5. 初始化数据库

```bash
# 导入 likeadmin 基础表
docker exec -i uied_mysql mysql -u uied -puied123456 uied_nav < server/sql/install.sql

# 导入 UIED 业务表
docker exec -i uied_mysql mysql -u uied -puied123456 uied_nav < server/sql/uied_tables.sql
```

**默认管理员账号**：
- 用户名: `admin`
- 密码: `123456`

⚠️ **重要**：首次登录后请立即修改密码！

### 6. 启动服务

#### 方式一：分别启动（推荐开发环境）

```bash
# 终端 1：启动后端 (Egg.js)
cd server/server
npm run dev

# 终端 2：启动管理后台 (Vue 3)
cd server/admin
npm run dev

# 终端 3：启动前端 (React)
cd frontend
npm start
```

#### 方式二：使用启动脚本

```bash
# 在项目根目录
chmod +x start.sh
./start.sh
```

### 7. 访问系统

| 服务 | 地址 | 说明 |
|------|------|------|
| 前端 | http://localhost:3003 | 用户访问的网站 |
| 管理后台 | http://localhost:5174 | 内容管理系统 |
| 后端 API | http://localhost:8002/api | RESTful API |

---

## 🗄️ 数据库说明

### MySQL（默认）

项目使用 MySQL 8.0 数据库，通过 Docker 容器运行。

**数据库配置**：
- 主机: `127.0.0.1`
- 端口: `3308`
- 数据库名: `uied_nav`
- 用户名: `uied`
- 密码: `uied123456`

**备份数据库**：
```bash
docker exec uied_mysql mysqldump -u uied -puied123456 uied_nav > data/mysql_backup_$(date +%Y%m%d_%H%M%S).sql
```

**恢复数据库**：
```bash
docker exec -i uied_mysql mysql -u uied -puied123456 uied_nav < data/mysql_backup_YYYYMMDD_HHMMSS.sql
```

---

## 🔧 常见问题

### 1. 端口被占用

如果端口被占用，可以修改：

**后端端口**：修改 `server/server/config/config.local.js` 中的端口配置

**前端端口**：修改 `frontend/.env` 中的 `PORT`

**管理后台端口**：修改 `server/admin/vite.config.ts`

### 2. MySQL 连接失败

```bash
# 检查 MySQL 容器状态
docker ps | grep uied_mysql

# 查看 MySQL 日志
docker logs uied_mysql

# 重启 MySQL 容器
docker-compose -f docker/docker-compose.mysql.yml restart
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
1. 后端是否正常启动（http://localhost:8002/api）
2. 前端 `.env` 中的 `REACT_APP_API_URL` 是否正确
3. MySQL 数据库是否正常运行

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
cd server/admin
npm run build
# 构建产物在 dist/ 目录
```

### 3. 配置生产环境

编辑 `server/server/config/config.prod.js`：

```javascript
config.sequelize = {
  dialect: 'mysql',
  host: 'your-mysql-host',
  port: 3306,
  database: 'uied_nav',
  username: 'your-username',
  password: 'your-password',
};
```

### 4. 启动生产环境

```bash
cd server/server
npm start
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
        root /path/to/server/admin/dist;
        try_files $uri /index.html;
    }

    # 后端 API
    location /api {
        proxy_pass http://localhost:8002;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## 📚 更多文档

- [开发指南](docs/开发指南.md)
- [Docker部署教程](docs/Docker部署教程.md)
- [宝塔部署教程](docs/宝塔部署教程.md)
- [常见问题](https://github.com/Tomccc520/UIED-NAV/issues)

---

## 💬 获取帮助

- **GitHub Issues**: https://github.com/Tomccc520/UIED-NAV/issues
- **Gitee Issues**: https://gitee.com/tomdac/uied-nav/issues
- **官网**: https://fsuied.com

---

**© 2026 UIED技术团队. All Rights Reserved.**
