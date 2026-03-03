#!/bin/bash
/**
 * @copyright Tomda (https://www.tomda.top)
 * @copyright UIED技术团队 (https://fsuied.com)
 * @author UIED技术团队
 * @createDate 2026.3.1
 */

# 搜索功能API测试脚本

BASE_URL="http://localhost:8002"

echo "=========================================="
echo "搜索功能 API 测试"
echo "=========================================="
echo ""

# 测试1: 全站搜索
echo "【测试1】全站搜索 - 关键词: 设计"
echo "----------------------------------------"
curl -s "${BASE_URL}/api/search?keyword=设计&page=1&pageSize=5" | jq '.'
echo ""
echo ""

# 测试2: 搜索建议
echo "【测试2】搜索建议 - 关键词: UI"
echo "----------------------------------------"
curl -s "${BASE_URL}/api/search/suggestions?keyword=UI" | jq '.'
echo ""
echo ""

# 测试3: 热门搜索
echo "【测试3】热门搜索"
echo "----------------------------------------"
curl -s "${BASE_URL}/api/search/hot" | jq '.'
echo ""
echo ""

# 测试4: 高级搜索
echo "【测试4】高级搜索 - 按热度排序"
echo "----------------------------------------"
curl -s -X POST "${BASE_URL}/api/search/advanced" \
  -H "Content-Type: application/json" \
  -d '{
    "keyword": "工具",
    "sortBy": "hot",
    "page": 1,
    "pageSize": 5
  }' | jq '.'
echo ""
echo ""

# 测试5: 空关键词搜索
echo "【测试5】空关键词搜索（应返回提示）"
echo "----------------------------------------"
curl -s "${BASE_URL}/api/search?keyword=&page=1&pageSize=5" | jq '.'
echo ""
echo ""

# 测试6: 分类筛选搜索
echo "【测试6】分类筛选搜索"
echo "----------------------------------------"
curl -s -X POST "${BASE_URL}/api/search/advanced" \
  -H "Content-Type: application/json" \
  -d '{
    "keyword": "设计",
    "categoryId": 1,
    "page": 1,
    "pageSize": 5
  }' | jq '.'
echo ""
echo ""

echo "=========================================="
echo "测试完成！"
echo "=========================================="

