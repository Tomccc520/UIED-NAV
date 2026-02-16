#!/usr/bin/env bash

set -euo pipefail

##
# 输出帮助信息
##
print_usage() {
    cat <<'EOF'
用法：
  ./install_module.sh /绝对路径/likeadmin_node [--mode merge|overwrite] [--dry-run] [--force-overwrite]

示例：
  ./install_module.sh /Users/xxx/project/likeadmin_node --mode merge
  ./install_module.sh /Users/xxx/project/likeadmin_node --force-overwrite

说明：
  1) 默认 mode=merge（推荐）：优先智能合并，冲突文件只输出到报告目录，不直接覆盖
  2) mode=overwrite：直接覆盖同名文件（会自动备份）
  3) SQL 补丁需手动执行：sql/patch_2026_0214_article_tag_topic_slug.sql
EOF
}

##
# 计算模块根路径
##
get_module_root() {
    local script_dir
    script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    cd "${script_dir}/.." && pwd
}

##
# 校验目标 likeadmin_node 目录
# 参数：
#   $1 目标 likeadmin_node 路径
##
assert_target_dir() {
    local target_root="$1"
    if [[ ! -d "${target_root}" ]]; then
        echo "[ERROR] 目标目录不存在: ${target_root}"
        exit 1
    fi
    if [[ ! -d "${target_root}/server/app" || ! -d "${target_root}/admin/src" ]]; then
        echo "[ERROR] 目标目录不是 likeadmin_node 结构: ${target_root}"
        exit 1
    fi
}

##
# 判断字符串是否在数组中
# 参数：
#   $1 查找值
#   $@ 数组值
##
contains_in_array() {
    local needle="$1"
    shift
    local item
    for item in "$@"; do
        if [[ "${item}" == "${needle}" ]]; then
            return 0
        fi
    done
    return 1
}

##
# 备份目标文件（仅首次）
# 参数：
#   $1 目标文件绝对路径
##
backup_target_file_once() {
    local target_file="$1"
    if [[ ! -f "${target_file}" ]]; then
        return 0
    fi
    local rel_path
    rel_path="${target_file#${TARGET_ROOT}/}"
    if grep -Fxq "${rel_path}" "${BACKED_UP_INDEX_FILE}" 2>/dev/null; then
        return 0
    fi
    mkdir -p "${BACKUP_ROOT}/$(dirname "${rel_path}")"
    if [[ "${DRY_RUN}" == "false" ]]; then
        cp "${target_file}" "${BACKUP_ROOT}/${rel_path}"
    fi
    echo "${rel_path}" >> "${BACKED_UP_INDEX_FILE}"
    echo "[BACKUP] ${rel_path}"
}

##
# 记录冲突文件（输出 .new 文件）
# 参数：
#   $1 源文件绝对路径
#   $2 目标文件绝对路径
#   $3 冲突原因
##
record_conflict_file() {
    local source_file="$1"
    local target_file="$2"
    local reason="$3"
    local rel_path
    rel_path="${target_file#${TARGET_ROOT}/}"
    mkdir -p "${REPORT_ROOT}/conflicts/$(dirname "${rel_path}")"
    if [[ "${DRY_RUN}" == "false" ]]; then
        cp "${source_file}" "${REPORT_ROOT}/conflicts/${rel_path}.new"
    fi
    echo "| ${rel_path} | ${reason} |" >> "${SUMMARY_CONFLICT_FILE}"
    echo "[CONFLICT] ${rel_path} (${reason})"
}

##
# 直接安装单文件（覆盖写入）
# 参数：
#   $1 源文件绝对路径
#   $2 目标文件绝对路径
##
install_one_file_overwrite() {
    local source_file="$1"
    local target_file="$2"
    mkdir -p "$(dirname "${target_file}")"
    if [[ "${DRY_RUN}" == "false" ]]; then
        cp "${source_file}" "${target_file}"
    fi
    local rel_path
    rel_path="${target_file#${TARGET_ROOT}/}"
    echo "[INSTALL] ${rel_path}"
}

