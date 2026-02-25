# 内容管理模块安装报告

- 安装模式：merge
- Dry Run：false
- 目标目录：/Users/tangxiaoda/Desktop/网站备份/HAO UIED/server
- 备份目录：/Users/tangxiaoda/Desktop/网站备份/HAO UIED/server/.module_backup/content-manage-20260216_163040
- 报告目录：/Users/tangxiaoda/Desktop/网站备份/HAO UIED/server/.module_report/content-manage-20260216_163040

## 已安装

| 文件 | 结果 |
| --- | --- |
| admin/src/components/ai-editor/index.vue | 新增文件 |
| admin/src/views/article/comment/index.vue | 新增文件 |
| admin/src/views/article/topic/index.vue | 新增文件 |
| admin/src/views/article/topic/edit.vue | 新增文件 |
| admin/src/views/article/tag/index.vue | 新增文件 |
| admin/src/views/article/tag/edit.vue | 新增文件 |
| server/app/controller/user.js | 新增文件 |
| server/app/controller/article.js | 新增文件 |
| server/app/model/userIdentity.js | 新增文件 |
| server/app/model/articleTag.js | 新增文件 |
| server/app/model/articleTagRel.js | 新增文件 |
| server/app/model/articleComment.js | 新增文件 |
| server/app/model/userMessage.js | 新增文件 |
| server/app/model/articleTopicRel.js | 新增文件 |
| server/app/model/articleAuthorRel.js | 新增文件 |
| server/app/model/articleLike.js | 新增文件 |
| server/app/model/userAuthorProfile.js | 新增文件 |
| server/app/model/articleTopic.js | 新增文件 |
| server/app/service/user.js | 新增文件 |
| server/app/service/article.js | 新增文件 |
| sql/patch_2026_0214_article_tag_topic_slug.sql | 新增文件 |

## 已合并

| 文件 | 结果 |
| --- | --- |
| admin/src/api/article.ts | 合并成功 |
| server/app/extend/config.js | 合并成功 |
| server/app/router/system.js | 合并成功 |

## 已跳过

| 文件 | 原因 |
| --- | --- |

## 冲突待处理

| 文件 | 原因 |
| --- | --- |
| admin/src/components/material/index.vue | 非白名单文件，默认不覆盖 |
| admin/src/components/material/hook.ts | 非白名单文件，默认不覆盖 |
| admin/src/components/editor/index.vue | 非白名单文件，默认不覆盖 |
| admin/src/views/article/lists/index.vue | 非白名单文件，默认不覆盖 |
| admin/src/views/article/lists/edit.vue | 非白名单文件，默认不覆盖 |
| server/app/middleware/auth.js | 非白名单文件，默认不覆盖 |
| server/app/model/articleCategory.js | 非白名单文件，默认不覆盖 |
| server/app/model/articleCollect.js | 非白名单文件，默认不覆盖 |
| server/app/model/article.js | 非白名单文件，默认不覆盖 |
