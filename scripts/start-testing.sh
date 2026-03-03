#!/bin/bash
# 个人中心测试 - 一键启动
# 作者: UIED技术团队
# 日期: 2026.3.1

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m'

clear
echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   个人中心测试 - 一键启动 v1.0       ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# 步骤1: 打开个人中心页面
echo -e "${CYAN}步骤 1/4: 打开个人中心页面...${NC}"
open http://localhost:3003/profile
sleep 2
echo -e "${GREEN}✓ 已打开浏览器${NC}"
echo ""

# 步骤2: 打开测试记录表
echo -e "${CYAN}步骤 2/4: 打开测试记录表...${NC}"
open "docs/个人中心测试实时记录-20260301.md"
sleep 1
echo -e "${GREEN}✓ 已打开测试记录表${NC}"
echo ""

# 步骤3: 显示获取Token的方法
echo -e "${CYAN}步骤 3/4: 获取登录Token${NC}"
echo ""
echo -e "${YELLOW}方法1: 从浏览器控制台获取 (推荐)${NC}"
echo "  1. 在浏览器中登录账号"
echo "  2. 按 Cmd+Option+J 打开控制台"
echo "  3. 执行: localStorage.getItem('token')"
echo "  4. 复制Token"
echo ""
echo -e "${YELLOW}方法2: 通过API登录获取${NC}"
echo -ne "  是否需要通过API登录? (y/n): "
read use_api_login

if [ "$use_api_login" = "y" ] || [ "$use_api_login" = "Y" ]; then
    echo ""
    echo -ne "  请输入用户名: "
    read username
    echo -ne "  请输入密码: "
    read -s password
    echo ""
    echo ""
    echo -e "${CYAN}正在登录...${NC}"
    
    response=$(curl -s -X POST http://localhost:8002/api/user/login \
        -H "Content-Type: application/json" \
        -d "{\"username\":\"$username\",\"password\":\"$password\"}")
    
    token=$(echo "$response" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    
    if [ -n "$token" ]; then
        echo -e "${GREEN}✓ 登录成功！${NC}"
        echo ""
        echo -e "${YELLOW}您的Token:${NC}"
        echo "$token"
        echo ""
        echo "$token" > /tmp/profile_test_token
        echo -e "${CYAN}Token已保存到 /tmp/profile_test_token${NC}"
    else
        echo -e "${RED}✗ 登录失败${NC}"
        echo "响应: $response"
    fi
else
    echo ""
    echo -e "${CYAN}请从浏览器控制台获取Token${NC}"
fi
echo ""

# 步骤4: 询问是否运行API测试
echo -e "${CYAN}步骤 4/4: 运行API测试${NC}"
echo ""
echo -ne "是否立即运行完整API测试? (y/n): "
read run_test

if [ "$run_test" = "y" ] || [ "$run_test" = "Y" ]; then
    echo ""
    
    if [ -f /tmp/profile_test_token ]; then
        token=$(cat /tmp/profile_test_token)
        echo -e "${CYAN}使用已保存的Token${NC}"
    else
        echo -ne "请输入Token: "
        read token
    fi
    
    echo ""
    echo -e "${CYAN}正在运行API测试...${NC}"
    echo ""
    
    bash scripts/test-profile-api.sh http://localhost:8002 "$token"
else
    echo ""
    echo -e "${YELLOW}跳过API测试${NC}"
    echo ""
    echo -e "${CYAN}你可以稍后手动运行:${NC}"
    echo "  bash scripts/test-profile-api.sh http://localhost:8002 YOUR_TOKEN"
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${GREEN}✓ 测试环境已准备就绪！${NC}"
echo ""
echo -e "${YELLOW}下一步:${NC}"
echo "  1. 在浏览器中测试各个功能模块"
echo "  2. 在测试记录表中记录测试结果"
echo "  3. 记录发现的问题"
echo ""
echo -e "${CYAN}快速测试工具:${NC}"
echo "  bash scripts/quick-test.sh"
echo ""
echo -e "${GREEN}祝测试顺利！ 🎉${NC}"
echo ""
