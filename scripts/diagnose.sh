#!/bin/bash

/**
 * @copyright Tomda (https://www.tomda.top)
 * @copyright UIED技术团队 (https://fsuied.com)
 * @author UIED技术团队
 * @createDate 2026.2.13
 */

echo "🔍 CORS 和详情页问题诊断脚本"
echo "================================"
echo ""

# 1. 检查后端是否运行
echo "1️⃣ 检查后端服务..."
if lsof -i :8002 > /dev/null 2>&1; then
    echo "✅ 后端正在运行 (端口 8002)"
else
    echo "❌ 后端未运行！请先启动后端"
    exit 1
fi

# 2. 检查前端是否运行
echo ""
echo "2️⃣ 检查前端服务..."
if lsof -i :3003 > /dev/null 2>&1; then
    echo "✅ 前端正在运行 (端口 3003)"
else
    echo "❌ 前端未运行！请先启动前端"
    exit 1
fi

# 3. 检查环境变量文件
echo ""
echo "3️⃣ 检查环境变量配置..."
if [ -f "frontend/.env.development" ]; then
    echo "📄 .env.development 内容:"
    cat frontend/.env.development | grep -v "^#" | grep -v "^$"
else
    echo "⚠️  .env.development 不存在"
fi

if [ -f "frontend/.env.local" ]; then
    echo "📄 .env.local 内容:"
    cat frontend/.env.local | grep -v "^#" | grep -v "^$"
else
    echo "⚠️  .env.local 不存在"
fi

# 4. 检查代码中的硬编码端口
echo ""
echo "4️⃣ 检查代码中的硬编码端口..."
HARDCODED=$(grep -r "localhost:3001" frontend/src --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l)
if [ "$HARDCODED" -eq 0 ]; then
    echo "✅ 没有发现硬编码的 3001 端口"
else
    echo "❌ 发现 $HARDCODED 处硬编码的 3001 端口:"
    grep -r "localhost:3001" frontend/src --include="*.ts" --include="*.tsx" 2>/dev/null
fi

# 5. 测试 API 连接
echo ""
echo "5️⃣ 测试 API 连接..."
echo "测试: http://localhost:8002/api/site-info"

# 使用 node 测试（避免权限问题）
node -e "
const http = require('http');
http.get('http://localhost:8002/api/site-info', (res) => {
  console.log('✅ API 响应状态:', res.statusCode);
  console.log('✅ CORS 头:', res.headers['access-control-allow-origin'] || '未设置');
}).on('error', (e) => {
  console.error('❌ API 连接失败:', e.message);
});
" 2>&1

# 6. 给出修复建议
echo ""
echo "================================"
echo "📋 修复建议:"
echo ""
echo "1. 修改 frontend/.env.development 文件:"
echo "   REACT_APP_API_URL=http://localhost:8002/api"
echo ""
echo "2. 重启前端服务:"
echo "   lsof -ti:3003 | xargs kill -9"
echo "   cd frontend && PORT=3003 npm start"
echo ""
echo "3. 清除浏览器缓存:"
echo "   - 打开 http://localhost:3003"
echo "   - 按 F12 打开开发者工具"
echo "   - 右键刷新按钮 -> 清空缓存并硬性重新加载"
echo ""
echo "4. 验证修复:"
echo "   - 打开浏览器控制台 (F12)"
echo "   - 查看 Network 标签，API 请求应该是 localhost:8002"
echo "   - 点击网站卡片，控制台应该输出:"
echo "     [handleWebsiteClick] 网站: xxx | 点击模式: detail"
echo "   - 应该跳转到详情页 /website/xxx"
echo ""

