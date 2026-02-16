-- UIED 内容管理分组拆分脚本
-- 目标：将 “内容管理(812)” 下的子菜单拆分为 “网址管理” 与 “文章管理”
-- 可重复执行

SET NAMES utf8mb4;
START TRANSACTION;

-- 一级分组：网址管理
INSERT INTO la_system_auth_menu
(id, pid, menu_type, menu_name, menu_icon, menu_sort, perms, paths, component, selected, params, is_cache, is_show, is_disable, create_time, update_time)
VALUES
(857, 812, 'M', '网址管理', 'el-icon-Connection', 10, '', 'website-manage', '', '', '', 0, 1, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP())
ON DUPLICATE KEY UPDATE
pid = VALUES(pid), menu_type = VALUES(menu_type), menu_name = VALUES(menu_name), menu_icon = VALUES(menu_icon),
menu_sort = VALUES(menu_sort), perms = VALUES(perms), paths = VALUES(paths), component = VALUES(component),
is_cache = VALUES(is_cache), is_show = VALUES(is_show), is_disable = VALUES(is_disable), update_time = UNIX_TIMESTAMP();

-- 一级分组：文章管理
INSERT INTO la_system_auth_menu
(id, pid, menu_type, menu_name, menu_icon, menu_sort, perms, paths, component, selected, params, is_cache, is_show, is_disable, create_time, update_time)
VALUES
(858, 812, 'M', '文章管理', 'el-icon-Reading', 20, '', 'article-manage', '', '', '', 0, 1, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP())
ON DUPLICATE KEY UPDATE
pid = VALUES(pid), menu_type = VALUES(menu_type), menu_name = VALUES(menu_name), menu_icon = VALUES(menu_icon),
menu_sort = VALUES(menu_sort), perms = VALUES(perms), paths = VALUES(paths), component = VALUES(component),
is_cache = VALUES(is_cache), is_show = VALUES(is_show), is_disable = VALUES(is_disable), update_time = UNIX_TIMESTAMP();

-- 迁移“网址管理”菜单
UPDATE la_system_auth_menu SET pid = 857, menu_sort = 10, update_time = UNIX_TIMESTAMP() WHERE id = 703; -- 网站管理
UPDATE la_system_auth_menu SET pid = 857, menu_sort = 20, update_time = UNIX_TIMESTAMP() WHERE id = 704; -- 分类管理
UPDATE la_system_auth_menu SET pid = 857, menu_sort = 30, update_time = UNIX_TIMESTAMP() WHERE id = 711; -- 页面管理
UPDATE la_system_auth_menu SET pid = 857, menu_sort = 40, update_time = UNIX_TIMESTAMP() WHERE id = 720; -- 网站标签
UPDATE la_system_auth_menu SET pid = 857, menu_sort = 50, update_time = UNIX_TIMESTAMP() WHERE id = 712; -- 热门推荐

-- 迁移“文章管理”菜单
UPDATE la_system_auth_menu SET pid = 858, menu_sort = 10, update_time = UNIX_TIMESTAMP() WHERE id = 725; -- UIED文章管理
UPDATE la_system_auth_menu SET pid = 858, menu_sort = 20, update_time = UNIX_TIMESTAMP() WHERE id = 816; -- 文章中心
UPDATE la_system_auth_menu SET pid = 858, menu_sort = 21, update_time = UNIX_TIMESTAMP() WHERE id = 817; -- 文章编辑(隐藏)
UPDATE la_system_auth_menu SET pid = 858, menu_sort = 30, update_time = UNIX_TIMESTAMP() WHERE id = 823; -- 文章栏目
UPDATE la_system_auth_menu SET pid = 858, menu_sort = 40, update_time = UNIX_TIMESTAMP() WHERE id = 829; -- 文章标签
UPDATE la_system_auth_menu SET pid = 858, menu_sort = 50, update_time = UNIX_TIMESTAMP() WHERE id = 838; -- 文章专题
UPDATE la_system_auth_menu SET pid = 858, menu_sort = 60, update_time = UNIX_TIMESTAMP() WHERE id = 844; -- 评论管理

COMMIT;
