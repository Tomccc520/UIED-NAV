#!/bin/bash

# UIED 导航网站 - 一键启动脚本
# 使用方法: ./start.sh

echo "🚀 UIED 导航网站启动中..."
echo ""

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 检查 node 是否安装
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js 未安装，请先安装 Node.js${NC}"
    exit 1
fi

# 先停止可能存在的旧进程
echo "🛑 清理旧进程..."
lsof -ti:3001 | xargs kill -9 2>/dev/null
lsof -ti:5173 | xargs kill -9 2>/dev/null
lsof -ti:3000 | xargs kill -9 2>/dev/null
sleep 1

# 检查依赖是否安装
check_deps() {
    local dir=$1
    if [ ! -d "$SCRIPT_DIR/$dir/node_modules" ]; then
        echo -e "${YELLOW}📦 安装 $dir 依赖...${NC}"
        (cd "$SCRIPT_DIR/$dir" && npm install)
    fi
}

# 安装依赖
check_deps "backend"
check_deps "admin"
check_deps "frontend"

echo ""
echo -e "${GREEN}✅ 依赖检查完成${NC}"
echo ""

# 启动后端
echo -e "${YELLOW}🔧 启动后端服务...${NC}"
(cd "$SCRIPT_DIR/backend" && npm run dev) &
sleep 3

# 启动管理后台
echo -e "${YELLOW}🎨 启动管理后台...${NC}"
(cd "$SCRIPT_DIR/admin" && npm run dev) &
sleep 2

# 启动前端
echo -e "${YELLOW}🌐 启动前端网站...${NC}"
(cd "$SCRIPT_DIR/frontend" && npm start) &

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ 所有服务已启动！${NC}"
echo ""
echo -e "📡 后端 API:    ${YELLOW}http://localhost:3001${NC}"
echo -e "🎨 管理后台:    ${YELLOW}http://localhost:5173${NC}"
echo -e "🌐 前端网站:    ${YELLOW}http://localhost:3000${NC}"
echo ""
echo -e "管理员账号: ${YELLOW}admin${NC}"
echo -e "⚠️  首次登录请立即修改密码"
echo ""
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "按 ${RED}Ctrl+C${NC} 停止所有服务"

# 捕获 Ctrl+C 信号，停止所有服务
trap 'echo ""; echo "🛑 停止所有服务..."; lsof -ti:3001 | xargs kill -9 2>/dev/null; lsof -ti:5173 | xargs kill -9 2>/dev/null; lsof -ti:3000 | xargs kill -9 2>/dev/null; echo "✅ 已停止"; exit 0' INT

# 等待
wait
