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
EDITIONS_EXPLICIT=0
RELEASE_PRESET=""
AUTO_SIGN_LICENSE=0
ALLOW_SIGN_FAIL=0
ADMIN_TOKEN="${UIED_ADMIN_TOKEN:-}"
LICENSE_SIGN_API_PATH="/api/uied/license/sign"

# 许可证模板绑定参数（用于生成客户交付模板，签名仍建议走后台接口）
LICENSE_KEY_OVERRIDE=""
CUSTOMER_NAME=""
COMPANY_NAME=""
CONTACT_EMAIL=""
DOMAIN_LIMIT_OVERRIDE=""
DOMAIN_WHITELIST_RAW=""
EXPIRES_IN_DAYS=""

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
  --preset first-free|first-pro|first-enterprise|full-matrix
                                   使用预设版本方案（未显式指定 --editions 时生效）
  --output /abs/path               指定输出目录，默认: $DEFAULT_OUTPUT_DIR
  --base-url http://127.0.0.1:8002 健康检查 API 地址
  --skip-preflight                 跳过发布前健康检查
  --allow-preflight-fail           健康检查失败时仍继续打包
  --auto-sign-license              调用后台接口自动签发 license/customer-license.json
  --allow-sign-fail                自动签发失败时仍继续打包（默认失败即中止）
  --admin-token <token>            后台管理员 token（用于调用 /api/uied/license/sign）
  --license-sign-api-path <path>   签发接口路径，默认: /api/uied/license/sign
  --customer-name 张三             写入许可证模板客户名称
  --company-name 某某公司          写入许可证模板公司名称
  --contact-email a@b.com          写入许可证模板联系邮箱
  --license-key UIED-PRO-XXX       写入许可证模板 LicenseKey（可选）
  --domain-limit 1                 写入许可证模板域名数量限制
  --domains a.com,b.com            写入许可证模板域名白名单（逗号分隔）
  --expires-in-days 365            写入许可证模板有效期（距今多少天，0或不填=不过期）
  -h, --help                       显示帮助

示例:
  ./scripts/release-edition-package.sh --preset first-pro
  ./scripts/release-edition-package.sh --editions pro,enterprise --output /tmp/uied_release
  ./scripts/release-edition-package.sh --preset first-pro --auto-sign-license --admin-token xxxxxx
EOF
}

# 解析命令行参数
parse_args() {
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --editions)
        EDITIONS_RAW="${2:-$DEFAULT_EDITIONS}"
        EDITIONS_EXPLICIT=1
        shift 2
        ;;
      --preset)
        RELEASE_PRESET="${2:-}"
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
      --auto-sign-license)
        AUTO_SIGN_LICENSE=1
        shift
        ;;
      --allow-sign-fail)
        ALLOW_SIGN_FAIL=1
        shift
        ;;
      --admin-token)
        ADMIN_TOKEN="${2:-}"
        shift 2
        ;;
      --license-sign-api-path)
        LICENSE_SIGN_API_PATH="${2:-$LICENSE_SIGN_API_PATH}"
        shift 2
        ;;
      --customer-name)
        CUSTOMER_NAME="${2:-}"
        shift 2
        ;;
      --company-name)
        COMPANY_NAME="${2:-}"
        shift 2
        ;;
      --contact-email)
        CONTACT_EMAIL="${2:-}"
        shift 2
        ;;
      --license-key)
        LICENSE_KEY_OVERRIDE="${2:-}"
        shift 2
        ;;
      --domain-limit)
        DOMAIN_LIMIT_OVERRIDE="${2:-}"
        shift 2
        ;;
      --domains)
        DOMAIN_WHITELIST_RAW="${2:-}"
        shift 2
        ;;
      --expires-in-days)
        EXPIRES_IN_DAYS="${2:-}"
        shift 2
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

# 规范化预设名称
normalize_preset() {
  local preset
  preset="$(printf '%s' "${1:-}" | tr '[:upper:]' '[:lower:]' | xargs)"
  case "$preset" in
    ""|none)
      printf '%s' ""
      ;;
    first-free|launch-free)
      printf '%s' "first-free"
      ;;
    first-pro|launch-pro|first-release|launch-release)
      printf '%s' "first-pro"
      ;;
    first-enterprise|launch-enterprise)
      printf '%s' "first-enterprise"
      ;;
    full-matrix|matrix)
      printf '%s' "full-matrix"
      ;;
    *)
      log_err "不支持的预设: $preset"
      log_err "支持: first-free / first-pro / first-enterprise / full-matrix"
      exit 1
      ;;
  esac
}

