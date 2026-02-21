#!/bin/bash
# @copyright Tomda (https://www.tomda.top)
# @copyright UIED技术团队 (https://fsuied.com)
# @author UIED技术团队
# @createDate 2026-02-21

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
DATE_TAG="$(date +%Y%m%d_%H%M%S)"
DEFAULT_OUTPUT_DIR="$ROOT_DIR/release/$DATE_TAG"
DEFAULT_EDITIONS="free,pro,enterprise"
BASE_URL="${PREFLIGHT_BASE_URL:-http://127.0.0.1:8002}"
RUN_PREFLIGHT=1
ALLOW_PREFLIGHT_FAIL=0
OUTPUT_DIR="$DEFAULT_OUTPUT_DIR"
EDITIONS_RAW="$DEFAULT_EDITIONS"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

COMMERCIAL_DOCS=(
  "docs/API/商业版发布清单与授权SOP-2026-02-20.md"
  "docs/API/商业版发布前健康检查脚本-2026-02-20.md"
  "docs/API/商业版严格模式与客户包导出API-2026-02-20.md"
  "docs/API/商业版许可证签发校验与总览API-2026-02-21.md"
  "docs/API/交付初始化向导API-2026-02-20.md"
)

# 输出信息日志
log_info() {
  echo -e "${CYAN}[INFO]${NC} $1"
}

# 输出成功日志
log_ok() {
  echo -e "${GREEN}[OK]${NC} $1"
}

# 输出警告日志
log_warn() {
  echo -e "${YELLOW}[WARN]${NC} $1"
}

# 输出错误日志
log_err() {
  echo -e "${RED}[ERR]${NC} $1"
}

# 打印脚本帮助
print_help() {
  cat <<EOF
商业版版本化打包脚本

用法:
  ./scripts/release-edition-package.sh [选项]

选项:
  --editions free,pro,enterprise   指定导出版本，默认: $DEFAULT_EDITIONS
  --output /abs/path               指定输出目录，默认: $DEFAULT_OUTPUT_DIR
  --base-url http://127.0.0.1:8002 健康检查 API 地址
  --skip-preflight                 跳过发布前健康检查
  --allow-preflight-fail           健康检查失败时仍继续打包
  -h, --help                       显示帮助

示例:
  ./scripts/release-edition-package.sh
  ./scripts/release-edition-package.sh --editions pro,enterprise --output /tmp/uied_release
EOF
}

# 解析命令行参数
parse_args() {
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --editions)
        EDITIONS_RAW="${2:-$DEFAULT_EDITIONS}"
        shift 2
        ;;
      --output)
        OUTPUT_DIR="${2:-$DEFAULT_OUTPUT_DIR}"
        shift 2
        ;;
      --base-url)
        BASE_URL="${2:-$BASE_URL}"
        shift 2
        ;;
      --skip-preflight)
        RUN_PREFLIGHT=0
        shift
        ;;
      --allow-preflight-fail)
        ALLOW_PREFLIGHT_FAIL=1
        shift
        ;;
      -h|--help)
        print_help
        exit 0
        ;;
      *)
        log_err "未知参数: $1"
        print_help
        exit 1
        ;;
    esac
  done
}

# 校验版本参数并输出规范化列表
normalize_editions() {
  local input="$1"
  local arr=()
  IFS=',' read -r -a arr <<< "$input"
  local valid=()
  for item in "${arr[@]}"; do
    local edition
    edition="$(echo "$item" | tr '[:upper:]' '[:lower:]' | xargs)"
    case "$edition" in
      free|pro|enterprise)
        valid+=("$edition")
        ;;
      "")
        ;;
      *)
        log_err "不支持的版本: $edition (仅支持 free/pro/enterprise)"
        exit 1
        ;;
    esac
  done
  if [[ ${#valid[@]} -eq 0 ]]; then
    log_err "未提供有效版本，请使用 --editions free,pro,enterprise"
    exit 1
  fi
  printf '%s\n' "${valid[@]}"
}

# 执行发布前健康检查
run_preflight_check() {
  if [[ "$RUN_PREFLIGHT" -eq 0 ]]; then
    log_warn "已跳过发布前健康检查"
    return 0
  fi
  log_info "执行商业版发布前健康检查..."
  set +e
  node "$ROOT_DIR/scripts/commercial-preflight-check.js" --base-url "$BASE_URL"
  local code=$?
  set -e
  if [[ $code -ne 0 ]]; then
    if [[ "$ALLOW_PREFLIGHT_FAIL" -eq 1 ]]; then
      log_warn "健康检查失败，但已启用 --allow-preflight-fail，继续打包。"
      return 0
    fi
    log_err "健康检查失败，已中止打包。可使用 --allow-preflight-fail 强制继续。"
    exit $code
  fi
  log_ok "健康检查通过"
}

# 写入版本功能覆盖模板
write_feature_overrides() {
  local edition="$1"
  local file_path="$2"
  case "$edition" in
    free)
      cat > "$file_path" <<'EOF'
{
  "advanced_search": false,
  "comments": false,
  "user_center": false,
  "article_advanced": false,
  "wordpress_channel": false,
  "ai_assistant": false,
  "operations_blocks": false,
  "white_label_basic": false,
  "data_statistics": false,
  "monitoring": false,
  "api_access": false,
  "multi_user": false,
  "advanced_seo": false,
  "white_label_full": false,
  "ai_data_analysis": false,
  "priority_support": false
}
EOF
      ;;
    pro)
      cat > "$file_path" <<'EOF'
{
  "data_statistics": false,
  "monitoring": false,
  "api_access": false,
  "multi_user": false,
  "advanced_seo": false,
  "white_label_full": false,
  "ai_data_analysis": false,
  "priority_support": false
}
EOF
      ;;
    enterprise)
      cat > "$file_path" <<'EOF'
{}
EOF
      ;;
  esac
}

