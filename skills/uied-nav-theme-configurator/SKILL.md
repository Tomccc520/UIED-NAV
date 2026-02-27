---
name: uied-nav-theme-configurator
description: UIED-NAV 项目做“WordPress主题级可配置改造”时使用：新增/扩展站点配置项，并打通 server setting、admin 站点设置页、frontend hooks 与样式生效链路，适用于售卖版主题定制交付。
---

# UIED 主题配置改造技能

## 触发场景
- 用户提出“主题可配置”“后台可调”“像 WordPress 主题自定义器”。
- 需要新增或改造：主题色、字体、布局、开关、点击行为等设置项。
- 需要保证改动能在后台保存并在前端实时生效。

## 必看文件
- `server/server/app/service/uied/setting.js`
- `server/server/app/controller/uied/setting.js`
- `server/server/app/controller/uied/frontend.js`
- `server/admin/src/views/uied/setting/index.vue`
- `server/admin/src/api/uied.ts`
- `frontend/src/services/publicSettingService.ts`
- `frontend/src/hooks/usePublicSettings.ts`
- `frontend/src/hooks/useFrontendConfig.ts`

## 标准流程
1. 在 `setting.js` 定义新配置的默认值与规范化函数。
2. 在 `getPublicSettings()` 返回结构中挂载该配置，字段名与前端保持一致。
3. 在 `admin` 站点设置页补充表单项，并走 `uiedSettingSave` 保存。
4. 在 `publicSettingService.ts` 增加类型、默认值、normalize 逻辑。
5. 在 `usePublicSettings.ts` 或 `useFrontendConfig.ts` 消费配置并落地到 UI/CSS 变量。
6. 若新增公开读取接口，检查 `server/server/app/extend/config.js` 的 `notLoginUri`。
7. 补充 SQL 初始化或迁移，确保老库可平滑升级。

## 改造约束
- 配置必须可后台修改，禁止只写死在前端。
- 必须有默认值，接口失败时前端可降级展示。
- 优先沿用已存在 key：`appearanceConfig`、`homepageConfig`、`pageGlobalConfig`、`cardStyleConfig`、`sidebarConfig`、`searchConfig`、`exitModalConfig`、`detailPageConfig`。

## 代码规范（强制）
- 新增函数写函数级中文注释。
- 注释使用中文。
- 新页面或新文件头部添加版权信息：

```ts
/**
 * @copyright Tomda (https://www.tomda.top)
 * @copyright UIED技术团队 (https://fsuied.com)
 * @author UIED技术团队
 * @createDate 2026.xx.xx
 */
```

## 快速验证
- `bash scripts/test_setting_api.sh`
- `cd server/server && npm run test -- test/property/detailPageConfig.test.js`
- 手动验证：
  - 后台修改配置并保存
  - 前端刷新后配置生效
  - API `/api/settings/public`、`/api/settings/frontend-config` 返回包含新字段

## 交付清单
- 配置项后台可见、可改、可保存。
- 前端消费配置成功，刷新后仍生效。
- 接口失败可回退默认值，不影响主流程。

