-- UIED 后台菜单主菜单收敛脚本
-- 目标：
-- 1) “网址管理(857)”与“文章管理(858)”提升为 UIED导航(702) 直属菜单
-- 2) “内容管理(812)”不再作为展示菜单
-- 3) “文章管理(旧, 725)”隐藏，仅保留“文章中心(816)”入口
-- 可重复执行

SET NAMES utf8mb4;
START TRANSACTION;

-- 提升分组为 UIED导航直属
UPDATE la_system_auth_menu
SET pid = 702,
    menu_type = 'M',
    menu_name = '网址管理',
    menu_icon = 'el-icon-Connection',
    menu_sort = 35,
    paths = 'website-manage',
    component = '',
    is_show = 1,
    is_disable = 0,
    update_time = UNIX_TIMESTAMP()
WHERE id = 857;

UPDATE la_system_auth_menu
SET pid = 702,
    menu_type = 'M',
    menu_name = '文章管理',
    menu_icon = 'el-icon-Reading',
    menu_sort = 36,
    paths = 'article-manage',
    component = '',
    is_show = 1,
    is_disable = 0,
    update_time = UNIX_TIMESTAMP()
WHERE id = 858;

-- 内容管理分组隐藏（保留数据，便于回滚）
UPDATE la_system_auth_menu
SET is_show = 0,
    update_time = UNIX_TIMESTAMP()
WHERE id = 812;

-- 网址管理子菜单归位
UPDATE la_system_auth_menu SET pid = 857, menu_sort = 10, update_time = UNIX_TIMESTAMP() WHERE id = 703; -- 网站管理
UPDATE la_system_auth_menu SET pid = 857, menu_sort = 20, update_time = UNIX_TIMESTAMP() WHERE id = 704; -- 分类管理
UPDATE la_system_auth_menu SET pid = 857, menu_sort = 30, update_time = UNIX_TIMESTAMP() WHERE id = 711; -- 页面管理
UPDATE la_system_auth_menu SET pid = 857, menu_sort = 40, update_time = UNIX_TIMESTAMP() WHERE id = 720; -- 网站标签
UPDATE la_system_auth_menu SET pid = 857, menu_sort = 50, update_time = UNIX_TIMESTAMP() WHERE id = 712; -- 热门推荐

-- 文章管理子菜单归位
UPDATE la_system_auth_menu SET pid = 858, menu_sort = 10, is_show = 1, update_time = UNIX_TIMESTAMP() WHERE id = 816; -- 文章中心
UPDATE la_system_auth_menu SET pid = 858, menu_sort = 11, is_show = 0, update_time = UNIX_TIMESTAMP() WHERE id = 817; -- 文章编辑（隐藏路由）
UPDATE la_system_auth_menu SET pid = 858, menu_sort = 20, update_time = UNIX_TIMESTAMP() WHERE id = 823; -- 文章栏目
UPDATE la_system_auth_menu SET pid = 858, menu_sort = 30, update_time = UNIX_TIMESTAMP() WHERE id = 829; -- 文章标签
UPDATE la_system_auth_menu SET pid = 858, menu_sort = 40, update_time = UNIX_TIMESTAMP() WHERE id = 838; -- 文章专题
UPDATE la_system_auth_menu SET pid = 858, menu_sort = 50, update_time = UNIX_TIMESTAMP() WHERE id = 844; -- 评论管理

-- 隐藏重复旧入口“文章管理”
UPDATE la_system_auth_menu
SET pid = 858,
    menu_sort = 90,
    is_show = 0,
    update_time = UNIX_TIMESTAMP()
WHERE id = 725;

COMMIT;
