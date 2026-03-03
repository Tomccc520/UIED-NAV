#!/bin/bash
/**
 * @copyright Tomda (https://www.tomda.top)
 * @copyright UIED技术团队 (https://fsuied.com)
 * @author UIED技术团队
 * @createDate 2026.3.2
 */

# 三大功能测试脚本

BASE_URL="http://localhost:8002"

echo "=========================================="
echo "三大功能 API 测试"
echo "=========================================="
echo ""

# 测试1: 获取注册/登录配置
echo "【测试1】获取注册/登录配置"
echo "----------------------------------------"
curl -s "${BASE_URL}/api/uied/setting/auth-config" | jq '.'
echo ""
echo ""

# 测试2: 更新注册/登录配置（关闭注册）
echo "【测试2】更新注册/登录配置（关闭注册）"
echo "----------------------------------------"
curl -s -X POST "${BASE_URL}/api/uied/setting/auth-config/update" \
  -H "Content-Type: application/json" \
  -d '{
    "enable_register": 0,
    "enable_login": 1,
    "register_close_message": "注册功能维护中，预计2小时后恢复",
    "login_close_message": "系统维护中，暂时无法登录"
  }' | jq '.'
echo ""
echo ""

# 测试3: 验证配置已更新
echo "【测试3】验证配置已更新"
echo "----------------------------------------"
curl -s "${BASE_URL}/api/uied/setting/auth-config" | jq '.'
echo ""
echo ""

# 测试4: 获取详情页配置
echo "【测试4】获取详情页配置"
echo "----------------------------------------"
curl -s "${BASE_URL}/api/uied/setting/get?key=detailPageConfig" | jq '.data.shareChannels, .data.sidebarModules'
echo ""
echo ""

# 测试5: 更新分享渠道配置
echo "【测试5】更新分享渠道配置（禁用LinkedIn）"
echo "----------------------------------------"
curl -s -X POST "${BASE_URL}/api/uied/setting/save" \
  -H "Content-Type: application/json" \
  -d '{
    "detailPageConfig": {
      "shareChannels": [
        { "key": "wechat", "name": "微信", "enabled": true, "icon": "wechat", "sort": 1 },
        { "key": "weibo", "name": "微博", "enabled": true, "icon": "weibo", "sort": 2 },
        { "key": "qq", "name": "QQ", "enabled": true, "icon": "qq", "sort": 3 },
        { "key": "qzone", "name": "QQ空间", "enabled": true, "icon": "qzone", "sort": 4 },
        { "key": "twitter", "name": "Twitter", "enabled": true, "icon": "twitter", "sort": 5 },
        { "key": "facebook", "name": "Facebook", "enabled": true, "icon": "facebook", "sort": 6 },
        { "key": "linkedin", "name": "LinkedIn", "enabled": false, "icon": "linkedin", "sort": 7 },
        { "key": "copylink", "name": "复制链接", "enabled": true, "icon": "link", "sort": 8 }
      ]
    }
  }' | jq '.'
echo ""
echo ""

# 测试6: 恢复注册功能
echo "【测试6】恢复注册功能"
echo "----------------------------------------"
curl -s -X POST "${BASE_URL}/api/uied/setting/auth-config/update" \
  -H "Content-Type: application/json" \
  -d '{
    "enable_register": 1,
    "enable_login": 1,
    "register_close_message": "注册功能暂时关闭",
    "login_close_message": "系统维护中，暂时无法登录"
  }' | jq '.'
echo ""
echo ""

echo "=========================================="
echo "测试完成！"
echo "=========================================="
echo ""
echo "提示："
echo "1. 请访问管理后台验证页面显示"
echo "2. 路由: /settings/auth-config"
echo "3. 路由: /settings/detail-page-config"

