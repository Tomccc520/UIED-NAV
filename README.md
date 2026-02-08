# 🌟 UIED 导航系统

> 开源、免费、强大的设计师导航网站系统

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![GitHub Stars](https://img.shields.io/github/stars/Tomccc520/UIED-NAV.svg)](https://github.com/Tomccc520/UIED-NAV/stargazers)
[![GitHub Forks](https://img.shields.io/github/forks/Tomccc520/UIED-NAV.svg)](https://github.com/Tomccc520/UIED-NAV/network)

[English](README.md) | [简体中文](README.md)

---

## 📖 项目简介

UIED 导航系统是一个现代化的设计资源导航网站系统，采用前后端分离架构，提供完整的管理后台。

### ✨ 核心特性

- 🎨 **现代化设计**：简洁美观的用户界面
- 🚀 **高性能**：React 19 + Egg.js，快速响应
- 📱 **响应式**：完美支持移动端和桌面端
- 🔧 **易于部署**：Docker 一键部署
- 🎯 **功能完整**：网站管理、分类管理、SEO 优化等
- 🔒 **安全可靠**：JWT 认证，数据加密

---

## 🎯 功能特性

### 核心功能

- ✅ 网站管理（增删改查）
- ✅ 分类管理（含子分类）
- ✅ 页面管理
- ✅ 批量导入/导出
- ✅ Favicon 自动获取
- ✅ 基础搜索
- ✅ 用户提交
- ✅ SEO 设置
- ✅ 站点配置
- ✅ 热门推荐
- ✅ 社交媒体集成

### 管理功能

- ✅ 用户管理
- ✅ 权限管理
- ✅ 数据统计
- ✅ 操作日志
- ✅ 系统设置
- ✅ 网站监控
- ✅ 数据导出
- ✅ 文章管理
- ✅ 评论管理

---

## 🚀 快速开始

### 环境要求

- Node.js >= 16.0.0
- npm >= 8.0.0
- Docker (用于 MySQL)

### 安装步骤

#### 1. 克隆项目

```bash
git clone https://github.com/Tomccc520/UIED-NAV.git
cd UIED-NAV
```

#### 2. 启动 MySQL 数据库

```bash
docker-compose -f docker/docker-compose.mysql.yml up -d
```

#### 3. 安装依赖

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

#### 4. 配置环境变量

```bash
# 前端配置
cd frontend
cp .env.example .env
# 编辑 .env 文件，确保 API 地址正确
# REACT_APP_API_URL=http://localhost:8002/api
```

#### 5. 导入初始数据

```bash
# 导入 likeadmin 基础表
docker exec -i uied_mysql mysql -u uied -puied123456 uied_nav < server/sql/install.sql

# 导入 UIED 业务表
docker exec -i uied_mysql mysql -u uied -puied123456 uied_nav < server/sql/uied_tables.sql
```

#### 6. 启动服务

```bash
# 启动后端（端口 8002）
cd server/server
npm run dev

# 启动管理后台（端口 5174）
cd ../admin
npm run dev

# 启动前端（端口 3003）
cd ../../frontend
npm start
```

#### 7. 访问系统

| 服务 | 地址 | 说明 |
|------|------|------|
| 前端 | http://localhost:3003 | 用户访问的网站 |
| 后端 | http://localhost:8002/api | RESTful API |
| 管理后台 | http://localhost:5174 | 内容管理系统 |

**默认管理员账号：**
- 用户名: `admin`
- 密码: `123456`

---

## 📦 项目结构

```
uied-nav/
├── server/            # likeadmin 后端和管理后台
│   ├── server/        # Egg.js API 服务 (端口 8002)
│   │   ├── app/
│   │   │   ├── controller/uied/  # UIED 业务控制器
│   │   │   ├── service/uied/     # UIED 业务服务
│   │   │   └── model/uied/       # UIED 数据模型
│   │   └── config/
│   └── admin/         # Vue 3 管理后台 (端口 5174)
│       └── src/views/uied/       # UIED 管理页面
├── frontend/          # React 用户前端 (端口 3003)
│   ├── src/
│   │   ├── components/    # 可复用组件
│   │   ├── pages/         # 页面组件
│   │   ├── hooks/         # 自定义 hooks
│   │   └── services/      # API 调用服务
│   └── public/
├── docker/            # Docker 配置
│   └── docker-compose.mysql.yml
├── data/              # 数据备份
│   └── mysql_backup_*.sql
├── docs/              # 文档
└── README.md
```

---

## 🛠️ 技术栈

### Frontend（前端用户界面）
- React 19
- TypeScript
- React Router v7
- Zustand + React Query
- 原生 CSS

### Backend（后端 API）
- Egg.js (likeadmin)
- Sequelize ORM
- MySQL 8.0
- JWT 认证

### Admin（管理后台）
- Vue 3 + TypeScript
- Element Plus
- Vite

### Database（数据库）
- MySQL 8.0
- Docker 容器化

---

## 📚 文档

- 📖 [开发指南](docs/开发指南.md) - 项目结构、API说明、学习要点
- 🗄️ [数据库说明](docs/数据库说明.md) - 数据表结构、备份方案
- 🔐 [登录系统说明](docs/登录系统说明.md) - 认证流程、安全措施
- 🚀 [宝塔部署指南](docs/宝塔部署教程.md) - 生产环境部署步骤
- 🐳 [Docker部署指南](docs/Docker部署教程.md) - Docker 部署步骤
- 🧪 [测试指南](docs/测试指南.md) - 功能测试、API测试
- 📊 [项目总结](docs/项目总结.md) - 功能清单、技术栈
- 💼 [商业化规划](docs/商业化规划.md) - 开源+商业化策略

---

## 🤝 贡献

欢迎贡献代码！请遵循以下步骤：

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'feat: Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

### 提交规范

- `feat`: 新功能
- `fix`: 修复 bug
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 代码重构
- `test`: 添加测试
- `chore`: 构建工具或辅助工具的变动

---

## 📄 开源协议

本项目采用 [MIT](LICENSE) 协议。

---

## 🔗 相关链接

- [官网](https://fsuied.com)
- [GitHub](https://github.com/Tomccc520/UIED-NAV)
- [Gitee](https://gitee.com/tomdac/uied-nav)

---

## 💖 支持项目

如果这个项目对你有帮助，请给个 ⭐️ Star 支持一下！

---

## 📧 联系方式

- 作者：Tomda
- 网站：https://fsuied.com

---

**© 2026 UIED技术团队. All Rights Reserved.**
