-- ============================================
-- UIED 投稿激励闭环菜单补丁（可重复执行）
-- 目标：
-- 1) 在系统设置下新增“投稿激励”菜单
-- 2) 增加积分设置/勋章/推荐位/用户/日志/草案权限按钮
-- 3) 自动授权给超级管理员（role_id=1）
-- ============================================

SET NAMES utf8mb4;
START TRANSACTION;

INSERT INTO la_system_auth_menu
(id, pid, menu_type, menu_name, menu_icon, menu_sort, perms, paths, component, selected, params, is_cache, is_show, is_disable, create_time, update_time)
VALUES
(940, 814, 'C', '投稿激励', 'el-icon-StarFilled', 47, 'uied:contribution:index', 'contribution', 'uied/contribution/index', '/uied/contribution', '', 0, 1, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP())
ON DUPLICATE KEY UPDATE
pid = VALUES(pid),
menu_type = VALUES(menu_type),
menu_name = VALUES(menu_name),
menu_icon = VALUES(menu_icon),
menu_sort = VALUES(menu_sort),
perms = VALUES(perms),
paths = VALUES(paths),
component = VALUES(component),
selected = VALUES(selected),
is_cache = VALUES(is_cache),
is_show = VALUES(is_show),
is_disable = VALUES(is_disable),
update_time = UNIX_TIMESTAMP();

INSERT INTO la_system_auth_menu
(id, pid, menu_type, menu_name, menu_icon, menu_sort, perms, paths, component, selected, params, is_cache, is_show, is_disable, create_time, update_time)
VALUES
(941, 940, 'A', '积分设置读取', '', 10, 'uied:contribution:settings:get', '', '', '', '', 0, 1, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(942, 940, 'A', '积分设置保存', '', 11, 'uied:contribution:settings:save', '', '', '', '', 0, 1, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(943, 940, 'A', '勋章列表', '', 12, 'uied:contribution:badge:list', '', '', '', '', 0, 1, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(944, 940, 'A', '勋章保存', '', 13, 'uied:contribution:badge:save', '', '', '', '', 0, 1, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(945, 940, 'A', '勋章删除', '', 14, 'uied:contribution:badge:del', '', '', '', '', 0, 1, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(946, 940, 'A', '推荐位列表', '', 15, 'uied:contribution:featured:list', '', '', '', '', 0, 1, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(947, 940, 'A', '推荐位保存', '', 16, 'uied:contribution:featured:save', '', '', '', '', 0, 1, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(948, 940, 'A', '推荐位删除', '', 17, 'uied:contribution:featured:del', '', '', '', '', 0, 1, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(949, 940, 'A', '用户积分列表', '', 18, 'uied:contribution:user:list', '', '', '', '', 0, 1, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(950, 940, 'A', '用户积分详情', '', 19, 'uied:contribution:user:detail', '', '', '', '', 0, 1, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(951, 940, 'A', '积分日志', '', 20, 'uied:contribution:log:list', '', '', '', '', 0, 1, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(952, 940, 'A', '排行榜', '', 21, 'uied:contribution:leaderboard', '', '', '', '', 0, 1, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(953, 940, 'A', '字段草案', '', 22, 'uied:contribution:schema', '', '', '', '', 0, 1, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP())
ON DUPLICATE KEY UPDATE
pid = VALUES(pid),
menu_type = VALUES(menu_type),
menu_name = VALUES(menu_name),
menu_sort = VALUES(menu_sort),
perms = VALUES(perms),
is_show = VALUES(is_show),
is_disable = VALUES(is_disable),
update_time = UNIX_TIMESTAMP();

INSERT INTO la_system_auth_perm (id, role_id, menu_id)
SELECT REPLACE(UUID(), '-', ''), 1, m.id
FROM la_system_auth_menu m
LEFT JOIN la_system_auth_perm p ON p.role_id = 1 AND p.menu_id = m.id
WHERE m.id IN (940, 941, 942, 943, 944, 945, 946, 947, 948, 949, 950, 951, 952, 953)
  AND p.id IS NULL;

COMMIT;
