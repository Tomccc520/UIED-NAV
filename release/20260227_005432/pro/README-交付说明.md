# UIED-NAV PRO 交付包

## 1. 包说明

- 本目录为 PRO 版本交付模板包。
- 采用“主干一套代码 + 许可证 + 功能开关”模式，不做代码分叉。

## 2. 初始化步骤

1. 导入数据库基础表结构（按实际部署 SQL）。
2. 导入初始化数据（分类/标签/示例内容）。
3. 在后台导入 `license/customer-license.json`。
4. 在后台导入 `feature/feature-overrides.json`。
5. 执行发布前健康检查脚本并确认 FAIL=0。

## 3. 必改项

- `license/customer-license.json` 中的客户信息、域名、签名。
- `config/app.env.example` 中的数据库与服务地址配置。

## 4. 验收接口

- `/api/uied/license/info`
- `/api/uied/feature/list`
- `/api/uied/commercial/overview`

