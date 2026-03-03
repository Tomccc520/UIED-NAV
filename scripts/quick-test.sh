#!/bin/bash

/**
 * @copyright Tomda (https://www.tomda.top)
 * @copyright UIED技术团队 (https://fsuied.com)
 * @author UIED技术团队
 * @createDate 2026.3.1
 * 
 * 个人中心快速测试工具
 * 用法: ./quick-test.sh
 */

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

clear

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   个人中心快速测试工具 v1.0          ║${NC}"
echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo ""

# 检查服务状态
echo -e "${CYAN}📊 检查服务状态...${NC}"
echo ""

# 检查前端
if lsof -ti:3003 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ 前端服务${NC} http://localhost:3003 ${GREEN}运行中${NC}"
else
    echo -e "${RED}✗ 前端服务${NC} http://localhost:3003 ${RED}未启动${NC}"
fi

# 检查后端
if lsof -ti:8002 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ 后端服务${NC} http://localhost:8002 ${GREEN}运行中${NC}"
else
    echo -e "${RED}✗ 后端服务${NC} http://localhost:8002 ${RED}未启动${NC}"
fi

echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# 主菜单
while true; do
    echo -e "${YELLOW}请选择测试选项:${NC}"
    echo ""
    echo -e "  ${PURPLE}1)${NC} 🌐 打开个人中心页面"
    echo -e "  ${PURPLE}2)${NC} 🔑 获取登录Token"
    echo -e "  ${PURPLE}3)${NC} 🧪 测试用户信息API"
    echo -e "  ${PURPLE}4)${NC} 📊 测试统计数据API"
    echo -e "  ${PURPLE}5)${NC} ⭐ 测试收藏列表API"
    echo -e "  ${PURPLE}6)${NC} 👍 测试点赞列表API"
    echo -e "  ${PURPLE}7)${NC} 💬 测试评论列表API"
    echo -e "  ${PURPLE}8)${NC} 📧 测试消息列表API"
    echo -e "  ${PURPLE}9)${NC} 🚀 运行完整API测试"
    echo -e "  ${PURPLE}10)${NC} 📝 查看测试文档"
    echo -e "  ${PURPLE}0)${NC} 退出"
    echo ""
    echo -ne "${CYAN}请输入选项 [0-10]: ${NC}"
    read choice
    echo ""

    case $choice in
        1)
            echo -e "${GREEN}正在打开个人中心页面...${NC}"
            open http://localhost:3003/profile
            echo ""
            echo -e "${YELLOW}提示:${NC}"
            echo "  1. 如果未登录，会自动跳转到首页"
            echo "  2. 登录后可以访问个人中心"
            echo "  3. 按 Cmd+Option+J 打开浏览器控制台"
            echo ""
            ;;
        2)
            echo -e "${CYAN}获取Token的方法:${NC}"
            echo ""
            echo -e "${YELLOW}方法1: 从浏览器控制台获取${NC}"
            echo "  1. 打开 http://localhost:3003"
            echo "  2. 登录账号"
            echo "  3. 按 Cmd+Option+J 打开控制台"
            echo "  4. 执行: localStorage.getItem('token')"
            echo ""
            echo -e "${YELLOW}方法2: 通过API登录获取${NC}"
            echo "  请输入用户名和密码进行登录"
            echo ""
            echo -ne "  用户名: "
            read username
            echo -ne "  密码: "
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
                echo -e "${YELLOW}Token:${NC}"
                echo "$token"
                echo ""
                echo -e "${CYAN}Token已保存到 /tmp/profile_test_token${NC}"
                echo "$token" > /tmp/profile_test_token
            else
                echo -e "${RED}✗ 登录失败${NC}"
                echo ""
                echo "响应内容:"
                echo "$response" | head -5
            fi
            echo ""
            ;;
        3)
            if [ -f /tmp/profile_test_token ]; then
                token=$(cat /tmp/profile_test_token)
            else
                echo -ne "${YELLOW}请输入Token: ${NC}"
                read token
            fi
            
            echo -e "${CYAN}正在测试用户信息API...${NC}"
            echo ""
            
            response=$(curl -s -X GET http://localhost:8002/api/user/profile \
                -H "token: $token")
            
            echo "$response" | python3 -m json.tool 2>/dev/null || echo "$response"
            echo ""
            ;;
        4)
            if [ -f /tmp/profile_test_token ]; then
                token=$(cat /tmp/profile_test_token)
            else
                echo -ne "${YELLOW}请输入Token: ${NC}"
                read token
            fi
            
            echo -e "${CYAN}正在测试统计数据API...${NC}"
            echo ""
            
            response=$(curl -s -X POST http://localhost:8002/api/user/index/stats \
                -H "token: $token" \
                -H "Content-Type: application/json")
            
            echo "$response" | python3 -m json.tool 2>/dev/null || echo "$response"
            echo ""
            ;;
        5)
            if [ -f /tmp/profile_test_token ]; then
                token=$(cat /tmp/profile_test_token)
            else
                echo -ne "${YELLOW}请输入Token: ${NC}"
                read token
            fi
            
            echo -e "${CYAN}正在测试收藏列表API...${NC}"
            echo ""
            
            response=$(curl -s -X POST http://localhost:8002/api/user/website/favorite/list \
                -H "token: $token" \
                -H "Content-Type: application/json" \
                -d '{"pageNo":1,"pageSize":10}')
            
            echo "$response" | python3 -m json.tool 2>/dev/null || echo "$response"
            echo ""
            ;;
        6)
            if [ -f /tmp/profile_test_token ]; then
                token=$(cat /tmp/profile_test_token)
            else
                echo -ne "${YELLOW}请输入Token: ${NC}"
                read token
            fi
            
            echo -e "${CYAN}正在测试点赞列表API...${NC}"
            echo ""
            
            response=$(curl -s -X POST http://localhost:8002/api/user/website/like/list \
                -H "token: $token" \
                -H "Content-Type: application/json" \
                -d '{"pageNo":1,"pageSize":10}')
            
            echo "$response" | python3 -m json.tool 2>/dev/null || echo "$response"
            echo ""
            ;;
        7)
            if [ -f /tmp/profile_test_token ]; then
                token=$(cat /tmp/profile_test_token)
            else
                echo -ne "${YELLOW}请输入Token: ${NC}"
                read token
            fi
            
            echo -e "${CYAN}正在测试评论列表API...${NC}"
            echo ""
            
            response=$(curl -s -X POST http://localhost:8002/api/user/article/comment/list \
                -H "token: $token" \
                -H "Content-Type: application/json" \
                -d '{"pageNo":1,"pageSize":10}')
            
            echo "$response" | python3 -m json.tool 2>/dev/null || echo "$response"
            echo ""
            ;;
        8)
            if [ -f /tmp/profile_test_token ]; then
                token=$(cat /tmp/profile_test_token)
            else
                echo -ne "${YELLOW}请输入Token: ${NC}"
                read token
            fi
            
            echo -e "${CYAN}正在测试消息列表API...${NC}"
            echo ""
            
            response=$(curl -s -X POST http://localhost:8002/api/user/message/list \
                -H "token: $token" \
                -H "Content-Type: application/json" \
                -d '{"pageNo":1,"pageSize":10}')
            
            echo "$response" | python3 -m json.tool 2>/dev/null || echo "$response"
            echo ""
            ;;
        9)
            if [ -f /tmp/profile_test_token ]; then
                token=$(cat /tmp/profile_test_token)
            else
                echo -ne "${YELLOW}请输入Token: ${NC}"
                read token
            fi
            
            echo -e "${CYAN}正在运行完整API测试...${NC}"
            echo ""
            
            if [ -f "./scripts/test-profile-api.sh" ]; then
                bash ./scripts/test-profile-api.sh http://localhost:8002 "$token"
            else
                echo -e "${RED}✗ 测试脚本不存在: ./scripts/test-profile-api.sh${NC}"
            fi
            echo ""
            ;;
        10)
            echo -e "${CYAN}📚 测试文档列表:${NC}"
            echo ""
            echo "  1. 个人中心测试任务清单"
            echo "     docs/个人中心测试任务清单-20260301.md"
            echo ""
            echo "  2. 个人中心前端检查清单"
            echo "     docs/个人中心前端检查清单.md"
            echo ""
            echo "  3. 个人中心API端点对照表"
            echo "     docs/个人中心API端点对照表.md"
            echo ""
            echo "  4. 个人中心开发快速参考"
            echo "     docs/个人中心开发快速参考.md"
            echo ""
            echo -ne "${YELLOW}是否打开文档目录? (y/n): ${NC}"
            read open_docs
            if [ "$open_docs" = "y" ] || [ "$open_docs" = "Y" ]; then
                open docs/
            fi
            echo ""
            ;;
        0)
            echo -e "${GREEN}感谢使用！再见 👋${NC}"
            echo ""
            exit 0
            ;;
        *)
            echo -e "${RED}无效选项，请重新选择${NC}"
            echo ""
            ;;
    esac
    
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
done