##
# 向配置数组插入缺失条目
# 参数：
#   $1 目标文件
#   $2 数组名
#   $3 条目文本（完整行）
##
insert_line_to_config_array() {
    local target_file="$1"
    local array_name="$2"
    local entry_line="$3"
    local tmp_file
    tmp_file="$(mktemp)"
    awk -v arr="${array_name}" -v line="${entry_line}" '
      BEGIN { in_arr = 0; added = 0 }
      {
        if ($0 ~ ("^[[:space:]]*" arr ":[[:space:]]*\\[")) {
          in_arr = 1
        }
        if (in_arr == 1 && added == 0 && $0 ~ /^[[:space:]]*],/) {
          print line
          added = 1
        }
        print $0
        if (in_arr == 1 && $0 ~ /^[[:space:]]*],/) {
          in_arr = 0
        }
      }
    ' "${target_file}" > "${tmp_file}"
    if [[ "${DRY_RUN}" == "false" ]]; then
        mv "${tmp_file}" "${target_file}"
    else
        rm -f "${tmp_file}"
    fi
}

##
# 合并 router/system.js（仅补齐内容管理相关路由）
# 参数：
#   $1 源文件
#   $2 目标文件
##
merge_router_system_file() {
    local source_file="$1"
    local target_file="$2"
    local missing_file
    missing_file="$(mktemp)"
    grep -E "router\\.all\\('/api/(article|user/article)/" "${source_file}" | while IFS= read -r line; do
        if ! grep -Fq "${line}" "${target_file}"; then
            echo "${line}" >> "${missing_file}"
        fi
    done

    if [[ ! -s "${missing_file}" ]]; then
        rm -f "${missing_file}"
        return 2
    fi

    local tmp_file
    tmp_file="$(mktemp)"
    awk -v insert_file="${missing_file}" '
      BEGIN {
        count = 0
        while ((getline row < insert_file) > 0) {
          inserts[++count] = row
        }
      }
      { lines[++total] = $0 }
      END {
        injected = 0
        for (i = 1; i <= total; i++) {
          if (injected == 0 && lines[i] ~ /^};[[:space:]]*$/) {
            for (j = 1; j <= count; j++) {
              print inserts[j]
            }
            injected = 1
          }
          print lines[i]
        }
        if (injected == 0) {
          for (j = 1; j <= count; j++) {
            print inserts[j]
          }
        }
      }
    ' "${target_file}" > "${tmp_file}"

    if [[ "${DRY_RUN}" == "false" ]]; then
        mv "${tmp_file}" "${target_file}"
    else
        rm -f "${tmp_file}"
    fi
    rm -f "${missing_file}"
    return 0
}

##
# 合并 extend/config.js（仅补齐内容管理相关鉴权条目）
# 参数：
#   $1 源文件
#   $2 目标文件
##
merge_extend_config_file() {
    local source_file="$1"
    local target_file="$2"
    local array_name
    local changed=0
    local regex
    regex="'article:|'user:author:center:|'user:author:public:|'user:article:|'common:album:albumList'|'common:album:cateList'|'ai:chat:completions:editor'"

    for array_name in "notLoginUri" "userTokenPassUri" "notAuthUri"; do
        local src_entries
        src_entries="$(awk -v arr="${array_name}" '
          $0 ~ ("^[[:space:]]*" arr ":[[:space:]]*\\[") { in_arr = 1; next }
          in_arr == 1 && $0 ~ /^[[:space:]]*],/ { in_arr = 0; exit }
          in_arr == 1 { print $0 }
        ' "${source_file}" | grep -E "${regex}" || true)"

        if [[ -z "${src_entries}" ]]; then
            continue
        fi

        while IFS= read -r entry_line; do
            [[ -z "${entry_line}" ]] && continue
            if ! grep -Fq "${entry_line}" "${target_file}"; then
                insert_line_to_config_array "${target_file}" "${array_name}" "${entry_line}"
                changed=1
            fi
        done <<< "${src_entries}"
    done

    if [[ "${changed}" -eq 1 ]]; then
        return 0
    fi
    return 2
}

##
# 提取 API 函数代码块
# 参数：
#   $1 源文件
#   $2 函数名
##
extract_api_function_block() {
    local source_file="$1"
    local fn_name="$2"
    awk -v fn="${fn_name}" '
      $0 ~ ("^export function " fn "\\(") { cap = 1 }
      cap == 1 {
        print $0
        if ($0 ~ /^}$/) {
          exit
        }
      }
    ' "${source_file}"
}

