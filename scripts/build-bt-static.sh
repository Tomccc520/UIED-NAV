#!/usr/bin/env bash
# @copyright Tomda (https://www.tomda.top)
# @copyright UIED技术团队 (https://fsuied.com)
# @author UIED技术团队
# @createDate 2026-02-27

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
OUTPUT_ROOT="$ROOT_DIR/release/static_$(date +%Y%m%d_%H%M%S)"
SITE_DOMAIN="${1:-}"

if [[ -z "$SITE_DOMAIN" ]]; then
  echo "用法: ./scripts/build-bt-static.sh <域名>"
  echo "示例: ./scripts/build-bt-static.sh hao.uied.cn"
  exit 1
fi

API_URL="https://${SITE_DOMAIN}/api"

ensure_cmd() {
  # 函数说明：检查必需命令是否可用
  local cmd="$1"
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "缺少命令: $cmd"
    exit 1
  fi
}

prepare_output() {
  # 函数说明：创建打包输出目录
  mkdir -p "$OUTPUT_ROOT/frontend"
  mkdir -p "$OUTPUT_ROOT/admin"
}

build_frontend() {
  # 函数说明：构建 React 官网静态资源
  echo "[1/3] 构建 frontend..."
  cd "$ROOT_DIR/frontend"
  cat > .env.production <<EOF
REACT_APP_API_URL=${API_URL}
PORT=3003
EOF
  npm install
  npm run build
  rm -rf "$OUTPUT_ROOT/frontend/"*
  cp -R build/. "$OUTPUT_ROOT/frontend/"
}

build_admin() {
  # 函数说明：构建 Vue 管理后台静态资源
  echo "[2/3] 构建 server/admin..."
  cd "$ROOT_DIR/server/admin"
  cat > .env.production <<EOF
VITE_APP_BASE_URL=${API_URL}
EOF
  npm install
  npm run build
  rm -rf "$OUTPUT_ROOT/admin/"*
  cp -R dist/. "$OUTPUT_ROOT/admin/"
}

write_manifest() {
  # 函数说明：生成构建清单，便于交付与回溯
  cat > "$OUTPUT_ROOT/manifest.txt" <<EOF
domain=${SITE_DOMAIN}
api_url=${API_URL}
build_time=$(date '+%Y-%m-%d %H:%M:%S')
frontend_source_commit=$(cd "$ROOT_DIR/frontend" && git rev-parse --short HEAD 2>/dev/null || echo unknown)
root_source_commit=$(cd "$ROOT_DIR" && git rev-parse --short HEAD 2>/dev/null || echo unknown)
EOF
}

main() {
  # 函数说明：执行宝塔静态资源构建主流程
  ensure_cmd npm
  prepare_output
  build_frontend
  build_admin
  write_manifest
  echo "[3/3] 构建完成: $OUTPUT_ROOT"
  echo "上传到宝塔："
  echo "  - $OUTPUT_ROOT/frontend -> 网站前台目录"
  echo "  - $OUTPUT_ROOT/admin -> /admin 静态目录"
}

main "$@"

