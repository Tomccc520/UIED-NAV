---
name: uied-nav-commercialization-edition
description: UIED-NAV 项目做售卖版能力分层时使用：基于后台可配置与可运营原则，落地 Free/Pro/Enterprise 功能开关、许可证校验、升级引导与版本交付边界。
---

# UIED 售卖版分层技能

## 触发场景
- 需求关键词：开源版/专业版/企业版、许可证、功能开关、版本售卖。
- 需要把“能力差异”做成后台可控，而不是写死分支。

## 参考文件
- `docs/开源版与Pro版区分策略.md`
- `docs/开源版本准备清单.md`
- `server/server/app/controller/uied/aiConfig.js`
- `server/server/app/service/uied/setting.js`
- `frontend/src/hooks/useLicense.ts`（若不存在则创建）
- `frontend/src/hooks/useFrontendConfig.ts`

## 标准流程
1. 定义功能矩阵（Free/Pro/Enterprise），先写成常量和表结构。
2. 建立许可证与功能开关读取接口：
   - `/api/uied/license/info`
   - `/api/uied/feature/list`
3. 后台提供可视化开关与版本包配置页。
4. 前端用统一 Hook 判定能力：`hasFeature('xxx')`。
5. 未授权能力显示升级引导，不允许直接报错或空白。
6. 保持“配置优先级”：许可证能力 > 后台开关 > 默认能力。

## 可运营要求
- 支持按客户做功能开关覆盖（白名单或租户级）。
- 支持版本到期/禁用后的平滑降级。
- 支持最小可售卖单元：主题包、频道包、运营包。

## 落地建议（贴合当前项目）
- 公共基础能力继续复用 `uied` 现有 CRUD 与配置体系。
- 高价值能力优先分层：
  - AI 相关（生成、分析、批处理）
  - 高级统计与监控
  - 去广告与品牌化配置
  - API 批量同步能力

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
- 未授权功能是否都走统一升级提示。
- 切换许可证类型后，前后端能力是否一致。
- 后台禁用功能后，前台是否即时降级。
- 文档中是否明确每个版本的交付边界。

