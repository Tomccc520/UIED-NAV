# 内容管理模块复用说明

## 1. 模块目标

将当前项目的“内容管理能力”抽离为可迁移包，用于其他 likeadmin 项目快速复用，减少二次开发。

覆盖范围：
- 文章分类/标签/专题
- 文章发布与投稿审核
- 评论治理（批量、敏感词、举报、禁言）
- 文章互动（阅读/收藏/点赞）
- 公众号导入与图片转存联动能力

## 2. 目录结构

```text
likeadmin_node/modules/content-manage
├─ manifest.json                # 模块清单
├─ README.md                    # 使用说明
├─ files/                       # 打包快照（由 build 脚本生成）
└─ scripts/
   ├─ build_package.sh          # 从当前仓库生成 files 快照
   └─ install_module.sh         # 安装到目标 likeadmin_node
```

## 3. 在当前项目生成模块包

```bash
cd /Users/tangxiaoda/Desktop/网站备份/new\ fsuied/likeadmin_node/modules/content-manage/scripts
chmod +x build_package.sh install_module.sh
./build_package.sh
```

生成后文件位于：

`/Users/tangxiaoda/Desktop/网站备份/new fsuied/likeadmin_node/modules/content-manage/files`

## 4. 安装到其他 likeadmin 项目

```bash
cd /Users/tangxiaoda/Desktop/网站备份/new\ fsuied/likeadmin_node/modules/content-manage/scripts
./install_module.sh /你的目标项目/likeadmin_node --mode merge
```

说明：
- 默认 `mode=merge`（推荐）：
  - 白名单文件智能合并：`server/app/router/system.js`、`server/app/extend/config.js`、`admin/src/api/article.ts`
  - 非白名单冲突文件不会覆盖，会输出到 `.module_report/.../conflicts/*.new`
- `mode=overwrite`：
  - 直接覆盖同名文件（会自动备份）
- 所有模式都会生成安装报告：`.module_report/content-manage-时间戳/summary.md`

可选参数：

```bash
# 先预演，不落盘（推荐先跑一次）
./install_module.sh /你的目标项目/likeadmin_node --mode merge --dry-run

# 强制覆盖模式
./install_module.sh /你的目标项目/likeadmin_node --force-overwrite
```

## 5. 安装后必做

1. 执行 SQL 补丁

```sql
sql/patch_2026_0214_article_tag_topic_slug.sql
```

2. 重启服务：
- `server`（Egg）
- `admin`（Vite）

3. 自检清单：
- 后台“内容管理”菜单可见
- 文章分类/标签/专题 CRUD 正常
- 标签批量操作与合并正常
- 文章详情 `tags` 返回对象数组（`[{ id, name }]`）
- 评论管理页可查询/批量处理

## 6. 建议接入顺序

1. 先接后端（model/service/controller/router/config）
2. 再接后台（api/views/components）
3. 最后跑 SQL 与菜单权限检查

## 7. API 文档入口

主文档：

`/Users/tangxiaoda/Desktop/网站备份/new fsuied/docs/api/CONTENT_MANAGE_ARTICLE_API_2026-02-09.md`

## 8. 注意事项

- 当前模块依赖 `user` 相关扩展能力（作者中心、消息通知、文章收藏/点赞列表）。
- 如目标项目已深度改造 `server/app/service/user.js`，建议先对比再合并，避免覆盖业务逻辑。
- 若目标项目没有 `article` 历史数据，建议先在测试环境安装验证，再进生产。
