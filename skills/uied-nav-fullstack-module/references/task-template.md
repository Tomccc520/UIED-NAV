# UIED-NAV 同步联动开发任务模板

## 使用时机
- 一个需求同时要改 `server/server`、`server/admin`、`frontend`。
- 需要把“并行开发”变成可追踪任务，避免遗漏权限、配置和回归。

## 任务标题模板
- `[模块名] 同步联动开发（server/admin/frontend）`

## 需求摘要
- 业务目标：
- 用户角色（管理员/访客/登录用户）：
- 是否涉及公开接口：`是/否`
- 是否涉及运营配置：`是/否`
- 是否涉及 WordPress 频道：`是/否`
- 是否涉及版本分层（Free/Pro/Enterprise）：`是/否`

## 接口契约（先冻结）

### 接口列表
| 接口 | 方法 | 用途 | 管理端/前端 |
|---|---|---|---|
| `/api/uied/...` | GET/POST | 管理 CRUD | 管理端 |
| `/api/...` | GET/POST | 前台展示/交互 | 前端 |

### 请求/响应约定
- 请求参数：
- 响应字段：
- 空态返回：
- 错误码与提示：

## 4 条线任务拆解

### A. 数据线（DB/Model）
- [ ] 表结构确认（字段/类型/默认值）
- [ ] 索引确认（查询条件/排序字段）
- [ ] SQL 迁移脚本（兼容旧库）
- [ ] `model/uied/*.js` 落地

### B. 接口线（Egg likeadmin）
- [ ] `service/uied/*.js`
- [ ] `controller/uied/*.js`
- [ ] `router/uied.js` / `router/frontend.js`
- [ ] 返回结构统一（`baseController.result` 或现有兼容格式）
- [ ] 公开接口检查 `notLoginUri` / `notAuthUri`

### C. 管理线（Vue admin）
- [ ] `server/admin/src/api/uied.ts` 或模块 API 文件
- [ ] 列表页 / 编辑页 / 配置页
- [ ] 菜单路由挂接
- [ ] 按钮权限点
- [ ] 角色授权验证

### D. 前台线（React frontend）
- [ ] `frontend/src/services/*.ts`
- [ ] `frontend/src/hooks/*.ts`
- [ ] 页面/组件接入
- [ ] 空态/错误态
- [ ] 配置项生效（禁止硬编码）

## 联调清单（最小闭环）
- [ ] 管理端新增/编辑成功
- [ ] 前台读取并展示成功
- [ ] 点击行为/跳转逻辑正确
- [ ] 运营位排序/开关生效（如有）
- [ ] 日志/统计/点击记录生效（如有）

## 配置闭环检查（配置类需求必填）
- 配置键：
- 后台保存入口：
- API 字段（`/api/settings/public` 或 `/api/settings/frontend-config`）：
- 前端生效位置：
- 默认值兜底：

## 风险与回退
- 风险点 1：
- 风险点 2：
- 临时回退方案：

## 提交与发布（双仓）
- [ ] 前端独立仓提交（如 `frontend` 为独立仓）
- [ ] 根仓更新子模块指针/记录
- [ ] 提交说明包含：接口变更、配置项变更、回归结果

## 备注
- 若需求转为官网前端（Nuxt 3），切换到 `website-*` 技能链，不继续使用本模板。
