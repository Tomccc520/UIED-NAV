#!/usr/bin/env bash

set -euo pipefail

##
# 计算脚本根路径
# 说明：模块目录结构固定为 likeadmin_node/modules/content-manage/scripts
##
get_module_root() {
    local script_dir
    script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    cd "${script_dir}/.." && pwd
}

##
# 计算项目根路径
# 返回：仓库根目录（new fsuied）
##
get_repo_root() {
    local module_root
    module_root="$(get_module_root)"
    cd "${module_root}/../../.." && pwd
}

##
# 按相对路径复制文件到模块包 files 目录
# 参数：
#   $1 相对仓库根路径
##
copy_rel_file() {
    local rel_path="$1"
    local repo_root
    local module_root
    local source_file
    local target_file
    repo_root="$(get_repo_root)"
    module_root="$(get_module_root)"
    source_file="${repo_root}/${rel_path}"
    target_file="${module_root}/files/${rel_path}"

    if [[ ! -f "${source_file}" ]]; then
        echo "[WARN] 跳过不存在文件: ${rel_path}"
        return 0
    fi

    mkdir -p "$(dirname "${target_file}")"
    cp "${source_file}" "${target_file}"
    echo "[COPY] ${rel_path}"
}

##
# 构建内容管理模块文件快照
# 说明：将 manifest 中约定的核心文件打包到 modules/content-manage/files
##
build_content_manage_package() {
    local module_root
    module_root="$(get_module_root)"

    rm -rf "${module_root}/files"
    mkdir -p "${module_root}/files"

    # 后端核心
    copy_rel_file "likeadmin_node/server/app/controller/article.js"
    copy_rel_file "likeadmin_node/server/app/controller/user.js"
    copy_rel_file "likeadmin_node/server/app/service/article.js"
    copy_rel_file "likeadmin_node/server/app/service/user.js"
    copy_rel_file "likeadmin_node/server/app/middleware/auth.js"
    copy_rel_file "likeadmin_node/server/app/extend/config.js"
    copy_rel_file "likeadmin_node/server/app/router/system.js"
    copy_rel_file "likeadmin_node/server/app/model/article.js"
    copy_rel_file "likeadmin_node/server/app/model/articleCategory.js"
    copy_rel_file "likeadmin_node/server/app/model/articleTag.js"
    copy_rel_file "likeadmin_node/server/app/model/articleTagRel.js"
    copy_rel_file "likeadmin_node/server/app/model/articleTopic.js"
    copy_rel_file "likeadmin_node/server/app/model/articleTopicRel.js"
    copy_rel_file "likeadmin_node/server/app/model/articleCollect.js"
    copy_rel_file "likeadmin_node/server/app/model/articleLike.js"
    copy_rel_file "likeadmin_node/server/app/model/articleComment.js"
    copy_rel_file "likeadmin_node/server/app/model/articleAuthorRel.js"
    copy_rel_file "likeadmin_node/server/app/model/userMessage.js"
    copy_rel_file "likeadmin_node/server/app/model/userAuthorProfile.js"
    copy_rel_file "likeadmin_node/server/app/model/userIdentity.js"

    # 管理后台核心
    copy_rel_file "likeadmin_node/admin/src/api/article.ts"
    copy_rel_file "likeadmin_node/admin/src/views/article/comment/index.vue"
    copy_rel_file "likeadmin_node/admin/src/views/article/lists/index.vue"
    copy_rel_file "likeadmin_node/admin/src/views/article/lists/edit.vue"
    copy_rel_file "likeadmin_node/admin/src/views/article/tag/index.vue"
    copy_rel_file "likeadmin_node/admin/src/views/article/tag/edit.vue"
    copy_rel_file "likeadmin_node/admin/src/views/article/topic/index.vue"
    copy_rel_file "likeadmin_node/admin/src/views/article/topic/edit.vue"
    copy_rel_file "likeadmin_node/admin/src/components/editor/index.vue"
    copy_rel_file "likeadmin_node/admin/src/components/ai-editor/index.vue"
    copy_rel_file "likeadmin_node/admin/src/components/material/index.vue"
    copy_rel_file "likeadmin_node/admin/src/components/material/hook.ts"

    # SQL + 文档
    copy_rel_file "likeadmin_node/sql/patch_2026_0214_article_tag_topic_slug.sql"
    copy_rel_file "docs/api/CONTENT_MANAGE_ARTICLE_API_2026-02-09.md"

    echo ""
    echo "内容管理模块打包完成：${module_root}/files"
}

build_content_manage_package