##
# 合并 admin/src/api/article.ts（按函数名补齐缺失导出）
# 参数：
#   $1 源文件
#   $2 目标文件
##
merge_admin_api_article_file() {
    local source_file="$1"
    local target_file="$2"
    local changed=0
    local fn_name
    local functions
    functions="$(grep -E '^export function [a-zA-Z0-9_]+\(' "${source_file}" | sed -E 's/^export function ([a-zA-Z0-9_]+)\(.*/\1/' || true)"

    while IFS= read -r fn_name; do
        [[ -z "${fn_name}" ]] && continue
        if grep -Eq "^export function ${fn_name}\\(" "${target_file}"; then
            continue
        fi
        local block
        block="$(extract_api_function_block "${source_file}" "${fn_name}")"
        if [[ -z "${block}" ]]; then
            continue
        fi
        if [[ "${DRY_RUN}" == "false" ]]; then
            printf "\n%s\n" "${block}" >> "${target_file}"
        fi
        changed=1
    done <<< "${functions}"

    if [[ "${changed}" -eq 1 ]]; then
        return 0
    fi
    return 2
}

##
# 按路径执行智能合并
# 参数：
#   $1 源文件
#   $2 目标文件
#   $3 相对路径
##
merge_by_path() {
    local source_file="$1"
    local target_file="$2"
    local rel_path="$3"

    if [[ "${rel_path}" == "server/app/router/system.js" ]]; then
        merge_router_system_file "${source_file}" "${target_file}"
        return $?
    fi
    if [[ "${rel_path}" == "server/app/extend/config.js" ]]; then
        merge_extend_config_file "${source_file}" "${target_file}"
        return $?
    fi
    if [[ "${rel_path}" == "admin/src/api/article.ts" ]]; then
        merge_admin_api_article_file "${source_file}" "${target_file}"
        return $?
    fi
    return 1
}

##
# 初始化报告目录
##
prepare_report_dirs() {
    mkdir -p "${REPORT_ROOT}/conflicts"
    SUMMARY_CONFLICT_FILE="${REPORT_ROOT}/conflicts.md"
    SUMMARY_MERGE_FILE="${REPORT_ROOT}/merged.md"
    SUMMARY_INSTALL_FILE="${REPORT_ROOT}/installed.md"
    SUMMARY_SKIP_FILE="${REPORT_ROOT}/skipped.md"
    BACKED_UP_INDEX_FILE="${REPORT_ROOT}/.backed_up_index.txt"

    cat > "${SUMMARY_CONFLICT_FILE}" <<'EOF'
| 文件 | 原因 |
| --- | --- |
EOF
    cat > "${SUMMARY_MERGE_FILE}" <<'EOF'
| 文件 | 结果 |
| --- | --- |
EOF
    cat > "${SUMMARY_INSTALL_FILE}" <<'EOF'
| 文件 | 结果 |
| --- | --- |
EOF
    cat > "${SUMMARY_SKIP_FILE}" <<'EOF'
| 文件 | 原因 |
| --- | --- |
EOF
}

