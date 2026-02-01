#!/bin/bash

# UIED 导航网站 - 停止脚本
# 使用方法: ./stop.sh

echo "🛑 停止 UIED 服务..."

# 端口配置（与 start.sh 保持一致）
BACKEND_PORT=4000
ADMIN_PORT=5174
FRONTEND_PORT=3003

# 停止后端
lsof -ti:$BACKEND_PORT | xargs kill -9 2>/dev/null && echo "✅ 后端服务已停止" || echo "⚠️ 后端服务未运行"

# 停止管理后台
lsof -ti:$ADMIN_PORT | xargs kill -9 2>/dev/null && echo "✅ 管理后台已停止" || echo "⚠️ 管理后台未运行"

# 停止前端
lsof -ti:$FRONTEND_PORT | xargs kill -9 2>/dev/null && echo "✅ 前端网站已停止" || echo "⚠️ 前端网站未运行"

echo ""
echo "🎉 所有服务已停止"
