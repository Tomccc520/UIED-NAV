/**
 * @copyright Tomda (https://www.tomda.top)
 * @copyright UIED技术团队 (https://fsuied.com)
 * @author UIED技术团队
 * @createDate 2026.2.13
 */

# 工具脚本使用说明

本目录包含项目的各种实用脚本，用于简化开发和运维工作。

## 📋 脚本列表

### 1. restart-frontend.sh
**功能**：快速重启前端服务

**使用场景**：
- 修改了前端代码需要重启
- 前端服务卡死或异常
- 端口被占用需要清理

**使用方法**：
```bash
./scripts/restart-frontend.sh
```

**执行流程**：
1. 停止占用 3003 端口的进程
2. 等待 2 秒
3. 启动前端服务（端口 3003）

---

### 2. diagnose.sh
**功能**：诊断端口和 API 连接问题

**使用场景**：
- CORS 错误排查
- API 连接失败
- 端口配置检查
- 服务状态检查

**使用方法**：
```bash
./scripts/diagnose.sh
```

**检查项目**：
1. ✅ 后端服务是否运行（端口 8002）
2. ✅ 前端服务是否运行（端口 3003）
3. ✅ 环境变量配置（.env.development, .env.local）
4. ✅ 代码中的硬编码端口
5. ✅ API 连接测试
6. ✅ CORS 头检查

**输出示例**：
```
🔍 CORS 和详情页问题诊断脚本
================================

1️⃣ 检查后端服务...
✅ 后端正在运行 (端口 8002)

2️⃣ 检查前端服务...
✅ 前端正在运行 (端口 3003)

3️⃣ 检查环境变量配置...
📄 .env.development 内容:
REACT_APP_API_URL=http://localhost:8002/api

4️⃣ 检查代码中的硬编码端口...
✅ 没有发现硬编码的 3001 端口

5️⃣ 测试 API 连接...
✅ API 响应状态: 200
✅ CORS 头: *
```

---

### 3. test_setting_api.sh
**功能**：测试后端设置 API 接口

**使用场景**：
- 验证后端 API 是否正常
- 检查配置接口返回数据
- 调试 API 问题

**使用方法**：
```bash
./scripts/test_setting_api.sh
```

**测试接口**：
- `/api/uied/setting/public` - 公开设置
- `/api/settings/permalink` - 固定链接配置
- `/api/settings/nav-menus` - 导航菜单
- `/api/site-info` - 站点信息

---

### 4. commercial-preflight-check.js
**功能**：商业版发布前健康检查（接口 + 菜单 + 资源 + 配置回读）

**使用场景**：
- 发布 Free/Pro/Enterprise 交付包前的统一验收
- 排查“后台可配置但前端不生效”问题
- 排查菜单权限点、默认资源、测试数据是否缺失

**使用方法**：
```bash
node scripts/commercial-preflight-check.js
```

**可选参数**：
```bash
node scripts/commercial-preflight-check.js \
  --base-url http://127.0.0.1:8002 \
  --mysql-container uied_mysql \
  --db-user uied \
  --db-pass uied123456 \
  --db-name uied_nav
```

**输出内容**：
- 终端报告（PASS/WARN/FAIL）
- JSON 报告：`docs/API/reports/commercial_preflight_latest.json`

---

### 5. commercial-release-check.sh
**功能**：商业版发布 SOP 一键检查入口（调用 preflight 脚本）

**使用方法**：
```bash
./scripts/commercial-release-check.sh
```

**说明**：
- 该脚本会执行 `scripts/commercial-preflight-check.js`
- 可透传参数，例如：

```bash
./scripts/commercial-release-check.sh --base-url http://127.0.0.1:8002
```

---

### 6. release-edition-package.sh
**功能**：版本化打包发布（Free/Pro/Enterprise）并生成交付目录模板

**使用场景**：
- 商业版发包前统一生成版本目录
- 生成标准交付结构（license/feature/config/sql/docs）
- 发布动作标准化，减少人工漏项

**使用方法**：
```bash
./scripts/release-edition-package.sh
```

**常用参数**：
```bash
./scripts/release-edition-package.sh \
  --editions free,pro,enterprise \
  --output /tmp/uied_release \
  --base-url http://127.0.0.1:8002
```

可选控制：
```bash
# 跳过发布前检查
./scripts/release-edition-package.sh --skip-preflight

# 允许发布前检查失败仍继续
./scripts/release-edition-package.sh --allow-preflight-fail
```

**输出结果**：
- 默认输出目录：`release/YYYYMMDD_HHMMSS/`
- 每个版本目录包含：
  - `README-交付说明.md`
  - `license/customer-license.json`
  - `feature/feature-overrides.json`
  - `config/app.env.example`
  - `meta/release-manifest.json`
  - `docs/API/*`（商业版关键文档）

---

## 🔧 脚本开发规范

### 文件命名
- 使用小写字母和连字符
- 扩展名：`.sh`
- 示例：`restart-frontend.sh`

### 脚本结构
```bash
#!/bin/bash

/**
 * @copyright Tomda (https://www.tomda.top)
 * @copyright UIED技术团队 (https://fsuied.com)
 * @author UIED技术团队
 * @createDate 2026.2.13
 */

# 脚本说明
echo "🚀 脚本名称"

# 主要逻辑
# ...

# 输出结果
echo "✅ 完成"
```

### 权限设置
所有脚本需要添加执行权限：
```bash
chmod +x scripts/*.sh
```

### 错误处理
- 使用 `set -e` 在错误时退出
- 提供清晰的错误信息
- 使用颜色区分成功/失败/警告

### 颜色定义
```bash
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'  # No Color

echo -e "${GREEN}✅ 成功${NC}"
echo -e "${RED}❌ 失败${NC}"
echo -e "${YELLOW}⚠️  警告${NC}"
```

---

## 📝 添加新脚本

如果需要添加新的脚本：

1. **创建脚本文件**
```bash
touch scripts/new-script.sh
chmod +x scripts/new-script.sh
```

2. **编写脚本内容**
```bash
#!/bin/bash

/**
 * @copyright Tomda (https://www.tomda.top)
 * @copyright UIED技术团队 (https://fsuied.com)
 * @author UIED技术团队
 * @createDate 2026.2.13
 */

echo "🚀 新脚本"
# 你的逻辑
```

3. **更新本文档**
在"脚本列表"中添加新脚本的说明

4. **测试脚本**
```bash
./scripts/new-script.sh
```

---

## 🐛 常见问题

### Q: 脚本执行提示 "Permission denied"
**A**: 需要添加执行权限
```bash
chmod +x scripts/your-script.sh
```

### Q: 脚本中的命令找不到
**A**: 检查命令是否安装，或使用绝对路径
```bash
# 使用 which 查找命令路径
which node
which npm
```

### Q: 脚本在不同系统上表现不一致
**A**: 
- 使用 `#!/bin/bash` 而不是 `#!/bin/sh`
- 避免使用特定系统的命令
- 添加系统检测逻辑

---

## 💡 最佳实践

1. **脚本要幂等**：多次执行结果一致
2. **提供清晰输出**：使用 emoji 和颜色
3. **错误要友好**：给出解决建议
4. **支持参数**：提供灵活性
5. **添加注释**：说明关键步骤

---

**更新日期**: 2026-02-13  
**维护者**: UIED技术团队
