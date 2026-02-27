-- ============================================
-- 网站详情页配置菜单补丁（可重复执行）
-- 目标：
-- 1) 在「网站设置 -> 基础配置(980)」下新增「网站详情页配置」
-- 2) 自动授权给 role_id=0/1（兼容历史管理员角色）
-- ============================================

SET NAMES utf8mb4;
START TRANSACTION;

-- 页面菜单（C）
INSERT INTO la_system_auth_menu
(id, pid, menu_type, menu_name, menu_icon, menu_sort, perms, paths, component, selected, params, is_cache, is_show, is_disable, create_time, update_time)
VALUES
(900, 980, 'C', '网站详情页配置', 'el-icon-View', 25, 'uied:setting:get', 'detail-page-config', 'uied/setting/detailPage', '', '', 0, 1, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP())
ON DUPLICATE KEY UPDATE
pid = VALUES(pid),
menu_type = VALUES(menu_type),
menu_name = VALUES(menu_name),
menu_icon = VALUES(menu_icon),
menu_sort = VALUES(menu_sort),
perms = VALUES(perms),
paths = VALUES(paths),
component = VALUES(component),
is_show = VALUES(is_show),
is_disable = VALUES(is_disable),
update_time = UNIX_TIMESTAMP();

-- 角色授权（role 0/1）
INSERT INTO la_system_auth_perm (id, role_id, menu_id)
SELECT REPLACE(UUID(), '-', ''), r.role_id, 900
FROM (
  SELECT 0 AS role_id
  UNION ALL
  SELECT 1 AS role_id
) r
LEFT JOIN la_system_auth_perm p ON p.role_id = r.role_id AND p.menu_id = 900
WHERE p.id IS NULL;

COMMIT;

