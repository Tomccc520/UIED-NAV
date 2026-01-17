#!/bin/bash

echo "🚀 UIED API 初始化脚本"
echo "======================="

# 安装依赖
echo "📦 安装依赖..."
npm install

# 生成 Prisma Client
echo "🔧 生成 Prisma Client..."
npm run prisma:generate

# 创建数据库迁移
echo "🗄️  创建数据库..."
npm run prisma:migrate

# 填充初始数据
echo "🌱 填充初始数据..."
npm run prisma:seed

echo ""
echo "✅ 初始化完成！"
echo ""
echo "启动开发服务器："
echo "  npm run dev"
echo ""
echo "访问管理后台："
echo "  http://localhost:3001/admin/admin.html"
echo ""