# 应用版本预设（仅在未显式指定 --editions 时覆盖版本列表）
apply_release_preset() {
  local normalized
  normalized="$(normalize_preset "$RELEASE_PRESET")"
  RELEASE_PRESET="$normalized"
  [[ -z "$RELEASE_PRESET" ]] && return 0
  if [[ "$EDITIONS_EXPLICIT" -eq 1 ]]; then
    log_warn "已指定 --editions，预设 $RELEASE_PRESET 不覆盖版本列表（仅写入元信息）"
    return 0
  fi
  case "$RELEASE_PRESET" in
    first-free)
      EDITIONS_RAW="free"
      ;;
    first-pro)
      EDITIONS_RAW="pro"
      ;;
    first-enterprise)
      EDITIONS_RAW="enterprise"
      ;;
    full-matrix)
      EDITIONS_RAW="$DEFAULT_EDITIONS"
      ;;
  esac
}

# 解析域名白名单为 JSON 数组（逗号分隔）
domains_to_json_array() {
  local raw="${1:-}"
  node -e '
    const raw = process.argv[1] || "";
    const list = raw.split(",").map(s => s.trim()).filter(Boolean);
    process.stdout.write(JSON.stringify(Array.from(new Set(list))));
  ' "$raw"
}

# 安全输出 JSON 字符串值（供模板拼接使用）
json_string() {
  node -e 'process.stdout.write(JSON.stringify(String(process.argv[1] || "")));' "${1:-}"
}

# 计算许可证模板绑定参数（统一校验与默认值）
prepare_license_binding_params() {
  local now_ts
  now_ts="$(date +%s)"

  if [[ -n "$DOMAIN_LIMIT_OVERRIDE" ]]; then
    if ! [[ "$DOMAIN_LIMIT_OVERRIDE" =~ ^[0-9]+$ ]] || [[ "$DOMAIN_LIMIT_OVERRIDE" -lt 1 ]]; then
      log_err "--domain-limit 必须是大于等于 1 的整数"
      exit 1
    fi
    LICENSE_DOMAIN_LIMIT="$DOMAIN_LIMIT_OVERRIDE"
  else
    LICENSE_DOMAIN_LIMIT="1"
  fi

  LICENSE_DOMAIN_WHITELIST_JSON="$(domains_to_json_array "$DOMAIN_WHITELIST_RAW")"

  if [[ -n "$EXPIRES_IN_DAYS" ]]; then
    if ! [[ "$EXPIRES_IN_DAYS" =~ ^[0-9]+$ ]]; then
      log_err "--expires-in-days 必须是整数（0 表示不过期）"
      exit 1
    fi
    if [[ "$EXPIRES_IN_DAYS" -eq 0 ]]; then
      LICENSE_EXPIRES_AT="0"
    else
      LICENSE_EXPIRES_AT="$(( now_ts + EXPIRES_IN_DAYS * 86400 ))"
    fi
  else
    LICENSE_EXPIRES_AT="0"
  fi
}

