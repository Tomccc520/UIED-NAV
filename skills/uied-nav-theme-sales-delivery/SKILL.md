---
name: uied-nav-theme-sales-delivery
description: UIED-NAV 项目做主题售卖交付时使用：围绕后台可配置、可运营、可迁移三目标，输出可复制的客户交付包（配置、频道、运营位、验收与运维说明）。
---

# UIED 主题售卖交付技能

## 触发场景
- 要把项目按“WordPress 主题”方式售卖给客户。
- 客户强调后台可配置、运营可控、后续可维护。
- 需要标准化交付，减少每个项目重复劳动。

## 仓库边界说明（避免混用）
- 当前仓库 `frontend/` 是 **UIED-NAV 导航站前端（React）**。
- 若需求切到官网前端（Nuxt 3），应改用 `website-*` 系列技能，不要套本技能的前端落地路径。

## 交付目标
- 客户可在后台独立修改：主题、首页区块、跳转行为、SEO、运营位。
- 客户可运营：Banner、热门推荐、频道内容、友情链接、页脚。
- 可迁移：配置可导出/导入，跨环境快速落地。

## 标准交付包
1. 主题配置包：
   - `appearanceConfig`、`homepageConfig`、`pageGlobalConfig`
2. 频道配置包：
   - 页面 slug + 分类映射 +（可选）WordPress 源配置
3. 运营配置包：
   - Banner、热门推荐、导航菜单、页脚/社媒
4. 验收包：
   - 接口清单、操作录屏、回归截图、常见问题

## 实施步骤
1. 用后台先完成“客户品牌化”配置（Logo、主题色、字体、版权、SEO）。
2. 按客户业务搭建页面与分类结构，绑定推荐与广告位。
3. 若客户要资讯频道，接入 `wordpressConfig` 多源与分类映射。
4. 运行配置闭环验证（保存、读取、生效、降级）。
5. 导出 SQL 和配置说明，形成可复用交付模板。

## 同步开发模式（当前阶段推荐）
- 当你是“前后端同步推进”而不是“纯配置交付”时，按这个链路执行：
  1. `likeadmin-node-module` / `likeadmin-node-codegen`
  2. `likeadmin-node-auth-menu`
  3. `uied-nav-fullstack-module`
  4. 按需进入 `uied-nav-theme-configurator` / `uied-nav-operations-blocks` / `uied-nav-wordpress-channel`
  5. `uied-nav-config-roundtrip-check`
  6. `uied-nav-dual-repo-git`
- 原因：售卖交付能力最终还是落在“接口契约 + admin 配置页 + React 前台展示 + 回归闭环”。

## 约束原则
- 禁止把客户文案和样式写死在前端代码。
- 每项售卖能力都必须给出后台入口和操作路径。
- 版本升级不得破坏客户既有配置结构（保持兼容字段）。

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

## 验收清单
- 客户能在后台独立完成主题与运营配置。
- 前台改动实时生效，错误时有默认值兜底。
- 交付文档包含“配置项-页面效果-接口字段”映射表。
