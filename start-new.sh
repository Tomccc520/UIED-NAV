#!/bin/bash
# UIED 导航系统 - 新架构启动脚本
# likeadmin (Egg.js + MySQL + Vue 3)

echo "🚀 启动 UIED 导航系统 (likeadmin 架构)"
echo "=================================="

# 启动 MySQL
echo "📦 启动 MySQL 数据库..."
docker-compose -f docker/docker-compose.mysql.yml up -d

# 等待 MySQL 就绪
echo "⏳ 等待 MySQL 就绪..."
sleep 5

# 启动后端 (Egg.js)
echo "🔧 启动后端服务 (Egg.js - 端口 8002)..."
cd server/server && npm run dev &
BACKEND_PID=$!

# 等待后端启动
sleep 3

# 启动管理后台 (Vue 3)
echo "🎨 启动管理后台 (Vue 3 - 端口 5174)..."
cd ../admin && npm run dev &
ADMIN_PID=$!

# 启动用户前端 (React)
echo "🌐 启动用户前端 (React - 端口 3003)..."
cd ../../frontend && npm start &
FRONTEND_PID=$!

echo ""
echo "=================================="
echo "✅ 所有服务已启动!"
echo ""
echo "📍 访问地址:"
echo "   - 用户前端: http://localhost:3003"
echo "   - 管理后台: http://localhost:5174"
echo "   - 后端 API: http://localhost:8002"
echo "   - MySQL:    localhost:3308"
echo ""
echo "🔑 管理后台默认账号: admin / 123456"
echo ""
echo "按 Ctrl+C 停止所有服务"

# 等待所有进程
wait
