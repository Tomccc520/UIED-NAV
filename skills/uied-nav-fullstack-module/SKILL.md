---
name: uied-nav-fullstack-module
description: UIED-NAV 前后端同步联动开发技能。用于在 server(egg likeadmin)/admin(vue)/frontend(react) 同步推进一个需求，按接口契约、权限菜单、运营配置与前端展示的顺序落地并回归。
---

# UIED-NAV 前后端同步联动开发技能

## 触发场景
- 一个需求同时涉及 `server/server`、`server/admin`、`frontend`。
- 需要边做后端边做前端，但又要保持 likeadmin 规范与 UIED 配置体系一致。
- 需求类型：CRUD 模块、配置项、运营位、频道页、详情页行为。

## 仓库边界说明（重要）
- 本技能中的 `frontend` 指当前仓库的 **UIED-NAV 导航站前端（React）**。
- 不适用于你另一个官网前端（Nuxt 3）的 `website-*` 项目。
- 若是官网前端需求，改用 `website-nuxt-page-module`、`website-api-contract-sync` 等技能链。

## 推荐技能组合（按顺序）
1. `likeadmin-node-module` 或 `likeadmin-node-codegen`
2. `likeadmin-node-auth-menu`
3. `uied-nav-fullstack-module`（本技能）
4. 按需分支技能：
   - `uied-nav-theme-configurator`（配置项/主题）
   - `uied-nav-operations-blocks`（Banner/推荐/运营位）
   - `uied-nav-wordpress-channel`（WP 频道）
   - `uied-nav-commercialization-edition`（版本分层）
5. `uied-nav-config-roundtrip-check`
6. `uied-nav-dual-repo-git`

## 同步开发原则（核心）
- 契约先行：先定接口路径、参数、返回结构，再并行开发 admin/front。
- 后端最小可用优先：先打通列表/详情接口，再补高级筛选与边角字段。
- 配置优先后台化：能进 `uied_setting` 体系的不要写死前端。
- 权限与免登录规则同步处理：避免“页面有了但接口 401/403”。
- 回归闭环必须做：保存配置 -> API 返回 -> 前端生效。

## 标准执行流（同步模式）

### 1. 拆需求（先拆成 4 条线）
- 数据线：表结构/字段/索引/默认值
- 接口线：`controller/service/router` + 返回结构
- 管理线：`admin` 页面/API/菜单/权限点
- 前台线：`frontend services/hooks/pages/components`
- 可直接套用模板：`references/task-template.md`

### 2. 先冻结接口契约（并行边界）
- 输出最小契约：
  - 路径
  - 请求参数
  - 响应字段
  - 错误码/空态
- admin 与 frontend 可以先按契约联调，后端细节后补。

### 3. 后端 likeadmin 落地（规范）
- `model` / `service` / `controller` / `router` 成套落地。
- 统一返回结构（优先复用 likeadmin 规范与 `baseController.result`）。
- 若是前台公开接口，检查 `server/server/app/extend/config.js` 的 `notLoginUri` / `notAuthUri`。

### 4. 管理后台落地（Vue）
- `server/admin/src/api/uied.ts` 或模块 API 文件补接口。
- `server/admin/src/views/uied/**` 补列表、编辑、配置页。
- 菜单路由、按钮权限点、角色授权同步处理（用 `likeadmin-node-auth-menu`）。

### 5. 前台落地（React）
- `frontend/src/services/**` 封装接口。
- `frontend/src/hooks/**` 做配置与数据整合。
- 页面组件只消费 service/hook，不直接拼接口细节。
- 点击行为、详情页、运营位显示遵循后台配置。

### 6. 联调与回归
- 管理端新增/编辑 -> 前台展示变更 -> 点击/日志/统计闭环。
- 对配置类需求，至少验证：
  - `/api/uied/setting/*`
  - `/api/settings/public`
  - `/api/settings/frontend-config`

## 目录级检查清单
- 后端：`server/server/app/controller/uied`、`service/uied`、`model/uied`、`router/uied.js`
- 管理端：`server/admin/src/api/uied.ts`、`server/admin/src/views/uied/**`
- 前台：`frontend/src/services/**`、`frontend/src/hooks/**`、`frontend/src/pages/**`

## 完成定义（DoD）
- 接口、admin、frontend 三端都可跑通。
- 菜单权限与免登录/免权限规则正确。
- 配置项不是硬编码，后台改动能生效。
- 回归通过后再做双仓提交（`uied-nav-dual-repo-git`）。

## 代码规范（强制）
- 新增函数写函数级中文注释。
- 注释使用中文。
- 页面文件按项目规范补版权头（适用的文件类型必须加）。

## 参考资料
- 同步开发任务模板：`references/task-template.md`
