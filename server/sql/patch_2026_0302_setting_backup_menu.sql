-- ============================================
-- 系统维护新增“设置备份”菜单（可重复执行）
-- 目标：
-- 1) 在 系统设置 -> 系统维护 下增加“设置备份”页面菜单
-- 2) 自动授权给超级管理员与默认管理员角色（role_id=0/1）
-- ============================================

SET NAMES utf8mb4;
START TRANSACTION;

INSERT INTO la_system_auth_menu
(id, pid, menu_type, menu_name, menu_icon, menu_sort, perms, paths, component, selected, params, is_cache, is_show, is_disable, create_time, update_time)
VALUES
(554, 550, 'C', '设置备份', '', 0, 'setting:system:backup', 'setting-backup', 'setting/system/setting-backup', '', '', 0, 1, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP())
ON DUPLICATE KEY UPDATE
pid = VALUES(pid),
menu_type = VALUES(menu_type),
menu_name = VALUES(menu_name),
menu_sort = VALUES(menu_sort),
perms = VALUES(perms),
paths = VALUES(paths),
component = VALUES(component),
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
WHERE m.id IN (554)
  AND p.id IS NULL;

COMMIT;
