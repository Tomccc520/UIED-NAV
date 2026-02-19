-- ============================================
-- UIED 商业版菜单与用户中心扩展权限补丁（可重复执行）
-- 目标：
-- 1) 在 UIED「系统设置」下增加 许可证中心 / 功能开关 菜单
-- 2) 在 用户中心 下增加 用户等级 菜单
-- 3) 补齐用户中心扩展接口权限点（统计/钱包/分组/标签/等级/测试用户初始化）
-- ============================================

SET NAMES utf8mb4;
START TRANSACTION;

-- 许可证中心
INSERT INTO la_system_auth_menu
(id, pid, menu_type, menu_name, menu_icon, menu_sort, perms, paths, component, selected, params, is_cache, is_show, is_disable, create_time, update_time)
VALUES
(864, 814, 'C', '许可证中心', 'el-icon-Key', 40, 'uied:license:info', 'license-center', 'uied/license/index', '/uied/license-center', '', 0, 1, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP())
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
(865, 864, 'A', '许可证保存', '', 10, 'uied:license:save', '', '', '', '', 0, 1, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP())
ON DUPLICATE KEY UPDATE
pid = VALUES(pid),
menu_type = VALUES(menu_type),
menu_name = VALUES(menu_name),
menu_sort = VALUES(menu_sort),
perms = VALUES(perms),
is_show = VALUES(is_show),
is_disable = VALUES(is_disable),
update_time = UNIX_TIMESTAMP();

-- 功能开关
INSERT INTO la_system_auth_menu
(id, pid, menu_type, menu_name, menu_icon, menu_sort, perms, paths, component, selected, params, is_cache, is_show, is_disable, create_time, update_time)
VALUES
(866, 814, 'C', '功能开关', 'el-icon-Switch', 41, 'uied:feature:list', 'feature-toggle', 'uied/feature/index', '/uied/feature-toggle', '', 0, 1, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP())
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
(867, 866, 'A', '功能开关保存', '', 10, 'uied:feature:save', '', '', '', '', 0, 1, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(868, 866, 'A', '功能开关检查', '', 11, 'uied:feature:check', '', '', '', '', 0, 1, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP())
ON DUPLICATE KEY UPDATE
pid = VALUES(pid),
menu_type = VALUES(menu_type),
menu_name = VALUES(menu_name),
menu_sort = VALUES(menu_sort),
perms = VALUES(perms),
is_show = VALUES(is_show),
is_disable = VALUES(is_disable),
update_time = UNIX_TIMESTAMP();

-- 用户等级（临时挂到用户列表页面，前端可后续切到独立页面）
INSERT INTO la_system_auth_menu
(id, pid, menu_type, menu_name, menu_icon, menu_sort, perms, paths, component, selected, params, is_cache, is_show, is_disable, create_time, update_time)
VALUES
(869, 860, 'C', '用户等级', 'el-icon-Medal', 20, 'user:level:list', 'level', 'consumer/level/index', '/user-center/level', '', 0, 1, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP())
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
(870, 869, 'A', '等级新增', '', 10, 'user:level:add', '', '', '', '', 0, 1, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(871, 869, 'A', '等级编辑', '', 11, 'user:level:edit', '', '', '', '', 0, 1, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(872, 869, 'A', '等级删除', '', 12, 'user:level:del', '', '', '', '', 0, 1, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP())
ON DUPLICATE KEY UPDATE
pid = VALUES(pid),
menu_type = VALUES(menu_type),
menu_name = VALUES(menu_name),
menu_sort = VALUES(menu_sort),
perms = VALUES(perms),
is_show = VALUES(is_show),
is_disable = VALUES(is_disable),
update_time = UNIX_TIMESTAMP();

-- 用户中心扩展权限点（挂在“用户列表”下，便于角色授权）
INSERT INTO la_system_auth_menu
(id, pid, menu_type, menu_name, menu_icon, menu_sort, perms, paths, component, selected, params, is_cache, is_show, is_disable, create_time, update_time)
VALUES
(873, 861, 'A', '用户统计', '', 40, 'user:stats', '', '', '', '', 0, 1, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(874, 861, 'A', '钱包调整', '', 41, 'user:wallet:adjust', '', '', '', '', 0, 1, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(875, 861, 'A', '分组列表', '', 42, 'user:group:list', '', '', '', '', 0, 1, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(876, 861, 'A', '分组新增', '', 43, 'user:group:add', '', '', '', '', 0, 1, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(877, 861, 'A', '分组编辑', '', 44, 'user:group:edit', '', '', '', '', 0, 1, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(878, 861, 'A', '分组删除', '', 45, 'user:group:del', '', '', '', '', 0, 1, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(879, 861, 'A', '标签列表', '', 46, 'user:tag:list', '', '', '', '', 0, 1, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(880, 861, 'A', '标签新增', '', 47, 'user:tag:add', '', '', '', '', 0, 1, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(881, 861, 'A', '标签编辑', '', 48, 'user:tag:edit', '', '', '', '', 0, 1, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(882, 861, 'A', '标签删除', '', 49, 'user:tag:del', '', '', '', '', 0, 1, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(883, 861, 'A', '标签绑定', '', 50, 'user:tag:bind', '', '', '', '', 0, 1, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(884, 861, 'A', '测试用户初始化', '', 51, 'user:seed:testUsers', '', '', '', '', 0, 1, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP())
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
WHERE m.id IN (864,865,866,867,868,869,870,871,872,873,874,875,876,877,878,879,880,881,882,883,884)
  AND p.id IS NULL;

COMMIT;
