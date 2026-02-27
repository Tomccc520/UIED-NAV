#!/bin/bash

# 测试站点设置 API 是否正常工作
# 使用方法: ./test_setting_api.sh

echo "🧪 测试站点设置 API"
echo "===================="
echo ""

# 后端 API 地址
API_URL="http://localhost:8002"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 测试函数
test_api() {
    local endpoint=$1
    local description=$2
    
    echo -n "测试: $description ... "
    
    response=$(curl -s -w "\n%{http_code}" "$API_URL$endpoint")
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" = "200" ]; then
        echo -e "${GREEN}✓ 成功${NC}"
        echo "  响应: $(echo $body | jq -r '.message // .code // "OK"' 2>/dev/null || echo $body | head -c 100)"
        return 0
    else
        echo -e "${RED}✗ 失败 (HTTP $http_code)${NC}"
        echo "  响应: $body"
        return 1
    fi
}

# 检查后端是否运行
echo "1️⃣ 检查后端服务..."
if curl -s "$API_URL" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ 后端服务正在运行${NC}"
else
    echo -e "${RED}✗ 后端服务未运行${NC}"
    echo "请先启动后端服务: cd server/server && npm run dev"
    exit 1
fi
echo ""

# 测试公开设置 API
echo "2️⃣ 测试公开设置 API..."
test_api "/api/uied/setting/public" "获取所有公开设置"
echo ""

# 测试站点信息 API
echo "3️⃣ 测试站点信息 API..."
test_api "/api/uied/setting/siteInfo" "获取站点信息"
echo ""

# 测试单个配置 API
echo "4️⃣ 测试单个配置 API..."
test_api "/api/uied/setting/get?key=appearanceConfig" "获取外观配置"
test_api "/api/uied/setting/get?key=homepageConfig" "获取首页配置"
test_api "/api/uied/setting/get?key=pageGlobalConfig" "获取页面配置"
echo ""

# 显示详细数据
echo "5️⃣ 查看公开设置详细数据..."
echo "===================="
curl -s "$API_URL/api/uied/setting/public" | jq '.' 2>/dev/null || curl -s "$API_URL/api/uied/setting/public"
echo ""
echo "===================="
echo ""

echo "✅ 测试完成！"
echo ""
echo "💡 提示:"
echo "  - 如果所有测试都通过，说明后端 API 正常"
echo "  - 如果测试失败，请检查后端服务是否正常运行"
echo "  - 前端需要在组件中使用 Hooks 才能应用这些配置"
echo ""
echo "📚 查看实施指南: docs/前端对接实施指南.md"