##
# 执行模块安装
# 参数：
#   $1 目标 likeadmin_node 目录
##
install_content_manage_module() {
    TARGET_ROOT="$1"
    assert_target_dir "${TARGET_ROOT}"

    local module_root files_root source_file rel_path target_file
    module_root="$(get_module_root)"
    files_root="${module_root}/files/likeadmin_node"
    if [[ ! -d "${files_root}" ]]; then
        echo "[ERROR] 未找到模块文件目录: ${files_root}"
        echo "请先执行：./build_package.sh"
        exit 1
    fi

    BACKUP_ROOT="${TARGET_ROOT}/.module_backup/content-manage-$(date +%Y%m%d_%H%M%S)"
    REPORT_ROOT="${TARGET_ROOT}/.module_report/content-manage-$(date +%Y%m%d_%H%M%S)"
    mkdir -p "${BACKUP_ROOT}"
    prepare_report_dirs

    echo "[INFO] 安装模式: ${MODE}"
    echo "[INFO] Dry Run: ${DRY_RUN}"
    echo "[INFO] 备份目录: ${BACKUP_ROOT}"
    echo "[INFO] 报告目录: ${REPORT_ROOT}"

    while IFS= read -r -d '' source_file; do
        rel_path="${source_file#${files_root}/}"
        target_file="${TARGET_ROOT}/${rel_path}"

        # 新文件直接安装
        if [[ ! -f "${target_file}" ]]; then
            install_one_file_overwrite "${source_file}" "${target_file}"
            echo "| ${rel_path} | 新增文件 |" >> "${SUMMARY_INSTALL_FILE}"
            continue
        fi

        # 完全一致直接跳过
        if cmp -s "${source_file}" "${target_file}"; then
            echo "[SKIP] ${rel_path} (内容一致)"
            echo "| ${rel_path} | 内容一致 |" >> "${SUMMARY_SKIP_FILE}"
            continue
        fi

        # overwrite 模式：直接覆盖（先备份）
        if [[ "${MODE}" == "overwrite" ]]; then
            backup_target_file_once "${target_file}"
            install_one_file_overwrite "${source_file}" "${target_file}"
            echo "| ${rel_path} | 覆盖安装 |" >> "${SUMMARY_INSTALL_FILE}"
            continue
        fi

        # merge 模式：白名单文件尝试智能合并
        if contains_in_array "${rel_path}" "${MERGE_WHITELIST[@]}"; then
            backup_target_file_once "${target_file}"
            if merge_by_path "${source_file}" "${target_file}" "${rel_path}"; then
                echo "[MERGE] ${rel_path} (合并成功)"
                echo "| ${rel_path} | 合并成功 |" >> "${SUMMARY_MERGE_FILE}"
            else
                local merge_code=$?
                if [[ "${merge_code}" -eq 2 ]]; then
                    echo "[SKIP] ${rel_path} (无需合并)"
                    echo "| ${rel_path} | 无需合并 |" >> "${SUMMARY_SKIP_FILE}"
                else
                    record_conflict_file "${source_file}" "${target_file}" "智能合并失败，需人工处理"
                fi
            fi
            continue
        fi

        # merge 模式非白名单：不覆盖，输出冲突候选文件
        record_conflict_file "${source_file}" "${target_file}" "非白名单文件，默认不覆盖"
    done < <(find "${files_root}" -type f -print0)

    local summary_file
    summary_file="${REPORT_ROOT}/summary.md"
    cat > "${summary_file}" <<EOF
# 内容管理模块安装报告

- 安装模式：${MODE}
- Dry Run：${DRY_RUN}
- 目标目录：${TARGET_ROOT}
- 备份目录：${BACKUP_ROOT}
- 报告目录：${REPORT_ROOT}

## 已安装

$(cat "${SUMMARY_INSTALL_FILE}")

## 已合并

$(cat "${SUMMARY_MERGE_FILE}")

## 已跳过

$(cat "${SUMMARY_SKIP_FILE}")

## 冲突待处理

$(cat "${SUMMARY_CONFLICT_FILE}")
EOF

    echo ""
    echo "内容管理模块安装完成。"
    echo "总结报告：${summary_file}"
    echo "下一步："
    echo "1) 执行 SQL 补丁: ${TARGET_ROOT}/sql/patch_2026_0214_article_tag_topic_slug.sql"
    echo "2) 重启 server 与 admin"
    echo "3) 处理冲突文件（如有）：${REPORT_ROOT}/conflicts"
    echo "4) 按模块文档做联调自检"
}

##
# 解析命令行参数
##
parse_args() {
    if [[ $# -ge 1 && ( "$1" == "-h" || "$1" == "--help" ) ]]; then
        print_usage
        exit 0
    fi

    if [[ $# -lt 1 ]]; then
        print_usage
        exit 1
    fi

    TARGET_ROOT_ARG="$1"
    shift

    while [[ $# -gt 0 ]]; do
        case "$1" in
            --mode)
                MODE="${2:-}"
                shift 2
                ;;
            --dry-run)
                DRY_RUN="true"
                shift 1
                ;;
            --force-overwrite)
                MODE="overwrite"
                shift 1
                ;;
            -h|--help)
                print_usage
                exit 0
                ;;
            *)
                echo "[ERROR] 未知参数: $1"
                print_usage
                exit 1
                ;;
        esac
    done

    if [[ "${MODE}" != "merge" && "${MODE}" != "overwrite" ]]; then
        echo "[ERROR] --mode 仅支持 merge 或 overwrite"
        exit 1
    fi
}

TARGET_ROOT=""
TARGET_ROOT_ARG=""
MODE="merge"
DRY_RUN="false"
BACKUP_ROOT=""
REPORT_ROOT=""
SUMMARY_CONFLICT_FILE=""
SUMMARY_MERGE_FILE=""
SUMMARY_INSTALL_FILE=""
SUMMARY_SKIP_FILE=""
BACKED_UP_INDEX_FILE=""
MERGE_WHITELIST=(
    "server/app/router/system.js"
    "server/app/extend/config.js"
    "admin/src/api/article.ts"
)

parse_args "$@"
if [[ -z "${TARGET_ROOT_ARG}" ]]; then
    print_usage
    exit 1
fi
install_content_manage_module "${TARGET_ROOT_ARG}"
