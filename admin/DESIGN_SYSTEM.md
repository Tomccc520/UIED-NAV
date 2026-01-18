# 管理后台设计系统文档

> **版本**: 1.0.0  
> **最后更新**: 2026-01-18  
> **作者**: UIED 技术团队

## 📋 目录

- [概述](#概述)
- [主题系统](#主题系统)
- [颜色系统](#颜色系统)
- [字体系统](#字体系统)
- [间距系统](#间距系统)
- [组件样式](#组件样式)
- [无障碍性](#无障碍性)
- [使用示例](#使用示例)

---

## 概述

本设计系统基于 **Ant Design 6** 构建，通过主题配置（theme tokens）实现统一的视觉风格。支持亮色/暗色模式切换，符合 WCAG AA 无障碍标准。

### 核心特性

- ✅ 亮色/暗色主题切换
- ✅ 基于 8px 网格的间距系统
- ✅ 完整的颜色系统
- ✅ 无障碍性支持（键盘导航、ARIA 标签）
- ✅ 响应式设计
- ✅ 统一的动画和过渡效果

---

## 主题系统

### 主题配置文件

主题配置位于 `admin/src/config/theme.ts`，包含 `lightTheme` 和 `darkTheme` 两套配置。

```typescript
// admin/src/config/theme.ts
import type { ThemeConfig } from 'antd';

export const lightTheme: ThemeConfig = {
  token: {
    colorPrimary: '#3B82F6',
    colorSuccess: '#10B981',
    // ... 更多配置
  },
  components: {
    Button: { /* 按钮样式 */ },
    Table: { /* 表格样式 */ },
    // ... 更多组件
  }
};
```

### 主题切换

使用 `ThemeContext` 管理主题状态：

```typescript
import { useTheme } from '../contexts/ThemeContext';

function MyComponent() {
  const { mode, toggleTheme, isDark } = useTheme();
  
  return (
    <Button onClick={toggleTheme}>
      当前模式: {mode} {/* 'light' | 'dark' | 'auto' */}
    </Button>
  );
}
```

---

## 颜色系统

### 主色系

| 颜色 | 亮色模式 | 暗色模式 | 用途 |
|------|---------|---------|------|
| Primary | `#3B82F6` | `#60A5FA` | 主要操作、链接 |
| Success | `#10B981` | `#34D399` | 成功状态 |
| Warning | `#F59E0B` | `#FBBF24` | 警告提示 |
| Error | `#EF4444` | `#F87171` | 错误状态 |
| Info | `#3B82F6` | `#60A5FA` | 信息提示 |

### 文本色系

| 层级 | 亮色模式 | 暗色模式 | 用途 |
|------|---------|---------|------|
| Primary | `#1E293B` | `#F8FAFC` | 主要文本 |
| Secondary | `#64748B` | `#CBD5E1` | 次要文本 |
| Tertiary | `#94A3B8` | `#94A3B8` | 辅助文本 |
| Disabled | `#CBD5E1` | `#64748B` | 禁用文本 |

### 背景色系

| 类型 | 亮色模式 | 暗色模式 | 用途 |
|------|---------|---------|------|
| Layout | `#F8FAFC` | `#0F172A` | 页面背景 |
| Container | `#FFFFFF` | `#1E293B` | 容器背景 |
| Elevated | `#FFFFFF` | `#1E293B` | 浮层背景 |
| Spotlight | `#F1F5F9` | `#334155` | 高亮背景 |

### 边框色系

| 类型 | 亮色模式 | 暗色模式 | 用途 |
|------|---------|---------|------|
| Border | `#E2E8F0` | `#334155` | 主边框 |
| Border Secondary | `#F1F5F9` | `#475569` | 次边框 |
| Split | `#F1F5F9` | `#334155` | 分割线 |

---

## 字体系统

### 字体族

```css
/* 主字体 */
font-family: 'Open Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;

/* 代码字体 */
font-family: 'Fira Code', 'Courier New', monospace;
```

### 字体大小

| Token | 大小 | 用途 |
|-------|------|------|
| `fontSize` | 14px | 正文 |
| `fontSizeSM` | 12px | 小文本 |
| `fontSizeLG` | 16px | 大文本 |
| `fontSizeXL` | 20px | 特大文本 |
| `fontSizeHeading1` | 30px | 一级标题 |
| `fontSizeHeading2` | 24px | 二级标题 |
| `fontSizeHeading3` | 20px | 三级标题 |

### 字重

| Token | 值 | 用途 |
|-------|---|------|
| `fontWeightStrong` | 600 | 加粗文本 |
| 默认 | 400 | 正常文本 |

---

## 间距系统

基于 **8px 网格系统**：

| Token | 值 | 用途 |
|-------|---|------|
| `paddingXS` | 8px | 极小内边距 |
| `paddingSM` | 12px | 小内边距 |
| `padding` | 16px | 标准内边距 |
| `paddingLG` | 20px | 大内边距 |
| `paddingXL` | 24px | 特大内边距 |

同样适用于 `margin` 系列。

---

## 组件样式

### Button 按钮

```typescript
Button: {
  borderRadius: 6,
  controlHeight: 32,
  controlHeightLG: 40,
  controlHeightSM: 24,
  fontWeight: 500,
  primaryShadow: '0 0 0 0 transparent', // 无阴影
}
```

**使用示例**：

```tsx
<Button type="primary" size="large">主要按钮</Button>
<Button type="default">默认按钮</Button>
<Button type="text">文本按钮</Button>
```

### Table 表格

```typescript
Table: {
  headerBg: '#F8FAFC',
  headerColor: '#475569',
  rowHoverBg: '#F8FAFC',
  rowSelectedBg: '#EFF6FF',
  borderColor: '#F1F5F9',
  headerBorderRadius: 8,
  fontWeightStrong: 600, // 表头加粗
}
```

### Card 卡片

```typescript
Card: {
  borderRadiusLG: 12,
  paddingLG: 24,
  boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', // 轻微阴影
  colorBorderSecondary: '#F1F5F9',
}
```

### Menu 菜单

```typescript
Menu: {
  itemSelectedBg: '#EFF6FF',
  itemSelectedColor: '#3B82F6',
  itemHoverBg: '#F8FAFC',
  itemBorderRadius: 6,
  iconSize: 16,
  activeBarWidth: 0, // 无竖条
}
```

### Input 输入框

```typescript
Input: {
  borderRadius: 6,
  controlHeight: 32,
  activeBorderColor: '#3B82F6',
  activeShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
  errorActiveShadow: '0 0 0 3px rgba(239, 68, 68, 0.1)',
}
```

---

## 无障碍性

### 键盘导航

所有交互元素支持键盘访问：

- **Tab**: 切换焦点
- **Enter/Space**: 激活按钮
- **Esc**: 关闭模态框
- **Arrow Keys**: 菜单导航

### 焦点指示器

```css
/* 全局焦点样式 */
*:focus-visible {
  outline: 3px solid rgba(59, 130, 246, 0.5);
  outline-offset: 2px;
  border-radius: 4px;
}
```

### ARIA 标签

所有交互元素都添加了适当的 ARIA 标签：

```tsx
<Button aria-label="访问前台首页">访问首页</Button>
<div role="button" tabIndex={0} aria-expanded={!collapsed}>
  折叠按钮
</div>
```

### 跳过导航

提供跳过导航链接，方便键盘用户快速访问主内容：

```tsx
<a href="#main-content" className="skip-to-content">
  跳转到主内容
</a>
```

---

## 使用示例

### 1. 创建带主题的页面

```tsx
import { Card, Button, Space } from 'antd';
import { theme } from 'antd';

function MyPage() {
  const { token } = theme.useToken();
  
  return (
    <Card>
      <Space direction="vertical" size={token.padding}>
        <h2 style={{ color: token.colorTextHeading }}>页面标题</h2>
        <p style={{ color: token.colorTextSecondary }}>描述文本</p>
        <Button type="primary">操作按钮</Button>
      </Space>
    </Card>
  );
}
```

### 2. 使用骨架屏

```tsx
import TableSkeleton from '../components/TableSkeleton';
import CardSkeleton from '../components/CardSkeleton';

function MyPage() {
  const [loading, setLoading] = useState(true);
  
  if (loading) {
    return <TableSkeleton rows={5} columns={4} />;
  }
  
  return <Table dataSource={data} />;
}
```

### 3. 使用通知工具

```tsx
import { showSuccess, showError, showSuccessWithUndo } from '../utils/notification';

function MyComponent() {
  const handleSave = async () => {
    try {
      await saveData();
      showSuccess('保存成功');
    } catch (error) {
      showError('保存失败', error.message);
    }
  };
  
  const handleDelete = async (id) => {
    await deleteData(id);
    showSuccessWithUndo('删除成功', () => {
      // 撤销操作
      restoreData(id);
    });
  };
}
```

### 4. 使用错误边界

```tsx
import ErrorBoundary from '../components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <MyComponent />
    </ErrorBoundary>
  );
}
```

---

## 常见问题

### Q: 如何自定义主题颜色？

A: 修改 `admin/src/config/theme.ts` 中的 `colorPrimary` 等 token：

```typescript
export const lightTheme: ThemeConfig = {
  token: {
    colorPrimary: '#your-color', // 修改主色
  }
};
```

### Q: 如何添加新的组件样式？

A: 在 `theme.ts` 的 `components` 中添加配置：

```typescript
components: {
  MyComponent: {
    // 组件样式配置
  }
}
```

### Q: 如何禁用暗色模式？

A: 在 `ThemeContext` 中移除暗色模式选项，或在 UI 中隐藏主题切换按钮。

### Q: 如何测试无障碍性？

A: 使用以下方法：
1. 仅使用键盘导航测试所有功能
2. 使用屏幕阅读器（NVDA、JAWS）测试
3. 使用浏览器开发工具的 Lighthouse 审计

---

## 参考资源

- [Ant Design 官方文档](https://ant.design/)
- [WCAG 2.1 无障碍指南](https://www.w3.org/WAI/WCAG21/quickref/)
- [Material Design 色彩系统](https://material.io/design/color)

---

**维护者**: UIED 技术团队  
**网站**: https://fsuied.com  
**许可证**: MIT
