# UIED 设计资源导航网站

**现代化的设计资源与AI工具导航平台** - 为设计师和开发者提供精选的工具和资源。

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-4.9+-blue.svg)](https://www.typescriptlang.org/)

## ✨ 主要功能

### 🎨 设计工具导航
- **分类浏览** - UI工具、图标素材、配色方案、字体资源等多个分类
- **精选推荐** - 热门、推荐、新增工具标记
- **智能搜索** - 支持工具名称、描述、标签的多维度搜索
- **实时图标** - 自动获取网站favicon，提升视觉体验

### 🤖 AI工具专区
- **AI分类** - 文本AI、图像AI、代码AI、设计AI等专业分类
- **热门应用** - ChatGPT、Midjourney、Claude等最新AI工具
- **统一体验** - 与设计导航保持一致的界面和交互

### 🔍 增强搜索
- **搜索建议** - 实时显示匹配的工具、标签、分类建议
- **搜索历史** - 本地保存搜索记录，支持快速重复搜索
- **高级筛选** - 按分类、标签、热度等多维度筛选

### 🏠 专业分类
- **室内设计** - 家装设计、家具选择、装修工具等专业资源
- **3D工具** - 建模、渲染、动画制作工具
- **字体资源** - 中英文字体、商用字体、设计字体
- **电商工具** - 店铺装修、商品设计、营销工具

## 🚀 快速开始

### 安装依赖
```bash
npm install
```

### 开发模式
```bash
npm start
```
在浏览器中打开 [http://localhost:3000](http://localhost:3000)

### 构建生产版本
```bash
npm run build
```

## 🏗️ 技术架构

### 前端技术栈
- **React 18** + **TypeScript** - 现代化类型安全开发
- **React Router 6** - 单页应用路由管理
- **自定义Hook** - 逻辑复用和状态管理
- **CSS Modules** - 组件化样式管理

### 代码架构
- **通用Hook** - `useNavigation` 抽取页面间重复逻辑
- **数据服务层** - 统一的数据接口和服务
- **组件复用** - `ToolCard` 通用工具卡片组件
- **增强搜索** - `useEnhancedSearch` 提供高级搜索功能

### 性能优化
- **图标缓存** - 智能favicon获取和缓存策略
- **懒加载** - 按需加载组件和资源
- **防抖搜索** - 避免频繁搜索请求
- **响应式设计** - 移动端、平板、桌面端适配

## 📦 项目结构

```
src/
├── components/           # 通用组件
│   ├── UI/              # 基础UI组件
│   ├── CategorySidebar/ # 分类侧边栏
│   ├── HeroBanner/      # Hero横幅组件
│   ├── ToolCard/        # 工具卡片组件
│   └── layout/          # 布局组件
├── hooks/               # 自定义Hook
│   ├── useNavigation.ts # 通用导航Hook
│   └── useEnhancedSearch.ts # 增强搜索Hook
├── pages/               # 页面组件
│   ├── Home/           # 首页
│   ├── AI/             # AI工具页面
│   ├── Interior/       # 室内设计页面
│   ├── Design/         # 设计工具页面
│   └── Search/         # 搜索结果页面
├── data/               # 数据层
│   └── *Database.js    # 各类工具数据库
└── utils/              # 工具函数
    └── faviconUtils.js # 图标获取工具
```

## 🎯 最新更新

### v2.1.0 (2025-01)
- ✅ **室内设计导航** - 新增室内设计工具专区
- ✅ **代码优化** - 移除开发脚本，精简项目结构
- ✅ **文档更新** - 优化README，提升可读性

### v2.0.0 (2025-01)
- ✅ **代码重构** - 使用通用Hook消除重复代码
- ✅ **搜索优化** - 新增搜索建议、历史记录、高级筛选
- ✅ **组件复用** - 统一的ToolCard组件
- ✅ **性能提升** - 优化图标加载和搜索性能

## 🎨 设计规范

### 主题色彩
- **主色调**: `#0066ff` (蓝色)
- **文字色**: `#333` (主要) / `#666` (次要) / `#999` (辅助)
- **辅助色**: 多色标签设计，6种半透明色彩

### 响应式断点
- **桌面端**: ≥75rem (1200px)
- **平板端**: 48rem-75rem (768px-1200px)  
- **手机端**: ≤48rem (768px)

### 字体规范
- **全局字体**: Lexend 优先，系统字体降级
- **尺寸单位**: 全部使用rem单位，响应式调整

## 📱 浏览器支持

- Chrome ≥ 88
- Firefox ≥ 85
- Safari ≥ 14
- Edge ≥ 88

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

**UIED技术团队** © 2025 | [官网](https://fsuied.com) | [GitHub](https://github.com/uied-nav-frontend)
