-- UIED 内容管理模块后台菜单安装脚本
-- 作用：把 article 内容管理菜单挂载到 UIED导航 > 内容管理（pid=812）
-- 说明：使用固定 ID（816-856），支持重复执行（ON DUPLICATE KEY UPDATE）

SET NAMES utf8mb4;
START TRANSACTION;

-- 文章中心（列表）
INSERT INTO la_system_auth_menu
(id, pid, menu_type, menu_name, menu_icon, menu_sort, perms, paths, component, selected, params, is_cache, is_show, is_disable, create_time, update_time)
VALUES
(816, 812, 'C', '文章中心', 'el-icon-Reading', 35, 'article:list', 'article/lists', 'article/lists/index', '', '', 1, 1, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP())
ON DUPLICATE KEY UPDATE
pid = VALUES(pid), menu_type = VALUES(menu_type), menu_name = VALUES(menu_name), menu_icon = VALUES(menu_icon),
menu_sort = VALUES(menu_sort), perms = VALUES(perms), paths = VALUES(paths), component = VALUES(component),
is_cache = VALUES(is_cache), is_show = VALUES(is_show), is_disable = VALUES(is_disable), update_time = UNIX_TIMESTAMP();

-- 文章编辑页（隐藏，用于 getRoutePath('article:add/edit') 跳转）
INSERT INTO la_system_auth_menu
(id, pid, menu_type, menu_name, menu_icon, menu_sort, perms, paths, component, selected, params, is_cache, is_show, is_disable, create_time, update_time)
VALUES
(817, 812, 'C', '文章编辑', '', 0, 'article:add/edit', 'article/add/edit', 'article/lists/edit', '/uied/content/article/lists', '', 0, 0, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP())
ON DUPLICATE KEY UPDATE
pid = VALUES(pid), menu_type = VALUES(menu_type), menu_name = VALUES(menu_name), menu_sort = VALUES(menu_sort),
perms = VALUES(perms), paths = VALUES(paths), component = VALUES(component), selected = VALUES(selected),
is_cache = VALUES(is_cache), is_show = VALUES(is_show), is_disable = VALUES(is_disable), update_time = UNIX_TIMESTAMP();

