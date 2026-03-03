#!/bin/bash
/**
 * @copyright Tomda (https://www.tomda.top)
 * @copyright UIED技术团队 (https://fsuied.com)
 * @author UIED技术团队
 * @createDate 2026.3.2
 */

# 三大功能快速部署脚本

echo "=========================================="
echo "三大功能快速部署"
echo "=========================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 项目根目录
PROJECT_ROOT="/Users/tangxiaoda/Desktop/网站备份/HAO UIED"

echo -e "${YELLOW}步骤1: 执行数据库迁移${NC}"
echo "----------------------------------------"
echo "请手动执行以下SQL文件："
echo "${PROJECT_ROOT}/server/database/migrations/add_auth_config_fields.sql"
echo ""
read -p "数据库迁移是否完成？(y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo -e "${RED}请先完成数据库迁移${NC}"
    exit 1
fi
echo -e "${GREEN}✓ 数据库迁移完成${NC}"
echo ""

echo -e "${YELLOW}步骤2: 检查后端文件${NC}"
echo "----------------------------------------"
files=(
    "server/server/app/service/uied/setting.js"
    "server/server/app/controller/uied/setting.js"
    "server/server/app/router/uied.js"
)

for file in "${files[@]}"; do
    if [ -f "${PROJECT_ROOT}/${file}" ]; then
        echo -e "${GREEN}✓${NC} ${file}"
    else
        echo -e "${RED}✗${NC} ${file} 不存在"
    fi
done
echo ""

echo -e "${YELLOW}步骤3: 检查管理后台文件${NC}"
echo "----------------------------------------"
admin_files=(
    "server/admin/src/views/settings/AuthConfig.vue"
    "server/admin/src/views/settings/DetailPageConfig.vue"
)

for file in "${admin_files[@]}"; do
    if [ -f "${PROJECT_ROOT}/${file}" ]; then
        echo -e "${GREEN}✓${NC} ${file}"
    else
        echo -e "${RED}✗${NC} ${file} 不存在"
    fi
done
echo ""

echo -e "${YELLOW}步骤4: 重启后端服务${NC}"
echo "----------------------------------------"
cd "${PROJECT_ROOT}/server/server"
echo "当前目录: $(pwd)"
echo ""
echo "请选择启动方式："
echo "1) npm run dev (开发模式)"
echo "2) pm2 restart uied-backend (生产模式)"
echo "3) 手动启动"
read -p "请选择 (1-3): " -n 1 -r
echo ""

case $REPLY in
    1)
        echo "启动开发模式..."
        npm run dev &
        echo -e "${GREEN}✓ 后端服务已启动（开发模式）${NC}"
        ;;
    2)
        echo "重启PM2服务..."
        pm2 restart uied-backend
        echo -e "${GREEN}✓ 后端服务已重启（生产模式）${NC}"
        ;;
    3)
        echo -e "${YELLOW}请手动启动后端服务${NC}"
        ;;
    *)
        echo -e "${RED}无效选择${NC}"
        ;;
esac
echo ""

echo -e "${YELLOW}步骤5: 配置管理后台菜单${NC}"
echo "----------------------------------------"
echo "请在管理后台添加以下菜单项："
echo ""
echo "1. 注册/登录配置"
echo "   - 路由: /settings/auth-config"
echo "   - 组件: @/views/settings/AuthConfig.vue"
echo "   - 图标: el-icon-setting"
echo ""
echo "2. 详情页配置"
echo "   - 路由: /settings/detail-page-config"
echo "   - 组件: @/views/settings/DetailPageConfig.vue"
echo "   - 图标: el-icon-setting"
echo ""
read -p "菜单配置是否完成？(y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]
then
    echo -e "${GREEN}✓ 菜单配置完成${NC}"
else
    echo -e "${YELLOW}! 请稍后完成菜单配置${NC}"
fi
echo ""

echo -e "${YELLOW}步骤6: 运行API测试${NC}"
echo "----------------------------------------"
read -p "是否运行API测试？(y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]
then
    bash "${PROJECT_ROOT}/scripts/test-three-features.sh"
else
    echo -e "${YELLOW}跳过API测试${NC}"
fi
echo ""

echo "=========================================="
echo -e "${GREEN}部署完成！${NC}"
echo "=========================================="
echo ""
echo "访问地址："
echo "- 管理后台: http://localhost:8001"
echo "- 注册/登录配置: http://localhost:8001/#/settings/auth-config"
echo "- 详情页配置: http://localhost:8001/#/settings/detail-page-config"
echo ""
echo "下一步："
echo "1. 访问管理后台验证功能"
echo "2. 测试注册/登录开关"
echo "3. 测试分享渠道配置"
echo "4. 测试侧边栏模块配置"
echo "5. 前端集成三大功能"
echo ""

