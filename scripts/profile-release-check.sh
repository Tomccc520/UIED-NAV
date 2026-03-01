#!/bin/bash
# @copyright Tomda (https://www.tomda.top)
# @copyright UIED技术团队 (https://fsuied.com)
# @author UIED技术团队
# @createDate 2026-02-28

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

BASE_URL="http://127.0.0.1:8002"
FRONTEND_BASE_URL="http://127.0.0.1:3003"
USERNAME=""
PASSWORD=""
TWO_FACTOR_CODE=""
AVATAR_FILE=""
WRITE_BACKFILL="0"
SKIP_BACKFILL="0"
SKIP_BUILD="0"
SKIP_PREFLIGHT="0"

# 输出使用说明
print_help() {
  cat <<'EOF'
用法：
  ./scripts/profile-release-check.sh --username tomda --password 123456

可选参数：
  --base-url http://127.0.0.1:8002
  --frontend-base-url http://127.0.0.1:3003
  --username tomda
  --password 123456
  --two-factor-code 123456
  --avatar-file /绝对路径/test.png
  --write-backfill            先写入历史授权审核消息回填
  --skip-backfill             跳过历史消息回填检查
  --skip-build                跳过前端构建
  --skip-preflight            跳过商业版全量健康检查
  --help

说明：
  1. 默认先跑“历史授权审核消息回填（预演模式）”
  2. 再跑“用户中心全链路回归”
  3. 再跑“前端 build”
  4. 最后跑“商业版发布前健康检查”
EOF
}

# 解析命令行参数
parse_args() {
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --base-url)
        BASE_URL="$2"
        shift 2
        ;;
      --frontend-base-url)
        FRONTEND_BASE_URL="$2"
        shift 2
        ;;
      --username)
        USERNAME="$2"
        shift 2
        ;;
      --password)
        PASSWORD="$2"
        shift 2
        ;;
      --two-factor-code)
        TWO_FACTOR_CODE="$2"
        shift 2
        ;;
      --avatar-file)
        AVATAR_FILE="$2"
        shift 2
        ;;
      --write-backfill)
        WRITE_BACKFILL="1"
        shift
        ;;
      --skip-backfill)
        SKIP_BACKFILL="1"
        shift
        ;;
      --skip-build)
        SKIP_BUILD="1"
        shift
        ;;
      --skip-preflight)
        SKIP_PREFLIGHT="1"
        shift
        ;;
      --help)
        print_help
        exit 0
        ;;
      *)
        echo "未知参数: $1"
        print_help
        exit 1
        ;;
    esac
  done
}

# 输出步骤标题
run_step() {
  local title="$1"
  echo ""
  echo "=================================================="
  echo "$title"
  echo "=================================================="
}

# 执行历史消息回填
run_backfill() {
  if [[ "$SKIP_BACKFILL" == "1" ]]; then
    echo "跳过：历史授权审核消息回填"
    return
  fi
  run_step "步骤 1/4：历史授权审核消息回填"
  cd "$ROOT_DIR"
  if [[ "$WRITE_BACKFILL" == "1" ]]; then
    node scripts/backfill-license-message-extra.js --write
  else
    node scripts/backfill-license-message-extra.js
  fi
}

# 执行用户中心回归
run_user_center_regression() {
  run_step "步骤 2/4：用户中心全链路回归"
  if [[ -z "$USERNAME" || -z "$PASSWORD" ]]; then
    echo "缺少 --username 或 --password，无法执行用户中心回归。"
    exit 1
  fi
  cd "$ROOT_DIR"
  local cmd=(node scripts/user-center-regression-check.js --base-url "$BASE_URL" --username "$USERNAME" --password "$PASSWORD")
  if [[ -n "$TWO_FACTOR_CODE" ]]; then
    cmd+=(--two-factor-code "$TWO_FACTOR_CODE")
  fi
  if [[ -n "$AVATAR_FILE" ]]; then
    cmd+=(--avatar-file "$AVATAR_FILE")
  fi
  "${cmd[@]}"
}

# 执行前端构建
run_frontend_build() {
  if [[ "$SKIP_BUILD" == "1" ]]; then
    echo "跳过：前端构建"
    return
  fi
  run_step "步骤 3/4：前端构建校验"
  cd "$ROOT_DIR/frontend"
  npm run build
}

# 执行商业版健康检查
run_commercial_preflight() {
  if [[ "$SKIP_PREFLIGHT" == "1" ]]; then
    echo "跳过：商业版发布前健康检查"
    return
  fi
  run_step "步骤 4/4：商业版发布前健康检查"
  cd "$ROOT_DIR"
  node scripts/commercial-preflight-check.js \
    --base-url "$BASE_URL" \
    --frontend-base-url "$FRONTEND_BASE_URL" \
    --smoke-user "$USERNAME" \
    --smoke-pass "$PASSWORD"
}

parse_args "$@"

run_backfill
run_user_center_regression
run_frontend_build
run_commercial_preflight

echo ""
echo "个人中心版本发布前检查已执行完成。"
