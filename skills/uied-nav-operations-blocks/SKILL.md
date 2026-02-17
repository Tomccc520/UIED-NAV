---
name: uied-nav-operations-blocks
description: UIED-NAV 项目做“可运营模块”时使用：围绕 Banner、热门推荐、导航、页脚、投稿、点击统计等能力，快速上线可配置运营位并完成前后端联调与回归。
---

# UIED 运营位上线技能

## 触发场景
- 需求关键词：活动位、专题位、广告位、推荐位、运营后台、可视化配置。
- 需要支持运营同学后台配置内容、排序、上下线时间、跳转方式。
- 需要统计曝光/点击并可追溯。

## 重点复用模块
- 路由：`server/server/app/router/uied.js`、`server/server/app/router/frontend.js`
- 后端：`server/server/app/controller/uied/banner.js`、`hotRecommendation.js`、`navMenu.js`、`footer.js`、`operationLog.js`
- 后端服务：`server/server/app/service/uied/banner.js`、`hotRecommendation.js`、`frontend.js`
- 后台 API：`server/admin/src/api/uied.ts`
- 后台页面：`server/admin/src/views/uied/banner`、`hotRecommendation`、`navMenu`、`footer`
- 前端组件：`frontend/src/components/Banner`、`frontend/src/pages/Home`

## 标准流程
1. 明确运营位数据结构：标题、副标题、图片、链接、排序、状态、时间窗、渠道标识。
2. 复用已有模块（优先 Banner/热门推荐），避免重复造表。
3. 必要时补充字段并迁移 SQL，保持默认值与空值容错。
4. 后端提供两套接口：
   - 管理侧 CRUD：`/api/uied/...`
   - 前台展示：`/api/...`（frontend router）
5. 前端组件仅消费“激活数据”，不直连管理接口。
6. 接入点击统计（如 `bannerClick`）与操作日志，便于运营复盘。

## 运营可配置原则
- 所有展示开关、排序、文案、跳转方式都要后台化。
- 支持“定时上/下线”或至少提供 `enabled + sort`。
- 统一点击行为语义：详情页跳转 vs 直达外链。

## 代码规范（强制）
- 新增函数写函数级中文注释。
- 注释使用中文。
- 新页面文件加版权头：

```js
/**
 * @copyright Tomda (https://www.tomda.top)
 * @copyright UIED技术团队 (https://fsuied.com)
 * @author UIED技术团队
 * @createDate 2026.xx.xx
 */
```

## 快速验收
- 后台新增一条运营位 -> 前台可见。
- 后台关闭该条运营位 -> 前台不可见。
- 排序调整后前台顺序一致。
- 点击后统计数据变化（点击数/日志）。

## 上线前检查
- 是否配置了默认兜底数据，避免空白区块。
- 是否支持移动端样式回退。
- 是否对外链做安全提示（如跳转提醒弹窗配置）。

