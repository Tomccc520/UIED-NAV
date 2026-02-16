-- UIED 后台“用户中心”菜单安装脚本（可重复执行）
-- 目标：
-- 1) 在 UIED导航 下新增“用户中心”
-- 2) 挂载用户列表/详情页面及编辑按钮权限
-- 3) 自动授权给超级管理员角色（role_id = 1）
--
-- 执行方式：
-- docker exec -i uied_mysql mysql --default-character-set=utf8mb4 -u uied -puied123456 -D uied_nav < server/sql/uied_user_center_menu_install.sql

SET NAMES utf8mb4;
START TRANSACTION;

-- 若 UIED 导航主菜单缺失，则补一个默认入口（ID=702）
INSERT INTO la_system_auth_menu
(id, pid, menu_type, menu_name, menu_icon, menu_sort, perms, paths, component, selected, params, is_cache, is_show, is_disable, create_time, update_time)
SELECT
  702, 0, 'M', 'UIED导航', 'el-icon-Compass', 5, '', 'uied', '', '', '', 0, 1, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()
WHERE NOT EXISTS (
  SELECT 1 FROM la_system_auth_menu WHERE id = 702
);

-- 上级菜单：用户中心
INSERT INTO la_system_auth_menu
(id, pid, menu_type, menu_name, menu_icon, menu_sort, perms, paths, component, selected, params, is_cache, is_show, is_disable, create_time, update_time)
VALUES
(860, 702, 'M', '用户中心', 'el-icon-UserFilled', 37, '', 'user-center', '', '', '', 0, 1, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP())
ON DUPLICATE KEY UPDATE
pid = VALUES(pid),
menu_type = VALUES(menu_type),
menu_name = VALUES(menu_name),
menu_icon = VALUES(menu_icon),
menu_sort = VALUES(menu_sort),
paths = VALUES(paths),
component = VALUES(component),
is_cache = VALUES(is_cache),
is_show = VALUES(is_show),
is_disable = VALUES(is_disable),
update_time = UNIX_TIMESTAMP();

-- 页面菜单：用户列表
INSERT INTO la_system_auth_menu
(id, pid, menu_type, menu_name, menu_icon, menu_sort, perms, paths, component, selected, params, is_cache, is_show, is_disable, create_time, update_time)
VALUES
(861, 860, 'C', '用户列表', 'el-icon-User', 10, 'user:list', 'consumer', 'consumer/lists/index', '', '', 1, 1, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP())
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

-- 隐藏路由：用户详情（用于详情页高亮与权限校验）
INSERT INTO la_system_auth_menu
(id, pid, menu_type, menu_name, menu_icon, menu_sort, perms, paths, component, selected, params, is_cache, is_show, is_disable, create_time, update_time)
VALUES
(862, 861, 'C', '用户详情', '', 20, 'user:detail', 'detail', 'consumer/lists/detail', '/consumer/lists', '', 0, 0, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP())
ON DUPLICATE KEY UPDATE
pid = VALUES(pid),
menu_type = VALUES(menu_type),
menu_name = VALUES(menu_name),
menu_sort = VALUES(menu_sort),
perms = VALUES(perms),
paths = VALUES(paths),
component = VALUES(component),
selected = VALUES(selected),
is_cache = VALUES(is_cache),
is_show = VALUES(is_show),
is_disable = VALUES(is_disable),
update_time = UNIX_TIMESTAMP();

-- 按钮权限：用户编辑
INSERT INTO la_system_auth_menu
(id, pid, menu_type, menu_name, menu_icon, menu_sort, perms, paths, component, selected, params, is_cache, is_show, is_disable, create_time, update_time)
VALUES
(863, 861, 'A', '用户编辑', '', 30, 'user:edit', '', '', '', '', 0, 1, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP())
ON DUPLICATE KEY UPDATE
pid = VALUES(pid),
menu_type = VALUES(menu_type),
menu_name = VALUES(menu_name),
menu_sort = VALUES(menu_sort),
perms = VALUES(perms),
is_show = VALUES(is_show),
is_disable = VALUES(is_disable),
update_time = UNIX_TIMESTAMP();

-- 授权超级管理员（role_id=1）
INSERT INTO la_system_auth_perm (id, role_id, menu_id)
SELECT REPLACE(UUID(), '-', ''), 1, m.id
FROM la_system_auth_menu m
LEFT JOIN la_system_auth_perm p ON p.role_id = 1 AND p.menu_id = m.id
WHERE m.id IN (860, 861, 862, 863)
  AND p.id IS NULL;

COMMIT;