-- 文章中心按钮权限
INSERT INTO la_system_auth_menu
(id, pid, menu_type, menu_name, menu_icon, menu_sort, perms, paths, component, selected, params, is_cache, is_show, is_disable, create_time, update_time)
VALUES
(818, 816, 'A', '文章新增', '', 1, 'article:add', '', '', '', '', 0, 1, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(819, 816, 'A', '文章编辑操作', '', 2, 'article:edit', '', '', '', '', 0, 1, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(820, 816, 'A', '文章删除', '', 3, 'article:del', '', '', '', '', 0, 1, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(821, 816, 'A', '文章状态', '', 4, 'article:change', '', '', '', '', 0, 1, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(822, 816, 'A', '文章栏目状态', '', 5, 'article:cate:change:list', '', '', '', '', 0, 1, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP())
ON DUPLICATE KEY UPDATE
pid = VALUES(pid), menu_type = VALUES(menu_type), menu_name = VALUES(menu_name), menu_sort = VALUES(menu_sort),
perms = VALUES(perms), is_show = VALUES(is_show), is_disable = VALUES(is_disable), update_time = UNIX_TIMESTAMP();

-- 文章栏目
INSERT INTO la_system_auth_menu
(id, pid, menu_type, menu_name, menu_icon, menu_sort, perms, paths, component, selected, params, is_cache, is_show, is_disable, create_time, update_time)
VALUES
(823, 812, 'C', '文章栏目', 'el-icon-CollectionTag', 36, 'article:cate:list', 'article/column', 'article/column/index', '', '', 1, 1, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP())
ON DUPLICATE KEY UPDATE
pid = VALUES(pid), menu_type = VALUES(menu_type), menu_name = VALUES(menu_name), menu_icon = VALUES(menu_icon),
menu_sort = VALUES(menu_sort), perms = VALUES(perms), paths = VALUES(paths), component = VALUES(component),
is_cache = VALUES(is_cache), is_show = VALUES(is_show), is_disable = VALUES(is_disable), update_time = UNIX_TIMESTAMP();

INSERT INTO la_system_auth_menu
(id, pid, menu_type, menu_name, menu_icon, menu_sort, perms, paths, component, selected, params, is_cache, is_show, is_disable, create_time, update_time)
VALUES
(824, 823, 'A', '栏目详情', '', 1, 'article:cate:detail', '', '', '', '', 0, 1, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(825, 823, 'A', '栏目新增', '', 2, 'article:cate:add', '', '', '', '', 0, 1, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(826, 823, 'A', '栏目编辑', '', 3, 'article:cate:edit', '', '', '', '', 0, 1, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(827, 823, 'A', '栏目删除', '', 4, 'article:cate:del', '', '', '', '', 0, 1, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(828, 823, 'A', '栏目状态', '', 5, 'article:cate:change', '', '', '', '', 0, 1, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP())
ON DUPLICATE KEY UPDATE
pid = VALUES(pid), menu_type = VALUES(menu_type), menu_name = VALUES(menu_name), menu_sort = VALUES(menu_sort),
perms = VALUES(perms), is_show = VALUES(is_show), is_disable = VALUES(is_disable), update_time = UNIX_TIMESTAMP();

-- 文章标签
INSERT INTO la_system_auth_menu
(id, pid, menu_type, menu_name, menu_icon, menu_sort, perms, paths, component, selected, params, is_cache, is_show, is_disable, create_time, update_time)
VALUES
(829, 812, 'C', '文章标签', 'el-icon-PriceTag', 37, 'article:tag:list', 'article/tag', 'article/tag/index', '', '', 1, 1, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP())
ON DUPLICATE KEY UPDATE
pid = VALUES(pid), menu_type = VALUES(menu_type), menu_name = VALUES(menu_name), menu_icon = VALUES(menu_icon),
menu_sort = VALUES(menu_sort), perms = VALUES(perms), paths = VALUES(paths), component = VALUES(component),
is_cache = VALUES(is_cache), is_show = VALUES(is_show), is_disable = VALUES(is_disable), update_time = UNIX_TIMESTAMP();

INSERT INTO la_system_auth_menu
(id, pid, menu_type, menu_name, menu_icon, menu_sort, perms, paths, component, selected, params, is_cache, is_show, is_disable, create_time, update_time)
VALUES
(830, 829, 'A', '标签详情', '', 1, 'article:tag:detail', '', '', '', '', 0, 1, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(831, 829, 'A', '标签新增', '', 2, 'article:tag:add', '', '', '', '', 0, 1, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(832, 829, 'A', '标签编辑', '', 3, 'article:tag:edit', '', '', '', '', 0, 1, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(833, 829, 'A', '标签删除', '', 4, 'article:tag:del', '', '', '', '', 0, 1, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(834, 829, 'A', '标签状态', '', 5, 'article:tag:change', '', '', '', '', 0, 1, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(835, 829, 'A', '标签批量状态', '', 6, 'article:tag:batch:change', '', '', '', '', 0, 1, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(836, 829, 'A', '标签批量删除', '', 7, 'article:tag:batch:del', '', '', '', '', 0, 1, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(837, 829, 'A', '标签合并', '', 8, 'article:tag:merge', '', '', '', '', 0, 1, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP())
ON DUPLICATE KEY UPDATE
pid = VALUES(pid), menu_type = VALUES(menu_type), menu_name = VALUES(menu_name), menu_sort = VALUES(menu_sort),
perms = VALUES(perms), is_show = VALUES(is_show), is_disable = VALUES(is_disable), update_time = UNIX_TIMESTAMP();

-- 文章专题
INSERT INTO la_system_auth_menu
(id, pid, menu_type, menu_name, menu_icon, menu_sort, perms, paths, component, selected, params, is_cache, is_show, is_disable, create_time, update_time)
VALUES
(838, 812, 'C', '文章专题', 'el-icon-Tickets', 38, 'article:topic:list', 'article/topic', 'article/topic/index', '', '', 1, 1, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP())
ON DUPLICATE KEY UPDATE
pid = VALUES(pid), menu_type = VALUES(menu_type), menu_name = VALUES(menu_name), menu_icon = VALUES(menu_icon),
menu_sort = VALUES(menu_sort), perms = VALUES(perms), paths = VALUES(paths), component = VALUES(component),
is_cache = VALUES(is_cache), is_show = VALUES(is_show), is_disable = VALUES(is_disable), update_time = UNIX_TIMESTAMP();

INSERT INTO la_system_auth_menu
(id, pid, menu_type, menu_name, menu_icon, menu_sort, perms, paths, component, selected, params, is_cache, is_show, is_disable, create_time, update_time)
VALUES
(839, 838, 'A', '专题详情', '', 1, 'article:topic:detail', '', '', '', '', 0, 1, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(840, 838, 'A', '专题新增', '', 2, 'article:topic:add', '', '', '', '', 0, 1, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(841, 838, 'A', '专题编辑', '', 3, 'article:topic:edit', '', '', '', '', 0, 1, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(842, 838, 'A', '专题删除', '', 4, 'article:topic:del', '', '', '', '', 0, 1, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(843, 838, 'A', '专题状态', '', 5, 'article:topic:change', '', '', '', '', 0, 1, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP())
ON DUPLICATE KEY UPDATE
pid = VALUES(pid), menu_type = VALUES(menu_type), menu_name = VALUES(menu_name), menu_sort = VALUES(menu_sort),
perms = VALUES(perms), is_show = VALUES(is_show), is_disable = VALUES(is_disable), update_time = UNIX_TIMESTAMP();

-- 评论管理
INSERT INTO la_system_auth_menu
(id, pid, menu_type, menu_name, menu_icon, menu_sort, perms, paths, component, selected, params, is_cache, is_show, is_disable, create_time, update_time)
VALUES
(844, 812, 'C', '评论管理', 'el-icon-ChatDotRound', 39, 'article:comment:manage:list', 'article/comment', 'article/comment/index', '', '', 1, 1, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP())
ON DUPLICATE KEY UPDATE
pid = VALUES(pid), menu_type = VALUES(menu_type), menu_name = VALUES(menu_name), menu_icon = VALUES(menu_icon),
menu_sort = VALUES(menu_sort), perms = VALUES(perms), paths = VALUES(paths), component = VALUES(component),
is_cache = VALUES(is_cache), is_show = VALUES(is_show), is_disable = VALUES(is_disable), update_time = UNIX_TIMESTAMP();

INSERT INTO la_system_auth_menu
(id, pid, menu_type, menu_name, menu_icon, menu_sort, perms, paths, component, selected, params, is_cache, is_show, is_disable, create_time, update_time)
VALUES
(845, 844, 'A', '评论回复列表', '', 1, 'article:comment:manage:replies', '', '', '', '', 0, 1, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(846, 844, 'A', '评论状态', '', 2, 'article:comment:manage:change', '', '', '', '', 0, 1, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(847, 844, 'A', '评论删除', '', 3, 'article:comment:manage:del', '', '', '', '', 0, 1, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(848, 844, 'A', '评论批量状态', '', 4, 'article:comment:manage:batch:change', '', '', '', '', 0, 1, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(849, 844, 'A', '评论批量删除', '', 5, 'article:comment:manage:batch:del', '', '', '', '', 0, 1, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(850, 844, 'A', '敏感词详情', '', 6, 'article:comment:manage:sensitive:detail', '', '', '', '', 0, 1, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(851, 844, 'A', '敏感词保存', '', 7, 'article:comment:manage:sensitive:save', '', '', '', '', 0, 1, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(852, 844, 'A', '举报列表', '', 8, 'article:comment:manage:report:list', '', '', '', '', 0, 1, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(853, 844, 'A', '举报处理', '', 9, 'article:comment:manage:report:handle', '', '', '', '', 0, 1, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(854, 844, 'A', '禁言列表', '', 10, 'article:comment:manage:mute:list', '', '', '', '', 0, 1, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(855, 844, 'A', '禁言新增', '', 11, 'article:comment:manage:mute:add', '', '', '', '', 0, 1, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(856, 844, 'A', '禁言删除', '', 12, 'article:comment:manage:mute:del', '', '', '', '', 0, 1, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP())
ON DUPLICATE KEY UPDATE
pid = VALUES(pid), menu_type = VALUES(menu_type), menu_name = VALUES(menu_name), menu_sort = VALUES(menu_sort),
perms = VALUES(perms), is_show = VALUES(is_show), is_disable = VALUES(is_disable), update_time = UNIX_TIMESTAMP();

COMMIT;