# 校验自动签发参数（仅在启用 --auto-sign-license 时要求）
validate_auto_sign_config() {
  if [[ "$AUTO_SIGN_LICENSE" -ne 1 ]]; then
    return 0
  fi
  if [[ -z "$ADMIN_TOKEN" ]]; then
    if [[ "$ALLOW_SIGN_FAIL" -eq 1 ]]; then
      log_warn "已启用 --auto-sign-license 但未提供 --admin-token，自动签发将跳过（因为允许签发失败）"
      AUTO_SIGN_LICENSE=0
      return 0
    fi
    log_err "启用 --auto-sign-license 时必须提供 --admin-token（或设置 UIED_ADMIN_TOKEN）"
    exit 1
  fi
  if [[ "$LICENSE_SIGN_API_PATH" != /* ]]; then
    LICENSE_SIGN_API_PATH="/$LICENSE_SIGN_API_PATH"
  fi
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
  local license_key
  if [[ -n "$LICENSE_KEY_OVERRIDE" ]]; then
    license_key="$LICENSE_KEY_OVERRIDE"
  else
    license_key="UIED-${edition_upper}-REPLACE-ME"
  fi
  cat > "$file_path" <<EOF
{
  "edition": "$edition",
  "status": "active",
  "licenseKey": $(json_string "$license_key"),
  "customerName": $(json_string "$CUSTOMER_NAME"),
  "companyName": $(json_string "$COMPANY_NAME"),
  "contactEmail": $(json_string "$CONTACT_EMAIL"),
  "domainLimit": ${LICENSE_DOMAIN_LIMIT:-1},
  "domainWhitelist": ${LICENSE_DOMAIN_WHITELIST_JSON:-[]},
  "issuedAt": $now_ts,
  "expiresAt": ${LICENSE_EXPIRES_AT:-0},
  "note": "",
  "signVersion": "v1",
  "signature": ""
}
EOF
}

# 调用后台签发接口，为 license 文件写入签名（不落库）
auto_sign_license_template() {
  local edition="$1"
  local file_path="$2"

  if [[ "$AUTO_SIGN_LICENSE" -ne 1 ]]; then
    return 0
  fi
  if [[ ! -f "$file_path" ]]; then
    log_warn "license 模板文件不存在，跳过自动签发: $file_path"
    return 0
  fi

  local url="${BASE_URL%/}${LICENSE_SIGN_API_PATH}"
  local tmp_resp tmp_http
  tmp_resp="$(mktemp)"
  tmp_http="$(mktemp)"

  log_info "自动签发 ${edition} 许可证模板 -> $url"
  set +e
  curl -sS \
    -X POST \
    -H "Content-Type: application/json" \
    -H "token: ${ADMIN_TOKEN}" \
    -o "$tmp_resp" \
    -w "%{http_code}" \
    "$url" \
    --data-binary "@$file_path" > "$tmp_http"
  local curl_code=$?
  set -e

  local http_code
  http_code="$(cat "$tmp_http" 2>/dev/null || printf '000')"

  if [[ $curl_code -ne 0 ]]; then
    rm -f "$tmp_resp" "$tmp_http"
    if [[ "$ALLOW_SIGN_FAIL" -eq 1 ]]; then
      log_warn "自动签发失败（curl 退出码=$curl_code），已跳过（允许签发失败）"
      return 0
    fi
    log_err "自动签发失败（curl 退出码=$curl_code）"
    exit 1
  fi

  if [[ "$http_code" != "200" ]]; then
    local body_preview
    body_preview="$(cat "$tmp_resp" 2>/dev/null || true)"
    rm -f "$tmp_resp" "$tmp_http"
    if [[ "$ALLOW_SIGN_FAIL" -eq 1 ]]; then
      log_warn "自动签发失败（HTTP $http_code），已跳过（允许签发失败）"
      [[ -n "$body_preview" ]] && log_warn "响应: $body_preview"
      return 0
    fi
    log_err "自动签发失败（HTTP $http_code）"
    [[ -n "$body_preview" ]] && log_err "响应: $body_preview"
    exit 1
  fi

  set +e
  node - "$tmp_resp" "$file_path" <<'NODE'
const fs = require('fs');
const [ respPath, outPath ] = process.argv.slice(2);
const raw = fs.readFileSync(respPath, 'utf8');
let body;
try {
  body = JSON.parse(raw);
} catch (error) {
  console.error(`签发接口返回非 JSON: ${error.message}`);
  process.exit(2);
}
const code = Number(body?.code ?? 0);
if (!(code === 1 || code === 200)) {
  console.error(`签发接口业务失败，code=${code}, msg=${body?.msg || body?.message || ''}`);
  process.exit(3);
}
const data = body?.data;
if (!data || typeof data !== 'object') {
  console.error('签发接口返回 data 为空或格式错误');
  process.exit(4);
}
if (!String(data.signature || '').trim()) {
  console.error('签发接口返回缺少 signature');
  process.exit(5);
}
fs.writeFileSync(outPath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
NODE
  local parse_code=$?
  set -e

  rm -f "$tmp_resp" "$tmp_http"

  if [[ $parse_code -ne 0 ]]; then
    if [[ "$ALLOW_SIGN_FAIL" -eq 1 ]]; then
      log_warn "自动签发结果解析失败，已跳过（允许签发失败）"
      return 0
    fi
    log_err "自动签发结果解析失败，已中止打包"
    exit 1
  fi

  log_ok "已自动签发许可证模板: $file_path"
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
  local preset_json
  local customer_name_json
  local company_name_json
  local contact_email_json
  preset_json="$(json_string "$RELEASE_PRESET")"
  customer_name_json="$(json_string "$CUSTOMER_NAME")"
  company_name_json="$(json_string "$COMPANY_NAME")"
  contact_email_json="$(json_string "$CONTACT_EMAIL")"
  cat > "$dst_file" <<EOF
{
  "edition": "$edition",
  "generatedAt": "$generated_at",
  "releasePreset": $preset_json,
  "strategy": "single-mainline-license-feature",
  "licenseBindingTemplate": {
    "customerName": $customer_name_json,
    "companyName": $company_name_json,
    "contactEmail": $contact_email_json,
    "domainLimit": ${LICENSE_DOMAIN_LIMIT:-1},
    "domainWhitelist": ${LICENSE_DOMAIN_WHITELIST_JSON:-[]},
    "expiresAt": ${LICENSE_EXPIRES_AT:-0}
  },
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

# 写入顶层打包汇总，便于直接发包与记录首发版本
write_bundle_summary() {
  local dst_dir="$1"
  local editions_text="$2"
  local generated_at
  generated_at="$(date '+%Y-%m-%d %H:%M:%S')"
  cat > "$dst_dir/RELEASE-SUMMARY.md" <<EOF
# UIED-NAV 版本化打包结果

- 生成时间：$generated_at
- 版本列表：$editions_text
- 预设方案：${RELEASE_PRESET:-未使用}
- 健康检查地址：$BASE_URL
- 客户名称（模板）：${CUSTOMER_NAME:-未填写}
- 公司名称（模板）：${COMPANY_NAME:-未填写}
- 联系邮箱（模板）：${CONTACT_EMAIL:-未填写}
- 域名限制（模板）：${LICENSE_DOMAIN_LIMIT:-1}
- 域名白名单（模板）：${DOMAIN_WHITELIST_RAW:-未填写}
- 有效期（模板）：${EXPIRES_IN_DAYS:-0} 天（0=不过期）
- 自动签发许可证：$([[ "$AUTO_SIGN_LICENSE" -eq 1 ]] && printf '开启' || printf '关闭')
- 签发接口：${BASE_URL%/}${LICENSE_SIGN_API_PATH}

## 使用说明（首发版推荐）

1. 选择一个版本目录（如 \`pro/\`）作为首发交付包。
2. 修改该目录下 \`license/customer-license.json\` 客户信息与域名。
3. 通过后台许可证接口完成签名（推荐）：
   - \`/api/uied/license/sign\`
   - \`/api/uied/license/verify\`
4. 导入 \`feature/feature-overrides.json\` 与初始化数据。
5. 执行健康检查并确认 FAIL=0 后再发包。

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
  auto_sign_license_template "$edition" "$target/license/customer-license.json"
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
  apply_release_preset
  prepare_license_binding_params
  validate_auto_sign_config
  editions=()
  while IFS= read -r line; do
    [[ -n "$line" ]] && editions+=("$line")
  done < <(normalize_editions "$EDITIONS_RAW")

  mkdir -p "$OUTPUT_DIR"
  log_info "输出目录: $OUTPUT_DIR"
  log_info "版本列表: ${editions[*]}"
  [[ -n "$RELEASE_PRESET" ]] && log_info "版本预设: $RELEASE_PRESET"
  log_info "健康检查地址: $BASE_URL"
  [[ "$AUTO_SIGN_LICENSE" -eq 1 ]] && log_info "自动签发许可证: 开启 (${BASE_URL%/}${LICENSE_SIGN_API_PATH})"

  run_preflight_check

  for edition in "${editions[@]}"; do
    build_single_edition_package "$edition" "$OUTPUT_DIR"
  done

  write_bundle_summary "$OUTPUT_DIR" "${editions[*]}"

  log_ok "版本化打包完成"
  echo ""
  echo "可直接查看目录:"
  echo "  $OUTPUT_DIR"
}

main "$@"
