#!/bin/bash

# UIED 导航网站 - 一键启动脚本 (likeadmin 架构)
# 使用方法: ./start.sh
# 
# 架构: Egg.js (likeadmin) + MySQL + Vue 3 + React
# 更新日期: 2026-02-04

echo "🚀 UIED 导航网站启动中..."
echo ""

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 端口配置
MYSQL_PORT=3308
BACKEND_PORT=8002
ADMIN_PORT=5173
FRONTEND_PORT=3003

# 检查 node 是否安装
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js 未安装，请先安装 Node.js 16+${NC}"
    exit 1
fi

# 检查 docker 是否安装
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker 未安装，请先安装 Docker${NC}"
    exit 1
fi

# 先停止可能存在的旧进程
echo "🛑 清理旧进程..."
lsof -ti:$BACKEND_PORT | xargs kill -9 2>/dev/null
lsof -ti:$ADMIN_PORT | xargs kill -9 2>/dev/null
lsof -ti:$FRONTEND_PORT | xargs kill -9 2>/dev/null
sleep 1

# 启动 MySQL
echo -e "${YELLOW}🗄️  启动 MySQL 数据库...${NC}"
docker-compose -f "$SCRIPT_DIR/docker/docker-compose.mysql.yml" up -d
sleep 3

# 检查 MySQL 是否启动
if ! docker ps | grep -q uied_mysql; then
    echo -e "${RED}❌ MySQL 启动失败${NC}"
    exit 1
fi
echo -e "${GREEN}✅ MySQL 已启动 (端口 $MYSQL_PORT)${NC}"

# 检查依赖是否安装
check_deps() {
    local dir=$1
    if [ ! -d "$SCRIPT_DIR/$dir/node_modules" ]; then
        echo -e "${YELLOW}📦 安装 $dir 依赖...${NC}"
        (cd "$SCRIPT_DIR/$dir" && npm install)
    fi
}

# 安装依赖
check_deps "server/server"
check_deps "server/admin"
check_deps "frontend"

echo ""
echo -e "${GREEN}✅ 依赖检查完成${NC}"
echo ""

# 启动后端 (Egg.js)
echo -e "${YELLOW}🔧 启动后端服务 (Egg.js)...${NC}"
(cd "$SCRIPT_DIR/server/server" && npm run dev) &
sleep 5

# 启动管理后台 (Vue 3)
echo -e "${YELLOW}🎨 启动管理后台 (Vue 3)...${NC}"
(cd "$SCRIPT_DIR/server/admin" && npm run dev) &
sleep 3

# 启动前端 (React)
echo -e "${YELLOW}🌐 启动前端网站 (React)...${NC}"
(cd "$SCRIPT_DIR/frontend" && PORT=$FRONTEND_PORT npm start) &

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ 所有服务已启动！${NC}"
echo ""
echo -e "🗄️  MySQL:       ${YELLOW}localhost:$MYSQL_PORT${NC}"
echo -e "📡 后端 API:    ${YELLOW}http://localhost:$BACKEND_PORT${NC}"
echo -e "🎨 管理后台:    ${YELLOW}http://localhost:$ADMIN_PORT${NC}"
echo -e "🌐 前端网站:    ${YELLOW}http://localhost:$FRONTEND_PORT${NC}"
echo ""
echo -e "管理员账号: ${YELLOW}admin / 123456${NC}"
echo -e "⚠️  首次登录请立即修改密码"
echo ""
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "按 ${RED}Ctrl+C${NC} 停止所有服务"

# 捕获 Ctrl+C 信号，停止所有服务
trap 'echo ""; echo "🛑 停止所有服务..."; lsof -ti:$BACKEND_PORT | xargs kill -9 2>/dev/null; lsof -ti:$ADMIN_PORT | xargs kill -9 2>/dev/null; lsof -ti:$FRONTEND_PORT | xargs kill -9 2>/dev/null; echo "✅ 已停止 (MySQL 保持运行)"; exit 0' INT

# 等待
wait
