-- ============================================
-- UIED 榜单系统菜单补丁（可重复执行）
-- 目标：
-- 1) 在系统设置下新增“榜单系统”菜单
-- 2) 增加配置读写与预览权限按钮
-- 3) 自动授权给超级管理员（role_id=1）
-- ============================================

SET NAMES utf8mb4;
START TRANSACTION;

INSERT INTO la_system_auth_menu
(id, pid, menu_type, menu_name, menu_icon, menu_sort, perms, paths, component, selected, params, is_cache, is_show, is_disable, create_time, update_time)
VALUES
(920, 814, 'C', '榜单系统', 'el-icon-Histogram', 45, 'uied:rankBoard:index', 'rank-board', 'uied/rankBoard/index', '/uied/rank-board', '', 0, 1, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP())
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
(921, 920, 'A', '榜单配置读取', '', 10, 'uied:rankBoard:config:list', '', '', '', '', 0, 1, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(922, 920, 'A', '榜单配置保存', '', 11, 'uied:rankBoard:config:save', '', '', '', '', 0, 1, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(923, 920, 'A', '榜单聚合查询', '', 12, 'uied:rankBoard:list', '', '', '', '', 0, 1, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(924, 920, 'A', '榜单预览', '', 13, 'uied:rankBoard:preview', '', '', '', '', 0, 1, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(925, 920, 'A', '榜单字段草案', '', 14, 'uied:rankBoard:schema', '', '', '', '', 0, 1, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP())
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
WHERE m.id IN (920, 921, 922, 923, 924, 925)
  AND p.id IS NULL;

COMMIT;
