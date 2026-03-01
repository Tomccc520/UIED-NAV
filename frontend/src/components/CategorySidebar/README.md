# CategorySidebar 通用导航侧边栏组件

一个支持多种导航类型的通用侧边栏组件，可用于设计导航、AI导航、字体导航等不同场景。

## 功能特性

- 🎯 支持多种导航类型（设计、AI、字体、工具、资源、自定义）
- 📌 可选的固定定位（sticky）和静态定位模式
- 🔄 **新增**：导航类型切换功能，支持在不同页面间切换
- 🔍 **改进**：搜索结果跳转到独立搜索页面
- 🏷️ 支持徽章显示（新、热门、Beta等）
- 🚫 支持禁用状态
- 📱 响应式设计，移动端自动切换布局
- 🎨 丰富的样式配置选项

## 基本用法

### 1. 设计导航（首页使用，带导航切换）

```tsx
import CategorySidebar, { NavMenuType, type NavSwitchItem } from '../../components/CategorySidebar';

const sidebarConfig = {
  title: '全部网址导航',
  type: NavMenuType.DESIGN,
  showSearch: true,
  searchLabel: '搜索结果',
  searchIcon: IconSearch
};

// 导航切换选项配置
const navSwitchItems: NavSwitchItem[] = [
  {
    type: NavMenuType.DESIGN,
    name: '首页',
    icon: DesignIcons.Design,
    description: '设计工具与资源导航'
  },
  {
    type: NavMenuType.AI,
    name: 'AI工具',
    icon: DesignIcons.AI,
    description: '人工智能工具导航'
  }
];

const navItems = [
  {
    id: '1',
    name: 'AI工具',
    count: 15,
    icon: 'ai',  // 或者传入组件: DesignIcons.AI
    color: '#667EEA'
  },
  {
    id: '2', 
    name: 'UI设计',
    count: 8,
    icon: 'ui',
    color: '#F093FB',
    badge: 'hot'  // 显示"热门"徽章
  }
];

// 处理导航类型切换
const handleNavTypeChange = (navType: NavMenuType) => {
  if (navType === NavMenuType.AI) {
    navigate('/ai');
  } else if (navType === NavMenuType.DESIGN) {
    navigate('/');
  }
};

// 处理导航项点击
const handleNavItemClick = (itemId: string) => {
  if (itemId === 'search-page') {
    // 跳转到搜索页面
    navigate('/search?q=' + encodeURIComponent(searchValue));
    return;
  }
  // 其他导航逻辑
  setActiveCategory(itemId);
};

<CategorySidebar
  config={sidebarConfig}
  navItems={navItems}
  activeItem={activeCategory}
  onItemClick={handleNavItemClick}
  isSticky={true}
  // 新增：导航切换相关属性
  showNavSwitch={true}
  navSwitchItems={navSwitchItems}
  currentNavType={NavMenuType.DESIGN}
  onNavTypeChange={handleNavTypeChange}
/>
```

### 2. AI工具导航（AI页面使用）

```tsx
const aiSidebarConfig = {
  title: 'AI工具导航',
  type: NavMenuType.AI,
  showSearch: true,
  searchLabel: 'AI搜索结果',
  searchIcon: DesignIcons.AI
};

const aiNavItems = [
  {
    id: 'text-ai',
    name: '文本AI',
    count: 3,
    icon: DesignIcons.AI,
    color: '#10a37f',
    badge: 'hot'
  },
  {
    id: 'image-ai',
    name: '图像AI',
    count: 2, 
    icon: DesignIcons.Graphic,
    color: '#6366f1',
    badge: 'new'
  },
  {
    id: 'code-ai',
    name: '代码AI',
    count: 1,
    icon: DesignIcons.Tool,
    color: '#059669'
  }
];

<CategorySidebar
  config={aiSidebarConfig}
  navItems={aiNavItems}
  activeItem={activeAI}
  onItemClick={handleAIClick}
  isSticky={true}
  // 导航切换功能
  showNavSwitch={true}
  navSwitchItems={navSwitchItems}
  currentNavType={NavMenuType.AI}
  onNavTypeChange={handleNavTypeChange}
/>
```

### 3. 字体导航

```tsx
const fontSidebarConfig = {
  title: '字体导航', 
  type: NavMenuType.FONT,
  showSearch: true,
  searchLabel: '字体搜索结果',
  searchIcon: DesignIcons.Font
};

const fontNavItems = [
  {
    id: 'serif',
    name: '衬线字体',
    count: 25,
    icon: DesignIcons.Font,
    color: '#dc2626'
  },
  {
    id: 'sans-serif', 
    name: '无衬线字体',
    count: 30,
    icon: DesignIcons.Font,
    color: '#2563eb'
  },
  {
    id: 'script',
    name: '手写字体',
    count: 15,
    icon: DesignIcons.Font,
    color: '#7c3aed',
    badge: 'beta'
  }
];

<CategorySidebar
  config={fontSidebarConfig}
  navItems={fontNavItems}
  activeItem={activeFontType}
  onItemClick={handleFontClick}
  isSticky={false}  // 静态定位
/>
```

### 4. 自定义导航

