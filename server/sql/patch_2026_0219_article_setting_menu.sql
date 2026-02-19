-- ============================================
-- UIED 文章配置菜单补丁（可重复执行）
-- 目标：
-- 1) 在 UIED > 系统设置 下增加“文章配置”入口
-- 2) 补齐文章配置读取/保存权限点
-- ============================================

SET NAMES utf8mb4;
START TRANSACTION;

-- 菜单入口：文章配置（复用站点设置页组件，前端按路由参数区分面板）
INSERT INTO la_system_auth_menu
(id, pid, menu_type, menu_name, menu_icon, menu_sort, perms, paths, component, selected, params, is_cache, is_show, is_disable, create_time, update_time)
VALUES
(890, 814, 'C', '文章配置', 'el-icon-Reading', 42, 'uied:setting:articleConfig', 'article-config', 'uied/articleConfig/index', '/uied/article-config', '', 0, 1, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP())
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

-- 按钮权限：文章配置保存 + 文章专题配置读取/保存
INSERT INTO la_system_auth_menu
(id, pid, menu_type, menu_name, menu_icon, menu_sort, perms, paths, component, selected, params, is_cache, is_show, is_disable, create_time, update_time)
VALUES
(891, 890, 'A', '文章配置保存', '', 10, 'uied:setting:saveArticleConfig', '', '', '', '', 0, 1, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(892, 890, 'A', '文章专题配置读取', '', 11, 'uied:setting:articleTopicsConfig', '', '', '', '', 0, 1, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(893, 890, 'A', '文章专题配置保存', '', 12, 'uied:setting:saveArticleTopicsConfig', '', '', '', '', 0, 1, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP())
ON DUPLICATE KEY UPDATE
pid = VALUES(pid),
menu_type = VALUES(menu_type),
menu_name = VALUES(menu_name),
menu_sort = VALUES(menu_sort),
perms = VALUES(perms),
is_show = VALUES(is_show),
is_disable = VALUES(is_disable),
update_time = UNIX_TIMESTAMP();

-- 授权超级管理员
INSERT INTO la_system_auth_perm (id, role_id, menu_id)
SELECT REPLACE(UUID(), '-', ''), 1, m.id
FROM la_system_auth_menu m
LEFT JOIN la_system_auth_perm p ON p.role_id = 1 AND p.menu_id = m.id
WHERE m.id IN (890, 891, 892, 893)
  AND p.id IS NULL;

COMMIT;
