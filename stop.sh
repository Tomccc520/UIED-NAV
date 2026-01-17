#!/bin/bash

# UIED 导航网站 - 停止脚本
# 使用方法: ./stop.sh

echo "🛑 停止 UIED 服务..."

# 停止后端 (端口 3001)
lsof -ti:3001 | xargs kill -9 2>/dev/null && echo "✅ 后端服务已停止" || echo "⚠️ 后端服务未运行"

# 停止管理后台 (端口 5173)
lsof -ti:5173 | xargs kill -9 2>/dev/null && echo "✅ 管理后台已停止" || echo "⚠️ 管理后台未运行"

# 停止前端 (端口 3000)
lsof -ti:3000 | xargs kill -9 2>/dev/null && echo "✅ 前端网站已停止" || echo "⚠️ 前端网站未运行"

echo ""
echo "🎉 所有服务已停止"