```tsx
const customSidebarConfig = {
  title: '自定义导航',
  type: NavMenuType.CUSTOM,
  showSearch: false  // 不显示搜索功能
};

const customNavItems = [
  {
    id: 'item1',
    name: '自定义项目1', 
    icon: MyCustomIcon,  // 自定义图标组件
    color: '#059669'
  },
  {
    id: 'item2',
    name: '自定义项目2',
    // 不设置count则不显示计数
    icon: 'tools',
    color: '#dc2626'
  }
];

<CategorySidebar
  config={customSidebarConfig}
  navItems={customNavItems}
  activeItem={activeCustom}
  onItemClick={handleCustomClick}
  className="my-custom-sidebar"  // 自定义CSS类
/>
```

## API 参考

### SidebarConfig

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| title | string | - | 侧边栏标题 |
| type | NavMenuType | - | 导航类型 |
| showSearch | boolean | false | 是否显示搜索结果导航 |
| searchLabel | string | - | 搜索结果标签 |
| searchIcon | React.ComponentType | IconSearch | 搜索图标 |

### NavItem

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| id | string | - | 唯一标识 |
| name | string | - | 显示名称 |
| count | number | - | 计数（可选） |
| icon | React.ComponentType \| string | - | 图标（组件或预设字符串） |
| color | string | - | 主题色 |
| badge | string | - | 徽章文本 |
| disabled | boolean | false | 是否禁用 |

### **新增**：NavSwitchItem

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| type | NavMenuType | - | 导航类型 |
| name | string | - | 显示名称 |
| icon | React.ComponentType | - | 图标组件 |
| description | string | - | 描述文本（可选） |

### CategorySidebarProps

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| config | SidebarConfig | - | 侧边栏配置 |
| navItems | NavItem[] | - | 导航项列表 |
| activeItem | string | - | 当前激活项ID |
| onItemClick | (itemId: string) => void | - | 导航项点击回调 |
| isSearchMode | boolean | false | 是否为搜索模式 |
| searchResultsCount | number | 0 | 搜索结果数量 |
| onExitSearchMode | () => void | - | 退出搜索模式回调 |
| isSticky | boolean | true | 是否启用固定定位 |
| className | string | '' | 自定义CSS类 |
| **showNavSwitch** | boolean | false | **新增**：是否显示导航切换 |
| **navSwitchItems** | NavSwitchItem[] | [] | **新增**：导航切换选项 |
| **currentNavType** | NavMenuType | - | **新增**：当前导航类型 |
| **onNavTypeChange** | (navType: NavMenuType) => void | - | **新增**：导航类型切换回调 |

## 新增功能说明

### 1. 导航切换功能

通过设置 `showNavSwitch={true}` 启用导航切换功能：

- 在侧边栏顶部显示下拉式导航切换器
- 支持在不同页面类型间切换（如首页 ↔ AI工具页）
- 切换时会触发 `onNavTypeChange` 回调
- 可配置切换选项的图标和描述

### 2. 搜索页面跳转

搜索结果项现在会跳转到独立的搜索页面：

- 点击搜索结果项时，调用 `onItemClick('search-page')`
- 建议在点击处理函数中跳转到 `/search` 页面
- 显示外部链接图标，提示用户会跳转页面

### 3. 响应式导航切换

- 移动端下导航切换器会适应小屏幕布局
- 下拉菜单支持滚动和触摸操作
- 保持与现有响应式设计的一致性

## 样式定制

### CSS 变量

组件使用以下CSS变量，可以在项目中重写：

```css
:root {
  --primary-color: #1890ff;
  --primary-light: rgba(24, 144, 255, 0.1);
  --text-primary: #262626;
  --text-secondary: #8c8c8c;
  --text-light: #bfbfbf;
  --white: #ffffff;
  --border-color: #d9d9d9;
  --background-light: #fafafa;
}
```

### 自定义样式类

可以通过 `className` 属性添加自定义样式：

```css
.my-custom-sidebar {
  border: 2px solid #1890ff;
  border-radius: 12px;
}

.my-custom-sidebar .sidebar-header h3 {
  color: #1890ff;
}
```

导航切换相关的CSS类：

```css
.nav-switch-container       /* 导航切换容器 */
.nav-switch-trigger         /* 切换按钮 */
.nav-switch-dropdown        /* 下拉菜单 */
.nav-switch-option          /* 切换选项 */
.nav-switch-option.active   /* 激活的选项 */
```

## 响应式设计

- **桌面端（>768px）**：垂直布局，支持固定定位
- **移动端（≤768px）**：自动切换为水平滑动布局，强制静态定位
- **超小屏幕（≤375px）**：进一步压缩尺寸

## 预设导航类型

| 类型 | 枚举值 | 默认标题 | 默认搜索标签 | 默认图标 |
|------|--------|----------|--------------|----------|
| 设计导航 | NavMenuType.DESIGN | 设计导航 | 搜索结果 | IconSearch |
| AI导航 | NavMenuType.AI | AI工具导航 | AI搜索结果 | DesignIcons.AI |
| 字体导航 | NavMenuType.FONT | 字体导航 | 字体搜索结果 | DesignIcons.Font |
| 工具导航 | NavMenuType.TOOLS | 工具导航 | 工具搜索结果 | DesignIcons.Tool |
| 资源导航 | NavMenuType.RESOURCES | 资源导航 | 资源搜索结果 | DesignIcons.Resource |
| 自定义导航 | NavMenuType.CUSTOM | 导航 | - | IconSearch | 