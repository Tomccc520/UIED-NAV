#!/bin/bash
# @copyright Tomda (https://www.tomda.top)
# @copyright UIED技术团队 (https://fsuied.com)
# @author UIED技术团队
# @createDate 2026-02-20

set -e

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "🔍 商业版发布前检查（SOP入口）"
echo "================================"
echo ""

if ! command -v node >/dev/null 2>&1; then
  echo "❌ 未检测到 Node.js，请先安装 Node 环境"
  exit 1
fi

cd "$ROOT_DIR"
node scripts/commercial-preflight-check.js "$@"
