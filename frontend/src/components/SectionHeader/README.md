# SectionHeader 组件

通用区块标题组件，参考 RankingHeader 设计，简洁统一的风格。

## 功能特点

- 🎨 简洁统一的颜色方案
- 📱 完全响应式设计
- 🖼️ 可选的背景图片支持
- 🌓 支持浅色/深色主题
- ⚡ 性能优化的微妙动效
- ♿ 无障碍访问支持

## 使用方式

```tsx
import SectionHeader from '../components/SectionHeader';

// 基本使用（无背景）
<SectionHeader 
  title="热门AI工具"
  description="探索最新的人工智能技术与应用"
  showBackground={false}
/>

// 带背景图片
<SectionHeader 
  title="设计师专区"
  description="为UI/UX设计师精心挑选的工具集合"
  backgroundImage="/bg.jpg"
  theme="light"
  showBackground={true}
/>
```

## 属性说明

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| title | string | - | 主标题（必填） |
| description | string | - | 副标题描述（可选） |
| backgroundImage | string | '/bg.jpg' | 背景图片地址 |
| className | string | '' | 自定义CSS类名 |
| theme | 'light' \| 'dark' | 'light' | 标题颜色主题 |
| showBackground | boolean | true | 是否显示背景图片 |

## 主题说明

- **light**: 白色文字，适合深色背景
- **dark**: 深色文字，适合浅色背景
- **无背景**: 自动使用深色文字

## 设计特点

参考 RankingHeader 的设计理念：
- 清晰的视觉层次
- 统一的颜色方案
- 简洁的结构布局
- 良好的可读性

## 响应式断点

- **桌面端**: > 768px - 完整尺寸和效果
- **平板端**: 768px - 中等尺寸
- **移动端**: 480px - 紧凑布局

## 使用建议

1. 建议背景图片尺寸为 1200x400px 以获得最佳效果
2. 深色背景建议使用 light 主题
3. 浅色背景或无背景建议使用 dark 主题
4. 标题应简洁明了，描述文字不宜过长 