#!/bin/bash

/**
 * @copyright Tomda (https://www.tomda.top)
 * @copyright UIED技术团队 (https://fsuied.com)
 * @author UIED技术团队
 * @createDate 2026.3.1
 */

# 个人中心API测试脚本
# 用法: ./test-profile-api.sh [API_BASE_URL] [TOKEN]

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 默认配置
API_BASE_URL=${1:-"http://localhost:8002"}
TOKEN=${2:-""}

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  个人中心 API 测试工具${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${YELLOW}API地址:${NC} $API_BASE_URL"
echo -e "${YELLOW}Token:${NC} ${TOKEN:0:20}..."
echo ""

# 测试计数器
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# 测试函数
test_api() {
    local name=$1
    local method=$2
    local endpoint=$3
    local data=$4
    local need_auth=$5
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    echo -e "${BLUE}[测试 $TOTAL_TESTS]${NC} $name"
    echo -e "  ${YELLOW}→${NC} $method $endpoint"
    
    # 构建curl命令
    local curl_cmd="curl -s -w '\n%{http_code}' -X $method"
    curl_cmd="$curl_cmd '$API_BASE_URL$endpoint'"
    curl_cmd="$curl_cmd -H 'Content-Type: application/json'"
    
    if [ "$need_auth" = "true" ] && [ -n "$TOKEN" ]; then
        curl_cmd="$curl_cmd -H 'token: $TOKEN'"
    fi
    
    if [ -n "$data" ]; then
        curl_cmd="$curl_cmd -d '$data'"
    fi
    
    # 执行请求
    local response=$(eval $curl_cmd)
    local http_code=$(echo "$response" | tail -n1)
    local body=$(echo "$response" | sed '$d')
    
    # 判断结果
    if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
        echo -e "  ${GREEN}✓ 成功${NC} (HTTP $http_code)"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        
        # 显示响应摘要
        local code=$(echo "$body" | grep -o '"code":[0-9]*' | head -1 | cut -d':' -f2)
        local msg=$(echo "$body" | grep -o '"msg":"[^"]*"' | head -1 | cut -d'"' -f4)
        if [ -n "$code" ]; then
            echo -e "  ${YELLOW}  响应码:${NC} $code"
        fi
        if [ -n "$msg" ]; then
            echo -e "  ${YELLOW}  消息:${NC} $msg"
        fi
    else
        echo -e "  ${RED}✗ 失败${NC} (HTTP $http_code)"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        echo -e "  ${RED}  响应:${NC} ${body:0:100}..."
    fi
    
    echo ""
}

# ==================== 开始测试 ====================

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  1. 认证相关测试${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 如果没有提供TOKEN，先测试登录
if [ -z "$TOKEN" ]; then
    echo -e "${YELLOW}未提供Token，尝试使用测试账号登录...${NC}"
    echo ""
    
    # 测试注册（可能失败，因为用户可能已存在）
    test_api "用户注册" "POST" "/api/user/register" \
        '{"username":"testuser_'$(date +%s)'","password":"Test123456","nickname":"测试用户"}' \
        "false"
    
    # 测试登录
    echo -e "${YELLOW}请手动登录并提供Token，或使用已有账号:${NC}"
    echo -e "${YELLOW}用法: ./test-profile-api.sh http://localhost:8002 YOUR_TOKEN${NC}"
    echo ""
    exit 0
fi

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  2. 用户信息测试${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

test_api "获取用户信息" "GET" "/api/user/profile" "" "true"

test_api "获取用户统计" "POST" "/api/user/index/stats" "" "true"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  3. 收藏/点赞测试${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

test_api "获取收藏网站列表" "POST" "/api/user/website/favorite/list" \
    '{"pageNo":1,"pageSize":10}' "true"

test_api "获取点赞网站列表" "POST" "/api/user/website/like/list" \
    '{"pageNo":1,"pageSize":10}' "true"

test_api "获取收藏文章列表" "POST" "/api/user/article/collect/list" \
    '{"pageNo":1,"pageSize":10}' "true"

test_api "获取点赞文章列表" "POST" "/api/user/article/like/list" \
    '{"pageNo":1,"pageSize":10}' "true"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  4. 评论管理测试${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

test_api "获取文章评论列表" "POST" "/api/user/article/comment/list" \
    '{"pageNo":1,"pageSize":10}' "true"

test_api "获取网站评论列表" "POST" "/api/user/website/comment/list" \
    '{"pageNo":1,"pageSize":10}' "true"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  5. 消息中心测试${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

test_api "获取消息列表" "POST" "/api/user/message/list" \
    '{"pageNo":1,"pageSize":10}' "true"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  6. 订单管理测试${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

test_api "获取订单列表" "POST" "/api/user/order/list" \
    '{"pageNo":1,"pageSize":10}' "true"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  7. 授权管理测试${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

test_api "获取授权列表" "POST" "/api/user/license/list" \
    '{"pageNo":1,"pageSize":10}' "true"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  8. 安全设置测试${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

test_api "获取2FA状态" "POST" "/api/user/security/2fa/status" "" "true"

test_api "获取登录设备列表" "POST" "/api/user/session/list" "" "true"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  9. 登录日志测试${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

test_api "获取登录日志" "POST" "/api/user/login/log" \
    '{"pageNo":1,"pageSize":10}' "true"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  10. 作者中心测试${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

test_api "获取作者中心详情" "POST" "/api/user/author/center/detail" "" "true"

# ==================== 测试总结 ====================

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  测试总结${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${YELLOW}总测试数:${NC} $TOTAL_TESTS"
echo -e "${GREEN}通过:${NC} $PASSED_TESTS"
echo -e "${RED}失败:${NC} $FAILED_TESTS"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}✓ 所有测试通过！${NC}"
    exit 0
else
    echo -e "${RED}✗ 部分测试失败，请检查日志${NC}"
    exit 1
fi