# 写入许可证模板文件
write_license_template() {
  local edition="$1"
  local file_path="$2"
  local now_ts
  now_ts="$(date +%s)"
  local edition_upper
  edition_upper="$(printf '%s' "$edition" | tr '[:lower:]' '[:upper:]')"
  cat > "$file_path" <<EOF
{
  "edition": "$edition",
  "status": "active",
  "licenseKey": "UIED-${edition_upper}-REPLACE-ME",
  "customerName": "",
  "companyName": "",
  "contactEmail": "",
  "domainLimit": 1,
  "domainWhitelist": [],
  "issuedAt": $now_ts,
  "expiresAt": 0,
  "note": "",
  "signVersion": "v1",
  "signature": ""
}
EOF
}

# 复制商业版交付文档到目标包
copy_delivery_docs() {
  local dst_dir="$1"
  mkdir -p "$dst_dir/docs/API"
  for rel_path in "${COMMERCIAL_DOCS[@]}"; do
    local src="$ROOT_DIR/$rel_path"
    if [[ -f "$src" ]]; then
      cp "$src" "$dst_dir/$rel_path"
    else
      log_warn "文档不存在，跳过: $rel_path"
    fi
  done
}

# 生成版本包 README
write_delivery_readme() {
  local edition="$1"
  local dst_file="$2"
  local edition_upper
  edition_upper="$(printf '%s' "$edition" | tr '[:lower:]' '[:upper:]')"
  cat > "$dst_file" <<EOF
# UIED-NAV ${edition_upper} 交付包

## 1. 包说明

- 本目录为 ${edition_upper} 版本交付模板包。
- 采用“主干一套代码 + 许可证 + 功能开关”模式，不做代码分叉。

## 2. 初始化步骤

1. 导入数据库基础表结构（按实际部署 SQL）。
2. 导入初始化数据（分类/标签/示例内容）。
3. 在后台导入 \`license/customer-license.json\`。
4. 在后台导入 \`feature/feature-overrides.json\`。
5. 执行发布前健康检查脚本并确认 FAIL=0。

## 3. 必改项

- \`license/customer-license.json\` 中的客户信息、域名、签名。
- \`config/app.env.example\` 中的数据库与服务地址配置。

## 4. 验收接口

- \`/api/uied/license/info\`
- \`/api/uied/feature/list\`
- \`/api/uied/commercial/overview\`

EOF
}

# 写入版本清单 JSON
write_manifest() {
  local edition="$1"
  local dst_file="$2"
  local generated_at
  generated_at="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  cat > "$dst_file" <<EOF
{
  "edition": "$edition",
  "generatedAt": "$generated_at",
  "strategy": "single-mainline-license-feature",
  "requiredApis": [
    "/api/uied/license/info",
    "/api/uied/license/sign",
    "/api/uied/license/verify",
    "/api/uied/feature/list",
    "/api/uied/commercial/mode/get",
    "/api/uied/commercial/overview",
    "/api/uied/delivery/package/export"
  ],
  "notes": "请在发包前执行 scripts/commercial-preflight-check.js，并保证 FAIL=0。"
}
EOF
}

# 为单个版本创建交付目录
build_single_edition_package() {
  local edition="$1"
  local base_dir="$2"
  local target="$base_dir/$edition"
  mkdir -p "$target/config" "$target/license" "$target/feature" "$target/sql" "$target/meta"

  write_delivery_readme "$edition" "$target/README-交付说明.md"
  write_license_template "$edition" "$target/license/customer-license.json"
  write_feature_overrides "$edition" "$target/feature/feature-overrides.json"
  write_manifest "$edition" "$target/meta/release-manifest.json"
  copy_delivery_docs "$target"

  cat > "$target/config/app.env.example" <<'EOF'
# UIED-NAV 环境变量模板
NODE_ENV=production
UIED_LICENSE_SIGN_SECRET=replace-with-your-secret
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_DATABASE=uied_nav
MYSQL_USER=uied
MYSQL_PASSWORD=replace-with-your-password
EOF

  local edition_upper
  edition_upper="$(printf '%s' "$edition" | tr '[:lower:]' '[:upper:]')"
  cat > "$target/sql/README.md" <<EOF
# ${edition_upper} 版本 SQL 说明

请按你的交付规范放入以下内容：

- init_schema.sql（结构）
- init_seed_basic.sql（基础数据）
- init_seed_demo.sql（演示数据，可选）
- patch_*.sql（版本增量）
EOF

  log_ok "已生成版本包: $target"
}

# 主流程入口
main() {
  parse_args "$@"
  editions=()
  while IFS= read -r line; do
    [[ -n "$line" ]] && editions+=("$line")
  done < <(normalize_editions "$EDITIONS_RAW")

  mkdir -p "$OUTPUT_DIR"
  log_info "输出目录: $OUTPUT_DIR"
  log_info "版本列表: ${editions[*]}"
  log_info "健康检查地址: $BASE_URL"

  run_preflight_check

  for edition in "${editions[@]}"; do
    build_single_edition_package "$edition" "$OUTPUT_DIR"
  done

  log_ok "版本化打包完成"
  echo ""
  echo "可直接查看目录:"
  echo "  $OUTPUT_DIR"
}

main "$@"
