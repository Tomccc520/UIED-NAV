#!/usr/bin/env bash
# @copyright Tomda (https://www.tomda.top)
# @copyright UIED技术团队 (https://fsuied.com)
# @author UIED技术团队
# @createDate 2026-02-27

set -euo pipefail

SITE_ROOT="${1:-/www/wwwroot/hao.uied.cn}"
BACKEND_DIR="$SITE_ROOT/backend"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ECO_FILE="$SCRIPT_DIR/ecosystem.uied-api.config.cjs"

check_command() {
  # 函数说明：检查命令是否存在，避免执行中断
  local cmd="$1"
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "缺少命令: $cmd"
    exit 1
  fi
}

reload_backend() {
  # 函数说明：重载后端 PM2 进程，若不存在则首次启动
  cd "$BACKEND_DIR"
  if pm2 describe uied-api >/dev/null 2>&1; then
    pm2 reload uied-api --update-env
  else
    pm2 start "$ECO_FILE"
  fi
  pm2 save
}

reload_nginx() {
  # 函数说明：重载 Nginx 配置使静态资源与反向代理生效
  if command -v bt >/dev/null 2>&1; then
    bt reload
  else
    nginx -t && nginx -s reload
  fi
}

main() {
  # 函数说明：执行上线后的服务重载流程
  check_command pm2
  reload_backend
  reload_nginx
  echo "服务已重载完成。"
}

main "$@"
