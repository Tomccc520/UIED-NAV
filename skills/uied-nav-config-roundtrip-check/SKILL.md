---
name: uied-nav-config-roundtrip-check
description: UIED-NAV 配置改造后的高效回归技能：一次性完成“后台保存 -> API 返回 -> 前端生效 -> 关键页面验证”的闭环检查，避免可配置项上线后失效。
---

# UIED 配置闭环回归技能

## 触发场景
- 改了站点设置、主题设置、点击行为、详情页开关后，担心前端不生效。
- 需要快速验证可配置项“写入数据库 + 接口返回 + 页面展示”全链路。

## 关键文件
- `server/server/app/service/uied/setting.js`
- `server/server/app/controller/uied/setting.js`
- `server/server/app/controller/uied/frontend.js`
- `frontend/src/services/publicSettingService.ts`
- `frontend/src/hooks/usePublicSettings.ts`
- `frontend/src/hooks/useFrontendConfig.ts`
- `scripts/test_setting_api.sh`

## 标准流程
1. 后台修改一个配置项并保存（例如 `homepageConfig.homeCarouselEnabled`）。
2. 调用 `/api/uied/setting/get` 或 `/api/settings/public` 确认新值已返回。
3. 前端强刷页面，确认 UI 行为变化与配置一致。
4. 清空前端缓存后再验证一次，排除缓存假象。
5. 记录“配置键 -> 接口字段 -> 页面效果”映射，避免后续回归盲查。

## 常见断点定位
- 后台已保存但前端无变化：优先查 `publicSettingService` 的 normalize 与默认值覆盖。
- API 超时导致回退默认值：查服务端日志和数据库慢查询。
- 字段名不一致：查 `getPublicSettings()` 返回结构与前端类型定义是否同名。

## 推荐命令
- `bash scripts/test_setting_api.sh`
- `cd server/server && npm run test -- test/property/featureToggleRoundTrip.test.js`
- `cd server/server && npm run test -- test/property/detailPageConfig.test.js`

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

