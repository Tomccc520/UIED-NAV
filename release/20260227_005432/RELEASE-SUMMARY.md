# UIED-NAV 版本化打包结果

- 生成时间：2026-02-27 00:54:33
- 版本列表：pro
- 预设方案：first-pro
- 健康检查地址：http://127.0.0.1:8002
- 客户名称（模板）：未填写
- 公司名称（模板）：未填写
- 联系邮箱（模板）：未填写
- 域名限制（模板）：1
- 域名白名单（模板）：未填写
- 有效期（模板）：0 天（0=不过期）
- 自动签发许可证：关闭
- 签发接口：http://127.0.0.1:8002/api/uied/license/sign

## 使用说明（首发版推荐）

1. 选择一个版本目录（如 `pro/`）作为首发交付包。
2. 修改该目录下 `license/customer-license.json` 客户信息与域名。
3. 通过后台许可证接口完成签名（推荐）：
   - `/api/uied/license/sign`
   - `/api/uied/license/verify`
4. 导入 `feature/feature-overrides.json` 与初始化数据。
5. 执行健康检查并确认 FAIL=0 后再发包。

