-- ============================================
-- UIED 每日热榜菜单升级补丁（可重复执行）
-- 目标：
-- 1) 在“每日热榜”菜单下新增平台配置与字段草案权限按钮
-- 2) 自动授权给超级管理员（role_id=1）
-- ============================================

SET NAMES utf8mb4;
START TRANSACTION;

INSERT INTO la_system_auth_menu
(id, pid, menu_type, menu_name, menu_icon, menu_sort, perms, paths, component, selected, params, is_cache, is_show, is_disable, create_time, update_time)
VALUES
(916, 910, 'A', '热榜平台配置列表', '', 15, 'uied:dailyHot:platformConfig:list', '', '', '', '', 0, 1, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(917, 910, 'A', '热榜平台配置保存', '', 16, 'uied:dailyHot:platformConfig:save', '', '', '', '', 0, 1, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(918, 910, 'A', '热榜平台配置删除', '', 17, 'uied:dailyHot:platformConfig:del', '', '', '', '', 0, 1, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(919, 910, 'A', '热榜字段草案', '', 18, 'uied:dailyHot:schema', '', '', '', '', 0, 1, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP())
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
WHERE m.id IN (916, 917, 918, 919)
  AND p.id IS NULL;

COMMIT;
