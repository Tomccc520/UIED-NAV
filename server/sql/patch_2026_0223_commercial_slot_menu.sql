-- ============================================
-- UIED 商业位体系菜单补丁（可重复执行）
-- 目标：
-- 1) 在系统设置下新增“商业位体系”菜单
-- 2) 增加广告位配置/投放记录/字段草案权限按钮
-- 3) 自动授权给超级管理员（role_id=1）
-- ============================================

SET NAMES utf8mb4;
START TRANSACTION;

INSERT INTO la_system_auth_menu
(id, pid, menu_type, menu_name, menu_icon, menu_sort, perms, paths, component, selected, params, is_cache, is_show, is_disable, create_time, update_time)
VALUES
(960, 814, 'C', '商业位体系', 'el-icon-Coin', 48, 'uied:commercialSlot:index', 'commercial-slot', 'uied/commercialSlot/index', '/uied/commercial-slot', '', 0, 1, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP())
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
(961, 960, 'A', '广告位列表', '', 10, 'uied:commercialSlot:slot:list', '', '', '', '', 0, 1, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(962, 960, 'A', '广告位保存', '', 11, 'uied:commercialSlot:slot:save', '', '', '', '', 0, 1, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(963, 960, 'A', '广告位删除', '', 12, 'uied:commercialSlot:slot:del', '', '', '', '', 0, 1, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(964, 960, 'A', '投放记录列表', '', 13, 'uied:commercialSlot:booking:list', '', '', '', '', 0, 1, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(965, 960, 'A', '投放记录保存', '', 14, 'uied:commercialSlot:booking:save', '', '', '', '', 0, 1, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(966, 960, 'A', '投放记录删除', '', 15, 'uied:commercialSlot:booking:del', '', '', '', '', 0, 1, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(967, 960, 'A', '字段草案', '', 16, 'uied:commercialSlot:schema', '', '', '', '', 0, 1, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP())
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
WHERE m.id IN (960, 961, 962, 963, 964, 965, 966, 967)
  AND p.id IS NULL;

COMMIT;
