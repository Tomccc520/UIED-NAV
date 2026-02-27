-- ============================================
-- UIED 每日热榜菜单与权限补丁（可重复执行）
-- 目标：
-- 1) 在运营管理下增加“每日热榜”菜单
-- 2) 增加配置读取/保存、平台列表、聚合查询、刷新权限
-- 3) 自动授权给超级管理员（role_id=1）
-- ============================================

SET NAMES utf8mb4;
START TRANSACTION;

INSERT INTO la_system_auth_menu
(id, pid, menu_type, menu_name, menu_icon, menu_sort, perms, paths, component, selected, params, is_cache, is_show, is_disable, create_time, update_time)
VALUES
(910, 815, 'C', '每日热榜', 'el-icon-TrendCharts', 44, 'uied:dailyHot:index', 'daily-hot', 'uied/dailyHot/index', '/uied/daily-hot', '', 0, 1, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP())
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
(911, 910, 'A', '每日热榜配置读取', '', 10, 'uied:dailyHot:config:get', '', '', '', '', 0, 1, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(912, 910, 'A', '每日热榜配置保存', '', 11, 'uied:dailyHot:config:save', '', '', '', '', 0, 1, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(913, 910, 'A', '每日热榜平台列表', '', 12, 'uied:dailyHot:platforms', '', '', '', '', 0, 1, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(914, 910, 'A', '每日热榜聚合查询', '', 13, 'uied:dailyHot:list', '', '', '', '', 0, 1, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(915, 910, 'A', '每日热榜刷新', '', 14, 'uied:dailyHot:refresh', '', '', '', '', 0, 1, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP())
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
SELECT REPLACE(UUID(), '-', ''), r.role_id, m.id
FROM la_system_auth_menu m
JOIN (
  SELECT 0 AS role_id
  UNION ALL
  SELECT 1 AS role_id
) r
LEFT JOIN la_system_auth_perm p ON p.role_id = r.role_id AND p.menu_id = m.id
WHERE m.id IN (910, 911, 912, 913, 914, 915)
  AND p.id IS NULL;

COMMIT;
