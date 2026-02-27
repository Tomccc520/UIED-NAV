---
name: uied-nav-wordpress-channel
description: UIED-NAV 项目做 WordPress 主题化内容接入时使用：配置多 WP 源、分类映射、文章代理、缓存与降级，输出可售卖的“内容频道模板”能力。
---

# UIED WordPress 频道化技能

## 触发场景
- 用户要“像 WordPress 主题一样可装配内容频道”。
- 需要从外部 WordPress 拉文章并映射到 UIED 页面。
- 需要多站点源切换、分类映射、缓存和容错。

## 必看文件
- `server/server/app/service/uied/wordpressConfig.js`
- `server/server/app/controller/uied/wordpressConfig.js`
- `server/server/app/router/uied.js`
- `frontend/src/services/wordpress-api.js`
- `frontend/src/hooks/useWordPressCategories.ts`
- `frontend/src/hooks/useWordPressTags.ts`
- `frontend/src/hooks/useWordPressWidgets.ts`

## 标准流程
1. 先配置数据源：`uied_wordpress_config`（名称、API URL、默认源、缓存时间）。
2. 再配置分类映射：`uied_wordpress_category`（`pageSlug`、展示名、排序、显示开关）。
3. 后端统一通过 `wordpressConfig` 服务代理请求，前端不直接依赖外部域名。
4. 前端按 page slug 读取映射分类，渲染“频道页”组件。
5. 设置失败降级：请求超时或 4xx/5xx 时返回空列表 + 本地默认文案。
6. 对列表页做缓存键设计（分类+分页+排序），避免重复抓取。

## 可售卖交付形态
- “内容频道模板包”：科技资讯、设计文章、AI 资讯等。
- 每个模板包只需替换：
  - WP 源地址
  - 分类映射
  - 页面 slug
  - 频道样式文案

## 稳定性要求
- 禁止把 WP API URL 硬编码在组件里。
- 所有频道开关都要后台可配置。
- 必须保留缓存时间可调参数（便于运营平衡实时性与性能）。

## 代码规范（强制）
- 新增函数写函数级中文注释。
- 注释使用中文。
- 新页面文件加版权头：

```ts
/**
 * @copyright Tomda (https://www.tomda.top)
 * @copyright UIED技术团队 (https://fsuied.com)
 * @author UIED技术团队
 * @createDate 2026.xx.xx
 */
```

## 快速验收
- 后台切换默认 WP 源后，前端频道数据同步切换。
- 分类映射改名/排序后，前端展示同步变化。
- 外部 WP 不可用时，页面不白屏且有兜底提示。

