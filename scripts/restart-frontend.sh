#!/bin/bash

/**
 * @copyright Tomda (https://www.tomda.top)
 * @copyright UIED技术团队 (https://fsuied.com)
 * @author UIED技术团队
 * @createDate 2026.1.27
 */

# 重启前端服务
echo "🔄 重启前端服务..."

# 停止前端
echo "🛑 停止前端..."
lsof -ti:3003 | xargs kill -9 2>/dev/null
sleep 2

# 启动前端
echo "🚀 启动前端..."
cd "/Users/tangxiaoda/Desktop/网站备份/HAO UIED/frontend"
PORT=3003 npm start &

echo "✅ 前端已重启在 http://localhost:3003"

